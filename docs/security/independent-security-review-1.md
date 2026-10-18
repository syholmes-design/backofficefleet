# Independent security review: website-recovery security changes

Repo: /home/user/bof-website-recovery, branch `claude/website-recovery-20261018`
Reviewer: one independent reviewer (not the author). Date: 2026-10-18.

## Verdict: REJECT

The route gate and the Recruiting V2 tenant isolation mostly hold up. The de-identification does not:

- All 12 original full driver SSNs are still visible in public W-9 PDFs, which anyone can download anonymously.
- The original dates of birth of all 12 drivers are still in a publicly served workbook.
- The repository is **public on GitHub** (`gh api repos/syholmes-design/backofficefleet` returned `"private":false,"visibility":"public"`).
- While this review was running, the changes were committed as `1f925173` (14:34:07 UTC) and that commit is on `origin/claude/website-recovery-20261018`. So the leaking files are already published.
- The earlier history (`5e162f70` and before) also holds the originals. For example, `git show 5e162f70:public/data/main-source-v2_enhanced_bof_aligned.xlsx` contains `[redacted]`.

Note on scope: at the start of the review the changes were uncommitted. They were then committed as `1f925173` (HEAD, clean tree). Everything below was checked against those working-tree files, and I confirmed that the committed blobs are byte-identical for the leaking files (`cmp` = same).

---

## BLOCKER

### B1. Full original SSNs still visible in all 12 public W-9 PDFs (rasterized, so text scanners cannot see them)
- **Files:** `public/documents/drivers/DRV-0{01..12}/w9-drv-0NN.pdf`. Each one is a single page that is now an image (DRV-001 grew from 64,396 to 436,411 bytes).
- **Evidence:** I rendered page 1 of each file with `pdftoppm` and looked at them. The Part I SSN boxes show:
  - DRV-001 [redacted]
  - DRV-002 [redacted]
  - DRV-003 [redacted]
  - DRV-004 [redacted]
  - DRV-005 [redacted]
  - DRV-006 [redacted]
  - DRV-007 [redacted]
  - DRV-008 [redacted]
  - DRV-009 [redacted]
  - DRV-010 [redacted]
  - DRV-011 [redacted]
  - DRV-012 [redacted]

  All 12 are exactly the `ssn_full` originals in `deid/harvest.json`. Map example: `ssn4` maps `9443` to `0123`.
- **Exploit:** `curl http://localhost:3200/documents/drivers/DRV-001/w9-drv-001.pdf` returns 200 `application/pdf` with no session. The served file is byte-identical to the working tree and to HEAD.
- **Root cause:**
  - `raster_redact.py` finds values with `pdftotext -bbox-layout` line text and runs `transform()` on it.
  - The W-9 TIN is drawn in comb boxes, one glyph per word (`3 2 2 - 4 0 - 9 4 4 3`), so the SSN pattern never matched.
  - The page was still rasterized because the name and address changed, so the original SSN pixels were baked into the new image.
  - Rasterizing also removed the text layer. That is why `verify_clean.py` and my own text and stream scan both report 0 hits.
- **Fix:**
  - Regenerate the 12 W-9s from scratch with fictional TINs (for example 000-00-01NN, or masked).
  - Add a visual or OCR check for every rasterized page.
  - Rotate the published artifacts (see B3).

### B2. Original DOBs of all 12 drivers in a publicly served workbook
- **File:** `public/data/main-source-v2_enhanced_bof_aligned.xlsx`, sheet 8 "Master Driver Data", column N "DOB", rows for DRV-001 to DRV-012. The cells are Excel date serials.
- **Values:** DRV-001 John Carter [redacted], DRV-002 [redacted], DRV-003 [redacted], DRV-004 [redacted], DRV-005 [redacted], DRV-006 [redacted], DRV-007 [redacted], DRV-008 [redacted], DRV-009 [redacted], DRV-010 [redacted], DRV-011 [redacted], DRV-012 [redacted]. Every one is a key in `map.json["dob"]` (for example [redacted] maps to 1964-01-01). The `dob_serial` keys (for example 23612) are present as `<v>` values in `xl/worksheets/sheet8.xml`.
- **Exploit:** `GET /data/main-source-v2_enhanced_bof_aligned.xlsx` returns 200 (94,883 bytes) anonymously.
- **Root cause:** the apply and verify steps skipped date-typed cells in this sheet. The same column in the other sheets (and the `data/source-workbooks` copies) was rewritten correctly.
- **Fix:**
  - Rewrite the DOB cells in this sheet to the mapped values.
  - Add a check that compares every date cell (openpyxl `datetime`) against `map["dob"]`.

