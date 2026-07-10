---
name: interactive-demo-wiring-director
description: "Use for BOF interactive demo click wiring: making every button, tab, row, icon, status chip, avatar, document control, menu, filter, search field, and clickable-looking UI element in /interactive-demo/ do something visible inside the app shell, or be disabled/restyled so the demo has no dead controls."
---

# Interactive Demo Wiring Director

Use this project-local skill when BOF work involves click completeness, control wiring, or dead-button prevention, especially on `/interactive-demo/`.

## Purpose

Make the BOF interactive demo stand up to a client who clicks everything. The demo remains static and lightweight, but every interactive-looking control should have a visible in-app response or be made clearly non-interactive.

The skill's bias is to wire as many controls as possible. Buttons, rows, chips, icons, tabs, menus, avatars, filters, document controls, and status surfaces should go somewhere inside the simulated program or do something visible. Disable or restyle only when wiring would create a misleading or weak demo moment.

## When To Use

- The user says buttons should be clickable
- The user says the client will click everything
- `/interactive-demo/` controls, menus, rows, tabs, filters, search, avatars, status chips, document viewer controls, or action buttons are being added or reviewed
- A UI feels fake because controls do not respond
- A click audit or wiring pass is needed

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `.codex/agents/interactive_demo_wiring_director.md`
- `Website/interactive-demo/index.html`
- `Website/assets/js/site.js`
- `Website/assets/css/styles.css`
- Relevant reference context from `bof-web-Original` only when judging expected app depth

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Inventory all interactive-looking elements: buttons, anchors, tabs, rows, checkboxes, inputs, chips, badges, icons, avatars, toolbar controls, document controls, menus, and status elements.
3. Classify each item:
   - `wired`: visible effect exists.
   - `weak`: effect exists but feels too small, unclear, or incomplete.
   - `dead`: clickable-looking with no useful effect.
   - `decorative`: should not look clickable.
   - `disabled-needed`: should be visibly unavailable with a reason.
4. For each `dead` or `weak` item, define one in-app behavior: open record, switch panel, filter/search, update selected state, show menu, update status, update audit, update toast, or show disabled reason.
5. Implement with page-scoped vanilla JS and existing shell patterns.
6. For named loads, drivers, carriers, packets, documents, and decisions, ensure the in-app record includes owner, status, consequence, and next action.
7. If an item cannot be wired credibly, remove button styling or disable it.
8. Run a button/control inventory after edits and report the total count, recognized wiring patterns, and any remaining disabled or intentionally non-interactive items.
9. Validate with syntax checks, route checks, and a targeted click test where available.

## Checks

- Does every `<button>` have a visible response or disabled reason?
- Are as many buttons as possible wired to useful in-app behavior rather than hidden, decorative, or disabled?
- Do row clicks, checkboxes, filters, search, tabs, menus, and toolbar icons visibly change the UI?
- Do document viewer controls feel real enough for a demo?
- Do sidebar/topbar controls open in-app records or panels?
- Do status chips and named IDs open complete records?
- Are decorative elements built as decorative elements rather than fake buttons?
- Does every operational click stay inside the product shell?
- Does the JS remain static, small, and dependency-free?

## Output Format

```markdown
## Interactive Demo Wiring Review

Scope:
Clickable surfaces inventoried:
Already wired:
Weak or dead controls:
Wiring implemented:
Disabled/restyled controls:
Records requiring proof depth:
Validation:
Next wiring priorities:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add Next.js, React, TypeScript, npm, package files, `node_modules`, `.next`, backend, database, uploads, real auth, or persistence.
- Do not route operational clicks out to public website pages unless explicitly requested.
- Do not expose internal audit language in visible buyer-facing copy.
- Do not invent real private data, legal claims, DOT numbers, policy numbers, or production integrations.
