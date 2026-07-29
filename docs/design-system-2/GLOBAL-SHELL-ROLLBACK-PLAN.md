# Global Shell Rollback Plan

No deployment was performed.

## Rollback Scope

If these local changes need to be reverted before deployment, revert the Wave 4 global shell correction commit(s) on branch `codex/design-system-2-wave-4`.

## Expected Reverted Areas

- canonical shell install in `Website/assets/js/site.js`
- footer/legal shell CSS in `Website/assets/css/styles.css`
- legal pages and sitemap additions
- Load Readiness utility page
- Network Readiness and Fleet Preparedness utility tables
- cache-version updates and public logo source replacements
- Wave 4 report and screenshot artifacts

## Post-Rollback Check

After rollback, run `git status`, route smoke tests, and the obsolete shell inventory again before any deployment decision.
