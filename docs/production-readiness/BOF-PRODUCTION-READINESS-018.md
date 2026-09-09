# Prompt 018 — BOF UOS Authority Reconciliation & Consolidation Phase 1

**Not certification.** Does not rerun Prompt 014. Does not declare production-ready. Does not create a parallel governance engine or source-of-truth registry.

**Branch:** `orchestrator/prompt-018-uos-phase1`  
**Date:** 2026-09-09  
**Predecessors:** 014 post-016 BLOCKED; 015 gap closure; 016 ready-for-014; 017 DECISION BLOCKED  

# Executive Result

Phase 1 surface audit is complete from **source, schema, APIs, and prior authenticated runtime** (014/016). BOF already has a LIVE Prisma operating path (loads, equipment, assignment models, proof→hold, eligibility) **beside** an intentional DEMO operator shell and workbook REFERENCE feeds.

That mix **does not conform** to the governing UOS rules as quoted in Prompt 018: LIVE is the only production authority; DEMO is sandbox; WORKBOOK may not govern live decisions; Command Center may display **classified LIVE feeds only**.

No product code was changed. Payment (A2) and Safety writes (B2) were not implemented. DEMO was not converted to LIVE. Nothing was retired.

The full governing file *BOF Product Authority & Operating-System Consolidation Prompt V1.0* was **not present in this worktree**. This audit applies the classification, firewall, canonical-field, Command Center, workflow, conflict-type, and seven-phase rules **as stated in Prompt 018**. Formal retirement / change-control **procedures** from that attachment are **not claimed executed**.

# Governing Authority

| Item | Application |
|---|---|
| Document | BOF Product Authority & Operating-System Consolidation Prompt, Version 1.0, Effective 9 Sep 2026, Status ACTIVE — **quoted by Prompt 018**; file not in repo |
| Surface classes | LIVE, DEMO, WORKBOOK, REFERENCE, DEPRECATED |
| LIVE writes | Only designated LIVE domain surface |
| DEMO | Sandbox; synthetic/anonymized; must not govern LIVE |
| WORKBOOK | Subordinate; must not govern live decisions |
| REFERENCE | Documentation only |
| DEPRECATED | Reads/writes retired via governing process (not performed here) |
| Prior ADRs | ADR-009-001 (C2 DEMO shell), ADR-009-003 (payroll workbook), A2, B2 remain unless owner changes them |

This document **supersedes prior operational guidance where conflicts exist** for **governance intent**. It does not silently rewrite ADR-009-001 in code.

# Current Surface Inventory

Complete table: `docs/production-readiness/BOF-UOS-018-SURFACE-AUDIT.md`.

Nine domains are covered (LOAD, DISPATCH, EQUIPMENT, DRIVER, SAFETY, SETTLEMENT, CUSTOMER, PROOF, COMMAND CENTER) plus the `(bof)` DEMO shell. Duplicate/legacy routes (`/dispatch-v2`, `/settlements-v2`, `/customer-portal` walkthrough) are classified REFERENCE/DEMO, not new engines.

# LIVE Authority Map

| Domain | LIVE write | LIVE read |
|---|---|---|
| LOAD | `POST/PATCH /api/dispatch/load` | operating-spine; `/loads` panel; trip-release by cuid |
| DISPATCH | assignment, unassign, release, pretrip APIs | operating-spine; Prisma assignment |
| EQUIPMENT | `PATCH /api/dispatch/equipment/:id/status` | spine equipment list |
| DRIVER | `POST .../eligibility` (+ vault/docs) | operational-summary |
| SAFETY | **none** | none |
| PROOF | `POST .../proof/reject` | proof rows |
| SETTLEMENT | hold via proof reject | spine `heldSettlements` |
| CUSTOMER | none | overlay `Load` match |
| COMMAND CENTER | none | LIVE panel only (not canonical KPIs) |

# DEMO Boundary

**Does not conform to UOS DEMO firewall.**

| Rule | Actual |
|---|---|
| DEMO sandbox-only | `BofDemoDataShell` wraps **all** `(bof)` operator routes including LIVE panels |
| Synthetic data | `lib/demo-data.json` L001, T-102, DRV-* |
| No LIVE→DEMO | Customer `/portals/customer` reads Prisma into a DEMO page (overlay). LIVE equipment listed on DEMO Dispatch/CC |
| No DEMO→LIVE | No evidence DEMO T-102 was written to Prisma (014 forbade it). DEMO intake does not create Prisma L001 |
| Shared identifiers | **L001**, **T-102**, **DRV-*** used as if operational keys; Prisma uses cuids |
| DEMO connected to LIVE decisions | Operators see DEMO HOLD/T-102 OOS as Command Center/Dispatch truth while LIVE tractor is AVAILABLE |
| Recommended | Isolate DEMO to explicit sandbox; do **not** delete DEMO data in 018 |

# Workbook / Reference Boundary

