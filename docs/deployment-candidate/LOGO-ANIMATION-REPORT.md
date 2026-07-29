# BOF Logo Animation Report

Worktree: `C:\Users\syhol\BOF-public-site-deployment-candidate`
Branch: `codex/public-site-deployment-candidate`
Base HEAD inspected before changes: `e7a6c7b8f20c939622bf7ca25a8d5f67f4d37332`

## Scope

- Added a restrained optional BOF logo animation for the homepage and customer demo only.
- Preserved `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg` as the canonical static logo.
- Did not modify the approved source SVG.
- Did not add deployment, FTP, Supabase, auth, password, or production changes.

## Implementation

- `Website/assets/css/logo-animation.css`
- `Website/assets/js/logo-animation.js`
- `Website/index.html`
- `Website/customer-demo/index.html`

The runtime wrapper leaves the wordmark stationary and overlays three small SVG truck silhouettes along path geometry derived from the approved three-road mark. The overlay is `aria-hidden`, pointer inert, fades out after the one-time sequence, and is skipped for reduced-motion users.

Session flags:

- `bofLogoAnimationPlayed=true` for homepage replay suppression.
- `bofCustomerDemoLogoAnimationPlayed=true` for customer-demo replay suppression.

No personal data or access state is stored.

## Validation

- `node --check Website\assets\js\logo-animation.js`
- Local static server from `Website/` on `127.0.0.1:5199`, stopped after validation.
- Microsoft Edge / Playwright checks:
  - Homepage first load creates the wrapper, preserves the canonical static SVG, renders three truck silhouettes, and sets `bofLogoAnimationPlayed=true`.
  - Homepage sequence settles and fades the overlay after the brief animation.
  - Homepage same-session reload does not replay.
  - Reduced-motion homepage keeps the static logo and creates no animation wrapper.
  - Customer demo first open creates the optional sidebar wrapper, preserves the canonical static SVG, renders three truck silhouettes, and sets `bofCustomerDemoLogoAnimationPlayed=true`.

Screenshots:

- `docs/deployment-candidate/screenshots/logo-animation-review/homepage-logo-animation-active.png`
- `docs/deployment-candidate/screenshots/logo-animation-review/homepage-logo-animation-settled.png`
- `docs/deployment-candidate/screenshots/logo-animation-review/homepage-logo-reduced-motion.png`
- `docs/deployment-candidate/screenshots/logo-animation-review/customer-demo-logo-animation-active.png`
