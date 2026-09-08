# PROMPT 014-R3

**Program:** BOF-ORC-P009-014-MASTER-V1.0  
**Assignment:** Production capability resolution & implementation plan  
**Not:** Prompt 014 certification, Prompt 015, or product-capability implementation  
**Predecessors:** 014 BLOCKED `14e81300`; 014-R BLOCKED `2cb9e91b`; 014-R2 `61e61de8` / `cb4c4106`

Section 12: **no product code was implemented.** A1/B1/C1 were **not** selected, so payment, safety-engine, and DEMO→PRODUCTION path work are **not authorized**.

---

# Executive Decision

From existing ADRs, Gap Registry VALIDATED closeouts, and source inspection:

| Gate | Decision | Meaning for 014 |
|---|---|---|
| Payment | **A2 — PAYMENT CAPABILITY IS NOT PART OF BOF PRODUCTION SCOPE** | Scenario G cash/payment cannot PASS. Do not change Prompt 014 here. |
| Safety | **B2 — NOT A PRODUCTION CAPABILITY** (durable create/remove) | Scenario C cannot PASS. Client Zustand status edits are not durable production mutations. |
| Operator path | **C2 — DEMO OPERATOR DATA IS INTENTIONALLY THE PRODUCT MODEL** (ADR-009-001) | Conflict with 014 “no DEMO → PRODUCTION” is **documented, not silently resolved**. |
| Auth / DB | Operator/deployment only; **no code change** | B1/B2 of 014 remain until secrets + real user exist. |
| LIVE equipment | Existing Prisma PATCH; **external rows + env** | Scenario E needs LIVE rows, not DEMO T-102. |
| Viewports | Test infrastructure only; **no UI change** | 390/768 must be re-run in full 014. |

**Authorized next work:** operator environment, real session, LIVE equipment rows (not invented JSON), viewport tooling — then a **full** Prompt 014 that must still report BLOCKED on G, C, and the DEMO operator path unless a **later** product decision reverses A2/B2/C2 or a **separate** explicit change is made to the 014 standard (forbidden in this prompt).

**Unauthorized:** payment engine, safety engine, relabeling DEMO as PRODUCTION, fabricating users/rows/events.

---

# B1–B7 Decisions

| ID | R2 class | R3 path | Code? | Env/deploy? | Product decision? | LIVE data? | Test infra? | Duplicate architecture? |
|---|---|---|---|---|---|---|---|---|
| B1 AUTH_SECRET / DATABASE_URL | Operator | Operator checklist | No | **Yes** | No | DB host yes | No | No |
| B2 Operator session / role | Operator | After B1, real User + membership | No | **Yes** | No | User row yes | No | No |
| B3 Payment | Product gap | **A2** — out of production scope | **No** | No | **Closed as A2** | N/A | No | Would be new operator cash path if reversed |
| B4 LIVE equipment | Live dependency | Enable existing PATCH on real rows | No (path exists) | Yes (DB) | No | **Yes** | After env | No |
| B5 Safety create/remove | Product gap | **B2** — not durable production capability | **No** | No | **Closed as B2** | N/A | No | New engine if reversed |
| B6 DEMO operator dataset | Intentional DEMO | **C2** — ADR-009-001 stands | **No** | Env does not switch shell | **Closed as C2**; conflict with 014 remains | Prisma parallel only | No | Fourth SOT forbidden |
| B7 390/768 | Test infra | Re-execute browsers in 014 | No UI | Working browser/MCP or equivalent | No | No | **Yes** | No |

---

# Payment Decision

**A2 — PAYMENT CAPABILITY IS NOT PART OF BOF PRODUCTION SCOPE**

Evidence (do not override without a new ADR):

- Prompt 012/013: Payment stays **UNSUPPORTED**. `recordLoadInvoice` / `recordLoadPayment` have **no operator mutation route**. Cash closure = `POST /api/generate/invoice` + factoring documents. No payment engine.
- GAP-009-015 VALIDATED: document + factoring path; payment posting architecture-decision / fail-closed.
- `lib/settlement/settlement-operating-display.ts`: `payment: "UNSUPPORTED"`, `invoicePayment: "UNSUPPORTED"`.
- No `app/api` caller of `recordLoadPayment`.

Existing **non-cash** pieces remain in scope as already built: invoice **document** generate, factoring **packets**, settlement hold **representation**. They are **not** cash received.

**Prompt 014 Scenario G:** the payment portion **cannot be represented as successfully completed** unless the certification standard is separately and explicitly changed. This prompt does **not** change Prompt 014.

If a future product owner selected A1, the smallest existing-architecture sketch ( **not authorized now** ) would be an operator-gated route calling existing `recordLoadPayment` / Prisma `InvoicePayment` with existing `auth()` + fleet membership — not a new payment engine. That would require a new ADR reversing 012.

---

# Safety Decision

**B2 — NOT A PRODUCTION CAPABILITY** (durable restriction create / persist / release)

Evidence:

- `/safety` route type **DEMO**; `SafetyDashboardV4`.
- No Prisma Safety Event model; no `app/api` safety write route.
- `SafetyEventDetailDrawer` mutates `useSafetyStore` (client Zustand), not a durable store.
- 011: workbook `dispatchBlock` copied; **not** promoted into canonical dispatch HOLD; do not create a safety engine (GAP-009-010 / ADR-009-001).
- Canonical L001 HOLD is maintenance/equipment (T-102), not a created safety restriction.

