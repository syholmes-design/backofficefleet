# Independent security review, round 2: commit 7b233ac4

- **Repository:** /home/user/bof-website-recovery
- **Branch:** `claude/website-recovery-20261018`, HEAD `7b233ac4`. The working tree is clean, and the same commit is on `origin`.
- **Reviewer:** one independent reviewer. I did not write this code and did not do round 1. Date: 2026-10-18.
- **What I tested:**
  - The production build on :3200. Its `.next/BUILD_ID` was written at 14:57. The last source change (`middleware.ts`, `route-access.ts`) was at 14:54, so the build matches this tree.
  - The local Postgres databases `bof_recovery` and `bof_dev`.
- **How I handled originals:** no original sensitive value appears in this report. Where one is involved, it is written as `[redacted]`, or digits are shown as `#`.

## Verdict: REJECT

The round-1 gate bypass (M1) is fixed, and I found no new bypass. The W-9 TIN leak (B1) is fixed, and every rebuilt PDF page I rendered shows fictional values only.

The privacy remediation is still incomplete, in three ways:

1. **This commit itself publishes an original full SSN**, an original SSN last-4 and an original DOB, in the committed "redacted" round-1 report. The commit is already on the public GitHub remote.
2. **The round-1 B2 class is not fixed.** The original DOBs of all 12 drivers are still in a publicly served workbook, stored as plain numbers rather than date cells. The author's "every spreadsheet date cell" check cannot see them.
3. **One original phone number is still served anonymously**, in `fmcsa_clearinghouse.html`.

The author's claim of "0 original values" in tracked files and in anonymous HTTP responses is therefore false.

---

## BLOCKER

### B1. The committed "redacted" round-1 report contains an original full SSN, an original SSN last-4 and an original DOB serial (public repo, already pushed)
- **File:** `docs/security/independent-security-review-1.md`
  - **Line 42:** the root-cause sentence quotes the W-9 comb-box glyphs "one glyph per word (`# # # - # # - # # # #`)". That digit string is DRV-001's original full SSN, written with spaces.
  - **Line 38:** "Map example: `ssn4` maps `[redacted]` to `0123`". The first value is an original SSN last-4, a key of `map.json["ssn4"]`.
  - **Line 52:** "The `dob_serial` keys (for example `[redacted]`)". That value is an original Excel DOB serial. It is a non-identity key of `map["dob_serial"]`.
- **Evidence:**
  - My scanner flagged the file. It joins digits that are separated by up to 3 non-alphanumeric characters, then matches against the `harvest.json` `ssn_full` values and the `map.json` keys.
  - A line-level re-check confirmed each value programmatically, without printing it: "FULL SSN (original) present" at line 42, "original SSN last-4 token present; maps to 0123" at line 38, and "original DOB serial present" at line 52.
  - `git ls-remote origin claude/website-recovery-20261018` returns `7b233ac49e3e…`, so the file is already on the public GitHub repo.
  - The file is not served by the website (`GET /docs/security/...` returns 307 to sign-in).
- **Why it was missed:** the author redacted only the bracketed values in the verdict list. The spaced comb-box form and the inline examples were not redacted, and the author's scanner did not match the spaced form in Markdown.
- **Fix:**
  - Replace the three values with `[redacted]` (or `9 0 0 - 0 0 - 0 1 N N`-style placeholders).
  - Run a spaced-digit scan (digits joined across separators) over `docs/`.
  - Because the commit is already public, add `7b233ac4` to the history-purge scope of round-1 B3.

### B2. Original DOBs of all 12 drivers are still in a public workbook, stored as plain numbers (round-1 B2 class, not fixed)
- **Where:**
  - **File:** `public/data/main-source_enhanced_bof_aligned.xlsx`
  - **Sheet:** "Import_DriverTemplates2" (98 rows × 132 columns)
  - **Column:** U, headed "DOB"
  - **Format:** the cells use number format `General`, so openpyxl returns `int`, not `datetime`.
- **Evidence:**
  - 84 cells across DRV-001 to DRV-012 (7 rows per driver) hold 12 distinct values. Each value is a non-identity key of `map["dob_serial"]`, which means it is an original DOB as an Excel serial. None of them is a 1 January date.
  - All 84 cells are byte-identical to the same cells at pre-branch `5e162f70`. The branch never touched them.
  - `GET /data/main-source_enhanced_bof_aligned.xlsx` returns 200 (209,925 bytes) anonymously, and the response is identical to the repo file.
  - Typing any of these numbers into a date-formatted cell gives the original DOB.
