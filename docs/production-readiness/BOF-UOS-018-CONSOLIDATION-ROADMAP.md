# BOF UOS 018 — Consolidation Roadmap (Phases 1–7)

Governing consolidation phases are **governance sequence**, not new engines. Prompt 018 executed **Phase 1 only**. Later phases are **not** started.

| UOS phase | Name | This audit | Why |
|---|---|---|---|
| 1 | Surface Audit & Classification | **READY** (complete in 018 docs) | Inventory + conflicts recorded |
| 2 | Authority Assignment | **NOT READY** | C2 DEMO shell vs UOS “only LIVE writes”; owner must assign one operator production path. Prompt 017 still **DECISION BLOCKED** |
| 3 | Deprecated Surface Retirement | **NOT READY** | Retirement process in governing doc **not evidenced** in-repo; nothing retired. `/dispatch-v2`, `/settlements-v2` candidates only |
| 4 | Workbook & Reference Alignment | **PARTIALLY READY** | Many sheets already labeled REFERENCE; they still feed CC KPIs / Safety / Maintenance (govern decisions visually) |
| 5 | DEMO Environment Hardening | **NOT READY** | Firewall fails: shared L00x/T-102/DRV-* keys; DEMO shell wraps LIVE pages; overlay reads Prisma on DEMO customer page |
| 6 | Cross-Surface Coherence Validation | **NOT READY** / **DEPENDENCY BLOCKED** | Dual SOT; canonical field names diverge; ≥95% **not** claimed |
| 7 | Command Center Unification | **NOT READY** | CC has DEMO + WORKBOOK + LIVE feeds; UOS requires classified **LIVE-only** display |

---

## Dependency order (do not implement in 018)

1. **Product-owner authority assignment (UOS Phase 2 + Prompt 017)**  
   Confirm LIVE Prisma as operator production path vs keep C2 DEMO as production UI. Without this, isolation work fights ADR-009-001.  
   **Owner approval required.**

2. **LIVE/DEMO firewall (Phase 5) within existing architecture**  
   Stop using L001/T-102/DRV-* as if they were Prisma ids. Keep DEMO routes explicit (`/demo`, walkthrough) **or** keep C2 but remove LIVE API mixing on those screens.  
   **UI + routing. No new SOT.**

3. **Command Center LIVE-only operating feeds (Phase 7, partial)**  
   Operating KPIs from `operating-spine` / Prisma assignment — not canonical DEMO counts. Workbook risk queue stays REFERENCE if shown.  
   **UI. Existing API.**

4. **Assignment consumes LIVE equipment + driver (Phase 6)**  
   Dispatch assignment chips bind `Equipment.id` / `Driver.id`. Wire existing PATCH in UI if operators must mutate from maintenance.  
   **UI + existing APIs. Schema already has DispatchAssignment.**

5. **Eligibility → Dispatch (Phase 6)**  
   Consume `DriverQualificationSnapshot` / readiness on assignment board.  
   **UI. Existing POST.**

6. **Maintenance Prisma ids (Phase 6)**  
   `/maintenance/[assetId]` resolve `Equipment.id` or `unitNumber` without copying T-102 into Prisma.  
   **Routing/UI.**

7. **Settlement hold single LIVE consumer (Phase 4/6)**  
   `/settlements` proof-hold = Prisma HELD; workbook Hold/review isolated as payroll REFERENCE.  
   **UI. Existing Settlement model.**

8. **Customer overlay matches (Phase 6)**  
   Only when `sourceRecordId`/`referenceNumber` match — **LIVE DATA**, do not fabricate L001.  
   **Data / intake. No DEMO copy.**

9. **Workbook alignment (Phase 4)**  
   Version/timestamp classification in UI where missing; remove workbook from live decision gates.  
   **UI. Do not delete workbooks.**

10. **Deprecated candidates (Phase 3) — after owner + retirement process**  
    `/dispatch-v2`, `/settlements-v2` labeled REFERENCE/DEMO. **Do not delete in 018.**

**Not in this sequence (product scope, do not implement):** payment A2; Safety create/remove B2.

---

## What fits existing BOF vs what does not

| Item | Existing architecture | Schema/API | UI | Env/IT | Owner | Retire later | Remain DEMO | Strict LIVE | Governed consumer |
|---|---|---|---|---|---|---|---|---|---|
| LIVE spine panel | Yes | exists | exists | session+DB | — | — | — | yes | CC/Dispatch/Loads/Settlements panels |
| Isolate DEMO shell from LIVE writes | Yes | no | yes | — | C2 | — | yes | — | — |
| CC DEMO KPI strip | Yes | no | yes | — | C2 vs UOS | or isolate | if walkthrough | KPIs must be LIVE | CC |
| Assignment T-102 | Yes | assignment model | yes | LIVE rows | — | DEMO key | T-102 demo | assignment | Dispatch |
| Equipment PATCH UI | API only | exists | **missing** | — | — | — | — | maintenance/dispatch | Equipment |
| Eligibility on Dispatch | POST exists | snapshots | **missing** | — | — | DRV-* demo | — | Dispatch | Driver |
| Maintenance Prisma 404 | SSG T-10x | Equipment exists | **routing** | — | — | — | T-102 page | Prisma id page | Equipment |
| Prisma vs workbook holds | both exist | Settlement | yes | — | ADR-009-003 | — | — | Prisma hold | Settlements |
| Customer overlay empty | overlay code | Load match | — | **LIVE DATA** | — | — | DEMO cards | overlay | Customer |
| Safety write | no | **would be new** | — | — | **B2** | — | /safety | not without owner | — |
| Payment | UNSUPPORTED | InvoicePayment unused by API | — | — | **A2** | — | — | not without owner | — |
| Canonical `dispatch_ref` / `appointment_window` / `safety_clearance_status` | — | **deviations**; do not rename in 018 | — | — | UOS vs schema | — | — | map, don’t invent | — |

---

## Prompt 014 relationship

Unmodified 014 remains **BLOCKED** until Path A/B (017) plus this isolation/integration work. 018 does **not** create a new certification standard and does **not** rerun 014.
