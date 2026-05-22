# BackOfficeFleet Project Handoff and Environment Assessment

BackOfficeFleet is a Next.js/React demo and operating-system prototype for trucking back-office workflows: dispatch, driver compliance, document vaults, proof packets, safety, settlements, maintenance, portals, and marketing funnel experiences. This document explains what the project is, how its major pieces work, and what an assessor should know when optimizing the Codex development environment around it.

## Executive Summary

This is a large, data-heavy Next.js application with a broad operational demo surface. It is not a small marketing site: it combines public marketing routes, an internal BOF command center, generated driver/load/compliance documents, workbook-backed seed data, localStorage demo editing, API proxies for external services, and many validation/generation scripts.

The codebase appears designed to showcase a complete trucking operations command layer rather than serve as a production multi-tenant SaaS backend. Most workflows are driven by static JSON, Excel workbooks, generated public artifacts, and browser-side demo state instead of a database.

Current scale observed from the workspace:

- About 504 first-party TypeScript/TSX files.
- About 106,754 first-party TypeScript/TSX lines.
- 67 `page.tsx` route files.
- 12 API route files.
- 191 files containing `use client`.
- 137 first-party JavaScript/MJS files.
- 109 MJS scripts under `scripts`.
- `public` contains about 2,247 files and roughly 284 MB of generated/static artifacts.
- `app/globals.css` is very large: about 14,300 lines and 2,261 class selectors.
- At least 53 first-party TS/TSX files exceed 20 KB.
- The largest components/modules include files over 1,000 to 2,000 lines.

## What The Product Is About

BackOfficeFleet is organized around the idea that a trucking company loses time and money when dispatch, driver qualification, proof documents, settlements, safety, maintenance, and compliance are fragmented. The app demonstrates a central operational command system that can surface missing documents, dispatch blockers, proof gaps, settlement holds, safety expirations, maintenance risk, fuel intelligence, and customer/driver portal views.

The project has two broad audiences:

- Public/marketing audience: fleet operators, government/private fleet buyers, and prospects evaluating BOF.
- Internal/demo audience: dispatchers, operations managers, compliance staff, settlement/payroll reviewers, and demo evaluators walking through the product.

The main operational concepts are:

- Drivers and driver qualification files.
- Loads, dispatch readiness, trip packets, and route proof.
- Documents, template packs, generated evidence, and vault workflows.
- Safety events, credentials, expirations, and risk scoring.
- Settlements, payroll deductions, holds, and money-at-risk.
- Maintenance, RFID proof chain, diesel/fuel intelligence, and operational exceptions.
- Intake workflows that turn submitted load requirements or extracted PDFs into dispatch records.

## Technology Stack

The project uses:

- Next.js, currently installed as 15.5.15 from the local `node_modules`, with `package.json` declaring `^15.1.0`.
- React 19.
- TypeScript with `strict: true`.
- Tailwind CSS 3.4, with Tailwind preflight disabled.
- Zustand for some client-side feature stores.
- `xlsx` for workbook parsing.
- `pdf-parse` for local PDF text extraction.
- Mapbox/MapLibre-related packages for route maps.
- Lucide React for icons.

