# BackOfficeFleet Codex Environment Runbook

BackOfficeFleet is a large Next.js demo operating system with marketing pages, BOF internal routes, portals, generated documents, workbook-backed data, localStorage demo state, and validation scripts. This runbook stabilizes the local Codex environment before feature work.

## Required Local Baseline

- Work outside OneDrive or other cloud-sync folders. Preferred path: `C:\dev\bof-web`.
- Ensure all files are fully hydrated locally before running Node commands.
- Restore or initialize Git before serious implementation work.
- Keep `.codex/` committed with the project so agents, skills, playbooks, and registries travel with the repo.

## Node And Dependency Matrix

Use Node 20 LTS as the stability baseline. Also test the current installed Node 22 line when needed because this workspace previously ran Node `v22.15.0`.

Recommended reset after moving the project:

```powershell
Remove-Item -Recurse -Force .next,node_modules -ErrorAction SilentlyContinue
npm ci
node -v
npm -v
npx next --version
```

Then verify:

```powershell
npm run typecheck
npm run lint
npm run build
```

If Node reports `UNKNOWN: unknown error, read`, stop and verify the project is not running from a OneDrive placeholder or locked file.

Install the browser binary required by Playwright audits:

```powershell
npm run audit:install-browsers
```

## Environment Variables

Start from `.env.example` and `ENVIRONMENT_SETUP.md`.

Important variables:

- `NEXT_PUBLIC_MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_BOOK_DEMO_URL`
- `NEXT_PUBLIC_CALENDAR_URL`
- `TOMTOM_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `LOAD_INTAKE_EXTRACTION_PROVIDER=local`
- `OPENAI_API_KEY` only for script-side AI generation when explicitly enabled

Never commit `.env.local`.

## Generated Asset Noise

Generated and static demo artifact folders are large and should be excluded from default Codex context unless the task explicitly targets documents or proof packets:

- `public/generated`
- `public/documents`
- `public/evidence`
- `public/proof`
- `public/reference`
- `public/actual_docs`
- `lib/generated`

Use `.codexignore` for context hygiene and route document fixes back to generators, registries, seed data, or source workbooks whenever possible.

## Source-Of-Truth Order

Before editing a feature, identify the owner:

1. Active route ownership: `docs/BOF_ROUTE_MAP.md`
2. Server seed: `lib/load-bof-data.ts`
3. Client demo state: `lib/bof-demo-data-context.tsx`
4. Reconciliation: `lib/bof-source-of-truth.ts`
5. Feature stores: `lib/stores`
6. Source workbooks: `data/source-workbooks` and `public/data`
7. Generated artifacts: `public` and `lib/generated`

Generated artifacts are verification targets by default, not edit targets.

## Before-Demo Gate

Start the dev server:

```powershell
npm run dev
```

Then run:

```powershell
npm run codex:registry-sync
npm run audit:install-browsers
npm run audit:demo-completeness
npm run audit:demo-clickability
npm run audit:bof-links
npm run audit:visual-smoke
```

Pair these with relevant existing validators:

```powershell
npm run validate:driver-docs
npm run validate:load-docs
npm run validate:load-evidence
npm run validate:safety-evidence
```

Reports should start with a plain-English summary and include a technical appendix.
