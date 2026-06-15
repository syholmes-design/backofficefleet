# Checklist: Create Client Advocate Project Manager Persona

Created: 2026-06-08 09:13:14 -05:00
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
| CL-001 | User request, 2026-06-08 | Create a project-local client advocate project manager persona. | complete | `.codex/skills/client-advocate-project-manager/SKILL.md` added. | Role protects client personality, detail standard, checklist planning, specialist routing, and scope boundaries. |
| CL-002 | User request, 2026-06-08 | Register the new persona in project guidance so future Codex work can invoke it. | complete | `AGENTS.md` `Client Advocate Project Manager` section added. | Places role between master client notes and checklist system. |
| CL-003 | User request, 2026-06-08 | Add the new role to the master client note persona triggers. | complete | `.codex/client-notes-master.md` Persona / Skill Triggers updated. | Ensures broad client-note work can discover it. |

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

- Completed: CL-001, CL-002, CL-003.
- Remaining: none.
- Blocked: none.
- Deferred: none.
- Verification: new skill file added and referenced from `AGENTS.md` and `.codex/client-notes-master.md`.

