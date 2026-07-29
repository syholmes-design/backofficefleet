# Global Shell Inventory

## Pre-Flight Findings

Starting state had multiple shell families:

- `site-header`: 101
- `bof-ds2-header`: 8
- `wave3-header`: 6
- `portal-topbar`: 10
- interactive demo app headers: retained

Footer families:

- `site-footer`: 95
- `bof-ds2-footer`: 8
- `wave3-footer`: 6
- `portal-footer`: 1
- interactive demo app footer: retained

## Logo Findings

- `Website/assets/images/logo/boflogo-original.png`: 216x44
- `Website/assets/brand/bof-design-system-2/svg/header-lockup.svg`: viewBox 0 0 760 150
- `Website/assets/brand/bof-design-system-2/png/symbol-plus-bof-1x.png`: 720x260
- `Website/assets/brand/bof-design-system-2/png/symbol-plus-bof-2x.png`: 1440x520
- `Website/assets/brand/bof-design-system-2/png/symbol-plus-bof-3x.png`: 2160x780
- `Website/assets/images/design-system-2/customer-demo-secondary-headers/backofficefleet-logo-approved.png`: 211x62

## Correction

The public runtime shell now replaces older public header/footer families with one canonical shell. Source logo references to `header-lockup.svg` on Wave 2/Wave 3 public pages were changed to the approved PNG logo.

Portal and app shells remain separate.
