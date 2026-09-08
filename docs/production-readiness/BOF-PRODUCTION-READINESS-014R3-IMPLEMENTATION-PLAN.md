# PROMPT 014-R3 IMPLEMENTATION PLAN

**Companion to:** `docs/production-readiness/BOF-PRODUCTION-READINESS-014R3.md`  
**Decisions in force:** Payment **A2**; Safety **B2**; Operator path **C2**.  
**Product code in this prompt:** none.

---

# Authorized Remediation Queue

## PHASE 1 — OPERATOR / DEPLOYMENT PREREQUISITES

| Field | Value |
|---|---|
| Work | Place `AUTH_SECRET` and PostgreSQL `DATABASE_URL` on the actual 014/production host. Link Vercel only if that host is the intended runtime. |
| Dependency | Operator-owned secrets and Postgres. None invented. |
| Owner | Operator / deployment |
| Work location | Host env / Vercel dashboard — **not** git |
| Expected evidence | Names present (not values in reports). Runtime `injected env` no longer 0. Session not 503 `AUTH_SECRET_REQUIRED`. Unauthenticated PI not 503 `DATABASE_URL_REQUIRED` after auth exists (or 401 without session). |
| Blocker if incomplete | 014 B1 remains. Do not weaken fail-closed code. |

## PHASE 2 — AUTHENTICATION / REAL OPERATOR SESSION

| Field | Value |
|---|---|
| Work | Real `User` + `passwordHash` + ACTIVE `FleetMembership` with operator `roleCode`. Sign in via existing Credentials. |
| Dependency | Phase 1 |
| Owner | Operator (user admin). Orchestrator must not hard-code a user. |
| Work location | Database via existing product/admin process — **not** source-controlled credentials |
| Expected evidence | Session JSON with user id; Copilot `ROLE_OK` for operator roles; `/loads/:id` operator Load File; generate invoice 401 disappears when signed in |
| Blocker if incomplete | 014 B2; scenarios A–J remain unexecutable |

## PHASE 3 — PRODUCT CAPABILITY IMPLEMENTATION

| Field | Value |
|---|---|
| Work | **None authorized.** A2/B2/C2 forbid payment cash path, durable safety create/remove, and DEMO→PRODUCTION cutover. |
| Dependency | A later ADR would be required to reopen A1/B1/C1 |
| Owner | Product (only if reversing R3) |
| Work location | N/A this queue |
| Expected evidence | N/A |
| Blocker if incomplete | **Expected.** 014 Scenario G and C remain FAIL under current product scope |

## PHASE 4 — LIVE EQUIPMENT ENABLEMENT

| Field | Value |
|---|---|
| Work | Ensure real Prisma `Equipment` rows for the operating fleet. Use existing `PATCH /api/dispatch/equipment/[equipmentId]/status`. Do not copy DEMO T-102 into Prisma. |
| Dependency | Phases 1–2 |
| Owner | Operator / data steward |
| Work location | Postgres; existing `equipmentService` |
| Expected evidence | PATCH 200 on a Prisma `equipmentId`; status AVAILABLE↔UNAVAILABLE/OUT_OF_SERVICE; downstream dispatch/CC for **that** id |
| Blocker if incomplete | 014 Scenario E remains LIVE DEPENDENCY BLOCKED |

## PHASE 5 — DEMO → PRODUCTION PATH RESOLUTION

| Field | Value |
|---|---|
| Work | **None.** C2: ADR-009-001 stands. Do not replace `(bof)` JSON shell with Prisma as a silent SOT change. |
| Dependency | Product reversal of C2 (not selected) |
| Owner | Product (blocked) |
| Work location | N/A |
| Expected evidence | N/A |
| Blocker if incomplete | **Expected.** 014 production-path vs DEMO shell conflict remains |

## PHASE 6 — END-TO-END MUTATION TEST PREPARATION

| Field | Value |
|---|---|
| Work | Prepare to exercise **existing** authenticated workflows only (intake APIs, dispatch assignment/release, equipment PATCH, invoice **document** generate). Do not script fake payments, safety events, or DEMO mutations as LIVE. |
| Dependency | Phases 1–2; Phase 4 for E |
| Owner | Orchestrator during **full** Prompt 014 only |
| Work location | Authorized worktree + running production config |
| Expected evidence | Mutation logs/API responses + downstream UI for supported paths; explicit FAIL for G/C/DEMO path |
| Blocker if incomplete | 014 cannot claim scenario PASS; honest FAIL still required |

## PHASE 7 — 390 / 768 / 1366 TEST INFRASTRUCTURE

| Field | Value |
|---|---|
| Work | Confirm a working browser automation session before 014. Re-test those widths. No UI rewrite because MCP died. |
| Dependency | App running; preferably Phase 2 so Load File is not session-blank |
| Owner | Orchestrator / operator workstation |
| Work location | Browser tools against certification host |
| Expected evidence | Overflow and control reachability recorded at 390, 768, 1366 |
| Blocker if incomplete | 014 viewport requirement fails again |

