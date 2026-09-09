# Prompt 020 — Production-surface DEMO firewall + Command Center LIVE-feed consolidation

**Not certification.** This prompt is implementation-complete for the DEMO/LIVE boundary and Command Center LIVE-only production feeds. It does **not** certify UOS, Prompt 014 Production Readiness, payment/cash closure, Safety mutation, canonical-field coherence, or seven-phase UOS completion.

**Branch:** `orchestrator/prompt-020-demo-firewall`  
**Date:** 2026-09-09  
**Base:** `d9daabc902236b27ff62ecb3ba7e6e2d8ad225fb` (Prompt 019)  
**Closeout commit:** `de9100aabdbb393d7b58c8baa521d0791b36bdaa`

---

# 1. Prompt 020 status

PROMPT 020 COMPLETE — READY FOR NEXT UOS PHASE

Path A remains binding. LIVE Prisma/API is production operational authority. DEMO is a preserved sandbox. WORKBOOK/REFERENCE are not used as production operational authority on the remediations in this prompt.

---

# 2. Current branch and commit

Recorded at closeout: `de9100aabdbb393d7b58c8baa521d0791b36bdaa` on `orchestrator/prompt-020-demo-firewall`.

---

# 3. Files changed

Firewall / LIVE lookups:
- `lib/uos/demo-operational-keys.ts` (new)
- `lib/services/loadService.ts`
- `lib/services/equipmentService.ts`
- `lib/services/dispatchAssignmentService.ts`
- `lib/services/driverEligibilityReviewService.ts`

Command Center:
- `app/(bof)/command-center/page.tsx` — production LIVE only
- `components/command-center/ProductionCommandCenter.tsx` (new)
- `app/(bof)/demo/command-center/page.tsx` (new) — preserved DEMO CC
- `components/command-center-v4/CommandCenterV4.tsx` — DEMO labeled; LIVE spine panel removed from DEMO KPIs

Operator / dispatch / loads / drivers:
- `app/(bof)/layout.tsx` + `components/operations/OperatorSurfaceModeBanner.tsx`
- `components/dispatch/DispatchShell.tsx`
- `components/dispatch/DispatchBoardScreen.tsx`
- `app/(bof)/demo/dispatch/page.tsx`
- `components/loads/LoadsPageClient.tsx`
- `app/(bof)/demo/loads/page.tsx`
- `app/(bof)/loads/[id]/page.tsx`
- `components/drivers-v4/DriversCommandCenterV4.tsx`
- `components/drivers/DriversRosterTable.tsx`
- `app/(bof)/demo/drivers/page.tsx`
- `components/BofHeader.tsx`

Customer:
- `app/portals/customer/page.tsx`

Registry / map / tests / report:
- `lib/bof-page-registry.ts`
- `docs/BOF_ROUTE_MAP.md`
- `scripts/validate-prompt-020-demo-firewall.ts`
- `package.json` (`validate:prompt-020-demo-firewall`; restored `build:second-gen-loads`)
- `docs/production-readiness/BOF-PRODUCTION-READINESS-020.md`

---

# 4. Source inventory (pre-fix, independently verified)

| Surface | Sources found | Class | Violation |
|---|---|---|---|
| `/command-center` CommandCenterV4 | `useBofDemoData`, canonical dispatch, maintenance DEMO, `getV3OperationalData` workbook, settlement workbook summary, LIVE spine panel | DEMO + WORKBOOK + LIVE mixed | Production CC mixed-source |
| `(bof)` layout | `getBofData()` / `BofDemoDataShell` | DEMO context on all operator pages | Silent DEMO mount |
| `/dispatch` DispatchShell | LIVE spine when fleet; **demoLoads fallback** when no fleet; DEMO relationship spine always | LIVE + DEMO | Production fallback to DEMO |
| DispatchBoardScreen | canonical DEMO KPIs when demoMode; RFID/route workbook always | DEMO + WORKBOOK | Workbook on production board |
| Exception/settlement dispatch views | `dispatch-dashboard-store` seed | DEMO/WORKBOOK | Seed as production views |
| `/loads` | LIVE spine when fleet; DEMO roster when no fleet; DEMO pretrip overlay | LIVE + DEMO | DEMO roster as production |
| `/loads/:id` | LIVE `getLoadById`; catch-all DEMO fallback for L001 | LIVE then DEMO | DEMO presented as load file |
| `/drivers` | Prisma summaries when fleet; else DEMO JSON; workbook ComplianceDashboardV4 | LIVE + DEMO + WORKBOOK | Workbook on production |
| Customer `/portals/customer` | DEMO cards + LIVE overlay list | DEMO + LIVE overlay | Overlay did not win card status |
| Equipment PATCH / eligibility / assignment / proof | Prisma; DEMO keys 404 or alias via `sourceRecordId` | LIVE with alias risk | Shared DEMO key could resolve LIVE |
| `/dashboard` | DEMO | DEMO | Not production CC; labeled |

UNKNOWN: none for the remediations above. Prompt 019 designations used and re-checked in code.

