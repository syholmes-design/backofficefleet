# Header Navigation Cleanup

## Scope

Local-only cleanup of public BackOfficeFleet header/navigation language and homepage audience cards. No staging, commit, push, deploy, or Vercel action was performed.

Customer portal workflow files and product-shell `interactive-demo` files were intentionally excluded from the header replacement pass.

## Files Inspected

- Public `Website/**/*.html` pages with `site-header`, excluding `Website/customer-portal/**`, `Website/interactive-demo/**`, `Website/video-assets/**`, and `Website/reports/**`.
- Homepage audience section in `Website/index.html`.
- Current route availability for all new navigation targets.

## Files Changed

- `Website/index.html`
- `Website/aggregator-command-center/index.html`
- `Website/aggregator-outreach/index.html`
- `Website/aggregator-partner-offer/index.html`
- `Website/animated-demo/index.html`
- `Website/animated-demo-aggregator/index.html`
- `Website/animated-demo-business/index.html`
- `Website/book-demo/index.html`
- `Website/business-operations/index.html`
- `Website/capacity-intelligence/index.html`
- `Website/carrier-readiness/index.html`
- `Website/dashboard/index.html`
- `Website/demo/index.html`
- `Website/demo/tms-release-review/index.html`
- `Website/demo-paths/index.html`
- `Website/dispatch/index.html`
- `Website/document-readiness-engine/index.html`
- `Website/documents/index.html`
- `Website/drivers/index.html`
- `Website/executive-demo/index.html`
- `Website/fleet/index.html`
- `Website/fleet-operator-offer/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleet/apply/index.html`
- `Website/founding-fleet/pricing/index.html`
- `Website/founding-fleet/trial/index.html`
- `Website/founding-fleets/index.html`
- `Website/government/index.html`
- `Website/integrations/ascendtms/index.html`
- `Website/integrations/ascendtms/release-review/index.html`
- `Website/integrations/partner-tms/index.html`
- `Website/integrations/tms-workflow/index.html`
- `Website/integrations/tms-workflow/release-review/index.html`
- `Website/narration-export/index.html`
- `Website/operational-intelligence/index.html`
- `Website/operations-record/index.html`
- `Website/private-fleet-offer/index.html`
- `Website/private-fleets/index.html`
- `Website/safety/index.html`
- `Website/safety-compliance/index.html`
- `Website/scenario-walkthrough/index.html`
- `Website/sectors/index.html`
- `Website/settlements/index.html`
- `Website/solutions/index.html`
- `Website/trust-governance/index.html`
- `Website/walkthrough/index.html`
- `Website/reports/header-navigation-cleanup.md`

## Old Header Labels Removed

Removed from public header blocks:

- `Platform`
- `Solutions`
- `Demos`
- abstract multi-menu structure around demo paths and internal platform labels
- `Request Priority Fleet Review`
- `Request Fleet Review`
- `Request BOF Assessment`

`Readiness Engine` remains available as page/body language where it describes the existing document readiness page, but it is not used as a top-level public header label.

## New Header Structure

Top-level public navigation:

- `Services`
- `Workflows`
- `Who We Serve`

Header CTA:

- Standard public pages: `Take Fleet Assessment`
- Aggregator pages: `Request an Aggregator Assessment`

## Route Mapping

Services:

- Fleet Back Office -> `/fleet/`
- HR Tier -> `/business-operations/`
- Finance Tier -> `/business-operations/`
- BOF Vault -> `/document-readiness-engine/`
- Customer Portal -> `/customer-portal/`
- Business Operations -> `/business-operations/`

Workflows:

- Driver Documents -> `/drivers/`
- Dispatch Support -> `/dispatch/`
- Settlements -> `/settlements/`
- PODs & Proof -> `/documents/`
- Claims & Exceptions -> `/operations-record/`
- Factoring Packets -> `/settlements/`
- Document Readiness -> `/document-readiness-engine/`

Who We Serve:

- Trucking Fleets -> `/fleet/`
- Private Fleets -> `/private-fleets/`
- Government Fleets -> `/government/`
- Aggregators -> `/aggregator-outreach/`
- Field Service / Business Operations -> `/business-operations/`

Assessment CTA:

- Take Fleet Assessment -> `/scenario-walkthrough/`
- Aggregator Assessment -> `/scenario-walkthrough/`

## Homepage Audience Cards

Updated `Website/index.html` to add/strengthen cards for:

- Trucking Fleets: driver records, load intake, PODs, settlements, factoring packets, HR, and finance support.
- Private Fleets: internal fleet readiness, driver documentation, operating records, and administrative visibility.
- Government Fleets: driver and equipment records, document readiness, audit trails, and operating-policy visibility.
- Aggregators: carrier readiness, document structure, operating-unit visibility, and network assessment.
- Business Operations: HR and Finance support for operating businesses, including recruiting, onboarding, payroll coordination, AP, AR, reporting, factoring, and cash-flow visibility.

## Missing Routes Or Substitutions

No broken nav target routes were found.

Substitutions used:

- BOF Vault uses `/document-readiness-engine/`, which is the clearest public BOF Vault/document readiness page.
- HR Tier and Finance Tier share `/business-operations/`.
- Factoring Packets points to `/settlements/`.
- PODs & Proof points to `/documents/`.
- Claims & Exceptions points to `/operations-record/`.

## Validation Results

Local HTTP 200 route checks passed for:

- `/`
- `/fleet/`
- `/business-operations/`
- `/document-readiness-engine/`
- `/customer-portal/`
- `/drivers/`
- `/dispatch/`
- `/settlements/`
- `/documents/`
- `/operations-record/`
- `/private-fleets/`
- `/government/`
- `/aggregator-outreach/`
- `/scenario-walkthrough/`

Scans:

- Header-only scan found no remaining `Platform`, `Solutions`, `Demos`, `Request Priority Fleet Review`, `Request Fleet Review`, or `Request BOF Assessment` in public header blocks.
- Aggregator header scan confirmed aggregator pages still use `Request an Aggregator Assessment`.
- Public HTML CTA scan found no `Book Demo`, `Schedule a Demo`, `Working Session`, `Scenario Walkthrough`, `Request Priority Fleet Review`, `Request Fleet Review`, or `Request BOF Assessment` outside excluded areas.
- `href` / `src` / `action` scan found no broken local targets, including the `/scenario-walkthrough/submit.php` form action.

Rendered checks:

- `/` at 1366px: no horizontal overflow.
- `/` at 390px: no horizontal overflow.
- `/scenario-walkthrough/` at 1366px: no horizontal overflow.
- `/scenario-walkthrough/` at 390px: no horizontal overflow.
- Dropdown buttons expose `Services`, `Workflows`, and `Who We Serve`.
- Services dropdown opens and reports `aria-expanded="true"` after click.

Customer portal:

- Customer portal workflow files were excluded from the edit script.
- Existing dirty customer portal files remain in the working tree and should be treated as unrelated/pre-existing unless separately reviewed.

## Remaining Concerns

- The repo is broadly dirty, including unrelated `.codex`, customer portal, data/governance, demo, image, and other Website changes. A future commit should stage only the nav cleanup files intentionally.
- Several changed public pages were already dirty or untracked before this pass, so pre-commit isolation should use careful file review or patch staging.
- No CSS was changed for this pass; existing header/dropdown styling was reused.

## Safe To Commit

The navigation cleanup itself is ready for a focused review. It is safe to commit only after isolating the intended files from unrelated dirty work and confirming whether all untracked public route pages touched by the header replacement should be included.