## PHASE 8 — FULL PROMPT 014 RE-EXECUTION

| Field | Value |
|---|---|
| Work | Entire 014 standard: env, authz, ten scenarios, viewports, data authority. Binary CERTIFIED or BLOCKED. |
| Dependency | Phases 1–2 minimum; 4 and 7 for E and viewports; 3 and 5 remain empty under A2/B2/C2 |
| Owner | Orchestrator only when operator starts 014 — **not started by R3** |
| Work location | Authorized worktree |
| Expected evidence | New certification record. Under current A2/B2/C2, **CERTIFIED is not reachable**; honest **BLOCKED** is the legitimate outcome unless product later reverses those decisions or 014 is separately changed. |
| Blocker if incomplete | Do not abbreviate |

---

# External Operator Actions

1. Configure AUTH_SECRET and PostgreSQL DATABASE_URL on the real host.  
2. Optionally link Vercel to the intended project (this worktree is unlinked).  
3. Create a real operator user and role membership.  
4. Load real Equipment rows if Scenario E is to be attempted.  
5. Never commit secrets or invent 014 users in git.

---

# Code Implementation Actions

**None in R3.**

Do not implement `recordLoadPayment` operator UI (A2).  
Do not implement durable safety create/remove (B2).  
Do not switch `BofDemoDataShell` off JSON (C2).  
Do not weaken `auth.ts` / `lib/prisma.ts` fail-closed behavior.

---

# Product Decisions

| Decision | R3 resolution | Reversal would mean |
|---|---|---|
| Operator-visible cash posting | **A2 out of scope** | New ADR + operator route to existing `recordLoadPayment` / `InvoicePayment` |
| Durable safety restriction mutations | **B2 not a production capability** | New ADR + persist path; must not be a second safety engine; 011 forbade promoting workbook into canonical HOLD |
| Operator CC/dispatch dataset | **C2 DEMO JSON (ADR-009-001)** | New ADR vs 009-001; Prisma only if proven authoritative — not a fourth SOT |

Prompt 014 standard is **unchanged**.

---

# LIVE Dependencies

- PostgreSQL reachable from the certification runtime  
- `Equipment` rows with fleet scope  
- Operator session allowed to PATCH that fleet  
- Downstream consumers of Prisma equipment id (not T-102 JSON)

---

# Test Infrastructure Actions

- Restore or replace the browser MCP/session used in 014  
- Script or manually lock viewports 390 / 768 / 1366  
- Record overflow (`scrollWidth` vs `clientWidth`) and whether primary nav/actions remain usable  
- Do not treat 013 viewport VALIDATED as 014 evidence

---

# Dependency Order

```
Phase 1 (env)
  → Phase 2 (session)
    → Phase 4 (LIVE equipment rows)
      → Phase 6 (supported mutations only)
        → Phase 7 (viewports)
          → Phase 8 (full 014)
Phase 3 skipped (A2/B2)
Phase 5 skipped (C2)
```

---

# Expected Evidence

| Phase | Evidence |
|---|---|
| 1 | Session not AUTH_SECRET_REQUIRED; DATABASE_URL consumed |
| 2 | Authenticated Load File; ROLE_OK or equivalent membership |
| 4 | PATCH equipment on Prisma id; not DEMO T-102 |
| 6 | Real API/UI mutations for supported paths; G/C documented FAIL |
| 7 | 390/768/1366 actually measured |
| 8 | Binary 014 record |

---

# Stop Conditions

Stop and do not “solve” by fabrication if:

- secrets would be invented or committed  
- a fake production user would be hard-coded  
- payment would be marked SUPPORTED without cash  
- DEMO JSON would be relabeled PRODUCTION  
- DEMO T-102 would be written as LIVE  
- a new payment/safety/orchestration engine would be created  
- Prompt 014 would be edited to make CERTIFIED easier  
- Prompt 014 or 015 would be started from this assignment  

---

# Full Prompt 014 Re-Execution Gate

Do **not** start 014 from R3.

When an operator later authorizes 014, it must repeat: environment, authentication, authorization, system checks, scenarios A–J, browser 390/768/1366, data authority, cross-domain, production configuration.

Under R3 A2/B2/C2, a legitimate 014 result remains **BOF PRODUCTION READINESS BLOCKED** unless product reverses those decisions in a later authorized assignment.

---

# Git

Branch: `orchestrator/copilot-sequential-2026-09`  
Investigation HEAD: `cb4c41064bd5dab5628565dacaa00fcd7e0e8777`  
Files: this plan + `BOF-PRODUCTION-READINESS-014R3.md`  
Push: not performed  
Protected worktree: not modified
