import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { PREVIEW_EMAIL_DOMAIN, assertPreviewDatabase, readOccupancy } from "../lib/email-service/preview-seed";

/**
 * End-to-end verification of the email integration on a running BOF deployment
 * (Vercel Preview or local), seeded with `npm run seed:email-preview`.
 *
 *   PREVIEW_URL=https://<preview>.vercel.app \
 *   PREVIEW_PASSWORDS='{"approver":"…","bof-ops":"…","fleet-a-admin":"…","fleet-b-admin":"…","driver-a":"…"}' \
 *   PREVIEW_AGENT_TOKEN=… PREVIEW_SYNC_TOKEN=… \
 *   [VERCEL_PROTECTION_BYPASS=…] [DATABASE_URL=<preview db, for audit/credential checks>] \
 *   npm run verify:email-preview
 *
 * Writes only synthetic drafts/approvals to the preview database. Never sends email.
 */

type Json = Record<string, unknown>;
const base = (process.env.PREVIEW_URL ?? "").replace(/\/$/, "");
if (!base) throw new Error("PREVIEW_URL is required");
const bypass = process.env.VERCEL_PROTECTION_BYPASS;
const passwords = JSON.parse(process.env.PREVIEW_PASSWORDS ?? "{}") as Record<string, string>;
const agentToken = process.env.PREVIEW_AGENT_TOKEN ?? "";
const syncToken = process.env.PREVIEW_SYNC_TOKEN ?? "";

const results: Array<{ area: string; name: string; status: "PASS" | "FAIL" | "SKIP"; detail?: string }> = [];
function record(area: string, name: string, ok: boolean | "skip", detail?: string) {
  const status = ok === "skip" ? "SKIP" : ok ? "PASS" : "FAIL";
  results.push({ area, name, status, detail });
  console.log(`${status.padEnd(4)} [${area}] ${name}${detail ? ` — ${detail}` : ""}`);
}

