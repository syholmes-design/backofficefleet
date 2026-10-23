# Stage 0 D-2 — Enforcement / observe-mode policy (design)

**Document type:** Design-only policy specification. **No application code, database, or deployment changes** are authorized by this document.

**Reference baselines**

| Baseline | Branch / commit | Role |
| --- | --- | --- |
| Certified Stage 0 implementation | `cursor/stage0-i9r-remediation` @ `53acec36cf7a74c2f5cbfb16f644ccc7a27b0d32` | Authoritative **current enforcement behavior** described below |
| Production-readiness assessment | `docs/stage0-production-readiness-assessment` @ `3e298efbb1d57af26c52a65ac10f79e3209a8327` | D-2 gap and recommended direction |

**Related architecture:** `docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md` (server-side enforcement, production verification).

---

## 1. Purpose and scope

D-2 adds a **deployment-controlled enforcement mode** so BOF can:

1. **Shadow-evaluate** movement policy (same evaluators, locks, and inputs as today) and record what **would** be denied.
2. **Optionally permit** the mutating workflow to proceed in **OBSERVE** mode when policy would deny—but only for **non–hard-block** reasons and never by dispatcher action.
3. **Enforce** denials in **ENFORCE** mode (behavior equivalent to certified `53acec36`).

**In scope:** Controls that flow through **`authorizeMovement`** and its evaluators (`getAuthoritativeDriverQualification`, `evaluatePlanningEquipmentSafety`, `evaluateEquipmentSafety`, `evaluateReleaseWithDriverQualification`), plus **assignment-local pre-checks** that duplicate equipment OOS rules before `PLANNING_RESERVE`.

**Explicitly out of scope for OBSERVE bypass:** Tenant isolation, authentication, dispatch **role** gates, equipment **status mutation** role matrix (I-9R), pickup **identity/token** reconciliation STOP paths, and **post-authorization invalidation** (I-7/I-8). Those remain **always enforced**.

**Non-goals:** Unrestricted “turn off safety,” per-dispatcher toggles, or bypassing `authorizeMovement` evaluators. Samba “observe” of STOP records remains unrelated (`lib/services/samba/sambaIntelligenceService.ts`).

---

## 2. Core concepts

### 2.1 Shadow evaluation vs movement authorization

| Term | Meaning |
| --- | --- |
| **Shadow evaluation** | Run the full Stage 0 evaluation pipeline (locks → qualification → equipment/pre-trip/conditions → compose result). Produce `MovementAuthorizationResult` with `allowed`, `disposition`, `reasonCodes`, `policyVersion`, snapshots. **Always runs** in both OBSERVE and ENFORCE. |
| **Movement authorization (effective)** | The **decision applied to the mutating workflow**: whether the caller’s transaction may create assignment, append release, issue pickup, verify/release pickup, etc. In ENFORCE, effective `allowed` === shadow `allowed`. In OBSERVE, effective may be `true` when shadow is `false` only for **soft-policy** rows in the matrix (§4). |
| **Hard safety block** | A denial that **must** apply in both OBSERVE and ENFORCE. Effective `allowed` is always `false`. |

Every effective permit in OBSERVE when shadow denied must be labeled **`ENFORCEMENT_OVERRIDDEN`** (or equivalent) on persisted records and in audit metadata so production data never implies the driver/equipment passed policy when they did not.

### 2.2 Enforcement modes (proposed)

| Mode | Intended use |
| --- | --- |
| **ENFORCE** | Production and final staging sign-off. Denials block mutations. Matches `53acec36`. |
| **OBSERVE** | Preview/staging/pilot: record shadow denials, optional BOF notification, allow selected soft denials to proceed. |

**Configuration layers (proposed, not implemented):**

- **Platform default:** environment variable e.g. `BOF_STAGE0_MOVEMENT_ENFORCEMENT=OBSERVE|ENFORCE`.
- **Optional fleet override:** persisted setting scoped to `fleetId` (for pilot carriers only).
- **Precedence:** fleet override → platform default → **fail-safe default** (§7.1).

Dispatchers and drivers **cannot** read or write enforcement configuration.

---

## 3. Policy authority (who may change enforcement mode)