Important config files:

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.eslintrc.json`
- `tailwind.config.ts`
- `app/globals.css`

## High-Level App Structure

The app uses the Next.js App Router.

Major route groups:

- `app/(marketing)`: public marketing pages and funnel tools.
- `app/(bof)`: internal BOF operational demo application.
- `app/assessment`: older or alternate assessment/marketing routes.
- `app/portals`: driver, manager, and customer portal pages.
- `app/api`: server route handlers for generated SVGs, document generation, PDF extraction, places lookup, fuel lookup, debug, and workbook validation.

Important shared directories:

- `components`: UI components, feature screens, dashboards, route-specific clients, portals, marketing components, and document/workflow surfaces.
- `lib`: data loaders, domain logic, document engines, reconciliation logic, generated artifact registries, stores, safety/dispatch/settlement helpers, and type-adjacent logic.
- `types`: shared domain types for dispatch, safety, and settlements.
- `scripts`: generation, validation, seed, patch, and audit utilities.
- `public`: generated documents, proof artifacts, images, source assets, data workbooks, generated driver files, and evidence files.
- `data`: source workbooks and audit reports.
- `docs`: route map and dispatch-v2 planning/implementation docs.
- `source-assets`: original template packs, references, policies, and extracted source materials.

## Routing Model

The project has a documented route map at:

- `docs/BOF_ROUTE_MAP.md`

That file is important because the app contains active routes, legacy aliases, old assessment routes, portal routes, and generated static artifacts. It helps prevent editing stale components.

Key active public routes include:

- `/`
- `/for-hire-carriers`
- `/private-fleets`
- `/government`
- `/bof-vault`
- `/book-assessment`
- `/fleet-savings`
- `/apply`

Key active BOF demo routes include:

- `/dashboard`
- `/command-center`
- `/dispatch`
- `/dispatch/intake`
- `/dispatch-v2`
- `/drivers`
- `/drivers/:id`
- `/documents`
- `/documents/vault`
- `/loads`
- `/loads/:id`
- `/safety`
- `/settlements`
- `/maintenance`
- `/fleet-financials`
- `/intake`
- `/source-of-truth`
- `/trip-release/:loadId`
- `/shipper-portal/:loadId`

The `app/(bof)/layout.tsx` route group is especially important because it loads the canonical BOF seed and wraps all BOF routes in the demo data provider.

## Layout And Chrome

Global layout:

- `app/layout.tsx`

This imports:

- `ConditionalHeader`
- `BofDebugBanner`
- global CSS
- Mapbox CSS
- a Google font

BOF app layout:

- `app/(bof)/layout.tsx`

This calls `getBofData()` and passes the seed into:

- `components/BofDemoDataShell.tsx`
- `lib/bof-demo-data-context.tsx`

Marketing layout:

- `app/(marketing)/layout.tsx`

This wraps public routes in:

- `components/MarketingShell.tsx`

Header behavior:

- `components/ConditionalHeader.tsx` suppresses the BOF header on marketing routes and renders `BofHeader` elsewhere.

Development helpers:

- `components/dev/BofRouteBadge.tsx` can show route identity in development.
- `components/debug/BofDebugBanner.tsx` can expose debug information when enabled.

## Data Model And State Flow

The primary seed comes from:

- `lib/demo-data.json`

Server loading entry point:

- `lib/load-bof-data.ts`

That file imports the JSON seed and applies:

- `reconcileBofSourceOfTruth` from `lib/bof-source-of-truth.ts`

Client hydration and demo editing:

- `components/BofDemoDataShell.tsx`
- `lib/bof-demo-data-context.tsx`

The BOF demo data provider starts with the server seed, then hydrates from browser `localStorage`. This lets demo users edit drivers, documents, medical details, review status, credential overrides, dispatch blockers, and risk-resolution markers without needing a backend database.

Important implication: the demo UI can diverge from the static seed per browser. Server-rendered/static paths still use the JSON/workbook-derived seed, while client pages may use localStorage-overridden state after hydration.

Several feature-specific Zustand stores also exist:

- `lib/stores/dispatch-dashboard-store.ts`
- `lib/stores/intake-engine-store.ts`
- `lib/stores/driver-vault-workspace-store.ts`
- `lib/stores/safety-store.ts`
- `lib/stores/settlements-payroll-store.ts`
- `lib/stores/load-readiness-messaging-store.ts`
- `lib/stores/bof-template-workspace-store.ts`

These are mostly demo/client workflow stores. Some stores seed themselves independently, so an assessor should pay attention to places where state is duplicated between canonical `BofDemoDataProvider`, module-level seed builders, and Zustand.

## Source Of Truth Reconciliation

The core reconciliation layer is:

- `lib/bof-source-of-truth.ts`

It reconciles driver/document/load-related seed information and can read Excel workbook sources server-side. It uses an `eval("require")` pattern to avoid bundling Node-only `fs`, `path`, and `xlsx` into client paths. It also skips workbook reads when `window` exists.

This pattern is functional for a demo app, but it increases environment sensitivity and bundler complexity. If Codex or CI is optimizing the environment, it should ensure server-side workbook files are present and local filesystem reads are reliable.

## Workbook Loading

The project uses Excel workbooks as data inputs and generated/public data assets.

Important workbook/data files include:

- `data/source-workbooks/main-source-v2_enhanced_bof_aligned.xlsx`
- `data/source-workbooks/driver_templates_expanded_untruncated.xlsx`
- `public/data/main-source-v4_operational_elite_enhanced.xlsx`
- `public/data/main-source-v3_operational_enhanced.xlsx`
- `public/data/main-source-v2_enhanced_bof_aligned.xlsx`

The operational loader is:

- `lib/v3-operational-loader.ts`

It attempts to load V4 first, then V3/V2-style data. A key implementation detail is that it builds a fetch URL using `window.location.origin` in the browser, but defaults to `http://localhost:3000` when running server-side. That is risky for build/CI/server environments because server-side workbook validation may assume a dev server is running on port 3000.

