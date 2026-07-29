# Static Upload Inventory

Upload root: Website/
Destination root: https://backofficefleet.com/ document root
Source commit: 79df9841d1c081ec191b96228c3db7861d82d69f
Candidate commit: 996a6c9d24421b4509622307312939b606241ec6 (implementation commit; ending documentation HEAD reported in final response)

This inventory does not mean upload the repository. Upload only the path-level files listed in docs/deployment-candidate/STATIC-UPLOAD-FILE-LIST.txt.

Summary:
- Exact upload file count: 277
- Public/compatibility/hidden HTML files: 79
- CSS files: 13
- JavaScript files: 5
- Image/brand files: 137
- Video/media files directly included: 3
- sitemap.xml, robots.txt, and .htaccess are included and should be applied late in the runbook.

Included route families:
- Website/assets/ -> /assets/
- Website/who-we-serve/ -> /who-we-serve/
- Website/aggregators/ -> /aggregators/
- Website/private-fleets/ -> /private-fleets/
- Website/for-hire-fleets/ -> /for-hire-fleets/
- Website/government/ -> /government/
- Website/drivers/ -> /drivers/
- Website/dispatch/ -> /dispatch/
- Website/safety/ -> /safety/
- Website/settlements/ -> /settlements/
- Website/business-operations/ -> /business-operations/
- Website/documents/ -> /documents/
- Website/policies-procedures/ -> /policies-procedures/
- Website/bof-vault/ -> /bof-vault/
- Website/assessment/ -> /assessment/
- Website/priority-fleet-program/ -> /priority-fleet-program/
- Website/load-readiness/ -> /load-readiness/
- Website/network-readiness/ -> /network-readiness/
- Website/fleet-preparedness/ -> /fleet-preparedness/
- Website/company/ -> /company/
- Website/about/ -> /about/
- Website/contact/ -> /contact/
- Website/book-a-demo/ -> /book-a-demo/
- Website/book-demo/ -> /book-demo/
- Website/resources/ -> /resources/
- Website/privacy/ -> /privacy/
- Website/terms/ -> /terms/
- Website/accessibility/ -> /accessibility/
- Website/customer-demo/ -> /customer-demo/
- Website/private-investor-plan/ -> /private-investor-plan/ (hidden, noindex/nofollow/noarchive, unlinked, page-level gate removed)
- Website/safety-compliance/ -> /safety-compliance/
- Website/fleet/ -> /fleet/
- Website/index.html -> /
- Website/sitemap.xml -> /sitemap.xml
- Website/robots.txt -> /robots.txt
- Website/.htaccess -> /.htaccess

Explicit exclusions are listed in docs/deployment-candidate/STATIC-UPLOAD-EXCLUSIONS.txt. Backend development files, internal review files, source docs, local screenshots, source reports, and environment files must not be uploaded.

Rollback source for every upload item: pre-upload live backup first; local Git source commit 79df9841d1c081ec191b96228c3db7861d82d69f second.

Investor presentation rollback source: pre-upload live backup first; approved restoration source commit e1008048dbea221f10cdf196afb039a26d70385e second. The candidate intentionally removes the page-level JavaScript/sessionStorage gate while preserving noindex metadata and route-level X-Robots handling.
