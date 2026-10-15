import { contentHash } from "./content-hash";
import type { EmailApproval, EmailDraft, MailboxConnection } from "./types";

export interface SendPolicyConfig {
  /** Global kill switch, read from EMAIL_SENDING_ENABLED. Anything but "true" is off. */
  globalSendingEnabled: boolean;
  now: Date;
}

export type SendDecision = { allowed: true } | { allowed: false; reasons: string[] };

export function sendingEnabledFromEnv(env: Record<string, string | undefined> = process.env): boolean {
  return env.EMAIL_SENDING_ENABLED === "true";
}

export function domainOf(address: string): string {
  return address.slice(address.lastIndexOf("@") + 1).trim().toLowerCase();
}

export function domainAllowed(address: string, allowlist: readonly string[]): boolean {
  const domain = domainOf(address);
  return allowlist.some((d) => {
    const allowed = d.trim().toLowerCase();
    return domain === allowed || domain.endsWith(`.${allowed}`);
  });
}

/**
 * Every condition must hold before a correspondence email may leave:
 * global switch on, mailbox switch on, mailbox active, the draft approved by a
 * listed human approver for this exact content, approval unexpired, and every
 * recipient inside the mailbox's domain allowlist (when one is set).
 */
export function evaluateSend(
  draft: EmailDraft,
  approval: EmailApproval | null,
  mailbox: MailboxConnection,
  config: SendPolicyConfig,
): SendDecision {
  const reasons: string[] = [];

  if (!config.globalSendingEnabled) reasons.push("global sending is disabled (EMAIL_SENDING_ENABLED)");
  if (!mailbox.sendEnabled) reasons.push("sending is disabled for this mailbox");
  if (mailbox.status !== "ACTIVE") reasons.push(`mailbox status is ${mailbox.status}`);
  if (mailbox.lane !== "CORRESPONDENCE") reasons.push("only CORRESPONDENCE mailboxes send approved drafts");
  if (mailbox.id !== draft.mailboxId) reasons.push("draft does not belong to this mailbox");
  if (draft.status !== "APPROVED") reasons.push(`draft status is ${draft.status}, not APPROVED`);

  const currentHash = contentHash(draft);
  if (currentHash !== draft.contentHash) reasons.push("draft content hash is stale");

  if (!approval) {
    reasons.push("no approval on record");
  } else {
    if (approval.decision !== "APPROVED") reasons.push("approval decision is not APPROVED");
    if (!mailbox.approverUserIds.includes(approval.approverId)) reasons.push("approver is not listed for this mailbox");
    if (approval.contentHash !== currentHash) reasons.push("content changed after approval");
    if (approval.expiresAt <= config.now) reasons.push("approval has expired");
  }

  const recipients = [...draft.toAddresses, ...draft.ccAddresses];
  if (recipients.length === 0) reasons.push("no recipients");
  if (mailbox.recipientDomainAllowlist.length > 0) {
    for (const r of recipients) {
      if (!domainAllowed(r, mailbox.recipientDomainAllowlist)) {
        reasons.push(`recipient domain not allowlisted: ${domainOf(r)}`);
      }
    }
  }

  return reasons.length === 0 ? { allowed: true } : { allowed: false, reasons };
}
