# Access strategy: individual, interstate, or hybrid (2026-10-17)

Built on [`state-mvr-matrix-50.md`](state-mvr-matrix-50.md) and [`interstate-access-report.md`](interstate-access-report.md). SambaSafety is excluded from every option.

## 1. The three approaches

| Criterion | **A. Individual state agreements (all 51)** | **B. Regional / interstate arrangements** | **C. Hybrid: direct where it pays, a licensed intermediary for the rest** |
|---|---|---|---|
| **Does it exist?** | Yes | **Only partly.** No regional or interstate program delivers MVRs or alerts from multiple states. The only multi-state channels are AAMVA CDLIS (licence pointer), FMCSA PSP (federal crash and inspection data) and AAMVA DLDV (identity match) | Yes |
| **Geographic coverage** | Full in principle, but OK, PA, HI, NV, NH, SD and WY restrict or slow third-party access | National for those three checks; **zero** for MVRs and alerts | Full: direct in priority states, intermediary elsewhere |
| **Eligibility** | 7 states have official text supporting a provider/agent model; about 12 more are likely; others are unclear or restricted | CDLIS third-party: product exists, service-provider eligibility unconfirmed; PSP: ISP role exists; DLDV: commercial customers allowed | Direct where eligibility is confirmed; intermediary covers the rest without BOF needing its own eligibility |
| **Integration complexity** | Very high: ~51 contracts, formats, audits and consent regimes; mostly portals, with few APIs | Low (three national integrations) | Medium: ~8–12 state adapters plus one intermediary adapter, all writing to BOF's own source-neutral driver record |
| **Fixed cost** | Very high (see §3) | Low | Moderate, scaling with the number of direct states |
| **Variable cost** | Lowest per record (state fee only); monitoring is costly where states have no program (re-pulls) | n/a for MVRs | Low in direct states; intermediary price elsewhere |
| **Control of infrastructure** | Full | Full for those three checks | **Full:** BOF keeps one data model, its rules engine, consent ledger and alerts; the intermediary is just another source adapter and can be swapped out |
| **Verdict** | Not viable before large scale | Necessary but not sufficient | **Recommended** |

## 2. Recommended sequence of authorizations

Each step needs your authorization. Steps 0–1 cost little or nothing.

0. **Legal gate first:** FCRA/consumer reporting agency status, DPPA agent basis, and the consent package (`legal-review-questions.md` §A–C, I). Every driver-data step depends on it.
1. **National channels:**
   - QCMobile and open data (built).
   - **AAMVA CDLIS employer verification:** letter A1. Fees are currently suspended, and it tells BOF *which states* each driver needs an MVR from.
   - **PSP ISP:** F3.
   - DLDV is optional, for identity checks.
2. **Founding fleets' states:** MI (state monitoring), GA (Bulk Requestor), OH, MO. Drafts S1–S4 are ready.
3. **Large states where official text supports the provider model:** TX (Transp. Code 730.013), CA (EPN agent + Service Provider account), FL (data-exchange MOU), NJ (CAIR, resale declared), MN (form names "employer or its agent").
4. **Cheap state monitoring feeds that fit BOF's monitoring pipeline:**
   - NE ($0.06/driver/mo; names "employers or their agents")
   - WA ($0.06/record; statute names agents)
   - MD (REST API)
   - IN (IDEL)
   - ID (Dashboard)
   - WI (free ENS)
   - UT and NY LENS (confirm whether agents may enrol)
5. **Everything else:** use a licensed intermediary (Checkr, phase D, already planned) for out-of-state history and for monitoring in states without a program. Move a state to direct when its volume passes break-even (§3).

Order within steps 3–4 should follow **where the carriers' drivers are actually licensed**. Once identities are loaded, CDLIS checks will show this. BOF's monitoring data can rank states by driver count.

## 3. Cost comparison (illustrative)

**Inputs.** Only the state fees come from research (median about $10 per record in the matrix). **Every other number is an assumption to replace with quotes. No quotes have been requested.**

| Assumption | Value (low / mid / high) | Source |
|---|---|---|
| State MVR fee (average) | $10 | Matrix (range $2–$25) |
| MVRs per driver per year | 1 annual + hires (30% turnover × 1.5 states) = 1.45 | 49 CFR 391.23/391.25; turnover assumed |
| Intermediary markup per MVR, over the state fee | $3 / **$6** / $8 | **Assumption** |
| Intermediary continuous monitoring | $1.50 / **$2.25** / $3.00 per driver per month | **Assumption** |
| State monitoring, where offered | ~$0.15 per driver per month + a triggered MVR for 10% of drivers a year | Matrix (NE $0.06, IN $0.12, ID $0.32) |
| Hybrid coverage | 70% of MVRs and 50% of drivers in direct states with monitoring | **Assumption** |
| Fixed cost, direct (10 states) | $2,100/state/yr (subscription + audit and compliance time) + $15,000/yr compliance program + $500 bond premium = **$36,500/yr** | **Assumption** |
| One-time integration | ~$5k–$15k engineering per state adapter ($50k–$150k for 10) | **Assumption**, internal |

**Annual cost, mid case:**

| Drivers monitored | Intermediary only | Hybrid (C) | Difference |
|---|---|---|---|
| 1,000 | $50,200 | $68,500 | **−$18,300** (hybrid costs more) |
| 2,000 | $100,400 | $100,500 | break-even |
| 5,000 | $251,000 | $196,600 | **+$54,500 (22%)** |
| 10,000 | $502,000 | $356,600 | **+$145,400 (29%)** |
| 25,000 | $1,255,000 | $836,800 | **+$418,300 (33%)** |

- **Break-even:** about **2,000 drivers** (mid), 1,500 (high markup case) and 3,450 (low markup case).
- **Approach A at 10,000 drivers:** about $482,000/yr. That barely beats the intermediary because states without monitoring programs need repeated re-pulls. It also carries ~51 integrations.

What this means:
- **Most of the saving is in monitoring, not MVRs:** state monitoring at $0.06–$0.32 per driver per month versus an assumed $1.50–$3.00.
- **The fixed compliance cost dominates** below a few thousand drivers. A legal finding that BOF is a consumer reporting agency would raise it.
- **Two national checks are cheaper direct at any scale:**
  - CDLIS employer verification: fees currently $0.
  - PSP: $10, versus any reseller markup.

## 4. Decisions for you
1. Approve sending A1 (AAMVA), and S1–S4 / F-series as previously drafted.
2. Engage counsel on the questions gating step 0.
3. Approve requesting **non-binding price quotes** from 1–2 licensed intermediaries (Checkr plus one alternate) so §3 can use real numbers. This is outreach, so it needs your approval.
4. Decide whether to join AAMVA as an associate member ($2,905/yr). It is optional and gives no data rights.
