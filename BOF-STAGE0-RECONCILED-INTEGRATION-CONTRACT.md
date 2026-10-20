# BOF Stage 0 — Reconciled Integration Contract (Implementation-Ready)

**Status:** Single authoritative contract for Stage 0 implementation  
**Date:** 2026-10-20  
**Baseline commit:** `0d0e5fdce31be05901ef7b75c2cb5b2d600c9e2d` (`release/web-004-005-prep`)  
**Scope:** Driver qualification + equipment safety + dispatch movement authorization only. **Business Operations historical review is closed — do not reopen.**

**Validated against (this worktree):**

| Document | Path |
|----------|------|
| Equipment safety Stage 0 | [`BOF-EQUIPMENT-SAFETY-STAGE-0-SPEC.md`](BOF-EQUIPMENT-SAFETY-STAGE-0-SPEC.md) |
| Equipment gap analysis | [`BOF-EQUIPMENT-SAFETY-GAP-REPORT.md`](BOF-EQUIPMENT-SAFETY-GAP-REPORT.md) |

**Not present in repo (Claude worktree — reconcile by reference only):**

| Document | Notes |
|----------|--------|
| `STAGE0-PATCH-SPECIFICATION.md` | Assumed to define V1–V6 fixes; mapped below to BOF services/APIs |
| `STAGE0-INTEGRATION-CONTRACT.md` | Superseded **by this file** for the combined program |

**Unified movement policy version:** `bof-stage0-movement-v1` (stored on `DispatchRelease.policyVersion`).

---

## Architectural boundaries (locked)

| Layer | Owns | Must not |
|-------|------|----------|
| **Driver qualification** (Claude) | Live evaluation of mandatory evidence; waivers; verification integrity | Movement orchestration; equipment rules |
| **Equipment safety** (Cursor) | `assembleReleaseInputs`, `evaluateRelease` equipment/pre-trip/condition slices | Driver qualification logic; competing equipment-readiness store |
| **Movement authorization** (Cursor) | `dispatchMovementAuthorizationService` — combines qual + equipment at gates | Reimplement equipment rules outside `dispatchReleaseService` |
| **Planning vs movement** | Same service, different `stage`; assignment ≠ cleared to move | Single blanket “dispatchable” flag |

Neither driver eligibility nor equipment safety may override a disqualifying finding from the other (**combined disposition = most restrictive**).

---

## 1. Driver qualification (Claude-owned)

### 1.1 Authoritative interface

**Module (Claude sole owner):** `lib/services/authoritativeDriverQualificationService.ts`  
*(May live under `qualificationService.ts` exports — file ownership stays Claude until merge.)*

```typescript
import type { Prisma } from "@prisma/client";

export type AuthoritativeDriverQualificationStatus =
  | "QUALIFIED"
  | "CONDITIONAL"
  | "PENDING_COMPLIANCE"
  | "NOT_QUALIFIED";

export type AuthoritativeDriverQualification = {
  status: AuthoritativeDriverQualificationStatus;
  qualificationSnapshotId: string | null;
  reasonCodes: string[];
  summary: string;
  policyVersion: string;
  /** Required for CONDITIONAL movement authorization */
  conditionalMovementPermitted: boolean;
  evaluatedAt: Date;
};

/**
 * MUST be called inside the same transaction as movement decisions when tx is provided.
 * Re-reads mandatory evidence; MUST NOT read DriverReadinessScore for authority.
 */
export async function getAuthoritativeDriverQualification(
  tx: Prisma.TransactionClient,
  driverId: string,
  fleetId: string,
): Promise<AuthoritativeDriverQualification>;
```

### 1.2 Status rules (movement)

