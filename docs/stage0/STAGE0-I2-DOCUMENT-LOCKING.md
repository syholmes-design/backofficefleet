# Stage 0 I-2 — Qualification evidence locking

Resolves the I-2 item in `STAGE0-I6-INTEGRATION-DEPENDENCIES.md` for evidence writers. Two
pickup-side gaps remain open for Cursor (see below).

## Lock

All writes to evidence read by `getAuthoritativeDriverQualification` take the driver lock
(`lockDriverReadinessWrite`, `bof-driver-readiness:{driverId}`), the one `authorizeMovement` holds while it
evaluates. `withDriverQualificationLock(driverId, write)` in `readinessService` opens the transaction and
takes the lock first. Each write, the requirement re-derivation (`evaluateIntakeRequirements`, which now
requires the transaction) and the write's audit record commit together.

## Paths covered

| Path | Entry point | Evidence changed |
| --- | --- | --- |
| Document upload | `createDriverDocumentRecord` (`POST /api/intake/[intakeId]/documents`) | new current version of a type; requirement rows |
| Verify / reject / expire | `updateDriverDocumentRecord` (`PATCH /api/documents/[documentId]`) | document status, verification source, requirement rows. Transition is re-checked on the locked row |
| Driver vault upload / replace | `driverDocumentVersioningService.createVersionRecord` (`/api/driver/vault/documents`) | new version, supersedes current |
| Requirement create / update / affirm | `requirementService` (`/api/intake/[intakeId]/requirements`, `/api/requirements/[id]`, `/affirm`, `/api/drivers/[driverId]/medical-renewal/affirm`) | requirement rows, exceptions |
| Intake creation | `createDriverIntakeRecord` (`POST /api/intake`) | newest intake (the one evaluated) |
| Recruiting activation | `activateRecruitingV2Candidate` | new intake and documents |
| Driver account claim | `completeDriverClaim` | `Driver.userId` (self-verification exclusion) |

Document-control authority, transition rules, audit events and the post-commit readiness re-evaluation are
unchanged. The readiness re-evaluation takes the same lock in its own transaction, so it runs after the commit.

## Not protected (no application writer, or not evidence)

- `DriverLicense`, `DriverEndorsement`, `MedicalQualification`, `DrugTestRecord`, `WorkHistory`,
  `AccidentHistory`, `ViolationHistory`: written only by seed and test scripts.
- `FleetMembership` / `User.status` of compliance reviewers: affects every driver in the fleet. No
  application writer today; a future admin path needs a fleet-scoped lock design.
- `updateDriverIntakeRecord` (stage/status): not read by the evaluator.
- `driverVaultDocumentService` write functions: no callers (superseded by the versioning service).

## Open for Cursor: pickup writes outside the authorization transaction

`issuePickupAuthorization` and `verifyPickupAuthorization` evaluate in one transaction and write the pickup
result in another. A qualification change can commit between them; a probe held the second transaction on a
row lock, committed a license rejection, and observed:

- `PICKUP_ISSUE`: authorization issued (`PENDING`) after the rejection committed.
- `PICKUP_VERIFY`: authorization `RELEASED` after the rejection committed.

Fix: run `authorizeMovement(tx, …)` and the pickup write in the same transaction (issue: create the
`PickupAuthorization` inside the release transaction; verify: evaluate, write the attempt and the
`AUTHORIZED` / `RELEASED` / `STOPPED` status together). Assignment (I-5) and `RELEASE` are already atomic.
