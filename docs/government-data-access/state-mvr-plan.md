# State MVR access and monitoring plan: Ohio, Michigan, Georgia, Missouri

Research date 2026-10-17, from web search only. The cloud environment could not open any of the four
states' sites, so the facts below come from search extracts of official pages and forms, plus a
few vendor summaries. **Everything marked "verify" must be confirmed with the agency before BOF
relies on it.** Nothing has been sent, applied for or paid.

## 1. Summary

| | Ohio (BMV) | Michigan (SOS) | Georgia (DDS) | Missouri (DOR) |
|---|---|---|---|---|
| Business program | BMV record account (MOU/contract), BMV 1173 | Record Sales: Direct Access, Subscription, Lookup | Bulk MVR program (DDS-1250 + GTA agreement), >50 MVRs/yr | DPPA Security Access Code (Form 4678) + MyDMV "Online Record Request" |
| Can BOF enroll as a third party for carriers? | Likely, under a DPPA purpose (**verify** the agent model and whether accounts are per carrier) | Yes in practice; aggregators use it (**verify**) | **Yes, as a "Bulk Requestor"** serving certified "Bulk User" clients (each carrier signs a Bulk User Certificate) | Yes. Form 4678 allows redisclosure to DPPA-authorized recipients with a 5-year log |
| Access method | Online portal or mail; no published API or batch (**verify**) | Direct Access online; no published API (**verify**) | Web portal; **batch web service for certified partners** (spec: ask) | MyDMV, one record at a time; no batch found (**verify**) |
| Fee per record | **$5** (RC 4509.05) | **$15** ($16 certified, MCL 257.208b) | **$7** 3-year / **$9** 7-year (from 2026-07-01; **verify** bulk rate) | **~$2.82** + card fee (**verify**; older forms say $5.88) |
| Setup / bond | None published (**verify**) | Possible **$25,000 surety bond** + use agreement (vendor source; **verify**) | **$100** GTA setup | None found (**verify**) |
| Consent | Notarized BMV 5008 for consent-based requests; otherwise state the DPPA exception | Certify permissible use; consent optional under DPPA (b)(9) | Written authorization for employment pulls | Express consent or DPPA exemption |
| Retention / audit | DPPA 5 years; periodic re-documentation letters | ≥5 years, SOS may inspect (MCL 257.208d) | 4 years, auditable | 5-year recipient log; report non-compliance within 3 days |
| **State continuous monitoring** | **None found** | **Yes: Subscription Service** (annual record + new record when a violation, restriction, suspension or revocation posts) | **None found** | **None official** (vendors offer MO monitoring; source unclear) |
| Medical certificate | Self-cert BMV 2159; status posted to CDLIS | National Registry electronic only; CDL downgraded if lapsed | Electronic from National Registry since 2025-06-18 | On CDL record (**verify**) |
| Contact | BMVRecords@dps.ohio.gov, (614) 752-7548 (**verify**) | Record Lookup Unit, 7064 Crowner Dr, Lansing MI 48918, (517) 322-1624 (**verify**) | mvr@dds.ga.gov; Attn Bulk MVR, PO Box 80447, Conyers GA 30013 | dlrecords@dor.mo.gov, 573-526-2407 |
| Special risk | — | Bond cost; mailed subscription records? | **GA rule 375-3-8 may require a private detective licence** for third-party requesters (legal review) | Bulk policy conflict (Form 5153 vs "no code for bulk") |

## 2. Legal frame common to all four states

- **DPPA (18 U.S.C. 2721).** For BOF, the relevant permitted uses are:
  - **(b)(9):** verifying a CDL holder's information, as 49 U.S.C. ch. 313 requires;
  - **(b)(2):** motor vehicle and driver safety;
  - **(b)(3):** verifying information the individual provided to a business;
  - **(b)(13):** written consent.
  
  Resale or redisclosure is allowed only for permitted uses. The reseller must keep, **for 5 years**, a record of every recipient and their purpose (2721(c)). Each state adds its own statute: OH RC 4501.27; MI MCL 257.208c/d; GA O.C.G.A. 40-5-2 and rule 375-3-8; MO RSMo 32.091 and 302.170.
- **FMCSA rules.** Carriers must get an MVR from **every state where the driver held a licence in the past 3 years** at hire (49 CFR 391.23), and **at least annually** (391.25). A driver can have a licence history from any state, so four states never cover everything (see §4).
- **FCRA.** If BOF supplies MVRs to carriers for employment decisions, BOF may be a **consumer reporting agency**. That brings FCRA duties: certification from each user, disclosure and authorization forms, adverse-action support and accuracy procedures. **Get legal review before the first state application.**

