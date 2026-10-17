# AAMVA / CDLIS / S2S / NDR: what BackOfficeFleet (BOF) can lawfully access

Research date: 2026-10-17. Scope: web research only. No one was contacted.

**Method caveat.** Direct page fetches to aamva.org, ecfr.gov, nhtsa.gov, law.cornell.edu, govinfo.gov and the vendor sites all failed (DNS blocked by the proxy). Every fact below comes from **search-result snippets of the named pages**, not from reading them in full. The shared web-search budget also ran out before I could check the DOT CDLIS-Gateway privacy impact assessment and the FMCSA CDLIS fee NPRM in detail. Labels:
- [Official]: a snippet from an aamva.org, nhtsa.gov, fmcsa.dot.gov, eCFR/Cornell CFR/USC or federalregister page.
- [Secondary]: a vendor, press or trade source.
- [Unverified]: my inference, or not confirmed.

---

## 1. CDLIS (Commercial Driver's License Information System)

### What it is
| Item | Finding | Label / source |
|---|---|---|
| Nature | A pointer index. The Central Site holds Master Pointer Records (name, DOB, license number, partial SSN). When a State of Inquiry queries over AAMVAnet, the Central Site "points" it to the **State of Record (SOR)**, which holds the full driver history. | [Official] AAMVA CDLIS page https://www.aamva.org/technology/systems/driver-licensing-systems/cdlis ; [Secondary] CA DMV CDLIS docs |
| Operator | AAMVA runs it for all 50 states and DC. FMCSA oversees it and authorizes users. About 17.3M MPRs as of April 2026. | [Official] AAMVA comments on the FMCSA CDLIS fee NPRM https://www.aamva.org/getmedia/079c4e84-3307-45dc-bfe3-0d4546474d55/AAMVA-Comments-on-FMCSA-CDLIS-Fee-NPRM.pdf |
| Legal basis | 49 USC 31309 (the Secretary maintains the information system; (c) availability per the 31106(e) policy; (d) the Secretary may set fees). Before the 1998 amendment, the statute said the Secretary or operator **may** release data to an employer or prospective employer after notifying the employee. | [Official] govinfo USC 31309 https://www.govinfo.gov/content/pkg/USCODE-2018-title49/html/USCODE-2018-title49-subtitleVI-partB-chap313-sec31309.htm (current employer wording not confirmed: [Unverified]) |
| Regulation | **49 CFR 384.225(e)**: states and the Secretary get all info. **(e)(3)** the driver gets all info on their own record. **(e)(4)** a **motor carrier or prospective motor carrier** gets all info on the CDLIS driver record **after notifying the driver**. The CDLIS State Procedures Manual and SPEXS c.0 (09/11/2023) are incorporated by reference (384.225(f), 384.231(d)). | [Official] https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-384/subpart-B/section-384.225 ; https://www.law.cornell.edu/cfr/text/49/384.225 |
| Employer duty | 49 CFR 391.23(a)(1): within 30 days of hire, inquire of **each State** where the driver held a license or permit in the past 3 years for a 3-year MVR (2022 change). 391.25 requires an annual MVR. For CDL holders, the "CDLIS MVR" defined at 384.105 comes from the current licensing state. **CDLIS itself is not named in 391.23.** | [Official] https://www.law.cornell.edu/cfr/text/49/391.23 ; FMCSA Safety Planner |
| DPPA | 18 USC 2721(b)(9) lets an employer **or its agent** obtain or verify info on a CDL holder. AAMVA's DPPA best-practice guide treats CDL-employee requests as permissible use. Non-CDL employees need proof of the employment relationship plus consent. | [Official] AAMVA *Managing Data Privacy and External Access* https://www.aamva.org/getmedia/1913699b-137c-4249-b6c6-f1f9c3d22d2c/Managing-Data-Privacy-and-External-Access-Best-Practice.pdf |

