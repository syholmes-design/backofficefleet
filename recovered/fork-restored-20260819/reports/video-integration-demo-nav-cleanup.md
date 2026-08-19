# Video Integration and Demo Nav Cleanup

## Video Files Found
The five expected Pictory videos were not initially present in the active Website/assets/videos/ folder. The exact files were found in C:\Users\syhol\OneDrive\BOF-clean-platform-expansion\Website\assets\videos\ and copied into the active BOF repo.

- Website/assets/videos/bof-aggregator.mp4 - 47677195 bytes
- Website/assets/videos/bof-business-operations.mp4 - 42496290 bytes
- Website/assets/videos/bof-customer-portal-load-intake.mp4 - 36880560 bytes
- Website/assets/videos/bof-driver-vault.mp4 - 37069319 bytes
- Website/assets/videos/bof-fleet-owner.mp4 - 36153815 bytes

## Poster Images Created
Created BOF-branded 16:9 JPG posters with consistent styling, strong contrast, readable text, and no third-party imagery.

- Website/assets/images/video-posters/bof-aggregator.jpg - 98715 bytes
- Website/assets/images/video-posters/bof-business-operations.jpg - 91865 bytes
- Website/assets/images/video-posters/bof-customer-portal-load-intake.jpg - 101511 bytes
- Website/assets/images/video-posters/bof-driver-vault.jpg - 100853 bytes
- Website/assets/images/video-posters/bof-fleet-owner.jpg - 93379 bytes

## Pages Updated With Videos
- Website/index.html
- Website/fleet/index.html
- Website/founding-fleet/index.html
- Website/founding-fleets/index.html
- Website/fleet-operator-offer/index.html
- Website/aggregator-outreach/index.html
- Website/aggregator-partner-offer/index.html
- Website/aggregator-command-center/index.html
- Website/business-operations/index.html
- Website/drivers/index.html
- Website/document-readiness-engine/index.html
- Website/executive-demo/index.html
- Website/customer-portal/index.html
- Website/customer-portal/load-intake/index.html
- Website/customer-portal/billing/index.html
- Website/demo/index.html

Video placement summary:
- Fleet Owner video embedded on /, /fleet/, /founding-fleet/, /founding-fleets/, and /fleet-operator-offer/.
- Aggregator video embedded on /aggregator-outreach/, /aggregator-partner-offer/, and /aggregator-command-center/.
- Business Operations video embedded on /business-operations/ with HR Tier + Finance Tier positioning preserved.
- BOF Vault video embedded on /drivers/, /document-readiness-engine/, and /executive-demo/.
- Customer Portal / Load Intake video embedded on /customer-portal/, /customer-portal/load-intake/, and /customer-portal/billing/.
- /demo/ was repurposed as a BOF Video Library containing all five videos while preserving older workflow content further down the page.

## Navigation Changes
Removed the visible top-level Demos dropdown from primary headers across public/static HTML pages. The underlying demo routes were not deleted.

Because shared CSS changed and the cache-bump script was unavailable after the Codex environment cleanup, stylesheet references were manually bumped to styles.css?v=1.51 in these files:

- Website/aggregator-command-center/index.html
- Website/aggregator-outreach/index.html
- Website/aggregator-partner-offer/index.html
- Website/animated-demo/index.html
- Website/animated-demo-aggregator/index.html
- Website/animated-demo-business/index.html
- Website/book-demo/index.html
- Website/business-operations/index.html
- Website/capacity-intelligence/index.html
- Website/carrier-readiness/index.html
- Website/customer-portal/assignment/index.html
- Website/customer-portal/billing/index.html
- Website/customer-portal/documents/index.html
- Website/customer-portal/index.html
- Website/customer-portal/load-intake/index.html
- Website/customer-portal/quotes/index.html
- Website/customer-portal/request-shipment/index.html
- Website/customer-portal/shipment-generator/index.html
- Website/customer-portal/shipments/index.html
- Website/customer-portal/tracking/index.html
- Website/dashboard/index.html
- Website/demo/index.html
- Website/demo/tms-release-review/index.html
- Website/demo-paths/index.html
- Website/dispatch/index.html
- Website/document-readiness-engine/index.html
- Website/documents/index.html
- Website/drivers/index.html
- Website/executive-demo/index.html
- Website/fleet/index.html
- Website/fleet-operator-offer/index.html
- Website/founding-fleet/apply/index.html
- Website/founding-fleet/index.html
- Website/founding-fleet/pricing/index.html
- Website/founding-fleet/trial/index.html
- Website/founding-fleets/index.html
- Website/government/index.html
- Website/index.html
- Website/integrations/ascendtms/index.html
- Website/integrations/ascendtms/release-review/index.html
- Website/integrations/partner-tms/index.html
- Website/integrations/tms-workflow/index.html
- Website/integrations/tms-workflow/release-review/index.html
- Website/interactive-demo/alerts/index.html
- Website/interactive-demo/carriers/index.html
- Website/interactive-demo/dispatch/index.html
- Website/interactive-demo/documents/index.html
- Website/interactive-demo/drivers/document-intake/index.html
- Website/interactive-demo/drivers/drv-001/index.html
- Website/interactive-demo/drivers/drv-002/index.html
- Website/interactive-demo/drivers/drv-003/index.html
- Website/interactive-demo/drivers/drv-004/index.html
- Website/interactive-demo/drivers/drv-005/index.html
- Website/interactive-demo/drivers/drv-006/index.html
- Website/interactive-demo/drivers/drv-007/index.html
- Website/interactive-demo/drivers/drv-008/index.html
- Website/interactive-demo/drivers/drv-009/index.html
- Website/interactive-demo/drivers/drv-010/index.html
- Website/interactive-demo/drivers/drv-011/index.html
- Website/interactive-demo/drivers/drv-012/index.html
- Website/interactive-demo/drivers/index.html
- Website/interactive-demo/index.html
- Website/interactive-demo/loading/index.html
- Website/interactive-demo/load-queue/index.html
- Website/interactive-demo/reports/index.html
- Website/interactive-demo/safety/index.html
- Website/interactive-demo/settings/index.html
- Website/interactive-demo/settlements/index.html
- Website/interactive-demo/start/index.html
- Website/narration-export/index.html
- Website/operational-intelligence/index.html
- Website/operations-record/index.html
- Website/private-fleet-offer/index.html
- Website/private-fleets/index.html
- Website/private-investor-plan/index.html
- Website/safety/index.html
- Website/safety-compliance/index.html
- Website/scenario-walkthrough/index.html
- Website/sectors/index.html
- Website/settlements/index.html
- Website/solutions/index.html
- Website/trust-governance/index.html
- Website/walkthrough/index.html

## Old Demo Route Status
Retained routes returning 200:
- /demo/ - repurposed as BOF Video Library; older release-workflow content remains lower on the page.
- /demo-paths/ - retained for assessment/demo path compatibility.
- /animated-demo/ - retained but hidden from primary nav.
- /animated-demo-aggregator/ - retained but hidden from primary nav.
- /animated-demo-business/ - retained but hidden from primary nav.
- /executive-demo/ - retained and now includes BOF Vault video.
- /narration-export/ - retained for compatibility/internal production review.
- /walkthrough/ - retained.

Recommendation: do not delete old demo routes yet. Later, review analytics/link dependencies and decide whether /animated-demo*, /demo-paths/, and /narration-export/ should be archived, noindexed, or redirected into /demo/ or relevant assessment pages.

## Validation Results
Local server: http://127.0.0.1:8097/.

HTTP 200 route checks passed for:
- /
- /fleet/
- /founding-fleet/
- /founding-fleets/
- /fleet-operator-offer/
- /aggregator-outreach/
- /aggregator-partner-offer/
- /aggregator-command-center/
- /business-operations/
- /drivers/
- /document-readiness-engine/
- /executive-demo/
- /customer-portal/
- /customer-portal/load-intake/
- /customer-portal/billing/
- /scenario-walkthrough/
- /demo/
- /demo-paths/
- /animated-demo/
- /animated-demo-aggregator/
- /animated-demo-business/
- /narration-export/
- /walkthrough/

Video and poster asset HEAD checks returned 200 for all five MP4s and all five JPG posters.

Local href/src/action scan of changed pages found no missing local targets.

Phrase scan found no current hits for Book Demo, Schedule a Demo, Working Session, or Scenario Walkthrough in scanned HTML pages.

Top-level Demos nav scan returned 0 remaining <button ...>Demos</button> hits.

## Visual / Layout Checks
Headless Edge screenshots were captured at 1366, 1024, 768, and 390 widths for representative changed routes. Screenshot files:

