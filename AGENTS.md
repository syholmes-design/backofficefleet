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

- Maximum 20 retained backup iterations
- Maximum 15 GB total retained backup storage

Backups should be stored outside the project root, preferably in `../BackOfficeFleet-Backups/`.

Backup scripts must exclude disposable folders such as `node_modules`, `.next`, `.vercel`, coverage folders, test reports, and logs.

Before restoring, Codex must warn that current work may be overwritten and should create a safety backup unless explicitly told not to.

## Quiet Shared-Backup Rule

When multiple people are using Codex on this shared project, activate the Quiet Backup Rollback Steward silently before meaningful edits.

Codex should avoid heavy collaboration process unless requested. Before meaningful changes, Codex should identify the latest usable shared rollback checkpoint and keep only a minimal note of files touched when a note is useful.

Shared rollback checkpoints are separate from main project backups:

- Main backups stay in `../BackOfficeFleet-Backups/` and keep the existing 20-backup / 15 GB retention rule.
- Shared rollback checkpoints stay in `../BackOfficeFleet-Shared-Rollback/`.
- Shared rollback checkpoints use `bof-shared-checkpoint-*.zip`.
- Shared rollback checkpoints have no count limit.
- Shared rollback checkpoints are constrained only by total storage size, defaulting to 15 GB.

If one user dislikes changes made by another Codex session, Codex should first offer to restore from the shared rollback system, either fully or by selected files.

Do not assign blame, require branches, or create long reports unless the rollback is risky.

## Change Memory Backup Rule

For meaningful edits, activate the Change Memory Reconstruction Steward.

This project uses normal backups plus change-memory backups. A change-memory backup does not copy full files. It records what changed, where it changed, why it changed, and how Codex can reverse or reconstruct the previous state if normal backups fail.

When possible, Codex should save a patch/diff record under:

```text
.codex/change-memory/patches/
```

Codex should also save a plain-English reverse instruction under:

```text
.codex/change-memory/reverse-instructions/
```

Use `npm run codex:change-memory` after meaningful edits, and pass `--files` for focused entries when unrelated work is already present.

Do not create noisy change-memory entries for tiny typo fixes, generated build folders, `node_modules`, `.next`, or formatting-only changes.

## Quiet Token and Rate Limit Steward Rule

Codex must conserve both context tokens and usage/rate limits quietly.

Use the Quiet Token and Rate Limit Steward when a task may involve:

- large files,
- generated assets,
- full-project audits,
- repeated validations,
- screenshots,
- backup or restore work,
- multi-agent review,
- long logs,
- or broad route scanning.

Default behavior:

1. Classify the task internally as Small, Medium, or Large.
2. Read `.codex/registry` before exploring.
3. Prefer scripts over manual scanning.
4. Read only task-relevant files.
5. Avoid `node_modules`, `.next`, `.vercel`, backups, generated folders, and long logs unless directly required.
6. Save large findings to `.codex/reports`.
7. Return short plain-English summaries first.
8. Invoke only necessary agents.
9. Batch related checks when possible.
10. Do not rerun broad validations unless files changed, the prior result is stale, the owner requests it, or this is a demo/release checkpoint.
11. Stop once the acceptance condition is met.

Communication rule:

- Do not scare the owner with token or rate-limit warnings.
- Do not say a task is too expensive unless there is a true blocker.
- Phrase conservation choices as focused, efficient work.
- Use calm language such as "I'll check the relevant files," "I'll use the focused path," or "I'll summarize only what matters."
- Do not activate every persona for ordinary tasks.
- Do not keep suggesting improvements after the Demo Completion Governor has marked an area done.

## Demo Ambition Coordination Rule

Use the Enterprise Demo Experience Architect when work involves dashboard impact, command-center polish, executive walkthroughs, customer impression, wow factor, enterprise presentation, or operational storytelling.

The Enterprise Demo Experience Architect owns high-impact demo experience and buyer-facing operational storytelling. The Demo Completion Governor remains the finish-line authority for Done, Not Done, and Done With Optional Future Improvements decisions.

When these agents disagree:

- Prioritize high-visibility improvements.
- Reject low-visibility perfectionism.
- Prefer memorable polish over feature quantity.
- Treat new ideas as parking-lot items unless they fix a visible demo-readiness gap.

## Codex Helper Efficiency Rule

When the Codex environment gains new agents, skills, playbooks, reports, or recurring workflows, activate the Codex Operations Supervisor.

The supervisor must classify each helper as:

1. Keep
2. Keep but tighten
3. Merge with another agent
4. Retire
5. Turn into a checklist
6. Turn into a script

Codex should not add a new agent unless the Codex Operations Supervisor confirms that the need cannot be better handled by an existing agent, a checklist, a script, a playbook, or a registry update.

The supervisor should keep the helper system lean, useful, discoverable, and focused on finishing the BackOfficeFleet demo.

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
