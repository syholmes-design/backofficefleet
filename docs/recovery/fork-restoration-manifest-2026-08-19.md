# Fork Restoration Manifest — 2026-08-19

## Recovery roots

- Recovered fork root (immutable source): `C:\Users\syhol\BOF-Fork-Recovery\recovery-20260819-094803\fork`
- Restored fork root (authoritative repo recovery copy): `C:\Users\syhol\OneDrive\Documents\GitHub\backofficefleet\bof-web\recovered\fork-restored-20260819`

## File counts

- Recovered source files (total): **731**
- Restored files: **664**
- Excluded files: **67**
  - Deployment-only artifacts excluded: **38**
    - `.bof-deploy-manifest*.json`
    - `.ftpquota`
    - `.htaccess.bk`
    - `htaccess-backup`
  - Embedded nested Git metadata excluded: **29**
    - `BOF-Remastered/.git/**`

## Homepage

- Restored homepage file: `recovered/fork-restored-20260819/index.html`
- Local verification URL: `http://127.0.0.1:4180/`

## Major recovered routes (verified)

- `/`
- `/customer-portal/load-intake/`
- `/drivers/`
- `/document-readiness-engine/`
- `/operations-record/release-readiness-1842/`
- `/dispatch/`
- `/safety/`
- `/operations-record/delivery-proof-1907/`
- `/settlements/`
- `/business-operations/`
- `/capacity-intelligence/`
- `/operational-intelligence/`
- `/command-center/`

All routes above returned HTTP `200` during local static verification.

## Major asset directories

- `assets/css/`
- `assets/js/`
- `assets/images/`
- `assets/audio/`
- `assets/videos/`
- `assets/data/`
- `video-assets/`

## Interactive/demo surfaces (restored)

- `/interactive-demo/`
- `/interactive-demo/drivers/`
- `/interactive-demo/dispatch/`
- `/scenario-walkthrough/`
- `/customer-portal/load-intake/`
- `/dispatch/`
- `/operations-record/release-readiness-1842/`

## Dependency and runtime checks

- Local static server verification passed for representative page and asset set.
- JavaScript runtime checks on representative pages confirmed:
  - `window.bofPath` present (fork path compatibility script loaded)
  - cinematic navigation script active on dispatch page
  - no page JavaScript errors during representative reload checks

## Unresolved dependencies

- No missing local file dependencies found in the representative verification set.
- Non-file form/action references present in customer portal page (`load-sample`, `reset-request`, `calculate-quote`, `prepare-packet`) are page-level interaction hooks, not missing file assets.

## Files not restored

- No source files were skipped beyond the explicit exclusion list above.

## Safety confirmations

- The immutable recovery source directory was not modified.
- No production, FTP/FTPS, Vercel, DNS, runtime, or `/fork/` deployment actions were performed.

