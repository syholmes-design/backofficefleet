---
name: static-frontend-architect
description: Use for BOF slim static website architecture: HTML5 pages, CSS3, tiny vanilla JavaScript, simple asset folders, no Next.js/React/TypeScript/node_modules, shared-hosting-friendly file structure, and migration away from framework-heavy website code.
---

# Static Frontend Architect

Use this project-local skill for technical frontend structure in the BOF `Website` build now that the target is a slim static website.

## Purpose

Keep BOF implemented as a lightweight static website/demo that can run on ordinary shared hosting with minimal files, minimal JavaScript, and no framework runtime.

## When To Use

- Static HTML/CSS/vanilla JS architecture
- Replacing Next.js, React, TypeScript, or package-based tooling
- Folder structure for `Website`
- Page/file naming
- Shared CSS and JS organization
- Demo data placement without a backend
- Keeping file count and deployed size small

## Target Stack

- HTML5
- CSS3
- Vanilla JavaScript only when interaction is needed
- SVG only for simple icons, diagrams, route lines, badges, and UI accents
- Generated/compressed bitmap images for people, trucks, documents, and complex visuals
- No Next.js
- No React
- No TypeScript by default
- No `node_modules`
- No `.next`
- No server runtime

## Recommended Folder Shape

```text
Website/
  index.html
  demo.html
  dashboard.html
  documents.html
  fleet.html
  book-demo.html
  assets/
    css/
      styles.css
    js/
      site.js
    images/
      logo/
      cutouts/
      documents/
```

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Prefer static pages over framework routes.
3. Keep shared CSS in one primary stylesheet unless splitting materially improves clarity.
4. Keep JavaScript in one small file and use it only for navigation toggles, lightweight reveals, tabs, or demo switching.
5. Hardcode small demo data in HTML first; use a tiny JS object only when repeated interactions require it.
6. Avoid build steps, dependency installs, package managers, bundlers, and framework-specific commands.
7. Coordinate with `shared-hosting-performance-guardian` before adding any dependency, large asset set, or non-static behavior.

## Checks

- Can the site be opened directly or served by a simple static server?
- Are there no required `node_modules`, `.next`, package scripts, or server runtime?
- Is the page count intentional and small?
- Is CSS shared instead of duplicated across pages?
- Is JavaScript small, plain, and optional for basic content access?
- Are generated images compressed and stored outside source-only folders when used by pages?

## Output Format

```markdown
## Static Frontend Architecture

Surface:
Recommended files:
CSS/JS organization:
Asset approach:
Dependency/build impact:
Migration notes:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not introduce Next.js, React, TypeScript, npm packages, bundlers, or server dependencies unless the user explicitly reverses the static-site direction.
- Do not add framework structure to solve a problem that static HTML/CSS/vanilla JS can handle.
- Do not hand-draw complex people, trucks, or vehicles with SVG/CSS.
