# Stage 0 — Production-readiness evidence assessment

**Assignment type:** Read-only engineering assessment (no code, database, or deployment changes).

**Certified implementation baseline (I-9 authorization remediation closed with conditions):**

| Item | Value |
| --- | --- |
| Branch | `cursor/stage0-i9r-remediation` |
| Commit | `53acec36cf7a74c2f5cbfb16f644ccc7a27b0d32` |
| Independent final certification | `claude/stage0-i9-final-recertification` @ `74e01899e883fcbeb37f077469176669e1ec153b` |
| Certification report | `docs/stage0/STAGE0-I9-FINAL-RECERTIFICATION.md` (on certification branch; not duplicated here) |
| Certification outcome | **PASS WITH CONDITIONS** — 294/294 sequential lib tests (incl. final recert file), authorization defects S0-I9R-01/02 **CLOSED** |

**Evidence standard:** Repository implementation is distinguished from **verified production/staging configuration**. No production, Preview, or Neon databases were accessed in this assessment.

---

## Section A — Executive summary

Stage 0 **movement authorization, invalidation, and I-9 physical reconciliation** are implementation-certified on commit `53acec36`. The codebase provides authoritative driver qualification (I-1), document locking (I-2), equipment safety gates, assignment/release/pickup paths under `authorizeMovement`, driver/equipment invalidation (I-7/I-8), and strong **local** certification coverage (`stage0.integrated.certification.test.ts`, I-6/I-7/I-8 suites, `stage0.i9-recertification.test.ts`, `stage0.i9-final-recertification.test.ts` on the certification branch).

**Production deployment is not authorized.** Claude’s final certification and this assessment agree that **release prerequisites D-1 through D-5**, **expiry-sweep operations**, **post-commit audit reliability (S0-I9-04)**, **environment isolation verification**, **deployment fingerprint discipline**, and **human legal/operational sign-off** remain incomplete or unverified outside isolated `bof_dev` testing.

**Principal blockers (ordered by cutover risk):**

1. **D-1 — Compliance qualification backfill:** No tooling or execution evidence to bring existing production driver records under authoritative qualification rules; default evaluation is fail-closed (`PENDING_COMPLIANCE` / `NOT_QUALIFIED`), which will block assignment and movement for drivers without verified registry evidence.
2. **D-2 — Enforcement vs observe-mode:** No configuration to distinguish monitoring from active enforcement; `authorizeMovement` always enforces Stage 0 policy when deployed—unsafe for a gradual production cutover without operational controls.
3. **D-5 — BOF operator notification and acknowledgment:** Holds and escalations are persisted and surfaced primarily via in-app operational chat; no external delivery, SLA timers, or BOF-wide acknowledgment workflow for outsourced operations.
4. **D-3 — Staging E2E verification:** Lifecycle is proven in certification tests against local PostgreSQL, not as authenticated end-to-end evidence on a staging deployment.
5. **S0-I9-04 — Post-commit audit reliability:** Successful authorization mutations can commit while post-transaction audit/process-event writes fail, yielding **HTTP 500** and missing audit rows (independently reproduced in final certification).

Secondary but important: **qualification-expiration sweep** is implemented as a script but not scheduled; **Preview/production DATABASE_URL isolation** is not verified from this environment; **deployment fingerprint** relies on manual operator steps rather than an integrated release artifact.

**Overall readiness classification:** **NOT READY FOR PRODUCTION** — implement and verify prerequisites above before go-live.

---

## Section B — D-1 through D-5 evidence matrix

### D-1 — Compliance qualification backfill

