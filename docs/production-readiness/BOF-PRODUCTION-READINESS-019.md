# Prompt 019 — Path A Recording & UOS Phase 2 Authority Assignment

**Not certification.** Prompt 014 was not modified and not executed. Payment and Safety writes were **not** implemented.

**Branch:** `orchestrator/prompt-019-authority-assignment`  
**Date:** 2026-09-09  
**Owner act:** Path A selected (binding)

---

# Executive Result

The product owner formally selected **PATH A — ALIGN BOF TO THE EXISTING PROMPT 014 / UOS STANDARD.**

That decision is recorded. UOS **Phase 2 Authority Assignment** is complete as **governance documentation**: LIVE Prisma/API surfaces are the production mutators; DEMO/WORKBOOK/REFERENCE are isolated or subordinated; Command Center production feeds are assigned to the existing LIVE operating-spine (not DEMO KPIs).

Minimum **payment** and **Safety** scopes are **designed from existing BOF types** and **blocked from implementation in this phase**. Next consolidation work is DEMO firewall / CC LIVE-only UI using existing APIs (UOS Phases 5 and 7), not new engines.

# Binding Decision

See `docs/production-readiness/BOF-PRODUCTION-READINESS-017-PATH-A-DECISION.md`.

# Authority Assignment

See `docs/production-readiness/BOF-UOS-019-AUTHORITY-ASSIGNMENT.md` (018 surface IDs).

# Payment — minimum legitimate scope (design only)

**014 / UOS need:** after settlement hold, a downstream **payment** (or factoring *payment*) notification, then hold release — not invoice PDF generation.

**Existing architecture (reuse):**

- Prisma `Invoice`, `InvoicePayment` (`status` RECORDED, `paidAt`, `amount`, `loadId`)  
- `recordLoadPayment` in `lib/process-intelligence/load-to-cash-service.ts` (tenant assert, idempotency, `PAYMENT_RECORDED` process event)  
- **No** `app/api` caller; operator UI states `payment: "UNSUPPORTED"`  
- Factoring HTML / `POST /api/generate/invoice` remain **documents**

**Minimum legitimate capability (when a later prompt implements):**

1. Authenticated operator `POST` that calls **existing** `recordLoadPayment` (amount, paidAt, invoiceId, loadId, fleetId).  
2. Persist `InvoicePayment` and process event only.  
3. Optional: set related Prisma `Settlement` off `HELD` when that is the same load-proof hold — **only** if product rules say cash clears hold; otherwise keep hold-release as a separate existing-status update.  
4. Surface the recorded payment on the LIVE load/settlement consumer (not workbook payroll as cash).  
5. Factoring packet stays a document; do not relabel it payment.

**Out of minimum scope:** Paylocity, card processors, new payment engine, treating generate/invoice as cash.

**This phase:** documented only. A2 remains **UNSUPPORTED in product behavior** until that API is authorized and built.

# Safety — minimum legitimate scope (design only)

**014 / UOS need:** create a restriction, Dispatch/release consumes it, remove/resolve, Dispatch reflects removal. Not DEMO telematics.

**Existing architecture (reuse, no Safety model):**

- No Prisma `SafetyEvent`  
- `OperatingException` (`entityType`, `entityId`, `exceptionType`, `status` OPEN→VERIFIED, `ownerTeam`)  
- `OperatingCorrectiveAction`  
- Release API already fail-closes without assignment; does **not** currently query Safety  
- Workbook `Safety_Events.dispatchBlock` is REFERENCE/DEMO copies

**Minimum legitimate capability (when a later prompt implements):**

1. Reuse `OperatingException` with a **fixed** `exceptionType` (e.g. `SAFETY_RESTRICTION`) and `entityType` `Driver` (or Load). This is **not** a new Safety platform.  
2. Authenticated create (OPEN) and resolve/verify (RESOLVED/VERIFIED) via existing PI store patterns + `auth()`.  
3. Dispatch **release evaluation** and assignment UI consume **open** exceptions of that type (LIVE), not workbook `dispatchBlock`.  
4. `/safety` DEMO/workbook remains isolated until it is a governed consumer of those exceptions.

**Out of minimum scope:** telematics ingestion, CSA scoring, a second Safety Event schema, fabricating EVT-001 into Prisma.

**Conflict note:** Prompt 014-R2 warned against casually treating OperatingException as a Safety engine. Path A now **explicitly** reuses that existing model as the *minimum* restriction record so a **new** Safety SOT is not created. Implementation still requires a later authorized build prompt.

**This phase:** documented only. B2 remains **absent in product behavior**.

# What must not be built as a new OS

- No second Command Center, Load, Driver, Equipment, Proof, Settlement, or Customer engine  
- No UOS software registry  
- No DEMO→Prisma copy of L001/T-102  

# Seven-phase status after Path A + Phase 2

| UOS phase | Status |
|---|---|
| 1 Surface audit | READY (018) |
| 2 Authority assignment | **READY** (this recording) |
| 3 Deprecated retirement | NOT READY (process not run) |
| 4 Workbook alignment | PARTIALLY READY |
| 5 DEMO hardening | **NOT READY** — next implementation phase |
| 6 Coherence validation | NOT READY |
| 7 CC unification | NOT READY — may proceed in parallel with 5 using LIVE panel as production feed |

# Next controlled implementation phase

**UOS Phase 5 DEMO firewall + Phase 7 CC production feeds**, using existing `operating-spine` and dispatch APIs:

1. Isolate DEMO keys (L001, T-102, DRV-*) from production operator decisions.  
2. Make Command Center **production** operating counts consume LIVE spine/assignment, not canonical DEMO HOLD/T-102.  
3. Bind assignment UI to Prisma equipment/driver.  
4. Do **not** implement payment or Safety in that phase unless a separate authorized build prompt says so after this design.

# Prompt 014

Unchanged. Not executed. Still BLOCKED until Path A implementation exists in product behavior.

# Validation

No product code changes. Typecheck/lint/build not re-run for docs-only work. Prisma schema not migrated.

# Git

Branch `orchestrator/prompt-019-authority-assignment` from 018 HEAD. Protected worktree not modified. No push.

# Final Status

PATH A RECORDED — UOS PHASE 2 AUTHORITY ASSIGNMENT COMPLETE