---

# 5. DEMO sources isolated

- Synthetic keys `L00x` / `L-00x`, `T-10x`, `TRL-*`, `DRV-*` fail closed (`422 DEMO_SOURCE_REJECTED`) on LIVE load lookup, equipment lookup, assignment create, and eligibility review.
- `findLoadByOperatorKey` no longer treats a DEMO key as the same entity as a Prisma `sourceRecordId` / `referenceNumber`.
- Production `/dispatch` and `/loads` no longer fall back to DEMO JSON when fleet session is missing.
- Production `/drivers` no longer mounts DEMO DRV-* roster when LIVE summaries are not the source.
- Production `/loads/L001` no longer renders DEMO RuntimeLoadDetailFallback as a LIVE file.
- CommandCenterV4 moved to `/demo/command-center` (preserved, labeled).

---

# 6. Workbook / reference sources isolated

- Production Command Center no longer reads `getV3OperationalData` or settlement workbook summaries.
- Production dispatch board no longer mounts Route Intelligence / RFID / DEMO asset cards as operational panes.
- Production dispatch `?view=exceptions` / `settlement` no longer uses the seed store; those remain on `/demo/dispatch`.
- Production `/drivers` no longer mounts workbook `ComplianceDashboardV4` (preserved on `/demo/drivers`).
- Legitimate workbook/reference surfaces (`/dispatch-v2`, `/settlements-v2`, `/safety`, payroll workbook with LIVE hold panel) were **not deleted**.

---

# 7. Command Center feeds verified

Production `/command-center` consumes **only** `GET /api/dispatch/operating-spine` via `useLiveOperatingSpine` / `LiveOperatingSpinePanel`.

| KPI / pane | Source | Class |
|---|---|---|
| LIVE loads count / delivered | `spine.loads` | LIVE |
| LIVE equipment / OOS attention | `spine.equipment` | LIVE |
| Settlement holds | `spine.heldSettlements` | LIVE |
| Domain links | routes to existing LIVE consumers | n/a |

DEMO JSON, workbook rows, canonical T-102/L001, and deprecated overlays are not production CC feeds.

---

# 8. Production operator path verified

- Banner distinguishes LIVE production paths vs `/demo/*` vs `/dashboard` (DEMO overview).
- `BofDemoDataShell` is **preserved** so DEMO descendants still work; production boards/rosters/CC do not use it as operational authority.
- Header includes Command Center → `/command-center`.

---

# 9. Tests executed and results

| Command | Result |
|---|---|
| `npx tsx scripts/validate-prompt-020-demo-firewall.ts` | PASS (`PROMPT_020_SOURCE_CHECKS_OK`) — tests A–J as source/fail-closed checks |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npx prisma validate` | PASS |
| `npm run build` | PASS (includes `/demo/command-center`, `/demo/dispatch`, `/demo/loads`, `/demo/drivers`) |
| `GET http://localhost:3010/api/dispatch/load/L001` (no session) | **401** — existing auth gate remains; DEMO is not loaded as LIVE |
| `POST /api/dispatch/assignment` L001/DRV-001/T-102 (no session) | **401** — DEMO-originated write does not reach LIVE mutation |
| `GET /command-center` on already-running :3010 | **200** |
| `GET /demo/command-center` on already-running :3010 | **404** — process predates this branch; restart/rebuild required to serve new DEMO routes |

Authenticated `422 DEMO_SOURCE_REJECTED` is covered by `rejectDemoOperationalKey` unit asserts in the validate script (no session bypass was added).

---

# 10. Remaining violations (not blocked; out of scope or deferred)

- `/dashboard` remains DEMO (explicit). Not retired.
- `BofDemoDataShell` still wraps the operator layout (context only).
- `/settlements` payroll workbook remains subordinate (019); LIVE hold panel unchanged.
- `/safety` remains DEMO/REFERENCE until a later Safety prompt (out of scope).
- `/dispatch-v2`, `/customer-portal` walkthrough remain REFERENCE/DEMO.
- Driver LIVE rows still show placeholder safety/settlement labels `"Standard"` / `"Pending"` — not DEMO override; not a new engine.
- Payment and Safety mutation **not implemented** (out of scope).
- Prompt 014 **not executed**.
- No LIVE records fabricated. Existing Prisma load/driver/equipment IDs unchanged.

---

# 11. Blocked items

None for this prompt’s remediable scope. Two competing LIVE authorities were not found; 019 designations used.

---

# 12. Implementation-complete statement

Prompt 020 is **implementation-complete** for DEMO firewall + production Command Center LIVE-only feeds, with automated source checks A–J.

This is **not** UOS Certified and **not** Prompt 014 Production Ready.

Protected product worktree `bof-web-e-c-foundation-20260823` was not modified. No remote push.

# Git

Branch `orchestrator/prompt-020-demo-firewall` from 019 HEAD `d9daabc9`. Implementation closeout: `de9100aabdbb393d7b58c8baa521d0791b36bdaa`.