| Status | RELEASE / PICKUP_ISSUE / PICKUP_VERIFY | PLANNING_RESERVE (assignment) |
|--------|----------------------------------------|-------------------------------|
| `QUALIFIED` | Allow if equipment permits | Allow if equipment planning rules permit |
| `CONDITIONAL` | Allow **only if** `conditionalMovementPermitted === true` | Same default as movement unless fleet policy documents stricter planning (default: same) |
| `PENDING_COMPLIANCE` | **Deny** | **Deny** (fail closed) |
| `NOT_QUALIFIED` | **Deny** | **Deny** |

**Prisma mapping:**

| `QualificationDisposition` | Authoritative status |
|----------------------------|----------------------|
| `QUALIFIED` | `QUALIFIED` |
| `CONDITIONALLY_QUALIFIED` | `CONDITIONAL` |
| `PENDING_REVIEW` | `PENDING_COMPLIANCE` |
| `NOT_QUALIFIED` | `NOT_QUALIFIED` |

### 1.3 Stored readiness scores

- `DriverReadinessScore` / `writeReadinessScore` / `POST .../intake/[intakeId]/readiness` — **telemetry and UI only** after Stage 0.
- **`getAuthoritativeDriverQualification` is the only input** to movement driver gate.
- **V1 fix:** Remove any path where manual review or readiness POST can imply movement without a matching qualification evaluation snapshot.

### 1.4 Claude vulnerabilities — required evaluator behavior

| ID | Vulnerability | Authoritative fix (Claude) | Primary touchpoints (Claude-owned) |
|----|---------------|--------------------------|-------------------------------------|
| **V1** | Unauthorized manual readiness overrides | Movement ignores readiness; manual review must write **qualification snapshot** + audit with role gate; readiness write restricted to evaluated-only or disabled for movement override | `driverEligibilityReviewService.ts`, `app/api/intake/[intakeId]/readiness/route.ts`, `readinessService.ts` |
| **V2** | Unauthorized qualification-requirement waivers | `exceptionReason` / waiver requires **COMPLIANCE_REVIEW** (or equivalent) role + audit; waivers cannot set status `QUALIFIED` without `REQUIREMENT_EXCEPTION` reason and approver id | `requirementService.ts`, `app/api/requirements/[requirementId]/route.ts`, `app/api/intake/[intakeId]/requirements/route.ts` |
| **V3** | Credential self-verification / forged reviewer | Document verify actions require **separate verifier** identity; driver session cannot set `verificationStatus=VERIFIED` on own credentials; `verifiedByUserId` must not equal submitter | `driverDocumentVersioningService.ts`, intake/document verify API routes (Claude inventory in patch spec) |
| **V4** | Unauthorized assignment cancellation / cross-fleet | `unassign` requires dispatch role + fleet scope; **BOF multi-fleet** only via explicit membership on **assignment.fleetId**; reject cross-fleet assignment id | `dispatchAssignmentService.ts` (`unassign`, `getAuthorizedAssignmentRecord`) — **authorization hardening Claude**; movement service validates fleet on all stages |
| **V5** | Missing requirements → incorrect READY | `getAuthoritativeDriverQualification` must treat **missing mandatory requirements** (including clearinghouse / road test when in policy set) as `PENDING_COMPLIANCE` or `NOT_QUALIFIED`, never `QUALIFIED` | `authoritativeDriverQualificationService.ts`, `qualificationService.ts` evaluation inputs |
| **V6** | Rejected employment history satisfies qualification | `WORK_HISTORY` / employment records with `REJECTED` (or unsatisfied required requirement) must **block** qualification; empty history ≠ satisfied if required | `qualificationService.ts` work-history rules; align with `requirementService.evaluateIntakeRequirements` |

---

## 2. Equipment safety (Cursor-owned)

### 2.1 Authoritative foundation

**Owner:** `lib/services/dispatchReleaseService.ts` (+ `lib/services/equipmentSafetyPredicates.ts`)

