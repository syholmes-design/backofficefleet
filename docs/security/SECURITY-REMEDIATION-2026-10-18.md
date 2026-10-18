# BOF Security Remediation and Owner Preview (2026-10-18)

| | |
|---|---|
| Branch | `claude/website-recovery-20261018` (not merged) |
| Production | **not deployed, not modified**; no production or Preview database touched; **no migrations run** |
| Test data | local Postgres only (`bof_recovery` for the running preview, `bof_dev` for test suites); fixtures removed after each run |
| Evidence | `docs/security/evidence/` (raw outputs), summarised below |

## Summary

| Priority | Outcome |
|---|---|
| 1. Public demonstration privacy | All realistic driver identifiers and financial values were replaced with fictional values, consistently across data, documents, spreadsheets, PDFs and images. **0 original values remain** in the branch's files, in the built application, or in 1,892 anonymously served files and pages. The **repository is public** and Git history still holds the originals (owner action, see section 6). |
| 2. Authentication | A central, deny-by-default session gate (`middleware.ts`) now protects every private operating page and API. Public marketing, assessments, demonstrations and the two public submission forms stay open. 68 live HTTP/browser checks pass. |
| 3. Recruiting tenant isolation | Every Recruiting V2 candidate query is now restricted in the database query to the user's fleets, their aggregator's affiliated fleets, or (for BOF staff) all fleets. Cross-fleet activation is blocked. 8 database tests and 8 live HTTP tenancy checks pass. |
| 4. Public presentation | The developer-style hub heading is removed (recorded as an owner-directed removal). Commit identifiers no longer appear in public markup. The original stylesheet and recovered design are unchanged. |
| 5. Verification | Full regression suite: no new failures, and one previously failing validator now passes. Recovered-content fidelity is intact. Website browser checks 87/87. Link matrix 338/338 OK. One independent security review (section 7). |

---

## 1. Public demonstration privacy

### What was exposed (before this branch)

Every file below was reachable with HTTP 200 by any anonymous visitor (verified with real requests):

| Exposure | Where |
|---|---|
| **Full 9-digit SSNs** for all 12 demo drivers | `public/data/main-source*.xlsx` (4 workbooks, "Driver Data" sheet) |
| **Full bank account and routing numbers** | the same workbooks; the voided-check line of 24 bank-card HTML files (`public/reference/bank-info/`, `public/documents/drivers/*/bank-card-*.html`) |
| Dates of birth, home addresses, phones, personal e-mails, CDL and passport numbers, emergency contacts | driver applications, emergency-contact and MVR cards, profile dashboards, I-9/W-9/MCSA-5875/5876 PDFs, generated HR and payroll documents |
| Readable ID images | 24 CDL images, 22 medical-card images and 24 insurance cards. The insurance cards carried a real insurer's brand. |
| Personal e-mail of a real person | a public medical-card PDF contained a personal Gmail address |
| Every operating page | `app/(bof)/layout.tsx` embeds the whole demo seed (SSN last-4, phones, e-mails, emergency contacts, medical and pay data) in the page payload, and these pages were unauthenticated |
| JS bundles | the seed modules (routing numbers, DOBs, CDL numbers, e-mails) were compiled into public chunks |

### Synthetic or potentially real

| Category | Verdict | Basis |
|---|---|---|
| Routing numbers | Synthetic | 11 of 12 fail the ABA checksum; all have prefixes the Federal Reserve never assigns |
| Full SSNs | **Treat as real** | 11 of 12 have valid area, group and serial numbers, so they may belong to real people |
| Personal phones | **Plausibly real** | dialable numbers outside the reserved 555-0100–0199 range |
| Personal e-mails | **Plausibly real** | gmail, yahoo, hotmail and aol addresses with common names; one is the owner's own address |
| Home and emergency-contact addresses | **Plausibly real** | real streets, mostly real commercial landmarks |
| Passport numbers (I-9) | Unknown, treated as real | valid US passport format |
| DOBs, CDL numbers | Synthetic | inconsistent across documents; CDL formats match no state |
| Face photos, ID images | Synthetic | AI-generated |

