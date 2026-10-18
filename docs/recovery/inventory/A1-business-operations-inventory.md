# Business Operations: Recovery Inventory and Content Comparison

Repo: `/home/user/bof-website-recovery` (branch `claude/website-recovery-20261018`, HEAD 244d6928). This was a read-only analysis: every historical source was read with `git show`.
Companion file: `bo-restore-plan.json` has 37 route rows, with assets, missing assets, interactive features and outbound links.

## 0. Method and evidence base

- **Generation 1, the original static site (`Website/business-operations/**`).** All 35 paths were extracted at:
  - 66929e67 (2026-07-29, `origin/codex/public-site-deployment-candidate` tip, "Establish canonical production baseline")
  - 0db8b768 (2026-07-21, `origin/tighten-public-page-hierarchy` tip)
  - the word-count "best" commit for each page (`website-bo.json`)
  - 46b2c464 for the hub (2026-07-01, `origin/feature/cta-language-cleanup`)
- **Outline diffs (headings, text, links) between the "best" commit and 66929e67:**
  - 30 of the 34 non-hub pages are **identical in content** at the best commit and at 66929e67. The best commit is db03d3be (2026-07-20) or e7a6c7b8 (2026-07-28), and the only differences are chrome: the logo changed from `boflogo-original.png` to `header-lockup.svg`, and the cache-busting query strings changed.
  - **4 pages differ:** `accounts-receivable`, `customer-billing`, `document-management` and `payroll-administration`. Their best-by-words version is f254f4e3 (2026-07-10), which has a different 4-card body. The later 66929e67 version adds links to the third-level child pages, and for payroll it also adds the pay workbench.
- **Generation 2, the recovered fork (`recovered/fork-restored-20260819/business-operations/**`).** It has 7 pages, added in cc419d0e and merged in e901e6cb (2026-08-19). It has no earlier history in this repo, so it is a **later rewrite**. Evidence:
  - It uses a uniform template.
  - It shares verbatim hub copy with the 46b2c464 lineage ("Business Operations Command Center / Run the HR and Finance office behind the operation.").
  - Its CTAs go to `/book-demo/`, while the static site's CTAs go to `/scenario-walkthrough/`.
- **Generation 3, current Next.js (`app/(marketing)/business-operations/**`).** It has 11 `page.tsx` files plus `components/business-operations/BusinessOperationsSectionNav.tsx` (7 tabs). The pages are 45–152 lines each. All copy is newly written generic cards, and every page has a "Recovered … / Data boundary" disclaimer box.
- **Assets.** Referenced paths `/assets/...` were checked against `public/assets/...` in the current worktree, against `66929e67:Website/assets/...`, and against `recovered/fork-restored-20260819/assets/...`.
- **Site chrome is not counted as page content:** `/assets/css/styles.css`, `/assets/js/site.js`, `header-lockup*.svg` and `boflogo-*.png`. None of these are in `public/assets`, and Next.js replaces them with its own layout. site.js only drives nav toggles (`data-nav*`).

### Generation lineage at a glance

| Gen | Where | Date / commit | Pages | Character |
|---|---|---|---|---|
| 1a | `Website/business-operations/` (hub only) | 2026-06-19 e6cd2ea7 → 2026-07-01 46b2c464 | 1 | Single long "Business Operations Center" page with demo KPIs, tables and lifecycles (1,504 words at 46b2c464) |
| 1b | same, 8 second-level pages + 12 third-level pages | f254f4e3 / 7333dacf (2026-07-10), 432e590a (2026-07-15: interactive data bridge), db03d3be (2026-07-20) | 21 | "Lens" pages: hero, manager lens, detail cards, process stepper, next step. Interactive workspaces on HR Tier, Recruiting, Accounting & Finance, and the pay-profile pages |
| 1c | same, 14 functional-area pages | 0db8b768 (2026-07-21) → e7a6c7b8 / 66929e67 (2026-07-28/29) | 14 | Trucking-domain pages with regulatory tables (49 CFR, 2290/IFTA/IRP/UCR, BASICs), numbered workflows, and links to governing policy PDFs |
| 2 | `recovered/fork-restored-20260819/business-operations/` | e901e6cb (2026-08-19) | 7 | Later rewrite: cinematic hero photo, uniform "Source record / Review path / Decision-ready output" template, 4 generic steps, boilerplate "Qualification" list |
| 3 | `app/(marketing)/business-operations/` | current (244d6928) | 11 | Generic 3–4 card pages and "Recovered …" disclaimers. No tables, steps, KPIs, demos or JS widgets |

## 1. Business Operations hub: original structures

### 1.1 46b2c464 (2026-07-01): richest hub, "Business Operations Center" (1,504 words)
Title: "Business Operations Center | BackOfficeFleet". The page contains no images (logo only) and uses `site.js?v=1.49` (nav only). Sections, in order:
1. **Hero** (`#business-operations-command`): eyebrow "Business Operations Command Center"
   - H1 "Run the HR and Finance office behind the operation."
   - Two paragraphs defining the HR Tier and Finance Tier.
   - CTAs "Review HR and Finance tiers" (`#business-operations-tiers`) and "View operational impact" (`#operational-impact`).
2. **"Company infrastructure snapshot"** (demo scenario). Eight KPI tiles: Employees Supported 82; Active Drivers 64; Payroll Processed $418K; Insurance Policies Tracked 19; Open Claims 7; Factoring Packets Ready 38; Driver Onboarding Status 86%; Administrative Tasks Completed 312.
3. **"Business Operations Command Center"** (`#business-operations-tiers`). Three columns:
   - HR Tier "Workforce administration", with 4 queue counts.
   - Finance Tier "Financial coordination", with 6 queue counts.
   - Operational Impact "Back-office gaps affect daily work.", with 6 cause→effect bullets.
4. **HR Tier: "BOF keeps recruiting, onboarding, records, benefits, and training visible."** (`#payroll-hr`)
   - Cards: June payroll cycle (lock dates Jun 24–27); New hire pipeline (14/8/5/6); Benefits enrollment (58/51/5/2); Payroll readiness 92/100.
   - Worker table EMP-2048, EMP-3114, EMP-1187, EMP-3301 (Record / Role / Status / Payroll readiness / Benefits / Next admin action).
5. **HR Tier workflow: "Driver and worker onboarding becomes a visible administrative path."** (`#driver-onboarding`). Eight-step lifecycle: 01 Recruit, 02 Application, 03 Background Review, 04 Document Collection, 05 Driver Qualification File, 06 Payroll Setup, 07 Benefits Enrollment, 08 Active Driver. Each step has a one-line control.
6. **Insurance & Risk Administration: "Policy, certificate, renewal, and claim status stay tied to the business record."** (`#insurance-risk`)
   - Cards: 19 active policies, 4 renewals inside 45 days, 42 certificates current, Risk status 87/100.
   - Risk table POL-AL-2026, POL-CG-2026, CLM-7726, CERT-4419.
   - Disclaimer: "not an insurance carrier, agent, adjuster…".
7. **Aggregator Back Office Support: "BOF helps carrier networks grow without building every administrative department from scratch."** (`#aggregator-back-office-support`)
   - Six cards: Carrier onboarding support (12), Settlement coordination (7), Insurance tracking (42), Claims documentation (5), Factoring packet readiness (38), Administrative queue (18).
   - "Aggregator operating value" paragraph with the link "Open the Aggregator Command Center" (`/aggregator-command-center/`).
8. **Finance Tier: "BOF helps coordinate the documents required for funding review."** (`#factoring-readiness`)
   - Five-step funding path: POD Received → Invoice Generated → Packet Complete → Submitted → Funded.
   - Cards: Ready packets / Needs admin follow-up / Settlement connection.
   - Disclaimer: "not a bank, lender, factoring company".