- **`assembleReleaseInputs`** — extended with open safety-critical `ConditionThread` rows for tractor/trailer.
- **`evaluateEquipmentSafety(...)`** — internal; blocking pre-trip defects, `Equipment.status`, condition threads.
- **`evaluateRelease`** — combines **injected** `AuthoritativeDriverQualification` (from movement service) + equipment slice; **no second equipment engine**.

**Prohibited:** `EquipmentReadinessScore` table or parallel evaluator (per [`BOF-EQUIPMENT-SAFETY-STAGE-0-SPEC.md`](BOF-EQUIPMENT-SAFETY-STAGE-0-SPEC.md)).

### 2.2 Equipment bypasses — required behavior

| ID | Bypass | Fix location | Reason code (examples) |
|----|--------|--------------|------------------------|
| **EQ-01** | Open safety-critical `ConditionThread` ignored at release | `evaluateEquipmentSafety` | `SAFETY_CRITICAL_CONDITION` |
| **EQ-02** | Post-complete pre-trip edit + stale pickup | `preTripService` immutability + movement re-eval | `PRETRIP_SUPERSEDED` / 422 |
| **EQ-03** | Stale release after OPEN pre-trip blocking defect | Pickup re-eval | `PRETRIP_DEFECT` |
| **EQ-04** | `UNAVAILABLE` at movement | `evaluateEquipmentSafety` | `TRUCK_UNAVAILABLE` |
| **EQ-05** | `OUT_OF_SERVICE` at assignment | `createAssignment` (existing) | 422 |
| **EQ-06** | Pickup verify without re-eval | `pickupAuthorizationService` | STOP / 409 |
| **EQ-07** | Equipment downgrade after release | `equipmentSafetyInvalidationService` | invalidation + exception |
| **EQ-08** | Silent blocking defect clear | OPEN/BLOCKED pre-trip only | audit |
| **EQ-09** | Planning assign with open condition | Advisory audit only | non-blocking |
| **EQ-10** | Driver OK + equipment fail | Combined gate | equipment reason wins when driver OK |

**Post-release changes:** `equipmentSafetyInvalidationService.ts` (Cursor) — append BLOCKED release, cancel pickup, `OperatingException`, corrective actions, Samba finding — **no unassign, no silent defect clear**.

---

## 3. Movement authorization (Cursor-owned integration)

### 3.1 Service

**Sole owner:** `lib/services/dispatchMovementAuthorizationService.ts`  
**Claude must not edit this file** (consumes `getAuthoritativeDriverQualification` only).

```typescript
export type MovementAuthorizationStage =
  | "PLANNING_RESERVE"
  | "RELEASE"
  | "PICKUP_ISSUE"
  | "PICKUP_VERIFY";

export type MovementAuthorizationResult = {
  stage: MovementAuthorizationStage;
  allowed: boolean;
  disposition:
    | "PLANNING_ALLOWED"
    | "PLANNING_DENIED"
    | "RELEASED"
    | "CONDITIONALLY_RELEASED"
    | "HOLD"
    | "BLOCKED";
  reasonCodes: string[];
  summary: string;
  policyVersion: "bof-stage0-movement-v1";
  qualificationSnapshotId: string | null;
  releaseEvaluation?: import("./dispatchReleaseService").DispatchReleaseEvaluation;
};

export async function authorizeMovement(
  tx: Prisma.TransactionClient,
  stage: MovementAuthorizationStage,
  context: {
    sessionUser: SessionUserLike;
    loadId: string;
    assignmentId?: string;
  },
): Promise<MovementAuthorizationResult>;
```

### 3.2 Orchestration (no duplicated safety logic)