### The employer product: "CDLIS Third Party Access for CDLIS Employers Verification"
| Item | Finding | Label |
|---|---|---|
| Product | AAMVA "will grant limited CDLIS access to employers and prospective employers via a **third-party inquiry transaction**", returning **basic driver identification data directly from the CDLIS Central Site**. This is pointer-level data: current SOR and the prior licensing states/licenses. It is **not** the driver history, which has to be ordered as an MVR from each SOR. | [Official] AAMVA Private Rate Schedule Oct-2026 https://www.aamva.org/getmedia/032edcc9-8cfe-45e3-88c0-37bc83f4aea2/Products-Services-Catalog-Private-Rate-October-2026.pdf (and the Oct-2025 edition) |
| Fees | FMCSA directed AAMVA to suspend user fees from 10/1/2023, and AAMVA "anticipates" restarting them. The government rate schedule says fees will be reinstated for jurisdictions in **Q4 2027**. The FMCSA CDLIS fee NPRM (FR 2026-09943, docket FMCSA-2025-0099) proposes a state fee of $0.33 per MPR from 8/1/2027, rising to $0.52 from 2/1/2028. Non-state users (motor carriers) keep paying per-transaction fees, which the rule does not set. | [Official] AAMVA rate schedules; [Secondary] PolicyRisk/J.J. Keller summaries of the NPRM https://www.fmcsa.dot.gov/regulations/federal-register-documents/2026-09943 |
| Consent | Vendors say a signed driver consent is required **before or on the same day as** the CDLIS run. AAMVA audits consent forms. Verbal consent requires prior **written AAMVA approval**. Carriers can't reach the "CDLIS-Gateway" directly until they provide the required consent documents. | [Secondary] Cisive/Driver iQ blog https://www.cisive.com/blog/what-is-a-cdlis-report-and-how-can-you-get-one ; https://www.cisive.com/blog/driver-iq-product-series-part-2-cdlis |
| Enrollment / contract | No public enrollment page was found. The rate schedule routes product questions to **CustomerService@aamva.org**. Private entities must sign an **NDA** with AAMVA before getting rate information. A user agreement with AAMVA and AAMVAnet/web-service connectivity is expected. | [Official] for the NDA and email; [Unverified] for the agreement and connectivity details |
| Approved channels | AAMVA publishes no list of approved vendors. Vendors that market CDLIS employer checks include Cisive/Driver iQ, Corra Group, DISA and Active Screening. | [Secondary] |
| Risk | DOT has demanded about 17M CDLIS MPRs. 21–22 states plus DC sued DOT and AAMVA (Aug 2026), and a **TRO** is in place. | [Official] AAMVA news https://www.aamva.org/publications-news/aamva-news/federal-government-request-for-cdlis-master-pointer-records ; [Secondary] CCJ |

## 2. S2S (State-to-State Verification Service) and SPEXS
| Item | Finding | Label |
|---|---|---|
| Purpose | Lets a state check whether an applicant already holds a DL/ID in another participating state ("one driver, one license/record"). Supports REAL ID. S2S DHR exchanges non-CDL out-of-state convictions and withdrawals. | [Official] https://www.aamva.org/technology/systems/driver-licensing-systems/state-to-state-verification-service-(s2s) |
| Platform | SPEXS (State Pointer Exchange Services), live July 2015. It hosts both CDLIS and S2S. The pointer holds name, DOB, DL number and last 5 SSN digits. | [Official] |
| Participants | NJ was 40th (Mar 2024), NY 41st, DC 42nd (Sep 2024), ME 43rd (Dec 2024). Oklahoma joined Feb 2026 and Kentucky June 2026. Nevada is planned for the weekend of Nov 7, 2026. That suggests **about 45 now and about 46 after Nevada**. | [Official] for the individual AAMVA news items; [Unverified] for the running count |
| Access | "Owned and governed by the participating States… they do not allow **any Federal agency** access." The funding law bars new federal access. No private-sector access route was found. The reports portal is for jurisdictional users. | [Official] S2S FAQ https://www.aamva.org/technology/systems/driver-licensing-systems/s2s-frequently-asked-questions |
| CDLIS modernization | No product called "CDLIS Modernization" was found. Current work covers SPEXS 6.5, the CDLIS File Exchange Portal, the SPEXS Duplicate Resolution Tool and the FMCSA fee rule. | [Official] AAMVA conference agendas |

## 3. NDR / PDPS (National Driver Register / Problem Driver Pointer System)
| Item | Finding | Label |
|---|---|---|
| Nature | NHTSA's NDR (within NCSA) maintains PDPS, an index of people whose licenses were revoked, suspended, cancelled or denied, or who were convicted of serious offenses. It holds **no driver history** and points to the SOR. AAMVA operates PDPS under a cooperative agreement with NHTSA, and states use it free. | [Official] https://www.nhtsa.gov/research-data/national-driver-register-ndr ; NDR FAQ (Aug 2020) https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/national_driver_register_faq_081920_v2_tag.pdf ; AAMVA Gov Rate Schedule |
| Who may request | 49 USC 30305(b): states, FMCSA, FAA, FRA/rail employers, NTSB, Coast Guard, federal agencies, and **an individual employed or seeking employment as a motor vehicle driver**. That individual asks the state's chief driver licensing official to send the info to the employer or prospective employer, who must make it available to the individual. There is a **3-year limit** unless a revocation or suspension is still in effect. | [Official] https://www.law.cornell.edu/uscode/text/49/30305 ; https://www.nhtsa.gov/sites/nhtsa.gov/files/ndr.pdf |
| Process | 23 CFR 1327.6/1327.7: requests go **through the chief driver licensing official of a state**. Either the individual requests it, or a signed written consent lets the authorized user request it via the state. | [Official] https://www.ecfr.gov/current/title-23/chapter-III/part-1327/section-1327.7 |
| Third parties | If an authorized user uses a third party to request the check, the individual **and** the user organization's representative must sign a written consent authorizing the third party. The consent must state that the third party **is not authorized to receive** NDR information and must be limited to **one search**. | [Official] 23 CFR 1327.6 https://www.ecfr.gov/current/title-23/chapter-III/part-1327/section-1327.6 |
| Individuals | A Privacy Act self-request goes to NHTSA by notarized letter or declaration, or online via the NDR page. It is free. | [Official] NDR FAQ |
| Cost / batch | NHTSA charges no fee. State fees vary [Unverified]. **No batch or electronic employer channel** was found: it is case by case through the state. | [Unverified] |
| Misuse | Knowingly obtaining NDR info under false pretenses is punishable by a fine and/or up to 1 year in prison. | [Official] |

