# Checklist: Reference Driver Document Parity Goal

Created: 2026-06-10 10:44:40 -05:00
Source: User request, 2026-06-10; bof-web-Original reference driver demo
Owner persona: `checklist-execution-steward`
Status: complete

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
| RDP-001 | User request, 2026-06-10 | Start a durable goal for reference driver-document parity. | complete | Active Codex goal created; `.codex/goals/reference-driver-document-parity-goal.md` added. | Goal remains active until implementation/verification proves parity. |
| RDP-002 | Thread conflict steward / AGENTS.md | Check for nearby active driver/document work before editing. | complete | `rg` over `.codex/checklists/active` and `.codex/goals` found completed driver-document realism work plus deferred driver-vault parity items; conflict status recorded as `watch` in `.codex/reports/reference-driver-document-parity-start.md`. | Watch, not block: audit can proceed; implementation must reread current files before edits. |
| RDP-003 | Reference driver documentation auditor | Inventory reference drivers and document categories. | complete | Node REPL summary: `demo-data.json` has 12 drivers; `driver-doc-manifest.json` has 12 drivers and 15 unique manifest categories; `driver-public-doc-index.json` has 157 files. | Reference categories listed in start audit report. |
| RDP-004 | Reference driver documentation auditor | Inventory current Website driver coverage. | complete | Node REPL summary: `Website/assets/js/interactive-demo-routes.js` has 12 driver records, 12 unique portrait paths, and 23 `driverDocs` surfaces per driver. | Current surfaces appear to cover or exceed manifest categories on paper. |
| RDP-005 | Client demo proof advocate | Verify rendered driver routes and document-click behavior for all 12 drivers. | complete | `.codex/scripts/audit-driver-document-parity.mjs` checked 12 driver routes and 276 rendered document surfaces with `failureCount: 0`; full JSON at `.codex/reports/reference-driver-document-parity-render-audit.json`. | Verified all 23 document surfaces per driver, not a sample. |
| RDP-006 | Reference driver documentation auditor | Patch any missing document categories or weak surfaces found by rendered verification. | not_applicable | Rendered parity audit found no missing categories, route failures, document-surface failures, unloaded photos, or thin document surfaces. | No `Website` patch needed this pass. |
| RDP-007 | Detail/document/privacy validation | Run syntax, route, privacy/stale-copy, and visual/rendered checks after any implementation. | complete | Syntax checks passed for `Website/assets/js/interactive-demo-routes.js`, `Website/assets/js/site.js`, and `.codex/scripts/audit-driver-document-parity.mjs`; stale/private scan returned no matches; runtime audit reported `Candidate leftovers: 0`. | Final summary saved at `.codex/reports/reference-driver-document-parity-final.md`. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website\assets\js\interactive-demo-routes.js`; `node --check Website\assets\js\site.js`; `node --check .codex\scripts\audit-driver-document-parity.mjs`. |
| Route checks | complete | Headless Chrome audit loaded `/interactive-demo/drivers/drv-001/` through `/drv-012/` and all `?doc=0` through `?doc=22` document states. |
| Browser/rendered check | complete | `.codex/reports/reference-driver-document-parity-render-audit.json` reports 12 drivers checked, 276 document surfaces checked, 0 failures. |
| Source/privacy/stale-copy scans | complete | `rg` scan found no matches for raw/private/stale demo wording in checked driver/demo sources. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` reported `Candidate leftovers: 0`. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|
| Reference physical files | Do not copy old physical generated artifacts into `Website` by default. | Prior completed checklist found 173 manifest rows but copied 0 recoverable safe assets; current direction is synthetic/static-safe parity. | Revisit only if the client specifically rejects synthetic HTML documents and supplies/requires physical artifacts. |
| Product edits | No `Website` patch was needed. | Rendered audit found zero parity failures across all 276 driver-document surfaces. | Revisit if future client feedback rejects synthetic/static document surfaces or a later edit regresses the audit. |

## Closeout Summary

- Completed: RDP-001 through RDP-007.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: source/reference/current Website inventories captured in `.codex/reports/reference-driver-document-parity-start.md`; full rendered audit JSON saved at `.codex/reports/reference-driver-document-parity-render-audit.json`; final matrix and validation saved at `.codex/reports/reference-driver-document-parity-final.md`.