### B3. Originals are published in a public GitHub repo (current commit and history)
- `origin` is `https://github.com/syholmes-design/backofficefleet`, which is public.
- HEAD `1f925173` (containing B1 and B2) is already on `origin/claude/website-recovery-20261018`.
- Parent commits contain the full SSNs and the other originals in clear text. Example: `5e162f70:public/data/main-source-v2_enhanced_bof_aligned.xlsx` contains `[redacted]`.
- De-identifying the working tree cannot remove what is already in history.
- **Fix (owner decision):**
  - Treat this as an exposure of the real personal data.
  - Rewrite history (git filter-repo) for the affected paths on every branch and tag.
  - Force-push, ask GitHub to purge cached views and PR refs, and consider making the repo private until this is done.
  - Assess whether notification duties apply.

## MAJOR

### M1. Central gate bypass: any path ending in a file extension skips middleware, so the private carrier registry renders anonymously
- **Where:** `middleware.ts:50`. The matcher excludes `.*\.[A-Za-z0-9]+$`, and `app/(bof)/carriers/[id]/[...subpath]/page.tsx:36` has no session check of its own.
- **Exploit:**
  - `/carriers` and `/carriers/CAR-001` both redirect anonymous visitors to sign-in (307).
  - `curl http://localhost:3200/carriers/CAR-001/x.json` returns **200** (259,576 bytes) with the full carrier page. That includes legal name, DOT/MC, contact name, phone and e-mail, packet controls, W-9/ACH status and risk flags.
  - It works for CAR-001 to CAR-005 (all 5 registry entries). It also works with `/x.pdf`, `/.x`, `?_rsc=1`, and with the `RSC: 1` header (200, text/x-component).
- **Same class, lower impact:**
  - Every other `(bof)` dynamic page responds anonymously when its last segment has an extension. Examples: `/drivers/DRV-001.json` 200, `/loads/L-1001.json` 200, `/pretrip/x.json` 200, `/trip-release/x.json` 200, `/intake/x.json` 200, `/emergency-contacts/DRV-001.json` 500.
  - Those pages refuse or show "not found" in their bodies, but each response still carries the full `(bof)` app shell and the `getBofData()` seed (`app/(bof)/layout.tsx:17`).
  - `/maintenance/photos/a.jpg` (private route handler with no auth) returns 200. It only renders an escaped SVG label.
- **API routes are not affected:** every `/api/**/[param].json` I probed returned 401/405 from the handler's own checks. I probed all dynamic API routes with a `.json` final segment, GET and POST.
- **The gate's own claim does not hold:** "deny-by-default … guarantees that private operating routes are never served to an anonymous visitor" is false for these paths.
- **Fix:** do not exclude by extension in general. Use one of these:
  - exclude only real static prefixes (`_next/static`, `_next/image`, a fixed list of `public/` top-level folders), or
  - keep the extension rule but still run the session check in the middleware when the path has a private prefix (run `isPublicRoute` on everything except `_next/*`, and allow public static folders explicitly).

  Also add a server-side session check to the carrier pages, and add test cases like `/carriers/CAR-001/x.json` to `route-access.test.ts`.

## MINOR

