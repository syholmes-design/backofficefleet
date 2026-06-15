---
name: client-scope-translator
description: "Use when BOF client instructions are copied from ChatGPT or prescribe heavy stacks such as React, Next.js, TypeScript, APIs, databases, adapters, services, or integrations; translates the business intent into static/shared-hosting-friendly Website work and flags when a new language is truly necessary."
---

# Client Scope Translator

Use this project-local skill when a client request describes a dramatic scope change, heavy technical architecture, framework-specific implementation, real integration, or backend/API work that may need to be translated into the current static BOF website environment.

## Purpose

Honor the client's intended outcome while converting implementation details into the lightest faithful approach for `Website`: HTML, CSS, vanilla JavaScript, JSON, compressed assets, and static routes.

## When To Use

- Client-provided specs mention React, Next.js, TypeScript, components, services, API adapters, databases, auth, webhooks, `.env`, build/lint/typecheck, npm packages, or backend routes.
- The client appears to have copied a ChatGPT-generated implementation plan without understanding the current repo.
- The visible result can likely be achieved with a lighter static version.
- A request might require a new language, runtime, package, framework, API credential, database, or server behavior.
- The user asks how to handle a large client scope change without bloating the site.

## Context To Load

- `AGENTS.md`
- `.codex/agents/client_scope_translator.md`
- `.codex/frontend-demo-architecture.md` only if the scope affects website/demo architecture
- The client instruction file or pasted request
- Current relevant `Website` pages
- `static-frontend-architect` and `shared-hosting-performance-guardian` skills when implementation is likely

## Procedure

1. Read the client instruction first and extract the user-facing/business intent.
2. Separate client intent from prescribed technical machinery.
3. Map heavy terms into static equivalents:
   - Component -> HTML section or reusable markup pattern.
   - Type/interface -> documented JSON shape.
   - Adapter/service -> vanilla JS helper over static JSON.
   - API call/webhook -> mocked boundary and future integration note.
   - Database -> static JSON/CSV when saved user state is not required.
   - Route -> static folder with `index.html`.
4. Decide whether the request can be done with HTML/CSS/vanilla JS/JSON.
5. If a new language is considered, prefer shared-hosting-compatible options only after proving static files cannot satisfy the visible goal.
6. Identify future phases honestly: real API credentials, live sync, auth, persistence, uploads, payments, and database writes are not Phase 1 static website work.
7. Produce a translated implementation plan or handoff to the right project persona.

## Checks

- Does the translated version preserve the client's visible/business outcome?
- Does it avoid unnecessary framework/runtime weight?
- Does it keep BOF static and shared-hosting friendly?
- Are real integration boundaries labeled honestly?
- Is buyer-facing copy free of internal terms like `static demo`, `mockup`, `ChatGPT`, or `client copied`?
- If a new language is proposed, is it necessary and compatible with ordinary shared hosting?

## Output Format

```markdown
## Client Scope Translation

Client intent:
Heavy prescription:
Static translation:
New language needed:
Future phase boundary:
Recommended implementation:
Validation:
Risks:
```

## Failure Modes

- Translating away a requirement that mattered to the client.
- Treating a real API/auth/database requirement as if static files can honestly fulfill it.
- Introducing a framework because the client request named one.
- Creating visible copy that says `demo data`, `mockup`, or other internal build language.

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add TypeScript, React, Next.js, package installs, `node_modules`, `.next`, bundlers, or server runtimes by default.
- Do not add PHP, database code, `.env`, credentials, or API calls without explicit user approval.
- Do not promise live sync unless it is real.
- Use `website-backup-steward` before broad implementation based on a translated client scope.
