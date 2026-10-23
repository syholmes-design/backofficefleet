# Stage 0 I-9 — Integrated certification

**Certified commit:** `cursor/stage0-i8-equipment-invalidation` @ `4b07c2f0f46bcd34f7a11897569265fc7d804083`
**Result: FAIL** — two material authorization defects (S0-I9-01, S0-I9-02). Everything else certified; see §6.

## 1. Integration status

Every slice is an ancestor of the certified commit: baseline `0d0e5fdc`; I-1 `8e7bf415`; I-3 `7b9e71f1`;
I-4 `31a245ab`; I-5 `ae2c1f47`; I-6 `dd4b3f30`; I-2 `c7dd1f77`; I-6 remediation `4ae28150` + `c99d51c2`;
I-7 `1c5b5981`; I-8 `4b07c2f0`. No schema or dependency changes since `0d0e5fdc`.

## 2. Clean-database certification

A new, empty local database `bof_dev` (loopback; the only name the test guard accepts) was created for this run,
built with `prisma migrate deploy` (29 migrations) and `scripts/seed-dev-bof-foundation.mjs`. No production,
Preview or shared database was used.

| Check | Result |
| --- | --- |
| Unmodified `4b07c2f0`, per-file sequential (repo Node loader for `bofInquiryReview`) | 51 files, 265 pass, 0 fail |
| Full suite (52 files), one `tsx --test --test-concurrency=1` run, with I-9 changes | 274 tests: 271 pass, 0 fail, 3 todo (= documented defects S0-I9-01 ×2, S0-I9-02) |
| Full suite, one `tsx --test` run, default file parallelism | 270 pass, 1 fail (`requisition-persistence`, cross-file pollution, §5) |
| `stage0.integrated.certification.test.ts` | 6 pass, 3 todo (S0-I9-01 ×2, S0-I9-02) |
| Concurrency stress (6 competing operations × 4 rounds), repeated 4× | pass; PostgreSQL `pg_stat_database.deadlocks` for the database = 0 |
| `tsc --noEmit`, `npm run typecheck` | pass |
| ESLint, all 40 app/lib/components files Stage 0 changed, `--max-warnings=0` | pass |
| `npm run lint` (whole repo) | fails: 4 warnings in `components/dispatch/LoadDeliveryScreen.tsx`, unchanged since before Stage 0 |
| `next build` (isolated environment) | pass |

## 3. Integrated lifecycle (certified)

Driver qualification → equipment safety → assignment → release → pickup issue → pickup verify → movement →
invalidation runs on the real services. Assignment, release and pickup issue/verify all call `authorizeMovement`
in the transaction that writes their record, which evaluates with `getAuthoritativeDriverQualification` and the
equipment safety evaluator. Unsafe equipment (OUT_OF_SERVICE at planning; UNAVAILABLE, open safety-critical
condition, blocking pre-trip defect at release) is refused. A moving shipment that loses driver or equipment
eligibility keeps its records, gets one CRITICAL hold per cause, with owners DISPATCH
(`DOCUMENT_OPERATIONAL_DISPOSITION`) + COMPLIANCE or SAFETY. Restoring eligibility never revives a cancelled
authorization; a fresh release and pickup are required. Fleet B is neither affected nor notified by fleet A.

## 4. Locking and concurrency

Lock order is equipment (sorted) → driver everywhere both are taken: `authorizeMovement` (both paths),
equipment invalidation, condition create/reopen, pre-trip FAIL. Driver evidence writers take only the driver lock
and take no equipment lock under it. Pickup issue/verify take the advisory locks before any row write, so no
row-lock/advisory-lock cycle. Invalidation writes are all inside the triggering transaction: an injected failure
after invalidation rolls back the status change, release, cancellation, exception and notifications together.
A denied pickup issue leaves no authorization and no PICKUP_ISSUE release.

## 5. Defects

