# Checklist: Client Input Folder Watcher

Created: 2026-06-11 18:37:47 -05:00
Source: User request, 2026-06-11
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
| CIW-001 | User request, 2026-06-11 | Create a persona whose sole job is watching the BOF client-input folder. | complete | `.codex/agents/client_input_watch_steward.md` added. | Role is intake-only and explicitly not an implementation persona. |
| CIW-002 | User request, 2026-06-11 | Add a triggerable skill for folder monitoring and client-input routing. | complete | `.codex/skills/client-input-watch-steward/SKILL.md` added with valid frontmatter `name: client-input-watch-steward`. | Routes actionable findings to client advocate/checklist system. |
| CIW-003 | User request, 2026-06-11 | Register the watcher in project guidance. | complete | `AGENTS.md` now has `Client Input Watch Steward` section and folder path. | Protects watched OneDrive folder from edits/deletes and implementation creep. |
| CIW-004 | User request, 2026-06-11 | Create initial watcher state for the OneDrive folder. | complete | `.codex/client-input-watch-state.json` parses successfully and records watched folder with `files: 0`; current folder listing is empty. | Baseline prevents the first monitor run from guessing. |
| CIW-005 | User request, 2026-06-11 | Create recurring automation for the client advocate/watch process. | complete | App automation created and viewed with id `bof-client-input-watcher`. | Runs as a thread heartbeat every 30 minutes. |
| CIW-006 | User request, 2026-06-11 | Add a ledger folder in the main `Notes For Codex` folder to track processed client files. | complete | `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\README.md` and `processed-files.json` exist; `processed-files.json` parses with `processedFiles: 0`. | Persona, skill, state file, AGENTS guidance, and automation prompt now reference the ledger. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | JSON state and ledger parsed with Node; Markdown/skill references found via `rg`. |
| Route checks | not_applicable | Codex environment setup only; no `Website` routes changed. |
| Browser/rendered check | not_applicable | No rendered website UI changed. |
| Source/privacy/stale-copy scans | complete | `rg` confirmed `client-input-watch-steward`, watched folder path, ledger path, agent, skill, state, and AGENTS references. |
| Runtime cleanup audit | not_applicable | No preview server, browser automation, or long-running helper was started. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CIW-001 through CIW-006.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: watcher persona and skill added, AGENTS routing updated, baseline state created for empty watched folder, OneDrive ledger folder and processed-files ledger created, automation `bof-client-input-watcher` updated/viewed in app.

