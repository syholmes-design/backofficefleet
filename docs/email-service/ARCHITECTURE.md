# BOF Email Service: partnerships@nathson.com

Status (2026-10-15): **implemented on a development branch; not deployed, not connected.**
No production database, DNS, mailbox, or Vercel setting has been touched. No credential has
been requested or used. Sending is disabled in three places.

> **Correction to the earlier assessment.** The first version of this document said BOF had no
> database or authentication. That came from auditing `main`, which carries the public-site
> line. The operating platform lives on the `release/*` line. It runs **Neon PostgreSQL via
> Prisma 7**, **NextAuth v5** (credentials provider, Prisma adapter), **FleetMembership + Role**
> authorization (`lib/authorization.ts`) and an **AuditEvent** table (`lib/audit.ts`). The
> email service now uses all of these. It creates no second database or auth system.

## 1. Repository and branch

| Item | Value |
|---|---|
| Repository | `syholmes-design/backofficefleet` (the only other accessible repo, `BOF-VAULT`, is unrelated) |
| Base | `release/document-control-batch2-control-plane` @ `cf51cfe9` (newest operating-platform line; contains `release/training-authorization-isolated` and `integration/bof-unified-release-20260918`) |
| Work branch | `claude/loving-allen-zr8loh` (rebuilt on the base above) |
| **To confirm** | Which branch Vercel deploys to production for backofficefleet.com. This is not recorded in the repo. |

## 2. How it fits BOF

| Concern | BOF today | Email service uses |
|---|---|---|
| Database | Neon Postgres, Prisma 7 (`lib/prisma.ts`, fail-closed proxy) | 9 new `Email*` models + migration `20261015200000_email_service_foundation` (additive only) |
| Auth | NextAuth v5 session with `memberships[{fleetId, roleCode}]` | Same session object (`SessionUserLike`) |
| Authorization | `hasRole`, `requireFleetAccess` | `lib/email-service/access.ts` maps roles → mailbox capabilities |
| Tenancy | Fleet = tenant | FLEET mailboxes bound to one fleet; PLATFORM mailboxes (BOF-owned) bound to none |
| Audit | `AuditEvent` table | Every email action written to `AuditEvent` (`entityType` Email*, `details.event`) |
| Ops tooling | `provision-operator` CLI (dry-run, phrase, hidden prompt) | `provision-email-mailbox` CLI, same pattern |
| Test DB | `assertTestDatabaseTarget` (local `bof_dev` only) | Same guard |

## 3. Capabilities for partnerships@nathson.com

| # | Requirement | Implementation | State |
|---|---|---|---|
| 1 | Secure IMAP | `ImapInboundSource` (imapflow): IMAPS 993, read-only folder lock, bounded UID-incremental fetch, UIDVALIDITY reset, timeouts | Built; unit-tested parser; **not run against cPanel** |
| 2 | Secure SMTP | `SmtpOutboundTransport` (nodemailer): SMTPS 465 / STARTTLS required on 587; exact same message appended to Sent | Built; tested against a local SMTP server |
| 3 | Inbox in BOF | `EmailService.searchMessages` / threads | **Service ready; UI + API routes not built** |
| 4 | AI drafting | `AgentGateway`: search/read/draft/request-approval/link only | Built; **MCP endpoint not built** |
| 5 | Human approval | Approval bound to SHA-256 of exact content; any edit voids it; only listed approvers | Built and tested |
| 6 | Searchable history | Case-insensitive search across subject, body and addresses; threads by References/In-Reply-To | Built and tested on Postgres |
| 7 | Credential storage | AES-256-GCM envelope encryption; key-encryption key in env (`EMAIL_KEK_V1`) only; secret bound to mailbox id + address; password entered only via hidden terminal prompt | Built and tested |
| 8 | Audit logging | `AuditEvent` rows for every create, approve, send, block, view by agent, denial and sync; never bodies or secrets | Built and tested on Postgres |
| 9 | AI restricted to this mailbox | `EmailAgentGrant`: one mailbox, folder allowlist, optional domain allowlist, expiry, revocable, hashed token. DB CHECK forbids any send/approve scope. | Built and tested |