9. **Finance Tier: "Accounting and bookkeeping support become operating context, not a separate mystery."** (`#accounting-coordination`). Seven-row table (Category / Current period / Status / Owner / Administrative note):
   - Revenue $1.84M
   - Settlement $612K
   - Open receivables $438K
   - AP $86K
   - Excise tax review 1 item
   - Operating expenses $967K
   - Driver settlements $284K
10. **Executive financial visibility: "Executives see financial pressure beside administrative readiness."** (`#financial-visibility`)
    - Cards: Monthly revenue $1.84M; Settlement exposure $74K; Cash flow trend +9%; Receivables trend 12 open over 30; Administrative readiness 91/100.
    - "BOF business infrastructure story" boundary paragraph: not an accounting firm, tax advisor, insurance carrier, bank, factor, payroll provider of record, motor carrier, broker, dispatcher or marketplace.
11. **Closing CTA: "Use Business Operations Center to review the HR and Finance office behind the fleet."** Links to "Request a BOF Assessment →" (`/scenario-walkthrough/`).

Earlier versions e6cd2ea7 and 505d18e1 (2026-06-19/20) have the same skeleton without the HR/Finance Tier framing and without the Aggregator section. Their H1 is "Run the company behind the fleet."

### 1.2 Intermediate hubs, needed for the hierarchy
- **f254f4e3 (2026-07-10), "Run the office layer behind the fleet."**
  - Section "Office Work In Motion": Ready 62%, Review 18, Blocked 5, plus 4 tiles.
  - Section **"Business Operations directory"**: 8 cards linking to all original second-level pages:
    - HR Tier
    - Driver Onboarding
    - Accounting & Finance
    - Payroll Administration
    - Customer Billing
    - Accounts Receivable
    - Document Management
    - Operational Reporting
  - Closing section "Bring one office bottleneck into a BOF assessment." This is the clearest statement of the original second-level hierarchy.
- **5576ae1d (2026-07-14) and db03d3be (2026-07-20): "Five office systems, one unified operating layer."**
  - Module cards: Excise Taxes, Accounting, ERP, HR, Payroll.
  - "Office follow-up by record, owner, due date, and consequence": People Operations, Financial Administration, Vendor and Administrative Records, Reports and Controls.
  - **"Every issue needs a reason, owner, due date, operational consequence, and clearance path."** Four questions: Why is the item not ready? / Who owns the next action? / What fleet decision is affected? / What clears the hold?
  - Factual defect: the db03d3be module tile reads "Excise Taxes 1040 Filed". Form 1040 is an income-tax form. Later pages correctly use Form 2290/HVUT.
- **0db8b768 (2026-07-21, tighten branch): "Five Systems. One Unified Operating Layer."** Hero, an intro paragraph, then 14 area cards: 5 long (Excise Taxes, Accounting, ERP, HR, Payroll) and 9 short (Maintenance … Technology). This is the first hub that links to the 14 functional-area pages.