| Field | Assessment |
| --- | --- |
| **Status** | **NOT IMPLEMENTED** (operational backfill); **IMPLEMENTED** (runtime evaluation rules) |
| **Implementation** | Authoritative evaluation: `lib/services/authoritativeDriverQualificationService.ts` (`getAuthoritativeDriverQualification`). Missing/unverified evidence → `PENDING_COMPLIANCE` reason codes; movement blocked via `dispatchMovementAuthorizationService.ts` (`planningDriverBlocks`, all stages). Assignment gate: `dispatchAssignmentService.ts` (`authorizeMovement` `PLANNING_RESERVE`). Document evidence writes (when used) go through locked paths per `docs/stage0/STAGE0-I2-DOCUMENT-LOCKING.md`. |
| **Backfill tooling** | **None** for Stage 0 driver qualification. Unrelated: `scripts/backfill-p1-operating-docs.mjs` (operating documents only). Sweep script (`scripts/run-driver-qualification-sweep.ts`) invalidates **active assignments** when qualifications lapse; it does **not** seed or backfill compliance-verified evidence for idle drivers. |
| **Execution evidence** | **None** in repository for production or staging backfill runs. Certification uses `lib/test/qualifiedDriverFixture.ts` to synthesize compliant drivers in tests only. |
| **Incomplete/expired documents** | Evaluator marks `*_MISSING`, `*_UNVERIFIED`, `*_NOT_COMPLIANCE_VERIFIED`, expiry-driven statuses → `NOT_QUALIFIED` / `PENDING_COMPLIANCE` (`authoritativeDriverQualificationService.ts`). |
| **Failure handling** | `AuthoritativeQualificationError` / null status → movement **fail-closed** (`dispatchMovementAuthorizationService.ts`). |
| **Controls preventing unqualified movement** | **Verified in tests:** `authoritativeDriverQualification.certification.test.ts`, `dispatchAssignment.authorization.certification.test.ts`, integrated I-9 suite. **Not verified** against real production driver population. |
| **Test evidence** | I-1 cert + integrated lifecycle; not a backfill regression suite. |
| **Operational risk** | **High** — deploying enforcement without backfill stops dispatch for most existing drivers until manual compliance verification completes. |
| **Recommended action** | Operational program: inventory drivers, verify/affirm documents via existing compliance workflows, record evidence in DB; optional engineering: backfill job/report script (read-only assessment first, then scoped implementation if authorized). |
| **Dependencies** | BOF Compliance process, fleet roster access, I-2 document paths for concurrent writes (`docs/stage0/STAGE0-I6-INTEGRATION-DEPENDENCIES.md` — document verify/reject locking still called out as open for full serialization). |
| **Production-blocking** | **Yes** for any fleet with live drivers not already on authoritative evidence. |

---

### D-2 — Enforcement and observe-mode controls

| Field | Assessment |
| --- | --- |
| **Status** | **NOT IMPLEMENTED** |
| **Implementation** | Single enforcement path: `authorizeMovement` in `lib/services/dispatchMovementAuthorizationService.ts` for `PLANNING_RESERVE`, `RELEASE`, `PICKUP_ISSUE`, `PICKUP_VERIFY`. No `BOF_STAGE0_QUALIFICATION_ENFORCEMENT` or observe flag in codebase (confirmed by repo search; documented gap in `docs/stage0/STAGE0-I9-CERTIFICATION.md` §6). |
| **Observe-mode behavior** | **Absent.** Samba intelligence **observes** STOP records (`lib/services/samba/sambaIntelligenceService.ts`) but does not gate movement. |
| **Feature flags / env** | `.env.example` lists only `AUTH_SECRET`, `DATABASE_URL`, Mapbox tokens — no Stage 0 enforcement toggle. |
| **Fail-safe** | Missing auth/DB fails closed (503) per `ENVIRONMENT_SETUP.md`. Movement policy itself has no “monitor only” branch. |
| **Authorization boundaries** | Server-side gates on assignment, release, pickup issue/verify, physical reconcile (post-I-9R). UI warnings are supplemental per charter. |
| **Enabling enforcement** | **Implicit:** deploy certified commit → immediate enforcement. No documented staged enablement procedure. |
| **Test evidence** | Certification tests assume enforcement **on**; no observe-mode test matrix. |
| **Operational risk** | **High** — uncontrolled production deploy activates hard blocks without operator rehearsal or parallel monitoring period. |
| **Recommended action** | Implement explicit enforcement mode (e.g. env + per-fleet override): **OBSERVE** (log/warn/audit would-be denials without blocking) vs **ENFORCE**; default OBSERVE in Preview/staging; production ENFORCE only after D-1 + D-3 sign-off. Fail-safe: unknown config → ENFORCE or deny (product decision). |
| **Dependencies** | D-1 data readiness; staging verification (D-3); audit accuracy (S0-I9-04) for observe logs. |
| **Production-blocking** | **Yes** for safe cutover unless leadership explicitly accepts big-bang enforce with frozen operations. |

