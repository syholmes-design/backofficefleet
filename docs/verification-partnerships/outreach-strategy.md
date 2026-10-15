# Partnership Outreach Strategy (draft, 2026-10-15)

Sender: Sylvester Holmes, Founder, BackOfficeFleet (a Nathson company). partnerships@nathson.com.
Nothing below has been sent or submitted. Every contact route marked *verify* came from
web search, not from the official page.

## Principles
1. **Self-service before outreach.** Free government data (QCMobile, data.transportation.gov)
   needs an account, not a partnership. Get those first so BOF can demo live data in every
   vendor conversation.
2. **One clear ask per message.** Partners respond to a specific question ("Can a software
   provider facilitate PSP for its carrier customers?"), not a general "let's partner."
3. **Be accurate about stage.** BOF is pre-scale (founding fleet program, at most 10 fleets).
   Don't claim volumes, customers or certifications BOF doesn't have.
4. **Decide the account-holder model first.** For PSP, the Clearinghouse, state pull programs and
   Checkr, the regulated party is usually the *carrier* (the employer). BOF's likely role is a
   software platform or service agent that the carrier authorizes. Every inquiry asks which
   model the provider supports.
5. **Approval gate.** Each draft becomes `ready-for-approval`. After you approve it, you send it
   from Outlook, and I log the date and the follow-up date.

## Wave 1: free federal data (this week; no email needed)
| Item | Action | Who |
|---|---|---|
| QCMobile API | Create a Login.gov account, then request a webKey ("BackOfficeFleet carrier lookup") | You (MFA) |
| data.transportation.gov | Create a Socrata account and app token | You |
| Engineering | Prototype a carrier lookup and nightly census sync behind a feature flag, read-only, with no production deploy | Agent, after keys exist and the network allowlist is updated |

## Wave 2: federal programs needing clarification (emails 01–02)
| Target | Ask | Route (verify) |
|---|---|---|
| FMCSA PSP / NIC Federal | Which account type fits a software provider serving carriers (motor carrier account vs. an industry service provider arrangement), and the fees | PSP help desk / NICF (enrollment line 877-642-9499; email from psp.fmcsa.dot.gov) |
| FMCSA Drug & Alcohol Clearinghouse | Is there any integration or data-exchange route for software providers, or is it web-portal only (employer / C/TPA roles)? | Clearinghouse contact form or help desk on clearinghouse.fmcsa.dot.gov |

## Wave 3: core vendor partnerships (emails 03–05)
| Target | Why | Route |
|---|---|---|
| **Checkr** (priority) | Embedded MVR, criminal and drug screening via the partner API and OAuth; staging account; about 2-week build | Partner Application form at docs.checkr.com/partners. Email 03 is the form text, ready to paste. |
| **SambaSafety** | Continuous MVR monitoring in all 50 states; has a partner program with API integrations. This fills the "monitoring" gap Checkr doesn't advertise. | sambasafety.com/become-a-partner (form) |
| **Tenstreet** | The dominant driver recruiting/DQF platform; integrating with it means BOF can work alongside carriers who already use Tenstreet | Partner/integrations team (support@tenstreet.com is the public support address; ask to be routed) |

## Wave 4: state driver-record programs (email 06)
- **California EPN:** mandatory for Class A/B employers and electronic-only since 2026-04-01.
  Ask DMV whether a software provider can help carriers enroll and manage notices, or whether
  only the employer may be the requester.
- **Next research:** Which states have employer notification programs, mapped against where the
  founding fleets operate. In most other states, monitoring comes through a vendor (SambaSafety,
  Checkr) rather than directly from the state.

## Other providers to consider (no draft yet)
| Provider | Fit | Note |
|---|---|---|
| Foley | DOT drug testing, DQF, MVR monitoring, Clearinghouse | Overlaps with BOF's own DQF product. Approach as a *service* partner (drug testing/C/TPA), not a platform. |
| Embark Safety, HireRight, Asurint | MVR, background, Tenstreet-integrated | Alternatives if Checkr declines |
| Samsara / Motive marketplaces | ELD/telematics | Not verification, but their marketplaces are where carriers find integrations |

## Follow-up cadence (once sent)
- No reply after **7 business days**: one short follow-up (template `drafts/00-follow-up-template.md`).
- No reply after **14 more days**: mark `stalled` and try an alternate route (form, then phone,
  then a LinkedIn intro).
- Every reply is logged in `outreach-log.md` within one session, and the next action is set in `tracker.md`.
