/**
 * BOF Email Service — domain types (mirror the Email* Prisma models).
 *
 * Lanes:
 *  - TRANSACTIONAL: automated BOF notifications (provider API, separate subdomain)
 *  - CORRESPONDENCE: human-to-human business mail (mailbox via IMAP/SMTP)
 * AI assistance is not a lane: agents read CORRESPONDENCE through AgentGateway and
 * can only write drafts.
 */

export type MailboxScope = "PLATFORM" | "FLEET";
export type MailboxLane = "TRANSACTIONAL" | "CORRESPONDENCE";
export type MailboxStatus = "PENDING_CREDENTIALS" | "ACTIVE" | "AUTH_FAILED" | "DISABLED";
export type EmailDirection = "INBOUND" | "OUTBOUND";
export type DraftStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "CANCELLED";
export type ActorKind = "USER" | "AGENT" | "SYSTEM";

/** What a principal may do with one mailbox (resolved in access.ts). */
export type EmailCapability = "read" | "draft" | "approve" | "admin";

export interface Actor {
  kind: ActorKind;
  id: string;
  email?: string | null;
}

export interface MailboxConnection {
  id: string;
  scope: MailboxScope;
  fleetId: string | null;
  lane: MailboxLane;
  address: string;
  displayName: string;
  imapHost: string | null;
  imapPort: number | null;
  smtpHost: string | null;
  smtpPort: number | null;
  syncFolders: string[];
  approverUserIds: string[];
  recipientDomainAllowlist: string[];
  sendEnabled: boolean;
  status: MailboxStatus;
}

export interface EmailMessage {
  id: string;
  mailboxId: string;
  threadId: string;
  direction: EmailDirection;
  folder: string;
  imapUid: number | null;
  /** Stored without angle brackets. */
  messageIdHeader: string;
  inReplyTo: string | null;
  references: string[];
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  receivedAt: Date;
}

export type IncomingMessage = Omit<EmailMessage, "id" | "threadId" | "mailboxId">;

export interface EmailThread {
  id: string;
  mailboxId: string;
  threadKey: string;
  subject: string;
  lastMessageAt: Date;
}

export interface EmailDraft {
  id: string;
  mailboxId: string;
  threadId: string | null;
  inReplyTo: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  status: DraftStatus;
  /** SHA-256 of the canonical outgoing content; approvals bind to this value. */
  contentHash: string;
  createdByKind: ActorKind;
  createdById: string;
  sentMessageId: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailApproval {
  draftId: string;
  approverId: string;
  decision: "APPROVED" | "REJECTED";
  contentHash: string;
  decidedAt: Date;
  expiresAt: Date;
  note: string | null;
}

export type AgentScope = "threads:read" | "drafts:write" | "approvals:request" | "links:write";

export const AGENT_SCOPES: readonly AgentScope[] = [
  "threads:read",
  "drafts:write",
  "approvals:request",
  "links:write",
];

/** Agents never receive send, approve, admin or credential scopes. */
export interface AgentAccessGrant {
  id: string;
  agentId: string;
  mailboxId: string;
  scopes: AgentScope[];
  /** IMAP folders the agent may read. Empty = none. */
  folderAllowlist: string[];
  /** Counterparty domains the agent may read/draft to. Empty = any in the allowed folders. */
  domainAllowlist: string[];
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface EntityLink {
  threadId: string;
  entityType: string;
  entityId: string;
  linkedByKind: ActorKind;
  linkedById: string;
}

export interface StoredCredential {
  mailboxId: string;
  username: string;
  keyVersion: string;
  wrappedKey: string;
  ciphertext: string;
  aad: string;
}