- **Not affected:** `main-source-v4_operational_elite_enhanced.xlsx` "Driver Data" has 14 numeric cells that match a serial. All 14 are the one value that maps to itself (an original 1 January DOB), so they are harmless.
- **Root cause:** the new check compares only `datetime` cells against the original DOBs. A DOB column holding numeric serials is invisible to it.
- **Fix:**
  - Rewrite every DOB-headed column whatever its cell type: `int`, `float`, a string such as `"[redacted]"`, or a date.
  - Extend the scan to numeric cells whose value is in `map["dob_serial"]`.
- **Mitigation, for context:** the author classifies the DOBs as synthetic (they are inconsistent across documents). However, round 1 rated exactly this as a blocker, and the remediation report claims it is fixed.

## MAJOR

### M1. An original phone number is still in a publicly served file (escaped PDF string)
- **File:** `public/generated/drivers/DRV-001/fmcsa_clearinghouse.html`. It is a PDF with an `.html` name, and the author calls it "corrupt". It is served as `text/html`: `GET` returns 200, 242,980 bytes, anonymously.
- **Evidence:**
  - An uncompressed content stream contains the text-show `(\(###\) ###-####) Tj`.
  - The number is a key of `map["phone"]`. It is not mapped to itself; it maps to `614-555-0107`, the examiner phone used in the rebuilt DRV-001 forms.
  - The 13 `Tj` strings in the file are: name, name, date, **[redacted phone]**, date, "Dr. Patricia Owens", examiner licence, registry number, CDL `OH#######`, `### Demo Street`, city, ZIP. The phone appears to be the medical examiner's phone.
  - Every other value in the file was rewritten. This one was missed because PDF string syntax escapes the parentheses (`\(`), so the author's `(AAA) BBB-CCCC` pattern does not match.
- **Impact:** a professional contact number (possibly a real practice), not driver identity data. It still contradicts the "0 original values publicly served (1,892 files)" claim.
- **Fix:**
  - Replace the string with the mapped value.
  - Add an escaped-parenthesis form, or a digits-only match, to the scanner.
  - Better: remove this unreadable file, or regenerate it.

## MINOR

- **m1. Spacing broken by the rebuild on MSA page 3.** In `public/generated/agreements/DAT-MSA-001/delta-advanced-trucking-master-services-agreement.pdf` page 3, the carrier address renders as "540 Demo St**Mans**field, OH 44595": the replacement text overlaps the original city. The W-9 requester block uses a different font for "540 Demo Street". Cosmetic only. (The overlapping DQF footer "Page 1 – Generated …" is identical at `5e162f70`, so it is pre-existing.)
- **m2. The remediation document overstates its verification.**
  - `docs/security/SECURITY-REMEDIATION-2026-10-18.md` says "0 original values remain" across tracked files and HTTP, and that a second review "checked the fixes".
  - Both statements were made before this review, and B1, B2 and M1 above contradict the first.
  - Correct the wording after the fixes.
- **m3. Static-root policy relies on a handler's own check.**
  - `lib/security/route-access.ts:121-126` treats any path with an extension under `/generated/` as a public static file.
  - `next.config.ts` then rewrites `/generated/:path*` (afterFiles) to the private `/api/bof-generated/:path*`.
  - Anonymous `GET /generated/drivers/DRV-001/a.svg` currently returns **401**, but only because `app/api/bof-generated/[...segments]/route.ts:15` checks the session itself.
  - Add `/generated` rewrite targets to the policy, or keep a test that pins the handler's check.
- **m4. Recruiting scope accepts either fleet field** (`lib/recruiting-v2/candidate-access.ts:57-60`).
  - The scope matches `tenant.fleetId` **or** `recruitingV2DriverHandoff.fleetId`.
  - A temporary candidate with tenant B and handoff A was readable by both Fleet A and Fleet B (6/6 endpoints 200 for each).
  - The API cannot produce this today, because activation enforces handoff = tenant.
  - Prefer `tenant.fleetId` when it is present.
- **Round-1 minors still open:**
  - m1: GET handlers upsert ComplianceGate rows.
  - m2: platform staff can activate a candidate with no recorded fleet into any fleet.
  - m3: role-list mismatch.
  - m4: the `(bof)` layout ships the whole demo seed to public pages.
  - The code is unchanged since `1f925173`. `git diff 1f925173 7b233ac4` touches only `middleware.ts` and the `route-access` files.
