# BOF consolidated website recovery: owner acceptance summary (2026-10-18)

Branch `claude/website-recovery-20261018`. Not merged, not deployed to production. Local verification
used a production build (`next build` / `next start`) against a local Postgres copy (`bof_recovery`).

## What changed

| Area | Result |
|---|---|
| Homepage service cards | The five cards (Recruiting & onboarding, Qualification & compliance, Dispatch administration, Documentation & vault, Settlements & payroll support) are keyboard-focusable links to their service pages. Each service page links on to its detail pages, demos and the assessment. |
| Restored service explainers | `/services/dispatch`, `/services/drivers`, `/services/safety`, `/services/settlements` (2026-07-10 versions, 1,200–2,150 words), `/services/documents` (2026-07-20), `/services/fleet` and eight detail pages (2026-08-19 fork), plus five archive versions under `/services/archive/` (noindex). |
| Restored interactive demo | The 2026-07-29 product demo, 26 routes under `/interactive-demo`: control room, load queue, dispatch board, drivers, 12 driver files, document intake, documents, carriers, safety, settlements, reports, alerts, settings. All records fictional; demo licence images carry a "SAMPLE – FICTIONAL RECORD" band. |
| Hierarchy | Homepage → service page → detail page → demo → Take the Assessment, on every service family (see journeys A–F). The capability cards on Business Operations and service pages now offer two public demos each instead of sign-in links. |
| Assessment | "Take the Assessment" (`/assessment`) is the primary homepage, header and contact call to action. The flow is unchanged and verified: category → questions → results → inquiry → confirmation, with the inquiry stored in `ContactInquiry` (no email sent). |
| Superseded calls to action | "Book a Working Session" and its variants are gone from public pages: recovered pages via a recorded generator replacement, the contact page topic was removed, and the unused `BookDemoLink` component was deleted. |
| Calls to action | Contact BOF → `/contact`; View capabilities → `#capabilities` (each capability now links to its page); For aggregators → `/aggregators`; See sample workflows → `#demo-the-difference`; Savings estimate → the homepage calculator (`#we-save-you-money`); Trip lifecycle → `#trip-lifecycle` (each phase links to its demo); Savings model → `/fleet-savings` (the full-page calculator; previously a second link to the homepage section). |
| Sign-in gates | Public pages no longer send anonymous visitors to sign-in. Marketing links were repointed to demos. Platform components reused on demo pages are handled by one guard (`lib/security/public-demo-links.ts`): for visitors without a session, links into the signed-in app point at the matching public demo. Authentication itself is unchanged; signed-in users keep the original links. |
| Defects | `/services` and `/interactive-demo` use the marketing header. Fixed: the demo dispatch heading ("CRITICAL · MAJOR · MINOR" → "Dispatch triage: critical, major and minor issues"), a hero image that never existed, the "(V4)" labels in two headings, the contact heading. Crawl found no header overlap on any page. |
| Preservation protection | Policy and superseded-decisions record in `docs/governance/`; AGENTS.md section; Cursor rule (`.cursor/rules/bof-content-preservation.mdc`, named so it cannot clash with the owner's local `BOF-PRESERVE-APPROVED-WORK.mdc`); Copilot instructions; `npm run check:preservation` with a manifest of 87 recovered pages, 90 public routes and 28 rendered pages. Tested: it fails on removed sections, lost headings and reintroduced "Book a Working Session". |

## Browser-tested journeys (real Chromium, fresh anonymous session each)

Screenshots: `docs/recovery/evidence/journeys-2026-10-18/` (`journeys.json` lists every step).

| Journey | Path | Result |
|---|---|---|
| A Recruiting | Home card → Driver Onboarding → Assignment Readiness → recruiting pipeline (interaction) → document intake demo → assessment | Pass, 7 steps |
| B Compliance | Home card → Driver Readiness → Compliance Documents → driver files demo → DRV-003 driver file (DQF folder) → sample file cabinet | Pass, 6 steps |
| C Dispatch | Home card → Dispatch explainer → interactive dispatch board → load queue → dispatch triage demo → load from demo (no sign-in) → customer load intake | Pass, 6 steps |
| D Business Operations | Menu → overview → the six service areas (Driver Onboarding, Document & Records Control, Operational Reporting, Customer Billing, Payroll Administration, Accounting & Finance) → third-level Cash-Flow Review | Pass, 9 steps |
| E Assessment | Home CTA → For-Hire → questions → results (score, risk areas) → prefilled inquiry → confirmation; row present in `ContactInquiry` | Pass, 6 steps |
| F Financial | Home card → Settlements explainer → Exception Visibility → interactive settlements → settlement holds demo → Money at Risk → Pay Exception Control | Pass, 6 steps |
| G Savings | Homepage estimate: inputs + Run model change the result; Savings model page: same | Pass, 4 steps |
| Mobile | Homepage at 390 px: cards and CTA visible, no horizontal scroll | Pass |

Anonymous crawl of every public route and every link found: 214 pages, 0 sign-in redirects, 0 errors
(`docs/recovery/C-connectivity-matrix-2026-10-18.md`).

## Historical content preservation

- Recovered pages are verbatim copies of the cited commits (report: `docs/recovery/business-operations-recovery-report.md`, regenerated). Existing Business Operations pages changed only in link targets and the recorded superseded-CTA replacements.
- Owner-visible alterations, all recorded in the generator and report:
  - "A working session qualifies…" → "The BOF assessment qualifies…" and booking links → "Take the Assessment" (20 pages, including archive copies).
  - One script adaptation in the demo router (trailing slash).
  - The demo control room runs only the interactive-demo block of the historical `site.js` (the rest of that file rewrote the old site header).
  - Licence images stamped as samples.
  - Four 1080p videos re-encoded for web delivery (same resolution, length and content; 159 MB → 70 MB).
- Not restored: `/dispatch/load-intake` (2026-07-29, 198 words) — the current `/customer-portal/load-intake` is the richer working version. The 2026-07-21 static `/fleet-savings` was the same model and fields as today's calculator, which is kept.

## Privacy and security

- One historical sample document (`static-20260720/.../sample-master-services-agreement.pdf`) contained an original street address; the published copy was de-identified with the existing pipeline and the generator will not overwrite it. A generator guard now stops on consumer e-mail addresses or SSN-shaped numbers.
- Original-value scans: 0 in the repository, 0 in the build output, 0 in the HTTP responses of all 214 crawled pages and the demo data files.
- Checks: route-access tests 8/8 (one new, for the demo-link guard), Recruiting V2 tenancy 9/9, typecheck clean, production build clean.
- No new security defect found. No authentication, middleware policy (beyond listing the two new public marketing sections), migrations or infrastructure changed.

## Open items for the owner

1. **`/money-at-risk` explanation SVGs** (`/generated/exceptions/MAR-*/settlement-hold-explanation.svg`) return 401 to anonymous visitors because the generator API requires an operator session. It renders fictional demo data, but relaxing that gate is a security decision, so it was left alone.
2. **Demo pages show signed-in panels.** `/demo/loads` and `/demo/dispatch` include Copilot panels that read "operator session is required" and "Session expired. Sign in again" to anonymous visitors. These are not redirects; removing them would change existing components, so they await a decision.
3. **Pre-existing console noise** on some demo pages: 401s from demo components calling signed-in APIs (they fall back to demo data), React hydration warning #418 on `/demo/drivers` and `/documents/compliance-flow`, and malformed SVG icon paths on `/portals`. None is new.
4. **Git history** still holds the original sensitive values. This is the open condition from the security review and still needs your decision.
5. **Production deployment** awaits your authorization.
