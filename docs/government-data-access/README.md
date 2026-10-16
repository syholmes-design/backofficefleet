# BOF Government Data Access & Driver Intelligence Initiative

**Goal:** build BOF's own driver verification, qualification and continuous-monitoring
capability on authoritative sources. Carriers that work with BOF authorize BOF to obtain data
**on their behalf**.

**Priority order (owner decision, 2026-10-16):** 1) FMCSA → 2) state motor vehicle agencies →
3) Checkr. **SambaSafety is not being pursued.**

**Rules:**
- Every message is drafted here and **sent only after owner approval**. Sender:
  partnerships@nathson.com.
- No fees paid, no applications submitted and no agreements accepted without explicit
  authorization.
- Driver data is obtained only with documented carrier authorization **and** the driver consent
  each program requires.

| File | Contents |
|---|---|
| [`fmcsa-access-plan.md`](fmcsa-access-plan.md) | FMCSA programs, access routes, multi-carrier model, costs, technical requirements, contacts |
| [`outreach-register.md`](outreach-register.md) | Structured register: contacts, requirements, correspondence, responses, next actions |
| [`drafts/`](drafts/) | Individualized correspondence awaiting approval |

## Phases
1. **FMCSA** (this deliverable): public carrier data (QCMobile, open data), PSP as an Industry
   Service Provider, Clearinghouse assistant model, Medical Examiner registry, and a data
   partnership discussion with FMCSA's technology office.
2. **State motor vehicle agencies:** employer notification programs (e.g. CA EPN), commercial MVR
   access, and service-agent rules state by state, starting with the founding fleets' base states.
3. **Checkr:** partner API for MVR, criminal and drug-testing workflows where direct government
   access is impractical.

## How BOF acts for multiple carriers (summary)
BOF is a **service provider authorized by each carrier**, not the employer of record. Each
program has its own mechanism:
- **Public data** (QCMobile, census, SMS): no authorization needed.
- **PSP:** BOF holds one Industry Service Provider account. It requests reports for a carrier only
  with that carrier's authorization and the applicant's FMCSA-form consent.
- **Clearinghouse:** each carrier stays the employer of record and buys its own query plan. The
  carrier's administrator adds BOF staff as **Assistants**, and one Assistant may serve many
  employers.
- **FMCSA registration data (Motus):** a carrier's Company Official can grant BOF staff associate
  roles for that carrier's record.

The BOF platform must record, per carrier: the written service authorization, which programs it
covers, and the people and roles granted. Per driver, it must record the consent artifacts each
program requires.
