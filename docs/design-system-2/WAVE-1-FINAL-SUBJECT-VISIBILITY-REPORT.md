# BOF Design System 2.0 Wave 1 Final Subject Visibility Report

Status: BOF DESIGN SYSTEM 2.0 WAVE 1 HERO SUBJECT VISIBILITY - READY FOR OWNER REVIEW

## Scope

This pass corrected the Wave 1 hero image composition for:

- `/drivers/`
- `/dispatch/`
- `/safety/`
- `/settlements/`

The work uses approved clean hero images only. No text was embedded into the images. Existing page copy, navigation, logo treatment, proof rails, dashboard previews, Freight Brace sections, and calls to action were preserved unless already part of the page structure.

## Worktree

- Worktree: `C:\Users\syhol\BOF-design-system-2-wave-1`
- Branch: `codex/design-system-2-wave-1`
- Starting HEAD for this correction pass: `caa1c2715990a434a5170600cf37b6899a0cb47d`

## Hero Assets

All four approved clean hero images are present in `Website/assets/images/design-system-2/wave-1/`.

| Page | Asset | Dimensions | Size |
| --- | --- | ---: | ---: |
| Drivers | `ds2-drivers-hero-clean.png` | 1672 x 941 | 1,789,580 bytes |
| Dispatch | `ds2-dispatch-hero-clean.png` | 1672 x 941 | 1,479,299 bytes |
| Safety | `ds2-safety-hero-clean.png` | 1672 x 941 | 1,925,496 bytes |
| Settlements | `ds2-settlements-hero-clean.png` | 1672 x 941 | 1,633,083 bytes |

## Implementation Summary

- Updated the four page hero references to the approved clean PNG assets.
- Kept each page on the single-panel DS2 hero composition.
- Adjusted responsive hero structure so mobile and tablet use a subject-safe photo row followed by the copy panel.
- Set page-specific mobile focal positions where needed:
  - Drivers: `76% top`
  - Dispatch: `82% top`
  - Safety: `70% top`
  - Settlements: `84% top`
- Kept the proof rail below the hero as a separate visual layer.
- Removed the subject-obscuring pseudo overlay for the subject-clear hero mode.

## Subject Visibility Results

| Page | Desktop 1440/1366/1280 | Tablet 1024/768 | Mobile 390 | Result |
| --- | --- | --- | --- | --- |
| Drivers | Subject face, torso, truck, and proof rail visible | Photo row and panel stack cleanly | Face, torso, truck, and panel visible without horizontal clipping | Pass |
| Dispatch | Dispatcher face, headset, screens, and proof rail visible | Subject-safe crop retained | Face, headset, and panel visible without horizontal clipping | Pass |
| Safety | Open truck, worker, tablet, and proof rail visible | Open trailer context remains clear | Open truck, worker, tablet, and panel visible without horizontal clipping | Pass |
| Settlements | Worker, tablet, dashboard background, and proof rail visible | Subject-safe crop retained | Face, hands, tablet, and panel visible without horizontal clipping | Pass |

## Screenshot Evidence

Screenshots were captured with a fresh local preview session and cache-disabled browser flags. Evidence is stored at:

`C:\Users\syhol\BOF-design-system-2-wave-1\docs\design-system-2\screenshots\wave-1-final-subject-visibility`

The folder contains 38 PNG screenshots:

- Four page desktop hero captures at 1440, 1366, and 1280 widths.
- Four page tablet captures at 1024 and 768 widths.
- Four page mobile captures at 390 width.
- Four full-page desktop captures.
- Four proof-rail captures.
- Four dashboard/preview captures.
- Two header captures at 1440 and 1366 widths.

Visual review notes:

- No horizontal overflow was visible in the reviewed desktop, tablet, or mobile captures.
- The page subject is no longer trapped behind the copy panel on mobile.
- The proof rail remains separate from the hero image and does not cover the subject.
- Header captures show the DS2 header rendering above the hero without subject overlap.

## Validation

Commands run from `C:\Users\syhol\BOF-design-system-2-wave-1`:

```powershell
node --check Website/assets/js/bof-design-system-2-preview.js
node --check Website/assets/js/site.js
node Website/tools/validate-bof-public-operations.js
```

Results:

- JavaScript syntax checks passed.
- Public operations validator passed.
- Driver count: 12.
- Load count: 5.
- Exception count: 4.
- Warnings: 0.
- Errors: 0.

Local route checks:

| Route | Status |
| --- | ---: |
| `/drivers/` | 200 |
| `/dispatch/` | 200 |
| `/safety/` | 200 |
| `/settlements/` | 200 |

## Bridge And Remote-Support Notes

- RustDesk was running locally with startup evidence present.
- FTP bridge dry-run receive script timed out after 120 seconds.
- No bridge bundle was downloaded, acknowledged, deleted, moved, or processed.
- Bridge follow-through remains blocked until the receive script completes successfully.

## Safety Confirmations

- No deployment was performed.
- Nothing was pushed.
- Nothing was merged.
- Nothing was uploaded.
- No Supabase service was accessed.
- The protected public-site worktree was not touched.
- Customer-demo files were not touched.
- Freight Brace sections were not removed or altered.