- Website/reports/video-integration-screenshots/business-video-1024.png
- Website/reports/video-integration-screenshots/business-video-1366.png
- Website/reports/video-integration-screenshots/business-video-390.png
- Website/reports/video-integration-screenshots/business-video-768.png
- Website/reports/video-integration-screenshots/customer-video-1024.png
- Website/reports/video-integration-screenshots/customer-video-1366.png
- Website/reports/video-integration-screenshots/customer-video-390.png
- Website/reports/video-integration-screenshots/customer-video-768.png
- Website/reports/video-integration-screenshots/customer-video-section-1366.png
- Website/reports/video-integration-screenshots/customer-video-section-390.png
- Website/reports/video-integration-screenshots/demo-library-section-1366.png
- Website/reports/video-integration-screenshots/demo-library-section-390.png
- Website/reports/video-integration-screenshots/home-video-1024.png
- Website/reports/video-integration-screenshots/home-video-1366.png
- Website/reports/video-integration-screenshots/home-video-390.png
- Website/reports/video-integration-screenshots/home-video-768.png
- Website/reports/video-integration-screenshots/home-video-section-1366.png
- Website/reports/video-integration-screenshots/home-video-section-390.png
- Website/reports/video-integration-screenshots/video-library-1024.png
- Website/reports/video-integration-screenshots/video-library-1366.png
- Website/reports/video-integration-screenshots/video-library-390.png
- Website/reports/video-integration-screenshots/video-library-768.png

Spot checks found usable mobile first-view layout and readable generated posters. Playwright was unavailable because the bundled Node package is missing playwright-core; fragment-targeted screenshots did not reliably land on lower video sections, so route/asset validation is stronger than the automated visual-overflow evidence.

## Missing / Skipped Pages
All listed primary target pages existed. The standalone Website/request-shipment/index.html route does not exist; customer portal request-shipment exists under /customer-portal/request-shipment/ and was not changed.

## Customer Portal Impact
Customer portal workflows were preserved. The only customer portal page changes were adding video sections to /customer-portal/, /customer-portal/load-intake/, and /customer-portal/billing/, plus the stylesheet cache reference bump. No customer portal JavaScript or workflow state files were changed.

## Exact Files Intentionally Changed / Created
Core shared style:
- Website/assets/css/styles.css

Video files copied into active repo:
- Website/assets/videos/bof-aggregator.mp4 - 47677195 bytes
- Website/assets/videos/bof-business-operations.mp4 - 42496290 bytes
- Website/assets/videos/bof-customer-portal-load-intake.mp4 - 36880560 bytes
- Website/assets/videos/bof-driver-vault.mp4 - 37069319 bytes
- Website/assets/videos/bof-fleet-owner.mp4 - 36153815 bytes

Poster files created:
- Website/assets/images/video-posters/bof-aggregator.jpg - 98715 bytes
- Website/assets/images/video-posters/bof-business-operations.jpg - 91865 bytes
- Website/assets/images/video-posters/bof-customer-portal-load-intake.jpg - 101511 bytes
- Website/assets/images/video-posters/bof-driver-vault.jpg - 100853 bytes
- Website/assets/images/video-posters/bof-fleet-owner.jpg - 93379 bytes

Video embed/library pages:
- Website/index.html
- Website/fleet/index.html
- Website/founding-fleet/index.html
- Website/founding-fleets/index.html
- Website/fleet-operator-offer/index.html
- Website/aggregator-outreach/index.html
- Website/aggregator-partner-offer/index.html
- Website/aggregator-command-center/index.html
- Website/business-operations/index.html
- Website/drivers/index.html
- Website/document-readiness-engine/index.html
- Website/executive-demo/index.html
- Website/customer-portal/index.html
- Website/customer-portal/load-intake/index.html
- Website/customer-portal/billing/index.html
- Website/demo/index.html

Report and validation artifacts:
- Website/reports/video-integration-demo-nav-cleanup.md
- Website/reports/video-integration-screenshots/business-video-1024.png
- Website/reports/video-integration-screenshots/business-video-1366.png
- Website/reports/video-integration-screenshots/business-video-390.png
- Website/reports/video-integration-screenshots/business-video-768.png
- Website/reports/video-integration-screenshots/customer-video-1024.png
- Website/reports/video-integration-screenshots/customer-video-1366.png
- Website/reports/video-integration-screenshots/customer-video-390.png
- Website/reports/video-integration-screenshots/customer-video-768.png
- Website/reports/video-integration-screenshots/customer-video-section-1366.png
- Website/reports/video-integration-screenshots/customer-video-section-390.png
- Website/reports/video-integration-screenshots/demo-library-section-1366.png
- Website/reports/video-integration-screenshots/demo-library-section-390.png
- Website/reports/video-integration-screenshots/home-video-1024.png
- Website/reports/video-integration-screenshots/home-video-1366.png
- Website/reports/video-integration-screenshots/home-video-390.png
- Website/reports/video-integration-screenshots/home-video-768.png
- Website/reports/video-integration-screenshots/home-video-section-1366.png
- Website/reports/video-integration-screenshots/home-video-section-390.png
- Website/reports/video-integration-screenshots/video-library-1024.png
- Website/reports/video-integration-screenshots/video-library-1366.png
- Website/reports/video-integration-screenshots/video-library-390.png
- Website/reports/video-integration-screenshots/video-library-768.png

