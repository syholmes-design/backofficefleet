# Production release package: 2026-10-19

**Classification: RELEASE CANDIDATE, AWAITING AUTHORIZED DEPLOYMENT.**

This agent environment cannot deploy or verify production:
- the network policy denies `backofficefleet.com`, `*.vercel.app` and `api.vercel.com`;
- there are no Vercel credentials;
- applying production migrations requires owner approval.

Nothing below has been run against production.

## 1. Production baseline (what can and cannot be established)

| Item | Finding | Evidence |
|---|---|---|
| Last production deployment recorded in GitHub | ID `4347232621`, commit `04dda9e6` ("generate and wire 84 driver documents"), 2026-04-13, ref `restore-marketing-landing-pages` | GitHub Deployments API, environment "Production" |
| Deployments since then | Made outside GitHub's deployment records, from the owner's Vercel CLI (`1eb5a855` "stabilize WEB-006 inquiry dashboard **in production**", Oct 17) | Commit history; no later GitHub Production deployments |
| **Current production deployment ID and commit** | **Not determinable from here.** Run step 2.1 below. | — |
| Vercel project | `bof-web` (GitHub check name "Preview – bof-web"); other projects `v0-backofficefleet` and `backofficefleet-demo` also deploy previews | GitHub deployment environments |
| Repository default branch | `main` (June 2026, old `bof-web/` layout). **Not the release source** (see `docs/release/BRANCH-RECONCILIATION-2026-10-19.md`). | GitHub API |
| Production database identity | Neon host (blocked in the test guard as `ep-young-sound-axayjjna…neon.tech`). The value is never printed. | `lib/test/assertTestDatabaseTarget.ts` |
| Latest applied production migration | **Not determinable from here.** Run step 2.2. | — |
| Deployment mechanism | Vercel CLI from the owner's workstation (inferred, as above) | — |
| Rollback | Vercel "Promote" of the previous production deployment. All schema changes in this release are additive, so a code rollback needs no schema rollback. | — |

## 2. Release steps (owner, or an agent given access)

### 2.1 Record the current production baseline (read-only)

```bash
vercel ls bof-web --prod            # note the current production deployment URL / ID
vercel inspect <production-url>     # note its commit SHA (meta.githubCommitSha) and creation time
```

### 2.2 Check production migrations (read-only)

```bash
DATABASE_URL=<production url> npx prisma migrate status
```

**Expected:** at most these three are pending. All are additive; nothing is dropped, retyped or made NOT NULL without a default:

| Migration | Contents |
|---|---|
| `20261016140000_contact_inquiry` | New `ContactInquiry` table and enum |
| `20261017160000_contact_inquiry_management` | New inquiry-management columns, an activity table and enums |
| `20261019120000_requisition_recruiting_integration` | New enum `RecruitingCandidateDisposition`. New values RECRUITING, PARTIALLY_FILLED and FILLED on `RequisitionRecruitingPipelineState`, and ADVANCE_WITH_CONDITIONS on `RecruitingV2Recommendation`. New `Position` columns: nullable `requisitionId` (unique, FK RESTRICT), nullable `fleetId`, and `openings` (default 1). New `Candidate` columns: `dispositionStatus` (default ACTIVE) plus nullable disposition fields. New nullable `Interview.questionnaire`. |

The two Contact migrations may already be applied, since WEB-006 ran in production on Oct 17. **If anything else is pending, stop.** It means production is on a different lineage.

### 2.3 Apply the outstanding migrations (needs owner approval)

```bash
DATABASE_URL=<production url> npx prisma migrate deploy
```

Use `migrate deploy` only. Never `migrate dev`, `migrate reset` or `db push` against production. Take a Neon branch or point-in-time restore point first.

### 2.4 Pre-release checks, from a clean checkout of the release commit

```bash
git fetch origin && git checkout <release sha>    # head of claude/website-recovery-20261018
npm ci && npx prisma generate
BOF_EPOD_ENABLED=false npm run preflight -- --test
npx tsc --noEmit && npm run check:preservation
npm run test:route-access && npm run test:recruiting-v2-tenancy
node --import ./scripts/lib/ts-alias-loader.mjs --test lib/recruiting/requisition-integration.test.ts lib/qualification/work-history-input.test.ts lib/recruiting-workspace-route.test.ts
npx tsx --test lib/services/dispatchAssignment.safety.test.ts lib/recruiting-v2/driver-activation-service.test.ts   # bof_dev
npx next build
```

Confirm in Vercel that `BOF_EPOD_ENABLED` is exactly `false` in Production.

### 2.5 Deploy

```bash
vercel deploy --prod
```

Record the new deployment ID and commit.

### 2.6 Verify (read-only, then approved test records only)

1. `BASE=https://backofficefleet.com node scripts/release/verify-public-routes.mjs`. Expect 16 of 16. It covers:
   - public pages;
   - private gates;
   - blind careers postings;
   - no superseded wording;
   - the retired route.
2. Check the new redirects with `curl -sI https://backofficefleet.com/demo` and `.../customer-portal/request-shipment`. Expect 308 to `/interactive-demo` and `/customer-portal/load-intake`.
3. **Contact:** submit one inquiry clearly labelled as a release test. Confirm it appears for BOF staff at `/contact-inquiries`, then close it.
4. **Recruiting:** signed in as BOF staff, `/recruiting/workspace` loads. Use an approved **test** requisition only, if one exists. Do not apply to real carrier openings.
5. Record the results separately from the local evidence.

### 2.7 Roll back if needed

1. Promote the deployment recorded in step 2.1.
2. Leave the additive schema in place.

## 3. Job-board integration status (evidence only)

| Capability | Status | Evidence |
|---|---|---|
| BOF Careers publication | **Implemented.** Approved, open requisitions are listed automatically as blind postings. | `/api/recruiting/openings`, `/careers`; the unit test asserts no carrier fields |
| Applicant ingestion (BOF Careers) | **Implemented.** Applications become candidates on the requisition. | Verified locally (CAND-003; duplicate → 409; closed or unknown → 404) |
| Source attribution | **Implemented for BOF Careers.** `applicationSummary.source = "BOF Careers Page"`; recruiter attachment is recorded separately. External sources have no ingestion path yet. | `attachCandidateToPosition` |
| Duplicate prevention | **Implemented:** one application per email per position, case-insensitive. No cross-position or cross-source matching. | Bridge intake |
| JobPosting structured data (Google for Jobs) | **Implemented 2026-10-19.** schema.org `JobPosting` JSON-LD per open posting on `/careers` (date posted, location, employment type, direct apply). It is script-safe. Indexing is at Google's discretion. | `jobPostingStructuredData` and its unit test |
| Indeed, LinkedIn, ZipRecruiter posting | **Not implemented.** The previous adapters (`lib/job-board-adapters.ts`) returned "Published to … API" whenever a key was set, **without calling any API**. They were removed as unsafe. The workspace now shows these boards as "Not connected" and lists what each needs. | `lib/job-board-distribution.ts` |
| External applicant ingestion (Indeed Apply, LinkedIn Apply) | Not implemented | — |
| Provider credentials and commercial approvals | **Third-party authorization required:** an Indeed employer account and job-sync/XML feed approval; a LinkedIn Talent Solutions partner agreement; a ZipRecruiter employer account and feed. **Owner action; may involve fees.** Nothing was published and no charges were incurred. | — |

Build the external board integrations as a separate tracked item (Agent 1) once agreements exist. The canonical posting data is already in `lib/recruiting/public-openings.ts`, so each board needs only an adapter that sends real requests and records the board's job ID.
