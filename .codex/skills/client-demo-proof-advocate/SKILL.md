---
name: client-demo-proof-advocate
description: "Use for BOF client-facing demo completeness, clickable demo audits, dense document-backed proof, client-specific record obsessiveness, driver/POD/document realism, priority logic, and ensuring every important demo click leads to a complete inspectable record surface without rebuilding the heavy route maze."
---

# Client Demo Proof Advocate

Use this project-local skill when BOF demo work must satisfy a client who expects every meaningful click to reveal complete, realistic, inspectable proof.

This client is detail-obsessed in a specific operational way. He is not asking for generic polish. He wants to open a record and see the exact trucking proof a fleet owner would ask for: driver documents, POD evidence, GPS, dock or cargo photos, origin/destination, priority, route status, audit trail, owner, and next action.

## Purpose

Protect the BOF demo from shallow clickable surfaces. The new static `Website` should remain slim, but important demo links, rows, cards, statuses, document names, load IDs, driver IDs, carrier IDs, POD IDs, priority labels, and command-center actions must lead to complete, client-safe proof.

This role advocates for proof depth, but it must not leak its audit language into visible website copy. The buyer should see release packets, operations records, readiness packets, document records, and next actions. They should not see terms like proof file, click map, static demo, HTML document surface, route maze, or client-safe unless that language is intentionally buyer-facing.

## Client-Specific Detail Standard

Treat these as recurring client expectations from `recordings/work.txt` and `Client Suggestions/ShowRecords.txt`:

- `AscendTMS` should not appear in visible website/demo copy. Use buyer-facing neutral language such as TMS import, partner load import, release review, operations record, or BOF readiness review.
- The homepage should speak first to Founding Fleet members and for-hire trucking fleets, with private fleets and government/government-contracting fleets supported but not dominant.
- Driver records matter. Each important driver should have an inspectable page or in-app record with all expected documents, not a thin summary.
- A realistic driver file should include roughly 20 document/status items when the surface is meant to feel complete: driver license/CDL, medical card, MCSA exam summary, MVR, clearinghouse, drug and alcohol policy acknowledgement, safety acknowledgements, ELD/mobile acknowledgement, employment application, resume/work history, prior employer inquiry, road test, annual review, emergency contact, tax/payment setup, bank/settlement setup, owner-operator packet if applicable, dispatch eligibility, safety hold status, and current assignment context.
- Reconcile fleet-owned drivers versus outside carrier records. A fleet owner can inspect his own driver files; outside carrier records should be framed as carrier packet readiness, not as employee files the fleet controls.
- POD detail must feel real. A POD should include delivery timestamp, GPS/location detail, receiver/signature, dock photo, seal photo when relevant, empty cargo/bin photo after delivery, notes, owner, settlement effect, claim effect, and next action.
- Command Center must answer what it is for: where the load originated, where it is going, whether it arrived or is in route, who the driver is, what documents exist, where the POD/photos are, what the telematics/HOS/fuel/traffic/weather/backhaul context says, what the audit trail proves, and what the next action is.
- Pre-trip, in-transit, and post-trip packets should be visible when the scenario involves movement: driver sign-off, dispatch sign-off, owner/manager sign-off, current route condition, and post-delivery proof.
- High, medium, and low priority labels must explain why they matter. Priority is not decoration; it should map to dispatch risk, document blocker, credential hold, customer/settlement consequence, or owner urgency.
- Pictures and documents should be large enough to inspect. Avoid tiny thumbnails, decorative paper blocks, or document names that do not open a visible record.
- Important category clicks should either open a dedicated page or an in-view app workspace/drawer that feels like a destination. Do not hide the useful change below the fold without clear focus.

## Transcript-Driven Inspection Questions

When reviewing a demo surface, ask the questions the client kept circling back to:

- If I click this record, what changed in the current view, and can I tell immediately?
- What is this page or panel supposed to do for the fleet owner?
- Where did the load originate, where is it going, did it arrive, or is it still in route?
- Who is the driver, and is this the fleet owner's own driver file or an outside carrier readiness packet?
- Where are the documents for this load, driver, carrier, or trip?
- Where is the POD, and does it show GPS/location, timestamp, receiver/signature, dock or cargo photos, notes, and settlement/claim consequence?
- Does the pre-trip, in-transit, or post-trip packet show who signed off: driver, dispatch, owner, or manager?
- What do high, medium, and low priority mean in operating terms?
- What mistake, blocker, missing item, or owner decision is the demo trying to surface?
- If this is Command Center, does it give a high-level operating picture: location, route, driver behavior, HOS, fuel, traffic, weather, documents, POD/photos, and backhaul context?

These questions should drive audits and implementation choices. They should not be copied into buyer-facing page text.

## Red Flags For This Client

- A button or sidebar item changes content only below the fold without focusing or showing an in-view result.
- A driver row opens only a thin bio/status card instead of a driver file.
- A document name opens a tiny preview, decorative paper, or placeholder-like summary.
- A POD lacks GPS/location, photo, receiver/signature, or consequence.
- A priority chip is just a color label.
- Command Center looks impressive but does not answer where the load is, what happened, and what the owner should do.
- Outside carrier readiness is written like the fleet owner controls another company's employee file.
- Client-requested public language, such as no visible `AscendTMS`, Founding Fleet focus, or no `BOF Vault`, drifts back into the site.
- Real company identifiers, DOT/MC numbers, addresses, policy numbers, or compliance claims are invented instead of verified or generalized.

## When To Use

