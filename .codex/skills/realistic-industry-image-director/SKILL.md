---
name: realistic-industry-image-director
description: "Use for BOF realistic generated imagery and photography direction: documentary-style transportation images, non-stock real-looking people, professional hero/section images, realistic cutout people/trucks, image prompts, asset credibility review, and coordinating generation with cutout/compression."
---

# Realistic Industry Image Director

Use this project-local skill when BOF needs realistic generated images that look like professional documentary-style transportation photography, including both full scene images and transparent cutout assets.

## Purpose

Own realistic image direction for the BOF website/demo. This skill makes sure photography-style assets feel credible, industry-specific, professionally composed, and suitable for a transportation SaaS presentation without making people look like stock-photo models.

## When To Use

- Realistic generated photography prompts
- Full hero or section images
- Realistic cutout people, fleet owners, dispatchers, drivers, and operations staff
- Realistic cutout trucks, trailers, terminals, offices, document stacks, and industry props
- Replacing generic stock-like or model-like images
- Judging whether an image is credible enough for a trucking company buyer
- Deciding whether an asset should be full-scene photography or a transparent cutout

Use `brand-cartoon-illustration-director` for stylized cartoon images. Use `visual-taste-curator` for final rendered taste review. Use `shared-hosting-performance-guardian` for heavy image sets or public asset weight concerns.

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant `Website` pages/components where the image will appear
- Existing image/cutout assets when matching, replacing, or comparing visuals
- Website screenshots from `website-visual-snapshot-reviewer` when judging page fit

## Signature Style

Use the BOF Documentary Fleet Photography Style:

- Realistic documentary-style professional photography, not stock-photo cliche.
- Natural light or soft controlled office/yard lighting.
- Authentic transportation details: sleeper cabs, trailers, loading areas, dispatch monitors, clipboards, tablets, safety vests, realistic workwear, document folders, and fleet-office environments.
- Calm, confident people who look like ordinary working transportation professionals, not models.
- Faces should have natural variation: age lines, tired eyes, practical hair, imperfect skin texture, average builds, and relaxed expressions.
- Clothing should look worn-in and practical: jackets, polos, jeans, boots, safety vests, work shirts, headsets, and tablets that feel used rather than costume-perfect.
- Poses should feel candid or lightly directed: standing at a dispatch desk, reviewing a tablet, talking near a truck, checking paperwork, or pausing mid-shift.
- Modern SaaS credibility: clean framing, subtle contrast, restrained color grading, and uncluttered compositions without glossy lifestyle-ad polish.
- BOF palette compatibility: navy, white, steel gray, route teal, safety amber, and restrained red accents.
- Full images should have text-safe negative space when used behind or beside copy.
- Cutouts should be photographed against a plain light background with full body/object visible and clean edge separation.

Avoid glossy AI perfection, fake smiles, plastic skin, fashion-model faces, overly symmetrical features, perfect catalog poses, brand-new costume-like workwear, over-smoothed skin, impossible truck geometry, fake logos, unreadable license/DOT details, cluttered yards, and images that look like generic logistics stock photography.

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Identify the image's job: buyer trust, industry credibility, human presence, operational context, demo realism, or visual relief.
3. Choose the asset type: full photographic scene, realistic cutout person, realistic cutout vehicle/object, or background texture/context image.
4. Write a prompt using the BOF Documentary Fleet Photography Style.
5. For complex people/trucks/vehicles/objects, generate bitmap artwork instead of drawing SVG/CSS.
6. For cutouts, prompt for a plain light background, full silhouette, clean edge separation, no cropped limbs, and minimal shadows.
7. For full images, prompt for natural professional lighting, text-safe negative space, realistic transportation details, ordinary working people, and low clutter.
8. Run the global `image-cutout` skill when a transparent PNG cutout is needed.
9. Run the global `image-compression` skill before using assets in the website.
10. Ask `visual-taste-curator` to judge prominent images, generated people, generated trucks, or final rendered page fit.
11. Ask `shared-hosting-performance-guardian` to review large images, repeated imagery, hero backgrounds, and animation-heavy image compositions.

## Prompt Pattern

```text
Create a realistic documentary-style professional photograph for Back Office Fleet, a transportation SaaS command-center website. Subject: [specific person/object/scene]. Setting: [fleet office / dispatch desk / truck yard / loading area / document review scene]. Style: authentic transportation industry photography, natural professional lighting, polished but believable, ordinary working transportation people rather than models, average builds, natural skin texture, relaxed expressions, practical worn-in workwear and equipment, modern SaaS credibility, navy / white / steel gray / route teal / safety amber color compatibility. Composition: [full scene with text-safe negative space OR cutout-ready subject on plain light gray background with full silhouette visible]. Avoid: stock-photo cliches, fashion-model faces, perfect catalog poses, fake smiles, fake logos, unreadable text, warped hands, impossible truck geometry, plastic skin, over-smoothed skin, clutter, overdramatic lighting, glossy AI look.
```

## Checks

- Does the image look like professional photography rather than generic stock?
- Do the people look like real working transportation professionals rather than models?
- Would a trucking company buyer believe the people, trucks, environment, and equipment?
- Are hands, eyes, faces, posture, skin texture, age/working-person variation, workwear, and safety gear credible?
- Are truck wheels, mirrors, doors, cab shape, trailer proportions, and perspective believable?
- Does the image support the page story rather than just filling space?
- Is there enough negative space for text or UI if needed?
- Is the asset easy to cut out if used as a layered object?
- Is the final asset lightweight after compression?

## Output Format

```markdown
## BOF Realistic Image Direction

Surface:
Image job:
Asset type:
Prompt:
Cutout/compression needs:
Credibility checks:
Placement notes:
Taste/performance review needed:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not hand-draw complex people, trucks, trailers, vehicles, or realistic objects with SVG/CSS/canvas.
- Do not accept fake-looking, stock-like, model-like, uncanny, over-polished, cluttered, or off-industry imagery.
- Do not mix realistic photography and cartoon illustration in the same composition unless the page design explicitly supports that contrast.
- Do not create large image assets without compression and shared-hosting awareness.
- Do not use fake readable brand logos, license plates, DOT numbers, or document text inside generated images.
