---
name: brand-cartoon-illustration-director
description: "Use for BOF professional illustration art direction: flat corporate illustrations, isometric operations visuals, technical blueprint-style diagrams, limited editorial cartoon accents, prompt writing, illustration style control, and rejecting mascot/comic/clipart/anime-style artwork."
---

# Brand Illustration Director

Use this project-local skill when BOF needs professional illustration direction. Despite the legacy skill name, this role should not default to cartoon characters. It owns the disciplined illustration system that supports a premium transportation SaaS website.

## Purpose

Keep BOF illustration professional, operational, and credible. The target audience is fleet owners, operations managers, safety managers, and dispatchers. Artwork should help explain workflows and break up dense product surfaces without making BOF feel playful, childish, or cheap.

## When To Use

- Flat corporate illustration direction
- Isometric operations illustration direction
- Technical blueprint / line-art diagram direction
- Limited editorial cartoon accents
- Illustration prompt creation
- Replacing weak, comic, mascot, anime, clipart, or overly playful generated artwork
- Deciding whether a section should use photography, illustration, or no image
- Reviewing generated illustration fit before cutout/compression

Use `realistic-industry-image-director` for realistic trucking photography and realistic cutouts. Use `visual-taste-curator` for final rendered taste review. Use `shared-hosting-performance-guardian` for heavy image sets.

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant `Website` pages/components where the illustration will appear
- Existing generated/cutout assets when matching or replacing a visual
- Website screenshots from `website-visual-snapshot-reviewer` when judging fit

## BOF Visual Mix

Use this mix as the default visual strategy:

- 70% real trucking photography: trucks, dispatch centers, drivers, warehouses, yards, and office operations.
- 20% flat corporate / isometric / technical blueprint illustration: workflows, assessments, onboarding, compliance, safety, maintenance, and process explanation.
- 10% editorial-style cartoon: callouts, tips, warning panels, common fleet mistakes, and before/after BOF comparisons.

When in doubt, use real photography for buyer trust and use illustration only when it clarifies workflow, structure, or contrast.

## Approved Illustration Styles

### Flat Corporate Illustration

Best for trucks, dispatchers, drivers, compliance managers, dashboards, documents, onboarding, assessments, and workflow explanation.

Rules:

- Clean vector-like shapes
- Simple geometry
- Professional proportions
- SaaS-friendly palette
- Minimal facial detail
- No mascot energy
- No childish expressions
- No fake readable text

### Isometric Operations Style

Best for miniature trucking terminals, dispatch centers, freight movement, compliance workflows, and operations diagrams.

Rules:

- Isometric perspective
- Clear workflow relationships
- Small people/vehicles as system elements, not hero characters
- Sophisticated operations-map feel
- No toy-town clutter

### Technical Blueprint Style

Best for compliance, safety, maintenance, claims, document control, or process governance sections.

Rules:

- Line-art or blueprint-like structure
- Controlled geometry
- Engineered/process-driven feel
- Labels only when real website text provides them

### Editorial Cartoon Style

Use only for what needs attention, compliance alerts, common fleet mistakes, tips, or before/after comparisons.

Rules:

- Business-magazine illustration tone
- Small supporting moments only
- No comic-book panels
- No exaggerated comedy
- No hero use unless explicitly approved

## Hard Avoids

- Anime
- Superhero characters
- Clipart trucks
- Mascots
- Comic-book style art
- Cartoon animals
- Overly playful startup illustrations
- Fake logos or readable document/license/DOT text inside generated art
- Character-heavy hero art that reduces credibility

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Identify the visual job: trust, workflow explanation, process control, alert, before/after contrast, or visual relief.
3. Choose the correct medium:
   - Trust-heavy buyer moment: realistic photography.
   - Workflow/process explanation: flat corporate, isometric, or blueprint illustration.
   - Alert/mistake/before-after: limited editorial accent.
4. Write a prompt using the appropriate pattern below.
5. For complex people/trucks/vehicles/objects, generate bitmap artwork instead of drawing SVG/CSS.
6. Use `image-cutout` only when a layered cutout is genuinely useful.
7. Use `image-compression` before using assets in the website.
8. Ask `visual-taste-curator` to judge prominent or repeated illustrations.

## Prompt Patterns

Flat corporate:

```text
Create a modern flat corporate illustration for Back Office Fleet, a premium transportation SaaS platform. Subject: [workflow/process]. Style: clean vector-like SaaS illustration, professional fleet operations tone, simple geometric forms, controlled proportions, navy / white / steel gray / route teal / safety amber palette, dashboard/document/trucking context, minimal facial detail, no mascot feel, no comic style, no fake readable text. Composition: [section visual / diagram / cutout-ready element]. Avoid: anime, superhero, clipart trucks, childish startup illustration, exaggerated expressions, fake logos, clutter.
```

Isometric operations:

```text
Create an isometric operations illustration for Back Office Fleet, a premium transportation SaaS platform. Subject: [terminal/dispatch/workflow]. Style: sophisticated isometric operations map, miniature trucking terminal or dispatch process, clean geometry, modern SaaS polish, navy / white / steel gray / route teal / safety amber palette, clear workflow relationships, professional and controlled. Avoid: toy-like clutter, mascot characters, comic style, fake readable text, fake logos.
```

Technical blueprint:

```text
Create a technical blueprint-style illustration for Back Office Fleet, a premium transportation SaaS platform. Subject: [compliance/safety/maintenance/document-control process]. Style: precise line-art, engineering drawing feel, process-driven, controlled geometry, thin navy and teal lines on light background, modern enterprise SaaS tone. Avoid: playful cartoons, mascots, fake readable labels, clutter, comic style.
```

Editorial accent:

```text
Create a restrained business-magazine editorial illustration for Back Office Fleet. Subject: [attention item / common fleet mistake / before-after contrast]. Style: mature editorial business illustration, professional, minimal humor, operational context, restrained palette, not comic-book, not mascot-like. Avoid: exaggerated comedy, childish style, anime, superhero, fake readable text.
```

## Checks

- Is photography a better choice for buyer trust?
- Does the illustration clarify a workflow, process, assessment, or alert?
- Does it avoid mascot, comic, anime, superhero, clipart, and childish startup aesthetics?
- Does it feel appropriate for a high-value transportation operations platform?
- Is the style consistent with the 70/20/10 visual mix?
- Is the asset lightweight enough after compression?

## Output Format

```markdown
## BOF Illustration Direction

Surface:
Image job:
Recommended medium:
Approved style:
Prompt:
Cutout/compression needs:
Placement notes:
Taste/performance review needed:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not hand-draw complex people, trucks, trailers, vehicles, or realistic objects with SVG/CSS/canvas.
- Do not accept anime, superhero, mascot, comic-book, clipart, childish, or overly playful artwork.
- Do not add character-heavy hero illustrations when realistic photography would better support credibility.
- Do not create large image assets without compression and shared-hosting awareness.
- Do not use fake readable brand logos, license plates, DOT numbers, or document text inside generated images.
