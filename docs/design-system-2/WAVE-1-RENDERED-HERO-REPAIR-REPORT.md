# Wave 1 Rendered Hero Repair Report

Status: BOF WAVE 1 RENDERED HERO REPAIR - READY FOR OWNER REVIEW

Generated: 2026-07-27

Worktree: `C:\Users\syhol\BOF-design-system-2-wave-1`

Branch: `codex/design-system-2-wave-1`

Baseline HEAD before this repair: `a98fca1a9230f759ce1c24addbfe124dba76fa47`

## Root Cause

The rendered Wave 1 pages were controlled by `Website/assets/css/bof-design-system-2-wave-1.css`, not the broader public-site `styles.css` file. The previous approved design direction existed in the Wave 1 page structure, but the controlling hero selectors still rendered too large in the browser:

- `.wave1-hero`
- `.wave1-hero__inner`
- `.wave1-hero__copy`
- `.wave1-hero__copy h1`
- `.wave1-hero__panel`
- `.wave1-kpi-grid`
- `.wave1-kpi`
- `.wave1-benefit-grid`

The result was a Dispatch hero that still read as the older oversized composition: large left glass panel, oversized headline, oversized Operations Overview panel, and too much obstruction of the dispatcher/control-room image.

## Screenshot Provenance

The current `/dispatch/` route is served from:

`Website/dispatch/index.html`

It loads:

- CSS: `/assets/css/bof-design-system-2-wave-1.css`
- JavaScript: `/assets/js/bof-design-system-2-preview.js`

The previously committed `wave-1-modern-system-review` screenshots were stale relative to the current HEAD because later Freight Brace review work moved the branch forward. The current local machine also had stale preview server state on older ports. This repair used a fresh local no-cache server from the current worktree at:

`http://127.0.0.1:8291`

## Computed Style Findings

Browser-computed Dispatch values before the correction at 1366px showed the oversized condition:

- H1 font size: about `54.656px`
- Hero height: about `613px`
- Left copy max width: `560px`
- Operations Overview max width: `380px`
- Left copy padding: up to `34px`
- Operations Overview padding: up to `20px`

After the correction, the controlling CSS sets:

- H1 font size: `clamp(2.12rem, 2.55vw, 2.85rem)`, about `34.84px` at 1366px
- Hero minimum height: `clamp(520px, 64vh, 700px)`
- Hero grid: `minmax(320px, 0.58fr) minmax(260px, 320px)`
- Left copy max width: `470px`
- Operations Overview max width: `320px`
- Left copy padding: `clamp(20px, 2.1vw, 26px)`
- Operations Overview padding: `clamp(14px, 1.6vw, 18px)`
- Default hero overlay: lighter localized gradient

## Corrections Performed

Changed `Website/assets/css/bof-design-system-2-wave-1.css`:

- reduced hero height;
- reduced H1 scale by roughly 35% to 45%;
- reduced left glass-panel width, padding, shadow, and blur;
- reduced Operations Overview panel width, padding, KPI size, and visual weight;
- lightened the default image overlay;
- added `--wave1-hero-size` and `--wave1-hero-mobile-size` variables so page-specific bitmap framing can be corrected without adding override layers;
- tightened hero grid alignment while preserving responsive stacking.

Changed `Website/safety/index.html` and `Website/settlements/index.html`:

- adjusted only the page-level hero image focal position and background size;
- added a stronger localized left/top mask where the source bitmap contains faint baked-in legacy text;
- preserved the existing page content, route, assets, buttons, and semantics.

## Visual Acceptance

Fresh screenshots confirm:

- Dispatch left hero panel is fully visible;
- Dispatch headline is no longer oversized or clipped;
- Dispatch buttons are visible and not clipped;
- Dispatch image remains dominant;
- dispatcher, headset, tablet, route map, and screens remain visible;
- Operations Overview panel is compact and positioned away from the subject's face;
- header and navigation are complete and unclipped at 1440px and 1366px;
- mobile header collapses to logo plus hamburger;
- mobile hero stacks without clipping the headline or buttons;
- Drivers, Safety, and Settlements use the same repaired shared hero structure.

Compared with the owner-provided failed screenshot, the new Dispatch screenshot removes the oversized left panel and oversized Operations Overview block. The live content is now compact, centered inside the viewport, and no longer dominates the photography.

## Unresolved Issues

Safety and Settlements use image assets that contain faint baked-in legacy text. CSS masks and focal-position adjustments reduce that issue without replacing approved assets. A fully clean result would require replacing or editing those source hero bitmaps in a separate asset-cleanup pass.

Browser route and screenshot validation were completed with Microsoft Edge headless because `playwright-core` is unavailable in this worktree and no package installation was allowed.

## Validation Results

Commands run:

```powershell
node --check Website\assets\js\bof-design-system-2-preview.js
node --check Website\assets\js\site.js
node Website\tools\validate-bof-public-operations.js
node -e "JSON.parse(require('fs').readFileSync('docs/design-system-2/screenshots/wave-1-rendered-hero-repair/manifest.json','utf8'))"
```

Public operations validator:

- drivers: 12
- loads: 5
- exceptions: 4
- warnings: 0
- errors: 0

Route checks returned `200` for:

- `/`
- `/drivers/`
- `/dispatch/`
- `/safety/`
- `/settlements/`
- `/assets/css/bof-design-system-2-wave-1.css`
- `/assets/css/bof-design-system-2-components.css`
- `/assets/js/bof-design-system-2-preview.js`
- `/assets/brand/bof-design-system-2/svg/header-lockup.svg`
- `/assets/images/dispatch/dispatch-operations-control-hero.png`
- `/assets/images/legacy-heroes/drivers-emma-brown-hero.png`
- `/assets/images/safety/safety-readiness-hero.png`
- `/assets/images/settlements/settlements-command-hero.png`

## Screenshot Evidence

New screenshots were captured under:

`docs/design-system-2/screenshots/wave-1-rendered-hero-repair/`

Files:

- `dispatch-hero-1440.png`
- `dispatch-hero-1366.png`
- `dispatch-full-page.png`
- `drivers-hero-1440.png`
- `safety-hero-1440.png`
- `settlements-hero-1440.png`
- `header-1440.png`
- `header-1366.png`
- `dispatch-mobile.png`
- `drivers-mobile.png`
- `safety-mobile.png`
- `settlements-mobile.png`
- `manifest.json`

## Safety Confirmation

No deployment, push, merge, upload, Supabase access, Freight Brace feature addition, or protected worktree modification was performed.
