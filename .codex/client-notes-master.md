# BOF Master Client Notes

Last updated: 2026-06-08

## Purpose

This is the durable master note for BOF client direction, transcript notes, reference-demo observations, and implementation guardrails. Use it before planning or editing `Website`, especially when work touches the homepage, public buyer journey, `/interactive-demo/`, driver records, documents, command center, proof packets, founding fleet positioning, financial modeling, or TMS/partner workflow language.

This document summarizes client notes. It is not a request to add backend systems, real APIs, credentials, databases, frameworks, or heavy production scope.

For detailed instructions from the 2026-06-08 `work2.txt` client call, also read `.codex/client-call-work2-instructions.md`.

For the isolated actual-work requirements from the 2026-06-17 `recordings/Work2.txt` transcript, also read `.codex/client-work-requirements-20260617.md`. This newer reference focuses on settlements, safety, demo walkthrough, working-demo wording, Founding Fleet positioning, pain-point framing, 20-50 truck target customers, FMCSA-style targeting, and trucking-experienced go-to-market support.

For driver/DQF/document realism instructions from the 2026-06-09 client note, also read `.codex/driver-document-realism-instructions.md`.

For detailed instructions from the 2026-06-11 audio client notes, read `.codex/client-notes-20260611-audio-reference.md` and use `.codex/checklists/active/20260611-150329-june11-audio-client-notes.md`. For the related TMS/vendor simulation boundary, also read `.codex/tms-vendor-simulation-planning-20260611.md`.

For the active work2 completion ledger, use `.codex/checklists/active/20260608-091749-work2-master-completion.md` and `.codex/goals/work2-client-call-master-completion-goal.md`.

## Source Files Reviewed

- `Client Suggestions/ShowRecords.txt`
- `recordings/work.txt`
- `Client Suggestions/work2.txt`
- `recordings/Work2.txt`
- `Client Suggestions/1.odt`
- `Client Suggestions/Ascend-TMS.odt`
- `New Documents/Client-Suggestions.odt`
- `.codex/reference-demo-robustness-gap-note.md`
- `.codex/client-call-work2-instructions.md`
- `.codex/client-work-requirements-20260617.md`
- `.codex/driver-document-realism-instructions.md`
- `.codex/client-notes-20260611-audio-reference.md`
- `.codex/tms-vendor-simulation-planning-20260611.md`
- `Client Suggestions/Audio/6-11-26-1.txt`
- `Client Suggestions/Audio/6-11-26-2.txt`
- `Client Suggestions/Audio/6-11-26-3.txt`
- `.codex/reports/client-suggestions-1.txt`
- Current project decisions recorded in `AGENTS.md`

Extracted ODT text is stored under:

- `.codex/extracted-client-notes/1.txt`
- `.codex/extracted-client-notes/ascend-tms.txt`
- `.codex/extracted-client-notes/client-suggestions.txt`

## Current Resolved Direction

The client's direction evolved over time. Treat the latest resolved direction this way:

- Do not use visible `AscendTMS` wording in buyer-facing website/demo copy.
- Keep the workflow concept as a neutral `TMS import`, `partner load import`, `release review`, `BOF readiness review`, and `simulated handoff`.
- Do not build a real TMS API integration, live sync, webhook, credentials, `.env`, auth, database, backend routes, React, Next.js, TypeScript, npm package workflow, or production adapter.
- Simulate the partner/TMS workflow the same way the previous demo was simulated: static HTML, CSS, vanilla JS, JSON, synthetic records, shared-hosting safe.
- Preserve the business story behind the earlier AscendTMS request:
  - The TMS/load source manages the load workflow.
  - BOF manages readiness, compliance, documents, exceptions, audit trail, release decisions, settlement holds, claims support, and simulated handoff.
- BOF is not replacing the TMS.
- BOF should not be positioned as subordinate to a TMS.
- BOF should be shown as the operating proof and readiness layer beside the fleet's existing tools.
- Client call `work2.txt` reinforces that the TMS workflow should feel grounded in a real trucking system. Under the current resolved direction, translate that into a realistic simulated TMS import unless the user explicitly approves a named/live integration change.

## Public Website Positioning

The public site should focus on fleet owners and the Founding Fleet concept.

Main audience:

- For-hire trucking fleets and regular trucking companies.

Supporting audiences:

- Private fleets.
- Government fleets.
- Government-contracting fleets.

Important homepage direction:

- Bring back the Founding Fleet member idea from the original/reference website.
- The first page should appeal to fleet owners and explain how early members benefit.
- Founding Fleet should feel like a practical working session around real operating records, driver files, documents, and release problems.
- Do not make private/government fleet segments equal-weight hero messages. They can be supporting segments.
- Avoid making `BOF Vault` a public anchor unless the user explicitly revives that concept.
- Avoid visible `AscendTMS`.
- Preserve the older landing-page journey in spirit: visitors should see Founding Fleet / sector positioning before entering the demo, and demo CTAs should route into the newer BOF demo experience.
- Public sectors should include for-hire carriers, private fleets, government fleets, and government-contracting fleets.

## Core Product Story

Use this story throughout the site and demo:

> BOF helps fleet owners see whether a load, driver, carrier packet, and documents are ready, blocked, or risky before a release decision is made.

BOF should be known for:

- Operating visibility.
- Driver readiness.
- Document readiness.
- Compliance proof.
- Exception ownership.
- Audit trail.
- Release decision records.
- Settlement hold reasons.
- Claims packet support.
- Financial intelligence for fleet growth.

## TMS / Partner Workflow Notes

Earlier client scope requested an AscendTMS partner integration layer. Later client direction says not to show AscendTMS publicly and not to build real API/sync.

Preserve the useful business intent as a neutral static workflow:

- Partner TMS.
- Connected TMS.
- TMS import or partner load import.
- TMS-connected load review.
- TMS-connected release review.
- Imported load details.
- Imported from TMS.
- BOF driver matching.
- BOF readiness mapping.
- BOF release decision.
- Ready to sync back to TMS.
- External TMS record.
- Partner dispatch system.
- Simulated handoff / simulated partner sync.

If the old named routes remain for compatibility, visible copy should route buyers toward neutral paths such as:

- `/demo/tms-release-review/`
- `/integrations/partner-tms/`
- `/integrations/tms-workflow/`
- `/integrations/tms-workflow/release-review/`

Avoid customer-facing use of:

- `AscendTMS`
- `Ascend`
- `Ascend-branded`
- `official integration`
- `powered by AscendTMS`
- `AscendTMS-certified`
- `partner-approved integration`

Do not add real external calls.

If the user later provides real TMS prompts, screenshots, exports, or authorized account context, use that material as reference for a simulated workflow only unless the user explicitly changes the no-live-integration boundary. Do not store credentials, scrape private data, or claim live API authority.

## Responsibility Split

The source TMS/load workflow owns:

- Load creation.
- Load status.
- Dispatch workflow.
- Tendering.
- Customer/carrier load details.
- Uploaded load documents.
- TMS/accounting handoff.

BOF owns:

- Driver compliance rules.
- Driver document vault.
- Carrier packet review.
- Load readiness decision.
- Missing-document tracking.
- Pre-trip, in-route, and post-trip enforcement logic.
- Exception queue.
- Settlement hold reasons.
- Claims packet support.
- Audit trail.
- Management decision record.

Buyer-facing message:

> The TMS manages the load. BOF manages readiness, documents, exceptions, audit trail, release decisions, and handoff proof.

## Demo Robustness Standard

The client said the demo was not robust enough. In this project, robust means:

- Important clicks lead to complete, inspectable proof.
- Documents look and behave like real paperwork, not decorative cards.
- Drivers, PODs, document packets, carrier packets, and alerts are not thin summaries.
- The user can see what changed after clicking.
- Major clicks should update an in-view workspace, drawer, modal, or route page rather than only changing content below the fold.
- The demo should work for a fleet owner without a presenter explaining every detail.
- Keep the old reference demo's seriousness, but translate it into a lighter static shell.

Do not rebuild the old app's route maze or stack.

## Interactive Demo UX Notes

Client feedback from the transcript:

- In the old demo, major categories often changed to a different page.
- In the current demo, some category clicks changed content lower on the same page. The client noticed this and questioned whether it was useful.
- It may be acceptable to keep a load at the top and show Command Center details below, but the relationship must be clear.
- The demo needs a better answer to: "What changed when I clicked?"
- Command Center should not be vague. It should explain the selected load's operating picture.

Desired `/interactive-demo/` behavior:

- Sidebar and command buttons should change visible in-view state.
- Command Center, Load Queue, Dispatch, Drivers, Carriers, Documents, Safety, Reports, and Alerts should each show a clear current workspace.
- Notifications, driver rows, document rows, priority chips, and status buttons should open complete records or visible detail panels.
- The demo should still have a strong software-shell visual style, not a marketing-page feel.
- The app should have a way back to the website.
- Refreshing `/interactive-demo/` should stay in the control panel without replaying the loader.

## Command Center Requirements

The Command Center should answer:

- Where is the load?
- What is its status?
- Who is driving?
- What documents exist?
- What is missing?
- What is the priority?
- What should the owner do next?

Client mentioned possible Command Center context:

- Origin and destination.
- Load number.
- Whether the load is in route or delivered.
- Where the truck is on the route.
- Map or route view.
- Traffic condition.
- Weather condition.
- Telematics.
- RFID.
- Driver behavior or mistakes.
- Distance to destination.
- HOS / hours-of-service status.
- Fuel status.
- Backhaul opportunities.
- Pre-trip, in-transit, and post-trip packages.
- POD and supporting evidence after delivery.
- Audit trail.

If map/GPS/RFID/traffic/weather/HOS/fuel/telematics/backhaul are shown, label them as simulated operating context through product language, not developer language.

Backhaul should connect to the post-delivery workflow: after unloading, the driver looks for nearby opportunities that can move them back toward home or the next profitable lane, reducing deadhead return.

## POD Requirements

The POD should not be a thin placeholder.

Client specifically said POD should include:

- GPS information.
- Delivery timestamp.
- Receiver/signature.
- Picture of loading dock or delivery location.
- Picture of empty cargo/bin after delivery.
- Notes.
- Settlement/release consequence.
- Claim/dispute consequence when relevant.
- Lumper receipt or certification that the lumper was paid when a lumper is involved.
- Empty cargo/bin/trailer proof after unloading.

The POD should be easy to inspect in the current viewport.

## Driver And Document Requirements

The client repeatedly focused on drivers and documents as the easiest and most important proof area.

Requirements:

- Each driver should have a page.
- Each driver should have a picture.
- Do not reuse faces for drivers.
- Pull drivers from the original/reference demo where appropriate.
- Each driver page should have all their documentation.
- The documents should be clickable and inspectable.
- Documents should look like realistic paperwork, not just labels.
- Important pictures and document previews should be enlarged enough to see.
- Documents should be where the user can see them.
- Distinguish the fleet owner's own drivers from outside carrier records.
- Do not imply that a fleet owner manages another carrier's employee files.
- Driver names should match the apparent gender presentation of driver portraits.
- Do not use visibly distorted portraits.
- Do not use `555` phone numbers in visible contact fields.
- Do not expose real private phone numbers, addresses, emails, IDs, license numbers, bank values, tax IDs, or medical details.

Driver document categories expected:

- Driver license / CDL image.
- Medical card.
- MCSA exam summary.
- MVR.
- FMCSA / Clearinghouse compliance.
- W-9.
- I-9.
- Emergency contact.
- Bank / settlement setup.
- Insurance card when applicable.
- DQF compliance summary.
- Qualification file.
- Employee handbook acknowledgement.
- Benefits enrollment.
- Life insurance beneficiary election.
- Flexible spending account election.
- Garnishment / withholding summary when present.
- Driver application.
- Resume / work history where useful.
- Prior employer inquiry where useful.
- Road test / annual review where useful.
- Safety acknowledgements.
- Dispatch eligibility / assignment context.

Additional 2026-06-09 driver/DQF realism direction:

- The current BOF demo is believable at the operating-record level; the next realism gap is document-level depth.
- BOF driver documents should feel like a back-office department, not only a polished document vault.
- Prioritize improvements in this order: DQF folder expansion, audit trail/version history, document request workflow, generated HR/safety forms, readiness scoring, and failed-compliance examples.
- DQF folder structure should include employment application, CDL, medical examiner certificate, road test certificate, annual review of driving record, MVR, safety performance history, drug and alcohol clearinghouse consent, drug test results, driver agreement, driver handbook acknowledgement, ELD acknowledgement, accident register, training records, corrective actions, and disciplinary notices.
- Documents should look used when appropriate: handwritten notes, highlights, reviewer stamps, signatures, rejected versions, revised versions, expiration warnings, original upload dates, reviewed-by fields, and renewal reminders.
- Important documents should expose uploaded by, uploaded date, last reviewed by, review date, version number, approval/rejection state, audit trail, owner, and next action.
- Include failed-compliance examples such as failed MVR review, expired medical card, clearinghouse issue, missing employment verification, missing annual review, or rejected/revised upload.
- Add DQF readiness scoring or score-like summaries tied to visible categories, such as `DQF Readiness: 91%`.
- BOF should show employer-generated paperwork such as Annual MVR Review, Driver Warning Notice, Safety Counseling Form, Accident Review Form, Return-to-Work Form, and Training Completion Certificate.
- Add document requests with states such as Requested, Reminder Sent, Received, In Review, Rejected, and Approved.
- Full detailed implementation criteria live in `.codex/driver-document-realism-instructions.md`.

