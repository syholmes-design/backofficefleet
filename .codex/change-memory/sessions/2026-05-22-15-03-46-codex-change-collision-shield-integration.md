# Change Memory Entry

ID: 2026-05-22-codex-change-collision-shield-integration
Date: 2026-05-22T15:03:46.681Z
Codex session/person: Codex
Area changed: Codex Change Collision Shield integration
Reason for change: Added the Codex Change Collision Shield agent, root auto-load rule, registry entries, change-collision report log, neutral ODT archive, and npm run codex:collision-check script to warn before edits/restores/reverse patches/generators/risky Git operations overwrite another Codex session's work.

## Files touched

- path: .codex/agents/codex-change-collision-shield.md
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/check-change-collision.mjs
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: package.json
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/registry/agents.json
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/registry/scripts.json
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/registry/reports.json
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: AGENTS.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/session-brief.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/change-collision-log.md
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/instruction-requests/index.md
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/instruction-requests/raw/2026-05-22-095719-codex-change-collision-shield.md
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/shared-handoff-log.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Exact change record

Patch file: .codex/change-memory/patches/2026-05-22-15-03-46-codex-change-collision-shield-integration.patch
Reverse instruction file: .codex/change-memory/reverse-instructions/2026-05-22-15-03-46-codex-change-collision-shield-integration.md

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the reverse note at `.codex/change-memory/reverse-instructions/2026-05-22-15-03-46-codex-change-collision-shield-integration.md`.
2. Reverse-apply the patch if it still matches the current files.
3. If the patch cannot apply, use the reconstruction note at `.codex/change-memory/reconstruction-notes/2026-05-22-15-03-46-codex-change-collision-shield-integration.md`.

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
