# Government data access: outreach register

Statuses: `drafted` → `approved` → `sent` → `awaiting-reply` → `in-discussion` → `requirements-received` → `application-ready` (needs authorization) → `active` / `closed`.
Log each send and reply with its date. Keep private contact names and anything said in confidence **out of this public repo**: record "see mailbox thread" instead.

## Register

| ID | Agency / program | Contact & channel | What we're asking for | Requirements known so far | Correspondence | Status | Sent | Response | Next action | Owner |
|---|---|---|---|---|---|---|---|---|---|---|
| F0a | FMCSA QCMobile (self-service) | mobile.fmcsa.dot.gov → Login.gov → My WebKeys | Free webKey for BOF | Login.gov account; app name | — | **to do** | — | — | Create the key, then add `FMCSA_QCMOBILE_WEBKEY` to BOF (Vercel, sensitive) | **You** (Login.gov MFA) |
| F0b | data.transportation.gov (self-service) | Socrata account | App token for census/SMS bulk sync | Free account | — | **to do** | — | — | Create the token, then BOF nightly sync | **You** |
| F1 | FMCSA developer support (QCMobile) | fmctechsup@dot.gov | Usage terms, rate limits, status after Motus, bulk guidance | Include the Login.gov email; never the key | [draft](drafts/F1-fmcsa-developer-support-qcmobile.md) | drafted | | | Approve, then send after F0a | You approve |
| F2 | FMCSA Office of the CTO | FMCSA.CTO@dot.gov, (617) 494-3003 | Introductory meeting: data completeness, authorized service-provider interfaces, pilots | — | [draft](drafts/F2-fmcsa-cto-data-partnership.md) | drafted | | | Approve and send | You approve |
| F3 | PSP (NIC Federal operator) | 877-642-9499 (no public email) | Industry Service Provider requirements for a multi-carrier platform | ISP $100/yr; about $10/record; FMCSA-form applicant consent; audits | [call brief + email](drafts/F3-psp-industry-service-provider.md) | drafted | | | You call (or approve a call); request written requirements; **no enrollment** | **You** (call) |
| F4 | Drug & Alcohol Clearinghouse | clearinghouse@dot.gov, 844-955-0207 | Confirm Assistant model across multiple employers; role management under Motus; integration plans | Employers buy query plans; no API; driver consent recorded in Clearinghouse | [draft](drafts/F4-clearinghouse-assistant-model.md) | drafted | | | Approve and send | You approve |
| F5 | FMCSA Medical Programs / National Registry | FMCSAMedical@dot.gov (**verify**) | Programmatic examiner verification | Public registry search | [draft](drafts/F5-national-registry-medical.md) | drafted | | | Verify address, approve, send | You approve |

## Carrier authorization (needed before using PSP or Clearinghouse)

| Item | Status |
|---|---|
| Carrier service agreement authorizing BOF to act for the carrier (programs listed) | Not drafted; recommend legal review |
| Driver consent capture: PSP FMCSA disclosure/authorization form; Clearinghouse consent handled inside the Clearinghouse | Not built |
| Per-carrier record of granted roles (Clearinghouse Assistant, Motus associate) | Not built |

## Later phases (not started)
- **States:** employer notification programs and commercial MVR access, starting with the founding
  fleets' base states.
- **Checkr:** partner application (prior draft: `../verification-partnerships/drafts/03-checkr-partner-application.md`).

## Log
- 2026-10-16: FMCSA research complete; F1–F5 drafted. Nothing sent. SambaSafety removed from scope (owner decision).
