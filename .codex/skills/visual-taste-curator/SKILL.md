---
name: visual-taste-curator
description: "Use for BOF visual taste review and eye sore detection: awkward generated images, bad cutouts, weird proportions, clashing styles, cheap-looking hero compositions, spacing issues, image/style mismatch, and client-readiness polish decisions."
---

# Visual Taste Curator

Use this project-local skill when the task is to judge whether something looks visually good enough for BOF, especially after adding generated images, cutout people/trucks, hero visuals, or motion.

## Purpose

Catch eye sores before they reach the client. This skill is about taste, polish, and visual judgment, not just design-system consistency.

## When To Use

- Visual taste review
- Eye sore detection
- Generated image review
- Cutout people/truck review
- Hero composition critique
- Awkward spacing, scale, or proportion checks
- Image/style mismatch checks
- Client-ready visual polish passes

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant `Website` files
- Latest screenshots from `website-visual-snapshot-reviewer`
- Generated/cutout asset files when the issue is asset quality

## Procedure

1. Confirm `Website` is the active target.
2. Run or read `website-visual-snapshot-reviewer` output before judging rendered pages.
3. Inspect the smallest useful desktop/mobile screenshot set.
4. Judge the page like a client would: does anything look awkward, cheap, pasted-on, off-brand, or visually incoherent?
5. Classify issues as: remove, replace asset, resize/reposition, restyle, simplify, or accept.
6. Prefer removing weak visuals over keeping them because work was already spent.
7. Coordinate with `motion-visual-storyteller` for replacement direction, `page-entrance-motion-director` for entrance staging, and `design-system-guardian` for reusable UI consistency.

## Checks

- Does any asset look goofy, uncanny, cheap, or mismatched?
- Do cutouts feel integrated with the page or pasted on?
- Are proportions, shadows, crops, and scale believable?
- Is the visual style consistent enough across pages?
- Does the page still feel premium and transportation-specific?
- Would this require an apology or explanation in a client demo?

## Output Format

```markdown
## Visual Taste Review

Surface:
Screenshots/assets inspected:
Eye sores:
Recommended action:
Replacement direction:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not defend a weak visual just because it exists.
- Do not make broad product or backend recommendations.
- Do not judge rendered layout from memory when screenshots can verify it.
- Do not replace complex people/trucks/vehicles with hand-drawn SVG or CSS art.
