# June 17 Client Review Packet

Created: 2026-06-17
Checklist item: J17-016
Source: `.codex/client-work-requirements-20260617.md`

## What To Review Now

1. Public homepage
   - Route: `/`
   - Review whether BOF now speaks clearly to the 20-50 truck for-hire fleet owner and explains the operating-layer value.
2. Demo entry
   - Route: `/interactive-demo/start/`
   - Review whether a fleet owner can choose the right path into the release review.
3. Interactive demo shell
   - Route: `/interactive-demo/`
   - Review whether BOF-RR-10482 / TMS-LD-10482 makes sense as the main controlled walkthrough record.
4. Documents and proof
   - Route: `/interactive-demo/documents/`
   - Review POD, GPS/location, dock photo, empty cargo proof, seal proof, and claim-folder logic.
5. Public settlements page
   - Route: `/settlements/`
   - Review pay methods, settlement readiness, proof-controlled holds, and finance follow-up language.
6. Public safety page
   - Route: `/safety/`
   - Review safety blockers, driver readiness, and operating decision language.
7. Founding Fleet funnel
   - Routes: `/founding-fleet/`, `/founding-fleet/trial/`, `/founding-fleet/pricing/`, `/founding-fleet/apply/`
   - Review whether the early-offer path is easy to find and keeps the first 10 fleets / 20% / 2-week trial story clear.

## Completed In This Pass

- Created a fleet-owner demo flow audit: `.codex/june17-demo-flow-audit.md`.
- Created a practical presenter walkthrough: `.codex/june17-fleet-owner-demo-walkthrough.md`.
- Created go-to-market and future-product planning notes: `.codex/june17-go-to-market-notes.md`.
- Replaced confusing homepage `messy record` wording with `active fleet record`.
- Added 20-50 truck buyer focus to the homepage, Founding Fleet fit copy, and Founding Fleet application context.

## Already Complete Before This Pass

- Public Settlements page restored and reviewable.
- Public Safety page restored and reviewable.
- Settlement surfaces already show multiple pay/readiness concepts, with room for future deeper driver-level detail if the client asks.

## Deferred On Purpose

- Live Mapbox, GPS, traffic, weather, telematics, RFID, and fuel tank integrations.
- Live FMCSA scraping or prospect research.
- Production portals, backend architecture, auth, database, framework, or hosting buildout.
- Cable, warranty, medical, behavioral health, urgent-care, or other non-trucking vertical expansion.

## Recommended Meeting Flow

1. Start at `/` and explain BOF as the operating layer for 20-50 truck fleets.
2. Open `/interactive-demo/start/` and choose the fleet-owner path.
3. Show one record through the app shell, documents, POD/proof, safety, and settlements.
4. Open `/founding-fleet/` only if the buyer fits the early-offer conversation.
5. End at `/book-demo/` with one active fleet record the prospect wants BOF to review.

## Decision Needed From Client

- Is the 20-50 truck focus correct for the first selling motion?
- Is `BOF working session` clear enough now that the homepage says `active fleet record`?
- Should a future static route/fuel variance record be added, or is the current simulated route/fuel context enough for the first review?
- Is the Founding Fleet funnel easy enough to present without moving it back into the global homepage story?
