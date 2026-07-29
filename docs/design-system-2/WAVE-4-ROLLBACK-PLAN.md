# Wave 4 Rollback Plan

No deployment was performed.

Rollback can be handled by reverting the local Wave 4 global-shell correction commit(s). After rollback, confirm:

- legal pages are removed if the legal draft package is reverted
- shared shell JS/CSS returns to prior behavior
- Load Readiness returns to prior lifecycle page
- sitemap no longer includes reverted routes
- `git status` is clean
