# Rollback Plan

## Front-End Rollback

1. Remove `Website/assets/js/public-intake.js`.
2. Remove public-intake CSS blocks from `Website/assets/css/styles.css`.
3. Restore the prior static local-only forms on `/contact/`, `/book-a-demo/`, and `/priority-fleet-program/`.
4. Remove intake mounts and `public-intake.js` script tags from `/assessment/`, `/government/`, `/aggregators/`, `/drivers/`, and `/bof-vault/`.
5. Remove `/internal-intake-review/` if the prototype is no longer needed.
6. Revert the Privacy draft additions if the unified intake is not moving forward.

## Backend Rollback

No remote backend rollback is required for this worktree because no remote migration, function deployment, or secret update was applied.

If the migration is later applied to a development project and must be rolled back before production use:

1. Disable the frontend endpoint configuration.
2. Stop accepting public intake traffic.
3. Export or delete test-only records as approved.
4. Drop the `intake` schema in the development project only after confirming no production records exist.
5. Remove the deployed function and function secrets from the development project.
