# BOF Design System 2.0 Wave 1 Dashboard Prominence Report

## Status

BOF DESIGN SYSTEM 2.0 WAVE 1 DASHBOARD PROMINENCE - READY FOR OWNER REVIEW

## Scope

- Worktree: `C:\Users\syhol\BOF-design-system-2-wave-1`
- Branch: `codex/design-system-2-wave-1`
- Starting commit: `862a1546eafdd927133393934ae1ad30aec6dfe8`
- Routes refined: `/drivers/`, `/dispatch/`, `/safety/`, `/settlements/`
- Protected public-site worktree, customer-demo worktree, Supabase, FTP upload, push, merge, and deploy: not used.

## Reason for Follow-Up

The Wave 1 pages had strong clean hero imagery, proof rails, capability cards, and Freight Brace sections, but the product previews still read too small. The dashboard and portal areas needed to feel like a working BOF operating surface, not thumbnail decorations below the hero.

## What Changed

### Drivers

- Enlarged the Driver Portal preview into the main proof area below the capability cards.
- Added a readable stat row for release state, HOS, open documents, and support items.
- Added a featured active-load record and two supporting detail records.
- Kept the mobile portal preview, but made it secondary to the larger desktop portal view.
- Corrected the Driver Portal CTA to remain on the current page section rather than linking to a missing route.

### Dispatch

- Enlarged the Load Queue and Selected Load preview into a two-panel command view.
- Added visible load queue rows with status labels.
- Added a selected-load panel showing status, blocker, reason, owner, clearance, and consequence.
- Kept the existing dispatch workflow, proof, video, and CTA sequence intact.

### Safety

- Enlarged the Safety & Compliance Portal preview.
- Added readable safety counts and the operating condition behind blocked, review, and ready states.
- Preserved the side gate logic for driver, load, owner, and evidence readiness.
- Kept Freight Brace only where it explains cargo-securement proof and evidence.

### Settlements

- Enlarged the Packet Health and Settlement Record preview.
- Added packet-health queue rows and a packet-to-pay record view.
- Added readable finance fields for line haul, fuel surcharge, accessorials, deductions, gross total, and net context.
- Kept hold reason, owner, clearance path, and release status visible.

## Layout and Readability Results

The dashboard sections are now substantially wider and more legible on desktop:

- Drivers: 1208 px at 1440 viewport; 1211 px at 1366 viewport.
- Dispatch: 1208 px at 1440 viewport; 1211 px at 1366 viewport.
- Safety: 1208 px at 1440 viewport; 1211 px at 1366 viewport.
- Settlements: 1208 px at 1440 viewport; 1211 px at 1366 viewport.

Typography was also raised inside the preview frames:

- Frame headings: about 17.3-18.7 px across captured desktop/tablet views.
- Record body copy: about 15.0-15.8 px.
- Status labels: about 11.5 px, retained as compact badges.
- Metric numbers: enlarged through the shared stat treatment.

## Responsive Results

Captured screenshots and targeted Edge checks show no horizontal overflow at:

- 1440 px desktop
- 1366 px desktop
- 1280 px desktop
- 1024 px tablet/desktop transition
- 768 px tablet
- 390 px mobile

Additional static route checks confirmed the affected pages return 200 locally. The first broader Playwright rerun timed out after the screenshot package had already been generated, then a targeted Microsoft Edge run completed successfully for 1280 px and 1024 px.

## Screenshot Package

Folder:

`docs/design-system-2/screenshots/wave-1-dashboard-prominence-review/`

Files:

- `drivers-dashboard-1440.png`
- `drivers-dashboard-1366.png`
- `drivers-dashboard-tablet.png`
- `drivers-dashboard-mobile.png`
- `drivers-dashboard-section-full.png`
- `drivers-full-page.png`
- `dispatch-dashboard-1440.png`
- `dispatch-dashboard-1366.png`
- `dispatch-dashboard-tablet.png`
- `dispatch-dashboard-mobile.png`
- `dispatch-dashboard-section-full.png`
- `dispatch-full-page.png`
- `safety-dashboard-1440.png`
- `safety-dashboard-1366.png`
- `safety-dashboard-tablet.png`
- `safety-dashboard-mobile.png`
- `safety-dashboard-section-full.png`
- `safety-full-page.png`
- `settlements-dashboard-1440.png`
- `settlements-dashboard-1366.png`
- `settlements-dashboard-tablet.png`
- `settlements-dashboard-mobile.png`
- `settlements-dashboard-section-full.png`
- `settlements-full-page.png`
- `dashboard-measurements.json`

## Validation

Passed:

- `node --check Website\assets\js\bof-design-system-2-preview.js`
- `node --check Website\assets\js\site.js`
- `node Website\tools\validate-bof-public-operations.js`

Public operations validator result:

- 12 drivers
- 5 loads
- 4 exceptions
- 0 warnings
- 0 errors

Route checks passed locally:

- `/`
- `/drivers/`
- `/dispatch/`
- `/safety/`
- `/settlements/`
- `/documents/`
- `/command-center/`
- `/operations-record/`

Content checks:

- No local Windows paths, localhost links, or secret-like strings were found in the changed Wave 1 pages or shared CSS.
- The only guarantee-related language found is protective disclaimer language.
- Duplicate ID scan found no duplicate IDs in the four changed HTML files.

## Remaining Notes

- The older untracked folder `docs/design-system-2/screenshots/wave-1-clean-hero-assets/` remains intentionally unstaged and is not part of this pass.
- The bridge receive dry run timed out earlier; no bridge bundle was processed, acknowledged, moved, deleted, or downloaded.
- RustDesk was running and configured in HKCU Run, but this dashboard-prominence task did not require remote-control work.