For a robust Codex environment, workbook loaders should be tested both in browser/dev-server mode and in server/build mode.

## Generated Documents And Artifacts

The app heavily uses generated artifacts in `public`.

Examples:

- `public/generated/drivers/**`
- `public/documents/drivers/**`
- `public/proof/**`
- `public/evidence/loads/**`
- `public/reference/**`
- `public/actual_docs/**`

The document engine is:

- `lib/document-engine.ts`

It generates metadata and URLs for driver docs, load docs, proof docs, claim docs, settlement docs, and exception docs. Many API routes under `app/api/generate/**` expose document-generation responses, but they generally return URLs/metadata rather than writing files during the request.

There is also a generated SVG fallback route:

- `app/api/bof-generated/[...segments]/route.ts`

That route serves generated SVG strings for missing generated assets under `/generated/:path*`, based on scope such as loads, drivers, claims, exceptions, and settlements.

The Next rewrite in `next.config.ts` is important:

- `/generated/:path*` rewrites after public files to `/api/bof-generated/:path*`

That means real public generated files win first, and API-generated SVGs fill missing files afterward.

## API Routes

Observed API routes:

- `app/api/bof-generated/[...segments]/route.ts`
- `app/api/debug-drivers/route.ts`
- `app/api/fuel/tomtom/route.ts`
- `app/api/generate/bol/route.ts`
- `app/api/generate/claims/route.ts`
- `app/api/generate/invoice/route.ts`
- `app/api/generate/pod/route.ts`
- `app/api/generate/settlement/route.ts`
- `app/api/load-intake/extract/route.ts`
- `app/api/places/autocomplete/route.ts`
- `app/api/places/details/route.ts`
- `app/api/validate-v4/route.ts`

External integrations:

- Google Places proxy routes use `GOOGLE_PLACES_API_KEY`.
- TomTom fuel route uses `TOMTOM_API_KEY`, with fallback checks for `TOMTOM_MAPS_API_KEY` and `TT_API_KEY`.
- Mapbox client routes use public Mapbox env vars such as `NEXT_PUBLIC_MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- PDF extraction uses `pdf-parse` locally and defaults to `LOAD_INTAKE_EXTRACTION_PROVIDER=local`.

Security/production-readiness notes:

- PDF upload extraction currently checks file type but does not visibly enforce an upload size limit in the route.
- Places and TomTom proxy routes do not appear to implement app-level auth/rate limiting.
- This is acceptable for a controlled demo environment, but not sufficient as-is for an exposed production API.

## UI And Component Architecture

The UI is broad and feature-rich, but several components are very large.

Largest observed components include:

- `components/load-intake/LoadRequirementsWizard.tsx`: about 1,984 lines.
- `components/safety/SafetyDashboardScreen.tsx`: about 1,447 lines.
- `components/financials/FleetFinancialsPageClient.tsx`: about 1,436 lines.
- `components/drivers/DriverDetailPageClient.tsx`: about 1,421 lines.
- `components/documents/OperationsFileCabinetClient.tsx`: about 1,361 lines.
- `components/load-intake/LoadIntakeStep4PacketReview.tsx`: about 1,239 lines.
- `components/dispatch/DispatchBoardScreen.tsx`: about 1,107 lines.

Largest observed library/domain modules include:

- `lib/operations-file-cabinet.ts`: about 2,157 lines.
- `lib/assessment-tracks.ts`: about 1,696 lines.
- `lib/compliance-flow-pro/dqf-template-wiring-service.ts`: about 1,647 lines.
- `lib/v3-operational-loader.ts`: about 1,048 lines.
- `lib/bof-template-system.ts`: about 1,015 lines.

This indicates a high feature density and a likely need for careful context management when using Codex. For optimization, smaller bounded tasks and targeted file reads will work better than asking an agent to hold the whole app in context.

## Styling System

Styling is centralized heavily in:

- `app/globals.css`

That file is unusually large for a Next app, with about 14,300 lines. Tailwind is present, but Tailwind preflight is disabled in `tailwind.config.ts`, and global BOF CSS appears to carry much of the design system.

The global CSS includes both dark BOF app styling and public marketing styling. This has advantages for consistency but can make regression control harder, because unrelated pages may share global selectors.

For environment/tooling optimization, CSS-aware diffs and visual regression checks are valuable. A small CSS change can have wider impact than the file locality suggests.

## Scripts And Validation

The project relies on scripts for generating, validating, patching, and auditing demo data/artifacts.

Important package scripts include:

- `build`
- `dev`
- `start`
- `lint`
- `build:data`
- `generate:docs`
- `generate:load-docs`
- `generate:load-evidence`
- `generate:demo-docs`
- many `validate:*` scripts
- `demo:reset`
- deploy helper scripts

Examples of validation scripts:

- `scripts/validate-load-docs.mjs`
- `scripts/validate-driver-docs.mjs`
- `scripts/validate-dashboard-links.mjs`
- `scripts/validate-safety-evidence.mjs`
- `scripts/validate-driver-dqf-readiness.mjs`
- `scripts/validate-load-trip-packets.mjs`
- `scripts/validate-compliance-incident-reconciliation.mjs`

In the current environment, these results were observed:

- `node scripts/validate-driver-docs.mjs` passed.
- `node scripts/validate-dashboard-links.mjs` failed with: `Dashboard hero should render BookDemoLink for booking (wraps getBookDemoHref)`.
- `node scripts/validate-load-docs.mjs` failed with a Node filesystem read error.
- `node scripts/validate-safety-evidence.mjs` failed with a Node filesystem read error.

## Current Environment Issues Observed

The workspace path is:

- `C:\Users\slyme\OneDrive\bof-web`

The project does not appear to be a Git repository at this path:

- `git status --short` returned: `fatal: not a git repository`.
- `Test-Path .git` returned false.

Build/lint/typecheck could not be completed in this environment:

- `npm run build` failed before reaching app compilation.
- `npm run lint` failed before reaching lint results.
- `npx tsc --noEmit` failed before reaching TypeScript diagnostics.

The recurring error was:

```text
Error: UNKNOWN: unknown error, read
    at Object.readFileSync (node:fs:442:20)
