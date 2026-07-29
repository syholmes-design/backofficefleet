# Deployment Runbook

Candidate commit: 996a6c9d24421b4509622307312939b606241ec6 (implementation commit; ending documentation HEAD reported in final response)

Do not execute this runbook from this pass. Required controlled sequence:

1. Confirm final candidate commit.
2. Confirm clean Git status.
3. Stop local test server.
4. Back up current live files listed in STATIC-UPLOAD-FILE-LIST.txt, plus existing sitemap.xml, robots.txt, and .htaccess if present.
5. Verify FTP certificate and exact destination document root.
6. Upload low-risk static assets first.
7. Upload CSS and JavaScript, including the logo-corrected shared shell files and optional logo-animation assets.
8. Upload new route directories.
9. Upload modified public pages.
10. Upload legal pages.
11. Upload sitemap.xml and robots.txt.
12. Apply approved .htaccess last, including route-level X-Robots-Tag for /private-investor-plan/.
13. Purge or bypass cache where available.
14. Run live smoke tests for all public routes in FINAL-ROUTE-INVENTORY.md.
15. Verify hidden routes and noindex headers.
16. Verify forms remain disabled and show no fake success.
17. Record deployment result, timestamps, and hashes.
18. Roll back immediately if launch blockers occur.

Smoke tests after upload:
- Homepage, all sitemap routes, /book-a-demo/, /contact/, /assessment/, /priority-fleet-program/, /customer-demo/, /customer-demo/?portal=business-operations, /privacy/, /terms/, /accessibility/.
- Verify /sitemap.xml and /robots.txt return 200.
- Verify /customer-demo/ and /interactive-demo/ receive noindex handling.
- Verify /private-investor-plan/ loads by direct URL with no passcode form, no gate overlay, no auth sessionStorage key, approved BOF logo visible, meta robots noindex/nofollow/noarchive, and X-Robots-Tag noindex/nofollow/noarchive after .htaccess is live.
- Verify /private-investor-plan/ is absent from public header/footer navigation, homepage/company/resources/assessment/priority cards, and sitemap.xml.
- Verify the public header logo source is /assets/brand/bof-design-system-2/svg/header-lockup.svg and no public page visually renders a CSS-generated BF monogram.
- Verify /customer-demo/ uses the same approved DS2 header-lockup logo treatment in its application sidebar.
- Verify the optional logo animation appears only on first homepage/customer-demo open, stores only harmless sessionStorage flags, and is disabled for reduced-motion users.
- Do not upload obsolete logo files for this correction unless an approved rollback is being performed.
