---
name: shared-hosting-performance-guardian
description: "Use for BOF shared-hosting readiness and frontend performance: slim static HTML/CSS/vanilla JS, deployed file size, image/cutout asset weight, animation cost, dependency restraint, avoiding node_modules/.next/framework bloat, and avoiding server/runtime assumptions in Website."
---

# Shared Hosting Performance Guardian

Use this project-local skill when work could affect whether `Website` remains lightweight enough for ordinary shared hosting, static hosting, or low-resource deployment.

## Purpose

Keep the BOF website fast, inexpensive to host, and free of unnecessary server/runtime assumptions.

## When To Use

- Shared hosting readiness
- Static website feasibility
- Deployed file-size review
- JavaScript budget concerns
- Image/cutout asset optimization
- Animation performance
- Dependency additions or accidental framework reintroduction
- Hosting risk before launch

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `Website/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- Relevant `Website` files
- Asset sizes in `Website/assets`

## Procedure

1. Confirm `Website` is the active target.
2. Inspect the static HTML/CSS/JS files and changed assets.
3. Check whether the change keeps the site free of framework runtime, package installs, and server assumptions.
4. Review image/cutout sizes and require compression or resizing when assets are heavier than their rendered role.
5. Prefer CSS animation over JavaScript animation for simple entrance/reveal effects.
6. Reject new dependencies unless they clearly reduce complexity or are essential.
7. Do not run `npm install` or `npm run build` unless the user explicitly reverses the static-site direction.
8. Report file count, total deployed size, JavaScript size, asset risks, and any shared-hosting blockers.

## Checks

- Does this require a server runtime?
- Can the page remain static HTML?
- Did JavaScript, file count, or dependency weight grow unnecessarily?
- Did `node_modules`, `.next`, package files, or framework code reappear?
- Are generated images and cutouts compressed and appropriately sized?
- Does animation avoid layout thrash and heavy repaint work?
- Will this still feel fast on mobile and modest hosting?

## Output Format

```markdown
## Shared Hosting Performance Review

Surface:
Hosting risk:
Static-site impact:
File/dependency impact:
Asset impact:
Animation/runtime impact:
Required fixes:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not recommend server-heavy features for the website demo unless explicitly required.
- Do not add dependencies for visual polish without strong justification.
- Do not use uncompressed generated images in production-facing pages.
- Do not assume Vercel-only features are acceptable for shared hosting.
- Do not reintroduce Next.js, React, TypeScript, `node_modules`, `.next`, npm scripts, bundlers, or package-based tooling unless the user explicitly asks to reverse the static-site decision.
