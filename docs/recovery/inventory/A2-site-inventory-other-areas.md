# BOF Public Website — Content Recovery Inventory (excluding Business Operations)

Repo: `/home/user/bof-website-recovery` @ `244d6928` (origin/release/web-004-005-prep, 2026-10-17). Read-only analysis; no repo changes made.
Generated 2026-10-18. Metric shorthand: `Nw/Nh/Nm/Nf` = visible words / h1-h3 headings / media refs / `<form>` tags (computed outside header/nav/footer).

## 0. Generations and provenance

| Gen | Location | Date | Notes |
|---|---|---|---|
| 1a | `Website/` baseline `2e325c30` "Establish BOF website baseline" | 2026-06-15 | static HTML, `site.js` |
| 1b | June feature branches (`origin/feature/*`, `deploy/aggregator-motion-only`, `platform-expansion-clean`) | 2026-06-19..07-01 | animated demos + narration (a05e9163, 06-20), scenario-walkthrough PHP form (c626a888, 06-22), document-readiness-engine (4a43cdac, 06-25), audience offers (10e4d60b, 06-25), homepage-audience-first (3e315ae7, 06-26), vault intake workbench (f0952c7d, 06-26) |
| 1c | `origin/broad-product-redesign` `7333dacf` "Refine business operations content and header navigation" | 2026-07-10 | **richest Dispatch / Drivers / Safety / Settlements command-center pages** (only on this branch) |
| 1d | `origin/integrate-public-redesign` f09f6fba (07-12), `origin/tighten-public-page-hierarchy` db03d3be/0db8b768 (07-20/21) | 2026-07 | richest Documents page (db03d3be) |
| 1e | `origin/codex/public-site-deployment-candidate` `66929e67` | 2026-07-29 | "Wave 3/4": 5-path `/assessment` hub with scoring, unified public intake + Supabase edge function, `/customer-demo` unified portal, `/bof-vault`, `/company`, `/contact`, `/aggregators`, `/for-hire-fleets`, `/carriers`, design-system-2. Subpages (drivers/*, government/*, private-fleets/*, workflows/*) are thin (~170-210w) stubs. |
| 2 | `recovered/fork-restored-20260819/` (commit `cc419d0e`, 2026-08-19, manifest `docs/recovery/fork-restoration-manifest-2026-08-19.md`) | site built ~2026-08-03 (`?v=20260803.2`), deployed at `backofficefleet.com/fork/` | "cinematic" redesign: per-page desktop/mobile cinematic hero webp + cutout PNGs, `cinematic-nav.js`; second-level pages expanded to ~450w; **27 narration mp3, 6 mp4 videos, 329 webp**. Many legacy URLs are redirect stubs (see §2). Not served by Next.js (no rewrite); only 5 videos are proxied via `/api/marketing-demo-media`. |
| 3 | Next.js `app/(marketing)/**` | baseline c505f404 2026-05-22; production 32ca6d0b/9cf71b4d 2026-08-28/29; 02705000 2026-09-18; homepage redesign 56fa112f 2026-10-17 | product routes `/dispatch /documents /drivers /safety /settlements /command-center /dashboard /demo/*` are **app runtime** in `app/(bof)` (AppShell + demo seed), not marketing pages. |

### Media availability (all non-Business-Ops pages)
- Fork pages reference **254** local media files: **251 MISSING from `public/`**, all 254 present under `recovered/fork-restored-20260819/assets/`. Only `documents/load-proof/pod-1907-dock-photo.webp`, `pretrip-10482-loaded-cargo.webp`, `profiles/drivers/driver-ref-001-natural.jpg` exist in `public/`.
- Candidate (07-29) pages reference 88 media: 86 missing from `public/`; 13 exist **only in git history** (not in recovered/): design-system-2 heroes (`ds2-dispatch/drivers/safety/settlements/bof-vault/policies-governance-hero-clean.png`), DS2 SVG logos, `legacy-heroes/bof-vault-hero2.png`, `partners/freight-brace/freight-brace-trailer-photo.jpeg`, `documents/policies/bof-pol-001-driver-qualification-policy.pdf`.
- Policy PDFs `Website/assets/documents/policies/bof-pol-001..024*.pdf` and file-cabinet samples (`sample-master-services-agreement.pdf`, `sample-insurance-notice-letter.html`, `sample-claims-proof-packet-insurance-escalation-sop.pdf`) exist **only in git history** (66929e67); not in `public/` or `recovered/`.
- No `.mp3/.mp4` anywhere in `public/`. Audio: `recovered/.../assets/audio/animated-demo/track-{a,b,c}/*.mp3` (27) + `narration-manifest.json` (tracks A "BOF Operations Lifecycle", B "BOF Business Operations", C "BOF Aggregator Network Lifecycle", 9 scenes each). Video: `recovered/.../assets/videos/bof-{aggregator,business-operations,customer-portal-load-intake,driver-vault,fleet-owner,settlements-readiness}.mp4` + posters in `assets/images/video-posters/`.

---

## 1. Summary table

| Area | Most substantive historical version | Fork (Aug) | Current Next.js | Lost |
|---|---|---|---|---|
| Homepage | `Website/index.html` @ **4a43cdac** (2026-06-25) 1442w/46h/15m; 6-group mega-nav | `recovered/.../index.html` 1063w/31h/13m, cinematic | `app/(marketing)/page.tsx` → `components/marketing/MarketingHomeAccountable.tsx` (56fa112f 10-17) | audience → workflow → demo wiring, site-pass photo gallery, record-chain story, demo links |
| Fleet / load readiness | fork `fleet/` 2046w (≈ 9abf61c4 06-29 1988w) | same | `/fleet-operations` = re-export of `/for-hire-carriers` | trip start/middle/end readiness gates, TMS-LD-10482 load detail, watch/hold examples, fleet-owner video |
| Dispatch | **7333dacf** `dispatch/` 1725w/44h/7m (broad-product-redesign only) | 917w | `/dispatch` = product app `app/(bof)/dispatch` | marketing explainer, proof-packet states, release states, photo panels, load-intake video |
| Documents | **db03d3be** (07-20) `documents/` 1598w/46h/10m | 1139w | `/documents` = product app `app/(bof)/documents` | 11-category document control map, sample MSA/insurance/SOP docs, policy PDF links |
| Drivers / DQF | **7333dacf** `drivers/` 1885w/41h/10m; fork `drivers/*` subpages ~450w each | 1537w + 4 subpages | `/drivers` product app; marketing `/driver-experience` (47 lines) | roster cards, ready/watch/hold driver packets, credential panels, driver-vault video, DQF engine |
| Safety & compliance | **7333dacf** `safety/` 1272w; f09f6fba `safety-compliance/` 724w | 1222w | `/safety` product app | before/during/after-trip evidence model, safety hold evidence narratives |
| Customer portal | fork `customer-portal/` + 9 subpages, `customer-portal.js` (741 lines) | same | `app/customer-portal/*` (Next product, `CustomerPortalShell`) | static marketing demo w/ quote calculator & load-intake form (localStorage) |
| BOF Vault | candidate `bof-vault/` @ ec17c308 (07-28) 750w; `interactive-demo/drivers/document-intake/` + `vault-document-intake.js` (06-26) | intake workbench only | `app/(marketing)/bof-vault/page.tsx` + 8 L2 pages | intake workbench demo (presets, pipeline, audit) |
| Assessment | candidate `assessment/` + `wave3-assessment.js` (542 lines, f48bef67 07-28); `scenario-walkthrough/` + `submit.php` (c626a888 06-22) | `/assessment` → redirect `/book-demo/`; real assessment = `/scenario-walkthrough/` | `/book-assessment` → JS redirect → `/assessment` (`app/assessment/page.tsx`, `lib/assessment-tracks.ts`) | real scoring rubric, 5 audiences incl. aggregator & driver, inquiry submission (no current submission at all) |
| Interactive demos | `interactive-demo/` + 20 sub-routes, `animated-demo*` x3 w/ narration, `executive-demo`, `demo`, `demo-paths`, `walkthrough`, `narration-export`, `customer-demo` | all except customer-demo | none of those URLs exist; `/demo/*` product routes; 5 videos on homepage | everything except videos |
| Aggregators | fork `aggregator-partner-offer/` 1650w; `aggregator-command-center/` 1110w; `animated-demo-aggregator/` 2333w | `/aggregators` → redirect `/aggregator-partner-offer/` | `app/(marketing)/aggregators/page.tsx` (231 lines) | 30-day pilot offer, command center, aggregator outreach, track-C narration |
| For-hire / carriers | fork `fleet-operator-offer/` 1609w, `carrier-readiness/` 693w, `for-hire-fleets/` 456w; candidate `carriers/` 471w | `/carriers` → `/carrier-readiness/` | `app/(marketing)/for-hire-carriers/page.tsx` (376 lines) | carrier ready/watch/hold packets, fleet operator pilot |
| Private fleets | fork `private-fleets/` 812w + 4 subpages; `private-fleet-offer/` 1106w | same | `app/(marketing)/private-fleets/page.tsx` + 5 L2 | cargo-securement proof (FreightBrace), private fleet pilot |
| Government | fork `government/` 909w + 4 subpages (~450w) | same | `app/(marketing)/government/page.tsx` + many L2/L3 (municipal services etc.) | contractor readiness pilot narrative (current gov tree is extensive — partially a rewrite) |
| Founding fleet | fork `founding-fleet/` 786w + apply/pricing/trial, `founding-fleets/` 466w | `priority-fleet-program` → `/founding-fleet/` | `/founding-fleet` → `FoundingFleetProgramPage.tsx` (demo form, no submit) | reservation-deposit/implementation pricing guidance pages |
| Company / contact / book demo | fork `company/` 421w, `contact/` 373w, `book-demo/` 795w (mailto CTAs); candidate company 574w | `/book-a-demo` → `/book-demo/` | `/company` (team bios), `/contact` (DB-backed inquiry form) | book-demo "working session" page with 5 scenario-specific mailto CTAs |
| Recruiting / careers | no public static careers page (HR recruiting is Business Ops) | – | `/careers` (`CareersPageClient` → `/api/recruiting/apply`), `/apply` (strategy-conversation wizard) | – (new in Next) |

---

## 2. Fork redirect stubs (route moved)
`recovered/fork-restored-20260819/*/index.html` with `location.replace`:
`assessment → /book-demo/`, `book-a-demo → /book-demo/`, `aggregators → /aggregator-partner-offer/`, `carriers → /carrier-readiness/`, `command-center(/issue) → /aggregator-command-center/`, `about → /company/`, `who-we-serve → /sectors/`, `priority-fleet-program → /founding-fleet/`, `network-readiness → /capacity-intelligence/`, `load-readiness → /operations-record/`, `dispatch/load-intake → /dispatch/`, `blog/* → /resources/*`.
`interactive-demo/<sub>/index.html` are 13-line shells (`<main data-demo-route-page>`) rendered by `interactive-demo-routes.js` — they are functional, not dead.

---

## 3. Homepage and navigation

### Richest historical: `Website/index.html` @ 4a43cdac (2026-06-25, also 10e4d60b) — 1442w/46h/15m
Title "BackOfficeFleet | Trucking Back-Office Operating Layer". H1 "BOF shows what can move, what is blocked, and who owns the next action."
Sections: audience chooser (Fleet Operators / Aggregators / Drivers-BOF Vault / Private Fleets) → 8 module cards (Aggregator Command Center, Document Intake + Readiness Engine, Capacity Intelligence, Operational Intelligence, Business Operations, Sectors, Executive Demo, Scenario Walkthrough) → AI assistance (4 cards) → record-chain story (release story, record desk, drivers ready, operational execution, document consequence) → 6-photo "site-pass" gallery (document control station, after-hours command desk, claims packet, owner view, driver file audit, morning dispatch huddle) → ICP (20-50 truck for-hire, private, government) → record types → final CTA.
CTAs: `/book-demo/`, `/interactive-demo/start/`, `/executive-demo/`, `/customer-portal/`, `/demo/`, `/fleet-operator-offer/`, `/aggregator-partner-offer/`, `/interactive-demo/drivers/document-intake/`, `/scenario-walkthrough/`, `/interactive-demo/drivers/`, `/interactive-demo/dispatch/`, `/operations-record/#bof-1842`.
Media: `animations/bof-readiness-flow.webp`, `heroes/bof-dashboard-hero-illustrated.webp`, `photos/{dock-document-review,fleet-office-record-review,pod-bol-proof-packet}.webp`, `photos/site-pass/01..06-*.webp`, `profiles/drivers/driver-ref-00{1,3,6}.jpg` — all missing from public/, present in recovered/.
**Top nav (6 dropdowns + CTA):**
- Platform: Command Center `/dashboard/`, Operational Intelligence, Capacity Intelligence, Business Operations, Customer Portal, Scenario Walkthrough, Assessment Paths `/demo-paths/`
- Workflows: Load Intake `/customer-portal/load-intake/`, Quotes, Shipments, Assignment, Documents, Document Intake, Tracking, Billing, Settlements, Claims & Records `/operations-record/`
- Drivers & Compliance: Drivers, Driver Vault Assessment `/interactive-demo/drivers/`, Document Intake, Carrier Readiness, Documents, Safety, Compliance Workflows `/safety-compliance/`, Driver Settlements
- Solutions: Fleet Operators `/fleet/`, Private Fleet Assessment, Aggregators `/aggregator-command-center/`, Sectors, Backhaul & Capacity Sharing, Government Contractor Assessment
- Demos: Executive Demo, Animated Demo, Business Animated Demo, Aggregator Animated Demo, Scenario Walkthrough, Assessment Paths, Try Demo `/interactive-demo/start/`, Book Demo
- Company / Contact: Homepage, Solutions Overview, Trust & Governance, Founding Fleet, Demo Paths, Book Working Session

### Variants
- 3e315ae7 (06-26, feature/homepage-audience-first-redesign): "Managed back-office clarity for trucking fleets." 491w, `homepage-audience.js` audience selector (later rewrite; thin).
- Candidate 66929e67 (07-29): 989w, H1 "Run the office layer behind every load."; nav: Who We Serve ▾ (Private Fleets, Government Fleets, Aggregators `/aggregator-outreach/`), Drivers, Dispatch & Operations, Safety & Compliance, Settlements & Billing, Business Operations, Policies & Procedures, Company `/trust-governance/`, Command Center, CTA Sign In `/dashboard/`. Uses `logo-animation.js`. (Wave-4 inner pages use a different nav: Who We Serve ▾ Aggregators/Private Fleets/For-Hire Fleets/Government, Assessment, Customer Demo.)
- Fork (Aug): 1063w/31h/13m, H1 "Know what can move before the wheels turn."; cinematic hero `cinematic/home-controlled-departure-desktop-v3-png.webp`, cutouts `fleet-truck-cutout.png`, `operations-team-cutout.png`; 6-module workflow (Drivers, Dispatch & Operations, Safety & Compliance, Settlements & Billing, Business Operations, Policies & Procedures); audiences (Trucking/Private/Government/Aggregators/Business Ops). **Nav:** Solutions `solutions/`, Who We Serve `sectors/`, Business Operations, Intelligence & Trust `operational-intelligence/`, Founding Fleet; CTA "Book a working session" `book-demo/`. Footer (cinematic-nav.js): Platform / Fleets / Company & Trust / Actions groups.

### Current Next.js
`app/(marketing)/page.tsx` → `components/marketing/MarketingHomeAccountable.tsx` (+ `MarketingHomeExperience.tsx`, `MarketingHomeOperations.tsx`); redesigned 56fa112f (2026-10-17, "outsourced operations positioning"). Hero image `/approved/bofhero.png`. Embeds `FleetSavingsCalculatorClient` and `FleetAssessmentWizardClient` (browser-only storage), 5-video film switcher via `/api/marketing-demo-media` (serves `recovered/.../assets/videos/*.mp4` — the only recovered media reachable), command preview, workflow cards to `/demo/*`.
**Nav** (`components/marketing/MarketingNavigation.tsx`, mounted by `components/BofHeader.tsx` on a hard-coded marketing route list): Sectors ▾ (For-Hire Carriers, Private Fleets, Aggregators, Government) · How BOF Works · What We Do ▾ (overview, People & HR, Finance, Operations & Compliance, Procurement & Savings) · Business Operations ▾ (7) · Documents ▾ (Documents, Driver Vault [runtime], BOF Vault) · Q&A · Who Are We? `/company` · Insights `/blog` · More ▾ (Careers, Team Briefing, Founding Fleet); CTAs "Request a BOF Assessment" `/book-assessment?source=header-marketing`, "See BOF in Action" (runtime dashboard). Aug-2026 version (26ab47b2) was flat: For-Hire, Private, Government, BOF Vault, Product, Driver Experience, Fleet Operations, Investors, Contact, Assessment, Apply.
**Lost vs history:** no Demos menu, no links to any interactive/animated/executive demo, no audience offer pages, site-pass photography, record-chain narrative tied to concrete records (TMS-LD-10482 / BOF-1907 / BOF-1931).

---

## 4. Operations areas

### Fleet / Load readiness (`/fleet/`)
- Best: fork `recovered/.../fleet/index.html` 2046w (same structure as 9abf61c4 06-29, 1988w; candidate 07-29 cut to 893w = later trim). H1 "See the whole fleet before one exception becomes a lost day." Sections: start/middle/end readiness review ("No load releases until driver, carrier, equipment, cargo, route, facility, commercial packet are ready"), DVIR handling, load packet readiness, in-trip watch items, post-trip defect review, billing/factoring readiness, TMS-LD-10482 Dallas→Memphis load detail, BOF-1907 watch, BOF-1931 hold, closing assessment CTA.
- Links: `book-demo/`, `scenario-walkthrough/`, `operations-record/{release-readiness-1842,delivery-proof-1907,compliance-hold-1931}/`. Media: `cinematic/fleet-dawn-readiness-{desktop,mobile}-v2-png.webp`, `videos/bof-fleet-owner.mp4` + poster.
- Current: `app/(marketing)/fleet-operations/page.tsx` re-exports `/for-hire-carriers`. No equivalent load-gate content.

### Dispatch (`/dispatch/`)
- Best: **`7333dacf:Website/dispatch/index.html`** (2026-07-10, broad-product-redesign only) 1725w/44h/7m. H1 "Dispatch & Operations Command Center"; Dispatch Manager Operating View (can move / must wait / owner / action); customer load intake video; proof packets Ready/At Risk/Blocked; release gates (Pre-Trip, Route/Lane, Equipment, Driver Assignment); Allowed/Warning/Review/Blocked; document-handling controls; decisions for TMS-LD-10482/BOF-1907/BOF-1931; 4-step flow; photo panels (exception report, field proof, record clerk, yard ops).
- Media: `photos/site-pass/{17,19,21,22}-*.webp`, `videos/bof-customer-portal-load-intake.mp4` + poster. Fork version 917w drops intake video, decision panels and photo panels; adds cinematic `dispatch-release-desk-*.webp`.
- Current: `/dispatch` is the product runtime (`app/(bof)/dispatch`). Marketing explainer lost.

### Documents (`/documents/`)
- Best: **`db03d3be:Website/documents/index.html`** (2026-07-20; also ec21e9e4/4faa330c) 1598w/46h/10m. H1 "BOF turns TMS load documents into release evidence." 11-category document-control map (DQF, Secondary Driver Docs, BOF Vault Intake Workbench, Carrier Registry, Dispatch & Load, Safety/Claims/Insurance, Contracts/Legal, Policies & SOPs, Finance/Settlements, Training, HR) each linked; real sample documents (MSA PDF, Insurance Notice Letter HTML, Claims/Proof Packet/Insurance Escalation SOP PDF); release packet / DQF summary / carrier packet summaries; POD-1907 large proof; governance controls; photo panels.
- Fork 1139w drops the 11-category map and sample-document section. Current `/documents` = product file cabinet (`app/(bof)/documents`).

### Driver qualification / Drivers
- Best: **`7333dacf:Website/drivers/index.html`** 1885w/41h/10m. "Driver Command Center": profiles (M. Alvarez Dallas / J. Carter Tulsa / T. Brooks Little Rock), DQF document signals, roster cards, credential panel, ready/watch/hold driver packets DRV-2048/1187/3301, access-policy section, photo panels; `videos/bof-driver-vault.mp4`. Fork 1537w keeps most and adds 4 second-level pages (fork-only ~440-460w each): `drivers/{communication,compliance-documents,onboarding,settlements-payments}/` (source record → review path → decision output; 4-step; boundary; related routes). Candidate versions of those subpages are ~190w stubs.
- Related: `document-readiness-engine/` (fork 1358w/50h; origin 4a43cdac 06-25): intake → classification → rules → status → workflow, Cargo Securement & Proof Workflow, human review.
- Interactive DQF: `interactive-demo/drivers/drv-001..012` rendered by `interactive-demo-routes.js` (DQF score 68-98, category rows, document requests, employer-generated forms, rendered CDL/medical certificate/MCSA/tax/insurance/HR/road-test forms, reviewer panel, audit trail).
- Policy PDF `bof-pol-001-driver-qualification-policy.pdf` (history only).
- Current: `/drivers` product app; `app/(marketing)/driver-experience/page.tsx` (47 lines, 26ab47b2) is a short summary.

### Safety & compliance
- Best: **`7333dacf:Website/safety/index.html`** 1272w (fork 1222w nearly equivalent + regulated-responsibility section). Before/during/after-trip evidence (pre-trip docs/photos, during trip, after trip, cargo securement, safety event workflow, compliance records), HOS/ELD, route risk, camera events, claims evidence, safety hold BOF-1931 (why dispatch/finance wait). `safety-compliance/` (f09f6fba, 724w) credential-status → dispatch consequence.
- Current: `/safety` product app (`app/(bof)/safety`); `components/safety/SafetyCommandHero.tsx` is unused.

### Customer portal
- Fork `customer-portal/` (301w) + `assignment, billing, documents, load-intake, quotes, request-shipment, shipment-generator, shipments, tracking`; `customer-portal.js` (741 lines, state in `localStorage`, actions load-sample / reset-request / calculate-quote / prepare-packet), `portal-nav.js`. `load-intake` has `<form data-load-form>` (client-only, no network submit). Cinematic `customer-portal-*.webp`. Earliest 9a91811b (06-18).
- Current: `app/customer-portal/*` (Next product shell `CustomerPortalShell`).

---

## 5. BOF Vault
- Candidate `bof-vault/index.html` (first ec21e9e4 07-21, best ec17c308 07-28) 750w: H1 "Secure Driver Self-Service."; capabilities (Upload, Track Readiness, Respond to Requests, Preserve Proof); driver dashboard persona "Mara Chen"; pipeline Request→Upload→Validate→Classify→Review→Resolve→Approve→Release→Monitor Expiration; request cards; access language; video `bof-driver-vault.mp4`; public intake (`driver_inquiry`). CTAs → `/customer-demo/?portal=vault[&view=document-intake]`. Hero `design-system-2/wave-2/ds2-bof-vault-hero-clean.png` (history only).
- Intake workbench demo: `interactive-demo/drivers/document-intake/` + `assets/js/vault-document-intake.js` (495 lines; data `assets/data/vault-document-intake.json` with pipelineStages + presets; metric cards, accept/block decisions, audit log, timer). Present in fork; not served.
- Current: `app/(marketing)/bof-vault/page.tsx` (78 lines, 9cf71b4d) + 8 L2 pages via `MarketingVaultLevelTwo`/`lib/bof-vault-level-two.ts`; image `/assets/images/bofvault.png`; CTA `/assessment/bof-vault`. `MarketingBofVaultHero.tsx` unused. Lost: intake workbench and video.

---

## 6. ASSESSMENT flow (special focus)

### A. Scenario Walkthrough / "BOF Fleet Assessment" (static, server-submitting) — origin c626a888 (2026-06-22) "Add real scenario walkthrough form submission"; refined d4da9457 (06-29)
- Page `Website/scenario-walkthrough/index.html` (fork: `recovered/.../scenario-walkthrough/index.html`, 1050w) + `assets/js/scenario-walkthrough.js` (406 lines) + `scenario-walkthrough/submit.php`.
- 11 sections, ~105 fields: 1 Fleet Profile (company, name, email, phone, trucks, drivers, ownerOperators, freightType, operatingRegions, currentSystems) · 2 Driver Records & Readiness (cdlElectronic, medicalCardsTracked, dqfCentralized, mvrRenewalsTracked, workerRecordsCentralized, trainingRecordsTracked, documentExpirationsFlagged, driverReadinessDelays) · 3 Document Systems (documentStorage[], documentsTiedToRecords, documentVersionsControlled, requiredRecordsSearchable, expiredMissingDocsFlagged) · 4 Load Intake & Dispatch · 5 POD, Proof & Claims · 6 Settlements & Pay Types · 7 Factoring & Cash Flow · 8 Policies/Procedures/Automation · 9 Optional HR Tier · 10 Optional Finance Tier · 11 Final Review/Submit (desiredBofHelp[], permissionToContact).
- Behavior: progress % + section label, live plain-text summary, Copy summary (clipboard), Clear, Send. **No scoring.** Honeypot `website` + `startedAt` timing.
- Submission: `fetch` POST JSON to form `action` (`/scenario-walkthrough/submit.php`). PHP validates required fields/email, body ≤24 KB, form age 3 s–4 h, then `mail()` to **`demo@backofficefleet.com`** from `no-reply@backofficefleet.com`, subject "BOF Scenario Walkthrough Request - <company>", Reply-To prospect. No database storage. Fallback message tells user to email demo@backofficefleet.com.
- In the Aug fork this was **the** assessment: nearly every page CTA "Take the BOF Fleet Assessment" → `/scenario-walkthrough/`.

### B. Five-path audience assessment hub (static, scored) — f48bef67 (2026-07-28) "Add five-path audience assessment hub"; c93fbceb, ec17c308 "Add unified public intake frontend"
- Page `Website/assessment/index.html` (candidate 66929e67) + `assets/js/wave3-assessment.js` (542 lines) + `assets/js/public-intake.js` (429 lines). "Fleet Readiness Assessment — 12 questions, ~4 minutes, no obligation".
- Category selection: 5 photo cards — Aggregator, Private Fleet, For-Hire Fleet, Government Fleet or Agency, Individual Driver (deep link `?type=`; history push/popstate). Each audience: 4 sections × 3 questions = 12 questions, eyebrow, 4-5 categories, recommended modules, CTA, learn route.
- Answers: In place = 3, Partially = 2, Unsure = 1, Not in place = 0. Score = total / (12×3) as %. Bands: ≥78 "Strong foundation", ≥56 "Partially controlled", ≥34 "Significant gaps", else "Immediate attention recommended". Result: top-3 gaps (not-in-place/unsure, else partial), per-section %, strongest section, recommended modules, CTAs (audience CTA, Priority Fleet Program for private/for-hire, Vault for driver), review screen.
- Inquiry: "request roadmap" mounts `public-intake` card with `data-intake-type="assessment_roadmap"`, `data-source-page="/assessment/"`, audience and JSON assessment context. Other intake mounts: contact (`contact`), book-a-demo (`demo_request`), priority-fleet-program (`priority_fleet`), aggregators (`aggregator_inquiry`), plus `government_inquiry`, `driver_inquiry`.
- Backend: `public-intake.js` posts only if `window.BOFPublicIntakeConfig.endpoint` or `data-intake-endpoint` is set — **never configured** in the candidate, so UI says "This form validates locally only; your information has not been transmitted to BOF." Prepared server: `supabase/functions/submit-public-intake/index.ts` (Deno edge fn; ALLOWED_ORIGINS, optional Cloudflare Turnstile, email normalization, rate/dup hashing, optional notification provider) + `supabase/migrations/202607290001_public_intake_schema.sql` (`intake.public_intakes`, `intake_events`, `intake_notes`, `intake_assignments`, RLS, public reference `BOF-INT-…`, summary ≤1500). README: "not deployed". Validator `Website/tools/validate-public-intake-backend.js`. A publishable Supabase URL/key for a dataset table is in `Website/assets/js/bof-supabase-config.js` (history only). None of `supabase/` exists in the current worktree.
- In the Aug fork, `/assessment/` was reduced to a redirect to `/book-demo/` (A replaced B).

### C. Next.js (current)
- `app/(marketing)/book-assessment/page.tsx` (unchanged since baseline c505f404 2026-05-22): renders "Redirecting…" and an inline `<script>` `window.location.href = '/assessment?sector=<sector>'`. **Bug:** `sector` query value is interpolated unescaped into `dangerouslySetInnerHTML` script → reflected XSS (e.g. `?sector=';alert(1);//`). Every header/footer/page CTA points here.
- `app/assessment/page.tsx` (client): selector — BOF Vault (individual driver) + fleet tracks; `?sector=` mapping (for-hire, private-fleet, government, bof-vault/vault; "aggregator" from `/aggregators` CTA is **not mapped**). Track pages `app/assessment/{for-hire-carriers,private-fleets,government-fleets,bof-vault}/page.tsx` → `components/assessment/AssessmentTrackPageClient.tsx` (554 lines) with `lib/assessment-tracks.ts` (1711 lines; 4 tracks, required + optional skippable sections e.g. HR/Workforce, Settlements, Fleet Financials, Factoring, Budget, Procurement).
- Scoring `calculateAssessmentScore`: yes=100/no=50; scale n/5×100; **any single/multiple choice = 75 ("For demo purposes, assume most choices are good")**; text/number = 70. Bands ≥80 Strong / ≥60 Needs Attention / else High Risk. Risk areas & modules are static per track. **No submission, no storage** — results only link back to `/assessment`.
- Homepage `FleetAssessmentWizardClient.tsx` (580 lines): sector-specific wizard, saved to session/localStorage only; CTAs `/apply`, `/fleet-savings`, `/dashboard`.
- `/apply` `FleetApplicationWizardClient.tsx`: localStorage only. `/fleet-savings`: calculator, localStorage. `FoundingFleetProgramPage.tsx` form: "demo form is a front-end preview", no submit.
- The only server-persisted inquiry path: `/contact` → `components/marketing/ContactInquiryForm.tsx` → `POST /api/contact/inquiries` → `lib/contact/contactInquiryStore.ts` → Prisma `ContactInquiry` (fullName, companyName, email, phone, organizationType, services[], message, status/assignment/activities; dedupe/rate checks); returns `emailed: false` (no email). Staff review UI `app/(bof)/contact-inquiries` / `components/contact-inquiries/ContactInquiriesDashboard.tsx`. `/contact` also lists mailto links to demo@backofficefleet.com.
- Careers: `CareersPageClient` → `POST /api/recruiting/apply` validates and returns a candidate object (CAND-xxxxx); persistence is client-side `useRecruitingStore` — not stored server-side.

**Net loss:** the assessment → inquiry handoff (A emailed results; B produced scored roadmap + intake record) no longer exists; the Next assessment neither scores meaningfully nor submits.

---

## 7. Interactive demonstrations (special focus)

| Demo | Files (fork unless noted) | Origin | Behavior | Reachable now? |
|---|---|---|---|---|
| Interactive demo / Control Center | `interactive-demo/index.html` (1060w: Load Queue, Source Load Board, Release desk, BOL review, Release Packet TMS-LD-10482, checklist, decision, audit trail) + `interactive-demo/{start,loading,alerts,carriers,dispatch,documents,drivers,drivers/drv-001..012,drivers/document-intake,load-queue,reports,safety,settings,settlements}` + `assets/js/interactive-demo-routes.js` (1507 lines) | 2e325c30 06-15; f9b404d8 06-22 | client-rendered routes; driver files with DQF score, rendered credential forms, audit trail | No (recovered only) |
| Start page | `interactive-demo/start/` "Delta Advanced Trucking record-backed release review" → role entries (Dispatcher, Safety desk, Carrier ops, Settlement/claims) | | | No |
| Animated demo (Track A) | `animated-demo/` 1836w, 9 scenes (Customer Demand → Executive Visibility) + `assets/js/animated-demo.js` (1086 lines) + `audio/animated-demo/track-a/*.mp3` | a05e9163 06-20 | scene rail, autoplay w/ narration mp3, HEAD-check audio, timed fallback if blocked, pause/resume/replay, volume, counters, pacing estimator | No |
| Animated demo — Business (Track B) | `animated-demo-business/` 1713w + track-b mp3 | June | same engine | No |
| Animated demo — Aggregator (Track C) | `animated-demo-aggregator/` 2333w + track-c mp3 (+ `aggregator-animation.js`) | June | same engine | No |
| Narration export | `narration-export/` 1736w + `narration-export.js` | June | scripts for voice talent; copy/plain-text export | No |
| Executive demo | `executive-demo/` 1483w (fork richest), "Ten stops", guided flow, aggregator section; driver-vault video | e6cd2ea7 06-19 | static | No |
| Partner workflow / TMS | `demo/` 1179w, `demo/tms-release-review/` + `partner-tms.js`, `integrations/{partner-tms,ascendtms,tms-workflow}/` + `ascendtms.js` | 06-15 | imported TMS load → release decision | No |
| Demo paths / role paths | `demo-paths/` 1122w ("Assessment Paths" in June nav) | 06-15 | role-based links to records | No |
| Guided walkthrough | `walkthrough/` 920w (six stops) | 06-15 | static | No |
| Unified customer demo | **candidate only** `customer-demo/` + `assets/js/customer-demo-app.js` (1668 lines): portals Manager, Driver, Customer, Safety, Maintenance, Finance Readiness, Business Operations, BOF Vault, Policy Governance; personas; document matrix; data `bof-public-operations.json` | 16b407fe..95289e6b 07-28 | SPA w/ `?portal=&view=` | No (history only, not in fork) |
| Settlements storyboard | `video-assets/settlements/` (storyboard js/json, screenshots) | | | No |
| Videos (6 mp4) | `assets/videos/*.mp4` | | | **5 of 6** via `/api/marketing-demo-media` on homepage (`bof-settlements-readiness.mp4` not exposed) |

Current Next demos are product-runtime: `app/(bof)/demo/{command-center,dispatch,drivers,loads,scenario,settlements}` ("DEMO …", "What Happens If?") on seeded data — new, not recovered content. No audio/narration anywhere in Next.

---

## 8. Audience pages

- **Aggregators** — best: fork `aggregator-partner-offer/` 1650w (origin 4a43cdac/10e4d60b 06-25): roles, network-capacity problem, readiness fit/rules/proof/exceptions, 4 use cases, "Aggregator Pilot: 30-Day Readiness Network Assessment", demo surfaces; video `bof-aggregator.mp4`; cinematic `aggregator-partner-program-*.webp` + cutout. Also `aggregator-command-center/` 1110w (+`/fleet-network`), `aggregator-outreach/` 764w, `capacity-intelligence/` 1554w. Candidate `aggregators/` 292w (thin, Wave 4, intake `aggregator_inquiry`). Current `app/(marketing)/aggregators/page.tsx` (231 lines) uses recovered hero `/assets/images/recovered/aggregator-partner-offer-desktop.webp`; CTA `/book-assessment?sector=aggregator` (unmapped sector).
- **For-hire / carriers** — fork `fleet-operator-offer/` 1609w ("Fleet Operator Pilot: 30-Day Back-Office Readiness Assessment"), `carrier-readiness/` 693w (CAR-118/207/309 ready/watch/hold), `for-hire-fleets/` 456w (mailto CTA); candidate `carriers/` 471w (Carrier Registry, uses interactive-demo-routes.js). Current `app/(marketing)/for-hire-carriers/page.tsx` (376 lines; Discover/Design/Deploy/Operate, money-at-risk) — later rewrite.
- **Private fleets** — fork `private-fleets/` 812w (H1 "Protect the freight your business depends on.", AI assistance, warehouse/route-board photos) + `private-fleets/{audit-visibility,branch-alignment,evidence-packets,unified-record-control}/` ~450w; `private-fleet-offer/` 1106w (FreightBrace cargo-securement proof, 30-day pilot; origin 650e4d2e 06-26). Current `app/(marketing)/private-fleets/page.tsx` (385 lines) + 5 L2 (driver-management, fleet-growth-back-office, maintenance-administration, safety-risk, settlements-payroll); hero `/assets/images/private-fleets-hero-new.png`.
- **Government** — fork `government/` 909w ("Make every movement defensible before it is released", Government/Contractor Readiness Pilot) + `government/{audit-trail,contractor-alignment,evidence-packets,single-record-accountability}/`; `fleet-preparedness/` 468w. Current `app/(marketing)/government/page.tsx` (226 lines) + large tree (county, emergency services, municipal-services/** etc., 3-270 lines each; several 3-line stubs under maintenance-inspection). Current gov tree is broader but different content.
- **Founding fleet** — fork `founding-fleet/` 786w ("Priority Fleet Implementation Program": deposit doesn't start onboarding clock, assessment of records to convert) + `apply/` (mailto), `pricing/` 404w, `trial/` 425w; `founding-fleets/` 466w. Candidate `priority-fleet-program/` 500w (intake `priority_fleet`). Current `/founding-fleet` → `components/marketing/FoundingFleetProgramPage.tsx` (non-submitting demo form).
- **Sectors / who we serve** — fork `sectors/` 1265w; candidate `who-we-serve/` 559w.

## 9. Company / contact / book-a-demo
- Fork `company/` 421w, `contact/` 373w (mailto), `book-demo/` 795w: "Bring the record holding up a decision." with 5 scenario mailto CTAs (`mailto:demo@backofficefleet.com?subject=…` Release Review / Record Review / Release Decision / Watch Items / Hold Resolution) and links to operations-record cases; cinematic `book-demo-session-prep-*.webp` + coordinator cutout. Richest book-demo: 9abf61c4 (06-29) 822w. Candidate `company/` 574w (audience cards, links to `/assessment/`), `contact/` & `book-a-demo/` = public-intake mounts (local-only).
- Also historical: `trust-governance/` (fork 804w), `policies-procedures/` (e0df4eee 07-16, 1755w, 25 media incl. policy PDFs), `resources/*` (fork).
- Current: `app/(marketing)/company/page.tsx` ("WHO ARE WE?", 3 expert bios); `app/(marketing)/contact/page.tsx` (DB-backed form + mailto); no book-demo page (`/book-assessment` redirect instead); `/investors`, `/team-briefing`, `/qa`, `/how-bof-works` (407 lines) are new.

## 10. Unused components (current worktree)
Not imported anywhere (directly or via `components/marketing/index.ts` barrel):
- `components/marketing/MarketingHomeIntegratedHero.tsx` (94), `MarketingBofVaultHero.tsx` (169), `MarketingGovernmentIntegratedHero.tsx` (99), `MarketingHeroImagePanel.tsx` (57), `MarketingServiceTiers.tsx` (111; BOF Core Operations / BOF HR / BOF Financial tiers), `MarketingValuePillars.tsx`, `MarketingContainer.tsx`
- `components/BookDemoLink.tsx`, `components/safety/SafetyCommandHero.tsx` (86), `components/documents/DriverVaultWorkspaceClient.tsx` (381)
- Note: `MarketingHomeExperience.tsx` exports `MarketingHomeDemoSnapshot` used only inside the file; `MarketingHomeLifecycle`/`WorkflowCards`/`CommandPreview` are used.
None of these reimplement the recovered static demos; recovered static content has no React equivalent.

## 11. Original vs later rewrite (judgement)
- Original substantive layer: June 15–July 21 static pages (record-backed narrative around TMS-LD-10482 / BOF-1907 / BOF-1931, site-pass photography, demos with narration) — peak in 7333dacf (ops), db03d3be (documents), 4a43cdac (homepage).
- July 28-29 "Wave 3/4" (candidate) = partial rewrite: added real assessment scoring + intake architecture, but trimmed ops pages (dispatch 685w, drivers subpages ~190w).
- Aug fork = visual (cinematic) rewrite that kept most ops substance, expanded L2 pages, and removed `/assessment` in favour of scenario-walkthrough.
- Next.js marketing (Aug 28 → Oct 17) = generic rewrite: positioning copy, placeholder scoring, no demos, local-only funnels; recovered media reachable only for 5 videos.

## Key file paths
- Static candidate: `git show 66929e67:Website/<page>/index.html`; assessment `Website/assets/js/wave3-assessment.js`, `Website/assets/js/public-intake.js`, `supabase/functions/submit-public-intake/index.ts`, `supabase/migrations/202607290001_public_intake_schema.sql`
- Ops best: `git show 7333dacf:Website/{dispatch,drivers,safety}/index.html`, `git show db03d3be:Website/documents/index.html`, `git show 4a43cdac:Website/index.html`
- Fork: `/home/user/bof-website-recovery/recovered/fork-restored-20260819/` (scenario-walkthrough/submit.php, assets/js/*, assets/audio, assets/videos)
- Next: `app/(marketing)/page.tsx`, `components/marketing/MarketingHomeAccountable.tsx`, `components/marketing/MarketingNavigation.tsx`, `app/(marketing)/book-assessment/page.tsx`, `app/assessment/page.tsx`, `components/assessment/AssessmentTrackPageClient.tsx`, `lib/assessment-tracks.ts`, `app/api/contact/inquiries/route.ts`, `app/api/marketing-demo-media/route.ts`
