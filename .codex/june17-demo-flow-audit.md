# June 17 Demo Flow Audit

Created: 2026-06-17
Checklist items: J17-004, J17-006, J17-007, J17-008, J17-009, J17-010, J17-011, J17-012
Source: `.codex/client-work-requirements-20260617.md`

## Scope

This audit checks the current static BOF Website and demo flow from a fleet-owner perspective. It does not approve live Mapbox, RFID, GPS, weather, traffic, telematics, API, database, auth, backend, framework, or portal work.

## Fleet-Owner Flow

Recommended presenter path:

1. `/`
   - Start with the operating-layer promise: BOF helps the owner see what is cleared, blocked, owned, and next.
   - Evidence: `Website/index.html` includes the operating-layer section and now names the 20-50 truck for-hire fleet as the primary first buyer.
2. `/interactive-demo/start/`
   - Use the access screen to choose the fleet-owner review path.
   - Evidence: role links include Fleet owner, Dispatcher, Safety desk, Carrier ops, and Settlement / claims.
3. `/interactive-demo/`
   - Open the command shell around BOF-RR-10482 / TMS-LD-10482.
   - Confirm the buyer can move from load queue to release decision, driver, carrier, documents, safety, settlement, alerts, and reports inside the app shell.
4. `/interactive-demo/documents/`
   - Show BOL, POD state, GPS/location, dock photos, empty cargo proof, and claim folder logic.
   - Evidence: `Website/interactive-demo/start/index.html` links settlement/claims directly to documents.
5. `/settlements/`
   - Show public settlement explanation and pay/readiness language.
   - Evidence: restored public page exists at `Website/settlements/index.html`.
6. `/safety/`
   - Show public safety explanation and safety hold language.
   - Evidence: restored public page exists at `Website/safety/index.html`.
7. `/founding-fleet/` and `/founding-fleet/apply/`
   - Close with the early-offer path only if the prospect fits the Founding Fleet funnel.
   - Evidence: Founding Fleet pages contain priority onboarding, 20% discount, 2-week trial, application, and now explicit 20-50 truck fit language.

## Route And Fuel Context Inventory

Current static demo already represents useful route/fuel/incident context without adding live integrations:

- Origin/destination: `Website/interactive-demo/index.html` includes Origin and Destination fields; `Website/assets/js/site.js` stores multiple load origins and destinations.
- In-transit context: `Website/assets/js/site.js` includes GPS lane, current route, seven-mile construction detour, alternate route, HOS availability, safety event, fuel status, and on-track answer.
- Weather/traffic/fuel context: `Website/assets/js/site.js` and `Website/assets/js/interactive-demo-routes.js` describe HOS, weather, fuel, and traffic as operating context.
- POD and proof context: `Website/assets/js/site.js` and `Website/assets/js/interactive-demo-routes.js` include POD, GPS/location, receiver signature, dock photo, empty cargo photo, seal photo, and settlement watch.
- Seal mismatch/claim readiness: `Website/assets/js/interactive-demo-routes.js` includes seal evidence and claim evidence folder behavior.

Gap decision:

- Keep this as static simulated operating context. Do not add live Mapbox, live GPS, RFID, telematics, traffic, weather, or fuel integrations unless the user explicitly changes scope.
- If later strengthened, add one static "route variance and fuel impact" record inside the existing app shell rather than a separate map product.

## Working Demo Wording Review

Search target: `working demo`, `bring your information`, `bring your issue`, `bring your issues`, `messy record`.

Findings:

- No visible `working demo`, `bring your information`, `bring your issue`, or `bring your issues` copy was found in `Website`.
- `BOF working session` appears repeatedly and is plain enough to keep because it names a focused conversation around one load, driver file, document packet, or release issue.
- The homepage CTA `Bring one messy record into a BOF working session` was tightened to `Bring one active fleet record into a BOF working session` in `Website/index.html`.

## Simplicity Review

Keep:

- One main load story: BOF-RR-10482 / TMS-LD-10482.
- Role-based entry points from `/interactive-demo/start/`.
- In-shell movement between queue, dispatch, drivers, carriers, documents, safety, settlements, alerts, and reports.
- Static route/fuel/weather/POD context as proof attached to the operating record.

Avoid:

- Reintroducing old route maze complexity.
- Adding live maps or live telematics.
- Adding disconnected feature pages that do not help the owner answer, "Can this load move, what is blocked, who owns it, and what happens next?"
- Adding another data set unless it supports a clear presenter contrast: ready, watch, or hold.

## Three Sales Approaches

1. BOF operating layer
   - Supported on `/`, `/demo/`, `/walkthrough/`, `/interactive-demo/start/`, and `/interactive-demo/`.
   - Buyer proof: records, owners, blockers, consequences, next actions.
2. Founding Fleet funnel
   - Supported on `/founding-fleet/`, `/founding-fleet/trial/`, `/founding-fleet/pricing/`, `/founding-fleet/apply/`, and compatibility `/founding-fleets/`.
   - Boundary preserved: Founding Fleet remains a dedicated funnel, not the global site story.
3. Concrete fleet pain points
   - Supported through public copy and the walkthrough script: POD gaps, seal proof, driver readiness, document holds, settlement holds, carrier packet issues, fuel/route watch, and paperwork chase.
   - Homepage now names 20-50 truck for-hire fleets and the back-office pressure that makes BOF relevant.

## Client-Ready Finding

The demo flow is usable for a fleet-owner walkthrough if the presenter follows one controlled route: homepage, demo entry, command shell, documents/POD, safety/settlements, then Founding Fleet or working-session close. The current site should not get more feature-heavy before client review; the stronger next move is to walk the current flow and collect client feedback.
