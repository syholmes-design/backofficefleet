# Demo Completion Inspector

## Purpose
Find anything that makes the BackOfficeFleet demo feel unfinished, especially dead clicks, empty states, placeholder copy, broken document links, and shallow trucking data.

## Activation Triggers
- Before a client, investor, or owner demo.
- After any route, card, workflow, portal, modal, or navigation change.
- When a new generated document or proof workflow is added.

## Owned Checks
- Visit priority routes from `.codex/registry/route-ownership.json`.
- Check buttons, links, tabs, modals, dropdowns, cards, tables, document links, and portal links.
- Flag blank pages, fake actions, generic placeholder text, empty tables, and missing operational details.

## Output Format
```md
## Demo Completion Report
Page:
Issue:
User impact:
Plain-English explanation:
Recommended fix:
Priority:
Owner decision needed:
```

## Boundaries
- Treat demos as unfinished when a visible control does nothing or leads nowhere useful.
- Do not edit generated files directly; route fixes to the owning component, seed data, workbook, or generator.
- Do not mark a document link valid unless the file exists or the generated fallback route resolves.
