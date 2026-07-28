# Wave 2 Route Demo Integration Report

Status: BOF WAVE 2 ROUTE AND DEMO INTEGRATION - READY FOR OWNER REVIEW

## Baseline

- Integration worktree: `C:\Users\syhol\BOF-wave-2-route-demo-integration`
- Integration branch: `codex/wave-2-route-demo-integration`
- Base branch: `codex/design-system-2-wave-2`
- Base commit: `f511de3bf48cce5d50c7a166e51a84c25d03af98`
- Route-governance commit reconciled: `555a05c2e9a074f23b551caf2c02cad4d9204b51`

## Summary

The corrected Wave 2 public pages remain the authority for Documents, Policies & Procedures, and BOF Vault. Route-governance changes were reproduced surgically so the corrected Policies hero, BOF Vault hero, Wave 2 dashboards, proof rails, videos, claims controls, and page designs were preserved.

The unified hidden demo shell now lives at `/customer-demo/`, uses a DS2-aligned product UI, and supports deterministic portal states for manager, driver, customer, safety, maintenance, finance, BOF Vault, and Policy Governance.

## Policies Hero Labels

- Clean source preserved: `Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-clean.png`
- Derived labeled asset: `Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-labeled.png`
- Script: `tools/design-system-2/create_policies_hero_labels.py`
- Labels used: Safety & Compliance Manual, Driver Qualification Policy, Hours-of-Service Procedures, Cargo Securement Policy
- Result: restrained low-contrast spine labels, not baked hero text.
- Mobile result: labels remain visible in the existing mobile crop and do not overlap the live message panel.

## Conflict Review

Overlapping files between corrected Wave 2 and route governance:

- `Website/policies-procedures/index.html`
- `Website/bof-vault/index.html`

Resolution:

- Preserved corrected Wave 2 hero assets and hero positioning.
- Added route-governance canonical tags and CTA targets manually.
- Did not restore older route-governance versions of the overlapping pages wholesale.

## QA Result

Validated at:

- `1440 x 1000`
- `1366 x 768`
- `1280 x 800`
- `1024 x 768`
- `768 x 1024`
- `390 x 844`

Checks completed:

- Public CTA transitions to the expected `/customer-demo/` portal states.
- `/customer-demo/` direct URL access, reload, Back, and Forward behavior.
- Mobile demo navigation.
- Policy Governance record-action feedback.
- No horizontal overflow across the tested route set and viewport set.
- Duplicate ID, `aria-controls`, anchor, sitemap, robots, and hidden-route checks.
- JavaScript syntax checks for `customer-demo-app.js` and `interactive-demo-routes.js`.

Screenshot directory:

`docs/design-system-2/screenshots/wave-2-route-demo-integration-review/`

## Deployment Recommendation

Do not deploy automatically. Owner should review screenshots and reports first. Legacy `/interactive-demo/*` routes should remain available, noindex, nofollow, and excluded from the sitemap until all unique legacy behavior is migrated or owner-approved redirect mappings are activated.

