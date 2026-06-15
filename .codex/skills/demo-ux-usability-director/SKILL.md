---
name: demo-ux-usability-director
description: "Use for BOF /interactive-demo usability and buyer comprehension: making clicks produce visible in-view feedback, preventing important state changes from happening only below the fold, improving demo task flow, action clarity, focus/scroll behavior, sticky status feedback, and ensuring a buyer can understand what changed without a presenter."
---

# Demo UX Usability Director

Use this project-local skill when BOF's interactive demo looks good but may not be useful, understandable, or self-explanatory for a buyer clicking through it.

## Purpose

Make the hands-on demo usable as a product simulation, not just visually impressive. A buyer should always understand what they clicked, what changed, why it matters, and what to do next.

This persona is especially responsible for catching the failure mode where a button changes content below the fold or in a hidden region while the user receives little or no visible feedback in the current viewport.

## When To Use

- The user says the demo is pretty but not useful, confusing, hard to follow, or awkward to click through.
- A click changes content below the fold, off screen, behind a closed panel, or in a subtle area.
- Primary actions, record opens, alerts, tabs, table rows, or document controls need clearer feedback.
- `/interactive-demo/` needs a task-flow or usability review.
- A buyer should be able to complete the demo without a presenter explaining where to look.
- Visual polish conflicts with interaction clarity.

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `Website/interactive-demo/index.html`
- `Website/interactive-demo/start/index.html`
- `Website/assets/js/site.js`
- `Website/assets/css/styles.css`
- Relevant recent screenshots or browser checks when available

Coordinate with:

- `interactive-demo-wiring-director` for dead or weak controls.
- `interactive-demo-czar` for overall scenario quality.
- `product-shell-simulation-architect` for app-shell structure.
- `real-product-ui-simulation-director` or `beveled-enterprise-app-ui-director` for visual language.
- `client-demo-proof-advocate` when a click needs a complete proof record.

## Procedure

1. Identify the buyer task for the current screen: what decision or understanding the user is supposed to reach.
2. Inventory high-value clicks: primary actions, alerts, selected rows, status chips, document tabs, record links, filters, search, and toolbar controls.
3. For each click, answer:
   - What changed?
   - Where did it change?
   - Is the change visible without scrolling?
   - Does the user know what to do next?
4. Classify feedback:
   - `in-view`: visible in the current viewport near the click or in a persistent shell region.
   - `guided`: the UI scrolls, focuses, highlights, or opens the changed region intentionally.
   - `weak`: something changes, but the user may miss it.
   - `hidden`: the important change is below the fold, behind a closed panel, or too subtle.
5. Prefer fixes in this order:
   - Update the right inspector, sticky status bar, toast, or nearby panel.
   - Open a drawer/modal/record panel in view.
   - Move the action summary nearer to the action controls.
   - Add a short-lived highlight or selected state to the changed region.
   - Scroll/focus intentionally only when the destination is clearly the next step.
   - Remove or de-emphasize the click if it cannot produce useful feedback.
6. Keep the demo static and lightweight. Use existing HTML, CSS, and vanilla JS patterns.
7. Validate in desktop and mobile viewports. A usability fix that only works on desktop is incomplete.

## Checks

- Does every major click show the result above the fold or intentionally move attention?
- Are primary action outcomes visible near the action controls?
- Can the user answer "what happened?" immediately after clicking?
- Are record titles, status, owner, consequence, and next action visible when a record opens?
- Do toasts supplement feedback instead of being the only proof of change?
- Does the selected load/document/action state remain obvious?
- Does the demo avoid scroll scavenger hunts?
- Does mobile preserve the same interaction understanding?
- Did the change avoid adding new demo scope, fake features, real API behavior, or extra complexity?

## Output Format

```markdown
## Demo UX Usability Review

Buyer task:
High-value clicks checked:
In-view feedback:
Hidden or weak feedback:
Recommended fixes:
Implemented changes:
Desktop/mobile validation:
Deferred ideas:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add React, Next.js, TypeScript, packages, backend routes, auth, persistence, or real integrations.
- Do not solve usability problems by adding more records, more drivers, more pages, or broader demo scope unless the user explicitly asks.
- Do not make the product shell feel like a public landing page.
- Do not let visual taste override comprehension.
- Do not hide important feedback only in a toast.
- Do not rely on automatic scrolling if it disorients the user; prefer in-view feedback first.
