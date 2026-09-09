# Prompt 017 — BOF Product Scope & Production Certification Alignment Decision Gate

**Status:** AUTHORITATIVE DECISION GATE  
**Not a certification.** Does not replace Prompt 014. Does not rerun Prompt 014. Does not implement product capabilities.

**Worktree:** `bof-orchestrator-copilot-sequential-2026-09`  
**Branch:** `orchestrator/prompt-017-decision-gate`  
**Date:** 2026-09-09  
**Predecessor:** Prompt 014 post-016 **BOF PRODUCTION READINESS BLOCKED** (`c0365b5e`)

---

# Executive Result

Prompt 014 failed after 015/016 for two different kinds of reasons mixed together:

1. **Standing product-scope decisions** — payment UNSUPPORTED (**A2**), durable Safety create/remove out of scope (**B2**), DEMO operator shell intentional (**C2** / ADR-009-001).  
2. **Incomplete LIVE operating integration** — assignment, Command Center KPI authority, eligibility on Dispatch, maintenance Prisma routes, customer matching, dual settlement-hold displays.

Path A would expand BOF to the unchanged 014 standard (including cash and Safety engines, and retiring DEMO as the operator production path).  
Path B would formally version Prompt 014 so C and G are out of scope and DEMO is not the certified production path — while **keeping** One Operating System rules for LIVE authoritative state and cross-domain propagation.

This gate **cannot** bind either path: it is forbidden to implement A2/B2/C2 reversal and forbidden to modify Prompt 014. That choice is the product owner’s.

# Prompt 014 Final Blocker Inventory

From the post-016 014 report (scenarios A–J all FAIL; build/auth/runtime were not the halt):

| Blocker | Evidence | Kind |
|---|---|---|
| Conflicting DEMO vs LIVE facts on operator CC/Dispatch | T-102 OOS + L001 HOLD vs LIVE tractor AVAILABLE + 94 Prisma loads | Architecture / C2 |
| DEMO operator production path | `BofDemoDataShell` on `app/(bof)/layout.tsx`; intake L004 100% | Product C2 |
| Payment/cash unsupported | `payment: "UNSUPPORTED"`; no operator `recordLoadPayment` | Product A2 |
| No Safety restriction create/remove | `/safety` REFERENCE/DEMO; no write API | Product B2 |
| LIVE equipment not on assignment | PATCH works; assignment still T-102 | Technical integration |
| `/maintenance/<prismaId>` 404 | DEMO T-102 200 | Technical / routing |
| Eligibility not consumed by Dispatch | Prisma INELIGIBLE persisted; Dispatch text had no driver id | Technical propagation |
| Proof hold vs workbook holds | Prisma HELD + LIVE panel 1; workbook Hold/review 2 | SOT conflict |
| Customer Delivered vs operator HOLD | Overlay: no matching Prisma shipment IDs | LIVE data + DEMO dual story |
| CC DEMO KPIs vs LIVE spine | 7/3 DEMO holds vs LIVE panel 161/94 | SOT conflict |
| No Prisma L001; PI-test unassigned | Load API 404 / release 409 | LIVE data |

Closed versus the *previous* 014: `/loads` and `/drivers` 500s; missing LIVE spine; missing durable eligibility and proof→HELD APIs.

# Current BOF Production Scope

**In scope today (production-intent LIVE):**

- Auth.js; role-enforced mutations; fail-closed unauthenticated 401  
- Prisma Load, Equipment, assignment/release APIs, Driver qualification/readiness snapshots  
- `GET /api/dispatch/operating-spine` and labeled LIVE panels on CC, Dispatch, Loads, Settlements  
- Proof reject → Prisma Settlement HELD  
- Customer LIVE overlay **when** a Prisma load matches demo shipment keys  
- Workbook `/settlements` as **payroll identity** (ADR-009-003), not cash  

**Intentionally out of current production scope:**

- **A2** operator cash payment / factoring *payment*  
- **B2** durable Safety restriction create/remove  
- **C2** treating DEMO JSON as the production operating dataset  

**Present but not production SOT:** DEMO Dispatch/CC KPIs, DEMO L001/T-102, DEMO customer cards, DEMO safety telematics.

# Path A Implications — Align BOF to existing Prompt 014

**Meaning:** Unchanged 014 remains the bar. BOF changes.

**Must enter product scope:** cash posting (or equivalent payment notification), Safety restriction engine, LIVE-only operator production path.

**Must be built (existing models first; no second engine):**

- Operator assignment + CC operating KPIs from Prisma only  
- DEMO isolated to an explicit demo/walkthrough (not `/command-center` production KPIs)  
- Eligibility visible on Dispatch assignment/readiness  
- LIVE equipment id on assignment and `/maintenance/:id`  
- Customer cards bound to Prisma load status  
- Intake that progresses a LIVE load through release and settlement **context**  
- Settlement hold/release as one workflow (Prisma), workbook isolated  

**Overturns:** A2, B2, C2.

**Architecture consequence:** BOF is a full fleet operating system including safety enforcement and cash. Largest program. Matches original 014 “One Operating System” language.

**Certification consequence:** After that work, a **new full Prompt 014** could theoretically CERTIFY. This 017 gate does not start that work.

# Path B Implications — Formally revise Prompt 014

**Meaning:** BOF keeps A2, B2, C2. Prompt 014 is **formally versioned** by the owner (not in this prompt).

A revision that merely deletes failing scenarios to obtain CERTIFIED is **forbidden**. Core principles that must remain:

