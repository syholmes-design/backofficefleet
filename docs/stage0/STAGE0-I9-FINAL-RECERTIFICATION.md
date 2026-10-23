# Stage 0 I-9 — Final independent re-certification

**Tested commit:** `53acec36cf7a74c2f5cbfb16f644ccc7a27b0d32` (`origin/cursor/stage0-i9r-remediation`, verified equal)
**Result: PASS WITH CONDITIONS** — S0-I9R-01 and S0-I9R-02 are CLOSED; no new material defect; non-blocking
findings and all production-release prerequisites remain. Earlier reports (`STAGE0-I9-CERTIFICATION.md`,
`STAGE0-I9-RECERTIFICATION.md`) are preserved unchanged.

## A. Baseline

- `53acec36` parent `0ed96a92` (first remediation) → `4b07c2f0` (I-8) → I-7 … I-1. `128bed79` (previous
  re-certification) is not an ancestor; its report is carried over byte-identical.
- Remediation diff vs `0ed96a92`: `equipmentService.ts` (+/-37), `pickupPhysicalReconciliationService.ts` (+/-105),
  plus the re-certification test and report. Against `128bed79` the test file differs only in removing the two `todo`
  markers and renaming their titles; every assertion is unchanged.
- Clean detached worktree at the exact SHA (`git status` empty before testing).
- Fresh `bof_dev` on PostgreSQL 16 at `127.0.0.1` (prior databases renamed aside, untouched): `prisma migrate deploy`
  (29 migrations) + `scripts/seed-dev-bof-foundation.mjs` (3 fleets, 0 drivers). No Neon/Preview/Vercel variables;
  only `.env.example` in the worktree; tests assert `bof_dev` @ `127.0.0.1` and the loopback/Neon guard.

## B. S0-I9R-01 — durable STOP persistence: **CLOSED**

Mechanism: the denial branch now returns `movement_denied` from the transaction (STOPPED attempt, physical STOP
and STOPPED status commit together), then audits, records the process event and throws 409 after commit.

| Evidence (real PostgreSQL) | Result |
| --- | --- |
| Denied (expired license) | 409 with payload `authorization.status = STOPPED`; DB: STOPPED, attempts [STOPPED], physical STOP, STOP audit row |
| Retry after credential renewal — reconcile and Phase 1 verify | both 409; stays STOPPED; no RELEASED attempt |
| Cancelled before arrival / while waiting on the lock | CANCELLED, never released |
| Identity-matched release | RELEASED, attempts [RELEASED], physical RELEASE (atomic) |
| Driver / equipment invalidation racing reconciliation, both orders | CANCELLED, or RELEASED with CRITICAL hold |
| Two simultaneous reconciliations | one release |
| Failure injected after authorization, before physical write | full rollback (PENDING, no attempt, no physical) |
| **Post-commit audit failure injected (STOP)** | STOP durable (STOPPED / [STOPPED] / STOP); audit row missing; request fails with an untyped Prisma error → route answers **500 "Internal server error"**, not 409 |
| Post-commit audit failure injected (RELEASE), comparison | RELEASED durable; audit row missing; route answers 500 |

The audit-failure behaviour is the existing S0-I9-04 weakness (post-commit audit), not an authorization defect:
the authorization state is correct and fail-closed. Severity **Medium**, non-blocking for I-9; it is a
production-release item (audit reliability, accurate client outcome).

## C. S0-I9R-02 — equipment restoration race: **CLOSED**

Mechanism: `setEquipmentStatus` takes the equipment lock, re-reads the row, classifies restore / downgrade / other
from the locked status, runs the database role check, checks conditions, and audits the locked previous status.