```text
authorizeMovement(tx, stage, ctx)
  1. authorizedFleetAccess(load.fleetId) — cross-fleet deny (V4)
  2. lockDriverForMovement(tx, driverId)  // existing pg_advisory key bof-driver-readiness:{driverId}
  3. driverQual = getAuthoritativeDriverQualification(tx, driverId, fleetId)  // Claude
  4. IF stage == PLANNING_RESERVE → planning driver + equipment rules → return
  5. inputs = assembleReleaseInputsInTx(tx, ...)  // Cursor — same fields as assembleReleaseInputs
  6. evaluation = evaluateRelease({ ...inputs, driverQualification: driverQual })  // Cursor
  7. allowed ⇔ disposition ∈ { RELEASED, CONDITIONALLY_RELEASED } (movement stages)
  8. IF driverQual blocks AND equipment blocks → reasonCodes include BOTH; disposition BLOCKED
```

### 3.3 Call sites (must use current evidence)

| Stage | HTTP | After Stage 0 |
|-------|------|----------------|
| `PLANNING_RESERVE` | `POST /api/dispatch/assignment` | Inside `createAssignment` transaction |
| `RELEASE` | `POST /api/dispatch/release/[loadId]` | Before `writeDispatchRelease` |
| `PICKUP_ISSUE` | `POST /api/dispatch/pickup-authorization` | Re-eval + write release row |
| `PICKUP_VERIFY` | `POST .../pickup-authorization/[id]/verify` | Re-eval before authorize |

**Stale `DispatchRelease` alone must never authorize pickup.**

---

## 4. Inspection integrity & migration decision

### 4.1 Required without migration (Stage 0-A — implementation prerequisite)

| Control | Mechanism |
|---------|-----------|
| Completed pre-trip not silently rewritten | `updatePreTripItem` → **422** if `PreTripHeader.status === COMPLETED` |
| Release invalidation | Append new `DispatchRelease` + cancel active `PickupAuthorization` with audited reason |
| Superseded evidence detection | Compare pre-trip `updatedAt` vs last release `evaluatedAt` → `PRETRIP_SUPERSEDED` |

**Stage 0-A can ship movement + immutability without DB migration.**

### 4.2 Migration required for formal amendment chain (Stage 0-B — optional slice)

**Genuinely necessary if product requires:** preserved original inspection, amendment reason, and explicit supersession chain (equipment spec §7).

| Schema change | Purpose | Compatibility |
|---------------|---------|---------------|
| `PreTripStatus` + `SUPERSEDED` | Mark replaced header | Existing rows unchanged |
| `PreTripHeader.supersedesHeaderId` | Amendment chain | Nullable |
| `PreTripAmendment` (recommended) | `snapshotJson`, `reason`, `createdByUserId`, fleet/assignment ids | New table |
| `DispatchRelease.supersededAt`, `supersededByReleaseId` | Logical invalidation | Nullable |
| `PickupAuthorization.supersededReason` | Audit | Nullable |
| Optional: `DispatchRelease.driverQualificationSnapshotId` | Qual audit link | Nullable FK |

**Migration name:** `YYYYMMDDHHMMSS_stage0_pretrip_amendment_release_supersession`

**Rollback:** New columns/tables nullable or unused if code reverted; do not delete historical releases. Amendment API disabled if rollback before data migration.

**Contract decision:** **Do not block Stage 0-A implementation** on migration. Stage 0-B follows amendment route (`POST /api/dispatch/pretrip/[id]/amend`).

---

## 5. Active shipment escalation

**Reuse only:** `OperatingException`, `OperatingCorrectiveAction`, `createAuditRecord`, `SambaFinding`, `OperationalChatNotification` (where applicable).

| Trigger | Service | Actions |
|---------|---------|---------|
| Driver disqualification after movement authorized | `driverMovementInvalidationService.ts` (Claude-owned, symmetric to equipment) | Re-run `authorizeMovement`; append BLOCKED release; cancel pickup; open exception `DRIVER_QUALIFICATION_MOVEMENT_HOLD`; corrective actions **DISPATCH** + **BOF_COMPLIANCE_REVIEW** / Safety |
| Equipment unsafe after release | `equipmentSafetyInvalidationService.ts` (Cursor) | Per equipment spec §4.7 |

