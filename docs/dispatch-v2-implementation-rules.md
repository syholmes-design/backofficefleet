# Dispatch v2 Implementation Rules

Read this file and `docs/dispatch-v2-spec.md` before coding.

## Current Page Protection

1. The existing dispatch/load page must remain available and functional.
2. Do not replace, rename, or delete the current dispatch route.
3. If you edit the current dispatch page, only add a small preview link to Dispatch Board v2.

## Source of Truth

1. `docs/dispatch-v2-spec.md` controls the design, data, checklists, modals, tabs, and validation behavior.
2. The original spec was written for a single-file HTML app, but this repo is Next.js. Adapt the spec into React/TypeScript/Tailwind components rather than dumping raw HTML.
3. Do not summarize, truncate, or substitute a simpler dashboard.

## Locked Data

Preserve:

- 12 loads: L-501 through L-512
- Total Loads: 12
- Delivered: 7
- In Transit: 3
- Pending: 2
- Total Revenue: $26,661
- Total Miles: 6,927
- Load IDs, drivers, customers, statuses, BOLs, RCs, POs, seal numbers, revenue, miles, proof statuses, POD statuses, and settlement hold values

## Required UI

Dispatch v2 must include:

- KPI row
- Search/filter bar
- Dispatch table
- Load detail slide-over/modal
- Pre-trip packet slide-over/modal
- 5 pre-trip tabs
- Driver Docs checklist
- Vehicle Inspection checklist
- Photo Packet with 9 zones
- Load Documents tab
- Sign-Off tab with progress, FMCSA certification, signature canvas, and submit message

## Photo Asset Rules

Use this folder:

`public/generated/dispatch-v2/pretrip/`

Expected files:

- `driver-with-cdl.jpg`
- `driver-selfie-dashcam.jpg`
- `truck-front.jpg`
- `truck-driver-side.jpg`
- `truck-passenger-side.jpg`
- `fifth-wheel-coupling.jpg`
- `trailer-rear-seal.jpg`
- `dashboard-eld-screen.jpg`
- `fuel-receipt.jpg`

If an image is missing, show a safe styled fallback. Do not break the page.

## Document Wiring Rules

Search the repo for existing template/document/proof helpers before creating new assumptions. Inspect likely files such as:

- `lib/load-proof.ts`
- `lib/load-trip-packet.ts`
- `lib/canonical-load-evidence.ts`
- `public/documents/`
- `public/evidence/loads/`
- `components/documents/`
- `app/(bof)/documents/`

Document rows must distinguish between:

- Open document
- Template ready / not generated yet
- Missing
- Not required

Do not style a missing file as a working completed document.

## Validation Required

Run:

```bash
npm run lint
npm run build
```

Report:

- Current dispatch page still exists
- New Dispatch v2 route
- Changed files
- Missing image assets, if any
- Missing/generated document paths, if any
- Lint result
- Build result

Do not push unless explicitly instructed.
