# Independent review: BOF website recovery (branch claude/website-recovery-20261018)

Reviewer: independent senior reviewer (architecture, security, QA, content fidelity). Read-only; nothing in the repo was modified.

**What was reviewed.** The worktree changed while the review ran. The author committed **396d35fe** ("Recover BOF's original Business Operations site…") on top of 244d6928. `PlatformCapabilityLinks.tsx` was also edited at 09:29, and the server was rebuilt at 09:34. All findings below are against the final committed tree (`git status` clean) and the rebuilt `next start` on :3200.

Evidence files are in `/tmp/claude-0/-home-user-backofficefleet/f2d190cb-fa07-527f-b5b6-befa3674540a/scratchpad/recovery/review/`: scripts `fidelity.py`, `pw*.mjs`, raw results `pw-results.json`, and the screenshots.

## Verdict: **approve with conditions**

There are no blockers. The recovered content is faithful, and the security fixes hold under testing. Two MAJOR issues are visible on public pages and should be fixed before release (conditions 1–2). Condition 3 is a one-line hygiene fix.

### Conditions
1. **Hub headline is dev-facing.** Decide what to do with, or drop, the merged f254f4e3 section whose H2 is a changelog sentence (M1).
2. **Widget section headings are invisible** on 3 pages (M2).
3. **A compiled `.pyc` is committed.** Remove `scripts/recovery/__pycache__/…pyc` and add `__pycache__/` to `.gitignore` (m1).

---

## A. Content fidelity — PASS (with one content concern)

**Method.** For all 42 recovered pages (not just 8), I compared the word sequence of the historical `<main>` (`git show <commit>:<path>`) with the committed JSON `html` using `fidelity.py` and difflib.

- **Removed words: 0 on every page.** No source section was lost.
- **Added words:** these appear only on the 8 second-level pages and the hub. Every added chunk was traced to the cited donor commit (f254f4e3 or db03d3be). The two "unexplained" hits were difflib alignment artifacts at section boundaries; I verified them by prefix match in `fid2.py`.
- **No paraphrase or invented text** in the recovered markup. The 37 public and 5 archive pages are verbatim. Only `href`/`src` were rewritten, and those changes are documented in the link-resolution table.
- **Placement.** Merged sections go before the last section. On the hub that last section is `business-operations-final-cta`, which is sensible. On `/accounts-receivable` the last section is a third-level link card, not a CTA, which is still acceptable.
- **Pages spot-checked in the browser:**
  - hub
  - hr-tier
  - hr-tier/recruiting-onboarding (third level)
  - payroll (functional area)
  - payroll-administration
  - accounting-finance
  - document-records-control (fork)
  - customer-billing/billing-ar-control (fork)
  - archive/command-center-2026-07-01 and archive/business-office-2026-08-19

  Each renders exactly one H1, with no broken images and no missing alt text.

**M1 (MAJOR, content). The hub shows a developer changelog sentence as an H2.** The merge rule `only=["The dropdown choices are now visible"]` deliberately brings in a section whose heading is:

> "BUSINESS OPERATIONS DIRECTORY — **The dropdown choices are now visible on the page and lead to real operating pages.**"

It is verbatim from f254f4e3, but it reads as an internal release note on the main public hub. See `hub-merged-directory.png`. The cards below it are useful. Either drop this section, or have the owner explicitly accept the headline. Rewording it would break the "verbatim" claim, so it needs an explicit owner decision.

**Other meta text (MINOR):**
- **Archive banner** (`page.tsx`): "Archived historical version, kept for owner review and not linked from the public site. Source: `e901e6cb` …". It is publicly reachable (noindex) and shows commit hashes and internal workflow.
- **`data-recovered-source` on every public recovered page.** Each page carries `"<commit>:<path>"` in a DOM attribute. That is harmless, but it leaks repository structure.
- **Pay workbench wording.** The widget (payroll-administration) says "These baked-in demo records…" and offers editable pay-profile forms plus a "Reset local edits" button. This is verbatim from history and labelled demo, but it is an odd public surface.

## B. Security — PASS

**Recovered HTML (`dangerouslySetInnerHTML`)**
- The source is repo JSON generated at build time, so no user input reaches it.
- A scan of all 42 `html` strings found no `<script>`, `on*=` handlers, `javascript:`, iframes, forms, inputs or absolute external URLs.

