# BackOfficeFleet Codex Auto-Load Instructions

This repository contains a project-local Codex operating layer in `.codex/`. Any Codex session or shared agent setup that opens this folder should use it automatically before planning or editing.

## Start Here

1. Read `.codex/session-brief.md` for the short project orientation.
2. Read `.codex/registry/route-ownership.json` before route, page, link, demo, portal, or generated-artifact work.
3. Read `.codex/registry/agents.json` and `.codex/registry/skills.json` to choose the right project specialist behavior.
4. Run `npm run codex:registry-sync` when validating that the shared setup can see the project-local environment.

## Default Behavior For This Project

- Explain owner-facing findings in plain English first, then add a technical appendix.
- Treat BackOfficeFleet as a static/generated trucking operations demo operating system, not a production database-backed SaaS app.
- Use `docs/BOF_ROUTE_MAP.md` before editing routes.
- Use source-of-truth mapping before editing drivers, loads, documents, settlements, workbooks, generated artifacts, localStorage demo state, or Zustand stores.
- Avoid sweeping generated asset folders into default context unless the task explicitly targets documents or proof packets.

## Important Environment Warnings

- This shared folder may live under OneDrive or another cloud-sync provider. If Node reports `UNKNOWN: unknown error, read`, move or clone the project to a fully local non-cloud path such as `C:\dev\bof-web`, reinstall dependencies, and rerun checks.
- The current workspace may not have `.git` metadata. Restore or initialize Git before serious implementation work.
- Browser audits require `npm run audit:install-browsers` and a running dev server.

## Project Commands

Use these commands as the shared Codex setup’s entrypoints:

```powershell
npm run codex:bootstrap
npm run codex:registry-sync
npm run audit:demo-completeness
npm run audit:install-browsers
npm run codex:before-demo
```

## Key Files

- `.codex/session-brief.md` - shortest practical project briefing.
- `.codex/README.md` - how the local Codex environment is organized.
- `.codex/manifest.json` - machine-readable environment manifest.
- `.codex/registry/*.json` - agents, skills, scripts, routes, and reports.
- `docs/codex-environment-runbook.md` - environment stabilization and before-demo runbook.
- `docs/BOF_ROUTE_MAP.md` - active route ownership source of truth.
