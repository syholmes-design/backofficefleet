# BOF UOS Phase 2 — Authority Assignment (Path A)

**Governance documentation only.** Not a runtime registry. Not a new engine.

**Owner decision:** Path A (017). **Inventory:** Prompt 018 surface IDs.

Path A assigns **production authority** to LIVE Prisma/API surfaces. DEMO/WORKBOOK/REFERENCE remain in the product as isolated or subordinate experiences until formal retirement.

---

## Designated LIVE write surfaces (sole production mutators)

| Domain | Assigned LIVE writer | Existing mechanism | Must not write LIVE |
|---|---|---|---|
| LOAD | Dispatch load APIs | `POST/PATCH /api/dispatch/load` | DEMO intake packet L00x |
| DISPATCH | Assignment / release / pretrip APIs | `/api/dispatch/assignment*`, `/release*`, `/pretrip*` | DEMO board identity T-102 / L001 as keys |
| EQUIPMENT | Equipment status API | `PATCH /api/dispatch/equipment/:id/status` | Maintenance V4 workbook; DEMO T-102 |
| DRIVER | Eligibility (+ existing vault/docs) | `POST /api/dispatch/driver/:id/eligibility` | DEMO `DRV-*` as Prisma ids |
| PROOF | Proof reject | `POST /api/dispatch/load/:id/proof/reject` | `getLoadProofItems` / generate HTML |
| SETTLEMENT (load hold) | Proof-reject hold path | Prisma `Settlement` HELD | Workbook HOLD-001 / payroll Hold/review |
| SETTLEMENT (cash) | **Not assigned until min-scope implementation** | `recordLoadPayment` exists, **no operator API** | Invoice generate; factoring HTML |
| SAFETY | **Not assigned until min-scope implementation** | No Safety model; PI `OperatingException` exists | `/safety` workbook / DEMO telematics |
| CUSTOMER | **Read overlay only** | Prisma `Load` match | DEMO Delivered cards as LIVE |
| COMMAND CENTER | **No writes** | LIVE panel read | Canonical DEMO KPIs as production |

---

## Surface assignment (018 IDs)

| 018 ID | Path A assignment | Production role |
|---|---|---|
| S-LOAD-01 `/loads` + spine | **LIVE** | Operator load roster |
| S-LOAD-02 `/loads/[id]` Prisma | **LIVE** | Load file |
| S-LOAD-02 `/loads/L001` | **DEMO — isolate** | Must not be production load identity |
| S-LOAD-03 trip-release Prisma id | **LIVE** | Release |
| S-LOAD-03 `/trip-release/L001` | **DEMO key — isolate** | 404 is correct until a LIVE row exists |
| S-LOAD-04 `/dispatch/intake` | **DEMO — isolate** | Not production intake |
| S-LOAD-05 load create API | **LIVE** | Production intake writer (wire UI later) |
| S-DSP-01 `/dispatch` | **Split:** spine/assignment APIs **LIVE**; T-102 board **DEMO isolate** | Production board must bind Prisma assignment |
| S-DSP-02 `/dispatch-v2` | **REFERENCE** candidate **DEPRECATED** (retire later) | No production decisions |
| S-DSP-03 `/pretrip` | **LIVE** | After LIVE assignment |
| S-EQ-01 `/maintenance` workbook | **WORKBOOK** subordinate | Must not override Prisma status |
| S-EQ-02 `/maintenance/T-102` | **DEMO — isolate** | Keep as demo asset page until retired |
| S-EQ-02 Prisma id route | **LIVE** (gap: 404) | Must resolve `Equipment.id` / unitNumber |
| S-EQ-03 status PATCH | **LIVE** sole equipment write | Wire UI later |
| S-EQ-04 spine equipment | **LIVE** | CC/Dispatch consumer |
| S-DRV-01 `/drivers` | **Split:** Prisma summaries **LIVE**; DRV-* **DEMO isolate** | Eligibility writer stays LIVE |
| S-DRV-02 driver file cuid | **LIVE** | |
| S-SAF-01 `/safety` | **DEMO / REFERENCE** until min Safety exists | Must not govern LIVE dispatch |
| S-SAF-02 training | **REFERENCE / WORKBOOK** | |
| S-SET-01 payroll UI | **WORKBOOK** subordinate | Proof-hold panel **LIVE** |
| S-SET-02 workbook grid | **WORKBOOK** | |
| S-SET-03 `/settlements-v2` | **REFERENCE** candidate **DEPRECATED** | |
| S-SET-04 Prisma Settlement | **LIVE** load-proof hold | |
| S-CUS-01 overlay | **LIVE** when matched | Cards **DEMO isolate** |
| S-CUS-02 `/customer-portal` | **DEMO** | Walkthrough |
| S-CUS-03 shipper portal | **DEMO** | |
| S-PRF-01 reject API | **LIVE** | |
| S-PRF-02 RFID/demo proof | **DEMO / WORKBOOK** | |
| S-CC-01 canonical KPIs | **DEMO — isolate from production CC** | Must not remain production feed |
| S-CC-01 LIVE panel | **LIVE** | Becomes production CC operating feed |
| S-CC-01 workbook risk/settlement | **WORKBOOK** subordinate if shown | Not operating authority |
| S-SHELL `BofDemoDataShell` | **DEMO container** | Must not wrap production authority; isolate layout later |

---

## Competing representations (Path A disposition)

| Conflict | Isolate | Subordinate | Retire (later, formal process) |
|---|---|---|---|
| DEMO L001 vs Prisma loads | DEMO L001 keys on operator production routes | — | After DEMO sandbox exists |
| DEMO T-102 vs LIVE tractor | T-102 from assignment/CC production | Maintenance demo page | After sandbox |
| CC DEMO KPIs vs spine | DEMO KPI strip from production CC | Workbook counts if labeled | — |
| Workbook holds vs Prisma HELD | — | Workbook payroll holds | — |
| Customer Delivered vs operator HOLD | DEMO cards from LIVE overlay | — | — |
| DRV-* vs Prisma driver | DEMO roster ids | — | — |
| `/dispatch-v2`, `/settlements-v2` | — | REFERENCE | Candidates |

Do **not** copy DEMO facts into Prisma to “win” Path A.

---

## Cross-domain LIVE consumption targets (not implemented here)

| Producer (LIVE) | Required consumer |
|---|---|
| Load status / assignment | Dispatch board, trip-release, CC LIVE feeds, customer overlay |
| Equipment.status | Assignment chips, maintenance LIVE route, CC |
| Driver qualification/readiness | Dispatch assignment/readiness |
| Proof REJECTED + Settlement HELD | Settlements LIVE hold list, CC |
| Release decision | Load file, CC |
| Future min Safety restriction | Release evaluation + Dispatch (design in 019 report) |
| Future min payment record | Settlement/load cash context (design in 019 report) |

---

## Canonical fields (map, do not rename in this phase)

| UOS field | Assigned LIVE mapping |
|---|---|
| load_id | `Load.id` (cuid). `referenceNumber` / `sourceRecordId` are aliases, not a second load |
| dispatch_ref | `DispatchAssignment.id` when active; not DEMO L001 |
| driver_id | `Driver.id` |
| equipment_id | `Equipment.id` |
| appointment_window | `pickupWindowStart/End` + `deliveryWindowStart/End` |
| settlement_status | Prisma `Settlement.status` for load-proof hold; workbook payroll status is **not** this field |
| safety_clearance_status | **Unassigned until min Safety design is implemented** — do not invent a column in this phase |