| Evidence | Result |
| --- | --- |
| Original race: DISPATCH "AVAILABLE" waiting while FLEET_ADMIN's OUT_OF_SERVICE commits | DISPATCH **403**; stays OUT_OF_SERVICE; audit `AVAILABLE->OUT_OF_SERVICE` only; one ACCESS_DENIED audit for the dispatcher |
| Authorized restore waiting while a downgrade commits | audit `UNAVAILABLE->OUT_OF_SERVICE`, `OUT_OF_SERVICE->AVAILABLE` (actual previous status) |
| DRIVER (incl. claiming FLEET_ADMIN), inactive/invited/suspended/no membership, other-fleet admin, BOF_OPERATIONS member elsewhere | 403 ×9 |
| FLEET_ADMIN, FLEET_OPERATIONS, FLEET_MANAGER, BOF_OPERATIONS, BOF_COMPLIANCE_REVIEW restore from OOS and UNAVAILABLE | AVAILABLE ×10 |
| DISPATCH downgrade / restore | allowed / 403 |
| Critical condition committed while a restore waits | 422, stays OUT_OF_SERVICE |
| I-8 invalidation on DISPATCH downgrade | pickup CANCELLED |

Only `setEquipmentStatus` writes `Equipment.status`; only reconciliation and `verifyPickupAuthorization` write a
RELEASED pickup, both under `authorizeMovement`. Lock order is unchanged: equipment, then driver.

## D. Test results (independently executed)

| Run | Result |
| --- | --- |
| Full sequential (`npx tsx --test --test-concurrency=1`), 53 committed files | **288/288**, 0 todo/skip |
| `stage0.i9-recertification` ×3 | 14/14 each |
| integrated 9 + I-7 9 + I-8 9 + pickup 5 + physical reconciliation 12 | **44/44** |
| `stage0.i9-final-recertification` (this certification) ×3 | 6/6 each |
| Full sequential incl. the certification test, 54 files | **294/294** |
| PostgreSQL `deadlocks` for the database | 0 |
| `tsc`, `npm run typecheck`, ESLint `--max-warnings=0` on changed files, `next build` | pass |

Parallel-mode isolation was not re-investigated; no new evidence of a regression.

## E. Regression findings

No new material defect. Reviewed: no authorization bypass, no lock-order inversion, intent and audit read under the
lock, no cross-fleet escalation, denial writes commit atomically, I-6/I-7/I-8 suites green.

## F. Remaining findings (non-blocking)

| ID | Severity | Status | Certification impact |
| --- | --- | --- | --- |
| S0-I9-04 post-commit audit / process events (now with injected-failure evidence: 500 and missing audit row) | Medium | Open | Non-blocking; release prerequisite |
| S0-I9-03 condition lifecycle not validated; only REOPENED invalidates | Medium | Open | Non-blocking: verify and reconcile both re-evaluate conditions at release |
| S0-I9-05 pre-trip completion without lock | Medium | Open | Non-blocking: movement fails closed on the defect |
| S0-I9-06 stale unconditional status updates (cancel, expire) | Low | Open | Non-blocking |
| S0-I9-07 unused legacy `writeDispatchRelease` | Low | Open | Non-blocking |
| S0-I9-08 live pickups left PENDING after unassign | Low | Open | Non-blocking (gates refuse inactive assignment) |
| S0-I9-09 shared-database test isolation | Low | Open | Non-blocking (sequential suite green) |
| DISPATCH may move OUT_OF_SERVICE → UNAVAILABLE (re-enables planning; movement blocked) | Low | Open | Non-blocking |
| Non-identity-matched reconciliation sets AUTHORIZED without `authorizeMovement` | Low | Open | Non-blocking (RELEASED still requires it) |

## G. Classification

**PASS WITH CONDITIONS.** Both remediated defects are closed with real-database evidence, including the original
race and retry scenarios; no new material authorization defect; the findings above are documented and non-blocking.

## H. Production release

Implementation certification only. D-1 (compliance backfill), D-2 (enforcement/observe-mode controls, not
implemented), D-3 (staging E2E), D-4 (preservation smoke, if applicable), D-5 (external notification,
acknowledgment, escalation), expiry-sweep scheduling and service account, post-commit audit reliability,
Preview/production database isolation, deployment fingerprint and legal/operational review remain incomplete.

Production deployment is not authorized by this certification.
