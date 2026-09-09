# Prompt 016 — Post-015 Production Readiness Alignment

**Not a certification.** This prompt must not issue `BOF PRODUCTION READINESS CERTIFIED`. It does not weaken Prompt 014. It does not redesign BOF. Product decisions **A2 / B2 / C2** were preserved.

**Worktree:** `C:\Users\syhol\OneDrive\Documents\GitHub\backofficefleet\bof-orchestrator-copilot-sequential-2026-09`  
**Branch:** `orchestrator/prompt-016-alignment` (from Prompt 015 HEAD `9185a3b4`)  
**Audit date:** 2026-09-09  
**Runtime:** production `npx next start -p 3010` after rebuild of Prompt 015 sources  

# Executive Result

Prompt 015’s claimed closures **reproduced on this host** with HTTP, Prisma, and authenticated UI evidence:

- `/loads` and `/drivers` return **200** (no `DYNAMIC_SERVER_USAGE` 500).
- `GET /api/dispatch/operating-spine` returns LIVE loads, equipment, and settlement holds for an authenticated operator.
- Command Center, Dispatch, Loads, and Settlements **consume** that spine in labeled LIVE panels (`Refresh LIVE`).
- Driver eligibility POST persists INELIGIBLE then ELIGIBLE on a real Prisma driver and was restored.
- Proof reject persists REJECTED + settlement HELD on a real Prisma load and was restored.
- LIVE equipment PATCH UNAVAILABLE → AVAILABLE is visible on the spine/LIVE panels; DEMO T-102 was not used as LIVE.
- Customer LIVE overlay is separated from DEMO shipment cards.

Remaining Prompt 014 failures are **not unclosed 015 defects**. They are:

1. **CERTIFICATION SCOPE CONFLICT** — A2 payment, B2 safety mutation, C2 DEMO operator shell vs 014’s production-path rule.
2. **LIVE DATA** — no Prisma `L001`; customer overlay has no matching shipment IDs.
3. **Competing labeled representations** — DEMO KPIs vs LIVE panels (intentional C2).

**TECHNICALLY READY BUT CERTIFICATION STANDARD CONFLICT REMAINS.**

A full Prompt 014 execution is now justified as an honest certification attempt. It is expected to **BLOCK** again on C, G, and the DEMO production-path rule unless the product owner separately chooses (A) bring those capabilities into BOF scope or (B) formally revise Prompt 014. Neither happened in 016.

Prompt 014 was **not** started. Prompt 017 was **not** created.

# Prompt 015 Validation

| Claim | 016 evidence | Result |
|---|---|---|
| A. `/loads` 200 | Cookie-less `curl` **200**; authenticated `/loads` renders LIVE roster panel, equipment **161**, tractor unit on page, pageOverflow **0** at 390 and 1366 | **CONFIRMED** |
| B. `/drivers` 200 | Cookie-less **200**; authenticated roster renders (115 needing attention + LIVE driver id present) | **CONFIRMED** |
| C. LIVE operating-spine endpoint | Authenticated GET **200**, 161 equipment, 94 loads; cookie-less **401** | **CONFIRMED** |
| D. Command Center consumes LIVE spine | Panel title `LIVE Command Center consumption`; counts 161 / 94 / holds 0; tractor listed; Refresh LIVE 26× accessible at 390 | **CONFIRMED** (LIVE panel only) |
| E. Dispatch consumes LIVE spine | `LIVE dispatch consumption`; `LIVE loads (94)`; tractor unit; Refresh LIVE | **CONFIRMED** (LIVE panel). DEMO/canonical board still shows T-102 |
| F. Loads consumes LIVE spine | `LIVE load roster consumption`; 161 equipment; Refresh LIVE 89×26 at 390 | **CONFIRMED** |
| G. Settlements consumes LIVE hold context | `LIVE settlement holds from proof rejection`; holds **0** after 016 restore; workbook still shows Hold/review **2** | **CONFIRMED** as LIVE overlay beside workbook |
| H. Driver eligibility durable | POST INELIGIBLE **200** then ELIGIBLE **200** on `cmtkkg28f0003to5ay7o9y72e`; unauth **401** | **CONFIRMED** |
| I. Proof REJECTED durable | POST reject **200**; Prisma proof restored from REJECTED after audit | **CONFIRMED** |
| J. Settlement HELD durable | Settlement `e1ee3e8e-aa2f-4284-ba97-ad08861d8c8c` HELD then restored `CREATED` | **CONFIRMED** |
| K. LIVE equipment mutation | PATCH UNAVAILABLE then AVAILABLE **200** on `cmsw2tcep00022g5azbluiaeu` | **CONFIRMED** |
| L. Downstream LIVE equipment | Spine/Dispatch/CC LIVE lists showed UNAVAILABLE mid-cycle then AVAILABLE; DEMO T-102 unchanged | **CONFIRMED** for LIVE consumers |
| M. Customer LIVE overlay | Overlay: no matching Prisma IDs. DEMO L001 remains Delivered / Invoice Ready. Operator HOLD not copied onto those cards | **CONFIRMED** (correct overlay; no match) |