| Actor | Read mode | Change mode | Notes |
| --- | --- | --- | --- |
| **BOF_OPERATIONS** | Yes (platform + fleets) | Yes (platform default; fleet pilot override) | Primary operator for outsourced BOF |
| **BOF_COMPLIANCE_REVIEW** | Yes | Yes (with BOF Operations policy) | Compliance oversight |
| **FLEET_ADMIN** (carrier) | Yes (own fleet only) | **No** — read-only visibility of fleet pilot status | Prevents carrier from disabling enforcement |
| **DISPATCH**, **FLEET_OPERATIONS**, **FLEET_MANAGER** | Optional read-only banner in UI | **No** | Cannot disable safety |
| **DRIVER** | No | No | — |

Changes require:

- Authenticated session with DB-backed role (not session claim alone).
- Audit event: `stage0.enforcement_mode_changed` with `{ previousMode, newMode, scope: "platform"|"fleet", fleetId?, actorId, reason }`.
- BOF operator notification (§5) for platform ENFORCE enablement and any fleet override.

---

## 4. Enforcement policy matrix

Legend:

- **Existing (53acec36):** ENFORCE only; no mode flag.
- **Observe:** shadow denies → effective may allow if not **Hard both**.
- **Hard both:** must deny in OBSERVE and ENFORCE.

### 4.1 Driver qualification (authoritative I-1)

Evaluator: `getAuthoritativeDriverQualification` inside `authorizeMovement` (`dispatchMovementAuthorizationService.ts`). Planning driver blocks: `planningDriverBlocks` (`NOT_QUALIFIED`, `PENDING_COMPLIANCE`, conditional without permission).

| Control ID | Condition / reason (representative) | Stage(s) | Existing enforcement | Observe-mode (proposed) | Enforce-mode (proposed) | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DQ-01 | `NOT_QUALIFIED` (expired/rejected evidence) | PLANNING, RELEASE, PICKUP_* | Deny; assignment 409; release/pickup blocked | Shadow deny; **effective deny** (recommended) or soft allow with override flag (§7.2) | Deny | **Recommended: Yes** | `composePlanningAuthorization`, `composeMovementAuthorization`, `dispatchAssignmentService.ts` L242–258 |
| DQ-02 | `PENDING_COMPLIANCE` (missing/unverified/not compliance-verified) | All movement stages | Deny | Shadow deny; **effective allow with ENFORCEMENT_OVERRIDDEN** (pilot/backfill) | Deny | **No** (pilot soft) — **Decision §7.2** | Same |
| DQ-03 | `CONDITIONAL` without `conditionalMovementPermitted` | All movement stages | Deny | Shadow deny; effective deny (recommended) | Deny | **Recommended: Yes** | `planningDriverBlocks`, release evaluation |
| DQ-04 | `CONDITIONAL` with movement permitted | RELEASE, PICKUP_* | `CONDITIONALLY_RELEASED` allowed | Same shadow; effective allow if shadow allows | Same as today | Yes (when shadow denies) | `movementAllowedForReleaseDisposition` |
| DQ-05 | `QUALIFICATION_EVALUATION_FAILED` (evaluator error / fail-closed) | All stages | `allowed: false`, disposition BLOCKED/PLANNING_DENIED | Shadow deny; **effective deny always** | Deny | **Yes** | `qualificationEvaluationFailedResult` |
| DQ-06 | Qualification evidence change invalidation | N/A (reactive) | I-7 cancel/hold/escalate via re-evaluation | **Always enforce** invalidation (not observe-gated) | Same | **Yes** | `driverMovementInvalidationService.ts`, locked document paths per I-2 |

**Dependencies:** D-1 backfill (`STAGE0-PRODUCTION-READINESS-ASSESSMENT.md`); I-2 document-lock completeness for concurrent evidence writes.

---

### 4.2 Equipment safety (status, pre-trip, defects)

Evaluators: `evaluatePlanningEquipmentSafety` (planning: **OOS only**); `evaluateEquipmentSafety` (release/pickup: OOS, UNAVAILABLE, pre-trip, defects, critical conditions) via `evaluateReleaseWithDriverQualification` (`dispatchReleaseService.ts`).

