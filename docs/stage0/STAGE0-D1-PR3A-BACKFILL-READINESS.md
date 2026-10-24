# Stage 0 D-1 PR 3A — Backfill readiness and active-movement escalation design

Design only. No backfill code, migration, invalidation or dispatch behavior is added. Everything below describes a future, separately authorized and certified implementation.

## 1. What a backfill is — and is not

The authoritative evaluator already computes every driver's status from existing rows on each call; it stores nothing. So a "backfill" does **not** rewrite qualification decisions. Its purpose is to (a) find where historical evidence is incomplete, conflicting, or mis-recorded, (b) route those findings to people, and (c) apply *approved* corrections to evidence records through the existing locked write paths — after which the evaluator, and I-7 where needed, react as they already do. The backfill must never write a status.

## 2. Key finding that shapes the safety design

I-7 (`driverMovementInvalidationService`) is **evaluator-driven**: it re-runs `getAuthoritativeDriverQualification` and invalidates only when the driver is no longer eligible; it "never decides eligibility itself". Consequences:
- A deficiency the evaluator already sees (expired/rejected/missing mandatory evidence, a REJECTED accident/violation) is handled by I-7 automatically when the evidence write goes through `withDriverQualificationLock`, or by the scheduled sweep.
- A deficiency the evaluator **cannot see** (annual MVR review lapsed, endorsement not fitting the load, Clearinghouse annual query overdue — all unmodeled) cannot be held by invoking I-7: the evaluator still says QUALIFIED, so nothing is invalidated.
- There is no manual "compliance hold" record that the evaluator consults. Adding one would change the evaluator and requires its own design and certification (see decision BR-6).

Until such a hold exists, the only existing way to stop an at-risk driver is for an authorized compliance person to record the deficiency as evidence the evaluator understands (for example rejecting or expiring the relevant document with a reason, or recording a REJECTED history entry) through the normal workflow — which triggers I-7. That is a human act with an audit trail, not an automatic consequence of a review.

## 3. Phases

| Phase | Purpose | Design | Prerequisites |
| --- | --- | --- | --- |
| 1. Snapshot | Representative data without touching production | An approved, access-controlled, non-production copy; no production credentials in the repo or to agents; PII minimized; the copy's provenance (source, date, approver) recorded | Written approval of the copy and its handling |
| 2. Dry-run reconciliation | Compare the authoritative result with inventory and provenance and produce proposals | Run the PR 3A review per fleet; classify each driver/finding into the four deficiency classes (section 4); output files or JSON only — writes nothing; a run id and input fingerprint make results comparable | PR 1–3A (present) |
| 3. Human review | Decide each unresolved finding | BOF compliance personnel (fleet-scoped `BOF_COMPLIANCE_REVIEW`) record a decision, justification and evidence references; a second person approves safety-relevant changes; decisions are append-only | `QualificationReviewDecision` (schema proposal), approval authority matrix |
| 4. Approved changes | Apply only approved corrections | Per driver, one transaction: lock (equipment then driver, existing order via `withDriverQualificationLock`); re-evaluate and compare the evidence fingerprint to the approved one (abort if changed); write the evidence correction through the existing service, never a status; audit in the same transaction; then the existing I-7 flow runs. **Not implemented.** | Phases 1–3, backfill tables, in-transaction audit |
| 5. Post-application reconciliation | Verify the apply did what was approved | Re-run the review for the affected drivers; expected-versus-actual per record; mismatches become new human-review items; report per fleet | Phase 4 |
| 6. Safety verification | Catch newly ineligible drivers with live movement | Compare each applied driver's new evaluator status with live assignments/releases/pickups; every driver who lost eligibility is listed with the I-7 outcome (hold, cancelled pickup, CRITICAL in-motion escalation) and must have a recorded disposition | Phase 4 plus section 4 procedure |

## 4. Active-movement safety escalation procedure

Applies when historical review finds a deficiency for a driver who has an active assignment, pending dispatch, authorized movement, pickup in progress, or an in-route shipment. Nothing in this section is implemented.

### 4.1 Classes

