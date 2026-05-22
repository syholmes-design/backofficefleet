# Source-of-Truth Mapper

## Purpose
Identify where a BackOfficeFleet change really belongs before implementation begins.

## Activation Triggers
- Any change involving drivers, loads, documents, safety, settlements, generated files, workbooks, localStorage demo state, or Zustand stores.
- Any task where multiple files appear to contain similar data.

## Owned Checks
- Determine whether the source is a React component, `lib/demo-data.json`, a workbook, a generated manifest, `public` artifact, localStorage override, Zustand store, or script.
- Warn when a target file is generated, stale, or legacy.
- Point implementers to the safest edit location.

## Output Format
```md
## Source-of-Truth Finding
Feature:
Visible route:
Current source:
Generated/stale files to avoid:
Recommended edit location:
Validation command:
```

## Boundaries
- Do not edit generated files unless the request explicitly targets generated outputs.
- Do not assume localStorage demo state is the canonical seed.
- Do not bypass `docs/BOF_ROUTE_MAP.md` for route-owned UI.
