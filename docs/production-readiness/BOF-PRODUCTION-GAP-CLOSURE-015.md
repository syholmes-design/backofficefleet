# Prompt 015 — Production Gap Closure Registry

**Program:** BOF-ORC-P009-014-MASTER-V1.0  
**Prompt:** 015 PRODUCTION INTEGRATION GAP CLOSURE  
**Branch:** `orchestrator/prompt-015-gap-closure`  
**Predecessor:** Prompt 014 re-exec BLOCKED (`15297b42` / `88821891`)  
**Date:** 2026-09-09  

This registry does not replace Prompt 014. Statuses are remediation statuses, not certification.

---

## A — Load intake → settlement not a connected production workflow

| Field | Record |
|---|---|
| Original Scenario | 014 A |
| Original Failure | DEMO intake/load file/workbook payroll were not a production intake→cash chain. `/loads` 500. Trip-release L001 LIVE: load not found. |
| Root Cause | Operator `(bof)` shell is DEMO JSON (C2). Prisma Load lookup was cuid-only. Primary fleet often has zero LIVE loads. |
| Existing Architecture | `createLoad` / `listLoadsForFleet` / PI intake events; trip-release uses `/api/dispatch/load/:id`. |
| Remediation | `findLoadByOperatorKey` (id, referenceNumber, sourceRecordId). `listAccessibleLoads` + `GET /api/dispatch/operating-spine`. Loads UI consumes LIVE roster separately from DEMO L00x. |
| Files Changed | `lib/services/loadService.ts`, `lib/services/dispatchReleaseService.ts`, `lib/services/dispatchAssignmentService.ts`, `components/loads/LoadsPageClient.tsx`, `app/api/dispatch/operating-spine/route.ts` |
| Data Authority | LIVE Prisma loads AUTHORITATIVE; DEMO L00x DEMO_ONLY; workbook payroll REFERENCE; payment UNSUPPORTED (A2). |
| Validation | Typecheck/lint/prisma pass. Trip-release still 404 for L001 until a Prisma row has that key (not fabricated). |
| Remaining Limitation | No fabricated L001 Prisma row. Successful intake→settlement still needs a real LIVE load. |
| Status | **PARTIALLY REMEDIATED** |

---

## B — Operator / Command Center still DEMO JSON

| Field | Record |
|---|---|
| Original Scenario | 014 / C2 |
| Original Failure | Dispatch/CC treat DEMO T-102 / L001 as the operating picture. |
| Root Cause | ADR-009-001 / C2: `BofDemoDataShell` + `getBofData()` remain the operator shell. |
| Existing Architecture | Canonical DEMO spine + Prisma equipment APIs. |
| Remediation | LIVE spine panel on CC, Dispatch, Loads, Settlements. DEMO T-102 explicitly labeled DEMO_ONLY and not relabeled LIVE. |
| Files Changed | `components/operations/LiveOperatingSpinePanel.tsx`, `CommandCenterV4.tsx`, `DispatchShell.tsx`, `SettlementsPayrollPageClient.tsx` |
| Data Authority | DEMO board remains DEMO. LIVE Prisma is a separate AUTHORITATIVE consumer path. |
| Validation | UI copy distinguishes DEMO T-102 vs LIVE unit numbers. |
| Remaining Limitation | C2 preserved. 014 CERTIFIED still cannot treat DEMO board as production path. Product decision required to replace DEMO board. |
| Status | **PARTIALLY REMEDIATED** / **PRODUCT DECISION REQUIRED** (whether C2 must change for a later 014 pass) |

---

## C — `/loads` HTTP 500

| Field | Record |
|---|---|
| Original Scenario | 014 route check / A / D |
| Original Failure | Production `next start`: 500 `DYNAMIC_SERVER_USAGE`. |
| Root Cause | `auth()` (cookies) on a statically collected page without `force-dynamic`. |
| Existing Architecture | Session-aware `LoadsPage` already intended. |
| Remediation | `export const dynamic = "force-dynamic"` on `/loads` and other `auth()` pages. |
| Files Changed | `app/(bof)/loads/page.tsx`, `loads/[id]/page.tsx`, `dispatch/page.tsx`, `command-center/page.tsx`, `pretrip`, `trip-release`, `operational-chat` |
| Data Authority | Unchanged. |
| Validation | Lint/typecheck. Runtime confirmation after this 015 build + `next start`. |
| Remaining Limitation | None for the 500 cause. |
| Status | **REMEDIATED** |

---

## D — `/drivers` HTTP 500

