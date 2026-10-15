import { createHash } from "node:crypto";

export interface HashableContent {
  mailboxId: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  inReplyTo: string | null;
}

function canonical(list: string[]): string[] {
  return list.map((a) => a.trim().toLowerCase()).sort();
}

/**
 * Canonical SHA-256 of everything that would leave the building.
 * Any edit after approval changes the hash and invalidates the approval.
 */
export function contentHash(content: HashableContent): string {
  const json = JSON.stringify({
    mailboxId: content.mailboxId,
    to: canonical(content.toAddresses),
    cc: canonical(content.ccAddresses),
    subject: content.subject,
    textBody: content.textBody.replace(/\r\n/g, "\n"),
    inReplyTo: content.inReplyTo ?? null,
  });
  return createHash("sha256").update(json, "utf8").digest("hex");
}
