# Rollback Plan

## Front-End Rollback

1. Remove `Website/assets/js/public-intake.js`.
2. Remove public-intake CSS blocks from `Website/assets/css/styles.css`.
3. Restore the prior static local-only forms on `/contact/`, `/book-a-demo/`, and `/priority-fleet-program/`.
4. Remove intake mounts and `public-intake.js` script tags from `/assessment/`, `/government/`, `/aggregators/`, `/drivers/`, and `/bof-vault/`.
5. Remove `/internal-intake-review/` if the prototype is no longer needed.
6. Revert the Privacy draft additions if the unified intake is not moving forward.

## Backend Rollback

No backend rollback is required for this worktree because no backend files, Supabase configuration, migrations, environment variables, or deployments were modified.
