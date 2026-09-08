# BOF PRODUCTION READINESS GAP REGISTRY V1.0

**Document type:** Orchestrator work artifact only  
**Program:** Prompts 009–014 V1.0 (`BOF-ORC-P009-014-MASTER-V1.0`)  
**Prompt:** 009 — Discovery & Gap Registry  
**Predecessor HEAD:** `d8702ccefcf96adf1408fabccf1e3236eba71098`  
**Worktree:** `bof-orchestrator-copilot-sequential-2026-09`  
**Status of this registry:** Prompt 009 diagnosis preserved. Prompt 010A/010B remain VALIDATED. Prompt 011 remains closed. Prompt 012 remains closed. Prompt 013 updated remaining runtime/security/deployment/experience gaps listed in the Prompt 013 closeout. Other gaps remain as diagnosed unless a later certified prompt updates them.  
**Not:** a BOF runtime subsystem, database table, API, service, certification registry, or state machine.

Certification statuses used here: `VERIFIED` (independently confirmed against BOF sources). `VALIDATED` means the authorized remediation was verified against the stated validation requirement. Prompt 009 did not remediate.

### Prompt 010A closeout (environment fail-closed)

- Closeout commit will record fail-closed `AUTH_SECRET` and `DATABASE_URL` on existing NextAuth + Prisma.
- No secrets were invented or written to `.env.local`.
- Demo JSON UI remains available. Durable auth/PI fail closed with 503 JSON until the operator supplies real env values.

### Prompt 010B closeout (auth / visibility)

- Copilot no longer uses `DEMO_SHELL_OPEN` for empty sessions (`AUTH_REQUIRED`).
- recruiting-v2 Prisma mutations require existing `auth()`.
- Customer portal shipment links stay on `/portals/customer`; unauthenticated `/loads/:id` no longer renders operator pay/fallback.

### Prompt 011 closeout (data authority / cross-domain)

- ADR-009-001 resolved from existing spine provenance, not a fourth SOT: operator DEMO readiness/CC dispatch-hold KPIs use BOF JSON + `listMaintenanceAssetSummaries` / `getCanonicalDispatchLoadState`. V3/V4 workbook remains REFERENCE. Prisma LIVE equipment remains PENDING/UNKNOWN (GAP-009-028 fail-closed).
- ADR-009-003 resolved from `existingSettlementWorkflowHref`: operator `/settlements` identity is driver-week payroll (`STL-*` may be `settlementId`). `loadId` is highlighting only. Prisma `Settlement.id` cuid is not a `/settlements` nav key.
- T-102 DEMO `oos` is boolean true. L001 canonical state carries a maintenance HOLD. Copilot Equipment/Dispatch/Load File share `equipmentConflictsWithCanonicalAssignment`.
- Prisma non-pending LIVE equipment rows remain unavailable in this worktree (no operator DATABASE_URL / equipment facts invented).

### Prompt 012 closeout (workflow closure)

- ADR-009-003 settlement identity is unchanged: `/settlements` is driver-week payroll; `STL-*` may be `settlementId`; `loadId` is highlighting only.
- ADR-009-004: Prisma `recordLoadInvoice` / `recordLoadPayment` have no operator mutation route. DATABASE_URL remains fail-closed. Cash closure uses existing `POST /api/generate/invoice` plus existing factoring operating documents. Payment stays UNSUPPORTED. No payment engine was invented.
- GAP-009-014/015/016/026 were the only 012 targets. 005/018/020 remain for Prompt 013.

### Prompt 013 closeout (runtime, security, deployment, experience)

- Existing `auth()` gates generate, Places, TomTom, intake extract, and PI routes. DEMO_SHELL_OPEN is not used as production authentication.
- PI missing DATABASE_URL stays 503 `DATABASE_URL_REQUIRED`. Connection-class Prisma failures return 503 `PRISMA_UNAVAILABLE` without SASL text. Empty event history remains `INSUFFICIENT EVENT HISTORY` (no invented AUTHORITATIVE demo events).
- `deploy:full` and `demo:reset:deploy` no longer run `git add .` / commit / push. Vercel deploy remains.
- ADR-009-001 and ADR-009-003 are unchanged. No new engines, SOT, security platform, observability platform, or deployment pipeline.
- Observability stays console + existing JSON errors (ADR-009-004: do not create a platform).


---

## GAP-009-001 — Auth.js MissingSecret / AUTH_SECRET fail-open

| Field | Value |
|---|---|
| AREA | Secrets and Environment / Authentication |
| OBSERVED BEHAVIOR | Unconfigured worktree: `GET /api/auth/session` returns HTTP **503** `{ error: "AUTH_SECRET is not configured", code: "AUTH_SECRET_REQUIRED" }`. `auth.ts` does not construct NextAuth without a trimmed `AUTH_SECRET` / `AUTH_AUTH_SECRET` / `NEXTAUTH_SECRET`. Auth.js `MissingSecret` no longer appears in the 3010 log for `/api/auth/session`. Keys documented in `ENVIRONMENT_SETUP.md` and `.env.example` (names only). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Auth.js requires a defined `secret`. Production auth must fail closed without inventing a placeholder secret. Configured hosts return 200 session JSON. |
| EVIDENCE | Runtime 2026-09-07 after 010A: curl session 503 AUTH_SECRET_REQUIRED. Code: `auth.ts` `getConfiguredAuthSecret` + fail-closed handlers. `ENVIRONMENT_SETUP.md` required vars. 3010 log: `GET /api/auth/session 503`; no MissingSecret. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Auth.js + `auth.ts` + runtime |
| AFFECTED ROLE(S) | All signed-in operators; any durable Prisma API that calls `auth()` |
| AFFECTED WORKFLOW(S) | Session, fleet-gated drivers evaluation, Prisma load detail, dispatch assignment/release APIs |
| PRODUCTION IMPACT | Authentication cannot be established until the operator supplies AUTH_SECRET. Fail-open MissingSecret 500 is removed. |
| SEVERITY | BLOCKER |
| ROOT-CAUSE CLASSIFICATION | environment issue / configuration defect |
| EXISTING BOF COMPONENT | `auth.ts` NextAuth (`secret` option); `ENVIRONMENT_SETUP.md` |
| RECOMMENDED REMEDIATION | Operator supplies AUTH_SECRET in `.env.local` / host env. Do not invent a new auth platform. |
| DEPENDENCIES | GAP-009-002 (Prisma also needs a real DATABASE_URL for adapter / memberships) |
| VALIDATION REQUIRED | Unconfigured: `/api/auth/session` 503 `AUTH_SECRET_REQUIRED`, no MissingSecret. Configured: 200 session JSON. |
| CERTIFICATION STATUS | VALIDATED (fail-closed). Operator secret still required for a live session. |

---

## GAP-009-002 — DATABASE_URL missing; Prisma fallback; PI 500 SASL

