---
name: page-entrance-motion-director
description: Use for BOF page-load entrance animation, first-view hero choreography, cutout people/truck arrivals, layered foreground/background reveals, and "coming into the page" motion that should feel premium, fast, and transportation-specific.
---

# Page Entrance Motion Director

Use this project-local skill when BOF needs a strong first-impression animation as the user lands on a page, especially when cutout people, trucks, trailers, or other foreground assets should enter the composition.

## Purpose

Own what happens in the first second or two after a page appears so the website feels premium, intentional, and transportation-specific instead of static or generic.

## When To Use

- Hero entrance animation
- First-load page motion
- Landing-page arrival staging
- Cutout people or truck animation ideas
- Foreground asset layering over backgrounds or dashboards
- Intro motion that should feel more cinematic than normal SaaS
- Evaluating whether a page needs cutout asset motion to feel alive

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant files in `Website`
- `.codex/agents/motion_visual_storyteller.md` when broader motion ownership is involved
- Global `image-cutout` skill when cutout source assets need to be prepared
- `bof-web-Original` only for reference context when needed

## Procedure

1. Confirm `Website` is the active target.
2. Identify the page's first-view message and what the visitor should feel immediately.
3. Decide whether the entrance should be driven by a cutout truck, a cutout person, a layered scene, or a restrained content reveal.
4. Keep text readable on first paint. Motion should frame the content, not hide it.
5. Use cutout assets when they make the first impression feel more credible or more BOF-specific.
6. Keep the timing short, the motion clear, and the composition responsive.
7. Add reduced-motion handling and verify mobile layout does not break the staging.
8. Use `website-visual-snapshot-reviewer` when rendered-page inspection is needed after implementation.

## Cutout Asset Rule

Do not draw people, trucks, trailers, vehicles, or realistic foreground objects with SVG, CSS shapes, or ad hoc canvas code. Generate the cartoon/illustrated/realistic bitmap image first, then use the global `image-cutout` skill to remove the background and create the composited cutout. Use SVG only for simple route lines, UI diagrams, status accents, and abstract motion support.

## Checks

- Does the entrance improve the first impression in under two seconds?
- Do cutout people/trucks feel intentional rather than pasted on?
- Is the page still easy to read immediately?
- Does the animation avoid hero clutter, overlap, and jank on mobile?
- Is reduced motion respected?
- Does the effect feel like BOF instead of generic startup motion?

## Output Format

```markdown
## Entrance Motion Direction

Surface:
First-view goal:
Recommended entrance concept:
Cutout asset role:
Motion timing and staging:
Performance/accessibility guardrails:
Specialist handoff, if any:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not use long blocking intros, heavy parallax, or motion that delays reading.
- Do not add decorative cutouts with no storytelling job.
- Do not hand-draw complex people/trucks/vehicles as SVG or CSS art.
- Do not ignore reduced-motion preferences or mobile constraints.
- Do not expand into backend or operational internals unless visible page storytelling depends on them.
