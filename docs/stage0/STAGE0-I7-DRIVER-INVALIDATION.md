# Stage 0 I-7 — Movement authorization invalidation (driver path)

`lib/services/driverMovementInvalidationService.ts` (contract §5, X-04). When a driver stops being eligible to
move, authorizations already issued for that driver stop counting. History is kept and nothing is reinstated
automatically.

## Consequences by state

| Assignment state at the change | Consequence |
| --- | --- |
| ASSIGNED (no movement-authorizing release) | Assignment kept ACTIVE. Hold exception opened or updated (MEDIUM); Dispatch `HOLD_OR_REASSIGN_LOAD`, Compliance `RESOLVE_DRIVER_QUALIFICATION`; notified. |
| RELEASED (no pickup issued) | Re-evaluated release appended after the kept release (not RELEASED / CONDITIONALLY_RELEASED). Exception (HIGH). |
| PICKUP_ISSUED (PENDING / AUTHORIZED) | Pickup `CANCELLED` with `cancelledAt`, `cancelledByUserId`, `reason`, `reasonCodes` and a `pickup.cancelled` audit. Blocked release appended. Exception (HIGH). |
| Pickup verification in progress | Serialized by the driver qualification lock. Verify finishes first (then IN_MOTION) or re-reads the cancelled authorization under the lock and is refused (409). |
| IN_MOTION (a pickup was RELEASED) | Pickup and assignment not rewritten, no automatic stop. Blocked release appended. CRITICAL exception, due immediately; Dispatch `DOCUMENT_OPERATIONAL_DISPOSITION` (completed with outcome and evidence through the existing corrective-action workflow); Compliance, carrier `FLEET_ADMIN` and BOF operations notified (`MOVEMENT_IN_MOTION_ESCALATION`). |
| Assignment not ACTIVE | No action. |

**Correction:** after the driver is qualified again, dispatch runs a fresh `RELEASE` and issues a new pickup,
both through `authorizeMovement`. Cancelled pickups and blocked releases stay as they are.

**Repeat detection:** while a hold exception is open, a repeat detection that changes nothing (no release
appended, no pickup cancelled, no escalation) leaves the exception and notifications unchanged.

## Triggers

All writers from I-2 (`STAGE0-I2-DOCUMENT-LOCKING.md`) run `invalidateDriverMovementAuthorizations` in their
own locked transaction, after the write:

- `withDriverQualificationLock(driverId, { actor, trigger }, write)`: document upload, verify, reject or expire;
  requirement create, update or affirm; intake creation.
- Direct: driver vault versioning, recruiting activation, driver account claim.

Credential expiry has no write event. `sweepDriverQualificationInvalidations(actor)` re-evaluates every driver
on an ACTIVE assignment in the fleets where the actor holds an ACTIVE `BOF_OPERATIONS` or
`BOF_COMPLIANCE_REVIEW` membership (from the database), each under its driver lock. Scheduled entry point:
`scripts/run-driver-qualification-sweep.ts --actor-email=<service account>`.

## Shared step for I-8 (Cursor)

`invalidateAssignmentMovementAuthorization(tx, { assignmentId, actor, cause })` applies the table above to one
assignment. It re-evaluates with `getAuthoritativeDriverQualification`, `assembleReleaseInputsInTx` and
`composeMovementAuthorization`, and returns `null` when movement is still authorized. The I-8 equipment trigger
should call it with:

```ts
{ exceptionType: "EQUIPMENT_SAFETY_MOVEMENT_HOLD", trigger: "EQUIPMENT_OUT_OF_SERVICE" /* etc. */,
  correctiveOwnerTeam: "SAFETY", correctiveActionType: "RESOLVE_EQUIPMENT_SAFETY", summary }
```

The trigger decides the cause before calling: on an assignment that has not been released yet, the RELEASE
evaluation is also denied for routine reasons (e.g. `PRETRIP_INCOMPLETE`). The driver trigger checks the driver
policy first (`composePlanningAuthorization` → `DRIVER_PLANNING_DENIED`); I-8 should equally act only on an
equipment finding. It must be called inside the transaction that changed the equipment, holding whatever lock serializes that
change with `authorizeMovement`. The equipment equivalent of the driver lock is I-8's design decision; today
`authorizeMovement` takes only the driver lock.

## Pickup verify correction (pickupAuthorizationService)

`verifyPickupAuthorization` checked the authorization status before its transaction. It now re-reads the status
under the lock taken by `authorizeMovement`, so a cancellation committed while the request waited cannot be
overwritten with STOPPED, or with RELEASED if qualification was restored in between.
