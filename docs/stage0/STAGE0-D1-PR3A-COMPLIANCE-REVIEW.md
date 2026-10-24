# Stage 0 D-1 PR 3A — Read-only compliance review and export

Baseline: `994a54f50d9b64261937d482d389010aaafa8d99` (D-1 PR 2, certified PASS WITH CONDITIONS). Branch `claude/stage0-d1-pr3a-compliance-review`.
Companion documents: `STAGE0-D1-PR3A-REGULATORY-GAP-MATRIX.md`, `STAGE0-D1-PR3A-SCHEMA-PROPOSAL.md`, `STAGE0-D1-PR3A-BACKFILL-READINESS.md`.

PR 3A changes no qualification, movement, invalidation, D-2 or production-enforcement behavior, activates no administrative classification, adds no migration and no backfill code.

## 1. What was built

| Piece | File | Notes |
| --- | --- | --- |
| Review service | `lib/services/stage0ComplianceReviewService.ts` | Composes the certified PR 1 inventory and PR 2 provenance; adds no qualification logic |
| Endpoint | `app/api/stage0/compliance-review/[fleetId]/route.ts` | `GET ?driverId=&format=json|csv`; delegates entirely to `handleComplianceReviewRequest` |
| Inventory filter | `lib/services/driverQualificationEvidenceInventoryService.ts` (+3 lines) | Optional `driverIds`; absent = unchanged behavior (PR 1 tests unchanged) |
| Tests | `lib/services/stage0.d1-pr3a-compliance-review.test.ts` | 11 tests |

### Access control (reused model, no new role)
Same pattern as the D-2 enforcement service: an **ACTIVE `BOF_COMPLIANCE_REVIEW` membership in the requested fleet**, read from the database for an ACTIVE user, re-read inside the review's read-only transaction. Session-claimed roles are never trusted. Refused (403): `BOF_OPERATIONS`, dispatchers, fleet admin/operations, drivers, inactive/suspended members, non-members, members of other fleets. 401 without a session; 404 for a driver outside the fleet; 422 for a bad format or a fleet over 1000 drivers (narrow with `driverId`). An unknown fleet id is indistinguishable from "no membership" (403). Each refusal writes the same `ACCESS_DENIED` audit record the other Stage 0 BOF services write (an unknown fleet is recorded with a null tenant and the requested id in the details, so a bad id can never turn a refusal into an error); if the audit write itself fails, access is still refused. The endpoint was implementable on the existing authorization model, so it is **not deferred**.

### Read-only guarantee
An authorized review runs in a `READ ONLY`, `REPEATABLE READ` transaction and writes nothing — no snapshot, no lock, no audit row (a test compares row counts and `updatedAt` before and after). Consequence and decision for BOF: successful reviews are therefore **not** access-audited. Audit-on-read would be a write; if BOF wants it, it needs an explicit decision (it could be written after the read-only transaction, outside the review) — see section 6.

### Review content (per driver)
Fleet id; driver id and status; **authoritative qualification status** (from the unchanged evaluator); evaluation completion; intake count; **prior certification contradiction**; cross-fleet evidence rows; for each modeled mandatory requirement: id, citation (provisional), `reviewStatus`, evidence state, provenance state and the supporting records; each finding with category, classification reason, **evidence basis**, and records; unclassified findings; conflicts; employment-history limitations; and a fleet summary. Top-level: evaluation timestamp, `regulatoryCompleteness: "NOT_ESTABLISHED"`, `authorizesMovement: false`, `enablesSoftOverride: false`, `administrativeClassificationActive: false`, a legend, and `notModeledRequirements` (the known coverage gaps, status `NOT_MODELED`).

The six distinctions the assignment requires:

| Distinction | Representation |
| --- | --- |
| Verified requirement | `reviewStatus: VERIFIED` (current evidence **and** verifier + time recorded) |
| Missing evidence | `MISSING_EVIDENCE` (also used when no record exists at all) |
| Incomplete verification provenance | `INCOMPLETE_VERIFICATION_PROVENANCE` |
| Conflicting evidence | `CONFLICTING_EVIDENCE` (including a record from another fleet) |
| Not currently modeled | top-level `notModeledRequirements[].status = NOT_MODELED` |
| Classification not established | `classificationEstablished: false` and `unclassifiedFindings[]` |

