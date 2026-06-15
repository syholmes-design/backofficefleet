# Checklist: Neutral Partner TMS Naming Boundary

Created: 2026-06-08 20:25:09 -05:00
Source: User client note, 2026-06-08: avoid public AscendTMS references
Owner persona: `checklist-execution-steward`
Status: complete

## Scope

Finish a neutral Partner TMS naming and route pass so BOF keeps the TMS-import workflow without showing `AscendTMS` in customer-facing UI, route names, page headings, navigation, buttons, marketing copy, or demo labels.

The intended visible story is:

> The TMS manages the load. BOF manages readiness, compliance, carrier-branded packets, employer-branded driver files, settlement holds, exceptions, audit trail, release decisions, and simulated handoff.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| NTMS-001 | User client note, 2026-06-08 | Add this client direction to durable project notes so future BOF work does not reintroduce visible `AscendTMS` references. | complete | `.codex/client-notes-master.md` TMS / Partner Workflow Notes updated with approved terms, forbidden terms, and neutral routes. | Durable note now includes approved/forbidden terms. |
| NTMS-002 | User client note, 2026-06-08 | Search active `Website` for customer-facing `AscendTMS`, `Ascend`, `ascendtms`, and old named-route references. | complete | Initial `rg` audit found visible named references in `Website`; final scan listed under NTMS-014 is clean. | Initial audit proved the site was mixed, not fully compliant. |
| NTMS-003 | User client note, 2026-06-08 | Replace visible public and demo copy with approved neutral labels. | complete | Final source scan: `rg -n "AscendTMS|Ascend|ascendtms|ascend|ASC-LD|ASC-DOC|Partner TMS Partner|an Partner|assets/js/ascendtms|v=1\.10|v=1\.9|v=1\.8|v=1\.7|v=1\.5" Website -g "*.html" -g "*.js" -g "*.json" -g "*.css"` returned no matches. | Visible labels now use `Partner TMS`, `TMS import`, `Imported from TMS`, neutral `TMS-LD-*` IDs, and simulated handoff language. |
| NTMS-004 | User client note, 2026-06-08 | Remove forbidden customer-facing phrases. | complete | Same final source scan returned no `AscendTMS`, `Ascend`, `ascendtms`, `ascend`, `ASC-LD`, `ASC-DOC`, or old adapter script references. | No customer-facing named-vendor wording remains in active HTML/JS/JSON/CSS content. |
| NTMS-005 | User client note, 2026-06-08 | Add or standardize neutral buyer routes: `/demo/tms-release-review/` and `/integrations/partner-tms/`. | complete | Route check returned `200` for `/demo/tms-release-review/` with title `TMS Release Readiness Workflow | BackOfficeFleet`; `/integrations/partner-tms/` with title `TMS Partner Workflow | BackOfficeFleet`. | Added static route folders under `Website`. |
| NTMS-006 | User client note, 2026-06-08 | Convert old `/integrations/ascendtms/` compatibility pages so they do not show vendor branding. | complete | Route check returned `200` for `/integrations/ascendtms/` with title `TMS Partner Workflow | BackOfficeFleet`; `/integrations/ascendtms/release-review/` with title `TMS Release Readiness Workflow | BackOfficeFleet`. Final source scan found no named-vendor copy. | Kept compatibility route path but rendered neutral content. |
| NTMS-007 | User client note, 2026-06-08 | Update public CTAs and nav links so buyers enter neutral TMS workflow/demo routes. | complete | `rg` evidence shows public CTAs route to `/demo/tms-release-review/` and `/integrations/partner-tms/`; route checks confirmed both return `200`. | Existing `/integrations/tms-workflow/` is also neutral compatibility. |
| NTMS-008 | User client note, 2026-06-08 | Neutralize `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/` visible labels. | complete | Route check titles: `Start Partner TMS Release Review`, `Opening Partner TMS Release Review`, and `Try Partner TMS Release Review`. Final scan found no named-vendor labels. | Product shell source pane now labels itself `Partner TMS`. |
| NTMS-009 | User client note, 2026-06-08 | Review visible synthetic load IDs such as `ASC-LD-10482` and decide whether to make them neutral. | complete | All visible `ASC-LD-*` and `ASC-DOC-*` IDs were converted to `TMS-LD-*` and `TMS-DOC-*`; final source scan found no old IDs. | Neutral ID choice avoids implying a named vendor. |
| NTMS-010 | User client note, 2026-06-08 | Keep the static simulation boundary explicit: no real API, live sync, credentials, auth, database, backend, or production vendor adapter. | complete | `.codex/client-notes-master.md` preserves no-live-integration boundary; implementation remains static HTML/CSS/vanilla JS/JSON. Syntax/data checks passed; no package/framework files were added. | Buyer-facing language uses simulated handoff/product wording. |
| NTMS-011 | User client note, 2026-06-08 | Preserve vendor-adapter readiness behind the scenes. | complete | New neutral helper `Website/assets/js/partner-tms.js` exposes neutral `TmsIntegration` API-ready functions over static JSON. | Real named-vendor adapter remains future-only after permissions/API access. |
| NTMS-012 | User client note, 2026-06-08 | Decide whether internal filenames such as `ascendtms.js` and `ascendtms-mock-loads.json` should remain or be renamed. | complete | Renamed active assets to `Website/assets/js/partner-tms.js` and `Website/assets/data/tms-mock-loads.json`; removed `Website/assets/js/ascendtms.js` and `Website/assets/data/ascendtms-mock-loads.json`. Final scan found no old adapter references. | Compatibility route folders remain only to avoid broken old links. |
| NTMS-013 | User client note, 2026-06-08 | Run syntax/data checks after edits. | complete | Passed: `node --check Website/assets/js/site.js`; `node --check Website/assets/js/partner-tms.js`; `node --check Website/assets/js/interactive-demo-routes.js`; JSON parse check for `Website/assets/data/tms-mock-loads.json` printed `json ok`. |  |
| NTMS-014 | User client note, 2026-06-08 | Run final visible-copy scans proving no customer-facing `AscendTMS` or `Ascend` remains. | complete | Final source scan command in NTMS-003 returned no matches. | Scan included HTML, JS, JSON, and CSS content. |
| NTMS-015 | User client note, 2026-06-08 | Verify routes and buyer flow after neutralization. | complete | Static server route check returned `200` for `/`, `/demo/tms-release-review/`, `/integrations/partner-tms/`, `/integrations/tms-workflow/`, `/integrations/tms-workflow/release-review/`, `/integrations/ascendtms/`, `/integrations/ascendtms/release-review/`, `/interactive-demo/start/`, `/interactive-demo/loading/`, and `/interactive-demo/`. | Required neutral and compatibility routes load. |
| NTMS-016 | User client note, 2026-06-08 | Browser-check desktop and mobile for obvious broken formatting after route/copy changes. | complete | Headless Chrome screenshots captured under `.codex/reports/neutral-partner-tms-screens/`: `review-desktop-v111.png`, `review-mobile-v111.png`, `partner-mobile-v111.png`, `interactive-start-mobile-v111.png`, plus earlier desktop/mobile checks. Visual inspection found neutral labels, rendered workflow data, and corrected mobile wrapping. | Mobile CSS caps were added for phone-safe public workflow/app-entry wrapping. |
| NTMS-017 | Project process | Bump asset cache version if shared CSS or JS references change. | complete | Ran `.codex/scripts/bump-website-cache-version.ps1 -Version 1.11 -IncludeScripts`; all HTML assets updated to `v=1.11`; `partner-tms.js` references manually set to `v=1.11`. | Prevents stale CSS/JS and old labels from browser cache. |
| NTMS-018 | Project process | Audit runtime leftovers after preview/browser checks. | complete | Ran `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1`, found one old Python preview server on port `3000`; ran `stop-runtime-leftovers.ps1 -Apply`; final audit reported `Candidate leftovers: 0`. | Temporary route/screenshot servers from this pass were stopped. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js`; `node --check Website/assets/js/partner-tms.js`; `node --check Website/assets/js/interactive-demo-routes.js`; JSON parse check for `Website/assets/data/tms-mock-loads.json`. |
| Route checks | complete | Static server route check returned `200` for required neutral, compatibility, and interactive-demo routes. |
| Browser/rendered check | complete | Headless Chrome screenshots in `.codex/reports/neutral-partner-tms-screens/`, including `review-desktop-v111.png`, `review-mobile-v111.png`, `partner-mobile-v111.png`, and `interactive-start-mobile-v111.png`. |
| Source/privacy/stale-copy scans | complete | Final `rg` scan for named vendor terms, old IDs, old adapter paths, stale versions, and awkward replacement copy returned no matches. |
| Runtime cleanup audit | complete | Runtime steward audit after cleanup reported `Candidate leftovers: 0`. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|
| Old named route compatibility | Kept as neutral compatibility pages. | Avoid breaking bookmarks or existing links while removing visible vendor branding. | If the user wants hard redirects or route deletion later. |
| Real TMS integration | Out of scope. | Client note explicitly says neutral simulation until branding/API permissions are clear. | User explicitly approves real API/sync/auth/backend work later. |
| Internal adapter naming | Renamed active assets to neutral `partner-tms.js` and `tms-mock-loads.json`; removed old named assets. | Aligns with client note preference to avoid named vendor lock-in internally when practical. | If a named vendor grants branding/API permission later. |

## Closeout Summary

- Completed: NTMS-001 through NTMS-018
- Remaining: none
- Blocked: none
- Deferred: none
- Verification: Backup created before edits; final search, syntax/data, route, screenshot, cache-busting, and runtime cleanup checks passed.
