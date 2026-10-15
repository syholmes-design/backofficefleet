# Activation checklist: partnerships@nathson.com

**Who:** **YOU** = needs you (your accounts, your password, your approval). **CLAUDE** = can be
done in a Claude session. Nothing here enables sending.

Confirmed mailbox settings: username `partnerships@nathson.com`; IMAP `nathson.com:993` SSL/TLS;
SMTP `nathson.com:465` SSL/TLS. These are the CLI defaults (press Enter).

## Stage A: Preview sign-off (no real mailbox)

| # | Step | Who |
|---|---|---|
| A1 | Confirm in Vercel which project serves backofficefleet.com and how it is deployed (CLI vs Git). See `PREVIEW.md` §1. | **YOU** |
| A2 | Check what `DATABASE_URL` the `bof-web` **Preview** environment uses today. If it's production, change it. | **YOU** |
| A3 | Create an empty Neon database for the preview. Add branch-scoped Preview variables. Run `migrate deploy` and `seed:email-preview`. Redeploy. (`PREVIEW.md` §2) | **YOU** |
| A4 | Run `npm run verify:email-preview` against the Preview URL, or share a protection-bypass token and allow `*.vercel.app` in this environment's network settings so Claude can run it | **YOU** (or CLAUDE once allowed) |
| A5 | Inspect the Preview yourself: Email → Inbox, Approvals, sign in as Fleet A admin | **YOU** |
| A6 | Approve the design for production | **YOU** |

## Stage B: Production rollout (requires your explicit approval)

| # | Step | Who |
|---|---|---|
| B1 | Decide how this reaches production: merge into the release line and deploy `bof-web` the way it's deployed today (`vercel --prod` from the reviewed commit, or Git if you switch to that) | **YOU** decide; CLAUDE can prepare the merge/PR |
| B2 | In Vercel **Production** env (Sensitive): add `EMAIL_KEK_V1` (new key, also saved in your password manager) and `EMAIL_SYNC_TOKEN`. **Do not** add `EMAIL_SENDING_ENABLED`. | **YOU** |
| B3 | Back up / branch the production Neon DB, then run `npx prisma migrate deploy` (additive: 9 new tables) | **YOU** |
| B4 | Deploy to production | **YOU** |

## Stage C: Connect the mailbox (your terminal; password never in chat)

| # | Step | Who |
|---|---|---|
| C1 | `read -rs DATABASE_URL && export DATABASE_URL`, then `npm run provision:email-mailbox -- --execute`. Enter your BOF login email, then Enter for `nathson.com`, Enter for the Sent folder. Type `PROVISION EMAIL MAILBOX`. | **YOU** |
| C2 | `read -rs EMAIL_KEK_V1 && export EMAIL_KEK_V1` (same key as B2), then `npm run provision:email-mailbox -- --set-credential`. Press Enter for the username. **Type the mailbox password at the hidden prompt.** Type `STORE MAILBOX CREDENTIAL`. | **YOU** |
| C3 | `npm run provision:email-mailbox -- --verify`, typing `VERIFY MAILBOX CONNECTION`. **This is the first contact with the live mailbox**: login only, folder names listed, nothing read or sent. Expect `IMAP: ok` / `SMTP: ok`. Accept the detected Sent folder if offered. | **YOU** |
| C4 | `unset DATABASE_URL EMAIL_KEK_V1` | **YOU** |
| C5 | BOF → Email → **Sync now**. Partner mail appears. | **YOU** |

The password is encrypted on your machine (AES-256-GCM, bound to this mailbox). Only ciphertext
reaches the database; BOF decrypts it in server memory only when connecting.

## Stage D: Automation and Claude

| # | Step | Who |
|---|---|---|
| D1 | Schedule `GET https://<BOF domain>/api/email/sync` with `Authorization: Bearer <EMAIL_SYNC_TOKEN>` every 15 min (cron-job.org free, or Vercel Cron on Pro with `CRON_SECRET`) | **YOU** |
| D2 | `npm run email:agent-grant -- --issue`: token shown once | **YOU** |
| D3 | Add the connector: Claude Code `claude mcp add --transport http bof-email https://<BOF domain>/api/email/agent --header "Authorization: Bearer $TOKEN"`, or claude.ai custom connector with a Request header (if your org has it) | **YOU** |
| D4 | First assisted pass: summarize partner replies, draft responses, link threads to the tracker | **CLAUDE** (drafts only) |

## Stage E: Sending (separate decision, not part of activation)

Both switches are required, and every message still needs your approval of its exact text:
`EMAIL_SENDING_ENABLED=true` in Vercel, plus the mailbox send switch (admin action, audited).
Until then, use **Copy approved text** and send from Outlook.

## Troubleshooting

| Symptom | Action |
|---|---|
| `--verify` TLS/certificate error | Use the hostname cPanel shows under *Connect Devices → Secure SSL/TLS* (re-run C1 with it, then C2–C3) |
| Mailbox shows AUTH_FAILED | Sync stops after 3 failed logins to avoid a cPanel lockout. Check cPanel → Security → cPHulk for a blocked IP, then re-run C3. |
| Changed the mailbox password in cPanel | Re-run C2 and C3 |
| Revoke Claude | `npm run email:agent-grant -- --revoke <grantId>` |