| Field | Value |
|---|---|
| AREA | Secrets and Environment / Runtime / Process Intelligence |
| OBSERVED BEHAVIOR | Unconfigured worktree: Prisma no longer substitutes `postgres://localhost/bof-demo`. `GET /api/load-process-intelligence/discovery` and `/L001` return HTTP **503** `{ error: "DATABASE_URL is not configured", code: "DATABASE_URL_REQUIRED" }`. No SASL password 500. `file:` DATABASE_URL is treated as unconfigured for the Postgres adapter. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Durable Prisma paths must use an explicit PostgreSQL `DATABASE_URL`. Missing URL must not become a silent localhost connection. |
| EVIDENCE | Runtime 2026-09-07 after 010A: curl PI 503 DATABASE_URL_REQUIRED. Code: `lib/prisma.ts` fail-closed client; PI routes catch `DATABASE_URL_REQUIRED`. 3010 log has no SASL after the catch fix. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Prisma client + PI API runtime |
| AFFECTED ROLE(S) | Operators using PI; any Prisma-backed workflow |
| AFFECTED WORKFLOW(S) | Process Intelligence discovery/per-load; recruiting-v2 writes; auth adapter |
| PRODUCTION IMPACT | Durable Prisma/PI stay unavailable until DATABASE_URL is supplied. Fail-open localhost/SASL is removed. Demo JSON UI still renders. |
| SEVERITY | BLOCKER |
| ROOT-CAUSE CLASSIFICATION | environment issue / configuration defect |
| EXISTING BOF COMPONENT | `lib/prisma.ts`; `prisma/schema.prisma`; PI routes |
| RECOMMENDED REMEDIATION | Operator supplies PostgreSQL `DATABASE_URL`. Do not create a new data store. |
| DEPENDENCIES | GAP-009-018 (empty event history when DB is configured) |
| VALIDATION REQUIRED | Unconfigured: PI discovery/per-load 503 `DATABASE_URL_REQUIRED`, not SASL 500. `npx prisma validate` remains pass. |
| CERTIFICATION STATUS | VALIDATED (fail-closed). Operator DATABASE_URL still required for durable PI cases. |

---

## GAP-009-003 — DEMO_SHELL_OPEN: operator UI and Copilot without a session

| Field | Value |
|---|---|
| AREA | Authentication and Authorization |
| OBSERVED BEHAVIOR | Unauthenticated Copilot: `resolveCopilotAdvocateAccess(null)` returns `allowed: false`, `AUTH_REQUIRED`. Command Center shows that note and does not list L001 Copilot facts. Operator `(bof)` demo pages still render from JSON. No new middleware file was added. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Production operator Copilot uses existing `auth()` + `lib/authorization.ts` roles. Unauthenticated visitors must not inherit Copilot facts. |
| EVIDENCE | `lib/copilot/copilot-advocate-access.ts`. tsx: null→AUTH_REQUIRED; DISPATCH membership→ROLE_OK; DRIVER→ROLE_REQUIRED. Browser CC 2026-09-07: Copilot facts not shown. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Copilot access helper + runtime UI |
| AFFECTED ROLE(S) | Unauthenticated visitors; intended operators |
| AFFECTED WORKFLOW(S) | Copilot Advocate on operating surfaces |
| PRODUCTION IMPACT | Unauthenticated hosts no longer expose Copilot operator facts. Live ROLE_OK still requires operator-supplied AUTH_SECRET (010A). |
| SEVERITY | BLOCKER |
| ROOT-CAUSE CLASSIFICATION | authorization gap |
| EXISTING BOF COMPONENT | `auth()`, `lib/authorization.ts`, `resolveCopilotAdvocateAccess` |
| RECOMMENDED REMEDIATION | Operator supplies AUTH_SECRET and signs in with an operator membership. Do not create a new authorization engine. |
| DEPENDENCIES | GAP-009-001 |
| VALIDATION REQUIRED | Unauthenticated operator Copilot denied; ROLE_OK still returns allowed for DISPATCH-class memberships. |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-004 — Ungated recruiting-v2 Prisma mutations

| Field | Value |
|---|---|
| AREA | Authorization / Unauthorized mutation exposure |
| OBSERVED BEHAVIOR | recruiting-v2 POST/PATCH handlers call `recruitingV2UnauthorizedResponse()` (existing `auth()`). Unauthenticated POST `/api/recruiting-v2/onboarding/CAND-001` and `/offer/CAND-001` return **401** `{ error: "Unauthorized" }`. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Durable Prisma writes require `auth()`, matching dispatch assignment routes. |
| EVIDENCE | Seven mutation routes import `lib/recruiting-v2/require-operator-session.ts`. curl 401 2026-09-07. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Route source vs dispatch `auth()` pattern + runtime |
| AFFECTED ROLE(S) | Any HTTP client; recruiting operators |
| AFFECTED WORKFLOW(S) | Recruiting v2 onboarding/offer/documents/activation/interviews |
| PRODUCTION IMPACT | Unauthenticated callers cannot mutate candidate records. Authenticated writes still need DATABASE_URL (010A). |
| SEVERITY | BLOCKER |
| ROOT-CAUSE CLASSIFICATION | authorization gap |
| EXISTING BOF COMPONENT | NextAuth `auth()`; existing dispatch 401 pattern |
| RECOMMENDED REMEDIATION | Operator session + DATABASE_URL for successful writes. Do not add a new permission engine. |
| DEPENDENCIES | GAP-009-001, GAP-009-002 |
| VALIDATION REQUIRED | POST without session → 401 |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-005 — Other unauthenticated APIs (generate, intake extract, Places, TomTom, PI)

| Field | Value |
|---|---|
| AREA | Authorization / Security |
| OBSERVED BEHAVIOR | After 013: `POST /api/generate/{invoice,bol,pod,settlement,claims}`, Places, TomTom, intake extract, and PI discovery/per-load require existing `auth()`. Unauthenticated callers receive 401 `{ error: "Unauthorized", code: "AUTH_REQUIRED" }`. Public recruiting apply stays public. |
| AUTHORITATIVE EXPECTED BEHAVIOR | `docs/project-environment-assessment.md` already treats Places/TomTom/PDF as demo-acceptable, not sufficient for an exposed production API. |
| EVIDENCE | Route files under `app/api/generate`, `app/api/places`, `app/api/load-intake/extract`, PI routes. `lib/require-operator-session.ts`. Assessment doc ~294–298. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Route source + environment assessment |
| AFFECTED ROLE(S) | External callers; operators |
| AFFECTED WORKFLOW(S) | Doc generation, intake OCR, maps/fuel proxies, PI |
| PRODUCTION IMPACT | Cost/abuse on proxied keys; unauthenticated document generation. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | authorization gap |
| EXISTING BOF COMPONENT | Same `auth()` helper used on dispatch APIs |
| RECOMMENDED REMEDIATION | Gate production-exposed routes with existing auth; keep public apply endpoints explicitly public. |
| DEPENDENCIES | GAP-009-001 |
| VALIDATION REQUIRED | Ungated production routes return 401 without session |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-006 — Customer portal links into operator `/loads/:id`

