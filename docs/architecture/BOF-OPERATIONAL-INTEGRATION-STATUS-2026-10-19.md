# BOF operational integration status

Date: 2026-10-19
Branch: `claude/website-recovery-20261018`
Gap register: `docs/architecture/BOF-UOS-GAP-REGISTER.md`

## How to read the classifications

**VERIFIED** means the transition was exercised today against **local nonproduction** Postgres:
- through a real browser, or
- through the guarded test suites, which run on `bof_dev` (the guard refuses Neon/production).

Nothing here was verified on production. This environment cannot reach production (see §5).

The other classifications:
- **PARTIAL**: works, with a named limitation.
- **BLOCKED**: stopped by policy or an external dependency.
- **NOT IMPLEMENTED**: no code exists.

Demonstration-only behavior is never counted as VERIFIED.

## 1. Recruiting through dispatch readiness

| Transition | Status | Evidence (today unless noted) |
|---|---|---|
| Staffing need → requisition (11 sections) → five approvals → READY_FOR_RECRUITING | VERIFIED | Browser `live-01`…`04`. `requisition-persistence.test` (bof_dev): approval opens exactly one position, including after a re-approval. `requisition-hardening.test`: 9/9. |
| Approved requisition → recruiting position | VERIFIED | Opened automatically on approval and idempotent. The workspace shows the originating requisition (`live-05`). |
| Candidate intake → position | VERIFIED | Recruiter attachment (`live-06`). Public careers application creates CAND-003 on BOF-HR-DRV-001, which the recruiter sees with the source "BOF Careers Page"; duplicate → 409; closed or unknown opening → 404. **Corrected today (GAP-012):** applications were previously discarded. |
| Intake → screening | VERIFIED | Screening uses the requisition's own requirements. A Class B candidate fails a Class A requisition (`live-18`). |
| Screening → interview → recommendation | VERIFIED | Structured interview recorded as "proceed with conditions" (`live-09`, `live-10`). |
| Selection / rejection | VERIFIED | Rejection keeps a reason and the history, and the counts update (`live-19`, `live-20`). |
| Offer | VERIFIED | Draft → sent → accepted. An offer is blocked when the requisition screen fails. |
| Onboarding | VERIFIED | Orientation, training and equipment recorded, then COMPLETE (`live-12`). |
| Onboarding → driver activation | VERIFIED | The Oct 17 activation creates a Driver (ACTIVE), a DriverIntake and 8 DriverDocuments. |
| Activation → driver qualification | VERIFIED (**corrected today, GAP-011**) | Qualification needs employment history, and nothing could record it, so every recruited driver stayed NOT_QUALIFIED. Staff now record employers on `/drivers/[id]`. Tenant isolation holds: another carrier gets 404 and fleet operations gets 403. |
| Qualification → dispatch readiness → assignment | VERIFIED | For Michael Anderson (fictional): assignment refused with 409 "ASSIGNMENT BLOCKED — DRIVER NOT READY" → employer recorded → QUALIFIED / READY → assignment 200. Uses a fixture load and tractor labelled `VERIFY-*`, local only. `dispatchAssignment.safety.test` and `concurrency.test` pass (run under `tsx`). |
| Portal visibility | PARTIAL | Recruiter workspace, live driver file and requisition list: verified. The driver portal reads the same operational summary but was not re-run today. |

## 2. Loads, dispatch and delivery

| Transition | Status | Evidence |
|---|---|---|
| Load intake → validation | VERIFIED (tests) | `live-load-review.test` 4/4 and `load-pickup-authorization-link.test`. The customer-portal load intake page exists, but no browser run today. |
| Validation → assignment | VERIFIED | The readiness gate is enforced server-side, under a lock (above), as is equipment fleet/type/out-of-service (`dispatchAssignmentService`). |
| Assignment → dispatch release / pickup authorization | VERIFIED (tests) | `pickupAuthorization.certification` 5/5, `.persistence` 1/1, `pickupPhysicalArrival` 7/7, `pickupReconciliation` 7/7, `pickupPhysicalReconciliation.certification` 12/12 |
| In-route monitoring | PARTIAL | Operating-process events and manual status only. GPS/telematics are not connected (architecture gap 4). Event emission is sparse on some fixture loads (GAP-006). |
| Delivery → POD / evidence | BLOCKED (policy) | ePOD is disabled by owner decision (GAP-009) and fails closed (`epodFeatureFlag.test` 4/4, `epod.test` 7/7, `epod.database.certification` 1/1). Production must set `BOF_EPOD_ENABLED=false` explicitly; that has not been verified from here. |
| Proof integrity / verification | VERIFIED (tests) | `proofIntegrity` 6/6, `proofSubmission` 4/4, `proofVerification` 6/6 |
| Dual load-process APIs | PARTIAL | GAP-005: `/api/load-process-intelligence` and `/api/operating-process/loads/*` both still exist. This is the next consolidation target in this chain. |