## 4. AAMVA structure
| Region | Jurisdictions | Label |
|---|---|---|
| I | CT, DE, DC, ME, MD, MA, NH, NJ, NY, PA, RI, VT, plus NB, NL, NS, ON, PE, QC | [Official] Bylaws / Regions map https://www.aamva.org/aamva-regions-and-jurisdictions-map/ |
| II | AL, AR, FL, GA, KY, LA, MS, NC, OK, SC, TN, TX, VA, WV, PR, USVI | [Official] |
| III | IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI, plus MB | [Official] |
| IV | AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY, Guam, Am. Samoa, CNMI, plus AB, BC, SK, NT, NU, YT | [Official] |

- 69 jurisdiction members in total. Staff **Regional Directors**: **Patrice Aasmo** (Regions 1 & 2) and **Julie Knittle** (Regions 3 & 4). [Official] regions map and regional board pages. Elected regional presidents were not captured [Unverified]. Board pages: https://www.aamva.org/about/aamva-leadership/regional-boards-of-directors/aamva-region-1-board-of-directors (and -2, -3, -4).
- Governance: the **Driver Committee** (restructured 2026: 4 regional reps, 4 at-large, 1 legal) oversees subcommittees for **CDLIS**, **National Driver Register**, **State-to-State**, ACD, Card Design Standard, CSTIMS and DTET. Related working groups include CDL Conviction Reporting Resources for SDLAs and Courts (FMCSA-funded), ISA, CDL Driver History Record, Managing Data Privacy and External Access, and Third Party Agents. Committee meetings are Oct 28–29, 2026, in Santa Fe. [Official] https://www.aamva.org/drivers/subcommittees-working-groups
- **Associate membership**: Category 1 $1,200; Category 2 $2,905; local government/law enforcement $825; federal free. Benefits are the members-only directory, event discounts, publications, associate webinars, and exhibit/sponsor rates. **No data-access rights** and no vote (voting is for jurisdictions only). Contact associatemembership@aamva.org, 703-522-4200. The Industry Advisory Board (IAB) is a separate tier, and its fees were not found. [Official] https://www.aamva.org/membership/membership-types-and-benefits/associate-membership

## 5. AAMVA private-sector data programs
| Program | Private eligibility | Returns | Pricing / setup | Label |
|---|---|---|---|---|
| **DLDV** | Commercial and government organizations, **approved by AAMVA**, with an NDA signed before documentation or rates are released. Available directly or through gateway/reseller partners. | **Match/no-match flag per data element.** No jurisdiction data is released. Planned additions are Driving Status, Photo Match and REAL ID indicator. | One-time setup fee plus a per-successful-transaction inquiry fee, "per quote". Revenue is shared with states. | [Official] https://www.aamva.org/technology/systems/verification-systems/dldv ; overview PDF https://www.aamva.org/getmedia/cb603635-3454-4331-b2c6-288d894f7fc4/AAMVA-DLDV-Overview-for-Customers.pdf |
| DLDV coverage | A board summary cites 36 DLDV partners. One vendor (AutoDataDirect) claims 40+ states. The jurisdiction map was not readable. | | | [Official] for the 36 partners; [Secondary] for 40+ states |
| DLDV channels | No official partner list was found. Vendors include Trust Stamp, AutoDataDirect (DMV123), PingOne Verify, Veridas and Trust Swiftly. | | | [Secondary] |
| **mDL Digital Trust Service** | Relying parties, public or private, can download the **VICAL free**. | Only issuer certificates for verifying mDLs. No PII. | Free for relying parties. | [Official] https://www.aamva.org/identity/mobile-driver-license-digital-trust-service/for-relying-parties |
| **CDLIS employer third-party inquiry** | Employers and prospective employers via a third-party inquiry, with driver consent. | Pointer/ID data only. | Fees currently suspended. | [Official] (section 1) |
| **S2S / S2S DHR / SPEXS** | **No**, government only. | | | [Official] |
| **PDPS** | **No direct access.** Employer access goes through a state with consent. | | | [Official] |
| Driver history / MVR from AAMVA | **No AAMVA program sells MVRs or driver histories to private companies.** MVRs stay state by state (state portals or licensed resellers under the DPPA and state law). | | | [Unverified] (no such product appears in the private rate schedule snippets) |
| ELT | AAMVA is "not accepting new ELT clients" (not relevant). | | | [Official] |

