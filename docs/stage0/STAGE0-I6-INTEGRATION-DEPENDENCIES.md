# Stage 0 I-6 — Integration dependencies

## I-2 (Claude): qualification lock on document verification

**Status:** Open — not resolved in I-6.

Driver document verification and rejection paths (credential self-verification / V3) do **not** currently acquire `lockDriverReadinessWrite` / the movement qualification lock before mutating evidence that feeds `getAuthoritativeDriverQualification`.

**Risk:** A concurrent `authorizeMovement` transaction can read qualification evidence while a document verify/reject write is in flight, so serialization is **not** guaranteed in production despite passing assignment concurrency tests that only cover the assignment + planning gate path.

**Required correction (Claude / I-2 scope):** Acquire the same advisory lock (`bof-driver-readiness:{driverId}`) in document verification and rejection write paths before updating Prisma qualification evidence, or run those mutations inside a transaction that calls `lockDriverReadinessWrite` first.

**I-6 assumption:** Release and pickup paths re-evaluate via `authorizeMovement` inside a transaction with the lock held; this does **not** substitute for locking document write paths.

## I-6 follow-on (not authorized here)

- Physical pickup reconciliation (`pickupPhysicalReconciliationService`) — wire `PICKUP_VERIFY` (contract C7).
- `equipmentSafetyInvalidationService` / `driverMovementInvalidationService` (I-7 / I-8).
