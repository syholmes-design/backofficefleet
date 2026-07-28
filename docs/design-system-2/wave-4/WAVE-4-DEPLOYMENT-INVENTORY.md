# Wave 4 Deployment Inventory

## Do Not Deploy Automatically

Wave 4 is prepared for owner review only. No upload, deploy, push, merge, or Supabase action was performed.

## New Routes

- `Website/company/index.html`
- `Website/contact/index.html`
- `Website/book-a-demo/index.html`
- `Website/load-readiness/index.html`
- `Website/network-readiness/index.html`
- `Website/fleet-preparedness/index.html`
- `Website/resources/index.html`
- `Website/about/index.html`
- `Website/favicon.ico`

## Modified Public Assets

- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`
- `Website/sitemap.xml`
- Homepage and cache-versioned HTML references across the static site.
- `Website/priority-fleet-program/index.html`
- `Website/book-demo/index.html`
- `Website/founding-fleet/apply/index.html`

## Asset Version

Current cache version: `20260728-wave4-owner-review3`

## Forms Requiring Backend

- `/contact/`
- `/book-a-demo/`
- `/priority-fleet-program/`
- `/assessment/` conversion CTA remains non-persistent.

## Hidden Routes

- `/customer-demo/`
- `/interactive-demo/`

These remain excluded from sitemap and disallowed in robots.

## Excluded From Deployment Package

- `.codex/`
- docs and screenshots unless owner wants them uploaded separately
- local preview PID files
- git metadata
- protected worktrees

## Verification Order

1. Confirm homepage, header, footer, and sitemap.
2. Confirm `/company/`, `/contact/`, `/book-a-demo/`.
3. Confirm `/load-readiness/`, `/network-readiness/`, `/fleet-preparedness/`.
4. Confirm `/priority-fleet-program/` and Priority Fleet form non-transmission language.
5. Confirm `/assessment/` deep links.
6. Confirm hidden demos remain excluded.
7. Confirm no public form sends data until backend is approved.

## Deployment Recommendation

Owner review first. Deploy only after legal-page gaps and backend form handling are explicitly accepted or deferred.
