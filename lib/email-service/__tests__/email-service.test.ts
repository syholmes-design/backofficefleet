import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import type { SessionUserLike } from "@/lib/authorization";

import {
  AgentGateway,
  DisabledTransport,
  EmailCore,
  EmailService,
  EmailServiceError,
  MemoryAuditSink,
  MemoryEmailRepository,
  RecordingTransport,
  VERIFICATION_PARTNER_DOMAINS,
  contentHash,
  credentialAad,
  envKekProvider,
  hashAgentToken,
  loadMailboxSecret,
  matchPartner,
  normalizeSubject,
  openSecret,
  parseProvisionMode,
  partnershipsMailboxSpec,
  resolveMailboxCapabilities,
  resolveThreadKey,
  rewrap,
  sealSecret,
  storeMailboxCredential,
  syncMailbox,
  type AgentAccessGrant,
  type FetchBatch,
  type InboundSource,
  type IncomingMessage,
  type MailboxConnection,
  type OutboundTransport,
} from "../index";

// ── Fixtures ────────────────────────────────────────────────────────────────

const sylvester: SessionUserLike = {
  id: "u-sylvester",
  email: "sylvester@example.test",
  memberships: [{ fleetId: "fleet-a", roleCode: "FLEET_ADMIN", status: "ACTIVE" }],
};
const bofOps: SessionUserLike = { id: "u-ops", memberships: [{ fleetId: "fleet-a", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] };
const fleetAdmin: SessionUserLike = { id: "u-fa", memberships: [{ fleetId: "fleet-a", roleCode: "FLEET_ADMIN", status: "ACTIVE" }] };
const dispatcherA: SessionUserLike = { id: "u-disp", memberships: [{ fleetId: "fleet-a", roleCode: "DISPATCH", status: "ACTIVE" }] };
const driverA: SessionUserLike = { id: "u-drv", memberships: [{ fleetId: "fleet-a", roleCode: "DRIVER", status: "ACTIVE" }] };
const fleetBAdmin: SessionUserLike = { id: "u-fb", memberships: [{ fleetId: "fleet-b", roleCode: "FLEET_ADMIN", status: "ACTIVE" }] };

function partnershipsMailbox(overrides: Partial<MailboxConnection> = {}): MailboxConnection {
  return {
    id: "mb-partnerships",
    ...partnershipsMailboxSpec({ mailHost: "mail.example.test", approverUserIds: ["u-sylvester"] }),
    sendEnabled: false,
    status: "ACTIVE",
    ...overrides,
  };
}

function fleetMailbox(overrides: Partial<MailboxConnection> = {}): MailboxConnection {
  return {
    ...partnershipsMailbox(),
    id: "mb-fleet-a",
    scope: "FLEET",
    fleetId: "fleet-a",
    address: "ops@fleet-a.test",
    approverUserIds: ["u-fa"],
    recipientDomainAllowlist: [],
    ...overrides,
  };
}

function setup(opts: { sendingEnabled?: boolean; transport?: OutboundTransport; mailbox?: Partial<MailboxConnection> } = {}) {
  const repo = new MemoryEmailRepository();
  const audit = new MemoryAuditSink();
  const transport = opts.transport ?? new RecordingTransport();
  const mb = partnershipsMailbox(opts.mailbox);
  repo.mailboxes.set(mb.id, mb);
  repo.mailboxes.set("mb-fleet-a", fleetMailbox());
  const core = new EmailCore(repo, audit, transport, () => ({ globalSendingEnabled: opts.sendingEnabled ?? false, now: new Date() }));
  return { repo, audit, core, transport, service: new EmailService(core), mailbox: mb };
}

function checkrReply(overrides: Partial<IncomingMessage> = {}): IncomingMessage {
  return {
    direction: "INBOUND",
    folder: "INBOX",
    imapUid: 10,
    messageIdHeader: "<reply-1@checkr.com>",
    inReplyTo: "<outreach-1@nathson.com>",
    references: ["<outreach-1@nathson.com>"],
    fromAddress: "Partners@Checkr.com",
    fromName: "Checkr Partnerships",
    toAddresses: ["partnerships@nathson.com"],
    ccAddresses: [],
    subject: "Re: Partner application",
    textBody: "Thanks — can you share expected volume?",
    receivedAt: new Date("2026-10-15T12:00:00Z"),
    ...overrides,
  };
}

async function approvedDraft(service: EmailService, to = "partners@checkr.com") {
  const draft = await service.createDraft(bofOps, {
    mailboxId: "mb-partnerships",
    toAddresses: [to],
    subject: "Re: Partner application",
    textBody: "Initial volume is our founding fleet cohort.",
  });
  await service.requestApproval(bofOps, "mb-partnerships", draft.id);
  await service.decide(sylvester, "mb-partnerships", draft.id, "APPROVED");
  return draft;
}

async function assertStatus(promise: Promise<unknown>, status: number) {
  await assert.rejects(promise, (err: unknown) => err instanceof EmailServiceError && err.statusCode === status);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("credential vault", () => {
  const keys = { EMAIL_KEK_V1: randomBytes(32).toString("base64"), EMAIL_KEK_V2: randomBytes(32).toString("base64") };
  const kek = envKekProvider(keys);
  const aad = credentialAad("mb-partnerships", "partnerships@nathson.com");

  it("round-trips and never stores plaintext", () => {
    const sealed = sealSecret("example-secret-value", aad, kek, "v1");
    assert.ok(!JSON.stringify(sealed).includes("example-secret-value"));
    assert.equal(openSecret(sealed, kek), "example-secret-value");
  });

  it("refuses a secret copied onto another mailbox (AAD binding)", () => {
    const sealed = sealSecret("s", aad, kek, "v1");
    assert.throws(() => openSecret({ ...sealed, aad: credentialAad("mb-other", "x@y.test") }, kek));
  });

  it("rotates the KEK without changing the secret", () => {
    const rotated = rewrap(sealSecret("s", aad, kek, "v1"), kek, "v2");
    assert.equal(openSecret(rotated, envKekProvider({ EMAIL_KEK_V2: keys.EMAIL_KEK_V2 })), "s");
  });

  it("fails closed without a KEK", () => {
    assert.throws(() => sealSecret("s", aad, envKekProvider({}), "v1"), /unavailable/);
  });

  it("stores through the service and loads only for the bound mailbox", async () => {
    const { core, repo, mailbox } = setup();
    await storeMailboxCredential(core, { kind: "SYSTEM", id: "cli" }, mailbox, { username: mailbox.address, password: "pw" }, kek, "v1");
    assert.ok(!JSON.stringify(repo.credentials.get(mailbox.id)).includes('"pw"'));
    assert.equal((await loadMailboxSecret(core, mailbox, kek)).password, "pw");
    await assert.rejects(loadMailboxSecret(core, { ...mailbox, address: "other@nathson.com" }, kek), /different mailbox/);
  });
});

describe("threading", () => {
  it("strips reply prefixes", () => {
    assert.equal(normalizeSubject("RE: Fwd: re[2]:  Partner  Application"), "partner application");
  });

  it("keeps unrelated vendors with the same subject apart", () => {
    const a = resolveThreadKey({ messageIdHeader: "<a@x>", inReplyTo: null, references: [] }, new Map());
    const b = resolveThreadKey({ messageIdHeader: "<c@z>", inReplyTo: null, references: [] }, new Map());
    assert.notEqual(a, b);
  });
});

describe("access (BOF FleetMembership roles)", () => {
  const platform = partnershipsMailbox();
  const fleet = fleetMailbox();
  const caps = (u: SessionUserLike | null, mb: MailboxConnection) => [...resolveMailboxCapabilities(u, mb)].sort();

  it("PLATFORM: listed approver gets full control; BOF_OPERATIONS can draft; fleet roles get nothing", () => {
    assert.deepEqual(caps(sylvester, platform), ["admin", "approve", "draft", "read"]);
    assert.deepEqual(caps(bofOps, platform), ["draft", "read"]);
    assert.deepEqual(caps(fleetAdmin, platform), []);
    assert.deepEqual(caps(null, platform), []);
  });

  it("PLATFORM with a fleetId is malformed and fails closed", () => {
    assert.deepEqual(caps(sylvester, { ...platform, fleetId: "fleet-a" }), []);
  });

  it("FLEET: isolated to members of that fleet; BOF roles get no implicit access", () => {
    assert.deepEqual(caps(fleetAdmin, fleet), ["admin", "approve", "draft", "read"]);
    assert.deepEqual(caps(dispatcherA, fleet), ["draft", "read"]);
    assert.deepEqual(caps(driverA, fleet), []);
    assert.deepEqual(caps(fleetBAdmin, fleet), []);
    assert.deepEqual(caps(bofOps, fleet), []);
  });

  it("lists only mailboxes the user can access", async () => {
    const { service } = setup();
    assert.deepEqual((await service.listMailboxes(fleetBAdmin)).map((m) => m.mailbox.id), []);
    assert.deepEqual((await service.listMailboxes(sylvester)).map((m) => m.mailbox.id).sort(), ["mb-fleet-a", "mb-partnerships"]);
  });
});

describe("drafts, approval and send gates", () => {
  it("blocks sending by default even with a valid approval", async () => {
    const { service, transport, audit } = setup({ mailbox: { sendEnabled: true } });
    const draft = await approvedDraft(service);
    const result = await service.sendApproved(sylvester, "mb-partnerships", draft.id);
    assert.equal(result.allowed, false);
    assert.match(JSON.stringify(result), /EMAIL_SENDING_ENABLED/);
    assert.equal((transport as RecordingTransport).sent.length, 0);
    assert.ok(audit.entries.some((e) => e.event === "send.blocked"));
  });

  it("needs the per-mailbox switch as well as the global switch", async () => {
    const { service, transport } = setup({ sendingEnabled: true });
    const result = await service.sendApproved(sylvester, "mb-partnerships", (await approvedDraft(service)).id);
    assert.equal(result.allowed, false);
    assert.equal((transport as RecordingTransport).sent.length, 0);
  });

  it("sends exactly the approved content once when every gate passes", async () => {
    const { service, transport, repo } = setup({ sendingEnabled: true, mailbox: { sendEnabled: true } });
    const draft = await approvedDraft(service);
    const result = await service.sendApproved(sylvester, "mb-partnerships", draft.id);
    assert.equal(result.allowed, true);
    const sent = (transport as RecordingTransport).sent;
    assert.equal(sent.length, 1);
    assert.equal(sent[0].textBody, "Initial volume is our founding fleet cohort.");
    assert.equal(sent[0].fromAddress, "partnerships@nathson.com");
    assert.equal((await repo.getDraft(draft.id))?.status, "SENT");
    assert.equal((await service.sendApproved(sylvester, "mb-partnerships", draft.id)).allowed, false);
  });

  it("voids the approval when content changes after approval", async () => {
    const { service } = setup({ sendingEnabled: true, mailbox: { sendEnabled: true } });
    const draft = await approvedDraft(service);
    await service.updateDraft(bofOps, "mb-partnerships", draft.id, { textBody: "edited after approval" });
    assert.equal((await service.sendApproved(sylvester, "mb-partnerships", draft.id)).allowed, false);
  });

  it("blocks recipients outside the partner-domain allowlist", async () => {
    const { service } = setup({ sendingEnabled: true, mailbox: { sendEnabled: true } });
    const draft = await approvedDraft(service, "someone@gmail.com");
    const result = await service.sendApproved(sylvester, "mb-partnerships", draft.id);
    assert.equal(result.allowed, false);
    assert.match(JSON.stringify(result), /gmail\.com/);
  });

  it("only listed approvers may approve or send; others get 403, outsiders 404", async () => {
    const { service } = setup();
    const draft = await service.createDraft(bofOps, {
      mailboxId: "mb-partnerships",
      toAddresses: ["partners@checkr.com"],
      subject: "x",
      textBody: "y",
    });
    await service.requestApproval(bofOps, "mb-partnerships", draft.id);
    await assertStatus(service.decide(bofOps, "mb-partnerships", draft.id, "APPROVED"), 403);
    await assertStatus(service.sendApproved(bofOps, "mb-partnerships", draft.id), 403);
    await assertStatus(service.decide(fleetBAdmin, "mb-partnerships", draft.id, "APPROVED"), 404);
    await assertStatus(service.searchMessages(fleetBAdmin, "mb-partnerships", {}), 404);
  });

  it("marks the draft FAILED and audits when the transport errors", async () => {
    const { service, repo, audit } = setup({ sendingEnabled: true, transport: new DisabledTransport(), mailbox: { sendEnabled: true } });
    const draft = await approvedDraft(service);
    await assert.rejects(service.sendApproved(sylvester, "mb-partnerships", draft.id), /disabled/);
    assert.equal((await repo.getDraft(draft.id))?.status, "FAILED");
    assert.ok(audit.entries.some((e) => e.event === "send.failed"));
  });

  it("audit entries never contain message bodies", async () => {
    const { service, audit } = setup();
    await approvedDraft(service);
    assert.ok(!JSON.stringify(audit.entries).includes("founding fleet cohort"));
  });

  it("content hash ignores recipient order and case", () => {
    const base = { mailboxId: "m", ccAddresses: [], subject: "s", textBody: "b", inReplyTo: null };
    assert.equal(
      contentHash({ ...base, toAddresses: ["A@x.com", "b@y.com"] }),
      contentHash({ ...base, toAddresses: ["b@y.com", "a@x.com"] }),
    );
  });
});

describe("search and correspondence history", () => {
  it("threads replies, dedupes, and searches subject/body/sender", async () => {
    const { core, service, mailbox } = setup();
    await core.ingest(mailbox, checkrReply({ messageIdHeader: "<outreach-1@nathson.com>", inReplyTo: null, references: [], direction: "OUTBOUND", folder: "INBOX.Sent", fromAddress: "partnerships@nathson.com", toAddresses: ["partners@checkr.com"], subject: "Partner application", textBody: "BackOfficeFleet would like to apply." }));
    const reply = await core.ingest(mailbox, checkrReply());
    assert.equal(await core.ingest(mailbox, checkrReply()), null, "duplicate Message-ID is ignored");
    const threadsBefore = (await service.listThreads(sylvester, "mb-partnerships")).length;
    assert.equal(await core.ingest(mailbox, checkrReply({ inReplyTo: null, references: [] })), null);
    assert.equal((await service.listThreads(sylvester, "mb-partnerships")).length, threadsBefore, "duplicate creates no orphan thread");
    const thread = await service.searchMessages(sylvester, "mb-partnerships", { threadId: reply!.threadId });
    assert.equal(thread.length, 2);
    assert.equal((await service.searchMessages(bofOps, "mb-partnerships", { text: "expected volume" })).length, 1);
    assert.equal((await service.searchMessages(bofOps, "mb-partnerships", { text: "checkr.com" })).length, 2);
  });
});

describe("agent gateway (Claude)", () => {
  function grant(overrides: Partial<AgentAccessGrant> = {}): AgentAccessGrant {
    return {
      id: "g1",
      agentId: "claude",
      mailboxId: "mb-partnerships",
      scopes: ["threads:read", "drafts:write", "approvals:request", "links:write"],
      folderAllowlist: ["INBOX", "INBOX.Sent"],
      domainAllowlist: [],
      expiresAt: new Date("2999-01-01T00:00:00Z"),
      revokedAt: null,
      ...overrides,
    };
  }

  it("is limited to its mailbox and allowed folders", async () => {
    const { core, mailbox, repo } = setup();
    await core.ingest(mailbox, checkrReply());
    await core.ingest(mailbox, checkrReply({ messageIdHeader: "<j@x>", folder: "INBOX.Junk", subject: "junk" }));
    await core.ingest((await repo.getMailbox("mb-fleet-a"))!, checkrReply({ messageIdHeader: "<f@x>", subject: "fleet mail" }));
    const agent = (await AgentGateway.fromGrant(core, grant()))!;
    const visible = await agent.searchMessages();
    assert.deepEqual(visible.map((m) => m.subject), ["Re: Partner application"]);
  });

  it("drafts and requests approval but has no send/approve/admin operations", async () => {
    const { core, mailbox, repo } = setup();
    const msg = await core.ingest(mailbox, checkrReply());
    const agent = (await AgentGateway.fromGrant(core, grant()))!;
    const draft = await agent.createDraft({ threadId: msg!.threadId, toAddresses: ["partners@checkr.com"], subject: "Re: Partner application", textBody: "Draft" });
    assert.equal((await agent.requestApproval(draft.id)).status, "PENDING_APPROVAL");
    assert.equal((await repo.getDraft(draft.id))?.createdByKind, "AGENT");
    const surface = Object.getOwnPropertyNames(AgentGateway.prototype);
    for (const forbidden of ["send", "sendApproved", "decide", "approve", "setSendEnabled", "storeCredential"]) {
      assert.ok(!surface.includes(forbidden), `agent surface must not include ${forbidden}`);
    }
  });

  it("respects a domain allowlist and audits denials", async () => {
    const { core, audit } = setup();
    const agent = (await AgentGateway.fromGrant(core, grant({ domainAllowlist: [...VERIFICATION_PARTNER_DOMAINS] })))!;
    await assertStatus(agent.createDraft({ toAddresses: ["x@gmail.com"], subject: "s", textBody: "b" }), 403);
    assert.ok(audit.entries.some((e) => e.event === "access.denied"));
  });

  it("rejects expired, revoked or unknown grants and missing scopes", async () => {
    const { core, repo } = setup();
    assert.equal(await AgentGateway.fromGrant(core, grant({ expiresAt: new Date("2000-01-01") })), null);
    assert.equal(await AgentGateway.fromGrant(core, grant({ revokedAt: new Date() })), null);
    assert.equal(await AgentGateway.fromToken(core, "unknown-token"), null);
    repo.grants.set(hashAgentToken("good-token"), grant({ scopes: ["threads:read"] }));
    const agent = (await AgentGateway.fromToken(core, "good-token"))!;
    await assertStatus(agent.createDraft({ toAddresses: ["a@checkr.com"], subject: "s", textBody: "b" }), 403);
  });

  it("links a partner thread for the partnership tracker", async () => {
    const { core, mailbox, repo } = setup();
    const msg = await core.ingest(mailbox, checkrReply());
    const partner = matchPartner(msg!.fromAddress);
    assert.equal(partner?.partnerId, "checkr");
    await (await AgentGateway.fromGrant(core, grant()))!.linkThread(msg!.threadId, "partner", partner!.partnerId);
    assert.equal((await repo.listLinks(msg!.threadId))[0].entityId, "checkr");
  });
});

describe("IMAP sync runner", () => {
  class FakeSource implements InboundSource {
    readonly kind = "fake";
    uidValidity = 7;
    failWith: Error | null = null;
    constructor(public messages: Array<IncomingMessage & { imapUid: number }>) {}
    async fetchSince(_mb: MailboxConnection, folder: string, sinceUid: number, limit: number): Promise<FetchBatch> {
      if (this.failWith) throw this.failWith;
      const pending = this.messages.filter((m) => m.folder === folder && m.imapUid > sinceUid).sort((a, b) => a.imapUid - b.imapUid);
      const take = pending.slice(0, limit);
      return { messages: take, uidValidity: this.uidValidity, lastUid: take.at(-1)?.imapUid ?? sinceUid, hasMore: pending.length > take.length };
    }
  }

  it("fetches incrementally in bounded batches and resumes from the cursor", async () => {
    const { core, repo } = setup();
    const msgs = [1, 2, 3].map((uid) => ({ ...checkrReply({ messageIdHeader: `<m${uid}@checkr.com>` }), imapUid: uid }));
    const source = new FakeSource(msgs);
    const first = await syncMailbox(core, source, "mb-partnerships", { batchSize: 2 });
    assert.deepEqual(first.find((r) => r.folder === "INBOX"), { folder: "INBOX", fetched: 2, inserted: 2, lastUid: 2, hasMore: true });
    const second = await syncMailbox(core, source, "mb-partnerships", { batchSize: 2 });
    assert.equal(second.find((r) => r.folder === "INBOX")?.inserted, 1);
    assert.equal(repo.messages.size, 3);
  });

  it("restarts safely after a UIDVALIDITY change without duplicating mail", async () => {
    const { core, repo } = setup();
    const source = new FakeSource([{ ...checkrReply(), imapUid: 5 }]);
    await syncMailbox(core, source, "mb-partnerships");
    source.uidValidity = 8;
    source.messages = [{ ...checkrReply(), imapUid: 1 }];
    await syncMailbox(core, source, "mb-partnerships");
    assert.equal(repo.messages.size, 1);
    assert.equal((await repo.getSyncCursor("mb-partnerships", "INBOX"))?.uidValidity, 8);
  });

  it("stops after repeated auth failures to avoid a cPanel lockout", async () => {
    const { core, repo } = setup();
    const source = new FakeSource([]);
    source.failWith = Object.assign(new Error("Authentication failed"), { authenticationFailed: true });
    for (let i = 0; i < 3; i += 1) await syncMailbox(core, source, "mb-partnerships");
    assert.equal((await repo.getMailbox("mb-partnerships"))?.status, "AUTH_FAILED");
    assert.deepEqual(await syncMailbox(core, source, "mb-partnerships"), [], "inactive mailbox is not synced");
  });

  it("does not sync a mailbox that is still awaiting credentials", async () => {
    const { core } = setup({ mailbox: { status: "PENDING_CREDENTIALS" } });
    assert.deepEqual(await syncMailbox(core, new FakeSource([]), "mb-partnerships"), []);
  });
});

describe("partnerships@nathson.com provisioning", () => {
  it("defines a PLATFORM correspondence mailbox with sending off and partner-only recipients", () => {
    const spec = partnershipsMailboxSpec({ mailHost: "Server1.Web-Hosting.com", approverUserIds: ["u1", "u1"] });
    assert.equal(spec.address, "partnerships@nathson.com");
    assert.equal(spec.scope, "PLATFORM");
    assert.equal(spec.fleetId, null);
    assert.equal(spec.imapHost, "server1.web-hosting.com");
    assert.deepEqual([spec.imapPort, spec.smtpPort], [993, 465]);
    assert.deepEqual(spec.approverUserIds, ["u1"]);
    assert.ok(spec.recipientDomainAllowlist.includes("checkr.com"));
    assert.ok(!("sendEnabled" in spec));
  });

  it("rejects bad hosts, missing approvers and unknown CLI flags", () => {
    assert.throws(() => partnershipsMailboxSpec({ mailHost: "not a host", approverUserIds: ["u1"] }), /Invalid mail host/);
    assert.throws(() => partnershipsMailboxSpec({ mailHost: "mail.nathson.com", approverUserIds: [] }), /approver/);
    assert.equal(parseProvisionMode([]), "dry-run");
    assert.equal(parseProvisionMode(["--verify"]), "verify");
    assert.throws(() => parseProvisionMode(["--send"]), /Unknown option/);
  });

  it("matches partner domains most-specific first", () => {
    assert.equal(matchPartner("help@psp.fmcsa.dot.gov")?.partnerId, "psp-nicf");
    assert.equal(matchPartner("someone@dot.gov")?.partnerId, "fmcsa");
    assert.equal(matchPartner("x@unknown.com"), undefined);
  });
});
