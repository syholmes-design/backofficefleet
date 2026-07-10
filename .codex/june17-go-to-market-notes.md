# June 17 Go-To-Market And Product Planning Notes

Created: 2026-06-17
Checklist items: J17-013, J17-014, J17-015
Source: `.codex/client-work-requirements-20260617.md`

## Boundary

These notes support sales, research, staffing, and future product planning. They are not approval to add live integrations, scraping, databases, portals, auth, React, Next.js, TypeScript, npm tooling, backend services, or production architecture to the current static `Website`.

## FMCSA-Style Targeting Planning Note

Planning use:

- Build a prospecting profile for trucking fleets likely to need BOF's managed back-office operating layer.
- Prioritize fleets where growth has created paperwork, driver, document, settlement, safety, or dispatch-control pressure.

Useful targeting fields:

- Fleet size: start around 20-50 trucks or drivers.
- Region: begin near the team's strongest relationship geography, then expand by lane density.
- For-hire status: prioritize fleets with daily load movement and document pressure.
- Safety signals: violations, out-of-service indicators, expiring credential patterns, or recurring inspection issues.
- Maintenance signals: repeated equipment or inspection problems that create operational follow-up.
- Efficiency signals: fuel-cost pressure, route variance, late paperwork, POD delays, settlement holds, or preventable admin rework.
- Sales readiness: owner-led or operations-led companies where leadership still feels the back-office pain directly.

Research note:

- Do not scrape or browse from this goal. If the user asks for live prospect research, create a separate research task with source citations and privacy-safe handling.

## Trucking Hero Role Note

Purpose:

The "trucking hero" is an industry-experienced person who helps BOF sound credible to fleet owners and keeps product decisions grounded in how trucking operators actually work.

Responsibilities:

- Translate BOF into fleet-owner language during demos and working sessions.
- Explain driver files, POD/BOL proof, carrier packets, safety holds, dispatch pressure, settlement issues, and route/fuel context in plain trucking terms.
- Help recruit first conversations with fleet owners, operators, safety managers, dispatch leaders, and back-office managers.
- Train internal team members to walk through the demo without sounding like generic software presenters.
- Review demo records for believability: driver names, packet logic, settlement holds, proof photos, safety blockers, and owner next actions.
- Shape the future product roadmap by saying which controls matter in the field and which are decorative.

Candidate profile:

- Has trucking, dispatch, safety/compliance, carrier operations, fleet ownership, or transportation back-office experience.
- Has contacts with small and mid-sized fleets.
- Can speak practically without overpromising integrations or compliance outcomes.
- Understands the daily cost of missing paperwork, late PODs, fuel questions, seal disputes, and weak release decisions.

## Future Product-Building Planning Note

Client idea:

- Future BOF may need four or five technical people, tools, architecture, hosting, portals, and a larger product buildout.

Planning interpretation:

- Treat this as future product planning only.
- The current `Website` remains static, shared-hosting friendly, and built with HTML, CSS, vanilla JavaScript, static JSON, and assets.
- Do not add production portals, auth, database writes, live TMS sync, live telematics, or framework runtime without a separate user decision.

Future planning topics to capture separately if requested:

- Product architecture options.
- Hosting and security model.
- Customer portal/account model.
- Data ingestion strategy.
- TMS import/export boundaries.
- Document storage and audit retention.
- Human operations workflow.
- Compliance, legal, tax, insurance, and safety disclaimers.
- Internal team roles: frontend, backend, data/document systems, security/ops, product/industry SME.

Recommended next step:

- Finish client review of the static demo first. Use client feedback to decide which product surfaces deserve real architecture planning later.
