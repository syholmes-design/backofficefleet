# Stage 0 D-1 PR 3A — Regulatory gap matrix

Compares BOF's *currently modeled* qualification requirements with federal motor-carrier requirements. It changes no rule and no enforcement.

## How to read this

- **Sources.** Citations were checked through web searches of the eCFR, Cornell LII and FMCSA pages (links below). Direct eCFR/LII page fetches were blocked in this environment, so quoted points come from search summaries of those pages, not from a line-by-line read. Items marked **[V]** were corroborated by those summaries; items marked **[K]** are from general knowledge of the rules and **must be checked against the live eCFR** before anyone relies on them. Several FMCSA pages in the results were older than the current eCFR; where they disagreed, the eCFR governs.
- **This is not legal advice.** Whether a requirement applies depends on the carrier, driver, vehicle and operation (interstate vs intrastate, GVWR, hazmat, passengers, exemptions). Interpretations are flagged "HUMAN DETERMINATION" and need compliance or legal approval.
- **Operating model.** BOF performs these tasks as an outsourced back-office provider. The regulations place the duties on the motor carrier (employer); FMCSA guidance indicates third parties may perform some functions for a carrier [V], but responsibility generally remains with the carrier and, for Clearinghouse queries, a third-party administrator must be designated in the Clearinghouse [K]. Confirm BOF's designations and contracts.
- **"Enforced?"** means the authoritative evaluator turns it into a qualification finding today. **"Affects movement?"** means that finding blocks `authorizeMovement`. Priorities: P1 (safety/regulatory exposure, fix first), P2, P3.

## Summary

| # | Requirement | Modeled today | Enforced | Affects movement | Priority | Schema change appears needed |
| - | --- | --- | --- | --- | --- | --- |
| 1 | CDL and endorsements | CDL document only | CDL yes; endorsements no | CDL yes | P1 (endorsement vs load) | Possibly (load/equipment requirement attributes) |
| 2 | Medical certification / examiner verification | Document only | Partly | Yes (document) | P1 | Yes (certificate dates, examiner id) |
| 3 | Initial MVR | No | No | No | P1 | Yes (document type + request data) |
| 4 | Annual MVR inquiry and review | No | No | No | P1 | Possibly not (reuse requirement recurrence) |
| 5 | DQ file content/retention | Implicit | No | No | P2 | Optional |
| 6 | Employment-history investigation | 3-year coverage only | Yes (coverage) | Yes | P1 | Possibly (CMV flag) |
| 7 | Safety-performance-history investigation | No | No | No | P1 | Yes |
| 8 | Drug and alcohol testing | Pre-employment document only | Partly | Yes (document) | P1 | Possibly not |
| 9 | Clearinghouse pre-employment query | Linked document | Yes (document) | Yes | P1 | Possibly (query date/result) |
| 10 | Clearinghouse recurring query | No | No | No | P1 | Possibly not |
| 11 | Driver disqualification | Rejected history records | Yes (if a person sets REJECTED) | Yes | P1 | Likely (periods/dates) |
| 12 | Retention and verification records | Versioned documents, audit | No | No | P2 | Optional |

## Detailed matrix

### 1. CDL qualification and endorsements
- **Authority:** 49 CFR 383.23 (CDL required for specified CMVs) [K]; 383.93 endorsements — double/triple trailers, passenger, tank, hazardous materials, school bus [V]; 391.11 (driver must hold a valid license for the vehicle operated; not disqualified under 391.15; road test or equivalent) [V partial].
- **Applicability:** conditional — class depends on GVWR/combination and operation; endorsements depend on the load/vehicle (hazmat placards, tank, passengers, doubles). Non-CDL CMV operations exist.
- **BOF today:** registry item `DRIVER_LICENSE` (verified, unexpired document). `DriverLicense` (class, state, expiration) and `DriverEndorsement` (code, expiration) exist and feed only legacy rules.
- **Evidence source:** `DriverDocument(type=DRIVER_LICENSE)`; structured rows.
- **Missing:** no check that license class fits the assigned equipment; no endorsement-vs-load check; no restrictions; no CDL status check (state/CDLIS) beyond document verification.
- **Enforced / movement:** license document yes / yes; endorsements no / no.
- **Human determination:** yes — which loads/equipment need which endorsement; hazmat applicability.
- **Remediation:** carry required endorsement/class on load or equipment, compare to a *verified* `DriverEndorsement` in the movement check (new, separately certified rule).
- **Schema:** driver side no; requirement attributes on load/equipment possibly.