- **m1. GET handlers write to the database.** `app/api/recruiting-v2/documents/[candidateId]/route.ts:49` (and the document and file routes) `upsert` ComplianceGate rows on GET. My GETs created one `ComplianceGate` row, which I deleted. This is a side effect of reads, which can be triggered cross-site by a signed-in user (top-level GET with a Lax cookie). It is in scope, so it is not a tenant leak. Move the upsert to the writes.
- **m2. A candidate with no recorded fleet can be activated into any fleet by platform staff.** `driver-activation-service.ts:158` only rejects a mismatch when `candidateFleetId` is set. A fleet user cannot reach such candidates, because the route's scoped read returns 404 (verified). Requiring an explicit fleet, or an explicit platform role, would make this intentional rather than implicit.
- **m3. Role lists differ.** `BOF_ADMINISTRATION` may activate (`PLATFORM_ACTIVATION_ROLE_CODES`) but gets no recruiting scope (`RECRUITING_PLATFORM_ROLE_CODES`). The activation role list also includes dispatch/safety roles, which the read scope excludes. Not exploitable, but inconsistent.
- **m4. Every public `(bof)` page ships the whole demo seed.** The layout passes `getBofData()` (all 12 drivers with addresses, phones, masked SSNs, CDL numbers) into the RSC payload of public pages such as `/dashboard`, `/safety` and `/money-at-risk`. The values are now fictional (no original needle found), but the design means any future data put in the seed becomes public.
- **m5. Inconsistent CDL numbers for John Carter.** His I-9 List B license number renders as `OHZZ000151`, while `JOHN_CARTER_CDL_NUMBER`, the CDL image, the MCSA-5876 and the workbook all use `OH0000075`. Cosmetic.

---

## What I verified holds

### 1. Route gate
- **Next version:** 15.5.15, which is patched for CVE-2025-29927. `x-middleware-subrequest: middleware:…` (5x) and `src/middleware:…` on `/drivers` both still returned 307 to sign-in.
- **Probes that correctly redirect (307) or are normalised:**
  - `/Drivers`, `/DASHBOARD`, `/./drivers`, `/dashboard/../drivers`, `/drivers%2FDRV-001`, `/drivers%2Ejson`: 307
  - `//drivers` and `/drivers/`: 308 to `/drivers`, then 307
  - HEAD and OPTIONS on pages: 307
  - `RSC: 1`, and `Next-Router-Prefetch` + `RSC`: 307
- **APIs:**
  - `/api`: 307
  - `/api/drivers`: 401, including OPTIONS, a garbage cookie, and an `alg:none` unsigned token
  - `/api/auth/../drivers`: 401
  - `GET`/`PUT /api/recruiting/apply`: 401 (only POST is public)
  - `GET /api/contact/inquiries`: 401
  - `/_next/data/x/drivers.json`: 404 (there is no `pages/` directory)
- **Redirects:** `Host: evil.com` and `X-Forwarded-Host: evil.com` still redirect to `localhost:3200/api/auth/signin?callbackUrl=%2Fdrivers`. The callback is relative.
- **JWT handling:** `@auth/core` 0.41.3 `decode` uses `jwtDecrypt` (JWE, `exp` enforced, clockTolerance 15 s), so `alg:none` does not apply. I could not mint an expired token with the server secret, because reading it from the process environment was blocked by the permission system. That case is checked by code reading only.
- **Public pages:**
  - `/dashboard`, `/safety`, `/money-at-risk`, `/rf-actions`, `/settlements-v2`, `/dispatch-v2`, `/documents`, `/demo/*`, `/customer-portal/*` and `/portals/manager` import no Prisma or `auth` in their page trees. They render client components over seed data.
  - Their client fetches to `/api/*` get 401 anonymously.
  - My scan of 35 anonymous pages (HTML plus RSC) found no original values. 34 returned 200 and 1 returned 404.
- **Sessions:** memberships are reloaded from the database in every `session()` callback (`auth.ts`), so a stale JWT does not keep removed roles.
- **Commands:**
  - `npx tsc --noEmit -p .`: exit 0, no output.
  - `npm run test:route-access`: 5 tests, 5 pass, 0 fail.

### 2. Recruiting V2 tenancy
- **Tests:** `DATABASE_URL=…/bof_dev npm run test:recruiting-v2-tenancy`: 8 tests, 8 pass, 0 fail.
- **Live matrix on bof_recovery:** I inserted temporary rows REVTEST-A (fleet-a), REVTEST-B (fleet-b), REVTEST-ARR (applicationSummary is an array), REVTEST-NESTED (fleetId is an array) and REVTEST-NONE (`{}`). Each cell below is the result for all 6 endpoints: qualification, documents, interviews, offer, onboarding, activation (GET).

  | User | A | B | ARR | NESTED | NONE |
  |---|---|---|---|---|---|
  | fleet-a-admin | 200 | 404 | 404 | 404 | 404 |
  | fleet-a-ops | 200 | 404 | 404 | 404 | 404 |
  | fleet-b-admin | 404 | 200 | 404 | 404 | 404 |
  | bof-operations | 200 | 200 | 200 | 200 | 200 |

  The JSON-path filter fails closed for non-object summaries and non-string fleetIds.
