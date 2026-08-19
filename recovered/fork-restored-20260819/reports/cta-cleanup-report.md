# CTA Cleanup Report

## Current Cleanup Decision

The working-session / scenario-review process was preserved, but the public-facing CTA language was simplified.

Public sequence now presented to visitors:

1. Request a BOF Assessment.
2. Complete the assessment form.
3. BOF reviews the submission.
4. Qualified fleets may be invited to a BOF Assessment Review or Fleet Operations Review.
5. Strong candidates may apply or be invited to become Founding Fleet Members.

Primary CTA pattern:

- General fleet and platform pages: `Apply to Become a Founding Fleet Member` and `Request a BOF Assessment`.
- Aggregator/network pages: `Request an Aggregator Assessment`.
- Existing `/scenario-walkthrough/` route remains the active shared intake route for now.

No useful demo, scenario, or assessment pages were removed. The cleanup changed labels, button copy, and explanatory text so visitors understand the sequence instead of seeing several competing public CTAs.

## Validation Snapshot

- Confusing CTA phrase scan excluding this report: passed.
- JavaScript syntax checks for `Website/assets/js/*.js`: passed.
- Internal `href/src/action` scan: `MissingCount: 0`.
- Local HTTP checks passed for `/`, `/scenario-walkthrough/`, `/book-demo/`, `/founding-fleet/apply/`, `/aggregator-command-center/`, `/aggregator-outreach/`, `/aggregator-partner-offer/`, `/fleet-operator-offer/`, `/document-readiness-engine/`, `/executive-demo/`, `/animated-demo/`, `/animated-demo-business/`, `/animated-demo-aggregator/`, and `/customer-portal/`.
- PHP CLI was not available locally, so `Website/scenario-walkthrough/submit.php` syntax was not revalidated with `php -l`.
- Customer portal workflow files were not changed.

Generated from pre-cleanup scan. Matches found: 282.

## Link Target Decisions

- Founding Member Application: `/founding-fleet/apply/` (existing route).
- BOF Assessment: `/scenario-walkthrough/` reused temporarily because no dedicated `/bof-assessment/` route exists. Recommendation: create `/bof-assessment/` later and redirect/retitle the existing intake flow.
- Aggregator Assessment: `/scenario-walkthrough/` reused temporarily because no dedicated `/aggregator-assessment/` route exists. Recommendation: create `/aggregator-assessment/` later or add an aggregator-specific mode to the existing intake flow.

## Findings