Load-specific driver packet stages expected by the client:

- Pre-trip packet: rate confirmation, master service agreement or work schedule, pickup instructions, tire/equipment inspection, cargo/loading inspection, loaded cargo photo, seal record when relevant, and departure blockers.
- In-transit packet: GPS lane, route deviation, weather, traffic, alternate route decision, HOS/OOS status, driver safety events, fuel status when shown, and audit notes.
- Post-trip packet: POD, signed BOL, receiver/signature, delivery timestamp, GPS/location detail, dock/delivery photo, empty cargo proof, lumper receipt if applicable, settlement release consequence, and claim/insurance documentation only when relevant.

Current completed driver direction:

- 12 reference drivers were pulled into the static site.
- Driver routes exist under `/interactive-demo/drivers/drv-001/` through `/drv-012/`.
- Each driver route has a unique portrait.
- Driver pages expose masked roster fields, emergency relationship information, CDL reference, and 20 clickable document categories.
- Private raw values from the reference driver records must remain masked.

## Priority Logic

The demo must distinguish high, medium, and low priority in a way that makes operational sense.

Use examples like:

- High priority: release, compliance, document, or assignment issue can block dispatch today.
- Medium priority: planning can continue, but proof or renewal evidence must clear before commitment.
- Low priority: normal staging or monitoring, not a release blocker.

Priority should connect to:

- Driver readiness.
- Missing or rejected documents.
- POD proof.
- Carrier packet.
- Release decision.
- Settlement or claims consequence.
- Owner next action.

## Carrier / Fleet Owner Reconciliation

Client concern:

- "How do you reconcile the different carriers?"
- This is a fleet owner looking at his own driver, not the driver of a different carrier.

Implementation rule:

- Fleet-owned driver files should be separate from outside carrier packet readiness.
- Carrier packet pages can show authority, insurance, agreement, W-9, operations contact, and lane confirmation.
- Do not show outside carrier employee files as if they belong to the fleet owner.

## Reference Demo Depth To Preserve

The old/reference demo felt more robust because it had:

- Role-based entry paths.
- Deep operational route coverage.
- Proof packets with required documents, sources, statuses, links, and settlement effects.
- Load artifact registry.
- Driver vault depth.
- Dispatch lifecycle and status timelines.
- Claim, settlement, and finance consequence surfaces.
- Customer/driver/manager/shipper portal context.
- Stateful demo editing behavior.
- Guided demo framing.

Static-safe translation:

- Do not rebuild Next.js, React, TypeScript, APIs, node_modules, or route maze.
- Preserve the proof depth with static routes, in-view drawers, tables, document surfaces, and route-backed records.
- Important objects should feel inspectable: load file, driver file, carrier packet, document gate, release note, audit history.

## Financial Intelligence / ROA Model

Client wants BOF to show a Return on Assets plus Cost of Capital plus Expansion Yield model for fleet owners, CFOs, and lenders.

Core concept:

1. Asset cost: truck purchase or lease.
2. Operating expenses: fuel, maintenance, tires, insurance, driver, compliance, BOF service cost.
3. Revenue per truck.
4. Return on assets.
5. Cost of borrowing.
6. Net return spread: fleet owner's ROI vs lender's ROI.
7. Fleet expansion impact: adding trucks increases profit.

BOF framing:

> BOF calculates the return on assets for each truck and compares it to the cost of capital. This shows the fleet owner how much profit each truck generates above the borrowing rate, and how much value is created by expanding the fleet.

Useful model components:

- Purchase price.
- Down payment.
- Loan terms.
- Interest rate.
- Depreciation curve.
- Fuel.
- Maintenance.
- Tires.
- Insurance.
- Driver wages.
- Compliance such as ELD, IFTA, permits.
- BOF service cost.
- Revenue per mile.
- Miles per month.
- Load mix.
- Seasonality.

