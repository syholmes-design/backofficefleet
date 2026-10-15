import { createHash } from "node:crypto";

import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import nodemailer from "nodemailer";

import type { MailboxSecret } from "./credentials";
import { stripMessageId } from "./threading";
import type { FetchBatch, FetchedMessage, InboundSource, OutboundTransport, OutgoingEmail, SendResult } from "./transport";
import type { MailboxConnection } from "./types";

/**
 * Real cPanel/IMAP/SMTP adapters (imapflow + nodemailer + mailparser).
 * Credentials are resolved per call through `secretFor` (credentials.ts →
 * envelope-decrypted in memory) and never logged or returned.
 *
 * Not exercised against the live mailbox: connecting requires owner authorization.
 */

export type SecretProvider = (mailbox: MailboxConnection) => Promise<MailboxSecret>;

const MAX_BODY_CHARS = 200_000;
const TIMEOUTS = { connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 30_000 };

function addresses(obj: AddressObject | AddressObject[] | undefined): string[] {
  const list = Array.isArray(obj) ? obj : obj ? [obj] : [];
  return list.flatMap((o) => o.value.map((v) => (v.address ?? "").trim().toLowerCase())).filter(Boolean);
}

/** RFC 5322 source → normalized message. Pure; unit-tested without a server. */
export async function parseRawMessage(
  source: Buffer,
  folder: string,
  imapUid: number,
  mailboxAddress: string,
): Promise<FetchedMessage> {
  const parsed = await simpleParser(source, { skipImageLinks: true, skipTextToHtml: true });
  const from = addresses(parsed.from)[0] ?? "";
  const refs = parsed.references ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) : [];
  const messageId = parsed.messageId
    ? stripMessageId(parsed.messageId)
    : `bof-synthetic-${createHash("sha256").update(source).digest("hex").slice(0, 32)}`;
  return {
    direction: from === mailboxAddress.toLowerCase() ? "OUTBOUND" : "INBOUND",
    folder,
    imapUid,
    messageIdHeader: messageId,
    inReplyTo: parsed.inReplyTo ? stripMessageId(parsed.inReplyTo) : null,
    references: refs.map(stripMessageId).filter(Boolean),
    fromAddress: from,
    fromName: parsed.from?.value[0]?.name || null,
    toAddresses: addresses(parsed.to),
    ccAddresses: addresses(parsed.cc),
    subject: parsed.subject ?? "(no subject)",
    // mailparser derives text from HTML when no text part exists; raw HTML is not kept.
    textBody: (parsed.text ?? "").slice(0, MAX_BODY_CHARS),
    receivedAt: parsed.date ?? new Date(),
  };
}

function imapClient(mailbox: MailboxConnection, secret: MailboxSecret): ImapFlow {
  if (!mailbox.imapHost) throw new Error("Mailbox has no IMAP host configured");
  return new ImapFlow({
    host: mailbox.imapHost,
    port: mailbox.imapPort ?? 993,
    secure: (mailbox.imapPort ?? 993) === 993,
    auth: { user: secret.username, pass: secret.password },
    logger: false,
    disableAutoIdle: true,
    ...TIMEOUTS,
  });
}

export class ImapInboundSource implements InboundSource {
  readonly kind = "imap";
  constructor(private readonly secretFor: SecretProvider) {}

  async fetchSince(mailbox: MailboxConnection, folder: string, sinceUid: number, limit: number): Promise<FetchBatch> {
    const client = imapClient(mailbox, await this.secretFor(mailbox));
    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder, { readOnly: true });
      try {
        const uidValidity = client.mailbox ? Number(client.mailbox.uidValidity) : 0;
        // "N:*" always matches the newest message, so filter strictly above the cursor.
        const found = (await client.search({ uid: `${sinceUid + 1}:*` }, { uid: true })) || [];
        const pending = found.filter((u) => u > sinceUid).sort((a, b) => a - b);
        const take = pending.slice(0, limit);
        const messages: FetchedMessage[] = [];
        if (take.length > 0) {
          for await (const m of client.fetch(take.join(","), { uid: true, source: true }, { uid: true })) {
            if (m.source) messages.push(await parseRawMessage(m.source, folder, m.uid, mailbox.address));
          }
        }
        return {
          messages,
          uidValidity,
          lastUid: take.length > 0 ? take[take.length - 1] : sinceUid,
          hasMore: pending.length > take.length,
        };
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => client.close());
    }
  }
}