- One authoritative LIVE operational fact per domain that BOF claims to operate  
- Cross-domain propagation on that LIVE path  
- Coherent load → dispatch → driver → equipment → proof → settlement **context** (not cash)  
- Authentication / authorization / no unauthorized mutations  
- No hidden demo data on **claimed production** paths  

**Allowed 014 changes:**

- Scenario **C** → OUT OF SCOPE (B2), not FAIL  
- Scenario **G** cash → OUT OF SCOPE (A2), not FAIL; documents stay documents  
- Production path definition → **LIVE Prisma spine**, not `BofDemoDataShell`  
- Scenarios A/B/D/E/F/H/I/J re-pointed at LIVE ids and LIVE consumers  

**Still required after Path B (implementation, later prompts):** isolate DEMO so it cannot contradict LIVE on certified screens; put eligibility and LIVE equipment on assignment; CC LIVE as the operating picture; maintenance Prisma routes; customer overlay matches; single proof-hold SOT.

**Architecture consequence:** BOF stays an operations OS **without** cash and **without** a Safety mutation engine. DEMO walkthrough may remain if isolated. Certification becomes “LIVE spine production-ready,” not “DEMO board is production.”

**Certification consequence:** Unchanged 014 stays BLOCKED forever while A2/B2/C2 hold. Only a **new 014 version** plus remaining LIVE isolation/integration work can CERTIFY.

# Source-of-Truth Reconciliation

Authoritative table: `docs/production-readiness/BOF-PRODUCTION-READINESS-017-DECISION-MATRIX.md` §3.

Summary:

| Fact pair | Keep as |
|---|---|
| Prisma Load / Equipment / proof hold | **LIVE AUTHORITATIVE** |
| DEMO L001 / T-102 / CC canonical KPIs / DRV-* | **DEMO — TO BE ISOLATED** (not relabeled LIVE) |
| Workbook settlement HOLD-* / STL-* | **REFERENCE** payroll — **TO BE ISOLATED** from load-proof holds |
| Customer DEMO cards | **DEMO**; overlay **LIVE** when matched |
| Safety telematics / EVT copies | **DEMO / REFERENCE** |
| Payment | **UNSUPPORTED** |
| Invoice / factoring files | **DOCUMENT** |

Do not silently delete or relabel.

# Technical Gaps (not product-scope)

These remain even if C and G are later ruled out of certification:

1. Dispatch assignment identity still DEMO T-102  
2. Command Center primary KPIs still DEMO  
3. Eligibility not shown on Dispatch  
4. `/maintenance/<prismaId>` 404  
5. Prisma proof hold not the `/settlements` payroll board  
6. Customer overlay has no matching shipment IDs  
7. LIVE PI-test load has no assignment → release 409  
8. Mixed `/drivers` DEMO roster  

Class: **TECHNICAL / INTEGRATION**, given C2. Not solved by revising 014 unless 014 also drops LIVE assignment/CC/customer requirements (that would violate One Operating System and is **not** recommended).

# Product Decisions (already on the books)

| Code | Decision | 014 impact if unchanged |
|---|---|---|
| A2 | Payment not BOF production scope | G cannot PASS |
| B2 | No durable Safety create/remove | C cannot PASS |
| C2 | Operator DEMO JSON shell intentional | DEMO cannot be the production path; dual SOT fails 014 |

017 does **not** reverse or ratify these as a new selected path. It records them as the conflict 014 measured.

# Certification Implications

- **Do nothing:** every future **unmodified** 014 re-exec remains **BLOCKED**.  
- **Path A only:** 014 can stay V1.0; BOF must grow into cash + Safety + LIVE-only operator path.  
- **Path B only:** 014 must be formally revised; BOF must still isolate DEMO and finish LIVE propagation.  
- **Hybrid (owner may choose later):** keep A2/B2 (so 014 C/G must be revised) **and** still do LIVE spine unification (so BOF still changes). That hybrid is **not** selectable as Path A or Path B under this prompt’s binary.

# Required Next Implementation Phases

**Not started in 017. Not Prompt 018.**

If the owner later selects **Path A:**

1. Product ADR reversing A2/B2/C2 (or stating the new scope).  
2. LIVE operator path (assignment, CC KPIs, intake) — existing Prisma, no new SOT.  
3. Safety restriction write + Dispatch enforcement.  
4. Operator payment path.  
5. Customer Prisma binding; maintenance Prisma routes.  
6. Full Prompt 014 re-exec.

If the owner later selects **Path B:**

1. Written Prompt 014 V1.1 / 014-B (owner-authored), preserving LIVE propagation and forbidding hidden demo.  
2. DEMO isolation so certified surfaces cannot contradict LIVE.  
3. LIVE assignment, eligibility on Dispatch, CC LIVE-as-operating-view, maintenance ids, overlay matches.  
4. Full execution of the **revised** 014 — not a silent pass of V1.0.

Until that owner act: **do not** rerun 014 V1.0 expecting a different binary result.

# Git

- Branch `orchestrator/prompt-017-decision-gate` from `be5cbade`  
- Closeout commit: `dc889d9ab122cd0d6d53e1185b2e45356453106a`  
- No product code changes  
- Protected worktree not modified  
- Prompt 014 text not modified  
- Prompt 018 not created  

# Explicit Product-Owner Decision

This orchestrator cannot select Path A (would expand BOF into cash/Safety/DEMO retirement without owner authority and against A2/B2/C2).  
It cannot select Path B (would formally revise Prompt 014, which this gate is forbidden to do).  
Ease of coding was not used as a substitute for that choice: Path B is smaller; Path A matches the original 014 OS bar; both are coherent; **neither is implied solely by code**.

# Final Status

DECISION BLOCKED — PRODUCT OWNER DECISION REQUIRED
