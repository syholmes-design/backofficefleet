# Reverse Instructions

ID: 2026-05-22-forward-lock-readiness-hardening
Date: 2026-05-22T08:34:44.007Z
Area changed: Forward lock readiness hardening
Reason for change: Harden before-demo/visual smoke, align load-evidence validation with canonical L009 story, and clear the drivers mobile overflow found during rehearsal

## Files touched

- path: scripts/audit-visual-smoke.mjs
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/codex-before-demo.mjs
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/validate-load-evidence.mjs
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/compliance-v4/ComplianceDashboardV4.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/before-demo-readiness.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/visual-polish-report.md
  change type: modified
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/broken-link-report.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/demo-completion-report.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the patch at `.codex/change-memory/patches/2026-05-22-08-34-44-forward-lock-readiness-hardening.patch`.
2. If the patch still applies cleanly, reverse it with `git apply -R .codex/change-memory/patches/2026-05-22-08-34-44-forward-lock-readiness-hardening.patch` from the project root.
3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