### 1.3 66929e67 (2026-07-29): canonical deployment-candidate hub (≈900 words)
Image: `/assets/images/dashboard-mockups/bof-business-operations-command.webp`, captioned "Business Operations workspace preview…". It is **missing from public/** but present in 66929e67 and in the fork dir. Sections, in order:
1. **Hero:** "Administrative Command Center", H1 "Business Operations", tagline "The people, processes, and systems that power your fleet from the inside out."
   - Five area chips: HR & Workforce, Accounting, Treasury, Finance, Payroll.
   - "Operating proof" stats: 5 Operating Areas / 12 Open Queues / 4 Exception Types ("Illustrative demo data").
2. **"Five operating areas, one accountable workflow."** (`#business-ops-hub`). Five cards, each with 3 bullets:
   - HR & Workforce → `/business-operations/human-resources/`
   - Accounting → `/accounting/`
   - Treasury → `/cash-flow/`
   - Finance → `/operational-reporting/`
   - Payroll → `/payroll/`
3. **"A practical desk for the work behind the fleet."** Workspace preview image, with CTAs "Explore the Business Operations Workspace" and "Open Customer Demo" (both `/customer-demo/?portal=business-operations`).
4. **Administrative control board: "Payroll, AR, AP, fuel, maintenance, and cash flow are worked from one operating queue."** Five rows:
   - SET-1907 payroll exception (Carlos Martinez / DRV-002) → `/drivers/settlements-payments/`
   - TMS-LD-10482 AR billing (Dallas→Memphis; BOF-RR-10482) → `/business-operations/customer-billing/billing-packet-control/`
   - CAR-204 AP vendor review (BOF-1907, BOF-2175) → `/operations-record/#shared-records`
   - BOF-2064 fuel and maintenance (T-206 / TRL-118-09) → `/load-readiness/`
   - Cash flow watch (3 billing packets ready / 2 proof packets in review / 1 settlement hold / 13 wk forecast) → `/workflows/factoring-packet-preparation/`
5. **"The office can see what changed, who owns it, and what happens next."** Four connected workflows:
   - 01 Workforce and onboarding
   - 02 Payroll and accounting exceptions
   - 03 Treasury and cash visibility
   - 04 Vendor and record control
6. **14 functional-area blocks**, in this order:
   - Long blocks with 4 bullets: TX Excise Taxes & Federal Compliance; AC Accounting & Financial Operations; ER ERP & Workflow Integration; HR Human Resources & DOT Compliance; PY Payroll & Driver Compensation.
   - Short blocks with 3 bullets: MT Fleet Maintenance & Assets; SMS Safety Management & SMS; IN Insurance & COI Tracking; FL Fuel Management & Cost Control; OO Owner-Operator Management; MC Operating Authority & FMCSA Portal; CF Cash Flow & Factoring Strategy; LC Legal & Contract Management; IT Technology Stack & Integration.
   - Each block links to its `/business-operations/<area>/` page.
7. **Related Workflows: "Business operations keeps payroll, vendors, billing, records, and executive follow-up connected to live work."** Six links:
   - Workforce → `/drivers/onboarding/`
   - Payroll → `/drivers/settlements-payments/`
   - Vendors → `/business-operations/legal-contracts/`
   - Records → `/document-readiness-engine/`
   - Billing → `/business-operations/customer-billing/billing-packet-control/`
   - Executive Oversight → `/operations-record/`
8. **Business Operations demo: "Review the administrative workspace without leaving the public page path behind."** Links to `/customer-demo/?portal=business-operations` and "View Workflow Map" (`/workflows/`).

The 66929e67 hub does **not** link directly to the 8 original lens pages: driver-onboarding, hr-tier, accounting-finance, payroll-administration, customer-billing, accounts-receivable, document-management and operational-reporting. The one exception is Finance → operational-reporting, plus the billing-packet-control row. Those pages stayed reachable only through each other.

### 1.4 Fork hub (e901e6cb, 665 words): later rewrite
Images (all present in `public/assets/images/cinematic/` except the last):
- `business-operations-worktable-desktop-v2-png.webp`
- `business-operations-worktable-mobile-v2-png.webp`
- `photos/site-pass/21-fleet-office-record-clerk.webp`. This one is **missing in public/**; it is in the fork dir and in 66929e67.

Scripts: `fork-path-v2.js`, `site.js`, `cinematic-nav.js` (fork navigation/cinematic chrome; none are in public/). Sections, in order:
1. Workflow ribbon: "The office closes the loop", linking Drivers / Dispatch & Operations / Safety & Compliance / Settlements & Billing / Business Operations.
2. Hero: "Back-office command", H1 "Run the business behind the fleet with the same discipline as the road." CTA "Request a working session →" (`/book-demo/`).
3. "Business Operations Command Center: Run the HR and Finance office behind the operation." This reuses 46b2c464 copy, but its CTAs point to assignment-readiness and owner-queue-reporting instead of in-page anchors.
4. **"Business office lifecycle: Dispatch, safety, and settlement records feed HR and Finance work."** Eight cards:
   - HR Tier
   - Accounting & Finance
   - Finance Tier
   - Payroll Administration
   - Customer Billing
   - Accounts Receivable
   - Document Management
   - Operational Reporting
5. **"Focused workflow routes: Move from the business office overview to the question that needs an answer."** Four cards:
   - Billing & AR: "Make every invoice explainable."
   - Assignment readiness: "Release drivers when the file supports the work."
   - Pay exceptions: "Turn settlement questions into support records."
   - Owner queue: "Make every blocker belong to someone."
6. **"Six durable service areas: Open the office process that needs clearer control."** Links to accounting-finance, billing-ar-control, assignment-readiness, pay-exception-control, document-records-control and owner-queue-reporting. The page states: "Thin or unsupported service claims are deliberately excluded."
7. Closing CTA: "Book a business operations review →" (`/book-demo/`).

### 1.5 Current Next.js hub (`app/(marketing)/business-operations/page.tsx`, 152 lines)
- Hero: copies the fork H1 and the fork worktable image. CTAs go to `/dashboard` and `/documents/company-operations-vault`.
- A row of 4 generic cards.
- "Business operations section hierarchy": 6 cards (Driver Onboarding, Document & Records Control, Operational Reporting, Customer Billing, Payroll Administration, Accounting & Finance).
- A "Data boundary" box with three columns.

**Lost relative to the strongest historical hubs (46b2c464, 66929e67, db03d3be):**
- From 46b2c464:
  - The "Company infrastructure snapshot" KPI set.
  - The HR Tier and Finance Tier queue panels, plus "Operational Impact" with 6 consequences.
  - The payroll calendar, new-hire pipeline, benefits enrollment and payroll readiness cards, and the EMP worker table.
  - The 8-step onboarding lifecycle.
  - The whole Insurance & Risk section (cards and risk table).
  - The whole Aggregator Back Office Support section, including the Aggregator Command Center link.
  - The 5-step factoring funding path.
  - The accounting coordination table.
  - Executive financial visibility.
  - The explicit boundary statement.
- From 66929e67:
  - All 14 functional-area blocks and their links. Not one of the 14 area pages has a Next.js route.
  - The administrative control board (5 records).
  - Connected workflows.
  - Related Workflows.
  - Customer-demo and workspace-preview CTAs.
- From db03d3be: the "reason / owner / consequence / clearance" Q&A.
- From the fork: the lifecycle cards and focused routes.
- Missing children: HR Tier, Accounts Receivable and Document Management have no Next.js route. Next substitutes the fork's `document-records-control`.

## 2. Inventory table (union of all three generations: 37 routes)

Legend:
- **S** = static Website/ (gen 1)
- **F** = fork (gen 2)
- **N** = current Next.js (gen 3)
- Rec. source = recommended restore base
- "=66929e67" means content identical at the best-by-words commit and at 66929e67

| # | Route | Lvl | S | F | N | Strongest historical version | Rec. source | Missing assets (in public/) | Interactive |
|---|---|---|---|---|---|---|---|---|---|
| 1 | /business-operations | 1 | ✔ | ✔ | ✔ | 46b2c464 (2026-07-01, 1504w) for substance; 66929e67 for hierarchy | 46b2c464 + 66929e67 + db03d3be Q&A | dashboard-mockups/bof-business-operations-command.webp; photos/site-pass/21-fleet-office-record-clerk.webp | none (site.js nav) |
| 2 | /driver-onboarding | 2 | ✔ | – | ✔ | db03d3be (=66929e67, 234w) | 66929e67 + f254f4e3 cards | – | – |
| 3 | /driver-onboarding/assignment-readiness | 3 | ✔ | ✔ | ✔ | S: db03d3be (=66929e67, 141w); F: e901e6cb (436w) | 66929e67 (original) + fork sections | – (fork images present) | – |
| 4 | /document-management | 2 | ✔ | – | ✗ | f254f4e3 (187w) / 66929e67 (links child) | 66929e67 + f254f4e3 cards | – | – |
| 5 | /document-management/records-control | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 134w) | 66929e67 | – | – |
| 6 | /document-records-control | 2 | – | ✔ | ✔ | e901e6cb (433w, fork-only) | fork e901e6cb (or redirect to #4/#5) | – | – |
| 7 | /operational-reporting | 2 | ✔ | – | ✔ | db03d3be (=66929e67, 190w) | 66929e67 + f254f4e3 cards | – | – |
| 8 | /operational-reporting/owner-queue-reporting | 3 | ✔ | ✔ | ✔ | S: db03d3be (=66929e67, 145w); F: e901e6cb (470w) | 66929e67 + fork (incl. proof artifact) | public-safe/exception-owner-queue.html | – |
| 9 | /customer-billing | 2 | ✔ | – | ✔ | f254f4e3 (170w) / 66929e67 | 66929e67 + f254f4e3 cards | – | – |
| 10 | /customer-billing/billing-packet-control | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 136w) | 66929e67 | – | – |
| 11 | /customer-billing/billing-ar-control | 3 | – | ✔ | ✔ | e901e6cb (427w, fork-only) | fork e901e6cb + #10/#13 | – | – |
| 12 | /accounts-receivable | 2 | ✔ | – | ✗ | f254f4e3 (180w) / 66929e67 | 66929e67 + f254f4e3 cards | – | – |
| 13 | /accounts-receivable/aging-dispute-control | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 137w) | 66929e67 | – | – |
| 14 | /payroll-administration | 2 | ✔ | – | ✔ | 66929e67 (pay workbench); f254f4e3 (196w) | 66929e67 + f254f4e3 cards | 4 JS + data JSON | Pay profile workbench |
| 15 | /payroll-administration/pay-exception-control | 3 | ✔ | ✔ | ✔ | S: db03d3be (=66929e67, 139w); F: e901e6cb (438w) | 66929e67 + fork sections | – | – |
| 16 | /accounting-finance | 2 | ✔ | ✔ | ✔ | db03d3be (=66929e67, 769w) | 66929e67 | 4 JS + data JSON | Live finance workspace + pay→finance bridge |
| 17 | /accounting-finance/ap-vendor-control | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 155w) | 66929e67 | – | – |
| 18 | /accounting-finance/cash-flow-review | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 149w) | 66929e67 | – | – |
| 19 | /hr-tier | 2 | ✔ | – | ✗ | db03d3be (=66929e67, 908w) | 66929e67 | – | Live HR workspace |
| 20 | /hr-tier/recruiting-onboarding | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 429w) | 66929e67 | – | Recruiting pipeline |
| 21 | /hr-tier/compensation-benefits | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 205w) | 66929e67 | 4 JS + data JSON | Pay profiles (compensation) |
| 22 | /hr-tier/talent-management | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 219w) | 66929e67 | 4 JS + data JSON | Pay profiles (talent) |
| 23 | /hr-tier/employee-relations | 3 | ✔ | – | ✗ | db03d3be (=66929e67, 212w) | 66929e67 | – | – |
| 24 | /accounting | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 436w) | 66929e67 | POL-006, POL-007 PDFs | JSON-LD only |
| 25 | /cash-flow | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 276w) | 66929e67 | POL-006 | – |
| 26 | /erp | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 424w) | 66929e67 | POL-002/003/004/006/007 | JSON-LD only |
| 27 | /excise-taxes | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 381w) | 66929e67 | POL-007 | JSON-LD only |
| 28 | /fleet-maintenance | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 225w) | 66929e67 | POL-007 | JSON-LD only |
| 29 | /fuel-management | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 221w) | 66929e67 | – | – |
| 30 | /human-resources | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 530w) | 66929e67 | POL-001, POL-007 | JSON-LD only |
| 31 | /insurance | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 207w) | 66929e67 | POL-008 | – |
| 32 | /legal-contracts | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 206w) | 66929e67 | – | – |
| 33 | /operating-authority | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 193w) | 66929e67 | – | – |
| 34 | /owner-operator | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 218w) | 66929e67 | – | link to pay workbench |
| 35 | /payroll | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 538w) | 66929e67 | POL-001/006/007 | JSON-LD only |
| 36 | /safety-sms | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 220w) | 66929e67 | POL-005 | – |
| 37 | /technology | 2 | ✔ | – | ✗ | e7a6c7b8 (=66929e67, 229w) | 66929e67 | POL-008 | – |

Counts:
- 35 static pages, 7 fork pages (2 fork-only routes), 11 Next.js pages, 37 distinct routes.
- **26 routes have no Next.js page.** These are all 14 area pages, plus hr-tier with its 4 children, accounts-receivable with its child, document-management with its child, billing-packet-control, ap-vendor-control and cash-flow-review.

### Asset summary (current `public/` vs referenced)
- **Present in public/:** all 12 fork cinematic images under `public/assets/images/cinematic/business-operations*` (hub worktable desktop/mobile, accounting-finance hero, document-records-control hero, and desktop/mobile pairs for assignment-readiness, billing-ar-control, owner-queue-reporting and pay-exception-control).
- **Missing from public/, all recoverable:**
  - `/assets/images/dashboard-mockups/bof-business-operations-command.webp` (66929e67 hub) is in `66929e67:Website/assets/...` and in `recovered/fork-restored-20260819/assets/...`.
  - `/assets/images/photos/site-pass/21-fleet-office-record-clerk.webp` (fork hub) is in both places.
  - `/assets/documents/policies/bof-pol-00{1..8}-*.pdf` (8 policy PDFs, linked from 9 area pages) are only in `66929e67:Website/assets/documents/policies/`.
  - `/assets/documents/public-safe/exception-owner-queue.html` (fork owner-queue proof artifact) is only in `recovered/fork-restored-20260819/assets/documents/public-safe/`.
  - `/assets/js/bof-supabase-config.js`, `bof-data-loader.js`, `bof-demo-state.js`, `bof-driver-pay-profiles.js` and `/assets/data/bof-public-operations.json` are only in 66929e67. The data file holds keys `drivers`, `loads`, `carrierProfiles`, `driverPayProfiles` (6 profiles), `settlementRecords` and others.
- No videos are referenced by any BO page in any generation.

## 3. Interactive functionality (historical)

All of it was introduced in 432e590a (2026-07-15, "Add BOF MVP admin data bridge") and survives unchanged through 66929e67. **None of it exists in Next.js.**

| Page | Mechanism | What it did |
|---|---|---|
| accounting-finance | Inline IIFE on `[data-finance-workspace]` | Section "Live finance workspace". Filter chips `data-finance-filter` (all / Ready / Blocked / Aging) toggle the `hidden` attribute on cards by `data-finance-status`. Each "View packet" button carries `data-packet-title/status/body/missing/route`, which are written into the "Packet preview" panel. Records: BOF-2064 Ready, BOF-1931 Blocked, AP-1187 Blocked, AR-2258 Aging, SET-1907 Ready. Counters: 18 review, 5 blocked, 7 ready to invoice, 6 aging/dispute. |
| hr-tier | Inline IIFE on `[data-hr-workspace]` | Section "Live HR workspace". Filters `data-hr-filter` (all / Ready / Review / At Risk / Blocked). "Open file" buttons fill the "HR case preview" panel (title, status label, body, reason/blocker, clearance path, BOF support lane). Workers: DRV-004 Daniel Kim, DRV-002 Carlos Martinez, NEW-118, DRV-006 Priya Patel, DRV-007 Frank Miller, DRV-003 Mara Chen. Counters: 42/31/7/3/1. |
| hr-tier/recruiting-onboarding | Inline IIFE on `[data-recruiting-workspace]` | Section "Recruiting and onboarding pipeline". Filters (all / Lead / Screening / DQF / Onboarding / Blocked). Buttons fill the "Candidate preview" panel (fields, clearance path, BOF support lane). Candidates RCR-118, -121, -126, -130, -133, -139. Counters: 18/4/5/3/4/2. |
| payroll-administration | `#driver-pay-profile-workbench[data-bof-pay-profiles="payroll"]` + `bof-driver-pay-profiles.js` | Renders "Driver pay profile workbench": a roster summary (total / ready / review / blocked / net after driver pay) and per-driver cards. Each card has an editable form (Classification, Linked carrier, Pay method, rate, Status) and a document rule-set panel. Form submit → `BOFDemoState.saveDriverPayEdit`, which writes localStorage key `bof-demo-admin-overrides-v1`; there is also a reset. |
| hr-tier/compensation-benefits | `data-bof-pay-profiles="compensation"` | Renders "Classification and pay setup: Employee and contractor pay rules need different controls." Cards show classification, pay basis, benefit eligibility, deductions and reimbursements. |
| hr-tier/talent-management | `data-bof-pay-profiles="talent"` | Renders "Training and retention signals: Pay, route fit, coaching, and training belong in one worker view." |
| accounting-finance | `data-bof-pay-profiles="finance"` | Renders "Driver pay to finance bridge: Finance sees load revenue, driver pay, and margin context together." |
| (shared) | `bof-data-loader.js`, `bof-supabase-config.js`, `bof-demo-state.js` | The loader fetches the Supabase REST table `bof_public_operations_dataset?id=eq.current` (config holds a project URL and a publishable key) and falls back to `/assets/data/bof-public-operations.json`. The demo-state script applies localStorage overrides and provides `documentsForDriver` and `carrierForDriver` (carrier policy overlays). |
| 6 area pages | Inline `application/ld+json` | schema.org WebPage + BreadcrumbList (SEO only). |
| owner-queue (fork) | Static link | "Public-safe proof artifact: Exception Owner Queue". Links "Open accessible record" and "Download HTML copy" both point to `/assets/documents/public-safe/exception-owner-queue.html`. |

Demo links in history:
- 66929e67 hub: `/customer-demo/?portal=business-operations` (×3) and `/workflows/`.
- 46b2c464: `/aggregator-command-center/`.
- owner-operator: links to `/business-operations/payroll-administration/#driver-pay-profile-workbench`.

None of these routes, nor `/scenario-walkthrough/` or `/book-demo/`, exists in the current `app/`. Present routes: `/drivers`, `/settlements`, `/dashboard`, `/documents`, `/safety`, `/command-center`, `/founding-fleet`.

## 4. Per-page detail

Each entry below follows the same structure: original hierarchy and links, historical sections, current Next.js state, what was lost, and the restore recommendation. Every static third-level page also has a breadcrumb back to its parent; that is not repeated in the "lost" lists.

### 4.1 Driver Onboarding: `/business-operations/driver-onboarding` (L2)
- **Strongest:** db03d3be = 66929e67 (234w), "Driver Onboarding | Business Operations".
- **Hierarchy and links:**
  - Parent: hub.
  - Child: assignment-readiness.
  - Links: Driver Command Center (`/drivers/`), "Open Assignment Readiness", HR Tier (`/business-operations/hr-tier/`).
- **Sections, in order:**
  - H1 "Turn a driver candidate into assignment readiness."
  - "Onboarding manager lens: The handoff is successful only when dispatch can rely on the file."
  - "Deep dive: Assignment readiness is the operating test." Child card: "Know whether the driver can actually be assigned."
  - 3-step stepper: Intake ("Collect the candidate record", outcome "Candidate profile") → Clear ("Move credentials and acknowledgements into review", outcome "Ready, review, blocked") → Release ("Confirm the driver can support an assignment", outcome "Assignment ready").
  - "Next step: Start with the onboarding handoff that keeps slipping."
- **f254f4e3 extra:** "Every onboarding step should point to the next operating action.", with cards Application intake / DQF handoff / Payroll setup / Assignment release.
- **Next.js now:** generic H1 "Move drivers from applicant to assignment-ready without losing compliance control."; 4 generic cards (Applicant intake, Qualification review, Assignment readiness, Queue ownership); a "Data boundary" box.
- **Lost:**
  - The manager-lens framing and the dispatch-reliance test.
  - The 3-step Intake/Clear/Release stepper and its outcomes.
  - The candidate-record field list (source, contact, experience, license class, preferred lane, recruiter owner).
  - The links to Driver Command Center and HR Tier.
- **Restore:** 66929e67 base, adding the f254f4e3 card set. The hub-level 8-step lifecycle from 46b2c464 §5 can also be placed here.

### 4.2 Assignment Readiness: `/business-operations/driver-onboarding/assignment-readiness` (L3)
- **Static** (db03d3be = 66929e67, 141w):
  - H1 "Release drivers only when the operating file can support the work."
  - "Release decision: Ready means more than paperwork received."
  - "Release checklist: Group the required signals." Signals: DQF, license, medical card, MVR, training, safety ack, payroll setup, equipment.
  - "Blocked work: Show exactly why release is delayed."
  - "Related operating view: Assignment readiness should feed the Driver Command Center." Links `/drivers/` and the parent.
- **Fork** (e901e6cb, 436w, later rewrite):
  - H1 "Connect onboarding records to the next assignment decision."
  - Source record / Review path / Decision-ready output.
  - 4 generic steps.
  - Qualification boundary: "the employer and qualified HR, legal, safety, and regulatory professionals retain authority".
  - Direct routes `/drivers/onboarding/`, `/drivers/compliance-documents/`, `/workflows/dispatch-assignment/`.
  - CTA `/book-demo/`.
  - Hero image desktop/mobile (present in public).
- **Comparison:** the fork has about 3x the words, but roughly 40% of that is template text repeated verbatim on all 6 fork subpages: the step 03 text, the 4 qualification bullets, the "Continue with the supporting route…" lines and the working-session CTA. The static page is more specific (it names the checklist signals and the blocking reasons). The two do not disagree factually; the fork adds a more explicit authority boundary.
- **Next.js now:** H1 "Readiness is the decision gate that keeps every assignment honest."; 3 cards (Credential status, Exception queue, Assignment clearance). The phrase "Check the payer, driver, and compliance status before every posting" has no historical source.
- **Lost:** the signal checklist, the blocked-reason list and the Driver Command Center link. The fork's 4-step flow, boundary and direct routes are also absent.
- **Restore:** static 66929e67 for the core checklist and blocker content; fork e901e6cb for the hero image, Source/Review/Output and boundary.

### 4.3 Document Management: `/business-operations/document-management` (L2). No Next.js page.
- **66929e67** (187w at f254f4e3; 66929e67 similar):
  - H1 "Make office records easy to find, review, and act on."
  - "Records manager lens: A document without purpose becomes a hiding place."
  - Child card "Records control: Classify, review, and route records to the workflow that needs them."
  - "Start with the folder no one trusts."
  - Links `/policies-procedures/` and the records-control child.
- **f254f4e3:**
  - Collect / Classify / Review / Retain stepper.
  - Cards: Record classification, Review status, Retention visibility ("without putting legal guarantees in the website copy"), Workflow handoff.
  - Links Document Control (`/documents/`) and Policies & Procedures.
- **Next.js:** replaced by fork-derived `/document-records-control`. Its 3 generic cards are Records governance, Operational proof and Document vault connection, with a link to `/documents/company-operations-vault`.
- **Lost:** everything listed above, the route itself, and the child link.
- **Restore:** 66929e67 combined with the f254f4e3 cards. Either keep `/document-records-control` as an alias/redirect or retire it.

### 4.4 Records Control: `/business-operations/document-management/records-control` (L3). No Next.js page.
- **Static** (66929e67, 134w):
  - H1 "Classify records by the work they support." Statuses: current, expired, superseded, missing, pending review, blocking work.
  - "Record status: Every file needs type, owner, status, and use."
  - "Classification: Group records by workflow." Covers HR, safety, dispatch, billing, settlement, customer, vendor, policy and leadership records.
  - "Routing: Send record issues to the right owner."
  - "Related work: Records control supports reporting and policy follow-through." Links Operational Reporting and Policies & Procedures.
- **Restore:** 66929e67.

### 4.5 Document and Records Control (fork-only): `/business-operations/document-records-control` (L2)
- **Fork** (e901e6cb, 433w):
  - H1 "Control the document lifecycle without losing the operating context."
  - Source / Review / Output; 4 steps; boundary ("retention schedules, legal holds, professional determinations, and system-of-record authority remain with the fleet").
  - Direct routes `/documents/`, `/workflows/bills-of-lading/`, `/drivers/compliance-documents/`.
  - Hero `business-operations-document-records-control-hero-v1-png.webp` (present).
- **Conflict:** the fork merges static L2 document-management and L3 records-control into one L2 route. The content does not conflict; the fork adds "naming, version, required fields, legal holds".
- **Next.js:** a generic 3-card page (see 4.3).
- **Restore:** fork e901e6cb if the route is kept. Otherwise 301 it to `/document-management/`.

### 4.6 Operational Reporting: `/business-operations/operational-reporting` (L2)
- **66929e67** (190w):
  - H1 "Show leadership what is ready, blocked, aging, and owned."
  - "Operations manager lens: The best report tells the office what to do next."
  - Cards: Owner queue reporting ("Turn status reporting into accountable follow-up"), Readiness summary ("Roll up ready, review, and blocked signals" across driver, dispatch, safety, settlement, billing, HR, finance and documents), Aging view ("Show how long work has been waiting").
  - "Start with the report that creates questions instead of answers."
  - Links: Command Center `/dashboard/`, Fleet Assessment `/scenario-walkthrough/`.
- **f254f4e3:** cards Readiness summary, Owner queues, Aging work, Leadership review.
- **Note:** the 66929e67 hub labels this page "Finance: Plan, analyze, forecast, and report", which is a label mismatch in the hub.
- **Next.js:** generic H1 "Give the business a clear operating picture…"; 3 cards (Leader-ready views, Owner queue, Signal-to-action).
- **Lost:** the readiness roll-up taxonomy, the aging dimensions (workflow, customer, owner, driver, packet, document, office area) and the assessment CTA.
- **Restore:** 66929e67, plus the f254f4e3 Leadership review card.

### 4.7 Owner Queue Reporting: `/business-operations/operational-reporting/owner-queue-reporting` (L3)
- **Static** (66929e67, 145w):
  - H1 "Make every blocker belong to someone."
  - "Accountability view: Reports should reduce ambiguity, not preserve it." Every item has owner, status, reason, due date and record link.
  - "Queue design: Group work by who can move it." Owners: driver manager, HR, finance, billing, dispatch, safety, settlement support, records, customer follow-up, leadership.
  - "Review rhythm: Use aging and consequence to prioritize." Sort keys: age, blocked revenue, dispatch risk, safety impact, customer urgency, repeated owner delay.
  - "Related work: Owner queues make the command center actionable."
- **Fork** (470w):
  - H1 "Turn unresolved work into a decision-ready owner queue."
  - Template sections; boundary "Public reporting examples are static and synthetic…".
  - Routes `/operational-intelligence/`, `/dashboard/`, `/operations-record/`.
  - **"Public-safe proof artifact: Exception Owner Queue"** (HTML; missing in public/, present in the fork dir).
- **Next.js:** H1 "Turn queue volume into ownership, accountable…"; 3 cards.
- **Lost:** the owner list, the prioritisation keys, and the fork proof artifact link.
- **Restore:** static 66929e67 content, the fork hero, and the proof artifact. Copy `exception-owner-queue.html` into public.

### 4.8 Customer Billing: `/business-operations/customer-billing` (L2)
- **66929e67:**
  - H1 "Turn completed work into a billing-ready packet." Proof list: PODs, rate confirmations, lumper receipts, detention notes, accessorial approvals, claim status, customer reference.
  - "Billing manager lens: An invoice should not outrun its packet."
  - Child card "Billing packet control: Review the packet before receivables inherit the problem."
  - "Start with a held invoice or missing packet."
  - Links: Accounts Receivable, Settlements View `/settlements/`.
- **f254f4e3** (170w):
  - POD / Rate / Accessorial / Invoice stepper.
  - Cards Invoice support, Billing holds, Customer packet status, Settlement connection ("Billing readiness and settlement readiness can share the same proof record").
  - "Next page: After billing comes receivable visibility."
  - Links: Billing Packets `/settlements/#billing-packets`.
- **Next.js:** reuses the **fork billing-ar-control H1** ("Make packet readiness and dispute ownership visible.") and image on the parent page, so parent and child are conflated. It has 3 generic cards.
- **Lost:** the manager lens, the billing-packet-control child, the AR hand-off, the settlement connection, and the hold reasons.
- **Restore:** 66929e67 combined with the f254f4e3 cards.

### 4.9 Billing Packet Control: `/business-operations/customer-billing/billing-packet-control` (L3). No Next.js page.
- **Static** (66929e67, 136w):
  - H1 "Confirm the proof before the invoice leaves the office."
  - "Packet status: Ready, review, blocked, disputed, or released."
  - "Proof set: Group every customer-facing support item." Items: POD, BOL, rate con, detention, accessorial approval, lumper receipt, claim note, customer reference.
  - "Billing hold: Make the hold explainable."
  - "Related work: Billing packet control feeds receivable follow-up."
- The 66929e67 hub links here twice (control board and Related Workflows).
- **Restore:** 66929e67.

### 4.10 Billing and AR Control (fork-only): `/business-operations/customer-billing/billing-ar-control` (L3)
- **Fork** (427w):
  - H1 "Make packet readiness and dispute ownership visible."
  - Output "A ready, watch, or hold billing packet…".
  - Boundary "not a collection agency, lender, factor, accountant, or payment processor".
  - Routes `/workflows/proof-of-delivery/`, `/workflows/factoring-packet-preparation/`, `/settlements/finance-operations-alignment/`.
- **Conflict:** the static site splits this into billing-packet-control (under customer-billing) and aging-dispute-control (under accounts-receivable). The fork merges them. The status vocabulary also differs: the fork uses "ready, watch, hold", while static uses "Ready, review, blocked, disputed, released" for packets and "current, watch, follow-up, disputed, blocked, escalated" for aging buckets.
- **Next.js:** H1 "Give every invoice context, evidence, and next action."; one paragraph and 2 links.
- **Restore:** fork e901e6cb if the route is kept, cross-linked to the static #4.9 and #4.12.

### 4.11 Accounts Receivable: `/business-operations/accounts-receivable` (L2). No Next.js page.
- **66929e67:**
  - H1 "Show why money is still open."
  - "AR manager lens: Aging without reason creates noise."
  - Child card "Aging and dispute control: Separate normal aging from fixable blockers."
  - "Start with the AR item no one can explain quickly."
  - Links: Customer Billing, Finance Tier.
- **f254f4e3** (180w):
  - H1 "Keep receivables tied to the billing record and blocker."
  - Invoice / Aging / Follow-up / Resolve stepper.
  - Cards Aging and owner, Dispute context, Factoring packet context, Leadership visibility. Disclaimer: "without pretending to be a lender, bank, factor, or accounting firm".
- **Restore:** 66929e67 combined with the f254f4e3 cards. Both H1s are valid; pick one.

### 4.12 Aging & Dispute Control: `/business-operations/accounts-receivable/aging-dispute-control` (L3). No Next.js page.
- **Static** (137w):
  - H1 "Make every open invoice explainable." Fields: amount, age, customer, packet status, dispute category, factoring support, last touch, next touch, owner.
  - "Review logic: Reason codes make follow-up faster." Codes: missing POD, rate mismatch, detention approval, claim review, customer reference gap, normal aging.
  - "Aging buckets": current, watch, follow-up, disputed, blocked, escalated.
  - "Dispute evidence: Connect the dispute to the packet."
  - "Related work: AR control starts with billing packet readiness."
- **Restore:** 66929e67.

### 4.13 Payroll Administration: `/business-operations/payroll-administration` (L2)
- **66929e67:**
  - H1 "Make pay support traceable to the record behind it."
  - "Payroll support boundary: Visibility first, payroll authority second."
  - Child card "Pay exception control"; cards "Driver pay support: Connect pay questions to the trip." and "Contractor packet status".
  - **The Driver pay profile workbench** (JS).
  - "Start with the pay question that keeps returning."
  - Links: Compensation & Benefits, Settlements.
- **f254f4e3** (196w):
  - "Pay support should never be separated from the operating record."
  - Cards Driver pay support, Contractor packet status, Exception ownership, Careful support language. Boundary: "Payroll, tax, and classification decisions stay with the appropriate responsible parties."
- **Next.js:** reuses the **fork pay-exception-control H1** ("Give every pay exception evidence, ownership, and a review state.") on the parent page. It has 3 cards.
- **Lost:** the workbench (an interactive editor of classification, carrier, pay method, rate and status, with a document rule set), the boundary statement, the contractor packet status, and the links to compensation-benefits and owner-operator (owner-operator deep-links `#driver-pay-profile-workbench`).
- **Restore:** 66929e67 with its 4 JS files and the data JSON, plus the f254f4e3 cards.

### 4.14 Pay Exception Control: `/business-operations/payroll-administration/pay-exception-control` (L3)
- **Static** (139w):
  - H1 "Turn pay exceptions into reviewable support records."
  - "Exception status: Every exception needs a reason code and owner." States: ready, review, blocked, corrected, escalated.
  - "Support record: Group load, receipt, rate, approval, and note." Types: detention, lumper, stop pay, reimbursement, claim hold, deduction, correction.
  - "Resolution path: Assign the next action." Owners: dispatch, settlement support, finance, HR, safety, driver manager, leadership.
- **Fork** (438w):
  - H1 "Give every pay exception evidence, ownership, and a review state."
  - Inputs: settlement statement, deductions, advances, adjustments.
  - Boundary "not a payroll provider, tax adviser, fiduciary, employer, or payment processor and does not determine legal entitlement".
  - Routes `/drivers/settlements-payments/`, `/settlements/exception-visibility/`, `/settlements/single-record-accountability/`.
- **No factual conflict.** The static page is more specific on exception types and owners; the fork is more specific on the boundary.
- **Next.js:** H1 "Resolve exceptions with evidence, ownership, and a clean state handoff."; minimal.
- **Restore:** static 66929e67 combined with fork sections.

### 4.15 Accounting & Finance: `/business-operations/accounting-finance` (L2)
- **Strongest:** db03d3be = 66929e67 (769w), one of the 3 richest subpages.
- **Sections, in order:**
  - H1 "Give finance the operating record behind the number."
  - "Finance manager lens: Finance needs source context and service capacity, not another disconnected report." Stats 18 review items / 5 blocked. Boundary: does not replace accounting, banking, lending, tax, factoring, payroll.
  - "Finance detail pages: Separate the work by the question the office is trying to answer." Cards AP and vendor control, Cash-flow review.
  - **"Live finance workspace: Click the finance status, then inspect the packet reason and clearance route."** (JS; 5 records)
  - "Driver pay to finance bridge" (JS).
  - **"Finance operating substance: A trucking finance page has to show why the money is moving, waiting, or blocked."** Four columns with 4 bullets each:
    - Billing readiness: "Do not let receivables inherit a weak packet."
    - Receivable visibility: "Make aging explainable before escalation."
    - AP and vendor review: "Keep vendor bills tied to operating approval."
    - Cash-flow control: "Separate what is ready from what is waiting on the office."
  - Capture / Classify / Resolve stepper.
  - "Start with one held invoice, vendor question, or cash-flow blind spot." Links Take the BOF Fleet Assessment and Back to Business Operations.
- **Fork** (437w, later rewrite): H1 "Connect operating events to the accounting review queue."; template sections; routes to billing-ar-control, document-records-control and owner-queue-reporting; hero image (present).
- **Comparison:** the static page is clearly more substantive, with interactive features, 4 control columns and child pages. The fork rewrite is template text.
- **Next.js:** H1 "Keep the money story aligned with the operational record."; 3 cards (Payroll control, Receivables & AR, Financial governance); "Settlements and vault continuity".
- **Lost:** all of the above, plus the child pages ap-vendor-control and cash-flow-review.
- **Restore:** 66929e67, optionally with the fork hero image.

### 4.16 AP & Vendor Control: `/business-operations/accounting-finance/ap-vendor-control` (L3). No Next.js page.
- **Static** (155w):
  - H1 "Keep vendor questions tied to approvals and operating proof." Items: repair invoices, fuel/toll, lumper, contractor reimbursements, equipment charges.
  - "Control point: Do not pay, dispute, or delay without seeing the source record."
  - "Vendor packet: Group the bill with the support."
  - "Owner queue: Make unresolved questions assignable."
  - "Related finance work: AP control supports cash-flow visibility." Links Cash-Flow Review, Document Management and Finance Tier.
- **Restore:** 66929e67.

### 4.17 Cash-Flow Review: `/business-operations/accounting-finance/cash-flow-review` (L3). No Next.js page.
- **Static** (149w):
  - H1 "See what is ready to move and what is holding cash back."
  - "Finance review: Aging is more useful when the office can see the reason."
  - "Receivable signal: Explain why an invoice remains open."
  - "Owner action: Turn cash-flow concern into follow-up work."
  - "Related finance work: Cash-flow review depends on billing and receivables context."
- **Restore:** 66929e67.

### 4.18 HR Tier: `/business-operations/hr-tier` (L2). No Next.js page.
- **Strongest:** db03d3be = 66929e67 (908w), the richest subpage.
- **Sections, in order:**
  - H1 "Run trucking HR as an operating control center."
  - "HR operating lens: People records must answer one question: can this worker safely and reliably support the fleet?" Stats 42 worker files / 7 needs review.
  - "HR specialty pages: Build the people operation around the work that actually slows fleets down." Four child cards: Employee relations, Recruiting and onboarding, Compensation and benefits, Talent management.
  - **"Live HR workspace: Click the HR status, then inspect why the worker record is ready, under review, at risk, or blocked."** (JS; 6 workers)
  - **"HR operating substance: A trucking HR page has to answer more than whether a form exists."** Four control blocks with 4 bullets each:
    - Employee relations control
    - Recruiting pipeline control
    - Compensation and benefits support
    - Talent and retention rhythm
  - "Operating discipline: The HR Tier works when every issue has a record, owner, consequence, and next action." Intake / Review / Follow-up stepper.
  - "Start with the HR file that keeps creating follow-up." Links the assessment and Driver Onboarding.
- **f254f4e3:** a shorter early version, "Keep people records connected to the fleet workflow."
- **Next.js:** none. The hub does not link to HR at all, and BusinessOperationsSectionNav has no HR tab.
- **Lost:** the entire HR branch (5 pages, 2 interactive widgets).
- **Restore:** 66929e67.

### 4.19 Recruiting & Onboarding: `/business-operations/hr-tier/recruiting-onboarding` (L3)
- **Strongest:** 66929e67 (429w).
- **Sections:**
  - H1 "Move driver and staff candidates into readiness with fewer handoff gaps."
  - "Readiness chain: Candidate interest becomes operating value only when the file can support the assignment."
  - **"Recruiting and onboarding pipeline: Move candidates from interest to first-load readiness with every handoff visible."** (JS: 6 candidates RCR-118…139 with field details and clearance paths)
  - Source / Screen / Release stepper.
  - "Related HR work: Onboarding connects directly to compensation, safety, and dispatch readiness." Links Compensation & Benefits and Driver Command Center.
- **Restore:** 66929e67.

### 4.20 Compensation & Benefits: `/business-operations/hr-tier/compensation-benefits` (L3)
- **Static** (205w):
  - H1 "Keep pay and benefit support tied to the records behind it."
  - "Support boundary: BOF organizes visibility; it does not make payroll, tax, legal, or benefits determinations."
  - "Compensation support: Make the reason for a pay question visible." 4 bullets.
  - "Benefits coordination: Show where enrollment or worker support stands." 4 bullets.
  - Pay-profiles widget (compensation).
  - "Related finance work: Compensation support connects HR, payroll, and settlements."
- **Restore:** 66929e67 with the JS.

### 4.21 Talent Management: `/business-operations/hr-tier/talent-management` (L3)
- **Static** (219w):
  - H1 "Turn training and retention signals into visible operating work."
  - "Talent signal: Retention improves when the office can see where a good worker is getting stuck."
  - Four cards: Training readiness, Coaching path, Retention risk, Advancement readiness.
  - Pay-profiles widget (talent).
  - "Related HR work: Talent management connects employee relations, safety, and operations." Links `/safety/` and Employee Relations.
- **Restore:** 66929e67.

### 4.22 Employee Relations: `/business-operations/hr-tier/employee-relations` (L3)
- **Static** (212w):
  - H1 "Keep people issues visible before they become operating drag."
  - "Operating concern: Every issue needs a fact pattern, owner, and next review point."
  - "Case intake: Capture the concern clearly." 4 bullets.
  - "Operating impact: Separate HR review from fleet consequence." 4 bullets.
  - "Related HR work: Employee relations works best when it ties back to training and policy acknowledgement." Links `/policies-procedures/` and Talent Management.
- **Restore:** 66929e67.

### 4.23–4.36 The 14 functional-area pages

All 14 were added in 0db8b768 (2026-07-21) and are identical at e7a6c7b8 and 66929e67. None has a Next.js page, so **everything listed below is lost.**

Shared structure: an eyebrow "<X> control"; the H1; `##` sections, mostly with tables or numbered workflows; "BOF Governing Policy" callouts linking policy PDFs; a closing CTA (`/scenario-walkthrough/` unless noted); and "← Back to Business Operations".

- **Accounting** (`/accounting`, 436w): "Accounting & Financial Operations for Trucking". `##` sections:
  - What Makes Trucking Accounting Different
  - Chart of Accounts Built Around Freight (table: Revenue / Direct Costs / Equipment / Settlements)
  - Factoring, AR, and Billing Packets (POL-006)
  - AR/AP Operating Control (POL-007)
  - Finance Clearance Path (4 steps)
  - Ready to see this in action?
- **Cash Flow** (`/cash-flow`, 276w): "Cash Flow & Factoring Strategy". `##` sections:
  - 13-Week Cash Flow Model (table: projected load revenue / payment lag / fixed obligations / concentration risk)
  - Path Out of Factoring (4 steps; POL-006)
  - Bring one held invoice into cash-flow control → `/settlements/`
- **ERP** (`/erp`, 424w): "ERP & Workflow Integration for Fleets". `##` sections:
  - Load-to-Cash Workflow (7 steps; POL-002/003/004/006)
  - Asset and Vendor Workflow (POL-007)
  - Escalation Rules (table, e.g. "Billing packet overdue → Billing to director after 3 days")
- **Excise Taxes** (`/excise-taxes`, 381w): "Excise Taxes & Federal Fleet Compliance". `##` sections:
  - The Excise Tax Landscape for Motor Carriers
  - Core Tax Work BOF Tracks (table: 2290/HVUT, IFTA, IRP, UCR, state weight-distance; POL-007)
  - Clearance Workflow (5 steps)
- **Fleet Maintenance** (`/fleet-maintenance`, 225w): "Fleet Maintenance & Asset Management". `##` sections:
  - Maintenance Records That Affect Release (table: PM, DOT annual, DVIR defect, tire program; Part 396)
  - Breakdown Response Workflow (4 steps; POL-007)
- **Fuel Management** (`/fuel-management`, 221w): "Fuel Management & Cost Control". `##` sections:
  - Where Fuel Control Breaks (table: out-of-route, IFTA mismatch, idle, DEF)
  - Route and Fuel Decision Record (Plan / Authorize / Reconcile; notes that live APIs are not yet connected)
- **Human Resources** (`/human-resources`, 530w): "Human Resources & DOT Compliance for Motor Carriers". `##` sections:
  - What Makes Trucking HR Different (49 CFR 391/382)
  - The Driver Qualification File (table: Application 391.21, MVR 391.23/.25, PSP, Clearinghouse 382.701, Medical 391.41/.45; POL-001)
  - DOT Drug & Alcohol Testing Program (table, 5 types; POL-001 §7)
  - Onboarding-to-Dispatch Workflow (7 steps)
  - Ongoing Monitoring Calendar (POL-007)
- **Insurance** (`/insurance`, 207w): "Insurance Management & COI Tracking". `##` sections:
  - The Carrier Insurance Stack (table: auto liability/BMC-91, cargo, physical damage, workers comp/occ-acc)
  - COI and Renewal Workflow (4 steps; POL-008)
- **Legal & Contracts** (`/legal-contracts`, 206w): "Legal & Contract Management". `##` sections:
  - Contract Library by Operating Risk (table: broker-carrier, shipper, equipment lease, vendor)
  - Contract Clearance Path (4 steps)
  - The page states "does not give legal advice".
- **Operating Authority** (`/operating-authority`, 193w): "Operating Authority & FMCSA Portal Management". `##` sections:
  - Authority Health Checklist (table: USDOT/MCS-150, MC, BOC-3, UCR, portal access/MFA)
  - Authority Clearance Path (4 steps)
- **Owner-Operator** (`/owner-operator`, 218w): "Owner-Operator & Leased Contractor Management". `##` sections:
  - The Owner-Operator Record (table: lease, qualification, settlement structure, termination)
  - Aggregator and Carrier-Specific Rules
  - Demo callout "Driver Pay Profile Workbench" → `/business-operations/payroll-administration/#driver-pay-profile-workbench`
  - CTA "Open Payroll Administration"
- **Payroll** (`/payroll`, 538w): "Payroll & Driver Compensation for Motor Carriers". `##` sections:
  - The Trucking Compensation Landscape
  - Driver Compensation Models (Per-Mile / Percentage of Load / Day Rate-Hourly / 1099 Owner-Operator)
  - Owner-Operator Settlement Deductions (table; POL-001)
  - Multi-State Payroll and Per-Diem Support
  - Payroll-to-Settlement Reconciliation (5 steps; POL-006, POL-007)
- **Safety / SMS** (`/safety-sms`, 220w): "Safety Management & SMS Compliance". `##` sections:
  - What the Safety Page Must Answer (table)
  - SMS BASIC Review (7 BASICs; 4 steps; POL-005)
  - **No closing CTA and no back link.** It was already incomplete at 0db8b768.
- **Technology** (`/technology`, 229w): "Technology Stack & Integration Management". `##` sections:
  - Technology Fragmentation Record (table: ELD, TMS, accounting/payroll, documents)
  - Integration Clearance Path (4 steps; POL-008)
  - CTA "Open Documents" (`/documents/`)
  - The POL-008 callout says "…before the demo becomes an MVP". That is internal-facing copy to edit before republishing.

**Overlap and conflicts with the L2 lens pages.**
- `/human-resources` and `/hr-tier`, `/payroll` and `/payroll-administration`, `/accounting` and `/accounting-finance`, and `/cash-flow` and `/accounting-finance/cash-flow-review` cover the same domains from two angles:
  - The area pages are regulatory and domain-specific (CFR citations, tables).
  - The lens pages are workflow and queue oriented, with interactive features.
- They do not contradict each other factually. The 66929e67 hub links only the area versions, while the lens versions hold the interactive demos.
- Both sets should be restored. Cross-link the pairs; they are currently linked only one way (cash-flow-review ↔ AR).

## 5. Summary of conflicts between generations

1. **Hierarchy differs by generation:**
   - The static site has 8 lens L2 pages with 12 L3 children, plus 14 area L2 pages.
   - The fork has 1 hub, 2 L2 pages (accounting-finance, document-records-control) and 4 L3 pages, merging billing and AR into `billing-ar-control`.
   - Next.js has 6 L2 tabs and 4 L3 pages that follow the fork, and drops HR, AR, Document Management and all 14 areas.
2. **Next.js puts child content on parent pages.** `customer-billing` and `payroll-administration` reuse the fork L3 H1s and hero images.
3. **CTA target drift.** Static pages use `/scenario-walkthrough/` ("Take the BOF Fleet Assessment" / "Schedule a Demo"). The fork uses `/book-demo/`. Next.js uses `/dashboard` and `/documents/company-operations-vault`. Neither `/scenario-walkthrough` nor `/book-demo` exists in the current `app/`.
4. **Status vocabularies differ.** Static uses ready / review / blocked (plus at risk, disputed, escalated). The fork uses ready / watch / hold. A restore should pick one.
5. **Factual defects in history:**
   - The db03d3be/0db8b768-era hub module tile reads "Excise Taxes 1040 Filed"; it should be 2290.
   - The 66929e67 hub maps "Finance: Plan, analyze, forecast" to `/operational-reporting/`.
   - safety-sms lacks a CTA.
   - technology's policy callout has internal MVP wording.
6. **Demo numbers are illustrative and inconsistent across versions.** For example, the 46b2c464 hub shows 82 employees and $418K payroll; the db03d3be HR module shows 42 files; the 66929e67 hub shows 12 open queues. These are all labelled demo data. Do not present them as real.

## 6. Recommended restore approach (per source)
- **Hub:** use 46b2c464 for content depth: §2–§10 (KPIs, tiers, onboarding lifecycle, insurance, aggregator, factoring, accounting table, executive view, boundary). Add from 66929e67 the navigation to all 14 area pages, the control board and the related workflows. Add the db03d3be "reason/owner/consequence/clearance" block and the f254f4e3 directory of the 8 lens pages. Optionally use the fork worktable hero (already in public).
- **The 8 lens L2 pages and 12 L3 pages:** restore from 66929e67, which is content-identical to the best db03d3be versions. Merge the f254f4e3 4-card sections into driver-onboarding, document-management, operational-reporting, customer-billing, accounts-receivable and payroll-administration. Port the 3 inline widgets and the pay-profile workbench (4 JS files plus `bof-public-operations.json`) to React components. A static JSON import is enough; Supabase is optional.
- **The 4 fork L3 pages:** use the static original as the base and append the fork's hero image, Source/Review/Output block, boundary statement and direct routes. The fork is longer but not more substantive. Keep the fork-only routes (`billing-ar-control`, `document-records-control`) from e901e6cb or redirect them to their static equivalents.
- **The 14 area pages:** restore from 66929e67. Copy the 8 policy PDFs from `66929e67:Website/assets/documents/policies/` into `public/assets/documents/policies/`.
- **Assets to copy into `public/assets/`:**
  - `images/dashboard-mockups/bof-business-operations-command.webp`
  - `images/photos/site-pass/21-fleet-office-record-clerk.webp`
  - `documents/public-safe/exception-owner-queue.html` (from the fork dir)
  - the 8 policy PDFs
  - `data/bof-public-operations.json`
