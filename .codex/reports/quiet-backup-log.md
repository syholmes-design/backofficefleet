# Quiet Backup Log

Use this log only for short shared rollback notes. Do not turn it into a long collaboration report.

## Entry Template

### Date:

### Session/person:

### Backup checkpoint:

### Files changed:

### Rollback available:

---

### Date:
2026-05-22

### Session/person:
Codex

### Backup checkpoint:
`C:\Users\slyme\OneDrive\BackOfficeFleet-Shared-Rollback\bof-shared-checkpoint-2026-05-22-025510.zip`

### Files changed:
Quiet Backup Rollback Steward operating-layer setup and shared rollback scripts.

### Rollback available:
Yes. This checkpoint is separate from the main `../BackOfficeFleet-Backups/` backup set and does not count toward the main 20-backup limit.

---

### Date:
2026-05-22

### Session/person:
Codex

### Backup checkpoint:
`C:\Users\slyme\AppData\Local\BackOfficeFleet\SharedRollback\bof-shared-checkpoint-2026-05-22-082858.zip`

### Files changed:
Backup and shared rollback scripts now default to local app-data folders instead of OneDrive-synced sibling folders.

### Rollback available:
Yes. Main backups now default to `%LOCALAPPDATA%\BackOfficeFleet\Backups`; shared checkpoints now default to `%LOCALAPPDATA%\BackOfficeFleet\SharedRollback`; both can still be overridden with explicit script parameters or environment variables.
