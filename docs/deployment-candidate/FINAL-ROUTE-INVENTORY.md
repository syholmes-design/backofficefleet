# Final Route Inventory

Worktree: C:\Users\syhol\BOF-public-site-deployment-candidate
Branch: codex/public-site-deployment-candidate
Source commit: 79df9841d1c081ec191b96228c3db7861d82d69f
Candidate commit: CANDIDATE_COMMIT_PENDING
QA evidence: docs/deployment-candidate/qa-results.json ($(@{generatedAt=2026-07-29T01:51:22.124Z; base=http://127.0.0.1:8771; checks=266; routeCount=38; viewportCount=7; failureCount=0; failures=System.Object[]; routes=System.Object[]; screenshots=System.Object[]}.checks) checks, $(@{generatedAt=2026-07-29T01:51:22.124Z; base=http://127.0.0.1:8771; checks=266; routeCount=38; viewportCount=7; failureCount=0; failures=System.Object[]; routes=System.Object[]; screenshots=System.Object[]}.failureCount) failures)

| Route | Source file | Indexing | Sitemap | Canonical | Header/footer shell | Form status | Disposition | Expected behavior |
|---|---|---|---|---|---|---|---|---|
| / | Website/index.html | indexable | yes | https://backofficefleet.com/ | canonical public shell | disabled: none | overwrite | Homepage |
| /who-we-serve/ | Website/who-we-serve/index.html | indexable | yes | https://backofficefleet.com/who-we-serve/ | canonical public shell | disabled: none | overwrite | Audience hub |
| /aggregators/ | Website/aggregators/index.html | indexable | yes | https://backofficefleet.com/aggregators/ | canonical public shell | disabled local validation | overwrite | Aggregator audience page |
| /private-fleets/ | Website/private-fleets/index.html | indexable | yes | https://backofficefleet.com/private-fleets/ | canonical public shell | disabled: none | overwrite | Private fleet audience page |
| /for-hire-fleets/ | Website/for-hire-fleets/index.html | indexable | yes | https://backofficefleet.com/for-hire-fleets/ | canonical public shell | disabled: none | overwrite | For-hire audience page |
| /government/ | Website/government/index.html | indexable | yes | https://backofficefleet.com/government/ | canonical public shell | disabled local validation | overwrite | Government audience page |
| /drivers/ | Website/drivers/index.html | indexable | yes | https://backofficefleet.com/drivers/ | DS2 public shell | disabled local validation | overwrite | Driver product page |
| /dispatch/ | Website/dispatch/index.html | indexable | yes | https://backofficefleet.com/dispatch/ | DS2 public shell | disabled: none | overwrite | Dispatch product page |
| /safety/ | Website/safety/index.html | indexable | yes | https://backofficefleet.com/safety/ | DS2 public shell | disabled: none | overwrite | Safety product page |
| /settlements/ | Website/settlements/index.html | indexable | yes | https://backofficefleet.com/settlements/ | DS2 public shell | disabled: none | overwrite | Settlements product page |
| /business-operations/ | Website/business-operations/index.html | indexable | yes | https://backofficefleet.com/business-operations/ | canonical public shell | disabled: none | overwrite | Business Operations page |
| /documents/ | Website/documents/index.html | indexable | yes | https://backofficefleet.com/documents/ | DS2 public shell | disabled: none | overwrite | Document Control page |
| /policies-procedures/ | Website/policies-procedures/index.html | indexable | yes | https://backofficefleet.com/policies-procedures/ | DS2 public shell | disabled: none | overwrite | Policy Governance page with live book labels |
| /bof-vault/ | Website/bof-vault/index.html | indexable | yes | https://backofficefleet.com/bof-vault/ | DS2 public shell | disabled local validation | overwrite | BOF Vault page |
| /assessment/ | Website/assessment/index.html | indexable | yes | https://backofficefleet.com/assessment/ | canonical public shell | disabled local validation | overwrite | Five-path readiness assessment |
| /priority-fleet-program/ | Website/priority-fleet-program/index.html | indexable | yes | https://backofficefleet.com/priority-fleet-program/ | canonical public shell | disabled local validation | overwrite | Priority Fleet Program |
| /load-readiness/ | Website/load-readiness/index.html | indexable | yes | https://backofficefleet.com/load-readiness/ | canonical public shell | disabled: none | overwrite | Load Readiness utility |
| /network-readiness/ | Website/network-readiness/index.html | indexable | yes | https://backofficefleet.com/network-readiness/ | canonical public shell | disabled: none | overwrite | Network Readiness utility |
| /fleet-preparedness/ | Website/fleet-preparedness/index.html | indexable | yes | https://backofficefleet.com/fleet-preparedness/ | canonical public shell | disabled: none | overwrite | Fleet Preparedness utility |
| /company/ | Website/company/index.html | indexable | yes | https://backofficefleet.com/company/ | canonical public shell | disabled: none | overwrite | Company page |
| /about/ | Website/about/index.html | noindex, follow | no | https://backofficefleet.com/company/ | canonical public shell | disabled: none | retain | Compatibility page to Company |
| /contact/ | Website/contact/index.html | indexable | yes | https://backofficefleet.com/contact/ | canonical public shell | disabled local validation | overwrite | Contact intake page |
| /book-a-demo/ | Website/book-a-demo/index.html | indexable | yes | https://backofficefleet.com/book-a-demo/ | canonical public shell | disabled local validation | overwrite | Demo request page |
| /book-demo/ | Website/book-demo/index.html | noindex, follow | no | https://backofficefleet.com/book-a-demo/ | canonical public shell | compatibility only | retain | Meta-refresh compatibility route |
| /resources/ | Website/resources/index.html | indexable | yes | https://backofficefleet.com/resources/ | canonical public shell | disabled: none | overwrite | Resources hub |
| /privacy/ | Website/privacy/index.html | indexable | yes | https://backofficefleet.com/privacy/ | canonical public shell | disabled: none | overwrite | Privacy policy |
| /terms/ | Website/terms/index.html | indexable | yes | https://backofficefleet.com/terms/ | canonical public shell | disabled: none | overwrite | Terms of use |
| /accessibility/ | Website/accessibility/index.html | indexable | yes | https://backofficefleet.com/accessibility/ | canonical public shell | disabled: none | overwrite | Accessibility statement |
| /customer-demo/ | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Unified customer demo, including portal query states |
| /customer-demo/?portal=manager | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Manager portal state |
| /customer-demo/?portal=driver | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Driver portal state |
| /customer-demo/?portal=finance | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Finance portal state |
| /customer-demo/?portal=safety | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Safety portal state |
| /customer-demo/?portal=vault | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | BOF Vault portal state |
| /customer-demo/?portal=policy | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Policy portal state |
| /customer-demo/?portal=business-operations | Website/customer-demo/index.html | hidden/noindex by .htaccess | no | https://backofficefleet.com/customer-demo/ | approved app shell | demo only | retain hidden | Business Operations portal state |
| /safety-compliance/ | Website/safety-compliance/index.html | compatibility indexable until redirect approved | no | https://backofficefleet.com/safety-compliance/ | canonical public shell | disabled: none | retain | Legacy safety compatibility |
| /fleet/ | Website/fleet/index.html | compatibility indexable until redirect approved | no | https://backofficefleet.com/fleet/ | canonical public shell | disabled: none | retain | Legacy fleet/load-readiness compatibility |

Hidden or excluded source routes remain versioned but are not part of the public navigation or sitemap. Legacy prototype routes with submission PHP or older offer funnels are excluded from the static upload unless a separate owner approval promotes them.