| Field | Value |
|---|---|
| AREA | Customer / Authorization / Routing |
| OBSERVED BEHAVIOR | Customer shipment cards use `#shipment-{id}` on `/portals/customer`. Operator header is hidden on `/portals/customer` and `/customers`. Unauthenticated `/loads/L001` shows an operator-session required message without driver pay or RuntimeLoadDetailFallback. Packet links remain `/generated/loads/...` and `/evidence/loads/...` (documents, not the operator load file). |
| AUTHORITATIVE EXPECTED BEHAVIOR | `PORTAL_VISIBILITY.customer.restrictedSections` includes `dispatch-operations`, `settlements`, `driver-hr`, `driver-payroll`. |
| EVIDENCE | Browser 2026-09-07: no Dispatch nav on customer portal; hrefs `#shipment-L001`; `/loads/L001` gated. Customer Copilot rec href `/portals/customer#shipment-...`. Validator pass. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | PORTAL_VISIBILITY + customer page + load detail page |
| AFFECTED ROLE(S) | Customer portal users |
| AFFECTED WORKFLOW(S) | Customer shipment visibility |
| PRODUCTION IMPACT | Customer navigation no longer opens the operator load file or driver pay. |
| SEVERITY | BLOCKER |
| ROOT-CAUSE CLASSIFICATION | authorization gap / workflow gap |
| EXISTING BOF COMPONENT | `/portals/customer`, `PORTAL_VISIBILITY.customer`, existing `auth()` on `/loads/:id` |
| RECOMMENDED REMEDIATION | Keep customer-visible paths on the customer portal. Operator load file remains session-gated. |
| DEPENDENCIES | GAP-009-016 (hash clicks may still not navigate); GAP-009-003 |
| VALIDATION REQUIRED | Customer shipment CTA never lands on operator load file; unauth `/loads/:id` does not show pay/dispatch controls |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-007 — Command Center V4 / Maintenance V4 workbook vs canonical BOF JSON

| Field | Value |
|---|---|
| AREA | Data Authority / Command Center / Maintenance |
| OBSERVED BEHAVIOR | `/command-center` is `CommandCenterV4` from `getV3OperationalData()` (xlsx `/data/main-source-v4_operational_elite_enhanced.xlsx`). Browser: **4 CRITICAL RISKS / 3 DISPATCH BLOCKS**. Copilot on the same page says V4 counts are not Copilot SOT and observes canonical L001 / DRV-001 / T-102. `/maintenance` dashboard loads workbook assets; `/maintenance/T-102` uses `listMaintenanceAssetSummaries` (T-102 Out of Service). `parseAssets` reads columns `Status` / `Readiness Status` / `Current Driver ID`; V4 sheet uses `Status Indicator` / `Service Status` / `Assigned Driver ID`. |
| AUTHORITATIVE EXPECTED BEHAVIOR | One production AUTHORITATIVE source per decision. Copilot/dispatch/load spine use BOF JSON + `listMaintenanceAssetSummaries`. |
| EVIDENCE | `app/(bof)/command-center/page.tsx`. `CommandCenterV4.tsx` v3 load. `lib/v3-operational-loader.ts` 760–777. Browser CC + T-102 asset file. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Dual: workbook vs `demo-data.json` / equipment spine |
| AFFECTED ROLE(S) | Fleet owner / dispatcher / maintenance |
| AFFECTED WORKFLOW(S) | Command Center decisions; maintenance dashboard vs asset file |
| PRODUCTION IMPACT | Operators can make dispatch/maintenance decisions from counts that do not match canonical load/equipment state. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | data-authority issue / architecture ambiguity (**ARCHITECTURE DECISION REQUIRED** — ADR-009-001) |
| EXISTING BOF COMPONENT | `getCanonicalDispatchLoadState`, `listMaintenanceAssetSummaries`, V4 workbook loader |
| RECOMMENDED REMEDIATION | Do not create a new SOT engine. Operator must choose which existing source is production AUTHORITATIVE, then wire V4 surfaces to it or label workbook REFERENCE/DEMO. |
| DEPENDENCIES | GAP-009-008, GAP-009-030, ADR-009-001 |
| VALIDATION REQUIRED | CC KPIs match the chosen AUTHORITATIVE load/equipment records for L001/T-102 |
| CERTIFICATION STATUS | VALIDATED — CC hero/KPI dispatch holds and attention counts use `getCanonicalDispatchLoadState` / equipment spine. Workbook risk counts remain labeled REFERENCE. L001 HOLD with T-102 maintenance blocker; T-102 oos=true. |

---

## GAP-009-008 — T-102 readiness “Out of Service” with `oos=false`; Copilot read-rule split

| Field | Value |
|---|---|
| AREA | Equipment / Dispatch / Semantic inconsistency |
| OBSERVED BEHAVIOR | DEMO spine: T-102 `fleet_status=Unavailable`, `readiness=Out of Service`, `oos=false` (`"true" === true` is false). Equipment Copilot conflict if Out of Service OR Blocked OR oos. Dispatch/Load File Copilot conflict if Blocked OR oos only. Consolidation conflict `consol-conflict-eq-dispatch-read-rule` observed on Command Center. Canonical dispatch still assigns L001 to T-102. Load file: “No canonical maintenance blocker”. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Equipment operational evaluator: Unavailable → NOT_ASSIGNABLE / NOT_DISPATCHABLE. Assignment and dispatch conflict cards should use the same fields as that evaluator. |
| EVIDENCE | Runtime tsx print of T-102 summary. `lib/maintenance-data.ts` 191–211. `equipment-copilot-advocate-display.ts` 40–42, 213–219. `dispatch-copilot-advocate-display.ts` 277–283. Browser CC consolidation + `/maintenance/T-102` + `/loads/L001`. `scripts/validate-canonical-equipment-spine.ts` OK. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | `listMaintenanceAssetSummaries` + `getCanonicalEquipmentRecord` DEMO mode |
| AFFECTED ROLE(S) | Dispatch, maintenance |
| AFFECTED WORKFLOW(S) | Assignment, release, equipment readiness |
| PRODUCTION IMPACT | One domain Copilot holds T-102; another does not; load file denies a maintenance blocker. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | semantic inconsistency / data-authority issue |
| EXISTING BOF COMPONENT | `evaluateEquipmentOperationalState`, `listMaintenanceAssetSummaries`, Copilot builders |
| RECOMMENDED REMEDIATION | Align boolean `oos` with DEMO string flags OR align Copilot predicates to `assignability`/`dispatchability`. Do not add an equipment engine. |
| DEPENDENCIES | GAP-009-007, ADR-009-001 |
| VALIDATION REQUIRED | Same T-102 conflict on Equipment, Dispatch, Load File Copilots; load-file maintenance line matches summary |
| CERTIFICATION STATUS | VALIDATED — DEMO `outOfService` is boolean true; `listMaintenanceAssetSummaries.oos` is true for T-102; Copilot predicates share `equipmentConflictsWithCanonicalAssignment`. LIVE path remains pending (028). |

---

## GAP-009-009 — T-102 presented as Trailer

| Field | Value |
|---|---|
| AREA | Equipment / UX |
| OBSERVED BEHAVIOR | After 013: maintenance class label uses `maintenanceEquipmentClassLabel`. T-102 with kind `Equipment` displays Tractor from canonical ID notes, not Trailer. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Canonical ID map notes T-102 as tractor (`lib/canonical-id-mappings.ts`). |
| EVIDENCE | Browser `/maintenance/T-102` snapshot heading. `maintenanceEquipmentClassLabel`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Canonical equipment ID mapping vs asset-file presentation |
| AFFECTED ROLE(S) | Maintenance |
| AFFECTED WORKFLOW(S) | Asset identification |
| PRODUCTION IMPACT | Wrong asset class on the file used for OOS review. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | code defect / UX issue |
| EXISTING BOF COMPONENT | `MaintenanceAssetDetailClient` / summary `kind` |
| RECOMMENDED REMEDIATION | Display canonical equipment type/kind from existing spine. |
| DEPENDENCIES | GAP-009-008 |
| VALIDATION REQUIRED | T-102 labeled tractor/equipment, not trailer |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-010 — Safety dispatchBlock does not join L001; Safety KPIs disagree on-page

