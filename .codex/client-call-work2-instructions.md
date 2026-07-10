# BOF Client Call Instructions: work2

Source: `Client Suggestions/work2.txt`
Created: 2026-06-08

## Purpose

Use this document as a durable instruction layer for BOF website and demo work that touches load packets, driver records, document realism, Founding Fleet / sector routing, TMS import simulation, demo labels, and financial-calculator planning.

This document captures client intent from the call. It is not a request to add a backend, live TMS connection, credentials, database, real API calls, framework code, or production integration behavior.

## Current Interpretation Rule

The client wants the demo grounded in a real trucking operating workflow and real TMS-style behavior. The current project boundary still holds unless the user explicitly changes it:

- Build static shared-hosting-safe pages and simulations.
- Use HTML, CSS, vanilla JavaScript, JSON, and static assets.
- Do not add live API/sync/auth/database/backend work.
- Do not store credentials or use `.env`.
- Do not add React, Next.js, TypeScript, npm packages, `node_modules`, or a build pipeline.
- If real TMS screenshots, account access, or prompts are later supplied, use them only as authorized reference material for a simulated workflow unless the user explicitly approves a live integration change.
- Because the latest resolved website direction removed visible `AscendTMS` wording, keep buyer-facing language neutral unless the user explicitly reverses that decision. Use `TMS import`, `partner load import`, `fleet operating record`, `release review`, `BOF readiness review`, and `simulated handoff`.

## Load Packet Lifecycle

Future demo and document work should show that a load has different document packets at different stages.

### Pre-Trip Packet

Before the trip can leave, show a packet that may include:

- Rate confirmation.
- Master service agreement or work schedule.
- Pickup instructions.
- Dispatch/load assignment.
- Driver and carrier readiness confirmation.
- Tire or equipment inspection.
- Cargo inspection before loading.
- Loaded cargo photo or dock/loading photo.
- Seal photo or seal record when relevant.
- Any release blocker or required correction before departure.

Use this packet to answer: can the trip take off, what proof exists, what is missing, and who owns the next action?

### In-Transit Packet

During the trip, show monitored operating context and exception signals:

- Driver route and GPS lane.
- Whether the truck strayed off route.
- Weather conditions.
- Traffic conditions.
- Alternate route decision when needed.
- Updated GPS or route plan after a justified detour.
- HOS / hours-of-service availability.
- OOS / out-of-service or compliance concern when relevant.
- Driver behavior monitoring, such as following too closely or other unsafe driving events.
- Fuel status if shown in the Command Center.
- Audit notes explaining why a route, timing, or compliance event matters.

Use this packet to answer: is the load still on track, is the driver legal and safe to continue, and does any exception need management review?

### Post-Trip Packet

After unloading, show a completion packet that may include:

- Proof of delivery.
- Receiver/signature.
- Signed BOL.
- Delivery timestamp.
- GPS/location detail.
- Loading dock or delivery-location photo.
- Empty cargo/bin/trailer photo after unloading.
- Lumper receipt or certification that the lumper was paid when a lumper is involved.
- Settlement release consequence.
- Claim/dispute consequence when relevant.
- Insurance claim documentation only when there is a claim or exception.

Use this packet to answer: can the driver be paid, can the load settle, and is there enough proof to defend delivery if there is a dispute?

## Backhaul Board And Deadhead Logic

The demo should preserve the client's backhaul idea:

- After unloading, the driver should begin looking for backhaul opportunities.
- Backhaul opportunities should be near the driver's delivery vicinity.
- The purpose is to help the driver return toward the home location without deadheading.
- A backhaul board should not feel decorative; it should connect location, timing, return direction, equipment fit, and next action.

## Driver Documentation Standard

The client continues to treat driver documentation as one of the easiest and most important proof areas. Driver pages should feel like real inspectable driver files, not summaries.

Each important driver record should have:

- A unique driver photo.
- A name that matches the apparent gender presentation of the photo.
- No reused faces.
- No visibly distorted portraits.
- A complete document list with roughly 20 documents where appropriate.
- Clickable documents that open realistic-looking document surfaces.
- Large enough previews for a buyer to inspect without guessing.
- A clear distinction between the fleet owner's own drivers and outside carrier packet records.

Primary driver documents called out in the transcript:

- Driver license / CDL.
- Insurance card when applicable.
- Motor vehicle record.
- Medical card.
- I-9.
- W-9.

Secondary driver documents called out in the transcript:

- Road safety test.
- Driver profile.
- Driver application.
- Employment history.
- Resume or work history.
- Prior employer inquiry when useful.
- Safety acknowledgements.
- Dispatch eligibility / assignment context.

Additional project-standard driver documents remain valid:

- Clearinghouse / FMCSA compliance.
- Emergency contact.
- Settlement or payment setup.
- DQF compliance summary.
- Qualification file.
- Employee handbook acknowledgement.
- Benefits enrollment when part of the scenario.
- Life insurance beneficiary election when part of the scenario.
- Flexible spending account election when part of the scenario.
- Garnishment / withholding summary when part of the scenario.

## Contact Data And Synthetic Realism

The client specifically objected to `555` phone numbers.

Rules:

- Do not use `555` numbers in visible demo contact fields.
- Do not use real private phone numbers, personal addresses, government IDs, license numbers, bank values, tax IDs, or medical details.
- Prefer role-based business contact language, safe fictional values, or company-domain contact patterns when available.
- If a personal email is required for realism, use synthetic addresses that cannot identify a real person; avoid copying private values from reference sources.
- If safe synthetic phone realism cannot be guaranteed, omit the phone number or route the contact through a BOF/dispatch channel instead of inventing a real-looking reachable number.

## Public Website Journey

The client wants the public site to preserve the spirit of the older landing-page flow while routing the demo to the newer BOF demo experience.

Standing instructions:

- Keep the public landing pages before the demo.
- The first page should focus on Founding Fleet / founding member appeal.
- The public site should support sectors:
  - for-hire carriers / regular trucking fleets
  - private fleets
  - government fleets
  - government-contracting fleets
- Founding Fleet must be structural, not just words sprinkled into unrelated copy.
- Demo links should route into the new demo experience.
- Do not make the visitor land directly in the interactive demo unless the link is explicitly an operational app-shell route.
- Keep the older public journey intent, but use BOF's current stronger record-backed design standard.

## Navigation And Labeling Notes

Transcript UX notes to preserve:

- A public CTA saying `Try Records Demo` confused the client; prefer a simpler label such as `Demo`, `Try Demo`, or `View Demo`.
- On mobile or narrow layouts, the hamburger menu must clearly expose the expected site links.
- The public website should not show raw code, broken layout fragments, or unfinished-looking right-side artifacts.
- The left app sidebar should be visible once the buyer is inside the interactive demo shell.
- If the client cannot find `Drivers`, the demo flow is failing, even if the route exists.
- Driver cards should say `Drivers` or `Driver Records` consistently; avoid awkward wording like `drivers records`.

## TMS Import Realism

The client believes the BOF demo should be grounded in a real trucking TMS workflow, not a purely invented product flow.

Translate this into static-safe work this way:

- Simulate a TMS import workflow with realistic load/source-system behavior.
- If the user later supplies real TMS prompts, screenshots, exports, or permitted account context, use them to improve the simulated workflow's visual and operational realism.
- Do not log into a real TMS account, scrape it, copy private data, or store credentials unless the user gives explicit authorization and the project boundary is changed.
- Do not claim a real integration exists.
- Do not imply BOF has live API access, authority, or production sync.
- If named `AscendTMS` language is reintroduced by the user, treat it as a visible positioning change that must be handled deliberately across the site.

## Demo Phase And Scope Clarity

The client asked what phase the work is in. Future explanations should keep a plain internal answer available:

- Current phase: static simulated Phase 1 experience.
- It demonstrates operating workflow, records, document packets, release review, and handoff logic.
- It does not connect to live TMS APIs or production systems.
- Later phases can be described only as planning language unless the user explicitly approves real integration work.

## Financial Calculator Note

The client referenced a separate financial calculator prompt/command that may arrive later.

Future handling:

- Treat the financial calculator as a separate static-site feature unless the user asks otherwise.
- It should fit the existing ROA / cost-of-capital / expansion-yield notes in `.codex/client-notes-master.md`.
- Build it with static HTML, CSS, and vanilla JavaScript.
- Do not add a backend, persistence, packages, or real lender integrations.

## Delta Advanced Trucking

The client said Delta Advanced Trucking does not need to be removed from the demo.

Rules:

- It can remain as a fleet workspace/example label.
- Do not publish a real address unless verified from a reliable public source.
- If address verification is uncertain, use a generic fleet workspace label or omit the address.

## Future QA Checklist From This Call

Before presenting related work as done, check:

- Public homepage still supports Founding Fleet and sectors.
- Demo CTA label is clear and not awkward.
- Demo CTA reaches the new demo experience.
- Interactive demo sidebar exposes Command Center, Load Queue, Dispatch, Drivers, and other core workspaces.
- Driver portraits are not distorted.
- Driver names and portraits are not mismatched.
- Visible contact fields do not use `555`.
- Each important driver page has clickable, realistic document surfaces.
- Pre-trip, in-transit, and post-trip packets are represented where the load lifecycle is shown.
- POD includes signed BOL/proof, delivery timestamp, location/GPS detail, receiver/signature, and empty cargo/dock proof where relevant.
- Backhaul board connects to post-delivery operations and deadhead reduction.
- No visible page shows raw code or broken layout artifacts.
- No public copy claims live API/sync unless the project direction changes.
