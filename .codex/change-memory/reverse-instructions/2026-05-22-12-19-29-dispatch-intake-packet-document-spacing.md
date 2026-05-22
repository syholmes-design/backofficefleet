# Reverse Instructions

ID: 2026-05-22-dispatch-intake-packet-document-spacing
Date: 2026-05-22T12:19:29.958Z
Area changed: Dispatch intake packet document spacing
Reason for change: Adjusted the trip packet workspace so Packet documents does not enter the three-column shell too early, keeps the document card grid from splitting inside a narrow center column, and gives the top packet links stable widths.

## Files touched

- path: components/trip-packet/TripPacketWorkspace.tsx
  change type: M
  before summary: Fill in prior behavior if rollback is requested.
  after summary: Fill in current behavior after this change.
  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.

## Plain-English rollback explanation

If this change needs to be undone, restore the prior behavior by:

1. Review the patch at `.codex/change-memory/patches/2026-05-22-12-19-29-dispatch-intake-packet-document-spacing.patch`.
2. If the patch still applies cleanly, reverse it with `git apply -R .codex/change-memory/patches/2026-05-22-12-19-29-dispatch-intake-packet-document-spacing.patch` from the project root.
3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.

## Validation after reconstruction

- Page to check: Not specified.
- Command to run: `npm run codex:registry-sync` if Codex operating files changed.
- Visual behavior expected: Not specified.
- Links or buttons to test: Not specified.
