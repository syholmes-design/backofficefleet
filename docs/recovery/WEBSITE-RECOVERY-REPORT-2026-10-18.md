# BOF Website Recovery and Platform Integration: Report (2026-10-18)

| | |
|---|---|
| Branch | `claude/website-recovery-20261018` (new; created from `origin/release/web-004-005-prep` @ `244d6928`) |
| Worktree used | separate worktree; no existing worktree or branch was reset, deleted, overwritten or merged |
| Production | **not deployed, not modified**; no production or Preview database was touched |
| Local preview DB | isolated local Postgres database `bof_recovery` (test data only) |

This was an independent recovery. Earlier conclusions, including Cursor's "recovered fork" and the current Next.js "Recovered …" pages, were checked against Git history rather than accepted.

## Summary

1. **BOF's original Business Operations content was not preserved on the current site.**
   - Current state (before this branch): `app/(marketing)/business-operations/` had 11 short, newly written card pages (104–308 words each).
     - Each page carried a "Recovered … / Data boundary" disclaimer.
     - They had none of the original tables, workflows, KPIs, interactive workspaces or policy links.
     - 26 of the 35 original Business Operations URLs did not exist at all.
   - Cursor's recovered fork (`recovered/fork-restored-20260819/`) is not the original either. It holds 7 Business Operations pages: a later, templated rewrite (August 2026) with generic steps.
2. **The original exists in Git history:** the static `Website/` site, best preserved at `66929e67` (2026-07-29). The richest single hub page is at `46b2c464` (2026-07-01).
3. This branch restores **all 35 original Business Operations pages verbatim** from history.
   - Each page records its source commit and path.
   - 10 sections that later versions dropped are merged back.
   - 2 fork-only pages are kept, and 5 earlier versions are kept as unlinked archive pages for the owner to choose between.
   - Images, policy PDFs and the interactive workspaces (HR, recruiting, finance, pay-profile workbench) work again.
4. **Platform connection.**
   - The Driver Onboarding, Driver Compliance Documents and Dispatch Assignment cards now link to existing BOF capabilities only: a public demonstration with synthetic data, plus a sign-in path to the live, tenant-scoped workspace.
   - No new operational system, database or authentication path was created.
5. **Acquisition path.** An assessment result can now reach BOF:
   - "Send these results to BOF" pre-fills the existing contact form.
   - The form saves through the existing `ContactInquiry` API.
   - Before this change, assessment results never left the browser.
6. **Security fix.** A reflected XSS on `/book-assessment` (confirmed in a browser) is fixed.
7. **Pre-existing privacy and authorization findings need owner decisions** (section F). They were not introduced by this branch, and they are the main reason the recommendation in section G is "do not release to production yet".

## Contents

