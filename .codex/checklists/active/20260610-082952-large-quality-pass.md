# Checklist: Large BOF Website Quality Pass

Created: 2026-06-10 08:29:52 -05:00
Source: User goal request 2026-06-10 plus master client notes
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Convert the source into atomic checklist items and process them one at a time.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | User goal request + client advocate | Define bounded quality-pass acceptance criteria before editing. | complete | Checklist items CL-002 through CL-008 created from master client notes and user goal. | Focus on client-visible errors and meaningful improvements, not endless polish. |
| CL-002 | Master client notes | Scan for stale public language: visible `AscendTMS`, developer/demo-building phrases, `555`, awkward driver labels, and cache-version drift. | complete | `rg` scans found no visible `AscendTMS`, `555`, `static demo`, `mockup`, `fake API`, `BOF Vault`, `drivers records`, or `Try Records Demo`; remaining `placeholder` hits are form/search attributes. Fixed Founding Fleets global-nav drift, homepage funnel entry, release-review text, finance strings, and generated-form wording. | Remaining named compatibility routes may exist, but rendered buyer copy is neutral. |
| CL-003 | Public buyer journey | Check homepage, demo, Founding Fleet, book-demo, documents, and driver/supporting pages for clear next actions and no structural regressions. | complete | Added a homepage Founding Fleet entry path; replaced global Founding Fleets nav with Partner Workflow; route checks returned 200 for `/`, `/demo/`, `/founding-fleet/`, `/founding-fleets/`, `/book-demo/`, `/documents/`, `/drivers/`. | Founding Fleet remains a dedicated funnel reachable from homepage and funnel pages. |
| CL-004 | Interactive demo UX | Inspect `/interactive-demo/` and route pages for click feedback, in-view state changes, one menu system, clear exit-to-website, and no dead-looking controls. | complete | Improved generated route-page descriptions for Load Queue, Dispatch, Drivers, Carriers, Documents, Safety & Compliance, Reports, Alerts, and Settings; route pages keep the product shell nav and Website exit; `/interactive-demo/`, `/interactive-demo/load-queue/`, and driver routes returned 200. | Main app shell remains separate from public site chrome. |
| CL-005 | Driver/document proof | Check driver records and document surfaces for complete DQF/document realism, clickable proof, readable previews, no distorted critical portraits, and believable ready/watch/hold examples. | complete | Rendered ratio check across `/interactive-demo/drivers/drv-001/` through `/drv-012/`; all driver images showed zero aspect-ratio delta, including `drv-007` Marcus Reed and `drv-008` Liam Smith. Screenshots captured for driver record pages. | Recent DQF/document-realism surfaces preserved. |
| CL-006 | Layout and visual QA | Browser/screenshot check desktop and mobile for homepage, major public pages, demo start, interactive app shell, and driver/document record pages. | complete | Chrome/CDP screenshots saved under `.codex/reports/large-quality-pass-screens/`; checked desktop and mobile for homepage, workflow, release-review, Founding Fleet, book-demo, documents, drivers, demo start, demo app, demo driver, and demo load queue; audit found no horizontal body overflow. | Route table overflow is contained inside scroll areas on mobile. |
| CL-007 | Static safety and syntax | Run JS syntax checks, JSON parse checks, route checks, stale-copy scans, and confirm no framework/backend artifacts were introduced. | complete | `node --check` passed for `site.js`, `interactive-demo-routes.js`, `partner-tms.js`; JSON parse passed for edited data files; stale-copy scan clean; static-boundary scan found no `package.json`, `node_modules`, `.next`, `.env`, TS/React files, or external TMS/API calls. | Local `fetch()` calls remain limited to static JSON assets. |
| CL-008 | Cache and runtime hygiene | Bump cache version if CSS/shared JS changes, then run runtime-resource audit after preview/browser work. | complete | Ran `.codex/scripts/bump-website-cache-version.ps1 -Version 1.15 -IncludeScripts`; asset version scan ok; runtime audit found 0 leftovers; stopped the validation preview server on port `8094` and confirmed `8094 clear`. | Avoid stale browser rendering and leftover RAM usage. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js`; `node --check Website/assets/js/interactive-demo-routes.js`; `node --check Website/assets/js/partner-tms.js`. |
| Route checks | complete | Local static server route checks returned 200 for public, Founding Fleet, TMS workflow, and interactive-demo routes. |
| Browser/rendered check | complete | Chrome/CDP desktop and mobile screenshots in `.codex/reports/large-quality-pass-screens/`; no horizontal body overflow in checked routes. |
| Source/privacy/stale-copy scans | complete | `rg` stale-copy scan clean; no visible `AscendTMS`, `555`, demo-building phrases, or global Founding Fleet nav drift. |
| Runtime cleanup audit | complete | Runtime audit 0 leftovers; validation server on `127.0.0.1:8094` stopped and confirmed clear. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CL-001 through CL-008.
- Remaining: none for this bounded quality pass.
- Blocked: none.
- Deferred: deeper subjective redesign/polish beyond the verified issues.
- Verification: syntax checks, JSON parse, route checks, stale-copy scans, asset-version scan, Chrome/CDP screenshots, driver image ratio checks, runtime cleanup audit.

