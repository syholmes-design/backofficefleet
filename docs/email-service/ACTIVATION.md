# Activating partnerships@nathson.com in BOF

This is the operator runbook. Every step here is run **by you**, in **your own terminal** or the
Vercel dashboard. Nothing in it is done by Claude. Outbound sending stays **disabled** throughout.

Confirmed mailbox settings (cPanel, 2026-10-15):

| | Value |
|---|---|
| Username | `partnerships@nathson.com` |
| IMAP | `nathson.com`, port 993, SSL/TLS |
| SMTP | `nathson.com`, port 465, SSL/TLS |
| Password | Only you have it. It is typed into a hidden terminal prompt and never stored in plaintext. |

These are the defaults built into `npm run provision:email-mailbox`. Press Enter to accept them.

---

## 0. Before you start

1. **Confirm the production branch** Vercel deploys for backofficefleet.com. This work is on
   `claude/loving-allen-zr8loh`, based on `release/document-control-batch2-control-plane`.
   Review and merge it into the production line through your normal process.
2. Use a machine you trust, with a checkout of the merged code and `npm ci` already run.
3. Have your **BOF login email** ready. That account becomes the mailbox approver.

## 1. Create the server secrets (Vercel → Project → Settings → Environment Variables)

Generate each value locally. Don't paste these into chats, tickets or the repo.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"     # EMAIL_KEK_V1
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # EMAIL_SYNC_TOKEN
```

| Variable | Environment | Value |
|---|---|---|
| `EMAIL_KEK_V1` | Production (mark **Sensitive**) | the 32-byte key above. **Also save it in your password manager**: the CLI in step 4 needs the *same* key. |
| `EMAIL_SYNC_TOKEN` | Production (Sensitive) | the random token above |
| `EMAIL_SENDING_ENABLED` | **do not create** | absent = sending disabled |

`DATABASE_URL` and `AUTH_SECRET` already exist. Redeploy so the new variables take effect.

## 2. Apply the database migration

This is additive: 9 new `Email*` tables. No existing table changes.

```bash
read -rs DATABASE_URL && export DATABASE_URL     # paste the production URL; not echoed, not in history
npx prisma migrate deploy                        # applies 20261015200000_email_service_foundation
```

## 3. Create the mailbox record (no password involved)

```bash
npm run provision:email-mailbox -- --dry-run     # shows the plan, writes nothing
npm run provision:email-mailbox -- --execute     # type: PROVISION EMAIL MAILBOX
```

Answer the prompts: your BOF login email, then Enter for `nathson.com`, then Enter for the Sent folder.
The result is a PLATFORM mailbox with status `PENDING_CREDENTIALS` and sending off. You are the
only approver.

## 4. Enter the mailbox password securely

```bash
read -rs EMAIL_KEK_V1 && export EMAIL_KEK_V1     # paste the SAME key you put in Vercel
npm run provision:email-mailbox -- --set-credential
```

- Press Enter to accept the username `partnerships@nathson.com`.
- Type the mailbox password at the **hidden** prompt. It's not echoed, not saved to shell history,
  not logged, and it can't be piped in.
- Type `STORE MAILBOX CREDENTIAL`.

The password is encrypted on your machine (AES-256-GCM, bound to this mailbox). Only the
ciphertext is written to the database. BOF decrypts it in server memory only when it connects.

## 5. Test the connection (first contact with the live mailbox)

```bash
npm run provision:email-mailbox -- --verify      # type: VERIFY MAILBOX CONNECTION
```

This logs in to IMAP and SMTP and lists folder **names** only. It reads no messages and sends
nothing. Expected output:

```
IMAP: ok
SMTP: ok
Folders on server: INBOX, INBOX.Sent, INBOX.Drafts, ...
Mailbox ACTIVE (sync allowed; sending still disabled).
```

If the server's Sent folder has a different name, the tool offers to use it. Answer `y`.

Then clear the secrets from that shell: `unset DATABASE_URL EMAIL_KEK_V1`.

## 6. First sync and inbox

Sign in to BOF → **Email** → **Sync now**. Partnership mail appears within seconds.
Each run fetches at most 50 new messages per folder; press Sync again or let the schedule continue.

## 7. Scheduled synchronization (every 15 minutes)

Pick one:

- **External scheduler (free, any Vercel plan).** For example, cron-job.org:
  `GET https://<your BOF domain>/api/email/sync` with header
  `Authorization: Bearer <EMAIL_SYNC_TOKEN>`, every 15 minutes.
- **Vercel Cron (Pro plan; Hobby allows only daily).** Add to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/email/sync", "schedule": "*/15 * * * *" }] }
  ```
  Set `CRON_SECRET` in Vercel. The endpoint accepts it automatically.

The token can only trigger a sync. It can't read mail or reach credentials.

## 8. Connect Claude (restricted)

```bash
npm run email:agent-grant -- --issue     # your BOF email; days (default 30, max 90); type: ISSUE AGENT TOKEN
```

The token is printed **once**. Store it only in the connector configuration.

- **Claude Code:**
  ```bash
  read -rs BOF_EMAIL_AGENT_TOKEN && export BOF_EMAIL_AGENT_TOKEN
  claude mcp add --transport http bof-email https://<your BOF domain>/api/email/agent \
    --header "Authorization: Bearer $BOF_EMAIL_AGENT_TOKEN"
  ```
- **claude.ai:** Settings → Connectors → Add custom connector → URL
  `https://<your BOF domain>/api/email/agent`. Under **Request headers**, add
  `Authorization: Bearer <token>`. That section only appears for organizations that have it. If
  you don't see it, use Claude Code or Claude Desktop for now.

Claude then has six tools: `list_partners`, `search_messages`, `get_thread`, `create_draft`,
`request_approval` and `link_thread_to_partner`. It can't send, approve, change settings, or see
credentials. Every read and draft is recorded in BOF's audit log.

Manage access: `npm run email:agent-grant -- --list` and `-- --revoke <grantId>`. Revoking takes effect immediately.

## 9. Day-to-day flow

1. Mail syncs into **Email → Inbox**, threaded, searchable, and tagged by partner.
2. You or Claude write a reply. It's saved as a **draft**, never sent.
3. Drafts go to **Approvals**. You review the exact final text and **Approve** or **Reject**. Any
   later edit cancels the approval.
4. While sending is disabled, use **Copy approved text**, paste it into Outlook, and send from
   partnerships@nathson.com.

## 10. Enabling sending later (separate authorization)

Do this only when you decide to. Both switches are required:

1. Vercel: set `EMAIL_SENDING_ENABLED=true` and redeploy.
2. Set the mailbox send switch, `EmailMailbox.sendEnabled = true` for partnerships@nathson.com.
   There's no UI toggle yet; it's an admin action and is audited.

Even then, every message still needs your approval of its exact text, an unexpired approval
(72 hours), and recipients in the partner domain allowlist.

## Maintenance

| Task | How |
|---|---|
| Change the mailbox password | Change it in cPanel, then repeat steps 4 and 5 |
| Mailbox shows AUTH_FAILED | Sync stops after 3 failed logins, to avoid a cPanel lockout. Check cPanel → Security → cPHulk for a blocked IP, then repeat step 5. |
| TLS/certificate error on `nathson.com` | Use the server hostname cPanel shows under *Connect Devices → Secure SSL/TLS Settings*: re-run step 3 with that host, then steps 4 and 5 |
| Rotate the sync token | Replace `EMAIL_SYNC_TOKEN` in Vercel and in the scheduler |
| Revoke Claude | `npm run email:agent-grant -- --revoke <grantId>` |
