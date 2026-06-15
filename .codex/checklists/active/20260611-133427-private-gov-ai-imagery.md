# Checklist: Private Fleet Government AI Imagery Sector Pass

Created: 2026-06-11 13:34:27 -05:00
Source: User client notes, 2026-06-11
Owner persona: `checklist-execution-steward`
Status: complete

## Scope

Implement a bounded BOF site/demo pass from the 2026-06-11 client notes:

- Add back the private fleet sector.
- Add back the government / government-contracting sector.
- Transfer useful sector framing from the old/reference demo into the active `Website`.
- Explain artificial intelligence in buyer-facing BOF language: how BOF uses AI-assisted review to improve service delivery, make quicker readiness decisions, and move mundane back-office tasks out of managers' hands.
- Improve imagery, especially for private fleets and government contracting, with more realistic visuals on the relevant pages.

This checklist is the implementation ledger. Work one item at a time and update evidence before calling the pass complete.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| SG-001 | Project safety | Create a Website backup before broad sector/imagery/copy edits. | complete | Backup: `.codex/backups/website/website-20260611-133621-before-private-gov-ai-imagery.zip`; manifest: `.codex/backups/website/website-20260611-133621-before-private-gov-ai-imagery.manifest.json`; 154 files, 13.69 MB source, SHA-256 `E33F7CF527A9C9274C3BE5F6AB1D447A0796696C676A7E28EACF8FBEE0DE7801`. | `website-backup-steward` script completed before implementation edits. |
| SG-002 | Client notes + master notes | Audit current `Website` for existing private fleet, government fleet, government-contracting, AI, and imagery coverage. | complete | `.codex/reports/private-gov-ai-imagery-audit.md`; focused `rg` found current mentions in `Website/index.html`, `Website/solutions/index.html`, `Website/founding-fleet/index.html`, `Website/documents/index.html`, `Website/demo/index.html`, and `Website/trust-governance/index.html`; asset inventory identified usable sector photos. | Current coverage exists but is scattered and not structural enough. |
| SG-003 | Client notes | Audit `bof-web-Original` as reference-only for private fleet and government sector content that should be transferred or adapted. | complete | `.codex/reports/private-gov-ai-imagery-audit.md`; reference files reviewed: `bof-web-Original/bof-web/app/(marketing)/private-fleets/page.tsx`, `bof-web-Original/bof-web/app/(marketing)/government/page.tsx`, and route map/funnel references. | Reference concepts will be adapted into static `Website` pages; `bof-web-Original` remains read-only. |
| SG-004 | Client notes + project positioning | Define sector hierarchy for the new site: for-hire fleets primary, private fleets and government/government-contracting as visible supporting sectors. | complete | `Website/index.html` keeps for-hire as primary audience while linking private and government/contract fleets as supporting sector paths; `Website/solutions/index.html` preserves for-hire-first hero. | Founding Fleet was not reintroduced as global positioning. |
| SG-005 | Client notes | Add or restore private fleet sector messaging on public buyer pages. | complete | Added `Website/private-fleets/index.html`; updated `Website/index.html` and `Website/solutions/index.html` with `/private-fleets/` links. | Page covers branches, yards, internal lanes, driver files, proof, exception ownership, and manager follow-up. |
| SG-006 | Client notes | Add or restore government fleet sector messaging on public buyer pages. | complete | Added `Website/government/index.html`; updated `Website/index.html`, `Website/solutions/index.html`, and `Website/demo/index.html` with `/government/` path links. | Page covers public-sector accountability, audit trail, compliance packets, proof, and manager visibility. |
| SG-007 | Client notes | Add or restore government-contracting sector messaging where distinct from direct government fleets. | complete | `Website/government/index.html` has government-contracting language in meta, hero, pressure cards, contractor alignment, imagery section, and CTA; `Website/demo/index.html` includes government / contract fleet lens. | Avoids official branding, agency seals, and endorsement implications. |
| SG-008 | Client notes | Make sector coverage structural, not just sprinkled into copy. | complete | Dedicated static routes created: `/private-fleets/` and `/government/`; linked from homepage, solutions, and demo sector lens. | Structural pages replace scattered-only copy. |
| SG-009 | Client notes | Update homepage or primary buyer journey so private/government sectors are discoverable without competing with the main BOF story. | complete | `Website/index.html` sector cards now link to `/private-fleets/` and `/government/`; hero and primary audience remain for-hire trucking fleets. | Discoverable below the main BOF story. |
| SG-010 | Client notes | Update `/solutions/` or equivalent sector page content to include private fleet and government/government-contracting use cases. | complete | `Website/solutions/index.html` adds sector route links, AI-assisted operations support section, and realistic private/government imagery. | Use cases are specific to branch variance, audit records, proof packets, and manager follow-up. |
| SG-011 | Client notes | Update `/demo/`, `/walkthrough/`, or demo entry copy if needed so the demo context can speak to private/government fleets without changing the no-live-integration boundary. | complete | `Website/demo/index.html` now has a `Sector lens` section linking for-hire, private fleet, and government / contract fleet paths. | Interactive-demo scope was not expanded. |
| SG-012 | Client notes | Explain BOF's use of artificial intelligence in plain buyer-facing language. | complete | AI/artificial intelligence service copy added to `Website/index.html`, `Website/solutions/index.html`, `Website/private-fleets/index.html`, and `Website/government/index.html`. | Covers triage, routine task reduction, exception surfacing, manager time savings, and quicker service delivery. |
| SG-013 | Client notes + buyer-facing copy rule | Keep AI copy credible and service-connected, not hype-heavy. | complete | Copy states AI supports review and does not replace fleet policy, BOF review, human verification, or manager-facing decisions. | No autonomous legal/compliance decision claims added. |
| SG-014 | Client notes | Explain how AI-assisted review connects to BOF service delivery. | complete | AI sections explain faster first pass, BOF owner assignment, evidence visibility, exception routing, managed follow-up, and manager-readable outcomes. | Ties AI assistance to BOF service work, not a standalone AI product. |
| SG-015 | Client notes | Improve realistic imagery on private fleet pages/sections. | complete | `Website/private-fleets/index.html` uses `14-private-fleet-proof-review.webp`, `20-warehouse-proof-tablet-review.webp`, `30-route-board-tablet-review.webp`, and `04-fleet-owner-terminal-review.webp`; `Website/solutions/index.html` adds private-fleet photo card. | Reused BOF-native realistic assets; no distorted new assets introduced. |
| SG-016 | Client notes | Improve realistic imagery on government/government-contracting pages/sections. | complete | `Website/government/index.html` uses `13-government-contract-record-review.webp`, `09-safety-compliance-wall-board.webp`, and `12-document-request-workflow.webp`; `Website/solutions/index.html` adds government-contract photo card. | Neutral public-sector/contracting imagery; no official seals or real agency marks. |
| SG-017 | Client notes | Add more imagery where pages currently feel text-heavy or under-visualized. | complete | Added realistic photo sections to both new sector routes and expanded `/solutions/` photo grid from four to six cards with sector-specific imagery. | Images support operating story: proof, route boards, audit records, compliance, and owner exceptions. |
| SG-018 | Visual asset rule | Ensure new images are BOF-native and realistic. | complete | Used existing compressed BOF photo assets from `Website/assets/images/photos/site-pass/`; no second-reference imagery copied and no complex SVG people/trucks added. | Image inventory confirms assets are existing WebP files. |
| SG-019 | Visual QA | Check new/updated imagery for distortion, aspect-ratio issues, odd faces, unreadable crops, and style mismatch. | complete | Snapshot review inspected `private-fleets-desktop.png`, `private-fleets-mobile.png`, `government-desktop.png`, `government-mobile.png`, `home-desktop.png`, `home-mobile.png`, `solutions-desktop.png`, and `demo-mobile.png` under `.codex/reports/visual-snapshots/private-gov-ai-imagery/`. | First viewport render looked clean; no squished hero images found. |
| SG-020 | Copy QA | Search visible copy for stale/internal phrases and prohibited claims. | complete | `rg` scan for `static demo`, `mockup`, `fake API`, `old demo`, `reference demo`, `route maze`, `client note`, `AscendTMS`, `official integration`, `powered by Ascend`, and `AscendTMS-certified` returned `NO_MATCHES` in `Website`. | Removed one visible `client note` phrasing from `Website/government/index.html`. |
| SG-021 | Static/shared-hosting guardrail | Confirm no framework/backend/API/auth/package work was added. | complete | `Test-Path Website/package.json`, `Website/node_modules`, `Website/.next`, and `Website/.env` all returned `False`; external-call scan found only local `fetch(...)` calls for static JSON plus non-secret text/token labels in demo copy. | No backend/API/auth/package/framework work added. |
| SG-022 | Cache busting | Bump CSS/JS asset version if shared CSS/JS or page references change. | not_applicable | Only HTML content/routes were added or edited; shared `styles.css` and `site.js` were not changed in this pass. Existing references remain `v=1.36`. | No CSS/JS cache bust required for this pass. |
| SG-023 | Validation | Run syntax/static checks for touched shared JS and relevant data. | complete | `node --check Website/assets/js/site.js` passed. | Shared JS was not modified, but syntax check was run as a validation gate. |
| SG-024 | Browser QA | Browser-check updated desktop and mobile routes for clipping, overflow, bad formatting, and unreadable first-screen content. | complete | Snapshot script captured `/`, `/solutions/`, `/private-fleets/`, `/government/`, and `/demo/` for desktop/mobile; all captures returned 200 with no failures; route check returned 200 for all five routes. | Visual review found no first-viewport clipping/overflow issues on inspected screenshots. |
| SG-025 | Checklist closeout | Update this checklist with evidence, closed count, remaining/deferred items, and final verification. | complete | Checklist rows, verification gates, decisions/deferrals, and closeout summary updated on 2026-06-11. | Final response must report `25 / 25 closed, 0 remaining`. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Backup completed before broad edits | complete | `.codex/backups/website/website-20260611-133621-before-private-gov-ai-imagery.zip` |
| Old/reference demo sector audit completed | complete | `.codex/reports/private-gov-ai-imagery-audit.md` |
| Syntax checks | complete | `node --check Website/assets/js/site.js` passed. |
| Route checks | complete | `Invoke-WebRequest` returned 200 for `/`, `/solutions/`, `/private-fleets/`, `/government/`, and `/demo/`. |
| Browser/rendered check | complete | `.codex/reports/visual-snapshots/private-gov-ai-imagery/manifest.json`; desktop/mobile captures for five routes, all `ok: true`. |
| Source/privacy/stale-copy scans | complete | Bad-phrase/prohibited-claim scan returned `NO_MATCHES`; no visible `AscendTMS`/internal process wording found in `Website`. |
| Static/shared-hosting guardrail check | complete | No `Website/package.json`, `Website/node_modules`, `Website/.next`, or `Website/.env`; no real external API calls added. |
| Runtime cleanup audit, if preview/browser automation is used | complete | Runtime audit found preview PID `36444`; cleanup stopped it; follow-up audit found 0 candidate leftovers. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|
| Real AI backend | deferred | Client-facing request is for explaining how BOF uses AI to improve services; current site remains static/shared-hosting safe. | User explicitly asks to build production AI/backend behavior and changes the static boundary. |
| Real government branding or agency seals | deferred | Would imply endorsement or require permission; use neutral public-sector/contracting imagery. | User provides approved branding/authorization. |
| Rebuilding old demo stack | deferred | `bof-web-Original` is reference-only; transfer buyer-facing sector value and proof patterns into static `Website`. | User explicitly asks for a separate migration plan. |

## Closeout Summary

- Completed: All 25 checklist items closed with evidence.
- Remaining: 0 implementation/check/closeout items.
- Blocked:
- Deferred: Real AI backend, real government branding/seals, old demo stack rebuild.
- Verification: Backup created; audits documented; sector routes added; homepage/solutions/demo updated; syntax check passed; five routes returned 200; desktop/mobile snapshots captured; stale-copy/prohibited-claim scan passed; static guardrails passed; preview process cleaned up.

