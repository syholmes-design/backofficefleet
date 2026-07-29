# Logo Asset And Route Inventory

Worktree: C:\Users\syhol\BOF-public-site-deployment-candidate
Repository root: C:/Users/syhol/BOF-public-site-deployment-candidate
Branch: codex/public-site-deployment-candidate
Starting HEAD: 4331fa0e7d911ce7d247d9041ad80dba41957a42
Starting status: clean

## Canonical Selection

Canonical public/application header asset: `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg`

- Format: SVG
- Dimensions: viewBox 760 x 150
- Transparency: transparent SVG background
- File size: 1,288 bytes
- Display widths: desktop 148-230px depending viewport, tablet 168-190px, mobile min(150px, 54vw), application sidebar 172px
- Authority: DS2 brand package source SVG. It contains the approved road-mark symbol plus BackOfficeFleet wordmark and avoids the obsolete CSS-generated BF monogram.

Approved light-background variant for investor topbar: `Website/assets/brand/bof-design-system-2/svg/primary-horizontal-light.svg`

- Format: SVG
- Dimensions: viewBox 1200 x 360
- Transparency: transparent SVG background
- File size: 1,605 bytes
- Use: hidden investor presentation light topbar only

## Logo Assets Found

| Asset family | Representative file | Type | Dimensions | Transparency | Size | Use |
|---|---|---:|---:|---|---:|---|
| DS2 header lockup | `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg` | SVG | 760 x 150 | transparent | 1,288 | Canonical public/application header |
| DS2 primary horizontal | `Website/assets/brand/bof-design-system-2/svg/primary-horizontal-light.svg` | SVG | 1200 x 360 | transparent | 1,605 | Light-background investor variant |
| DS2 horizontal reversed | `Website/assets/brand/bof-design-system-2/svg/horizontal-reversed-dark.svg` | SVG | 1200 x 360 | solid | 1,654 | DS2 package variant, not selected |
| DS2 compact horizontal | `Website/assets/brand/bof-design-system-2/svg/compact-horizontal.svg` | SVG | 900 x 260 | transparent | 1,560 | DS2 package variant, not selected |
| DS2 mobile header | `Website/assets/brand/bof-design-system-2/svg/mobile-header.svg` | SVG | 640 x 180 | transparent | 1,731 | DS2 package variant, not selected |
| DS2 symbol-only/favicon | `Website/assets/brand/bof-design-system-2/svg/symbol-only.svg` | SVG | 320 x 320 | transparent | 823 | Icon/fallback only |
| DS2 PNG exports | `Website/assets/brand/bof-design-system-2/png/*-3x.png` | PNG | up to 3600 x 1080 | transparent | varies | High-resolution exports, SVG preferred |
| DS2 favicons | `Website/assets/brand/bof-design-system-2/favicon/favicon-*.png` | PNG/ICO | 16 x 16 to 512 x 512 | transparent | varies | Favicons |
| Legacy/current production PNG | `Website/assets/images/logo/boflogo-original.png` | PNG | 216 x 44 | transparent | 9,157 | Obsolete for this correction; rollback only |
| Customer-demo package PNG | `Website/assets/images/design-system-2/customer-demo-secondary-headers/backofficefleet-logo-approved.png` | PNG | 211 x 62 | solid | 12,625 | Replaced by canonical DS2 SVG in customer demo |

## Reference Findings

- `Website/assets/js/site.js` was the shared public header renderer and referenced `boflogo-original.png`.
- `Website/assets/css/styles.css` contained the launch-blocking visual defect: enterprise header rules hid `.brand img` and generated a visible CSS `B` plus `BackOfficeFleet` text with pseudo-elements.
- Public route source HTML contained route-local logo placeholders using `boflogo-original.png`; the runtime header is still installed through `site.js`, but source references were stale.
- `/customer-demo/` used its own application-sidebar logo implementation and referenced `backofficefleet-logo-approved.png`.
- `/private-investor-plan/` bypasses the public shell and used `boflogo-original.png` in its investor topbar.
- `/interactive-demo/`, `/customer-portal/`, and `/internal-intake-review/` are versioned hidden/excluded surfaces. They were inventoried; interactive/customer portal sources had old logo references, internal intake review had no visible logo.

## Route Classification

Routes visually affected by the CSS-generated BF/old lockup before correction:
- All public routes using `site.js` enterprise header replacement, including `/`, `/who-we-serve/`, `/aggregators/`, `/private-fleets/`, `/for-hire-fleets/`, `/government/`, `/drivers/`, `/dispatch/`, `/safety/`, `/settlements/`, `/business-operations/`, `/documents/`, `/policies-procedures/`, `/bof-vault/`, `/assessment/`, `/priority-fleet-program/`, `/load-readiness/`, `/network-readiness/`, `/fleet-preparedness/`, `/company/`, `/contact/`, `/resources/`, `/privacy/`, `/terms/`, `/accessibility/`, and upload-inventory detail/compatibility routes that load `site.js`.

Routes bypassing shared public shell:
- `/customer-demo/`: hidden application shell; corrected to DS2 header-lockup SVG.
- `/private-investor-plan/`: hidden investor shell; corrected to DS2 primary horizontal light SVG and remains ungated/noindex.
- `/interactive-demo/`: hidden/excluded application shell; source logo references corrected where present.
- `/customer-portal/`: excluded portal source; source logo references corrected where present.
- `/internal-intake-review/`: excluded source; no visible logo implementation found.
- `/about/` and `/book-demo/`: compatibility pages in upload inventory with no visible header.

## Cache And Generated Output

No service worker registration or service-worker cache was found in the deployment inventory path. No generated manifest was found that would preserve `boflogo-original.png` or the CSS-generated BF monogram after the corrected CSS/JS/HTML are uploaded.

## Upload Inventory Finding

Before correction the upload list included `boflogo-original.png` and `backofficefleet-logo-approved.png` and did not list the DS2 header SVG. The upload list now includes `header-lockup.svg` and `primary-horizontal-light.svg`; obsolete PNGs are rollback-only.
