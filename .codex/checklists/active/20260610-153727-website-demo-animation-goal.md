# Plan Checklist: Website And Demo Animation Goal

Created: 2026-06-10 15:37:27 -05:00
Source:

- Active goal: substantial public website and interactive demo animation.

Owner persona: `checklist-execution-steward`
Status: active

## Requirements

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| AN-001 | Goal | Add substantial public website animation. | complete | Added reveal staggering, route/page transitions, card/photo/status motion, animated readiness flow card, and route-specific hero motion in `Website/assets/css/styles.css` and `Website/assets/js/site.js`. Screenshots in `.codex/snapshots/animation-pass/hero-art-v127/` and `.codex/snapshots/animation-pass/hero-art-v128/`. | Public site now has visible motion beyond hover polish. |
| AN-002 | Goal | Add interactive-demo animation that clarifies state changes. | complete | Added `markDemoMotion()` in `Website/assets/js/site.js`; app workspace, document viewer, packet pane, toast, selected rows, records, and status targets animate on state changes. Screenshots: `.codex/snapshots/animation-pass/interactive-demo-desktop-v122.png` and `interactive-demo-mobile-v122.png`. | Deeper click-through/video QA remains under AN-010. |
| AN-003 | Goal | Include animated WebP where appropriate. | complete | Created and referenced `Website/assets/images/animations/bof-readiness-flow.webp` (109,888 bytes) from `Website/index.html`. | Static-site-safe animated WebP used for public proof section. |
| AN-004 | Goal | Add CSS/SVG transitions where appropriate. | complete | Added view/page transitions, card/photo transitions, route/status pulses, app pane transition classes, and SVG route-line animation in `Website/assets/css/styles.css`. | Uses transform/opacity/SVG stroke motion. |
| AN-005 | Goal | Preserve reduced-motion accessibility. | complete | `@media (prefers-reduced-motion: reduce)` disables animation/transition duration and hides nonessential orbit/scan effects; JS checks `reducedMotion` before page/demo transition behavior. | Reduced-motion users keep static content. |
| AN-006 | Goal | Preserve fast loading and shared-hosting safety. | complete | Verification: `Test-Path Website/package.json`, `Website/node_modules`, and `Website/.next` all returned `False`; only new media is a 109,888-byte WebP; no packages/framework/runtime added. | Maintains static HTML/CSS/vanilla JS. |
| AN-007 | Goal | Bump cache versions after CSS/JS changes. | complete | Ran `.codex/scripts/bump-website-cache-version.ps1 -Version 1.33 -IncludeScripts`; sampled pages reference `styles.css?v=1.33` and `site.js?v=1.33`. | Prevents stale CSS/JS cache after deploy. |
| AN-008 | Goal | Validate current state with syntax, source checks, and rendered checks. | complete | `node --check Website/assets/js/site.js` passed; no sampled public AscendTMS wording found; no `Website/package.json`, `Website/node_modules`, or `Website/.next`; screenshots captured for homepage, public hero pages, and interactive demo. Current evidence includes `.codex/snapshots/animation-pass/continue-v133/home-mobile.png`, `interactive-desktop.png`, and `interactive-mobile.png`. | Validation found and fixed homepage mobile overflow from the animation pass. |
| AN-009 | User 2026-06-10 | Hero images/art should be heavily animated and unique for each page. | complete | Added route-specific hero motion scenes for home, workflow, release review, Partner TMS, dashboard, dispatch, drivers, documents, fleet, solutions, Founding Fleet, booking, safety, carrier, operations record, and governance routes in `Website/assets/js/site.js`; added per-route `data-hero-motion` variants in `Website/assets/css/styles.css`. Rendered samples in `.codex/snapshots/animation-pass/hero-art-v127/`, mobile samples in `hero-art-v128/`, and homepage mobile fix in `continue-v133/home-mobile.png`. | Uses unique labels, nodes, chips, colors, timing, and animation behavior per route. |
| AN-010 | Validation follow-up | Perform deeper interactive motion QA across real clicks and tune any jarring or excessive animation. | complete | Temporary same-origin QA runner loaded `/interactive-demo/` in an iframe and performed real clicks for initial load, Ready to Release, Hold, Release With Condition, Reset, Driver File tab, Alerts view, Audit record open, and Partner TMS documents proof. Evidence screenshot: `.codex/snapshots/animation-pass/animation-click-qa-v133-pass.png` shows `QA_RESULT PASS`, `passed=9 failed=0`, `failedLabels=none`. The runner was removed from `Website` after validation. | Headless Edge reported reduced-motion mode, so state/click behavior was validated through real clicks while reduced-motion behavior was respected; normal-motion classes remain proven by source/CSS hooks. |

## Progress

| Metric | Count |
|---|---:|
| Closed items | 10 |
| Total items | 10 |
| Remaining items | 0 |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Public animation implemented | complete | `Website/assets/css/styles.css`, `Website/assets/js/site.js`, screenshots under `.codex/snapshots/animation-pass/hero-art-v127/`. |
| Demo animation implemented | complete | `markDemoMotion()` in `Website/assets/js/site.js`; screenshots under `.codex/snapshots/animation-pass/`. |
| Animated WebP exists and is referenced | complete | `Website/assets/images/animations/bof-readiness-flow.webp`; `Website/index.html`. |
| Reduced-motion behavior present | complete | `@media (prefers-reduced-motion: reduce)` and JS `reducedMotion` guard. |
| Cache version bumped | complete | HTML references updated to `v=1.33`. |
| Validation complete | complete | Syntax/source/render checks done; source-level demo click-path audit passed; real click-through QA passed under AN-010. |