No commit message describes the data as synthetic. The values entered Git in `29451acc` (bank cards) and `c505f404` (baseline).

### What was replaced

All replacements are consistent across every file, so each driver's documents still agree with each other.

| Category | Count | Fictional replacement |
|---|---|---|
| E-mail addresses | 94 | reserved domains: `…@example.com`, `…@boftransport.example`, `…@insurer.example` |
| Phone numbers | 98 | same area code, reserved fictional line 555-0100–0199 |
| Full SSNs | 12 | `900-00-NNNN` (area 900 is never issued); masked forms keep `***-**-NNNN` so `lib/bof-source-of-truth.ts` still parses them |
| SSN last-4 values | 24 | `01NN` |
| Routing numbers | 12 | `0000001NN`: 9 digits, invalid Federal Reserve prefix |
| Account numbers | 12 | `99990NNNN`; masked `••••NNNN` updated to match |
| Licence, CDL and passport numbers | 169 | same shape, zero-filled (e.g. `OH0000075`, `Z00000154`); John Carter's constants updated consistently in `lib/john-carter-reference.ts`, `scripts/lib/john-carter-stack.mjs` and the workbooks |
| Dates of birth | 33 | 1 January of the same year, so ages stay roughly the same; spreadsheet date cells updated in DOB columns only |
| Person street addresses | 100 | `NNN Demo Street` with the same city, state and ZIP. Load, customer and terminal addresses are unchanged. |

How each file type was handled:

| File type | Method |
|---|---|
| Text sources and documents | In place: `lib/demo-data.json`, `lib/test-demo-data.json`, `lib/bank-info`, `lib/emergency-contacts`, HTML and JSON under `public/`, scripts that hard-code the values (`verify-all-emails`, `update-emergency-contacts`, generators) |
| Spreadsheets | The 11 `.xlsx` workbooks under `public/data` and `data/` were edited in their XML, so formatting and formulas are preserved |
| Word documents | `.docx` XML |
| PDFs with a sensitive value | **Only the affected pages** were re-rendered as images with the fictional values drawn in, using word positions from `pdftotext -bbox`. This covers 12 MCSA-5875 forms, 12 W-9s and 24 DQF summaries. The forms look the same, but values on those pages are no longer selectable text. |
| PDFs with hidden copies | The 12 I-9s carry an embedded XFA data copy, and four DRV-001 medical PDFs had embedded originals including the owner's e-mail. These were **rebuilt entirely from page images**, so no hidden data remains. They are no longer fillable forms. |
| `fmcsa_clearinghouse.html` | A PDF that was already corrupt in Git (it cannot be opened). Its plain-text originals were rewritten in place. |
| ID images | Regenerated by the new `scripts/generate-demo-id-card-images.py`: clearly labelled **SAMPLE / FICTIONAL** cards using the existing AI headshots and the de-identified values. There are no state seals, insurer brands or barcodes. This also fixes two pre-existing data bugs: the DRV-001 and DRV-002 medical cards showed another driver, and DRV-005's medical card was an empty file. |

The original-to-fictional map is **not committed**, because it contains the original values.

### Verification: no original values remain publicly accessible

The scanner searches for every original value in every format the replacements cover. It reads text, spreadsheet and Word XML, PDF text, form fields, metadata and decompressed raw streams.

| Scope | Original values found |
|---|---|
| Every tracked file in the branch (all formats) | **0** |
| Built application `.next/static` (client JS) and `.next/server` (prerendered pages, RSC payloads) after a clean rebuild | **0** |
| Live anonymous HTTP: all 1,892 files and pages served with HTTP 200 (every file under `public/` plus every crawled page with its embedded data) | **0** |
| Independent pattern sweep across the repository (consumer e-mail domains, SSN shapes, non-555 driver phones) | **0** |
| Live check of the 17 text documents linked from the public file cabinet | 0 SSNs, 0 consumer e-mails, 0 non-555 driver phones |

