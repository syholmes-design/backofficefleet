# Checklist: June 17 Client Work Requirements

Created: 2026-06-17 11:39:35 -05:00
Source: `.codex/client-work-requirements-20260617.md`; `recordings/Work2.txt`
Owner persona: `checklist-execution-steward`
Status: active

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
| J17-004 | June 17 reference: demo flow | Audit the public/demo flow by clicking through as a fleet owner and confirming links move logically from loads to drivers, destinations, documents, settlements, safety, and next actions. | pending |  | Use Browser/visual QA; produce findings before implementation. |
| J17-005 | June 17 reference: presenter script | Create a practical fleet-owner demo walkthrough script that defines what to show first, what high points to hit, and how to explain why a fleet owner should hire BOF. | pending |  | Should be a presenter-ready reference, not public marketing filler. |
| J17-006 | June 17 reference: working-demo wording | Find visible `working demo`, `bring your information`, `bring your issues`, or similar copy; clarify, rewrite, or remove confusing wording. | pending |  | Preserve useful `BOF working session` language only if it is plain and buyer-facing. |
| J17-007 | June 17 reference: route/fuel context | Inventory current route/origin/destination, incident, detour, weather, fuel, MPG, and audit-context surfaces in the demo; identify gaps that would strengthen the buyer walkthrough without adding live APIs. | pending |  | Do not add Mapbox/RFID/live telematics; scope a static simulation if needed. |
| J17-008 | June 17 reference: simplicity | Simplicity review: identify demo areas where old bells-and-whistles complexity, disconnected data sources, or decorative controls should be trimmed or left alone. | pending |  | Avoid one-more-feature drift. |
| J17-009 | June 17 reference: three sales approaches | Verify the public site clearly supports the three sales approaches: BOF operating layer, Founding Fleet funnel, and concrete fleet pain points. | pending |  | Respect Founding Fleet boundary; do not reintroduce global Founding Fleet overuse. |
| J17-010 | June 17 reference: Founding Fleet discoverability | Verify Founding Fleet benefits/application content is easy for the client to find during a demo, especially from `/founding-fleet/` and `/founding-fleet/apply/`. | pending |  | Existing Founding Fleet funnel exists; this item is discoverability/presenter usability. |
| J17-011 | June 17 reference: pain points | Make fleet pain points concrete in buyer-facing copy and/or demo narration: fuel theft, seal mismatch, missing PODs, missing pre-departure docs, missing arrival/backend docs, and paperwork chaos. | pending |  | Use proof/control/financial-consequence framing; avoid scare-copy bloat. |
| J17-012 | June 17 reference: target customer | Check whether public copy and demo examples speak primarily to the 20-50 truck sweet spot and avoid generic enterprise SaaS language. | pending |  | Larger fleets and sectors stay secondary. |
| J17-013 | June 17 reference: FMCSA-style targeting | Capture FMCSA-style targeting as a go-to-market research/planning note: fleet size, region, violations, safety score, maintenance, and efficiency indicators. | pending |  | Do not scrape or browse unless separately requested; this is a planning artifact unless user asks for research. |
| J17-014 | June 17 reference: trucking hero | Create a team/go-to-market note for the `trucking hero` role: industry credibility, contacts, sales language, team training, and product-shaping responsibilities. | pending |  | This is not a Website build task, but it supports demo/presenter readiness. |
| J17-015 | June 17 reference: future product build | Capture future product-building needs as planning only: technical people, tools, architecture, hosting, portals, and product buildout. | pending |  | Must not trigger backend/framework work in `Website`. |
| J17-016 | June 17 reference: client review packet | Prepare a concise client-review packet: what to review now, what is already complete, what remains open, and what is deferred. | pending |  | Useful before the next client/team meeting. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | pending | Run if any Website JS changes. |
| Route checks | pending | Required after link/copy/page changes. |
| Browser/rendered check | pending | Required for demo-flow or visible page edits. |
| Source/privacy/stale-copy scans | pending | Scan for internal/developer wording, live-integration claims, `555`, and confusing `working demo` language. |
| Founding Fleet boundary audit | pending | Run `.codex/scripts/audit-founding-fleet-boundary.ps1` if non-funnel pages change Founding Fleet language. |
| Static/scope guardrail | pending | Confirm no live API/Mapbox/RFID/telematics/backend/framework work added. |
| Runtime cleanup audit | pending | Required after preview/browser/snapshot runs. |

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

- Completed: Initial completed evidence recorded for public settlements/safety restoration and settlement pay-type coverage.
- Remaining: Demo flow audit, presenter script, working-demo wording cleanup, route/fuel simulation gap review, sales positioning review, pain-point copy/demo review, 20-50 truck focus review, FMCSA-style planning note, trucking-hero note, product-building planning note, and client-review packet.
- Blocked: None.
- Deferred: Live integrations, future verticals, and production backend/portal buildout.
- Verification: Pending until implementation/review items are executed.