## 3. Documents and compliance

| Transition | Status | Evidence |
|---|---|---|
| Recruiting documents → qualification and activation gates | VERIFIED | A missing or rejected document blocks the offer and activation (browser). File upload and view now live in the canonical workspace. |
| Uploaded files → browser | VERIFIED (**corrected today, GAP-013**) | Workspace payloads carry view/download links only; file bytes stay on the server. |
| Synthetic demo files kept away from real candidates | VERIFIED (**corrected today, GAP-014**) | A synthetic file is served only when explicitly attached. |
| Driver document change → readiness re-evaluation | VERIFIED (prior, GAP-002) | `readinessReevaluationService`. The same service is reused for employment history today. |
| Requirement evidence affirmation | VERIFIED (tests) | `requirementEvidenceAffirm.test` 1/1 |
| Document Control families (qualification / approval / adoption gates) | Not changed, not re-verified | Respected as-is. Unapproved families are not treated as adopted. |
| Employer-controlled vs driver-controlled records | Not re-verified | `employerDriverRecordService` (driver portal reconciliation) was not exercised today. |

## 4. Settlements and financial operations

| Transition | Status | Evidence |
|---|---|---|
| Delivery evidence and exceptions → settlement eligibility | VERIFIED (tests) | `load-finance-handoff.test` 2/2 (`settlementEligibility`), `settlementReadService.test` 3/3 |
| Proof-driven settlement holds remain until release | VERIFIED (tests) | `dispatchAssignment.safety.test` exercises `proofSettlementHoldService` with POD disabled |
| Payroll / GL | BLOCKED (external) | GAP-008. The Paylocity handoff is a preview only; it is never sent. It is now visible in the canonical workspace. |

## 5. Production release status (applies to everything above)

- **Commits:** the integration branch is `claude/website-recovery-20261018`, at 34408b01 (Phase A) and cfdbd24c (Phase B), plus this Phase C commit.
- **No production verification:** production is deployed outside GitHub (the last GitHub "Production" deployment is from April 2026), and `backofficefleet.com` and `*.vercel.app` cannot be reached from this environment. No production verification was possible, and none is claimed.
- **Prerequisite migrations** (additive, not applied to production by standing rule):
  - `20261016140000_contact_inquiry`
  - `20261017160000_contact_inquiry_management`
  - `20261019120000_requisition_recruiting_integration`

  Check whether the first two are already in production, since WEB-006 was reportedly stabilized "in production".
- **Branch divergence:** `main` (last commit June 2026) and the integration branch have diverged. `main` has 51 commits the branch lacks; the branch has 135 that `main` lacks. A merge to `main` is not the release path until the owner names it.

### Features that exist only on `main`

`main` uses the older `bof-web/` repository layout. Most of its 50 unmerged commits correspond to code that exists on the integration branch under the root layout, sometimes at a moved path (for example, `app/customer-portal/`).

These features have **no counterpart** on the integration branch:
- carrier packet evidence pages (`/carriers/[carrierId]/packet/**`);
- the freight compliance pulse (`FreightCompliancePulse`, `/compliance` marketing page);
- canonical insurance-notice and MSA document routing (`lib/canonical-insurance-notice.ts`, `lib/canonical-documents.ts`);
- the demo walkthrough and demo access (`/demo`, `/demo/walkthrough`, `lib/demo-access.ts`);
- customer "request shipment".

Before `main` is retired or any merge is attempted, Agent 6 must decide for each feature: port it into the canonical layout, or record it as superseded (GAP-017). None of these were merged here.
