# Prompt 017 — Product Scope & Prompt 014 Certification Alignment Decision Matrix

**Not a certification.** Does not rerun Prompt 014. Does not modify Prompt 014. Does not implement payment, Safety mutation, or DEMO→LIVE conversion.

**Branch:** `orchestrator/prompt-017-decision-gate`  
**Basis:** Prompt 014 post-016 `BOF PRODUCTION READINESS BLOCKED` (`c0365b5e`)  
**Standing product decisions (014-R2 / 015 / 016):** **A2** payment UNSUPPORTED; **B2** Safety create/remove out of production scope; **C2** DEMO operator shell (ADR-009-001)

---

## 1. Prompt 014 blocker inventory (post-016)

| Blocker | 014 scenarios / checks | Class | Path A implication | Path B implication |
|---|---|---|---|---|
| DEMO vs LIVE operational representations on the same operator screens | Checklist dual-SOT; A, B, E, I, J | **ARCHITECTURE / C2** | Retire or isolate DEMO as non-operating; LIVE Prisma becomes the only operator production spine | 014 must certify the **LIVE** path as production and treat DEMO as a labeled non-production shell — not as the operating SOT |
| DEMO operator production-path architecture (`BofDemoDataShell`) | “No demo in production paths”; A | **PRODUCT DECISION C2** | Replace operator production path with LIVE Prisma consumers (Dispatch assignment, CC KPIs, intake) | 014 must stop requiring the DEMO shell to *be* the production path; still forbid hidden demo on claimed LIVE paths |
| Payment / cash UNSUPPORTED | G; settlement→payment chain | **PRODUCT DECISION A2** | Implement operator cash/factoring **payment** (not invoice documents) | 014 Scenario G cash portion becomes **OUT OF SCOPE / N/A**, not FAIL. Invoice/factoring remain documents |
| No durable Safety create/remove | C; Safety→Dispatch | **PRODUCT DECISION B2** | New Safety restriction engine + Dispatch consumption | 014 Scenario C becomes **OUT OF SCOPE / N/A**, not FAIL. DEMO telematics stay REFERENCE |
| LIVE equipment not on assignment | E | **TECHNICAL GAP** (integration) | Assignment board must bind Prisma equipment ids, not T-102 | Same requirement if LIVE is the certified path; cannot waive “assignment reflects LIVE unit” |
| Maintenance Prisma id 404 | E; unexpected 404 | **TECHNICAL GAP** | `/maintenance/:id` must resolve Prisma equipment ids (or explicit DEMO-only routes) | Same if LIVE assets are in scope; DEMO T-102 route may remain isolated |
| Eligibility not on Dispatch | D | **TECHNICAL GAP** (propagation) | Dispatch assignment/readiness must consume Prisma qualification/readiness | Same on LIVE path; DEMO `DRV-*` roster cannot be the cert surface |
| Proof hold vs workbook payroll | F | **SOT CONFLICT** | One settlement-hold SOT (Prisma) for load proof; workbook isolated as payroll REFERENCE | 014 F scores Prisma hold + LIVE settlement panel; workbook HOLD-* cannot be the cert hold |
| Customer Delivered vs operator HOLD | H | **SOT / LIVE DATA** | Customer cards consume matching Prisma load status; DEMO cards isolated or retired | 014 H scores LIVE overlay + matching ids; DEMO L001 Delivered cannot be scored against operator DEMO HOLD |
| CC DEMO KPIs vs LIVE spine | I | **SOT CONFLICT** | CC operating KPIs from LIVE spine | 014 I scores LIVE CC panel as authoritative operating view; DEMO KPI strip isolated |
| No Prisma L001; PI-test load unassigned | A, B, J | **LIVE DATA** | Real intake creates LIVE loads; assignment exists | Cert uses existing LIVE load ids; do not require fabricated L001 |
| Auth, build, `/loads` `/drivers` 200, mutation 401 | Checklist | **NONE** (closed) | Keep | Keep |

---

## 2. Path A vs Path B — capability map

| Capability | Already present | Partial | Missing | Product decision | Environment / LIVE data |
|---|---|---|---|---|---|
| One authoritative operational spine | Prisma Load / Equipment / Proof / Settlement hold; `GET /api/dispatch/operating-spine` | LIVE **panels** beside DEMO KPIs | Single operator board/KPI strip | C2 keeps dual display | Rows exist (94 loads, 161 equipment) |
| LIVE operator production path | `/loads` roster, trip-release by Prisma id, eligibility/proof/equipment APIs | Dispatch board mixes fleet list + DEMO T-102 | Intake, CC KPIs, assignment chips, `/drivers` roster | C2 DEMO shell | Auth.js + DATABASE_URL |
| Isolate conflicting DEMO truth | Labels `DEMO_ONLY`, overlay copy | Labels without isolation | DEMO still occupies primary CC/Dispatch | C2 | — |
| Load intake → settlement | LIVE load GET; release API; proof→HELD | Release **409** without assignment; intake DEMO | Production intake→assignment→release→settlement on one load | C2 intake | Assignment rows |
| Safety create/remove | REFERENCE watchlist copies | — | Durable API + model | **B2** | — |
| Eligibility → Dispatch | POST eligibility + operational-summary | Readiness YES | Dispatch YES | — | LIVE driver ids |
| LIVE equipment → assignment | PATCH + spine list | Panel lists unit | Assignment identity T-102 | C2 | LIVE tractor exists |
| Proof reject → hold | Prisma REJECTED + HELD + LIVE panel | Workbook unchanged | Product un-hold; single workflow | A2 adjacent | LIVE load ids |
| Customer-visible propagation | Overlay when `sourceRecordId` matches | Overlay empty | Matching LIVE ids or overlay of PI-test loads | Do not expose operator-only OOS | LIVE DATA |
| Command Center propagation | LIVE panel Refresh | Canonical KPIs stale DEMO | CC operating counts from LIVE | C2 | — |
| Payment / factoring cash | Invoice document; factoring HTML; `payment: UNSUPPORTED` | — | `recordLoadPayment` operator path | **A2** | — |
| Maintenance route | `/maintenance/T-102` DEMO | — | `/maintenance/<prismaId>` | DEMO keys vs LIVE ids | — |

