---
name: motion-visual-storyteller
description: Use for BOF Website animation, SVG visuals, generated image direction, hero imagery, motion systems, microinteractions, visual storytelling, and animated demo polish while preserving speed, accessibility, and professional transportation SaaS restraint.
---

# Motion Visual Storyteller

Use this project-local skill when the BOF website needs animation, SVG, generated images, or visual storytelling polish.

## Purpose

Make the new `Website` feel alive, impressive, and professionally produced without making it slower, noisier, or harder to understand.

## When To Use

- Page or section animation
- Hero visuals
- SVG illustrations, diagrams, or accents
- Generated bitmap image prompts and placement
- Microinteractions
- Demo transitions
- Visual storytelling moments
- Motion performance review

Use `page-entrance-motion-director` instead when the task is specifically first-impression page-load choreography or cutout people/truck arrivals into the page.

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant files in `Website`
- `bof-web-Original` only for reference context when needed

## Procedure

1. Confirm `Website` is the active target.
2. Identify what the visual or motion should help the user understand.
3. Choose the lightest suitable medium: CSS motion, SVG, generated bitmap image, or a small interactive visual.
4. Keep the visual specific to transportation SaaS, fleet operations, documents, dispatch, or demo progression.
5. Add accessibility and performance guardrails: reduced motion, alt text or labels, responsive sizing, and fast-loading assets.
6. Coordinate with `design-system-guardian` when visuals affect reusable component rules.
7. Coordinate with `senior-frontend-ux-architect` when motion changes page hierarchy or demo flow.
8. Hand off to `page-entrance-motion-director` when the work is specifically first-load entrance behavior.

## Complex Asset Rule

Do not draw complex people, trucks, trailers, vehicles, or realistic objects with SVG, CSS shapes, or ad hoc canvas code. Generate bitmap artwork first, then use the global `image-cutout` skill to remove the background and prepare the asset for compositing. Keep SVG for simple icons, diagrams, route lines, UI accents, charts, and abstract support visuals.

## Checks

- Does the animation explain hierarchy, progress, feedback, or flow?
- Is the motion restrained enough for a professional SaaS website?
- Does the SVG or image make the concept clearer than text alone?
- Is the visual relevant to BOF rather than generic SaaS decoration?
- Does it avoid slowing the page or overwhelming mobile users?
- Does it respect reduced-motion preferences?

## Output Format

```markdown
## Motion And Visual Direction

Surface:
Purpose:
Recommended medium:
Animation/SVG/image direction:
Performance and accessibility guardrails:
Specialist handoff, if any:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add heavy animation, large assets, decorative clutter, or generic stock-like imagery.
- Do not use motion that blocks reading, hides content, or makes the demo harder to follow.
- Do not hand-draw complex people/trucks/vehicles as SVG or CSS art; generate and cut them out.
- Do not expand into backend or operational internals unless visible demo storytelling depends on it.
