# Stage 0 I-9 — Independent remediation re-certification

**Tested commit:** `0ed96a924ffeb3b16273f7803a1dacce87a1d63d` (`origin/cursor/stage0-i9-remediation`, verified equal)
**Original certification:** `claude/stage0-i9-certification` @ `661b4a1d` — `STAGE0-I9-CERTIFICATION.md` preserved unchanged.
**Result: FAIL.** The original exploits are closed, but the remediation introduces one authorization-lifecycle
defect (S0-I9R-01) and leaves a race that defeats the new equipment restore rule (S0-I9R-02).

| Defect | Determination |
| --- | --- |
| S0-I9-01 physical reconciliation bypass | **CLOSED** for the original exploit (no denied pickup became RELEASED in any test or race). New defect S0-I9R-01 in the denial path. |
| S0-I9-02 equipment restore authority | **OPEN (residual)**: the DRIVER vector is closed; a DISPATCH request racing a downgrade still returns OUT_OF_SERVICE equipment to AVAILABLE (S0-I9R-02). |

## 1. Baseline

- `0ed96a92` parent is I-8 `4b07c2f0`; `661b4a1d` is **not** an ancestor. Its content was carried over: the
  original report and the `bofInquiryReview` harness fix are byte-identical.
- Remediation vs I-8: `equipmentService.ts`, `pickupPhysicalReconciliationService.ts`, plus the I-9 test, report and
  harness fix. Remediation vs `661b4a1d`: the two services; the integrated test drops the three `todo` markers (all
  three now active) and restores equipment with the carrier admin instead of the dispatcher (consistent with the
  new rule that DISPATCH cannot restore).
- Isolated worktree at the exact SHA; `git status` clean before testing.

## 2. Environment and isolation

New empty `bof_dev` on PostgreSQL 16 at `127.0.0.1` (prior databases renamed aside, untouched), built with
`prisma migrate deploy` (29 migrations) and `scripts/seed-dev-bof-foundation.mjs` (3 fleets, 5 users, 0 drivers).
Shell has no `DATABASE_URL`, Neon, Preview or Vercel variables; worktree has only `.env.example`; every test asserts
`assertTestDatabaseTarget` (loopback, `bof_dev`, Neon hosts blocked) and the re-certification test also asserts
`current_database() = bof_dev` and `inet_server_addr() = 127.0.0.1`. Env: `AUTH_SECRET=local-dev-only…`,
`BOF_EPOD_ENABLED=false`. Node 22.22.0.

## 3. S0-I9-01 — physical pickup reconciliation

**Original mechanism:** `reconcilePickupPhysicalArrival` set PENDING/AUTHORIZED → RELEASED with no
`authorizeMovement`, locks or transaction, using the stored readiness score.

**Remediation:** the identity-matched path runs in one `$transaction` (`pickupPhysicalReconciliationService.ts:477`)
calling `authorizeMovement(tx, "PICKUP_VERIFY", …)` (:479) — equipment locks then driver lock — re-reads the
pickup under the locks and refuses unless PENDING/AUTHORIZED, then writes attempt, physical record and RELEASED
status in that transaction. The readiness-score check is removed. RELEASED is written only here and in
`verifyPickupAuthorization`, both under `authorizeMovement`; `Equipment.status` has one writer.

Evidence (`lib/services/stage0.i9-recertification.test.ts`, final DB state per scenario, 3 identical runs):

