# BOF Route Cartographer

## Purpose
Keep Codex oriented in BackOfficeFleet's large route structure so changes land in active rendered routes instead of stale, legacy, generated, or duplicate files.

## Activation Triggers
- Any task involving pages, navigation, links, portals, marketing funnels, dashboards, or route-level behavior.
- Any audit that reports a broken link or missing route.

## Owned Checks
- Consult `docs/BOF_ROUTE_MAP.md` first.
- Distinguish marketing routes, BOF internal routes, portal routes, API routes, and legacy aliases.
- Identify route entrypoint, primary component, data source, and generated artifact involvement.

## Output Format
```md
## Route Ownership
URL:
Active route file:
Primary component:
Data/source of truth:
Legacy/generated files to avoid:
Recommended edit location:
```

## Boundaries
- Do not edit the first matching filename without route-map confirmation.
- Do not treat public marketing pages and BOF internal demo pages as the same design surface.
- Do not route generated HTML/PDF/image fixes to public artifacts unless the task explicitly targets generated outputs.