**Prompt 014 Scenario C** remains blocked: create/remove a **real** restriction and verify Dispatch. Client-only status chips and workbook EVT copies do not satisfy that.

This prompt does not change Prompt 014 and does not implement a safety engine.

---

# Operator Path Decision

**C2 — DEMO OPERATOR DATA IS INTENTIONALLY THE PRODUCT MODEL**

Evidence: ADR-009-001 (resolved): operator DEMO readiness / CC dispatch-hold KPIs = BOF JSON + `listMaintenanceAssetSummaries` / `getCanonicalDispatchLoadState`; workbook REFERENCE; Prisma LIVE PENDING — no fourth SOT. `app/(bof)/layout.tsx` always mounts `BofDemoDataShell` + `getBofData()`. Command Center page type DEMO.

**ADR-009-002** remains unresolved (demo-open shell vs NextAuth on all operator surfaces). That does **not** authorize replacing JSON with Prisma as CC authority.

**Conflict with Prompt 014 (not silently resolved):** 014 forbids DEMO → PRODUCTION and requires a production operating chain. C2 means the certified operator shell **is** DEMO JSON. A full 014 re-execution must treat that as a **failed production-path condition**, not convert labels.

C1 is **not** selected. No DEMO→Prisma cutover is authorized. No JSON relabel.

---

# Authentication / Deployment Decision

Product code already fail-closes. **Do not modify auth to make testing easier.**

Operator checklist (no secret values):

| Action | System | Owner | Prerequisite | Verification | Effect on Prompt 014 |
|---|---|---|---|---|---|
| Set `AUTH_SECRET` (or documented alias) on certification/production host | Host env / Vercel env | Operator | Secret generated off-repo | `GET /api/auth/session` is not 503 `AUTH_SECRET_REQUIRED` | Unblocks auth configuration check |
| Set PostgreSQL `DATABASE_URL` | Host / Vercel | Operator | Real Postgres; not `file:` SQLite | PI no longer 503 `DATABASE_URL_REQUIRED` when authenticated | Unblocks Prisma adapter, Credentials lookup, LIVE equipment |
| Link intended Vercel project if that is production | Vercel CLI / dashboard | Operator | Known project | `vercel env ls` works; this worktree currently **unlinked** | Aligns deploy host with 014 target |
| Create real User with `passwordHash` | Postgres `User` | Operator | DATABASE_URL | Credentials sign-in returns session user id | Unblocks B2 |
| ACTIVE `FleetMembership` + operator `roleCode` (e.g. DISPATCH, FLEET_OPERATIONS, BOF_OPERATIONS, FLEET_ADMIN) | `Role` / `FleetMembership` | Operator | User + Fleet | Copilot `ROLE_OK`; generate APIs not 401 when signed in | Unblocks authenticated Load File / mutations |
| Do **not** run `provision:demo-user` as a 014 production user factory | scripts | Orchestrator/operator | — | No fabricated cert user in git | Avoids prohibition |

---

# LIVE Equipment Decision

**Existing code already supports the LIVE transition.** Missing: configuration + **real** `Equipment` rows + session.

Not missing: mutation route (`PATCH /api/dispatch/equipment/[equipmentId]/status` → `setEquipmentStatus`). Not missing: status enum AVAILABLE / UNAVAILABLE / OUT_OF_SERVICE.

Do **not** convert DEMO T-102 into LIVE. Do **not** invent rows in this prompt.

External steps: DATABASE_URL → session → `prisma.equipment` row for the fleet → PATCH status → verify dispatch assignment / CC consume **Prisma** identity, not JSON T-102.

Scenario E on DEMO T-102 remains invalid.

---

# Test Infrastructure Decision

Cause: **incomplete execution / browser MCP disconnect** in 014-R after a 390 override. Not a demonstrated product overflow defect in R2/R3.

**Action:** During full Prompt 014, lock a working browser (or equivalent) and actually measure overflow and control reachability at **390, 768, and 1366** on CC, Dispatch, and other critical routes. Do not change UI solely because MCP stopped. Do not claim viewport certification in R3.

---

# Remaining Certification Blockers

After authorized operator work, Prompt 014 would still fail (unchanged standard):

1. Scenario **G** payment — **A2**  
2. Scenario **C** safety create/remove — **B2**  
3. DEMO operator path vs 014 production-path rule — **C2**  
4. Scenario **E** until LIVE rows exist (dependency, not code)  
5. Auth/session until operator completes checklist  
6. 390/768 until 014 actually tests them  

---

# Prompt 014 Prerequisites

Full re-execution only (no abbreviated cert):

1. Operator checklist complete (secrets consumed, real session, role).  
2. LIVE equipment rows if Scenario E is to be attempted honestly (still not DEMO T-102).  
3. Browser capable of 390/768/1366.  
4. A2/B2/C2 still in force **or** a later authorized product ADR reversing them.  
5. Clean authorized worktree; no fabricated data.  
6. Repeat entire 014 system verification + scenarios A–J.

This prompt does **not** start Prompt 014.

---

# Git / Files

Recorded at closeout: see implementation-plan Git section after commit.

# Final Status

**READY FOR AUTHORIZED REMEDIATION**

Authorized = operator/env, LIVE rows, test infra, then full 014.  
Not authorized = payment, durable safety mutations, DEMO→PRODUCTION cutover, certification claims.
