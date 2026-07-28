# Wave 3 Rollback Plan

## Rollback Trigger

Use rollback if owner review rejects the Wave 3 audience model, assessment language, visual direction, or route strategy.

## Git Rollback

Wave 3 was isolated in:

`C:\Users\syhol\BOF-design-system-2-wave-3`

Branch:

`codex/design-system-2-wave-3`

Approved base:

`771d7cf5195a922ea841c7894c181494b5216c17`

To abandon Wave 3 before merge, do not merge this branch. The approved Wave 2 integration worktree remains unchanged.

## Production Rollback If Deployed Later

If Wave 3 is deployed after owner approval and then must be rolled back:

1. Restore the last approved Wave 2 production package.
2. Restore prior versions of rebuilt public pages:
   - `/who-we-serve/`
   - `/private-fleets/`
   - `/government/`
   - `/drivers/`
3. Remove Wave 3-only pages if they were published:
   - `/aggregators/`
   - `/for-hire-fleets/`
   - `/assessment/`
4. Remove `Website/assets/js/wave3-assessment.js` from the deployed static package.
5. Restore the previous `Website/assets/css/styles.css` if no other approved changes depend on the Wave 3 CSS block.
6. Restore the previous `Website/sitemap.xml`.
7. Remove any Wave 3 redirect rules that were added during deployment.
8. Clear CDN/cache layers if used by the approved deployment workflow.
9. Smoke-test the restored public routes and sitemap.

## Redirect Rollback

If owner-approved redirects are added later, rollback should remove or reverse only those redirect rules. No redirect rules were implemented in this Wave 3 branch.

## Data Rollback

No data rollback is required for Wave 3. The assessment does not transmit or persist answers and no Supabase or backend work was performed.

## Verification After Rollback

Confirm:

- `/who-we-serve/`, `/private-fleets/`, `/government/`, and `/drivers/` match the prior approved production state.
- `/assessment/` is absent or restored to the prior approved route state.
- sitemap no longer includes rejected Wave 3-only routes.
- no customer-demo query states appear in the sitemap.
- no unsupported readiness or certification claims remain.
