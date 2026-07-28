# Wave 3 Audience Route Audit

## Audit Context

- Worktree: `C:\Users\syhol\BOF-design-system-2-wave-3`
- Branch: `codex/design-system-2-wave-3`
- Base commit: `771d7cf5195a922ea841c7894c181494b5216c17`
- Audit phase status: completed before route redesign implementation.

Wave 3 reconciles BOF audience routing into exactly five audience categories:

1. Aggregator
2. Private Fleet
3. For-Hire Fleet
4. Government Fleet or Agency
5. Individual Driver

## Summary

The current site has useful audience and assessment material, but it is fragmented. Existing global navigation often exposes only Private Fleets, Government Fleets, and Aggregators through `/aggregator-outreach/`; most assessment CTAs point to `/scenario-walkthrough/`; and the requested canonical routes `/who-we-serve/`, `/aggregators/`, `/for-hire-fleets/`, and `/assessment/` are missing.

## Route Inventory

| URL | Local file path | Purpose | Audience | Current status | Indexed / noindex | Canonical URL | Existing hero | Existing CTA | Duplicate content | Recommended disposition | Redirect or alias requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/who-we-serve/` | Missing | Audience selection hub | All five audiences | Missing | N/A | N/A | N/A | N/A | N/A | Create as the primary audience-selection hub | Add to sitemap and global navigation |
| `/aggregators/` | Missing | Canonical aggregator audience page | Aggregator | Missing | N/A | N/A | N/A | N/A | Existing content spread across `/aggregator-outreach/`, `/aggregator-command-center/`, `/aggregator-partner-offer/`, and `/animated-demo-aggregator/` | Create canonical public aggregator page | Keep legacy routes as support routes; propose aliases later if owner wants consolidation |
| `/private-fleets/` | `Website/private-fleets/index.html` | Private fleet public page | Private Fleet | Existing | Indexed by sitemap | Missing explicit canonical | Legacy private fleet hero with captive fleet language | `/book-demo/`, `/dashboard/`, `/fleet-savings/` | Some overlap with `/fleet/` and generic fleet assessment language | Redesign as canonical Private Fleet page and link to `/assessment/?type=private-fleet` | Add/keep sitemap entry; add canonical |
| `/for-hire-fleets/` | Missing | For-hire carrier audience page | For-Hire Fleet | Missing | N/A | N/A | N/A | N/A | For-hire concepts currently scattered across `/fleet/`, `/dispatch/`, `/settlements/`, `/documents/`, and assessment copy | Create canonical For-Hire Fleet page | Add to sitemap and global navigation |
| `/government/` | `Website/government/index.html` | Government fleet page | Government Fleet or Agency | Existing | Indexed by sitemap | Missing explicit canonical | Existing government readiness hero | `/command-center/`, `/book-demo/` | Some language references contract operations and demo more than preparedness | Redesign as canonical Government Fleet or Agency page and link to `/assessment/?type=government` | Keep sitemap entry; add canonical |
| `/assessment/` | Missing | Unified assessment hub | All five audiences | Missing | N/A | N/A | N/A | N/A | Current assessment exists at `/scenario-walkthrough/` with a different structure | Create one dynamic five-path assessment page | Add canonical `/assessment/`; add one sitemap entry only |
| `/fleet/` | `Website/fleet/index.html` | Load readiness demo/detail page | For-hire / load workflow | Existing | Not in sitemap | Missing explicit canonical | Load readiness workflow hero | `/demo/tms-release-review/`, `/documents/`, `/scenario-walkthrough/` | Contains for-hire load readiness concepts but is not an audience page | Preserve as support/demo route; update CTAs where relevant later | No canonical audience alias; optionally link from For-Hire page as workflow proof |
| `/private-fleet/` | Missing | Legacy singular private fleet path | Private Fleet | Missing | N/A | N/A | N/A | N/A | Singular alias could duplicate `/private-fleets/` | Do not create content page | Proposed redirect/alias to `/private-fleets/` during deployment |
| `/government-fleets/` | Missing | Legacy government plural path | Government Fleet or Agency | Missing | N/A | N/A | N/A | N/A | Could duplicate `/government/` | Do not create content page | Proposed redirect/alias to `/government/` during deployment |
| `/driver-assessment/` | Missing | Legacy driver assessment path | Individual Driver | Missing | N/A | N/A | N/A | N/A | Would duplicate `/assessment/?type=driver` | Do not create content page | Proposed redirect/alias to `/assessment/?type=driver` during deployment |
| `/fleet-assessment/` | Missing | Legacy fleet assessment path | Private / For-Hire ambiguous | Missing | N/A | N/A | N/A | N/A | Ambiguous because Private Fleet and For-Hire Fleet must remain separate | Do not create content page | Proposed redirect chooser to `/assessment/` or map only after owner approval |
| `/aggregator-outreach/` | `Website/aggregator-outreach/index.html` | Existing aggregator outreach page | Aggregator | Existing support route | Not in sitemap | Missing explicit canonical | Outreach/partner-oriented legacy hero | `/scenario-walkthrough/`, aggregator demos | Overlaps with the new `/aggregators/` page | Preserve as support route; update public CTAs only if in Wave 3 scope | Proposed future alias only if owner approves replacing outreach route |
| `/aggregator-command-center/` | `Website/aggregator-command-center/index.html` | Existing aggregator operating proof/demo page | Aggregator | Existing support route | Not in sitemap | Missing explicit canonical | Network command center hero | `/scenario-walkthrough/`, aggregator demos | Demo/support content, not canonical audience page | Preserve as product proof route; link from `/aggregators/` as relevant demo/proof | No redirect required |
| `/aggregator-partner-offer/` | `Website/aggregator-partner-offer/index.html` | Aggregator partner offer | Aggregator | Existing support route | Not in sitemap | Missing explicit canonical | Partner offer hero | `/scenario-walkthrough/`, aggregator demo links | Partner program content overlaps but serves a different intent | Preserve as support route | No redirect required |
| `/animated-demo-aggregator/` | `Website/animated-demo-aggregator/index.html` | Aggregator animation/demo | Aggregator | Existing demo route | Not in sitemap | Missing explicit canonical | Animated demo hero | `/aggregator-command-center/`, `/scenario-walkthrough/` | Demo content, not audience page | Preserve as verified relevant demo route | No redirect required |
| `/scenario-walkthrough/` | `Website/scenario-walkthrough/index.html` | Existing BOF assessment/intake | Multi-audience but not five-path model | Existing | Not in sitemap | Missing explicit canonical | Inline assessment hero | Form submit and assessment workflow | Conflicts with new `/assessment/` destination if left as primary audience CTA | Preserve as legacy/general assessment route for now; new audience CTAs should use `/assessment/?type=...` | Future redirect strategy requires owner approval |
| `/demo-paths/` | `Website/demo-paths/index.html` | Existing assessment/demo path explainer | Multi-audience | Existing support route | Not in sitemap | Missing explicit canonical | Role/path explainer | `/scenario-walkthrough/`, command routes | Support content, not canonical audience or assessment hub | Preserve as support route | No redirect required |
| `/drivers/` | `Website/drivers/index.html` | Driver public page | Individual Driver | Existing DS2 page | Indexed by sitemap | `https://backofficefleet.com/drivers/` | DS2 driver hero | `/customer-demo/?portal=driver`, section link, `/book-demo/` | Does not duplicate new assessment; lacks `/assessment/?type=driver` CTA | Preserve and add driver assessment CTA in Wave 3 | Keep sitemap entry |
| `/bof-vault/` | `Website/bof-vault/index.html` | BOF Vault page | Driver / documents / customer operations | Existing DS2 page | Indexed by sitemap | Existing DS2 canonical expected on page | Secure vault hero | BOF Vault demo links | Support route for driver document readiness | Preserve; use as secondary driver assessment CTA | Keep sitemap entry |