**Notifications (required):**

1. **BOF Dispatch** — `ownerTeam: DISPATCH` on exception + corrective action.  
2. **BOF Compliance/Safety** — second corrective action row.  
3. **Carrier authorized administrator** — notify users with `FLEET_ADMIN` (or documented carrier-admin role) **membership on `assignment.fleetId`** via existing notification/chat mechanisms; **no new notification table** in Stage 0 unless Claude patch spec requires minimal extension (confirm with Claude).

**Explicit non-actions:** no automatic load cancel/unassign; no silent defect or qualification clearance.

---

## 6. Authorization (role, fleet, ownership)

**Rule:** Every write on qualification, requirement waiver, document verification, equipment status, pre-trip mutation, assignment, release, pickup must:

1. Call `authorizedFleetAccess(sessionUser, fleetId)` (or assignment-derived fleetId).  
2. Enforce **role allowlist** per operation (Claude defines in patch spec; minimum: dispatch vs compliance vs driver).  
3. **Multi-fleet BOF staff:** allowed only when user has **ACTIVE membership on that fleetId**; membership in fleet A **must not** authorize records in fleet B (V4).

| Write path | Owner hardening |
|------------|-----------------|
| `POST .../intake/.../readiness` | Claude — V1 |
| `PATCH .../requirements/...` (exceptionReason) | Claude — V2 |
| Document verify / credential | Claude — V3 |
| `POST .../assignment/.../unassign` | Claude — V4 |
| `PATCH .../equipment/.../status` | Cursor |
| `PATCH .../pretrip/.../item` | Cursor |
| `POST .../release`, pickup | Cursor (calls movement) |

---

## 7. Compliance backfill (deployment prerequisite — not implementation blocker)

**Issue:** Production may lack **Clearinghouse query** and **road test** (and other mandatory) determinations. Fail-closed `getAuthoritativeDriverQualification` would yield **`PENDING_COMPLIANCE`** for most drivers → movement blocked at enforce.

**Do not invent evidence or bypass rules.**

### 7.1 Evidence workflow before production enforce

| Step | Activity | Output |
|------|----------|--------|
| B1 | **Inventory** — per fleet, list drivers with ACTIVE assignment or READY score but missing policy-mandatory artifacts | Compliance report (CSV/query) |
| B2 | **Classify** — missing vs rejected vs pending verification vs waived (with existing exceptionReason) | Row-level disposition |
| B3 | **Remediate** — upload/verify documents, complete intake requirements, or **documented waiver** via authorized compliance review (snapshot + audit) | Updated Prisma evidence |
| B4 | **Re-evaluate** — batch `getAuthoritativeDriverQualification` dry-run | % QUALIFIED / CONDITIONAL / PENDING |
| B5 | **Sign-off** — Compliance owner approves enforce mode | Ticket / audit record |

### 7.2 Enforcement flag (implementation prerequisite for prod only)

| Mode | Behavior |
|------|----------|
| `observe` | Compute full `authorizeMovement` result; log WOULD_BLOCK; **allow** movement (staging only) |
| `enforce` | Deny movement when qual or equipment fails |

**Development / CI:** use seeded `bof_dev` with complete fixtures; enforcement **on** in tests.

---

## 8. Integrated regression matrix

**Primary:** `lib/services/stage0.movementAuthorization.integration.test.ts`  
**Also:** `dispatchEquipmentSafety.stage0.test.ts`, `dispatchAssignment.safety.test.ts`, Claude driver security tests from patch spec.