| File | Line | Current text | Proposed replacement | Link target change |
|---|---:|---|---|---|
| `aggregator-command-center/index.html` | 53 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 103 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 106 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 117 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | aggregator assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 121 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 143 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-command-center/index.html` | 271 | &lt;article class="agg-path-card reveal"&gt;&lt;span&gt;01&lt;/span&gt;&lt;h3&gt;Scenario Walkthrough&lt;/h3&gt;&lt;p&gt;&lt;strong&gt;What to show:&lt;/strong&gt; the prospect's real network problem, organization type, scenario category, urgency, and preferred demo path.&lt;br&gt;&lt;strong&gt;Why it matters:&lt;/strong&gt; the command center conv | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 81 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 132 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 135 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 146 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | aggregator assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 150 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-outreach/index.html` | 221 | &lt;article class="timeline-card reveal"&gt;&lt;span&gt;02&lt;/span&gt;&lt;h3&gt;Submit one scenario&lt;/h3&gt;&lt;p&gt;Use the Scenario Walkthrough form so BOF can prepare the first review around a real operating record instead of a generic tour.&lt;/p&gt;&lt;/article&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 25 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 75 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 78 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 89 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | aggregator assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 93 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 205 | &lt;article class="partner-card"&gt;&lt;span&gt;Next step&lt;/span&gt;&lt;h3&gt;Partner rollout path&lt;/h3&gt;&lt;p&gt;A clear recommendation for outreach, webinar, working session, or direct fleet onboarding.&lt;/p&gt;&lt;/article&gt; | aggregator assessment | /scenario-walkthrough/ |
| `aggregator-partner-offer/index.html` | 246 | &lt;article class="partner-print"&gt;&lt;span&gt;Demo links&lt;/span&gt;&lt;h3&gt;Show the workflow.&lt;/h3&gt;&lt;p&gt;Use the Aggregator Animated Demo, Aggregator Command Center, BOF Vault readiness demo, and Scenario Walkthrough.&lt;/p&gt;&lt;/article&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo/index.html` | 1013 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo/index.html` | 1063 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo/index.html` | 1066 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `animated-demo/index.html` | 1077 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `animated-demo/index.html` | 1081 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `animated-demo/index.html` | 1106 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo/index.html` | 1114 | &lt;p class="ad-start-helper"&gt;Aggregator? Start with &lt;a href="/animated-demo-aggregator/"&gt;Aggregator Animated Demo&lt;/a&gt;, &lt;a href="/aggregator-command-center/"&gt;Aggregator Command Center&lt;/a&gt;, &lt;a href="/capacity-intelligence/"&gt;Capacity Intelligence&lt;/a&gt;, and &lt;a href="/carrier-readiness/"&gt;Carrier Readiness&lt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1193 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1243 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1246 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1257 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | aggregator assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1261 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Request an Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1300 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | Aggregator Assessment | /scenario-walkthrough/ |
| `animated-demo-aggregator/index.html` | 1408 | &lt;p class="eyebrow"&gt;Aggregator working session&lt;/p&gt; | aggregator assessment | /scenario-walkthrough/ |
| `animated-demo-business/index.html` | 898 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo-business/index.html` | 948 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo-business/index.html` | 951 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `animated-demo-business/index.html` | 962 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `animated-demo-business/index.html` | 966 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `animated-demo-business/index.html` | 999 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `animated-demo-business/index.html` | 1005 | &lt;p class="ad-start-helper"&gt;Aggregator? Review &lt;a href="/animated-demo-aggregator/"&gt;Aggregator Animated Demo&lt;/a&gt;, &lt;a href="/aggregator-command-center/"&gt;Aggregator Command Center&lt;/a&gt;, and &lt;a href="/business-operations/"&gt;Business Operations&lt;/a&gt; for carrier network administration. Have a real administrative wor | BOF Assessment | /scenario-walkthrough/ |
| `assets/js/homepage-audience.js` | 66 | scenarioLabel: "Book a working session" | BOF assessment | /scenario-walkthrough/ |
| `assets/js/scenario-walkthrough.js` | 114 | "BOF Scenario Walkthrough Request", | BOF Assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 6 | &lt;title&gt;BOF Working Session \| BackOfficeFleet&lt;/title&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 7 | &lt;meta name="description" content="Request a focused BOF working session around one trucking record, driver file, document packet, or release issue."&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `book-demo/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `book-demo/index.html` | 95 | &lt;div class="reveal"&gt;&lt;p class="eyebrow"&gt;BOF working session&lt;/p&gt;&lt;h1&gt;Bring one fleet record, driver file, document packet, or release issue. BOF will make the next move clearer.&lt;/h1&gt;&lt;p&gt;Use the first conversation to work through a real trucking problem: driver readiness, carrier packet status, document hold, settleme | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 112 | &lt;article class="proof-card reveal"&gt;&lt;h3&gt;Scenario walkthrough&lt;/h3&gt;&lt;p&gt;Use this path if you want BOF to review a specific fleet, carrier network, claims, settlement, onboarding, compliance, or business operations problem.&lt;/p&gt;&lt;a class="button secondary" href="/scenario-walkthrough/"&gt;Build scenario summary&lt;/a&gt;&lt | BOF Assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 116 | &lt;div class="section-head reveal"&gt;&lt;p class="eyebrow"&gt;What to expect&lt;/p&gt;&lt;h2&gt;A focused working session around one real back-office release issue.&lt;/h2&gt;&lt;p&gt;The goal is to see whether BOF can make a daily trucking decision easier to control without asking your team to start from scratch. You bring the operating pressure | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 120 | &lt;article class="card reveal"&gt;&lt;span class="icon"&gt;03&lt;/span&gt;&lt;h3&gt;Operating next step&lt;/h3&gt;&lt;p&gt;Which back-office pressure should be handled first, what BOF would organize, and what your team should expect from the next working session.&lt;/p&gt;&lt;/article&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 129 | &lt;span&gt;45-minute working session&lt;/span&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 131 | &lt;h3&gt;Working Session Packet &middot; Release Decision Review&lt;/h3&gt; | BOF assessment | /scenario-walkthrough/ |
| `book-demo/index.html` | 161 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Ready&lt;/p&gt;&lt;h2&gt;Use BOF to make the release decision visible.&lt;/h2&gt;&lt;p&gt;Request a focused working session around one load, packet, driver file, carrier question, POD issue, or document hold.&lt;/p&gt;&lt;/div&gt;&lt;a class="button lig | BOF assessment | /scenario-walkthrough/ |
| `business-operations/index.html` | 67 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `business-operations/index.html` | 117 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `business-operations/index.html` | 120 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `business-operations/index.html` | 131 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `business-operations/index.html` | 135 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `capacity-intelligence/index.html` | 68 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `capacity-intelligence/index.html` | 118 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `capacity-intelligence/index.html` | 121 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `capacity-intelligence/index.html` | 132 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `capacity-intelligence/index.html` | 136 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `carrier-readiness/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `carrier-readiness/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `carrier-readiness/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `carrier-readiness/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `carrier-readiness/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `dashboard/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `dashboard/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `dashboard/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `dashboard/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `dashboard/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/index.html` | 99 | &lt;div class="actions"&gt;&lt;a class="button primary" href="/demo/tms-release-review/"&gt;View release readiness workflow &rarr;&lt;/a&gt;&lt;a class="button secondary" href="/interactive-demo/start/"&gt;Try Release Review&lt;/a&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book Demo&lt;/a&gt;&lt;/div&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/index.html` | 216 | &lt;article class="timeline-card reveal"&gt;&lt;p class="eyebrow"&gt;06&lt;/p&gt;&lt;h3&gt;Close with a working session&lt;/h3&gt;&lt;p&gt;After the demo, bring one real load, driver file, document packet, or release issue so BOF can map the record chain around it.&lt;/p&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo/index.html` | 234 | &lt;div class="actions"&gt;&lt;a class="button primary" href="/interactive-demo/start/"&gt;Try Release Review &rarr;&lt;/a&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book Demo&lt;/a&gt;&lt;/div&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/index.html` | 242 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Demo path&lt;/p&gt;&lt;h2&gt;One decision, with enough detail to judge BOF.&lt;/h2&gt;&lt;p&gt;BOF keeps the path centered on &lt;a class="proof-link" href="/operations-record/#bof-1842"&gt;TMS-LD-10482&lt;/a&gt; so the release packet, owner, blocker, a | BOF assessment | /scenario-walkthrough/ |
| `demo/tms-release-review/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo/tms-release-review/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo/tms-release-review/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo/tms-release-review/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo/tms-release-review/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo-paths/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo-paths/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `demo-paths/index.html` | 131 | &lt;article class="card reveal"&gt;&lt;span class="icon"&gt;E&lt;/span&gt;&lt;h3&gt;Executive review&lt;/h3&gt;&lt;p&gt;Question: does BOF make operating problems easier to see, assign, and resolve?&lt;/p&gt;&lt;p&gt;Record: &lt;a class="proof-link" href="/operations-record/#hold-resolution-1931"&gt;BOF-1931 hold plan&lt;/a&gt;.&lt;/p&gt;&lt;a clas | BOF assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 225 | &lt;li&gt;&lt;span&gt;Working session&lt;/span&gt;&lt;a class="proof-link" href="/book-demo/#session-options"&gt;Scenario selection&lt;/a&gt;&lt;/li&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 227 | &lt;a class="button secondary" href="/book-demo/"&gt;Review working session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 236 | &lt;article class="timeline-card reveal"&gt;&lt;p class="eyebrow"&gt;Step 4&lt;/p&gt;&lt;h3&gt;Focused working session&lt;/h3&gt;&lt;p&gt;Bring a real release, driver, document, or carrier packet decision so BOF can map the record chain against your fleet&apos;s process.&lt;/p&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book session&lt; | BOF assessment | /scenario-walkthrough/ |
| `demo-paths/index.html` | 244 | &lt;article class="card access-tier reveal"&gt;&lt;strong&gt;Working session&lt;/strong&gt;&lt;p&gt;&lt;a class="proof-link" href="/operations-record/#bof-1842"&gt;TMS-LD-10482&lt;/a&gt; shows why the load is reviewed before release and which document confirmation clears it.&lt;/p&gt;&lt;span class="route-chip warning"&gt;With context&lt;/span&gt;& | BOF assessment | /scenario-walkthrough/ |
| `dispatch/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `dispatch/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `dispatch/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `dispatch/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `dispatch/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `document-readiness-engine/index.html` | 25 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `document-readiness-engine/index.html` | 75 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `document-readiness-engine/index.html` | 78 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `document-readiness-engine/index.html` | 89 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `document-readiness-engine/index.html` | 93 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `documents/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `documents/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `documents/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `documents/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `documents/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `drivers/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `drivers/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `drivers/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `drivers/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `drivers/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `drivers/index.html` | 254 | &lt;article class="website-photo-card reveal"&gt;&lt;img loading="lazy" decoding="async" src="/assets/images/photos/site-pass/15-driver-file-working-session.webp" alt="Fleet owner, dispatcher, and back-office consultant reviewing load records"&gt;&lt;div&gt;&lt;h3&gt;Driver file working session&lt;/h3&gt;&lt;p&gt;The first review starts with actual | BOF assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 69 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 119 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 122 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `executive-demo/index.html` | 133 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 137 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `executive-demo/index.html` | 157 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 187 | &lt;article class="demo-card reveal"&gt;&lt;span&gt;06&lt;/span&gt;&lt;h3&gt;Scenario Walkthrough&lt;/h3&gt;&lt;p&gt;Captures a prospect's real operating scenario before the walkthrough so the demo can start with the workflow and blocker they care about.&lt;/p&gt;&lt;a href="/scenario-walkthrough/"&gt;Build Scenario Summary&lt;/a&gt;&lt;/article&gt | BOF Assessment | /scenario-walkthrough/ |
| `executive-demo/index.html` | 238 | &lt;article class="proof-card reveal"&gt;&lt;h3&gt;Recommended route sequence&lt;/h3&gt;&lt;ol&gt;&lt;li&gt;&lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt;&lt;/li&gt;&lt;li&gt;&lt;a href="/aggregator-command-center/"&gt;Aggregator Command Center&lt;/a&gt;&lt;/li&gt;&lt;li&gt;&lt;a href="/animated-demo-aggregator/"&gt;Aggregato | BOF Assessment | /scenario-walkthrough/ |
| `fleet/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `fleet/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `fleet/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `fleet/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `fleet/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `fleet/index.html` | 232 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Finish strong&lt;/p&gt;&lt;h2&gt;End with a focused working session.&lt;/h2&gt;&lt;p&gt;Your team should leave knowing exactly which operating problem BOF will examine first and which records support the next release decision.&lt;/p&gt;&lt;/div&gt;&lt;a | BOF assessment | /scenario-walkthrough/ |
| `fleet-operator-offer/index.html` | 26 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `fleet-operator-offer/index.html` | 76 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `fleet-operator-offer/index.html` | 79 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `fleet-operator-offer/index.html` | 90 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `fleet-operator-offer/index.html` | 94 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `fleet-operator-offer/index.html` | 217 | &lt;a class="partner-demo-link" href="/scenario-walkthrough/"&gt;Submit a Scenario for Review&lt;small&gt;Bring BOF one real fleet problem before the working session.&lt;/small&gt;&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `fleet-operator-offer/index.html` | 246 | &lt;article class="partner-print"&gt;&lt;span&gt;Demo links&lt;/span&gt;&lt;h3&gt;Show the workflow.&lt;/h3&gt;&lt;p&gt;Use the Driver Readiness Demo, BOF Vault readiness rules demo, Customer Portal Demo, and Scenario Walkthrough.&lt;/p&gt;&lt;/article&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/apply/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/apply/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/apply/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `founding-fleet/apply/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `founding-fleet/apply/index.html` | 118 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Founding Fleet application&lt;/p&gt;&lt;h2&gt;First 10 accepted fleets receive 20% off forever.&lt;/h2&gt;&lt;p&gt;Apply with one specific operating issue so BOF can prepare the right trial path and working session.&lt;/p&gt;&lt;/div&gt;&lt;a class="but | BOF assessment | /scenario-walkthrough/ |
| `founding-fleet/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `founding-fleet/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `founding-fleet/pricing/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/pricing/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/pricing/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `founding-fleet/pricing/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `founding-fleet/trial/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/trial/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleet/trial/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `founding-fleet/trial/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `founding-fleets/index.html` | 24 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleets/index.html` | 74 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `founding-fleets/index.html` | 77 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `founding-fleets/index.html` | 88 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `government/index.html` | 41 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `government/index.html` | 45 | &lt;a class="header-cta" href="/scenario-walkthrough/"&gt;Book a Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `government/index.html` | 181 | &lt;div&gt;&lt;p class="eyebrow"&gt;Government fleet working session&lt;/p&gt;&lt;h2&gt;Bring one contractor route, proof packet, readiness blocker, or exception into BOF.&lt;/h2&gt;&lt;p&gt;Start with a real workflow and BOF will show how readiness, proof, owners, and review notes can be organized around the record.&lt;/p&gt;&lt;/div&gt; | BOF assessment | /scenario-walkthrough/ |
| `index.html` | 55 | &lt;a class="header-cta audience-header-cta" href="/scenario-walkthrough/"&gt;Book a Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `index.html` | 66 | &lt;a class="button primary" href="/scenario-walkthrough/"&gt;Book a Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `index.html` | 196 | &lt;span&gt;Working Session&lt;/span&gt; | BOF assessment | /scenario-walkthrough/ |
| `index.html` | 208 | &lt;h2&gt;Bring one real operating scenario into a BOF working session.&lt;/h2&gt; | BOF assessment | /scenario-walkthrough/ |
| `index.html` | 211 | &lt;a class="button light" href="/scenario-walkthrough/"&gt;Book a Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/ascendtms/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/ascendtms/release-review/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/release-review/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/release-review/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/ascendtms/release-review/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/ascendtms/release-review/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/partner-tms/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/partner-tms/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/partner-tms/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/partner-tms/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/partner-tms/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/tms-workflow/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/tms-workflow/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/tms-workflow/release-review/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/release-review/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/release-review/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `integrations/tms-workflow/release-review/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `integrations/tms-workflow/release-review/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `narration-export/index.html` | 62 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `narration-export/index.html` | 112 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `narration-export/index.html` | 115 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `narration-export/index.html` | 126 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `narration-export/index.html` | 130 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `operational-intelligence/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `operational-intelligence/index.html` | 123 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `operational-intelligence/index.html` | 126 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `operational-intelligence/index.html` | 137 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `operational-intelligence/index.html` | 141 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `operations-record/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `operations-record/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `operations-record/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `operations-record/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `operations-record/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `private-fleet-offer/index.html` | 41 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `private-fleet-offer/index.html` | 45 | &lt;a class="header-cta" href="/scenario-walkthrough/"&gt;Book a Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `private-fleet-offer/index.html` | 208 | &lt;div&gt;&lt;p class="eyebrow"&gt;Private fleet working session&lt;/p&gt;&lt;h2&gt;Bring one internal fleet record, route, proof issue, or exception into BOF.&lt;/h2&gt;&lt;p&gt;Start with the workflow your team already chases and see how BOF would organize readiness, proof, owners, and next actions.&lt;/p&gt;&lt;/div&gt; | BOF assessment | /scenario-walkthrough/ |
| `private-fleets/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `private-fleets/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `private-fleets/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `private-fleets/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `private-fleets/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `private-fleets/index.html` | 173 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Private fleet session&lt;/p&gt;&lt;h2&gt;Bring one private fleet move or driver file into a BOF working session.&lt;/h2&gt;&lt;p&gt;Start with an internal route, branch handoff, POD problem, driver file, document packet, or proof issue that managers cur | BOF assessment | /scenario-walkthrough/ |
| `safety/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `safety/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `safety/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `safety/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `safety/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `safety/index.html` | 177 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Next step&lt;/p&gt;&lt;h2&gt;Turn one safety blocker into a clear operating decision.&lt;/h2&gt;&lt;p&gt;Bring a credential issue, driver event, missing safety form, dispatch block, or settlement hold into a BOF working session.&lt;/p&gt;&lt;/div&gt;&lt | BOF assessment | /scenario-walkthrough/ |
| `safety-compliance/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `safety-compliance/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `safety-compliance/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `safety-compliance/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `safety-compliance/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `scenario-walkthrough/index.html` | 6 | &lt;title&gt;Scenario Walkthrough \| BackOfficeFleet&lt;/title&gt; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 62 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 112 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 115 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `scenario-walkthrough/index.html` | 126 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 130 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `scenario-walkthrough/index.html` | 137 | &lt;p class="eyebrow"&gt;Scenario Walkthrough&lt;/p&gt; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 138 | &lt;h1&gt;Book a Scenario Walkthrough&lt;/h1&gt; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/index.html` | 140 | &lt;div class="actions"&gt;&lt;a class="button light" href="#scenario-intake"&gt;Describe your scenario below.&lt;/a&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book Demo&lt;/a&gt;&lt;/div&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `scenario-walkthrough/index.html` | 264 | &lt;a class="button light" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `scenario-walkthrough/submit.php` | 83 | 'BOF Scenario Walkthrough Request', | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/submit.php` | 108 | 'message' =&gt; 'Please submit the scenario from the BOF Scenario Walkthrough page.' | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/submit.php` | 166 | $subject = 'BOF Scenario Walkthrough Request - ' . $company; | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/submit.php` | 170 | 'From: BOF Scenario Walkthrough &lt;' . SCENARIO_FROM . '&gt;', | BOF Assessment | /scenario-walkthrough/ |
| `scenario-walkthrough/submit.php` | 173 | 'X-Mailer: BOF Scenario Walkthrough' | BOF Assessment | /scenario-walkthrough/ |
| `sectors/index.html` | 61 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `sectors/index.html` | 111 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `sectors/index.html` | 114 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `sectors/index.html` | 125 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `sectors/index.html` | 129 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `sectors/index.html` | 147 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `settlements/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `settlements/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `settlements/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `settlements/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `settlements/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `settlements/index.html` | 182 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Next step&lt;/p&gt;&lt;h2&gt;Bring one held settlement into a BOF working session.&lt;/h2&gt;&lt;p&gt;Start with a pay question, missing proof packet, safety hold, claim reserve, or driver file issue. BOF will map the release path and owner.&lt;/p&gt;&l | BOF assessment | /scenario-walkthrough/ |
| `solutions/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `solutions/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `solutions/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `solutions/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `solutions/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `solutions/index.html` | 99 | &lt;div class="actions"&gt;&lt;a class="button primary" href="/interactive-demo/start/"&gt;Try Demo &rarr;&lt;/a&gt;&lt;a class="button secondary" href="/book-demo/"&gt;Book Demo&lt;/a&gt;&lt;/div&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `solutions/index.html` | 158 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Next step&lt;/p&gt;&lt;h2&gt;Start with one focused BOF working session.&lt;/h2&gt;&lt;p&gt;Bring one load, driver file, document packet, carrier question, or release problem, then inspect the records that decide what happens next.&lt;/p&gt;&lt;/div&gt; | BOF assessment | /scenario-walkthrough/ |
| `trust-governance/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `trust-governance/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `trust-governance/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `trust-governance/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `trust-governance/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `walkthrough/index.html` | 7 | &lt;meta name="description" content="A guided TMS partner workflow from imported load through BOF release review, carrier readiness, document control, safety, and a focused working session."&gt; | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 23 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 73 | &lt;a href="/scenario-walkthrough/"&gt;Scenario Walkthrough&lt;/a&gt; | BOF Assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 76 | &lt;a href="/book-demo/"&gt;Book Demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `walkthrough/index.html` | 87 | &lt;a href="/book-demo/"&gt;Book Working Session&lt;/a&gt; | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 91 | &lt;a class="header-cta" href="/book-demo/"&gt;Book demo&lt;/a&gt; | Apply to Become a Founding Fleet Member | /founding-fleet/apply/ |
| `walkthrough/index.html` | 152 | &lt;tr&gt;&lt;td&gt;Working session&lt;/td&gt;&lt;td&gt;The fleet chooses the real issue closest to its current back-office pressure.&lt;/td&gt;&lt;td&gt;&lt;a class="proof-link" href="/book-demo/#session-options"&gt;Session starting point&lt;/a&gt;&lt;/td&gt;&lt;td&gt;Map one real load, document, driver, or carrier issue.&lt;/td&gt;&lt;/tr&gt; | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 164 | &lt;p&gt;&lt;a class="proof-link" href="/operations-record/#bof-1842"&gt;TMS-LD-10482&lt;/a&gt; starts as a TMS import, becomes a BOF release question, moves into document review, and then confirms driver and carrier readiness before the working session close.&lt;/p&gt; | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 170 | &lt;article class="proof-card reveal"&gt;&lt;h3&gt;Readiness to working session&lt;/h3&gt;&lt;p&gt;The buyer can compare &lt;a class="proof-link" href="/operations-record/#bof-1842"&gt;TMS-LD-10482&lt;/a&gt; against the &lt;a class="proof-link" href="/operations-record/#dispatch-release-1907"&gt;watch decision&lt;/a&gt; and &lt;a class="proof-link" | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 186 | &lt;article class="timeline-card reveal"&gt;&lt;span class="step-kicker"&gt;Stop 06&lt;/span&gt;&lt;h3&gt;Safety evidence and close&lt;/h3&gt;&lt;p&gt;Safety items explain why one load can move and another cannot, then the walkthrough closes with a specific working session.&lt;/p&gt;&lt;a class="button secondary" href="/safety/"&gt;Open safety evid | BOF assessment | /scenario-walkthrough/ |
| `walkthrough/index.html` | 202 | &lt;section class="cta-band"&gt;&lt;div class="cta-inner"&gt;&lt;div&gt;&lt;p class="eyebrow"&gt;Working session&lt;/p&gt;&lt;h2&gt;Turn the workflow into one real TMS scenario.&lt;/h2&gt;&lt;p&gt;A BOF working session maps your own load, export, driver, document, carrier, or safety problem into the same command-centered path.&lt;/p&gt;&lt;/div&gt; | BOF assessment | /scenario-walkthrough/ |

## Notes

- Existing demo/product pages are preserved. The cleanup changes CTA labels and next-step language rather than deleting useful demo routes.
- `/scenario-walkthrough/` remains the working intake route for assessment requests until dedicated assessment routes are created.
