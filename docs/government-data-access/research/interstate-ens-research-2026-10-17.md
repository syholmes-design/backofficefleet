# Interstate / Regional Access Programs and State Employer Notification Services (ENS)

Prepared for BackOfficeFleet (BOF), 2026-10-17. Research only; nobody was contacted.

## Research limitations (read first)

- **Every primary source was unreachable.** The egress proxy refused connections (403 CONNECT / DNS failure) to fmcsa.dot.gov, in.gov, dmv.ny.gov, dmv.virginia.gov, dmv.ca.gov, nlets.org, portal.arkansas.gov, scribd.com, web.archive.org and others. I could not open the FMCSA 2018 ENS report PDF or the FMCSA "Employer Notification Services by State (May 2018)" chart.
- **Facts tagged [Official]** come from search-engine snippets of official pages: FMCSA, state DMV/DOT, state legislature and state portal sites. I did not read those pages in full.
- **The search budget ran out partway through.** The shared limit of 200 searches per turn was reached before Part A searches started (Tyler/NIC portals, DLC/NRVC/DLA, Nlets). Those Part A items rest mainly on the researcher's background knowledge and are tagged **[Unverified]**. Check them before relying on them.
- Tags: **[Official]** = official government source (via snippet); **[Secondary]** = vendor, insurer, news or law-firm source; **[Unverified]** = background knowledge or inference, not confirmed in this session.

---

# PART A — Interstate / regional opportunities

## A.1 Classification summary

| Candidate | Classification | Private participation? | One authorization covers multiple states? | Notes |
|---|---|---|---|---|
| Driver License Compact (DLC) | Coordination body only (no data access) | No | n/a | State-to-state conviction reporting under "one driver, one license, one record". [Unverified] |
| Nonresident Violator Compact (NRVC) | Coordination body only (no data access) | No | n/a | Handles citations given to non-residents and failure-to-appear suspensions. [Unverified] |
| Driver License Agreement (DLA) | Coordination body only (no data access) | No | n/a | AAMVA-sponsored merger of DLC and NRVC; few states have adopted it. [Unverified] |
| Nlets | Multi-state but government-only | Only as a contractor to criminal-justice or authorized government agencies; never for employment screening | n/a | Owned by the states; carries DL/MVR queries between law-enforcement agencies. [Unverified] |
| Tyler Technologies (formerly NIC) state e-gov portals | **Not a single multi-state program.** It is one vendor running many separate state programs. Each state program allows private participation. | Yes: employers and their agents subscribe per state | **No.** Each state portal has its own subscriber agreement, account fee and DPPA terms. [Unverified as a general rule; confirmed per-state account fees for AR and IN, see below] | The closest thing to "fewer relationships" is that contracts, billing and technical patterns look alike from state to state. |
| FMCSA PSP | ACTUAL multi-state access program (private participation possible) | Yes (motor carriers and authorized agents) | Yes (national) | Already known to BOF. Covers crash and inspection data, not state MVRs. |
| AAMVA CDLIS / S2S / NDR-PDPS / DLDV | Covered by another agent | — | — | One line only, per instructions. |
| IRP clearinghouse | Multi-state but government-only; **vehicle registration, not driver data** | No (carriers file through their base state) | n/a | Apportions registration fees. Has no driver history records. [Unverified] |
| IFTA clearinghouse | Multi-state but government-only; **fuel tax, not driver data** | No | n/a | Nets fuel-tax payments between jurisdictions. Has no driver data. [Unverified] |
| Regional compacts (New England, Western states, etc.) | None found for driver records | — | — | No regional compact that shares driver-record data was identified. [Unverified] |
| State-designated intermediaries (e.g., TX monitoring contractors) | Single-state, private participation | Yes, through the designated contractor | No | See A.5. |

**Bottom line for Part A:** apart from the federal/AAMVA channels the other agent is covering, no interstate or regional program lets a private company get state MVRs or alerts from several states under one authorization. Compacts and Nlets are government-only. Tyler/NIC portals still need one subscriber relationship per state. Their value to BOF is that the onboarding pattern repeats, so the work is easier to do many times. [Unverified synthesis]

## A.2 Driver License Compact / NRVC / DLA

