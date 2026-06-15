---
name: real-product-ui-simulation-director
description: "Use for BOF simulated product UI realism: making /interactive-demo/ and app-like demo screens look like real logged-in operations software rather than matching the public website, including enterprise SaaS app chrome, dense tables, drawers, document panes, toolbars, stateful controls, and intentional contrast from marketing-page design."
---

# Real Product UI Simulation Director

Use this project-local skill when BOF needs simulated app screens to feel like the real software product, not the public website.

## Purpose

Make `/interactive-demo/` and any app-like demo surface feel like a buyer has entered BOF's control-panel environment. The visual language should be operational, compact, data-rich, and product-native, even if that creates a clear contrast with the website's marketing design.

## When To Use

- `/interactive-demo/` visual direction or review
- Simulated logged-in UI, control panel, command center, dashboard, or product shell work
- User asks for the UI to look like the real program/software, not the website
- A screen feels too much like a landing page, walkthrough, hero section, or marketing card layout
- Dense enterprise SaaS app patterns: sidebars, topbars, tables, drawers, tabs, document panes, filters, status chips, action panels, audit trails
- Intentional contrast between public website design and simulated product UI

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `.codex/agents/real_product_ui_simulation_director.md`
- `Website/interactive-demo/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- `Website/operations-record/index.html`
- `.codex/product-shell-simulation-language.md` when shell vocabulary or app regions are involved
- `bof-web-Original` only as reference when product UI seriousness or depth must be compared

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Identify whether the screen is public marketing, BOF Walkthrough, or simulated product UI.
3. For simulated product UI, reject website-like structure: hero-first sections, spacious marketing copy, decorative cards, CTA bands as primary UI, and large page-scroll storytelling.
4. Define the app UI dialect: sidebar/topbar, command bar, queue/table, selected row, record drawer, document pane, release controls, status feedback, owner, next action, and record links.
5. Keep BOF identity through logo, core color accents, terminology, and data, but allow the app shell to use a tighter, more utilitarian color/spacing/type system.
6. Make every major interactive control either change visible state or open a complete record.
7. Coordinate with `product-shell-simulation-architect` when the route needs stronger shell structure, states, or app-region language.
8. Coordinate with `interactive-demo-czar` for scenario logic and `client-demo-proof-advocate` for click completeness.
9. Coordinate with `shared-hosting-performance-guardian` before adding any heavy visual or script pattern.
10. Run visual snapshots after UI changes and review desktop/mobile output.

## Checks

- Does the first viewport feel like a real logged-in product screen?
- Is there a clear contrast from the public website?
- Are tables, drawers, document panes, status bars, tabs, and action controls used where real software would use them?
- Does the screen avoid marketing-page rhythm, large hero copy, and decorative card grids?
- Is the density professional and readable rather than cluttered?
- Are status, owner, next action, consequence, and record links visible?
- Does the implementation remain static and dependency-free?
- Does mobile preserve usability without pretending to be a full desktop app?

## Output Format

```markdown
## Product UI Simulation Review

Screen:
Intended product context:
Website-like elements to remove:
Required app-native patterns:
Visual contrast rules:
Interaction/state requirements:
Record/document completeness:
Mobile behavior:
Performance/static notes:
Priority fixes:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add Next.js, React, TypeScript, npm, `node_modules`, `.next`, package files, or server runtime assumptions.
- Do not implement real authentication, accounts, saved sessions, uploads, databases, or production workflow behavior.
- Do not expose visible buyer-facing language such as `mockup`, `static demo`, `implementation`, `prototype`, or `demo-builder`.
- Do not let product realism introduce unreadable density, inaccessible controls, or dead clicks.
