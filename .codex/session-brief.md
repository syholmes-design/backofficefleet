# BackOfficeFleet Session Brief

BackOfficeFleet is a large Next.js/React trucking operations demo: marketing site, BOF internal command center, portals, generated documents, proof packets, workbook-backed seed data, localStorage demo edits, and many validation scripts.

## Use This Project Context Automatically

- Owner-friendly explanations matter. Use plain English first.
- Use this brief and `.codex/registry/*.json` for discovery; do not load every full agent file by default.
- Load full agent files only when their trigger clearly matches the task.
- Route edits must start with `docs/BOF_ROUTE_MAP.md`.
- Data/document edits must identify the source of truth before changing files.
- Generated artifacts are usually verification targets, not manual edit targets.
- Default context should exclude `node_modules`, `.next`, and large `public/generated`, `public/documents`, `public/evidence`, and `public/proof` folders.

## Most Important Agents

- Layman Project Companion: owner-facing explanations.
- Environment Stability Guardian: build/lint/typecheck/filesystem problems.
- BOF Route Cartographer: route and navigation ownership.
- Source-of-Truth Mapper: data and generated workflow ownership.
- Demo Completion Inspector: unfinished buttons, tabs, pages, documents, and workflows.
- Demo Completion Governor: finish-line authority that separates required completion work from optional polish and scope drift.
- Project Integration Coordinator: coordinates multi-person or multi-Codex work, handoffs, conflict checks, and validation visibility.
- Backup Restore Specialist: creates, lists, prunes, verifies, and restores low-token project backups before risky work.
- Quiet Backup Rollback Steward: creates separate shared rollback checkpoints with no count limit, constrained only by total storage size.
- Change Memory Reconstruction Steward: records what changed, why it changed, and how to reverse or rebuild it if file backups fail.
- Quiet Token and Rate Limit Steward: keeps sessions focused, avoids unnecessary scans/audits, and limits agent pileup without alarming the owner.
- Enterprise Demo Experience Architect: strengthens executive impact, wow moments, and operational storytelling without overriding finish-line discipline.
- UX Retention & Beauty Director: improves beauty, trust, usability, controlled color, and return engagement without generic dark-mode or one-color SaaS drift.
- Persuasive Copy & Design Strategist: sharpens wording, CTAs, proof placement, and buyer psychology without hype, false urgency, or manipulative design.
- Test Health Maintainer: classifies slow or failing tests, repairs stale assumptions, preserves useful coverage, and keeps before-demo validation trustworthy.
- Codex Operations Supervisor: keeps the helper system lean, non-duplicative, useful, and aligned with finishing the demo.
- Instruction Quality Gatekeeper: filters pasted or generic AI instructions before they enter the project environment, preserving useful ideas while rejecting clutter, duplicates, and scope drift. Long pasted AI suggestions should be captured first in `.codex/instruction-requests/` as neutral project traceability records.
- Expert Consensus Guardian: checks questionable changes against established expert personas before Codex weakens demo completeness, trucking realism, design quality, testing integrity, rollback safety, source-of-truth discipline, or finish-line control.
- Codex Change Collision Shield: warns before edits, restores, reverse patches, generators, or risky Git operations may overwrite another Codex session's changes.
- Document and Proof Packet Verifier: document/proof links and realism.
- Website Polish Director: visual quality and demo readiness.
- Trucking Operations Domain Expert: judges whether pages, workflows, fields, documents, and claims feel realistic to trucking operators.

## First Commands

```powershell
npm run codex:bootstrap
npm run codex:registry-sync
```

## Current Known Environment Risk

This folder is shared through the cloud on purpose. If Node fails with `UNKNOWN: unknown error, read`, use the runbook at `docs/codex-environment-runbook.md` to check file hydration, file locks, dependency install state, and build caches in place before trusting build, lint, typecheck, or browser audits.