015 did **not** reverse A2, B2, or C2. `app/(bof)/layout.tsx` still wraps `BofDemoDataShell`.

# Current Operational Spine

| Relationship | Classification |
|---|---|
| LOAD (Prisma) → DISPATCH (LIVE panel + trip-release by Prisma id) | **CONNECTED** / **LIVE** when the load id exists |
| LOAD (DEMO L001) → DISPATCH board / CC KPIs | **DEMO ONLY** (C2) |
| DISPATCH → DRIVER (eligibility API) | **PARTIALLY CONNECTED** — mutation LIVE; CC spine has no eligibility list; `/drivers` mixed DEMO/LIVE |
| DISPATCH → EQUIPMENT (LIVE PATCH + spine) | **CONNECTED** / **LIVE** |
| DISPATCH assignment chips → DEMO T-102 | **DEMO ONLY**; **DISCONNECTED** from LIVE tractor |
| PROOF reject → SETTLEMENT HELD (Prisma) | **CONNECTED** / **LIVE** |
| SETTLEMENT workbook HOLD-* → Prisma holds | **REFERENCE ONLY** / competing labeled snapshot |
| CUSTOMER DEMO cards → operator DEMO HOLD | **DEMO ONLY** dual story |
| CUSTOMER overlay → Prisma load | **LIVE** when `sourceRecordId`/`referenceNumber` matches; currently **PENDING** (no match) |
| COMMAND CENTER DEMO KPIs | **DEMO ONLY** |
| COMMAND CENTER LIVE panel | **LIVE** |
| PAYMENT | **UNSUPPORTED** (A2) |
| SAFETY create/remove | **UNSUPPORTED** (B2) |

**Can the same operational event propagate without manually syncing snapshots?**  
On the **LIVE** path: equipment status and proof-hold propagate to the operating-spine consumers without copying DEMO JSON.  
On the **DEMO** path: T-102 / L001 still require the DEMO shell and do not follow LIVE PATCH. Those are separate facts, labeled.

# Data Authority

| Fact | Authority |
|---|---|
| Prisma Load / Equipment / DriverQualificationSnapshot / DriverReadinessScore / LoadProofOfDelivery / Settlement hold | **AUTHORITATIVE LIVE** |
| Operator Dispatch / CC canonical L001 / T-102 OOS | **DEMO** (ADR-009-001 / C2) |
| LIVE operating-spine panels | **AUTHORITATIVE LIVE** |
| Workbook settlements / HOLD-001 | **REFERENCE** payroll identity (ADR-009-003); not the load proof-hold engine |
| Payment / cash | **UNSUPPORTED** |
| Invoice / factoring documents | **DOCUMENT** / not cash |
| Safety telematics / EVT copies | **DEMO / REFERENCE** |
| Customer DEMO cards | **DEMO** |
| Customer LIVE overlay | **AUTHORITATIVE** when a matching Prisma load exists; else empty |

LIVE tractor `ASSIGNMENT-TRACTOR-1786901161488-3` and DEMO T-102 are **different records**.

# Load / Intake / Settlement

`GET /api/dispatch/load/L001` → **404 Load not found**. L001 was not fabricated.

Legitimate LIVE stand-in: load id `86fd04a8-ce66-4153-9125-dccb054f7033`, status **PLANNED**, customer PROCESS INTELLIGENCE TEST, Columbus OH → Charlotte NC.

`/trip-release/86fd04a8-…` **200**: backend release **Not evaluated**; no active assignment; driver readiness **NOT_READY**; **Request release evaluation** present. This is a real LIVE workflow surface, not a DEMO L001 404.

`/dispatch/intake` remains a DEMO packet workspace. Scenario A as **production E2E through the operator DEMO shell** is still not a LIVE chain.

# Driver

Authorized cycle on existing driver `cmtkkg28f0003to5ay7o9y72e`:

1. INELIGIBLE — HTTP **200** (persisted qualification + readiness).
2. ELIGIBLE — HTTP **200** (restored).
3. Unauthenticated POST — **401**.

