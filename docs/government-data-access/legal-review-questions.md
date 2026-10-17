# Legal review: questions for counsel (draft, 2026-10-17)

**Starting position:** BOF does **not** assume that it qualifies for any exemption, permissible use, account type or licence exclusion. Each question below should be answered before the step it gates. BOF is a SaaS and back-office service provider (a Nathson company). It manages driver qualification for several affiliated motor carriers, which sit under carrier groups and an aggregator. It acts for each carrier under written authorization and with driver consent. Background: [`state-mvr-plan.md`](state-mvr-plan.md), [`fmcsa-access-plan.md`](fmcsa-access-plan.md), [`drafts/`](drafts/).

## A. FCRA
1. When BOF obtains MVRs or PSP reports and supplies them to carriers for hiring or retention, is BOF a consumer reporting agency, a reseller, or the carrier's agent outside the FCRA? Does this change if BOF scores, summarizes or flags records, or if the carriers are affiliated? *Decides: whether BOF needs a CRA compliance program before any state or PSP application.*
2. Who must give the 604(b)(2) stand-alone disclosure and obtain the authorization: the carrier, BOF, or BOF on the carrier's behalf? Can one combined form serve FCRA, PSP and state consent? *Decides: the design of the driver consent package.*
3. If BOF is a CRA or reseller, what certifications must each carrier give (604(f), 607(a)), how often, and in what form? *Decides: the carrier service agreement and onboarding flow.*
4. What pre-adverse and adverse-action support must BOF provide or enable (copies of the report, summary of rights, notices)? *Decides: platform features and carrier instructions.*
5. What accuracy (607(b)) and dispute (611) procedures apply when the data comes straight from a state or FMCSA? *Decides: the dispute-handling workflow and SLAs.*
6. Do state laws in Ohio, Michigan, Georgia or Missouri add disclosure, timing or notice duties beyond the FCRA for employment use of driving records? *Decides: per-state consent wording.*

## B. DPPA (18 U.S.C. 2721–2725)
7. Which 2721(b) purpose fits each use: (b)(9) CDL verification for hire and annual review; (b)(2) driver safety; (b)(3) verifying information a driver supplied; (b)(13) written consent? Should BOF rely on one purpose or state several? *Decides: the purpose BOF states on each state application and request.*
8. May a service provider request records under the carrier's permissible purpose, as its agent, or must BOF have its own purpose? *Decides: whether accounts are held by BOF or per carrier.*
9. Does giving a record to the carrier BOF requested it for count as resale or redisclosure under 2721(c)? If so, what must the 5-year recipient log contain? *Decides: the ledger schema and retention.*
10. What liability does BOF face (2724) if a carrier misuses a record, and what controls are expected? *Decides: contract terms and access controls.*

## C. State law
11. **Ohio, RC 4501.27 and OAC 4501:1-12-02:** may a provider hold one BMV account for several carriers? When is the notarized BMV 5008 consent required instead of a stated DPPA exception, and is an electronic signature acceptable? *Decides: account structure and consent forms.*
12. **Michigan, MCL 257.208c/208d:** what resale records and SOS inspection rights apply? Is a surety bond required for BOF's account type, and in what amount? Does the Subscription Service change any obligation? *Decides: whether to apply and the bond budget.*
13. **Georgia, OCGA 40-5-2 and rule 375-3-8:** would acting as a Bulk Requestor for carriers require a private detective licence or any other licence? What duties attach to each carrier's Bulk User Certificate? *Decides: whether Georgia is pursued, and in what form.*
14. **Missouri, RSMo 32.091 and 302.170:** what does Form 4678 allow BOF to redisclose? Do bulk requests (Form 5153) carry different rules? *Decides: the Missouri access route.*

## D. FMCSA programs
15. **PSP:** what obligations does the Industry Service Provider agreement impose (audits, retention, customer vetting, liability)? Must the FMCSA disclosure and authorization form be used verbatim, and may it be signed electronically? *Decides: whether BOF enrolls as an ISP.*
16. **Clearinghouse:** is the Assistant model (BOF staff invited by each carrier) consistent with 49 CFR Part 382 for a third-party employee? Are there limits on where driver consent is captured? *Decides: the Clearinghouse workflow.*
17. **49 CFR 391.23 and 391.25:** these place the MVR duty on the carrier. May a provider obtain and review MVRs on the carrier's behalf, and what must the carrier itself sign or keep (e.g. the annual review)? *Decides: what BOF does versus what the carrier must do.*
18. **Motus:** does the "Supporting Company" role or an associate role create any obligations or liability for BOF? *Decides: whether BOF accepts those roles.*

## E. Consent design
19. Do E-SIGN and state UETA laws cover each consent form (FCRA, PSP, OH BMV 5008, GA employment authorization)? What evidence must BOF keep (identity, timestamp, form version)? *Decides: the e-signature implementation.*
20. Which forms need notarization, and is remote online notarization acceptable? *Decides: driver onboarding steps.*
21. How should revocation of consent be handled, and does it affect annual MVR reviews the carrier is legally required to do? *Decides: revocation workflow.*

## F. Record retention
22. What retention schedule satisfies all sources together: state rules (4–5 years), DPPA 2721(c) (5 years), DQF records (49 CFR 391.51), PSP agreement terms and Clearinghouse records? *Decides: retention rules in the platform.*
23. When must records be deleted (end of carrier contract, driver separation, end of retention)? Who owns copies, the carrier or BOF? *Decides: deletion schedules and contract terms.*

## G. Data security and breach notification
24. What security standards do the state agreements, the PSP agreement, the FTC Safeguards Rule (if it applies) and state data-security laws impose? *Decides: the written security program.*
25. Which breach-notification laws apply (driver's home state, carrier state, agencies' contract terms), with what deadlines, and who notifies (BOF or the carrier)? *Decides: the incident response plan and contract clauses.*

## H. Contracts
26. What must the carrier service agreement contain: authorization scope by program, permissible-purpose certifications, consent responsibilities, data ownership, audit cooperation, retention and deletion? *Decides: the template needed before any driver data is obtained.*
27. How should liability, indemnity and limitation of liability be allocated between BOF and carriers, including carrier misuse and agency errors? *Decides: contract terms and pricing.*
28. What insurance should BOF carry (cyber, E&O, professional liability), and do any agencies require minimum coverage or bonding? *Decides: insurance purchase before applications.*
29. Does the affiliated structure (carrier groups and an aggregator) let one agreement cover several carriers, or must each carrier sign separately? *Decides: onboarding paperwork.*
