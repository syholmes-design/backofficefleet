---
name: website-backup-steward
description: "Use for BOF Website backup and restore safety: creating timestamped Website zip backups, listing backup inventory, restoring only with explicit confirmation, and saving tokens by using headless scripts instead of manual copy/review."
---

# Website Backup Steward

Use this project-local skill when the user asks to back up the website, create a restore point, protect work before broad edits, list backups, restore a backup, or set up a repeatable website backup workflow.

## Purpose

Keep the active `Website` folder recoverable with fast, script-driven backups that stay outside the deployable site.

## When To Use

- Before broad HTML/CSS/JS/demo changes.
- Before cleanup, delete, restore, or risky visual passes.
- When the user asks to "back up the website", "make a restore point", "save this state", "list backups", or "restore the site".
- When a future Codex session would otherwise spend tokens rediscovering what needs to be copied.

## Context To Load

- `AGENTS.md`
- `.codex/agents/website_backup_steward.md`
- This `SKILL.md`
- Script help or source only when needed:
  - `scripts/backup-website.ps1`
  - `scripts/list-website-backups.ps1`
  - `scripts/restore-website-backup.ps1`

Do not load the full `Website` tree just to make a backup. The scripts discover files and produce a manifest.

## Procedure

1. Confirm `Website` is the active website folder and `bof-web-Original` is reference-only.
2. For a backup, run:

   ```powershell
   .\.codex\skills\website-backup-steward\scripts\backup-website.ps1 -Label before-change
   ```

3. For backup inventory, run:

   ```powershell
   .\.codex\skills\website-backup-steward\scripts\list-website-backups.ps1
   ```

4. For restore, require an explicit user request and a specific zip path, then run:

   ```powershell
   .\.codex\skills\website-backup-steward\scripts\restore-website-backup.ps1 -BackupZip ".codex\backups\website\website-YYYYMMDD-HHMMSS.zip" -ConfirmRestore
   ```

5. Report only the important result: backup zip, manifest, file count, total size, SHA-256, and any pruned backups.

## Checks

- Does `Website` exist?
- Is the backup root outside `Website`?
- Did the zip and manifest get created?
- Does the manifest include file count, total bytes, and zip SHA-256?
- For restore, did the command create a safety backup first?
- Did the restore target resolve to this project's `Website` folder?

## Output Format

```markdown
## Website Backup

Action:
Backup:
Manifest:
Files:
Size:
SHA-256:
Notes:
```

## Failure Modes

- `Website` is missing.
- Backup root is accidentally inside `Website`.
- `Compress-Archive` fails because a file is locked.
- Restore zip is missing or malformed.
- Restore requested without `-ConfirmRestore`.

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not put backups in `Website`.
- Do not restore without explicit user approval.
- Do not delete `Website` with ad hoc shell commands.
- Do not use recursive delete or move unless the restore script has verified the resolved target path.
- Do not install dependencies for backup work.