`/drivers` is mixed: DEMO `DRV-*` filters **and** LIVE id text. Downstream CC LIVE panel does not display eligibility. Classification: LIVE mutation **CONNECTED**; operator roster **PARTIALLY CONNECTED** / mixed.

# Equipment

LIVE id `cmsw2tcep00022g5azbluiaeu`:

- Mid-cycle spine status **UNAVAILABLE**.
- Restored **AVAILABLE**.
- Dispatch and Command Center LIVE lists included the unit number.
- DEMO T-102 OOS remained on DEMO CC/Dispatch copy (`DEMO_ONLY`).
- `/maintenance/<prismaId>` **404**. DEMO maintenance still expects keys such as T-102.

# Proof / Settlement Hold

Load `86fd04a8-ce66-4153-9125-dccb054f7033`:

- Reject POST **200** → settlement `e1ee3e8e-aa2f-4284-ba97-ad08861d8c8c` **HELD**, `holdReason` `016 alignment proof reject`.
- Prisma restore: `CREATED`, `holdReason` null; matching REJECTED proof → `RECEIVED`.
- Spine LIVE holds after restore: **0**.
- Workbook “Hold / review 2” unchanged (different authority).

# Customer

`/portals/customer`:

- DEMO L001: Delivered / Proof verified / Invoice Ready.
- LIVE overlay: **No LIVE Prisma loads currently match these customer shipment IDs.**
- Internal operator T-102 OOS is not a customer-visible required fact.
- Standard met for overlay design: DEMO cards stay DEMO; LIVE status only when Prisma matches.

014 Scenario H as “operator DEMO HOLD appears on customer Delivered” remains a **scope/architecture** demand, not an overlay bug.

# Command Center

Two labeled layers:

1. **DEMO / canonical** — L001 HOLD, T-102 OOS, workbook REFERENCE holds (HOLD-001/002/003), JSON risk queue.
2. **LIVE panel** — Prisma equipment 161, loads 94, settlement holds 0, tractor unit, Refresh LIVE.

Stale DEMO snapshot **does not override** the LIVE panel counts. It **does** still occupy the primary KPI strip. That boundary is C2, documented in-page.

Driver eligibility is **not** a LIVE panel field.

# Payment

**A2 preserved.** `payment: "UNSUPPORTED"`. No payment implementation in 016. Invoice/factoring are not cash.

Prompt 014 Scenario G **still requires** a capability outside current BOF production scope → **CERTIFICATION SCOPE CONFLICT**.

# Safety

**B2 preserved.** No durable Safety create/remove API. No Prisma Safety Event write model used as an operator mutation.

Prompt 014 Scenario C **still requires** that capability → **CERTIFICATION SCOPE CONFLICT**.

# Operator DEMO / LIVE Boundary

| Surface | Class |
|---|---|
| `app/(bof)/layout.tsx` + `BofDemoDataShell` | **DEMO** shell (C2 / ADR-009-001) — intentional |
| Dispatch / CC canonical board and KPI strip | **DEMO**, with DEMO_ONLY copy for T-102 |
| LIVE operating-spine panels on CC, Dispatch, Loads, Settlements | **LIVE**, explicitly titled |
| `/loads` roster + trip-release by Prisma id | **LIVE** path |
| `/drivers` | **mixed** (DEMO roster + LIVE ids) |
| `/settlements` workbook | **REFERENCE / DEMO payroll** + LIVE hold panel |
| `/portals/customer` | **DEMO cards** + **LIVE overlay** (empty match) |
| `/safety` | **DEMO / REFERENCE** |
| Payment | **UNSUPPORTED** |

Prompt 014 **can distinguish the two honestly** if it treats LIVE panels/APIs as the production-consumable path and DEMO JSON as C2. If 014 continues to require the DEMO board to **be** the production path, that is **CERTIFICATION SCOPE / ARCHITECTURE CONFLICT**. 016 did not silently change ADR-009-001.

# Runtime / Security

| Check | Result |
|---|---|
| `/loads` `/drivers` `/command-center` cookie-less | **200** |
| Cookie-less session | **200** body `null` |
| Unauthenticated spine GET | **401** |
| Unauthenticated eligibility / proof reject / equipment PATCH | **401** |
| Authenticated operator mutations | **200** with `BOF_OPERATIONS` |
| Client cannot pick an arbitrary role | session membership from Auth.js; mutations use `auth()` + fleet access |
| Secrets | `.env.local` gitignored; not committed |
| Demo bypass as empty-session production auth | cookie-less session remains `null`; mutations 401 |
| Prisma | LIVE reads/writes succeeded; 016 restore used Prisma |
| Payment / Safety APIs added | **No** |
| Hero PNG missing | cosmetic, non-blocking (prior 014 note) |

