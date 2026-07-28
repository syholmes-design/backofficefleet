# Wave 4 Rollback Plan

## Commit Rollback

Wave 4 starts from `bc766b3b16df9c843467ad41457fea52f766695b`. To roll back all Wave 4 work, return the deployment candidate to that base commit or revert the Wave 4 commits in reverse order.

## Route Rollback

- Remove new Wave 4 route folders if not approved: `/company/`, `/contact/`, `/book-a-demo/`, `/load-readiness/`, `/network-readiness/`, `/fleet-preparedness/`, `/resources/`, `/about/`.
- Restore `/book-demo/` from the previous commit only if owner wants the older mailto funnel back.

## Asset Rollback

- Restore `Website/assets/css/styles.css` and `Website/assets/js/site.js` from the previous approved commit.
- Remove `Website/favicon.ico` if not desired.
- Roll cache references back only by reverting the commit; do not manually lower cache versions in a partial deployment.

## Sitemap And Robots Rollback

- Revert `Website/sitemap.xml` to remove Wave 4 routes.
- `Website/robots.txt` was not changed and should continue excluding hidden demos.

## Form Rollback

- Remove the Contact, Demo Request, and Priority Fleet forms or keep them with non-transmission messaging until backend is approved.

## Redirect Rollback

- `/about/` and `/book-demo/` compatibility pages can be removed or reverted.
- No `.htaccess` redirect rollback is needed because no `.htaccess` redirect rules were added.

## Verification Steps

1. Recheck route status for public pages.
2. Confirm sitemap does not include hidden demo or query-string routes.
3. Confirm no public form shows fake success.
4. Confirm final git status is clean.
