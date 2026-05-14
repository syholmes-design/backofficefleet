# Windsurf Starter Prompt — Dispatch Board v2

Read these files fully before coding:

- `docs/dispatch-v2-spec.md`
- `docs/dispatch-v2-implementation-rules.md`
- `docs/dispatch-v2-image-prompts.md`

Implement Dispatch Board v2 as a second dispatch experience. Do not replace the current dispatch page.

Create the new route preferably at:

`app/(bof)/dispatch-v2/page.tsx`

Public route:

`/dispatch-v2`

Use the spec as the controlling source. Adapt the single-file HTML design into proper Next.js React/TypeScript/Tailwind components. Preserve all 12 loads, KPI values, tabs, checklists, photo zones, load document workflow, and sign-off/signature workflow.

Wire photo assets to:

`public/generated/dispatch-v2/pretrip/`

Use safe fallbacks for missing images.

For documents, inspect the existing BOF template/proof/document system first. Link only files that actually exist. If a generated document does not exist yet, show `Template ready / not generated yet`.

Run:

```bash
npm run lint
npm run build
```

Report changed files, route, lint result, build result, missing assets, and missing document outputs. Do not push unless I explicitly instruct you to push.