- **Document pairing:** Fleet A pairing its own candidate with Fleet B's document code:
  - `GET`/`PATCH /documents/REVTEST-A/REVTEST-DOC-B`: 404 "Document record not found"
  - `POST …/file`: 404
  - B's document status stayed RECEIVED.

  Document lookups are `where {candidateId: scopedCandidate.id, documentCode}`, and the update is by that row's id.
- **Cross-tenant writes:**
  - activation `POST` of B by A: 404
  - documents `POST` of B by A: 404
  - interviews `POST` of B by A: 400, the same body as for an unknown code (no existence oracle)
  - No Driver or Interview rows were created.
- **Anonymous access:** 401, including the `.json` suffix.
- **Pages:** `/recruiting-v2/candidates/REVTEST-B` as Fleet A returns 404. The pages use static demo data and do not query the database.
- **Clean-up:** all test rows were deleted, including 1 ComplianceGate row created by a GET. Final counts in bof_recovery: Candidate 0, Position 0, DocumentRecord 0, ComplianceGate 0.

### 3. Demo privacy, other than B1 and B2
- **My scanner** (`scratchpad/rev/scan.py`, separate from `verify_clean.py`) covered:
  - Needles: every map key (e-mail, phone in any format, nine-digit, id, street, DOB), the harvest values (full SSNs with and without dashes, unmapped streets, ids and DOBs), and masked last-4 values.
  - Patterns: real-looking SSN shapes.
  - Content: raw bytes, xlsx/docx XML (raw and tag-stripped), xlsx date serials, `pdftotext`, every Flate-decoded PDF stream, and image EXIF and info chunks.
  - Locations: public/, lib/, data/, docs/recovery/, content/, components/, app/, scripts/, prisma/, `.next/static`, `.next/server`, and the anonymous HTTP dumps.
- **Result:** apart from B1 and B2, no original e-mail, phone, SSN, nine-digit number, ID or driver street remains. The remaining hits are fictional `DLN-000NN` values and shipper or bank business addresses on BOLs, rate confirmations and settlement authorizations (for example "10 S LaSalle St"). These are business addresses, not driver addresses.
- **Visual checks:**
  - All 12 I-9 page 1s show fictional data (Demo Street, @example.com, 555 numbers, masked SSN).
  - The MCSA-5875 and 5876 samples, the medical card and the CDL image (DRV-001) show fictional data.
  - The ID-card images are clearly labelled "SAMPLE / FICTIONAL DEMO DATA".
- **docs/recovery:** no originals. It contains only local-dev placeholders (`bof:bof` DB URL, `openssl rand` secret).
- **Functionality:**
  - The masked SSN format `***-**-NNNN` is still accepted by `lib/bof-source-of-truth.ts:238`.
  - `JOHN_CARTER_CDL_NUMBER = "OH0000075"` matches in `lib/john-carter-reference.ts`, `scripts/lib/john-carter-stack.mjs` and the workbook.
  - In the browser (Playwright), `/demo/drivers` and `/documents` returned 200 anonymously. Signed in as bof-operations, `/drivers/DRV-001/bank-info` shows "ROUTING NUMBER 000000104, ACCOUNT ••••••0202".
  - One React hydration warning (#418) was seen.

### 4. Public presentation
- I fetched all 42 business-operations routes as HTML and RSC: all 200.
- None contains the source commits (`e901e6cb`, `46b2c464`, `66929e67`, short or full) or `5e162f70`/`396d35fe`. The only hex strings are Next.js chunk hashes.
- `data-recovered-source` was removed.
- A content diff between `5e162f70` and the working tree shows exactly one HTML edit: the deletion of `<h2>The dropdown choices are now visible on the page and lead to real operating pages.</h2>` in `business-operations.json`. Every other change is the `ownerRemovals` metadata only.