### 2. Medical certification and examiner verification
- **Authority:** 49 CFR 391.41 (physical qualifications), 391.43 (examination), 391.45 (who must be examined; at least every 24 months for most drivers) [K]; 391.23(m) (verify the examiner was listed on the National Registry; electronic FMCSA information controls over a paper copy) [V]; 391.51 file notes [V]. Rules changed around the National Registry II compliance date of June 23, 2025 (states transmitting certification data; CDLIS MVR option for CDL drivers) [V] — **verify post-June-2025 wording**.
- **Applicability:** drivers of CMVs in interstate commerce, subject to exemptions/waivers; certificate length varies (up to 24 months; shorter with conditions).
- **BOF today:** registry item `MEDICAL_CERTIFICATE` (document verified by BOF compliance, not expired per `verificationExpiresAt`).
- **Missing:** the evaluator checks `verificationExpiresAt`, **not** the certificate's own expiration date; there is no examiner registry number, no issue date, no variance/exemption tracking, no electronic (CDLIS) status. It is unclear whether `verificationExpiresAt` carries certificate expiry in practice.
- **Enforced / movement:** document yes / yes. **Human determination:** yes — what field means certificate expiry; acceptable proof post-NRII.
- **Remediation:** define certificate issue/expiry fields and examiner id; verify against the electronic source where available (no new vendor integration in D-1).
- **Schema:** yes (dedicated certificate dates, examiner id) — see schema proposal.

### 3. Initial motor vehicle record
- **Authority:** 49 CFR 391.23(a)(1) — inquiry within 30 days of the start of employment to each state where the driver held a license in the preceding three years [V]; file copy per 391.51.
- **Applicability:** universal for drivers a carrier employs.
- **BOF today:** none. `DriverDocumentType` has no MVR type; `VIOLATION_HISTORY` is a different concept.
- **Missing:** request date, states queried, response date, the MVR itself, 30-day timing.
- **Enforced / movement:** no / no. **Human determination:** yes (what BOF may accept as the record; which states).
- **Remediation:** add an MVR requirement type with date fields; make it a mandatory registry item only after approval.
- **Schema:** yes (document type value at least).

### 4. Annual MVR inquiry and review
- **Authority:** 49 CFR 391.25 — at least once every 12 months obtain the MVR (covering at least the preceding 12 months), review it to decide whether the driver meets minimum safe-driving requirements or is disqualified under 391.15, and keep a note of who reviewed and when [V]; FMCSA guidance accepts electronic systems that record the reviewer [V].
- **Applicability:** universal for employed drivers.
- **BOF today:** none; `ADVANCE_COMPLIANCE_POLICIES` provides recurrence only for MEDICAL, DRIVER_LICENSE, DRUG_TEST.
- **Missing:** annual cycle, due date, reviewer, review date, outcome.
- **Enforced / movement:** no / no. **Human determination:** yes (the safe-driving determination is a human decision).
- **Remediation:** a recurring requirement using existing `DriverIntakeRequirement` fields (`expiresAt`, `triggerDate`, `affirmedBy`, `verificationTimestamp`) plus a policy entry; decide whether lapse blocks movement.
- **Schema:** possibly not — reuse existing structures, plus a document type.

### 5. Driver qualification (DQ) file
- **Authority:** 49 CFR 391.51 — a file per driver; retained while employed and three years afterward; some items (annual MVR, review note) may be removed three years after execution [V]; contents include the application, MVR(s), review notes, medical certificate evidence, road test/equivalent and others [V]; electronic keeping permitted subject to producibility [V].
- **Applicability:** universal for employed drivers.
- **BOF today:** `DriverIntake` plus versioned `DriverDocument` rows effectively *are* the file; there is no whole-file completeness status.
- **Missing:** completeness across all 391.51 items; the "driver investigation history file" (391.53) as a distinct record.
- **Enforced / movement:** no / no. **Human determination:** yes (completeness judgment; electronic-record procedure).
- **Remediation:** derive a DQ-completeness report from the requirement list once items 3, 4, 6, 7 exist.
- **Schema:** optional.