## 6. AAMVA contacts (verify before use)
| Purpose | Contact | Label |
|---|---|---|
| HQ | 4401 Wilson Blvd, Suite 700, Arlington VA 22203. Main line **703-522-4200**. Older pages show 4250 Fairfax Dr, Suite 1000. | [Official] staff-contact page https://www.aamva.org/about/staff-contact |
| Products (CDLIS third-party access, DLDV) | **CustomerService@aamva.org** (listed in the rate schedule) | [Official] (verify) |
| Business development / private sector | aamva.org "Contact Us" form, subject "Business with AAMVA" https://www.aamva.org/about/business-with-aamva | [Official] |
| Procurement | via the Procurement page | [Official] |
| Associate membership | associatemembership@aamva.org, 703-522-4200 | [Official] |
| Regional Directors | Patrice Aasmo (R1/R2); Julie Knittle (R3/R4). Phone 703-522-4200. No emails published. | [Official] |
| CDLIS / DLDV program managers | Not named on any page I could reach. Ask CustomerService@ or use the Business with AAMVA form. | [Unverified] |
| NDR (NHTSA) | NHTSA NDR, NCSA, 1200 New Jersey Ave SE, Washington DC 20590 (verify on the NDR page) | [Unverified] |

## 7. Conclusions per program for BOF
Two kinds of access need to be kept apart. **Government-to-government sharing** (CDLIS state-to-state exchange, S2S, SPEXS, PDPS state queries) is defined by statute and state agreements, and **no private party can join it as a member**. **Commercial access** exists only where a statute or regulation names a private user (an employer under 384.225(e)(4), DPPA (b)(9), or 30305(b)(7)) **and** AAMVA or the state has built a product for that user (the CDLIS third-party inquiry, DLDV, state MVR portals).

| Program | (a) Direct | (b) Indirect authorized | (c) Multi-state service-provider | (d) None | Bottom line |
|---|---|---|---|---|---|
| **CDLIS employer third-party inquiry** | **Possible.** The product is described as a "third-party inquiry", and DPPA (b)(9) covers an employer's *agent*. BOF would need AAMVA approval, an NDA and agreement, connectivity, and consent and audit compliance. | **Yes.** Through an established CDLIS reseller (e.g., Driver iQ) for each carrier, with driver consent. | **Likely yes:** one AAMVA account serving many carriers, each carrier/driver consent on file, subject to AAMVA approval and audits. [Unverified] | – | **Best target.** Returns only the SOR and license pointers, and fees are currently $0. Ask AAMVA (CustomerService@) about third-party/service-provider enrollment. |
| **S2S / S2S DHR / SPEXS** | No | No | No | **Yes (gov-to-gov only)** | Not available. |
| **NDR / PDPS** | No | **Yes, one search at a time:** the driver/employer requests through a state DLA, and BOF may *request* as a third party under a dual-signed single-search consent, but **cannot receive** the result (it goes to the carrier). | No | – | Low value for trucking. CDL checks are covered by CDLIS and state MVRs. Use only where required (e.g., rail or aviation). |
| **DLDV** | **Yes**, if AAMVA approves a commercial customer (NDA, setup and per-transaction fees). | Yes, via gateway vendors. | Yes, as a service-provider customer [Unverified]. | – | Identity match/no-match only. Useful for onboarding fraud checks, not for safety records. |
| **mDL DTS (VICAL)** | Yes (free) | – | – | – | Useful only if BOF verifies mDLs. |
| **Driver history / MVR via AAMVA** | No | – | – | **No AAMVA product** | MVRs must come from each state (state commercial portals or DPPA resellers). |
| **AAMVA associate membership** | – | – | – | Gives no data rights | $2,905/yr (business). Buys networking and committee visibility only. |

### Open items (search budget exhausted)
- The DOT privacy impact assessment for the "CDLIS Gateway" (https://www.transportation.gov/individuals/privacy/pia-commercial-drivers-license-information-system-cdlis-gateway) likely lists the authorized employer channels and consent rules. Read it next.
- The full text of FMCSA NPRM 2026-09943 for the third-party fee language.
- Current 49 USC 31309 employer wording, and the CDLIS State Procedures Manual "Employer Inquiry" section (3.9).
- The DLDV participating-jurisdiction map and dollar rates (NDA required).
