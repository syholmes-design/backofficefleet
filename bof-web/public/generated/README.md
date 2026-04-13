# Generated document assets (optional static mirror)

BOF serves generated operational SVGs at runtime from source JSON via:

`/api/bof-generated/{loads|drivers|claims|exceptions|settlements}/...`

To also materialize files under this folder (for static hosting or archival), run from `bof-web`:

```bash
npm run generate:docs
```

That executes `scripts/generate-bof-documents.mjs` and writes `lib/generated-manifest.json` plus SVGs under `public/generated/`. The Next.js app does not require this step for links to work.
