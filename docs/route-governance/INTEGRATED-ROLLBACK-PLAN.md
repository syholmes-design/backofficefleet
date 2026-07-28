# Integrated Rollback Plan

## Branch-Level Rollback

This work is isolated to:

- Worktree: `C:\Users\syhol\BOF-wave-2-route-demo-integration`
- Branch: `codex/wave-2-route-demo-integration`

If owner review rejects the integration, do not merge this branch. The protected Wave 2 and route-governance worktrees remain separate and untouched.

## Commit-Level Rollback

Commits were made in bounded layers:

1. Labeled Policies hero asset.
2. Route-governance reconciliation and unified demo shell.

If only the labeled hero is rejected, revert the hero commit and restore the Policies page image reference to `ds2-policies-governance-hero-clean.png`.

If route/demo integration is rejected, revert the route/demo commit and keep the labeled hero commit only if owner-approved.

## File-Level Rollback

- Public CTA changes can be reverted page by page.
- `/customer-demo/` can be removed if the unified demo route is not adopted.
- `robots.txt`, `sitemap.xml`, and `.htaccess` hidden-route controls can be reverted independently.
- The original clean Policies and BOF Vault hero assets remain available and unchanged.

## Post-Rollback Verification

After rollback, rerun:

```powershell
node --check Website/assets/js/customer-demo-app.js
node --check Website/assets/js/interactive-demo-routes.js
git diff --check
```

Then verify public CTAs, sitemap contents, robots rules, and hidden-demo noindex behavior.

