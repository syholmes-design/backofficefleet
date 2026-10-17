# Interstate, regional and AAMVA access report (2026-10-17)

**Evidence standard.** Research was web search only; the proxy blocked direct reads of government sites, so facts come from search excerpts of the named pages.
- **[O]** = official text (excerpt).
- **[S]** = secondary source.
- **[U]** = unverified or inferred.

Nobody has been contacted. Full notes and sources:
- [`research/aamva-research-2026-10-17.md`](research/aamva-research-2026-10-17.md)
- [`research/interstate-ens-research-2026-10-17.md`](research/interstate-ens-research-2026-10-17.md)

## 1. Key distinction: sharing between governments vs commercial access

Most interstate driver systems exist so **states can talk to each other**. Their statutes and agreements give private companies no membership and no right to query them:
- CDLIS state-to-state exchange
- S2S/SPEXS
- PDPS
- the Driver License Compact, Nonresident Violator Compact and Driver License Agreement
- Nlets

Commercial access exists only where **both** of these hold:
1. A statute or rule names a private user. Examples: an employer under 49 CFR 384.225(e)(4); DPPA 18 U.S.C. 2721(b)(9) for an employer "or its agent"; 49 U.S.C. 30305(b) for NDR requests through a state.
2. AAMVA or a state has built a product for that user.

Membership in a coordinating body (AAMVA associate membership, attending committees) gives **no data rights**. [O]

## 2. Opportunity-by-opportunity