| Artifact | Loader | Classified in UI? | Version/timestamp | Operational influence |
|---|---|---|---|---|
| V4/V3/V2 xlsx via `getV3OperationalData` | `lib/v3-operational-loader.ts` | Often labeled REFERENCE | Build-time workbook; not UOS-versioned per surface | **Yes** — CC risk queue, Safety events, Maintenance assets, RFID |
| Weekly_Settlements / Payroll / Settlement Holds | same + `getBofData` bootstrap | ADR-009-003 AUTHORITATIVE for **payroll identity**; UOS says workbook must not govern LIVE | Period labels in UI | **Yes** — `/settlements` Hold/review 2 vs Prisma holds |
| Safety_Events.dispatchBlock | workbook | REFERENCE on `/safety` | sheet | **Yes** visually (watchlist) |
| `/settlements/workbook` | `getBofData` | workbook grid | — | planning |
| `/dispatch-v2`, `/settlements-v2` | labeled REFERENCE/DEMO | yes | — | should not govern LIVE |

Deprecated references remain reachable (v2 routes). **Not deleted.**

# Command Center Feed Audit

| Feed | Source | Class | UOS allowed as CC operating display? |
|---|---|---|---|
| Canonical attention / HOLD / T-102 OOS | `getCanonicalDispatchLoadState`, `listMaintenanceAssetSummaries`, `useBofDemoData` | **DEMO** | **No** (UOS: LIVE feeds only) |
| Operational risk queue | `getV3OperationalData` + canonical injectors L008/L009 | **WORKBOOK** + DEMO | **No** as operating authority |
| Settlement CC summary | `buildSettlementCommandCenterSummary` workbook | **WORKBOOK / DERIVED** | **No** for LIVE decisions; payment UNSUPPORTED |
| LIVE operating spine panel | `/api/dispatch/operating-spine` | **LIVE** | **Yes** |
| Copilot advocate | session + DEMO/canonical predicates | MIXED | Not LIVE SOT |

Downstream: operators act on DEMO HOLD while LIVE spine shows different equipment/hold counts (014 Scenarios B, E, I).

# Domain Workflow Handoffs

Governing chain: LOAD → DISPATCH → EQUIPMENT → DRIVER → SAFETY → PROOF → SETTLEMENT → CUSTOMER → COMMAND CENTER.

| Handoff | Producer | Consumer | Trigger | Persistence | LIVE / DEMO / UI |
|---|---|---|---|---|---|
| Intake → Load | DEMO packet `/dispatch/intake` | DEMO L00x | UI | not Prisma L001 | **DEMO UI** |
| Load create | `POST /api/dispatch/load` | Prisma Load | API | Prisma | **LIVE** (underused by operator intake) |
| Load → Assignment | `POST /api/dispatch/assignment` | DispatchAssignment | API | Prisma | **LIVE**; 014 PI-test had none (409) |
| Equipment status | PATCH API | Equipment + spine | API | Prisma | **LIVE**; **UI-missing**; DEMO T-102 separate |
| Driver eligibility | POST eligibility | snapshots | API | Prisma | **LIVE**; Dispatch **UI-missing** |
| Safety → Dispatch | none | DEMO watchlist | link | none | **DEMO / B2** |
| Proof → hold | proof/reject | Settlement HELD + spine | API | Prisma | **LIVE**; payroll UI **WORKBOOK** |
| Hold → payment | none | — | — | — | **UNSUPPORTED A2** |
| Load → customer | overlay match | `/portals/customer` | page read | Prisma read | **LIVE overlay empty**; cards **DEMO** |
| Any → CC | mixed feeds | CommandCenterV4 | render | none | **MIXED** |

No new event bus. Existing HTTP + Prisma + client fetch.

# Dual-Source-of-Truth Conflicts

Local IDs for this audit only (not Gap Registry rewrites). Types: stale reference, unauthorized write, demo contamination, sync failure.

