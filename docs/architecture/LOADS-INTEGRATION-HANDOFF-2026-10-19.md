# Loads recovery and integration: handoff

Date: 2026-10-19

This prepares the owner-approved three-candidate Loads recovery:
- **A:** late-August Dynamic Load File;
- **B:** September Phase 3D controls;
- **C:** October unified Loads/Dispatch/Finance.

**No Loads architecture was selected or rewritten here.** Every interface below exists on `claude/website-recovery-20261018` and was confirmed by file. Where today's tests or browser runs exercised it, that is stated.

## 1. Interfaces the Loads work must consume (do not duplicate)

| Concern | Canonical interface | Notes |
|---|---|---|
| Driver records | Prisma `Driver`, `DriverIntake`. `lib/services/driverService.ts` (`getDriverByIdForSession`). `lib/services/driverOperationalReadModelService.ts` (`getDriverOperationalSummary`, `listAccessibleDriverOperationalSummaries`). `/api/drivers`, `/api/drivers/[driverId]/operational-summary`. | The live driver file is `/drivers/[id]`. `/drivers/[id]/safety` is demo data. |
| Driver qualification | `lib/services/qualificationService.ts` (requirement-driven: each `DriverIntakeRequirement` needs a verified, unexpired document; licenses, medicals, drug tests, work history and accident/violation records are checked when present). `lib/services/requirementService.ts`. `lib/services/workHistoryService.ts`. | Since 2026-10-19, recruiting activation creates the CDL, medical and employment-verification requirements and fills in `verificationExpiresAt`, so later expiry or rejection disqualifies the driver (verified locally: expired medical → NOT QUALIFIED → assignment 409). |
| Readiness | `lib/services/readinessService.ts` (`writeReadinessScore`, `lockDriverReadinessWrite`). `lib/services/readinessReevaluationService.ts`. | Re-runs after document changes and after work-history entries. |
| Carrier affiliation / tenancy | Prisma `Fleet` (the carrier tenant), `Aggregator`, `AggregatorFleet`, `AggregatorMembership`, `CarrierGroup`. `authorizedFleetAccess` in `lib/services/intakeService.ts`. | **Divergence:** the carrier pages (`/carriers/**`, including the packet pages ported today) read the demo `lib/carrier-registry.ts` (CAR-001…), not Prisma `Fleet`. Loads/dispatch must key on `Fleet`. Reconciling the two carrier models is a Loads/Dispatch decision. |
| Equipment readiness | Prisma `Equipment` (`equipmentType`, `status` AVAILABLE/UNAVAILABLE/OUT_OF_SERVICE). `lib/services/equipmentService.ts`. `lib/services/conditionService.ts` (`ConditionThread` open exceptions). `lib/services/preTripConditionWorkflowService.ts`. | Assignment checks equipment fleet, type and out-of-service status. |
| Dispatch assignment | `lib/services/dispatchAssignmentService.ts` (`createAssignment`: readiness gate under a lock, one active assignment per load/driver/tractor/trailer). `POST /api/dispatch/assignment`; `/api/dispatch/assignment/[id]`, `/unassign`, `/conditions`. `lib/services/dispatchReleaseService.ts`. `lib/services/pickupAuthorizationService.ts`. | Verified today: NOT_READY → 409, READY → 200. Safety, concurrency and pickup certification suites pass. |
| Load records and readiness | Prisma `Load`. `lib/services/loadService.ts` (`findLoadByOperatorKey`). `lib/load-process-intelligence.ts`. `lib/load-process-unified-read-model.ts` (`getUnifiedLoadProcessView`). `lib/live-load-review.ts`. `app/customer-portal/load-intake` and `/api/load-intake/extract` (customer intake). | `rejectDemoOperationalKey`: demo keys (L00x) never resolve in live APIs. |
| Documents / evidence | `lib/process-intelligence/load-to-cash-service.ts` (`recordLoadProof`, `verifyLoadProof`). `lib/services/proofSettlementHoldService.ts` (`assertProofSubmission`, `assertProofCanBeVerified`). `lib/load-trip-packet.ts`. Load document manifests (`lib/load-doc-manifest.ts`, `scripts/generate-load-docs.mjs`). | **ePOD is disabled by owner policy** (`lib/services/epod/**`, fails closed). It needs explicit authorization to change. |
| Settlement readiness | `lib/load-finance-handoff.ts` (`buildLoadFinanceHandoff`, `settlementEligibility`). `lib/services/settlementReadService.ts`. `proofSettlementHoldService`. | Payroll/GL is not integrated (GAP-008). The Paylocity handoff is a preview only. |

## 2. GAP-005: the parallel load-process APIs

| API | Callers | Data | Access |
|---|---|---|---|
| `GET /api/load-process-intelligence/[loadId]` (and `/discovery`) | **5 UI components** (`DispatchOperatingTimeline`, `LoadProcessIntelligencePanel`, `LoadProcessDiscoveryPanel`, two Copilot panels) and `operationalIntelligenceService` | `getLoadProcessIntelligence` (live only) plus `unifiedProcess` from `getUnifiedLoadProcessView`. The latter calls `getTenantLoadProcess` but returns a **summary** (counts, missing stages). | Resolves the load by id, reference number or source record, then checks `authorizedFleetAccess`. Demo keys get 404. |
| `GET /api/operating-process/loads/[loadId]?fleetId=` | **None** in the app | `getTenantLoadProcess`: the **full** event-level reconstruction (events, lineage, supporting records, exceptions, corrective actions, evidence, each tagged with a `recordClass`) | Requires an explicit `fleetId`; tenancy is checked inside the store |

**Relationship:** both are built on the same `getTenantLoadProcess` reconstruction. The first is the one in use and embeds a summary of the second. The second exposes the full timeline, which no screen currently uses.

**Recommendation for the Loads assignment:**
1. Make `getUnifiedLoadProcessView` the single read model, and let it carry the full reconstruction where candidate C's timeline needs it.
2. Serve that model from `/api/load-process-intelligence/[loadId]` only.
3. Delete `/api/operating-process/loads/[loadId]` once the unified model carries the full detail.

It was **not** deleted here: its full-detail payload is the input to that design choice.

## 3. Dependencies that need attention before or during Loads

1. **Two carrier models** (demo registry vs Prisma `Fleet`), above.
2. **Sparse `OperatingProcessEvent` emission** on some fixture loads (GAP-006). Timelines can be empty for loads that have been dispatched.
3. **In-route monitoring has no telematics.** Status and events are manual.
4. **Production environment:** `BOF_EPOD_ENABLED=false` must be set explicitly (`npm run preflight` warns otherwise).
5. **The 20261019120000 migration must be applied before release.** Activation now writes `DriverIntakeRequirement` rows, which uses existing tables, but recruiting needs the new columns.
6. **Fixture rows in local nonproduction `bof_recovery` only:** `verify-load-chain-001` / `verify-tractor-chain-001`, created for the readiness proof. Never in production.