| Item | Detail | Tag |
|---|---|---|
| Participating states | DLC: about 45 states plus DC. Non-members are commonly listed as GA, MA, MI, TN and WI. NRVC: about 44–45 states plus DC. Non-members are commonly listed as AK, CA, MT, OR and WI. DLA: very few adopting states. | [Unverified] |
| Records | Conviction and suspension notices exchanged between licensing agencies. No query service. | [Unverified] |
| Private participation | None. Members are state licensing agencies. | [Unverified] |
| Technical | For CDL holders, conviction exchange runs mainly over AAMVA CDLIS (other agent). Non-CDL exchange varies by state. | [Unverified] |
| Contact | AAMVA (compact administration / DLA). | [Unverified] |
| Relevance to BOF | Indirect. Because of the compacts, an out-of-state conviction should appear on the licensing state's record, which is why a home-state MVR is usually enough. BOF cannot use them directly. | [Unverified] |

## A.3 Nlets

| Item | Detail | Tag |
|---|---|---|
| What it is | A nonprofit owned by the states that links state law-enforcement message switches. Supports DL, vehicle and criminal-history queries. | [Unverified] |
| Private participation | Not for employment or driver-qualification screening. Private companies connect only as vendors under CJIS-governed contracts serving criminal-justice agencies. | [Unverified] |
| Classification | Multi-state but government-only. | [Unverified] |

## A.4 Tyler Technologies (NIC) state portals — MVR / driver-history subscriber programs

**Key point.** Each state portal runs under its own contract with its state, and that state's DMV owns the records. A subscriber account opened in one state does not reach another state's records. BOF needs a separate subscriber agreement, separate DPPA permissible-use certification and a separate annual fee for each state. [Unverified as a rule; consistent with the AR and IN account fees below]

| State | Portal / program | Evidence | Tag |
|---|---|---|---|
| Arkansas | Arkansas.gov, run by **Tyler Arkansas**. Driver records subscription plus **Driver Watch** monitoring. $150/yr subscription, up to 10 users. | "Access requires a subscription administered by Tyler Arkansas … $150.00 per year with a maximum of 10 users" — https://www.arkansas.gov/driverwatch/setup.html , https://portal.arkansas.gov/service/driver-watch-user-login/ | [Official] |
| Indiana | **IN.gov** (INdotgov; Tyler/NIC-operated). $95/yr IN.gov account fee. BMV IDEL monitoring and the CDL ENS CDB access agreement run through IN.gov accounts. | https://www.in.gov/accounts/ingov-services-price-list , https://www.in.gov/accounts/files/BMV-CDL-ENS-CDB-Access-Agreement-08_25_26.pdf | [Official] (account fee); [Unverified] (that the operator is currently Tyler) |
| Nebraska | **Nebraska.gov** subscriber service (Tyler/NIC). Driver-record monitoring at $0.06 per record per month. | https://www.nebraska.gov/subscriber/pdf/DLRmonitoringcon.pdf | [Official] (program); [Unverified] (operator) |
| Idaho | **Access Idaho** (Tyler/NIC). ITD Driver Record Dashboard. | https://its.idaho.gov/ita/wp-content/uploads/sites/3/2017/01/2016NASCIOAwards_ITD_DRD.pdf | [Official] (program run with Access Idaho) |
| Iowa | **Iowa Interactive** (Tyler/NIC). Employers set up an account before ordering MVRs. | Secondary employer guide (via search) | [Secondary] (dated about 2014) |
| Kansas | Kansas.gov / KanAccess (Tyler/NIC). Commercial driver-record subscriber accounts. | — | [Unverified] |
| Oklahoma | OK.gov (Tyler/NIC). MVR subscriber accounts. | — | [Unverified] |
| Tennessee | TN.gov (Tyler/NIC). Driver-record subscriber accounts. | — | [Unverified] |
| Utah | Utah.gov (Tyler/NIC). Driver License Division record sales. Since 2020 (HB 183), employers may monitor current employees with written consent. | https://le.utah.gov/~2020/bills/hbillenr/HB0183.pdf | [Official] (statute); [Unverified] (portal operator) |
| Others commonly Tyler/NIC-operated that may sell MVRs through the portal | AL, CO, DE, HI, KY, ME (InforME), MS, MT, RI, SC, TX (Texas.gov), VT, WV, WI | — | [Unverified] (confirm state by state) |
| Michigan | Not a Tyler portal for this purpose. SOS "Record Sales" runs subscription, direct access and record lookup; apply through SOS Online Services. | https://michigan.gov/sos/resources/communities/businesses | [Official] |

