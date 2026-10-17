# Government data access: outreach register

Statuses: `drafted` → `approved` → `sent` → `awaiting-reply` → `in-discussion` → `requirements-received` → `application-ready` (needs authorization) → `active` / `closed`.
Log each send and reply with its date. Keep private contact names and anything said in confidence **out of this public repo**: record "see mailbox thread" instead.

## Register

| ID | Agency / program | Contact & channel | What we're asking for | Requirements known so far | Correspondence | Status | Sent | Response | Next action | Owner |
|---|---|---|---|---|---|---|---|---|---|---|
| F0a | FMCSA QCMobile (self-service) | mobile.fmcsa.dot.gov → Login.gov → My WebKeys | Free webKey for BOF | Login.gov account; app name | — | **to do** | — | — | Create the key, then add `FMCSA_QCMOBILE_WEBKEY` to BOF (Vercel, sensitive) | **You** (Login.gov MFA) |
| F0b | data.transportation.gov (self-service) | Socrata account | App token for census/SMS bulk sync | Free account | — | **to do** | — | — | Create the token, then BOF nightly sync | **You** |
| F1 | FMCSA developer support (QCMobile) | fmctechsup@dot.gov | QCMobile availability, usage terms, data after Motus; whether the Motus datasets (inys-ebih, nakq-58th) plus census are the recommended bulk source | Include the Login.gov email; never the key | [draft](drafts/F1-fmcsa-developer-support-qcmobile.md) (finalized 2026-10-17) | drafted | | | Approve, then send after F0a | You approve |
| F2 | FMCSA Office of the CTO | FMCSA.CTO@dot.gov, (617) 494-3003 | Introductory meeting: data completeness, authorized service-provider interfaces, pilots | — | [draft](drafts/F2-fmcsa-cto-data-partnership.md) | drafted | | | Approve and send | You approve |
| F3 | PSP (NIC Federal operator) | 877-642-9499 (no public email) | Industry Service Provider requirements for a multi-carrier platform | ISP $100/yr; about $10/record; FMCSA-form applicant consent; audits. 2026 operator re-competition (MC-RS-26-33-00008): no award found (**verify**) | [call brief + email](drafts/F3-psp-industry-service-provider.md) (finalized 2026-10-17) | drafted | | | Legal review first; then you call (or approve a call); ask about electronic consent and the operator transition; request written requirements; **no enrollment** | **You** (call) |
| F4 | Drug & Alcohol Clearinghouse | clearinghouse@dot.gov, 844-955-0207 | Confirm Assistant model across multiple employers; role management under Motus; Assistant removal; integration plans | Employers buy query plans; no API; driver consent recorded in Clearinghouse | [draft](drafts/F4-clearinghouse-assistant-model.md) (finalized 2026-10-17) | drafted | | | Approve and send with F6 | You approve |
| F5 | FMCSA Medical Programs / National Registry | FMCSAMedical@dot.gov (**verify**) | Programmatic examiner verification | Public registry search | [draft](drafts/F5-national-registry-medical.md) | drafted | | | Verify address, approve, send | You approve |
| F6 | FMCSA Contact Center (registration, licensing, insurance, Motus) | Web ticket ask.fmcsa.dot.gov/app/ticket; 1-800-832-5660 (Mon–Fri 8–8 ET) | Motus "Supporting Company" role scope for a service provider acting for multiple carriers; Clearinghouse effect; Motus dataset completeness | Job aid: fmcsa.dot.gov/registration/motus-supporting-company-job-aid (Dec 2025) | [draft](drafts/F6-fmcsa-motus-supporting-company.md) | drafted | | | Approve, then file one web ticket | You approve |
| F7 | DataQs program | Program manager named in a 2026 Federal Register notice (see mailbox notes; don't record names here) | Data-correction workflow for client carriers | — | not drafted | research | | | Later | — |
| S1 | Michigan SOS Record Sales / Record Lookup Unit | (517) 322-1624 (**verify**), 7064 Crowner Dr, Lansing MI 48918 | Eligibility as a multi-carrier service provider; subscription service (electronic?); bond; agreement | $15/record; possible $25k bond; 5-yr resale records | [call brief + letter](drafts/S1-michigan-sos-record-sales.md) | drafted | | | Approve; call, then mail or email the letter | You approve |
| S2 | Georgia DDS Bulk MVR | mvr@dds.ga.gov | Bulk Requestor role; batch web service spec; fees; private-detective licence question | $100 setup; $7/$9 per record; 4-yr retention | [draft](drafts/S2-georgia-dds-bulk-mvr.md) | drafted | | | Counsel reviews the rule 375-3-8 question (legal-review Q13); then approve and send | You + counsel |
| S3 | Ohio BMV Records Request Unit | BMVRecords@dps.ohio.gov, (614) 752-7548 (**verify**) | Record account for an agent of multiple carriers; electronic/batch options | $5/record; letterhead request + BMV 1173 | [draft](drafts/S3-ohio-bmv-record-account.md) | drafted | | | Approve and send | You approve |
| S4 | Missouri DOR Driver License Record Center | dlrecords@dor.mo.gov, 573-526-2407 | DPPA access code (Form 4678); batch/monitoring options; bulk policy | ~$2.82/record; 5-yr recipient log | [draft](drafts/S4-missouri-dor-driver-records.md) | drafted | | | Approve and send | You approve |

Full state findings: [`state-mvr-plan.md`](state-mvr-plan.md). Roadmap and the registrations list: [`driver-intelligence-roadmap.md`](driver-intelligence-roadmap.md).

## Carrier authorization (needed before using PSP or Clearinghouse)

| Item | Status |
|---|---|
| Carrier service agreement authorizing BOF to act for the carrier (programs listed) | Not drafted; counsel questions in [`legal-review-questions.md`](legal-review-questions.md) (section H) |
| Driver consent capture: PSP FMCSA disclosure/authorization form; Clearinghouse consent handled inside the Clearinghouse | Not built |
| Per-carrier record of granted roles (Clearinghouse Assistant, Motus associate) | Not built |

## Later phases (not started)
- **States:** research done for OH, MI, GA and MO; inquiries S1–S4 drafted (awaiting approval).
- **Legal review:** questions for counsel in [`legal-review-questions.md`](legal-review-questions.md).
- **Checkr:** partner application (prior draft: `../verification-partnerships/drafts/03-checkr-partner-application.md`).

## Log
- 2026-10-16: FMCSA research complete; F1–F5 drafted. Nothing sent. SambaSafety removed from scope (owner decision).
- 2026-10-17: State MVR research (OH, MI, GA, MO) and FMCSA open-data/Motus research complete. Register rows F6–F7 and S1–S4 added. Nothing sent.
- 2026-10-17: Phase 3: state inquiries S1–S4 and F6 drafted; F1–F4 finalized. Nothing sent.
