---
name: client-input-watch-steward
description: Use for BOF client-input intake monitoring: watching the OneDrive BackOfficeFleet notes folder for new or changed client files, summarizing intake, detecting removed files, routing to the client advocate/checklist system, and preventing raw client input from being missed or implemented without triage.
---

# Client Input Watch Steward

Use this project-local skill to monitor the BOF client-input folder and hand off new or changed client material to the client advocate.

## Purpose

Watch for client updates in:

```text
C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet
```

Record processed-file status in:

```text
C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json
```

This is an intake role only. It detects, summarizes, and routes client input. It does not implement website/demo changes.

## When To Use

- The user asks Codex to monitor or watch the BOF client notes folder.
- A recurring automation checks for new client files.
- New client files, screenshots, transcripts, ODT/DOCX/PDF files, spreadsheets, images, audio, or video appear in the watched folder.
- The user asks whether the client sent anything new.
- BOF work needs to confirm whether fresh client notes should change the active checklist.

## Context To Load

Load only what is needed:

- `AGENTS.md`
- `.codex/client-notes-master.md` for client themes
- `.codex/client-call-work2-instructions.md` when the new input touches work2 topics
- Current file listing for `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet`
- Previous watcher state under `.codex/client-input-watch-state.json` when present
- Processed-file ledger under `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json` when present
- The specific new or changed file, only after metadata proves it needs intake

## Procedure

1. Confirm the watched folder exists and is readable.
2. Build a current inventory of files using relative path, extension, byte size, last modified time, and hash when practical.
3. Compare current inventory against `.codex/client-input-watch-state.json` when present.
4. Compare current inventory against the processed-file ledger when present.
5. Classify files as new, changed, removed, unchanged, or already processed.
6. For new/changed plain-text files, read enough to summarize client intent.
7. For new/changed binary or rich documents, report the file and route to the appropriate skill:
   - Word/ODT/PDF client instructions: document extraction plus `client-advocate-project-manager`
   - Spreadsheets: spreadsheet skill plus `client-advocate-project-manager`
   - Screenshots or images: `website-visual-snapshot-reviewer` and `visual-taste-curator`
   - Audio/video: transcript or `video-proof-sampler` as appropriate
8. Convert findings into a handoff:
   - client intent
   - likely BOF area affected
   - recommended specialist/persona
   - whether a checklist is needed
   - safety or scope warnings
9. Record processed files in the ledger after the intake pass. Include source path, size, last modified time, hash when practical, processed time, intake status, routing, and checklist path if created.
10. Update the watcher state only after the intake pass records what was seen.

## Checks

- Was the watched folder readable?
- Were new, changed, and removed files distinguished?
- Were already-processed files recognized from the ledger?
- Was the processed-file ledger updated for files that were triaged?
- Did the watcher avoid editing the client source files?
- Did broad/actionable input route to `client-advocate-project-manager` before implementation?
- Did framework/API/backend-heavy wording route to `client-scope-translator`?
- Did the watcher avoid public-copy wording or implementation decisions?

## Output Format

```markdown
Client input watch status: changes found | no changes | needs attention
Watched folder:
New files:
Changed files:
Removed files:
Likely client intent:
Recommended BOF routing:
Checklist action:
Evidence:
Ledger update:
```

## Failure Modes

- Folder missing or unreadable: report `needs attention` with the exact path.
- File locked or cloud-only: report the file and ask for sync/access if extraction is needed.
- Large or binary file: do not dump content; route to the correct skill.
- Conflicting client notes: report conflict and route to `client-advocate-project-manager`.
- Ledger missing: create or recreate `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json` without touching raw client files.

## Safety Boundaries

- Do not edit, move, rename, delete, or annotate files in the watched folder.
- Do not store raw client-file copies in the ledger unless the user explicitly asks.
- Do not implement `Website` changes directly from this skill.
- Do not expose raw private client data in public copy or broad reports.
- Do not edit `bof-web-Original`.
- Do not add backend, framework, API, database, auth, credentials, or live integration work from client input without explicit user approval.

## Suggested File Location

```text
.codex/skills/client-input-watch-steward/SKILL.md
.codex/agents/client_input_watch_steward.md
.codex/client-input-watch-state.json
C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json
```

## Copy-Paste Instruction Block

Use the `client-input-watch-steward` persona. Check `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet` for new, changed, or removed client input, compare against `.codex/client-input-watch-state.json` and `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json`, summarize actionable new/changed items, route them to `client-advocate-project-manager` and `checklist-execution-steward`, record processed-file status in the ledger, update watcher state after the intake pass, and do not edit watched client source files or implement website changes directly.
