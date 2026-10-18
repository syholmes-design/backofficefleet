# Independent security review, round 3: commit a6e8e60d

- **Repository:** /home/user/bof-website-recovery, branch `claude/website-recovery-20261018`, HEAD `a6e8e60d`. The working tree is clean, and the same commit is on `origin`.
- **Reviewer:** one independent reviewer. I did not write this code and did not do rounds 1 or 2. This is a single review (round 3). Date: 2026-10-18.
- **What I tested:**
  - The production build on :3200. `.next/BUILD_ID` dates from 16:11. The only files changed after it are under `docs/`, so the build matches the code at HEAD. The server and Postgres were restarted during the review, with the same build; I re-ran spot checks afterwards and got the same results.
  - Local Postgres: `bof_recovery` (live tenancy probes) and `bof_dev` (test suite).
- **How I handled originals:** this report contains no original value in any form. Where one is involved, it is written as `[redacted]`. I modified nothing in the repository. The DB rows I inserted were deleted, and I confirmed it: Candidate, Position and ComplianceGate counts were back to 0.

## Verdict: APPROVE WITH CONDITIONS

All round-2 findings (B1, B2, M1, m1, m4) are fixed. My checks found:

- no original value in any form in tracked files, in the build output, or in anything served anonymously;
- no new gate bypass;
- no BLOCKER or MAJOR finding.

**Conditions:**

1. **Owner decision on Git history (carried over from round-1 B3, still open).** The public remote still holds the originals in earlier commits of this branch and in its baseline. That includes `7b233ac4`, whose committed round-1 report contained originals (round-2 B1). This commit does not fix that, and no code change can. The owner must decide whether to purge history and rotate or treat the values as exposed before this branch is merged or advertised.
2. **Correct the remediation document** (MINOR m1 below) before it is shared.

## BLOCKER

None.

## MAJOR

None.

## MINOR

### m1. The remediation document again claims a review that had not happened, and links to a file that does not exist
- **Where:** `docs/security/SECURITY-REMEDIATION-2026-10-18.md`
  - **Line 18:** "…and a third round reviewed the result (section 7)."
  - **Lines 300-302:** "### Round 3: review of the round-2 fixes. See [`independent-security-review-3.md`](independent-security-review-3.md)."
  - **Line 268:** "Two review rounds took place on the security changes".
- **Evidence:**
  - `docs/security/` holds only `independent-security-review-1.md` and `-2.md`, so the link is dangling.
  - The text was committed before this review existed. This is the same pattern as round-2 m2, which the document itself says is "Fixed. This report now describes only checks that were run".
  - Line 268 contradicts lines 18 and 300.
- **Fix:**
  - After this review, commit its redacted copy and state its actual verdict (approve with conditions).
  - Make line 268 consistent ("three review rounds").
  - Or remove the round-3 wording until a review result exists.

### m2. Activation does not fill in the tenant fleet when `tenant` is present but has no `fleetId`
- **Where:** `lib/recruiting-v2/driver-activation-service.ts:81`, which reads `const tenant = base.tenant && typeof base.tenant === "object" && !Array.isArray(base.tenant) ? base.tenant : { fleetId: handoff.fleetId };`
- **Evidence:**
  - If `applicationSummary.tenant` is an object without `fleetId` (for example `{}`), it is kept as it is.
  - The candidate then stays visible to BOF platform staff only, never to the fleet it was activated into. This contradicts the comment above it ("record it when activation happens on a candidate that had none").
  - It fails closed, so it is not a leak. I did not find a code path that writes such a tenant object today.
- **Fix:** check `candidateTenantFleetId(base)`, not whether the `tenant` object exists, and merge `{ ...base.tenant, fleetId: handoff.fleetId }` when it is missing.

### Informational (no action required for this branch)
- **`TRACE` returns 500 on every route,** public ones included (for example `/`, `/company`, `/drivers/DRV-001/bank-info`).
  - The body is the generic Next.js 500 page, with no stack trace or data.
  - This is framework behaviour, not the gate. Consider rejecting `TRACE` and `TRACK` with 405 at the edge or proxy.
- **Business addresses that are not mapped remain** (pickup and delivery cells in the Dispatch / Dispatch_Clean / Vercel_Loads sheets, BOL and rate-confirmation PDFs under `/actual_docs/`, and the bank address on the DRV-010/012 settlement authorizations).
  - These are the same 14 business addresses that round 2 classified as not driver data. They appear once in `docs/security/independent-security-review-1.md:160`, as an example of a business address.
  - Not personal data; listed so the classification is explicit.
