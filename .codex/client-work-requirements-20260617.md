# BOF Client Work Requirements Reference: 2026-06-17 Work2

Source: `recordings/Work2.txt`
Created: 2026-06-17
Purpose: isolate the parts of the transcript that describe actual work requirements, excluding personal financial discussion, equity discussion, and general encouragement.

## Interpretation Boundary

This reference captures client intent from the transcript. It is not approval to add live APIs, Mapbox, RFID integrations, GPS tracking, databases, credentials, auth, React, Next.js, TypeScript, npm packages, backend services, or production portals.

Translate requirements into the current BOF static/shared-hosting direction unless the user explicitly changes scope:

- HTML, CSS, vanilla JavaScript, static JSON, and static assets.
- Simulated route, fuel, safety, settlement, and proof context.
- Buyer-facing language only.
- No visible claims of live TMS, GPS, Mapbox, RFID, weather, traffic, or telematics integration unless explicitly approved.
- Keep the demo simpler than the old overbuilt version; do not reintroduce route maze complexity just because a feature was mentioned.

## Highest Priority Requirements

### 1. Make Settlements Show Multiple Pay Methods

Source lines: `1-8`, `593-595`

The client wants settlement/payment surfaces to show that BOF can handle different driver compensation models:

- cents per mile
- percentage of load revenue
- salary or straight-time pay
- gross-to-net settlement processing
- deductions, reimbursements, and settlement readiness

Acceptance direction:

- Settlement pages should show varied payment logic, not a single generic pay row.
- Driver settlement detail should explain why pay is ready, pending, or held.
- Settlement status should connect to documents, safety, POD/BOL proof, and manager approval.

### 2. Audit And Understand The Demo Flow

Source lines: `9-34`, `78-96`, `599-615`, `635-643`

The client wants the team to be able to walk a fleet owner through the demo confidently.

Actual requirements:

- Click through the demo and confirm the flow makes sense.
- Confirm links move logically from loads to drivers, destinations, documents, settlements, and safety.
- Build or maintain a practical demo walkthrough script.
- Define what should be shown first.
- Explain the high points of why a fleet owner should hire BOF.
- Make the demo understandable enough that 4-5 team members could walk an owner through it.
- Hold a team review meeting around the demo and next steps.

Acceptance direction:

- The demo should support a presenter, but should not require a presenter to explain basic navigation.
- The walkthrough script should be practical, not generic marketing copy.
- The demo path should lead toward fleet-owner conversion.

### 3. Resolve The "Working Demo / Bring Your Issues" Wording

Source lines: `11-32`, `596-607`

The client questioned homepage/demo copy that sounded like: bring your information, bring your issue, or working demo.

Actual requirement:

- Find the phrase and decide whether it clearly supports the sales flow.
- If it means a BOF working session around a real fleet issue, explain it plainly.
- If it cannot be explained clearly, remove or rewrite it.
- Treat this as optional, not core product positioning.

Acceptance direction:

- Avoid vague phrases like `working demo` if they confuse the client.
- Prefer concrete buyer-facing phrases such as `BOF working session`, `bring one fleet record`, `release issue review`, or `walk through one operating blocker`.

### 4. Add Route, Incident, Weather, Detour, And Fuel Context Carefully

Source lines: `35-60`

The client remembered prior route/map and fuel concepts and wants the demo to preserve the operating logic where useful.

Actual requirements:

- A load should show origin and destination.
- Route context can show where the load starts, where it ends, and what happens in between.
- Traffic, weather, detours, or route changes should be logged when they affect operations.
- Detours should explain fuel impact or route variance.
- Fuel status should be visible when relevant.
- Refueling should show tank-level change, fuel spend, MPG, and audit context.
- Fuel-related exceptions should support fleet expense control.

Important constraint:

- The client was unsure whether Mapbox or old APIs should return.
- Treat Mapbox, RFID, live GPS, live weather, live traffic, and live telematics as simulated product context unless explicitly approved.

### 5. Keep The Demo Simpler Than The Old Version

Source lines: `61-73`

The client does not want too many bells and whistles.

Actual requirements:

- Avoid adding features just because the old demo had them.
- Use one clean data set where possible.
- Do not scatter many data sources into many disconnected views.
- Preserve useful route/fuel/safety concepts only if they strengthen the buyer walkthrough.

Acceptance direction:

- Each added demo element must support a fleet-owner sales point, proof record, or operating decision.
- Avoid decorative complexity.

### 6. Clarify The Three Website Sales Approaches

Source lines: `101-149`, `355-385`

The client described three possible public-site approaches:

1. BOF operating layer: BOF prepackages records, looks for exceptions, and adds a readiness layer.
2. Founding Fleet: focus on founding members, program benefits, assessment/application, and why early fleets should join.
3. Pain points: lead with the problems fleet owners already feel and show how BOF relieves them.

Actual requirements:

- Make sure the site can explain what BOF brings to the table.
- Make the Founding Fleet program easy to find and explain.
- Consider whether Founding Fleet benefits belong on the application path.
- Create or preserve a beginning sales/demo script for fleet owners.
- Ensure the client can find the right page while presenting.

