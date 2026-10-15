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

## 2. Isolated Preview setup (you, about 15 minutes; nothing touches production)

1. **Create an empty database.** In Neon, create a new database (or a new project), e.g.
   `bof_email_preview`. Don't branch from production: a branch copies production users and
   data. Copy its connection string.
2. **Scope variables to this branch only.** Vercel → `bof-web` → Settings → Environment
   Variables → Add, Environment = **Preview**, Git branch = `claude/loving-allen-zr8loh`:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the new empty database (overrides the shared Preview value for this branch only) |
   | `AUTH_SECRET` | a new random value (`openssl rand -base64 32`), different from production |
   | `EMAIL_KEK_V1` | a new random 32-byte base64 key, **preview only**; never reuse it in production |
   | `EMAIL_SYNC_TOKEN` | a new random token |
   | `EMAIL_SENDING_ENABLED` | **do not add** |

3. **Prepare the database** from your machine:
   ```bash
   read -rs DATABASE_URL && export DATABASE_URL     # the NEW preview database
   npx prisma migrate deploy
   npm run seed:email-preview                       # type: SEED EMAIL PREVIEW
   ```
   The seed refuses the production database and any database holding real users or fleets. It
   prints five synthetic logins and a preview Claude token **once**:

   | Login | Can do |
   |---|---|
   | `approver@preview.bof.invalid` | partnerships mailbox: read, draft, approve, admin |
   | `bof-ops@preview.bof.invalid` | partnerships: read and draft, cannot approve |
   | `fleet-a-admin@preview.bof.invalid` | Fleet A's own mailbox only |
   | `fleet-b-admin@preview.bof.invalid` | no mailboxes |
   | `driver-a@preview.bof.invalid` | no mailboxes |

   All mail is synthetic. Seeded mailboxes point at `mail.preview.invalid` (a reserved name that
   never resolves) and have no stored credential, so the real Nathson mailbox cannot be contacted.
4. **Redeploy the Preview.** Vercel → `bof-web` → Deployments → the latest
   `claude/loving-allen-zr8loh` deployment → ⋯ → Redeploy, so the branch-scoped variables apply.
5. **Open it.** The branch alias is shown on that deployment (the commit-specific URL also works).
   Previews may require your Vercel login (Deployment Protection). Sign in to BOF with
   `approver@preview.bof.invalid` and open **Email**.

## 3. Automated verification against the Preview

```bash
export PREVIEW_URL=https://<preview-url>
export PREVIEW_PASSWORDS='{"approver":"…","bof-ops":"…","fleet-a-admin":"…","fleet-b-admin":"…","driver-a":"…"}'
export PREVIEW_AGENT_TOKEN=…   PREVIEW_SYNC_TOKEN=…
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
