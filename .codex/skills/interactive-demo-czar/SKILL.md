---
name: interactive-demo-czar
description: "Use for BOF hands-on interactive demo work: /interactive-demo/, authenticated-app-style control panel simulations, logged-in SaaS UI demos, command-center shells, sidebars/topbars, load tables, record drawers, document panes, controlled release-decision flows, approve/reject/hold interactions, clickable proof completeness, and keeping the interactive demo robust, dense, static, fast, and shared-hosting friendly."
---

# Interactive Demo Czar

Use this project-local skill when work involves BOF's hands-on interactive demo layer, especially `/interactive-demo/` or any controlled click-through scenario.

## Purpose

Make the BOF interactive demo best-in-class for a serious B2B SaaS buyer while preserving the project's slim static website direction.

The interactive demo should look like an actual BOF control panel after login, not another public walkthrough page. It should let buyers experience one operating decision through app-like UI: command center, selected load, record drawer, document pane, release controls, and visible state changes.

## When To Use

- `/interactive-demo/` planning, implementation, or review
- Logged-in control panel simulation
- App-like SaaS UI demos
- Command-center shells, sidebars, topbars, load tables, record drawers, document panes, release-control panels
- Clickable mini-demo flows
- SaaS interactive demo quality standards
- Controlled release-decision scenarios
- Approve, reject, release, hold, retry, or clear interactions
- Scenario state changes, selected rows, side panels, record drawers, tabs, document panes, and outcome panels
- Ensuring every important interactive click opens complete records, documents, packets, or proof sections
- Keeping interactive demo work static and shared-hosting friendly

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `Website/interactive-demo/index.html`
- `Website/assets/js/site.js`
- `Website/assets/css/styles.css`
- `Website/operations-record/index.html`
- Relevant walkthrough pages such as `Website/demo/index.html` and `Website/walkthrough/index.html`
- `bof-web-Original` only as reference context when comparing expected demo seriousness

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Identify the scenario's buyer job: what operating decision the visitor should complete.
3. Require an authenticated-app-style first viewport: product shell, app nav, account/role context, command center content, selected record, and action controls.
4. Define the narrow scenario spine: load, driver, carrier, controlling document, decision owner, status, consequence, and next action.
5. Map every clickable item and classify it as complete, incomplete, decorative, or should-not-be-clickable.
6. Require visible state feedback for every major choice: selected row, status, record note, consequence, owner, and next action.
7. Require complete static destinations for named loads, drivers, carriers, packets, documents, and release decisions.
8. Keep the implementation static: HTML, CSS, vanilla JS, optional small JSON, no backend state, no dependencies, no package files.
9. Coordinate with `client-demo-proof-advocate` for click completeness and `demo-document-reality-director` for document realism.
10. Coordinate with `real-product-ui-simulation-director` when the app shell should intentionally look like the real BOF program rather than the public website.
11. Coordinate with `shared-hosting-performance-guardian` before adding JS, images, or interaction complexity.
12. Use `website-visual-snapshot-reviewer` after interaction or layout changes.

## Checks

- Does the interactive demo have one clear operating question?
- Does the first viewport feel like a logged-in BOF control panel rather than a marketing/walkthrough page?
- Does the simulated app have a distinct product UI dialect instead of matching the public website's marketing design?
- Does it include app-native structure such as sidebar/topbar, command center, table/list, selected record drawer, document pane, and action controls?
- Can a buyer complete the scenario without a presenter?
- Does every major click change something visible or open a complete record?
- Do statuses explain what is cleared, blocked, under review, and what happens next?
- Do records stay consistent with the rest of the Website?
- Are important documents selectable, believable, and inspectable?
- Does the demo feel like a real product UI rather than a slideshow, landing page, or guided article?
- Does mobile remain readable and usable?
- Does the implementation avoid framework/runtime/dependency bloat?
- Is all visible copy buyer-facing and free of internal build language?

## Output Format

```markdown
## Interactive Demo Review

Scenario:
Buyer decision:
Control panel layout:
Step flow:
State changes:
Clickable proof paths:
Missing or weak clicks:
Document/record requirements:
Static implementation notes:
Validation:
Priority fixes:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not reintroduce Next.js, React, TypeScript, npm, `node_modules`, `.next`, package files, or server runtime assumptions.
- Do not build a true sandbox with uploads, accounts, saved state, database writes, authentication, or production workflow logic.
- Do not let `/interactive-demo/` become another walkthrough page, landing page, hero section, or page-scroll story.
- Do not accept a design where the primary interaction is merely scrolling through explanation cards.
- Do not invent real customer, driver, carrier, DOT, insurance, legal, compliance, or financial data.
- Do not expose internal terms such as `static demo`, `click map`, `proof file`, `mockup`, `client-safe`, or implementation notes in visible website copy.
- Do not let interaction hide weak proof; every important choice needs a complete document, record, consequence, owner, and next action.
