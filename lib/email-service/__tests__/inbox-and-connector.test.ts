import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import type { SessionUserLike } from "@/lib/authorization";

import {
  AGENT_SCOPES,
  EmailCore,
  EmailService,
  MemoryAuditSink,
  MemoryEmailRepository,
  NATHSON_MAIL_HOST,
  RecordingTransport,
  hashAgentToken,
  isAuthorizedSyncRequest,
  issueAgentGrant,
  partnershipsMailboxSpec,
  type IncomingMessage,
  type MailboxConnection,
} from "../index";
import { AGENT_TOOL_NAMES, handleAgentMcpRequest } from "../mcp";
import { sentFolderFor } from "../server";

const approver: SessionUserLike = { id: "u-sylvester", email: "s@bof.test", memberships: [] };
const ops: SessionUserLike = { id: "u-ops", memberships: [{ fleetId: "f", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] };

function setup() {
  const repo = new MemoryEmailRepository();
  const audit = new MemoryAuditSink();
  const mailbox: MailboxConnection = {
    id: "mb-p",
    ...partnershipsMailboxSpec({ approverUserIds: ["u-sylvester"] }),
    sendEnabled: false,
    status: "ACTIVE",
  };
  repo.mailboxes.set(mailbox.id, mailbox);
  const core = new EmailCore(repo, audit, new RecordingTransport(), () => ({ globalSendingEnabled: false, now: new Date() }));
  return { repo, audit, core, mailbox, service: new EmailService(core) };
}

function msg(o: Partial<IncomingMessage>): IncomingMessage {
  return {
    direction: "INBOUND",
    folder: "INBOX",
    imapUid: 1,
    messageIdHeader: "a@checkr.com",
    inReplyTo: null,
    references: [],
    fromAddress: "partners@checkr.com",
    fromName: "Checkr",
    toAddresses: ["partnerships@nathson.com"],
    ccAddresses: [],
    subject: "Partner application",
    textBody: "Please share expected volume.",
    receivedAt: new Date("2026-10-15T10:00:00Z"),
    ...o,
  };
}

describe("confirmed nathson.com settings", () => {
  it("defaults to nathson.com, 993/465, username = address", () => {
    const spec = partnershipsMailboxSpec({ approverUserIds: ["u1"] });
    assert.equal(NATHSON_MAIL_HOST, "nathson.com");
    assert.deepEqual([spec.imapHost, spec.imapPort, spec.smtpHost, spec.smtpPort], ["nathson.com", 993, "nathson.com", 465]);
    assert.equal(spec.address, "partnerships@nathson.com");
  });

  it("derives the Sent folder from synced folders, with an env override", () => {
    const mb = { ...setup().mailbox, syncFolders: ["INBOX", "INBOX.Sent"] };
    assert.equal(sentFolderFor(mb, {}), "INBOX.Sent");
    assert.equal(sentFolderFor({ ...mb, syncFolders: ["INBOX", "Sent Items"] }, {}), "Sent Items");
    assert.equal(sentFolderFor({ ...mb, syncFolders: ["INBOX"] }, {}), null);
    assert.equal(sentFolderFor(mb, { EMAIL_SENT_FOLDER: "Sent" }), "Sent");
  });
});

describe("inbox service", () => {
  it("lists threads newest first with partner matches, and searches", async () => {
    const { core, mailbox, service } = setup();
    await core.ingest(mailbox, msg({}));
    await core.ingest(mailbox, msg({ messageIdHeader: "b@sambasafety.com", fromAddress: "bd@sambasafety.com", subject: "Intro call", textBody: "Tuesday works", receivedAt: new Date("2026-10-15T11:00:00Z") }));
    const all = await service.listThreads(approver, "mb-p");
    assert.deepEqual(all.map((t) => [t.subject, t.partner]), [["Intro call", "sambasafety"], ["Partner application", "checkr"]]);
    assert.deepEqual((await service.listThreads(ops, "mb-p", { text: "volume" })).map((t) => t.subject), ["Partner application"]);
  });

  it("returns a thread with its drafts and suggested partner", async () => {
    const { core, mailbox, service } = setup();
    const m = await core.ingest(mailbox, msg({}));
    const d = await service.createDraft(ops, { mailboxId: "mb-p", threadId: m!.threadId, inReplyTo: m!.messageIdHeader, toAddresses: ["partners@checkr.com"], subject: "Re: Partner application", textBody: "About 300 drivers." });
    const detail = await service.getThread(approver, "mb-p", m!.threadId);
    assert.equal(detail.messages.length, 1);
    assert.deepEqual(detail.drafts.map((x) => x.id), [d.id]);
    assert.equal(detail.suggestedPartner?.partnerId, "checkr");
  });

  it("draft detail includes a dry-run of the send gates; nothing is sent", async () => {
    const { service } = setup();
    const d = await service.createDraft(ops, { mailboxId: "mb-p", toAddresses: ["partners@checkr.com"], subject: "s", textBody: "b" });
    await service.requestApproval(ops, "mb-p", d.id);
    await service.decide(approver, "mb-p", d.id, "APPROVED");
    const detail = await service.getDraft(approver, "mb-p", d.id);
    assert.equal(detail.approval?.decision, "APPROVED");
    assert.equal(detail.sendCheck.allowed, false);
    assert.ok(!detail.sendCheck.allowed && detail.sendCheck.reasons.some((r) => r.includes("EMAIL_SENDING_ENABLED")));
    assert.deepEqual((await service.listDrafts(approver, "mb-p", ["APPROVED"])).map((x) => x.id), [d.id]);
  });

  it("cancels a draft and clears its approval", async () => {
    const { service, repo } = setup();
    const d = await service.createDraft(ops, { mailboxId: "mb-p", toAddresses: ["a@checkr.com"], subject: "s", textBody: "b" });
    await service.requestApproval(ops, "mb-p", d.id);
    await service.decide(approver, "mb-p", d.id, "APPROVED");
    await service.cancelDraft(ops, "mb-p", d.id);
    assert.equal((await repo.getDraft(d.id))?.status, "CANCELLED");
    assert.equal(await repo.getApproval(d.id), null);
  });

  it("overview reports sending disabled and the user's capabilities", async () => {
    const { service } = setup();
    const ov = await service.mailboxOverview(ops, "mb-p");
    assert.equal(ov.sendingGloballyEnabled, false);
    assert.deepEqual(ov.capabilities.sort(), ["draft", "read"]);
  });
});

describe("agent grants", () => {
  it("issues a hashed, expiring token only for a listed approver", async () => {
    const { repo, mailbox } = setup();
    const now = new Date("2026-10-15T00:00:00Z");
    const { token, grant } = await issueAgentGrant(repo, { mailbox, createdById: "u-sylvester", days: 30 }, now);
    assert.ok(token.length >= 40);
    assert.ok(repo.grants.has(hashAgentToken(token)));
    assert.ok(![...repo.grants.keys()].includes(token), "plaintext token never stored");
    assert.deepEqual(grant.scopes, [...AGENT_SCOPES]);
    assert.deepEqual(grant.folderAllowlist, mailbox.syncFolders);
    assert.equal(grant.expiresAt.toISOString(), "2026-11-14T00:00:00.000Z");
    await assert.rejects(issueAgentGrant(repo, { mailbox, createdById: "u-ops" }), /approver/);
    await assert.rejects(issueAgentGrant(repo, { mailbox, createdById: "u-sylvester", days: 365 }), /days/);
    await assert.rejects(issueAgentGrant(repo, { mailbox, createdById: "u-sylvester", scopes: ["send" as never] }), /not allowed/);
    await assert.rejects(issueAgentGrant(repo, { mailbox, createdById: "u-sylvester", folders: ["INBOX.Private"] }), /not synced/);
  });

  it("revoked grants stop working immediately", async () => {
    const { repo, mailbox, core } = setup();
    const { token, grant } = await issueAgentGrant(repo, { mailbox, createdById: "u-sylvester" });
    assert.equal(await repo.revokeAgentGrant(grant.id, new Date()), true);
    const res = await handleAgentMcpRequest(new Request("http://bof.test/api/email/agent", { method: "POST", headers: { authorization: `Bearer ${token}` } }), core, { allowedOrigins: [] });
    assert.equal(res.status, 401);
  });
});

describe("scheduled sync authorization", () => {
  const req = (auth?: string) => new Request("http://bof.test/api/email/sync", { headers: auth ? { authorization: auth } : {} });
  const token = "s".repeat(32);

  it("is closed when no secret is configured, and rejects short secrets", () => {
    assert.equal(isAuthorizedSyncRequest(req(`Bearer ${token}`), {}), false);
    assert.equal(isAuthorizedSyncRequest(req("Bearer short"), { EMAIL_SYNC_TOKEN: "short" }), false);
  });

  it("accepts EMAIL_SYNC_TOKEN or Vercel's CRON_SECRET and nothing else", () => {
    assert.equal(isAuthorizedSyncRequest(req(`Bearer ${token}`), { EMAIL_SYNC_TOKEN: token }), true);
    assert.equal(isAuthorizedSyncRequest(req(`Bearer ${token}`), { CRON_SECRET: token }), true);
    assert.equal(isAuthorizedSyncRequest(req(`Bearer ${token}x`), { EMAIL_SYNC_TOKEN: token }), false);
    assert.equal(isAuthorizedSyncRequest(req(), { EMAIL_SYNC_TOKEN: token }), false);
  });
});

describe("restricted Claude connector (MCP)", () => {
  async function connect(core: EmailCore, token: string) {
    const opts = { allowedOrigins: [] as string[] };
    const transport = new StreamableHTTPClientTransport(new URL("http://bof.test/api/email/agent"), {
      requestInit: { headers: { authorization: `Bearer ${token}` } },
      fetch: (input, init) => handleAgentMcpRequest(new Request(input, init), core, opts),
    });
    const client = new Client({ name: "test-claude", version: "1.0.0" });
    await client.connect(transport);
    return client;
  }

  function text(result: unknown): string {
    return ((result as { content: Array<{ text: string }> }).content[0]?.text) ?? "";
  }

  it("rejects missing/invalid tokens and disallowed browser origins", async () => {
    const { core, repo, mailbox } = setup();
    const { token } = await issueAgentGrant(repo, { mailbox, createdById: "u-sylvester" });
    const post = (headers: Record<string, string>) =>
      handleAgentMcpRequest(new Request("http://bof.test/api/email/agent", { method: "POST", headers }), core, { allowedOrigins: ["https://claude.ai"] });
    assert.equal((await post({})).status, 401);
    assert.equal((await post({ authorization: "Bearer not-a-real-token-value-xyz" })).status, 401);
    assert.equal((await post({ authorization: `Bearer ${token}`, origin: "https://evil.example" })).status, 403);
  });

  it("exposes exactly the read/draft/approval-request tools — no send, approve or settings", async () => {
    const { core, repo, mailbox } = setup();
    const { token } = await issueAgentGrant(repo, { mailbox, createdById: "u-sylvester" });
    const client = await connect(core, token);
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    assert.deepEqual(names, [...AGENT_TOOL_NAMES].sort());
    for (const n of names) assert.doesNotMatch(n, /send|approve(?!al)|decide|credential|password|setting|enable/i);
    await client.close();
  });

  it("searches, reads, drafts and requests approval through the gateway", async () => {
    const { core, repo, mailbox, audit } = setup();
    const m = await core.ingest(mailbox, msg({}));
    await core.ingest(mailbox, msg({ messageIdHeader: "junk@x", folder: "INBOX.Junk", subject: "Junk" }));
    const { token } = await issueAgentGrant(repo, { mailbox, createdById: "u-sylvester" });
    const client = await connect(core, token);

    const found = JSON.parse(text(await client.callTool({ name: "search_messages", arguments: { query: "volume" } })));
    assert.deepEqual(found.map((x: { subject: string }) => x.subject), ["Partner application"]);

    const thread = JSON.parse(text(await client.callTool({ name: "get_thread", arguments: { threadId: m!.threadId } })));
    assert.equal(thread[0].from, "partners@checkr.com");

    const created = JSON.parse(text(await client.callTool({
      name: "create_draft",
      arguments: { to: ["partners@checkr.com"], subject: "Re: Partner application", body: "About 300 drivers.", threadId: m!.threadId, inReplyTo: m!.messageIdHeader },
    })));
    assert.equal(created.status, "DRAFT");
    assert.equal((await repo.getDraft(created.draftId))?.createdByKind, "AGENT");

    const submitted = JSON.parse(text(await client.callTool({ name: "request_approval", arguments: { draftId: created.draftId } })));
    assert.equal(submitted.status, "PENDING_APPROVAL");

    const linked = await client.callTool({ name: "link_thread_to_partner", arguments: { threadId: m!.threadId, partnerId: "checkr" } });
    assert.ok(!linked.isError);

    const bad = await client.callTool({ name: "link_thread_to_partner", arguments: { threadId: m!.threadId, partnerId: "nope" } });
    assert.equal(bad.isError, true);

    assert.ok(audit.entries.some((e) => e.actor.kind === "AGENT" && e.event === "draft.created"));
    assert.equal((await repo.getDraft(created.draftId))?.status, "PENDING_APPROVAL", "agent cannot move it further");
    await client.close();
  });
});