## Navigation Findings

- Current legacy header dropdown usually lists only `Private Fleets`, `Government Fleets`, and `Aggregators`.
- Several DS2 pages use `Who We Serve` text but link it to `/private-fleets/`, which is confusing once `/who-we-serve/` exists.
- `Assessment` is not a stable global route; most CTAs use `/scenario-walkthrough/`.
- Wave 3 should use one global `Assessment` link to `/assessment/`, not five assessment links in primary navigation.

## Sitemap And Robots Findings

- Current sitemap includes `/private-fleets/` and `/government/`.
- Current sitemap does not include `/who-we-serve/`, `/aggregators/`, `/for-hire-fleets/`, or `/assessment/`.
- `robots.txt` disallows `/customer-demo/` and `/interactive-demo/`; this should remain unchanged.
- Query states for `/assessment/?type=...` should not be added as separate sitemap URLs.

## Current Imagery Findings

- Strong human-forward assets exist in `Website/assets/images/photos/` and `Website/assets/images/photos/site-pass/`.
- Existing audience pages use mixed legacy imagery and styles.
- Strong candidates:
  - Aggregator: `site-pass/08-carrier-readiness-counter.webp`, `site-pass/06-morning-dispatch-huddle.webp`
  - Private Fleet: `fleet-office-record-review.webp`, `site-pass/04-fleet-owner-terminal-review.webp`
  - For-Hire Fleet: `site-pass/10-carrier-yard-route-packet.webp`, `site-pass/29-dispatch-load-board-office.webp`
  - Government: `site-pass/13-government-contract-record-review.webp`
  - Driver: `design-system-2/wave-1/ds2-drivers-hero-clean.png`, `profiles/optimized/driver-png.webp`

## Recommended Wave 3 Disposition

1. Create `/who-we-serve/` as the canonical audience hub.
2. Create `/aggregators/` as the canonical aggregator audience page.
3. Redesign `/private-fleets/` as the canonical private fleet page.
4. Create `/for-hire-fleets/` as the canonical for-hire carrier page.
5. Redesign `/government/` as the canonical government fleet or agency page.
6. Preserve `/drivers/` and add a direct driver assessment path without duplicating the Drivers page.
7. Create `/assessment/` as the one five-path dynamic assessment hub.
8. Update primary navigation on Wave 3 pages to include one `Who We Serve` link and one `Assessment` link.
9. Update sitemap with canonical audience pages and one `/assessment/` entry.
10. Keep hidden customer-demo routes out of the sitemap.