- **Informational:**
  - `public/customer-portal/runtime.js` has a dialable non-555 demo customer contact number (`214-###-####`) next to an `@pvfoods.example` address. It is not in the map, and it is business demo data.
  - One check-digit-valid VIN appears in the DRV-012 owner-operator lease (21 others are invalid). It is probably coincidence.
  - The DRV-001 MCSA-5876 and medical-card PDFs keep flattened handwriting-style signature images reading "Patricia Owens" and "John Carter", with "Digitally signed by … Date: 2026.04.17" stamps. These names are fictional; the owner should confirm that the handwriting is not anyone's real signature.

---

## What I verified (actual outputs)

### 1. Privacy

#### My own tools
These are independent of `verify_clean.py` and `raster2.py`, and are kept in `scratchpad/rev2/tools/`.
- **Needles:**
  - all `map.json` and `harvest.json` keys;
  - e-mail addresses;
  - phones in 5 formats, plus a digits-only stream;
  - full SSNs and 9-digit numbers;
  - licence IDs;
  - DOBs in 10 formats, plus MMDDYYYY/YYYYMMDD digit runs and Excel serials;
  - streets;
  - masked SSN/account last-4 patterns.
- **Coverage:**
  - raw bytes (UTF-8 and Latin-1);
  - XML inside ZIP files (raw and tag-stripped);
  - an openpyxl walk of every cell on every sheet (date **and** numeric);
  - `pdftotext` (layout and raw) and `pdfinfo -meta`;
  - pypdf recursive walk of all objects and streams, plus form-field values;
  - a raw zlib sweep of every `stream…endstream` in all 92 PDFs (967 streams, including orphaned objects);
  - PIL `info` and EXIF data of images.
- **Filtering:** results exclude the 1 DOB (and its serial) whose original is 1 January and maps to itself.
- **Positive control:** on `5e162f70`/`1f925173` copies, the scanner found the W-9 full SSN, 26 DOB cells and 13 DOB serials, plus I-9 originals. So it detects the round-1 leaks.

#### Results
| Scope | Result |
|---|---|
| All 3,955 tracked files at HEAD (30 min run) | Real hits: **B1** (review doc), **B2** (84 numeric DOB cells), **M1** (phone). The other hits were checked one by one and are noise or business data:<br>• 279 street hits are the 14 unmapped business addresses: BOL / rate-confirmation shippers, plus a bank address on settlement authorizations.<br>• The harvest-only phone matches are digit runs inside font width arrays, colour operators and image bytes.<br>• The one MMDDYYYY match comes from concatenated payroll numbers. |
| `.next/static` + `.next/server` (2,072 files) | 10 hits, all the identity-mapped 1 January DOB. **0 originals.** |
| Anonymous crawl from 137 seeds: 501 URLs fetched (365×200, 132×307, 3×401, 1×404), HTML and `RSC: 1` payloads, plus linked static files and JS chunks | Only real hit: **M1** (`fmcsa_clearinghouse.html`). The other hits are font-array noise, plus the identity DOB in chunk `6481-….js`. |
| Pattern sweep of 1,675 text files under public/lib/content/data | 0 consumer-domain e-mails. 0 valid-shape SSNs (after excluding 9xx/000/666). Non-555 phones: only the demo customer contact (informational). |
| Image and PDF metadata | The 70 cards have no text chunks or EXIF (61 have no info, 9 carry JFIF only). PDF Info holds only the title (the file name). |

#### Pixel-coverage proof (my own)
- **Method:**
  - For each of the 65 changed PDFs, I took the pre-branch vector file from `5e162f70`.
  - I located every original value in its `pdftotext -bbox` words. This includes values split into single-glyph boxes on one baseline, such as the W-9 TIN and the I-9 comb fields.
  - I rendered old and new pages at 100 dpi and measured the mean pixel difference inside each box.
- **Result:**
  - **672 boxes.** 669 changed; the lowest difference was 15.4, the W-9 TIN separator.
  - The 3 unchanged boxes are DRV-001's DOB on MCSA-5875 pages 2, 3 and 5. That original is already 1 January and maps to itself.
  - Every original identity value that was text in the old files is covered.

#### Visual inspection
I rendered every page below and looked at readable montage crops:
- **All 12 W-9s:**
  - Name, address and city are fictional (`NNN Demo Street`).
  - The TIN boxes read `900-00-0123` (DRV-001), `-0105`, `-0116`, `-0119`, `-0102`, `-0101`, `-0109`, `-0108`, `-0124`, `-0112`, `-0111`, `-0114`.
  - The requester block shows "540 Demo Street".
