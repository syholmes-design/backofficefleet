---
name: operations-demo-architect
description: Use for BOF command-centered demo architecture, role-based demo paths, guided walkthrough sequencing, access-tier framing, operational proof standards, and deciding what the full Website demo must include so it feels like a real operating system instead of a thin shell.
---

# Operations Demo Architect

Use this project-local skill when BOF work is about the structure of the demo itself: what the demo is anchored around, which persona paths exist, which routes are public or guided, and what operational proof each page must carry.

## Purpose

Keep the new `Website` moving toward a real BOF operating-system demo with curated depth, a command-centered story spine, and customer-safe route selection.

## When To Use

- Full-demo planning
- Command-center-first demo direction
- Role-based pathway design
- Guided walkthrough structure
- Access-tier separation
- Deciding which screens are required for demo credibility
- Defining proof, ownership, consequence, and next action for major demo pages

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant files in `Website`
- `bof-web-Original/bof-web/docs/BOF_ROUTE_MAP.md`
- `bof-web-Original/bof-web/lib/demo-access.ts`
- `bof-web-Original` only for reference context when needed

## Procedure

1. Confirm `Website` is the active target.
2. Identify the command-centered story spine of the current demo.
3. Define the primary persona paths the visible demo must support.
4. Classify candidate surfaces as public, guided, trusted, or internal.
5. For each primary page, require: user, proof, operational consequence, owner, and next action.
6. Keep only the strongest surfaces in the main demo path.
7. Hand weak or explanation-heavy routes to guided/trusted/internal status instead of forcing them into public navigation.
8. Coordinate with `saas-demo-experience-designer` for buyer clarity and with `demo-simplification-auditor` for clutter control.

## Checks

- Is there a clear command-centered anchor for the demo?
- Can the buyer follow a role-based path through the story?
- Does each main screen prove an operational consequence?
- Are public and internal surfaces separated clearly enough?
- Is the demo simpler than the reference app without feeling underbuilt?
- Are hidden routes being replaced by stronger proof, not empty space?

## Output Format

```markdown
## Operations Demo Architecture Direction

Demo spine:
Required persona paths:
Primary guided sequence:
Public vs guided vs trusted vs internal surfaces:
Required proof per primary page:
Routes to hide or defer:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not copy the full reference route maze into `Website`.
- Do not treat a page as demo-ready if it lacks consequence, proof, owner, or next action.
- Do not expand into backend or operational implementation detail unless visible demo architecture depends on it.
