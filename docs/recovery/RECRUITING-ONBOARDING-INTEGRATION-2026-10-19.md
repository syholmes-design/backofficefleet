# Recruiting & Onboarding integration: owner inspection report

Date: 2026-10-19
Branch: `claude/website-recovery-20261018`
Production: **not deployed, not migrated, not touched.**

Owner direction: the Michael Anderson Recruiting & Onboarding workspace (Aug 29, still in the code) is the baseline. The Sept 18 requisition system is the front door. The Oct 17 activation is the back end. Connect them without redesigning the approved interface.

## Where to inspect

| What | Signed in (live records) | Public, no sign-in (fictional) |
|---|---|---|
| Introduction | — | `/recruiting-onboarding` (the homepage "Recruiting & onboarding" card opens it) |
| Requisitions (11 sections, five approvals) | `/recruiting` | `/demo/recruiting` |
| Michael Anderson workspace | `/recruiting/workspace` | `/demo/recruiting/workspace` |

The public demonstration runs entirely in the visitor's browser. It uses the same requisition and workspace screens and the same screening, qualification, offer, onboarding and pipeline rules. Its data is a fictional carrier (Lakeshore Regional Carriers) and fictional candidates, and it has a **Reset demonstration** button.

In a browser check, the demonstration made no request to any recruiting API; the only `/api/` calls were the site header's normal session check. Private pages and APIs still require sign-in: `/recruiting` and `/recruiting/workspace` return 307 to sign-in, and `/api/recruiting/workspace` returns 401.

## M. Preserved, connected, and new

### Historical functionality preserved (unchanged design)

These parts of the Michael Anderson workspace (`components/recruiting/RecruitingPageClient.tsx`) keep their original layout and styling:

- The header.
- The KPI tiles.
- The 8-stage pipeline strip.
- The candidate roster and the candidate detail view.
- The Screen / Qualify / Interview / Send Offer / Start Onboarding workflows.
- The 13-item onboarding checklist and the template relationship panel.
- The Job Distribution Center.
- The activation handoff block.

The **Sept 18 requisition system** keeps all 11 sections, the five approval roles, the legal-transition rules, and its list and form screens (`RequisitionListClient`, `RequisitionFormClient`).

The **Recruiting V2 engines** are reused unchanged, apart from one added recommendation branch (see below): document gates, qualification, offer, onboarding and activation readiness.

The **Oct 17 activation** (`activateRecruitingV2Candidate` and the post-activation qualification and readiness run) is reused unchanged.

### Historical functionality connected