| Field | Value |
|---|---|
| AREA | Safety ↔ Dispatch |
| OBSERVED BEHAVIOR | Copilot safety facts require workbook `Safety_Events.dispatchBlock`. L001/T-102/DRV-001 have no true dispatchBlock in V4 events (YES only EVT-001/EVT-010). Canonical dispatch uses pre-trip/CDL/HOS, not workbook dispatchBlock. Safety UI: header **2 Dispatch Blocks** vs watchlist **Dispatch Blocks 5**. Telematics block labeled demo. |
| AUTHORITATIVE EXPECTED BEHAVIOR | A recorded safety dispatch block must appear on Dispatch/Load File if it is AUTHORITATIVE. KPI counts on one page must share a source. |
| EVIDENCE | `dispatch-copilot-advocate-display.ts` 294–298. `lib/v3-operational-loader.ts` `parseBoolean`. Browser `/safety` text. Driver Copilot empty-safety path. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Workbook Safety_Events vs `getDriverDispatchEligibility` / pre-trip vs Safety UI aggregations |
| AFFECTED ROLE(S) | Safety, dispatch |
| AFFECTED WORKFLOW(S) | Restriction → dispatch visibility |
| PRODUCTION IMPACT | Safety holds can be invisible to Copilot/canonical dispatch while Safety CC still shows blocks. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | data-authority issue / integration gap |
| EXISTING BOF COMPONENT | Safety workbook events, safety-scorecard, canonical dispatch blockers |
| RECOMMENDED REMEDIATION | Join using one existing safety authority; do not create a safety engine. See ADR-009-001. |
| DEPENDENCIES | GAP-009-007 |
| VALIDATION REQUIRED | A real dispatchBlock event appears on Dispatch Copilot and matches Safety queue |
| CERTIFICATION STATUS | VALIDATED — Safety header and watchlist Dispatch Blocks both use `Safety_Events.dispatchBlock` count (2: EVT-001, EVT-010). Workbook KPI sheet value 5 remains REFERENCE, not operating. Dispatch Copilot still copies those events. Workbook events were not promoted into canonical dispatch HOLD. |

---

## GAP-009-011 — Safety telematics snapshot looks live

| Field | Value |
|---|---|
| AREA | UX / Data classification |
| OBSERVED BEHAVIOR | After 013: Safety monitoring heading is `HOS & En-Route Monitoring (REFERENCE / DEMO)`. Cards are labeled DEMO; telematics shows Not connected; no pulsing live dots or “45 seconds ago”. |
| AUTHORITATIVE EXPECTED BEHAVIOR | REFERENCE/DEMO must not be presented as live telemetry. |
| EVIDENCE | Browser `/safety` body text. `SafetyDashboardV4.tsx`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Safety page copy vs classification tiers in package §3.1 |
| AFFECTED ROLE(S) | Safety / fleet owner |
| AFFECTED WORKFLOW(S) | En-route monitoring |
| PRODUCTION IMPACT | Operators may treat demo telemetry as current truck state. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | UX issue |
| EXISTING BOF COMPONENT | Safety Command Center presentation layer |
| RECOMMENDED REMEDIATION | Keep demo snapshot but fail-closed labeling; do not invent telematics. |
| DEPENDENCIES | none |
| VALIDATION REQUIRED | Demo telemetry cannot be read as live without an explicit REFERENCE/DEMO label in the primary viewport |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-012 — Unauthenticated `/drivers`: 12 drivers could not be evaluated

| Field | Value |
|---|---|
| AREA | Driver readiness / Authentication |
| OBSERVED BEHAVIOR | Browser: “12 driver s could not be evaluated because authenticated fleet readiness data is unavailable.” Prisma summaries load only when `session.user.id` and fleetId exist. Demo roster still renders. Driver Copilot still uses `getDriverDispatchEligibility` (DRV-001 blocked: FMCSA/Clearinghouse). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Displayed roster status should either use eligibility from BOF JSON (labeled DERIVED/DEMO) or clearly unavailable — not mixed “command center” with all rows unevaluable while Copilot evaluates DRV-001. |
| EVIDENCE | `app/(bof)/drivers/page.tsx` 24–46. `DriversRosterTable.tsx` 88–97, 526–591. Browser `/drivers`. CC Copilot DRV-001 eligibility fact. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Prisma `listDriverOperationalSummaries` vs `getDriverDispatchEligibility` |
| AFFECTED ROLE(S) | Dispatch / driver ops |
| AFFECTED WORKFLOW(S) | Who can take the next load |
| PRODUCTION IMPACT | Roster says evaluation unavailable; Copilot says blocked. Dual readiness. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | data-authority issue / authorization gap |
| EXISTING BOF COMPONENT | Driver operational summaries; dispatch eligibility helper |
| RECOMMENDED REMEDIATION | After session works, prefer Prisma live summaries; in demo-open mode label DEMO eligibility or hide conflicting Copilot as operator-only. |
| DEPENDENCIES | GAP-009-001, GAP-009-003 |
| VALIDATION REQUIRED | With fleet session, evaluation count > 0; without session, no conflicting READY/BLOCKED from a second engine unless labeled |
| CERTIFICATION STATUS | VALIDATED — unauthenticated roster copies `getDriverDispatchEligibility` / `getDriverTableRowModel` as DEMO/DERIVED. Prisma summaries remain AUTHORITATIVE when fleet session exists. Demo eligibility is not promoted to live Prisma. |

---

## GAP-009-013 — Settlement identity split (load hold vs STL-* vs Prisma cuid)

| Field | Value |
|---|---|
| AREA | Settlement / Load Spine |
| OBSERVED BEHAVIOR | L001 `settlementHold: true`. STL-001 has no `loadId`; spine `settlementId` for L001 undefined. Copilot href `/settlements?driverId=DRV-001&loadId=L001`. Payroll drawer opens on `settlementId=` only. Browser that URL shows week table; DRV-001 Paid with 1 hold $750; drawer not auto-opened. Command Center settlement strip is V3 workbook, not STL-* JSON. |
| AUTHORITATIVE EXPECTED BEHAVIOR | `existingSettlementWorkflowHref` comments: `/settlements` is driver-week payroll; loadId is highlighting only. Production still needs one join an operator can close. |
| EVIDENCE | `lib/load-file-proof-settlement-display.ts` 477–499. `lib/bof-source-of-truth.ts` 392–405. Browser settlements query. `demo-data.json` L001 vs STL-001. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Three identities — load hold, payroll STL-*, Prisma Settlement.id |
| AFFECTED ROLE(S) | Settlement / dispatch |
| AFFECTED WORKFLOW(S) | Proof → hold → pay |
| PRODUCTION IMPACT | Copilot “open settlement” does not open the payroll row; load hold and paid week coexist. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | data-authority issue / architecture ambiguity (**ARCHITECTURE DECISION REQUIRED** — ADR-009-003) |
| EXISTING BOF COMPONENT | `existingSettlementWorkflowHref`, payroll shell, load `settlementHold` |
| RECOMMENDED REMEDIATION | Do not create a settlement engine. Decide the production settlement key and wire query params to the existing drawer/highlight. |
| DEPENDENCIES | GAP-009-014 |
| VALIDATION REQUIRED | Copilot settlement link opens or highlights the AUTHORITATIVE row for DRV-001/L001 |
| CERTIFICATION STATUS | VALIDATED — ADR-009-003: `/settlements` is payroll shell. `?driverId=DRV-001&loadId=L001` resolves STL-001, opens the drawer, and highlights the row. Prisma cuid is not a nav key. Durable Prisma settlement close remains 014/015 (out of 011). |