| Opportunity | What it actually is | States covered | Records | Private participation? | One authorization, many states? | Access method | Enrollment | Cost / obligations | Contact |
|---|---|---|---|---|---|---|---|---|---|
| **AAMVA CDLIS employer verification** ("CDLIS Third Party Access for CDLIS Employers Verification") | **Actual national access product** for employers through a third-party inquiry [O] | All CDL jurisdictions (CDLIS Central Site) | **Pointer data only:** current State of Record, prior states and licences. **Not** the driving history [O] | **Yes:** employers and prospective employers via third-party inquiry [O]. A service provider acting for many carriers is plausible but **not confirmed** [U] | **Yes for the pointer.** MVRs still come from each State of Record | AAMVA connection (CDLIS Gateway / web service) [U] | AAMVA approval; an NDA before pricing [O]; user agreement [U]; signed driver consent before or on the day of the query, which AAMVA audits [S] | Fees suspended since 10/1/2023; AAMVA "anticipates" restarting them [O]. FMCSA's fee proposal (2026-09943) sets state fees from 2027 [S] | CustomerService@aamva.org [O]; "Business with AAMVA" form [O] |
| **AAMVA DLDV** (Driver License Data Verification) | Actual national commercial product [O] | Participating jurisdictions (count: verify) | **Match / no-match** on licence data only | **Yes:** commercial customers directly or via gateway partners [O] | Yes | Web service | AAMVA approval + NDA [O]; setup + per-transaction fees (quoted under NDA) | Unknown until quoted | CustomerService@aamva.org |
| **FMCSA PSP** | Actual national program (already in plan F3) | National (federal data) | 5-yr crash and 3-yr inspection history; **not** an MVR | **Yes:** carriers and Industry Service Providers | Yes | Web portal | ISP agreement, FMCSA consent form, audits | $100/yr + ~$10/report | PSP 877-642-9499 |
| **NDR / PDPS** (NHTSA; AAMVA operates PDPS) | Federal pointer to "problem driver" records | All states | Pointer to the state with a revocation or suspension | **Request only:** the driver (or employer with the driver's consent) asks **through a state DMV**. A third party may submit one search under a consent the driver and employer both sign, but **the result goes to the employer** [O/S] | No. One search per consent; no batch | Per-request forms | Driver consent | Generally free [U] | NHTSA NDR; each state DMV |
| **CDLIS state-to-state / S2S / SPEXS** | Exchange between states only (prevents duplicate licences) | ~45 states in S2S [S] | — | **No** (even federal agencies are excluded) | — | — | — | — | — |
| **DLC / NRVC / DLA compacts** | Coordination between states on convictions and citations | Most states | — | **No** | — | — | — | — | — |
| **Nlets** | Law-enforcement network | All states | DL/MVR for criminal justice | **No** (government and criminal justice only) | — | — | — | — | — |
| **IRP / IFTA clearinghouses** | Vehicle registration / fuel tax | Most states | **No driver data** | No | — | — | — | — | — |
| **Tyler Technologies (ex-NIC) state portals** | **One vendor running ~20 separate state programs**, not a multi-state program | e.g. AL, AR, CO, ID, IN, KS, KY, ME, MD, MS, NE, NM, RI, SC, UT, VT, WV, WI, HI | State MVRs; several monitoring services | Yes, per state | **No: one subscriber agreement per state** [O for AR, IN, NE, ID] | Portals; some batch/API (MD REST API, AL DHR web service) | Per state | Per-state subscription ($75–150/yr) + state fee | Each state portal |
| **State employer notification services (ENS)** | Single-state alerting programs (§4) | ~19 states [O, VA DMV: "one of 19 states"] | That state's licensees only | Varies: agents explicitly allowed in a few | **No** | Email/portal/batch | Per state | Per state | Per state |
| **Regional driver-record compacts** | None found | — | — | — | — | — | — | — | — |

## 3. Programs that genuinely permit multi-state private-sector access

Only these three give a private company data spanning many states under **one** authorization:

1. **AAMVA CDLIS employer verification.** It covers *where* a CDL driver is licensed and their licence history, not the driving record. **[O] that the product exists; [U] that BOF can enrol as a service provider for multiple carriers.**
2. **FMCSA PSP**, as an Industry Service Provider. It covers federal crash and inspection data, not state MVRs. **[O]**
3. **AAMVA DLDV.** It is a match/no-match identity check only. **[O] for commercial eligibility.**

**Commercial resellers (consumer reporting agencies) are the only route to multi-state *MVRs* under one contract.** They hold the per-state agreements themselves. **No government or AAMVA program delivers MVRs or ongoing alerts from more than one state.** [O/U synthesis]

## 4. Employer notification networks

There is **no national ENS** [O]. MAP-21 §32303 and FMCSA's 2015 guidance let a state "push" ENS satisfy the §391.25 annual *inquiry*. The carrier's annual *review* still applies. [O]

| State | Program | Third-party / agent role | Delivery | Fee (as found) | Evidence |
|---|---|---|---|---|---|
| CA | Employer Pull Notice (EPN) | **Yes: DMV-approved EPN agents** manage accounts; each employer keeps its own requester code | Online (mandatory 4/2026) | ~$5/driver/yr [S] | O |
| NE | Driver Record Monitoring (Nebraska.gov) | **Yes for CDL:** DMV exempt use names "employers, or their agents" | Email + abstract | $0.06/driver/mo + abstract | O |
| WA | Employee record review (SSB 5246) | **Yes:** statute says "employer or its agent" | Contract | $0.06/record | O |
| UT | Driver History Monitoring (DLD) | Likely: every organization monitoring must register; CDL agents named | Portal | ~$125/yr subscription [O, dated] | O (program existence differs between the two research passes: verify) |
| TX | Driver Record Monitoring | Through a DPS-contracted provider | Vendor system | Set by DPS | O (statute) / U (current) |
| IN | IDEL | Per employer (Administrators and Watchers); agent role not stated | Email | $99/yr + $0.12/driver/mo | O |
| NY | LENS | Per organization; vendors resell monitoring built on it | Email | $7/driver add + $1/notice | O |
| VA | Driver Alert | Per employer under an Information Use Agreement | Next-day alert | ~$9–10 per record [O, 2016] | O |
| MD | Continuous Driver Monitoring | Subscription (DPPA-authorized subscribers) | Web, **REST API**, bulk | Subscription | O |
| WI | Employer Notification (Trans 118, in PARS) | Per employer | PARS | Now free | O |
| ID | Driver Record Dashboard | Per organization | Portal + alerts | $10/mo + $0.32/driver/mo | O |
| AR | Driver Watch | Subscriber | Portal/email | $150/yr + $1/driver | O |
| MI | Subscription Service | Commercial users via Record Sales | Annual + on change | Per record | O |
| MA | Driver Verification System | RMV permitted users; driver consent first | Email | — | O |
| ME | Driver CrossCheck | InforME subscriber | Email | — | O |
| AL | Driver Monitoring Service | Alabama Interactive | Triggered DHR pull | Pay on change | S |
| OR | Automated Reporting Service | Account holder's employees | Mail (certified court print) | — | O |
| SC | Employer Notification Program | Per employer (sliding annual fee) | Bulk upload | Sliding | O |
| WV, HI, DC | Portal monitoring | Subscriber / employer | Portal | WV $1/licence/mo; HI $0.15/driver/mo | O |
| MN | Daily change file (bulk subscription, not an ENS) | Contract holders | File | Capped monthly | O |

**Can BOF enrol as one third-party administrator for multiple carriers?**
- **CA (as an EPN agent), NE, WA and probably UT and TX:** yes or likely, under official text.
- **Most others:** they are built per employer. BOF would operate *inside each carrier's own enrolment*, as its administrator or watcher. That is lawful-looking but means one enrolment per carrier per state. **[U]: confirm state by state.**

**Integration.** Programs with an API or file feed (MD REST, MN file, WA contract, AL web service, SC upload) can feed BOF's monitoring pipeline directly. Email or portal programs need a parsing or inbox step. BOF's email service could take this in later: alerts would land in a dedicated mailbox and be parsed into findings. **Every program covers only that state's licensees.**

## 5. AAMVA: who to approach
- **Products (CDLIS third-party access, DLDV):** CustomerService@aamva.org [O]
- **Private-sector / business inquiries:** aamva.org "Business with AAMVA" contact form [O]
- **HQ:** 4401 Wilson Blvd, Suite 700, Arlington, VA 22203; 703-522-4200 [O]
- **Regional Directors** (AAMVA staff who work with member jurisdictions): Patrice Aasmo (Regions 1 & 2), Julie Knittle (Regions 3 & 4). No emails are published; reach them through 703-522-4200 [O]. They can explain jurisdiction contacts and the right committee; they do not grant access.
- **Relevant governance:** the Driver Committee, with its CDLIS, NDR and S2S subcommittees, and the working groups "**Managing Data Privacy and External Access**" and "**Third Party Agents**" [O]. These groups shape how jurisdictions treat outside requesters. Committee meetings are Oct 28–29, 2026, in Santa Fe.
- **Associate membership:** $2,905/yr for business [O]. It buys visibility and networking only. Optional.
- **AAMVA regions:**
  - **I:** CT, DE, DC, ME, MD, MA, NH, NJ, NY, PA, RI, VT
  - **II:** AL, AR, FL, GA, KY, LA, MS, NC, OK, SC, TN, TX, VA, WV
  - **III:** IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI
  - **IV:** AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY

  [O]

Draft letter: [`drafts/A1-aamva-cdlis-service-provider.md`](drafts/A1-aamva-cdlis-service-provider.md).

## 6. Risks
- **CDLIS litigation:** states have sued DOT and AAMVA over a federal demand for CDLIS master pointer records, and a temporary restraining order (TRO) is in place [O]. Third-party CDLIS products could be affected; ask AAMVA.
- **CDLIS fees** will return; the private rate is not published (NDA) [O].
- **Tyler subscriber terms** may forbid acting for third parties even where state law allows it. Read each agreement.