| Field | Record |
|---|---|
| Original Scenario | 014 D |
| Original Failure | Same `DYNAMIC_SERVER_USAGE`. |
| Root Cause | `auth()` + Prisma on statically collected `/drivers`. |
| Existing Architecture | `listDriverOperationalSummaries`. |
| Remediation | `force-dynamic`; accessible-driver summaries for service roles. |
| Files Changed | `app/(bof)/drivers/page.tsx`, `drivers/[id]/page.tsx`, `driverOperationalReadModelService.ts` |
| Data Authority | Prisma qualification/readiness AUTHORITATIVE when present; DEMO roster DERIVED/DEMO. |
| Validation | Same as C. |
| Remaining Limitation | Empty LIVE roster if the membership fleet has no Driver rows. |
| Status | **REMEDIATED** |

---

## E — Driver eligibility has no durable Prisma mutation

| Field | Record |
|---|---|
| Original Scenario | 014 D |
| Original Failure | No operator mutation; DEMO eligibility only. |
| Root Cause | Snapshots existed (`writeQualificationSnapshot` / `writeReadinessScore`) but required intake evaluation and were not exposed as an operator review mutation. Latest readiness query ignored null-intake scores. |
| Existing Architecture | `DriverQualificationSnapshot`, `DriverReadinessScore`. |
| Remediation | `recordDriverEligibilityReview` + `POST /api/dispatch/driver/:driverId/eligibility`. Roster Mark ineligible / eligible. Auth required. AuditEvent UPDATED. |
| Files Changed | `lib/services/driverEligibilityReviewService.ts`, `app/api/dispatch/driver/[driverId]/eligibility/route.ts`, `DriversRosterTable.tsx`, qualification/readiness write signatures |
| Data Authority | Snapshot/score AUTHORITATIVE LIVE. Reason codes are operator review, not invented CDL facts. |
| Validation | Unauthenticated POST 401. Mutation requires existing Driver row. |
| Remaining Limitation | Cannot run on DEMO `DRV-001` ids. Needs Prisma Driver. |
| Status | **REMEDIATED** (path exists; data-dependent) |

---

## F — LIVE equipment mutation not consumed

| Field | Record |
|---|---|
| Original Scenario | 014 E / I |
| Original Failure | PATCH worked; Dispatch/CC still T-102 OOS. |
| Root Cause | CC used `listMaintenanceAssetSummaries` DEMO spine. Equipment list was primary-fleet only (`bof-service` had 0 rows). LIVE tractor is another fleet. |
| Existing Architecture | `PATCH /api/dispatch/equipment/:id/status`, `listEquipmentForFleet`. |
| Remediation | `listAccessibleEquipment` (service role: all rows). Operating spine GET. LIVE panel on CC/Dispatch. T-102 not copied to LIVE. |
| Files Changed | `equipmentService.ts`, `operating-spine/route.ts`, `LiveOperatingSpinePanel.tsx`, CC/Dispatch |
| Data Authority | Prisma Equipment AUTHORITATIVE LIVE. T-102 DEMO_ONLY. |
| Validation | Spine returns LIVE unit numbers including ASSIGNMENT-TRACTOR when service role. |
| Remaining Limitation | DEMO board assignment still T-102 (C2). |
| Status | **PARTIALLY REMEDIATED** |

---

## G — Durable proof reject → settlement hold

| Field | Record |
|---|---|
| Original Scenario | 014 F |
| Original Failure | Zustand `setSettlementHold`; DEMO L001 already held. |
| Root Cause | PI proof/settlement models existed; no operator reject route. |
| Existing Architecture | `LoadProofOfDelivery`, `Settlement` HELD, PI store. |
| Remediation | `rejectProofAndHoldSettlement` + `POST /api/dispatch/load/:loadId/proof/reject`. Load file form. Settlement LIVE holds on operating spine / settlements page. |
| Files Changed | `proofSettlementHoldService.ts`, `app/api/dispatch/load/[loadId]/proof/reject/route.ts`, `LoadDetailContent.tsx` |
| Data Authority | Prisma proof/settlement AUTHORITATIVE. DEMO overlay remains DEMO. Payment still UNSUPPORTED. |
| Validation | 401 without session. 404 if no Prisma load. |
| Remaining Limitation | Does not mutate DEMO L001. |
| Status | **REMEDIATED** (path exists; LIVE load required) |

---

## H — Safety durable create/remove

| Field | Record |
|---|---|
| Original Scenario | 014 C |
| Original Failure | B2 — not a production capability. |
| Root Cause | Product decision B2. No Safety Event write model. |
| Existing Architecture | Workbook REFERENCE / DEMO telematics. |
| Remediation | None by 015 instruction. Documented: Safety DEMO/REFERENCE must stay separate from LIVE equipment/load/eligibility. |
| Files Changed | Docs only |
| Data Authority | Safety DEMO/REFERENCE. Not LIVE. |
| Validation | Not implemented. |
| Remaining Limitation | 014 Scenario C cannot pass until product authorizes a safety engine. |
| Status | **UNSUPPORTED** / **PRODUCT DECISION REQUIRED** |

---

## I — Payment / cash posting