Acceptance direction:

- Do not make Founding Fleet a vague sprinkle across the site.
- Do not hide pain-point language behind abstract product claims.
- The site should help the client answer: why hire BOF now?

### 7. Make Fleet Pain Points Concrete

Source lines: `149-162`, `364-368`

Pain points specifically named:

- drivers stealing fuel
- seal mismatch
- missing PODs
- missing pre-departure documents
- missing arrival/backend documents
- lack of documentation readiness
- paperwork chaos for growing fleets

Actual requirements:

- Show how BOF overcomes these pain points.
- Connect pain points to proof, controls, owner visibility, and financial consequence.
- Use pain points in sales copy, demo narration, and proof examples where appropriate.

### 8. Target The 20-50 Truck Sweet Spot

Source lines: `163-191`, `203-225`, `337-354`

The client identified the strongest initial customer profile:

- trucking companies with roughly 20-50 trucks/drivers
- big enough to feel chaos
- not yet large enough to have mature systems and salaried control staff
- likely to pay for organization, controls, and savings

Additional targeting idea:

- Use FMCSA-style data to identify fleets by size, region, violations, safety score, maintenance problems, or poor efficiency.
- Prioritize companies already showing signs of need.

Acceptance direction:

- Public copy and demo examples should speak to the operational pain of 20-50 truck fleets first.
- Larger fleets and other sectors can remain secondary.
- Avoid generic enterprise SaaS language that skips this specific buyer.

### 9. Use Industry Credibility To Reach Fleet Owners

Source lines: `226-238`, `249-306`, `587-592`, `614-617`, `635-643`

The client wants trucking-experienced people involved in sales, training, and product shaping.

Actual requirements:

- Find or plan for a `trucking hero`: someone with industry experience, credibility, contacts, and the ability to speak the language.
- This person may help recruit fleets, train the team, and shape the product.
- The team may need more than one industry person.
- The team also needs people who can walk through the demo with fleet owners.
- Next step after demo understanding: get those industry people/drivers on board and start talking to fleet owners.

Acceptance direction:

- This is a go-to-market/team requirement, not a website build by itself.
- Website/demo language should make it easier for an industry person to present BOF credibly.

### 10. Capture Product-Building Needs Without Starting A Backend Build

Source lines: `271-284`

The client mentioned future product-building needs:

- four or five technical people
- tools
- architecture
- hosting service
- portals
- product buildout

Interpretation:

- This is future product planning, not permission to add a framework or backend to the current static website.
- If product architecture is requested later, treat it as a separate planning document or implementation decision.

## Adjacent Industry Ideas

These are future-market references, not current BOF website requirements unless the user explicitly asks.

### Cable / Internet Installation Fleets

Source lines: `386-458`

Operational ideas that could later translate beyond trucking:

- daily job/equipment pre-check
- required tools and equipment before departure
- customer appointment reminders and confirmation
- GPS route and job-stop proof
- off-route or missing-stop detection
- field photo support
- remote guidance with videos or office support

### Warranty / Appliance Service Fleets

Source lines: `459-496`

Operational ideas:

- parts checklist before leaving
- stop plan for the day
- GPS route tracking
- equipment/parts accountability
- remote photo/video guidance
- reduce repeated visits caused by missing parts

### Medical, Behavioral Health, Urgent Care

Source lines: `307-314`, `499-509`

The client sees these as later back-office markets after trucking is proven.

Current rule:

- Do not expand the BOF trucking site into medical/cable/warranty positioning now.
- Keep notes for future strategy only.

## Immediate Follow-Up Items From This Transcript

Source lines: `593-643`

1. Review the restored Settlements page.
2. Review the restored Safety page.
3. Find and clarify Founding Fleet content.
4. Find and clarify the `working demo` / `bring your issues` language.
5. Make the demo understandable enough for a fleet-owner walkthrough.
6. Prepare the team to walk through the demo.
7. Identify trucking-experienced people who can help sell, train, and shape the product.
8. Start talking to fleet owners after the demo path is understood.

## Explicit Non-Requirements And Deferrals

Do not treat these as immediate build tasks:

- Personal income, equity, succession, or valuation discussion.
- Live Mapbox/API restoration without explicit approval.
- Live RFID/fuel-tank integration.
- Live GPS, traffic, weather, telematics, customer reminders, or field-service tracking.
- Building production portals, hosting architecture, or backend systems.
- Expanding the current BOF website into cable, warranty, medical, behavioral health, or urgent care positioning.
- Adding too many demo features at the expense of clarity.

## Relationship To Existing Work2 Reference

Use this document alongside `.codex/client-call-work2-instructions.md`.

- `.codex/client-call-work2-instructions.md` remains the detailed reference for load packets, driver documents, POD proof, backhaul logic, TMS simulation, and document realism.
- This document is the June 17 reference for actual work requirements around settlements, safety, demo walkthrough, positioning, target customer, pain-point framing, and go-to-market readiness.
