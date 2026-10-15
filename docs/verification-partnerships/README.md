# BOF Verification Partnerships — Capability Audit & Research (2026-10-15)

Source: cloud agent session. All sources below were found by **web search only**. This
session's network policy blocked direct page fetches to fmcsa.dot.gov, checkr.com,
docs.checkr.com, data.gov and dmv.ca.gov, so nothing here was read from the full page.
**Confirm every fee, form and contact on the official page before acting.**

No external communication was sent, no form was submitted, and no money was spent.

## 1. Capability audit

| # | Capability | Status | What it rests on / what's missing |
|---|---|---|---|
| 1 | Browse FMCSA / Checkr / state sites | **Partial: web search only** | WebSearch works. WebFetch and curl fail (proxy 403 / DNS) on every target host. Fix: allow these domains in the environment's network settings. |
| 2 | Locate & verify official contacts and procedures | **After configuration** | Search can find them, but it can't open the official page to verify. Needs item 1 fixed. |
| 3 | Complete online application forms | **Not available** | There's no browser-automation tool in this session. Most of these forms also need Login.gov, ID.me or MFA tied to a real person. Playwright and Chromium are installed but need network access, and still can't pass identity checks. The right model is: the agent drafts the answers, and a person submits. |
| 4 | Send email from a BOF account | **Not available** | There are no connectors (ListConnectors returned none) and no SMTP credentials. Fix: connect a Gmail or Microsoft 365 connector on claude.ai for a BOF mailbox. Each send would still be held for approval. |
| 5 | Read replies & maintain threads | **Not available** | Same dependency as item 4. |
| 6 | Schedule follow-ups | **Available now (internal only)** | The `send_later` and `create_trigger` scheduled tasks can wake an agent session on a date. They can't send anything externally until item 4 is set up. |
| 7 | Persistent partnership tracker | **Available now** | It's `tracker.md`, kept in git on this branch. A shared web tracker (an Artifact with a database) is also possible if you want one. |
| 8 | Concurrent specialized research agents | **Available now** | The Agent tool exists, and so do cloud `create_session` sessions. They are limited by the same network policy. |
| 9 | Keep running after your computer is off | **Available now** | This is a cloud container, and scheduled tasks fire on the server. The container itself is temporary, so state has to live in git or an Artifact. |
| 10 | Resume automatically when a vendor replies | **After configuration** | It needs a mail connector (item 4) plus a scheduled task that checks the inbox, for example daily. There's no push-on-email trigger, so it's polling. |

## 2. Research — FMCSA free data programs (priority 1)

| Program | Cost | Access | What BOF gets |
|---|---|---|---|
| **QCMobile API** (mobile.fmcsa.dot.gov/QCDevsite) | Free | A Login.gov account, then *My WebKeys*, then request a key (asks for an app name). The key goes in the `webKey` query param. | JSON carrier lookup by name, DOT number or docket number. Also `/carriers/{dot}/basics`, `/oos`, `/docket-numbers`, and authority / insurance (L&I). Multi-carrier results are capped at 50, paged with `start`. There's no published rate limit. |
| **Company Census File + SMS data** (data.transportation.gov, Socrata; census dataset `4a2k-zf79`) | Free | Open download or SODA API. An app token is optional and raises rate limits. | Bulk carrier census (updated daily, 24 hours behind) and monthly SMS inspection, crash and census files. Good for nightly sync and bulk lookups. |
| **PSP — Pre-Employment Screening** (psp.fmcsa.dot.gov, run by NIC Federal) | $25/yr (≤99 power units) or $100/yr (≥100), plus about $10 per record | Monthly Account Holder enrollment. NICF enrollment and billing line: 877-642-9499. | 5 years of crash history and 3 years of inspection history per driver. Needs the driver's written consent and is for pre-employment use only. **Paid, so it needs your approval.** |
| **Drug & Alcohol Clearinghouse** | Query plans are sold in bundles (fee not verified) | Employer or C/TPA web account. **No public API was found.** | Full queries (electronic consent) and limited queries (written consent) give prohibited / not prohibited status. Since Clearinghouse-II (compliance date 2024-11-18), state licensing agencies must downgrade the CDL of a prohibited driver within 60 days. |
| **National Registry of Certified Medical Examiners** | Free | Public lookup at nationalregistry.fmcsa.dot.gov. **No API was found.** Contact: FMCSAMedical@dot.gov. | Confirms the examiner on a med card is certified. |
| **FMCSA newsroom RSS** | Free | This is already used in `bof-web/lib/regulatory-feed/sources/fmcsa.ts`. | Regulatory news feed. |

**Recommended first step (free, low risk):** Get a QCMobile webKey and a Socrata app token.
Both need a person to sign in (Login.gov MFA), and both are free.

## 3. Research — Checkr platform partnership (priority 2)

- **Entry point:** docs.checkr.com/partners has a "Checkr Partner Application" form that goes
  to Checkr's Business Development team. There's no partner email address I could verify.
- **After acceptance:** Partners get a Staging account and a Production account, plus OAuth
  (Checkr Connect). The typical build is about 2 weeks. Checkr does a certification review
  before production (see the "Partner Certification Requirements" PDF on docs.checkr.com).
- **Relevant products:** MVR (DOT/FMCSA packages), criminal checks, drug and health
  screening, and webhooks. Drug and health screening goes through the **Invitation API**, not
  the Reports API. Checkr's pages don't say whether Checkr runs FMCSA Clearinghouse queries,
  so ask during intake.
- **Caveat:** An older developer-forum post said Checkr steered new integrators toward
  existing network partners. Treat acceptance as uncertain.
- **Application inputs to prepare:** Company entity and EIN, product description (BOF fleet
  back office and DQF), expected monthly check volume, customer segment (small for-hire
  carriers), whether BOF or the carrier is the Checkr account holder, and FCRA permissible
  purpose handling.

## 4. Research — State licensing (priority 3, started)

- **California EPN (Employer Pull Notice):** This is mandatory for employers of Class A/B
  drivers (Veh. Code §1808.1). Under 13 CCR §350.47 it is **electronic-only from 2026-04-01**,
  through the DMV online requester portal. The fee is $5 per enrolled driver (INF 1100). The
  INF 1107 requirements include confidentiality acknowledgments and reporting misuse within one
  business day. EPN is per-employer, so BOF would likely support the carrier's enrollment
  rather than enroll itself.
- **CDLIS (AAMVA):** No employer or third-party access route was found. CDL status for
  employers in practice comes through MVRs (state or vendor) and the Clearinghouse.
- **Next:** List the other states with employer pull programs, and the commercial MVR
  access process in the states where BOF's customers are.
