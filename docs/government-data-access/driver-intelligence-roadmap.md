# BOF Driver Intelligence System: roadmap (2026-10-17)

**Goal:** monitor driver and carrier compliance with BOF's own system, using authorized government sources directly wherever feasible. Licensed providers fill only the gaps the law or the economics require. SambaSafety is out of scope.

**Rule:** build on what exists. The existing pieces are:
- `lib/services/fmcsa/`: carrier verification, now with profiles, monitoring rules and open data;
- `lib/services/samba/`: BOF's internal findings engine, which records findings with evidence, provenance and an audit trail. The name is internal and has nothing to do with the vendor;
- the `DriverLicense`, `MedicalQualification`, `DrugTestRecord` and `VerificationSource` models;
- the driver qualification file (DQF) and document vault;
- the `AuditEvent` table.

No parallel stores.

## 1. Build directly vs. licensed provider

| Capability | Source | Build directly? | Notes |
|---|---|---|---|
| Carrier identity, USDOT status, size, MCS-150 | FMCSA census (open data), QCMobile | **Yes, free** | Code ready |
| Carrier authority and insurance monitoring | Motus datasets, QCMobile | **Yes, free** | Code ready; column names to verify |
| Carrier OOS orders | OOS Orders dataset | **Yes, free** | Code ready |
| Carrier inspection and crash trends | SMS input datasets | **Yes, free** | Next phase |
| Driver pre-employment crash and inspection history | PSP | **Yes, as an Industry Service Provider (ISP)** | $100/yr + ~$10/report; applicant consent on FMCSA's form |
| Drug & alcohol prohibition status | Clearinghouse | **Workflow only** (no API) | Carrier buys queries; BOF staff act as Assistants |
| Medical examiner validity | National Registry | **Yes** (lookup) | No API; medical status itself is on the state record |
| Med card / CDL status and violations (MVR) | State agencies | **Direct, one state at a time** | OH $5, MI $15, GA $7–9, MO ~$2.82 per record; per-state agreements, audits and FCRA questions |
| Continuous MVR monitoring | State programs | **Only Michigan** (subscription) among the 4 states | Elsewhere, scheduled re-pulls (cost per pull) |
| License identity match | AAMVA DLDV | Possible (direct or through a gateway) | Identity only, not an MVR |
| Employer CDLIS query | AAMVA, through a third party | Usually through a vendor | AAMVA rate schedule mentions third-party employer inquiry |
| MVRs from states BOF has no agreement with; nationwide monitoring | — | **Licensed provider** (Checkr, phase 3) | Drivers' 3-year licence history spans many states |
| Criminal records, employment verification | — | **Licensed provider** (Checkr) | FCRA consumer reporting agency territory |

## 2. Roadmap

**Phase A: carrier intelligence (now to ~4 weeks; $0)**
1. Add a carrier identity to fleets: USDOT, MC and docket on each fleet. This needs a migration (R1).
2. Store `FmcsaCarrierSnapshot` and route `CarrierAlert`s into the findings engine as new finding types (R2).
3. Run a daily sync (cron), using the Motus daily-changes dataset for incremental updates (R3).
4. Add a carrier compliance panel: current alerts, change history, evidence links.
5. Activate QCMobile on Preview once you have the key; it is used for on-demand checks.

**Phase B: driver qualification engine (~4–8 weeks; $0 build)**
1. **Driver compliance calendar:** CDL expiry, medical card expiry, annual MVR review (49 CFR 391.25), annual Clearinghouse query, PSP at hire. Built on the existing licence and medical models.
2. **MVR ingestion layer** with one source-neutral record (`DriverRecordSnapshot`): licence status, class, endorsements, restrictions, medical certification status and expiry, violations, accidents, suspensions. Each record links to its source and evidence.
3. **Rules engine** for driver alerts, mirroring the carrier monitoring:
   - suspension or disqualification;
   - medical certification lapsed or downgraded;
   - new major or serious violations (49 CFR 383.51);
   - points thresholds set by each carrier's policy.
4. **Consent and authorization ledger.** For each carrier: the service agreement and the programs it covers. For each driver: the consent artifacts each program requires (PSP form, state consent, FCRA disclosure). There is no data pull without a matching record.
5. **Clearinghouse workflow:** tasks, evidence upload and annual-query tracking.