| Control ID | Condition | Stage(s) | Existing enforcement | Observe-mode | Enforce-mode | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EQ-01 | Tractor/trailer `OUT_OF_SERVICE` | PLANNING | Deny (`TRUCK_OUT_OF_SERVICE`) | Shadow deny; **effective deny** | Deny | **Yes** | `evaluatePlanningEquipmentSafety`; also assignment pre-check L219–237 |
| EQ-02 | Tractor/trailer `OUT_OF_SERVICE` | RELEASE, PICKUP_* | Blocked release disposition | Shadow deny; effective deny | Deny | **Yes** | `evaluateEquipmentSafety` |
| EQ-03 | Tractor/trailer `UNAVAILABLE` (not OOS) | PLANNING | **Allowed** (planning) | No shadow deny | Allow | N/A | `evaluatePlanningEquipmentSafety` |
| EQ-04 | Tractor/trailer `UNAVAILABLE` | RELEASE, PICKUP_* | Blocked (`TRUCK_UNAVAILABLE`) | Shadow deny; soft allow possible (§7.3) | Deny | **No** — **Decision §7.3** | `evaluateEquipmentSafety` |
| EQ-05 | Pre-trip missing / not COMPLETED (no blocking defect) | RELEASE, PICKUP_* | `PRETRIP_INCOMPLETE` block | Shadow deny; soft allow for staging rehearsal | Deny | **No** | `evaluateEquipmentSafety` |
| EQ-06 | Blocking pre-trip defect | RELEASE, PICKUP_* | `PRETRIP_DEFECT` block | Shadow deny; **effective deny** | Deny | **Yes** | Same |
| EQ-07 | Warning pre-trip only | RELEASE, PICKUP_* | HOLD / conditional release path | Shadow records HOLD; effective per release rules | Same as today | Partial | `evaluateEquipmentSafety` hold branch |
| EQ-08 | Equipment status mutation (restore/downgrade) | Admin API | DB role matrix; DISPATCH cannot restore (I-9R) | **Always enforce** (not movement mode) | Same | **Yes** | `equipmentService.ts` `setEquipmentStatus` |
| EQ-09 | Equipment safety invalidation (OOS, critical condition create/reopen, etc.) | Reactive | Cancels pickups / holds | **Always enforce** | Same | **Yes** | `equipmentSafetyInvalidationService.ts`, `conditionService.ts` |

**Note:** Open critical conditions at **planning** are advisory only today (`loadOpenSafetyCriticalConditionsForEquipment` recorded but do not block assignment L260–264). Observe mode must **not** weaken release/pickup checks for critical conditions (EQ-10).

| EQ-10 | Open safety-critical `ConditionThread` | RELEASE, PICKUP_* | `SAFETY_CRITICAL_CONDITION` / `SAFETY_BLOCK` | Shadow deny; **effective deny** | Deny | **Yes** | `evaluateEquipmentSafety`, `isSafetyCriticalOpenCondition` |

---

### 4.3 Critical conditions (lifecycle)

| Control ID | Condition | Existing | Observe | Enforce | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- |
| CC-01 | New critical condition thread | Invalidates movement (CREATE) | Always enforce invalidation | Same | **Yes** | `conditionService.ts` ~1292–1298 |
| CC-02 | REOPENED critical thread | Invalidates | Always enforce | Same | **Yes** | `conditionService.ts` ~1125–1132 |
| CC-03 | Invalid lifecycle transition (RESOLVED → active without REOPEN) (S0-I9-03) | May skip invalidation | **Always enforce** once lifecycle fixed; until then invalidation gap remains | Same | **Yes** (after fix) | `persistConditionEvent` — remediation separate from D-2 |

D-2 does not replace S0-I9-03 remediation; observe mode must not add a bypass for CC-03.

---

### 4.4 Assignment authorization (planning gate)

