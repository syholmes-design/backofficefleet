# Checklist: Interactive Demo Consistency Pass

Created: 2026-06-08 20:53:57 -05:00
Source: User request, 2026-06-08: pass for consistency mistakes in the demo
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Run a bounded consistency pass on the BOF interactive demo. Find and fix client-visible mismatches, stale labels, broken route/menu wiring, ID/status drift, and obvious formatting mistakes without expanding demo scope.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| IDC-001 | User request + project naming boundary | Demo UI uses neutral `Partner TMS` / `TMS import` language with no customer-facing `AscendTMS`, `Ascend`, `ASC-LD`, or `ASC-DOC` drift. | complete | `rg` scan across `Website/interactive-demo`, `Website/assets/js/site.js`, `Website/assets/js/interactive-demo-routes.js`, and CSS returned no forbidden vendor/old-ID matches after fixes. | Start page still has intentional `Back to website` CTA outside app shell. |
| IDC-002 | Product shell architecture rule | `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/` keep separate route behavior; refreshing the app shell does not replay loader. | complete | Route checks returned 200 for `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/`; app shell screenshot shows direct control panel state. | Loader page remains separate and JS redirects to `/interactive-demo/`. |
| IDC-003 | User correction: one demo menu system | Demo app shell uses one consistent menu/nav system and does not contain stale public-site navigation links except an intentional exit/back-to-website action. | complete | Updated generated route shell in `Website/assets/js/interactive-demo-routes.js` from `Back to website` to `Website`; screenshot `drivers-desktop-after.png` confirms label alignment. | Start screen retains public return CTA because it is outside the app shell. |
| IDC-004 | Interactive demo wiring rule | Clickable-looking buttons, rows, alerts, filters, tabs, document controls, and status chips produce visible in-app feedback or are restyled/disabled. | complete | Chrome DevTools click audit: alert bell opened popover; first alert opened `Imported Document Gate`; approve/reset updated toast/status; ready filter/search/clear updated table info. | Bounded spot check, not an exhaustive click-map rebuild. |
| IDC-005 | Client consistency expectations | Load, driver, carrier, document, route, and record IDs/names/statuses agree across HTML, JS, and route pages. | complete | Normalized primary internal selected-load key from `bof-1842` to `tms-ld-10482` in `Website/interactive-demo/index.html` and `Website/assets/js/site.js`; stale `bof-1842` scan is clean. | Visible primary load remains `TMS-LD-10482 / BOF-RR-10482`. |
| IDC-006 | Client demo proof standards | Driver images, names/genders, driver record links, document labels, and visible document entry points are internally consistent. | complete | Image dimension audit shows all driver portraits are square; rendered screenshots for Marcus Reed and Liam Smith show unsquished portraits and matching male names/photos. | This pass did not add new document artifacts. |
| IDC-007 | Demo UX usability rule | Major menu/view changes feel intentional and show current selection/in-view state instead of jarring hidden-below-fold changes. | complete | Screenshots and click audit show Command Center selected row/inspector/toast updates; generated route pages keep active sidebar item and workspace title. | Larger animation/page-transition polish deferred unless requested. |
| IDC-008 | Layout formatting/client nit pass | Desktop and mobile rendered demo routes have no obvious clipped first-screen content, squished portraits, horizontal overflow, or unreadable dense tables. | complete | Screenshots saved under `.codex/reports/interactive-demo-consistency-screens/`; desktop app, drivers, Marcus, Liam, and mobile app/driver screenshots reviewed. | Mobile app shell remains a dense horizontal operations surface by design; no portrait distortion found. |
| IDC-009 | Static safety | Fixes remain static/shared-hosting safe with no packages, real API calls, backend, credentials, `.env`, or framework runtime. | complete | Checks found no root/Website `package.json`, no `Website/node_modules`; `fetch` uses local static JSON/manifest only. | No backend/API/sync work added. |
| IDC-010 | Verification | Run syntax checks, route checks, source scans, screenshot sanity checks, and runtime cleanup audit after fixes. | complete | `node --check` passed for `site.js`, `interactive-demo-routes.js`, `partner-tms.js`; JSON parse passed; 10 route checks returned 200; runtime audit found 0 candidate leftovers. | Workspace is not a git repository, so no git diff/status evidence was available. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js`; `node --check Website/assets/js/interactive-demo-routes.js`; `node --check Website/assets/js/partner-tms.js` all passed. |
| Route checks | complete | `/interactive-demo/start/`, `/interactive-demo/loading/`, `/interactive-demo/`, `/interactive-demo/load-queue/`, `/interactive-demo/dispatch/`, `/interactive-demo/drivers/`, `/interactive-demo/drivers/drv-007/`, `/interactive-demo/drivers/drv-008/`, `/interactive-demo/documents/`, `/interactive-demo/alerts/` returned 200. |
| Browser/rendered check | complete | Screenshots saved to `.codex/reports/interactive-demo-consistency-screens/`; Chrome DevTools click audit passed alert, approve/reset, filter, search, and clear behavior. |
| Source/privacy/stale-copy scans | complete | Final source scan returned no `bof-1842`, visible vendor terms, stale `ASC-*`, or old demo wording in the checked demo files. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` reported `Candidate leftovers: 0`. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: All 10 checklist items.
- Remaining: None.
- Blocked: None.
- Deferred: Larger mobile shell redesign and full click-map rebuild are outside this bounded consistency pass.
- Verification: Backup created; syntax/data checks passed; routes returned 200; screenshots reviewed; Chrome click audit passed; runtime audit clean.