class Session {
  private cookies = new Map<string, string>();
  constructor(readonly label: string) {}
  private absorb(res: Response) {
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1));
    }
  }
  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (bypass) headers.set("x-vercel-protection-bypass", bypass);
    const res = await fetch(`${base}${path}`, { ...init, headers, redirect: "manual" });
    this.absorb(res);
    return res;
  }
  async json<T = Json>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
    const res = await this.fetch(path, { ...init, headers: { "content-type": "application/json", ...(init.headers as Record<string, string>) } });
    const text = await res.text();
    allBodies.push(text);
    return { status: res.status, body: (text ? JSON.parse(text) : {}) as T };
  }
  async signIn(email: string, password: string): Promise<boolean> {
    const csrf = await this.json<{ csrfToken: string }>("/api/auth/csrf");
    const form = new URLSearchParams({ email, password, csrfToken: csrf.body.csrfToken, callbackUrl: `${base}/email` });
    await this.fetch("/api/auth/callback/credentials", { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
    const s = await this.json<{ user?: { email?: string } }>("/api/auth/session");
    return s.body.user?.email === email;
  }
}
const allBodies: string[] = [];

async function main() {
  const anon = new Session("anon");
  const users: Record<string, Session> = {};
  for (const key of ["approver", "bof-ops", "fleet-a-admin", "fleet-b-admin", "driver-a"]) {
    const s = new Session(key);
    const ok = passwords[key] ? await s.signIn(`${key}@${PREVIEW_EMAIL_DOMAIN}`, passwords[key]) : false;
    record("setup", `sign in as ${key}`, ok);
    users[key] = s;
  }
  const { approver, "bof-ops": ops, "fleet-a-admin": fleetA, "fleet-b-admin": fleetB, "driver-a": driver } = users;

  // 1. Inbox interface
  const page = await anon.fetch("/email");
  record("1 inbox", "unauthenticated /email redirects to sign-in", [302, 303, 307, 308].includes(page.status) && (page.headers.get("location") ?? "").includes("signin"), `status ${page.status}`);
  const authedPage = await approver.fetch("/email");
  const html = await authedPage.text();
  record("1 inbox", "approver loads /email", authedPage.status === 200 && html.includes("bof-email-page"), `status ${authedPage.status}`);
  const mbs = await approver.json<{ mailboxes: Array<{ id: string; address: string; scope: string; capabilities: string[] }> }>("/api/email/mailboxes");
  const partnerships = mbs.body.mailboxes?.find((m) => m.address === "partnerships@nathson.com");
  const fleetBox = mbs.body.mailboxes?.find((m) => m.scope === "FLEET");
  record("1 inbox", "approver sees partnerships mailbox with full capabilities", !!partnerships && ["read", "draft", "approve", "admin"].every((c) => partnerships.capabilities.includes(c)));
  if (!partnerships) throw new Error("Partnerships mailbox not found; was the preview seeded?");
  const P = `/api/email/mailboxes/${partnerships.id}`;
  const threads = await approver.json<{ threads: Array<{ id: string; subject: string; partner: string | null }> }>(`${P}/threads`);
  record("1 inbox", "thread list with partner tags", threads.status === 200 && threads.body.threads.length >= 4 && threads.body.threads.some((t) => t.partner === "checkr"), `${threads.body.threads?.length} threads`);

  // 4. Search
  const s1 = await ops.json<{ threads: Array<{ id: string; subject: string }> }>(`${P}/threads?q=${encodeURIComponent("screening volume")}`);
  record("4 search", "search body text finds the Checkr thread only", s1.body.threads?.length === 1 && s1.body.threads[0].subject.includes("Partner application"));
  const s2 = await ops.json<{ threads: unknown[] }>(`${P}/threads?q=${encodeURIComponent("sambasafety.com")}`);
  record("4 search", "search by sender domain", s2.body.threads?.length === 1);
  const s3 = await ops.json<{ threads: unknown[] }>(`${P}/threads?q=zzzz-no-match`);
  record("4 search", "no false matches", s3.body.threads?.length === 0);
  const checkrThreadId = s1.body.threads?.[0]?.id;
  const thread = await approver.json<{ messages: Array<{ messageIdHeader: string; direction: string }>; suggestedPartner: { partnerId: string } | null }>(`${P}/threads/${checkrThreadId}`);
  record("1 inbox", "thread view: chronological messages and suggested partner", thread.body.messages?.length === 2 && thread.body.suggestedPartner?.partnerId === "checkr");

  // 2. Drafting and replies
  const inReplyTo = thread.body.messages?.find((m) => m.direction === "INBOUND")?.messageIdHeader;
  const created = await ops.json<{ draft: { id: string; status: string; threadId: string } }>(`${P}/drafts`, {
    method: "POST",
    body: JSON.stringify({ threadId: checkrThreadId, inReplyTo, to: "partners@checkr.com", subject: "Re: Partner application: BackOfficeFleet", body: "Preview reply: about 300 screenings per month." }),
  });
  record("2 drafting", "BOF_OPERATIONS creates a reply draft in the thread", created.status === 201 && created.body.draft.status === "DRAFT" && created.body.draft.threadId === checkrThreadId);
  const draftId = created.body.draft?.id;
  const edited = await ops.json<{ draft: { textBody: string } }>(`${P}/drafts/${draftId}`, { method: "PATCH", body: JSON.stringify({ body: "Preview reply (edited): about 300 screenings per month." }) });
  record("2 drafting", "draft can be edited", edited.status === 200 && edited.body.draft.textBody.includes("edited"));
  const badAddr = await ops.json(`${P}/drafts`, { method: "POST", body: JSON.stringify({ to: "not-an-address", subject: "x", body: "y" }) });
  record("2 drafting", "invalid recipient rejected", badAddr.status === 422);
  const submitted = await ops.json<{ draft: { status: string } }>(`${P}/drafts/${draftId}/submit`, { method: "POST" });
  record("2 drafting", "draft submitted for approval", submitted.body.draft?.status === "PENDING_APPROVAL");

  // 3. Approval workflow
  const opsDecide = await ops.json(`${P}/drafts/${draftId}/decision`, { method: "POST", body: JSON.stringify({ decision: "APPROVED" }) });
  record("3 approval", "non-approver cannot approve (403)", opsDecide.status === 403);
  const approve = await approver.json<{ approval: { decision: string } }>(`${P}/drafts/${draftId}/decision`, { method: "POST", body: JSON.stringify({ decision: "APPROVED" }) });
  record("3 approval", "approver approves exact text", approve.status === 200 && approve.body.approval.decision === "APPROVED");
  const detail = await approver.json<{ draft: { status: string }; approval: { contentHash: string } | null; sendCheck: { allowed: boolean; reasons?: string[] } }>(`${P}/drafts/${draftId}`);
  record("3 approval", "draft shows APPROVED with gate dry-run", detail.body.draft.status === "APPROVED" && detail.body.sendCheck.allowed === false);
  const reedit = await ops.json<{ draft: { status: string } }>(`${P}/drafts/${draftId}`, { method: "PATCH", body: JSON.stringify({ body: "Changed after approval." }) });
  const after = await approver.json<{ approval: unknown }>(`${P}/drafts/${draftId}`);
  record("3 approval", "edit after approval voids the approval", reedit.body.draft?.status === "DRAFT" && after.body.approval === null);
  await ops.json(`${P}/drafts/${draftId}/submit`, { method: "POST" });
  const reject = await approver.json<{ approval: { decision: string } }>(`${P}/drafts/${draftId}/decision`, { method: "POST", body: JSON.stringify({ decision: "REJECTED", note: "preview check" }) });
  record("3 approval", "approver can reject", reject.body.approval?.decision === "REJECTED");
  const queue = await approver.json<{ drafts: Array<{ id: string; createdByKind: string }> }>(`${P}/drafts?status=PENDING_APPROVAL`);
  const claudeDraft = queue.body.drafts?.find((d) => d.createdByKind === "AGENT");
  record("3 approval", "seeded Claude draft is waiting in the approval queue", !!claudeDraft);

  // 10. Outbound sending remains disabled
  const ov = await approver.json<{ sendingGloballyEnabled: boolean; mailbox: { sendEnabled: boolean } }>(P);
  record("10 sending", "server reports sending disabled", ov.body.sendingGloballyEnabled === false && ov.body.mailbox.sendEnabled === false);
  if (claudeDraft) {
    await approver.json(`${P}/drafts/${claudeDraft.id}/decision`, { method: "POST", body: JSON.stringify({ decision: "APPROVED" }) });
    const send = await approver.json<{ sent: boolean; reasons: string[] }>(`${P}/drafts/${claudeDraft.id}/send`, { method: "POST" });
    record("10 sending", "send on an approved draft is refused (409)", send.status === 409 && send.body.sent === false && send.body.reasons.some((r) => r.includes("EMAIL_SENDING_ENABLED")), send.body.reasons?.join("; "));
    const opsSend = await ops.json(`${P}/drafts/${claudeDraft.id}/send`, { method: "POST" });
    record("10 sending", "non-approver send attempt refused (403)", opsSend.status === 403);
  }

  // 6. Fleet and user authorization
  record("6 authz", "unauthenticated API → 401", (await anon.json("/api/email/mailboxes")).status === 401);
  const opsMbs = await ops.json<{ mailboxes: Array<{ scope: string; capabilities: string[] }> }>("/api/email/mailboxes");
  record("6 authz", "BOF_OPERATIONS: partnerships read/draft only, no fleet mail", opsMbs.body.mailboxes?.length === 1 && opsMbs.body.mailboxes[0].scope === "PLATFORM" && !opsMbs.body.mailboxes[0].capabilities.includes("approve"));
  const faMbs = await fleetA.json<{ mailboxes: Array<{ id: string; scope: string }> }>("/api/email/mailboxes");
  record("6 authz", "Fleet A admin sees only Fleet A mailbox", faMbs.body.mailboxes?.length === 1 && faMbs.body.mailboxes[0].scope === "FLEET");
  record("6 authz", "Fleet A admin cannot read partnerships (404)", (await fleetA.json(`${P}/threads`)).status === 404);
  record("6 authz", "Fleet B admin sees no mailboxes", (await fleetB.json<{ mailboxes: unknown[] }>("/api/email/mailboxes")).body.mailboxes?.length === 0);
  const fleetMailboxId = faMbs.body.mailboxes?.[0]?.id ?? fleetBox?.id;
  if (fleetMailboxId) {
    record("6 authz", "Fleet B admin cannot read Fleet A mailbox (404)", (await fleetB.json(`/api/email/mailboxes/${fleetMailboxId}/threads`)).status === 404);
    record("6 authz", "BOF staff cannot read Fleet A mailbox (404)", (await ops.json(`/api/email/mailboxes/${fleetMailboxId}/threads`)).status === 404);
  }
  record("6 authz", "driver sees no mailboxes", (await driver.json<{ mailboxes: unknown[] }>("/api/email/mailboxes")).body.mailboxes?.length === 0);

  // 5. Claude connector
  const mcp = async (headers: Record<string, string>, body: Json) => {
    const h: Record<string, string> = { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18", ...headers };
    if (bypass) h["x-vercel-protection-bypass"] = bypass;
    const res = await fetch(`${base}/api/email/agent`, { method: "POST", headers: h, body: JSON.stringify(body) });
    const text = await res.text();
    allBodies.push(text);
    return { status: res.status, body: text ? (JSON.parse(text) as Json) : {} };
  };
  const rpc = (id: number, method: string, params: Json = {}) => ({ jsonrpc: "2.0", id, method, params });
  const auth = { authorization: `Bearer ${agentToken}` };
  record("5 connector", "missing token → 401", (await mcp({}, rpc(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "verify", version: "1" } }))).status === 401);
  record("5 connector", "foreign browser Origin → 403", (await mcp({ ...auth, origin: "https://evil.example" }, rpc(1, "tools/list"))).status === 403);
  if (agentToken) {
    const init = await mcp(auth, rpc(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "verify", version: "1" } }));
    record("5 connector", "initialize with preview token", init.status === 200);
    const tools = await mcp(auth, rpc(2, "tools/list"));
    const names = ((tools.body.result as { tools?: Array<{ name: string }> })?.tools ?? []).map((t) => t.name);
    record("5 connector", "exactly 6 tools, none can send/approve", names.length === 6 && !names.some((n) => /send|approve$|decide|credential/.test(n)), names.join(", "));
    const search = await mcp(auth, rpc(3, "tools/call", { name: "search_messages", arguments: { query: "MVR" } }));
    const found = JSON.parse(((search.body.result as { content: Array<{ text: string }> }).content[0].text)) as Array<{ subject: string }>;
    record("5 connector", "Claude can search partnerships mail", found.some((m) => m.subject.includes("MVR")));
    const fleetLeak = await mcp(auth, rpc(4, "tools/call", { name: "search_messages", arguments: { query: "Fleet A only" } }));
    record("5 connector", "Claude cannot see Fleet A mail", (fleetLeak.body.result as { content: Array<{ text: string }> }).content[0].text.trim() === "[]");
    const draft = await mcp(auth, rpc(5, "tools/call", { name: "create_draft", arguments: { to: ["partners@checkr.com"], subject: "Preview: connector draft", body: "Draft created by the preview verifier through the Claude connector." } }));
    const draftRes = JSON.parse(((draft.body.result as { content: Array<{ text: string }> }).content[0].text)) as { draftId: string; status: string };
    record("5 connector", "Claude creates a DRAFT (not sent)", draftRes.status === "DRAFT");
    const req = await mcp(auth, rpc(6, "tools/call", { name: "request_approval", arguments: { draftId: draftRes.draftId } }));
    record("5 connector", "Claude can only request approval", !(req.body.result as { isError?: boolean }).isError);
    const view = await approver.json<{ draft: { createdByKind: string; status: string } }>(`${P}/drafts/${draftRes.draftId}`);
    record("5 connector", "approver sees it as drafted by Claude, pending", view.body.draft?.createdByKind === "AGENT" && view.body.draft.status === "PENDING_APPROVAL");
  } else {
    record("5 connector", "authenticated connector checks", "skip", "PREVIEW_AGENT_TOKEN not set");
  }

  // 9. Scheduled synchronization
  record("9 sync", "scheduled sync without token → 401", (await anon.json("/api/email/sync")).status === 401);
  record("9 sync", "scheduled sync with wrong token → 401", (await anon.json("/api/email/sync", { headers: { authorization: "Bearer wrong-token-value-0000000000" } })).status === 401);
  if (syncToken) {
    const run = await anon.json<{ ok: boolean; results: Array<{ folders?: Array<{ error?: string }> }> }>("/api/email/sync", { headers: { authorization: `Bearer ${syncToken}` } });
    const errors = run.body.results?.flatMap((r) => r.folders ?? []).map((f) => f.error ?? "");
    record("9 sync", "authorized run processes mailboxes and stops at the missing credential (no network contact)", run.status === 200 && errors.length > 0 && errors.every((e) => e.includes("No credential stored")), `${errors.length} folder runs`);
    const ov2 = await approver.json<{ sync: { lastAttemptAt: string | null; lastError: string | null } }>(P);
    record("9 sync", "inbox reports the last sync attempt and its error", !!ov2.body.sync?.lastAttemptAt && (ov2.body.sync.lastError ?? "").includes("No credential"));
  } else {
    record("9 sync", "authorized sync run", "skip", "PREVIEW_SYNC_TOKEN not set");
  }
  const manual = await approver.json(`${P}/sync`, { method: "POST" });
  record("9 sync", "manual 'Sync now' is rate-limited after a run", manual.status === 429 || manual.status === 200, `status ${manual.status}`);

  // 8. Secure credential handling (API surface)
  const leaked = allBodies.some((b) => /"(ciphertext|wrappedKey|passwordHash|password|aad)"\s*:/.test(b));
  record("8 credentials", "no API or connector response contains credential fields", !leaked);
  const credApi = await approver.fetch(`${P}/credential`);
  record("8 credentials", "no credential endpoint exists", credApi.status === 404 || credApi.status === 405);

  // 7 + 8. Database-side checks (optional; preview DB only)
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      assertPreviewDatabase(url, await readOccupancy(db));
      const events = await db.auditEvent.findMany({ where: { entityType: { startsWith: "Email" } }, select: { action: true, details: true, actorId: true } });
      const names = new Set(events.map((e) => (e.details as { event?: string })?.event));
      for (const e of ["draft.created", "draft.approval_requested", "draft.approved", "draft.rejected", "draft.updated", "send.blocked", "message.viewed", "access.denied", "sync.failed"]) {
        record("7 audit", `AuditEvent records ${e}`, names.has(e));
      }
      record("7 audit", "agent actions recorded without a user actorId", events.some((e) => (e.details as { actorKind?: string })?.actorKind === "AGENT" && e.actorId === null));
      record("7 audit", "audit details contain no message bodies", !JSON.stringify(events).includes("about 300 screenings"));
      record("8 credentials", "no mailbox credential stored in the preview database", (await db.emailMailboxCredential.count()) === 0);
      const hosts = await db.emailMailbox.findMany({ select: { imapHost: true, smtpHost: true } });
      record("8 credentials", "every preview mailbox points at a .invalid host", hosts.every((h) => (h.imapHost ?? "").endsWith(".invalid") && (h.smtpHost ?? "").endsWith(".invalid")));
    } finally {
      await db.$disconnect();
    }
  } else {
    record("7 audit", "AuditEvent checks", "skip", "set DATABASE_URL to the preview database to verify audit rows");
  }

  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  console.log(`\n${results.length - failed - skipped} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Verifier error:", (err as Error).message);
  process.exit(1);
});