- **Missing assets on public pages (pre-existing):**
  - `/_next/image` returns 400 for `/evidence/support/document-support/rfid-proof-preview.png` and 3 other previews, because the files do not exist (they were already missing at `5e162f70`).
  - `/generated/marketing/dispatch-command-center-hero-photo.png` returns 401 (no file, so the request falls through to the private `/api/bof-generated` handler).
  - `/_next/image` works for existing public images (200).
- **Round-1 minors m1 and m3 and round-2 m3 are unchanged and remain as documented.** Round-1 m4 also remains: the `(bof)` layout still ships the demo seed, now fictional.
  - My GET requests on six Recruiting V2 endpoints created no ComplianceGate rows (0 before and after), so round-1 m1 did not show up with these fixtures.

---

## What I verified (actual outputs)

### Tools
I wrote my own scanner (`scratchpad/rev3/tools/scan3.py`, `needles3.py`), independent of the author's and round 2's tools.

- **Needles:**
  - every `map.json` and `harvest.json` key, excluding the one DOB and its serial that map to themselves (1 January);
  - e-mail addresses;
  - phones as 10-digit runs, plus the 7-digit exchange-line forms;
  - full SSNs and 9-digit numbers;
  - licence IDs, and their 7+ digit cores;
  - DOBs in 14 text formats, plus MMDDYYYY / YYYYMMDD runs and Excel serials;
  - streets;
  - masked last-4 forms (`***-**-`, `xxx`, `•••`, `###`) checked against the SSN and account last-4 sets.
  - In `--short` mode, bare 4-digit SSN last-4 tokens and 5-digit DOB serials are also flagged.
- **Encodings and views for each file:**
  - UTF-8, Latin-1, UTF-16LE/BE (both byte offsets);
  - URL-decoded twice, HTML-entity-unescaped, `\uXXXX` and `\xXX` unescaped;
  - tag-stripped;
  - base64 `data:` URIs, gzip;
  - every ZIP member, recursively;
  - for PDFs: every `stream…endstream` (zlib-inflated), PDF literal-string unescaping (octal and `\(` `\)`), `TJ` string concatenation, hex strings (as Latin-1 and UTF-16BE), and `pdftotext` in both layout and raw mode;
  - for workbooks: an openpyxl walk of every cell on every sheet (date, int/float, string, numeric strings), plus a regex over raw `<v>` / `<t>` values with any namespace prefix (`x:`), including date-time fractions;
  - image metadata.
- **Digit matching:** digit runs are joined across up to 3 non-alphanumeric characters, and also across up to 8 spaces, dashes, dots, brackets or slashes. This catches spaced, boxed and dashed forms.
- **Positive control:**
  - I ran the scanner on files from `7b233ac4`: the round-1 report, the workbook, `fmcsa_clearinghouse.html`, and a pre-branch I-9.
  - It found the spaced full SSN, the SSN last-4 and the DOB serial in the old round-1 report, all 84 DOB serial cells (`dobserial-num` and `dobserial-xml`), the escaped phone in the old `fmcsa_clearinghouse.html`, and the I-9 originals.
  - So it detects every round-2 leak.

### 1. Round-2 findings
| ID | Status | Evidence |
|---|---|---|
| B1: originals in committed docs | **Fixed** | `docs/**` (96 tracked files), scanned in `--short` mode: 0 e-mails, phones, SSNs, IDs, DOBs, serials or ssn4 values. A separate partial-digit pass checked every digit run of 4 or more digits (spaced or dashed included) against every substring of length 5 to 8 of the original SSNs, phones and 9-digit numbers: 0 hits. It also checked every masked token (`#`, `*`, `•`, `x` mixed with digits): all are "mask-nonorig". The only 4-digit overlaps in `docs/security` are years, the port `3200`, `0100`/`0199` range text and fictional TIN suffixes. The only "hits" are the business-address example noted above. |
| B2: workbook DOBs | **Fixed** | 14 spreadsheets under `public/` and `data/`, all sheets and all cell types: 0 DOB date cells, 0 numeric, string or XML serials, 0 ssn4 cells. Every DOB-headed column (8 columns: `Driver Data`, `Master Driver Data` (header in row 3), `Import_DriverTemplates2` (namespaced, numeric), `Sheet1` of the template books) holds 1 January values only, whether stored as dates or integers. Anonymous `GET /data/main-source_enhanced_bof_aligned.xlsx` returns 200 and is byte-identical to the fixed repo file. The `data/audit-reports` JSON is clean. Remaining digit hits are noise: two `ssn4-xml` matches are a shared-string index and an Assets cost cell; "phone" matches are 16-digit date-time fractions and concatenated payroll numbers. |
| M1: `fmcsa_clearinghouse.html` | **Fixed** | DRV-001's file is now a 1-page HTML "withdrawn" notice. No file under `public/` has a PDF signature behind a non-`.pdf` name. The other 11 `fmcsa_clearinghouse.html` files and every served file are clean (see section 2). |
| m1: MSA page 3 | **Fixed** | Rendered at 110 dpi. "540 Demo Street, Mansfield, OH …" sits in its own box, with smaller type and no overlap. |
| m4: Recruiting V2 scope | **Fixed** | See below. |