**Script execution (`RecoveredPageScripts.tsx`)**
- Inline code comes from repo JSON. The widget `src` values are fixed `/recovered-assets/static-20260729/assets/js/*` paths, and no request data reaches either.
- The widget JS escapes every data value (`esc()`) before `innerHTML`.
- `bof-data-loader.js` keeps a Supabase branch, but it only fires if `window.BOFSupabaseConfig.enabled`. That config script is deliberately excluded, so the fetch is always local.
- Playwright recorded **zero external network requests** on all recovered pages.

**CSS scoping**
- Nav and footer computed styles on 11 recovered pages were identical to `/company` (font, colour, background, size, padding). Only y-positions changed (`pw2.mjs`).
- Scoped sheets contain no global `@font-face`, `@import` or `@property`.
- Their keyframe names do not collide with `globals.css`.

**Contact pre-fill**
- Track lookup is allowlisted, the score must be numeric, the category is from a fixed set, and risks are stripped to `[\w\s&/,().'-]` and capped at 8×80.
- Payloads tried in `category` and `risks`: `<script>`, `</textarea><img onerror>`, `javascript:` and entity-encoded tags. All were neutralised and rendered as escaped textarea text.
- Unknown or `__proto__` track values give an empty textarea.

**/book-assessment**
- The reflected XSS is fixed. The redirect is now a server-side 307 to `/assessment` with an allowlisted sector.
- `sector=//evil.com` goes to `/assessment`, so there is no open redirect.
- `callbackUrl` values in the capability links are constants.

**PII exposure.** Newly linked targets are `/documents`, `/documents/company-operations-vault` and the recovered demo dataset (`bof-public-operations.json`). They hold synthetic names only, with no emails, phones or SSNs. `/documents/vault`, which has driver DQF records, is no longer linked from the nav.

## C. Navigation and connectivity — PASS

- **Links and assets.** All 77 unique same-origin links and assets in recovered pages return 200. The one exception is `/book-assessment`, which returns 307 to `/assessment` as designed.
- **Unknown slugs** return 404 (`dynamicParams=false`).
- **Dropdown items** (HR Tier, Document Management, Accounts Receivable, Company Operations Vault, and the rest) all return 200.
- **Archive pages** carry `<meta name="robots" content="noindex, nofollow">`. No recovered page, nav or app code links to `/business-operations/archive/*`, and there is no sitemap.
- **Capability links (final version):**
  - Onboarding demo → `/business-operations/hr-tier/recruiting-onboarding`
  - Documents → `/documents`
  - Dispatch → `/demo/dispatch`
  - Sign-in links → `/api/auth/signin?callbackUrl=…`

  All return 200. An earlier mid-review version pointed the onboarding demo at `/recruiting-v2`, whose page says "Isolated development namespace…". That version was replaced before the commit.

**m2 (MINOR). LIVE-route repointing is incomplete.** The report says marketing links were moved off LIVE-only routes, but these remain:
- `team-briefing/page.tsx:67` `/drivers` and `:135` `/loads`
- `how-bof-works/page.tsx:213` `/dispatch/intake`, and `:233/:313/:333` `/loads/L001…`
- `MarketingCommandCenterPreview.tsx:27` `/loads/L001…`
- `FleetIntelligenceContent.tsx:53-54,322` `/loads` and `/drivers`, and `:159` `/dispatch?view=exceptions`
- `MarketingServiceTiers.tsx:41` `/drivers`

Anonymous `/drivers` shows "Production driver roster requires a LIVE fleet session".

**m3 (MINOR). Label and destination mismatches.**
- `product/page.tsx` "Dispatch — Live assignment and movement control" now goes to `/demo/dispatch`. The charter says demos must not be represented as live.
- "Driver Vault — Driver-owned documents" now goes to `/documents`, which is a sample library.
- `BOF_RUNTIME_LINKS.pretrip` now points at sign-in with callback `/dispatch`.

## D. Architecture and build — acceptable

- **Catch-all route + JSON content.** One catch-all route, a manifest and per-page JSON make a clean, provenance-preserving design. Pages are prerendered (`.next/server/app/business-operations/*.html` exists).
  - The dynamic `import()` template bundles about 330 KB of JSON server-side, which is fine for Vercel.
  - No operational system is duplicated: the capability links point to existing routes.
  - `tsc --noEmit` passes, and eslint on the changed files is clean.