Other states shown separately: `EXPIRED_EVIDENCE`, `REJECTED_EVIDENCE`, `PENDING_VERIFICATION`, `UNKNOWN_EVALUATION_INCOMPLETE`. Every driver carries `complianceStatement: "NOT_A_FULL_COMPLIANCE_DETERMINATION"`; no field or text says compliant.

**Defect found and corrected while building this:** for a driver with no intake the evaluator returns only a context code, so PR 1's per-item evidence state was vacuously `VERIFIED_CURRENT`. The review maps "evidence state verified but no record supports it" to `MISSING_EVIDENCE` rather than "incomplete provenance". PR 1/PR 2 outputs are unchanged; this is a presentation rule of the review only.

### Facts versus inference
Each finding has `evidenceBasis`: `AUTHORITATIVE_RULE` (registry/evaluator rule; cited records are recorded facts), `REPLAY_ATTRIBUTED_INFERENCE` (legacy finding pinned to a record by re-running the legacy rule on that record alone — an inference), `UNATTRIBUTED` (record unknown). The legend states this in the export.

### Export and sensitive data
JSON (full) and CSV (one row per requirement, per finding, and per not-modeled gap; same data). Sources are exported as **secure references** (`kind` + record id) plus status, verifier ids, verification-source organization name/method and timestamps. Not exported: names, emails, phone, DOB, license numbers, file names, storage keys, checksums, URLs, credentials. A test searches both formats for those strings. CSV cells are quoted and formula-neutralized (`= + - @` prefixed with `'`).

## 2. Administrative classification review (nothing activated)

The approved mapping (`APPROVED_ADMINISTRATIVE_CLASSIFICATIONS`) is empty; the D-2 allowlist is empty; nothing here connects to D-2. Categories: MANDATORY · ADMINISTRATIVE CANDIDATE · UNCLASSIFIED · REQUIRES REGULATORY REVIEW. A recommendation is not an approval; every row needs a recorded BOF compliance decision (and, where marked, legal review) before any change.

