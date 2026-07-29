# Logo Consistency Correction Report

Status: ready for owner review after local validation.

## Root Cause

The inconsistent logo was caused by shared enterprise-header CSS in `Website/assets/css/styles.css`. The CSS hid the real `.brand img` and rendered a CSS-generated `B` mark plus `BackOfficeFleet` pseudo-text. Route source files also preserved stale `boflogo-original.png` references, and `/customer-demo/` used a separate package PNG.

## Canonical Asset

Canonical asset: `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg`

This DS2 source SVG is authoritative because it is part of the DS2 brand package and contains the approved road-mark symbol with the BackOfficeFleet wordmark. The hidden investor presentation uses `Website/assets/brand/bof-design-system-2/svg/primary-horizontal-light.svg` because its topbar is light, but it remains in the same approved DS2 brand family.

## Changes Made

- Updated `Website/assets/js/site.js` so the shared public header renders the canonical DS2 header-lockup SVG.
- Removed obsolete BF pseudo-logo rules from `Website/assets/css/styles.css`.
- Replaced stale route-source logo image references with DS2 SVG assets.
- Updated `/customer-demo/` application sidebar logo to the canonical DS2 header-lockup SVG.
- Updated `/private-investor-plan/` to the DS2 primary-horizontal-light SVG while preserving ungated, hidden, noindex access.
- Updated deployment inventory, route inventory, runbook, rollback plan, SEO notes, and candidate report.

## Route Impact

Public routes corrected:
All requested public routes and upload-inventory compatibility routes that use the shared header now resolve to the DS2 header-lockup SVG through `site.js` and no longer have CSS-generated BF monogram output.

Application and hidden routes:
- `/customer-demo/` uses the DS2 header-lockup SVG in its sidebar.
- `/customer-demo/?portal=manager`, `driver`, `finance`, `safety`, `vault`, `policy`, and `business-operations` inherit the corrected sidebar logo.
- `/interactive-demo/`, `/interactive-demo/start/`, and `/interactive-demo/loading/` source logo references were corrected where present. Deeper excluded interactive-demo states had no visible logo image in source.
- `/private-investor-plan/` remains ungated, hidden, noindex/nofollow/noarchive, unlisted, and uses the approved DS2 light-background logo variant.
- `/internal-intake-review/` remains excluded from static upload; no visible logo implementation was present.

## Obsolete References Removed

Deployable public references to `boflogo-original.png` and `backofficefleet-logo-approved.png` were removed from route sources and upload inventory. The old files remain in the repository for rollback/history only and are not part of the correction upload list.

## Responsive And Accessibility Result

- Desktop: approved DS2 header-lockup is visible in the shared public header without the CSS BF monogram.
- Tablet: header logo remains width-constrained and does not collide with navigation.
- Mobile: logo uses existing shared responsive sizing and does not switch to a monogram.
- Application sidebar: compact DS2 header-lockup remains readable at sidebar scale.
- Accessibility: logo images keep `alt="BackOfficeFleet"` and linked logo anchors keep `aria-label="BackOfficeFleet home"`.

## Cache And Generated Output

No service worker or manifest was found that would preserve the obsolete logo after deployment. Browser validation used fresh contexts with cache disabled.

## Screenshots

Screenshot directory: `docs/deployment-candidate/screenshots/logo-consistency-review/`

## Validation

- Requested route matrix: 42 routes x 7 viewports = 294 browser checks, 0 failures.
- Upload-inventory route sweep: 79 routes at desktop viewport, 0 failures.
- Direct media checks: three MP4 assets returned HTTP 206 range responses.
- JavaScript syntax checks passed for `site.js`, `interactive-demo-routes.js`, `operations-record-premium.js`, `customer-demo-app.js`, and `private-investor-plan.js`.
- `git diff --check` passed.
- Deployable old-logo reference search returned no `boflogo-original.png`, `backofficefleet-logo-approved.png`, or `content: "B"` hits.
- Public intake backend static validation passed; forms remain backend-disabled.

## Deployment Impact

Upload impact is limited to static logo assets, shared CSS/JS shell files, corrected route HTML sources, and deployment documentation. No navigation exposure, sitemap exposure, form behavior, Supabase state, or investor access behavior was changed.

## Rollback

Rollback by restoring `Website/assets/css/styles.css`, `Website/assets/js/site.js`, and affected route HTML from the pre-upload live backup. Re-upload `boflogo-original.png` only as part of an approved rollback.

## Unresolved Issues

None found in local validation. `.htaccess` header behavior still requires live-server verification after a controlled deployment because the local static server cannot enforce Apache headers.