- [A. Historical recovery inventory](#a-historical-recovery-inventory)
- [B. Website connectivity matrix](#b-website-connectivity-matrix)
- [C. Recovery comparison](#c-recovery-comparison)
- [D. Working local preview](#d-working-local-preview)
- [E. Browser evidence](#e-browser-evidence)
- [F. Outstanding issues](#f-outstanding-issues)
- [G. Release recommendation](#g-release-recommendation)
- [Independent review](#independent-review)

---

## A. Historical recovery inventory

Full inventories (read-only forensic analysis of every branch and commit available on GitHub):

- [`inventory/A1-business-operations-inventory.md`](inventory/A1-business-operations-inventory.md): every Business Operations page across three generations, section by section, with commits, assets, interactive features and outbound links.
- [`inventory/A2-site-inventory-other-areas.md`](inventory/A2-site-inventory-other-areas.md): homepage, fleet operations, dispatch, drivers/DQF, documents, safety, customer portal, BOF Vault, assessments, interactive and animated demos, aggregators, sectors, company and contact.
- [`inventory/A3-platform-map.md`](inventory/A3-platform-map.md): the operating platform's routes, authentication model and DEMO/LIVE classification. Personal-looking sample values are redacted.
- [`business-operations-recovery-report.md`](business-operations-recovery-report.md): generated per page. It covers source commit and path, merged sections, copied assets and how each historical link was resolved.

### Generations found

| Generation | Location | Date / commit | Business Operations pages | Verdict |
|---|---|---|---|---|
| 1. Original static site | `Website/business-operations/**` | 2026-06-19 → 2026-07-29 (`46b2c464`, `f254f4e3`, `db03d3be`, `0db8b768`, `66929e67`) | 35 | **Authoritative substantive version.** Restored. |
| 2. Recovered fork | `recovered/fork-restored-20260819/business-operations/**` | merged `e901e6cb` 2026-08-19 | 7 | Later templated rewrite. 2 unique pages kept; 3 kept as archive. |
| 3. Next.js marketing | `app/(marketing)/business-operations/**` | `244d6928` | 11 | Generic replacement. Removed by this branch; still in Git history. |

### Items referenced by the assignment that do not exist on GitHub

- `.cursor/rules/BOF-PRESERVE-APPROVED-WORK.mdc` is absent from every commit on every branch.
- `recovered/fork-reconstruction-20260819/` is absent from every commit on every branch.
- `public/generated/marketing/dispatch-command-center-hero-photo.png` is referenced by `components/dispatch/DispatchBoardScreen.tsx` but was never committed.

All three are either local-only on the owner's machine or were never created. If they exist locally, they should be committed so they are preserved.

### Areas inventoried but not restored on this branch

These are listed with their best historical source in A2. Restoring them is proposed follow-up work (section F).

- the homepage (audience → workflow → demo wiring at `4a43cdac`)
- the Dispatch, Drivers and Safety explainer pages (`7333dacf`, only on `origin/broad-product-redesign`)
- the Documents explainer (`db03d3be`)
- interactive and animated demos with narration (fork assets: 27 mp3, 6 mp4)
- the aggregator, fleet-operator and private-fleet pilot offers
- the 5-path assessment with scoring rubric (`f48bef67`)
- the book-demo working-session page

---

## B. Website connectivity matrix

### Visitor journey (as built)

```
Homepage
 └─ header "Business Operations" dropdown (10 entries), or the homepage service links
     └─ /business-operations (hub: command center, tiers, lifecycle, directory of every area)
         ├─ second level: HR Tier, Driver Onboarding, Document Management, Document & Records Control,
         │   Operational Reporting, Customer Billing, Accounts Receivable, Payroll Administration,
         │   Accounting & Finance, plus 14 functional-area pages (Accounting, ERP, Excise Taxes, …)
         │    └─ third level: Assignment Readiness, Records Control, Owner Queue Reporting,
         │        Billing Packet Control, Billing & AR Control, Aging & Dispute Control,
         │        Pay Exception Control, AP & Vendor Control, Cash-Flow Review, and HR Tier
         │        Recruiting & Onboarding, Compensation & Benefits, Talent Management, Employee Relations
         └─ "In the BOF platform" capability cards
              ├─ Demonstration (synthetic, no sign-in)  ─┐
              └─ Sign in → live tenant-scoped workspace   ├─ /book-assessment → /assessment/<track>
                                                         │     → results → "Send these results to BOF"
                                                         └─ /contact (pre-filled) → saved ContactInquiry
```

### The three required capability connections

| Card | Public demonstration | Live workspace (sign-in) | Verified |
|---|---|---|---|
| Driver Onboarding | `/business-operations/hr-tier/recruiting-onboarding`: the recovered recruiting and onboarding workspace with sample candidates (interactive filters and candidate preview) | `/api/auth/signin?callbackUrl=/recruiting` → `/recruiting` (redirects anonymous visitors to sign-in; scoped to the user) | Sign-in lands on "Recruiting requisitions" |
| Driver Compliance Documents | `/documents`: Operations File Cabinet (sample documents) | `/api/auth/signin?callbackUrl=/drivers` → `/drivers` | Sign-in lands on the driver roster |
| Dispatch Assignment | `/demo/dispatch`: DEMO dispatch board | `/api/auth/signin?callbackUrl=/dispatch` → `/dispatch` | Sign-in lands on "Dispatch board" |

`/recruiting-v2` was considered for the onboarding demonstration and rejected. It labels itself an "isolated development namespace", and anonymous visitors see "Authoritative candidate state could not be loaded".

### Final matrix (anonymous visitor, real browser)

The full table is in [`B-connectivity-matrix-table.md`](B-connectivity-matrix-table.md). Its columns are: Source page | Link label | Destination | State | Current behavior | Required correction.

- Run: 338 distinct links from every public marketing page, the recovered pages and the assessment family, each opened in Chromium as an anonymous visitor.
- Results: **330 OK, 0 broken, 0 dead ends, 8 PRIVACY.** (Re-run after the review fixes.)

| State | Rows | Detail |
|---|---|---|
| PRIVACY | 4 | Links into `/demo/drivers`, from the homepage (2) and from the recovered Driver Onboarding and Assignment Readiness pages. The demo roster shows 12 e-mail addresses, two at real consumer domains (`yahoo.com`, `hotmail.com`). |
| PRIVACY | 4 | `/aggregators` next-action links into `/carriers/CAR-00x`. Each shows one carrier contact e-mail on a fictional domain with a 555 phone number. |

The privacy rows are pre-existing demo data. The decision is in section F, item 1.

### Baseline problems found and corrected

From the crawl before any change (`244d6928`):

| Problem | Correction |
|---|---|
| Business Operations hub and children were generic cards; 26 of 35 original URLs returned 404 | All 35 original routes restored (37 public plus 5 archive routes) |
| `/business-operations/document-management`, `/accounts-receivable`, `/hr-tier` and the 14 functional-area pages were missing | Restored and linked from the hub and the header dropdown |
| Fork-only pages (`document-records-control`, `billing-ar-control`) were not linked from their July parent pages | "Related Business Operations pages" navigation added in both directions |
| Marketing links sent anonymous visitors to live-only pages that showed an empty "requires a LIVE fleet session" notice (`/command-center`, `/dispatch`, `/settlements`, `/pretrip/L009`, `/loads/L001/readiness-summary`) | Repointed to `/demo/*` or to a sign-in path with the right callback (`lib/marketing-runtime-links.ts` and 7 components) |
| Header "Driver Vault" → `/documents/vault` exposed realistic driver records to anonymous visitors | Removed from the public navigation (the page itself is item F1) |
| `lib/canonical-page-registry.ts` listed Business Operations children that did not exist | Now lists the 9 real second-level routes |
| `/book-assessment?sector=` reflected unescaped input into a script (XSS) | Server-side `redirect()` with a sector allowlist |
| Assessment results were never submitted anywhere | "Send these results to BOF" → pre-filled `/contact` → saved `ContactInquiry` |

---

## C. Recovery comparison

Word counts are visible `<main>` words measured in the browser. "Before" is `244d6928`; "not present" means the route returned 404. "Recovered" includes the platform capability section where one applies.

| Route (under `/business-operations`) | Before | Recovered | Source | Interactivity restored |
|---|---|---|---|---|
| (hub) | 308 | 1,980 | `66929e67` plus dropped sections from `f254f4e3` and `db03d3be` | directory of every area |
| `/hr-tier` | not present | 859 | `66929e67` | HR workspace: filters and case preview |
| `/driver-onboarding` | 176 | 418 | `66929e67` plus `f254f4e3` section | — |
| `/document-management` | not present | 291 | `66929e67` plus `f254f4e3` section | — |
| `/document-records-control` | 147 | 506 | fork `e901e6cb` (fork-only page) | — |
| `/operational-reporting` | 113 | 249 | `66929e67` plus `f254f4e3` section | — |
| `/customer-billing` | 112 | 196 | `66929e67` plus `f254f4e3` section | — |
| `/accounts-receivable` | not present | 200 | `66929e67` plus `f254f4e3` section | — |
| `/payroll-administration` | 104 | 936 | `66929e67` plus `f254f4e3` section | driver pay-profile workbench |
| `/accounting-finance` | 133 | 1,013 | `66929e67` plus `f254f4e3` section | finance workspace filters, packet preview, pay bridge |
| `/human-resources`, `/payroll`, `/accounting`, `/erp`, `/excise-taxes`, `/cash-flow`, `/safety-sms`, `/fleet-maintenance`, `/fuel-management`, `/insurance`, `/legal-contracts`, `/operating-authority`, `/owner-operator`, `/technology` | not present | 160–505 each | `66929e67` | regulatory tables, numbered workflows, policy PDF links |
| `/driver-onboarding/assignment-readiness` | 107 | 220 | `66929e67` | — |
| `/hr-tier/recruiting-onboarding` | not present | 481 | `66929e67` | recruiting pipeline filters and candidate preview |
| `/hr-tier/compensation-benefits` | not present | 458 | `66929e67` | pay-profile benefit cards |
| `/hr-tier/talent-management` | not present | 337 | `66929e67` | training and retention grid |
| `/hr-tier/employee-relations` | not present | 168 | `66929e67` | — |
| `/customer-billing/billing-ar-control` | existed | 390 | fork `e901e6cb` (fork-only page) | — |
| 7 other third-level pages | 2 existed, 5 not present | 107–199 | `66929e67` | — |

### Screenshots

In `evidence/screenshots/`:

- `historical/`: hub at `46b2c464`, `66929e67`, the fork, and current-before; Assignment Readiness static vs fork; Document Management static.
- `before/`: the 11 pre-change pages and the homepage.
- `after/`: hub, HR Tier, Assignment Readiness, Document & Records Control.
- `mobile/`: six recovered pages at 390 px.

### Remaining differences from the historical pages (by design)

- The site header, footer and fonts are the current Next.js ones. Historical page chrome (`site.js`, old logo) was not restored. The historical stylesheet is scoped under `.bof-legacy` so that it cannot affect the rest of the site.
- Historical links to pages that no longer exist were mapped to the closest existing route. The full mapping is in `business-operations-recovery-report.md`, and examples are below.

  | Historical link | Current route |
  |---|---|
  | `/scenario-walkthrough` | `/book-assessment` |
  | `/book-demo` | `/contact` |
  | `/command-center` | `/demo/command-center` |
  | `/drivers/compliance-documents` | `/documents` |

- The pay-profile widgets read the historical static dataset (`/recovered-assets/static-20260729/assets/data/…`). They do not read the platform database, by design: a public page must not read tenant data.
- Third-level static pages are short in the original (about 110 words). The longer fork versions of 3 of them are kept as unlinked, `noindex` archive pages under `/business-operations/archive/…` for the owner to choose between.

### Owner content decisions (nothing was invented)

1. The hub's restored `f254f4e3` section heading, "The dropdown choices are now visible on the page and lead to real operating pages.", reads as a development note. Keep, reword or drop?
2. The historical tile labelled "1040 Filed" should almost certainly read Form 2290 (heavy-vehicle use tax). It is restored verbatim; correction needs approval.
3. Choose between the July pages and the August fork archives for Assignment Readiness, Owner Queue Reporting and Pay Exception Control. Also decide whether the 2026-07-01 "Business Operations Center" hub, the richest single page, should replace or supplement the current hub.

---

## D. Working local preview

From the recovery worktree, with a local Postgres:

```bash
pg_ctlcluster 16 main start          # local Postgres 16, role bof/bof
export DATABASE_URL=postgresql://bof:bof@127.0.0.1:5432/bof_recovery   # isolated local DB, never Preview/production
export AUTH_SECRET="$(openssl rand -hex 32)"   # any local random value
export AUTH_TRUST_HOST=true
npx prisma migrate deploy            # only against the local bof_recovery DB
npx next build
npx next start -p 3200
# open http://localhost:3200/business-operations
# use "localhost", not 127.0.0.1: Auth.js CSRF checks the host.
```

To regenerate the recovered content from Git history (deterministic; reads commits with `git show`):

```bash
python3 scripts/recovery/recover_business_operations.py   # pages, assets, recovery report
node scripts/recovery/scope-recovered-css.mjs              # scoped historical CSS
```

### Implementation (no new systems)

- `app/(marketing)/business-operations/[[...slug]]/page.tsx` is one statically generated route built from `content/recovered-site/business-operations/manifest.json`. `dynamicParams = false` means unknown slugs return 404.
- `components/recovered-site/PlatformCapabilityLinks.tsx` holds the three capability cards. Their destinations are existing routes only.
- `components/recovered-site/RecoveredPageScripts.tsx` runs the recovered widget scripts after mount and removes them on navigation.
- The recovered HTML is repository content, not user input. It is rendered as-is and has no access to sessions or tenant data.

---

## E. Browser evidence

All checks ran in real Chromium (Playwright) against the production build on `localhost:3200`. They used isolated test data only: test inquiries go to `@example.test` addresses in the local `bof_recovery` database, and nothing was sent by e-mail.

**[`evidence/verify-results.json`](evidence/verify-results.json): 87/87 checks passed.**

| Group | What was exercised |
|---|---|
| Header navigation (desktop) | Every dropdown opens; every item of Sectors, What We Do, Business Operations (10), Documents and More lands on a substantive page |
| Mobile | Menu toggle; Business Operations items reachable; HR Tier opens from the mobile menu; 6 recovered pages fit 390 px with no horizontal scroll |
| Business Operations hub | Every in-content link to a Business Operations page and every capability link returns a substantive page |
| Capability cards | For each of the three cards: the demo lands on the expected route, shows no contact or ID data, and shows no error or "LIVE session" notice; the sign-in path shows the sign-in form with the correct callback |
| Assessment → inquiry | `/book-assessment?sector=private-fleet` → Private Fleets track → completed → results → "Send these results to BOF" → contact form pre-filled with track, score and risks → submitted → API 201 `saved: true` → row present in the local `ContactInquiry` table |
| Security | `/book-assessment` no longer executes an injected script |

Additional runs:

- **Sign-in through each card** with a local seeded test user lands on `/recruiting` ("Recruiting requisitions"), `/drivers` and `/dispatch` ("Dispatch board").
- **Widgets:** the pay workbench renders; HR filter 6→1, recruiting filter 6→1 and finance filter 5→2; no page errors.
- **Full crawl:**
  - All 37 public recovered routes return 200, with no broken images and no unresolved historical links.
  - Archive routes are not linked publicly.
  - 401 responses appear only for `/generated/*` images inside signed-in app pages, which is expected.
- **Static checks:** `tsc --noEmit` and eslint are clean, and `next build` succeeds.
- **Repository test suites, run on a fresh local `bof_dev`:** all pass.

  | Suite | Tests |
  |---|---|
  | provision-operator | 14 |
  | secure-pickup | 35 |
  | fmcsa-verification | 23 |
  | samba-intelligence | 21 |
  | unified-integration | 18 |
  | training-authorization | 22 |

- `evidence/screenshots/inquiry-confirmation.jpg` shows the confirmation after a real submission.

### Not possible from this environment

- Vercel Preview URLs are unreachable from this sandbox, and GitHub Actions is blocked by a billing lock, so the evidence is local-build only.
- The owner should repeat the key journey on the branch's Vercel Preview before any release decision.

---

## F. Outstanding issues

### Needs an owner decision before any production release

These are pre-existing and were not introduced by this branch.

1. **Realistic driver personal data reachable without sign-in.**
   - `/demo/drivers` shows driver e-mails, two at real consumer domains.
   - `/drivers/[id]/{profile,hr,bank-info,vault}`, `/documents/vault` and `/emergency-contacts` render the demo seed (`lib/demo-data.json`), which includes non-555 phone numbers, home addresses and emergency contacts.
   - World-readable files under `public/documents/drivers/*` include a date of birth, a partial SSN and a full bank routing number.
   - Even if all of it is fictional, it is indistinguishable from real PII. **Proposal:** de-identify the seed with 555 numbers, `example.test` addresses and obviously fictional IDs, and remove bank and ID documents from `public/`. This changes demo data that other pages depend on, so it needs approval.
2. **No route protection for the operating app.**
   - There is no `middleware.ts`, and `app/(bof)/layout.tsx` has no auth guard.
   - Each page decides for itself; most "LIVE" pages degrade to an empty notice rather than redirecting.
   - **Proposal:** a guard on the live route prefixes that redirects to `/api/auth/signin?callbackUrl=…`. The `/demo/*` routes stay public.
3. **Recruiting V2 APIs check only that a session exists.** There is no fleet or role scoping, so any signed-in user of any tenant can read any candidate. This is a tenant-isolation gap. **Proposal:** scope by fleet membership, using the same helper as the operator APIs.
4. **Inquiry notifications.**
   - Contact inquiries are saved but no one is e-mailed (`emailed: false`).
   - `/apply` and the careers form do not reach BOF staff in a reviewable queue.
   - Outbound e-mail is intentionally disabled per the standing instruction. The owner decides when and how notifications are turned on.

### Content and assets

5. The dispatch demo hero image `/generated/marketing/dispatch-command-center-hero-photo.png` was never committed. `public/generated/marketing/dispatch-command-center-hero.png` exists. Either supply the photo or approve using the existing image.
6. The local-only items listed in section A (`.cursor/rules/BOF-PRESERVE-APPROVED-WORK.mdc`, `recovered/fork-reconstruction-20260819/`) should be committed if they exist.
7. Owner content decisions C-1 to C-3 (development-note heading, "1040 Filed" tile, archive choices).
8. `/aggregators` next-action links go to `/carriers/CAR-00x`. These come from the shared `lib/carrier-dispatch-gates.ts`, which this branch left unchanged.
9. Other areas are inventoried but not restored on this branch: homepage, Dispatch/Drivers/Safety/Documents explainers, demos with narration, pilot offers and the scored assessment (A2). **Proposal:** restore them with the same verbatim, provenance-tracked method, one area per review.
10. Unused marketing components remain (for example `MarketingHomeIntegratedHero`). They are harmless; remove after the homepage decision.
11. About 6.6 MB of recovered assets are added under `public/recovered-assets/`; the scoped stylesheet for 2026-07-29 is about 1 MB. This is acceptable, but the stylesheet could be pruned to the selectors the recovered pages actually use.

---

## G. Release recommendation

**Do not release to production yet. The branch is ready for owner review on a Vercel Preview.**

- The recovery itself is in a reviewable state.
  - The substantive Business Operations site is back, verbatim and with provenance.
  - It is connected to existing platform capabilities through demo and sign-in paths.
  - It passes 87/87 browser checks, the full crawl, typecheck, lint, build and the repository suites.
  - It introduces no new data exposure, and it fixes one XSS.
- Production release should wait for:
  1. The owner's review of the restored pages on Preview, including the content decisions in C.
  2. A decision on F-1 (public demo PII). Public pages now link visitors into the platform demos more prominently, so the demo data should be de-identified first.
  3. Ideally F-2 and F-3. Neither is caused by this branch, but both are tenant-isolation risks in the same journey.
- After approval, merge through a normal pull request to the release branch. Nothing has been merged or deployed by this work.

---

## Independent review

See [`independent-review.md`](independent-review.md).

This was **one** separate review, by a separate agent that did not write the code. It is not six reviews. No claim of multiple independent approvals is made.

### How the review findings were handled

| ID | Finding | Resolution |
|---|---|---|
| M1 | Hub H2 reads as a development note | **Owner decision** (C-1). Left verbatim, because rewording it would misrepresent recovered text. |
| M2 | Widget section headings invisible on 3 pages | **Fixed.** A scoped `.bof-legacy .reveal` override in `app/globals.css`. The three headings were confirmed visible (opacity 1) in the browser. |
| m1 | Committed `.pyc` | **Fixed.** Removed, and `__pycache__/` added to `.gitignore`. |
| m2 | Remaining links to live-only pages | **Fixed.** `/loads*` now goes to `/demo/loads`, and `/dispatch?view=exceptions` and the body links to `/dispatch` and `/command-center` go to their `/demo/*` versions. `/drivers` and `/dispatch/intake` now go to sign-in with the matching callback. `/drivers` is not sent to `/demo/drivers` because of F-1. |
| m3 | "Live" labels on demo destinations | **Fixed.** Product cards now read "(demonstration)", "(sign in)" and "Sample driver documents". The driver-experience buttons now read "Sign in to pre-trip" and "View sample driver documents". |
| m4 | About 1 MB scoped CSS, render-blocking, `max-age=0` | **Open** (F-11). It is 136 KB gzipped. Pruning and cache headers are proposed follow-up work. |
| m5 | Recovered stylesheet and widget globals persist after client-side navigation | **Accepted.** The stylesheet is scoped under `.bof-legacy`, so it has no effect on other pages, and the widget globals are inert without their mount points. |
| m6 | Empty score pre-fills "Score: 0%" | **Fixed.** An empty score is now treated as absent; checked in the browser. |
| — | Archive banner and `data-recovered-source` expose commit hashes | **Accepted.** Archive pages are unlinked and `noindex`, and the hashes are provenance for owner review. They can be removed at release if preferred. |
