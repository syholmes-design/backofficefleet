---
name: product-shell-simulation-architect
description: "Use for BOF /interactive-demo product-shell architecture: simulated login/access screens, 5-8 second session loaders, app-shell DOM/state structure, shell frame, sidebar rail, topbar, command workspace, data grid, record inspector, document viewer, action rail, audit/status feedback, and making static HTML/CSS/vanilla JS feel like a real software program rather than a website page."
---

# Product Shell Simulation Architect

Use this project-local skill when `/interactive-demo/` or another BOF app-like screen needs to be architected as a real product shell, not a styled webpage.

## Purpose

Create a believable static BOF software shell: access gate, session loader, app chrome, workspace, data grid, selected record inspector, document viewer, action rail, and visible state feedback.

## When To Use

- The user says the app should look like a real shell or program
- `/interactive-demo/` architecture, not just visual styling
- Removing public website chrome from the demo route
- Simulated login/access and loading flow
- App state model, shell regions, data attributes, and vanilla JS behavior
- Self-contained in-app records/documents instead of public website navigation
- Light-mode enterprise program shells rather than dark-mode product screens
- Product-shell vocabulary, CSS class naming, and DOM structure
- Separating BOF Walkthrough pages from the hands-on product simulation

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `.codex/agents/product_shell_simulation_architect.md`
- `.codex/product-shell-simulation-language.md`
- `Website/interactive-demo/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- `Website/operations-record/index.html`

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Classify the target as public website, BOF Walkthrough, or simulated product shell.
3. For product shell work, require three mutually exclusive states: `access-gate`, `session-loader`, and `app-shell`.
4. Remove public website chrome from the shell route: no site header, public nav, marketing footer, or CTA band.
5. Define shell regions using `.codex/product-shell-simulation-language.md`.
6. Define state and data attributes before styling: selected load, active document, decision state, app state, loading state.
7. Ensure each major region has a product job: queue, inspector, document viewer, action rail, audit/status feedback.
8. Keep the simulated program light-mode by default unless the user explicitly asks for dark mode.
9. Keep important program clicks self-contained: open in-app records, documents, packets, notes, and status details rather than public website routes.
10. Coordinate with `real-product-ui-simulation-director` for visual contrast and `interactive-demo-czar` for scenario quality.
11. Coordinate with `client-demo-proof-advocate` when shell clicks open records or documents.
12. Validate with JS syntax checks, link checks, browser interaction tests, and rendered screenshots.

## Checks

- Is the public website template absent from the shell route?
- Are access, loading, and app states mutually exclusive?
- Does the shell use app-native regions rather than page sections?
- Is the simulated program light-mode by default?
- Do important clicks stay inside the product shell?
- Does the DOM/state model feel reusable for a real program shell?
- Does every interactive element change state, switch view, open a complete record, or clearly disable?
- Are record IDs and anchors consistent with `/operations-record/`?
- Does the shell remain static, lightweight, and shared-hosting friendly?
- Is mobile usable as a compact product view?

## Output Format

```markdown
## Product Shell Architecture Review

Route:
Shell states:
Shell regions:
State model:
Navigation model:
Record/document model:
Action model:
Website chrome removed:
Proof destinations:
Mobile shell behavior:
Validation:
Priority fixes:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add frameworks, packages, `node_modules`, `.next`, or server runtime assumptions.
- Do not implement real authentication, credential entry, uploads, saved sessions, or databases.
- Do not expose visible buyer-facing language such as `mockup`, `static demo`, `implementation`, or `HTML page`.
- Do not accept dead app controls or decorative fake interactions.
