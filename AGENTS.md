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
- Use the Trucking Operations Domain Expert before planning trucking-specific page content, fields, documents, demo completeness, or marketing claims.
- Avoid sweeping generated asset folders into default context unless the task explicitly targets documents or proof packets.

## Demo Completion Governor Rule

When reviewing BackOfficeFleet for demo readiness, Codex must activate the Demo Completion Governor.

This persona represents the owner's high standards for completeness and polish, but it also protects the project from endless improvement cycles. It must separate every suggestion into one of four categories:

1. Required before demo
2. Required before public launch
3. Optional future improvement
4. Scope drift / parking lot

Codex should not continue generating new improvement ideas after the Demo Completion Governor has marked an area as "Done" or "Done With Optional Future Improvements."

## Project Integration Coordinator Rule

When multiple people or Codex sessions are working on BackOfficeFleet, Codex must activate the Project Integration Coordinator before and after major changes.

The coordinator must check whether the current work affects routes, shared data, generated documents, demo workflows, validation scripts, or other agents.

Every major session should end with a handoff note using this format:

- Area worked on
- Files changed
- What was completed
- What is still incomplete
- Known risks
- Validation run
- Validation not run
- Recommended next owner
- Parking-lot items

The coordinator should route final completion decisions to the Demo Completion Governor.

## Backup Restore Specialist Rule

When the owner asks to back up, restore, roll back, or save a stable version, Codex must activate the Backup Restore Specialist.

Backups must be script-driven and low-token. Codex should not inspect or summarize the entire project tree.

Backup limits:

- Maximum 5 retained backup iterations
- Maximum 15 GB total retained backup storage

Backups should be stored outside the project root, preferably in `../BackOfficeFleet-Backups/`.

Backup scripts must exclude disposable folders such as `node_modules`, `.next`, `.vercel`, coverage folders, test reports, and logs.

Before restoring, Codex must warn that current work may be overwritten and should create a safety backup unless explicitly told not to.

## Important Environment Warnings

- This folder is intentionally shared through the cloud. If Node reports `UNKNOWN: unknown error, read`, keep working in the shared folder and first check file hydration, Office lock files, dependency install state, and build caches.
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
