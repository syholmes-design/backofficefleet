# Stage 0 D-1 — Compliance qualification backfill: implementation readiness and engineering plan

**Status:** assessment only. No application code, Prisma schema, migration or data was changed. Approval is required before any coding.
**Branch:** `docs/stage0-d1-implementation-readiness` (from `bd28b750`).
**Regulatory note:** every regulatory reference below is a *provisional* pointer for compliance/legal review, not a legal conclusion (the evaluator source says the same).

## 1. Executive assessment

D-1 is **feasible without a new data model and without redesigning the evaluator**, but it is **not ready to start as a "backfill that writes qualification state"**. Three findings drive that:

1. **The authoritative evaluator is a pure read.** `getAuthoritativeDriverQualification` computes status from existing rows on every call and persists nothing (`qualificationSnapshotId: null`). So existing drivers are *already* evaluated by the certified rules. The backfill is therefore mostly a **classification, reporting and human-review exercise on evidence rows**, not a rewrite of qualification decisions. This is the main reason a full redesign is not needed.
2. **The evaluator cannot say *why* a finding blocks.** `PENDING_COMPLIANCE` mixes registry-owned mandatory gaps (`DRIVER_LICENSE_MISSING`, `*_UNVERIFIED`, `*_NOT_COMPLIANCE_VERIFIED`, `*_NOT_RECORDED`, `WORK_HISTORY_*`) with generic legacy codes (`MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `DRUG_TEST_PENDING`, `MANUAL_REVIEW_REQUIRED`, `QUALIFICATION_RULES_NOT_MET`) that fire for mandatory and non-mandatory evidence alike. This is the gap D-2 hit; it is the core of D-1.
3. **A reliable aggregate `allMandatoryQualificationsVerifiedCurrent` is computable** from the six-entry mandatory registry plus the disqualification checks, **provided** the generic legacy findings are first attributed to a source. It can be computed *positively* (all six registry items pass AND no other finding of any kind) with no data-model change. The weaker, useful D-2 claim ("only administrative deficiencies remain") needs per-finding attribution, which needs a small code change, not a schema change.

Real production counts are **not available** to this assessment (no production access; the local dev database contains 3 fleets, 0 drivers, 0 intakes, 0 documents). No counts are invented. Section 5 specifies the read-only report that must be run against an approved *copy* to size the work.

**Classification: READY WITH CONDITIONS** (section 16).

## 2. Exact repository baseline

| Item | Value |
| --- | --- |
| Certified remediation (I-9R) | `53acec36cf7a74c2f5cbfb16f644ccc7a27b0d32` (`cursor/stage0-i9r-remediation`) — PASS WITH CONDITIONS (`STAGE0-I9-FINAL-RECERTIFICATION.md`, 294/294 sequential) |
| Final re-certification report | `74e01899` |
| D-2 enforcement implementation | `c7e570540e4151deb89fe0ae9e1ca120621ad26a` |
| D-2 encoding correction | `bd28b750c30845832f11b5631c3126e00f5b8441` (this branch's parent) |
| Migrations at baseline | 30 (last: `20261023120000_stage0_d2_enforcement_policy`) |
| Evaluator policy version | `bof-stage0-driver-qualification-v1` |
| Production | `ENFORCE`; `PRODUCTION_OBSERVE_PERMITTED=false`; `SOFT_OVERRIDE_POLICY.softReasonCodes` empty — all unchanged |

Open, unrelated and not addressed here: S0-I9-03…09, D-3/D-4/D-5, expiry-sweep scheduling, deployment fingerprint, legal review.

## 3. Existing qualification architecture

Single decision path, certified through I-9:

- **Evaluator:** `lib/services/authoritativeDriverQualificationService.ts` `getAuthoritativeDriverQualification(tx, driverId, fleetId)`. Reads the driver's *latest intake in the fleet* (`createdAt desc, id desc`), its documents, requirements, structured credential rows, work history, and `VerificationSource` rows. Returns `{status: QUALIFIED|CONDITIONAL|PENDING_COMPLIANCE|NOT_QUALIFIED, reasonCodes, summary, conditionalMovementPermitted, policyVersion, evaluatedAt}`.
- **Mandatory registry** `MANDATORY_QUALIFICATION_EVIDENCE` (6 entries, cannot be waived by `exceptionReason` or `isRequired=false`): `DRIVER_LICENSE`, `MEDICAL_CERTIFICATE`, `PRE_EMPLOYMENT_DRUG_TEST`, `EMPLOYMENT_APPLICATION`, `CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY`, `ROAD_TEST_OR_EQUIVALENT`. Document-backed entries require a current, non-superseded `DriverDocument` that is VERIFIED/CERTIFIED, not expired, and verified by an **active `BOF_COMPLIANCE_REVIEW` member of the fleet** who is not the driver (`evaluateEvidenceDocument`). Determination entries require a `DriverIntakeRequirement` row linked by `satisfiedByDocumentId` to such a document.
- **Employment history:** `evaluateEmploymentHistory`, 3-year lookback (`EMPLOYMENT_HISTORY_LOOKBACK_YEARS`), internal 30-day gap review flag (`EMPLOYMENT_GAP_REVIEW_DAYS`, an owner decision, not a legal threshold).
- **Legacy shared rules:** `qualificationService.evaluateQualification(inputs, {registryOwnedRequirementTypes, skipWorkHistoryCheck})` for non-registry requirement rows, structured license/medical/drug-test rows and pending verifications; its reason codes are copied into findings under the mapped status. `BLOCKING_REASON_CODES`, `CONDITIONAL_REASON_CODES={REQUIREMENT_EXCEPTION}`, `PENDING_REASON_CODES`.
- **Disqualification:** any `AccidentHistory`/`ViolationHistory` with `status=REJECTED` across **all** intakes, and a rejected structured drug-test record.
- **Movement:** `dispatchMovementAuthorizationService.authorizeMovement` calls the evaluator (planning and movement composers), then D-2 `decideEffectiveAuthorization` (empty allowlist ⇒ ENFORCE everywhere). Only QUALIFIED, or CONDITIONAL with `conditionalMovementPermitted` (`REQUIREMENT_EXCEPTION`, `WORK_HISTORY_GAP_REVIEW_REQUIRED` only), supports movement.
- **Invalidation:** I-7 `driverMovementInvalidationService`, I-8 equipment, all under advisory locks (equipment sorted, then driver) via `withDriverQualificationLock`.
- **Other qualification-adjacent code (not authoritative for movement):** `qualificationService` snapshot writer (`DriverQualificationSnapshot`), `readinessService` (`DriverReadinessScore`), `driverEligibilityReviewService`, `intakeService`, `requirementService` (+ `ADVANCE_COMPLIANCE_POLICIES` for MEDICAL, DRIVER_LICENSE, DRUG_TEST renewal windows, `windowSource: "configurable-demo-default"`), `driverDocumentVersioningService`, `driverClaimService`, `lib/recruiting-v2/driver-activation-service.ts`.

## 4. Relevant Prisma models and migrations

Authoritative source per field. "Evaluator reads" = used by `getAuthoritativeDriverQualification`.

| Model (schema line) | Key fields | Authoritative for | Evaluator reads |
| --- | --- | --- | --- |
| `Driver` (1191) | `fleetId`, `status` (ACTIVE/INACTIVE/SUSPENDED/ARCHIVED), `userId`, identity fields | Driver identity, fleet membership of the driver record, lifecycle status | fleetId, userId |
| `DriverIntake` (1238) | `stage`, `status` (DRAFT…APPROVED/REJECTED/ARCHIVED), `submittedAt`, `approvedAt/By`, `isComplianceCertified`, `complianceCertifiedAt/By/Notes` | Onboarding workflow; **not** authoritative for qualification (`isComplianceCertified` is not read by the evaluator) | latest intake only; `submittedAt ?? createdAt` as the history anchor |
| `DriverIntakeStage` (1283) | stage history, `changedByUserId` | Onboarding history | no |
| `DriverDocument` (1297) | `type`, `status`, `versionNumber`, `previousVersionId`, `supersededAt`, `verifiedByUserId`, `verifiedAt`, `verifiedFromSourceAt`, `certifiedAt/By`, `verificationExpiresAt`, `nextVerificationDueAt`, `verificationQuality`, `storageKey`, `checksum` | **Evidence of record** and its verification/expiry; versioned, append-only chain | yes |
| `DocumentAuthorization` / `EmployerDocumentMaterialization` | cross-employer document sharing | Sharing consent | no |
| `DriverIntakeRequirement` (1409) | `requirementType`, `isRequired`, `status`, `expiresAt`, `satisfiedByDocumentId`, `exceptionReason`, `verificationStatus` (free text) | Per-intake requirement tracking; determination evidence link | yes (registry determinations, legacy rules) |
| `DriverLicense` (1445) | `licenseNumber`, `state`, `licenseClass`, `expirationDate`, `status`, `verificationStatus` | Structured license data | legacy rules only |
| `DriverEndorsement` (1465) | `code`, `expirationDate` | Endorsements | legacy rules only |
| `MedicalQualification` (1482) | `expirationDate`, `status`, `verificationStatus`, `provider` | Structured medical data | legacy rules only |
| `DrugTestRecord` (1500) | `testDate`, `result` (free text), `expirationDate` | Structured drug-test data | rejected only |
| `WorkHistory` (1520) | `employerName`, `startDate`, `endDate` | Employment history | yes |
| `AccidentHistory` (1536) / `ViolationHistory` (1551) | `status` (REJECTED = disqualifying) | Disqualification | yes (all intakes) |
| `VerificationSource` (2208) | per-record `providerName`, `verificationMethod`, `verificationStatus`, `isCertifiedProvider`, `verifiedAt/By` | Verification provenance (FK to document/license/medical/drug/requirement) | legacy rules |
| `DriverQualificationSnapshot` (1566) | `status`, `reasonCodes` (Json), `policyVersion`, `evaluatedAt`, `evaluatedByUserId` | **Historical** qualification output (legacy evaluator) | no |
| `DriverReadinessScore` (1589) | readiness state/score/reasons | Readiness history | no |
| `FmcsaRegulatoryVerification` (1957) | external FMCSA verification | Carrier-level regulatory data | no |
| `ComplianceGate` (901), `Candidate` (817) | recruiting/compliance gating | Recruiting pipeline | no |
| `Stage0EnforcementPolicy` tables (D-2) | setting + mode-change history | Enforcement mode | no |
| `DispatchAssignment` / `DispatchRelease` | + D-2 shadow/effective columns | Movement decision history | no |

Migrations relevant to qualification: `20260815023140_fix_driver_document_verification_integrity`, `20260816070700_step9_qualification_persistence_correction`, document-versioning and I-series migrations, `20261023120000_stage0_d2_enforcement_policy`.

**Schema observations that matter to D-1:**
- No driver-to-multiple-carrier **affiliation** table exists. Carrier affiliation is `Driver.fleetId` (single fleet, `onDelete: Restrict`) plus `FleetMembership` for users. Multi-carrier drivers are out of scope unless owner confirms they exist (decision 13.9).
- No dedicated **compliance decision** table; decisions are `DriverIntake.isComplianceCertified*`, `DriverDocument.verified*/certified*`, `DriverQualificationSnapshot` rows, and audit events.
- `DriverLicense`, `MedicalQualification`, `DrugTestRecord`, `WorkHistory` rows have **no** `verifiedBy/verifiedAt/source-document` fields of their own; verification provenance for them lives in `VerificationSource` or on the matching `DriverDocument`. The evaluator's mandatory path uses the **document**, not these rows. This means structured expiry dates (`expirationDate`) are *not* what the evaluator checks for registry items; it checks document status/expiry (`verificationExpiresAt`). Divergence between the two is a direct source of "conflicting" evidence (section 6).
- `verifiedFromSourceAt` exists on `DriverDocument` but its use as "date the source system/document was issued" vs "date BOF verified" must be confirmed per writer (decision 13.8).

## 5. Driver and qualification evidence inventory

**Evidence available now:** schema and code only. **Not available:** production or shared-environment counts. The local `bof_dev` has 3 fleets and no drivers, so no meaningful local counts exist, and none are reported.

**Required read-only inventory (to be built in Phase 1, run only against an approved snapshot copy, `SET TRANSACTION READ ONLY`, using the existing `dispatch-impact-report` pattern):** per fleet and per driver status — driver count; drivers with no intake; drivers with multiple intakes (the evaluator uses only the latest); per registry item: no document / document unverified / verified-by-non-compliance / expired / rejected / superseded-only / OK; determination requirements with no row or no linked document; structured-row vs document disagreements (e.g. `MedicalQualification.expirationDate` past while document current, or the reverse); work-history coverage; drivers with active assignments/releases/pickups who are not QUALIFIED today (these are the safety-critical subset, section 9.8); distribution of reason codes.

## 6. Mandatory-versus-administrative classification findings

Existing rules, inspected first:

| Finding source | Examples | Where it is a mandatory item | Where it is not |
| --- | --- | --- | --- |
| Registry (`evaluateEvidenceDocument`, determinations) | `<KEY>_MISSING/_REJECTED/_EXPIRED/_UNVERIFIED/_NOT_COMPLIANCE_VERIFIED/_NOT_RECORDED` | **Unambiguously mandatory** (attributable by key) | n/a |
| Employment history | `WORK_HISTORY_MISSING/_INCOMPLETE` | Mandatory (EMPLOYMENT_APPLICATION) | `WORK_HISTORY_GAP_REVIEW_REQUIRED` is an **internal BOF** policy flag, movement-permitted |
| Disqualification | `DISQUALIFYING_ACCIDENT/VIOLATION`, `PRE_EMPLOYMENT_DRUG_TEST_REJECTED` | Mandatory/disqualifying | n/a |
| Driver context | `DRIVER_CONTEXT_REQUIRED`, `DRIVER_NOT_FOUND`, `DRIVER_FLEET_MISMATCH`, `QUALIFICATION_RECORDS_MISSING` | Treated as hard | n/a |
| **Legacy shared rules** | `MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `DRUG_TEST_PENDING`, `MANUAL_REVIEW_REQUIRED`, `DOCUMENT_REJECTED`, `DOCUMENT_EXPIRED`, `LICENSE_INVALID`, `MEDICAL_EXPIRED`, `QUALIFICATION_RULES_NOT_MET`, `REQUIREMENT_EXCEPTION` | **Cannot be attributed from the code alone** — the code does not carry the requirement type/document type that produced it | Could be carrier-specific, BOF-internal or administrative requirement rows (non-registry `DriverIntakeRequirement.requirementType`), or a *duplicate* of a registry finding |

Classification of the underlying business items (provisional; legal interpretation required where marked):

| Item | Class | Notes |
| --- | --- | --- |
| CDL | Mandatory | 49 CFR 383/391.11 |
| Medical examiner's certificate | Mandatory | 49 CFR 391.41–43. Whether the National Registry/MEC verification is needed vs a copy: **legal** |
| Pre-employment drug test (verified negative) | Mandatory | 49 CFR 382.301; requires verified negative before performing safety-sensitive functions — timing is **legal** |
| Clearinghouse pre-employment query | Mandatory | 49 CFR 382.701; consent/annual query rules: **legal** |
| Employment application / history | Mandatory | 49 CFR 391.21; 3-year vs 10-year safety-performance-history inquiry (391.23): **legal** — current code uses 3 years only |
| MVR / driving record annual review | **Not in registry** | 391.25 annual inquiry/review; absent as a mandatory item — **gap, needs owner/legal decision** |
| Road test or equivalent | Mandatory | 391.31/33 |
| Endorsements (HazMat/tank etc.) | Conditional on load/equipment | Not modelled as mandatory; `DriverEndorsement` read by legacy rules only |
| DQ file completeness, annual review, ongoing random testing | Not modelled | Outside current evaluator |
| Work-history gap > 30 days | BOF internal | Not a regulation |
| `REQUIREMENT_EXCEPTION` on a non-registry row | Administrative/carrier-specific | Movement-permitted by design |
| Carrier-specific requirements | Carrier-specific | Exist only as non-registry `DriverIntakeRequirement` rows; no formal carrier-rule model |
| Renewal advance windows (60/60/0 days) | BOF internal | `windowSource: configurable-demo-default` — not legally derived |

Verdict: the *registry* is a sound mandatory basis; the *legacy-code stream* is the unclassified remainder. Today **no finding is classified "administrative"**; `PENDING_COMPLIANCE` is simply "not provably fine".

## 7. D-1 capability gap matrix

Classes: **A** implemented & verified · **B** incomplete · **C** missing · **D** needs policy/human decision · **E** outside D-1.

| # | Capability | Class | Evidence (file / function / test) |
| --- | --- | --- | --- |
| 1 | Authoritative per-driver qualification at any time | A | `getAuthoritativeDriverQualification`; `authoritativeDriverQualification.certification.test.ts` |
| 2 | Mandatory registry with non-waivable items | A | `MANDATORY_QUALIFICATION_EVIDENCE`, `REGISTRY_OWNED_REQUIREMENT_TYPES` |
| 3 | Compliance-only verification, driver cannot self-verify | A | `evaluateEvidenceDocument`; certification tests |
| 4 | Document versioning/supersession, no overwrite | A | `DriverDocument.previousVersionId/supersededAt`, `driverDocumentVersioningService`; `qualificationEvidenceLocking.certification.test.ts` |
| 5 | Movement authorization, assignment/release/pickup gates, invalidation, fleet isolation, RBAC | A | I-4…I-9; `stage0.integrated.certification.test.ts`, `driverMovementInvalidation.certification.test.ts` |
| 6 | Enforcement mode machinery, empty allowlist, production lock | A | D-2; `stage0.d2-enforcement.test.ts` |
| 7 | Per-finding source/category (mandatory vs administrative) | **C** | `Finding = {code,status}` only; legacy codes unattributed |
| 8 | Aggregate `allMandatoryQualificationsVerifiedCurrent` | **C** (computable) | No field; derivable from registry result — section 8 |
| 9 | Existing-driver inventory report | **C** | No script; `dispatch-impact-report.ts` is a pattern only |
| 10 | Per-field evidence state (verified / derived / unverified / missing / conflicting / human review) | **C** | Document status is the only verified signal; structured rows unreconciled |
| 11 | Detection of structured-row vs document conflicts | **C** | No code compares `MedicalQualification.expirationDate` etc. with the document |
| 12 | Backfill provenance record (what the backfill concluded and when) | **C** | `DriverQualificationSnapshot` has `reasonCodes` Json and `policyVersion` and can carry it; no dedicated entity |
| 13 | Human-review queue for backfill findings | **B** | Compliance verification flow and `driverEligibilityReviewService` exist; no queue of backfill findings or a "reviewed, decision X" record |
| 14 | Dry-run / idempotent / batched / resumable execution | **C** | `scripts/backfill-p1-operating-docs.mjs` is unrelated (operating docs); no D-1 engine |
| 15 | Reconciliation report and certification of results | **C** | — |
| 16 | Compensation / rollback for a mis-classification | **C** (mostly unnecessary if backfill is append-only) | — |
| 17 | MVR / annual review as mandatory item | **D** | not in registry |
| 18 | Safety-performance-history period (3 vs 10 years) | **D** | `EMPLOYMENT_HISTORY_LOOKBACK_YEARS=3` is provisional |
| 19 | Carrier-specific requirement model | **D** | Only free-form `requirementType` rows |
| 20 | Multi-carrier driver affiliation | **D / E** | Single `Driver.fleetId` |
| 21 | Expiry-sweep scheduling / service account | E | outstanding item from I-9 |
| 22 | D-2 override activation (non-empty allowlist) | E | explicitly out of D-1 |
| 23 | D-5 external notification | E | — |

## 8. Proposed qualification classification contract

Goal: smallest reliable contract that preserves enforcement, traces evidence, prevents UNKNOWN becoming a soft override, supports carrier-specific rules and future D-2.

**Not adopted unchanged:** the five proposed categories. Recommended adjustment:

Per finding (additive field on the evaluator's `Finding`, exposed via an *optional* new result property; existing `status`, `reasonCodes`, `conditionalMovementPermitted` remain byte-for-byte compatible):

```
QualificationFinding = {
  code: string                      // existing reason code, unchanged
  status: PENDING_COMPLIANCE|CONDITIONAL|NOT_QUALIFIED   // existing, unchanged
  category: "MANDATORY" | "ADMINISTRATIVE" | "UNCLASSIFIED"
  evidenceKey: string | null        // registry key, or requirementType for non-registry rows
  evidenceState: "VERIFIED_CURRENT" | "MISSING" | "UNVERIFIED" | "EXPIRED"
               | "REJECTED" | "CONFLICTING" | "HUMAN_REVIEW_REQUIRED"
  source: { documentId?, requirementId?, structuredRecordId?, verificationSourceId? }
}
```

Rules:
- `MANDATORY` only when attributable to a registry key or disqualification check. Legacy codes are `MANDATORY` only if they can be tied to a registry-owned type; otherwise `UNCLASSIFIED`.
- `ADMINISTRATIVE` only when explicitly attributed to a non-registry, non-carrier-mandatory requirement row (positively identified), never by elimination.
- `UNCLASSIFIED` (= the proposal's `UNKNOWN_OR_CONFLICTING`) is **hard**: it must never appear in any D-2 allowlist. Anything the code cannot attribute defaults here.
- `HUMAN_REVIEW_REQUIRED` is an `evidenceState`, not a category: it is hard until a recorded compliance decision exists.
- `VERIFIED_CURRENT` is an `evidenceState`; a finding list never contains such an item — it appears only in the per-item evidence summary.
- Carrier-specific requirements: a third `ADMINISTRATIVE`-sibling value `CARRIER_SPECIFIC` is reserved but **not populated** until a carrier-rule model exists (decision 13.7); until then such rows are `UNCLASSIFIED`.

Aggregate: `allMandatoryQualificationsVerifiedCurrent = (every registry item evidenceState == VERIFIED_CURRENT) AND (no disqualification finding) AND (no UNCLASSIFIED finding of kind MANDATORY-capable)`.

**Can it be computed reliably today?** For the *positive* case yes: it is exactly "all six registry items pass `evaluateEvidenceDocument`/determination checks, employment history has no `MISSING/INCOMPLETE` finding, no disqualifying record", all already computed in the loop at the end of the evaluator, so it needs **no schema change**. The existing structured rows (`DriverLicense.expirationDate` etc.) are *not* needed for it and must not be used to upgrade a missing document. For the *negative-but-benign* case (D-2's need — only administrative findings remain) it requires per-finding attribution of the legacy stream; until legacy codes carry their `requirementType`/`documentType`, the answer is "cannot be established" and the allowlist stays empty. That attribution is a localized change in `qualificationService` (return the source with each code), not a redesign.

This contract is read-only metadata. It does not change any decision and does not activate D-2 overrides.

## 9. Backfill architecture

Principle: **the backfill is append-only evidence classification, never a decision writer.** Qualification decisions continue to come from the live evaluator.

9.1 *Inputs:* every `Driver` in scope (fleet-by-fleet), its latest intake, all document versions (including superseded), requirements, structured rows, verification sources, history rows.
9.2 *Per-field reconstruction (B):* for each of the six registry items and employment history, emit `evidenceState` exactly as the live evaluator would, plus the structured-row view and a `CONFLICTING` flag when they disagree. Rules: a missing document is `MISSING`; a structured row alone is at most `UNVERIFIED` (derived), never `VERIFIED_CURRENT`; a superseded-only document chain is `MISSING` with a history note; a document verified by a non-compliance user is `UNVERIFIED` (not verified).
9.3 *Output record:* reuse `DriverQualificationSnapshot` (`reasonCodes` Json can hold the finding list; `policyVersion` e.g. `bof-stage0-d1-backfill-v1`; `evaluatedByUserId` = the operator; `status` mapped, with a nullable `driverIntakeId`) **only if** the owner approves using that table for backfill provenance. The alternative is one new additive table `QualificationBackfillRun/Finding`. Recommendation: reuse snapshots plus audit events in PR 1–2 (no schema change); revisit only if reviewers need queryable per-finding review state.
9.4 *Preservation (D):* nothing in `DriverDocument`, `DriverIntake`, `DriverLicense`, `VerificationSource`, history or audit rows is updated or deleted. Backfill adds snapshots/audit only. Pre-existing decisions (`complianceCertified*`, verified-by) are read and reported, never rewritten. Where the backfill disagrees with a prior decision, it records the *difference* (prior decision vs recomputed state) and raises a human-review item; it does not silently "correct" either.
9.5 *Execution (E):*
 - Dry-run default: computes and reports; writes nothing. Real run requires an explicit flag and an approved report hash.
 - Idempotent: key = `(driverId, intakeId, evidenceFingerprint, policyVersion)`; unchanged fingerprint ⇒ no new row.
 - Batches of N drivers, one transaction per driver, each taking `withDriverQualificationLock` (same lock order as I-2); no cross-fleet transaction; fleet id is a mandatory scope argument and every query is fleet-filtered.
 - Per-driver errors are recorded and skipped; a failed driver never marks itself qualified; run is resumable by cursor.
 - Audit: one run-level audit event plus one per driver written; actor is a named BOF operator (no service account until the open service-account item is decided).
 - Rollback: because writes are additive, "rollback" = mark a run superseded (a new snapshot/audit event), never delete.
9.6 *Reconciliation report:* per fleet — drivers evaluated, per-item state counts, conflicts, drivers whose live status differs from the pre-existing intake approval, drivers with active movement authorizations whose status is not QUALIFIED/permitted CONDITIONAL.
9.7 *Human review:* section 10.
9.8 *Wrongly qualified drivers:* if the backfill (or the live evaluator) shows a driver with an active assignment, release or pickup who is not currently qualified, the run must **not** silently preserve it and must **not** itself cancel anything. It raises a CRITICAL review item and hands off to the existing I-7 `driverMovementInvalidationService` path (BOF Compliance/Operations decision), because that path already carries the locks, STOP semantics and audit. Recommend this escalation be defined and tested before any non-dry run.

## 10. Human-review requirements

Required review items (each blocks the "classified" state for that driver until resolved by an ACTIVE `BOF_COMPLIANCE_REVIEW` member of the driver's fleet, same eligibility rule as the evaluator):
- any registry item `CONFLICTING` (structured vs document, or two current documents of one type);
- any `UNCLASSIFIED` finding;
- verified-by user no longer an active compliance member (the evaluator already treats that as unverified);
- documents verified before verification provenance fields existed (`verifiedByUserId` null);
- drivers with prior approval/certification but now not QUALIFIED;
- drivers with live movement authorizations and a non-qualified result (CRITICAL);
- any item needing legal interpretation (section 13).
A review decision must record reviewer, timestamp, evidence referenced, decision and reason; it must **not** itself set a document to VERIFIED unless the reviewer performs the normal verification action on the document. Reviewing a finding never converts MISSING to verified.

## 11. Implementation phases

| Phase | Reuse | Code | Schema | Tests | Dependencies | Risks | Acceptance | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Evidence inventory (read-only) | `dispatch-impact-report` pattern, Prisma reads | One read-only script/service producing the section 5 report | None | Fixture-DB test: counts per state; asserts zero writes (read-only tx) | Approved snapshot copy | Production data exposure — run only on an approved copy, no PII in output | Report reproducible, no writes, fleet-scoped | 3–4 days |
| 2. Classification contract | Evaluator, `Finding` | Add category/evidenceKey/state to findings + attribute legacy codes in `qualificationService`; compute `allMandatoryQualificationsVerifiedCurrent` as **new optional** result fields | None | Golden test: old fields unchanged for every existing certification scenario; unattributed ⇒ UNCLASSIFIED; aggregate truth table; no change to `authorizeMovement` or D-2 output | Owner decisions 13.1–13.4 | Altering legacy reason-code behaviour; mitigated by additive-only change and byte-compat golden test | All 294 sequential tests unchanged; new tests pass | 5–7 days |
| 3. Backfill engine | Locks, snapshots, audit | Dry-run/apply engine per 9.5 | None (snapshots) or one additive table if owner chooses | Idempotency, resumability, fleet isolation, lock order, failure injection, no mutation of evidence rows, concurrent live movement | Phases 1–2 | Lock contention with live movement; mitigated by per-driver tx and batches | Dry-run == apply result; re-run is a no-op; zero evidence-row diffs | 5–8 days |
| 4. Human-review workflow | Compliance role checks, `driverEligibilityReviewService`, audit | Review-item model/API (BOF compliance only) | Likely one additive table (review item + decision) | RBAC, cross-fleet denial, reviewer-eligibility, audit | Phase 3, owner decisions | RBAC regressions | Reviews recorded with full provenance; cannot upgrade evidence | 6–9 days |
| 5. Reconciliation & certification | All of the above | Reports + independent certification run | None | Independent re-certification suite | Phases 1–4 | — | Signed-off reconciliation per fleet; wrongly-qualified escalations resolved | 3–5 days |

Evaluated-and-changed: the proposed five phases hold. **Recommendation:** merge phase 1 and the contract design review (the report needs the contract's vocabulary), and add an explicit **phase 3b "movement-impact escalation"** (9.8) as a gate before any apply run.

## 12. Required tests

Contract/evaluator: golden compatibility (status, reasonCodes, conditionalMovementPermitted unchanged); unattributed legacy code ⇒ UNCLASSIFIED; MISSING never VERIFIED_CURRENT; structured row alone never verifies; superseded-only chain; verifier no longer compliance; driver-self verification; aggregate truth table (each of 6 items failing in each of 5 ways, plus disqualification).
Backfill: dry-run writes nothing; apply is idempotent; resume after crash; per-driver failure isolation; fleet isolation (two fleets, mismatched fleetId); lock order with concurrent `authorizeMovement`/invalidation; no update/delete on evidence tables (trigger-style assertion on row counts + `updatedAt`); audit completeness.
Safety regression: full sequential suite (294), `stage0.integrated`, I-7/I-8 suites, pickup/physical reconciliation, D-2 suite; production ENFORCE lock; empty allowlist assertion; RBAC (dispatch, driver, fleet admin denied); wrongly-qualified-driver escalation test.
Human review: eligibility, cross-fleet denial, decision recorded but evidence not upgraded.

## 13. Regulatory or policy decisions requiring approval

13.1 Whether MVR / annual driving-record review (391.25) is mandatory in the registry. 13.2 Safety-performance-history period (3 vs 10 years; 391.23) and its source. 13.3 Medical qualification: copy of MEC vs National Registry verification; handling of expired/short-dated cards. 13.4 Pre-employment drug test: timing rule and acceptable evidence; Clearinghouse consent/query cadence. 13.5 Which legacy requirement types are administrative vs carrier-mandatory. 13.6 Retroactive treatment: drivers already approved before the registry existed — grandfathering is **not** recommended without legal sign-off. 13.7 Carrier-specific requirement source of truth. 13.8 Meaning of `verifiedFromSourceAt` vs `verifiedAt`. 13.9 Multi-carrier drivers. 13.10 Whether to reuse `DriverQualificationSnapshot` for backfill provenance. 13.11 Named operator for apply runs (service account is unresolved). 13.12 Authority and process for removing a driver from active movement when the backfill finds them unqualified. All require qualified compliance/legal review; none is resolved here.

## 14. Dependencies and risks

Dependencies: owner decisions above; an approved non-production snapshot to size the problem; D-2 allowlist stays empty throughout; I-9 conditions (S0-I9-03…09) remain open and do not block D-1 but S0-I9-04 (post-commit audit) affects backfill audit reliability — **backfill audit must be written in-transaction**.
Risks: (R1) legacy-code attribution may reveal unexpected overlap — mitigated by defaulting to UNCLASSIFIED; (R2) the evaluator uses only the **latest** intake, so a newer empty intake can make a previously evidenced driver look unqualified (reported, not auto-fixed); (R3) structured rows and documents disagree widely in legacy data; (R4) lock contention with live dispatch; (R5) regulatory misclassification — mitigated by legal review and by never defaulting to administrative; (R6) pressure to use the aggregate for D-2 overrides before certification — keep allowlist empty; (R7) PII exposure in reports — aggregate counts only by default; (R8) shared-DB test interference (S0-I9-09) — use sequential runs.

## 15. Recommended first implementation PR

**PR 1 — Read-only evidence inventory + classification vocabulary (no behaviour change).**
Scope: (a) read-only inventory report (section 5) as a script/service, aggregate counts only; (b) the section 8 types and a pure function computing per-item `evidenceState` and `allMandatoryQualificationsVerifiedCurrent` *beside* the evaluator (not changing it), with a golden test proving `getAuthoritativeDriverQualification` output is unchanged; (c) tests listed in section 12 for those pieces. No schema change, no migration, no writes, no change to `authorizeMovement` or D-2. It is independently certifiable and unblocks every later phase, and it produces the real counts needed to size phases 3–4.

## 16. Final readiness classification

**READY WITH CONDITIONS.**

Why not READY: the legacy reason-code stream cannot be attributed to mandatory vs administrative, MVR/annual review and the history period are undecided, there is no real data inventory, and the wrongly-qualified-driver escalation is undefined.
Why not NOT READY: the architecture needed already exists and is certified; no new data model or evaluator redesign is required; the first PR is a safe, read-only, schema-free change.

Conditions before coding each stage:
1. Approval of this plan and of the PR 1 scope.
2. Owner decisions 13.1, 13.2, 13.10 and 13.11 before phase 2/3; 13.5 before any `ADMINISTRATIVE` category is populated.
3. An approved non-production snapshot for the phase 1 run.
4. Defined escalation path for wrongly-qualified drivers (9.8) before any apply run.
5. D-2 allowlist remains empty and production remains ENFORCE throughout; any change to either is a separately certified decision.