---

## GAP-009-014 — Proof rejection → settlement hold is demo/Zustand, not durable

| Field | Value |
|---|---|
| AREA | Workflow Closure / Proof → Settlement |
| OBSERVED BEHAVIOR | After 012: Apply documentation hold also calls existing payroll `placeHoldFromLoadProof` (STL-* via `resolveExistingSettlementWorkflowTarget`) and persists only hold overlays. The packet panel is mounted on dispatch load detail Documents. Prisma Settlement holds remain disconnected (capability DEMO). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Operating-chain proof rejection must create a durable hold the settlement UI reads. |
| EVIDENCE | `DocumentationReadinessPanel.tsx` 215–236. `load-to-cash-service.ts` record/verify only. capability-matrix settlements DEMO vs Prisma. |
| EVIDENCE QUALITY | MEDIUM (code path; not a live Prisma write test in this prompt) |
| SOURCE OF TRUTH | Dispatch store vs Prisma Settlement |
| AFFECTED ROLE(S) | Dispatch, settlements |
| AFFECTED WORKFLOW(S) | Proof rejection → pay hold |
| PRODUCTION IMPACT | Hold applied on the board may not exist after refresh or on payroll. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | workflow gap / integration gap |
| EXISTING BOF COMPONENT | `recordLoadSettlement` / load-to-cash; payroll hold actions |
| RECOMMENDED REMEDIATION | Connect existing hold write to existing payroll/Prisma hold fields. No new workflow engine. |
| DEPENDENCIES | GAP-009-013, GAP-009-002 |
| VALIDATION REQUIRED | Documentation hold applies to the matching STL-* payroll row and remains after reload. Prisma cash/settlement writers are not used. |
| CERTIFICATION STATUS | VALIDATED (DEMO payroll overlay + existing identity). Prisma Settlement hold remains PENDING until DATABASE_URL/session. |

---

## GAP-009-015 — Invoice / payment / factoring not closable on operator UI

| Field | Value |
|---|---|
| AREA | Workflow Closure / Settlement → cash |
| OBSERVED BEHAVIOR | After 012: settlement drawer exposes existing `POST /api/generate/invoice` and existing factoring operating docs. Payment remains UNSUPPORTED. `recordLoadInvoice`/`recordLoadPayment` still have no operator route (ADR-009-004). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Canonical chain ends at invoice/payment/factoring using existing cash services if production requires closure. |
| EVIDENCE | `lib/settlement/settlement-operating-display.ts` 454–467. capability-matrix 96–112. Route glob: no invoices page. `/customer-portal` billing: “No payment is collected here.” |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Settlement operating display + load-to-cash service vs UI |
| AFFECTED ROLE(S) | Finance, customer billing |
| AFFECTED WORKFLOW(S) | Invoice / payment / factoring |
| PRODUCTION IMPACT | Operators cannot close cash on the product UI even if lib writers exist. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | workflow gap |
| EXISTING BOF COMPONENT | `load-to-cash-service.ts`; generate invoice API; customer billing walkthrough |
| RECOMMENDED REMEDIATION | Wire existing cash writers to existing settlement/customer billing surfaces. Do not create a payments platform. |
| DEPENDENCIES | GAP-009-013, GAP-009-014 |
| VALIDATION REQUIRED | Operator can generate an invoice document from the driver-week settlement drawer; factoring packets remain reachable; payment is fail-closed UNSUPPORTED without a fabricated cash posting. |
| CERTIFICATION STATUS | VALIDATED (document + factoring packet path). Payment posting is ARCHITECTURE DECISION REQUIRED / fail-closed. |

---

## GAP-009-016 — Same-document Next.js `Link` clicks do not navigate

| Field | Value |
|---|---|
| AREA | Application and Routing / UX |
| OBSERVED BEHAVIOR | After 012: product nav, demo ribbon, Copilot CTAs, and customer hash cards use `ExistingDocumentNavAnchor` (`window.location.assign`) because App Router client clicks were swallowed. Customer cards stay on `/portals/customer#shipment-*`. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Next `Link` must change route. |
| EVIDENCE | Browser lock session 2026-09-07: click Dispatch (focused, URL still T-102); click L001 card (URL still customer portal); CDP href confirmed `/dispatch` and `/loads/L001`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Observable runtime vs `next/link` |
| AFFECTED ROLE(S) | All UI users |
| AFFECTED WORKFLOW(S) | Cross-page navigation, Copilot “navigation only” CTAs |
| PRODUCTION IMPACT | Copilot and header navigation are not actionable via click in this browser. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | UX issue / code defect |
| EXISTING BOF COMPONENT | `BofHeader`, Next `Link` |
| RECOMMENDED REMEDIATION | Diagnose App Router / header intercept; fix existing links. Do not add a router engine. |
| DEPENDENCIES | GAP-009-006 (leak still exists via URL even if click fails) |
| VALIDATION REQUIRED | Header Dispatch click from `/maintenance/T-102` changes URL to `/dispatch`. Customer L001 card changes hash to `#shipment-L001` without opening operator `/loads/L001`. |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-017 — Fallback UI invents Peachtree / T-102 / seals when fields missing

| Field | Value |
|---|---|
| AREA | UX / Data integrity |
| OBSERVED BEHAVIOR | After 013: `RuntimeLoadDetailFallback` and loads roster render missing customer/asset/seals/doc refs as Unavailable. They do not substitute Peachtree Foods, T-102, TRL-2854, or invented seals. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Package §3.2: missing ≠ fabricated fact. Unavailable must be labeled unavailable. |
| EVIDENCE | `components/loads/RuntimeLoadDetailFallback.tsx`. `LoadsPageClient.tsx`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Fallback component vs load record |
| AFFECTED ROLE(S) | Dispatch / anyone on unauth load file |
| AFFECTED WORKFLOW(S) | Load File |
| PRODUCTION IMPACT | Missing Prisma load looks like a specific tractor/customer/seals. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | code defect / UX issue |
| EXISTING BOF COMPONENT | RuntimeLoadDetailFallback |
| RECOMMENDED REMEDIATION | Render missing fields as unavailable; do not substitute another load’s identity. |
| DEPENDENCIES | GAP-009-006 |
| VALIDATION REQUIRED | Load with empty assetId does not display T-102 |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-018 — Process Intelligence inoperable without Prisma events (and currently 500)

| Field | Value |
|---|---|
| AREA | Process Intelligence / Runtime |
| OBSERVED BEHAVIOR | After 013: PI routes require session (401 without). Unconfigured DATABASE_URL returns 503 `DATABASE_URL_REQUIRED` (not SASL 500). Prisma connection-class failures return 503 `PRISMA_UNAVAILABLE` without leaking SASL. Discovery with no persisted events already returns `INSUFFICIENT EVENT HISTORY`. Demo load identity is labeled `DEMO_LOAD_IDENTITY_WITHOUT_PERSISTED_EVENT_LOG` and does not invent AUTHORITATIVE events. |
| AUTHORITATIVE EXPECTED BEHAVIOR | PI must fail closed with INSUFFICIENT_EVENT_HISTORY, not 500, and must not invent demo events as AUTHORITATIVE. |
| EVIDENCE | `lib/load-process-intelligence.ts` 449–459, 544–561, 595–687. discovery route. Per-load route. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | PI service + Prisma |
| AFFECTED ROLE(S) | Operations analysts |
| AFFECTED WORKFLOW(S) | Process Intelligence |
| PRODUCTION IMPACT | PI cannot be used in the current environment; even healthy env omits demo loads. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | environment issue / integration gap |
| EXISTING BOF COMPONENT | `getLoadProcessDiscovery` / per-load PI |
| RECOMMENDED REMEDIATION | Fix env (001/002). Return controlled empty/insufficient states. Do not create a PI platform. |
| DEPENDENCIES | GAP-009-002 |
| VALIDATION REQUIRED | Discovery 200 with empty/insufficient payload or real Prisma cases; L001 per-load not SASL 500 |
| CERTIFICATION STATUS | VALIDATED (fail-closed). Unauthenticated 401; unconfigured DB 503; no invented AUTHORITATIVE demo events. |

