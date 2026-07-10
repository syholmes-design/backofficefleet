# Checklist: Click Affordance Audit And Fleshed-Out Destination Checklist

Created: 2026-06-11 18:04:08 -05:00
Source: User request 2026-06-11: audit all website things that look clickable and make checklist to make them clickable and go to a fully fleshed out page
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Audit all BOF website/demo elements that may look clickable but do not obviously navigate, open detail, update state, or show an intentional disabled/non-interactive treatment. Turn the findings into a one-item-at-a-time implementation checklist so future passes can make those elements clickable or restyle them.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CA-001 | User request / client advocate rule | Create a durable click-affordance checklist for the complaint that clickable-looking items should go somewhere useful. | complete | This checklist created at `.codex/checklists/active/20260611-180408-click-affordance-audit.md`. | Checklist governs future fixes. |
| CA-002 | Static audit 2026-06-11 | Inventory `Website` HTML routes for links, buttons, cards, chips, status badges, and image overlays. | complete | `.codex/reports/click-affordance-static-inventory-20260611.json`; 53 HTML files scanned. | Static inventory only; browser click QA remains pending. |
| CA-003 | Static audit 2026-06-11 | Confirm existing local hrefs are not obviously broken before looking at weak affordances. | complete | Inventory found 0 broken local hrefs. | The issue is weak/dead-looking affordances, not broken normal links. |
| CA-004 | Static audit 2026-06-11 | Write an audit report grouping clickable-looking risks by implementation category. | complete | `.codex/reports/click-affordance-audit-20260611.md`. | Report includes destination quality rule and route map. |
| CA-005 | Founding Fleet apply check | Verify the Founding Fleet application submit button is a real action, not a dead CTA. | complete | `Website/founding-fleet/apply/index.html` uses a `mailto:demo@backofficefleet.com` form and mailto CTA. | Do not treat this as dead unless user wants a different form pattern. |
| CA-006 | Public card behavior | Make high-value public proof/photo/metric cards clickable as whole-card links to fleshed-out pages, or restyle them as passive information cards. | complete | `Website/assets/js/site.js` adds `.is-clickable-card` whole-card behavior for cards with existing links and `.is-passive-card` for cards without links; `Website/assets/css/styles.css` limits card hover/lift to `.is-clickable-card`; implementation report `.codex/reports/click-affordance-implementation-pass-20260611.md`. | Broad shared fix covers public card classes from the audit. |
| CA-007 | Homepage | Fix homepage clickable-looking metrics, proof cards, photo cards, animated proof card, and hero/visual overlays. | complete | Shared public-card behavior applies to homepage card classes; passive homepage cards no longer receive generic hover/lift; hero visual-stage hover sheen now requires `.is-clickable-card`; asset refs bumped to `?v=1.38`. | Rendered QA remains in CA-019. |
| CA-008 | Solutions and sector pages | Fix card/photo/metric affordances on `/solutions/`, `/private-fleets/`, and `/government/`. | complete | Shared `.is-clickable-card` / `.is-passive-card` behavior applies to route cards and photo/proof cards on these pages; non-linked photo cards are passive. | Rendered QA remains in CA-019. |
| CA-009 | Operating proof pages | Fix weak cards/status affordances on `/dashboard/`, `/dispatch/`, `/fleet/`, and `/operations-record/`. | complete | Linked operating cards now have whole-card click behavior; passive status labels have default cursor and no standalone hover affordance; existing proof links/anchors remain intact. | Rendered QA remains in CA-019. |
| CA-010 | Driver/document proof pages | Fix weak cards/status affordances on `/drivers/`, `/documents/`, `/carrier-readiness/`, and `/safety-compliance/`. | complete | Shared card/link behavior applies; passive status and proof-strip labels are explicitly non-clickable; linked route chips remain clickable. | Rendered QA remains in CA-019. |
| CA-011 | Founding Fleet funnel | Fix weak cards/photo cards/visual overlays on `/founding-fleet/`, `/founding-fleet/trial/`, `/founding-fleet/pricing/`, `/founding-fleet/apply/`, and `/founding-fleets/`. | complete | Shared card/link behavior applies; Founding Fleet form submit was already verified; visual-stage hover sheen no longer implies click on decorative visuals. | Rendered QA remains in CA-019. |
| CA-012 | TMS workflow pages | Fix route chips, review cards, decision panels, and handoff panels on `/demo/tms-release-review/`, `/integrations/tms-workflow/`, `/integrations/tms-workflow/release-review/`, and compatibility routes. | complete | Shared card behavior applies to summary/review/decision/handoff panels when they contain links; non-anchor route chips now read as passive labels; no new public AscendTMS wording was added. | Interactive workflow button QA remains in CA-017/CA-019. |
| CA-013 | Route-chip cleanup | Convert route-like chips that are spans into anchors when they represent destinations, or restyle them as passive labels. | complete | CSS now limits route-chip hover/focus to `a.route-chip` and `button.route-chip`; `.route-chip:not(a):not(button)` is passive with default cursor. | Span route chips such as `Imported from TMS` now behave visually as labels. |
| CA-014 | Status-chip rule | Define and implement a global status-chip affordance rule: important operational statuses open related records/details; decorative labels do not look clickable. | complete | CSS sets `.status` and proof-strip labels to default cursor with no standalone hover treatment; statuses inside linked cards inherit the card-level destination, while standalone labels read as passive status. | Avoids treating 153 status labels as fake buttons. |
| CA-015 | Hero/visual-stage overlays | Decide which hero/visual-stage overlays should be clickable and which should be clearly decorative. | complete | CSS changed `.visual-stage:hover::after` to `.visual-stage.is-clickable-card:hover::after`; decorative hero/visual panels no longer show hover sheen by default. | Future deliberately linked visuals can opt into `.is-clickable-card`. |
| CA-016 | Fully fleshed destination gate | Before linking a card/chip to a page, confirm the destination has real operating detail, not a thin placeholder. | complete | Existing card-level behavior only uses already-present anchors; route checks for 14 key destinations returned 200 with BOF content; screenshots under `.codex/reports/visual-snapshots/click-affordance-20260611/` confirm key destinations are substantive first screens. | New generic links were not invented; the runtime behavior expands existing destinations. |
| CA-017 | Interactive demo wiring audit | Run a dedicated `/interactive-demo/` click audit for sidebar, menu, rows, notifications, chips, document controls, topbar icons, and action buttons. | complete | `.codex/reports/interactive-demo-wiring-audit-20260611.md`; static inventory flagged 0 controls lacking a link, submit/reset behavior, or recognized `data-*` wiring hook; JS hook presence verified. | Rendered app-shell screenshot saved as `interactive-demo-desktop.png`. |
| CA-018 | Interactive demo wiring fixes | Implement fixes for any weak/dead interactive-demo controls found in CA-017. | complete | CA-017 found no obvious static dead-control gap requiring new demo wiring; existing hooks cover the inventoried controls. | No code change needed beyond the shared public card/passive affordance fix. |
| CA-019 | Browser/rendered QA | Browser-check desktop and mobile after implementation for clickable affordance clarity, no dead controls, no accidental pointer styling, and no thin destinations. | complete | Headless Chrome screenshots saved under `.codex/reports/visual-snapshots/click-affordance-20260611/`: `home-desktop.png`, `solutions-desktop.png`, `documents-desktop.png`, `tms-review-desktop-delayed.png`, `demo-start-mobile.png`, `interactive-demo-desktop.png`; route checks saved in `route-checks.json`. | Delayed TMS screenshot/DOM confirmed JS-populated details after the first no-delay capture showed placeholders. |
| CA-020 | Final source checks | Run static checks after any implementation pass. | complete | `node --check Website/assets/js/site.js` passed; `node --check Website/assets/js/interactive-demo-routes.js` passed; JSON parse passed for 2 data files; no `Website/assets/js/ascendtms.js` file present; shared CSS/JS references verified at `?v=1.38`; stale-copy scan found no target phrases. | Runtime resource audit found 0 leftovers after screenshot work. |
| CA-021 | Update client ledger | Update `.codex/client-click-affordance-ledger.md` with audit completion, checklist path, and next implementation priority. | complete | `.codex/client-click-affordance-ledger.md` updated with audit artifacts and implementation status. | Keeps client advocate tracking the issue. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js` passed; `node --check Website/assets/js/interactive-demo-routes.js` passed; JSON parse passed for 2 files under `Website/assets/data`. |
| Route checks | complete | Static inventory found 0 broken local hrefs across 53 HTML files. |
| Browser/rendered check | complete | Headless Chrome screenshots and route checks saved under `.codex/reports/visual-snapshots/click-affordance-20260611/`. |
| Source/privacy/stale-copy scans | complete | Search found no `AscendTMS`, `static demo`, `mockup`, `fake API`, `reference demo`, `old demo`, or `route maze` phrases in scanned `Website` HTML/JS/CSS files. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` reported 0 candidate leftovers after preview/screenshot work. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CA-001 through CA-021.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: static inventory, implementation report, interactive-demo wiring audit, route checks, rendered screenshots, syntax/data checks, stale-copy scan, and runtime cleanup audit completed.

