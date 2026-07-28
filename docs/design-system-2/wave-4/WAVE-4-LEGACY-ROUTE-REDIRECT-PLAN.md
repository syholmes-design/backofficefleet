# Wave 4 Legacy Route Redirect Plan

## Implemented Compatibility Routes

| Old route | Current content | Replacement | Redirect type | Unique functionality | SEO risk | Rollback |
|---|---|---|---|---|---|---|
| `/about/` | New noindex compatibility page | `/company/` | Meta refresh/noindex compatibility | None; route was missing | Low | Restore/remove `Website/about/index.html` |
| `/book-demo/` | Replaced old mailto funnel with noindex compatibility page | `/book-a-demo/` | Meta refresh/noindex compatibility | Old mailto CTAs removed; new form lives on `/book-a-demo/` | Low | Revert `Website/book-demo/index.html` |

## Proposed Redirects Not Implemented

| Old route | Replacement | Recommended type | Reason | Rollback method |
|---|---|---|---|---|
| `/fleet/` | `/load-readiness/` | 302 first, later 301 after owner approval | Legacy load-readiness content overlaps new substantial page | Remove `.htaccess` redirect candidate if added later |
| `/carrier-readiness/` | `/network-readiness/` | 302 first | Overlapping carrier/network readiness content; verify no unique SEO value first | Remove redirect |
| `/aggregator-outreach/` | `/aggregators/` or `/network-readiness/` | 302 first | Older funnel route may contain unique partner-offer copy | Remove redirect |
| `/aggregator-partner-offer/` | `/aggregators/` or `/network-readiness/` | 302 first | Older partner-offer route may have unique outreach context | Remove redirect |
| `/private-fleet-offer/` | `/private-fleets/` | 302 first | Older funnel page overlaps current audience page | Remove redirect |
| `/fleet-operator-offer/` | `/for-hire-fleets/` | 302 first | Older operator-offer page overlaps current for-hire audience page | Remove redirect |
| `/safety-compliance/` | `/safety/` | 302 first | Likely duplicate safety route | Remove redirect |
| `/trust-governance/` | `/company/` or retain as trust support page | No redirect yet | Contains trust/governance-specific content that may remain useful | Not applicable |
| `/scenario-walkthrough/` | `/assessment/` | No redirect yet | Older assessment-like route may support demo paths; internal nav now favors `/assessment/` | Not applicable |

No `.htaccess` redirects were added in this pass.
