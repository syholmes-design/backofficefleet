# FMCSA access plan (first deliverable, 2026-10-16)

Research by web search only. The cloud environment cannot open FMCSA sites directly. Items
marked **verify** come from secondary sources or dated pages and must be confirmed before
relying on them. Nothing has been sent, submitted or paid.

## 1. Programs, what BOF should request, and how it works for multiple carriers

| # | Program | What it provides | Who may access | BOF's role and how it covers many carriers | Cost | Technical access |
|---|---|---|---|---|---|---|
| F1 | **QCMobile API** | Carrier lookup by USDOT/MC/docket/name: authority, insurance (L&I), out-of-service status, BASIC percentiles, cargo | Anyone with a free webKey (Login.gov account) | BOF's own key; public carrier data needs no carrier authorization. **BOF already has a finished QCMobile integration** (`lib/services/fmcsa/`); it only needs `FMCSA_QCMOBILE_WEBKEY`. | Free | REST/JSON, `webKey` query parameter; results capped at 50 per call; no published rate limit (**verify**) |
| F2 | **Open data** (data.transportation.gov: Company Census, SMS inspections/crashes/violations) | Bulk carrier census (daily), SMS input files (monthly) | Public | Nightly bulk sync to enrich and monitor every affiliated carrier | Free | Socrata SODA API; app token optional (higher rate limits) |
| F3 | **PSP**, Pre-Employment Screening Program | 5 years of crashes and 3 years of inspections for a named driver applicant | Motor carriers **and Industry Service Providers** (ISP) with an account | **Enroll BOF as an ISP**: one account, reports requested for each carrier's applicants. Each request requires the applicant's written disclosure and authorization on the **FMCSA-mandated form**, kept by BOF. Account holders are audited. | ISP subscription **$100/year**; about **$10 per record** (charged even when empty). **Verify** current amounts. | Web portal. No public API or batch spec found (**verify**). |
| F4 | **Drug & Alcohol Clearinghouse** | Pre-employment full queries and annual limited queries (prohibited / not prohibited) | Employers, C/TPAs, and **Assistants** invited by them | Each carrier stays the employer and **buys its own query plan** (a C/TPA can't buy one for an employer). The carrier's Clearinghouse administrator **invites BOF staff as Assistants**; **one Assistant can accept invitations from many employers**. BOF is not a C/TPA unless it administers DOT testing, so the Assistant model fits. | Query plans paid by each carrier (historically $1.25/query; **verify**) | **No API**: FMCSA guidance requires direct website use (consent must be recorded in the Clearinghouse). Full-query consent is given by the driver inside the Clearinghouse. |
| F5 | **FMCSA registration records** (Motus, which replaced the legacy Portal on 2026-05-14) | A carrier's own sensitive registration, inspection and crash details, DataQs challenges | Carrier Company Official plus associates they approve | Carrier grants BOF staff associate roles for its record (e.g. view sensitive info, DataQs) | Free | Web (Login.gov). **Verify** how roles map in Motus. |
| F6 | **National Registry of Certified Medical Examiners** | Whether the examiner on a med card is certified | Public lookup | Verify each med card's examiner; med-card status itself flows to the state CDL record (phase 2, state MVRs) | Free | Web lookup; no API found (**verify**) |
| F7 | **FMCSA technology / data office** | Discussion of data feeds after the Motus cutover, completeness, and future service-provider interfaces | — | Relationship and roadmap conversation; no data request | — | — |

## 2. What BOF should ask FMCSA for (in order)
1. **Now, self-service, free:** a QCMobile webKey (F1) and a Socrata app token (F2). These switch
   on carrier verification in BOF immediately. *Needs you: Login.gov sign-in.*
2. **Confirm the PSP Industry Service Provider requirements** (F3): enrollment documents, the
   multi-carrier operating model, electronic consent, any integration option, and the effect of
   FMCSA's 2026 PSP contract re-competition.
3. **Confirm the Clearinghouse Assistant model** (F4) for a service provider supporting many
   carriers, and how Assistant roles are managed now that Motus replaced the Portal. Also ask
   whether any integration is planned (FMCSA's 2026 information-collection renewal is open).
4. **Open a data conversation with FMCSA's technology office** (F7): data completeness after
   Motus, recommended bulk sources, and interest in piloting authorized service-provider access.
5. **Ask the Medical program** (F6) whether programmatic examiner verification exists.

## 3. Contacts

| Program | Contact | Source / confidence |
|---|---|---|
| QCMobile / FMCSA developer APIs | **fmctechsup@dot.gov** | FMCSA developer site support page (official) |
| FMCSA technology office | **FMCSA.CTO@dot.gov**, (617) 494-3003 | FMCSA Information Technology page (official) |
| PSP (operated by NIC Federal) | PSP Customer Service **877-642-9499** (Mon–Thu 8–6, Fri 8–5 ET) | Printed on the PSP ISP agreement and enrollment form; no PSP email found (**verify**) |
| Drug & Alcohol Clearinghouse | **clearinghouse@dot.gov**, Help Desk **844-955-0207** | CDLIS contact page and FMCSA contact page (official) |
| Medical program / National Registry | **FMCSAMedical@dot.gov** | National Registry final rule (official, dated; **verify**) |
| FMCSA Contact Center (general, registration/Motus) | 1-877-254-5365 and web form | FMCSA contact page (official) |
| FMCSA HQ | 1200 New Jersey Ave SE, Washington, DC 20590 | Official |

## 4. Risks and open questions
- **Motus cutover (2026-05-14):** a trade report describes public feeds, QCMobile included,
  temporarily missing some carrier data after the cutover. BOF should cross-check QCMobile against
  census data and ask FMCSA (draft F7).
- **QCMobile availability:** an undated FMCSA page says QCMobile and SaferBus were down. Current
  status is unconfirmed (draft F1 asks).
- **PSP contractor change:** FMCSA issued a sources-sought notice (May 2026) for the PSP operator.
  ISP terms or systems may change on award.
- **Clearinghouse:** no API. BOF's value is workflow orchestration and evidence capture around the
  website, not automated queries.
- **Consent and permissible use:** PSP and Clearinghouse data are driver-consent-gated. BOF needs
  carrier service agreements and driver consent capture before using either. Legal review is
  recommended before PSP enrollment.
- **Public repository:** these plans live in a public GitHub repo. Keep anything sensitive (contract
  terms, contact names given privately) out of git.

## Sources
- QCMobile: [Getting Started](https://mobile.fmcsa.dot.gov/QCDevsite/docs/getStarted), [API](https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi), [Support](https://mobile.fmcsa.dot.gov/QCDevsite/docs/support), [Mobile developer services page](https://www.fmcsa.dot.gov/safety/research-and-analysis/fmcsa%E2%80%99s-mobile-developer-website-and-web-services)
- Open data: [Company Census File](https://catalog.data.gov/dataset/company-census-file), [Census files](https://catalog.data.gov/dataset/motor-carrier-registrations-census-files)
- PSP: [ISP Account Holder Agreement](https://www.psp.fmcsa.dot.gov/pspApi/Documents/ISPAccountHolderAgreement.pdf), [Motor Carrier Enrollment](https://www.psp.fmcsa.dot.gov/pspApi/Documents/PSPMotorCarrierEnrollment.pdf), [2026 sources sought](https://www.cleat.ai/government/contracts/pre-employment-screening-program-246v), [NIC 2021 award](https://www.businesswire.com/news/home/20210304005832/en/NIC-Awarded-Contract-to-Continue-Operating-the-Federal-Motor-Carrier-Safety-Administration%E2%80%99s-Pre-Employment-Screening-Program)
- Clearinghouse: [Designate C/TPA](https://clearinghouse.fmcsa.dot.gov/Resource/Index/Clearinghouse-Designate-CTPA), [Registration Assistant Instructions](https://clearinghouse.fmcsa.dot.gov/Resource/Index/Registration-Assistant-Instructions), [How do I register as an assistant](https://www.fmcsa.dot.gov/regulations/drug-alcohol-testing/how-do-i-register-clearinghouse-assistant), [Webservice interface FAQ](https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2020-02/FMCSA-D%26A-CLEAR-382-FAQ033%20tmw.docx), [Automated interface FAQ](https://www.fmcsa.dot.gov/regulations/drug-alcohol-testing/are-there-plans-support-employer-interface-allowing-automated), [Contact](https://clearinghouse.fmcsa.dot.gov/contact), [CDLIS contacts](https://cdlis.dot.gov/Home/Contact)
- Portal/Motus: [Portal registration guide (associates)](https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2025-05/FMCSA%20Portal%20Registration%20User%20Guide%20for%20FMCSA%20Registered%20Entities%20and%20Associates.pdf), [Motus Federal Register notice](https://www.fmcsa.dot.gov/regulations/federal-register-documents/2026-08334), [Motus cutover data gap (trade report)](https://www.fleetfax.com/research/motus-cutover)
- Contacts: [FMCSA Contact Us](https://www.fmcsa.dot.gov/contact-us), [FMCSA Information Technology](https://www.fmcsa.dot.gov/mission/information-systems/information-technology), [National Registry rule](https://www.federalregister.gov/documents/2012/04/20/2012-9034/national-registry-of-certified-medical-examiners)
