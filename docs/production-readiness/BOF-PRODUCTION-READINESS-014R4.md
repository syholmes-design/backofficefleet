# PROMPT 014-R4

**Program:** BOF-ORC-P009-014-MASTER-V1.0  
**Assignment:** Authorized deployment & certification prerequisite execution  
**Not:** Prompt 014, Prompt 015, payment/safety/DEMO cutover  
**R3 decisions preserved:** Payment **A2**; Safety **B2**; Operator path **C2**  
**Predecessor HEAD:** `001547ef0bea7ee060889884a02886b4776226c6`

No product-capability code was changed. Secrets were not invented, committed, or printed.

---

# Executive Result

**PREREQUISITES BLOCKED**

Workstream A (configuration consumed by the app) is complete on this certification host.

Workstream B (a real signed-in operator session) is **not** complete: the database contains operator memberships and password hashes, but this assignment has **no operator-supplied login password** and must not fabricate one.

Workstream C: LIVE Prisma `Equipment` rows **exist** and include mixed statuses. The existing PATCH mutation was **not** executed because it requires the missing session. DEMO T-102 was **not** copied into LIVE.

Workstream D: browser MCP was unavailable; 390/768/1366 were **not** re-measured. This remains test-infrastructure preparation, not a UI rewrite.

Full Prompt 014 must **not** start automatically.

---

# Production Configuration

Source: operator-supplied gitignored `.env.local` already present on the **protected** product worktree (key names include `AUTH_SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL`). Copied to the **authorized** worktree `.env.local` (gitignored; `git check-ignore` confirms `.env*`). Protected worktree was **not** modified. Values are not recorded here.

Runtime: `npx next start -p 3010` Ready. Prisma/dotenv reported `injected env (26) from .env.local` on CLI queries (count only; not a secret dump).

## AUTH_SECRET

| Check | Result |
|---|---|
| Present on host (name only) | Yes (gitignored `.env.local`) |
| Invented | No |
| Committed | No |
| Functionally used | **Yes.** `GET /api/auth/session` returned unauthenticated NextAuth JSON `null`, **not** 503 `AUTH_SECRET_REQUIRED`. `GET /api/auth/providers` returns Credentials provider. |

## DATABASE_URL

| Check | Result |
|---|---|
| Present / not `file:` | `isDatabaseUrlConfigured()=true` |
| Invented | No |
| Functionally used | **Yes.** Prisma counts succeeded against the configured PostgreSQL database. |
| PI unauthenticated | `GET /api/load-process-intelligence/discovery` **401** `AUTH_REQUIRED` (session gate), **not** 503 `DATABASE_URL_REQUIRED` |

Fail-closed behavior for **missing** secrets was not removed. This host is no longer in the missing-secret state.

Note: Auth.js `signinUrl` advertised `localhost:3000` while the certification listener is **3010**. That is an operator `NEXTAUTH_URL` alignment issue, not a reason to invent a new auth system.

---

# Operator Session

| Field | Result |
|---|---|
| User | **Not signed in.** Database has 15 users, 12 with `passwordHash`. No email/password was supplied to this prompt. None invented. |
| Role | Schema/memberships exist: 5 roles, 11 memberships, **7** ACTIVE memberships in operator role codes (BOF_OPERATIONS, DISPATCH, FLEET_*, etc.). Not bound to a live session. |
| Session | Unauthenticated `null` session JSON. Credentials provider available. |
| Authorization | Unauthenticated generate invoice **401** `AUTH_REQUIRED`; equipment PATCH **401** Unauthorized. Guards were **not** weakened. |

**Blocked:** login/session establishment and protected mutation authorization as an authenticated operator.

---

# LIVE Equipment

| Field | Result |
|---|---|
| Data source | Prisma `Equipment` via operator `DATABASE_URL` (LIVE path). Not BOF JSON T-102. |
| Row/state | **161** rows: AVAILABLE 154, UNAVAILABLE 5, OUT_OF_SERVICE 2. Sufficient mix for a later Scenario E **if** authenticated. |
| Mutation path | Existing `PATCH /api/dispatch/equipment/[equipmentId]/status` → `setEquipmentStatus`. Unauthenticated call **401**. **Not executed.** |
| Downstream verification | **Not performed** (no authorized mutation). DEMO T-102 not relabeled LIVE. |

Scenario E is **closer** (LIVE rows exist) but **not** genuinely testable until Workstream B completes.

---

# Browser Certification Environment

| Width | 014-R4 |
|---|---|
| 390 | **Not measured** — `cursor-ide-browser` MCP did not re-register |
| 768 | **Not measured** (same) |
| 1366 | **Not re-measured** in R4 |

Prior 014 1366 overflow 0 is **not** claimed as this assignment’s evidence. No UI change for MCP failure. Runtime `:3010` is up for a later 014 browser pass.

---

# Product-Scope Decisions Preserved

| Decision | Status |
|---|---|
| Payment | **UNSUPPORTED / A2 / out of BOF production scope.** No payment API, model, route, or cash posting added. |
| Safety | **Durable create/remove not a production capability (B2).** No safety events manufactured. |
| DEMO operator path | **C2 / ADR-009-001 unchanged.** `(bof)` JSON shell not relabeled PRODUCTION. |

---

# Validation Results

| Check | Result |
|---|---|
| Lint | PASS (`npm run lint` exit 0) |
| Typecheck | PASS (`npm run typecheck` exit 0) |
| Prisma validate | PASS |
| Runtime startup | PASS (`next start -p 3010` Ready) |
| Production build | Not rebuilt in R4; serving existing production build |
| Authentication | Secret **consumed**; unauthenticated session `null`; **no login** |
| Authorization | Unauthenticated mutations 401; not bypassed |
| Equipment | LIVE counts via Prisma; PATCH not authorized |
| Browser | MCP unavailable |

---

# Remaining Prompt 014 Blockers

Authorized-prerequisite remainder:

1. **Real operator login password/session** (B2) — users exist; credentials not available to this agent without fabrication.  
2. **Authenticated LIVE equipment PATCH + downstream verify** (C) — rows exist; mutation blocked on session.  
3. **390 / 768 / 1366 actual measurement** (D) — test infrastructure.  

Unchanged product-scope (R3; will still fail 014 CERTIFIED):

4. Payment A2 → Scenario G  
5. Safety B2 → Scenario C  
6. DEMO operator JSON C2 → 014 production-path rule  

---

# Full Prompt 014 Readiness

**Not ready.** Configuration is on this host and the app consumes it, but a legitimate operator session and viewport evidence are missing. Do not start Prompt 014 from R4.

When an operator later signs in with a real account and browser tools work, a **full** 014 may run. Under A2/B2/C2 it should still end **BLOCKED** unless product later reverses those decisions.

---

# Git

Branch: `orchestrator/copilot-sequential-2026-09`  
`.env.local`: gitignored, not committed  
Product code: unchanged  
Push: not performed  

# Final Status

**PREREQUISITES BLOCKED**
