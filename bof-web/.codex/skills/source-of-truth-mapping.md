# Source-of-Truth Mapping Skill

Use this skill before changing data-driven or generated BackOfficeFleet behavior.

## Checks
- Identify whether the change belongs in `app`, `components`, `lib`, `types`, `data`, `public`, `scripts`, docs, workbooks, localStorage demo state, or Zustand stores.
- Consult `docs/BOF_ROUTE_MAP.md` for route ownership.
- Avoid generated artifacts unless explicitly targeted.
- Name the validation script or route smoke test that proves the change.

## Completion Standard
The implementer knows exactly which source owns the behavior before editing.