Additional HTML pages intentionally touched by nav removal and/or stylesheet cache reference bump are listed in the stylesheet-reference section above.

## Safety / Commit Readiness
No deploy occurred. No Vercel action occurred. No commit, push, staging, mirror, restore, or delete action occurred.

Safe to commit after review, with one caution: this pass includes a broad static HTML cache-reference bump and nav cleanup across many pages. Review the staged diff carefully and stage only intended Website/video/report files for this pass.

## Pre-Commit Isolation Review - 2026-07-03

Commands run:
- `git status --short`
- `git diff --stat`
- `git diff --name-only`

Repository state is not isolated. `git status --short` currently reports 379 changed/untracked/deleted lines, and `git diff --name-only` reports 256 tracked paths. The global diff includes many pre-existing or unrelated `.codex`, Website, governance, media, and utility changes. Do not commit the whole worktree.

Current Website-only diff summary:
- `git diff --stat -- Website`: 99 files changed, 4068 insertions, 1108 deletions.
- `git diff --name-only -- Website`: 99 tracked Website paths.

### Local Asset and Route Checks

Local server used for this review: `http://127.0.0.1:8098/`.

All five video assets exist locally and returned HTTP 200:
- `/assets/videos/bof-fleet-owner.mp4`
- `/assets/videos/bof-aggregator.mp4`
- `/assets/videos/bof-business-operations.mp4`
- `/assets/videos/bof-driver-vault.mp4`
- `/assets/videos/bof-customer-portal-load-intake.mp4`

All five poster assets exist locally and returned HTTP 200:
- `/assets/images/video-posters/bof-fleet-owner.jpg`
- `/assets/images/video-posters/bof-aggregator.jpg`
- `/assets/images/video-posters/bof-business-operations.jpg`
- `/assets/images/video-posters/bof-driver-vault.jpg`
- `/assets/images/video-posters/bof-customer-portal-load-intake.jpg`

All requested video embed pages contain both video and poster references:
- `Website/index.html`
- `Website/fleet/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleets/index.html`
- `Website/fleet-operator-offer/index.html`
- `Website/aggregator-outreach/index.html`
- `Website/aggregator-partner-offer/index.html`
- `Website/aggregator-command-center/index.html`
- `Website/business-operations/index.html`
- `Website/drivers/index.html`
- `Website/document-readiness-engine/index.html`
- `Website/executive-demo/index.html`
- `Website/customer-portal/index.html`
- `Website/customer-portal/load-intake/index.html`
- `Website/customer-portal/billing/index.html`
- `Website/demo/index.html`

HTTP route checks returned 200 for:
- `/`
- `/fleet/`
- `/aggregator-outreach/`
- `/business-operations/`
- `/drivers/`
- `/customer-portal/`
- `/demo/`
- `/demo-paths/`
- `/animated-demo/`
- `/animated-demo-aggregator/`
- `/animated-demo-business/`
- `/executive-demo/`
- `/narration-export/`
- `/walkthrough/`

### Navigation and CTA Checks

Top-level `Demos` nav scan returned 0 remaining `>Demos<` hits.

`Website/demo/index.html` is now headed as `BOF Video Library` and includes all five video files. The old demo routes still return 200 for compatibility.

No hits were found for these prohibited CTA phrases in scanned Website HTML/JS/CSS:
- `Book Demo`
- `Schedule a Demo`
- `Working Session`
- `Scenario Walkthrough`

### Cache-Bump Isolation

The following files are changed only by the `styles.css?v=1.51` cache-bump and had no other changed content in the tracked diff:
- `Website/customer-portal/assignment/index.html`
- `Website/customer-portal/documents/index.html`
- `Website/customer-portal/quotes/index.html`
- `Website/customer-portal/request-shipment/index.html`
- `Website/customer-portal/shipment-generator/index.html`
- `Website/customer-portal/shipments/index.html`
- `Website/customer-portal/tracking/index.html`

Those cache-bump-only files are safe if the commit intentionally includes the global `v=1.51` stylesheet reference update. Other `styles.css?v=1.51` paths are mixed with page edits, nav cleanup, video embeds, or pre-existing dirty work and need patch-level review.