---

### D-3 — Staging end-to-end verification

| Field | Assessment |
| --- | --- |
| **Status** | **PARTIALLY IMPLEMENTED** (automated lifecycle in isolated DB); **NOT IMPLEMENTED** (staging deployment E2E) |
| **Implementation** | `lib/services/stage0.integrated.certification.test.ts` — full lifecycle: qualification → equipment → assignment → release → pickup → verify → physical reconcile → invalidation, plus concurrency/fleet isolation. Component certs: pickup, physical, driver/equipment invalidation, movement authorization tests. |
| **Staging E2E-01/E2E-02** | Referenced in `STAGE0-I9-CERTIFICATION.md` as **not done**; no scripts/checklists under `docs/stage0/` for staged URL + authenticated operator flows. |
| **Delivery handoff** | Integrated test covers movement through pickup/release; **ePOD/delivery settlement** paths exist separately (`lib/services/epod/`, `load-finance-handoff`) but are **not** part of Stage 0 integrated cert scope. |
| **Infrastructure** | Local PG (`bof_dev` @ loopback) enforced by `lib/test/assertTestDatabaseTarget.ts`. Staging URL, Vercel env, and seeded staging tenants **not verified** here. |
| **Test evidence** | Claude: 294/294 sequential on certified commit; this assessment did not re-run staging deploy. |
| **Operational risk** | **Medium–High** — config drift, auth/session, and Vercel env mistakes won't be caught by local certs alone. |
| **Recommended action** | Define E2E-01/E2E-02 scripts: authenticated staging walkthrough matching integrated cert stages; record deployment ID + commit + migration ledger output; charter-mandated post-release checks (`BOF-UNIFIED-ENGINEERING-CHARTER.md`). |
| **Dependencies** | Staging DATABASE_URL, test fleets/users, D-2 observe mode for first staging enforce trial. |
| **Production-blocking** | **Yes** for charter-compliant release; **mitigable** only with explicit waiver and limited pilot fleet. |

---

### D-4 — Preservation smoke testing

| Field | Assessment |
| --- | --- |
| **Status** | **NOT IMPLEMENTED** (Stage 0–specific smoke); **IMPLEMENTED** (unrelated lib tests for many domains) |
| **Scope requested** | Driver onboarding, fleet admin, equipment, dispatch, documents, pickup/reconcile, customer-facing flows unchanged by Stage 0. |
| **Evidence** | Full lib suite (294 tests) includes recruiting, intake, contact, fleet visibility, etc., but **no** dedicated “preservation smoke” checklist or staging browser script tied to Stage 0 release. `docs/stage0/STAGE0-I9-CERTIFICATION.md`: D-4 **not done**. |
| **Operational risk** | **Medium** if marketing/demo surfaces ship with Stage 0; **Lower** if release is dispatch/pickup-only behind feature flags. |
| **Recommended action** | Short manual + automated smoke list on staging after deploy; focus on non-Stage-0 routes cited in certification. |
| **Dependencies** | D-3 staging environment. |
| **Production-blocking** | **Conditional** — required if full app surface is deployed; optional for narrow operational pilot. |

