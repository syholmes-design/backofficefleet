# BOF Equipment Safety — Stage 0 Patch Specification

**Status:** Implementation-ready specification (approved direction; **no code in this deliverable**)  
**Baseline report:** [`BOF-EQUIPMENT-SAFETY-GAP-REPORT.md`](BOF-EQUIPMENT-SAFETY-GAP-REPORT.md)  
**Worktree / commit:** `release/web-004-005-prep` @ `0d0e5fdce31be05901ef7b75c2cb5b2d600c9e2d`  
**Date:** 2026-10-20  
**Policy target:** Bump `DISPATCH_RELEASE_POLICY_VERSION` to `bof-equipment-safety-stage0-v1` (keep `evaluateRelease` / `assembleReleaseInputs` as the public evaluation spine).

---

## 1. Owner requirements traceability

| # | Requirement | Stage 0 design response |
|---|-------------|-------------------------|
| 1 | Preserve `evaluateRelease` / `assembleReleaseInputs` as authoritative foundation | Extend **inputs and internal helpers** only; public function names and route contracts remain. |
| 2 | No new equipment-readiness store or competing evaluator | All gates derive from Prisma rows + in-memory evaluation; no `EquipmentReadinessScore` table. |
| 3 | Planning vs physical movement | **Planning:** `createAssignment` remains allowed with advisory warnings. **Movement:** release + pickup + pickup verify require passing **combined** authorization gate. |
| 4 | ConditionThreads + blocking pre-trip defects in authoritative eval | Added to `DispatchReleaseInputs`; drive new reason codes in `evaluateRelease`. |
| 5 | Consistent disqualifying equipment statuses | `OUT_OF_SERVICE` and `UNAVAILABLE` block **movement**; `OUT_OF_SERVICE` also blocks **planning assignment** (existing + unchanged). |
| 6 | Completed pre-trip immutability + amendments | Block silent edits on `COMPLETED`; new amendment flow + release invalidation. |
| 7 | Pickup re-evaluates current safety | `issuePickupAuthorization` and `verifyPickupCredential` call live evaluation, not stored `RELEASED` alone. |
| 8 | Post-release unsafe → flag movement, notify Dispatch/Safety, documented workflow | `invalidateMovementAuthorizationForSafetyRegression` + `OperatingException` + `SambaFinding` + corrective actions. |
| 9 | No auto-abandon shipments / silent defect clear | Invalidation **holds/stops pickup**; does not `unassign`, `CANCELLED` load, or delete defects without authorized paths. |
| 10 | Coordinate with Claude Stage 0 driver eligibility | New `lib/services/dispatchMovementAuthorizationService.ts` composes **driver** + **equipment** evaluators at movement gates only. |
| 11 | Inventory equipment-related write endpoints | Section 8 — each gets explicit hardening notes. |
| 12 | Regression tests per bypass | Section 10 — one test module + updates to foundation script. |

---

## 2. Lifecycle model (planning vs movement)

```text
PLANNING (reservation)
  POST /api/dispatch/assignment
    → Driver: READY | CONDITIONAL (existing)
    → Equipment: not OUT_OF_SERVICE; open safety-critical conditions → 409 advisory optional / audit WARN (not block)
    → Does NOT require completed pre-trip or clear condition threads

MOVEMENT AUTHORIZATION (operate / pickup)
  POST /api/dispatch/release/[loadId]
  POST /api/dispatch/pickup-authorization
  POST /api/dispatch/pickup-authorization/[id]/verify
    → Combined gate: driver readiness + equipment safety (extended evaluateRelease)
    → Must fail closed on BLOCKING pre-trip defects, safety-critical open threads, UNAVAILABLE | OUT_OF_SERVICE
```

**UI follow-up (non-blocking for Stage 0 backend):** Dispatch board should label loads with ACTIVE assignment but failed movement gate as **“Assigned — not cleared to move”** using existing release/history APIs.

---

## 3. Authoritative models (unchanged tables, extended usage)

