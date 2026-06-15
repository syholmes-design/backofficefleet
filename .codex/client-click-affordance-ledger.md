# BOF Client Click-Affordance Ledger

Created: 2026-06-11

Purpose: track the client's complaint that some BOF website/demo elements look like they should be clickable but are not.

## Client Acceptance Rule

If an element looks clickable to a fleet owner or client reviewer, it must do one of these:

- navigate to a real route;
- open an in-view record, panel, document, drawer, modal, or detail surface;
- filter, select, update state, or show a visible response;
- show an intentional disabled state/reason;
- be restyled so it reads as decorative/non-interactive.

This applies to:

- buttons and links;
- chips, badges, pills, and labels;
- table rows and row actions;
- cards and proof tiles;
- icons and toolbar controls;
- images with overlays;
- alerts and notifications;
- document names, driver names, load IDs, carrier IDs, and status labels;
- public-site CTAs and demo shell controls.

## Tracking Protocol

For any broad public-site or demo QA pass, the client advocate should add a click-affordance row to the active checklist or create a small follow-up checklist if none exists.

Suggested checklist evidence:

- route/page checked;
- clickable-looking element inventory method;
- number of weak/dead affordances found;
- fix applied or reason deferred;
- screenshot or command/click evidence;
- remaining risk.

## Specialist Routing

- Public website: `detail-consistency-auditor`, `accessibility-clarity-reviewer`, `website-visual-snapshot-reviewer`.
- `/interactive-demo/`: `interactive-demo-wiring-director`, `demo-ux-usability-director`, `client-demo-proof-advocate`.
- Dense tables or layout issues discovered during click QA: `layout-formatting-auditor`.

## Current Status

A first static full-site click-affordance audit was run on 2026-06-11.

Audit artifacts:

- Checklist: `.codex/checklists/active/20260611-180408-click-affordance-audit.md`
- Static inventory: `.codex/reports/click-affordance-static-inventory-20260611.json`
- Audit report: `.codex/reports/click-affordance-audit-20260611.md`

Audit result:

- 53 HTML files scanned.
- 0 broken local hrefs found.
- 238 weak card-like surfaces identified for future clickable-or-restyle decisions.
- 5 route-style chips identified as non-anchor spans.
- 153 status chips identified for a global label-versus-link rule.
- 14 hero/image overlay surfaces identified for clickable-or-decorative decisions.

Implementation status:

- 21 / 21 checklist items closed.
- Shared public card behavior now makes linked cards clickable as whole-card surfaces and restyles unlinked cards as passive.
- Route chips and status labels now have a clearer clickable-versus-passive rule.
- `/interactive-demo/` static wiring audit found no obvious dead-control gap in the main app shell or generated route pages.
- Rendered screenshots, route checks, syntax/data checks, stale-copy scan, and runtime cleanup audit are recorded in the checklist evidence.
