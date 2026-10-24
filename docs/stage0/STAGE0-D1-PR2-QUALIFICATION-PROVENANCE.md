# Stage 0 D-1 PR 2 — qualification finding provenance

Lineage: D-1 PR 1 `b27e658f` (certified PASS WITH CONDITIONS at `6d04b561`) → Commit A (Windows test portability) → Commit B (this PR).
Additive and read-only. No existing production file is modified, no schema change, no migration, no data written.
The authoritative qualification status, reason codes, movement authorization, assignment, release, pickup, I-7/I-8 invalidation, I-9R protections, the D-2 production ENFORCE lock and the empty D-2 override allowlist are untouched.

## 1. Existing provenance sources

| Evidence | Where | Provenance it carries |
| --- | --- | --- |
| Document | `DriverDocument` | `type`, `status`, version chain (`previousVersionId`, `supersededAt`), `uploadedAt`, `verifiedByUserId`, `verifiedAt`, `verifiedFromSourceAt`, `certifiedByUserId`, `certifiedAt`, `verificationExpiresAt`, `checksum`, `fleetId` |
| Verification record | `VerificationSource` (FK to document, license, medical, drug test, or requirement) | `providerName`, `providerType`, `verificationMethod`, `verificationStatus`, `isCertifiedProvider`, `verifiedAt`, `verifiedByUserId` |
| Requirement row | `DriverIntakeRequirement` | `requirementType`, `status`, `satisfiedByDocumentId`, `exceptionReason`, `verificationStatus`/`verificationTimestamp` (free text), `expiresAt` |
| Structured records | `DriverLicense`, `MedicalQualification`, `DrugTestRecord` | `status`, `verificationStatus`, `expirationDate`; **no** verifier or verification time of their own |
| Employment / disqualification | `WorkHistory`, `AccidentHistory`, `ViolationHistory` | status and dates only; **no** verification fields |
| Registry | `MANDATORY_QUALIFICATION_EVIDENCE` | requirement key, evidence source, provisional citation |
| Decisions | `DriverIntake.isComplianceCertified*`, audit events | prior certification (compared in the PR 1 inventory) |

Gaps recorded rather than filled: structured records and work-history rows have no verifier/time; there is no field recording *which rule or person created* a requirement row, so row **origin** is unknown beyond "an intake requirement row"; `DriverIntakeRequirement.verificationStatus` is free text.

## 2. Classification contract

Files: `lib/services/qualificationFindingProvenance.ts` (pure), `lib/services/driverQualificationProvenanceService.ts` (read-only loader). PR 1 types are reused unchanged.

Per finding (`FindingProvenance`): `code`, `category` (MANDATORY | ADMINISTRATIVE | UNCLASSIFIED), `classificationReason`, `evidenceState` (PR 1 vocabulary, separate from category), `requirementId`, `origins`, `attribution`, `sourceEvidence`, `sources[]`, `relatedRegistryRequirementHint`.

