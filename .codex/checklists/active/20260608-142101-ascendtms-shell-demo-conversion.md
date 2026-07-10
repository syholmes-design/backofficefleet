# Checklist: AscendTMS Shell Demo Conversion

Created: 2026-06-08 14:21:01 -05:00
Source: Active goal: convert interactive demo to AscendTMS-shaped shell while preserving BOF proof depth
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Finish converting `Website/interactive-demo/` into an AscendTMS-shaped private demo shell while preserving BOF's required proof depth. The private demo may visibly show `AscendTMS`; public website pages should continue avoiding visible AscendTMS wording. This remains a static shared-hosting-safe simulation, not a real integration.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | Active goal + current-state rule | Inspect current `/interactive-demo/` shell, source-system pane, navigation, driver/document routes, and rendered behavior before editing. | complete | Inspected `Website/interactive-demo/index.html`, `Website/assets/js/site.js`, `Website/assets/css/styles.css`, route inventory under `Website/interactive-demo/`, public integration routes, and Playwright desktop render. Found shell still mostly BOF/beveled, source-system pane starts below queue, sidebar used old route links, 12 driver route pages exist, and public `/integrations/ascendtms/` pages still exposed AscendTMS wording. | Current worktree and rendered site are authoritative. |
| CL-002 | Active goal: AscendTMS-shaped shell | Convert the app shell itself toward AscendTMS-like operations software: top utility/menu bars, blue/grey module rail, dense workspace chrome, compact controls, and source-system formatting across the main demo surface, not just a small embedded section. | complete | Added `ascend-demo-shell` class, converted shell chrome with blue module rail, grey utility/topbar treatment, compact source-style buttons, denser tables, selected-row coloring, and cache-busted demo CSS to `v=1.9`. Applied matching blue/grey shell chrome to route-backed demo pages. Playwright confirmed main shell rail background `rgb(50, 155, 215)`, shell grid `164px 1276px`, source frame present, driver route rail background `rgb(50, 155, 215)`, and no body overflow. | BOF identity remains visible while the private demo shell is now source-system-shaped. |
| CL-003 | Active goal + client notes: preserve BOF proof | Preserve BOF as the readiness layer with clear driver readiness, carrier packet, document readiness, exception owner, audit trail, release decision, owner, consequence, and next action. | complete | Main shell render still shows selected-load pane with BOF readiness file, driver, carrier, dispatch consequence, next action, and release owner. App-view click audit confirmed Command Center, Load Queue, Dispatch, Drivers, Carriers, Documents, Safety, Reports, Alerts, and Settings each open BOF record-panel content with rows and utility feedback. | BOF remains readiness/release owner. |
| CL-004 | Client notes: demo click usefulness | Make primary shell navigation/workspaces visibly change in-view state for Command Center, Load Queue, Dispatch, Drivers, Carriers, Documents, Safety, Reports, and Alerts, or clearly present the section as disabled/secondary. | complete | Replaced main `/interactive-demo/` sidebar route anchors with `[data-app-view]` buttons and updated JS to maintain `aria-pressed`. Playwright audited all 10 primary app views; each stayed on `/interactive-demo/`, updated active nav/`aria-pressed`, changed the workspace title/rows, opened a related record title, and had no body overflow. | Route-backed pages remain available from complete record/document paths. |
| CL-005 | Client notes: driver/document proof | Preserve driver detail requirements: unique portraits, driver routes, driver pages, and roughly 20 clickable document categories per driver, without replacing them with thin AscendTMS-only rows. | complete | `/interactive-demo/drivers/drv-001/` through `/drv-012/` returned 200. Playwright audit found unique portrait paths `driver-ref-001.jpg` through `driver-ref-012.jpg`, 24 document-card/button surfaces per driver route, visible license/CDL language, and no body overflow. Driver route CSS now matches the converted shell chrome. | No driver proof flattening introduced in this pass. |
| CL-006 | Client notes: documents/POD | Keep load/POD/document proof inspectable inside the demo: large document surfaces, source, status, owner, settlement/release consequence, claim consequence where relevant, and visible in-view document behavior. | complete | Playwright clicked Documents > POD record and confirmed `/interactive-demo/` stayed in shell, record title `BOF-1907 POD Follow-Up` opened, and visible text contains GPS/location, receiver/signature, settlement/payment consequence, and dock/photo/empty-trailer/cargo evidence. Source Document Management module shows document rows and opens BOF proof records. Driver route audit preserved 20-plus document-card surfaces. | Documents/POD proof preserved inside the converted shell. |
| CL-007 | AscendTMS backend UI reference | Add stronger AscendTMS-like module/workflow coverage beyond the load board: load details, load documents, load log/text/tracking events, accounting/paperwork handoff, and shortcut actions should feel connected. | complete | Added `sourceModule` state and source-module rail switching for Dashboard, Loads, Doc Management, Accounting, Track/Text, and Settings. Playwright confirmed each module changes breadcrumb/title/module content in view. Doc Management shows 6 rows; Accounting shows 6 rows; Tracking shows load-log actions; Load Management keeps dense grid and 14 shortcuts. | Static simulation only; no real API/sync. |
| CL-008 | Naming boundary | Confirm public website pages avoid visible `AscendTMS`, while the private interactive demo may show it deliberately. | complete | Copied neutral `/integrations/tms-workflow/` content into `/integrations/ascendtms/` compatibility routes. Public-only HTML scan across `Website/integrations`, homepage, solutions, demo, walkthrough, documents, book-demo, and founding-fleet routes returned no visible `AscendTMS`; demo routes still intentionally show it. | Public route exceptions now render neutral TMS language. |
| CL-009 | Static/shared-hosting boundary | Confirm no real AscendTMS API/sync/auth/database/backend/packages were added or implied. | complete | Search for `fetch(`, `XMLHttpRequest`, `WebSocket`, `api.ascend`, `ascendtms.com`, `node_modules`, `package.json`, `.env`, `localStorage`, and `sessionStorage` found only local static JSON fetches in `Website/assets/js/site.js` and `Website/assets/js/ascendtms.js`. | HTML/CSS/vanilla JS/JSON only. |
| CL-010 | Validation | Run syntax, route, rendered desktop/mobile, key click, and runtime audits before considering the goal complete. | complete | Syntax, route, public naming, app navigation click, source-module click, driver-route, document/POD, desktop render, mobile render, static-boundary scan, and runtime audit checks passed. Runtime audit found only the intentional BOF preview server on port 3000 using about 14.7 MB. | Preview server left running intentionally. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | in_progress | `node --check Website/assets/js/site.js` and `node --check Website/assets/js/interactive-demo-routes.js` passed after structural and source-module passes. |
| Route checks | in_progress | `/interactive-demo/`, `/interactive-demo/start/`, `/interactive-demo/loading/`, `/interactive-demo/drivers/drv-001/` through `/drv-012/`, `/integrations/ascendtms/`, `/integrations/ascendtms/release-review/`, `/integrations/tms-workflow/`, and `/integrations/tms-workflow/release-review/` returned 200. |
| Browser/rendered check | in_progress | Playwright desktop/mobile renders confirmed in-shell nav clicks, blue/grey shell rail, source-module switching, driver route shell chrome, and no horizontal body overflow. |
| Source/privacy/stale-copy scans | pending |  |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` found only the intentional local Python preview server on BOF preview port 3000, about 14.7 MB. No stuck Playwright/snapshot helpers found. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CL-001 through CL-010.
- Remaining: none.
- Blocked:
- Deferred:
- Verification: Syntax, route, public naming scan, app-view click audit, source-module click audit, driver route audit, document/POD proof check, desktop render, mobile render, static-boundary scan, and runtime audit passed.

