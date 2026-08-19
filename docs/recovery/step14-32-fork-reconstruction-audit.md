# STEP 14.32 Fork Reconstruction Audit (Isolated Branch)

Date: 2026-08-19
Branch: `recovery/fork-reconstruction-20260819`
Authoritative repo root: `C:\Users\syhol\OneDrive\Documents\GitHub\backofficefleet\bof-web`
Recovered immutable artifact root: `C:\Users\syhol\BOF-Fork-Recovery\recovery-20260819-094803\fork`

## Safety and Scope

- Recovered artifact tree was treated as immutable.
- No FTP/FTPS, production, DNS, runtime, or `/fork/` changes were performed.
- No deployment actions were performed.

## Baseline Lineage Analysis

- Baseline commit inspected: `46b2c4649e452a07732d9e1ef5266eda3544d69f`
  - Message: `Strengthen Business Operations HR and Finance tiers`
- Parent: `9abf61c4e84c44cb8cd549fa7838cce537319af0`
  - Message: `Audit and extend BOF lifecycle readiness gates`
- Immediate child: `f09f6fba208e8b75cbd64abd4efb6f87a1ef15f4`
  - Message: `Integrate public site redesign without removing existing routes`

Baseline `46b2c464` contains a static website source tree under `Website/` (220 files).
The child `f09f6fba` and later lineage add broader operational-depth pages/assets and
align with recovered deploy-manifest commit tokens.

## Recovered Integrity

- Recovered total files (including embedded `.git` metadata): **731**
- Recovered payload files (excluding embedded `.git` metadata): **702**
- Prior recovery verification artifacts confirm remote/local parity for recovered set.

## Source-to-Artifact Mapping Snapshot

Full mapping artifact generated at session path:

- `C:\Users\syhol\.copilot\session-state\68eca229-2bef-43fe-9b39-ffd83101e3a3\files\step14-32-recovered-to-source-mapping.csv`
- `C:\Users\syhol\.copilot\session-state\68eca229-2bef-43fe-9b39-ffd83101e3a3\files\step14-32-module-coverage-comparison.csv`

Mapping counts:

- `deployment-manifest-artifact`: 35
- `hosting-artifact`: 3
- `historical-source-only-missing-in-step14`: 295
- `mapped-to-current-step14`: 5
- `no-git-source-match`: 364

Recovered-vs-historical `Website/` commit coverage:

- `46b2c464`: 219 / 702 recovered paths match
- `e7a6c7b8`: 279 / 702 recovered paths match
- `38b896fc`: 293 / 702 recovered paths match
- `66929e67`: 293 / 702 recovered paths match

## Static vs Source vs Deployment Classification

### A) Reconstruct as source candidates

- Historical `Website/` pages and scripts with commit provenance, including:
  - `customer-portal/*`
  - `document-readiness-engine/*`
  - `dispatch/*`
  - `operations-record/*`
  - `safety*`, `settlements*`, `business-operations*`
  - `capacity-intelligence/*`, `operational-intelligence/*`, `command-center/*`

### B) Generated/static output to regenerate where runtime equivalents exist

- Static HTML experiences that now have active Next.js app/runtime routes in Step 14,
  e.g. dispatch/drivers/safety/settlements/command-center overlaps.

### C) Asset imports (candidate)

- Visual/audio/video bundles with no current Step 14 equivalent but strategic value:
  - `assets/images/cinematic/*`
  - `assets/css/cinematic-site.css`
  - `assets/js/cinematic-nav.js`, `assets/js/fork-path-v2.js`
  - selected `assets/audio/animated-demo/*`, `assets/videos/*`

### D) Deployment-only artifacts (do not import into product source)

- `.bof-deploy-manifest*.json`
- `.ftpquota`
- `.htaccess.bk`
- `htaccess-backup`

### E) Obsolete/duplicate review candidates

- Any static page superseded by mature Step 14 runtime flows with stronger data model/API coupling.

## Hardened Module Evidence (Recovered Artifact)

Recovered tree includes static operational surfaces for:

- load intake
- driver intake/readiness
- document readiness
- dispatch and release decision context
- safety/compliance
- settlements/billing
- business operations
- customer portal
- operational/capacity intelligence

Recovered operational pages explicitly present static-demo disclaimers in content; this
supports treating them as hardened narrative/UX artifacts, not direct runtime logic.

## Reconstruction Status in This Step

- Isolated branch created.
- Baseline lineage verified with parent/child and downstream commit-token correlation.
- Recovered-to-source mapping and module comparison completed and captured.
- No application/runtime/production deployment changes performed.