Formula:

```text
ROA = Net Operating Profit / Asset Cost
Spread = ROA - Cost of Borrowing
```

Client suggested borrowing ranges:

- 8-12 percent for equipment loans.
- 12-18 percent for subprime.
- 6-9 percent for strong credit.

Demo language:

> BOF models the return on each truck and compares it to the cost of borrowing. If a truck generates a 28 percent return and the cost of capital is 10 percent, BOF shows the 18 percent value spread the fleet owner captures. BOF then models how adding 1, 5, or 10 trucks increases total profit and ROA.

## Delta Advanced Trucking

Client note:

- Find the real address for Delta Advanced Trucking before placing it in visible copy.

Rule:

- Verify with a reliable public source before using a real address.
- If verification is uncertain, use a generic fleet workspace label instead of inventing an address.

## What Not To Do

Do not:

- Use visible `AscendTMS` wording unless the user explicitly reverses the later direction.
- Build real API/sync/auth/database/backend behavior.
- Add credentials, `.env`, or secrets.
- Add React, Next.js, TypeScript, npm packages, `node_modules`, or framework runtime to `Website`.
- Use customer-facing phrases such as `static demo`, `mockup`, `fake API`, `reference demo`, `old demo`, `route maze`, or developer explanations.
- Expose raw private driver data from `bof-web-Original`.
- Reuse driver faces.
- Let clickable-looking demo items be dead.
- Let public-site or demo elements look clickable when they do nothing. Use `.codex/client-click-affordance-ledger.md` as the tracking rule: clickable-looking items must navigate, open detail, update state, show a disabled reason, or be restyled as non-interactive.
- Leave important updates below the fold with no visible in-view feedback.
- Treat a document list as complete unless the important items open believable document surfaces.

## Implementation Priorities

Current priority order for future work:

1. Preserve and extend driver/document proof quality.
2. Keep Command Center useful and visible.
3. Make POD and proof/media packets realistic.
4. Strengthen proof packet registry and document consequences.
5. Keep Founding Fleet positioning strong on the public site.
6. Add financial intelligence / ROA model when the public story needs CFO-level proof.
7. Avoid extra demo scope unless it addresses a real client note or broken path.

Additional `work2.txt` QA priorities:

- Simplify confusing CTA labels such as `Try Records Demo` to `Demo`, `Try Demo`, or `View Demo`.
- Ensure the public site never shows raw code or broken right-side layout artifacts.
- Ensure mobile/hamburger navigation still exposes the expected public links.
- Ensure the interactive demo sidebar is discoverable once the buyer enters the app shell.

## Persona / Skill Triggers

Use these project personas when relevant:

- `client-advocate-project-manager`: client-personality-aware project management, checklist shaping, acceptance gates, specialist routing, and scope control before broad client-driven work is implemented or called done.
- `ascendtms-integration-researcher`: source-cited web research for AscendTMS/InMotion Global/TheFreeTMS integration claims, EDI/API/workflow references, partner docs, and source hygiene before AscendTMS-related simulation planning.
- `client-demo-proof-advocate`: client obsessiveness over record/document/detail completeness.
- `reference-driver-documentation-auditor`: driver documentation parity against `bof-web-Original`.
- `demo-document-reality-director`: real-looking paperwork and document surfaces.
- `demo-ux-usability-director`: clicks should update visible in-view workspaces.
- `interactive-demo-czar`: hands-on product shell and demo density.
- `client-scope-translator`: translate heavy ChatGPT/client scope into static shared-hosting-safe implementation.
- `runtime-resource-steward`: clean up leftover preview/browser/snapshot processes.

## Open Follow-Up Ideas

These are not automatic tasks. Use them only if the user asks or a client-facing gap remains:

- Build a Founding Fleet page or section if the homepage still underplays it.
- Add a public ROA / expansion yield model section or interactive static calculator.
- Strengthen POD surface with GPS, receiver, dock photo, empty cargo photo, settlement and claim effects.
- Add a compact Command Center lifecycle strip: imported, pre-trip, in-route, document gate, release decision, post-trip/POD, handoff.
- Add role lenses only if needed: fleet owner, dispatcher, safety/compliance, document desk, carrier operations.
- Build a master proof packet registry for BOF-RR-10482 with source, filename, status, required flag, owner, release effect, settlement effect, and claim effect.
