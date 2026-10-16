# Email integration: Preview deployment and validation

## 1. What powers backofficefleet.com (findings, 2026-10-15)

Evidence comes from GitHub deployment records (`vercel[bot]`) on `syholmes-design/backofficefleet`
and from the repo. Claude's sandbox cannot reach Vercel's API or dashboard, so the domain mapping is
**not verified**.

| Vercel project | Builds | Git-triggered Production deploys | Previews of this branch |
|---|---|---|---|
| `bof-web` | release-line layout (app at repo root) | **none recorded** | ✅ success |
| `v0-backofficefleet` | `main` layout (`bof-web/` subfolder) | from `main`, last `94a586b5` (2026-06-19) | ❌ fails (pre-existing for all release-line commits, e.g. `cf51cfe9`) |
| `backofficefleet-demo` | `main` layout | from `main`, last `94a586b5` (2026-06-19) | ❌ fails (pre-existing) |

- The production operator runbook signs in at `https://backofficefleet.com/api/auth/signin`. Only
  the release line has NextAuth. The `package.json` scripts deploy with `npx vercel --prod` (CLI),
  not Git.
- **Most likely:** backofficefleet.com is served by **`bof-web`**, deployed by CLI from a local
  release-line checkout. If so, no Git branch is "the production branch"; production is whatever
  was last deployed with `vercel --prod`.
- **To confirm (you, 2 minutes):** Vercel dashboard, then for each project → Settings → Domains
  (which project lists backofficefleet.com), then Deployments → the Production deployment's
  source (CLI or Git, and which commit).

**Risk found:** every push to any branch creates Preview deployments in all three projects using each
project's *Preview* environment variables. The `bof-web` Preview build of this branch succeeded.
BOF's build prerenders `/customers`, which needs a working `DATABASE_URL`, so **the `bof-web`
Preview environment already has a database configured, and which one is unknown.** If it's the
production Neon database, every preview of every branch can read and write production data. The
steps below override this for the email branch only.

## 2. Isolated Preview setup

Done by you (2026-10-16):
- Neon branch `bof-email-preview` (schema-only branch of production, so tables exist but there are no rows)
- Vercel `bof-web` Preview variables scoped to `claude/loving-allen-zr8loh`: `DATABASE_URL`,
  `EMAIL_KEK_V1`, `EMAIL_SYNC_TOKEN` (plus the existing Preview `AUTH_SECRET`)

**Database initialization happens inside the Preview build** (`scripts/vercel-email-preview-init.mjs`,
which runs first in `npm run build`). It does nothing unless `VERCEL_ENV=preview` **and** the branch
is exactly `claude/loving-allen-zr8loh`. Before any write it:

1. refuses the production database endpoint, a missing branch-scoped `EMAIL_KEK_V1` or
   `EMAIL_SYNC_TOKEN`, and `EMAIL_SENDING_ENABLED=true`;
2. counts the rows of **every** table and refuses if any table outside the preview seed holds data,
   or if any user, fleet, aggregator or carrier group isn't a preview/reference row. This rules out
   production and the R2 Preview database;
3. for a schema-only branch (tables present, empty migration history), proves the live schema
   differs from the release schema **only** by the new `Email*` objects, then records the 24 existing
   migrations as applied (baseline). Any other difference aborts;
4. applies the email migration, re-checks for zero drift and the two safety CHECK constraints;
5. seeds synthetic preview data idempotently (see §2a).

Any failure fails the build. The build log shows the target host and database name for you to
confirm. It never shows the connection string, passwords or tokens. **Remove the build hook before
merging** (one `package.json` line plus the two `scripts/vercel-email-preview-init.*` files).

### 2a. Enable preview logins (you, Vercel UI only, nothing to install)

Add two more **Preview** variables scoped to `claude/loving-allen-zr8loh` (mark Sensitive), then
Redeploy the latest deployment of this branch:

| Name | Value |
|---|---|
| `EMAIL_PREVIEW_LOGIN_PASSWORD` | a password you choose (12+ characters, e.g. from your password manager). It's used for all five synthetic accounts. |
| `EMAIL_PREVIEW_AGENT_TOKEN` | optional: a random 32+ character string to test the Claude connector |

Until the password variable is set, the preview accounts exist with random, unknown passwords.

### 2b. Logging in

Open the Preview URL (Vercel may ask you to sign in to Vercel first) → `/email` → BOF sign-in:

| Login | Password | What you'll see |
|---|---|---|
| `approver@preview.bof.invalid` | `EMAIL_PREVIEW_LOGIN_PASSWORD` | Partnerships inbox; approve/reject drafts (including a sample drafted by Claude) |
| `bof-ops@preview.bof.invalid` | same | Partnerships inbox; can draft but not approve |
| `fleet-a-admin@preview.bof.invalid` | same | Only Fleet A's mailbox |
| `fleet-b-admin@preview.bof.invalid` | same | No mailboxes |
| `driver-a@preview.bof.invalid` | same | No mailboxes |

All correspondence is synthetic. Mailboxes point at `mail.preview.invalid` and hold no credential,
so the Nathson mailbox cannot be contacted. Sending is disabled.

## 3. Automated verification against the Preview

```bash
export PREVIEW_URL=https://<preview-url>
export PREVIEW_PASSWORDS='{"approver":"<pw>","bof-ops":"<pw>","fleet-a-admin":"<pw>","fleet-b-admin":"<pw>","driver-a":"<pw>"}'   # <pw> = EMAIL_PREVIEW_LOGIN_PASSWORD
export PREVIEW_AGENT_TOKEN=<EMAIL_PREVIEW_AGENT_TOKEN>   PREVIEW_SYNC_TOKEN=<EMAIL_SYNC_TOKEN>
export VERCEL_PROTECTION_BYPASS=…   # only if Deployment Protection is on (Settings → Deployment Protection → Protection Bypass for Automation)
export DATABASE_URL=…               # optional: the PREVIEW database, enables audit/credential checks
npm run verify:email-preview
```

The verifier covers all ten areas: inbox, drafting, approval, search, Claude connector,
fleet/user authorization, audit logging, credential handling, scheduled sync, and sending
disabled. It writes only synthetic drafts to the preview database and never sends email.

## 4. Results (preview-equivalent run, 2026-10-15)

The sandbox can't reach `*.vercel.app`, so the same configuration was reproduced locally: a
production build (`next build` + `next start`), a fresh empty Postgres with all migrations, the
seed script, and Preview-style env (`EMAIL_KEK_V1`, `EMAIL_SYNC_TOKEN`, no
`EMAIL_SENDING_ENABLED`). **63/63 checks passed**, with 0 failed and 0 skipped. The seed guard was
also confirmed to refuse a database holding a non-preview user.

### Rehearsal of the build-time initialization (2026-10-16)

This was run locally against a replica of a schema-only branch: production-equivalent schema from
the 24 pre-email migrations, plus an empty `_prisma_migrations` table.

| Case | Result |
|---|---|
| First Preview build | Identity passed. 43 email-only statements; 24 migrations baselined; email migration applied; zero drift; seeded |
| Second build | Idempotent, no changes |
| Other branch / `VERCEL_ENV=production` | No-op |
| Production endpoint / sending enabled / branch vars missing | Aborted before connecting |
| Database containing a real user (R2-like) | Aborted; nothing written |
| Schema differing from release (missing column) | Aborted; nothing written |
| Full `npm run build` + `next start` + verifier | 63/63 checks passed; build log contained no password, token or URL |