| Scenario | Final pickup state | Invariant |
| --- | --- | --- |
| A/J identity-matched release | RELEASED; attempts [RELEASED]; physical RELEASE | held (atomic) |
| F expired qualification | PENDING; attempts []; physical none | held (not released) |
| G open critical condition | PENDING; attempts []; physical none | held |
| E cancelled before arrival | CANCELLED; attempts [REJECTED] | held |
| 4 cancellation committed while reconciliation waits on the lock | CANCELLED; attempts [] | held |
| 1 driver invalidation first / reconciliation first | CANCELLED / RELEASED + `DRIVER_QUALIFICATION_MOVEMENT_HOLD:CRITICAL` | held |
| 2 equipment invalidation first / reconciliation first | CANCELLED / RELEASED + `EQUIPMENT_SAFETY_MOVEMENT_HOLD:CRITICAL` | held |
| 3 two simultaneous reconciliations | one 200, one 409; RELEASED; one RELEASED attempt | held |
| 5 retry after dock STOP | STOPPED; attempts [STOPPED, REJECTED]; physical STOP | held |
| 6/L failure injected (DB trigger) after authorization, before physical write | PENDING; attempts []; physical none | held (full rollback) |
| I movement denial — durable STOP | **PENDING; attempts []; physical none** | **S0-I9R-01** |
| 5 retry after movement denial, credential renewed | **RELEASED on the pickup issued before the disqualification** | **S0-I9R-01** |

For comparison, `verifyPickupAuthorization` on the same denial leaves STOPPED with attempt [STOPPED]: it returns
`movement_denied` from its transaction and throws after commit (`pickupAuthorizationService.ts:767`, :865).

**S0-I9R-01 (High, new).** On denial, reconciliation writes the STOPPED attempt, STOP physical record and STOPPED
status through `tx`, then throws the 409 inside the same `$transaction` (:491–:541). PostgreSQL rolls all of it
back: no durable STOP, no audit (the audit at :612 is never reached), and the pickup stays PENDING. Impact: the
denial leaves no record, and the pre-disqualification credential remains usable, contrary to the approved rule that
corrected qualification requires fresh authorization (reproduced: renewed credential → same pickup RELEASED).
Movement is always live-evaluated, so no ineligible driver/equipment moved. **Correction:** return a
`movement_denied` result from the transaction and throw after commit, as `verifyPickupAuthorization` does.

## 4. S0-I9-02 — equipment status authority

**Original mechanism:** `setEquipmentStatus` authorized any fleet member from session claims; a DRIVER cleared
OUT_OF_SERVICE.

**Remediation:** `requireEquipmentStatusMutationRole` (`equipmentService.ts:45`) reads the ACTIVE membership of an
ACTIVE user in the equipment's fleet from the database inside the transaction; DRIVER always 403; restore roles
FLEET_ADMIN, FLEET_OPERATIONS, FLEET_MANAGER, BOF_OPERATIONS, BOF_COMPLIANCE_REVIEW; DISPATCH may only downgrade.
The open-critical-condition check moved inside the equipment lock.

Evidence:

| Check | Result |
| --- | --- |
| DRIVER restore from OUT_OF_SERVICE / UNAVAILABLE; DRIVER session claiming FLEET_ADMIN | 403 ×3, status unchanged |
| INACTIVE / INVITED membership, SUSPENDED user, no membership, fleet B admin claiming fleet A, BOF_OPERATIONS member only elsewhere | 403 ×6 |
| Each restore role, from OUT_OF_SERVICE and UNAVAILABLE | AVAILABLE ×10 |
| DISPATCH downgrade AVAILABLE→UNAVAILABLE→OUT_OF_SERVICE | allowed |
| DISPATCH restore OUT_OF_SERVICE→AVAILABLE, UNAVAILABLE→AVAILABLE | 403, unchanged |
| Open critical condition; condition committed while the restore waits on the lock | 422, OUT_OF_SERVICE |
| I-8: DISPATCH downgrade after pickup issue | pickup CANCELLED |
| **K: DISPATCH "AVAILABLE" waiting on the lock while a fleet admin's OUT_OF_SERVICE commits** | **allowed; final AVAILABLE; audit `AVAILABLE->OUT_OF_SERVICE`, `AVAILABLE->AVAILABLE`** |