## 3. Recommended approach per state

1. **Michigan first for monitoring.** It is the only one of the four with a state-run change notification. Ask whether subscriptions can be delivered electronically, and confirm the bond and use agreement.
2. **Georgia next for volume.** The Bulk Requestor model fits BOF's multi-carrier structure exactly, and there is a batch web service. Resolve the private-detective licence question first.
3. **Ohio and Missouri:** use the business accounts for hire and annual pulls. BOF schedules re-pulls; there is no state monitoring.
4. **Every state:** ask whether an employer notification program or a vendor data feed exists. Vendors claim daily Missouri monitoring, so some feed may exist.

Suggested letters (drafted on approval only, not yet written): one per state records unit,
asking:
- eligibility of a service provider acting for multiple carriers;
- per-carrier paperwork;
- electronic or batch access and its technical spec;
- fees, bond and audit terms;
- monitoring options.

## 4. Multi-state reality and what needs a licensed provider

- **Direct state access scales one state at a time.** Each state has its own application, fees, audits and formats. Four states cover the founding fleets' base states, but not drivers licensed elsewhere in the past 3 years.
- **Continuous monitoring across all states:** only Michigan offers it among these four. A nationwide product needs either:
  - state-by-state subscriptions where they exist; or
  - periodic re-pulls in every state; or
  - a licensed aggregator.
- **Recommendation:**
  - Build BOF's own MVR ingestion, normalization, scoring and monitoring engine now (it is source-agnostic).
  - Connect states directly where volume justifies it (MI, GA, OH, MO).
  - Use Checkr (phase 3) as the fallback for drivers with out-of-state history and for criminal checks.
  - SambaSafety stays out of scope.

## 5. Medical certification

Since June 2025, certified medical examiners send medical certificates **electronically through
the FMCSA National Registry to the state**, and the status then appears on the CDL driving record.
So the state MVR (or a re-pull) is the authoritative check of medical status. BOF can verify the
examiner's certification in the National Registry and track expiry dates itself.

## Sources
Ohio: [BMV record types](https://bmv.ohio.gov/more-record-types.aspx), [BMV 1173](https://dam.assets.ohio.gov/image/upload/publicsafety.ohio.gov/bmv1173.pdf), [OAC 4501:1-12-02](https://codes.ohio.gov/ohio-administrative-code/rule-4501:1-12-02), [RC 4509.05](https://codes.ohio.gov/ohio-revised-code/section-4509.05), [BMV 2159](https://dam.assets.ohio.gov/image/upload/publicsafety.ohio.gov/bmv2159.pdf).
Michigan: [SOS businesses](https://michigan.gov/sos/resources/communities/businesses), [MCL 257.208b](https://zeus-milenia.legislature.mi.gov/documents/mcl/pdf/MCL-257-208B.pdf), [MCL 257.208d](https://ombudsman.legislature.mi.gov/documents/mcl/pdf/MCL-257-208D.pdf), [CDL medical certification FAQ](https://www.michigan.gov/sos/faqs/industry-services/cdl-medical-certification), [bond (vendor)](https://www.suretybonds.com/states/michigan/information-purchaser-bond).
Georgia: [Getting authorized](https://onlinemvr.dds.ga.gov/mvr/gettingauth.aspx), [Bulk checklist](https://onlinemvr.dds.ga.gov/mvr/BulkMVRAppChklist.aspx), [GTA Bulk Requestor agreement](https://onlinemvr.dds.ga.gov/mvr/pdf/gta%20mvr%20bulk%20requestor%20agreement.pdf), [Rule 375-3-8](https://rules.sos.ga.gov/gac/375-3-8), [Fees](https://dds.georgia.gov/node/25386), [Medical certificates](https://dds.georgia.gov/node/12581).
Missouri: [Driver records](https://dor.mo.gov/driver-license/resources/records.html), [Form 4678](https://dor.mo.gov/forms/4678.pdf), [Online record requests](https://dor.mo.gov/forms/Online_Record_Requests.pdf), [DPPA](https://dor.mo.gov/media/driver-privacy-protection-act.html).
Federal: [FMCSA employer notification best practices (2018)](https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/docs/registration/commercial-drivers-license/415871/employer-notification-services-best-practices-and-recommendations-august-2018.pdf).