### Send gates (all must pass)
1. `EMAIL_SENDING_ENABLED=true` in server env. While unset, the SMTP transport is not even constructed.
2. `EmailMailbox.sendEnabled = true`, set by a mailbox admin and audited.
3. Mailbox `ACTIVE`, set only by a successful `--verify`.
4. The draft is `APPROVED` by a user listed in `approverUserIds`, the approval hash matches the
   current content, and the approval is under 72h old.
5. Every recipient's domain is in `recipientDomainAllowlist`. For partnerships@ that means
   dot.gov, checkr.com, sambasafety.com, tenstreet.com, dmv.ca.gov and nicusa.com, until an
   approver widens the list.
6. An atomic `APPROVED→SENDING` transition means two clicks can't send twice (tested on Postgres).

### Access model (`access.ts`)
| Mailbox | Who | Capabilities |
|---|---|---|
| PLATFORM (partnerships@) | users in `approverUserIds` (you) | read, draft, approve/send, admin |
| | `BOF_OPERATIONS` | read, draft |
| | any fleet role | none |
| FLEET (future) | `FLEET_ADMIN` of that fleet | read, draft, admin (+approve if listed) |
| | `FLEET_MANAGER`, `FLEET_OPERATIONS`, `DISPATCH` of that fleet | read, draft |
| | other fleets, drivers, BOF platform roles | none (fleet mail is isolated from BOF staff by default) |
| | AI agents | only via `EmailAgentGrant`; never approve, send or admin |

## 4. Additional mailboxes later (no rebuild)
Yes. A mailbox is a row, not code:
- **Another BOF address** (e.g. `support@`, `compliance@`): same CLI pattern with a different spec, scope `PLATFORM`.
- **A fleet's own mailbox**: scope `FLEET` + `fleetId`. Fleet isolation comes from existing memberships.
- **Transactional lane** (reminders, renewals): lane `TRANSACTIONAL` on a separate subdomain and
  provider. The policy refuses to send approved drafts from it, so automation can't use the
  partnerships mailbox.
- Per-mailbox credentials, sync cursors, approvers, allowlists and agent grants are already
  separate rows. The only generalization needed is a `--address`/`--scope` option on the CLI and an
  admin UI.

## 5. Remaining steps to activate partnerships@nathson.com

Steps marked **(you)** need your action or authorization. Steps marked **(dev)** are code I can
write next on the branch.

| # | Step | Who |
|---|---|---|
| 1 | Confirm the production branch Vercel deploys, and that this work should target it | you |
| 2 | Create `partnerships@nathson.com` in cPanel (if not already), and note the mail server hostname from cPanel → Email Accounts → Connect Devices | you |
| 3 | Check cPanel → Email Deliverability: SPF + DKIM valid for nathson.com; add DMARC (`p=none` to start) | you |
| 4 | **(dev)** API routes: `GET /api/email/mailboxes`, `…/messages?q=`, `…/threads/[id]`, `POST …/drafts`, `…/drafts/[id]/submit`, `…/drafts/[id]/decision`, `…/drafts/[id]/send`, plus `POST /api/email/sync` (token-protected) | dev |
| 5 | **(dev)** BOF UI: Partnerships inbox, thread view, draft editor, approval queue (approve shows exact final text), tracker links | dev |
| 6 | **(dev)** Agent MCP endpoint `/api/email/agent` + grant CLI (issue/revoke token, shown once) | dev |
| 7 | Review and merge the branch into the production line | you |
| 8 | Generate a 32-byte key and add `EMAIL_KEK_V1` to Vercel (Production, sensitive). Keep `EMAIL_SENDING_ENABLED` unset. | you |
| 9 | Apply the migration: `npx prisma migrate deploy` with production `DATABASE_URL` (additive, 9 new tables) | you |
| 10 | `npm run provision:email-mailbox -- --execute`: approver = your BOF login, host from step 2 | you |
| 11 | `npm run provision:email-mailbox -- --set-credential`: type the mailbox password into **your** terminal's hidden prompt | you |
| 12 | `npm run provision:email-mailbox -- --verify`: **the first contact with the live mailbox** (login only, nothing read or sent). Marks it ACTIVE. Also confirm the Sent folder name. | you |
| 13 | Schedule sync: Vercel cron (Pro) or a free external scheduler calling `/api/email/sync` every 10–15 min | you |
| 14 | Issue Claude an agent grant for partnerships@ only (INBOX + INBOX.Sent) and add the MCP endpoint as a claude.ai custom connector | you |
| 15 | **Separately authorize sending**: set `EMAIL_SENDING_ENABLED=true`, then enable the mailbox send switch in BOF | you |

