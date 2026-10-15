# Verification Partnership Tracker

Status key: `research` → `ready-for-approval` → `approved` → `sent/submitted` → `in-review` → `active` / `declined` / `stalled`

Sender identity: Sylvester Holmes, Founder | BackOfficeFleet, A Nathson Company, partnerships@nathson.com.
Email integration: **built on a development branch, not connected** (see `docs/email-service/ARCHITECTURE.md`). Until activation, send approved drafts from Outlook as partnerships@nathson.com.

| Wave | Partner / program | Type | Cost | Status | Next action | Owner | Approval needed | Draft | Updated |
|---|---|---|---|---|---|---|---|---|---|
| 0 | Email: partnerships@nathson.com in BOF | Infrastructure | $0 | built-on-branch | Follow activation steps in `docs/email-service/ARCHITECTURE.md` §5; confirm production branch | Sylvester | Yes | — | 2026-10-15 |
| 1 | FMCSA QCMobile API | Gov data API | Free | ready-for-approval | Create a Login.gov account, then request a webKey | Sylvester (MFA) | Yes (account) | none needed | 2026-10-15 |
| 1 | data.transportation.gov (Census/SMS) | Gov open data | Free | ready-for-approval | Get a Socrata app token, then prototype a read-only sync | Sylvester, then agent | Yes (account) | none needed | 2026-10-15 |
| 2 | FMCSA PSP (NIC Federal) | Gov paid records | $25 or $100 per year plus about $10 per record | ready-for-approval | Send the account-model inquiry | Sylvester sends | Yes (send; spend later) | `drafts/01-fmcsa-psp-nic.md` | 2026-10-15 |
| 2 | FMCSA Clearinghouse | Gov portal | Query bundles | ready-for-approval | Send the integration-options inquiry | Sylvester sends | Yes (send) | `drafts/02-fmcsa-clearinghouse.md` | 2026-10-15 |
| 2 | NRCME (med examiner registry) | Gov lookup | Free | research | Confirm whether a bulk or API route exists | Agent | No | — | 2026-10-15 |
| 3 | **Checkr Partner Program** | Vendor partnership | Not verified | ready-for-approval | Review the form answers, then submit the Partner Application | Sylvester submits | Yes (submission) | `drafts/03-checkr-partner-application.md` | 2026-10-15 |
| 3 | SambaSafety | MVR monitoring partner | Not verified | ready-for-approval | Submit the become-a-partner form | Sylvester submits | Yes | `drafts/04-sambasafety-partner.md` | 2026-10-15 |
| 3 | Tenstreet | Integration partner | Not verified | ready-for-approval | Send the inquiry; ask to be routed to partnerships | Sylvester sends | Yes | `drafts/05-tenstreet-integration.md` | 2026-10-15 |
| 4 | California DMV EPN | State program | $5 per driver | ready-for-approval | Send the third-party-role inquiry | Sylvester sends | Yes | `drafts/06-california-dmv-epn.md` | 2026-10-15 |
| 4 | Other state MVR / pull programs | State programs | Varies | research | Map states against the founding fleets' operating states | Agent | No | — | 2026-10-15 |
| — | Foley; Embark / HireRight / Asurint | Alternates | Not verified | research | Hold; use if Checkr or SambaSafety decline | Agent | No | — | 2026-10-15 |

## Log
- 2026-10-15: Capability audit and first research pass (web search only). No outreach sent.
- 2026-10-15: Email integration tested. No connector supports cPanel IMAP, and direct IMAP is blocked by network policy. Strategy and drafts 01–06 prepared. Nothing sent.