# Responsive

Measured in Cursor browser `af1381` (`documentElement.scrollWidth − innerWidth`). Refresh LIVE / Blocked / L001 card bounding boxes used for control accessibility.

| Viewport | Route | Page overflow | Action accessibility |
|---|---|---|---|
| 390 | `/loads` | 0 | Refresh LIVE ~89×26 |
| 390 | `/dispatch` | 0 (after session) | Refresh LIVE ~26h; LIVE 94 loads |
| 390 | `/command-center` | 0 | Refresh LIVE ~26h; LIVE eq 161 |
| 390 | `/portals/customer` | 0 | L001 card ~310×184 (below fold on tall page) |
| 768 | `/dispatch` | 0 | Refresh LIVE present |
| 768 | `/command-center` | 0 | — |
| 768 | `/settlements` | 0 | Refresh LIVE; LIVE holds 0 |
| 768 | `/drivers` | 0 | Blocked ~85×26 |
| 1366 | `/loads` | 0 | tractor + LIVE counts |
| 1366 | `/drivers` | 0 | search + Blocked |
| 1366 | `/command-center` | 0 | LIVE 161/94/0 |
| 1366 | `/settlements` | 0 | LIVE holds 0 |

This is **not** production certification. Dense DEMO Dispatch still has many overflowed descendants at 390; **page-level** overflow was 0.

# Remaining Gaps

| Gap | Class |
|---|---|
| `/loads` `/drivers` 500 | **NONE** (closed) |
| LIVE spine missing | **NONE** (closed) |
| Durable eligibility missing | **NONE** (closed on LIVE driver rows) |
| Durable proof → HELD missing | **NONE** (closed on LIVE load rows) |
| LIVE equipment not on LIVE consumers | **NONE** (closed on spine/panels) |
| Payment / cash | **PRODUCT SCOPE DECISION** / **CERTIFICATION SCOPE CONFLICT** (A2) |
| Safety durable create/remove | **PRODUCT SCOPE DECISION** / **CERTIFICATION SCOPE CONFLICT** (B2) |
| Operator DEMO JSON as 014 production path | **CERTIFICATION SCOPE / ARCHITECTURE CONFLICT** (C2) |
| No Prisma L001 | **LIVE DATA / INFRASTRUCTURE** |
| Customer overlay empty | **LIVE DATA / INFRASTRUCTURE** |
| `/maintenance/<prismaId>` 404 | **PRODUCT SCOPE DECISION** (DEMO asset keys) |
| CC LIVE panel omits eligibility | **PRODUCT CAPABILITY GAP** (not a 015 regression; panel scope is loads/equipment/holds) |
| Workbook holds vs Prisma holds | **PRODUCT SCOPE DECISION** (labeled dual authority) |
| Unassigned PI-test load / trip-release not evaluated | **LIVE DATA** (row exists; assignment/release not stored) |
| GAP-009-031 protected worktree dirty | **ENVIRONMENT / DEPLOYMENT** (out of this tree) |
| `.env.local` required for this host | **ENVIRONMENT / DEPLOYMENT** |

# Prompt 014 Readiness Matrix

See `docs/production-readiness/BOF-PRODUCTION-READINESS-016-MATRIX.md`.

All ten rows: **Ready for 014 = YES**, with expected 014 **FAIL** on C and G, and likely FAIL on A/B/E/H/I/J **if** 014 scores the DEMO shell as the production path.

# Required Next Actions

1. **Product owner:** keep A2/B2/C2 **or** formally change BOF scope **or** formally revise Prompt 014. Do not do this implicitly in code.
2. **Optional data (not fabrication):** create LIVE loads through existing intake so a customer `sourceRecordId` matches if Scenario H must show LIVE overlay.
3. **Run Prompt 014** as a separate authorized prompt. Do not treat this document as CERTIFIED.
4. Do not implement payment or Safety create/remove under the guise of alignment.
5. Do not convert `BofDemoDataShell` to production to obtain a 014 pass.

# Git

- Branch: `orchestrator/prompt-016-alignment`
- Did not use `git add .` / `git add -A`
- Did not push
- Did not modify the protected product worktree
- Closeout commit: `d8adf05a2bb586d4d456e6c97bdbfa8743d09d7d`
- 016 restore helper `scripts/tmp-016-restore-hold.ts` was executed and deleted (not committed)

# Final Status

READY FOR FULL PROMPT 014 EXECUTION