- **All 12 I-9s:**
  - Page 1 Section 1: Demo Street addresses; DOBs `01/01/YYYY` or `1/1/YYYY`; the SSN comb shows `***-**-01` on all 12; e-mails `@example.com`; phones `AAA-555-01NN`.
  - Section 2 document numbers are zero-filled: `OHZZ000151`, `Z00000154`, `GAZZ000028`, `Z00000001`, `OHZZ000152`, `TXZZ000168`, `Z00000029`, `OHZZ000153`, `Z00000169`, `ILZZ000070`, `Z00000071`, `ILZZ000069`.
  - Page 4 Supplement B document-number rows are blank.
- **All 12 MCSA-5875s:**
  - Page 1 personal block: Demo Street, `01/01/YYYY` DOBs, zero-filled licences (`OH0000075`, `IL0000041`, …), `555-01NN` phones, `@example.com` e-mails.
  - Headers on pages 2-5 (41 crops): fictional DOBs.
  - Examiner blocks on all 12: Owens / Marshall / Reed / Brooks, phones `(614|312|404|214) 555-01NN`, licences `XX-ME-######`, registry numbers `ME10000N`.
- **24 DQF summaries and qualification files** (page 1 Section 1): DOB, phone, e-mail and CDL are all fictional.
- **4 DRV-001 medical / MCSA-5876 PDFs:** Demo Street, `OH0000075`, and examiner Dr. Patricia Owens with `(614) 555-0107`.
- **MSA page 3:** the carrier address is replaced (see m1).
- **All 70 regenerated card images:** every card is labelled "SAMPLE / FICTIONAL DEMO DATA", with no seals or brands, and all values are fictional.
- **About 50 other public raster images:** document-support previews, road-test certificate, ELD and proof cards, POD receipt. None of them carries real identity data. The road-test certificate is a template ("SMITH, JOHN A.", `D123-456-789-012`).

### 2. Gate (round-1 M1): fixed, no new bypass found
- **Extensions on every private dynamic route:** 30 probes returned **307** to sign-in. Examples:
  - `/drivers/DRV-001/bank-info.json`, `/drivers/DRV-001/hr.pdf`
  - `/documents/vault/DRV-001.json`
  - `/carriers/CAR-001/x.json`, `/carriers/CAR-001.json`
  - `/maintenance/photos/a.jpg`
  - `/recruiting-v2/candidates/C1/documents/D.json`
  - `/portals/driver/DRV-001.json`
  - `/emergency-contacts/DRV-001.json`
- **Encoding and normalisation:** 57 probes, none of which reached a private page.
  - **307:** `%64rivers`, `%2564rivers`, `drivers%252F…`, `drivers%C0%AF`, `drivers%ff`, the zero-width space, full-width `ｄ`, `;jsessionid=1`, `DRV-001;x.json`, trailing `.`, `%00`, `%20`, upper case, `/documents/%2e%2e/drivers/x.json`, `/data/%2e%2e/carriers/CAR-001/x.json`, `/demo/../drivers`.
  - **404, not resolved by the router:** `/documents/..%2fcarriers/CAR-001/x.json`, `/demo/..%2f..%2fdrivers`, `/documents/..%5c…`, `/documents/VAULT/DRV-001.json`, `vault%2e`.
  - **308 to canonical, then gated:** backslash and `//` variants.
  - **API paths:** `/api/auth/..%2fdrivers` returns 400, and `/api/auth/%2e%2e/drivers` returns 401.
  - **Very long paths:** 8,000 characters returns 307; 3,000 segments returns 308.
- **Headers and methods:**
  - **307:** `RSC: 1`, `Next-Router-Prefetch`, `Next-Router-State-Tree`, `x-middleware-subrequest` (both forms), `x-invoke-path`, `x-matched-path`, `Host` and `X-Forwarded-*` spoofing (the redirect host stays `localhost:3200` and the callback is relative), garbage session cookies, and HEAD / OPTIONS / POST / PUT / DELETE on pages.
  - **Server actions:** the server-reference manifest has **0** actions; POST with a `Next-Action` header returns 307.
  - **`x-nextjs-data`:** 307.
  - **`/_next/data/x/drivers.json`:** 307.
  - **`/_next/image?url=`:** private pages, `/maintenance/photos/a.jpg` and the `/generated` SVG all return 400 "isn't a valid image". Absolute and `//` URLs are rejected.
  - **Sign-in `callbackUrl=https://evil.example`:** lands on `localhost:3200/`.