- A demo page adds or changes clickable cards, rows, proof chips, document links, or CTAs
- The user asks for a dense, robust, full-fledged, or client-safe demo
- Documents, packets, driver files, carrier readiness, load readiness, trip release, dispatch gates, or proof drawers are involved
- A page risks feeling like a mockup instead of an inspectable demo
- Codex needs to compare new `Website` demo depth against `bof-web-Original`
- The user references the client's obsessiveness, transcript, ShowRecords notes, POD detail, driver pages, enlarged pictures, full driver documents, priority meaning, Command Center purpose, or old-demo depth

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant `Website/*.html`, `Website/assets/css/styles.css`, and `Website/assets/js/site.js`
- `recordings/work.txt`
- `Client Suggestions/ShowRecords.txt`
- `.codex/reference-demo-robustness-gap-note.md`
- `bof-web-Original/bof-web/docs/BOF_ROUTE_MAP.md`
- `bof-web-Original/bof-web/lib/demo-access.ts`
- `bof-web-Original/bof-web/docs/project-environment-assessment.md` sections on route model and generated documents

Use `bof-web-Original` only as reference. Do not edit it.

## Reference Standard

The old demo had deep route and document expectations: command center, dispatch, loads, load readiness, trip release, shipper portal, drivers, driver detail, driver vault, documents, document vault, carrier packets, safety, settlements, maintenance, generated driver docs, generated load docs, proof artifacts, and evidence files.

The new static site should not copy that route maze, but it must preserve the client-facing expectation that important clicks resolve into complete documents, packets, or proof explanations.

For this client, "complete" means more than a status card. It means the click answers the practical inspection question: can I see the driver file, the POD, the location, the photo, the owner, the priority reason, and what changes the dispatch decision?

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Inventory clickable demo surfaces in the relevant page(s): links, buttons, cards, table rows, document names, load IDs, driver IDs, carrier IDs, proof chips, tabs, accordions, and status controls.
3. Classify each item as complete, incomplete, decorative, guided-only, or should-not-be-clickable.
4. For each important item, verify the destination exists and carries enough proof: who uses it, what is blocked/cleared, what document proves it, who owns the next action, and what happens next.
5. For driver surfaces, require a driver-file packet or drawer with realistic document categories, dispatch eligibility, safety status, owner, consequence, and current assignment.
6. For POD/document surfaces, require readable/enlarged proof with GPS/location, timestamp, photos, receiver/signature, owner, settlement/claims consequence, and next action when applicable.
7. For Command Center surfaces, require a selected-load operating picture: origin, destination, current location/status, driver, carrier, documents, POD/photo state, audit trail, priority reason, and next action.
8. For priority/status chips, verify they explain why the work is high, medium, low, ready, watch, review, or hold.
9. Require complete document surfaces for named documents and proof packets. Coordinate with `demo-document-reality-director` when realism is the issue.
10. Preserve static-site restraint. Use anchors, panels, tabs, and static HTML document sections before adding many new pages.
11. Recommend hiding or deactivating weak clicks until they can be completed.
12. Run local link checks and visual snapshots when implementation changes clickable demo surfaces.
13. When copy changes are visible to buyers, coordinate with `persuasive-onpage-copywriter` to convert audit/completeness wording into product language.

## Checks

- Does every important clickable demo element resolve locally?
- Does the destination look complete, not placeholder-like?
- Is each named document represented by real-looking selectable HTML text or a complete static file?
- Do load, driver, carrier, packet, and document IDs stay consistent across pages?
- Does each status have consequence, owner, proof, and next action?
- Does each important driver have an inspectable driver file, not just a name and status?
- Does the driver file distinguish fleet-owned driver documents from outside carrier packet readiness?
- Does each POD or delivery-proof surface include GPS/location, timestamp, receiver/signature, dock/cargo photo context, settlement/claim effect, and next action?
- Are pictures, POD previews, BOLs, licenses, medical cards, and other document surfaces large enough to inspect?
- Does Command Center explain where the load is, where it came from, where it is going, whether it arrived or is in route, who is driving, what documents exist, and what the owner should do next?
- Do high/medium/low priority labels map to clear operational consequences?
- If a category click stays inside the same page, does it open an in-view workspace/drawer that clearly changed, instead of only changing below-fold content?
- Are weak or unfinished surfaces hidden, non-clickable, or clearly labeled guided-only?
- Is the proof density strong enough to satisfy a client comparing it to the old demo?
- Does the solution stay static and lightweight?
- Does visible copy describe BOF value rather than the audit method used to prove demo completeness?

## Output Format

```markdown
## Client Demo Proof Review

Reference standard:
Pages reviewed:
Clickable surfaces checked:
Complete proof paths:
Missing/incomplete proof paths:
Client-detail gaps:
Driver-file realism:
POD/photo/document visibility:
Command Center purpose:
Priority/status explanation:
Documents/packets required:
Hide-or-complete recommendations:
Priority order:
Verification:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not reintroduce Next.js, React, TypeScript, npm, `node_modules`, `.next`, or server runtime assumptions.
- Do not invent real private data, legal claims, customer names, DOT numbers, policy numbers, or compliance guarantees.
- Do not accept decorative document mockups as proof.
- Do not expose "proof advocate" audit terminology as public website copy.
- Do not expand into backend document automation, PDF generation internals, settlements logic, claims workflows, accounting, or integrations.
- Do not reintroduce visible `AscendTMS` language unless the user explicitly reverses that client note.
- Do not invent Delta Advanced Trucking's real address. Verify it from a reliable source before visible use, or use a generic fleet workspace label.
- Do not represent an outside carrier driver's personnel file as if the fleet owner controls it.
- Do not shrink important proof into unreadable thumbnails just to fit a layout.
