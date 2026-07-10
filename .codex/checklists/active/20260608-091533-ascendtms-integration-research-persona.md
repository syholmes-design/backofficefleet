# Checklist: Create AscendTMS Integration Research Persona

Created: 2026-06-08 09:15:33 -05:00
Source: User request, 2026-06-08
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Convert the source into atomic checklist items and process them one at a time.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | User request, 2026-06-08 | Create a persona whose job is to search the web for AscendTMS integration sources. | complete | `.codex/skills/ascendtms-integration-researcher/SKILL.md` added. | Research-only role; does not build live integration. |
| CL-002 | User request, 2026-06-08 | Register the AscendTMS researcher in project guidance. | complete | `AGENTS.md` AscendTMS Simulation Boundary updated. | Requires current web research, source citations, and source hygiene. |
| CL-003 | User request, 2026-06-08 | Add the role to master client-note persona triggers. | complete | `.codex/client-notes-master.md` Persona / Skill Triggers updated. | Future client-driven work can discover it. |
| CL-004 | User request, 2026-06-08 | Preserve the no-live-integration boundary while enabling research. | complete | Skill safety boundaries plus `AGENTS.md` scope language. | Findings must be handed to client advocate/scope translator before implementation. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | not_applicable | Process/skill guidance only; no Website JS changed. |
| Route checks | not_applicable | No Website route changed. |
| Browser/rendered check | not_applicable | No rendered UI changed. |
| Source/privacy/stale-copy scans | complete | Edited files are Codex guidance docs only; no buyer-facing copy or private values added. |
| Runtime cleanup audit | not_applicable | No preview server, browser automation, or snapshot process started. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: CL-001, CL-002, CL-003, CL-004.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: new skill added and referenced from `AGENTS.md` and `.codex/client-notes-master.md`.