| ID | Severity | Defect | Smallest correction (owner) |
| --- | --- | --- | --- |
| **S0-I9-01** | **Critical** | `reconcilePickupPhysicalArrival` (`POST /api/dispatch/pickup-authorization/[id]/physical-reconcile`) sets a pickup PENDING/AUTHORIZED → RELEASED with no `authorizeMovement`, no locks, no transaction. It checks the stored readiness score instead of the authoritative qualification, performs no equipment safety evaluation, and writes after a stale status read. Reproduced: a driver whose license verification lapsed, and a tractor with an open CRITICAL condition, are both RELEASED here while `verifyPickupAuthorization` refuses them. Can also overwrite a concurrent invalidation's CANCELLED. Contract C7 required wiring PICKUP_VERIFY here; I-6 listed it as an unauthorized follow-on. | Wrap the decision and writes in one `$transaction`: `authorizeMovement(tx, "PICKUP_VERIFY", { sessionUser, loadId, assignmentId })`; on denial STOP as in verify; re-read the pickup under the lock and refuse unless PENDING/AUTHORIZED; write attempt, physical record and status in that transaction; drop the readiness-score check. (Cursor) |
| **S0-I9-02** | **High** | `setEquipmentStatus` authorizes any fleet member through session-claim `authorizedFleetAccess`: a DRIVER returned OUT_OF_SERVICE equipment to AVAILABLE (reproduced). With no open condition thread, release then passes. The AVAILABLE open-condition check also runs before the lock. | Require a DB-verified ACTIVE membership in the equipment's fleet with a maintenance/safety role for status changes (at least for leaving OUT_OF_SERVICE); move the open-condition check inside the locked transaction. (Cursor) |
| S0-I9-03 | Medium | `persistConditionEvent` does not validate lifecycle transitions; only REOPENED invalidates, so CONFIRMED/CHANGED on a RESOLVED thread re-activates a critical condition without cancelling live pickups (verify still blocks; S0-I9-01 does not). Reachability from the UI unconfirmed. | Validate transitions or invalidate whenever the resulting thread is safety-critical. (Cursor) |
| S0-I9-04 | Medium | Post-commit side effects: the `pickup.authorization_created` audit and process events run after commit; a failure returns an error for a committed authorization. Readiness re-evaluation failures are swallowed (`.catch(() => null)`). | Move the audit into the transaction; log or alert swallowed errors. |
| S0-I9-05 | Medium | `completePreTrip` runs without lock/transaction; a concurrent FAIL can land a blocking defect on a COMPLETED header (movement still blocked by the defect — fail closed; inspection immutability violated). | Complete under the equipment locks with a status-conditional update. (Cursor) |
| S0-I9-06 | Low | `cancelPickupAuthorization`, `expireIfNeeded` and verify's pre-transaction `reject` update unconditionally after a stale read and can overwrite RELEASED. | Status-conditional `updateMany`. |
| S0-I9-07 | Low | Legacy `writeDispatchRelease` writes a release from a caller-supplied evaluation; no callers. | Delete. |
| S0-I9-08 | Low | `unassign` leaves live pickups PENDING (verify and reconcile STOP on the inactive assignment). | Cancel live pickups in the unassign transaction. |
| S0-I9-09 | Low (test) | `requisition-persistence` counts all drivers/intakes and fails when files run in parallel; the I-2/I-7 lock tests count advisory waiters database-wide. | Scope the counts; run DB suites with `--test-concurrency=1`. |

Pre-existing, outside Stage 0 ownership: condition resolution with `DRIVER` authority lets a linked driver
verify resolution (`conditionService` `resolveResolutionAuthority`); `hasRole` there reads session claims.

### `bofInquiryReview.access.test.ts` (reported 264 pass / 1 fail)

Mock-harness defect, not pollution: it fails on the empty clean database too. Its async `module.register` resolve
hook does not intercept modules tsx loads through CommonJS, so under `tsx --test` the services queried the real
database (empty: `[]` instead of the mock's two loads), and the reviewer-isolation assertions passed vacuously.
It passes under the repo's Node loader. Fix: `module.registerHooks` (synchronous; applies to import and require).
It now passes under both runners and the mock is demonstrably in effect.

## 6. Release prerequisites (not complete; no completion evidence exists)

| Item | Status |
| --- | --- |
| D-1 compliance backfill | Not done. No backfill tooling. Without it every driver lacking verified registry evidence is PENDING_COMPLIANCE and cannot be assigned. |
| D-2 enforcement configuration | **Not implemented.** No `BOF_STAGE0_QUALIFICATION_ENFORCEMENT` flag or observe mode exists: deploying this code enforces immediately. |
| D-3 staging E2E-01/E2E-02 | Not done. |
| D-4 preservation smoke | Not done (only if marketing surfaces ship). |
| D-5 notification delivery and acknowledgment runbook | Not done. Holds and escalations reach only the in-app operational chat; no external delivery, acknowledgment or escalation timer. |
| Expiry sweep scheduling and service account | Not done. Script exists (`scripts/run-driver-qualification-sweep.ts`); no scheduler; no service account with BOF_OPERATIONS / BOF_COMPLIANCE_REVIEW membership per fleet. |
| Post-commit audit/notification failure handling | Partial: invalidation notifications are atomic; see S0-I9-04. |
| Preview / production database isolation | Unverified. No evidence available from this environment; the test guard blocks Neon hosts but that protects tests only. |
| Production deployment fingerprint (37 UIDs), legal review | Still outstanding from earlier stages. |
