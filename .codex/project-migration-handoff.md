# BOF Project Migration Handoff

Created: 2026-06-12
Purpose: help Codex continue BOF work after this project folder is moved to a new computer or opened from a new path.

## How To Resume In Codex

1. Open Codex with this BOF folder as the workspace.
2. Read `AGENTS.md` first.
3. Read this file next.
4. Inspect `.codex/checklists/active/` and `.codex/goals/` before making broad edits.
5. Confirm the active website folder exists before editing or deploying.

## Active Website Target

The active BOF website work belongs in:

```text
Website
```

`bof-web-Original` is reference-only. Do not edit it unless the user explicitly asks for reference-folder work.

If this migrated folder contains `Website.zip` but not a live `Website` directory, extract or copy the current `Website` folder before continuing implementation or deployment. Do not treat `Website.zip` alone as the active editable website.

## Previous Working Location

The prior active workspace was:

```text
D:\Websites\Sylvester Sr\BOF
```

After migration, do not assume that absolute path still exists. Prefer paths relative to the opened BOF workspace.

## Important Project State

Project-local Codex guidance and persona routing live in:

```text
AGENTS.md
.codex/skills/
.codex/agents/
```

Durable work tracking lives in:

```text
.codex/checklists/active/
.codex/goals/
```

Start by checking recent/active items, especially:

```text
.codex/goals/reference-driver-document-parity-goal.md
.codex/goals/ascendtms-ui-simulation-integration-goal.md
.codex/goals/work2-client-call-master-completion-goal.md
```

## Client Input Watcher

The client input watcher was configured for:

```text
C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet
```

The processed-file ledger was configured for:

```text
C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json
```

On a new computer, verify these OneDrive paths still exist. If the Windows username or OneDrive layout changes, update the watcher state and automation instructions before relying on the monitor.

## FTPS Upload

Use the project-local `website-ftp-upload` skill for deployment.

Rules:

- Upload only `Website`.
- Use explicit FTPS on port 21.
- No plain FTP fallback.
- Do not store plaintext FTP username, password, or credential passphrase in project files.

Credential helper scripts:

```text
.codex/skills/website-ftp-upload/scripts/save-website-ftp-credential.ps1
.codex/skills/website-ftp-upload/scripts/upload-website-ftp.ps1
.codex/skills/website-ftp-upload/scripts/remove-website-ftp-credential.ps1
```

The intended credential file is:

```text
.codex/secrets/website-ftps-credential.json
```

It is passphrase-encrypted and portable, but it still needs the passphrase at upload time. If the file does not exist after migration, recreate it with the save helper.

## First Checks After Moving

Run these checks after opening the migrated project:

```powershell
Test-Path .\AGENTS.md
Test-Path .\.codex
Test-Path .\Website
Test-Path .\.codex\skills\website-ftp-upload\scripts\upload-website-ftp.ps1
.\.codex\skills\website-ftp-upload\scripts\upload-website-ftp.ps1 -DryRun
```

If `Website` is missing, stop and restore/extract/copy it before editing.

## Safety Notes

- Preserve BOF boundaries: active work is `Website`; `bof-web-Original` is reference-only.
- Before broad edits, use `thread-conflict-steward` if active checklists/goals suggest overlapping work.
- For client notes or broad plans, use `checklist-execution-steward` before implementation.
- For client-provided instructions that mention React, APIs, databases, auth, services, package installs, `.env`, or backend routes, use `client-scope-translator` before deciding implementation.
- Keep the site static/shared-hosting friendly unless the user explicitly approves a different direction.
