# BOF Dispatch and ePOD Correction Report

Date: October 11, 2026

Branch: `release/document-control-batch2-control-plane`

Parent HEAD for the local preservation commit: `2a0aaf4d7c7da00f4f392f8d439e16c2579169e6`

Certification: **SAFETY CERTIFICATION PASS** for the local correction. Production deployment remains unauthorized.

Production deployment of electronic POD requires an explicit, independently verified `BOF_EPOD_ENABLED=false` setting. This commit does not change that variable and does not deploy.

## Files changed

These are the only files this correction adds or edits.

- `lib/services/dispatchAssignmentService.ts`
- `lib/services/readinessService.ts`
- `lib/services/driverEligibilityReviewService.ts`
- `lib/process-intelligence/operating-event-service.ts`
- `lib/audit.ts`
- `lib/services/epod/deliveryLifecycle.ts`
- `lib/services/proofSettlementHoldService.ts`
- `app/api/dispatch/load/[loadId]/delivery/route.ts`
- `app/api/dispatch/load/[loadId]/delivery/photos/route.ts`
- `app/api/dispatch/load/[loadId]/delivery/acknowledgment/route.ts`
- `app/api/dispatch/load/[loadId]/delivery/epod/route.ts`
- `app/api/dispatch/load/[loadId]/delivery/evidence/[evidenceId]/route.ts`
- `app/api/dispatch/load/[loadId]/proof/route.ts`
- `app/api/dispatch/load/[loadId]/proof/verify/route.ts`
- `app/api/dispatch/load/[loadId]/proof/reject/route.ts`
- `components/dispatch/LoadDetailContent.tsx`
- `components/dispatch/EpodAvailability.tsx` (new)
- `app/(bof)/layout.tsx`
- `lib/services/dispatchAssignment.safety.test.ts` (new)
- `lib/services/dispatchAssignment.concurrency.test.ts` (new)
- `lib/services/epod/epodFeatureFlag.test.ts` (new)
- `docs/recovery/BOF_DISPATCH_AND_EPOD_CORRECTION_REPORT.md` (new)

`lib/audit.ts` is included so a successful assignment audit is written on the same transaction as the assignment row. If that audit write throws, the assignment rolls back.

`components/dispatch/EpodAvailability.tsx` and `app/(bof)/layout.tsx` are included because the load detail screen is a client component and is also mounted from the dispatch board and the load drawer. The operational layout reads the flag on the server and passes it into those client trees. The client does not read `process.env`.

No homepage, marketing copy, BofHeader, Power BI, SambaSafety observation module, Prisma schema, migration, recovery ledger, or deployment configuration file was edited.

## Dispatch assignment behavior

`createAssignment` in `lib/services/dispatchAssignmentService.ts` is the assignment writer behind `POST /api/dispatch/assignment`.

- `READY` is accepted when the existing fleet, equipment, and active-assignment checks pass.
- `CONDITIONAL` is accepted on the same path. That matches pickup authorization and trip release.
- `NOT_READY` returns HTTP 409 with `ASSIGNMENT BLOCKED — DRIVER NOT READY`. No assignment row is created.
- A missing readiness score returns HTTP 409 with `ASSIGNMENT BLOCKED — NO CURRENT DRIVER READINESS SCORE`. No assignment row is created.
- Any other readiness value fails closed with the same 409.
- A caller with an active `DRIVER` membership on the load fleet receives HTTP 403, `A driver cannot create a dispatch assignment.` The refusal is audited and no assignment row is created.
- Dispatch operators and the existing fleet-access check remain in place. Permissions were not broadened.
- A driver, tractor, or trailer from another fleet is still rejected with HTTP 422. Those ownership checks were not weakened.

The latest `DriverReadinessScore` for the driver and fleet is read inside the existing assignment transaction, ordered by `evaluatedAt` and then `createdAt`, immediately before insert.

Successful assignments write an `AuditEvent` with action `CREATED` on that same transaction. Readiness and driver-role refusals write an `AuditEvent` with action `ACCESS_DENIED` before the insert. Those refusal audits use the existing audit table. If the refusal audit throws, the assignment is not created. No new table and no migration were added.

Samba finding records are not read by the assignment writer. Eligibility review remains the BOF readiness writer.

## Authorization changes

The new refusal is limited to an active `DRIVER` membership on the target fleet. Operator memberships that already passed `authorizedFleetAccess` still pass. Service-role and aggregator access were not removed and were not expanded.

The assignment route accepts only `loadId`, `driverId`, `tractorId`, and `trailerId`. The actor comes from the server session. That session loads fleet memberships from the database. A request body cannot supply a role or an event-authorization flag.

Assignment operating events carry `authorizedFleetId` taken from the assignment row. That row's fleet is the load fleet checked by `authorizedFleetAccess` inside the assignment transaction. The event writer rejects the event when that fleet id does not match the event fleet, and it does so before any event write. Callers that omit `authorizedFleetId` still use the existing membership check.

A service-role caller who has no membership on the target fleet can complete the assignment and store `DISPATCH_ASSIGNED`. A dispatch membership on a different fleet cannot. A mismatched `authorizedFleetId` does not write an operating event.

## Feature flag semantics

`BOF_EPOD_ENABLED` keeps the established exact-string contract.

- The value `false` disables electronic POD.
- The value `FALSE` leaves electronic POD enabled.
- An unset variable leaves electronic POD enabled.
- The value `true` leaves electronic POD enabled.

The preferred production behavior, where only the exact value `true` enables POD, was not implemented in this commit. The established contract remains: unset does not disable POD. Production deployment requires an explicit, independently verified `BOF_EPOD_ENABLED=false` setting before electronic POD and proof mutations are treated as disabled.

When the value is exactly `false`, these paths return HTTP 503 before a database mutation:

- Delivery read and delivery stage changes
- Cargo photo submission
- Signature acknowledgment
- Generated POD creation
- Evidence file read
- Proof list and proof submission
- Proof verification
- Proof rejection

The route handlers check the flag before session lookup. The proof and delivery services check it again before load and settlement writes. Proof rejection does not change settlement status while the flag is `false`. Proof verification does not change settlement status while the flag is `false`. Settlement amounts were not changed. No payroll formula was added.

The delivery tab is omitted, and the proof submission, verification, and rejection forms are not rendered, when the operational layout supplies a disabled flag. The forms remain in the source file so existing proof-route source checks still see them. Pre-trip and trip-release links stay on the proof tab.

## Concurrency

Assignment creation, readiness score writes, and eligibility reviews take the same transaction-scoped advisory lock, `pg_advisory_xact_lock(hashtext('bof-driver-readiness:' || driverId))`, before reading or inserting that driver's score. A readiness write waits until an in-flight assignment decision commits, and an assignment waits until an in-flight score insert commits. No table-wide lock was added.

## Tests executed

TypeScript typecheck, `node .\node_modules\typescript\bin\tsc -p tsconfig.typecheck.json --noEmit --incremental false --pretty false`: exit 0.

Safety certification run on October 11, 2026: focused tests, 26 executed, 26 passed, 0 failed. Database-backed cases used disposable Postgres `bof_dev` on `127.0.0.1:54329`. The test guard rejects Neon hosts. Production credentials were not printed. These counts are from this run, not from an earlier execution.

Passed:

1. `READY` driver accepted.
2. `CONDITIONAL` driver accepted.
3. `NOT_READY` driver rejected with HTTP 409.
4. Missing readiness rejected with HTTP 409.
5. `DRIVER` caller rejected with HTTP 403.
6. Cross-fleet driver rejected with HTTP 422.
7. Cross-fleet tractor rejected with HTTP 422.
8. Cross-fleet trailer rejected with HTTP 422.
9. Successful assignment has a `CREATED` audit row.
10. `NOT_READY`, missing readiness, and `DRIVER` refusals have `ACCESS_DENIED` audit rows.
11. No assignment row remains after a readiness rejection.
12. Disabled delivery route returns HTTP 503.
13. Disabled photo route returns HTTP 503.
14. Disabled signature route returns HTTP 503.
15. Disabled generated POD route returns HTTP 503.
16. Disabled evidence read returns HTTP 503.
17. Disabled proof submit returns HTTP 503.
18. Disabled proof verify returns HTTP 503.
19. Disabled proof reject returns HTTP 503.
20. Disabled proof reject leaves settlement status `CREATED`.
21. Disabled proof verify leaves settlement status `CREATED`.
22. With the flag unset, the flag helper does not throw, and proof submit for a missing load returns HTTP 404.
23. `false` disables, `FALSE` stays enabled, `true` stays enabled, and unset stays enabled.
24. The delivery tab source hides the delivery screen and the proof mutation forms when the flag is disabled.
25. Cross-fleet driver, tractor, and trailer checks still reject.
26. A dispatch operator can still assign a ready driver. A service-role caller without a membership on the target fleet completes the assignment and stores `DISPATCH_ASSIGNED`.
27. Assignment creation does not reference Samba findings. The eligibility review service does not reference Samba findings. Existing Samba boundary and connection tests passed.
28. A dispatch membership on another fleet is rejected with HTTP 403 and creates no assignment.
29. Concurrent disposable-database test: an open transaction held the driver readiness lock and inserted `NOT_READY` before release. The waiting assignment stayed blocked while a different driver on the same fleet was assigned. After the lock committed, the waiting assignment returned HTTP 409 and left no assignment row. A rolled-back lock released the driver, and the following assignment of that ready driver succeeded. A cross-fleet driver was rejected with HTTP 422 while the first lock was held. An event whose `authorizedFleetId` did not match the event fleet returned HTTP 403 and wrote no event. An event call without `authorizedFleetId` still required a membership on that fleet.

Also passed in the same run: live load review, pickup authorization link source check, proof submission, and proof verification source and unit checks.

Prisma schema validation for this certification ran in an isolated copy that did not contain `.env.local`. Prisma reported `injected env (0) from .env.local` and `The schema at prisma\schema.prisma is valid`. No migration was applied.

Production build for this certification ran in `%TEMP%\bof-safety-cert-build`, with `node_modules` joined from the worktree, without copying environment files, and with only the disposable database URL. Exit 0. Next.js 15.5.15 compiled, generated 262 static pages, and wrote the chunk aliases in the temp copy. The October homepage route `/` and the `/what-we-do` routes were present. The operational worktree was not the build output directory. Existing ESLint warnings in `components/dispatch/LoadDeliveryScreen.tsx` were reported by the build and were not part of this edit.

The full repository test suite was not run. Samba database certification tests were not re-run. The delivery tab was not clicked in a browser. Starting the dev server would load `.env.local`.

## Tests failed

None of the 26 focused tests failed in the safety certification run. The isolated Prisma validation passed. The isolated production build passed.

## Remaining risks

- Production deployment is blocked until `BOF_EPOD_ENABLED=false` is set explicitly and verified independently. Unset and every value other than exact `false` leave POD enabled. This commit does not change the flag to opt-in.
- Durable evidence storage is unchanged and is not production-durable.
- The delivery-tab disabled state was verified from source and from the server flag passed through the operational layout. It was not opened in a browser, because the dev server would load `.env.local`.

## Production readiness

The local safety gates for this correction passed. This commit does not authorize deployment. Do not push. Do not migrate production. Do not treat electronic POD as disabled in production until `BOF_EPOD_ENABLED=false` is independently verified there.