| Control ID | Control | Existing | Observe | Enforce | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- |
| AS-01 | `PLANNING_RESERVE` composite (DQ + EQ planning) | Deny → 409, `recordAssignmentRefusal` | Apply §4.1–4.2 soft/hard rules to **effective** planning | Deny on shadow deny | Per row | `dispatchAssignmentService.ts` create assignment tx |
| AS-02 | Duplicate active assignment / equipment conflicts | 409 | **Always enforce** | Same | **Yes** | Same file (post-planning checks) |
| AS-03 | Fleet / load access | 403 | **Always enforce** | Same | **Yes** | `authorizedFleetAccess`, `requireDispatchMutationRole` |
| AS-04 | Tractor/trailer OOS pre-check (before `authorizeMovement`) | 422 | Must align with EQ-01 (no observe bypass unless EQ-01 soft) | Deny | Same as EQ-01 | L219–237 |

---

### 4.5 Release and trip release record

| Control ID | Control | Existing | Observe | Enforce | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- |
| RL-01 | `RELEASE` stage movement | Deny if not RELEASED/CONDITIONALLY_RELEASED | Shadow + effective per matrix | Deny on shadow deny | Per row | `createDispatchReleaseWithMovementAuthorization`, `executeMovementReleaseInTransaction` |
| RL-02 | `assertMovementAuthorizationAllowed` | 409 on blocked disposition | In OBSERVE, skip throw only when effective allowed with override metadata | Enforce | Per row | `dispatchReleaseService.ts` |
| RL-03 | Dispatch release row persistence | Writes disposition + reasonCodes | Persist **shadow** disposition in fields; add `enforcementMode`, `effectiveAllowed`, `enforcementOverridden` (proposed schema) | Same shadow; effective=shadow | Audit integrity | `writeDispatchReleaseInTx` |

---

### 4.6 Pickup verification and physical reconciliation

| Control ID | Control | Existing | Observe | Enforce | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- |
| PK-01 | `PICKUP_ISSUE` movement gate | Deny → no credential | Shadow + effective per matrix | Deny | Per row | `issuePickupAuthorization` L318–323 |
| PK-02 | `PICKUP_VERIFY` (Phase 1 verify) | Movement deny → STOP in tx, 409 after commit | Shadow deny → if soft, effective allow **must not** set RELEASED without policy (§7.4) | Deny → STOP durable (I-9R) | **Yes** for RELEASED outcome | `pickupAuthorizationService.ts` verify tx |
| PK-03 | Physical reconcile identity match + `PICKUP_VERIFY` | Deny → durable STOP (I-9R) | Same as PK-02 for RELEASE path | Same | **Yes** for RELEASE | `pickupPhysicalReconciliationService.ts` |
| PK-04 | Identity mismatch / dock STOP / token invalid | STOP/409 without movement release | **Always enforce** (not observe-gated) | Same | **Yes** | `throwDecision`, reconciliation evaluation |
| PK-05 | Non-match reconcile → `AUTHORIZED` status only | No `authorizeMovement` | **Always enforce** identity rules; observe does not grant RELEASE | Same | N/A (no release) | Physical reconcile tx when `!releasingMovement` |

**Invariant:** OBSERVE must **never** produce `RELEASED` pickup or physical RELEASE when shadow `PICKUP_VERIFY` denies for **hard-block** reasons (DQ-01, EQ-02, EQ-06, EQ-10, etc.).

---

### 4.7 Post-authorization invalidation (I-7 / I-8)

| Control ID | Control | Existing | Observe | Enforce | Hard both? | Code paths |
| --- | --- | --- | --- | --- | --- | --- |
| IV-01 | Driver qualification lapse / rejection | Re-evaluate; cancel/hold/escalate | **Always enforce** (ignore OBSERVE) | Same | **Yes** | `invalidateAssignmentMovementAuthorization`, `invalidateDriverMovementAuthorizations` |
| IV-02 | Equipment OOS / safety trigger | Same | **Always enforce** | Same | **Yes** | `invalidateEquipmentMovementAuthorizations` |
| IV-03 | Scheduled expiry sweep | Invalidates stale assignments | **Always enforce** when run | Same | **Yes** | `scripts/run-driver-qualification-sweep.ts` |
| IV-04 | IN_MOTION escalation | CRITICAL exception + chat | **Always enforce** | Same | **Yes** | `notifyFleetResponders`, driver invalidation cert scenarios |