| # | Requirement / finding | Existing reason code(s) | Source of requirement | Possible federal basis | Possible carrier policy | BOF authoritative evidence | Safety implications | Recommended | Approval needed |
| - | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Registry items (CDL, medical, pre-employment drug test, employment application, Clearinghouse query, road test) | `<KEY>_MISSING/_EXPIRED/_REJECTED/_UNVERIFIED/_NOT_COMPLIANCE_VERIFIED/_NOT_RECORDED` | `MANDATORY_QUALIFICATION_EVIDENCE` | Yes (see gap matrix) | — | Registry (provisional pending legal review) | Direct driver eligibility | **MANDATORY** | Legal confirmation of the registry (already provisional) |
| 2 | Disqualifying accident/violation records; rejected drug test | `DISQUALIFYING_ACCIDENT`, `DISQUALIFYING_VIOLATION`, `PRE_EMPLOYMENT_DRUG_TEST_REJECTED` | Evaluator rules | Yes (391.15, part 382) | — | Records set to REJECTED by people | Disqualifying | **MANDATORY** | None to keep; evidence standard for setting REJECTED needs a rule |
| 3 | Employment-history coverage | `WORK_HISTORY_MISSING`, `WORK_HISTORY_INCOMPLETE` | Evaluator rule | Yes (391.21/391.23; period unresolved) | — | `WorkHistory` rows (no verification fields) | Eligibility input | **MANDATORY** | Period (3 vs 10 years) |
| 4 | Work-history gap over 30 days | `WORK_HISTORY_GAP_REVIEW_REQUIRED` | Owner decision (internal) | No — internal flag, not a legal threshold | BOF policy | Code comment records the owner decision | Movement-permitted today | **ADMINISTRATIVE CANDIDATE** (only if the coverage item itself is verified) | BOF compliance approval |
| 5 | `CARRIER_ORIENTATION` requirement (appears in test fixtures) | `MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `DOCUMENT_EXPIRED`, `DOCUMENT_REJECTED` | Intake requirement row; origin unrecorded | Unlikely | Yes | No carrier policy source in the data model | Low if purely orientation | **ADMINISTRATIVE CANDIDATE** | Carrier policy source + BOF compliance |
| 6 | `IDENTITY_SUPPORTING` requirement | same legacy codes | Intake requirement row | Possibly (identity/employment-eligibility rules are largely outside FMCSA) | Possibly | None | Medium: may gate verification of a mandatory credential | **REQUIRES REGULATORY REVIEW** | Legal + BOF compliance |
| 7 | `ACCIDENT_HISTORY` requirement document | same legacy codes | Intake requirement row | Possibly (391.21 accident list, 391.23 records) | — | None | High: tied to disqualification | **REQUIRES REGULATORY REVIEW** | Legal + BOF compliance |
| 8 | `VIOLATION_HISTORY` requirement document | same legacy codes | Intake requirement row | Possibly (391.21, 391.25 annual review) | — | None | High | **REQUIRES REGULATORY REVIEW** | Legal + BOF compliance |
| 9 | `OTHER` requirement | same legacy codes | Intake requirement row; free-text label only | Unknown | Unknown | None | Unknown | **UNCLASSIFIED** | Individual label review |
| 10 | Exception on a non-registry requirement | `REQUIREMENT_EXCEPTION` | `exceptionReason` on a row | Depends on the requirement | Depends | Free-text reason | Movement-permitted today | **UNCLASSIFIED** (administrative only if the underlying requirement is) | BOF compliance |
| 11 | Pending verification, any record | `DOCUMENT_PENDING_VERIFICATION`, `MANUAL_REVIEW_REQUIRED`, `DRUG_TEST_PENDING` | Legacy aggregate rules | Depends on the record | — | Replay can name the record, not its meaning | Depends | **UNCLASSIFIED** | Per-record |
| 12 | Structured license/medical/drug-test findings | `LICENSE_INVALID`, `MEDICAL_EXPIRED`, `DOCUMENT_EXPIRED` (from structured rows) | Legacy rules | Yes — they concern CDL/medical/drug evidence | — | Structured rows lack verifier/time | High | **REQUIRES REGULATORY REVIEW** (must not become administrative) | Legal; decision whether structured rows may satisfy a registry item |
| 13 | Context codes | `QUALIFICATION_RECORDS_MISSING`, `DRIVER_NOT_FOUND`, `DRIVER_FLEET_MISMATCH`, `DRIVER_CONTEXT_REQUIRED`, `QUALIFICATION_RULES_NOT_MET` | Evaluator | — | — | — | Fail-closed | **UNCLASSIFIED** | None |

Net: one MANDATORY group already holds, two ADMINISTRATIVE CANDIDATES (rows 4 and 5) exist, and none is approved.

## 3. Tests and results

`lib/services/stage0.d1-pr3a-compliance-review.test.ts` (11): authorization matrix and audited refusals; fleet isolation and cross-fleet exclusion; verified vs missing/incomplete/expired/conflicting/rejected requirements with exact record ids; unknown and unclassified findings stay unclassified and replay is labelled inference; no full-compliance claim, employment limitations and coverage gaps visible; no sensitive data in JSON/CSV; CSV formula neutralization; request-handling statuses; **zero database writes** and reproducibility; evaluator and movement decisions unchanged; D-2 allowlist empty, production ENFORCE, no decision path imports the review.

Results (isolated local `bof_dev`, PostgreSQL 16, 30 migrations, sequential per-file runs):

| Run | Result |
| --- | --- |
| PR 1 tests | 21/21 |
| PR 2 tests | 19/19 |
| PR 3A tests | 11/11 (three consecutive runs) |
| Full sequential regression (58 files) | **360 pass, 0 fail** |
| Typecheck / changed-file ESLint (`--max-warnings=0`) / Prisma validate / production build | pass / pass / valid / pass (the new route is in the build output) |

## 4. Known limitations

- Whole-fleet reviews evaluate every driver sequentially in one transaction (bounded at 1000 drivers; narrow with `driverId`).
- The review evaluates the *latest intake only*, like the evaluator; older intakes are not shown.
- Replay attribution reflects what the legacy rules emit for one record in isolation; it cannot see rule interactions.
- Verifier ids are internal user ids; whether the verifier still holds an active compliance membership is not shown (the evaluator already treats a lapsed verifier as unverified).
- No UI was built.

## 5. Operating model

BOF performs centralized compliance work for participating carriers, so the review is a BOF-internal instrument scoped one fleet at a time. Carrier roles get no access. Responsibility for any decision taken from a review stays with BOF compliance personnel acting for the carrier; the review records none (no decision workflow exists yet).

## 6. Decisions requiring BOF approval

1. Whether `BOF_OPERATIONS` may also read the review (not permitted now).
2. Whether successful reviews/exports must be access-audited (requires a write outside the read-only transaction).
3. Whether a read-only compliance view for carrier fleet admins is ever wanted (not built).
4. Retention and handling rules for exported files.
5. Rows 4–10 and 12 of section 2.
