# bof-web

The BackOfficeFleet (BOF) web application, built with Next.js, React, and TypeScript.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment variables

The Dispatch route map needs a Mapbox public token. Add it to `.env.local` (do not commit this file):

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_public_mapbox_token_here
```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) and [MAPBOX_TOKEN_SETUP.md](MAPBOX_TOKEN_SETUP.md) for details.

## Common scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Clear the Next.js cache and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint on `app`, `components`, and `lib` |
| `npm run typecheck` | Type-check the project with `tsc` |
| `npm run demo:reset` | Rebuild demo data and regenerated documents for a clean demo |

`package.json` also contains `generate:*`, `validate:*`, and `audit:*` scripts for demo documents and data checks.

## More docs

- [docs/](docs/): specs, runbooks, and environment notes
- [AGENTS.md](AGENTS.md) and [CODEX.md](CODEX.md): guidance for AI coding agents working in this repo