| Model | Role in Stage 0 |
|-------|------------------|
| `Equipment` | `status`: `AVAILABLE` \| `UNAVAILABLE` \| `OUT_OF_SERVICE` |
| `DispatchAssignment` | Planning reservation; unchanged uniqueness rules |
| `PreTripHeader` / `PreTripItem` / `PreTripDefect` | Inspection evidence; defects with `BLOCKING` \| `WARNING` |
| `ConditionThread` / `ConditionEvent` / `OperationalEvidence` | Durable equipment safety; open threads queried at assembly time |
| `DriverReadinessScore` | **Driver-only** authority (Claude Stage 0); unchanged ownership |
| `DispatchRelease` | Append-only evaluation record; invalidated logically via supersession + fresh eval |
| `PickupAuthorization` | Movement credential; cancelled on safety regression |
| `OperatingException` / `OperatingCorrectiveAction` | Safe-resolution workflow container |
| `SambaFinding` | Dispatch/Safety notification surface (existing types) |
| `AuditEvent` | All invalidations, amendments, gate denials |

### Safety-critical condition predicate (single definition)

Add **`lib/services/equipmentSafetyPredicates.ts`** (pure functions, no DB):

```typescript
// Pseudotype — implement against Prisma enums
function isSafetyCriticalOpenCondition(thread: {
  lifecycleState: ConditionLifecycleState;
  severity: ConditionSeverity;
  impact: ConditionImpact | null;
}): boolean {
  if (thread.lifecycleState === "RESOLVED") return false;
  if (thread.severity === "BLOCKING" || thread.severity === "CRITICAL") return true;
  if (
    thread.impact === "SAFETY_RISK" ||
    thread.impact === "REGULATORY_RISK"
  ) return true;
  return false;
}
```

Open threads: `lifecycleState !== RESOLVED` (same query shape as `getCurrentConditionsForEquipment` today).

---

## 4. Core service changes (exact files)

### 4.1 `lib/services/dispatchReleaseService.ts` — **KEEP + EXTEND (authoritative)**

**Extend types:**

```typescript
export type DispatchReleaseInputs = {
  // ... existing fields ...
  openTractorConditions: ConditionThread[];  // full rows or minimal select
  openTrailerConditions: ConditionThread[];
};
```

**New internal helpers (same file):**

| Function | Purpose |
|----------|---------|
| `loadOpenSafetyCriticalConditions(equipmentIds: string[])` | Prisma query; used by `assembleReleaseInputs` |
| `evaluateEquipmentSafety(inputs: Pick<DispatchReleaseInputs, "tractor" \| "trailer" \| "preTrip" \| "openTractorConditions" \| "openTrailerConditions">)` | Returns `{ blocked: boolean; hold: boolean; reasonCodes: DispatchReleaseReasonCode[] }` |
| `assertMovementAuthorizationAllowed(evaluation: DispatchReleaseEvaluation)` | Throws 409 with stable message if disposition ∉ `{ RELEASED, CONDITIONALLY_RELEASED }` |

**Modify `assembleReleaseInputs`:**

- After resolving assignment equipment, call `loadOpenSafetyCriticalConditions([tractorId, trailerId?])`.
- Split results into tractor vs trailer arrays on inputs.

**Modify `evaluateRelease`:**

- Delegate equipment rules to `evaluateEquipmentSafety`.
- Add reason codes (extend union):
  - `SAFETY_CRITICAL_CONDITION` (blocking)
  - `SAFETY_CONDITION_HOLD` (non-blocking open CRITICAL/MODERATE with SAFETY_RISK — optional HOLD only if product wants parity with WARNING defects)
  - Wire existing unused `SAFETY_BLOCK` for combined equipment failure summary **or** deprecate in favor of explicit codes above (prefer explicit; leave `SAFETY_BLOCK` unused in Stage 0).
- Include condition thread IDs in audit `details` JSON on `writeDispatchRelease` (not a new table).

**Equipment status rules (movement):**

| Status | Movement |
|--------|----------|
| `OUT_OF_SERVICE` | `TRUCK_OUT_OF_SERVICE` → BLOCKED |
| `UNAVAILABLE` | `TRUCK_UNAVAILABLE` → BLOCKED |
| `AVAILABLE` | Pass equipment status slice |

**Pre-trip rules (unchanged semantics, stricter assembly):**

- `getActiveBlockingDefects` / `getActiveWarningDefects` unchanged.
- If `preTrip.status === COMPLETED` but `updatedAt` > linked release `evaluatedAt`, treat as **superseded evidence** → `PRETRIP_SUPERSEDED` (new reason) → BLOCKED until re-release after amendment workflow.

