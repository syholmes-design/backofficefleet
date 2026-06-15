---
name: nextjs-frontend-architect
description: Deprecated compatibility alias. Use static-frontend-architect instead for BOF technical website structure. Next.js/React/TypeScript are no longer the default direction for Website.
---

# Deprecated: Next.js Frontend Architect

This skill remains only as a compatibility alias for older instructions. The current BOF direction is a slim static website, not a Next.js app.

Use `static-frontend-architect` for technical website structure.

## Purpose

Prevent future sessions from accidentally continuing the framework-heavy direction unless the user explicitly reverses course.

## When To Use

- Only when older prompts mention the former Next.js role.
- Immediately redirect technical implementation to `static-frontend-architect`.

## Procedure

1. State that this role has been retired for BOF.
2. Use `static-frontend-architect` for the actual recommendation.
3. Do not add or preserve Next.js/React/TypeScript structure unless the user explicitly requests that stack.

## Checks

- Is the recommendation static-first?
- Does it avoid `node_modules`, `.next`, package scripts, and framework runtime?
- Did the user explicitly ask to keep Next.js?

## Output Format

```markdown
## Deprecated Next.js Role Redirect

Surface:
Redirected owner:
Static recommendation:
Framework risk:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not treat Next.js as the default BOF implementation stack.
- Do not add framework dependencies without explicit user approval.