- **Removed `BusinessOperationsSectionNav`.** There are no dangling references to it. The registry's stale children (`route-optimization` and `operations-dashboard`, which never existed) were replaced with real routes.
- **m4 (MINOR, performance).** Scoped CSS is shipped unpruned and render-blocking:

  | File | Raw | gzip |
  |---|---|---|
  | `static-20260729/scoped.css` | 1,048 KB | 136 KB |
  | `fork-20260819/scoped.css` | 493 KB | — |

  The 2026-07-29 source sheet already contains its rules twice (each keyframe appears twice). The sheets are served `Cache-Control: public, max-age=0`. `public/recovered-assets` is 6.6 MB in total, mostly 8 policy PDFs of about 0.5 MB each.
- **m5 (MINOR). Client navigation side effects.**
  - React keeps hoisted `precedence` stylesheets after navigation, so after visiting both generations, both `scoped.css` files stay loaded under the same `.bof-legacy` prefix. I tested 3 cross-generation pairs and found 0 computed-style differences, but the risk is latent.
  - The widget scripts add `document`-level `submit`/`click` listeners and `window.BOFDataLoader`/`BOFDemoState` globals that cleanup does not remove. Revisiting via client navigation stacks the listeners.
- **m1 (MINOR, hygiene).** `scripts/recovery/__pycache__/recover_business_operations.cpython-313.pyc` is committed in 396d35fe, and `__pycache__` is not gitignored.

## E. Accessibility and responsive at 390 px — mostly PASS

- **Overflow.** No page-level horizontal overflow on any tested recovered page (`scrollWidth == clientWidth == 390`). Wide tables on `/payroll` and the archive sit inside scroll wrappers.
- **Headings and images.** One H1 per page and no images without alt.
- **Heading skips.** H1 jumps straight to H3 ("Source record") on both fork pages. That is verbatim, so MINOR.

**M2 (MAJOR, functional/visual). Widget section headings stay invisible** on `/business-operations/accounting-finance`, `/hr-tier/compensation-benefits` and `/hr-tier/talent-management`.
- `RecoveredPageScripts` adds `is-visible` to `.reveal` elements once, before the pay-profile widget finishes its async fetch.
- The widget then injects `<div class="section-head reveal">` (eyebrow, H2 and intro), which stays at `opacity:0`.
- The result is a large blank gap above the cards (`widget_business-operations_hr-tier_compensation-benefits.png`).
- Hidden headings:
  - "Driver pay to finance bridge / Finance sees load revenue…"
  - "Classification and pay setup / Employee and contractor pay rules…"
  - "Training and retention signals…"
- **Fix:** add a scoped CSS override (`.bof-legacy .reveal{opacity:1;transform:none}`) or use a `MutationObserver`.

## F. Other notes

- **m6 (MINOR). An empty `score` becomes "Score: 0%".** In `/contact?source=assessment&track=for-hire-carriers&score=&category=Critical`, `Number("")` is 0, so the pre-fill reads "Score: 0% (Critical)". Treat an empty score as absent.
- **Contact page is now dynamic.** `/contact` renders per request because of `searchParams`. That is acceptable.
- **`source=` attribution is dropped.** `/book-assessment` discards the `source=` parameter, as the old implementation also did, so this is not a regression.
- **Report wording.** The repo report's summary says "all 35 original Business Operations pages". The manifest has 35 static and 2 fork public pages plus 5 archive pages (42 routes), which matches the claim of 37 public and 5 archive.
- **Unchanged by this branch.** `/dashboard` and `/drivers` render the operator app shell for anonymous visitors, as before.

## Severity summary
| ID | Severity | Finding |
|---|---|---|
| M1 | MAJOR | Hub H2 "The dropdown choices are now visible on the page and lead to real operating pages." (merged f254f4e3 section) |
| M2 | MAJOR | Widget `.reveal` section headings invisible on 3 recovered pages |
| m1 | MINOR | Committed `.pyc`; no `__pycache__` ignore |
| m2 | MINOR | LIVE-only marketing links remain (`/drivers`, `/loads`, `/loads/L001`, `/dispatch/intake`, `/dispatch?view=exceptions`) |
| m3 | MINOR | "Live …" labels pointing to demo routes; vault/pretrip label mismatches |
| m4 | MINOR | 1 MB unpruned render-blocking CSS, max-age=0 |
| m5 | MINOR | Stylesheets/listeners/globals persist across client navigation |
| m6 | MINOR | Empty score pre-fills "Score: 0%" |
| — | MINOR | Archive banner and `data-recovered-source` expose commit refs; H1→H3 skips on fork pages (verbatim) |
| — | NOTE | Fidelity verified on all 42 pages (0 words lost, all additions traced to cited donors); no external requests; no CSS leak into nav/footer; no XSS via contact/book-assessment; tsc and eslint clean |
