---
name: website-visual-snapshot-reviewer
description: Use for BOF Website visual QA, screenshot snapshots, responsive review, before/after visual comparison, and making visual/layout/accessibility evaluations from local website screenshots while conserving model usage by running the bundled snapshot script first.
---

# Website Visual Snapshot Reviewer

Use this project-local skill when Codex needs to look at the BOF website, evaluate visuals, or make changes based on actual rendered pages.

## Purpose

Capture local website screenshots with a deterministic script before spending model attention on visual inspection. Use the smallest useful route and viewport set, then inspect only screenshots that can affect the current task.

## When To Use

- Visual QA after frontend changes
- "Look at the website" requests
- Layout, spacing, overlap, animation, logo, or mobile checks
- Before/after review of a page or component
- Demo polish and client-readiness evaluation

## Context To Load

- `AGENTS.md`
- Relevant `Website` files
- The latest snapshot manifest produced by `scripts/snapshot-website.mjs`
- Individual screenshots only when needed

## Procedure

1. Confirm `Website` is the active target.
2. Start or reuse the local static preview server.
3. Run the bundled script with only the needed routes.
4. Read the generated `manifest.json` and `REVIEW.md`.
5. Inspect the smallest useful screenshot set with `view_image`.
6. Make scoped changes in `Website` if the user asked for implementation.
7. Re-run the script for changed routes and compare screenshots.

## Script

Run from the project root:

```powershell
node .codex/skills/website-visual-snapshot-reviewer/scripts/snapshot-website.mjs --base-url http://localhost:3000 --routes /,/documents
```

Useful options:

```powershell
node .codex/skills/website-visual-snapshot-reviewer/scripts/snapshot-website.mjs --routes / --profiles desktop,mobile
node .codex/skills/website-visual-snapshot-reviewer/scripts/snapshot-website.mjs --routes /demo.html,/dashboard.html,/documents.html --out .codex/reports/visual-snapshots/latest
node .codex/skills/website-visual-snapshot-reviewer/scripts/snapshot-website.mjs --full-page
```

## Usage-Saving Rules

- Do not inspect every screenshot by default.
- Prefer one desktop and one mobile screenshot for the changed surface.
- Use the generated `review.html` contact sheet for broad human-style scanning.
- Use `view_image` only for screenshots that might drive a decision.
- Do not use image generation for QA.
- Do not run broad visual sweeps when one route answers the question.

## Checks

- Does the screenshot show the active `Website`, not `bof-web-Original`?
- Is the route styled, loaded, and not caught mid-animation?
- Are header, hero, CTA, cards, tables, and documents readable?
- Are mobile text, buttons, and navigation usable?
- Is there visible overlap, clipping, missing CSS, or broken imagery?

## Output Format

```markdown
## Visual Snapshot Review

Snapshot:
Routes checked:
Screenshots inspected:
Findings:
Changes made:
Verification:
Remaining risk:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not use broad screenshot sweeps unless the task requires them.
- Do not make visual changes from memory when a local screenshot can verify the issue.
- Do not treat generated screenshot folders as product assets.
