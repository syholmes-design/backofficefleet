# BOF canonical implementation register

**Read this before editing a module listed here.** It names the one active implementation of each function. Anything not listed for a function is not the current implementation.

Removed code stays recoverable from Git history. It must not be recreated.

Last updated: 2026-10-19
Branch: `claude/website-recovery-20261018`

Scope:
- Recruiting & Onboarding (including careers intake)
- Contact and inquiries
- Marketing homepage and service model
- Business Operations pages

Other modules are added as they are consolidated.

---

## 1. Recruiting & Onboarding

The workflow runs: requisition → five approvals → recruiting position → candidate intake (recruiter attachment or public application) → screening → structured interview → selection or rejection → offer → onboarding → driver activation → assignment readiness.

### Pages and UI

| Function | Canonical page or route | UI components |
|---|---|---|
| Requisitions (11 sections, five approvals) | `/recruiting` and `/recruiting/requisitions/[requisitionId]` | `components/recruiting/RequisitionListClient.tsx`, `components/recruiting/RequisitionFormClient.tsx` |
| Recruiting & Onboarding workspace (the owner-approved Michael Anderson design) | `/recruiting/workspace` | `components/recruiting/RecruitingPageClient.tsx` and `components/recruiting/RecruitingWorkspacePanels.tsx`. The panels cover screening, documents (with file upload and view), the structured interview, offer, onboarding, activation (with the payroll handoff preview) and disposition. |
| Public careers (blind postings and applications) | `/careers` | `components/marketing/CareersPageClient.tsx` |
| Public introduction | `/recruiting-onboarding` | The page itself, plus `components/marketing/RecruitingStageNav.tsx` |
| Public demonstration | `/demo/recruiting`, `/demo/recruiting/requisitions/[id]`, `/demo/recruiting/workspace?stage=…` | `components/recruiting/RecruitingDemoClients.tsx`. These are the same screens as above, running on a different transport. |

### APIs

| Area | Endpoints |
|---|---|
| Requisitions | `GET`/`POST /api/recruiting/requisitions`; `GET`/`PATCH /api/recruiting/requisitions/[id]`; `POST /api/recruiting/requisitions/[id]/[action]` (submit, review, approve, hold, cancel, fill); `POST /api/recruiting/requisitions/[id]/approvals` |
| Workspace read model | `GET /api/recruiting/workspace` (tenant-scoped; never sends file bytes) |
| Positions | `POST /api/recruiting/requisitions/[id]/position`. Approval opens the position automatically; this endpoint opens it for an approved requisition that has none. |
| Candidate intake (recruiter) | `POST /api/recruiting/positions/[positionId]/candidates` |
| Candidate intake (public) | `GET /api/recruiting/openings` (blind postings); `POST /api/recruiting/apply` |
| Screening and disposition | `POST /api/recruiting/candidates/[candidateCode]/screening`; `POST /api/recruiting/candidates/[candidateCode]/disposition` |
| Candidate stage records (per candidate) | `/api/recruiting-v2/documents/[candidateId]` (and `/[documentCode]`, `/[documentCode]/file`); `/api/recruiting-v2/qualification/[candidateId]`; `/api/recruiting-v2/interviews/[candidateId]` (PATCH records the structured interview); `/api/recruiting-v2/offer/[candidateId]`; `/api/recruiting-v2/onboarding/[candidateId]`; `/api/recruiting-v2/activation/[candidateId]` |

### Services and business rules

All pure modules are shared by the signed-in workspace and the public demonstration.

**Requisitions**
- `lib/recruiting/requisition-fields.ts`: the 11 sections and field labels.
- `lib/recruiting/requisition-transitions.ts`: status transitions and the five approval roles.
- `lib/services/requisitionService.ts`: the requisition service. Approval calls the bridge to open the position.

**Bridge** (`lib/services/requisitionRecruitingBridge.ts`), which owns:
- position opening;
- pipeline sync (READY_FOR_RECRUITING → RECRUITING → PARTIALLY_FILLED → FILLED);
- the scoped workspace load;
- **candidate intake** (`attachCandidateToPosition`, used by both recruiter attachment and public applications);
- public openings (`listPublicOpenings` and `findOpenPositionByOpeningId`).

