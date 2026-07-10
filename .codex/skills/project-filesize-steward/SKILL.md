---
name: project-filesize-steward
description: "Use for BOF project filesize hygiene: auditing .codex bloat, trimming OneDrive-heavy reports/tmp/snapshots/exports, classifying cleanup candidates, and preventing durable project memory from being deleted."
---

# Project Filesize Steward

Use this project-local skill when the user asks to trim `.codex`, reduce OneDrive bloat, audit project filesize, clean reports/tmp/snapshots/exports, or prevent future Codex artifacts from filling the shared folder.

## Purpose

Keep `.codex` useful but lean. This steward owns file-size hygiene, retention judgment, and cleanup planning for Codex-generated project artifacts.

## When To Use

- `.codex` has become too large for the OneDrive share.
- The user asks to trim, clean, slim, prune, reduce, archive, or audit project size.
- Browser automation, screenshot reviews, generated assets, exports, or tmp folders have accumulated.
- Before or after a broad visual/demo QA pass that may create reports or browser profiles.
- When deciding whether a file belongs in durable project memory or disposable scratch space.

## Context To Load

- `AGENTS.md`
- `.codex/agents/project_filesize_steward.md`
- This `SKILL.md`
- Script help/source only when needed:
  - `scripts/audit-codex-filesize.ps1`

Do not read large report folders, browser profiles, screenshots, exports, backups, or generated images manually unless the audit points to a specific file that needs inspection.

## Procedure

1. Audit first:

   ```powershell
   .\.codex\skills\project-filesize-steward\scripts\audit-codex-filesize.ps1
   ```

2. Classify findings:
   - `keep`: skills, agents, scripts, active checklists, goals, source-of-truth notes, current reference docs, credentials, manifests.
   - `safe-to-remove-after-review`: stale tmp folders, tmp screenshots, browser caches/profiles, failed automation scratch, duplicate screenshot reports.
   - `archive-first`: large reports, old exports, older visual QA evidence, older website backups if the user wants a retention policy.
   - `needs-user-decision`: generated assets, client source material, current work reports, anything modified today, anything tied to an active checklist.
3. If cleanup is requested, produce a dry-run list with absolute paths, sizes, reason, and risk.
4. Require explicit user approval before deletion, movement, compression, or backup pruning.
5. After approved cleanup, re-run the audit and report before/after size.

## Checks

- Did the audit identify top-level `.codex` size and largest folders?
- Are durable instructions and active project memory excluded from cleanup?
- Are browser profiles/cache folders separated from actual project reports?
- Are backups treated under a retention rule instead of casually deleted?
- Did every proposed destructive action name exact resolved paths?
- Did approved cleanup avoid `Website` and `bof-web-Original`?

## Output Format

```markdown
## Project Filesize Check

Audit:
Top bloat sources:
Keep:
Cleanup candidates:
Archive candidates:
Needs decision:
Recommended next action:
```

For approved cleanup:

```markdown
## Project Filesize Cleanup

Approved scope:
Removed or archived:
Before:
After:
Still large:
Notes:
```

## Failure Modes

- Audit cannot access locked browser-profile files.
- OneDrive placeholder files report misleading sizes.
- Cleanup candidates include files modified by another active thread.
- A large generated asset is referenced by `Website`.
- A report folder contains the only evidence for an unresolved checklist item.

## Safety Boundaries

- Never delete anything without explicit approval.
- Never delete by process name, broad wildcard, or unreviewed recursive path.
- Never touch `Website` or `bof-web-Original` as part of `.codex` cleanup.
- Never delete active checklists, goals, skills, agents, scripts, client notes, reference docs, credential files, backup manifests, or current source-of-truth ledgers.
- Use `runtime-resource-steward` for running process cleanup before deleting folders that may still be open.
- Use `website-backup-steward` for website backup retention decisions.
