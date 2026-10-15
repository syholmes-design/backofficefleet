> **Superseded (2026-10-15).** BOF now uses `partnerships@nathson.com` on the existing cPanel mailbox, integrated into BOF's own Neon/Prisma/NextAuth stack. See `docs/email-service/ARCHITECTURE.md`. The connector findings below remain accurate for claude.ai connectors.

# Email Integration: Feasibility & Setup (syholmes@nathson.com)

Tested 2026-10-15 from the cloud agent session. **Email integration is NOT operational.** Nothing
was configured, no credentials were requested or used, and no mail was read or sent.

## A. Feasibility assessment

### What was tested

| Check | Result |
|---|---|
| Installed claude.ai connectors (`ListConnectors`) | **None installed.** |
| Connector registry search: "imap", "email", "outlook", "mail", "smtp" | **No generic IMAP/SMTP connector.** What exists: Microsoft 365, Gmail, Fastmail, Superhuman (Gmail/M365 only), plus sending services (AgentMail, Resend, Bird) that would send from *their* infrastructure rather than this mailbox. |
| DNS lookup of `nathson.com` / `mail.nathson.com` from the container | Fails. The container has no direct DNS; all traffic goes through an HTTPS egress proxy. |
| IMAPS (993) / SMTPS (465) to `mail.nathson.com` via the proxy, with no login attempted | The local proxy accepted the tunnel, but the **egress policy closed it** before the server greeting arrived. Direct IMAP/SMTP from this container is blocked. |

### What each option can do for a cPanel IMAP mailbox

| Option | Works with cPanel IMAP? | Read | Draft | Track / log | Status |
|---|---|---|---|---|---|
| **Microsoft 365 connector** | **No.** It reads Exchange Online through Microsoft Graph with an Entra ID work account. An IMAP account added to the Outlook app isn't visible to Graph. Its listed tools are also search/read only (`outlook_email_search`, `read_resource`). | Only after migrating to M365 | No | Yes | Not usable today |
| **Gmail connector** | **No.** It only works for Gmail or Google Workspace mailboxes. | Only after migrating | Yes (`create_draft`) | Yes | Not usable today |
| **Direct IMAP from this container** | Blocked by network policy. It would also need the mailbox password to be readable by the agent, which conflicts with your rule. | n/a | n/a | n/a | **Not recommended** |
| **Self-hosted IMAP MCP server as a custom connector** | Yes. cPanel has no OAuth, so a mailbox (or app) password must live *on that server*, which you control, never in chat or the repo. | Yes | Yes (save to the IMAP Drafts folder) | Yes | Needs infrastructure you'd run and secure |
| **Manual relay (now)** | Yes | You paste or forward the text into the session | I write drafts to the repo; you send from Outlook | Repo log | **Available now** |

**Bottom line:** No supported connector reaches a Namecheap/cPanel IMAP mailbox. The only
fully supported, OAuth-based routes need the `nathson.com` mailbox to live on **Google
Workspace** (Gmail connector: read, search, create drafts) or **Microsoft 365** (connector:
read and search, no drafts).

## B. Setup instructions

### Option 1: Manual relay (use now; no cost, no infrastructure change)
1. When partnership mail arrives, paste the message text (headers optional) into this session,
   or tell me which thread it continues.
2. I update `outreach-log.md` and `tracker.md` and write a reply draft in `drafts/`.
3. You review it, copy it into Outlook, and send it yourself. Then tell me it was sent, and I log
   the date.

### Option 2 (recommended durable path): Google Workspace + Gmail connector
*This costs money (a Workspace subscription) and changes production mail routing (MX records).
Both are your decisions; I will not do either.*
1. Create a Google Workspace tenant for `nathson.com` and verify the domain (TXT record in
   Namecheap DNS).
2. Migrate the existing mailbox with Google's data migration tool (IMAP from cPanel). Then
   switch the MX records to Google. Plan this for a quiet period, and keep the cPanel mailbox
   until you've confirmed the switch worked.
3. Set SPF, DKIM (generated in the Workspace admin) and DMARC for `nathson.com`.
4. Outlook can stay your mail client, but add the account as Google/IMAP.
5. On claude.ai, go to **Settings → Connectors → Gmail → Connect**, and sign in as
   `syholmes@nathson.com` (OAuth; Claude never sees the password).
6. Enable the connector in this session. I'll then do a **read-only test** (search the inbox for one
   known message) and report the result before claiming it works.
7. Standing rule: I create drafts only. Sending stays with you, or needs your explicit
   approval each time.

### Option 3: Microsoft 365 + Microsoft 365 connector
The steps are the same as Option 2, but with Exchange Online (Business Basic or higher). The
connector needs a claude.ai org owner to add it, and possibly Entra admin consent. Limitation: as
listed, the connector only searches and reads, so drafts would still come through the repo
(Option 1 style).

### Option 4: Keep cPanel; self-hosted IMAP MCP connector
1. In cPanel, create a dedicated mailbox, or reuse this one, with a strong unique password.
2. Deploy an IMAP MCP server (HTTPS, with authentication) on infrastructure you control. Store
   the password there as a secret. Limit it to read plus saving to Drafts, with no SMTP send
   tool.
3. On claude.ai, go to **Settings → Connectors → Add custom connector**, and enter its URL.
4. Before I rely on it, run a read-only test as in Option 2, step 6.

This adds a server to run, patch and secure. Only worth it if you won't migrate.

### Regardless of option: deliverability, before any outreach
- In cPanel, open **Email Deliverability** and confirm SPF and DKIM are valid for `nathson.com`.
  Also add a DMARC record (start with `p=none`). I can't check DNS from this session.
- `nathson.com` is not the brand name partners will recognize. The signature ties Nathson to
  BackOfficeFleet, and `backofficefleet.com` should mention Nathson somewhere, such as the
  footer or About page, so partner compliance teams can verify the link.
