# BackOfficeFleet Project-Local Codex Environment

This folder makes the shared BackOfficeFleet workspace self-describing for Codex.

## What To Load Automatically

- `session-brief.md` for the quick orientation.
- `manifest.json` for machine-readable setup metadata.
- `registry/agents.json` for project-specific specialist behaviors.
- `registry/skills.json` for reusable behavior rules.
- `registry/route-ownership.json` for priority routes, source-of-truth files, and generated artifact zones.
- `registry/scripts.json` for audit and validation commands.
- `registry/reports.json` for owner-facing report locations.

## Agent Folders

- `agents/` contains project-specific roles.
- `skills/` contains reusable behavior checklists.
- `playbooks/` contains workflows for before-demo, route changes, document workflows, marketing polish, and owner decisions.
- `reports/` stores owner-facing audit outputs.

## Domain Expert

Use `agents/trucking-operations-domain-expert.md` whenever BackOfficeFleet content needs to feel believable to trucking operators, dispatchers, compliance managers, safety managers, or fleet owners.

## Shared Setup Contract

Any shared Codex setup that opens this repo should:

1. Read `../AGENTS.md`.
2. Run `npm run codex:bootstrap` or `npm run codex:registry-sync`.
3. Use `.codexignore` to avoid loading generated artifact noise by default.
4. Prefer plain-English owner summaries followed by technical appendices.
