# Checklist: Founding Fleet Website Changes

Created: 2026-06-07 19:50:37 -05:00
Source: Goal: implement Founding Fleet changes; .codex/client-notes-master.md; Client Suggestions/ShowRecords.txt; recordings/work.txt
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Implement the client notes that reposition the BOF public buyer journey around Founding Fleet members, with for-hire trucking fleets as the primary audience and private/government fleet segments as supporting audiences.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| FF-001 | `.codex/client-notes-master.md`; `ShowRecords.txt` | Reposition the homepage/first page around Founding Fleet members and how early fleet-owner members benefit. | complete | `Website/index.html` hero now leads with Founding Fleet members and practical record review; `/` route returned 200 and screenshot captured. |  |
| FF-002 | `.codex/client-notes-master.md`; `ShowRecords.txt`; `work.txt` | Make for-hire trucking fleets / regular trucking companies the main audience. | complete | `Website/index.html` and `Website/founding-fleet/index.html` lead with for-hire trucking fleets; screenshots show first-screen for-hire messaging. |  |
| FF-003 | `.codex/client-notes-master.md`; `ShowRecords.txt`; `work.txt` | Keep private fleets, government fleets, and government-contracting fleets as supporting segments, not equal-weight hero messages. | complete | Homepage proof strip and cards keep private/government supported below the primary for-hire positioning; Founding Fleet page section states for-hire leads while private/government are supporting paths. |  |
| FF-004 | `.codex/client-notes-master.md`; `ShowRecords.txt` | Explain Founding Fleet as a practical working session around real operating records, driver files, documents, and release problems. | complete | Homepage, Founding Fleet page, and Book Demo page now frame the offer around one operating problem, driver files, document packets, release issues, and follow-up ownership. |  |
| FF-005 | `.codex/client-notes-master.md`; `ShowRecords.txt` | Avoid visible `AscendTMS` and avoid public `BOF Vault` anchor language. | complete | `rg 'AscendTMS|BOF Vault' Website -g '*.html'` returned no visible HTML matches. |  |
| FF-006 | Goal; current Website | Ensure the public buyer journey links to the Founding Fleet experience clearly from homepage/navigation/CTA surfaces. | complete | Header nav across static HTML now links to `/founding-fleet/`; homepage, Solutions, and Book Demo CTAs point into Founding Fleet/session paths. |  |
| FF-007 | Project guardrails | Preserve static/shared-hosting constraints and avoid backend/framework/API scope. | complete | Changed static HTML only; `node --check Website/assets/js/site.js` and `node --check Website/assets/js/ascendtms.js` passed. |  |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| File/route inventory | complete | Inspected `Website/index.html`, `/founding-fleet/`, `/book-demo/`, `/solutions/`, nav search, and current route files. |
| Visible copy search | complete | Searched for `Partner Workflow`, `AscendTMS`, `BOF Vault`, `TMS` phrases, and Founding Fleet/for-hire language across `Website`. |
| Syntax checks | complete | `node --check Website/assets/js/site.js`; `node --check Website/assets/js/ascendtms.js`. |
| Route checks | complete | `/`, `/founding-fleet/`, `/book-demo/`, `/solutions/` returned 200 on `http://localhost:3000`. |
| Browser/rendered check | complete | Snapshot report `.codex/reports/visual-snapshots/founding-fleet-implementation/REVIEW.md`; inspected home/founding/book/solutions mobile/desktop key screenshots. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: FF-001 through FF-007.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: static route checks, JS syntax checks, visible-copy scans, and visual snapshots completed.