---

### D-5 — Notifications, acknowledgments, and escalation

| Field | Assessment |
| --- | --- |
| **Status** | **PARTIALLY IMPLEMENTED** (in-app); **NOT IMPLEMENTED** (external BOF ops delivery & escalation runbook) |
| **Triggers** | Driver/equipment invalidation → `OperatingException` + `notifyFleetResponders` in `lib/services/driverMovementInvalidationService.ts` (equipment path via `equipmentSafetyInvalidationService.ts`). Pickup STOP/physical reconcile → audit + process events (`pickupPhysicalReconciliationService.ts`, `pickupAuthorizationService.ts`). |
| **Recipients** | ACTIVE fleet memberships with roles in `NOTIFIED_ROLES` (Dispatch, Compliance, carrier management codes) — database-backed, fleet-scoped. |
| **Delivery channel** | **Operational chat only:** `operationalChatThread`, `operationalChatMessage`, `operationalChatNotification` created **inside invalidation transaction** (atomic with exception). |
| **Acknowledgment** | Chat `readAt` on notifications/messages (`lib/services/operationalChatService.ts`) — **not** the same as BOF operator exception acknowledgment, SLA, or disposition tracking on `OperatingException`. |
| **Escalation** | IN_MOTION path sets `nextAction` and `MOVEMENT_IN_MOTION_ESCALATION` notification kind; **no** timer, paging, or external email/SMS. |
| **Failure handling** | Invalidation notifications transactional; **post-commit** audit/event failures (S0-I9-04) can lose audit trail while state commits. |
| **Audit evidence** | `auditEvent` via `lib/audit.ts`; exception opened events in driver invalidation cert tests. |
| **Test evidence** | `driverMovementInvalidation.certification.test.ts` (notifications, idempotent sweep); equipment invalidation escalation test. |
| **Operational risk** | **High** for outsourced BOF — exceptions may go unseen if staff are not logged into chat; no after-hours escalation. |
| **Recommended action** | Runbook + external notification integration (email/webhook) for CRITICAL holds; BOF operator acknowledgment record linked to `OperatingException`; optional on-call rotation (operational, not code-only). |
| **Dependencies** | Identity/roles for service accounts; D-3 to validate on staging. |
| **Production-blocking** | **Yes** for full outsourced operations model; **mitigable** with 24/7 staffed chat monitoring during pilot (operational mitigation). |

---

## Section C — Additional release blockers

### C.1 Reliable post-commit auditing (S0-I9-04)

| Field | Assessment |
| --- | --- |
| **Status** | **PARTIALLY IMPLEMENTED** |
| **Architecture** | `lib/audit.ts` — synchronous `auditEvent.create` via Prisma; optional transaction client parameter but **not** used for post-transaction paths in pickup physical reconcile success/denial handlers. Process events via `recordOperatingProcessEvent` after commit. Invalidation path writes chat/notifications **inside** transaction (good). |
| **Defect** | After successful `$transaction`, `pickupPhysicalReconciliationService.ts` calls `createAuditRecord` / `recordOperatingProcessEvent`; failure → uncaught error → API **500** (`app/api/dispatch/pickup-authorization/_shared.ts`) while DB state remains STOPPED/RELEASED. **Evidence:** `stage0.i9-final-recertification.test.ts` on branch `74e01899` (injected audit failure). |
| **Smallest reliable remediation (recommendation only)** | (1) Move **business-critical** audit rows into the same transaction where feasible; OR (2) outbox table written in-tx + async worker; OR (3) catch post-commit audit failures, return **200/409 with `auditWarning`** and enqueue retry — never 500 when authorization state committed. Prefer minimal: transactional audit for movement-adjacent events + structured degraded response. |
| **Test evidence** | Final recert R-01 audit injection tests (certification branch). |
| **Production-blocking** | **Yes** for accurate client/API contract and compliance traceability; authorization integrity remains correct (fail-closed state). |

