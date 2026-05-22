# Link and Artifact Integrity Skill

Use this skill when validating navigation, generated documents, proof packets, driver files, portal links, or download/open links.

## Checks
- Internal Next routes resolve to active route files or live browser responses.
- Public files under `public` exist when linked directly.
- `/generated/:path*` links are valid only if the physical file exists or the API fallback returns a successful response.
- Missing files are routed back to generators, registries, seed data, or source workbooks rather than manually patched by default.

## Completion Standard
Every visible document or artifact link opens plausible content or appears in a prioritized fix list.