---

## 3. Source-of-truth reconciliation (Decision C)

| Representation | Pair | Classification |
|---|---|---|
| DEMO L001 on Dispatch / CC / `/loads/L001` | vs Prisma loads (`86fd04a8-…` etc.) | DEMO L001 = **DEMO** / **TO BE ISOLATED**. Prisma Load = **LIVE** / **AUTHORITATIVE** for production. Do not relabel L001 as LIVE |
| DEMO T-102 OOS | vs `ASSIGNMENT-TRACTOR-1786901161488-3` AVAILABLE | T-102 = **DEMO** / **TO BE ISOLATED**. Prisma Equipment = **LIVE** / **AUTHORITATIVE**. Do not copy T-102 into Prisma |
| Workbook HOLD-001/002/003, `/settlements` Hold/review 2 | vs Prisma Settlement HELD | Workbook = **REFERENCE** (ADR-009-003 payroll identity) / **TO BE ISOLATED** from load-proof holds. Prisma hold = **LIVE** / **AUTHORITATIVE** for proof→settlement hold |
| Customer L001 Delivered / Invoice Ready | vs operator L001 HOLD | Customer cards = **DEMO** (`DEMO_CUSTOMER_PROFILE`). Operator HOLD = **DEMO** canonical. Neither is LIVE L001. Overlay = **LIVE** when match exists; currently empty = **PENDING LIVE DATA**. Operator-only T-102 OOS = **not** a required customer fact |
| CC canonical KPIs (7 attention / 3 HOLD) | vs LIVE spine 161/94/holds | Canonical KPIs = **DEMO** / **TO BE ISOLATED** from production cert. LIVE panel = **LIVE** / **AUTHORITATIVE** for Prisma facts. **DERIVED** counts on LIVE panel are list lengths, not a second engine |
| `/drivers` DRV-* roster | vs Prisma driver `cmtkkg28f0003to5ay7o9y72e` | DRV-* = **DEMO** / **TO BE ISOLATED** for eligibility cert. Prisma qualification/readiness = **LIVE** / **AUTHORITATIVE** |
| `/safety` telematics + EVT copies | vs (no Prisma Safety Event write) | **DEMO / REFERENCE**. **TO BE ISOLATED**. No LIVE Safety SOT unless Path A creates one |
| Invoice / factoring packets | vs cash payment | **DOCUMENT / REFERENCE**. Payment = **UNSUPPORTED**. Not AUTHORITATIVE cash |

Nothing in this gate is silently deleted or relabeled.

---

## 4. If Path A is selected (align BOF to unchanged 014)

Would require, without a new parallel SOT:

1. Operator production UI consumes Prisma spine as the **only** operating assignment/KPI/intake path.  
2. DEMO JSON remains (if at all) behind an explicit demo/walkthrough boundary — not `/dispatch` production.  
3. Durable Safety restriction create/remove + Dispatch enforcement.  
4. Operator payment/cash or factoring **payment** notification + hold release.  
5. Eligibility and LIVE equipment on the **assignment** surface.  
6. Customer surface bound to Prisma load identity.  
7. Maintenance routes for Prisma ids.  
8. Intake that creates/progresses Prisma loads to settlement context.

**Consequence:** BOF becomes a full operating TMS+safety+cash product. Overturns A2, B2, C2. Large implementation program. Matches original “One Operating System” 014 bar.

---

## 5. If Path B is selected (revise 014 to current BOF scope)

Would **not** be: delete dual-SOT, hide DEMO, or mark C/G PASS.

A valid revision would:

| 014 element | Allowed revision | Forbidden weakening |
|---|---|---|
| Scenario C | **OUT OF SCOPE** while B2 stands | Treating DEMO “Release dispatch hold” link as PASS |
| Scenario G cash | **OUT OF SCOPE** while A2 stands | Treating invoice/factoring as payment PASS |
| DEMO shell | Certify **LIVE path only**; DEMO labeled **non-production** | Claiming DEMO board is production |
| Dual SOT | Require isolation: DEMO cannot contradict LIVE on certified surfaces | Leaving unlabeled T-102 vs LIVE tractor |
| A, D, E, F, H, I, J | Re-point to LIVE ids, LIVE assignment, LIVE CC panel, Prisma hold, customer overlay | Dropping cross-domain propagation |
| Auth / no unauthorized mutation | Unchanged | — |

**Consequence:** 014 text must be formally versioned (014-B / V1.1) by the product owner. This 017 gate does **not** edit Prompt 014. Remaining LIVE integration (assignment, CC KPI isolation, eligibility on Dispatch, maintenance route, customer match) still has to be **built** — Path B is not a free pass.

---

## 6. Why this gate does not SELECT Path A or Path B

Path A vs Path B is a **scope/commercial** choice (cash + safety engines + DEMO retirement vs cert rewrite). Standing A2/B2/C2 already exist; 017 forbids implementing them and forbids modifying 014. Selecting either path here would be an implicit owner act.

**Final status of Prompt 017:** see `BOF-PRODUCTION-READINESS-017.md`.