Tracked diff parsing currently shows Demos nav removal hunks in:
- `Website/fleet-operator-offer/index.html`
- `Website/scenario-walkthrough/index.html`

Tracked video embed hunks currently appear in:
- `Website/customer-portal/billing/index.html`
- `Website/customer-portal/index.html`
- `Website/customer-portal/load-intake/index.html`
- `Website/demo/index.html`
- `Website/drivers/index.html`
- `Website/executive-demo/index.html`
- `Website/fleet/index.html`
- `Website/fleet-operator-offer/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleets/index.html`
- `Website/index.html`

Several requested video pages are currently untracked files, so `git add -p` cannot isolate only the video-related hunks inside them:
- `Website/aggregator-command-center/index.html`
- `Website/aggregator-outreach/index.html`
- `Website/aggregator-partner-offer/index.html`
- `Website/business-operations/index.html`
- `Website/document-readiness-engine/index.html`

### Customer Portal Isolation

The video integration itself only requires HTML/page-level embeds on customer portal routes, but the current working tree also has a tracked dirty JavaScript file:
- `Website/assets/js/customer-portal.js` - 27 changed lines.

Do not stage `Website/assets/js/customer-portal.js` for this commit unless that separate workflow change is reviewed and intentionally included. Because that JS file is dirty, the current worktree cannot prove that customer portal workflow behavior is unchanged as a whole; it can only prove that the video pass should not require workflow JavaScript changes.

### Visual Review

Headless Edge screenshots were captured outside the repository at:
- `C:\Users\syhol\AppData\Local\Temp\bof-video-review-screenshots-20260703-221122`

Desktop 1366px checks showed the requested pages rendering and video modules appearing as expected.

Mobile 390px checks found horizontal clipping/overflow on existing page heroes and customer-portal layout areas:
- `/` hero headline clips on the right.
- `/business-operations/` hero headline and long label clip on the right.
- `/customer-portal/` top tabs and long headings clip on the right.

These mobile issues mean the visual review is not clean. They appear broader than the video embeds themselves, but they should be fixed or consciously deferred before treating the visual QA as passed.

### Pre-Commit Recommendation

Do not commit the current worktree as-is.

Files that can be considered for this commit after patch-level review:
- `Website/assets/css/styles.css`
- `Website/assets/videos/bof-aggregator.mp4`
- `Website/assets/videos/bof-business-operations.mp4`
- `Website/assets/videos/bof-customer-portal-load-intake.mp4`
- `Website/assets/videos/bof-driver-vault.mp4`
- `Website/assets/videos/bof-fleet-owner.mp4`
- `Website/assets/images/video-posters/bof-aggregator.jpg`
- `Website/assets/images/video-posters/bof-business-operations.jpg`
- `Website/assets/images/video-posters/bof-customer-portal-load-intake.jpg`
- `Website/assets/images/video-posters/bof-driver-vault.jpg`
- `Website/assets/images/video-posters/bof-fleet-owner.jpg`
- `Website/index.html`
- `Website/fleet/index.html`
- `Website/founding-fleet/index.html`
- `Website/founding-fleets/index.html`
- `Website/fleet-operator-offer/index.html`
- `Website/aggregator-outreach/index.html`
- `Website/aggregator-partner-offer/index.html`
- `Website/aggregator-command-center/index.html`
- `Website/business-operations/index.html`
- `Website/drivers/index.html`
- `Website/document-readiness-engine/index.html`
- `Website/executive-demo/index.html`
- `Website/customer-portal/index.html`
- `Website/customer-portal/load-intake/index.html`
- `Website/customer-portal/billing/index.html`
- `Website/demo/index.html`
- `Website/customer-portal/assignment/index.html`
- `Website/customer-portal/documents/index.html`
- `Website/customer-portal/quotes/index.html`
- `Website/customer-portal/request-shipment/index.html`
- `Website/customer-portal/shipment-generator/index.html`
- `Website/customer-portal/shipments/index.html`
- `Website/customer-portal/tracking/index.html`
- `Website/reports/video-integration-demo-nav-cleanup.md`

Files that should not be staged for this video/nav/cache-bump commit:
- `Website/assets/js/customer-portal.js`
- `Website/reports/video-integration-screenshots/*.png` unless validation screenshots are intentionally kept in the repo.
- Any unrelated `.codex`, governance, utility, backup, deleted, or pre-existing Website dirty files.

Recommended commit message once the mobile visual findings are fixed or explicitly deferred:
- `Integrate BOF video library and clean demo navigation`