| ID | Category | Scenario | Expected |
|----|----------|----------|----------|
| V1 | Driver | Readiness READY + qual NOT_QUALIFIED → RELEASE | BLOCKED |
| V2 | Driver | PATCH exceptionReason without compliance role | 403 |
| V3 | Driver | Driver session verifies own CDL | 403 |
| V4 | Driver | Unassign assignment in foreign fleet | 403 |
| V5 | Driver | Missing clearinghouse/road-test in policy → qual | PENDING_COMPLIANCE; movement BLOCKED |
| V6 | Driver | REJECTED work history / requirement | NOT_QUALIFIED or PENDING; movement BLOCKED |
| EQ-01–10 | Equipment | Per equipment spec §9 | As specified |
| X-01 | Cross-fleet | Assign foreign driver/tractor | 422/403 |
| X-02 | Combined | QUALIFIED + CRITICAL condition thread | BLOCKED equipment |
| X-03 | Combined | NOT_QUALIFIED + AVAILABLE equipment | BLOCKED driver |
| X-04 | Concurrent | Qual downgrade during PICKUP_VERIFY tx | STOP |
| X-05 | Stale | RELEASED then blocking defect; pickup issue | 409 |
| E2E-01 | Happy path | Qual QUALIFIED + clean equipment + pre-trip → release → pickup | 200 |
| E2E-02 | Planning | PLANNING_RESERVE with open condition advisory | Assignment 200; release BLOCKED |

---

## 9. File ownership (no dual modification)

**Rule:** One agent per file per slice. Integration PR merges in order below.

### Claude — exclusive

| File / area |
|-------------|
| `lib/services/authoritativeDriverQualificationService.ts` (new) or Claude-named equivalent |
| `lib/services/qualificationService.ts` (evaluator alignment V5/V6) |
| `lib/services/driverEligibilityReviewService.ts` |
| `lib/services/readinessService.ts` (non-movement; V1) |
| `lib/services/requirementService.ts` (V2) |
| `lib/services/driverMovementInvalidationService.ts` (new) |
| `lib/services/driverDocumentVersioningService.ts` + document verify routes (V3) |
| `app/api/intake/[intakeId]/readiness/route.ts` |
| `app/api/requirements/**` |
| `app/api/dispatch/driver/[driverId]/eligibility/route.ts` |
| `lib/services/dispatchAssignmentService.ts` — **authorization slices only** (`unassign`, planning qual gate hooks) in Claude slice; Cursor must not edit same file until Claude slice merged |

### Cursor — exclusive

| File / area |
|-------------|
| `lib/services/dispatchMovementAuthorizationService.ts` |
| `lib/services/dispatchReleaseService.ts` |
| `lib/services/equipmentSafetyPredicates.ts` |
| `lib/services/equipmentSafetyInvalidationService.ts` |
| `lib/services/equipmentService.ts` |
| `lib/services/preTripService.ts` + `app/api/dispatch/pretrip/**` |
| `lib/services/pickupAuthorizationService.ts` |
| `app/api/dispatch/release/**` |
| `app/api/dispatch/pickup-authorization/**` |
| `app/api/dispatch/equipment/**` |
| `lib/services/dispatchEquipmentSafety.stage0.test.ts`, `stage0.movementAuthorization.integration.test.ts` (equipment + integration shell) |

### Sequential shared (never parallel edits)

| File | Order |
|------|-------|
| `lib/services/dispatchAssignmentService.ts` | Claude (auth + planning gate) → **then** Cursor (equipment advisory only if not in Claude diff) |
| `lib/services/dispatchReleaseService.ts` | Cursor adds `driverQualification` input; **Claude must not edit** |
| `prisma/schema.prisma` | Cursor Stage 0-B only; Claude separate migrations for qual if any |

### Forbidden imports

- Movement graph must **not** import `getDriverDispatchEligibility` (demo JSON).
- Equipment module must **not** import qualification internals beyond movement service injection.

---

## 10. Implementation sequence

### Implementation prerequisites (safe to start now)