### Functionality preserved

- The validators, test suites and website checks (section 5) give the same results as before, except that `validate:driver-dqf-summaries` now passes.
- `scripts/verify-all-emails.mjs` still reports the same mismatches as before. Its hard-coded expectations already disagreed with the demo data; the values were de-identified, but the mismatch itself was not changed.

---

## 2. Authentication: central protection for private operating routes

### Audit findings (before)

- No `middleware.ts` existed, and `app/(bof)/layout.tsx` had no guard.
- Each page decided for itself:
  - Most operating pages rendered for anonymous visitors, either with an empty notice or with the full demo seed in the payload.
  - `/drivers/[id]/*`, `/documents/vault` and `/emergency-contacts` showed realistic records on screen.
  - `/portals/customer` and `/customers` ran an **anonymous, unscoped live database query** across tenants.
- About 108 API routes already required a session. The only open ones were sign-in, public media and feeds, and the two public submission endpoints.
- Roles and tenant memberships are not in the session token; they are loaded from the database on each `auth()` call.

### Design (`middleware.ts`, `lib/security/route-access.ts`)

- **Deny by default.** Every page and API needs a valid Auth.js session unless it is on the public allowlist. New operating routes are private automatically.
- **Public allowlist:**
  - every `app/(marketing)` page; a test fails if a marketing section is added without being listed
  - `/assessment/**`
  - public demonstrations: `/demo/**`, `/dashboard`, `/customer-portal/**`, `/shipper-portal/**`, `/portals`, `/portals/manager`, `/safety`, `/money-at-risk`, `/rf-actions`, `/settlements-v2`, `/dispatch-v2`
  - the public sample library: `/documents`, `/documents/company-operations-vault`, `/documents/template-packs/**`, `/documents/compliance-flow`
  - `/api/auth/**`, `/api/marketing-demo-media`, `/api/regulatory-feed`
  - **POST only** for `/api/contact/inquiries` and `/api/recruiting/apply`
- **Now private** (previously served to anonymous visitors), among others:
  - `/drivers/**`, `/documents/vault/**`, `/emergency-contacts/**`
  - `/dispatch/**`, `/loads/**`, `/command-center`, `/settlements/**`, `/pretrip/**`, `/trip-release/**`
  - `/recruiting/**`, `/recruiting-v2/**`, `/carriers/**`
  - `/portals/customer`, `/customers` (closes the live-data leak), `/portals/driver/**`
  - `/maintenance/**`, `/intake/**`, `/source-of-truth`, `/operational-chat`, `/fleet-financials`, `/contact-inquiries`
- **Responses:**
  - Pages redirect to `/api/auth/signin?callbackUrl=<path>`. The URL is relative, never built from the Host header, and internal `_rsc` parameters are stripped.
  - APIs return `401 {"code":"AUTH_REQUIRED"}`.
  - Without an `AUTH_SECRET`, the gate fails closed with 503.
- **Runs on the edge.** It verifies the session JWT with `getToken` (both the HTTPS and HTTP cookie names) and does not import Prisma.
- **Role and tenant checks stay where they were**, in pages, handlers and services. The gate guarantees a session; the existing checks decide what that session may see.
- **No new authentication system or database** was added, and authentication was not weakened.

### Tests and evidence

- `npm run test:route-access` (5 tests): the allowlist matches the marketing folders, public pages stay public, 31 private paths are private, API method rules hold, and the redirect is built safely.
- Live checks against the production build (`docs/security/evidence/security-http-results.md`), 68 of 68 passed:

