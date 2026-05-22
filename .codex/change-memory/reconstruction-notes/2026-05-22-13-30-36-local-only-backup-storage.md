# Reconstruction Notes

ID: 2026-05-22-local-only-backup-storage
Area changed: Local-only backup storage
Reason for change: Changed backup and shared rollback scripts to default to per-machine local app-data folders instead of OneDrive-synced sibling folders; moved existing backup/checkpoint files on this machine into local app-data storage; updated Codex guidance and logs.

## How to rebuild previous behavior if backups fail

1. Start with the files listed in `.codex/change-memory/sessions/2026-05-22-13-30-36-local-only-backup-storage.md`.
2. Use `.codex/change-memory/reverse-instructions/2026-05-22-13-30-36-local-only-backup-storage.md` for the plain-English rollback path.
3. Use `.codex/change-memory/patches/2026-05-22-13-30-36-local-only-backup-storage.patch` for exact line-level changes when it still applies.

## Rebuild confidence

Moderate. Fill in more detail after reviewing the specific change behavior.