### 6. Employment-history investigation
- **Authority:** 49 CFR 391.21 application — identification, addresses for three years, accidents and violations for three years, employment history for three years for all drivers and CMV employers for ten years for CDL drivers [V]; signed application kept in the file [V].
- **Applicability:** universal; the 10-year CMV record applies to CDL drivers (and to foreign drivers hired by U.S. carriers) [V].
- **BOF today:** `EMPLOYMENT_APPLICATION` document (verified) plus `WorkHistory` coverage over a **three-year** lookback with an internal 30-day gap flag.
- **Missing:** 10-year CMV employer record not evaluated; employer contact/verification; `WorkHistory` has no verifier fields and no CMV/DOT-regulated flag.
- **Enforced / movement:** yes (coverage) / yes. **Human determination:** yes — period and whether coverage must be verified.
- **Remediation:** extend lookback only after approval; add CMV/DOT-regulated attributes to work-history rows if needed.
- **Schema:** possibly (CMV flag).

### 7. Safety-performance-history investigation
- **Authority:** 49 CFR 391.23 — investigate the previous three years with DOT-regulated employers; previous employers must respond within 30 days; replies or documented good-faith efforts go in the driver investigation history file within 30 days of the start date; retained while employed plus three years [V]. Since 2023 the Clearinghouse query replaces the drug/alcohol part of the request; employers regulated by other DOT agencies must still be contacted [V].
- **Applicability:** universal for hired drivers; content varies with prior employers.
- **BOF today:** none.
- **Missing:** request/response records per prior employer, dates, good-faith documentation.
- **Enforced / movement:** no / no. **Human determination:** yes (what constitutes good-faith effort; timing).
- **Remediation:** per-employer investigation records or requirement rows with documents; report overdue ones.
- **Schema:** yes (or requirement rows per employer plus document type).

### 8. Drug and alcohol testing qualification
- **Authority:** 49 CFR 382.301 — verified negative controlled-substance result before the first safety-sensitive function, including first dispatch; limited exception where recent program records are obtained [V]; 382.305 random testing at the annual minimum rates (currently 50% drug / 10% alcohol per the eCFR text surfaced; one FMCSA page still shows an older rate) [V]; post-accident, reasonable-suspicion, return-to-duty and follow-up (382.303, .307, .309, .311) [K]; records retention in 382 subpart D [K].
- **Applicability:** drivers subject to part 382 (CDL drivers); exceptions exist.
- **BOF today:** registry item `PRE_EMPLOYMENT_DRUG_TEST` (verified document); a rejected structured record blocks. Result is not a structured field of the registry item; `DrugTestRecord.result` is free text.
- **Missing:** structured "verified negative" with dates; the 382.301(b) prior-program exception; random-pool enrollment; return-to-duty/follow-up status.
- **Enforced / movement:** partly / yes. **Human determination:** yes — who certifies "verified negative" (MRO result) and the exception.
- **Remediation:** require a structured negative result and date on the registry item; track pool enrollment as a requirement.
- **Schema:** possibly not (use `DrugTestRecord` with controlled result values).

### 9. Clearinghouse pre-employment query
- **Authority:** 49 CFR 382.701(a) — no safety-sensitive function without a pre-employment full query; the driver gives specific electronic consent in the Clearinghouse; a driver refusing consent cannot operate a CMV [V]; query records kept three years [V].
- **Applicability:** CDL drivers subject to part 382.
- **BOF today:** registry item `CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY` — a requirement linked to a verified document.
- **Missing:** query date, outcome (no record vs violation), consent evidence, who ran it (employer vs designated third-party administrator).
- **Enforced / movement:** yes (document) / yes. **Human determination:** yes — BOF's designation, and reading the result.
- **Remediation:** structured query date/result on the requirement; block when the result shows a prohibited status.
- **Schema:** possibly (date/result fields).