Rationale: Invalidation **removes** authority when facts change; allowing observe-through would violate certified I-7/I-8 semantics and create stale RELEASED pickups.

---

## 5. Audit evidence (required)

| Event | When | Minimum payload |
| --- | --- | --- |
| `stage0.enforcement_mode_changed` | Platform or fleet mode change | scope, fleetId?, previousMode, newMode, reason, actor |
| `stage0.movement.shadow_evaluated` | Every `authorizeMovement` (both modes) | stage, loadId, assignmentId?, shadowAllowed, reasonCodes, policyVersion, qualificationSnapshotId, mode |
| `stage0.movement.effective_decision` | When effective ≠ shadow or always in OBSERVE | shadowAllowed, effectiveAllowed, enforcementOverridden, stage, entity refs |
| Existing release/pickup audits | Preserved | Extend details with shadow vs effective where overridden |

**S0-I9-04 dependency:** Post-commit audit failures must not drop shadow/effective evidence; design should prefer **in-transaction** persistence of enforcement decision on `DispatchRelease` / pickup attempt rows where possible (`STAGE0-PRODUCTION-READINESS-ASSESSMENT.md` §C.1).

---

## 6. BOF operator notification and acknowledgment

| Trigger | Recipients | Channel (current → proposed) | Acknowledgment |
| --- | --- | --- | --- |
| Platform switched to **ENFORCE** | BOF_OPERATIONS, BOF_COMPLIANCE_REVIEW | Audit + **operational chat** (required); external email (D-5 future) | BOF operator records change ticket / chat ack |
| Fleet pilot **OBSERVE** with overrides | BOF ops + fleet FLEET_ADMIN (read-only) | Chat + audit | Documented pilot charter |
| Shadow deny in OBSERVE (soft override applied) | BOF_COMPLIANCE + Dispatch (fleet) | `operationalChatNotification` with kind **`STAGE0_SHADOW_DENIAL`** (proposed) | Chat readAt ≠ formal exception ack; link to `OperatingException` when invalidation also fires |
| Shadow deny in OBSERVE (hard block) | Same as enforce denial | Existing refusal/hold paths | N/A |
| Invalidation (IV-*) | Fleet roles per I-7 | Existing chat + exception | Existing `nextAction` on exception thread |

Dispatchers **must not** receive a control to disable enforcement or dismiss hard blocks.

---

## 7. Business-policy decisions requiring approval before implementation

| ID | Decision | Options | Recommendation | Impact |
| --- | --- | --- | --- | --- |
| **7.1** | Fail-safe when config missing/malformed | A) Default **ENFORCE** B) Default **OBSERVE** C) Deny all mutations | **A** for production-like env; **B** only for named non-prod envs | Wrong default = accidental prod enforce or accidental prod permit |
| **7.2** | `PENDING_COMPLIANCE` in OBSERVE | A) Soft allow with override B) Always hard deny | **A** during D-1 pilot only; fleet-scoped | Enables backfill while shadowing gaps |
| **7.3** | `UNAVAILABLE` at release in OBSERVE | A) Soft allow B) Hard deny | **B** unless ops explicitly need equipment rehearsal | Safety vs staging convenience |
| **7.4** | Pickup **RELEASED** in OBSERVE | A) Never if shadow PICKUP_VERIFY denies B) Allow soft overrides for subset | **A** for hard blocks; **B** only for DQ-02-style soft rows with visible watermark on credential | Prevents “released” pickup with expired qual |
| **7.5** | Fleet override | A) Platform only B) Per-fleet pilot flag | **B** with BOF-only write | Pilot carrier isolation |
| **7.6** | Production ENFORCE lock | A) Env var can disable enforce in prod B) Production always ENFORCE regardless of flag | **B** (require separate build/deploy policy) | Prevents mis-set Vercel env |
| **7.7** | Persist shadow disposition on release rows | A) New columns B) JSON metadata only | **A** preferred for reporting | Analytics / compliance |
| **7.8** | UI surfacing | Show “OBSERVE — movement not enforced” banner | Required for dispatch surfaces | Reduces operator confusion |

---

## 8. Recommended implementation scope (for approval — not authorized here)

