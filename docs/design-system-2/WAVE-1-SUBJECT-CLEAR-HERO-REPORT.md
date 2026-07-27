# Wave 1 Subject-Clear Hero and Portal System QA Report

Status: BOF WAVE 1 SUBJECT-CLEAR HERO AND PORTAL SYSTEM - READY FOR OWNER REVIEW

Date: 2026-07-27

Worktree: `C:\Users\syhol\BOF-design-system-2-wave-1`

Branch: `codex/design-system-2-wave-1`

## Scope

This pass corrected the Wave 1 Drivers, Dispatch, Safety, and Settlements public pages so the hero subject remains visible and the hero no longer carries metric cards over the photo. The operational metrics now sit in proof rails below the hero. The real portal/dashboard preview appears immediately after the hero, proof rail, and capability cards.

No production deployment, push, merge, upload, Supabase access, or protected worktree modification was performed.

## Local Commits

- `980d358a` - `Prove approved Drivers subject-clear hero`
- `aa3b7754` - `Apply subject-aware heroes to Dispatch, Safety, and Settlements`
- `81aef0ee` - `Add prominent portal/dashboard previews`
- This report package - `Add cache-free subject-clear QA`

## Page Sequence Verified

For all four Wave 1 pages:

1. Hero
2. Proof rail
3. Capability cards
4. Large readable portal/dashboard preview
5. Workflow and supporting evidence
6. Video and closing CTA where already present

Verified preview anchors:

- Drivers: `#driver-portal-preview`
- Dispatch: `#dispatch-dashboard-preview`
- Safety: `#safety-portal-preview`
- Settlements: `#finance-readiness`

## Screenshot Evidence

Screenshot directory:

`docs/design-system-2/screenshots/wave-1-subject-clear-hero-review/`

Captured viewport screenshots for each page:

- `1440x1000`
- `1366x768`
- `1280x800`
- `1024x768`
- `768x1024`
- `390x844`

Additional evidence:

- `header-1440.png`
- `header-1366.png`
- `drivers-proof-rail-1440.png`
- `drivers-portal-dashboard-preview-1440.png`
- `dispatch-portal-dashboard-preview-1440.png`
- `safety-portal-dashboard-preview-1440.png`
- `settlements-portal-dashboard-preview-1440.png`
- `drivers-1440x1000-annotated-zones.png`
- `dispatch-1440x1000-annotated-zones.png`
- `safety-1440x1000-annotated-zones.png`
- `settlements-1440x1000-annotated-zones.png`

## Visual QA Summary

Drivers:

- Desktop, tablet, and mobile keep the driver face, hair, upper body, folded arms, and truck visible.
- Message panel remains separate from the subject zone.
- Proof rail appears below the hero.
- Driver Portal preview appears immediately after capability cards.

Dispatch:

- Desktop, tablet, and mobile keep the dispatcher face/headset, monitor context, and tablet visible.
- Message panel does not cover the subject.
- Proof rail appears below the hero.
- Dispatch Dashboard preview appears immediately after capability cards.

Safety:

- Desktop, tablet, and mobile keep the safety worker, tablet, open trailer door, and cargo-securement context visible.
- Message panel does not cover the subject.
- Proof rail appears below the hero.
- Safety Portal preview appears immediately after capability cards.

Settlements:

- Desktop, tablet, and mobile keep the settlements subject, tablet, and operations-finance control room visible.
- Message panel does not cover the subject.
- Proof rail appears below the hero.
- Finance Readiness Dashboard preview appears immediately after capability cards.

## Validation Commands

`node --check Website/assets/js/site.js`

Result: passed.

`node Website/tools/validate-bof-public-operations.js`

Result:

- 12 drivers
- 5 loads
- 4 exceptions
- 0 warnings
- 0 errors

Unsupported claim scan:

`rg -n "Real-time messages|24/7 support|guaranteed compliance|guaranteed settlement|guaranteed payment|AI-generated|live-data|live data|real-time messaging" Website/drivers/index.html Website/dispatch/index.html Website/safety/index.html Website/settlements/index.html`

Result: no matches.

## Route Checks

Local preview server: `http://127.0.0.1:8170`

- `/` - 200
- `/drivers/` - 200
- `/dispatch/` - 200
- `/safety/` - 200
- `/settlements/` - 200

## Overflow Checks

Captured viewports for all four pages reported no horizontal overflow:

- 1440
- 1366
- 1280
- 1024
- 768
- 390

## Bridge, RustDesk, And Automation Notes

Bridge receive dry run timed out during the initial check. No bundle was downloaded, processed, acknowledged, deleted, moved, or modified.

RustDesk was verified installed and running, with a startup entry present.

The existing three-hour bridge automation was found active at:

`C:\Users\syhol\.codex\automations\bof-ftp-bridge-check-and-follow-through\automation.toml`

No duplicate automation was created.

## Protected Worktrees

The following worktrees were inspected read-only and not modified:

- `C:\Users\syhol\BOF-public-site-redesign-clean`
- `C:\Users\syhol\BOF-customer-demo-sprint`
- `C:\Users\syhol\BOF-customer-demo-deployment-candidate`
- `C:\Users\syhol\BOF-backend-integration`
- `C:\Users\syhol\BOF-investor-portal-restoration`
- `C:\Users\syhol\BOF-design-system-2-foundation`

`C:\Users\syhol\BOF-public-site-redesign-clean` remains a protected dirty worktree from unrelated existing work. It was not touched.

## Final Status

BOF WAVE 1 SUBJECT-CLEAR HERO AND PORTAL SYSTEM - READY FOR OWNER REVIEW