**Phase C: direct government data (applications need your authorization)**
1. PSP ISP enrollment, after legal review and the F3 call.
2. Michigan SOS Record Sales, including the subscription.
3. Georgia DDS Bulk Requestor.
4. Ohio BMV record account.
5. Missouri DOR DPPA access code.

Each becomes a state adapter that writes `DriverRecordSnapshot`s; manual entry or upload is the interim adapter.

**Phase D: licensed provider for gaps (Checkr; needs authorization)**
Out-of-state MVRs and criminal checks feed the same snapshot model.

## 3. Registrations, credentials and agreements you must obtain

| # | Item | Cost | Who | Blocks |
|---|---|---|---|---|
| 1 | Login.gov account and **QCMobile webKey** | Free | You | Live carrier lookups |
| 2 | data.transportation.gov **app token** | Free | You | Higher open-data rate limits (optional) |
| 3 | Vercel Preview variables (QCMobile key, provider, staleness) | Free | You | Preview activation |
| 4 | **Carrier service agreement** template: BOF authorized to act for the carrier, listing the programs | Legal fees | You + counsel | Any driver data |
| 5 | **Driver consent and disclosure package:** PSP form, state forms (OH BMV 5008 for consent requests), FCRA disclosure and authorization | Legal fees | You + counsel | Any driver data |
| 6 | **Legal opinion:** is BOF a consumer reporting agency (FCRA) when it supplies MVRs or PSP reports to carriers? Does Georgia's private-detective licence rule (375-3-8) apply? | Legal fees | Counsel | State applications |
| 7 | **PSP Industry Service Provider** account | $100/yr + ~$10/report | You (application) | Pre-employment history |
| 8 | Clearinghouse **Assistant** registrations for BOF staff (each carrier invites them) | Free; carriers buy queries | Carriers + BOF staff | Clearinghouse workflow |
| 9 | Motus **Supporting Company** or associate roles for carrier records (verify scope) | Free | Carriers grant | Carrier-record management |
| 10 | **Michigan** SOS Record Sales: use agreement, possible $25k surety bond, subscription | $15/record + bond premium | You (application) | MI MVRs and monitoring |
| 11 | **Georgia** DDS Bulk Requestor: DDS-1250 forms, notarized security affirmation, GTA agreement; one Bulk User Certificate per carrier | $100 setup + $7–9/record | You (application) | GA MVRs |
| 12 | **Ohio** BMV record account: letterhead request, BMV 1173, MOU | $5/record | You (application) | OH MVRs |
| 13 | **Missouri** DOR DPPA access code (Form 4678) and MyDMV business account | ~$2.82/record | You (application) | MO MVRs |
| 14 | Data-security program: written policy, access controls, retention schedule (4–5 years by state), audit readiness | Internal | BOF | State agreements require it |
| 15 | (Optional) AAMVA DLDV and/or associate membership | Setup + per check; membership $2,905/yr | You | Licence identity checks |

## 4. Recommended next development tasks (ordered by cost, then operational value)

| # | Task | Cost | Value |
|---|---|---|---|
| 1 | Carrier identity on fleets (USDOT/MC): migration on a dev branch, data entry UI | $0 | Unlocks all carrier monitoring for real carriers |
| 2 | `FmcsaCarrierSnapshot` + findings integration + daily sync job | $0 | Continuous carrier compliance monitoring |
| 3 | Driver compliance calendar on existing licence and medical models | $0 | Immediate DQF value, with no data purchase |
| 4 | Consent and authorization ledger (carrier agreements, driver consents) | $0 | Prerequisite for every driver data source |
| 5 | `DriverRecordSnapshot` + driver rules engine + manual MVR upload | $0 | MVR review workflow before any state account exists |
| 6 | Clearinghouse workflow (tasks, evidence) | $0 | Annual-query compliance |
| 7 | Inspection and crash trends from SMS datasets | $0 | Carrier safety intelligence |
| 8 | PSP ISP integration (portal workflow) | $100/yr + per report | Pre-employment screening |
| 9 | State adapters MI → GA → OH → MO | Per record + setup | Direct MVRs and Michigan monitoring |
| 10 | Checkr adapter for gaps | Per report | Coverage beyond the 4 states |
