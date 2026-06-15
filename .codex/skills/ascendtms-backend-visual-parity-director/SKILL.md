---
name: ascendtms-backend-visual-parity-director
description: Use for BOF demo visual/workflow parity with AscendTMS backend screenshots: making the simulated source-system UI feel like AscendTMS load management, document management, accounting, shortcuts, status tabs, blue/grey rails, dense tables, and utilitarian backend screens while preserving the no-real-API static boundary.
---

# AscendTMS Backend Visual Parity Director

Use this project-local skill when BOF's `/interactive-demo/`, TMS source pane, release-review route, or source-system load board needs to visually and behaviorally emulate the AscendTMS backend reference screens.

This role is about reference fidelity for a static simulation. It does not build or imply a live AscendTMS integration.

## Purpose

Make BOF's simulated TMS/source-system surfaces feel grounded in the actual AscendTMS backend UI: practical trucking operations software with blue module rails, grey subnav, dense data grids, status-colored cells, tabbed load queues, document preview/edit panes, shortcut popovers, accounting handoff tables, and plain admin controls.

The goal is not to copy AscendTMS pixel-for-pixel. The goal is to ensure the client recognizes the operating feel: load board, documents, accounting, tracking/text/log actions, and source-system status sitting beside BOF readiness decisions.

## When To Use

- The user asks for the demo to look more like AscendTMS, AscendTMS backend, or the reference screenshots.
- `/interactive-demo/` source-system pane feels too much like BOF marketing, too polished, too futuristic, too beveled-only, or not enough like a TMS backend.
- TMS load board, source import, load queue, document management, accounting handoff, EDI/tender, tracking/text, or shortcut menu visuals are being added or changed.
- A demo pass needs to prove that BOF is working beside a real TMS-like source system.
- The client complains that the demo does not integrate AscendTMS enough visually.

## Context To Load

- `AGENTS.md`
- `.codex/ascendtms-demo-scope-note.md`
- `.codex/ascendtms-backend-ui-reference.md`
- `.codex/agents/ascendtms_backend_visual_parity_director.md`
- `Website/interactive-demo/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- `Website/assets/js/ascendtms.js`
- `Website/assets/data/ascendtms-mock-loads.json`
- Local screenshot folder when visual judgment is needed: `D:\Websites\Sylvester Sr\BOF\AscendTMS Backend Images`

Coordinate with:

- `ascendtms-integration-researcher` for current sourced facts.
- `client-scope-translator` for keeping API/sync/backend requests static.
- `real-product-ui-simulation-director` for general product-shell realism.
- `beveled-enterprise-app-ui-director` when the BOF app shell must keep the generated beveled reference.
- `interactive-demo-czar` and `client-demo-proof-advocate` for scenario completeness.

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Re-read `.codex/ascendtms-demo-scope-note.md` to preserve the no-live-integration boundary.
3. Re-read `.codex/ascendtms-backend-ui-reference.md` before making visual or workflow recommendations.
4. Inspect the relevant current demo surface and classify it:
   - BOF-owned readiness UI.
   - TMS/source-system UI.
   - Hybrid handoff UI.
5. For source-system UI, apply AscendTMS-like patterns:
   - blue vertical module rail or compact source module strip
   - grey selected/expanded subnav
   - white panels on pale grey workspace
   - dense tabbed load queue
   - compact icon/text toolbar
   - sortable table headers
   - full-cell status colors
   - load ID links
   - row actions or shortcut popover
   - document list plus large preview/edit pane
   - processed/unprocessed document states
   - accounting handoff / paid-status / paperwork OK consequence
6. Preserve the BOF relationship:
   - TMS shows load workflow/source status.
   - BOF decides readiness, exceptions, documents, audit trail, release decision, owner, and next action.
7. Avoid turning the whole BOF app shell into an AscendTMS clone. Use AscendTMS visual language mainly where the simulation is showing the source-system/backend layer.
8. Ensure every clickable-looking TMS control either changes visible state, opens a BOF/source record, opens a document/popup, or is disabled/restyled.
9. Keep visible copy buyer-safe. Avoid public-facing internal phrases like `mock`, `static`, `fake API`, `we simulated`, or implementation notes.
10. Validate desktop and mobile with screenshots when implementation changes the demo UI.

## Checks

- Does the source-system portion visually resemble the AscendTMS screenshots enough to be recognizable?
- Are the blue rail, grey nav, dense tables, status cells, tabs, toolbar, and shortcuts represented where appropriate?
- Does the load board show real TMS-style columns instead of generic cards?
- Do documents behave like document management: list, processed state, attachment, type chips, preview/edit pane?
- Does accounting/handoff show practical consequences without claiming live sync?
- Does BOF remain visually and conceptually responsible for readiness and release decisions?
- Are named AscendTMS references deliberate and not leaking into public pages by accident?
- Is the implementation still static HTML/CSS/vanilla JS/JSON with no backend/API/auth/credentials/packages?

## Output Format

```markdown
## AscendTMS Backend Visual Parity Review

Screen:
Reference evidence loaded:
Current mismatch:
AscendTMS-like patterns to add:
BOF-owned patterns to preserve:
Interaction requirements:
Copy/naming cautions:
Static boundary:
Priority fixes:
Validation:
```

## Failure Modes

- Treating AscendTMS visual parity as permission to build live API/sync behavior.
- Making the whole BOF demo look like AscendTMS instead of showing AscendTMS-like source context beside BOF readiness.
- Using polished marketing cards instead of backend tables, tabs, shortcuts, and documents.
- Making a pretty modern redesign that loses the recognizable old-school TMS/backend feel.
- Leaving shortcut/menu/action controls dead.
- Exposing implementation caveats in buyer-facing UI.

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add React, Next.js, TypeScript, npm, packages, `.next`, `node_modules`, backend routes, auth, credentials, `.env`, database, API calls, webhooks, EDI jobs, SFTP, or live sync.
- Do not log into AscendTMS or use private account data without explicit authorization.
- Do not claim private knowledge of the AscendTMS backend schema, API, auth, or database.
- Do not expose real private driver/customer/carrier data.
