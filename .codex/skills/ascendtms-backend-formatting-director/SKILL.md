---
name: ascendtms-backend-formatting-director
description: Use for BOF demo formatting parity with AscendTMS backend pages: table density, column behavior, tabs, toolbars, side rails, grey panels, document panes, row heights, status-cell formatting, modal/popover sizing, and responsive adaptation that should mirror AscendTMS backend structure rather than generic BOF website formatting.
---

# AscendTMS Backend Formatting Director

Use this project-local skill when BOF demo pages need their formatting, spacing, table structure, and app-page layout to mirror the way AscendTMS formats its backend screens.

This role is narrower than visual parity. It does not only ask "does it look like AscendTMS?" It asks "is this laid out and formatted like AscendTMS backend work screens: rails, tabs, dense tables, action rows, document panes, modal sizing, and status columns?"

## Purpose

Keep BOF's simulated TMS/backend pages formatted like AscendTMS backend screens instead of drifting into BOF marketing pages, generic SaaS cards, oversized panels, sparse dashboards, or over-polished app layouts.

The client should feel that the source-system/demo layer follows the same practical screen grammar as AscendTMS:

- left module rail
- grey expanded subnav
- title and breadcrumb bands
- tabbed work panels
- compact action toolbar
- dense load/document/accounting tables
- colored status cells
- sortable column headers
- search and filter rows
- large document preview/edit split panes
- shortcut popovers
- modal overlays with compact tables
- bottom financial/preference/status strips

## When To Use

- The user says demo-page formatting should mirror AscendTMS backend.
- A page is being changed to show source-system load management, document management, accounting handoff, load posting, settings, EDI/tenders, tracking, or source-load queue behavior.
- `/interactive-demo/` route pages, source-system panes, or TMS workflow pages need rendered formatting QA against AscendTMS screenshots.
- A table looks readable but not AscendTMS-like enough.
- Cards, rounded marketing panels, hero-style spacing, or beveled-only BOF chrome are replacing backend table formatting.
- `layout-formatting-auditor` found physical layout issues inside an AscendTMS-like source-system surface.

## Context To Load

- `AGENTS.md`
- `.codex/ascendtms-demo-scope-note.md`
- `.codex/ascendtms-backend-ui-reference.md`
- `.codex/agents/ascendtms_backend_formatting_director.md`
- `Website/interactive-demo/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- `Website/assets/js/interactive-demo-routes.js`
- `Website/assets/js/ascendtms.js`
- Relevant route HTML under `Website/interactive-demo/` or `Website/integrations/`
- Local reference folder when rendered judgment matters: `D:\Websites\Sylvester Sr\BOF\AscendTMS Backend Images`

Coordinate with:

- `ascendtms-backend-visual-parity-director` for visual/workflow reference fidelity.
- `layout-formatting-auditor` for physical fit, clipping, overflow, and mobile readability.
- `real-product-ui-simulation-director` for product-shell separation from public website.
- `beveled-enterprise-app-ui-director` when BOF's outer app shell must stay beveled.
- `client-scope-translator` when formatting requests drift into real backend/API/sync.

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Read `.codex/ascendtms-demo-scope-note.md` to preserve the static simulation boundary.
3. Read `.codex/ascendtms-backend-ui-reference.md`, especially the visual system, load management, document management, shortcuts, and accounting sections.
4. Identify whether the surface is:
   - a source-system/TMS backend surface,
   - a BOF readiness surface,
   - a hybrid handoff surface,
   - or a public website page.
5. Only enforce AscendTMS backend formatting on source-system/TMS backend surfaces and deliberate hybrid views. Do not force AscendTMS formatting onto normal public pages.
6. Check formatting against the reference:
   - left rail or compact module strip present where appropriate
   - grey selected/expanded nav treatment
   - page title and breadcrumb band
   - tabs at the top of work panels
   - compact action toolbar under tabs
   - table headers small and sortable-looking
   - dense rows, not oversized card rows
   - status represented as full cells or strong table labels
   - search/filter row located above the table
   - horizontal table scroll used intentionally when many columns are needed
   - document preview/edit split pane uses real document-management proportions
   - popovers/modals feel like backend utilities, not marketing cards
   - bottom financial/summary/preference strips appear when accounting/load-board context needs them
7. For desktop, preserve the dense backend feel. For mobile, adapt without pretending AscendTMS desktop tables can simply shrink:
   - allow horizontal scroll containers for source tables
   - preserve column headers when possible
   - use compact stacked record rows only when mobile width makes tables unusable
   - never hide the BOF readiness decision behind source-system density
8. If implementation is requested, make scoped CSS/HTML/JS changes and recheck rendered desktop/mobile screenshots.
9. If CSS changes, ensure cache-busting query strings are updated.
10. If preview/browser automation is used, run runtime-resource cleanup/audit afterward.

## Checks

- Does the source-system surface format like a backend work screen, not a landing page?
- Are load/document/accounting tables dense enough and structured around columns?
- Do tabs, toolbars, filters, and shortcut/menu regions sit where AscendTMS users would expect them?
- Are status cells and row colors part of the table, not just decorative badges outside it?
- Are document pages formatted as preview/edit workspaces rather than generic BOF cards?
- Are modal/popover utilities compact, practical, and action-oriented?
- Does mobile avoid broken formatting while preserving the backend-table intent?
- Does BOF readiness remain clear beside the source-system formatting?
- Does the work remain static and dependency-free?

## Output Format

```markdown
## AscendTMS Backend Formatting Review

Surface:
Reference screens used:
Backend-formatting match:
Formatting mismatches:
Table/tab/toolbar requirements:
Document/accounting/source-system requirements:
Mobile adaptation:
BOF readiness preservation:
Fix now:
Defer:
Validation:
```

## Failure Modes

- Treating visual color resemblance as enough while the formatting still uses BOF cards.
- Making tables readable but too spacious, polished, or generic to feel like AscendTMS.
- Forcing AscendTMS formatting onto public website pages.
- Crushing desktop tables instead of using intended horizontal scroll.
- Hiding BOF's release decision under source-system formatting.
- Leaving CSS cache strings stale after formatting fixes.
- Treating screenshot reference as permission to add real backend/API behavior.

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add React, Next.js, TypeScript, npm, packages, `.next`, `node_modules`, backend routes, auth, credentials, `.env`, database, API calls, webhooks, EDI jobs, SFTP, or live sync.
- Do not log into AscendTMS or use private account data without explicit authorization.
- Do not expose internal notes such as `mock`, `static`, `fake API`, `prototype`, or `implementation` in buyer-facing UI.
- Do not use this role for document realism or driver record completeness except where formatting affects the AscendTMS-like document-management page.