---

## GAP-009-019 — Observability is console + banners only

| Field | Value |
|---|---|
| AREA | Observability |
| OBSERVED BEHAVIOR | After 013: still no Sentry/pino/winston. Auth/PI known env misses return controlled JSON (401/503) instead of silent 500. Dispatch audit remains console + localStorage. No observability platform was added (ADR-009-004). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Production needs operator-visible failure and durable logs. Package forbids creating a new observability platform. |
| EVIDENCE | `lib/audit/logDispatchEvent.ts`. package.json dependencies. PI/auth JSON error payloads. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Code + runtime logs |
| AFFECTED ROLE(S) | Operators, deployers |
| AFFECTED WORKFLOW(S) | Incident diagnosis |
| PRODUCTION IMPACT | Production failures are not centralized. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | operational-process issue (**ARCHITECTURE DECISION REQUIRED** if a new platform is proposed — ADR-009-004: do not create one) |
| EXISTING BOF COMPONENT | console logging, UI banners, `errorResponse` helpers |
| RECOMMENDED REMEDIATION | Harden existing error responses and env fail-closed. Do not add a new observability product in 010–013 without ADR. |
| DEPENDENCIES | GAP-009-001, GAP-009-002 |
| VALIDATION REQUIRED | Controlled error JSON for PI/auth; no silent 500 for known env misses |
| CERTIFICATION STATUS | VALIDATED (existing console/JSON only). Centralized vendor observability remains ADR-009-004 / not created. |

---

## GAP-009-020 — `deploy:full` / `demo:reset:deploy` use `git add .`

| Field | Value |
|---|---|
| AREA | Deployment |
| OBSERVED BEHAVIOR | After 013: `deploy:full` and `demo:reset:deploy` run generate/reset then `npx vercel --prod` only. They do not `git add .`, commit, or push. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Orchestrator git protocol forbids `git add .` / `git add -A`. Production deploy must not auto-commit the entire tree. |
| EVIDENCE | `package.json` scripts. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | npm scripts |
| AFFECTED ROLE(S) | Deploy operator |
| AFFECTED WORKFLOW(S) | Production deploy |
| PRODUCTION IMPACT | Secrets, `.next`, or unrelated files can be committed and shipped. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | operational-process issue |
| EXISTING BOF COMPONENT | npm deploy scripts |
| RECOMMENDED REMEDIATION | Replace blanket add with explicit paths; keep Vercel deploy. |
| DEPENDENCIES | none |
| VALIDATION REQUIRED | Deploy script does not invoke `git add .` |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-021 — Dual live surfaces (customer, dispatch, settlements)

| Field | Value |
|---|---|
| AREA | Routing / Demo vs production |
| OBSERVED BEHAVIOR | After 013: `/dispatch-v2` and `/settlements-v2` are labeled REFERENCE/DEMO preview and point to canonical `/dispatch` and `/settlements`. `/customer-portal` remains the labeled Prairie View walkthrough. `/portals/customer` (and `/customers` alias) remains Apex DEMO customer. Routes were not deleted. |
| AUTHORITATIVE EXPECTED BEHAVIOR | `docs/BOF_ROUTE_MAP.md` as inventory; one production surface per workflow. |
| EVIDENCE | Route files; `app/customers/page.tsx` re-export; preview banners on v2 routes. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | App Router |
| AFFECTED ROLE(S) | All |
| AFFECTED WORKFLOW(S) | Navigation |
| PRODUCTION IMPACT | Operators/customers land on different data and rules. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | workflow gap / data-authority issue |
| EXISTING BOF COMPONENT | Existing routes; route map |
| RECOMMENDED REMEDIATION | Mark preview routes REFERENCE/DEMO; do not delete without ADR. Update route map. |
| DEPENDENCIES | GAP-009-006, GAP-009-007 |
| VALIDATION REQUIRED | Production host serves one customer and one dispatch/settlement authority URL |
| CERTIFICATION STATUS | VALIDATED (preview routes labeled; canonical URLs unchanged). Duplicate URLs remain live by design until a deletion ADR. |

---

## GAP-009-022 — Route map stale vs live pages

| Field | Value |
|---|---|
| AREA | Application and Routing |
| OBSERVED BEHAVIOR | After 013: route map lists `/dispatch-v2`, `/settlements-v2`, `/portals/customer`, `/customers`, `/customer-portal` as live URLs with REFERENCE/DEMO vs DEMO classification. Recruiting and every `page.tsx` are not exhaustively re-inventoried. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Route map is the documented inventory. |
| EVIDENCE | Compare `docs/BOF_ROUTE_MAP.md` to `app/**/page.tsx`. |
| EVIDENCE QUALITY | MEDIUM |
| SOURCE OF TRUTH | Route map vs App Router |
| AFFECTED ROLE(S) | Orchestrator / operators |
| AFFECTED WORKFLOW(S) | Navigation documentation |
| PRODUCTION IMPACT | Incomplete operator map; not itself a runtime failure. |
| SEVERITY | REFERENCE |
| ROOT-CAUSE CLASSIFICATION | operational-process issue |
| EXISTING BOF COMPONENT | `docs/BOF_ROUTE_MAP.md` |
| RECOMMENDED REMEDIATION | Update the map; do not add a routing engine. |
| DEPENDENCIES | GAP-009-021 |
| VALIDATION REQUIRED | Map lists live production URLs |
| CERTIFICATION STATUS | VALIDATED (canonical + dual-surface URLs listed). |

---

## GAP-009-023 — Viewport coverage incomplete

| Field | Value |
|---|---|
| AREA | UX / Responsive |
| OBSERVED BEHAVIOR | After 013 browser QA: documentElement overflow was 0 at 390 on CC, dispatch, loads, drivers, safety, settlements, T-102. 768 CC overflow 0. 1366 CC and dispatch overflow 0. Header uses overflow-x-auto on product nav. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Package §7.12 requires declared breakpoints on critical routes. |
| EVIDENCE | Browser CDP metrics 2026-09-08 on production `next start` :3010. |
| EVIDENCE QUALITY | MEDIUM |
| SOURCE OF TRUTH | Runtime 390/768/1366 document overflow |
| AFFECTED ROLE(S) | Mobile operators |
| AFFECTED WORKFLOW(S) | All |
| PRODUCTION IMPACT | Unverified overflow/clipping on several surfaces. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | UX issue |
| EXISTING BOF COMPONENT | Tailwind defaults; visual smoke script |
| RECOMMENDED REMEDIATION | Re-run smoke + Copilot shells at 390/768/1366 in Prompt 013. |
| DEPENDENCIES | none |
| VALIDATION REQUIRED | No horizontal overflow on CC, dispatch, load file, drivers, safety, settlements at 390/768/1366 |
| CERTIFICATION STATUS | VALIDATED (document overflow 0 at 390/768/1366 on checked operating-chain pages). |

