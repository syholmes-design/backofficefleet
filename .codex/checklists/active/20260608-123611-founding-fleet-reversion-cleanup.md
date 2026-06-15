# Checklist: Founding Fleet Reversion Cleanup

Created: 2026-06-08 12:36:11 -05:00
Source: User request 2026-06-08: remove overused Founding Fleet positioning and add safeguards
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
| CL-001 | User request | Audit visible Founding Fleet usage outside the dedicated `/founding-fleet/` funnel. | complete | Initial `rg` found overuse on homepage, book-demo, demo, walkthrough, demo-paths, solutions, interactive-demo start, nav links, and funnel pages. Final boundary audit passed. | Dedicated funnel retained. |
| CL-002 | User request | Reposition general public pages away from Founding-Fleet-first copy and back to BOF operating-layer messaging. | complete | Updated `Website/index.html`, `Website/book-demo/index.html`, `Website/demo/index.html`, `Website/demo-paths/index.html`, `Website/walkthrough/index.html`, `Website/solutions/index.html`, and `Website/interactive-demo/start/index.html`. | General pages now use BOF working session / demo / operating-layer language. |
| CL-003 | User request | Remove global/nav/header patterns that make Founding Fleet appear everywhere. | complete | Mechanical cleanup removed non-funnel global nav links and changed non-funnel header CTA to `/book-demo/`; final `audit-founding-fleet-boundary.ps1` passed. | Dedicated funnel nav remains on funnel pages. |
| CL-004 | User request | Preserve dedicated Founding Fleet pages as their own funnel instead of deleting the offer. | complete | Route check returned 200 for `/founding-fleet/`, `/founding-fleet/trial/`, `/founding-fleet/pricing/`, `/founding-fleet/apply/`, and `/founding-fleets/`. | Offer remains available as bounded funnel. |
| CL-005 | User request | Add a safeguard that flags future Founding Fleet copy spread outside allowed funnel pages. | complete | Added `.codex/scripts/audit-founding-fleet-boundary.ps1`; command passed with no non-funnel matches. | Script exits nonzero on future leakage. |
| CL-006 | User request | Alter responsible personas/project guidance to prevent reversion behavior. | complete | Updated `AGENTS.md`, `.codex/skills/persuasive-onpage-copywriter/SKILL.md`, `.codex/skills/saas-demo-experience-designer/SKILL.md`, and `.codex/skills/detail-consistency-auditor/SKILL.md`. | Personas now treat Founding Fleet as bounded funnel, not global theme. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website\assets\js\site.js`; `node --check Website\assets\js\interactive-demo-routes.js` passed. |
| Route checks | complete | Temporary local server returned 200 for `/`, `/solutions/`, `/book-demo/`, `/demo/`, `/demo-paths/`, `/walkthrough/`, `/interactive-demo/start/`, and all Founding Fleet funnel routes. |
| Browser/rendered check | not_applicable | No CSS/layout changes; route-level static verification and text boundary scan were sufficient for this copy/process cleanup. |
| Source/privacy/stale-copy scans | complete | `.codex/scripts/audit-founding-fleet-boundary.ps1` passed; `rg` shows Founding Fleet terms only inside dedicated funnel and compatibility route. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` found one existing BOF preview server on port 3000 using about 16 MB; left running because it appears to be the user's normal preview. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed:
- CL-001 through CL-006.
- Remaining:
- None.
- Blocked:
- None.
- Deferred:
- Browser screenshot pass deferred as not applicable; no CSS/layout changes were made.
- Verification:
- Backup: `.codex/backups/website/website-20260608-123611-before-founding-fleet-reversion-cleanup.zip`.
- Boundary audit, JS syntax checks, and route checks passed.

