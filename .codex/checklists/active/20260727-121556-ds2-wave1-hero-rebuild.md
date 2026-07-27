# Checklist: DS2 Wave 1 Hero Composition Rebuild

Created: 2026-07-27 12:15:56 -04:00
Source: Attachment 20747b63 Wave 1 hero composition rebuild
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Convert the source into atomic checklist items and process them one at a time.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | Phase 1 | Verify branch, HEAD, git status, commits after expected HEAD, hero assets, logo asset, Freight Brace presence, baked-in text risk, and scratch folders. | complete | Branch `codex/design-system-2-wave-1`; starting HEAD `5604326dc650ed64635dde6af838344cf63e7b74`; git status reviewed; Freight Brace and logo assets verified. | No unexplained implementation changes found in this worktree. |
| CL-002 | Phase 2 | Create or select clean DS2 hero assets for Drivers, Dispatch, Safety, and Settlements; Safety/Settlements must not depend on baked-in legacy text. | complete | Added four 1920 x 1080 WebP hero assets under `Website/assets/images/design-system-2/wave-1/`. | Safety and Settlements assets are text-free; page copy remains HTML-rendered. |
| CL-003 | Phase 3 | Rebuild global header sizing and fit using approved DS2 logo. | complete | Updated `Website/assets/css/bof-design-system-2-components.css`; screenshots `header-1440.png`, `header-1366.png`, `header-mobile.png`. | Header collapses before nav crowding. |
| CL-004 | Phase 4 | Rebuild hero architecture for all four pages into cinematic image-led layouts with glass message panel, product-proof panel, and connected capability cards. | complete | Updated `/drivers/`, `/dispatch/`, `/safety/`, and `/settlements/` hero asset references and Wave 1 hero CSS. | Routes, messaging, Freight Brace sections, and below-hero content preserved. |
| CL-005 | Below-hero reconciliation | Improve page scale and hierarchy below the heroes without redesigning information architecture. | complete | Removed negative hero-to-section overlap and tightened mobile hero/card sizing. | Freight Brace, videos, and footer remain visible and intact. |
| CL-006 | Responsive/cache-free QA | Run cache-free rendered screenshots for required routes and viewports. | complete | Screenshot package: `docs/design-system-2/screenshots/wave-1-hero-composition-rebuild/`; manifest contains 31 non-empty PNG captures. | Mobile captures use explicit 390 px CSS viewport via Edge DevTools Protocol. |
| CL-007 | Validation | Run syntax, route, asset, image, operations, logo, nav-fit, language, local-path, localhost, secrets, duplicate-ID, heading, keyboard/focus/reduced-motion/overflow checks. | complete | JS syntax and public operations validator passed; route checks returned 200; duplicate ID and rendered overflow checks passed. | Final scan limited visible public files to buyer-facing language. |
| CL-008 | Documentation | Create rebuild report and update Wave 1/Freight Brace docs where necessary. | complete | Added `WAVE-1-HERO-COMPOSITION-REBUILD-REPORT.md`; updated Wave 1 implementation, deployment, claims, and Freight Brace reports. | Reports identify no push, deploy, upload, or Supabase access. |
| CL-009 | Scratch cleanup | Remove or move prior scratch screenshot folders `_after-check`, `_before-valid`, and `_before` out of the repo working tree. | complete | Moved scratch folders to `C:\Users\syhol\Desktop\BOF-ds2-wave1-scratch-removed-20260727`. | Repo working tree no longer contains the scratch folders. |
| CL-010 | Git safety | Create bounded local commits only; do not push, merge, deploy, upload, touch Supabase, customer demo, or protected worktrees. | complete | Local commits planned after final staging review. | No protected worktree, deployment, upload, push, merge, or Supabase action performed. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/bof-design-system-2-preview.js`; `node --check Website/assets/js/site.js`. |
| Route checks | complete | Local routes `/`, `/drivers/`, `/dispatch/`, `/safety/`, `/settlements/`, shared CSS, and `site.js` returned 200. |
| Browser/rendered check | complete | Edge headless/DevTools screenshots and overflow checks passed at 1440, 1366, 1280, 768, and 390. |
| Source/privacy/stale-copy scans | complete | Visible Wave 1 HTML/CSS scan found no local paths, localhost URLs, secrets, or stale hero references after cleanup. |
| Runtime cleanup audit | complete | Local Python server identified for shutdown after final validation; no bridge bundle processed. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: Rebuilt four Wave 1 hero compositions, global header fit, mobile layout, screenshot package, documentation, and scratch cleanup.
- Remaining: None for this prompt after local commits.
- Blocked: Live FTP bridge receive check timed out and remains outside this Wave 1 page-change scope.
- Deferred: Playwright validation was not installed or run; Edge headless/DevTools validation was used instead per prompt constraints.
- Verification: JS syntax, public operations validator, route checks, asset checks, manifest parsing, duplicate-ID scan, and rendered overflow checks passed.