**Pure rule modules**
- `lib/recruiting/public-openings.ts`: blind-posting projection. No carrier name, DOT/MC numbers, managers or budget. It also builds the schema.org `JobPosting` structured data on `/careers` (`jobPostingStructuredData`, `serializeJsonLd`).
- `lib/job-board-distribution.ts`: job-board status per position, derived from real state. BOF Careers and Google for Jobs are published while the requisition is open; Indeed, LinkedIn and ZipRecruiter show "not connected". **Do not add an adapter that reports a posting without a real request and the board's job ID.** Status and requirements: `docs/release/PRODUCTION-RELEASE-PACKAGE-2026-10-19.md` §3.
- `lib/recruiting/requisition-screening.ts`: screening against the requisition's own requirements and the document gates.
- `lib/recruiting/requisition-pipeline.ts`: requisition counts and the pipeline state.
- `lib/recruiting/structured-interview.ts`: interview categories, recommendations and validation. This is new as of 2026-10-19; no historical questionnaire existed.
- `lib/recruiting/workspace-model.ts`: workspace read model. It also defines the original `RecruitingPosition` and `RecruitingCandidate` shapes.

**Recruiting V2 engines** (`lib/recruiting-v2/*`):
- `document-gate-engine`
- `qualification-engine`
- `offer-engine`
- `onboarding-engine`
- `activation-engine`
- `document-artifact` (file storage; bundled synthetic files only when explicitly attached)
- `candidate-access` (tenant scope)

**Activation**
- `lib/recruiting-v2/driver-activation-service.ts`: creates the Driver, DriverIntake and DriverDocuments, then runs post-activation qualification and readiness.

**Driver qualification after activation**
- The live driver file is `/drivers/[id]` (`components/drivers/OperatorDriverDetail.tsx`, built on `lib/services/driverOperationalReadModelService.ts`). It shows qualification, readiness and their reason codes.
- Employment history is recorded through `components/drivers/WorkHistoryPanel.tsx`, `GET`/`POST /api/intake/[intakeId]/work-history`, `lib/services/workHistoryService.ts` and `lib/qualification/work-history-input.ts`. Only BOF operations/compliance and fleet admin/manager roles can record it.
- Saving an entry re-runs `reevaluateDriverReadinessAfterDocumentChange`, which uses the same qualification and readiness services that dispatch assignment enforces.
- `/drivers/[id]/safety` reads demo data. Do not link real drivers there.

**Transports**
- `lib/recruiting/workspace-transport.ts`: the HTTP transport, used when signed in.
- `lib/recruiting/demo-backend.ts`: the in-browser transport for the public demonstration (fictional records).
- `lib/recruiting/demo-stages.ts`: starts the demonstration at a chosen stage.

### Database entities

- `Requisition` and `RequisitionApproval`
- `Position` (with a unique `requisitionId`, `fleetId` and `openings`)
- `Candidate` (`dispositionStatus` and its reason, notes and timestamp)
- `DocumentRecord`
- `Interview` (`questionnaire` stores the structured interview)

Activation produces `Driver`, `DriverIntake`, `DriverDocument` (with `verificationExpiresAt` set from the recruiting document), `DriverIntakeRequirement` (CDL, medical and employment verification, so later expiry or rejection disqualifies the driver), `DriverQualificationSnapshot` and `DriverReadinessScore`.

Migration: `20261019120000_requisition_recruiting_integration`. It is additive and has been applied only to local nonproduction databases.

### Tests

| Command | What it covers |
|---|---|
| `node --import ./scripts/lib/ts-alias-loader.mjs --test lib/recruiting/requisition-integration.test.ts` | Screening, pipeline counts and states, interview validation, blind postings |
| `npm run test:route-access` | Public and private routing, including `/api/recruiting/openings` (GET only) and `/api/recruiting/apply` (POST only) |
| `npm run test:recruiting-v2-tenancy` | Tenant isolation |
| `lib/qualification/work-history-input.test.ts`; `lib/services/requisition-persistence.test.ts` (bof_dev) | Employment-history validation; approval opens exactly one position, including on re-approval |
| `lib/recruiting-v2/*.test.ts` | Activation presentation and the activation service |

Browser acceptance: `docs/recovery/RECRUITING-ONBOARDING-INTEGRATION-2026-10-19.md`.

### Removed (do not recreate)

| Removed | Replaced by |
|---|---|
| `/recruiting-v2` screens: `app/(bof)/recruiting-v2/**`, `components/recruiting-v2/**`, `lib/recruiting-v2/recruiting-v2-demo-data.ts` | `/recruiting/workspace`. The V2 file upload/view and the Paylocity handoff preview were ported into the workspace panels first. The V2 engines and APIs remain canonical. |
| `lib/stores/recruiting-store.ts` (browser-only store) and `lib/recruiting-demo-data.ts` (`DEMO_POSITIONS`, `DEMO_CANDIDATES`) | Real records through the APIs above. The types moved to `workspace-model.ts`. |
| The careers application that saved nothing (`/api/recruiting/apply` echoed the payload back to a browser store) | `POST /api/recruiting/apply` now creates the Candidate on the requisition's position. |
| The manual "+ Create Position" job builder | Positions open only from an approved requisition (`docs/governance/superseded-decisions.md`). |
| `lib/job-board-adapters.ts` (Indeed, LinkedIn and ZipRecruiter adapters that returned "Published" without calling any API) and the hardcoded `DEMO_JOB_POSTINGS` | `lib/job-board-distribution.ts` (real status only) |

