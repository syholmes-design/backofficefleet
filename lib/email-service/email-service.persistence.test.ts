import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

import { envKekProvider } from "./credential-vault";
import { loadMailboxSecret, storeMailboxCredential } from "./credentials";
import { PrismaAuditSink, PrismaEmailRepository } from "./prisma-repository";
import { partnershipsMailboxSpec } from "./provisioning";
import { EmailCore, EmailService } from "./service";
import { RecordingTransport } from "./transport";
import type { IncomingMessage } from "./types";

// Refuses anything but a local bof_dev database (same guard as other BOF persistence tests).
assertTestDatabaseTarget(process.env.DATABASE_URL);

const suffix = randomBytes(4).toString("hex");

function message(overrides: Partial<IncomingMessage>): IncomingMessage {
  return {
    direction: "INBOUND",
    folder: "INBOX",
    imapUid: 1,
    messageIdHeader: `m-${suffix}@checkr.com`,
    inReplyTo: null,
    references: [],
    fromAddress: "partners@checkr.com",
    fromName: null,
    toAddresses: [`partnerships+${suffix}@nathson.com`],
    ccAddresses: [],
    subject: "Partner application",
    textBody: "Can you share Expected Volume?",
    receivedAt: new Date(),
    ...overrides,
  };
}

test("email service on BOF Prisma schema", async (t) => {
  const approver = await prisma.user.create({ data: { email: `approver-${suffix}@bof.test`, name: "Approver" } });
  const approverSession: SessionUserLike = { id: approver.id, email: approver.email, memberships: [] };
  const opsUser = await prisma.user.create({ data: { email: `ops-${suffix}@bof.test`, name: "Ops" } });
  const ops: SessionUserLike = { id: opsUser.id, email: opsUser.email, memberships: [{ fleetId: "x", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] };
  const row = await prisma.emailMailbox.create({
    data: {
      ...partnershipsMailboxSpec({ mailHost: "mail.example.test", approverUserIds: [approver.id] }),
      address: `partnerships+${suffix}@nathson.com`,
      status: "ACTIVE",
      sendEnabled: true,
    },
  });

  const repo = new PrismaEmailRepository(prisma);
  const transport = new RecordingTransport();
  const core = new EmailCore(repo, new PrismaAuditSink(prisma), transport, () => ({ globalSendingEnabled: true, now: new Date() }));
  const service = new EmailService(core);
  const mailbox = (await repo.getMailbox(row.id))!;

  try {
    await t.test("ingest threads replies, dedupes on Message-ID, and searches case-insensitively", async () => {
      const root = await core.ingest(mailbox, message({ direction: "OUTBOUND", folder: "INBOX.Sent", messageIdHeader: `root-${suffix}@nathson.com`, textBody: "Hello" }));
      const reply = await core.ingest(mailbox, message({ inReplyTo: `root-${suffix}@nathson.com`, references: [`root-${suffix}@nathson.com`] }));
      assert.equal(reply?.threadId, root?.threadId);
      assert.equal(await core.ingest(mailbox, message({})), null);
      assert.equal((await service.searchMessages(ops, row.id, { text: "expected volume" })).length, 1);
      assert.equal(typeof reply?.imapUid, "number");
    });

    await t.test("approval flow writes AuditEvent rows and a concurrent double-send sends once", async () => {
      const draft = await service.createDraft(ops, { mailboxId: row.id, toAddresses: ["partners@checkr.com"], subject: "Re: Partner application", textBody: "Volume details" });
      await service.requestApproval(ops, row.id, draft.id);
      await service.decide(approverSession, row.id, draft.id, "APPROVED");
      const results = await Promise.allSettled([
        service.sendApproved(approverSession, row.id, draft.id),
        service.sendApproved(approverSession, row.id, draft.id),
      ]);
      const sentOk = results.filter((r) => r.status === "fulfilled" && r.value.allowed).length;
      assert.equal(sentOk, 1);
      assert.equal(transport.sent.length, 1);
      assert.equal((await repo.getDraft(draft.id))?.status, "SENT");
      const audits = await prisma.auditEvent.findMany({ where: { entityType: "EmailDraft", entityId: draft.id } });
      const events = audits.map((a) => (a.details as { event: string }).event);
      for (const e of ["draft.created", "draft.approval_requested", "draft.approved", "send.succeeded"]) assert.ok(events.includes(e), e);
      assert.ok(audits.every((a) => a.tenantId === null), "PLATFORM mailbox events carry no fleet tenant");
      assert.ok(!JSON.stringify(audits).includes("Volume details"), "no bodies in audit");
    });

    await t.test("credential is stored sealed and decrypts only with the KEK", async () => {
      const kek = envKekProvider({ EMAIL_KEK_V1: randomBytes(32).toString("base64") });
      await storeMailboxCredential(core, { kind: "SYSTEM", id: "test" }, mailbox, { username: mailbox.address, password: "pw-secret-123" }, kek, "v1");
      const stored = await prisma.emailMailboxCredential.findUnique({ where: { mailboxId: row.id } });
      assert.ok(stored && !JSON.stringify(stored).includes("pw-secret-123"));
      assert.equal((await loadMailboxSecret(core, mailbox, kek)).password, "pw-secret-123");
    });

    await t.test("database CHECK constraints reject unsafe rows", async () => {
      await assert.rejects(
        prisma.emailAgentGrant.create({
          data: { agentId: "claude", mailboxId: row.id, scopes: ["threads:read", "send"], folderAllowlist: ["INBOX"], tokenSha256: `t-${suffix}`, expiresAt: new Date(Date.now() + 1e6), createdById: approver.id },
        }),
        (e: unknown) => e instanceof Error && /EmailAgentGrant_scopes_check|check constraint/i.test(e.message),
      );
      await assert.rejects(
        prisma.emailMailbox.create({ data: { scope: "FLEET", lane: "CORRESPONDENCE", address: `bad-${suffix}@x.test`, displayName: "bad" } }),
        (e: unknown) => e instanceof Error && /EmailMailbox_scope_fleet_check|check constraint/i.test(e.message),
      );
      const ok = await prisma.emailAgentGrant.create({
        data: { agentId: "claude", mailboxId: row.id, scopes: ["threads:read", "drafts:write"], folderAllowlist: ["INBOX"], tokenSha256: `ok-${suffix}`, expiresAt: new Date(Date.now() + 1e6), createdById: approver.id },
      });
      assert.ok(ok.id);
    });
  } finally {
    await prisma.auditEvent.deleteMany({ where: { metadata: { path: ["mailboxId"], equals: row.id } } });
    await prisma.emailMailbox.delete({ where: { id: row.id } });
    await prisma.user.deleteMany({ where: { id: { in: [approver.id, opsUser.id] } } });
    await prisma.$disconnect();
  }
});
