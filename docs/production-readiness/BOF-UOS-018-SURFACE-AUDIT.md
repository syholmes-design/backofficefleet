# BOF UOS 018 — Complete Surface Inventory

**Prompt:** 018 Phase 1 Surface Audit  
**Governing model (as quoted in Prompt 018):** LIVE | DEMO | WORKBOOK | REFERENCE | DEPRECATED  
**Full attachment** `BOF Product Authority & Operating-System Consolidation Prompt V1.0` was **not found in this worktree**. Classifications below apply that quoted model to **source-verified** surfaces. They are **not** a new software registry.

**Code does not currently stamp most routes with those five UOS labels.** “Currently represented” is inferred from loaders, copy, and APIs. “Recommended (UOS)” is the governing-model target, not an implemented flag.

**Auth default:** operator `(bof)` pages render without page-level auth; LIVE APIs use `auth()`. Cookie-less mutations **401** (014/016 evidence).

| ID | Surface | Route / path | Domain | Represented in code/UI | Recommended (UOS) | Data source | Prisma | Writes | Can decide / mutate LIVE? | Conflicts |
|---|---|---|---|---|---|---|---|---|---|---|
| S-LOAD-01 | Loads roster + LIVE panel | `/loads` | LOAD | Mixed: “authoritative roster” + `LiveOperatingSpinePanel` | **LIVE** roster only | `GET /api/dispatch/operating-spine` → `listAccessibleLoads` | `Load` | none on page | Read LIVE; no write | DEMO L001 file still linked elsewhere |
| S-LOAD-02 | Load file | `/loads/[id]` | LOAD | LIVE when id is Prisma cuid; DEMO when `L001` | **LIVE** for Prisma ids; DEMO keys isolated | `loadService` / `findLoadByOperatorKey`; DEMO fallbacks in load-file UI | `Load` | `POST /api/dispatch/load/:id/proof/reject`; `PATCH /api/dispatch/load/:id` | Mutate LIVE if Prisma id | `/loads/L001` DEMO vs Prisma loads |
| S-LOAD-03 | Trip release | `/trip-release/[loadId]` | LOAD / DISPATCH | LIVE backend copy; L001 **not found** | **LIVE** | `POST/GET /api/dispatch/release/[loadId]` | `DispatchRelease` | POST release | Mutate LIVE if load exists | L001 404 vs DEMO load file HOLD |
| S-LOAD-04 | Dispatch intake packet | `/dispatch/intake` | LOAD | DEMO packet (L004 100% in 014) | **DEMO** (sandbox) or replace with LIVE intake | `DispatchIntakePageClient` / demo packet | not Prisma L00x | packet UI; `/api/intake/*` is recruiting/driver intake, not this packet | Must **not** govern LIVE | Used as 014 Scenario A production path |
| S-LOAD-05 | Load create API | `/api/dispatch/load` | LOAD | LIVE API | **LIVE** | Prisma | `Load` | POST | Yes, `auth()` | Unused by DEMO intake |
| S-LOAD-06 | Load-intake redirect | `/load-intake` | LOAD | Redirect to dispatch intake | **DEMO** with S-LOAD-04 | — | — | — | No | — |
| S-DSP-01 | Dispatch board | `/dispatch` | DISPATCH | Mixed: LIVE spine + DEMO T-102 / canonical counts | **LIVE** assignment board; DEMO isolated | Server Prisma drivers; client `useBofDemoData` + operating-spine | `Load`, `Driver`, `DispatchAssignment` | assignment/unassign/release/pretrip APIs | APIs LIVE; board identity DEMO | T-102 vs LIVE tractor |
| S-DSP-02 | Dispatch v2 | `/dispatch-v2` | DISPATCH | Labeled REFERENCE/DEMO | **REFERENCE** or **DEPRECATED** | demo/v2 | none | none LIVE | No | Duplicate dispatch surface |
| S-DSP-03 | Pre-trip tablet | `/pretrip/[loadId]` | DISPATCH | LIVE APIs | **LIVE** | `/api/dispatch/pretrip/*` | `PreTripHeader` | start/complete/item | Yes if assignment exists | Needs LIVE assignment |
| S-EQ-01 | Maintenance dashboard | `/maintenance` | EQUIPMENT | Workbook V4 + canonical DEMO spine | **WORKBOOK** + DEMO spine; not LIVE authority | `getV3OperationalData` assets | not Prisma list | **no UI** call to status PATCH | No LIVE mutate from this UI | T-102 OOS vs Prisma AVAILABLE |
| S-EQ-02 | Asset detail | `/maintenance/[assetId]` | EQUIPMENT | DEMO keys T-101/T-102 SSG; Prisma id **404** (014) | **LIVE** for Prisma ids; DEMO keys isolated | BOF JSON / summaries | none for T-102 | none found | No | Route completeness |
| S-EQ-03 | Equipment status API | `PATCH /api/dispatch/equipment/:id/status` | EQUIPMENT | LIVE | **LIVE** (sole equipment write) | `setEquipmentStatus` | `Equipment` | PATCH status | Yes, `auth()` | No component caller found |
| S-EQ-04 | LIVE equipment list | operating-spine | EQUIPMENT | LIVE | **LIVE** | `listAccessibleEquipment` | `Equipment` | none | Read | Not assignment identity |
| S-DRV-01 | Drivers roster | `/drivers` | DRIVER | Mixed DEMO `DRV-*` + Prisma summaries; eligibility POST from roster | **LIVE** Prisma roster; DEMO isolated | `listAccessibleDriverOperationalSummaries` + DEMO JSON | `Driver`, snapshots | `POST .../eligibility` | Eligibility mutates LIVE | Mixed IDs |
| S-DRV-02 | Driver file | `/drivers/[id]` | DRIVER | LIVE Prisma when cuid | **LIVE** | `getDriverByIdForSession` | `Driver` | vault/docs/eligibility | Partial | DEMO tabs still `getBofData` |
| S-SAF-01 | Safety CC | `/safety` | SAFETY | Explicit REFERENCE/DEMO telematics | **DEMO / REFERENCE** | `getV3OperationalData` Safety_Events | **no Safety model** | no create/remove API | **No** LIVE mutate | 014 C / B2 |
| S-SAF-02 | Safety training | `/safety/training` | SAFETY | Workbook library | **WORKBOOK / REFERENCE** | V3 data | none | none | No | — |
| S-SET-01 | Settlements payroll | `/settlements` | SETTLEMENT | Mixed: LIVE hold panel + workbook payroll | Payroll **WORKBOOK/REFERENCE**; proof holds **LIVE** panel | `useSettlementsPayrollStore`/`getBofData`; spine HELD | `Settlement` (panel only) | `POST /api/generate/invoice` (document) | Invoice ≠ cash; Prisma hold via proof API | Dual holds |
| S-SET-02 | Settlements workbook grid | `/settlements/workbook` | SETTLEMENT | Workbook | **WORKBOOK** | `getBofData` | none | none | Must not govern LIVE | ADR-009-003 |
| S-SET-03 | Settlements v2 | `/settlements-v2` | SETTLEMENT | REFERENCE/DEMO | **REFERENCE** or **DEPRECATED** | xlsx copy | none | none | No | Duplicate |
| S-SET-04 | Prisma settlement (API) | proof reject + spine | SETTLEMENT | LIVE | **LIVE** load-proof hold | `rejectProofAndHoldSettlement` | `Settlement` | status HELD | Yes | Not payroll nav key |
| S-CUS-01 | Thin customer portal | `/portals/customer` | CUSTOMER | DEMO cards + LIVE overlay | DEMO isolated; overlay **LIVE** | `getBofData` + `prisma.load.findMany` match | `Load` overlay | none | Overlay read; cards DEMO | L001 Delivered vs operator HOLD |
| S-CUS-02 | Customer workspace | `/customer-portal/*` | CUSTOMER | Explicit walkthrough DEMO | **DEMO** | `BofDemoDataShell` | none | none to dispatch | No | Dual customer URLs |
| S-CUS-03 | Shipper portal | `/shipper-portal/[loadId]` | CUSTOMER | DEMO | **DEMO** | `getBofData` | none | none | No | L00x keys |
| S-PRF-01 | Proof reject form | load file | PROOF | LIVE | **LIVE** | POST proof/reject | `LoadProofOfDelivery` | REJECTED + hold | Yes | DEMO load file has no reject button |
| S-PRF-02 | DEMO proof / RFID | load/dispatch panels | PROOF | DEMO / workbook RFID | **DEMO / WORKBOOK** | `getLoadProofItems`, `RfidProofChainV4` | none | generate POD/BOL | Documents only | Not Prisma proof |
| S-CC-01 | Command Center V4 | `/command-center` | COMMAND CENTER | Mixed DEMO KPIs + workbook risk + LIVE panel | UOS: **LIVE feeds only** | `useBofDemoData`, `getCanonicalDispatchLoadState`, `getV3OperationalData`, `buildSettlementCommandCenterSummary`, `LiveOperatingSpinePanel` | LIVE panel only | none | No mutate; DEMO decides visually | Dual KPI vs spine |
| S-SHELL | Operator demo shell | `app/(bof)/layout.tsx` | ALL | Always `BofDemoDataShell` + `getBofData()` | **DEMO** container; must not own LIVE writes | `lib/demo-data.json` | none | — | Seeds DEMO | C2 vs UOS LIVE |

## Write-authority vs UOS rule

UOS: only the designated **LIVE** domain surface may accept authoritative writes.

| Domain | Designated LIVE write (actual) | Other writes |
|---|---|---|
| LOAD | `POST/PATCH /api/dispatch/load` | DEMO intake does not write Prisma L00x |
| DISPATCH | assignment / release / pretrip APIs | DEMO board does not PATCH equipment |
| EQUIPMENT | `PATCH .../equipment/:id/status` only | Maintenance UI does not call it |
| DRIVER | eligibility POST (+ vault/docs) | DEMO DRV-* not Prisma |
| SAFETY | **none** | B2 |
| PROOF | proof/reject | generate/* documents |
| SETTLEMENT | Prisma hold via proof reject | payroll store is client/workbook; payment UNSUPPORTED |
| CUSTOMER | **none** | overlay read |
| COMMAND CENTER | **none** | display only |

## Runtime evidence (not re-certified)

014/016 on this host: spine 161 equipment / 94 loads; `GET /api/dispatch/load/L001` 404; LIVE tractor PATCH; DEMO T-102 OOS; customer overlay unmatched; `/maintenance/<prismaId>` 404.