### C.2 Qualification-expiration sweep

| Field | Assessment |
| --- | --- |
| **Status** | **IMPLEMENTED BUT NOT VERIFIED** (operations) |
| **Implementation** | `scripts/run-driver-qualification-sweep.ts` → `sweepDriverQualificationInvalidations` in `driverMovementInvalidationService.ts`. Documented in `docs/stage0/STAGE0-I7-DRIVER-INVALIDATION.md`. |
| **Scheduling** | **None** in repo (no `vercel.json` cron, no GitHub Action for sweep). |
| **Service account** | Script requires `--actor-email` with user having `BOF_OPERATIONS` or `BOF_COMPLIANCE_REVIEW` membership per fleet — **no** committed service account definition. |
| **Test evidence** | `driverMovementInvalidation.certification.test.ts` (scheduled detection scenario, idempotency, 403 for non-compliance actors). |
| **Production-blocking** | **Yes** for long-running fleets without daily manual review — expired credentials may not invalidate until next movement attempt without sweep. |

### C.3 Database environment isolation

| Field | Assessment |
| --- | --- |
| **Status** | **PARTIALLY IMPLEMENTED** |
| **Implementation** | Test harness: `lib/test/assertTestDatabaseTarget.ts` blocks Neon/production hosts and non-allowlisted DB names (`bof_dev`, `bof_inc5_verify`) on loopback only. |
| **Configuration evidence** | `.env.example` / `ENVIRONMENT_SETUP.md` — generic `DATABASE_URL`; **no** documented Preview vs production Neon project separation in repo. |
| **Verified production isolation** | **Not available** in this assessment (read-only; no Vercel/Neon access). |
| **Production-blocking** | **Yes** until operators verify distinct URLs, access controls, and migration discipline per charter (no accidental prod migration). |

### C.4 Production deployment fingerprint

| Field | Assessment |
| --- | --- |
| **Status** | **PARTIALLY IMPLEMENTED** |
| **Implementation** | Charter requires deployed **commit** and **Vercel deployment ID** verification (`docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md`). Migration level: `scripts/admin/prisma-migration-ledger-readonly.mjs` (read-only `_prisma_migrations` query + connection metadata). |
| **Gaps** | No `/api/health` or build-info endpoint embedding git SHA in app; no automated release checklist in `docs/stage0/`. Package deploy scripts invoke Vercel CLI without recording fingerprint (`package.json` patterns noted in production-readiness gap docs). |
| **Production-blocking** | **Yes** for disciplined release; **operational** mitigation via manual `vercel inspect` + git tag + migration ledger script. |

### C.5 Legal and operational review

| Field | Assessment |
| --- | --- |
| **Status** | **NOT IMPLEMENTED** (in repository) |
| **Evidence** | No signed approval artifacts, runbooks, or change-control records in `docs/stage0/`. Marketing QA docs (`docs/production-readiness/*`) address demo/live separation, not Stage 0 legal sign-off. |
| **Production-blocking** | **Yes** — human approvals cannot be inferred from passing tests. |

---

## Section D — Remaining I-9 findings (production disposition)

Disposition key: **P0** = correct before production; **P1** = mitigate operationally for pilot; **P2** = schedule post-release.

