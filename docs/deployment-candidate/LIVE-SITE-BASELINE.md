# Live Site Baseline

Generated: 2026-07-28T21:52:03.0445602-04:00
Method: Read-only HTTPS Invoke-WebRequest, no upload
Candidate commit: CANDIDATE_COMMIT_PENDING

No upload was performed. Baseline was read-only HTTPS.

| URL | Status | Length | SHA-256 | Title or note |
|---|---:|---:|---|---|
| https://backofficefleet.com/ | 200 | 18464 | aedcb5d716d33ea8bc755a9b958f77f8cf0074f197d5ac8efb4ecda8a6ffd93b | BackOfficeFleet / Trucking Back-Office Operating Layer |
| https://backofficefleet.com/sitemap.xml | 404 | 0 |  | The remote server returned an error: (404) Not Found. |
| https://backofficefleet.com/robots.txt | 404 | 0 |  | The remote server returned an error: (404) Not Found. |
| https://backofficefleet.com/.htaccess | 403 | 0 |  | The remote server returned an error: (403) Forbidden. |
| https://backofficefleet.com/drivers/ | 200 | 7430 | 8c653743c344bc92ea4cc8d695085ef885be2ad3df762bdecfcdf2368ae71d9b | Driver Roster &amp; Readiness / BackOfficeFleet |
| https://backofficefleet.com/dispatch/ | 200 | 8201 | 428a2877139841ba33ac989949aee9eedcdabb2c1a427907baed7bcfaee255e4 | Dispatch Load Intake / BackOfficeFleet |
| https://backofficefleet.com/safety/ | 200 | 7764 | 972481cc21ea81f625091a59bfdcc80592ab9b9a49c3d5db4b42465fc15075a2 | Safety Command Center / BackOfficeFleet |
| https://backofficefleet.com/settlements/ | 200 | 5964 | d46b28fc320b4e8d223d38d94ab7e227e9216bc517a41345af74fcc528269ee9 | Settlements Command Center / BackOfficeFleet |
| https://backofficefleet.com/business-operations/ | 200 | 13924 | 4804079aa8c7ddba900574d68cf27e5da4033eb5ac12ef88754674b285540e91 | Business Operations / BackOfficeFleet |
| https://backofficefleet.com/policies-procedures/ | 200 | 35893 | c84bd4c7dc42b1e25e6261d8b705c9386af67e19d065ecc240cd114882d1725d | Policies &amp; Procedures / BackOfficeFleet |
| https://backofficefleet.com/bof-vault/ | 200 | 5529 | fdd9339d612444c87809a0667fd54fe5169980a436ca0db3b4bcf33d3ad4c3d3 | BOF Vault / BackOfficeFleet |
| https://backofficefleet.com/customer-demo/ | 200 | 3954 | 7d9eb59595f9575548f4ad9267388b29a4c58d7e838a3063c4f25e9af866f71d | BOF Customer Demo / Manager Portal |
| https://backofficefleet.com/interactive-demo/ | 200 | 55105 | 67aab19d07739868f579c296a8a53d18cea3ce1988a2465c43d5e537c00daa79 | Try Partner TMS Release Review / BackOfficeFleet |
| https://backofficefleet.com/internal-intake-review/ | 404 | 0 |  | The remote server returned an error: (404) Not Found. |

Baseline findings:
- Current live homepage is reachable at status 200; SHA-256 recorded above.
- Current live sitemap.xml returned 404.
- Current live robots.txt returned 404.
- Current live .htaccess returned 403 and is not publicly readable, which is expected for Apache protection.
- Current live internal-intake-review returned 404.
- Current live customer-demo and interactive-demo returned 200; future controlled upload must preserve hidden/noindex handling.

Rollback source or backup status:
- A fresh pre-upload backup is still required before any deployment.
- No FTP or server-side backup was created in this pass.
