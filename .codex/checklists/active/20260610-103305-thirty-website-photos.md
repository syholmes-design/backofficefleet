# Plan Checklist: Thirty Website Photo Realism Pass

Created: 2026-06-10 10:33:05 -05:00
Source:

- User request: "Add 30 more photo realistic images to the website, but not the demo."

Owner persona: `checklist-execution-steward`
Status: complete

## Requirements

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| PH-001 | User request | Generate 30 additional photo-realistic images. | complete | Generated 31 candidates; selected the newest 30 for the site. Candidate contact sheet: `.codex/snapshots/thirty-photo-pass/generated-candidates-contact-sheet.jpg`. | BOF documentary fleet photography style; no demo routes. |
| PH-002 | User request / performance rules | Compress the generated images into site-ready assets. | complete | `Website/assets/images/photos/site-pass/` contains 30 WebP files totaling 2,768,490 bytes. Compression pass reduced source PNGs from 57.5 MB to 2.6 MB. | Temporary PNG staging folder and compression report were removed from `Website`. |
| PH-003 | User request | Add the 30 new images to website pages, but not the demo. | complete | 30 references found in public website pages; 0 references under `Website/demo`, `Website/demo-paths`, or `Website/interactive-demo`. | Added to `/`, `/solutions/`, `/documents/`, `/drivers/`, `/dispatch/`, `/dashboard/`, and `/founding-fleet/`. |
| PH-004 | Project visual rules | Preserve aspect ratio and avoid squished/cropped-looking people or tables. | complete | Added `.website-photo-grid` and `.website-photo-card` CSS with `aspect-ratio: 16 / 9`, `object-fit: cover`, responsive grid breakpoints, and lazy-loaded images. | Prevents the prior squished-image failure mode. |
| PH-005 | Cache rule | Bump CSS cache version after visual/CSS changes. | complete | Ran `.codex/scripts/bump-website-cache-version.ps1 -Version 1.20`; 50 HTML files updated. | CSS changed; shared JS was not changed. |
| PH-006 | Validation | Verify file count, non-demo placement, JS syntax, rendered layout, and no leftover preview process. | complete | `node --check Website/assets/js/site.js` passed; screenshot set captured under `.codex/snapshots/thirty-photo-pass/`; final audit showed no preview PID files. | One Edge full-page screenshot captured reveal animations mid-fade, so source/search/file-count evidence is the primary closeout proof. |

## Placement Completed

| Page / Surface | Count | Evidence |
|---|---:|---|
| Homepage `/` | 6 | `Website/index.html` references images 01-06. |
| Solutions `/solutions/` | 4 | `Website/solutions/index.html` references images 07-10. |
| Documents `/documents/` | 4 | `Website/documents/index.html` references images 11-14. |
| Drivers `/drivers/` | 4 | `Website/drivers/index.html` references images 15-18. |
| Dispatch `/dispatch/` | 4 | `Website/dispatch/index.html` references images 19-22. |
| Dashboard `/dashboard/` | 4 | `Website/dashboard/index.html` references images 23-26. |
| Founding Fleet `/founding-fleet/` | 4 | `Website/founding-fleet/index.html` references images 27-30. |
| Total | 30 | `rg "assets/images/photos/site-pass" Website` returns 30 references. |

## Progress

| Metric | Count |
|---|---:|
| Closed items | 6 |
| Total items | 6 |
| Remaining items | 0 |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| 30 new images exist | complete | 30 WebP files in `Website/assets/images/photos/site-pass/`. |
| 30 images placed outside demo routes | complete | 30 total refs; 0 refs in demo/interactive routes. |
| Images are compressed | complete | 2.6 MB total WebP output. |
| Cache-busting version updated | complete | CSS refs at `styles.css?v=1.20`. |
| Render/syntax check complete | complete | JS syntax passed; screenshots captured; preview server stopped. |