**Policy version:** `export const DISPATCH_RELEASE_POLICY_VERSION = "bof-equipment-safety-stage0-v1"`.

---

### 4.2 `lib/services/dispatchMovementAuthorizationService.ts` — **NEW (composition only)**

Single entry for **movement gates** (req 10):

```typescript
export async function evaluateMovementAuthorizationForLoad(
  sessionUser: SessionUserLike,
  loadId: string,
): Promise<{
  inputs: DispatchReleaseInputs;
  evaluation: DispatchReleaseEvaluation;
  driverReadinessId: string;
}> {
  const inputs = await assembleReleaseInputs(sessionUser, loadId);
  const evaluation = evaluateRelease(inputs);
  return { inputs, evaluation, driverReadinessId: inputs.readiness.id };
}

export async function requireMovementAuthorization(
  sessionUser: SessionUserLike,
  loadId: string,
): Promise<DispatchReleaseEvaluation> {
  const { evaluation } = await evaluateMovementAuthorizationForLoad(sessionUser, loadId);
  assertMovementAuthorizationAllowed(evaluation);
  return evaluation;
}
```

**Claude Stage 0 integration:** Driver side remains **`assembleReleaseInputs` → `inputs.readiness`** and **`driverEligibilityReviewService` / `readinessService`**. This module **must not** import `getDriverDispatchEligibility` (demo JSON). Optional shared constant file:

- `lib/services/dispatchGateReasonCodes.ts` — re-export driver + equipment reason code unions for UI.

**Conflict avoidance:**

| Claude touches | Equipment Stage 0 touches |
|----------------|---------------------------|
| `driverEligibilityReviewService.ts`, `readinessService.ts`, `POST .../driver/[driverId]/eligibility` | `dispatchReleaseService.ts`, `dispatchMovementAuthorizationService.ts`, pickup/pre-trip/condition hooks |
| `createAssignment` driver readiness lock | **No change** to driver lock order |
| Shared | `createAssignment` unchanged for driver; equipment planning advisory only |

---

### 4.3 `lib/services/dispatchAssignmentService.ts` — **IMPROVE (planning only)**

**Keep** existing driver readiness and `OUT_OF_SERVICE` checks.

**Add (planning advisory, not movement block):**

- After equipment load, query open safety-critical conditions on tractor/trailer.
- If any: `createAuditRecord` with `action: "ACCESS_DENIED"` → rename to **`WARNING`** event e.g. `dispatch.assignment.equipment_safety_advisory` (new audit action or details.event) — **do not throw** (req 3).
- Optional response header or JSON field on assignment create (if API extended): `equipmentSafetyAdvisories: string[]` — **breaking-change optional**; Stage 0 can be audit-only.

**Do not** block assignment on open conditions or pre-trip defects (unless `OUT_OF_SERVICE`).

**Enforce:** Reject `UNAVAILABLE` at planning **only if owner chooses strict planning** — spec default: **allow assign**, block at movement (req 3). Document in release notes.

---

### 4.4 `lib/services/pickupAuthorizationService.ts` — **IMPROVE (req 7)**

**`issuePickupAuthorization`:**

1. Existing checks (assignment, readiness row exists, not NOT_READY).
2. **Replace** stale release lookup with:
   - `const { evaluation, driverReadinessId } = await evaluateMovementAuthorizationForLoad(...)`
   - `assertMovementAuthorizationAllowed(evaluation)`
   - `writeDispatchRelease(...)` **or** require caller to have fresh release within TTL — **Stage 0:** always **re-evaluate + write** a new `DispatchRelease` row on pickup issue (append-only audit trail).
3. Store `dispatchReleaseId` on created authorization from **this** evaluation.

**`verifyPickupCredential` (and physical reconcile if it authorizes movement):**

- After assignment drift checks (~687–717), **re-run** `requireMovementAuthorization` for the load.
- On failure: `reject("STOPPED", ...)` with reason `EQUIPMENT_SAFETY_SUPERSEDED` / `RELEASE_SUPERSEDED` — do not silently authorize.

---

### 4.5 `lib/services/preTripService.ts` — **IMPROVE (req 6)**

**`updatePreTripItem`:**