## 2. Contact and inquiries (WEB-004/005/006)

| Layer | Canonical |
|---|---|
| Pages | `/contact` (`app/(marketing)/contact/page.tsx`); staff work queue at `/contact-inquiries` (BOF staff only) |
| UI | `components/marketing/ContactInquiryForm.tsx`; `components/contact-inquiries/ContactInquiriesDashboard.tsx` |
| API | `POST /api/contact/inquiries` (public); `GET /api/contact/inquiries`, `GET`/`PATCH /api/contact/inquiries/[id]` and `POST …/[id]/activities` (staff only) |
| Services and rules | `lib/contact/contactInquiry.ts` (validation and honeypot); `lib/contact/contactInquiryStore.ts`; `lib/contact/inquiryManagement.ts` (pipeline, assignment, follow-ups, activity); `lib/contact/bofStaffAccess.ts` and `inquiryApiAuth.ts` (BOF staff roles only, never carrier users) |
| Database | `ContactInquiry` and `ContactInquiryActivity`. Status runs NEW → IN_REVIEW → CONTACTED → QUALIFIED → CLOSED. |
| Delivery | The inquiry is saved for staff review. No email is sent; outbound sending stays disabled by owner rule. |
| Tests | `lib/contact/contactInquiry.test.ts`, `lib/contact/inquiryManagement.test.ts` and `lib/contact/bofInquiryReview.access.test.ts` (15 tests). Browser evidence is in `docs/recovery/evidence/release-2026-10-19/contact-*.png`. |
| Removed | `components/BookDemoLink.tsx` and every "Book a Working Session" path (superseded by `/assessment`) |

## 3. Marketing homepage and the service model

| Function | Canonical |
|---|---|
| Homepage `/` | `app/(marketing)/page.tsx` → `components/marketing/MarketingHomeAccountable.tsx`, composed of `MarketingHomeExperience.tsx`, `MarketingHomeOperations.tsx` and `MarketingServiceModel.tsx` |
| Service model (what BOF personnel perform versus what portals show, and the network advantages) | `components/marketing/MarketingServiceModel.tsx`, used on `/` and `/business-operations` |
| Business Operations pages | `app/(marketing)/business-operations/[[...slug]]/page.tsx`, which renders the recovered archive through `components/recovered-site/RecoveredPageView.tsx`. Those pages are protected by `npm run check:preservation`. |
| Brand | Approved logo and brand mark only. "CONTROL • COMPLY • CLEAR" is superseded, and the check fails if it reappears. |
| Removed | `MarketingHomeIntegratedHero.tsx` and `MarketingGovernmentIntegratedHero.tsx` (never rendered); the unused `IconDocWarning` |

## 4. Features reconciled from `main` (2026-10-19)

| Function | Canonical |
|---|---|
| Carrier packet preview and evidence | `app/(bof)/carriers/[id]/packet/page.tsx` and `…/packet/[evidenceId]/page.tsx` on `lib/carrier-registry.ts`, `lib/carrier-packet-evidence.ts` and `lib/carrier-dispatch-gates.ts` (demo registry; see the Loads handoff on the two carrier models) |
| Freight Compliance Pulse | `/compliance` → `components/marketing/FreightCompliancePulse.tsx` on `lib/regulatory-feed/**` and `/api/regulatory-feed`. Live public sources only; never sample items presented as live. |
| Retired `main` URLs | `next.config.ts` redirects: `/customer-portal/request-shipment` → `/customer-portal/load-intake`; `/demo` and `/demo/walkthrough` → `/interactive-demo` |

Details: `docs/release/BRANCH-RECONCILIATION-2026-10-19.md`. The next consolidation (Loads) starts from `docs/architecture/LOADS-INTEGRATION-HANDOFF-2026-10-19.md`.

## 5. Rules for agents

1. Edit the canonical file listed here. When a function has no entry, find its canonical home before adding code, and add it here.
2. Never add a second implementation (a parallel page, store, API or demo copy) of a listed function. A demonstration uses a different transport on the same screens and rules, never a copy.
3. When work replaces code, port any unique behavior first, delete the old code in the same change, update the references, and record it under "Removed".
4. Historical evidence in `docs/recovery/` and `docs/security/` describes past states. It is not current instruction.
