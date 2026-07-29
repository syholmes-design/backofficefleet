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

Rollback triggers:
- Any primary route returns 4xx/5xx.
- Header/footer/logo disappears on public routes.
- Public forms imply successful delivery or transmit to an unapproved endpoint.
- Hidden routes become indexed or publicly linked.
- Legal pages fail.
- Significant mobile overflow or unusable mobile menu appears.

Form emergency disable:
- Remove any window.BOFPublicIntakeConfig endpoint or data-intake-endpoint attribute if added later.
- Re-upload Website/assets/js/public-intake.js from this candidate.
