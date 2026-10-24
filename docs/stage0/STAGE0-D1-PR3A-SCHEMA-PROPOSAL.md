# Stage 0 D-1 PR 3A — Minimum schema proposal

Proposal only. No migration, no Prisma change in PR 3A. Principle: reuse existing models; add the smallest append-only structures only where an existing table cannot carry the fact. Classes: **REQUIRED BEFORE BACKFILL** · **REQUIRED BEFORE HUMAN APPROVAL WORKFLOW** · **OPTIONAL IMPROVEMENT** · **NOT NECESSARY — EXISTING MODEL SUFFICIENT**.

## 1. Field-by-field assessment

| Need | Existing structure | Sufficient? | Classification | Why / what is insufficient |
| --- | --- | --- | --- | --- |
| Requirement origin | `MANDATORY_QUALIFICATION_EVIDENCE`, `MANDATORY_REQUIREMENT_MAPPING` (code); `DriverIntakeRequirement` has no origin field | Registry/evaluator rules: yes. Intake requirement rows: no | **NOT NECESSARY** for backfill if administrative mapping stays code-defined; **REQUIRED BEFORE HUMAN APPROVAL WORKFLOW** if mappings must be approved at runtime | A version-controlled code mapping is reviewable and certifiable. Runtime approval would need a persisted, versioned mapping table |
| Applicable regulatory authority | `provisionalCitation` in code | Yes | **NOT NECESSARY** | Citations are reference data owned by compliance review, kept with the mapping in code |
| Carrier-specific policy origin | None | No | **OPTIONAL IMPROVEMENT** (until a carrier-rule source is authorized — decision 13.7) | No authoritative carrier policy exists to point to; a column without a source would invite invented values |
| Verification source | `VerificationSource` (provider, method, status, certified flag, verifier, time) linked to document, license, medical, drug test, requirement | Yes where used | **NOT NECESSARY** — require use as a data practice | Already links to the evidence it verifies; it cannot link work-history rows, which are covered by the employment-application document |
| Verifier identity / time | `DriverDocument.verifiedBy/At`, `certifiedBy/At`; `VerificationSource.verifiedBy/At` | Documents yes; structured license/medical/drug rows and work history no | **NOT NECESSARY** for documents; for structured rows prefer a `VerificationSource` row over new columns | Adding verifier columns to four tables would duplicate `VerificationSource` |
| Evidence effective / issue date | `uploadedAt`, `verifiedFromSourceAt` (meaning unconfirmed), `testDate` | Partly | **REQUIRED BEFORE BACKFILL** *only if* decision 13.8 shows `verifiedFromSourceAt` is not the credential's issue date | Reconciling history needs to know when a credential was issued/effective, separately from when BOF verified it |
| Evidence expiration date | `DriverDocument.verificationExpiresAt` (BOF verification expiry or credential expiry — ambiguous); structured `expirationDate` | Ambiguous | **REQUIRED BEFORE BACKFILL** (a dedicated credential-expiry date on documents, or an approved statement that `verificationExpiresAt` is it) | The evaluator expires documents on `verificationExpiresAt`; a medical certificate's real expiry may differ, so a backfill could classify wrongly |
| Medical examiner id, certificate issue date | `MedicalQualification.provider` only | No | **OPTIONAL IMPROVEMENT** now; becomes required if medical verification against the National Registry is automated | Needed for the examiner-listing check; manual verification can record it in the verified document |
| Human-review decision, justification, approval | `AuditEvent` (events), `DriverIntake.complianceCertified*` (intake level) | Audit: events yes; queryable per-finding decision no | **REQUIRED BEFORE HUMAN APPROVAL WORKFLOW**: one append-only `QualificationReviewDecision` (fleet, driver, finding code/requirement id, evidence fingerprint, decision, justification, reviewer, second approver, time) | Audit events are not a queryable state and cannot enforce "no apply without an approval"; intake certification is the wrong granularity |
| Audit history | `AuditEvent`, `Stage0EnforcementModeChange` pattern | Yes | **NOT NECESSARY** | Every new structure writes an audit event in the same transaction (S0-I9-04 requires in-transaction audit for any apply path) |
| Backfill execution identity | None | No | **REQUIRED BEFORE BACKFILL**: `QualificationBackfillRun` (fleet, mode dry-run/apply, operator user, started/finished, input fingerprint, policy versions, status) | A run must be attributable, resumable and idempotent; nothing existing identifies a run |
| Prior status / resulting status / proposed change | `DriverQualificationSnapshot` (status, `reasonCodes` Json, `policyVersion`, evaluator) | Partly | **REQUIRED BEFORE BACKFILL**: `QualificationBackfillRecord` (run, driver, prior status + codes, proposed status + codes, evidence fingerprint, review decision id, applied-at, resulting status) | Snapshots use the legacy 4-value disposition (not the authoritative PENDING_COMPLIANCE/CONDITIONAL vocabulary) and have no run/review linkage; overloading them would blur evaluator history with backfill history |
| Requirement document types (MVR, SPH reply, Clearinghouse result, endorsement proof) | `DriverDocumentType` enum | No | **OPTIONAL IMPROVEMENT** — required with whichever gap-matrix requirements BOF approves to model (additive enum values) | Gap items 3, 4, 7, 9, 10 have no document type |
| Disqualification period / authority | `AccidentHistory/ViolationHistory.status` only | No | **REQUIRED BEFORE HUMAN APPROVAL WORKFLOW** if restoration after a period is ever to be decision-supported | Without start/end and authority, restoration cannot be evidence-based and must stay manual |
| Retention / legal hold | None | No | **OPTIONAL IMPROVEMENT** | Deletion is already restricted by relations; a schedule matters only if BOF decides to enforce retention in software |
| Load/equipment requirement attributes (endorsement fit) | `Load.commodityClass`, equipment type | No | **OPTIONAL IMPROVEMENT** (separate from D-1) | Needed only for endorsement-vs-load enforcement |

## 2. Minimum set

Before **any** backfill apply step: `QualificationBackfillRun` + `QualificationBackfillRecord` (two additive tables) and an answer to the expiry/effective-date semantics (a decision, possibly one nullable column).
Before the **human approval workflow**: `QualificationReviewDecision` (one additive table), and a decision on persisting the approved administrative mapping.
Dry-run reconciliation (design phase 2) needs **no** schema: its output can be files or the existing JSON export.

All proposed tables are append-only, fleet-scoped (`fleetId` required), written in the same transaction as their audit event, and referenced by id from each other. No existing column is altered or dropped. None is implemented in PR 3A; each will be justified again, with the migration, in the PR that implements it.

## 3. Rejected additions

- Per-table verifier/verified-at columns (duplicates `VerificationSource`).
- A new qualification-status column on `Driver` (would create a second source of truth beside the evaluator).
- A stored "compliant" flag of any kind.
- Persisting provenance output (derivable on demand from existing rows).
