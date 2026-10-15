import { VERIFICATION_PARTNER_DOMAINS } from "./partner-directory";
import type { MailboxConnection } from "./types";

export const PROVISION_MAILBOX_CONFIRMATION = "PROVISION EMAIL MAILBOX";
export const STORE_CREDENTIAL_CONFIRMATION = "STORE MAILBOX CREDENTIAL";
export const VERIFY_CONNECTION_CONFIRMATION = "VERIFY MAILBOX CONNECTION";

export type MailboxSpec = Omit<MailboxConnection, "id" | "status" | "sendEnabled">;

export interface PartnershipsMailboxInput {
  /** cPanel mail server hostname (cPanel → Email Accounts → Connect Devices). */
  mailHost: string;
  approverUserIds: string[];
  /**
   * cPanel/Dovecot usually namespaces folders under "INBOX." (e.g. "INBOX.Sent").
   * Confirm with --verify before the first sync.
   */
  sentFolder?: string;
}

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function assertMailHost(host: string): string {
  const h = host.trim().toLowerCase();
  if (!HOSTNAME.test(h)) throw new Error(`Invalid mail host: ${host}`);
  return h;
}

/**
 * partnerships@nathson.com — BOF's strategic partnerships mailbox.
 * PLATFORM scope (no fleet), correspondence lane, IMAPS 993 / SMTPS 465,
 * sending off, recipients limited to verification-partner domains until an
 * approver widens the allowlist.
 */
export function partnershipsMailboxSpec(input: PartnershipsMailboxInput): MailboxSpec {
  if (input.approverUserIds.length === 0) throw new Error("At least one approver is required");
  const host = assertMailHost(input.mailHost);
  return {
    scope: "PLATFORM",
    fleetId: null,
    lane: "CORRESPONDENCE",
    address: "partnerships@nathson.com",
    displayName: "BackOfficeFleet Partnerships",
    imapHost: host,
    imapPort: 993,
    smtpHost: host,
    smtpPort: 465,
    syncFolders: ["INBOX", input.sentFolder ?? "INBOX.Sent"],
    approverUserIds: [...new Set(input.approverUserIds)],
    recipientDomainAllowlist: [...VERIFICATION_PARTNER_DOMAINS],
  };
}

export type ProvisionMode = "dry-run" | "execute" | "set-credential" | "verify";

export function parseProvisionMode(argv: string[]): ProvisionMode {
  const modes = argv.filter((a) => ["--dry-run", "--execute", "--set-credential", "--verify"].includes(a));
  const unknown = argv.filter((a) => a.startsWith("--") && !modes.includes(a));
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown.join(", ")}`);
  if (modes.length > 1) throw new Error("Choose one of --dry-run, --execute, --set-credential, --verify");
  return (modes[0]?.slice(2) as ProvisionMode | undefined) ?? "dry-run";
}