**Practical approach.** Order the onboarding by fleet driver-count by state. Use Tyler's similar agreement and API/batch formats across states to cut engineering cost. Still budget one contract, one fee and one compliance audit per state. [Unverified recommendation]

## A.5 State-designated intermediaries / contracted channels

| State | Arrangement | Tag / source |
|---|---|---|
| Texas | Transportation Code §521.060 lets DPS run a **driver record monitoring program through contracts with private providers**. The contractor notifies participating entities of convictions and license-status changes. Each entity signs an agreement with DPS. Eligibility follows the Texas Motor Vehicle Records Disclosure Act. BOF would join through the DPS-designated contractor or become one. | [Official] bill analyses https://capitol.texas.gov/tlodocs/81R/analysis/html/SB00512I.htm ; contract example https://public.destinyhosted.com/burnemindocs/2022/ComCt/20220927_4426/1405_21.j_Contract.pdf |
| California | EPN employers may use only **DMV-approved "EPN agents"**. Otherwise DMV "does not permit the use of unauthorized third party persons to receive confidential information". From 2026-04-01, 13 CCR §350.47 requires EPN enrollment through DMV's electronic portal. | [Official] INF 1104 / EPN pages (see Part B) |
| Washington | Employers may name an **agent** on the DOL Release of Interest form. 2012 SSB 5246 lets DOL contract with "an employer or its agent" for monitoring. | [Official] https://lawfilesext.leg.wa.gov/Biennium/2011-12/Htm/Bill%20Reports/Senate/5246%20SBA%20TRAN%2011.htm |
| Pennsylvania | Commonly reported to sell bulk and commercial MVRs only to PennDOT-approved commercial users or vendors. | [Unverified] |
| Other states that sell commercial MVRs only through their e-gov portal operator (see A.4) | De facto designated intermediary. | [Unverified] |

---

# PART B — Employer Notification Services (ENS)

## B.1 Federal framework

