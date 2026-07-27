# BOF Design System 2.0 Wave 1 Deployment Inventory

## Status

This is a local owner-review candidate only.

Nothing was pushed, merged, uploaded, or deployed.

## Files Required for Deployment Review

### Shared Assets

- `Website/assets/css/bof-design-system-2-components.css`
- `Website/assets/css/bof-design-system-2-wave-1.css`
- `Website/assets/js/bof-design-system-2-preview.js`

### Page Files

- `Website/drivers/index.html`
- `Website/dispatch/index.html`
- `Website/safety/index.html`
- `Website/settlements/index.html`

### Existing Referenced Brand Assets

- `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg`
- `Website/assets/brand/bof-design-system-2/favicon/favicon.ico`

### New Referenced Hero Images

- `Website/assets/images/design-system-2/wave-1/ds2-drivers-hero-modern.webp`
- `Website/assets/images/design-system-2/wave-1/ds2-dispatch-hero-modern.webp`
- `Website/assets/images/design-system-2/wave-1/ds2-safety-hero-modern.webp`
- `Website/assets/images/design-system-2/wave-1/ds2-settlements-hero-modern.webp`

### Existing Referenced Videos and Posters

- `Website/assets/videos/bof-driver-vault.mp4`
- `Website/assets/images/video-posters/bof-driver-vault.jpg`
- `Website/assets/videos/bof-customer-portal-load-intake.mp4`
- `Website/assets/images/video-posters/bof-customer-portal-load-intake.jpg`
- `Website/assets/videos/bof-settlements-readiness.mp4`
- `Website/assets/images/video-posters/bof-settlements-readiness.jpg`

### Existing Referenced Partner Image

- `Website/assets/images/partners/freight-brace/freight-brace-trailer-photo.jpeg`

### Freight Brace Review Documentation

- `docs/design-system-2/FREIGHT-BRACE-ASSET-INVENTORY.md`
- `docs/design-system-2/FREIGHT-BRACE-CONTENT-CLAIMS-REVIEW.md`
- `docs/design-system-2/FREIGHT-BRACE-WAVE-1-INTEGRATION-REPORT.md`

## Screenshot Review Package

- `docs/design-system-2/screenshots/wave-1-owner-review/`
- `docs/design-system-2/screenshots/freight-brace-wave-1-review/`
- `docs/design-system-2/screenshots/wave-1-hero-composition-rebuild/`

## Pre-Deployment Checks Completed Locally

- JavaScript syntax checks passed.
- Public operations validator passed.
- Asset reference validation passed.
- Route checks passed on local static server.
- Responsive overflow checks passed.
- Keyboard menu behavior passed.
- No secrets, local Windows paths, localhost links, or broken-character artifacts found in the changed public files.
- The four Wave 1 pages no longer reference the prior baked-text hero image candidates.
- DevTools-controlled 390 px mobile screenshots confirmed no horizontal overflow.

## Deployment Notes

- Do not deploy directly from this Wave 1 worktree until owner visual review is complete.
- If adopted, deploy only after merging or copying the approved commits into the intended website release branch.
- Confirm retained videos and image crops in a real browser before production upload.