### 10. Clearinghouse recurring query
- **Authority:** 49 CFR 382.701(b) — at least annually for each covered driver; a limited query with general consent may suffice, and a hit requires a full query within 24 hours [V].
- **Applicability:** CDL drivers subject to part 382.
- **BOF today:** none.
- **Missing:** annual cycle, last query date, consent form status, escalation to a full query.
- **Enforced / movement:** no / no. **Human determination:** yes.
- **Remediation:** recurring requirement as in item 4.
- **Schema:** possibly not.

### 11. Driver disqualification
- **Authority:** 49 CFR 391.15 — disqualification for loss of driving privileges, specified offenses (first offense one year, later three), out-of-service violations, texting/hand-held phone; the driver must notify the employer of license actions by the end of the next business day; carriers cannot disqualify but may not use a disqualified driver they know or should know of [V]; 383.51 CDL disqualifications [K]; part 382 subpart B/F prohibitions and return-to-duty [K].
- **Applicability:** universal; durations depend on the offense.
- **BOF today:** `AccidentHistory`/`ViolationHistory` rows with status `REJECTED` and a rejected drug-test record disqualify; nothing ingests license actions.
- **Missing:** disqualification periods and dates, source authority, automatic expiry/restoration policy, monitoring beyond the annual items.
- **Enforced / movement:** yes, but only if a person records REJECTED / yes. **Human determination:** yes — a conviction/loss of privilege must be established from authoritative evidence before recording.
- **Remediation:** define an evidence standard and period fields; restoration must be a recorded human decision.
- **Schema:** likely (period start/end, authority).

### 12. Evidence retention and verification records
- **Authority:** 49 CFR 391.51 (employment plus three years; some records three years from execution) and 391.53 (investigation file, employment plus three years) [V]; Clearinghouse query records three years [V]; part 382 subpart D record periods (varying by record) [K]; electronic recordkeeping provisions [V].
- **BOF today:** document versions are never overwritten (`previousVersionId`, `supersededAt`), relations restrict deletion, and audit events exist; `VerificationSource` records providers and verifier where used.
- **Missing:** an explicit retention schedule, legal hold, proof that retention was applied; verifier/time on structured records.
- **Enforced / movement:** no / no. **Human determination:** yes (retention periods per record class).
- **Remediation:** document retention policy; add retain-until metadata only if enforcement is desired.
- **Schema:** optional.

## Cross-cutting findings

1. **Registry completeness is not established.** Items 3, 4, 7, 10 and endorsement fit (1) are regulatory requirements not modeled at all; items 2, 6, 8, 9 are modeled only as verified documents.
2. **Date semantics are ambiguous** (`verificationExpiresAt` vs certificate expiry; `verifiedFromSourceAt`).
3. **Recurring obligations** (annual MVR review, annual Clearinghouse query, medical expiry, random testing) have no general recurrence mechanism beyond three advance-window policies.
4. **Disqualification depends on human entry** of REJECTED status.
5. No change to enforcement is proposed by this analysis; each remediation is a future, separately certified change.

## Sources (search-confirmed summaries)
- [49 CFR 391.51](https://www.law.cornell.edu/cfr/text/49/391.51) · [49 CFR 391.25](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-391/subpart-C/section-391.25) · [49 CFR 391.23](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-391/subpart-C/section-391.23) · [49 CFR 391.21](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-391/subpart-C/section-391.21)
- [49 CFR 391.15](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-391/subpart-B/section-391.15) · [49 CFR 383.93](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-383/subpart-F/section-383.93)
- [49 CFR 382.701](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-382/subpart-G/section-382.701) · [49 CFR 382.301](https://www.law.cornell.edu/cfr/text/49/382.301) · [49 CFR 382.305](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-382/subpart-C/section-382.305)
- [FMCSA: consent for Clearinghouse queries](https://www.fmcsa.dot.gov/regulations/drug-alcohol-testing/what-consent-process-full-and-limited-queries) · [FMCSA Clearinghouse: pre-employment investigations after January 6, 2023](https://clearinghouse.fmcsa.dot.gov/Learn/News/Item/pre-employment-investigations-after-Jan-6-2023) · [FMCSA National Registry II guidance](https://www.fmcsa.dot.gov/regulations/medical/if-state-has-not-implemented-national-registry-ii-june-23-2025-compliance-date)