| Class | Definition | Examples | Treated as |
| --- | --- | --- | --- |
| **A. Confirmed disqualification** | Established from authoritative evidence | Loss of CMV privilege on an MVR/CDLIS record; REJECTED accident/violation entry backed by evidence; Clearinghouse prohibited status; verified positive/refused test | Safety event: immediate escalation, hold |
| **B. Potential disqualification** | Serious deficiency, not yet established | MVR shows a possible suspension awaiting confirmation; medical certificate past expiry per dates but electronic status unknown; Clearinghouse result unreadable | Urgent review within a defined window; hold decision made by a human immediately |
| **C. Administrative deficiency** | Documentation issue that does not independently establish disqualification | Missing orientation record; unsigned form where the underlying fact is evidenced | Queue for correction; no movement action |
| **D. Unknown or conflicting evidence** | Cannot be resolved from the records | Structured vs document contradiction; evidence from another fleet; missing historical document | Investigate before any determination; **a missing historical document alone is never proof of disqualification** and never triggers automatic disqualification |

Classification is a *human* determination informed by the review (`evidenceBasis`, `reviewStatus`); the system does not assign A/B automatically, and replay-attributed findings (inference) can never alone establish class A.

### 4.2 Procedure

| Question | Design |
| --- | --- |
| Who receives the alert? | For A and B: the fleet's `BOF_COMPLIANCE_REVIEW` members (decision makers) and `BOF_OPERATIONS`; the carrier's fleet owner/admin and dispatch contact are notified through the existing operational chat/notification channel used by I-7 and D-2 (roles SAFETY, BOF_OPERATIONS, FLEET_OWNER). C and D go to the compliance queue only. |
| Who may review? | Active `BOF_COMPLIANCE_REVIEW` of that fleet. A second compliance reviewer (or `BOF_OPERATIONS` lead) approves any class A decision that changes evidence. Carrier users cannot clear, restore or classify. |
| Is dispatch blocked pending review? | **A**: yes, immediately — via the existing evidence path so I-7 fires (reject/expire the evidence with a reason). **B**: a human must decide at once whether to place the evidence in a state the evaluator rejects; because no manual hold exists (section 2), this is the largest open gap — until it is closed, B relies on that human act and on telephone/chat escalation to dispatch. **C/D**: no block; keep current evaluator outcome. |
| How is I-7 invoked? | Never directly by the review. The evidence correction goes through the locked write path (`withDriverQualificationLock`, trigger recorded), which calls `invalidateDriverMovementAuthorizations`; the scheduled sweep covers time-based expiry. I-7 then applies its table: ASSIGNED → hold exception; RELEASED → BLOCKED release; PICKUP_ISSUED → pickup cancelled with a reason; IN_MOTION → no automatic stop, CRITICAL escalation requiring a documented operational disposition. |
| In-progress movements? | The system never stops a moving vehicle. For IN_MOTION the CRITICAL escalation goes to dispatch, compliance and carrier management; a named person documents the disposition (continue to a safe stop, hold at destination, etc.). The review adds the evidence and class to that record. |
| How is the carrier notified? | Through the existing notification mechanism, with the finding class, requirement id and evidence references (not documents) and the required action; the carrier is told what is held and what it must not do; wording reviewed by BOF compliance. |
| How is the decision recorded? | A `QualificationReviewDecision` (once it exists) with class, justification, evidence references, reviewer and approver, linked to the audit events and the I-7 exception. Before that table exists, the decision is the audit event plus the I-7 exception notes. |
| How is evidence preserved? | Documents are versioned and never overwritten; the review output is saved with its fingerprint and timestamp; the pre-change snapshot of the affected rows' ids/statuses is stored in the backfill record; nothing is deleted. |
| How is unauthorized restoration prevented? | I-7: corrected qualification does **not** reinstate anything; a fresh release and new pickup authorization through `authorizeMovement` are required. Restoration of the *evidence* (re-verifying a document) is only by an active compliance member under the existing verification rules; backfill runs cannot restore, only record approved corrections; no actor in a carrier role can clear a hold. |

