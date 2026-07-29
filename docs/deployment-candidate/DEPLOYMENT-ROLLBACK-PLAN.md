# Deployment Rollback Plan

Candidate commit: 996a6c9d24421b4509622307312939b606241ec6 (implementation commit; ending documentation HEAD reported in final response)

Rollback is method-identified but not ready until a live backup is created.

Pre-upload backup requirement:
- Download or archive every destination path listed in STATIC-UPLOAD-FILE-LIST.txt before overwriting.
- Also back up live .htaccess, sitemap.xml, robots.txt, and any existing compatibility-route files.
- Record backup location, timestamp, file count, and hash manifest.

Restoration order:
1. Restore .htaccess first if access/indexing breaks.
2. Restore robots.txt and sitemap.xml.
3. Restore shared CSS and JavaScript.
4. Restore shared assets referenced by reverted pages.
5. Restore homepage and primary route HTML.
6. Restore compatibility pages.
7. Clear cache or bypass cache.
8. Run live smoke tests.

Investor presentation rollback:
- Restore live /private-investor-plan/index.html, /assets/css/private-investor-plan.css, and /assets/js/private-investor-plan.js from the pre-upload live backup if the hidden investor route has an issue.
- If the live backup is unavailable, use restoration source commit e1008048dbea221f10cdf196afb039a26d70385e as the preserved source for the prior gated local-preview version.
- If the route must be withdrawn, remove only the uploaded /private-investor-plan/ route files and the investor-specific X-Robots lines after explicit owner approval.

Rollback triggers:
- Any primary route returns 4xx/5xx.
- Header/footer/logo disappears on public routes.
- Public forms imply successful delivery or transmit to an unapproved endpoint.
- Hidden routes become indexed or publicly linked.
- /private-investor-plan/ asks for a removed client-side passcode, exposes hidden navigation links, or loses noindex/nofollow/noarchive protection.
- Legal pages fail.
- Significant mobile overflow or unusable mobile menu appears.

Form emergency disable:
- Remove any window.BOFPublicIntakeConfig endpoint or data-intake-endpoint attribute if added later.
- Re-upload Website/assets/js/public-intake.js from this candidate.

Logo rollback:
- Restore Website/assets/css/styles.css, Website/assets/js/site.js, and affected route HTML from the pre-upload live backup if the DS2 logo correction causes header layout issues.
- Re-upload the prior live /assets/images/logo/boflogo-original.png only as part of an approved rollback, not as part of this correction upload.

Logo animation rollback:
- Remove the logo-animation stylesheet/script references from Website/index.html and Website/customer-demo/index.html if the optional animation causes a launch issue.
- Remove /assets/css/logo-animation.css and /assets/js/logo-animation.js from the upload set during rollback; the canonical static SVG logo remains unchanged.
