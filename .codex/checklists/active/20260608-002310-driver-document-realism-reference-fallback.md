# Checklist: Driver Document Realism Pass With Reference Asset Fallback

Created: 2026-06-08 00:23:10 -05:00
Source: Goal objective and proposed plan from 2026-06-08
Owner persona: `checklist-execution-steward`
Status: complete

## Scope

Complete the interactive-demo driver documentation pass: 20+ clickable realistic driver documents per driver, realistic synthetic license/document surfaces, and non-deployable reference asset fallback inventory.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| DDR-001 | Proposed plan | Back up `Website` before broad demo driver edits. | complete | `.codex/backups/website/website-20260608-002325-before-driver-document-realism-reference-fallback.zip` created; 118 files, SHA-256 `A4A9F34899AAC5646161F113CD36C035114C92139F893B8900663DC69A548B84`. |  |
| DDR-002 | Proposed plan; reference auditor | Inventory current driver pages, current document count, portraits, and reference manifest paths. | complete | Found 12 active driver routes under `Website/interactive-demo/drivers/`, 12 unique driver portraits under `Website/assets/images/profiles/drivers/`, and reference manifest `bof-web-Original/bof-web/lib/generated/driver-doc-manifest.json` with 12 drivers / 173 rows. | Previous visible doc counts were 14/15 and missing explicit resume, prior employer inquiry, and road test/annual review surfaces. |
| DDR-003 | Proposed plan | Expand each demo driver page to a 20+ document packet with explicit resume/work history, prior employer inquiry, road test/annual review, safety acknowledgements, and dispatch eligibility documents. | complete | `Website/assets/js/interactive-demo-routes.js` now renders 23 driver document buttons and all driver `docCount` labels read `23 driver documents`; rendered audit passed 23-document counts for `drv-001`, `drv-003`, and `drv-006`. |  |
| DDR-004 | Proposed plan; synthetic completeness follow-up | Replace stylized license preview with a realistic synthetic HTML driver's license using each driver's unique portrait. | complete | `driverLicenseCard()` renders synthetic CDL front/back, class, endorsements, issued/expires, DOB, address, signature, barcode, restrictions, and driver portrait; rendered audit confirmed portrait/license fields for sampled drivers. Follow-up screenshot: `.codex/reports/visual-snapshots/driver-document-realism-pass-drv001/unmasked-synthetic-license-desktop.png`. | No raw reference license numbers exposed in `Website`; fictional values are used for demo inspection. |
| DDR-005 | Proposed plan; synthetic completeness follow-up | Ensure every driver document button opens a paper-like HTML surface with owner, status, review date, expiration/renewal, consequence, next action, reviewer/signature, and audit trail. | complete | Driver paper surfaces include file stamp, owner, status, review date, expiration/renewal, document-specific proof, evidence reviewed, dispatch consequence, next action, reviewer, and audit trail; rendered audit confirmed 23 documents each for `drv-001`, `drv-003`, and `drv-006`. Follow-up rendered audit checked 69 opened document surfaces and found no masked/private placeholder wording. | Mobile key-value tables stack or scroll inside the document panel instead of clipping the shell. |
| DDR-006 | Proposed plan | Create non-deployable reference asset fallback inventory and copy only found reference driver document assets under `.codex/references/reference-driver-document-assets/`. | complete | `.codex/scripts/gather-reference-driver-assets.ps1` created reports under `.codex/references/reference-driver-document-assets/`; inventory rows: 173, copied files: 0, missing files: 173. | Physical old generated document assets were not found in safe reference locations, so the fallback now documents the missing asset list for future recovery. Do not wire into public `Website`. |
| DDR-007 | Proposed plan | Verify syntax, routes, click behavior, visual snapshots, and private-value/stale-language searches. | complete | `node --check Website/assets/js/interactive-demo-routes.js`, `node --check Website/assets/js/site.js`, 12 route `200` checks, 31 rendered click checks, desktop/mobile snapshots, mobile width probe, and stale/private-value scans all passed. | Runtime audit left only existing preview server on port 3000. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/interactive-demo-routes.js`; `node --check Website/assets/js/site.js`. |
| Route checks | complete | `/interactive-demo/drivers/drv-001/` through `/interactive-demo/drivers/drv-012/` all returned `200` from `http://localhost:3000`. |
| Click behavior check | complete | Playwright rendered audit passed 31 checks across `drv-001`, `drv-003`, and `drv-006`, including 23 clickable docs, license portrait/fields, added docs, dispatch eligibility, and DRV-003 medical-card hold. |
| Browser/rendered check | complete | Snapshot output: `.codex/reports/visual-snapshots/driver-document-realism-pass-drv001/`; inspected desktop, mobile first-screen, and focused mobile license viewer screenshots. |
| Source/privacy/stale-copy scans | complete | `rg` scan found no stale `14 driver documents` / `15 driver documents`, no sampled raw reference license values, no public wiring to `.codex/references/reference-driver-document-assets`, and after the synthetic follow-up no masked/private placeholder document wording in `Website/assets/js/interactive-demo-routes.js` or `Website/interactive-demo/`. |
| Runtime cleanup audit | complete | `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` shows only the existing `python -m http.server 3000` preview server; snapshot leftovers were stopped. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: DDR-001 through DDR-007.
- Remaining:
- Blocked:
- Deferred: Reference physical document assets were not recoverable from the searched reference locations; the non-deployable missing-asset inventory is preserved for fallback recovery if the client rejects synthetic HTML documents.
- Verification: Syntax, route, rendered click, desktop/mobile snapshot, mobile width, privacy/stale-copy, synthetic no-masked-document scan, and runtime audits passed.