Minimal diff against `53acec36` lineage:

1. **Policy module** (new): `resolveStage0EnforcementMode({ fleetId })` reading env + optional fleet setting; no DISPATCH write API.
2. **Single application point** after shadow evaluation in `authorizeMovement` (or thin wrapper `authorizeMovementWithEnforcement`): compute `effectiveAllowed` using hard-block table (§4).
3. **Call-site alignment:** Replace direct checks of `movement.allowed` with **`movement.effectiveAllowed`** (or equivalent) at:
   - `dispatchAssignmentService.ts` (planning)
   - `dispatchReleaseService.ts` / `executeMovementReleaseInTransaction`
   - `pickupAuthorizationService.ts` (issue + verify)
   - `pickupPhysicalReconciliationService.ts` (PICKUP_VERIFY release path)
4. **Assignment OOS pre-checks (L219–237):** Route through same hard-block policy or delegate to planning shadow result (avoid double logic bypass).
5. **Persistence:** Add enforcement metadata to `DispatchRelease` (and optionally pickup attempts) — requires **approved migration** (out of design-only phase).
6. **Admin API:** BOF-only routes to read/set platform + fleet mode with §3 audit + notification.
7. **Tests:** Duplicate key cert scenarios in OBSERVE (soft override + hard deny) and ENFORCE (unchanged 294 tests); no weakening of existing assertions.
8. **Documentation:** `ENVIRONMENT_SETUP.md` variable names; runbook for OBSERVE → ENFORCE promotion (pairs with D-3).

**Explicitly excluded from first D-2 PR:** Samba changes, ePOD gates, UI banner (can follow), external email (D-5), S0-I9-03/04/05 fixes (separate workstreams).

**Estimated effort:** **Medium** (central wrapper + 4 call sites + persistence + admin API + cert tests).

---

## 9. Certified invariants preserved

This design preserves (does not alter evaluators or lock order on `53acec36`):

- Authoritative **`PICKUP_VERIFY`** for release paths (identity-matched physical reconcile and verify).
- **Equipment-first, driver-second** locking in `authorizeMovement`.
- **Driver qualification** and **equipment safety** evaluators unchanged; only **effective permit** layer added.
- **Fleet isolation** and **database-backed role** checks unchanged.
- **Pickup cancellation** and **transactional release** semantics unchanged in ENFORCE mode.
- **I-7/I-8 invalidation** always applied; not observe-gated.
- **No dispatcher-controlled** enforcement toggle.

---

## 10. Summary for approvers

| Deliverable | Status |
| --- | --- |
| Enforcement policy matrix | §4 (DQ, EQ, CC, AS, RL, PK, IV) |
| Shadow vs effective authorization | §2.1 |
| Hard vs soft blocks | Per-row **Hard both?** + §7 |
| Config authority | §3 (BOF ops/compliance only) |
| Audit + notification | §5–§6 |
| Unresolved decisions | §7 (8 items) |
| Implementation scope | §8 (**awaiting approval**) |

**Next step after approval:** Implement D-2 on a branch from `53acec36` per §8, with ENFORCE mode proving byte-for-byte equivalence to certified behavior when mode=ENFORCE and no overrides.

---

## Appendix — Primary code references (`53acec36`)

| Component | Path |
| --- | --- |
| Movement authorization hub | `lib/services/dispatchMovementAuthorizationService.ts` |
| Release / equipment / pre-trip evaluation | `lib/services/dispatchReleaseService.ts` |
| Assignment planning gate | `lib/services/dispatchAssignmentService.ts` |
| Pickup issue / verify | `lib/services/pickupAuthorizationService.ts` |
| Physical reconcile | `lib/services/pickupPhysicalReconciliationService.ts` |
| Driver invalidation | `lib/services/driverMovementInvalidationService.ts` |
| Equipment invalidation | `lib/services/equipmentSafetyInvalidationService.ts` |
| Equipment status roles | `lib/services/equipmentService.ts` |
| Qualification | `lib/services/authoritativeDriverQualificationService.ts` |
| Integrated cert (lifecycle) | `lib/services/stage0.integrated.certification.test.ts` |
