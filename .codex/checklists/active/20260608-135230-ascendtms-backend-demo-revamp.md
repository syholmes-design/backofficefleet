# Checklist: AscendTMS Backend Demo Revamp

Created: 2026-06-08 13:52:30 -05:00
Source: Active goal: revamp interactive demo to look very similar to AscendTMS backend
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Revamp the BOF interactive demo so its source-system/backend portions visibly and structurally resemble the provided AscendTMS backend screenshots while BOF remains the readiness, documents, exceptions, audit, release-decision, owner, and next-action layer.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | Active goal + `.codex/ascendtms-backend-ui-reference.md` | Inspect current `/interactive-demo/` source-system/backend UI and identify concrete gaps against AscendTMS reference patterns. | complete | Inspected `Website/interactive-demo/index.html` source-system region, `Website/assets/js/site.js` `ascendSourceLoads` and `renderAscendSourcePanel`, `Website/assets/css/styles.css` source-pane styles, plus `.codex/ascendtms-backend-ui-reference.md`. | Gaps found: no source module rail, limited load-board columns, pill tabs instead of backend tab strip, no shortcuts popover, document/accounting cues not formatted like backend work screens. |
| CL-002 | AscendTMS Backend Visual Parity Director | Add an AscendTMS-like source-system shell/pane treatment: blue/grey module feel, utility header, breadcrumb/title band, and backend-panel proportions inside the demo without making all BOF UI an AscendTMS clone. | complete | Added `.source-backend-frame`, blue module rail, AscendTMS-like mark, utility breadcrumb bar, title band, and backend workspace styles in `Website/interactive-demo/index.html` and `Website/assets/css/styles.css`. Playwright desktop render confirmed blue rail `rgb(50, 155, 215)`, active `Loads` module, and no body overflow. | Source-system area only; BOF shell stays BOF. |
| CL-003 | AscendTMS Backend Formatting Director | Reformat source load board around AscendTMS-like tabs, compact action toolbar, search/filter row, dense table headers, full-cell status coloring, sortable-looking columns, and intentional horizontal table behavior. | complete | Added tabs for Active/Planning/Ready for Accounting/Misc/All/Posted loads, compact toolbar, search/filter row, 18-column dense load table, sortable-looking headers, selected-row highlight, and full-cell status coloring. Playwright confirmed 18 headers, selected row, internal table scroll, and no body overflow. | Avoid generic cards for TMS load board. |
| CL-004 | AscendTMS backend reference: shortcuts menu | Add or strengthen load shortcut/popover behavior so a selected source load exposes practical actions like edit/view docs/request docs/tracking/log/accounting/archive/cancel, with visible state or disabled/restyled controls. | complete | Added selected-load shortcuts popover with 14 actions and wired source-system controls into related BOF proof records or source state. Patched title-action and build-load controls so they are not dead. Playwright confirmed shortcut popover visible and 14 shortcut actions. | No dead source-system controls after audit, except BOF file button uses the existing `data-record` app-shell wiring. |
| CL-005 | AscendTMS backend reference: document management | Add or strengthen document-management formatting in the demo: processed/unprocessed state, attachment/type chips, upload source, and a preview/edit style document pane for source documents. | complete | Source documents now render inside a backend-style detail pane with upload source/type/processed notes, document count in the load board, and `Load Documents`/document-row clicks opening the BOF document proof pane. | This is formatting/workflow, not full doc artifact overhaul. |
| CL-006 | AscendTMS backend reference: accounting handoff | Add or strengthen accounting/paperwork handoff cues: ready-for-accounting, invoice/bill/paperwork status, settlement or gross P/L consequence, and simulated handoff without implying live sync. | complete | Added source-load income, expenses, gross P/L, paperwork/accounting status, ready-for-accounting filter, accounting handoff cards, and source shortcut action for sending to accounting management. | Keep BOF release decision dominant. |
| CL-007 | Active goal: preserve BOF layer | Preserve BOF-owned readiness/release areas: driver readiness, carrier packet, document readiness, exception owner, audit trail, release decision, next action, and simulated handoff remain clear beside source-system status. | complete | Rendered `/interactive-demo/` still shows BOF shell, selected-load pane, dispatch consequence, next action, BOF readiness file, and source-system clicks open BOF proof records rather than replacing the BOF layer. | BOF remains readiness/release owner. |
| CL-008 | Static/shared-hosting boundary | Confirm no real AscendTMS API/sync/auth/database/backend/packages were added or implied; keep implementation HTML/CSS/vanilla JS/JSON only. | complete | Search for `fetch(`, `XMLHttpRequest`, `WebSocket`, `api.ascend`, `ascendtms.com`, `node_modules`, `package.json`, and `.env` found only local static JSON fetches in `Website/assets/js/ascendtms.js` and `Website/assets/js/site.js`. | No real external API/sync/auth/database/backend/package work added. |
| CL-009 | Test plan | Run syntax checks, route/render checks for `/interactive-demo/start/`, `/interactive-demo/loading/`, `/interactive-demo/`, and at least one route page; inspect desktop/mobile screenshots for AscendTMS-like backend formatting and no obvious overflow. | complete | `node --check Website/assets/js/site.js` passed; `node --check Website/assets/js/interactive-demo-routes.js` passed; routes `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/` returned 200; loader redirected to `/interactive-demo/`; refresh stayed in app shell; desktop/mobile renders show no body overflow; runtime audit found only the intentional BOF preview server on port 3000 using about 14.8 MB. | Playwright was closed after render checks; preview server left running intentionally. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js` and `node --check Website/assets/js/interactive-demo-routes.js` passed. |
| Route checks | complete | `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/` returned 200; loader route redirected into `/interactive-demo/`; reload stayed in app shell. |
| Browser/rendered check | complete | Playwright desktop/mobile renders confirmed backend-style source frame, 18-column dense table, shortcut popover, internal table scroll, and no horizontal body overflow. |
| Source/privacy/stale-copy scans | complete | Static boundary scan found only local JSON fetches, no live AscendTMS/API/backend/package indicators. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` found one intentional local Python preview server on BOF preview port 3000, about 14.8 MB. No stuck Playwright/snapshot helpers found. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CL-001 through CL-009.
- Remaining: none.
- Blocked:
- Deferred:
- Verification: Syntax, route, loader redirect, app refresh, desktop render, mobile render, static-boundary scan, and runtime audit passed.