1. **Approval opens the recruiting position.** Approving a requisition now opens exactly one linked recruiting position (`Position.requisitionId`, unique). The opening is idempotent and recorded in the audit trail.
2. **The workspace runs on real records.**
   - The workspace now reads requisitions, positions and candidates from the recruiting APIs (scoped to the user's tenant), instead of the browser-only demo store.
   - Every position shows its **originating requisition** (for example BOF-HR-DRV-001), with its approval and pipeline state.
   - The requisition form links to "Open BOF-HR-DRV-NNN in Recruiting & Onboarding", which selects that requisition's position.
3. **Candidates are attached to a position, so they belong to its requisition.** Each position's counts are computed from the candidates' recorded facts: requested, in process, screened, interviewed, offered, accepted, activated, rejected and remaining.
4. **Pipeline states.** The requisition pipeline moves through READY_FOR_RECRUITING → RECRUITING → PARTIALLY_FILLED → FILLED. When the last opening is filled, the requisition's own status moves to FILLED; the requisition is then closed to new recruiting under the existing transition rules.
5. **Screening reads the requisition directly.** Screening uses the requisition's own requirements, with no second copy of them:
   - CDL class, endorsements (ignoring "preferred" ones), experience and MVR / safety;
   - CDL, MVR, medical, Clearinghouse and employment verification through the Recruiting V2 document gates;
   - PSP, drug test, TSA and equipment experience by recorded recruiter confirmation.

   A candidate who fails a hard requirement cannot be sent an offer.
6. **Offer and onboarding.** These now go through the existing Recruiting V2 offer and onboarding APIs: draft → sent → accepted or declined, then orientation, training, equipment, complete.
7. **The real activation replaces the browser-only "activate" button.** Activation creates:
   - the Driver record;
   - a DriverIntake in qualification review;
   - DriverDocuments carried over from recruiting;
   - a DriverQualificationSnapshot and a DriverReadinessScore.

   The workspace then shows the actual readiness result and blockers, with links to the driver file, assignment readiness and dispatch.
8. **Homepage and service links.**
   - The homepage "Recruiting & onboarding" card now opens `/recruiting-onboarding`.
   - The recovered Business Operations pages' "Driver Onboarding" demo link now opens the interactive demonstration.

### Newly implemented missing functionality (no historical version existed)

- **Structured interview** (`lib/recruiting/structured-interview.ts`).
  - **No historical interview questionnaire was found in any version.** This is new work, labelled as such in the code.
  - It has 12 categories with questions (safety-critical categories flagged), responses, notes and a per-category evaluation.
  - It ends in a recommendation: Proceed / Proceed with conditions / Hold for review / Do not proceed. Conditions or a decision note are required where appropriate.
  - It does not produce a numeric score.
  - It is stored on the existing Interview record (`questionnaire`), and its recommendation feeds the existing qualification engine. One branch was added for ADVANCE_WITH_CONDITIONS.
- **Candidate rejection or withdrawal with a reason.** The candidate's history is kept, the rejected candidate stays visible, the counts update, and a rejected candidate can be reopened.
- **Requisition-based screening module** (`lib/recruiting/requisition-screening.ts`) and **pipeline counts** (`lib/recruiting/requisition-pipeline.ts`).
- **The public demonstration backend** (`lib/recruiting/demo-backend.ts`) and **the public introduction page** (`/recruiting-onboarding`).
- **Database migration** `20261019120000_requisition_recruiting_integration`. It is additive only: one new enum, new enum values and new nullable or defaulted columns. Nothing is dropped or rewritten.

### Changes made at owner direction

- **"CONTROL • COMPLY • CLEAR" removed.** It was under the brand mark and in the marketing footer. It is recorded in `docs/governance/superseded-decisions.md`, and `npm run check:preservation` now fails if it reappears.
- **Manual "+ Create Position" job builder removed.** The tab is now "+ Requisition / Position", which leads to the requisition front door, so every position comes from an approved requisition. Also recorded in the superseded-decisions file.

## Deliverables A–L

| | Deliverable | Evidence (`docs/recovery/evidence/recruiting-integration-2026-10-19/`) |
|---|---|---|
| A | Michael Anderson workspace, recovered and connected | `live-05`, `live-06`, `public-02` |
| B | Connected 11-section requisition | `live-01` to `live-04` |
| C | READY_FOR_RECRUITING feeds recruiting | `live-04` → `live-05` (position opened on approval) |
| D | Candidates belong to their originating requisition | `live-06`, `live-20` (requisition block and counts on the position) |
| E | Screening | `live-07`; failing case `live-18` |
| F | Structured interview | `live-09`, `live-10` |
| G | Advancement and rejection | `live-11` (offer); `live-19` (rejected with reason, history kept) |
| H | Onboarding | `live-12`, `live-13` |
| I | Real nonproduction activation (Oct 17) | `live-14`, `live-16`, plus the database check below |
| J | Assignment-readiness handoff | `live-15` (driver safety / readiness), `live-17` (dispatch) |
| K | Browser screenshots | `live-01`…`live-21` (signed in), `demo-01`…`demo-19` (public, anonymous), `public-00`…`public-02` |
| L | Safe preview | Vercel Preview (bof-web, commit a035b9a4): https://bof-mn6t9gipx-syholmes-5004s-projects.vercel.app |

## Acceptance test 1–20 (real browser, Chromium)

Two runs, both passing end to end:

- **Signed-in run:** `fleet-a-admin` and `bof-operations` dev users, against the **local nonproduction** database `bof_recovery`.
- **Public run:** anonymous, against the in-browser demonstration.

The public run also passed on the production build (`next start`).

| Step | Signed in (live) | Public (demo) |
|---|---|---|
| 1–3 Create, complete 11 sections, submit | `live-01`–`03` | `demo-01`–`03` |
| 4–5 Five approvals, READY_FOR_RECRUITING | `live-04` | `demo-04` |
| 6–7 Shown in workspace, open position | `live-05` | `demo-05` |
| 8 Attach Michael Anderson | `live-06` (CAND-001) | `demo-06` |
| 9 Screening | `live-07` | `demo-07` |
| 10–11 Interview and recommendation | `live-09`, `live-10` (Proceed with conditions) | `demo-09`, `demo-10` |
| 12 Advance / reject | `live-11` / `live-18`, `live-19` | `demo-11` / `demo-16`, `demo-17` |
| 13 Offer | `live-11` (draft → sent → accepted) | `demo-11` |
| 14 Onboarding checklist | `live-12` | `demo-12` |
| 15 Qualification requirements | `live-08` (8 documents received and verified; qualification READY) | `demo-08` |
| 16 Real activation | `live-14` (Oct 17 service) | `demo-14` (**simulated and labelled** — public visitors never create records) |
| 17 Driver records exist | Database check below | Not applicable (simulated) |
| 18 Open assignment readiness | `live-15` | Readiness explained in place (`demo-14`) |
| 19 Readiness reflects actual qualification | NOT_READY, QUALIFICATION_NOT_COMPLETE | Explained as not ready, not computed |
| 20 Handoff toward dispatch | `live-17` (`/dispatch`) | `demo-15` (`/demo/dispatch`) |

**Database check after the signed-in run** (`bof_recovery`, local only):

- Requisition BOF-HR-DRV-001: APPROVED / **PARTIALLY_FILLED**, with 2 openings.
- Michael Anderson: candidate ACTIVE, and a **Driver ACTIVE**.
- DriverIntake: in qualification review.
- DriverReadinessScore: **NOT_READY**, reason "QUALIFICATION_NOT_COMPLETE". The qualification snapshot is not yet qualified because work history is incomplete.
- Sarah Mitchell (fictional, Class B against a Class A requisition): **REJECTED** — "Does not meet requisition requirements".

**Honest limits**

- **Michael is not dispatch-ready.** The readiness engine correctly reports that his driver qualification file still needs review after activation. The workspace shows this blocker; it does not claim he is ready.
- **Public activation is simulated.** The public demonstration does not run the qualification and readiness engines on a real driver. It says so on screen.

## Verification run

- `tsc --noEmit`: clean.
- `next build` (production): passes.
- New unit tests (`lib/recruiting/requisition-integration.test.ts`): 6 of 6 pass.
- Route-access tests and activation tests: pass.
- `test:recruiting-v2-tenancy`: passes.
- ESLint on every changed area: clean. Four warnings remain in `components/dispatch/LoadDeliveryScreen.tsx`, which this work does not touch.
- `check:preservation`: passes — 87 recovered pages, no superseded wording.

## Deployment prerequisite (not done: owner decision)

The **public pages** (`/recruiting-onboarding`, `/demo/recruiting/**`) need no database and work on the Vercel Preview as built.

The **signed-in recruiting pages** need the additive migration `20261019120000_requisition_recruiting_integration`. On any database where it has not been applied, `/recruiting/workspace` and the requisition APIs will fail.

Per standing instructions, the migration has **not** been applied to the Preview or Production databases. It has been applied only to the local `bof_recovery` and `bof_dev` databases. Applying it to Preview is a separate step that needs owner approval.

## Not done (out of scope by owner direction)

- No other BOF department was restored.
- The assessment was not changed.
- No production deployment, migration or data change was made.

## Revision 2026-10-19 (owner feedback on the preview)

- **`/recruiting-onboarding` reorganized the way a recruiter works a requisition.**
  - **Hero.** It keeps the lifecycle statement, with two calls to action: "Open the demonstration" and "Take the Assessment". "Start from a requisition" was removed, because the requisition is already the first stage.
  - **Requisition at a glance.** A sample requisition card (fictional) shows the fill bar, the candidate funnel and the fill states. Its counts are computed with BOF's own `requisitionPipelineCounts` rules.
  - **Stage navigator.** It is sticky and highlights the stage in view.
  - **Five stages, covering all 15 lifecycle steps.** The stages are requisition and approval; source and screen; interview and select; offer and onboard; activate and hand off. Each step can be linked to directly.
  - **What each stage covers.** Each stage states what the recruiter does, what BOF enforces, and what stops a candidate.
  - **"Try it" links.** Each stage has a link that opens the demonstration at that stage.
- **Starting the demonstration at a stage.** This uses `/demo/recruiting/workspace?stage=screen|interview|offer|activation` (`lib/recruiting/demo-stages.ts`).
  - The demonstration is reset, then Michael Anderson's earlier steps on BOF-HR-DRV-001 are replayed through the same demonstration requests and rules a visitor's clicks would send.
  - A note on screen says the earlier steps were completed for the visitor.
  - All five links were verified in a browser, including activating from the activation stage.
- **Fixed literal HTML entities shown as text.**
  - Careers application button: "SUBMIT APPLICATION &rarr;" now reads "SUBMIT APPLICATION →"; "SUBMITTING &amp; VALIDATING" is fixed as well.
  - `/bof-vault`: "driver&apos;s" is fixed.
