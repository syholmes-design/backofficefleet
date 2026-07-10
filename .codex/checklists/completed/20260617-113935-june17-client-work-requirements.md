# Checklist: June 17 Client Work Requirements

Created: 2026-06-17 11:39:35 -05:00
Source: `.codex/client-work-requirements-20260617.md`; `recordings/Work2.txt`
Owner persona: `checklist-execution-steward`
Status: complete

## Scope

Convert the actual-work requirements isolated from `recordings/Work2.txt` into trackable BOF Website/demo work. This checklist coordinates June 17 client intent around settlements, safety, demo walkthrough readiness, confusing working-demo wording, Founding Fleet discoverability, pain-point positioning, 20-50 truck buyer focus, and go-to-market support.

This checklist is not authorization to build live APIs, Mapbox, RFID, GPS, traffic/weather, telematics, database, auth, portals, React/Next/TypeScript, npm packages, or backend services.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.
- Keep Founding Fleet bounded to the dedicated funnel unless the user explicitly asks to make it global again.
- Treat route, fuel, weather, detour, RFID, GPS, traffic, and telematics as simulated operating context only.
- Do not expand the current BOF website into cable, warranty, medical, behavioral health, or urgent-care positioning without a separate request.
- Prefer improving the existing static demo and buyer journey over adding decorative complexity.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| J17-001 | June 17 reference: settlements pay methods | Settlement surfaces show multiple driver pay methods: cents per mile, percentage of revenue, salary/straight time, gross-to-net, deductions, reimbursements, and readiness/hold logic. | complete | `.codex/checklists/active/20260611-150329-june11-audio-client-notes.md` J11-030 through J11-032; `Website/settlements/index.html`; `Website/interactive-demo/settlements/index.html` | Public `/settlements/` was restored on 2026-06-15; future work can deepen driver-level detail if needed. |
| J17-002 | June 17 reference: settlements review | Public Settlements page exists and is reviewable by the client. | complete | `.codex/checklists/completed/20260615-115640-restore-settlements-safety-pages.md`; `Website/settlements/index.html` | Keep as review target; do not mark new implementation needed unless client gives feedback. |
| J17-003 | June 17 reference: safety review | Public Safety page exists and is reviewable by the client. | complete | `.codex/checklists/completed/20260615-115640-restore-settlements-safety-pages.md`; `Website/safety/index.html` | `/safety-compliance/` remains compatibility fallback. |
| J17-004 | June 17 reference: demo flow | Audit the public/demo flow by clicking through as a fleet owner and confirming links move logically from loads to drivers, destinations, documents, settlements, safety, and next actions. | complete | `.codex/june17-demo-flow-audit.md`; Browser check clicked `/` -> `/interactive-demo/start/` -> `/interactive-demo/`; route sweep returned 200 for `/interactive-demo/documents/`, `/settlements/`, `/safety/`, `/founding-fleet/`, `/founding-fleet/apply/`, `/book-demo/`. | Flow should stay controlled around one load record before adding more features. |
| J17-005 | June 17 reference: presenter script | Create a practical fleet-owner demo walkthrough script that defines what to show first, what high points to hit, and how to explain why a fleet owner should hire BOF. | complete | `.codex/june17-fleet-owner-demo-walkthrough.md` | Script is presenter-ready and focused on fleet-owner value, not public marketing filler. |
| J17-006 | June 17 reference: working-demo wording | Find visible `working demo`, `bring your information`, `bring your issues`, or similar copy; clarify, rewrite, or remove confusing wording. | complete | `Website/index.html`; `.codex/june17-demo-flow-audit.md`; `rg -n -i "working demo|bring your information|bring your issue|bring your issues|messy record|static demo|static site|HTML text|reference demo|old demo|route maze|internal workspace|presenter script|click map|backend automation" Website --glob "*.html" --glob "*.js"` returned no matches. | Homepage CTA changed from `messy record` to `active fleet record`; `BOF working session` remains because it is plain and buyer-facing. |
| J17-007 | June 17 reference: route/fuel context | Inventory current route/origin/destination, incident, detour, weather, fuel, MPG, and audit-context surfaces in the demo; identify gaps that would strengthen the buyer walkthrough without adding live APIs. | complete | `.codex/june17-demo-flow-audit.md`; Browser check confirmed origin/destination, document step, and POD/GPS/photo settlement handoff in `/interactive-demo/`. | Keep route/fuel/weather/traffic as static simulated operating context unless user explicitly approves live integration planning. |
| J17-008 | June 17 reference: simplicity | Simplicity review: identify demo areas where old bells-and-whistles complexity, disconnected data sources, or decorative controls should be trimmed or left alone. | complete | `.codex/june17-demo-flow-audit.md` | Recommendation: keep one primary load story and avoid live-map/telematics/route-maze expansion before client review. |
| J17-009 | June 17 reference: three sales approaches | Verify the public site clearly supports the three sales approaches: BOF operating layer, Founding Fleet funnel, and concrete fleet pain points. | complete | `.codex/june17-demo-flow-audit.md`; `.codex/june17-client-review-packet.md`; `.codex/scripts/audit-founding-fleet-boundary.ps1` passed. | Homepage now stays operating-layer first; Founding Fleet is discoverable through its dedicated funnel rather than global overuse. |
| J17-010 | June 17 reference: Founding Fleet discoverability | Verify Founding Fleet benefits/application content is easy for the client to find during a demo, especially from `/founding-fleet/` and `/founding-fleet/apply/`. | complete | Browser/route sweep returned 200 for `/founding-fleet/` and `/founding-fleet/apply/`; `.codex/june17-client-review-packet.md`; `.codex/june17-fleet-owner-demo-walkthrough.md`. | Use direct funnel URLs during presentation; do not make Founding Fleet the global homepage story. |
| J17-011 | June 17 reference: pain points | Make fleet pain points concrete in buyer-facing copy and/or demo narration: fuel theft, seal mismatch, missing PODs, missing pre-departure docs, missing arrival/backend docs, and paperwork chaos. | complete | `Website/index.html`; `.codex/june17-fleet-owner-demo-walkthrough.md`; `.codex/june17-demo-flow-audit.md`. | Homepage now names POD, carrier-packet, settlement, driver-file, and document pressure; walkthrough names seal mismatch, missing PODs, pre/post-trip documents, paperwork chaos, and route/fuel watch. |
| J17-012 | June 17 reference: target customer | Check whether public copy and demo examples speak primarily to the 20-50 truck sweet spot and avoid generic enterprise SaaS language. | complete | `Website/index.html`; `Website/founding-fleet/index.html`; `Website/founding-fleet/apply/index.html`; `.codex/june17-fleet-owner-demo-walkthrough.md`. | Added 20-50 truck buyer language to homepage and Founding Fleet funnel. |
| J17-013 | June 17 reference: FMCSA-style targeting | Capture FMCSA-style targeting as a go-to-market research/planning note: fleet size, region, violations, safety score, maintenance, and efficiency indicators. | complete | `.codex/june17-go-to-market-notes.md` | Planning artifact only; no scraping or browsing performed. |
| J17-014 | June 17 reference: trucking hero | Create a team/go-to-market note for the `trucking hero` role: industry credibility, contacts, sales language, team training, and product-shaping responsibilities. | complete | `.codex/june17-go-to-market-notes.md` | Team/sales/product-shaping note, not a Website build task. |
| J17-015 | June 17 reference: future product build | Capture future product-building needs as planning only: technical people, tools, architecture, hosting, portals, and product buildout. | complete | `.codex/june17-go-to-market-notes.md`; static/scope scans clean. | No backend, framework, auth, database, API, or portal work added. |
| J17-016 | June 17 reference: client review packet | Prepare a concise client-review packet: what to review now, what is already complete, what remains open, and what is deferred. | complete | `.codex/june17-client-review-packet.md` | Packet names review routes, completed work, deferred work, and client decisions. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/site.js`; `node --check Website/assets/js/interactive-demo-routes.js`; `node --check Website/assets/js/partner-tms.js`. |
| Route checks | complete | `Invoke-WebRequest` returned 200 for `/`, `/interactive-demo/start/`, `/interactive-demo/`, `/interactive-demo/documents/`, `/settlements/`, `/safety/`, `/founding-fleet/`, `/founding-fleet/apply/`, `/book-demo/`, and `/assets/images/photos/site-pass/15-driver-file-working-session.webp`. |
| Browser/rendered check | complete | Browser clicked `/` -> `/interactive-demo/start/` -> `/interactive-demo/`; confirmed homepage 20-50 and active-record copy, demo role paths, app shell, selected load, origin/destination, documents, and POD/GPS/photo settlement handoff. Two aborted-transition console messages appeared during rapid navigation but no route or syntax failure occurred. |
| Source/privacy/stale-copy scans | complete | Confusing/internal wording scan returned no matches; live-integration claim scan returned no matches after excluding defensive "no live API" type wording. |
| Founding Fleet boundary audit | complete | `.codex/scripts/audit-founding-fleet-boundary.ps1` passed after removing the homepage Founding Fleet promo block and renaming the driver-page image asset. |
| Static/scope guardrail | complete | No live API, Mapbox, RFID, telematics, backend, auth, database, framework, or portal work added. |
| Runtime cleanup audit | complete | Preview server PID 45620 stopped; `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1` reported 0 candidate leftovers. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|
| Live Mapbox/API | Deferred | Client was unsure whether to bring it back; current project is static/shared-hosting safe. | User explicitly approves live map/API work. |
| Live RFID/fuel tank integration | Deferred | Treat as simulated fuel/audit context only. | User explicitly asks for real integration planning. |
| Live GPS, traffic, weather, telematics | Deferred | Current demo should simulate operating context without claiming live feeds. | User explicitly approves integration or research. |
| Cable/internet installation vertical | Deferred | Future market idea, not current BOF trucking Website scope. | User asks to plan or build that vertical. |
| Warranty/appliance service vertical | Deferred | Future market idea, not current BOF trucking Website scope. | User asks to plan or build that vertical. |
| Medical/behavioral health/urgent-care vertical | Deferred | Future market idea after trucking proof; not current BOF site positioning. | User asks to plan or build that vertical. |
| Production portals/backend architecture | Deferred | Mentioned as future product-building need, not current Website permission. | User explicitly asks for architecture planning or changes static-site boundary. |

## Closeout Summary

- Completed: All J17 rows are complete with evidence. This pass added the demo-flow audit, presenter walkthrough, go-to-market notes, client review packet, 20-50 truck buyer copy, clearer active-record CTA copy, Founding Fleet boundary cleanup, and the driver image asset rename.
- Remaining: None.
- Blocked: None.
- Deferred: Live integrations, future verticals, and production backend/portal buildout remain deferred until the user explicitly reopens them.
- Verification: Syntax checks, browser/rendered flow check, route checks, stale-copy scans, Founding Fleet boundary audit, static/scope guardrail, and runtime cleanup audit completed.