| Group | Result |
|---|---|
| Anonymous: 18 public pages | all HTTP 200 |
| Anonymous: 22 private pages (incl. `/drivers/DRV-001/bank-info`, `/emergency-contacts`, `/documents/vault`, `/customers`, `/recruiting-v2`) | all HTTP 307 → `/api/auth/signin?callbackUrl=<same path>` |
| Anonymous: 6 private APIs | all HTTP 401 `AUTH_REQUIRED` |
| Anonymous: public endpoints | `/api/auth/providers` 200; `POST /api/contact/inquiries` 422 (reaches validation); `POST /api/recruiting/apply` 400 (reaches validation) |
| Sign-in (fleet-a-admin, fleet-b-admin, bof-operations) | each lands on the requested `/dispatch` |
| Signed in: `/dispatch`, `/drivers`, `/command-center`, `/recruiting` | HTTP 200 |
| Role: FLEET_ADMIN → BOF-staff inquiry queue (page and API) | HTTP 403 / 403 |
| Role: BOF_OPERATIONS → inquiry queue | HTTP 200 |

---

## 3. Recruiting V2 tenant isolation

### Findings (before)

- All 8 Recruiting V2 API routes loaded candidates by the global, sequential, guessable `candidateCode` with **no fleet filter**. They only checked that a session existed.
- Any signed-in user of any tenant could read any candidate's personal details and documents, create documents and interviews, and change offer and onboarding status.
- Activation trusted the `fleetId` in the request body, and its role check accepted a role on *any* fleet. A Fleet A admin could therefore activate a Fleet B candidate into Fleet A.
- None of the Recruiting V2 tables has a tenant column, and adding one needs a migration (not authorized).

### Implementation (no migration)

- **Where the fleet is stored.** A candidate's owning fleet is recorded in `Candidate.applicationSummary.tenant.fleetId`. After activation it is also in `applicationSummary.recruitingV2DriverHandoff.fleetId`.
- **`lib/recruiting-v2/candidate-access.ts`** resolves the caller's scope:

  | Caller | Candidates visible |
  |---|---|
  | BOF platform staff (BOF_OPERATIONS, BOF_COMPLIANCE_REVIEW) | all |
  | FLEET_ADMIN, FLEET_MANAGER, FLEET_OPERATIONS | their own fleets |
  | Active aggregator members | every fleet actively affiliated with their aggregator (`AggregatorFleet`) |
  | Drivers, dispatch-only users, invited or inactive memberships | none |
  | Any non-staff user, for a candidate with no recorded fleet | none (BOF staff only) |

- **Enforced in the database query.** All 8 routes (GET and POST/PATCH) use `requireRecruitingCandidateAccess()`. The scope is part of the same Prisma query as a JSON-path filter, so out-of-scope candidates are never loaded. **An out-of-scope candidate returns the same 404 as an unknown code.**
- **Activation** (`driver-activation-service.ts`): the target fleet must be the candidate's fleet (422 otherwise), and the activation role must be held for that fleet — platform-wide, through fleet membership, or through an aggregator affiliated with it.
- The old session-only helper `lib/recruiting-v2/require-operator-session.ts` was removed.

### Tests and evidence

- **Database tests:** `npm run test:recruiting-v2-tenancy` against local `bof_dev`, 8 of 8 passed (`docs/security/evidence/test-recruiting-v2-tenancy.log`):
  1. Fleet A cannot retrieve Fleet B's candidate, with the same result as an unknown code.
  2. Fleet B cannot retrieve Fleet A's candidate.
  3. An aggregator affiliated with A and B reaches both, but not unaffiliated Fleet C.
  4. An aggregator affiliated with A only, or with an inactive link to B, cannot reach B.
  5. Drivers and invited members get nothing.
  6. BOF staff see all candidates, including ones with no recorded fleet.
  7. Fleet A cannot activate Fleet B's candidate into A (422) or into B (403), and no Driver row is created.
  8. A static guard confirms no route queries by candidate code without the scope.
