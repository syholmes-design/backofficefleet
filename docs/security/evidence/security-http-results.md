| Group | Check | Result | Evidence |
|---|---|---|---|
| Anonymous: public pages stay public | / | PASS | HTTP 200 |
| Anonymous: public pages stay public | /business-operations | PASS | HTTP 200 |
| Anonymous: public pages stay public | /business-operations/hr-tier/recruiting-onboarding | PASS | HTTP 200 |
| Anonymous: public pages stay public | /contact | PASS | HTTP 200 |
| Anonymous: public pages stay public | /careers | PASS | HTTP 200 |
| Anonymous: public pages stay public | /apply | PASS | HTTP 200 |
| Anonymous: public pages stay public | /assessment | PASS | HTTP 200 |
| Anonymous: public pages stay public | /assessment/private-fleets | PASS | HTTP 200 |
| Anonymous: public pages stay public | /demo/dispatch | PASS | HTTP 200 |
| Anonymous: public pages stay public | /demo/drivers | PASS | HTTP 200 |
| Anonymous: public pages stay public | /demo/loads | PASS | HTTP 200 |
| Anonymous: public pages stay public | /demo/command-center | PASS | HTTP 200 |
| Anonymous: public pages stay public | /dashboard | PASS | HTTP 200 |
| Anonymous: public pages stay public | /documents | PASS | HTTP 200 |
| Anonymous: public pages stay public | /documents/company-operations-vault | PASS | HTTP 200 |
| Anonymous: public pages stay public | /customer-portal | PASS | HTTP 200 |
| Anonymous: public pages stay public | /portals | PASS | HTTP 200 |
| Anonymous: public pages stay public | /portals/manager | PASS | HTTP 200 |
| Anonymous: private pages redirect to sign-in | /dispatch | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdispatch |
| Anonymous: private pages redirect to sign-in | /dispatch/intake | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdispatch%2Fintake |
| Anonymous: private pages redirect to sign-in | /drivers | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdrivers |
| Anonymous: private pages redirect to sign-in | /drivers/DRV-001/bank-info | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdrivers%2FDRV-001%2Fbank-info |
| Anonymous: private pages redirect to sign-in | /drivers/DRV-001/hr | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdrivers%2FDRV-001%2Fhr |
| Anonymous: private pages redirect to sign-in | /drivers/DRV-001/profile | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdrivers%2FDRV-001%2Fprofile |
| Anonymous: private pages redirect to sign-in | /emergency-contacts | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Femergency-contacts |
| Anonymous: private pages redirect to sign-in | /documents/vault | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fdocuments%2Fvault |
| Anonymous: private pages redirect to sign-in | /command-center | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fcommand-center |
| Anonymous: private pages redirect to sign-in | /loads/L001 | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Floads%2FL001 |
| Anonymous: private pages redirect to sign-in | /settlements | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fsettlements |
| Anonymous: private pages redirect to sign-in | /settlements/workbook | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fsettlements%2Fworkbook |
| Anonymous: private pages redirect to sign-in | /pretrip/L009 | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fpretrip%2FL009 |
| Anonymous: private pages redirect to sign-in | /recruiting | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Frecruiting |
| Anonymous: private pages redirect to sign-in | /recruiting-v2 | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Frecruiting-v2 |
| Anonymous: private pages redirect to sign-in | /carriers/CAR-003 | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fcarriers%2FCAR-003 |
| Anonymous: private pages redirect to sign-in | /portals/customer | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fportals%2Fcustomer |
| Anonymous: private pages redirect to sign-in | /customers | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fcustomers |
| Anonymous: private pages redirect to sign-in | /portals/driver | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fportals%2Fdriver |
| Anonymous: private pages redirect to sign-in | /contact-inquiries | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fcontact-inquiries |
| Anonymous: private pages redirect to sign-in | /maintenance | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fmaintenance |
| Anonymous: private pages redirect to sign-in | /source-of-truth | PASS | HTTP 307 → /api/auth/signin?callbackUrl=%2Fsource-of-truth |
| Anonymous: private APIs return 401 | GET /api/drivers | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: private APIs return 401 | GET /api/dispatch/operating-spine | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: private APIs return 401 | GET /api/recruiting-v2/qualification/CAND-SEC1792331953440-A | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: private APIs return 401 | POST /api/recruiting-v2/documents/CAND-SEC1792331953440-A | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: private APIs return 401 | GET /api/contact/inquiries | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: private APIs return 401 | GET /api/driver/vault/documents | PASS | HTTP 401 {"error":"Unauthorized","code":"AUTH_REQUIRED"} |
| Anonymous: public endpoints still work | GET /api/auth/providers | PASS | HTTP 200 |
| Anonymous: public endpoints still work | POST /api/contact/inquiries (empty body reaches validation, not auth) | PASS | HTTP 422 |
| Anonymous: public endpoints still work | POST /api/recruiting/apply (reaches validation, not auth) | PASS | HTTP 400 |
| Sign-in | fleet-a-admin@dev.local signs in and returns to the requested page | PASS | landed on /dispatch |
| Sign-in | fleet-b-admin@dev.local signs in and returns to the requested page | PASS | landed on /dispatch |
| Sign-in | bof-operations@dev.local signs in and returns to the requested page | PASS | landed on /dispatch |
| Signed in: private pages open | fleet-a-admin /dispatch | PASS | HTTP 200 |
| Signed in: private pages open | fleet-a-admin /drivers | PASS | HTTP 200 |
| Signed in: private pages open | fleet-a-admin /command-center | PASS | HTTP 200 |
| Signed in: private pages open | fleet-a-admin /recruiting | PASS | HTTP 200 |
| Role checks | fleet-a-admin (FLEET_ADMIN) is refused the BOF-staff inquiry queue | PASS | HTTP 403 |
| Role checks | bof-operations (BOF_OPERATIONS) opens the inquiry queue | PASS | HTTP 200 |
| Role checks | fleet-a-admin GET /api/contact/inquiries is refused | PASS | HTTP 403 |
| Recruiting V2 tenancy | Fleet A reads its own candidate CAND-SEC1792331953440-A | PASS | HTTP 200 |
| Recruiting V2 tenancy | Fleet A cannot read Fleet B's candidate CAND-SEC1792331953440-B | PASS | HTTP 404 |
| Recruiting V2 tenancy | Out-of-scope and unknown codes are indistinguishable | PASS | HTTP 404 |
| Recruiting V2 tenancy | Fleet B cannot read Fleet A's candidate CAND-SEC1792331953440-A | PASS | HTTP 404 |
| Recruiting V2 tenancy | Fleet B reads its own candidate CAND-SEC1792331953440-B | PASS | HTTP 200 |
| Recruiting V2 tenancy | BOF operations staff read both fleets' candidates | PASS | HTTP 200 / 200 |
| Recruiting V2 tenancy | Fleet A cannot add a document to Fleet B's candidate (no row written) | PASS | HTTP 404, documents before=0 after=0 |
| Recruiting V2 tenancy | Fleet A cannot activate Fleet B's candidate into Fleet A | PASS | HTTP 404 |
| Public documents | Text documents linked from the public file cabinet (17 checked) have no SSNs, consumer e-mails or non-555 driver phones | PASS | 17 documents clean |