- If `header.status === "COMPLETED"`: throw **422** `COMPLETED_PRETRIP_IMMUTABLE` — direct mutation forbidden.
- If `header.status === "OPEN" | "BLOCKED"`: existing behavior; on introducing `BLOCKING` defect, call `invalidateMovementAuthorizationForSafetyRegression` (§4.7).

**`syncHeaderStatus`:**

- Remove early return that skips updates when `COMPLETED` (only applies to non-completed headers).

**New exports:**

| Function | Behavior |
|----------|----------|
| `amendCompletedPreTrip(sessionUser, preTripHeaderId, reason, changes[])` | Validates operator role; creates amendment record; see §5 schema |
| `snapshotPreTripHeader(tx, headerId)` | JSON snapshot for amendment |

**Defect clearing:**

- On `OPEN`/`BLOCKED` headers only: changing item to `PASS` still deletes defects (existing).
- For **blocking** defect clearance on equipment items (`tire-check`, etc.), Stage 0 **optional tighten:** require linked `ConditionThread` resolution if thread was created from pre-trip — Phase 1; Stage 0 document as **IMPROVE** follow-up in `preTripConditionWorkflowService`.

---

### 4.6 `lib/services/equipmentService.ts` — **IMPROVE (req 5, 11)**

**`setEquipmentStatus`:**

- If transitioning **to** `AVAILABLE` from `OUT_OF_SERVICE` or `UNAVAILABLE`:
  - Query open safety-critical conditions on equipment.
  - If any: **422** `EQUIPMENT_CONDITIONS_BLOCK_AVAILABILITY` (do not silently clear safety).
- If transitioning **to** `UNAVAILABLE` or `OUT_OF_SERVICE`:
  - Find ACTIVE assignments using equipment as tractor/trailer.
  - For each affected load: `invalidateMovementAuthorizationForSafetyRegression` (§4.7).
- Audit all status changes (existing + enriched details).

---

### 4.7 `lib/services/equipmentSafetyInvalidationService.ts` — **NEW (req 8, 9)**

```typescript
export async function invalidateMovementAuthorizationForSafetyRegression(
  sessionUser: SessionUserLike | null,
  context: {
    fleetId: string;
    loadId: string;
    assignmentId: string;
    trigger: "PRETRIP_DEFECT" | "CONDITION_THREAD" | "EQUIPMENT_STATUS" | "PRETRIP_AMENDMENT";
    entityType: string;
    entityId: string;
    summary: string;
  },
): Promise<void>
```

**Transactional steps (same order every time):**

1. **Re-evaluate** via `evaluateMovementAuthorizationForLoad` (system actor if `sessionUser` null).
2. **Append** `DispatchRelease` with resulting disposition (typically `BLOCKED` / `HOLD`).
3. **Cancel** active pickup authorizations for load (`PENDING` / `AUTHORIZED`) with reason `EQUIPMENT_SAFETY_SUPERSEDED` — **not** `RELEASED` / in-transit loads without pickup credential stay assigned.
4. **`openOperatingException`** (`lib/process-intelligence/operating-event-service.ts`):
   - `exceptionType`: `EQUIPMENT_SAFETY_MOVEMENT_HOLD`
   - `processStage`: `DISPATCH`
   - `ownerTeam`: `DISPATCH`
   - `severity`: `HIGH`
   - `consequence`: human-readable summary
5. **`assignCorrectiveAction`** second action with `assignedOwnerTeam`: `SAFETY` (or `BOF_COMPLIANCE_REVIEW` if SAFETY team enum unavailable).
6. **`prisma.sambaFinding.create`** (pattern from `sambaIntelligenceService.ts`):
   - `findingType`: `EQUIPMENT_CONDITION_PICKUP_RELATED` or `EQUIPMENT_UNAVAILABLE`
   - Link `entityId` to load or equipment
7. **`createAuditRecord`**: `dispatch.movement_authorization.invalidated`

**Explicit non-actions:** no `unassign`, no load status → `CANCELLED`, no defect delete, no automatic `RESOLVED` on condition threads.

---

### 4.8 `lib/services/conditionService.ts` + `preTripConditionWorkflowService.ts`

After **`createCondition`**, **`reopenCondition`**, and **`persistConditionEvent`** that creates IDENTIFIED/REOPENED with safety-critical severity/impact:

- Resolve active assignment for equipment (if any) via `dispatchAssignment.findFirst({ tractorEquipmentId | trailerEquipmentId, status: ACTIVE })`.
- If load has `DispatchRelease` with `RELEASED | CONDITIONALLY_RELEASED` **or** active pickup auth: call invalidation service.

**`verifyResolution`:** unchanged — remains authorized path to close durable conditions.

---

### 4.9 Routes (thin wrappers only)

| Route | Change |
|-------|--------|
| `app/api/dispatch/release/[loadId]/route.ts` | No signature change; benefits from extended eval |
| `app/api/dispatch/pickup-authorization/route.ts` | Uses updated service |
| `app/api/dispatch/pickup-authorization/[authorizationId]/verify/route.ts` | Re-eval on verify |
| `app/api/dispatch/pretrip/[id]/item/route.ts` | 422 on completed edit |
| `app/api/dispatch/pretrip/[id]/complete/route.ts` | unchanged |
| **NEW** `app/api/dispatch/pretrip/[id]/amend/route.ts` | POST → `amendCompletedPreTrip` |
| `app/api/dispatch/equipment/[equipmentId]/status/route.ts` | inherits service guards |
| `app/api/dispatch/assignment/route.ts` | optional advisory in response |

---

### 4.10 Demo / Copilot (no second evaluator)

| File | Stage 0 |
|------|---------|
| `lib/canonical-equipment-spine.ts` | **RECOVER display only:** map LIVE API movement gate result to copilot labels; **do not** evaluate policy separately for LIVE |
| `lib/maintenance-data.ts` | Keep `equipmentConflictsWithCanonicalAssignment` for DEMO; add comment pointing to LIVE movement gate |

---

## 5. Schema migration (minimal, Stage 0)

**File:** `prisma/schema.prisma`

| Change | Rationale |
|--------|-----------|
| `enum PreTripStatus` add `SUPERSEDED` | Original completed inspection preserved when amended |
| `PreTripHeader.supersedesHeaderId String?` + self-relation | Amendment chain |
| `PreTripHeader.amendmentReason String?` | Documented amendment |
| `PreTripAmendment` model (optional if header self-link sufficient) | **Recommended:** `id`, `fleetId`, `assignmentId`, `supersededHeaderId`, `replacementHeaderId`, `reason`, `createdByUserId`, `snapshotJson`, `createdAt` |
| `DispatchRelease.supersededAt DateTime?` + `supersededByReleaseId String?` | Logical invalidation without delete |
| `PickupAuthorization.supersededReason String?` | Audit trail for safety cancel |

**Migration name:** `YYYYMMDDHHMMSS_equipment_safety_stage0_pretrip_amendment_release_supersession`

No equipment readiness table.

---

## 6. Combined dispatch authorization gate (driver + equipment)

```text
evaluateRelease(inputs)  // authoritative
  ├─ Driver slice: inputs.readiness.status (NOT_READY → block)
  ├─ Equipment slice: evaluateEquipmentSafety(...)
  │     ├─ tractor/trailer Equipment.status
  │     ├─ preTrip defects (BLOCKING / WARNING)
  │     └─ open safety-critical ConditionThreads
  └─ Disposition: RELEASED | CONDITIONALLY_RELEASED | HOLD | BLOCKED

requireMovementAuthorization(loadId)
  └─ throws 409 if disposition not in { RELEASED, CONDITIONALLY_RELEASED }
```

**Claude Stage 0 driver work** continues to own:

- `POST /api/dispatch/driver/[driverId]/eligibility`
- `readinessService.writeReadinessScore` / qualification snapshots
- `createAssignment` driver gate (`READY` | `CONDITIONAL`)

**Handoff contract:** Any Claude PR that adds driver checks to **pickup** must call **`requireMovementAuthorization`** rather than duplicating driver SQL.

---

## 7. Pre-trip amendment workflow (req 6)

```text
1. Operator POST /api/dispatch/pretrip/{completedHeaderId}/amend
   Body: { reason, itemUpdates: [{ itemCode, status, notes }] }
2. Service validates DISPATCH | FLEET_MANAGER | BOF_OPERATIONS role
3. Transaction:
   a. snapshotJson ← current header + items + defects
   b. Mark old header status SUPERSEDED
   c. Create new OPEN PreTripHeader (same assignmentId, supersedesHeaderId)
   d. Apply itemUpdates only to new header
   e. invalidateMovementAuthorizationForSafetyRegression(... PRETRIP_AMENDMENT ...)
4. Operator must complete new pre-trip + POST release before pickup
```