- **Public pages still work (anonymous):**
  - **200:** `/`, `/company`, `/contact`, `/blog`, `/assessment/*`, `/demo/*`, `/dashboard`, `/safety`, `/money-at-risk`, `/rf-actions`, `/settlements-v2`, `/dispatch-v2`, `/documents` and its 3 public sub-pages, `/customer-portal/*`, `/portals`, `/portals/manager`, `/business-operations` (+37 crawled detail pages), `/bof-vault`, `/government/*`.
  - **Static files 200:** W-9, workbook, CDL image, driver application.
  - **APIs:** `/api/auth/providers` 200. `POST /api/contact/inquiries` 422 and `POST /api/recruiting/apply` 400 (both reach validation); `GET` on either returns 401.
- **Private pages:**
  - Anonymous: `/customers`, `/portals/customer`, `/safety/training`, `/load-intake`, `/source-of-truth` return 307. Private APIs return 401.
  - Signed in: `/dispatch`, `/carriers/CAR-001` and `/drivers/DRV-001/bank-info` return 200. `/contact-inquiries` returns 403 for Fleet A admin and 200 for BOF operations.
  - `/drivers/DRV-001` returns 404 signed in: the page is DB-backed, `bof_recovery` has 0 Driver rows, and the file is unchanged by the branch.
- **`npm run test:route-access`:** 7 tests, 7 pass, 0 fail.

### 3. Recruiting V2 isolation: round-1 conclusions still hold
- **`DATABASE_URL=…/bof_dev npm run test:recruiting-v2-tenancy`:** 8 tests, 8 pass, 0 fail.
- **Live test setup:** I inserted temporary rows in `bof_recovery`:
  - `REV2-A` (tenant fleet-a)
  - `REV2-B` (tenant fleet-b)
  - `REV2-X` (tenant B, handoff A)
  - `REV2-N` (no fleet)
  - plus an unknown code
- **Results:** each cell is the result for the 6 endpoints qualification, documents, interviews, offer, onboarding and activation (GET).

  | User | A | B | X | N | unknown |
  |---|---|---|---|---|---|
  | fleet-a-admin | 200×6 | 404×6 | 200×6 | 404×6 | 404×6 |
  | fleet-a-ops | 200×6 | 404×6 | 200×6 | 404×6 | 404×6 |
  | fleet-b-admin | 404×6 | 200×6 | 200×6 | 404×6 | 404×6 |
  | bof-operations | 200×6 | 200×6 | 200×6 | 200×6 | 404×6 |
  | bof-compliance | 200×6 | 200×6 | 200×6 | 200×6 | 404×6 |

- **Cross-fleet writes by Fleet A on B:**
  - activation POST into Fleet A or Fleet B: 404
  - documents POST: 404
  - offer POST: 404
  - interviews POST: 400, the same body as for an unknown code
- **Database after the writes:** Driver, DocumentRecord, Interview and ComplianceGate counts stayed 0, and the candidate statuses were unchanged.
- **Clean-up:** all `rev2*` rows were deleted. Final counts in `bof_recovery`: Candidate 0, Position 0, ComplianceGate 0, Driver 0.

### 4. Regressions
- **`npx tsc --noEmit -p .`:** exit 0, no output.
- **Recovered content against `5e162f70`:**
  - The only HTML change is the deletion of `<h2>The dropdown choices are now visible on the page and lead to real operating pages.</h2>` in `business-operations.json`, which is recorded in `ownerRemovals`.
  - The other 41 files only gain `"ownerRemovals": []`.
- **Browser (Playwright):** `/`, `/business-operations`, `/business-operations/safety-sms`, `/demo/drivers`, `/documents`, `/customer-portal` and `/assessment` all return 200 with the correct h1. The Business Operations hub renders the recovered design.
  - One 404 sub-resource on `/`.
  - React hydration error #418 on `/demo/drivers` (also seen in round 1).
  - `/drivers/DRV-001` redirects to sign-in.

## Required before approval
1. Redact lines 38, 42 and 52 of `docs/security/independent-security-review-1.md`, and include `7b233ac4` in the history purge.
2. Rewrite the numeric DOB cells in `public/data/main-source_enhanced_bof_aligned.xlsx` "Import_DriverTemplates2"!U (and any other DOB column, whatever its cell type). Extend the scan to numeric serials.
3. Replace or remove the original phone in `public/generated/drivers/DRV-001/fmcsa_clearinghouse.html`. Add escaped-parenthesis and digits-only phone matching to the scanner.
4. Re-run the full scan, with the spaced-digit and numeric-cell checks, over the tree, `.next` and the anonymous crawl.
5. Correct the claims in the remediation document.