...
code: 'UNKNOWN'
syscall: 'read'
Node.js v22.15.0
```

This also occurred in some validation scripts that read local files.

Because `node -e` and direct package metadata reads worked, the issue may be intermittent or file-specific rather than a universal Node failure. Given the project lives in a shared cloud folder and includes thousands of generated/public files, likely suspects include cloud-file hydration, file locking/sync state, interrupted dependency installs, or partially available placeholder files. The environment workflow should diagnose and fix those conditions in place.

## Environment Optimization Recommendations

For Codex and CI reliability, the highest-value environment changes are:

1. Treat the shared cloud folder as the working location and make its file state reliable.
2. Ensure all files are fully hydrated locally before running Node scripts.
3. Reinstall dependencies from scratch if Node read errors or partial installs appear:
   - delete `node_modules`
   - delete `.next`
   - run `npm ci`
4. Use the Node version expected by the project. Current observed version was Node 22.15.0. If build issues continue, test Node 20 LTS because many Next.js projects are still most stable there.
5. Add or restore Git metadata before serious Codex work, because without Git there is no reliable diff boundary or rollback/accountability layer.
6. Avoid committing or repeatedly scanning generated/public artifacts unless the task is specifically about generated docs/assets.
7. Consider adding `.codexignore`, `.cursorignore`, or equivalent environment exclusions for:
   - `node_modules`
   - `.next`
   - `tsconfig.tsbuildinfo`
   - large generated public subtrees not relevant to most code tasks
   - generated PDFs/images unless explicitly being reviewed
8. Create a lightweight validation command that runs the critical checks without scanning every generated artifact.
9. Normalize the lint command for the installed Next version. `package.json` currently uses `next lint`; an assessor should confirm whether this is supported by the installed Next version and migrate to direct ESLint invocation if needed.
10. Split environment verification into tiers:
    - Tier 1: dependency install, `next --version`, TypeScript load, lint config load.
    - Tier 2: `next build`.
    - Tier 3: domain validation scripts.
    - Tier 4: visual/browser checks for key routes.

## Codebase Risks And Maintenance Pressure

The main risks are not a lack of product vision or missing feature coverage. The project has a lot of domain modeling and demo depth. The risks are mostly operational and maintainability-related:

- Very large global CSS file.
- Very large client components.
- Many generated/static artifacts in the same workspace as source code.
- Several overlapping data sources: JSON seed, source workbooks, generated manifests, public generated docs, localStorage overrides, and Zustand stores.
- Build/validation sensitivity to local filesystem behavior.
- No Git metadata in the current workspace path.
- Some visible mojibake/encoding artifacts in comments and console strings, such as corrupted arrows and emoji sequences.
- Validation scripts exist, but some currently fail in this environment before they can validate business logic.
- Public demo API routes are useful but would need auth, rate limits, upload limits, and persistence changes before production exposure.

## Strengths

The project has several strong foundations:

- Clear route documentation exists in `docs/BOF_ROUTE_MAP.md`.
- TypeScript strict mode is enabled.
- There is a rich validation/generation script ecosystem.
- Domain-specific helpers are separated into `lib` rather than everything living in React components.
- The demo data provider gives a coherent browser-editable demo model.
- Generated document/proof workflows are treated as first-class product surfaces.
- Marketing, demo app, and portals are separated by route group or top-level route area.
- Server-side API proxies keep third-party keys off the browser for Google Places and TomTom.
- The fallback generated SVG route is a clever way to keep demo links resilient when physical generated files are missing.

## Suggested Assessor Focus

An environment assessor should focus less on feature ideation and more on stabilizing the local/dev loop:

- Make `npm run build`, lint, and `npx tsc --noEmit` reliable.
- Resolve shared-folder hydration, lock-file, dependency, or filesystem read instability.
- Confirm Node version compatibility.
- Restore Git-based change tracking.
- Decide which generated assets should live in source control versus be regenerated.
- Create fast, targeted verification scripts for Codex tasks.
- Exclude noisy/generated paths from default AI and search context.
- Document the canonical source-of-truth hierarchy so future changes do not accidentally edit stale generated files or legacy routes.

## Practical Mental Model For Future Codex Work

When working on this project, treat it as a demo operating system with a static/generated backend, not as a conventional database-backed web app.

For BOF internal routes, start from:

- `app/(bof)/layout.tsx`
- `lib/load-bof-data.ts`
- `lib/bof-demo-data-context.tsx`
- `docs/BOF_ROUTE_MAP.md`

For marketing routes, start from:

- `app/(marketing)`
- `components/marketing`
- `lib/site-links.ts`

For document/proof work, start from:

- `lib/document-engine.ts`
- `lib/operations-file-cabinet.ts`
- `lib/load-artifact-registry.ts`
- `public/generated`
- `public/documents`
- `scripts/generate-*`
- `scripts/validate-*`

For dispatch/load work, start from:

- `components/dispatch`
- `components/dispatch-v2`
- `lib/dispatch-*`
- `lib/load-*`
- `types/dispatch.ts`

For driver/compliance work, start from:

- `components/drivers`
- `lib/driver-*`
- `lib/compliance-flow-pro`
- `lib/driver-doc-registry.ts`
- `lib/bof-source-of-truth.ts`

For settlement/payroll work, start from:

- `components/settlements-*`
- `lib/settlement-periods.ts`
- `lib/stores/settlements-payroll-store.ts`
- `types/settlements-payroll.ts`

For safety/maintenance work, start from:

- `components/safety`
- `components/safety-v4`
- `components/maintenance*`
- `lib/safety-*`
- `lib/maintenance-data.ts`

## Bottom Line

BackOfficeFleet is a mature, ambitious demo codebase with extensive domain coverage and a lot of generated operational evidence. The highest leverage environment work is to make the local filesystem/dependency/build loop deterministic, then teach Codex to ignore generated noise and operate from the documented route/data/source-of-truth map.
