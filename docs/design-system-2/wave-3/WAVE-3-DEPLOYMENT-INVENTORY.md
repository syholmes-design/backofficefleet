# Wave 3 Deployment Inventory

## Worktree

- Worktree: `C:\Users\syhol\BOF-design-system-2-wave-3`
- Branch: `codex/design-system-2-wave-3`
- Base commit: `771d7cf5195a922ea841c7894c181494b5216c17`

## Public Files Added or Rebuilt

- `Website/who-we-serve/index.html`
- `Website/aggregators/index.html`
- `Website/private-fleets/index.html`
- `Website/for-hire-fleets/index.html`
- `Website/government/index.html`
- `Website/assessment/index.html`
- `Website/priority-fleet-program/index.html`
- `Website/assets/js/wave3-assessment.js`
- `Website/assets/css/styles.css`
- `Website/sitemap.xml`
- `Website/drivers/index.html`

## Documentation Added

- `docs/design-system-2/wave-3/WAVE-3-AUDIENCE-ROUTE-AUDIT.md`
- `docs/design-system-2/wave-3/WAVE-3-AUDIENCE-SYSTEM-REPORT.md`
- `docs/design-system-2/wave-3/WAVE-3-ASSESSMENT-ARCHITECTURE.md`
- `docs/design-system-2/wave-3/WAVE-3-ASSESSMENT-QUESTION-MATRIX.md`
- `docs/design-system-2/wave-3/WAVE-3-ASSESSMENT-SCORING-MODEL.md`
- `docs/design-system-2/wave-3/WAVE-3-DEPLOYMENT-INVENTORY.md`
- `docs/design-system-2/wave-3/WAVE-3-ROLLBACK-PLAN.md`
- `docs/design-system-2/wave-3/WAVE-3-OWNER-CORRECTION-REPORT.md`
- `docs/design-system-2/wave-3/ASSESSMENT-CONVERSION-STRATEGY.md`
- `docs/design-system-2/wave-3/PRIORITY-FLEET-PUBLIC-PROGRAM-SPEC.md`
- `docs/design-system-2/wave-3/SUPPORTING-SOLUTION-PAGE-PLAN.md`

## Owner Review Screenshots

Directory:

`docs/design-system-2/screenshots/wave-3-owner-review/`

Screenshot count: 28 PNG files.

Owner-correction screenshot directory:

`docs/design-system-2/screenshots/wave-3-owner-correction-review/`

Screenshot count: 29 PNG files.

## Sitemap Changes

Canonical public entries added or confirmed:

- `https://backofficefleet.com/who-we-serve/`
- `https://backofficefleet.com/aggregators/`
- `https://backofficefleet.com/private-fleets/`
- `https://backofficefleet.com/for-hire-fleets/`
- `https://backofficefleet.com/government/`
- `https://backofficefleet.com/assessment/`
- `https://backofficefleet.com/priority-fleet-program/`

No query-string assessment states or hidden customer-demo routes were added to the sitemap.

## Proposed Redirects

These were documented but not implemented:

- `/private-fleet/` -> `/private-fleets/`
- `/government-fleets/` -> `/government/`
- `/driver-assessment/` -> `/assessment/?type=driver`
- `/fleet-assessment/` -> `/assessment/`
- any historical aggregator-assessment URL -> `/assessment/?type=aggregator`
- any historical government-readiness URL -> `/assessment/?type=government`

## Deployment Order

1. Deploy CSS and image-referenced static assets already present in the approved base.
2. Deploy new/rebuilt public HTML pages.
3. Deploy `wave3-assessment.js`.
4. Deploy `/priority-fleet-program/`.
5. Deploy `sitemap.xml`.
6. Add only owner-approved redirects.
7. Run production smoke tests for primary routes, deep links, Back/Forward, reload, Priority Fleet links, and sitemap.

## Non-Actions

- No push.
- No merge.
- No deployment.
- No upload.
- No Supabase changes.
- No protected worktree changes.
- No FTP bridge check.
- No RustDesk check or configuration.
