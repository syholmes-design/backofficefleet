# Goal: Reference Driver Document Parity

Created: 2026-06-10
Status: complete
Checklist: `.codex/checklists/active/20260610-104440-reference-driver-document-parity.md`

## Objective

Create equivalent driver-document coverage in `Website` for every driver/document surface available in the `bof-web-Original` reference demo. The goal is practical client-facing parity: every reference driver should have an inspectable static driver file with document categories, status, owner, consequence, next action, and believable document surfaces at least as complete as the reference website demo.

## Source Of Truth

- `bof-web-Original/bof-web/lib/demo-data.json`
- `bof-web-Original/bof-web/lib/generated/driver-doc-manifest.json`
- `bof-web-Original/bof-web/lib/generated/driver-public-doc-index.json`
- `bof-web-Original/bof-web/lib/driver-doc-registry.ts`
- `bof-web-Original/bof-web/lib/driver-document-packet.ts`
- `bof-web-Original/bof-web/lib/driver-dqf-readiness.ts`
- Current static driver implementation in `Website/assets/js/interactive-demo-routes.js`
- Current driver routes under `Website/interactive-demo/drivers/`

## Current Start State

- Reference demo roster: 12 drivers.
- Reference generated manifest: 12 drivers with 14 or 15 document keys each.
- Reference manifest categories: CDL, medical card, MVR, W-9, I-9, emergency contact, bank information, FMCSA compliance, insurance card, DQF compliance summary, handbook acknowledgement, benefits enrollment, life insurance beneficiary election, flexible spending account election, and garnishment withholding summary where present.
- Current static Website driver records: 12 drivers.
- Current static driver portraits: 12 unique image paths.
- Current static driver document surfaces: 23 per driver in `Website/assets/js/interactive-demo-routes.js`.

## Boundaries

- Do not edit `bof-web-Original`; it is reference-only.
- Do not import Next.js, React, TypeScript, API routes, generated-document backends, `node_modules`, `.next`, credentials, auth, databases, or real integrations.
- Do not expose raw private reference values.
- Use synthetic-safe/static document surfaces in `Website` only.
- Do not declare parity complete until rendered routes and document-click behavior are verified for all drivers or explicitly sampled with a documented reason.

## Completion Test

This goal is complete when the checklist has a current parity matrix, every reference driver is represented in `Website`, every reference document category is covered by a static document surface for each relevant driver, all important driver document buttons open inspectable document-like content, unique driver portraits are verified, privacy/stale-copy scans pass, and final route/syntax/rendered checks have evidence.
