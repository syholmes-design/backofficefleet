import { credentialAad, openSecret, sealSecret, type KekProvider } from "./credential-vault";
import type { EmailCore } from "./service";
import type { Actor, MailboxConnection } from "./types";

export interface MailboxSecret {
  username: string;
  password: string;
}

/**
 * Seal and store a mailbox password. Called only from the operator CLI
 * (scripts/provision-email-mailbox.ts), where the password is typed into a hidden
 * terminal prompt — never from an API route that an agent could reach.
 */
export async function storeMailboxCredential(
  core: EmailCore,
  actor: Actor,
  mailbox: MailboxConnection,
  secret: MailboxSecret,
  kek: KekProvider,
  keyVersion: string,
): Promise<void> {
  if (!secret.username.trim() || !secret.password) throw new Error("username and password are required");
  const sealed = sealSecret(secret.password, credentialAad(mailbox.id, mailbox.address), kek, keyVersion);
  await core.repo.putCredential({ mailboxId: mailbox.id, username: secret.username.trim(), ...sealed });
  await core.record(actor, mailbox, "mailbox.credentials_stored", "EmailMailbox", mailbox.id, { keyVersion });
}

/** Server-internal: used by mail transports only. Never return this to a client. */
export async function loadMailboxSecret(core: EmailCore, mailbox: MailboxConnection, kek: KekProvider): Promise<MailboxSecret> {
  const stored = await core.repo.getCredential(mailbox.id);
  if (!stored) throw new Error("No credential stored for this mailbox yet");
  if (stored.aad !== credentialAad(mailbox.id, mailbox.address)) throw new Error("Credential is bound to a different mailbox");
  return { username: stored.username, password: openSecret(stored, kek) };
}