Until step 15, approved drafts can be copied into Outlook and sent by hand.

## 6. Technical obstacles and risks

| Risk | Impact | Mitigation |
|---|---|---|
| cPanel accepts only the mailbox password (no OAuth/app passwords) | One secret reads and sends | Encrypted at rest; KEK separate from DB; send gates; dedicated mailbox |
| cPanel brute-force protection (cPHulk) vs. logins from changing Vercel IPs | Possible lockout | Sync stops after 3 auth failures (status AUTH_FAILED); polling every 10–15 min, not continuous; verify early in step 12 |
| Namecheap send caps (50/hr Stellar, 200/hr Stellar Plus, per domain) | Irrelevant for partner mail; matters for any future automation | Automation goes to the TRANSACTIONAL lane on a separate provider |
| Vercel Hobby: functions ≤60s; cron about daily; **non-commercial use only** | Sync must be short; scheduling; terms of service | Sync is bounded (50 msgs/folder/run). Use Pro cron or an external scheduler. Confirm plan. |
| IMAP from Vercel functions not yet observed in practice | Unknown until tried | Vercel only blocks port 25; confirm in step 12 / first sync |
| cPanel folder naming (`INBOX.Sent` vs `Sent`) | Sent copies / sync miss | CLI asks for it; confirm in step 12 |
| No push notifications (IMAP IDLE needs a persistent process) | 10–15 min inbound latency | Acceptable for partner mail; a worker can be added later |
| Neon storage | Bodies stored as text | Partner volume is tiny; attachments are not stored (fetch on demand later) |
| Public GitHub repo | Code is visible (no secrets in it) | Keep secrets in Vercel/terminal only; consider making the repo private |

## 7. Expected additional monthly cost

| Item | Cost |
|---|---|
| Namecheap mailbox (existing hosting) | $0 |
| Neon (existing database; 9 small tables) | $0 expected (within current plan) |
| Auth, Prisma, audit (existing) | $0 |
| npm libraries (imapflow, nodemailer, mailparser; MIT) | $0 |
| Scheduling | $0 with an external free scheduler. Vercel Pro cron is included if you're already on Pro ($20/seat/mo, which commercial use requires anyway). |
| **Total additional** | **$0** |

## 8. Code map
```
prisma/schema.prisma                         + Email* models (additive)
prisma/migrations/20261015200000_email_service_foundation/
lib/email-service/
  types.ts, access.ts, content-hash.ts, threading.ts, send-policy.ts
  repository.ts           interfaces + in-memory impl (tests)
  prisma-repository.ts    Prisma repo + AuditEvent sink
  service.ts              EmailCore + EmailService (session users)
  agent-gateway.ts        AI surface (no send/approve/admin)
  sync.ts                 bounded incremental IMAP sync
  credential-vault.ts     AES-256-GCM envelope encryption
  credentials.ts          store/load sealed mailbox secret
  mail-transports.ts      imapflow / nodemailer adapters, verifyMailboxConnection
  provisioning.ts         partnerships@nathson.com spec
  server.ts               wiring on BOF's Prisma client
scripts/provision-email-mailbox.ts           operator CLI (dry-run default)
scripts/run-email-service-db-test.ts         guarded DB test runner
```

## 9. Test results (this branch, local only)

| Check | Result |
|---|---|
| `npm run test:email-service` (unit + local SMTP server) | 36/36 pass |
| `npm run test:email-service:db` (Prisma on local `bof_dev`, all 26 migrations applied) | 5/5 pass: threading/dedupe/search, approval + AuditEvent + single send under concurrency, sealed credential, CHECK constraints |
| `prisma migrate deploy` on fresh local DB, then `migrate diff` | Applies; zero drift |
| `npm run typecheck` / `npm run lint` (repo-wide) | Pass / Pass |
| `npm run build` (with local DB) | Pass. Without `DATABASE_URL` it fails on `/customers` prerender, the same as before this change. |
| `npm run test:provision-operator` (existing) | 14/14 pass |
| Provisioning CLI on local DB | Dry run writes nothing; wrong phrase writes nothing; execute creates PENDING_CREDENTIALS + send off; piped password refused |
| Live cPanel IMAP/SMTP | **Not run** (needs your authorization; step 12) |