export interface SmtpTransportOptions {
  /** IMAP folder to store a copy of sent mail (cPanel does not do this for SMTP). */
  sentFolder?: string | null;
  /** Tests only: plain-text SMTP to a local test server. Never set in production. */
  allowInsecureForTests?: boolean;
}

export class SmtpOutboundTransport implements OutboundTransport {
  readonly kind = "smtp";
  constructor(
    private readonly secretFor: SecretProvider,
    private readonly opts: SmtpTransportOptions = { sentFolder: "Sent" },
  ) {}

  async send(mailbox: MailboxConnection, email: OutgoingEmail): Promise<SendResult> {
    if (!mailbox.smtpHost) throw new Error("Mailbox has no SMTP host configured");
    const secret = await this.secretFor(mailbox);
    const port = mailbox.smtpPort ?? 465;

    // Build the exact RFC 5322 message once, so SMTP and the Sent copy are identical.
    const built = await nodemailer.createTransport({ streamTransport: true, buffer: true }).sendMail({
      from: { name: email.fromName, address: email.fromAddress },
      to: email.toAddresses,
      cc: email.ccAddresses,
      subject: email.subject,
      text: email.textBody,
      ...(email.inReplyTo ? { inReplyTo: `<${email.inReplyTo}>`, references: [`<${email.inReplyTo}>`] } : {}),
    });
    const raw = built.message as Buffer;

    const insecure = this.opts.allowInsecureForTests === true;
    const smtp = nodemailer.createTransport({
      host: mailbox.smtpHost,
      port,
      secure: !insecure && port === 465,
      requireTLS: !insecure && port !== 465,
      ignoreTLS: insecure,
      auth: { user: secret.username, pass: secret.password },
      ...TIMEOUTS,
    });
    const info = await smtp.sendMail({
      envelope: { from: email.fromAddress, to: [...email.toAddresses, ...email.ccAddresses] },
      raw,
    });

    if (this.opts.sentFolder && mailbox.imapHost) {
      // Best effort: the send already succeeded; a failed copy must not trigger a resend.
      const client = imapClient(mailbox, secret);
      try {
        await client.connect();
        await client.append(this.opts.sentFolder, raw, ["\\Seen"]);
      } catch {
        // Surfaced via the next sync (message missing from Sent); intentionally not thrown.
      } finally {
        await client.logout().catch(() => client.close());
      }
    }

    return {
      providerMessageId: stripMessageId(built.messageId),
      acceptedRecipients: (info.accepted ?? []).map(String),
      rejectedRecipients: (info.rejected ?? []).map(String),
    };
  }
}

/**
 * Explicit, owner-authorized connection test: IMAP LOGIN/LOGOUT and SMTP AUTH,
 * no messages read or sent. Used by `provision-email-mailbox -- --verify`.
 */
export async function verifyMailboxConnection(
  mailbox: MailboxConnection,
  secret: MailboxSecret,
): Promise<{ imap: "ok" | string; smtp: "ok" | string }> {
  const result: { imap: "ok" | string; smtp: "ok" | string } = { imap: "not configured", smtp: "not configured" };
  if (mailbox.imapHost) {
    const client = imapClient(mailbox, secret);
    try {
      await client.connect();
      result.imap = "ok";
    } catch (err) {
      result.imap = (err as Error).message;
    } finally {
      await client.logout().catch(() => client.close());
    }
  }
  if (mailbox.smtpHost) {
    const port = mailbox.smtpPort ?? 465;
    try {
      await nodemailer
        .createTransport({
          host: mailbox.smtpHost,
          port,
          secure: port === 465,
          requireTLS: port !== 465,
          auth: { user: secret.username, pass: secret.password },
          ...TIMEOUTS,
        })
        .verify();
      result.smtp = "ok";
    } catch (err) {
      result.smtp = (err as Error).message;
    }
  }
  return result;
}