**Authorization to amend:** roles in `OPERATOR_ROLE_CODES` from `preTripConditionWorkflowService.ts` **plus** explicit `SAFETY` if present in RBAC.

---

## 8. Equipment-related write endpoints (inventory + hardening)

| Method | Path | Service | Safety impact | Stage 0 hardening |
|--------|------|---------|---------------|-------------------|
| POST | `/api/dispatch/assignment` | `createAssignment` | Reserves equipment | Advisory audit on open conditions; keep OOS block |
| POST | `/api/dispatch/assignment/[id]/unassign` | `unassign` | Ends reservation | No auto-clear defects |
| PATCH | `/api/dispatch/equipment/[id]/status` | `setEquipmentStatus` | OOS/availability | Block AVAILABLE if open critical conditions; invalidate on downgrade |
| POST | `/api/dispatch/pretrip/[id]/start` | `startPreTrip` | Starts inspection | No change |
| PATCH | `/api/dispatch/pretrip/[id]/item` | `updatePreTripItem` | Creates/clears defects | Block COMPLETED; invalidate on new BLOCKING |
| POST | `/api/dispatch/pretrip/[id]/complete` | `completePreTrip` | Seals inspection | Existing blocking check kept |
| POST | `/api/dispatch/pretrip/[id]/amend` | **new** | Amends completed | Full workflow §7 |
| POST | `/api/dispatch/release/[loadId]` | `writeDispatchRelease` | Movement gate | Extended eval |
| POST | `/api/dispatch/pickup-authorization` | `issuePickupAuthorization` | Pickup gate | Live re-eval |
| POST | `/api/dispatch/pickup-authorization/[id]/verify` | verify flow | Physical auth | Live re-eval |
| POST | `/api/dispatch/pickup-authorization/[id]/physical-reconcile` | reconciliation | May STOP | Re-eval if disposition RELEASE |
| POST | `/api/dispatch/pickup-authorization/[id]/cancel` | cancel | Revokes credential | No change |
| GET/POST | `/api/dispatch/assignment/[id]/conditions` | condition workflow | Creates/updates threads | Hook invalidation |
| POST | `/api/dispatch/assignment/[id]/conditions/evidence` | attach evidence | Supports resolution | No bypass of verify |
| POST | `/api/dispatch/driver/[driverId]/eligibility` | driver review | Driver readiness only | **Claude** — stay separate |
| POST | `/api/dispatch/load` / PATCH load | load CRUD | Indirect | Out of scope unless load status implies movement |

**Internal / script writers (non-HTTP):**

- `scripts/test-condition-evidence-foundation.ts` — update expectations
- `scripts/seed-mobile-pretrip-fixture.ts` — seed only

---

## 9. Regression tests (req 12)

**New file:** `lib/services/dispatchEquipmentSafety.stage0.test.ts`  
**Pattern:** `assertTestDatabaseTarget`, isolated fleet stamp (mirror `dispatchAssignment.safety.test.ts`).

| Test ID | Bypass from gap report | Steps | Expected after patch |
|---------|-------------------------|-------|----------------------|
| EQ-01 | Open condition + release | Assign → pre-trip complete → open `ConditionThread` CRITICAL → `evaluateRelease` | `BLOCKED`, reason `SAFETY_CRITICAL_CONDITION` |
| EQ-02 | Stale pickup after post-complete FAIL | Release RELEASED → amend or block: **cannot** `updatePreTripItem` on COMPLETED; amend flow → invalidation | Pickup issue 409 |
| EQ-03 | Stale pickup defect on OPEN trip | Release → `updatePreTripItem` FAIL tire on OPEN header → issue pickup | 409 until re-release |
| EQ-04 | UNAVAILABLE at pickup | Assign with UNAVAILABLE tractor → `requireMovementAuthorization` | 409 `TRUCK_UNAVAILABLE` |
| EQ-05 | OOS assignment | `OUT_OF_SERVICE` tractor → `createAssignment` | 422 (unchanged) |
| EQ-06 | Verify re-eval | RELEASED → add BLOCKING defect → `verifyPickupCredential` | STOPPED / 409 |
| EQ-07 | Equipment status downgrade | RELEASED → PATCH equipment UNAVAILABLE → issue pickup | 409 + exception row |
| EQ-08 | Defect clear without verify | OPEN pre-trip PASS after FAIL | Allowed only on non-completed header; release re-eval |
| EQ-09 | Planning assign with condition | Open critical thread → `createAssignment` | 200 + audit advisory |
| EQ-10 | Driver + equipment combined | NOT_READY driver + clean equipment → movement gate | 409 driver reason first |