### 4.3 Hard rules
- No automatic disqualification from a review or a dry run.
- No unsafe continuation: class A is acted on at once; class B gets a human decision at once.
- A review finding never edits a status; only evidence changes through the existing services.
- Every action is audited in the same transaction as the write.

## 5. Required safeguards for any apply step

| Safeguard | Design |
| --- | --- |
| Fleet isolation | One fleet per run; every query fleet-scoped; operator needs active `BOF_COMPLIANCE_REVIEW` in that fleet; cross-fleet rows are conflicts, never touched |
| Idempotency | Key = (fleet, driver, approved decision id, evidence fingerprint); re-running changes nothing; a changed fingerprint aborts that driver |
| Concurrency | Per-driver advisory lock in the existing order (equipment, then driver); live dispatch and I-7 serialize with the apply |
| Transaction boundaries | One transaction per driver: re-check approval and fingerprint, write evidence correction, backfill record, audit event; no cross-driver transaction |
| Auditability | Audit event per change in the same transaction (S0-I9-04 warns against post-commit audit) |
| Operator identity | Named human operator; no shared service account until the service-account decision is made |
| Approval authority | Recorded decision by a compliance reviewer; second approver for safety-relevant changes |
| Failure recovery / partial execution | Resumable by run id; a failed driver is marked failed and skipped, never marked complete; run summary lists applied, skipped, failed |
| Evidence preservation | No deletes or overwrites; superseded versions retained; prior status and codes stored per record |
| Reconciliation reporting | Expected vs actual per record and per fleet; unresolved items stay in the review queue |
| Escalation | Phase 6: any driver who lost eligibility while holding live movement is escalated per section 4 |

## 6. Reversible corrections versus safety events

| Reversible administrative corrections | Not undoable by restoring data |
| --- | --- |
| Correcting a mis-labeled document type; linking evidence to the right requirement; recording a verifier/time that was verified but not recorded; fixing a duplicate version | A cancelled pickup, a BLOCKED release, a hold or CRITICAL exception, a notification already sent, a driver already removed from a load, or a vehicle already moving |
| May be reverted by an approved compensating correction (new version, audit entry) | Must be handled by a new, human-approved operational decision; restoring the database would hide that the safety event happened and is prohibited |

Rollback therefore means a compensating, audited correction — never a database restore. Once Phase 4 has triggered I-7, the invalidation stands until a fresh release and pickup authorization go through `authorizeMovement`.

## 7. Prerequisites checklist (before any apply implementation)

1. Approved non-production snapshot and handling rules.
2. Compliance decisions on the administrative classification review (companion document, section 2) and the open regulatory decisions.
3. Decision on expiry/effective-date semantics (schema proposal).
4. `QualificationBackfillRun/Record` and `QualificationReviewDecision` designed and certified (migrations in their own PR).
5. Approval authority matrix (who, how many approvers) and a named operator.
6. A manual compliance-hold mechanism or an explicit accepted procedure for class B (decision BR-6).
7. In-transaction audit for the apply path.
8. Reconciliation report format and acceptance criteria agreed.
9. Independent certification of the review/export (PR 3A) and of each later phase.

## 8. Decisions requiring BOF approval

- **BR-1.** Approve the four-class deficiency definitions and the alert/authority table (section 4).
- **BR-2.** Approve one or none of the administrative candidates (companion review, rows 4 and 5); no activation is implied.
- **BR-3.** Which regulatory gap-matrix items BOF will model next, and in what order.
- **BR-4.** Second-approver rule and named operators.
- **BR-5.** Whether access to reviews is itself audited.
- **BR-6.** Whether to design a manual compliance hold that the evaluator consults (changes the evaluator; its own certification).
- **BR-7.** Carrier notification wording and channels.
- **BR-8.** Snapshot source and handling.

## 9. Recommended next phase

PR 3B (not started): after BOF decisions BR-3 and the expiry-semantics answer, implement the **dry-run reconciliation report** — a read-only, per-fleet comparison and queue export — and, in a separate PR, the design-certified `QualificationBackfillRun/Record` tables. Do not implement apply, human-approval workflow or a manual hold until decisions BR-1, BR-4 and BR-6 are made.
