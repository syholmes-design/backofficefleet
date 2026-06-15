---
name: profile-image-generator
description: "Use for BOF profile/avatar image generation: creating one realistic trucking/back-office headshot at a time, role-based demo profile portraits, aspect-ratio-safe profile assets, optional cutouts with the global image-cutout script, and QA for believable non-stock people."
---

# Profile Image Generator

Use this project-local skill when BOF needs profile images or avatar assets for demo people, role cards, app UI rows, records, or buyer-facing personas.

## Purpose

Generate profile portraits as one-person images and turn them into usable individual assets. The required workflow for BOF driver/profile faces is: generate exactly one face per image, save it at the intended aspect ratio, run optional background cutout, visually inspect for distortion or mismatch, and save final project assets.

## When To Use

- The user asks for profile images, avatars, headshots, or people for demo profiles
- A driver, dispatcher, carrier operations, safety, or back-office persona needs a single profile image
- Transparent PNG profile cutouts are needed
- Profile images should look realistic, professional, industry-appropriate, and less like stock models
- BOF demo roles need visual identity: fleet owner, dispatcher, driver, safety manager, carrier operations, operations lead, document desk, or executive

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `.codex/agents/profile_image_generator.md`
- `Website/assets/images/` or the intended destination folder
- Global `imagegen` skill when generating raster images
- Global `image-cutout` skill when transparent cutouts are needed
- `realistic-industry-image-director` when realism or non-stock people quality is critical
- `visual-taste-curator` when reviewing final asset quality

## Procedure

1. Confirm the output purpose: app avatar, website role card, profile cutout, or realistic staff-style image.
2. Generate only one person per image. Do not create multi-person contact sheets for BOF driver/profile faces.
3. Prompt for a realistic, ordinary transportation/back-office professional with natural expression, simple clothing, clean background, consistent lighting, no text, no logos, no watermarks, and enough shoulder/headroom for cropping.
4. Generate the raster image with the `imagegen` skill.
5. Save the chosen single-person source image into the project or a temporary workspace folder.
6. If transparent profiles are needed, run the global `image-cutout` helper on that single source image.
7. Inspect the final image at its intended display size. Reject any face, shoulders, or head crop that looks stretched, squeezed, gender/name mismatched, reused, uncanny, or off-role.
8. Save final assets in a clear role-based folder, usually under `Website/assets/images/profiles/`.
9. Report saved paths, prompt used, aspect ratio, cutout preset if used, and any assets that need regeneration.

## Automation

The old contact-sheet splitting script remains available only for legacy cleanup of existing sheets. Do not use it for new BOF driver/profile generation unless the user explicitly reverses the one-face-at-a-time rule.

```powershell
python "$env:USERPROFILE\.codex\skills\image-cutout\scripts\cutout_images.py" `
  --input "Website\assets\images\profiles\drivers\driver-ref-013-source.png" `
  --output-dir "Website\assets\images\profiles\drivers\optimized" `
  --preset detail
```

For ordinary driver cards, a transparent cutout is optional. A clean rectangular headshot is acceptable when CSS uses `object-fit: cover` and the source image is not distorted.

## Checks

- Does each profile look like a believable transportation/back-office person?
- Does the source image contain exactly one face and one person?
- Does the saved asset preserve the person's aspect ratio without stretched, squeezed, or warped facial proportions?
- Are faces, eyes, shoulders, clothing, and skin texture natural?
- Are roles visually distinct without becoming costumes or caricatures?
- Are crops consistent in framing and padding, with enough headroom and shoulders for square app avatars?
- Do transparent cutouts have clean hair/shoulder edges?
- Are final filenames role-based and readable?
- Are project-bound assets saved inside the project, not only under `$CODEX_HOME`?
- Does the workflow avoid frameworks, package installs, and server dependencies?

## Output Format

```markdown
## Profile Image Asset Report

Purpose:
Prompt:
Source image:
Aspect ratio:
Cutout outputs:
Preset/settings:
Rejected or needs-regeneration:
Final asset paths:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not use SVG for realistic people, headshots, portraits, or bodies.
- Do not generate multi-person contact sheets for new BOF driver/profile images.
- Do not invent or imply real private identities, license data, DOT data, employee records, or customer records.
- Do not overwrite existing assets unless explicitly requested.
- Do not add Next.js, React, TypeScript, npm, package files, `node_modules`, `.next`, or server runtime assumptions.
- If the global image-cutout GPU/model validation fails, report it and keep cropped source images as fallbacks.
