# Stage 0 D-1 PR 1 — evidence inventory and classification foundation

Base: `bd28b750` (corrected D-2). Additive and read-only: no existing file is modified, no migration, no schema change.
No qualification, movement, invalidation or D-2 enforcement decision changes.

## Files
- `lib/services/qualificationEvidenceClassification.ts` — pure contract: categories `MANDATORY | ADMINISTRATIVE | UNCLASSIFIED`, separate evidence states `VERIFIED_CURRENT | PENDING | MISSING | EXPIRED | REJECTED | CONFLICTING | UNKNOWN`, `classifyQualificationReasonCode`, `summarizeModeledMandatoryItems`, `KNOWN_REGISTRY_GAPS`.
- `lib/services/driverQualificationEvidenceInventoryService.ts` — `detectEvidenceConflicts` (pure), `buildDriverQualificationEvidenceInventory`, `runDriverQualificationEvidenceInventory` (READ ONLY + REPEATABLE READ transaction).
- `scripts/driver-qualification-evidence-inventory.ts` — operator entry point; refuses unless a confirmation flag is given and `BOF_STAGE0_ENVIRONMENT_CLASS` is LOCAL/TEST/STAGING (and `VERCEL_ENV` is not production); prints host/database only.
- `lib/services/stage0.d1-evidence-inventory.test.ts` — 21 tests.

## Contract
- MANDATORY only when a reason code is attributable to a registry key, employment history, or a disqualification check. Everything else (all generic legacy codes, `REQUIREMENT_EXCEPTION`, `WORK_HISTORY_GAP_REVIEW_REQUIRED`, context codes, unknown codes) is UNCLASSIFIED with state UNKNOWN. `APPROVED_ADMINISTRATIVE_CLASSIFICATIONS` is empty, so ADMINISTRATIVE is never produced; UNCLASSIFIED is never soft-override eligible.
- `allCurrentlyModeledMandatoryItemsVerified` is true only if every modeled item (6 registry items, employment history, disqualification) is VERIFIED_CURRENT, no conflict exists, and no finding is UNCLASSIFIED/ADMINISTRATIVE. A failed evaluation yields all UNKNOWN. The result always carries `regulatoryCompleteness: "NOT_ESTABLISHED"`, `authorizesMovement: false`, `enablesSoftOverride: false` and the known registry gaps (annual MVR review, history period, medical examiner verification, recurring Clearinghouse query, endorsements, DQ file). The broader name `allMandatoryQualificationsVerifiedCurrent` is not exposed.
- Conflicts reported (objective contradictions only): multiple live versions with differing status; structured record vs document currency; requirement claims SATISFIED without a verified document; waiver on a mandatory item. A structured row without a document is never verification.

## Inventory
One fleet per run; per driver: affiliation (the single `Driver.fleetId` affiliation; other fleets are never read or reported), evaluator status, per-item state, findings, conflicts, intake count, prior certification contradicted, cross-fleet evidence rows. Aggregate counts have every item and state explicit (zero shown). Driver ids are opt-in; no names or emails. Evaluator results come from the unchanged `getAuthoritativeDriverQualification`, which uses the execution clock, so reproducibility holds for a fixed snapshot and moment (`asOf` is excluded from comparisons). No real counts exist in this PR; the local database was used only with deterministic synthetic fixtures.

## Unresolved (not changed)
Annual MVR review; safety-performance-history period (3 years retained); medical, drug-test, Clearinghouse and employment-history rules unchanged; no grandfathering; no carrier-specific rules; no ADMINISTRATIVE mapping. Decisions 13.1–13.12 of the readiness assessment remain open.