- **Live checks** with real sessions:

  | Request | Result |
  |---|---|
  | Fleet A → own candidate | 200 |
  | Fleet A → Fleet B's candidate | 404 |
  | Fleet A → unknown code | 404 |
  | Fleet B → Fleet A's candidate | 404 |
  | Fleet B → own candidate | 200 |
  | BOF operations → both candidates | 200 / 200 |
  | Fleet A adds a document to Fleet B's candidate | 404, document count unchanged (0 → 0) |
  | Fleet A activates Fleet B's candidate into Fleet A | 404 |

### Owner decisions noted

- Aggregator members currently get read **and** write access to affiliated carriers' candidates. This preserves the existing aggregator authorization model; make it read-only if preferred.
- Nothing in the repository creates Recruiting V2 candidates yet. Whatever creates them must set `applicationSummary.tenant.fleetId`; until it does, those candidates are visible to BOF staff only. A proper tenant column should replace the JSON convention when a migration is authorized.

---

## 4. Public presentation

- **Developer heading removed.** "The dropdown choices are now visible on the page and lead to real operating pages." is gone from the hub.
  - It was removed in the generator (`OWNER_REMOVALS` in `scripts/recovery/recover_business_operations.py`), so regenerating the content keeps it out.
  - The removal is listed in `docs/recovery/business-operations-recovery-report.md`.
  - The section's "Business Operations directory" label, introduction and every area card remain.
- **Commit identifiers removed** from public markup: the archive banner now shows only the version date, and the `data-recovered-source` attribute is gone.
  - Provenance stays in `content/recovered-site/*.json` (server-only) and `docs/recovery/`.
  - Verified: 0 commit hashes on any crawled public page or on the five archive pages.
- **Original stylesheet and design are unchanged.** The reviewer's fidelity check reports no removed or unexplained content on all 42 recovered pages, apart from the one owner-directed heading removal.

## 5. Verification

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors; 4 warnings, all in `components/dispatch/LoadDeliveryScreen.tsx` (untouched by this branch, present on the base commit) |
| `next build` (clean `.next`) | pass |
| Regression suite: 38 scripts (`test:*`, `validate:*`, `audit:*`) — `docs/security/evidence/regression-suite-*.txt` | 8 test suites pass, including the 2 new ones. 18 validators pass, including `validate:driver-dqf-summaries`, which failed before and now passes. 12 validators/audits fail **with byte-identical output to the baseline taken before any change** (pre-existing data-quality failures). **No new failures.** |
| Website browser checks (`docs/security/evidence/website-browser-checks.json`) | 87 / 87 |
| Link matrix (`docs/recovery/B-connectivity-matrix-table.md`) | 338 links, 338 OK, 0 broken, 0 privacy flags. Former privacy rows now go to fictional demo data or to sign-in. |
| Security live checks | 68 / 68 |
| Privacy scans | 0 original values (section 1) |

## 6. Owner actions required

1. **The GitHub repository `syholmes-design/backofficefleet` is public.**
   - The original SSNs, bank numbers, personal e-mails (including your own), phones and addresses remain readable on `main`, on other branches and in the history of every commit since `29451acc` / `c505f404`.
   - The branch fix does not remove them from history.
   - Options:
     - make the repository private now (immediate and reversible);
     - rewrite history to purge the files, which is destructive, requires force-pushes and invalidates existing clones;
     - consider whether any of the values belong to real people, and whether notification obligations apply.

   I have done none of these: each is outward-facing or destructive and needs your decision.
2. **Production still serves the old files** until this branch is merged and deployed.
3. Review the Preview (section 8) and decide on merge.
4. Decisions: aggregator write access (section 3); restore the Ohio/Illinois/Georgia/Texas licence artwork with fictional values, if you prefer it to the generic sample cards.

## 7. Independent review

See [`independent-security-review.md`](independent-security-review.md). This was **one** review, by a separate agent that did not write the code. It is not multiple reviews.

## 8. Owner preview

See the Vercel Preview link reported for the pushed commit (the `bof-web` project). The sandbox cannot open `*.vercel.app`, so the Preview was not inspected from here.
