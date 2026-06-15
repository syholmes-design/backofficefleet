# Checklist: Homepage Dashboard Hero Client Image Pass

Created: 2026-06-14 15:00:40 -05:00
Source: User request 2026-06-14 with Client Suggestions/IMG_0095.jpg and client hero image note
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Use the client-provided BOF dashboard-style screenshot as the homepage hero image direction, adjust its color treatment so it does not clash with BOF's current light green/cream design system, and verify the homepage still renders cleanly.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| HH-001 | User request / client note | Use the product/dashboard screenshot direction for the homepage hero because it immediately shows software. | complete | Source inspected: `Client Suggestions/IMG_0095.jpg`, 1672x941 RGB; homepage now references `/assets/images/heroes/bof-dashboard-hero-toned.webp`. | Supplied screenshot became the hero source. |
| HH-002 | User request | Alter the color scheme so the screenshot does not clash with the current BOF site design. | complete | Created optimized BOF-toned asset `Website/assets/images/heroes/bof-dashboard-hero-toned.webp`, 162,858 bytes. | Color grade softens dark navy and adds BOF teal/green cohesion while keeping dashboard details recognizable. |
| HH-003 | User request / client note | Replace the current homepage hero illustration with the dashboard screenshot while preserving a polished hero layout. | complete | `Website/index.html` hero visual now uses `hero-dashboard-stage` / `hero-dashboard-image`; `Website/assets/css/styles.css` adds screenshot frame styling. | Primary CTA changed to `Book Demo`; `Try Demo` remains available. No dead assessment CTA added because no assessment route exists. |
| HH-004 | Static site guardrail | Keep implementation static: HTML, CSS, compressed image asset; no packages/framework/API. | complete | Changed only static HTML/CSS and a WebP asset under `Website`; no package/framework/backend files added. |  |
| HH-005 | Cache-busting rule | Bump CSS asset version after homepage/CSS changes. | complete | `.codex/scripts/bump-website-cache-version.ps1 -Version 1.40` updated 53 HTML files. | CSS only; shared JS version unchanged. |
| HH-006 | Verification | Run syntax/source checks and browser-render the homepage desktop/mobile. | complete | `node --check Website/assets/js/site.js` passed; homepage route returned 200 with hero asset and CSS `v=1.40`; final screenshots saved under `.codex/reports/visual-snapshots/homepage-dashboard-hero-20260614/`; runtime audit found 0 leftovers. | Stale-reference scan found no `Client Suggestions`, `IMG_0095`, old homepage hero asset, or non-1.40 CSS refs in `Website`. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js` passed. |
| Route checks | complete | Local homepage route returned HTTP 200 and included `bof-dashboard-hero-toned.webp` plus `styles.css?v=1.40`. |
| Browser/rendered check | complete | Final desktop/mobile screenshots: `.codex/reports/visual-snapshots/homepage-dashboard-hero-20260614/home-dashboard-hero-desktop-final.png` and `home-dashboard-hero-mobile-final.png`. |
| Source/privacy/stale-copy scans | complete | Search found no `Client Suggestions`, `IMG_0095`, old `hero-home-command.webp`, or stale CSS version references in `Website`. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` reported 0 candidate leftovers. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: HH-001 through HH-006.
- Remaining: none.
- Blocked:
- Deferred:
- Verification: static checks, asset existence/size, route check, desktop/mobile screenshots, stale-reference scan, and runtime cleanup audit completed.