| Slice | Owner | Deliverable | Acceptance |
|-------|-------|-------------|------------|
| **I-1** | Claude | `getAuthoritativeDriverQualification` + V5/V6 rules | Unit tests V5, V6 |
| **I-2** | Claude | V1–V3 authorization on readiness/requirement/document routes | Tests V1–V3 |
| **I-3** | Cursor | `evaluateEquipmentSafety` + extended `assembleReleaseInputs` | EQ-01, EQ-04 |
| **I-4** | Cursor | `dispatchMovementAuthorizationService.authorizeMovement` | X-02, X-03 with mocked qual |
| **I-5** | Claude | V4 + planning gate in `createAssignment` via `PLANNING_RESERVE` | V4, EQ-09 |
| **I-6** | Cursor | Wire RELEASE + PICKUP to `authorizeMovement`; pre-trip immutability | EQ-03, EQ-06, E2E-01 |
| **I-7** | Claude | `driverMovementInvalidationService` | X-04 driver path |
| **I-8** | Cursor | `equipmentSafetyInvalidationService` + hooks | EQ-07 |
| **I-9** | Both | Integrated test file green | Full matrix §8 |
| **I-10** | Cursor | Stage 0-B migration + amend route (optional) | EQ-02 amendment |

### Deployment prerequisites (do not enforce in prod until complete)

| ID | Gate |
|----|------|
| D-1 | Compliance backfill B1–B5 complete |
| D-2 | `BOF_STAGE0_QUALIFICATION_ENFORCEMENT=enforce` approved |
| D-3 | Staging E2E-01/E2E-02 on production-like seed |
| D-4 | Preservation smoke if marketing touched (out of Stage 0 core) |
| D-5 | Ops runbook for exception + carrier admin notification |

**Observe mode** may deploy before D-1 for staging telemetry only.

---

## 11. Production impact

| Area | Impact |
|------|--------|
| Movement | Stricter qual + live equipment; stale pickup stops |
| Assignment | Planning may deny PENDING_COMPLIANCE drivers (fail closed) |
| Existing RELEASED rows | Invalidated logically when evidence changes |
| Performance | Extra qual eval + condition queries per pickup/release |
| Rollback | Revert policy constant + movement wiring; qual data remains |

---

## 12. Remaining conflicts — require Claude confirmation

| # | Topic | Cursor position | Question for Claude |
|---|--------|-----------------|---------------------|
| C1 | **`authorizeMovement` name vs `requireMovementAuthorization`** | Use Claude name `authorizeMovement` in integration service | Confirm public export name |
| C2 | **PLANNING_RESERVE + PENDING_COMPLIANCE** | Default **deny** assignment | Confirm or document fleet exception flag |
| C3 | **Carrier admin notification** | Use `FLEET_ADMIN` membership + existing chat/notification | Confirm channel in patch spec |
| C4 | **Clearinghouse / road test** mandatory set | Defined in Claude policy version string | Confirm exact requirement keys in evaluator |
| C5 | **`dispatchAssignmentService.ts` split** | Claude first for V4/planning | Confirm Cursor only adds equipment advisory in follow-up commit |
| C6 | **Stage 0-A without `driverQualificationSnapshotId` on release** | Store in audit JSON until column added | Confirm acceptable audit shape |
| C7 | **Physical reconcile pickup path** | Must call `PICKUP_VERIFY` stage | Confirm all authorize paths in patch spec |

---

## 13. Reference paths

| Item | Path |
|------|------|
| Equipment spec | `BOF-EQUIPMENT-SAFETY-STAGE-0-SPEC.md` |
| Equipment gaps | `BOF-EQUIPMENT-SAFETY-GAP-REPORT.md` |
| Release / assembly | `lib/services/dispatchReleaseService.ts` |
| Assignment | `lib/services/dispatchAssignmentService.ts` |
| Pickup | `lib/services/pickupAuthorizationService.ts` |
| Qualification (today) | `lib/services/qualificationService.ts` |
| Readiness (non-authoritative after Stage 0) | `lib/services/readinessService.ts` |

---

**No application code, branches, merge, push, migrate, or deploy performed.**

**Stop.**
