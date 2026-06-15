# Document Processing Checklist: work2 Client Call Instruction Extraction

Created: 2026-06-08 09:05:16 -05:00
Source documents:

- Client Suggestions/work2.txt

Owner persona: `checklist-execution-steward`
Status: active

## Extraction Notes

| Source | Extracted? | Output / Evidence | Notes |
|---|---|---|---|
| Client Suggestions/work2.txt | complete | `.codex/client-call-work2-instructions.md`; `.codex/client-notes-master.md`; `AGENTS.md` Master Client Notes pointer | Transcript converted into durable instructions and master-note references. |

## Requirements

| ID | Source | Requirement | Category | Status | Evidence | Notes |
|---|---|---|---|---|---|---|
| DOC-001 | Client Suggestions/work2.txt | Capture pre-trip, in-transit, and post-trip load packet expectations. | demo/content/data | complete | `.codex/client-call-work2-instructions.md` sections `Load Packet Lifecycle`; `.codex/client-notes-master.md` Driver/POD additions | Includes rate confirmation, inspections, route/HOS/weather, POD, signed BOL, lumper, empty cargo, settlement/claim consequences. |
| DOC-002 | Client Suggestions/work2.txt | Capture backhaul board and deadhead reduction logic. | demo/content | complete | `.codex/client-call-work2-instructions.md` `Backhaul Board And Deadhead Logic`; `.codex/client-notes-master.md` Command Center addition | Backhaul must connect to post-delivery operations and return/home-lane efficiency. |
| DOC-003 | Client Suggestions/work2.txt | Capture driver credential/document realism requirements. | demo/documents | complete | `.codex/client-call-work2-instructions.md` `Driver Documentation Standard`; `.codex/client-notes-master.md` Driver additions | Includes primary/secondary driver documents, unique photos, no distorted portraits, gender/name matching. |
| DOC-004 | Client Suggestions/work2.txt | Capture no-`555` and safe synthetic contact-data rules. | data/content | complete | `.codex/client-call-work2-instructions.md` `Contact Data And Synthetic Realism`; `.codex/client-notes-master.md` Driver additions | Balances client realism request with privacy/synthetic-data safety. |
| DOC-005 | Client Suggestions/work2.txt | Capture public landing-page, Founding Fleet, sectors, and demo routing intent. | website/navigation | complete | `.codex/client-call-work2-instructions.md` `Public Website Journey`; `.codex/client-notes-master.md` Public Website additions | Old landing journey remains in spirit; demo CTA routes into new demo. |
| DOC-006 | Client Suggestions/work2.txt | Capture navigation/labeling issues from the call. | ux/validation | complete | `.codex/client-call-work2-instructions.md` `Navigation And Labeling Notes`; `.codex/client-notes-master.md` Implementation Priorities additions | Includes `Try Records Demo` confusion, mobile hamburger, raw code artifact, demo sidebar discoverability. |
| DOC-007 | Client Suggestions/work2.txt | Capture TMS realism expectation while preserving current static/no-live-integration boundary. | scope/integration | complete | `.codex/client-call-work2-instructions.md` `TMS Import Realism`; `.codex/client-notes-master.md` Current Resolved Direction/TMS additions | Treat future TMS prompts/screenshots as simulation references unless user reverses boundary. |
| DOC-008 | Client Suggestions/work2.txt | Capture financial calculator follow-up as static future feature. | future-scope | complete | `.codex/client-call-work2-instructions.md` `Financial Calculator Note` | Connects to existing ROA/cost-of-capital notes without adding backend scope. |

## Contradictions Or Resolved Direction

| Conflict | Resolved Direction | Source / Reason |
|---|---|---|
| Transcript emphasizes using a real named TMS/account; current project direction says no live API/sync and no visible named TMS wording. | Keep the current static, neutral TMS import simulation unless the user explicitly reverses it. Use authorized TMS material only as reference for the simulated workflow. | User prior direction plus `AGENTS.md` AscendTMS Simulation Boundary; `work2.txt` client call. |
| Client dislikes `555` numbers, but demo must not expose real private contact data. | Avoid `555`; use safe fictional/role-based contact patterns or omit personal phone fields if safe realism cannot be guaranteed. | `work2.txt`; synthetic data safety rules. |

## Implementation Queue

| Order | Requirement ID | Action | Status | Evidence |
|---|---|---|---|---|
| 1 | DOC-001 through DOC-008 | Create durable extracted instruction document. | complete | `.codex/client-call-work2-instructions.md` |
| 2 | DOC-001 through DOC-008 | Update master client notes so future Codex passes discover the call guidance. | complete | `.codex/client-notes-master.md` |
| 3 | DOC-001 through DOC-008 | Update AGENTS pointer to include `work2.txt` and the new instruction document. | complete | `AGENTS.md` Master Client Notes section |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| All explicit requirements represented | complete | DOC-001 through DOC-008 |
| Out-of-scope items marked deferred/not_applicable | complete | Conflict table preserves no-live-integration/static boundary and no real private contact data. |
| Current-state verification complete | complete | Durable files created/updated; no `Website` implementation changes made. |
| Final summary prepared | complete | Final response prepared for user. |

