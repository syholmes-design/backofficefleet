# Stage 0 I-8 — Movement authorization invalidation (equipment path)

`lib/services/equipmentSafetyInvalidationService.ts`. When equipment safety disqualifies movement, authorizations
already issued for assignments using that equipment stop counting. History is preserved; restoration does not
reinstate cancelled pickups or blocked releases.

## Lock ordering

All movement authorization and equipment safety mutations use the same order to avoid deadlocks:

1. **Equipment** — `pg_advisory_xact_lock(hashtext('bof-equipment-safety:' + equipmentId))`, sorted when multiple.
2. **Driver** — `pg_advisory_xact_lock(hashtext('bof-driver-readiness:' + driverId))`.

`authorizeMovement` and equipment invalidation both follow equipment → driver. Driver-only invalidation (I-7) takes
only the driver lock.

## Triggers

| Writer | Trigger |
| --- | --- |
| `equipmentService.setEquipmentStatus` → OOS / UNAVAILABLE | `EQUIPMENT_OUT_OF_SERVICE`, `EQUIPMENT_UNAVAILABLE` |
| `conditionService.createCondition` (safety-critical) | `CONDITION_THREAD_CREATED` |
| `conditionService.recordConditionEvent` → REOPENED (safety-critical) | `CONDITION_THREAD_REOPENED` |
| `preTripService.updatePreTripItem` → FAIL (blocking defect) | `PRETRIP_DEFECT` |

Each runs invalidation inside the same transaction after the write, holding the equipment lock(s).

## Shared step

Uses I-7 `invalidateAssignmentMovementAuthorization` with cause
`EQUIPMENT_SAFETY_MOVEMENT_HOLD`, owner SAFETY, action `RESOLVE_EQUIPMENT_SAFETY`. The equipment trigger gates on
`evaluateEquipmentSafety` so routine `PRETRIP_INCOMPLETE` on an unreleased assignment does not open an equipment hold.

## Restoration

Setting equipment to `AVAILABLE` does not call invalidation and does not auto-reissue pickups or releases.