**S0-I9R-02 (High, residual S0-I9-02).** The intent (restore/downgrade/other) is computed from `equipment.status`
read before the transaction (:178–:180); the role check (:190) and lock (:191) follow. A DISPATCH request for an
already-AVAILABLE unit is classified "other" and allowed; if a downgrade commits while it waits, it writes
AVAILABLE, silently reversing the safety downgrade with an audit claiming `AVAILABLE->AVAILABLE` (:244). Release
then sees AVAILABLE. **Correction:** after `lockEquipmentSafetyWrite`, re-read the equipment, compute intent and
`previousStatus` from the locked row, then run the role check.

Also (Low): DISPATCH may set OUT_OF_SERVICE→UNAVAILABLE ("downgrade" intent), which re-enables planning
assignment (I-5 allows UNAVAILABLE); movement stays blocked.

## 5. Full-suite reconciliation (52 committed test files, 274 tests)

| Run | Result |
| --- | --- |
| Original I-9 procedure: `npx tsx --test --test-concurrency=1 <files>` | **274 pass, 0 fail** |
| Default parallel (`npx tsx --test <files>`, 4 workers) ×3 | 273 pass, 1 fail each (`requisition-persistence`) |
| `--test-concurrency=8` ×2 | 273 pass, 1 fail each (`requisition-persistence`) |
| `requisition-persistence` alone ×3 | pass ×3 |
| `sambaIntelligence` alone ×3, `sambaIntelligence2` alone ×3 | pass ×6 |
| Samba/unified/FMCSA files concurrently (4 workers) ×6 on `0ed96a92` | 5 of 6 runs fail, varying tests |
| Same ×4 on I-8 `4b07c2f0` | 4 of 4 runs fail |
| `stage0.i9-recertification` ×3 (+1 after `todo` marking) | 12 pass, 2 defect reproductions |
| PostgreSQL `deadlocks` counter for the database | 0 |
| `tsc`, `npm run typecheck`, ESLint (`--max-warnings=0`) on changed files, `next build` | pass |

- `requisition-persistence`: **shared-database interference / pre-existing test-harness defect** (S0-I9-09). It
  compares `prisma.driver.count()` before/after (expected 3, actual 5 in parallel); deterministic in parallel,
  passes alone and sequentially.
- `sambaIntelligence.certification`: **shared-database interference, pre-existing.** Not reproduced in full-suite
  runs on the clean database, reproduced when the files that evaluate the shared foundation `fleet-a` run
  concurrently; the identical failures occur on I-8, and the remediation does not touch Samba, integration or
  pickup-authorization code. Not an application defect.

## 6. Remaining original findings

| ID | Status after remediation |
| --- | --- |
| S0-I9-03 condition lifecycle validation | Open, unchanged (Medium) |
| S0-I9-04 post-commit audit handling | Open (Medium); reconciliation's audit also lost on denial (S0-I9R-01) |
| S0-I9-05 pre-trip completion concurrency | Open, unchanged (Medium) |
| S0-I9-06 stale unconditional status updates | Open (Low); reconciliation path now conditional |
| S0-I9-07 legacy `writeDispatchRelease` | Open, unchanged (Low) |
| S0-I9-08 pending pickups after unassign | Open, unchanged (Low) |
| S0-I9-09 test isolation | Open; extended to the Samba/unified files on `fleet-a` |

Other (Low): the non-identity-matched reconciliation branch sets AUTHORIZED without `authorizeMovement`; any later
RELEASED still requires it.

## 7. Certification

- **Implementation certification: FAIL.** S0-I9R-02 leaves the S0-I9-02 defect class exploitable by a role the
  remediation forbids from restoring; S0-I9R-01 is a newly introduced authorization-lifecycle defect.
- **Integration test health:** sequential suite green; parallel-mode failures are pre-existing shared-database
  interference.
- **Production readiness:** D-1…D-5, sweep scheduling, service account, post-commit audit reliability,
  Preview/production isolation, deployment fingerprint and legal/operational review remain incomplete.

Production deployment is not authorized by this certification.