| Field | Record |
|---|---|
| Original Scenario | 014 G |
| Original Failure | A2 UNSUPPORTED. |
| Root Cause | Product decision A2. `payment: "UNSUPPORTED"`. No operator `recordLoadPayment`. |
| Existing Architecture | Invoice generate (document); factoring HTML; PI `InvoicePayment`. |
| Remediation | None. Connection point if later authorized: existing `recordLoadPayment` / PI payment store behind current `auth()`. |
| Files Changed | Docs only |
| Data Authority | Payment UNSUPPORTED. Invoice REFERENCE_DEMO / document. |
| Validation | Not implemented. |
| Remaining Limitation | 014 G cannot pass without a product-scope change. |
| Status | **UNSUPPORTED** |

---

## J — Customer vs operator divergence

| Field | Record |
|---|---|
| Original Scenario | 014 H |
| Original Failure | Customer L001 Delivered / Invoice Ready vs operator HOLD / T-102 OOS. |
| Root Cause | Different facts: DEMO customer portal vs DEMO operator dispatch. Not one LIVE load. |
| Existing Architecture | `getCustomerVisibleLoads` DEMO; operator canonical DEMO. |
| Remediation | LIVE overlay on `/portals/customer` for Prisma loads matching demo IDs. DEMO cards remain DEMO. Operator HOLD not copied to customer. |
| Files Changed | `app/portals/customer/page.tsx` |
| Data Authority | DEMO customer cards DEMO. LIVE overlay AUTHORITATIVE when a matching Prisma load exists. |
| Validation | Overlay empty until a matching LIVE load exists. |
| Remaining Limitation | Unrelated customer vs operator DEMO facts still differ by design. |
| Status | **PARTIALLY REMEDIATED** |

---

## K — Cross-domain mutation → consumption

| Field | Record |
|---|---|
| Original Scenario | 014 I |
| Original Failure | CC snapshot not mutation-then-consume. |
| Root Cause | CC did not read Prisma. |
| Existing Architecture | CommandCenterV4 DEMO + workbook REFERENCE. |
| Remediation | CC fetches `/api/dispatch/operating-spine` (loads, equipment, holds). |
| Files Changed | `CommandCenterV4.tsx`, `LiveOperatingSpinePanel.tsx` |
| Data Authority | LIVE panel AUTHORITATIVE; DEMO counts remain DEMO. |
| Validation | Panel refresh after LIVE PATCH/eligibility/hold. |
| Remaining Limitation | DEMO KPI tiles still DEMO. |
| Status | **PARTIALLY REMEDIATED** |

---

## L — Trip-release / load persistence

| Field | Record |
|---|---|
| Original Scenario | 014 A / L |
| Original Failure | `/trip-release/L001` Load not found / UNASSIGNED. |
| Root Cause | cuid-only lookup; no Prisma load with sourceRecordId L001. |
| Existing Architecture | Dispatch release services. |
| Remediation | Operator key lookup on load, assignment, release. |
| Files Changed | `loadService.ts`, `dispatchReleaseService.ts`, `dispatchAssignmentService.ts` |
| Data Authority | LIVE load id AUTHORITATIVE. DEMO L001 is not a Prisma id. |
| Validation | L001 still not found until a LIVE row exists. Prisma cuid URLs work. |
| Remaining Limitation | **LIVE DEPENDENCY** for L001 specifically. |
| Status | **PARTIALLY REMEDIATED** |

---

## M — Scenario J recovery not durable

| Field | Record |
|---|---|
| Original Scenario | 014 J |
| Original Failure | Exceptions visible; resolution not persisted. |
| Root Cause | DEMO OOS/safety not durable; trip-release eval stored nothing for missing load. |
| Existing Architecture | Equipment PATCH, eligibility snapshots, proof/hold, dispatch release. |
| Remediation | Durable paths: equipment status, eligibility review, proof reject/hold. DEMO T-102 still not resolvable as LIVE. |
| Files Changed | Services/APIs above |
| Data Authority | LIVE mutations AUTHORITATIVE. DEMO exceptions remain DEMO. |
| Validation | LIVE chains only. |
| Remaining Limitation | DEMO HOLD/OOS recovery still not a LIVE persist. |
| Status | **PARTIALLY REMEDIATED** |

---

## N — Multiple operational representations

| Field | Record |
|---|---|
| Original Scenario | 014 architecture |
| Original Failure | Independent DEMO vs LIVE truths. |
| Root Cause | C2 + PENDING LIVE + workbook REFERENCE. |
| Existing Architecture | ADR-009-001/003. |
| Remediation | Explicit labels + LIVE spine consumer. No second engine. |
| Files Changed | Spine panel, CC copy, customer overlay |
| Data Authority | Table in 015 report. |
| Validation | Copy review. |
| Remaining Limitation | Dual representation remains until C2 is changed. |
| Status | **PARTIALLY REMEDIATED** / **PRODUCT DECISION REQUIRED** |