---

## GAP-009-024 — Load File vs equipment summary on T-102 blocker

| Field | Value |
|---|---|
| AREA | Load File / Equipment |
| OBSERVED BEHAVIOR | `/loads/L001` “No canonical maintenance blocker” / “Asset T-102” while equipment summary is Out of Service / NOT_DISPATCHABLE. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Load File maintenance line should copy the same `listMaintenanceAssetSummaries` fields Dispatch Copilot uses. |
| EVIDENCE | Browser L001 snapshot vs T-102 summary print. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Load detail presentation vs maintenance summary |
| AFFECTED ROLE(S) | Dispatch |
| AFFECTED WORKFLOW(S) | Release / assignment |
| PRODUCTION IMPACT | Load File can imply equipment is clear while maintenance is OOS. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | semantic inconsistency |
| EXISTING BOF COMPONENT | Load detail / canonical dispatch operating state |
| RECOMMENDED REMEDIATION | Copy assignability/dispatchability onto the existing load maintenance line. |
| DEPENDENCIES | GAP-009-008 |
| VALIDATION REQUIRED | L001 shows T-102 not dispatchable when summary says so |
| CERTIFICATION STATUS | VALIDATED — `getCanonicalDispatchLoadState(L001)` now includes maintenance HOLD `T-102 Out of Service`. Unauthenticated `/loads/L001` remains session-gated (010B); authenticated fallback and Copilot consume that state. |

---

## GAP-009-025 — Header claims authenticated application without a session

| Field | Value |
|---|---|
| AREA | UX / Authorization |
| OBSERVED BEHAVIOR | After 013: product nav `aria-label` is `Authenticated application` only when `/api/auth/session` returns a user id. Otherwise `Operator application (session not established)`. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Label must match actual session state. |
| EVIDENCE | Browser snapshots on CC, loads, drivers, customer. `BofHeader.tsx`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Header vs `/api/auth/session` |
| AFFECTED ROLE(S) | All |
| AFFECTED WORKFLOW(S) | Trust of access control |
| PRODUCTION IMPACT | UI implies auth that does not exist. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | UX issue |
| EXISTING BOF COMPONENT | BofHeader |
| RECOMMENDED REMEDIATION | Bind label to existing session helper. |
| DEPENDENCIES | GAP-009-001, GAP-009-003 |
| VALIDATION REQUIRED | Unauth pages do not claim authenticated application |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-026 — Dispatch manager override not implemented

| Field | Value |
|---|---|
| AREA | Workflow Closure / Dispatch |
| OBSERVED BEHAVIOR | After 012: the fake override control is removed. Manager review copy points at the existing Review release gate (`/trip-release/:loadId`). No override API exists. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Either an existing override workflow or the control must not appear as an action. |
| EVIDENCE | Source line 121–124. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Dispatch triage UI |
| AFFECTED ROLE(S) | Dispatch manager |
| AFFECTED WORKFLOW(S) | Exception override |
| PRODUCTION IMPACT | Dead-end control on the exception board. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | workflow gap |
| EXISTING BOF COMPONENT | Dispatch triage; release API 409 HOLD/BLOCK |
| RECOMMENDED REMEDIATION | Remove or wire to existing release/hold APIs. No new override engine. |
| DEPENDENCIES | GAP-009-014 |
| VALIDATION REQUIRED | Control absent or completes an existing API |
| CERTIFICATION STATUS | VALIDATED |

---

## GAP-009-027 — Copilot AUTH_PENDING flash while session 500s

| Field | Value |
|---|---|
| AREA | Copilot / UX |
| OBSERVED BEHAVIOR | After 010B/013: unresolved session is AUTH_PENDING only until fetch completes. Non-OK or empty session resolves to AUTH_REQUIRED (not DEMO_SHELL_OPEN, not stuck AUTH_PENDING). |
| AUTHORITATIVE EXPECTED BEHAVIOR | Session failure should resolve to a terminal access decision, not hang AUTH_PENDING. |
| EVIDENCE | `components/copilot/use-copilot-advocate-session.ts`; `lib/copilot/copilot-advocate-access.ts`. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Copilot session hook |
| AFFECTED ROLE(S) | Operators |
| AFFECTED WORKFLOW(S) | Copilot |
| PRODUCTION IMPACT | Brief hide then open demo; confusing with MissingSecret. |
| SEVERITY | REFERENCE |
| ROOT-CAUSE CLASSIFICATION | UX issue |
| EXISTING BOF COMPONENT | useCopilotAdvocateSession |
| RECOMMENDED REMEDIATION | Treat non-OK session as resolved empty user (already does after fetch); shorten pending. |
| DEPENDENCIES | GAP-009-001 |
| VALIDATION REQUIRED | After session error, reason is DEMO_SHELL_OPEN or ROLE_REQUIRED, not stuck AUTH_PENDING |
| CERTIFICATION STATUS | VALIDATED — terminal reason is AUTH_REQUIRED after session error (stricter than DEMO_SHELL_OPEN). AUTH_PENDING is first-paint only. |

---

## GAP-009-028 — Live Prisma equipment fields PENDING / UNKNOWN

| Field | Value |
|---|---|
| AREA | Equipment / Data Authority |
| OBSERVED BEHAVIOR | `validate-canonical-equipment-spine` OK but firstAsset readiness `UNRESOLVED_PENDING_LIVE_RECONCILIATION`, outOfService MISSING, V3/V4 row unavailable. DEMO mode is what Copilot uses. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Production LIVE mode must reconcile Prisma equipment or fail closed as UNKNOWN — not demo Unavailable. |
| EVIDENCE | Validator JSON 2026-09-07. `canonical-equipment-spine.ts` LIVE pending path. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Canonical equipment spine LIVE vs DEMO |
| AFFECTED ROLE(S) | Maintenance / dispatch in live mode |
| AFFECTED WORKFLOW(S) | Equipment assignability |
| PRODUCTION IMPACT | Turning off DEMO leaves equipment unreadiness unresolved. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | data-authority issue / architecture ambiguity (ADR-009-001) |
| EXISTING BOF COMPONENT | Canonical equipment spine; Prisma Equipment |
| RECOMMENDED REMEDIATION | Complete existing LIVE reconciliation; do not add a second equipment SOT. |
| DEPENDENCIES | GAP-009-002, GAP-009-007 |
| VALIDATION REQUIRED | LIVE mode T-102 (or real unit) has non-pending availability from Prisma |
| CERTIFICATION STATUS | VALIDATED (fail-closed PENDING) — LIVE spine still returns `UNRESOLVED_PENDING_LIVE_RECONCILIATION` / `outOfService` MISSING. Prisma equipment facts were not invented. DEMO Unavailable is not used as LIVE authority. Non-pending Prisma availability remains unavailable in this worktree. |

---

## GAP-009-029 — MAPBOX / other public tokens unset (soft)