| Item | Detail | Tag / source |
|---|---|---|
| MAP-21 §32303 (2012) | Allows employers to meet the annual driver-record check through occurrence-based notification systems that meet minimum standards set by the Secretary. Required FMCSA to report on a **national** driver record notification system. | [Official] https://www.fmcsa.dot.gov/mission/policy/map-21-moving-ahead-progress-21st-century-act |
| FMCSA regulatory guidance, 80 FR (Mar. 12, 2015) | A carrier enrolled in a state ENS (or a third-party service drawing on state data) that pushes license-status, crash and conviction changes satisfies the §391.25 annual inquiry. **Carriers still have to do the annual §391.25 review of the driver.** Where a state offers only periodic pull access, the annual MVR is still required. | [Official] https://www.federalregister.gov/documents/2015/03/12/2015-05645/driver-qualifications-regulatory-guidance-concerning-the-use-of-computerized-employer-notification |
| FMCSA report to Congress, Sept 2015 (National Driver Record Notification System) | Recommends a plan for a national system. Describes the Colorado/Minnesota pilot (drivers' express consent; electronic conviction and suspension alerts), which "indicated that an expanded ENS was needed". | [Official] https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/National%20Driver%20Record%20Notification%20System%20Report%20Enclosure%20FINAL%20September%202015.pdf |
| AAMVA ENS Design & Best Practices Rec. v1.0.2 | Prepared under an FMCSA grant. Option 1: each state builds its own ENS to common standards. Option 2: a national ENS that states join. | [Official] https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/registration/commercial-drivers-license/396341/aamva-ens-design-and-best-practices-recommendations-ver-102.pdf |
| FMCSA "ENS: Best Practices and Recommendations" (Aug 2018) | Says "18 States have ENS". Defines ENS as "an IT system or service available to employers to receive information electronically from an SDLA on changes in employees' DHRs. **May be a State or third-party provided service**." Guidance only; not binding. | [Official] (snippet) https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/registration/commercial-drivers-license/415871/employer-notification-services-best-practices-and-recommendations-august-2018.pdf ; landing page https://www.fmcsa.dot.gov/registration/commercial-drivers-license/fmcsa-employer-notification-services-ens-best-practices-and |
| FMCSA "Employer Notification Services by State (May 2018)" chart | Covers 18 states. Gives 16 or 17 as push-ENS states depending on version (marked with a red asterisk). Each entry shows the system name, contact, cost and whether a state or third party runs it. Oregon and South Carolina appear in the chart. **The full chart could not be read.** | [Official] (snippet) https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/registration/commercial-drivers-license/405406/jurisdictional-ens-implementation-final_0.pdf |
| DOT Privacy Impact Assessment: ENS State Pilot Test | Covers the federal pilot. | [Official] https://www.transportation.gov/citizens/privacy/pia-employer-notification-service-state-pilot-test |
| Proposed federal ENS mandates | "Miranda's Law" (S.3603, 115th Congress; S.1787, 116th Congress) would have defined and required an ENS for school-bus and other drivers. **Not enacted.** | [Official] https://www.congress.gov/115/bills/s3603/BILLS-115s3603is.pdf |
| National ENS? | **None exists.** No federal or AAMVA national push ENS for private employers was found. FMCSA leaves ENS to the states (AAMVA Option 1). | [Official] (guidance is state-level), [Unverified] (that nothing was launched after 2018) |

## B.2 State ENS / driver-monitoring programs

Delivery codes: E = email alert; P = portal/dashboard; M = mail; B = batch file.

| State | Program | URL | Eligibility / third-party (TPA) role | Delivery | Fees (as found) | Enrollment | Contact | Tag |
|---|---|---|---|---|---|---|---|---|
| **Arkansas** | **Driver Watch** (ENS in FMCSA chart) | https://www.arkansas.gov/driverwatch/aboutdw.html ; https://portal.arkansas.gov/service/driver-watch-user-login/ | Employers monitoring AR **CDL** holders. Subscription through Tyler Arkansas. TPA role not stated. | P; E (optional biweekly status checks, Mondays) | $150/yr subscription (up to 10 users); $13 per full record pulled; +$1 per driver per month for biweekly checks. The FMCSA 2018 chart lists $13 base and $95 annual. | Tyler Arkansas subscriber account | Tyler Arkansas / Arkansas.gov | [Official] (fees conflict; may be dated) |
| **California** | **Employer Pull Notice (EPN)** | https://www.dmv.ca.gov/portal/news-and-media/enhanced-dmv-digital-employer-pull-notice-service-much-faster-than-paper/ ; forms INF 1104, 1100, 1102 | Employers (commercial and government) get a **requester code**. **Third parties only as DMV-approved EPN agents**, who can "manage your account and driver records". Out-of-state-licensed drivers need form INF 1102. | P (digital EPN), M (legacy). Automatic notices for convictions, suspensions and collisions, plus an annual report per driver. | $5 per enrolled driver; $1 per annual report and per activity report. Accounts over 10 drivers are invoiced monthly. VC §1812 employers and fire departments are exempt. | Online. **Electronic portal enrollment required from 2026-04-01 (13 CCR §350.47).** | EPN unit (916) 657-6346 | [Official] |
| **Colorado** | ENS pilot with FMCSA (Colorado/Minnesota) | FMCSA 2015 report | Historic pilot; drivers gave express consent. A current program was not confirmed. | E | — | — | CO DMV | [Official] (pilot); current status [Unverified] |
| **Idaho** | **Driver Record Dashboard (DRD)** (ITD with Access Idaho) | https://its.idaho.gov/ita/wp-content/uploads/sites/3/2017/01/2016NASCIOAwards_ITD_DRD.pdf ; https://itd.idaho.gov/wp-content/uploads/2019/06/2016-04_TAC_Drv_Record_Presentation.pdf | Employers and motor carriers; roster of Idaho drivers; individual logins per organization. TPA role not stated. | P + alert. Records checked twice a month for convictions and suspensions; medical-certificate data updated nightly. Up to 1,000 drivers uploaded at once. | (2018) $10 per month access fee; $0.14 per driver twice a month. | Access Idaho subscription | ITD / Access Idaho | [Official] (2015–2018 sources) |
| **Indiana** | **Indiana Driver Employer Link (IDEL)**, launched Dec 2021 | https://www.in.gov/bmv/ens ; FAQ https://www.in.gov/bmv/ens/faqs ; agreement https://www.in.gov/accounts/files/BMV-CDL-ENS-CDB-Access-Agreement-08_25_26.pdf | Organizations employing **Indiana CDL** drivers. The organization creates Administrators and Watchers. A TPA as Watcher is not stated. The agreement says IDEL is "not to be solely relied upon" for federal requirements. | E (generic alert on 3 critical status changes) → Watcher logs into the portal | $99/yr ENS fee (introductory) + $95/yr IN.gov account. $10 per record pull at notification. The price list also shows $0.12 per driver per month. | IN.gov account plus the BMV CDL ENS CDB Access Agreement | BMV / IN.gov | [Official] |
| **Michigan** | **Subscription Service** (SOS Record Sales) | https://michigan.gov/sos/resources/communities/businesses | Employers checking employees who drive for work. Commercial users apply through Record Sales. Permissible use is required. | M (historically) / record generated annually and when a violation, restriction, suspension or revocation posts | A fee for the initial record, for yearly records, and for each record generated by a violation. Records are $15 each per one source. | Online application through SOS Online Services → Record Sales | MI SOS Record Sales | [Official]/[Secondary] |
| **Minnesota** | FMCSA ENS pilot (with CO). No current DVS ENS found. Minn. Stat. 171.168 only requires drivers to self-report. | https://www.revisor.mn.gov/statutes/cite/171.168 | — | — | — | — | MN DVS | [Official] (pilot); current program not found |
| **Nebraska** | **Nebraska.gov Driver Record Monitoring** (subscriber) | https://www.nebraska.gov/subscriber/pdf/DLRmonitoringcon.pdf | Subscribers keep a list of employees. The DMV exempt use covers "employers, **or their agents** or insurers" for CDL/CLP holders; other drivers need an exemption or the driver's consent. | E (monthly monitoring with email alerts) + abstract | $0.06 per record per month + $7.50 statutory abstract fee when activity occurs (agreement). The FMCSA chart shows $50/yr, $0.06 per driver and $3 per change. | Nebraska.gov subscriber account + monitoring contract | Nebraska.gov (402) 471-7810 | [Official] (fees conflict) |
| **New York** | **LENS (License Event Notification Service)** | https://dmv.ny.gov/dmv-records/license-event-notification-service-lens | Employers and regulators. Free for government and volunteer fire companies. Commercial and not-for-profit organizations pay. Whether a TPA may enroll for several employers was not confirmed. | E/P. Notifications for status change, suspension, revocation, convictions, and PIRP completion. | Prepaid escrow (plan on $10 per driver); $7 to add a driver; $1 per notification; $7 per additional record. Can share the escrow with Records Search Service / 19-A. | Online application (about 2 weeks), FEIN, estimated driver count; fund the escrow, then add drivers | lens@dmv.ny.gov ; 518-486-4480 (per insurer guide); DMV Revenue Accounting (518) 474-0888 | [Official]/[Secondary] |
| **Oregon** | Listed in the FMCSA May 2018 chart; program details not retrieved | https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/registration/commercial-drivers-license/405406/jurisdictional-ens-implementation-final.pdf | — | — | — | — | ODOT DMV Record Services | [Official] (listing only) |
| **South Carolina** | Listed in the FMCSA May 2018 chart; details not retrieved | same | — | — | — | — | SCDMV | [Official] (listing only) |
| **Texas** | **Driver Record Monitoring (pilot/program)**, Transp. Code §521.060, run by a **DPS-contracted private provider** | https://capitol.texas.gov/tlodocs/81R/analysis/html/SB00512I.htm | Entities eligible under the TX MVRDA. Each signs an agreement with DPS. The vendor notifies of convictions and DL status changes. | Vendor system | Fee set by DPS to cover cost (amount not found) | DPS agreement + vendor | TxDPS Driver License Division | [Official] (statute/bill); operational details [Unverified] |
| **Virginia** | **Driver Alert** (Voluntary Driving Record Monitoring Program) | https://www.dmv.virginia.gov/records/voluntary ; https://transactions-d.dmv.virginia.gov/commercial/voluntary.asp | Employers. Employee permission needed for non-CDL drivers. Information Use Agreement required. Free for public organizations. | Alert the day after a conviction posts. Customizable: convictions, 7+ points per year, suspensions/revocations. | (2016 flyer) $10 per alert-generated record; $9 per automatic annual record | DMV Information Use Agreement | VA DMV Commercial/Records | [Official]/[Secondary] (fees may be dated) |
| **Washington** | Employer driver-record monitoring authorized by 2012 **SSB 5246** (DOL may contract with "an employer **or its agent**") | https://lawfilesext.leg.wa.gov/Biennium/2011-12/Htm/Bill%20Reports/Senate/5246%20SBA%20TRAN%2011.htm | Employer **or agent** (explicit in statute) | Not found | Set by DOL at cost (no net revenue loss) | DOL contract | WA DOL | [Official] (statute); current program name and terms [Unverified] |
| **Wisconsin** | **Employer Notification Program** (Wis. Stat. ch. 343; Trans 118; forms MV3555/MV3556) | https://docs.legis.wisconsin.gov/document/administrativecode/Trans%20118.06(2)(d) | Employers enroll employees whose job includes driving. No notice is sent at initial enrollment. Withdrawal must be in writing. | Notification document when an enrolled driver's record changes (M/E not confirmed) | Statute: $5 per notification. Admin-code note: $3. The two conflict. | Forms MV3555/MV3556 | WisDOT Bureau of Driver Services | [Official] |
| Kansas | **Not an employer ENS.** KDOR offers driver self-alerts by text or email through Driver's License Status Check / KSVehiclesConnect. Employers can pull CDL records for a fee (K.S.A. 8-2,139). | https://ksrevenue.gov/CMS/content//02-21-2017-Vehicles-Status-Updates.pdf | — | — | — | — | KDOR | [Official] |
| Iowa, Kentucky, North Carolina, New Jersey | AAMVA listed these as **planning or considering** an EPN-type program. Current status not confirmed. | AAMVA ENS rec. v1.0.2 | — | — | — | — | — | [Official] (planning note only) |
| Utah | No ENS found. Since 2020 (HB 183), the DLD may release records to employers monitoring current employees with **written consent**. | https://le.utah.gov/~2020/bills/hbillenr/HB0183.pdf | Employer or agent (for CDL) | — | — | — | Utah DLD | [Official] |
| Others in the FMCSA 18-state chart not identified | The chart lists 18 states; 14 are identified above (AR, CA, ID, IN [post-2018], MI, NE, NY, OR, SC, TX, VA, WA, WI, plus the CO/MN pilots). The remaining entries could not be read because fmcsa.dot.gov was blocked. | — | — | — | — | — | — | [Unverified] |

Vendor statement: Virginia DMV material says Virginia is "one of 19 states offering a direct employer notification service". [Official] (snippet)

## B.3 Implications for BOF (TPA serving many carriers)

1. **Agent participation is explicitly allowed in some states and unclear in others.**
   - Explicitly allowed: CA (only as a DMV-approved **EPN agent**, which BOF would have to apply for), WA (statute says "employer or its agent"), NE (DMV exempt use names "employers or their agents"), UT (agents for CDL verification), TX (DPS-contracted provider).
   - Unclear: NY LENS, IN IDEL, VA Driver Alert and WI appear structured per employer. BOF would likely act as the Administrator/Watcher under each carrier's own account, not as one master account. [Unverified]
2. **Most ENS programs cover only that state's licensees.** IN IDEL covers only Indiana CDLs, and CA needs INF 1102 for out-of-state drivers. A multi-state carrier still needs one program per licensing state. [Official]
3. **The annual §391.25 review still applies.** ENS replaces only the annual inquiry, and only where the state pushes updates. Where a state offers only periodic pull access, an annual MVR pull is still required (FMCSA 2015 guidance). [Official]
4. **There is no national ENS.** Multi-state continuous monitoring has to be built state by state: ENS where it exists, plus scheduled MVR pulls through state portals elsewhere, or a commercial aggregator (SambaSafety excluded per scope). [Official]/[Unverified]

## B.4 Open items to verify (when access to .gov is available)

- Read the full FMCSA May 2018 chart to fill in the remaining states, contacts and fees: `.../405406/jurisdictional-ens-implementation-final_0.pdf`
- Read FMCSA's newer page `https://www.fmcsa.dot.gov/registration/commercial-drivers-license/employee-notification-services-state`, which may be the current state ENS list.
- Confirm current fees for AR, NE, VA, WI and NY.
- Check whether NY LENS and IN IDEL allow a single TPA account across employers.
- Confirm current Tyler portal operators: KS, OK, TN, UT, KY, IA and others.
- Confirm DLC/NRVC membership counts.
