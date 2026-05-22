# Reverse Instructions

ID: 2026-05-22-website-and-demo-design-sweep
Date: 2026-05-22T09:42:02.976Z
Area changed: Website and demo design sweep
Reason for change: Improve first-impression polish on homepage, dashboard, shared product header, and document proof shelf

## Files touched

- path: app/globals.css
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/BofHeader.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/dashboard/DashboardPageClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/documents/OperationsFileCabinetClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the patch at `.codex/change-memory/patches/2026-05-22-09-42-02-website-and-demo-design-sweep.patch`.
2. If the patch still applies cleanly, reverse it with `git apply -R .codex/change-memory/patches/2026-05-22-09-42-02-website-and-demo-design-sweep.patch` from the project root.
3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