**m4, live with real sessions on :3200:**
- **Fixtures:** I inserted 3 temporary candidates: tenant B with hand-off A; no tenant with hand-off A; tenant A as a control.
- **Results** across `activation`, `documents`, `interviews`, `offer`, `onboarding` and `qualification` (6 endpoints each):

  | Session | tenant B + hand-off A | no tenant + hand-off A | tenant A |
  |---|---|---|---|
  | `fleet-a-admin` | 404 ×6 | 404 ×6 | 200 ×6 |
  | `fleet-a-ops` | 404 ×6 | 404 ×6 | 200 ×6 |
  | `fleet-b-admin` | 200 ×6 | 404 ×6 | 404 ×6 |
  | `bof-operations` | 200 ×6 | 200 ×6 | 200 ×6 |

- **Code:** `candidateScopeWhere` now filters on `tenant.fleetId` only (`lib/recruiting-v2/candidate-access.ts:57`), and `candidateTenantFleetId` reads only `tenant` (`candidate-tenant.ts`). Activation POST is scoped through `requireRecruitingCandidateAccess` before it reaches the service.
- **Test suite:** `DATABASE_URL=…/bof_dev npm run test:recruiting-v2-tenancy` passes 9 of 9 (including 6b), and leaves 0 candidates and 0 fixture users behind.

### 2. Fresh end-to-end privacy sweep
| Scope | Result |
|---|---|
| All 3,956 tracked files at HEAD | **0 originals.** 0 e-mail, mapped-street, ID, DOB, full-SSN, 9-digit, serial or masked hits. The only other hits are 836 business-address matches (described above) and digit noise. I checked each noise hit in context: PDF xref offsets (`0000xxxxxx 00000 n` runs), font `/Widths` arrays, content-stream coordinates, image bytes, and workbook float or concatenated-number runs. In the policy PDFs that the digit stream flagged, the whole `pdftotext` digit stream contains none of the needles. |
| `.next/static` + `.next/server` (2,077 files) | **0 hits of any kind.** |
| Live anonymous HTTP: 1,957 seeds (every file under `public/`, URL-encoded, plus every `page.tsx` route), then link-following from HTML and RSC: 2,330 URLs (2,128 × 200, 170 × 307, 9 × 401, 12 × 404, 7 × 308, 4 × 400) | All **1,790/1,790** `public/` files returned 200. 1,133 HTML pages were fetched with their `RSC: 1` payloads (3,286 bodies scanned). **0 originals.** No HTML page or RSC payload had any hit. The only hits are the same noise files and the business addresses described above. |
| Visual check (110 dpi crops, inspected) | **12 W-9s:** name, address `NNN Demo Street`, TINs `900-00-0123`, `-0105`, `-0116`, `-0119`, `-0102`, `-0101`, `-0109`, `-0108`, `-0124`, `-0112`, `-0111`, `-0114`. **12 I-9s:** Section 1 shows Demo Street addresses, 1 January DOBs, SSN comb `***-**-01`, `@example.com` e-mails and `AAA-555-01NN` phones; Section 2 document numbers are zero-filled (`OHZZ000151`, `Z00000154`, …). **12 MCSA-5875s:** page 1 shows Demo Street, zero-filled licences, `555-01NN` phones and `@example.com` e-mails; the page 4 examiner blocks show Owens, Marshall, Reed and Brooks with `(614|312|404|214) 555-01NN`. **24 DQF and qualification files:** Section 1 values are all fictional, and each qualification-file page 1 is pixel-identical to its DQF summary. **4 DRV-001 medical / 5876 PDFs:** Demo Street, `OH0000075`, examiner `(614) 555-0107`. **70 regenerated card images** (24 CDL, 12 + 12 insurance, 22 medical): all labelled SAMPLE / FICTIONAL DEMO DATA, with no seals or insurer brands, and every value fictional (Demo Street, 1 January DOBs, zero-filled CDLs, `DEMO-TRK-NNN` policies). |