| Field | Value |
|---|---|
| AREA | Secrets / UX |
| OBSERVED BEHAVIOR | After 013: `NEXT_PUBLIC_MAPBOX_TOKEN` may still be unset. Load/Dispatch maps already show explicit missing-token UI. Dispatch map no longer logs token source names. Token was not invented. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Production maps need the documented token; missing should not be silent “success”. |
| EVIDENCE | Env key scan (names only). LoadRouteMap / DispatchRouteMap fallbacks. |
| EVIDENCE QUALITY | MEDIUM |
| SOURCE OF TRUTH | ENVIRONMENT_SETUP.md + map components |
| AFFECTED ROLE(S) | Dispatch |
| AFFECTED WORKFLOW(S) | Routing maps |
| PRODUCTION IMPACT | Route maps unavailable. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | environment issue |
| EXISTING BOF COMPONENT | Mapbox token env |
| RECOMMENDED REMEDIATION | Document + fail-soft already exists; production checklist must include the token. |
| DEPENDENCIES | none |
| VALIDATION REQUIRED | With token, map renders; without, explicit missing-token, not fake coordinates |
| CERTIFICATION STATUS | VALIDATED (fail-soft missing-token UI). Operator still supplies the token for live maps. |

---

## GAP-009-030 — V4 Assets parser column mismatch

| Field | Value |
|---|---|
| AREA | Maintenance V4 / Data Authority |
| OBSERVED BEHAVIOR | Parser expects `Readiness Status`; workbook has `Status Indicator`. T-102 workbook OK/OK but parsed readinessStatus empty → V4 counts miss OOS/Ready. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Loader must read the sheet headers that exist, or workbook is REFERENCE and not used for KPIs. |
| EVIDENCE | `lib/v3-operational-loader.ts` 760–777 plus workbook column names from 008/009 inspection. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | xlsx Assets sheet vs parser |
| AFFECTED ROLE(S) | Maintenance dashboard users |
| AFFECTED WORKFLOW(S) | Maintenance V4 KPIs |
| PRODUCTION IMPACT | Dashboard buckets ignore T-102. |
| SEVERITY | HIGH |
| ROOT-CAUSE CLASSIFICATION | code defect / data-authority issue |
| EXISTING BOF COMPONENT | `parseAssets` |
| RECOMMENDED REMEDIATION | Map existing column names; do not add a workbook engine. Subject to ADR-009-001. |
| DEPENDENCIES | GAP-009-007 |
| VALIDATION REQUIRED | Parsed T-102 status matches the sheet’s Status Indicator / Service Status |
| CERTIFICATION STATUS | VALIDATED — `parseAssets` reads Status Indicator / Service Status / Assigned Driver ID (T-102 workbook OK/OK / DRV-001). Maintenance V4 Ready/OOS KPIs use `listMaintenanceAssetSummaries`, not workbook OK as operating Ready. |

---

## GAP-009-031 — Protected product worktree already dirty (program hygiene)

| Field | Value |
|---|---|
| AREA | Git / Worktree |
| OBSERVED BEHAVIOR | `bof-web-e-c-foundation-20260823` has extensive local modifications and untracked files. This prompt did not write there. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Package §5.2 / §7.3: protected worktree unmodified by this program. |
| EVIDENCE | `git status` in protected worktree at Prompt 009 start. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | Git |
| AFFECTED ROLE(S) | Orchestrator |
| AFFECTED WORKFLOW(S) | Isolation |
| PRODUCTION IMPACT | None on orchestrator product; risk of confusing product vs orchestrator trees. |
| SEVERITY | REFERENCE |
| ROOT-CAUSE CLASSIFICATION | operational-process issue |
| EXISTING BOF COMPONENT | Isolated worktrees |
| RECOMMENDED REMEDIATION | Do not modify protected tree. Operator may clean independently. |
| DEPENDENCIES | none |
| VALIDATION REQUIRED | Orchestrator `git status` clean except 009 artifacts |
| CERTIFICATION STATUS | VERIFIED |

---

## GAP-009-032 — Dual customer data identities (Apex/L00x vs Prairie View / BOF-LD-86240)

| Field | Value |
|---|---|
| AREA | Customer |
| OBSERVED BEHAVIOR | `/portals/customer` shows Apex/L001… Copilot notes DEMO_CUSTOMER_PROFILE. `/customer-portal` is Prairie View / BOF-LD-86240 synthetic walkthrough. |
| AUTHORITATIVE EXPECTED BEHAVIOR | Customer-visible AUTHORITATIVE loads vs REFERENCE demo walkthrough must not be mixed. |
| EVIDENCE | Browser both routes; `customer-copilot-advocate-display.ts`; customer-portal copy. |
| EVIDENCE QUALITY | HIGH |
| SOURCE OF TRUTH | getCustomerVisibleLoads vs walkthrough shipment |
| AFFECTED ROLE(S) | Customer |
| AFFECTED WORKFLOW(S) | Customer status |
| PRODUCTION IMPACT | Two “customer portals” tell two stories. |
| SEVERITY | MEDIUM |
| ROOT-CAUSE CLASSIFICATION | data-authority issue |
| EXISTING BOF COMPONENT | Both portal trees |
| RECOMMENDED REMEDIATION | Keep `/customer-portal` labeled REFERENCE/DEMO; production customer URL one tree. |
| DEPENDENCIES | GAP-009-006, GAP-009-021 |
| VALIDATION REQUIRED | Production customer host has one identity set |
| CERTIFICATION STATUS | VALIDATED — `/portals/customer` is Apex / DEMO_CUSTOMER_PROFILE. `/customer-portal` is labeled REFERENCE/DEMO Prairie View walkthrough and no longer mounts Customer Copilot against L00x. |

---

## Architecture decisions required (not gaps to “engine” around)

| ID | Decision | Triggering gaps |
|---|---|---|
| ADR-009-001 | **Resolved (existing BOF classification).** Operator DEMO equipment/readiness/Command Center dispatch-hold KPIs: BOF JSON + `listMaintenanceAssetSummaries` / `getCanonicalDispatchLoadState`. V3/V4 workbook: REFERENCE. Prisma LIVE equipment: PENDING/UNKNOWN until real equipment rows exist — do not fill from DEMO. No fourth SOT. | 007, 008, 010, 028, 030 |
| ADR-009-002 | Production host posture: remain demo-open `(bof)` shell, or require existing NextAuth + `lib/authorization` on operator/customer surfaces? Not a new auth product. | 001, 003, 004, 006 |
| ADR-009-003 | **Resolved (existing href contract).** Operator `/settlements` identity is driver-week payroll. `STL-*` may be `settlementId`. `loadId` is highlighting only. Prisma `Settlement.id` cuid is not a `/settlements` nav key. Durable Prisma money remains out of 011 (014/015). | 013, 014, 015 |
| ADR-009-004 | Observability: stay with console/UI banners, or an approved existing vendor? **Do not create a BOF observability platform in 010–013.** | 019 |

No new orchestration, workflow, SOT, authorization, domain, observability, or security platform is authorized by this registry.

---

## Totals

| Severity | Count | IDs |
|---|---|---|
| BLOCKER | 5 | 001, 002, 003, 004, 006 |
| HIGH | 14 | 005, 007, 008, 010, 012, 013, 014, 015, 016, 018, 020, 024, 028, 030 |
| MEDIUM | 10 | 009, 011, 017, 019, 021, 023, 025, 026, 029, 032 |
| REFERENCE | 3 | 022, 027, 031 |
| **Total** | **32** | |

SPECULATIVE entries: 0 (Copilot signals independently re-verified before VERIFIED).

### Remaining open after Prompt 013 (by certification status)

VALIDATED this program: 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 032.

Still VERIFIED (not 013-closed): 031 (protected product worktree dirty — cannot modify).

Open BLOCKER gaps: 0. Remaining HIGH: 0. Remaining MEDIUM: 0. GAP-009-031 remains REFERENCE hygiene.
