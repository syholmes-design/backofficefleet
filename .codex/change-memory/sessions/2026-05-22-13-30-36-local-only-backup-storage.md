# Change Memory Entry

ID: 2026-05-22-local-only-backup-storage
Date: 2026-05-22T13:30:36.986Z
Codex session/person: Codex
Area changed: Local-only backup storage
Reason for change: Changed backup and shared rollback scripts to default to per-machine local app-data folders instead of OneDrive-synced sibling folders; moved existing backup/checkpoint files on this machine into local app-data storage; updated Codex guidance and logs.

## Files touched

- path: scripts/bof-backup.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/bof-list-backups.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/bof-restore.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/bof-shared-checkpoint.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/bof-list-shared-checkpoints.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/bof-restore-shared-checkpoint.ps1
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: AGENTS.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/agents/backup-restore-specialist.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/agents/quiet-backup-rollback-steward.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/quiet-backup-log.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/shared-handoff-log.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Exact change record

Patch file: .codex/change-memory/patches/2026-05-22-13-30-36-local-only-backup-storage.patch
Reverse instruction file: .codex/change-memory/reverse-instructions/2026-05-22-13-30-36-local-only-backup-storage.md

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the reverse note at `.codex/change-memory/reverse-instructions/2026-05-22-13-30-36-local-only-backup-storage.md`.
2. Reverse-apply the patch if it still matches the current files.
3. If the patch cannot apply, use the reconstruction note at `.codex/change-memory/reconstruction-notes/2026-05-22-13-30-36-local-only-backup-storage.md`.

## Rebuild notes if backup fails

If the original files are gone, recreate the previous version by:

1. Use the file list and summaries in this entry.
2. Rebuild the prior behavior from the reverse instructions.
3. Re-run the listed validation checks.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
