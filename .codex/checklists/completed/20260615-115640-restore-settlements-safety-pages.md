# Checklist: Restore settlements and safety pages

Created: 2026-06-15 11:56:40 -05:00
Source: User/client request on 2026-06-15
Owner persona: `checklist-execution-steward`
Status: completed

## Scope

Restore the public `Website` routes the client asked for: `settlements` and `safety`. Use the old `bof-web-Original` routes only as intent/reference material, keep the active site static, and make the restored pages discoverable from existing buyer-facing pages.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | User/client request on 2026-06-15 | Restore a public `/settlements/` page in `Website` that covers settlement queue, gross/net pay, deductions, packet status, holds, manager review, and safety/document consequences. | completed | `Website/settlements/index.html` | Static HTML page restored from reference intent; no framework code. |
| CL-002 | User/client request on 2026-06-15 | Restore a public `/safety/` page in `Website` that covers safety queue, driver credential status, dispatch blocks, safety evidence, and settlement/claim impact. | completed | `Website/safety/index.html` | Static HTML page restored; old `/safety-compliance/` remains as fallback. |
| CL-003 | User/client request on 2026-06-15 | Add discoverable links to the restored pages from existing buyer-facing routes without turning them into global framework/navigation churn. | completed | `Website/index.html`, `Website/solutions/index.html`, `Website/walkthrough/index.html`, `Website/demo-paths/index.html`, `Website/drivers/index.html`, `Website/trust-governance/index.html` | Public links now use `/safety/`; settlement links added on Home and Solutions. |
| CL-004 | Project guardrails | Verify the work remains static/shared-hosting safe and does not reintroduce framework code, internal/developer wording, or stale client-facing copy. | completed | Validation commands below | No CSS/JS changes; no cache bump required. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | completed | `node --check Website\assets\js\site.js`; `node --check Website\assets\js\interactive-demo-routes.js`; `node --check Website\assets\js\partner-tms.js` |
| Route checks | completed | Local route existence scan for restored/linked pages passed; anchor checks passed for referenced `operations-record` IDs. |
| Browser/rendered check | completed | In-app browser checked `/settlements/` and `/safety/` at desktop and 390px mobile width: H1/title present, no horizontal overflow. |
| Source/privacy/stale-copy scans | completed | `rg` scan found no internal/static-demo/reference-demo/stale-copy terms in changed pages. |
| Runtime cleanup audit | completed | Temporary preview server on port `8127` stopped; follow-up port check found no listener. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: Restored `/settlements/` and `/safety/`, updated public links, preserved `/safety-compliance/` as compatibility fallback.
- Remaining: None for this request.
- Blocked: None.
- Deferred: No site-wide nav expansion; pages are linked from high-intent buyer-facing routes instead.
- Verification: JS syntax, route existence, operations-record anchor checks, stale-copy scan, browser desktop/mobile render check, image URL checks, and preview cleanup all passed.

