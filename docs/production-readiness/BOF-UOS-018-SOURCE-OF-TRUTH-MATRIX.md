# BOF UOS 018 — Source-of-Truth Matrix

**Not a software registry.** Documentation of actual vs governing authority.

Governing canonical fields (Prompt 018 / Product Authority quote):  
`load_id`, `dispatch_ref`, `driver_id`, `equipment_id`, `appointment_window`, `settlement_status`, `safety_clearance_status`.

**Schema was not renamed in this prompt.** Deviations are flagged.

**≥95% cross-surface coherence:** **not claimed.** Dual DEMO/LIVE identifiers violate coherence. No formal field-by-field UOS audit sample was run.

---

## Domain authority

| Domain | LIVE authority (actual Prisma / API) | DEMO | WORKBOOK | REFERENCE | Who may write LIVE |
|---|---|---|---|---|---|
| LOAD | `Load.id` cuid; `referenceNumber`; `sourceRecordId`; `status` LoadStatus | L001–L012 in `demo-data.json` / load file | — | — | `auth()` dispatch load APIs |
| DISPATCH | `DispatchAssignment.id`; `DispatchRelease` | Canonical dispatch HOLD / T-102 assignment copy | RFID/route intel V4 sheets | `/dispatch-v2` | assignment/release/pretrip APIs |
| EQUIPMENT | `Equipment.id`; `unitNumber`; `status` AVAILABLE/UNAVAILABLE/OUT_OF_SERVICE | T-102 OOS in BOF JSON / maintenance SSG | V4 Assets / work orders | — | PATCH equipment status only |
| DRIVER | `Driver.id`; `DriverQualificationSnapshot`; `DriverReadinessScore` | DRV-001… roster | compliance V4 sheets | — | eligibility POST + vault |
| SAFETY | **none** | `/safety` telematics snapshot | `Safety_Events`, MainSafety | labeled REFERENCE on page | **none** (B2) |
| SETTLEMENT | `Settlement.id`; `status` SettlementRecordStatus; `holdReason` | — | Weekly_Settlements, PayrollSettlementDetail, Settlement Holds | `/settlements-v2` | proof reject → HELD; **not** cash (A2) |
| CUSTOMER | Prisma `Load` overlay when `sourceRecordId`/`referenceNumber` match | `/portals/customer` cards; `/customer-portal` walkthrough | — | dual URL docs | no customer write API |
| PROOF | `LoadProofOfDelivery.status` | `getLoadProofItems` / seal DEMO | RFID proof chain V4 | generate HTML | proof/reject |
| COMMAND CENTER | LIVE panel lists | Canonical 7/3 HOLD KPIs | operational risk queue, settlement CC summary | Copilot first-paint | display only |

---

## Canonical field audit

| Governing field | Prisma / API actual | Coherent across LIVE surfaces? | Deviation (do not silently rename) |
|---|---|---|---|
| `load_id` | `Load.id` (cuid). DEMO uses `L001` | LIVE APIs use cuid. Operator DEMO and customer cards use L00x | Name `load_id` vs `id`. Shared identifier **L001** is DEMO-only; not a Prisma row (404) |
| `dispatch_ref` | No `dispatch_ref` column. Closest: `DispatchAssignment.id`, `DispatchRelease` rows, `referenceNumber` on Load | Assignment exists as model; PI-test load had **no** active assignment (release 409) | Field **missing**. Enum/path not `dispatch_ref` |
| `driver_id` | `Driver.id`; assignment `driverId` | LIVE yes. DEMO `DRV-*` | Dual identifier namespaces |
| `equipment_id` | `Equipment.id`; assignment `tractorEquipmentId` | LIVE PATCH uses cuid. DEMO `T-102` | Dual namespaces; maintenance route is DEMO key |
| `appointment_window` | `pickupWindowStart/End`, `deliveryWindowStart/End` | Optional on Load; 014 PI-test showed pickup/delivery “—” | **Split fields**, not `appointment_window` |
| `settlement_status` | `Settlement.status` (`CREATED`/`HELD`/…) vs workbook payroll strings (`Draft`/`Hold / Review`/`Exported`) | **Not coherent** — two enums, two counts (014: Prisma hold 1 vs workbook 2) | Dual `settlement_status` meanings |
| `safety_clearance_status` | **No Prisma field**. Workbook `dispatchBlock` / DEMO chips | **Not present** on LIVE | Missing LIVE field; B2 |

`Load.lifecycleClass` is `LIVE | HISTORICAL` only — **not** the UOS five-class surface taxonomy. Do not treat it as UOS classification.

---

## Fact-level authority (014/016 observed values)

| Fact | Surface A | Surface B | Authoritative under UOS LIVE rule |
|---|---|---|---|
| Load L001 exists | DEMO `/loads/L001` HOLD | Prisma GET L001 **404** | **No LIVE L001**. DEMO only |
| Load `86fd04a8-…` | Prisma **PLANNED** | DEMO board not this id | **LIVE** Prisma |
| Tractor T-102 | DEMO OOS | not Prisma unit | **DEMO** |
| Tractor `cmsw2tcep00022g5azbluiaeu` | Prisma AVAILABLE (after restore) | not T-102 | **LIVE** |
| Settlement hold | Prisma HELD during F | workbook Hold/review 2 | **LIVE** = Prisma; workbook REFERENCE |
| Customer L001 | Delivered / Invoice Ready | operator HOLD | **neither is LIVE L001**; overlay empty |
| Driver eligibility | Prisma NOT_QUALIFIED when posted | Dispatch DEMO no id | **LIVE** = snapshots; Dispatch not a LIVE consumer yet |
| Safety restriction | DEMO watchlist | no Prisma | **no LIVE clearance fact** |

---

## 95% coherence

**Not achieved / not measured to UOS protocol.** Dual IDs (L001 vs cuid, T-102 vs unitNumber, DRV-* vs cuid) and dual settlement statuses make a ≥95% claim false.