| ID | Domain | A | B | Class A / B | Conflict | Observed | Type | Impact | Authority | Severity | Code? | Owner? | Env? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| UOS-018-01 | LOAD | `/loads/L001` | Prisma load GET | DEMO / LIVE | L001 identity | DEMO HOLD vs **404** | demo contamination | Dual load existence | LIVE = Prisma (no row) | High | isolate DEMO key | C2 | no fabricate L001 |
| UOS-018-02 | EQUIPMENT | T-102 OOS | `ASSIGNMENT-TRACTOR-…` AVAILABLE | DEMO / LIVE | equipment_id | 014/016 both | demo contamination | Assignment vs PATCH | LIVE = Prisma equipment | High | assignment UI | C2 | — |
| UOS-018-03 | CC | Canonical 7/3 HOLD | Spine 161/94 | DEMO / LIVE | operating counts | 014 I | demo contamination | Wrong operating picture | LIVE panel only | High | CC UI | C2 vs UOS | — |
| UOS-018-04 | SETTLEMENT | Workbook Hold/review 2 | Prisma HELD 1 | WORKBOOK / LIVE | settlement_status | 014 F | sync failure (intentional dual) | Hold not one workflow | LIVE = Prisma hold | High | UI isolate | ADR-009-003 | — |
| UOS-018-05 | CUSTOMER | L001 Delivered | Operator L001 HOLD | DEMO / DEMO | customer-visible status | 014 H | demo contamination | Customer vs operator story | neither LIVE | High | overlay+isolation | don’t expose OOS | LIVE match ids |
| UOS-018-06 | DRIVER | DRV-* roster | Prisma driver cuid | DEMO / LIVE | driver_id | 014 D | demo contamination | Eligibility not on Dispatch | LIVE = snapshots | High | Dispatch UI | — | — |
| UOS-018-07 | DISPATCH | DEMO board identity | LIVE spine list | DEMO / LIVE | mixed board | 016/014 | demo contamination | LIVE data on DEMO surface | split | High | firewall | C2 | — |
| UOS-018-08 | EQUIPMENT | `/maintenance/T-102` | `/maintenance/<cuid>` 404 | DEMO / missing LIVE | route | 014 | stale reference / gap | Cannot open LIVE asset | LIVE route missing | Medium | routing | — | — |
| UOS-018-09 | SAFETY | `/safety` DEMO | (no LIVE) | DEMO / absent | safety_clearance_status | 014 C | n/a LIVE | Cannot satisfy UOS safety handoff or 014 C | no LIVE writer | High | **do not** add engine in 018 | **B2** | — |
| UOS-018-10 | SETTLEMENT | payment UNSUPPORTED | 014 G / UOS settlement workflow | UNSUPPORTED | cash | 014 G | product | UOS chain vs A2 | A2 stands | High | **do not** implement | **A2** | — |

No unauthorized LIVE write from cookie-less clients (401). DEMO Zustand holds are not Prisma (stale/demo, not unauthorized production write).

# Canonical Field Audit

See `BOF-UOS-018-SOURCE-OF-TRUTH-MATRIX.md`. Fields were **not** renamed.

Deviations: `id` vs `load_id`; no `dispatch_ref`; split appointment windows; dual settlement status spaces; **no** `safety_clearance_status`. ≥95% coherence **not** claimed.

# Prompt 014 Relationship

014 remains the certification standard and remains **BLOCKED**. 018 does not weaken it. 015/016 closed engineering 500s and added LIVE APIs/panels. Remaining 014 failures map to UOS-018-01…10 plus A2/B2/C2. 017 still requires an owner Path A or B.

# Product-Scope Conflicts

| Decision | UOS / 014 conflict | 018 action |
|---|---|---|
| A2 payment UNSUPPORTED | UOS SETTLEMENT handoff and 014 G expect payment notification | Documented. **Not implemented** |
| B2 no Safety write | UOS SAFETY handoff and 014 C | Documented. **Not implemented** |
| C2 DEMO operator shell | UOS LIVE-only CC and DEMO firewall | Documented. **Not converted** |

# Seven-Phase Readiness

| Phase | Status |
|---|---|
| 1 Surface Audit & Classification | **READY** |
| 2 Authority Assignment | **NOT READY** (017 blocked; C2 vs UOS) |
| 3 Deprecated Surface Retirement | **NOT READY** (process not run) |
| 4 Workbook & Reference Alignment | **PARTIALLY READY** |
| 5 DEMO Environment Hardening | **NOT READY** |
| 6 Cross-Surface Coherence Validation | **NOT READY** |
| 7 Command Center Unification | **NOT READY** |

Later phases **not** executed.

# Required Remediation Sequence

See `BOF-UOS-018-CONSOLIDATION-ROADMAP.md`. First: owner authority assignment, then DEMO firewall and CC LIVE-only KPIs using **existing** spine/APIs, then assignment/eligibility/maintenance/settlement-hold isolation, then customer match (data). Payment and Safety writes remain owner-gated.

# Environment Dependencies

- `DATABASE_URL`, `AUTH_SECRET`, operator session (present on cert host 014/016)  
- LIVE rows exist (94 loads, 161 equipment) — **do not** copy DEMO into them  
- Matching `sourceRecordId` for customer overlay is **LIVE DATA**, not fabrication  
- Protected worktree GAP-009-031 remains independently dirty  

# Product Decisions Required

1. Prompt 017 Path A vs Path B (still required).  
2. Whether Command Center operating KPIs may remain DEMO under C2 despite UOS LIVE-only rule.  
3. Whether A2/B2 remain (recommended: remain unless owner funds engines).  
4. Formal UOS attachment should be stored in-repo as **governance documentation** (not a software platform).

# Validation

| Check | Result |
|---|---|
| Typecheck | PASS (`npm run typecheck` exit 0, shell `899665`) |
| Lint | PASS (`npm run lint` exit 0, shell `899666`) |
| Prisma validate | PASS |
| Production build | **not re-run** (no product code changes; last 014 build exit 0) |
| Data / migrations / users / payment / Safety writes | **not altered** |

# Git

- Dedicated branch `orchestrator/prompt-018-uos-phase1`  
- No `git add .` / `git add -A`  
- No push  
- Protected product worktree not modified  
- Prompt 014 not run; Prompt 019 not created  

# Final Status

PROMPT 018 COMPLETE — READY FOR CONSOLIDATION IMPLEMENTATION