- `attribution`: `AUTHORITATIVE_MAPPING` (registry or disqualification rule), `RULE_REPLAY` (legacy code attributed to a record), `UNATTRIBUTED`.
- `sourceEvidence`: `RECORDED` (records cited), `NONE_RECORDED` (the finding is about absent evidence; nothing is cited), `UNKNOWN` (source could not be established).
- `sources[]` (`SourceRef`): `kind`, real record `id`, record `status`, `verification` (status, verifier ids, linked `VerificationSource` rows), `timestamps` (the record's own fields), `origin`, `fleetMatchesDriver`. Identifiers are only copied from existing rows; a test asserts every cited id exists in that driver's records.
- Per mandatory item (`ItemProvenance`): `provenanceState` is the only place verified provenance is asserted: `VERIFIED` (current evidence with a recorded verifier and verification time), `INCOMPLETE` (current evidence whose verifier/time is not recorded, or employment history whose rows carry no verification fields), `NOT_VERIFIED`, `MISSING`, `CONFLICTING` (including a record belonging to another fleet).

How legacy findings are attributed without touching the legacy evaluator: the unchanged `evaluateQualification` is re-run on **one record at a time** (a requirement with its related documents, one license, one medical record with MEDICAL documents, one drug test, one document, one verification source). A legacy code is attributed to a record only if the evaluator itself emits that code for that record alone. A code no record produces stays `UNATTRIBUTED / UNKNOWN`.

## 3. Mandatory requirement mapping

A finding is MANDATORY only when it maps to:
- the BOF mandatory registry: `DRIVER_LICENSE`, `MEDICAL_CERTIFICATE`, `PRE_EMPLOYMENT_DRUG_TEST`, `EMPLOYMENT_APPLICATION`, `CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY`, `ROAD_TEST_OR_EQUIVALENT` (`registry key` is the requirement identifier; `origin = BOF_MANDATORY_REGISTRY`);
- the evaluator's employment-history rule (`WORK_HISTORY_MISSING`, `WORK_HISTORY_INCOMPLETE`; `BOF_EVALUATOR_RULE`);
- an independently established disqualification rule: `DISQUALIFYING_ACCIDENT`, `DISQUALIFYING_VIOLATION`, `PRE_EMPLOYMENT_DRUG_TEST_REJECTED` (`DISQUALIFICATION_RULE`).

Everything is `PROVISIONAL_PENDING_LEGAL_REVIEW`; the registry's completeness is **not** established (`regulatoryCompleteness: "NOT_ESTABLISHED"` on every report, with the PR 1 known gaps such as annual MVR review).

Not mandatory by wording or by attribution: `MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `DRUG_TEST_PENDING`, `MANUAL_REVIEW_REQUIRED`, `DOCUMENT_REJECTED`, `DOCUMENT_EXPIRED`, `LICENSE_INVALID`, `MEDICAL_EXPIRED`, `QUALIFICATION_RULES_NOT_MET`, `REQUIREMENT_EXCEPTION`, `WORK_HISTORY_GAP_REVIEW_REQUIRED`. Even when replay pins a code to a specific record, the finding stays `UNCLASSIFIED` with a reason (`NO_APPROVED_MAPPING_INTAKE_REQUIREMENT | _STRUCTURED_RECORD | _AGGREGATE_RULE | INTERNAL_POLICY_FLAG_NOT_MAPPED | SOURCE_UNATTRIBUTED | EVALUATOR_CONTEXT_CODE`). A structured-record finding (for example `MEDICAL_EXPIRED` from a `MedicalQualification` row) carries only a *hint* (`MEDICAL_CERTIFICATE`); it does not become mandatory, because the registry evaluates the document, not the structured row.

## 4. Proposed administrative mapping (for BOF compliance review; inert)

`PROPOSED_ADMINISTRATIVE_MAPPING` in `qualificationFindingProvenance.ts` is documentation as data. Nothing reads it; `APPROVED_ADMINISTRATIVE_CLASSIFICATIONS` stays empty; `administrativeClassificationActive` is `false` in every report; a test asserts the classification module never references the proposal.

| Requirement type | Proposal | Why / open question |
| --- | --- | --- |
| `IDENTITY_SUPPORTING` | Requires legal determination | May be an onboarding item or support a mandatory credential check |
| `OTHER` | Keep unclassified | Generic type; only the free-text label distinguishes it, which is not authoritative |
| `ACCIDENT_HISTORY` | Requires legal determination | Related to the safety-performance-history inquiry; likely mandatory-adjacent |
| `VIOLATION_HISTORY` | Requires legal determination | Related to annual driving-record review (potential registry gap) |
| `CARRIER_ORIENTATION` (fixture-only) | Requires carrier policy source | Carrier-specific; no authoritative carrier policy source exists |
| Exception on a non-registry requirement | Keep unclassified | `REQUIREMENT_EXCEPTION` is only as classifiable as the requirement it excuses |

No entry is proposed as an outright administrative item: the code and data model give no authoritative basis, so the safest proposal is to approve none until compliance decides.

## 5. Unknown and conflicting evidence

- Unknown code, no record, no intake, or an incomplete evaluation: `UNCLASSIFIED`, `attribution = UNATTRIBUTED`, `sourceEvidence = UNKNOWN`; items `UNKNOWN`/`MISSING`.
- Absent evidence (for example `DRIVER_LICENSE_MISSING`): MANDATORY, `sourceEvidence = NONE_RECORDED`, no source id is invented.
- Conflicts (PR 1 detector: multiple live versions, structured-vs-document contradiction, requirement claiming satisfaction without a verified document, waiver on a mandatory item) and cross-fleet records: the item is `CONFLICTING` and can never be `VERIFIED`.
- Verified status with no recorded verifier/time: `INCOMPLETE`, not verified.

## 6. Existing enforcement compatibility

The evaluator, `qualificationService`, `authorizeMovement`, the D-2 policy/config, and the I-7/I-8 services have zero diff and import neither new module (asserted by a source-pin test). The loader runs the unchanged evaluator, writes nothing, takes no lock and stores no snapshot; fleet summaries run in a READ ONLY, REPEATABLE READ transaction. No new authorization path exists: every report states `authorizesMovement: false` and `enablesSoftOverride: false`.

## 7. Tests and results

`lib/services/stage0.d1-pr2-provenance.test.ts` (19 tests): mapping completeness; absence stated not invented; generic legacy/unknown stays unclassified; incomplete evaluation; administrative inactive and proposal inert; D-2/ENFORCE and additivity; verified, incomplete, expired, pending, missing and unlinked provenance with exact record ids; verification sources cited only when present; legacy attribution to the exact record; structured-record hint without mandatory status; conflicts and cross-fleet records never verified; no-intake unknown; finding codes equal the evaluator's and no cited id is invented; evaluator and movement decisions unchanged before/after; fleet isolation; no mutation, read-only enforcement and reproducibility; production ENFORCE and empty allowlist.

Commit A (Windows portability): replaces the `npx` subprocess in the PR 1 script test with the current Node binary plus the parent process's loader flags — no shell, no `.cmd` shim, no PATH lookup; environment variables are removed instead of set to `undefined`. The Windows failure could not be reproduced on this Linux host; the cause is the `npx` `.cmd` shim, which `execFileSync` cannot launch without a shell on Windows. All script safeguards are unchanged and still asserted. 

Results (local isolated `bof_dev`, PostgreSQL 16, 30 migrations, sequential per-file runs):

| Run | Result |
| --- | --- |
| D-1 PR 1 tests after Commit A | 21/21 (repeated) |
| Full regression after Commit A (56 files) | 330 pass, 0 fail |
| Commit A typecheck / changed-file lint / Prisma validate / production build | pass / pass / valid / pass |
| PR 2 tests | 19/19, three consecutive runs |
| Full regression after Commit B (57 files) | **349 pass, 0 fail** |
| Commit B typecheck / changed-file lint (`--max-warnings=0`) / Prisma validate / production build | pass / pass / valid / pass |

Windows execution itself was not possible on this Linux host and has not been run; Cursor's Windows run is the confirmation.

## 8. Regulatory decisions requiring approval

Unchanged from the readiness assessment (13.1–13.12) plus: (a) whether structured records (`MedicalQualification` etc.) may ever satisfy a registry item or only the verified document; (b) which requirement types, if any, are administrative (section 4); (c) whether an exception may be administrative only when its underlying requirement is; (d) whether requirement-row origin must become recorded data; (e) annual MVR review, history period, medical examiner verification, recurring Clearinghouse query, endorsements, DQ-file completeness (PR 1 gap list).

## 9. Remaining prerequisites for backfill

1. Compliance approval (or rejection) of each section 4 entry; until then administrative remains empty.
2. Decision on recording requirement-row origin and structured-record verifier/time (would need a schema change; not made here).
3. A real-data run of the PR 1 inventory and `runFleetProvenanceSummary` on an approved non-production snapshot to size `INCOMPLETE`, `CONFLICTING` and `UNATTRIBUTED`.
4. A defined handling for drivers with live movement authorizations who are not qualified (escalation to the I-7 path).
5. Named operator and audit-in-transaction design (S0-I9-04) for any apply step.
6. Independent certification of PR 1 + PR 2.

## 10. Exact commit SHAs

- PR 1 implementation: `b27e658fe0bb9fd095bb5ce67e4eff9730962be8`
- Commit A (Windows test portability): `bcfb6f2af618a64a1c31bff5ae83332ace507a3d`
- Commit B (this PR): reported in the hand-off message (a commit cannot contain its own hash).
