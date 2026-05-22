# BackOfficeFleet Session Brief

BackOfficeFleet is a large Next.js/React trucking operations demo: marketing site, BOF internal command center, portals, generated documents, proof packets, workbook-backed seed data, localStorage demo edits, and many validation scripts.

## Use This Project Context Automatically

- Owner-friendly explanations matter. Use plain English first.
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
