# Reverse Instructions

ID: 2026-05-22-logo-transparency-and-dark-visual-correction
Date: 2026-05-22T11:49:13.513Z
Area changed: Logo transparency and dark visual correction
Reason for change: Restored the original BackOfficeFleet logo design, generated transparent logo assets, fixed public/product logo variants, and removed broad light-mode overrides that clashed with existing artwork.

## Files touched

- path: components/BofLogo.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/BofHeader.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/marketing/MarketingNavigation.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: app/globals.css
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: public/logo/boflogo-light-transparent.png
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: public/logo/boflogo-dark-transparent.png
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the patch at `.codex/change-memory/patches/2026-05-22-11-49-13-logo-transparency-and-dark-visual-correction.patch`.
2. If the patch still applies cleanly, reverse it with `git apply -R .codex/change-memory/patches/2026-05-22-11-49-13-logo-transparency-and-dark-visual-correction.patch` from the project root.
3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
