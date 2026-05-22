# Reverse Instructions

ID: 2026-05-22-website-and-demo-design-forward-pass
Date: 2026-05-22T09:15:03.279Z
Area changed: Website and demo design-forward pass
Reason for change: Polished Founding Fleet homepage, added guided owner demo ribbon, tightened priority route story copy, fixed mobile header/dashboard card responsiveness, and hardened Next cache cleanup for shared-folder builds

## Files touched

- path: components/marketing/MarketingHomeAccountable.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
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
- path: components/DemoWalkthroughRibbon.tsx
  change type: ??
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/dashboard/DashboardPageClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/command-center/CommandCenterPageClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/dispatch/DispatchBoardScreen.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/drivers-v4/DriversCommandCenterV4.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/documents/DocumentsPageClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/loads/LoadsPageClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: app/(bof)/maintenance/layout.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/safety-v4/SafetyDashboardV4.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/settlements-payroll/SettlementsDashboardScreen.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/trip-release/DriverTripReleaseClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: components/shipper/ShipperLoadPortalClient.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: scripts/clear-next-cache.mjs
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.
- path: .codex/reports/shared-handoff-log.md
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the patch at `.codex/change-memory/patches/2026-05-22-09-15-03-website-and-demo-design-forward-pass.patch`.
2. If the patch still applies cleanly, reverse it with `git apply -R .codex/change-memory/patches/2026-05-22-09-15-03-website-and-demo-design-forward-pass.patch` from the project root.
3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