**Update:** `scripts/test-condition-evidence-foundation.ts` (~1074–1084): change assertion from `RELEASED` with open condition to **`BLOCKED`** (or HOLD if policy classifies thread as hold-only).

**Boundary test:** `lib/services/driverEligibilitySambaBoundary.test.ts` pattern — add `dispatchEquipmentSafety.boundary.test.ts` ensuring `dispatchAssignmentService` does **not** import Samba write paths.

**Run command (CI):** `node --import tsx --test lib/services/dispatchEquipmentSafety.stage0.test.ts`

---

## 10. Production-impact considerations

| Area | Impact |
|------|--------|
| **Behavior** | Loads previously pickup-eligible with stale `RELEASED` will **fail** until re-inspection/release — intended safety correction |
| **Policy version** | New releases tagged `bof-equipment-safety-stage0-v1`; historical rows remain valid audit |
| **Performance** | Pickup issue adds one release write + condition queries (2 equipment IDs max) — acceptable |
| **Database** | Migration adds amendment/supersession columns; backward compatible |
| **Samba / exceptions** | More findings for dispatch dashboards; ensure notification routing reviewed with ops |
| **DEMO Command Center** | Unchanged LIVE path; DEMO T-102 assignment still C2 — not Stage 0 scope |
| **ePOD / delivery** | Out of scope unless delivery APIs skip movement gate — audit separately |
| **Rollback** | Revert policy version constant + pickup re-eval; amendment table nullable columns safe |

**Pre-deploy verification (charter):**

- Authenticated E2E: assign → inspect → release → pickup happy path
- Negative: EQ-02, EQ-06 on staging with `DATABASE_URL`
- Confirm no new table for equipment readiness

---

## 11. Implementation sequence (recommended PR slices)

1. **Slice A — Evaluation core:** predicates, extend `assembleReleaseInputs` / `evaluateRelease`, policy version, unit tests EQ-01, EQ-04, EQ-05.
2. **Slice B — Movement gates:** `dispatchMovementAuthorizationService`, pickup issue + verify, tests EQ-02, EQ-03, EQ-06.
3. **Slice C — Invalidation + notifications:** `equipmentSafetyInvalidationService`, hooks in condition + equipment status + pre-trip, tests EQ-07.
4. **Slice D — Pre-trip immutability + amendment:** schema migration, `amend` route, tests EQ-02 amendment path.
5. **Slice E — Foundation script + docs:** update condition foundation script; cross-link Claude Stage 0 PR checklist.

**Estimated files touched:** ~15 implementation files + 1 migration + 2 test files.

---

## 12. Out of scope (Stage 0)

- New equipment readiness score or maintenance work-order Prisma module
- Auto-unassign or auto-cancel loads
- DEMO JSON canonical assignment fixes (GAP-009-008)
- Requiring condition verify to clear every pre-trip PASS on tire-check (documented Phase 1)
- UI copy / dispatch board badges (backend-first)
- Production deploy / merge / push (explicitly excluded by owner)

---

## 13. Claude Stage 0 coordination checklist

- [ ] Agree on shared module name: `dispatchMovementAuthorizationService.ts`
- [ ] Driver eligibility PR avoids pickup/release duplication — imports `requireMovementAuthorization`
- [ ] No imports of `getDriverDispatchEligibility` from equipment safety modules
- [ ] Combined 409 error messages: prefix driver vs equipment (`DISPATCH AUTHORIZATION BLOCKED — …`)
- [ ] Single policy version string in release records for certification scripts

---

**End of Stage 0 specification.** No branches, code, migrations, or deploy performed for this deliverable.