| ID | Summary | Evidence | Risk | Disposition | Rationale |
| --- | --- | --- | --- | --- | --- |
| **S0-I9-04** | Post-commit audit/process event failure → HTTP 500, missing audit row; state committed | Final recert §B; `pickupPhysicalReconciliationService.ts` post-tx audit; `_shared.ts` 500 mapping | Compliance/ops confusion; false failure retries | **P0** | State is correct but API and audit trail lie; charter expects auditable operations. |
| **S0-I9-03** | `persistConditionEvent` lacks lifecycle validation; CONFIRMED/CHANGED on RESOLVED can reactivate critical thread without invalidation (REOPENED only invalidates) | `conditionService.ts` ~1125–1132 vs ~1292–1298 (CREATE invalidates) | Live pickups may remain until next movement gate | **P1** | Release/pickup re-read open conditions; UI reachability unconfirmed. Mitigate: ban RESOLVED→active transitions in ops until fixed. |
| **S0-I9-05** | `completePreTrip` updates to COMPLETED without equipment lock/transaction | `preTripService.ts` `completePreTrip` (plain `update`) vs locked `updatePreTripItem` | COMPLETED header with blocking defect possible; movement still blocked at release | **P1** | Fail-closed on movement; data integrity/inspection immutability issue. Fix before relying on pre-trip as legal evidence. |
| **S0-I9-06** | Unconditional status updates after stale reads (cancel, expire) | `pickupAuthorizationService.ts` `expireIfNeeded`, `cancelPickupAuthorization` | Theoretical overwrite of RELEASED | **P2** | Low probability; cert focuses on invalidation paths. |
| **S0-I9-07** | Legacy `writeDispatchRelease` callable with caller evaluation | `dispatchReleaseService.ts`; unused except tests | Bypass if new caller added | **P2** | Delete or harden when touched; no current caller in prod paths. |
| **S0-I9-08** | Unassign leaves pickups PENDING | Assignment/unassign services | Confusing state; gates refuse inactive assignment | **P2** | Operational nuisance; not an authorization bypass post-I-9. |
| **S0-I9-09** | Parallel test DB interference | Test harness docs | CI flake only | **P2** | Sequential suite green at 294. |
| **UNAVAILABLE planning** | DISPATCH may set OUT_OF_SERVICE→UNAVAILABLE; planning allows UNAVAILABLE (only OOS blocked at plan) | `evaluatePlanningEquipmentSafety` vs `evaluateEquipmentSafety` | OOS equipment assignable after downgrade to UNAVAILABLE; movement still blocked at release | **P1** | Operational discipline + role policy; consider tightening UNAVAILABLE at planning for safety-critical fleets. |
| **AUTHORIZED without movement verify** | Non-identity-matched physical reconcile sets `AUTHORIZED` without `authorizeMovement` | `pickupPhysicalReconciliationService.ts` tx branch when `!releasingMovement` | Misleading status; RELEASE still requires identity match + PICKUP_VERIFY | **P2** | No RELEASED bypass; train operators that AUTHORIZED ≠ release. |

**Note:** S0-I9-01/02 and S0-I9R-01/02 are **closed** on `53acec36` per final certification — not reopened here.

**Related non–I-9 dependency:** `docs/stage0/STAGE0-I6-INTEGRATION-DEPENDENCIES.md` — document verify/reject paths may still lack driver qualification lock (I-2 follow-on). Treat as **P1** for production concurrency under heavy document churn.

---

## Section E — Recommended remediation sequence

Prioritized for safety, authorization integrity, ops dependencies, deploy requirements, and effort. Items on the same row may proceed in parallel if teams differ.

| Phase | Item | Effort | Parallel safe with |
| --- | --- | --- | --- |
| **1** | **D-2** Enforcement/observe-mode + documented enablement runbook | **Medium** | D-1 operational planning |
| **1** | **D-1** Compliance backfill program (+ optional reporting script) | **Large** (ops-heavy) | D-2 engineering |
| **2** | **S0-I9-04** Post-commit audit reliability (movement-adjacent paths first) | **Medium** | Sweep scheduling |
| **2** | Expiry sweep: service account, cron, monitoring | **Small** | S0-I9-04 |
| **3** | **D-5** External notification + BOF exception acknowledgment | **Large** | — |
| **3** | **D-3** Staging E2E-01/E2E-02 + deployment fingerprint checklist | **Medium** | D-4 smoke |
| **4** | **D-4** Preservation smoke on staging | **Small–Medium** | D-3 |
| **4** | DB environment isolation verification (Neon/Preview/prod) | **Small** (ops) | D-3 |
| **5** | **S0-I9-05** Pre-trip completion under lock | **Small** | S0-I9-03 lifecycle validation |
| **5** | **S0-I9-03** Condition lifecycle validation + invalidation parity | **Medium** | I-2 document lock completion |
| **6** | P2 cleanup (I9-06–09, writeDispatchRelease, unassign pickup cancel, UNAVAILABLE policy) | **Small** each | — |
| **Gate** | Legal/operational sign-off (C.5) | **N/A** | After D-1/D-3/D-5 mitigations |