### 3. Gate regression
- **`npm run test:route-access`:** 7 of 7 pass.
- **Live anonymous probes (119).** No private content was reached:
  - **Extensions on private routes**, for example `/drivers/DRV-001.json`, `/drivers/DRV-001/bank-info.pdf`, `…/hr.css`, `/documents/vault/DRV-001.pdf`, `/emergency-contacts/x.png`, `/customers.txt`, `/portals/customer.js`, `/recruiting-v2/candidates/C1.json`, `/carriers/CAR-001/x.webp`, `/source-of-truth.ico`: **307** to sign-in.
  - **Encodings:** `%64rivers`, `%2564rivers`, `drivers%2F…`, `%5c`, `%00`, `%20`, `%2e`, the trailing `.`, the dotless `ı`, full-width `ｄ`, the zero-width space, `;x.json`, upper case, `/demo/../`, `/demo/%2e%2e/`, `/documents/%2e%2e/…`, `/data/../`, `/generated/../`, `/robots.txt/../drivers`, `/_next/../drivers`, `?x=.png`, `#.png`: **307**.
  - **Double slashes and backslash:** **308** to the canonical path, which is then gated.
  - **Paths under `/_next/static`:** `../`, `%2e%2e` and `..%2f` all return **404**.
  - **`/_next/data/x/drivers.json`:** 307.
- **APIs:**
  - `/api/drivers(.json)`, `/api/auth/../drivers`, `/api/auth/%2e%2e/drivers`, `/api/recruiting-v2/activation/X.json`, `/api/bof-generated/...`, `/generated/drivers/DRV-001/a.svg`: **401**.
  - `/api/auth/..%2fdrivers`: **400**.
- **Headers** on `/drivers/DRV-001/bank-info` all returned **307**: `RSC`, `Next-Router-Prefetch`, both forms of `x-middleware-subrequest`, `x-invoke-path`, `x-matched-path`, `Host` / `X-Forwarded-Host` spoofing (the callback stays relative), `x-nextjs-data`, `Next-Action`, garbage session cookies, `x-original-url`, `x-rewrite-url`, `X-HTTP-Method-Override`, `Purpose: prefetch`.
- **Methods:**
  - HEAD, OPTIONS, POST, PUT, DELETE and PATCH return 307 on pages and 401 on APIs.
  - TRACE returns 500 (informational).
- **`/_next/image`:** private pages, a private PNG, a vault PNG, `/generated` SVG, the `/api/bof-generated` URL, and absolute and `//` URLs all return **400**.
- **Public pages and files, anonymous:**
  - 23 of 23 sampled public pages and files return 200, including `/`, `/company`, `/contact`, `/blog`, `/assessment`, `/dashboard`, `/safety`, `/money-at-risk`, `/rf-actions`, `/settlements-v2`, `/dispatch-v2`, `/documents` (+3), `/customer-portal`, `/portals`, `/portals/manager`, `/business-operations`, `/bof-vault`, the workbook, the W-9, `/api/auth/providers`.
  - `/demo` returns 404 because no index page exists, which is expected.
  - The crawl reached 2,128 URLs with 200.
- **Signed in:**
  - Fleet A admin: `/dispatch`, `/carriers/CAR-001`, `/drivers/DRV-001/bank-info`, `/recruiting-v2` and `/command-center` return 200; `/contact-inquiries` returns 403.
  - BOF operations: all six return 200.

### 4. Build and recovered content
- **Type check:** `npx tsc --noEmit -p .` exits 0.
- **Recovered Business Operations content**, compared from `396d35fe` (recovery) to HEAD across all 42 `content/recovered-site/business-operations/*.json` files:
  - In 41 files, only an `ownerRemovals` field was added.
  - In the hub (`business-operations.json`), the HTML diff is exactly one removed line, the `<h2>` developer heading (recorded in `ownerRemovals`).
  - `public/recovered-assets/` and `components/recovered-site/` are unchanged.
  - `app/globals.css` gained one rule that makes `.reveal` sections visible.
  - The page component no longer prints commit and path provenance into public markup.
