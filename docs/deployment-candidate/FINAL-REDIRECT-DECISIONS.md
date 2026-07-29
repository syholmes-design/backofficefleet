# Final Redirect Decisions

Candidate commit: 996a6c9d24421b4509622307312939b606241ec6 (implementation commit; ending documentation HEAD reported in final response)

Approved now:
- /book-demo/ remains a noindex compatibility page with canonical /book-a-demo/ and meta refresh. Internal links now point to /book-a-demo/.

Deferred, retained as compatibility:
- /about/ retained as a noindex compatibility page canonicalizing to /company/.
- /safety-compliance/ retained until full redirect parity is owner-approved.
- /fleet/ retained until full redirect parity is owner-approved.
- /customer-demo/ and /customer-demo/?portal=... remain hidden app routes, excluded from sitemap, covered by .htaccess X-Robots-Tag.
- /interactive-demo/* was not deleted or redirected in this pass. It remains versioned and should not be changed without separate parity review.

Not approved:
- No broad legacy-route deletion.
- No hidden-demo redirect.
- No investor/internal route publication.
