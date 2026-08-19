# Fleet Assessment CTA and Questionnaire Upgrade

## Files Inspected

- `Website/scenario-walkthrough/index.html`
- `Website/assets/js/scenario-walkthrough.js`
- `Website/scenario-walkthrough/submit.php`
- `Website/index.html`
- `Website/fleet/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleet/apply/index.html`
- `Website/founding-fleet/pricing/index.html`
- `Website/founding-fleet/trial/index.html`
- `Website/founding-fleets/index.html`
- `Website/business-operations/index.html`
- `Website/settlements/index.html`
- `Website/document-readiness-engine/index.html`
- `Website/fleet-operator-offer/index.html`
- Public HTML pages with remaining `Request a BOF Assessment` or `Request Priority Fleet Review` CTA language.

## Files Changed

- `Website/scenario-walkthrough/index.html`
- `Website/assets/js/scenario-walkthrough.js`
- `Website/scenario-walkthrough/submit.php`
- `Website/index.html`
- `Website/fleet/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleet/apply/index.html`
- `Website/founding-fleet/pricing/index.html`
- `Website/founding-fleet/trial/index.html`
- `Website/founding-fleets/index.html`
- `Website/business-operations/index.html`
- `Website/settlements/index.html`
- `Website/document-readiness-engine/index.html`
- `Website/fleet-operator-offer/index.html`
- `Website/animated-demo/index.html`
- `Website/animated-demo-business/index.html`
- `Website/book-demo/index.html`
- `Website/demo/index.html`
- `Website/demo-paths/index.html`
- `Website/narration-export/index.html`
- `Website/private-fleet-offer/index.html`
- `Website/private-fleets/index.html`
- `Website/safety/index.html`
- `Website/solutions/index.html`
- `Website/walkthrough/index.html`

## CTA Replacements

- Replaced public `Request Priority Fleet Review` CTA language with `Take Fleet Assessment` or `Take the BOF Fleet Assessment`.
- Replaced public `Request a BOF Assessment` CTA language with `Take the BOF Fleet Assessment`.
- Updated the homepage header CTA to `Take Fleet Assessment`.
- Updated Priority Fleet funnel pages so readiness/assessment CTAs lead to the BOF Fleet Assessment instead of vague review language.
- Aggregator-specific pages were not converted to fleet language in this pass.

## Questionnaire Sections Added

1. Fleet Profile
2. Driver Records and Readiness
3. Document Systems
4. Load Intake and Dispatch Support
5. POD, Proof, and Claims
6. Settlements and Pay Types
7. Factoring and Cash Flow
8. Policies, Procedures, and Automation
9. Optional HR Tier Review
10. Optional Finance Tier Review
11. Final Review / Submit

## HR Optional Section Behavior

- The HR Tier Review section defaults to included.
- Selecting `Skip HR Tier Review` hides the HR question set.
- Skipping HR removes that section from the progress count and does not block submission.

## Finance Optional Section Behavior

- The Finance Tier Review section defaults to included.
- Selecting `Skip Finance Tier Review` hides the Finance question set.
- Skipping Finance removes that section from the progress count and does not block submission.

## Progress Percentage Behavior

- The page shows a visible progress bar, percent complete, and current section label.
- Progress is calculated from active, non-hidden form controls.
- When HR and Finance are skipped, the section count adjusts from 11 to 9.
- Browser verification confirmed both optional sections hide and the progress label updates to `Section 1 of 9: Fleet Profile` after both skips.

## Frontend Summary / Payload Changes

- `Website/assets/js/scenario-walkthrough.js` now builds a `BOF Fleet Assessment` summary from all questionnaire fields.
- The JSON payload includes all 78 assessment fields, `assessmentSummary`, `assessmentRoute`, and `assessmentName`.
- Existing honeypot and `startedAt` timing fields are preserved.
- Required frontend validation checks company, contact name, email, and biggest current back-office problem.
- The confirmation state uses the stronger BOF Fleet Assessment submission message returned by PHP.

## PHP Changes

- `Website/scenario-walkthrough/submit.php` preserves the same endpoint and recipient behavior.
- Existing honeypot, minimum form age, maximum form age, required validation, and email validation are preserved.
- `clean_header()` remains used for user-provided mail header values.
- New questionnaire scalar fields use `clean_text()`.
- New list fields use `clean_list()`.
- HR and Finance optional fields remain optional and are not required when skipped.
- The email subject is now `BOF Fleet Assessment - {Company}`.
- The email body includes all assessment fields and an advisory-only note.

## Validation Results

- `node --check Website/assets/js/scenario-walkthrough.js`: passed.
- `php -l Website/scenario-walkthrough/submit.php`: could not run because local PHP is unavailable.
- Manual PHP inspection: no obvious unmatched braces, missing semicolons, or header-injection regressions found.
- HTML/JS/PHP field-name alignment: 78 HTML form fields, 78 JS payload fields, 78 PHP summary fields, no mismatches.
- Local HTTP 200 passed for changed key routes including `/`, `/scenario-walkthrough/`, `/fleet/`, `/founding-fleet/`, `/founding-fleet/apply/`, `/founding-fleet/pricing/`, `/founding-fleet/trial/`, `/founding-fleets/`, `/business-operations/`, `/settlements/`, `/document-readiness-engine/`, `/fleet-operator-offer/`, and additional touched public pages.
- href/src/action scan passed for changed pages after excluding `data-action` controls.
- Rendered width checks passed for `/` and `/scenario-walkthrough/` at 1366px and 390px with no horizontal overflow.
- Prohibited CTA scan found no public `Book Demo`, `Schedule a Demo`, `Working Session`, `Scenario Walkthrough`, `Request Priority Fleet Review`, or `Request a BOF Assessment` hits in changed public HTML. The only remaining `Request review` hit is a customer portal quote workflow button, not a public CTA, and that workflow file was not edited.

## Remaining Concerns

- Local PHP lint could not be run because PHP is not installed on this machine.
- The repo remains broadly dirty from unrelated/pre-existing work, including `Website/assets/js/customer-portal.js`; do not stage broadly.
- Some pages touched by CTA cleanup already had unrelated dirty context before this pass, so staging should be reviewed carefully later.

## Commit Safety

The Fleet Assessment CTA and questionnaire changes are functionally validated locally and should be safe to review for commit, but only with explicit, narrow staging. Do not stage `Website/assets/js/customer-portal.js` or unrelated dirty files.
