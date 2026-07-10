# Plan Checklist: Hero Art Animation Redo

Created: 2026-06-10
Source:

- User correction: "The hero images art need be redone with animation instead of layering animation on top of them."

Owner persona: `checklist-execution-steward`
Status: active

## Requirements

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| HA-001 | User correction | Stop using separate HTML/CSS hero overlay animation on top of static hero art. | complete | Removed `heroMotionScenes`, `initHeroMotionArt`, and `.hero-motion-*` CSS/keyframes; `rg` scan found no remaining overlay references in `Website`. | Public hero motion is no longer injected as a separate overlay layer. |
| HA-002 | User correction | Redo hero image art as animated media where the artwork itself carries the motion. | complete | Added 11 animated WebP hero assets under `Website/assets/images/animations/heroes/`; 11 `scene-illustration` hero images now reference those assets. | Animation is baked into the hero images, with route/document/command motion integrated into the art. |
| HA-003 | Project rules | Keep animation static/shared-hosting safe. | complete | Hero animation set is 11 files / 1,913,600 bytes total; `Test-Path` confirms no `Website/package.json`, `Website/node_modules`, `Website/.next`, or `Website/.env`. | No packages, framework, runtime, backend, or server assumptions added. |
| HA-004 | Project rules | Preserve reduced-motion accessibility and responsive layout. | complete | Added `data-static-src` still-image fallbacks for all 11 animated hero images; `site.js` swaps them in for `prefers-reduced-motion`; mobile screenshot fixed clipped visual proof strip. | Other site motion remains governed by existing reduced-motion CSS. |
| HA-005 | Project rules | Bump cache versions after CSS/JS/HTML changes. | complete | Ran `.codex/scripts/bump-website-cache-version.ps1 -Version 1.36 -IncludeScripts`; 50 HTML files updated and scan found no `v=1.33`, `v=1.34`, or `v=1.35` shared asset references. | Final cache key is `1.36`. |
| HA-006 | Validation | Validate syntax, asset references, and rendered desktop/mobile hero pages. | complete | `node --check Website/assets/js/site.js`; preview `http://127.0.0.1:3000/` returned 200; screenshots saved in `.codex/snapshots/hero-art-redo/` for home, documents, demo, and Founding Fleet mobile. | No image-generation process left running; existing preview server remains on port 3000. |

## Progress

| Metric | Count |
|---|---:|
| Closed items | 6 |
| Total items | 6 |
| Remaining items | 0 |
