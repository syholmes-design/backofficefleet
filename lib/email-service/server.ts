import type { PrismaClient } from "@prisma/client";

import { loadMailboxSecret } from "./credentials";
import { envKekProvider } from "./credential-vault";
import { ImapInboundSource, SmtpOutboundTransport, type SecretProvider } from "./mail-transports";
import { PrismaAuditSink, PrismaEmailRepository } from "./prisma-repository";
import { sendingEnabledFromEnv } from "./send-policy";
import { EmailCore, EmailService } from "./service";
import { DisabledTransport } from "./transport";
import type { MailboxConnection } from "./types";

export function sentFolderFor(mailbox: MailboxConnection, env: Record<string, string | undefined> = process.env): string | null {
  return env.EMAIL_SENT_FOLDER?.trim() || mailbox.syncFolders.find((f) => /(^|[./])sent( items)?$/i.test(f)) || null;
}

/**
 * Server-only wiring on BOF's existing Prisma client. Import from route handlers and
 * scripts only — never from client components.
 *
 * Env (all server-side, Vercel "sensitive"):
 *   EMAIL_KEK_V1            base64 32-byte key-encryption key (credential vault)
 *   EMAIL_SENDING_ENABLED   "true" to allow sending at all (default: off)
 *   EMAIL_SENT_FOLDER       optional override for the IMAP folder that receives sent copies
 *                           (default: the mailbox's synced folder whose name contains "Sent")
 */
export function createEmailServices(db: PrismaClient, env: Record<string, string | undefined> = process.env) {
  const repo = new PrismaEmailRepository(db);
  const audit = new PrismaAuditSink(db);
  const kek = envKekProvider(env);

  // Late-bound so the transports can decrypt through the same core.
  let core: EmailCore | null = null;
  const secretFor: SecretProvider = (mailbox) => loadMailboxSecret(core!, mailbox, kek);

  // Belt and braces: with sending disabled, no SMTP transport is even constructed.
  const transport = sendingEnabledFromEnv(env)
    ? new SmtpOutboundTransport(secretFor, { sentFolder: (mb) => sentFolderFor(mb, env) })
    : new DisabledTransport();

  core = new EmailCore(repo, audit, transport, () => ({ globalSendingEnabled: sendingEnabledFromEnv(env), now: new Date() }));
  return {
    core,
    service: new EmailService(core),
    inbound: new ImapInboundSource(secretFor),
  };
}