**Do not merge unrelated features into the certified baseline** (`53acec36` lineage); branch remediation per item with targeted tests.

---

## Section F — Production go / no-go

**Recommendation: NO-GO** for production deployment of Stage 0 enforcement as of certified commit `53acec36`.

**Conditions that would support a future GO (evidence required, not implementation claims):**

1. D-1 backfill completed or scoped fleet pilot with documented qualification status for every assigned driver.
2. D-2 observe-mode exercised on Preview/staging, then ENFORCE enabled with rollback plan.
3. D-3 staging E2E signed off with commit + Vercel deployment ID + migration ledger.
4. D-5 BOF operator notification and acknowledgment path live (or formal waiver with staffed monitoring).
5. S0-I9-04 remediated or accepted degraded-audit protocol with retry — **not** silent 500s.
6. Expiry sweep scheduled with verified service account run.
7. Database isolation and deployment fingerprint verified by operators.
8. Legal/operational written approval.

**GO for continued pre-production engineering and staged pilots:** **Yes** — certification supports merging the I-9R baseline into integration branches **behind** D-2 observe mode and excluding production until prerequisites are met.

---

## Section G — Proposed next engineering assignment

**Single highest-priority implementation task (authorized separately):**

### Implement Stage 0 enforcement / observe-mode controls (D-2)

**Why first:** Without this, deploying the certified codebase immediately enforces qualification and equipment rules (`authorizeMovement`) with no way for BOF to monitor impact on real fleets during cutover. D-1 can run in parallel as an operational workstream, but D-2 prevents an unsafe “big bang” deploy even if some drivers are backfilled.

**Scope sketch (for a future PR, not this assessment):**

- Central policy reader (env + optional per-fleet override) consumed by `dispatchMovementAuthorizationService.ts` and documented in `ENVIRONMENT_SETUP.md`.
- **OBSERVE:** run full evaluation, emit audit/process events for would-be denials, return success where today would deny (only in non-production unless explicitly configured).
- **ENFORCE:** current behavior (default for production when flag set).
- Fail-safe default documented and tested.
- Tests: observe does not write denials; enforce matches existing cert suite.

**Do not begin this work without explicit authorization** — this document is assessment-only.

---

## Appendix — Source references (quick index)

| Topic | Location |
| --- | --- |
| Release prerequisites table | `docs/stage0/STAGE0-I9-CERTIFICATION.md` §6 |
| Final certification summary | `docs/stage0/STAGE0-I9-FINAL-RECERTIFICATION.md` @ `74e01899` |
| Integrated lifecycle test | `lib/services/stage0.integrated.certification.test.ts` |
| Movement authorization | `lib/services/dispatchMovementAuthorizationService.ts` |
| Qualification sweep | `scripts/run-driver-qualification-sweep.ts`, `docs/stage0/STAGE0-I7-DRIVER-INVALIDATION.md` |
| Audit helper | `lib/audit.ts` |
| Test DB guard | `lib/test/assertTestDatabaseTarget.ts` |
| Migration fingerprint (read-only) | `scripts/admin/prisma-migration-ledger-readonly.mjs` |
| Charter release discipline | `docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md` |

**Assessment document commit:** to be recorded on branch `docs/stage0-production-readiness-assessment` (parent `53acec36`).
