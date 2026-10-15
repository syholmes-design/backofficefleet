import { randomUUID } from "node:crypto";

import type {
  Actor,
  AgentAccessGrant,
  DraftStatus,
  EmailApproval,
  EmailDraft,
  EmailMessage,
  EmailThread,
  EntityLink,
  IncomingMessage,
  MailboxConnection,
  MailboxStatus,
  StoredCredential,
} from "./types";

export interface MessageQuery {
  threadId?: string;
  folders?: string[];
  /** Case-insensitive match on subject, body, sender and recipients. */
  text?: string;
  limit?: number;
}

export interface SyncCursor {
  uidValidity: number;
  lastUid: number;
  consecutiveFailures: number;
}

/** Persistence boundary. PrismaEmailRepository is the production implementation. */
export interface EmailRepository {
  getMailbox(id: string): Promise<MailboxConnection | null>;
  listMailboxes(): Promise<MailboxConnection[]>;
  updateMailbox(id: string, patch: { sendEnabled?: boolean; status?: MailboxStatus }): Promise<void>;

  getCredential(mailboxId: string): Promise<StoredCredential | null>;
  putCredential(credential: StoredCredential): Promise<void>;

  getSyncCursor(mailboxId: string, folder: string): Promise<SyncCursor | null>;
  putSyncCursor(
    mailboxId: string,
    folder: string,
    cursor: SyncCursor & { lastError: string | null; syncedAt: Date },
  ): Promise<void>;

  /** For referenced message ids (no brackets), the thread key that contains them. */
  findThreadKeys(mailboxId: string, messageIds: string[]): Promise<Map<string, string>>;
  upsertThread(mailboxId: string, threadKey: string, subject: string, at: Date): Promise<EmailThread>;
  getThread(threadId: string): Promise<EmailThread | null>;
  /** Returns null when (mailboxId, messageIdHeader) already exists. */
  insertMessage(mailboxId: string, threadId: string, message: IncomingMessage): Promise<EmailMessage | null>;
  queryMessages(mailboxId: string, query: MessageQuery): Promise<EmailMessage[]>;

  createDraft(draft: Omit<EmailDraft, "id" | "createdAt" | "updatedAt">): Promise<EmailDraft>;
  getDraft(id: string): Promise<EmailDraft | null>;
  updateDraft(id: string, patch: Partial<Omit<EmailDraft, "id" | "mailboxId" | "createdAt">>): Promise<EmailDraft>;
  /** Atomic status transition; false if the draft was not in `from`. */
  transitionDraft(id: string, from: DraftStatus, to: DraftStatus): Promise<boolean>;

  getApproval(draftId: string): Promise<EmailApproval | null>;
  putApproval(approval: EmailApproval): Promise<void>;
  deleteApproval(draftId: string): Promise<void>;

  addLink(link: EntityLink): Promise<void>;
  listLinks(threadId: string): Promise<EntityLink[]>;

  getAgentGrantByTokenHash(tokenSha256: string): Promise<AgentAccessGrant | null>;
  createAgentGrant(grant: Omit<AgentAccessGrant, "id" | "revokedAt"> & { tokenSha256: string; createdById: string }): Promise<AgentAccessGrant>;
  revokeAgentGrant(id: string, at: Date): Promise<boolean>;
  listAgentGrants(mailboxId: string): Promise<AgentAccessGrant[]>;

  listThreads(mailboxId: string, limit: number): Promise<EmailThreadSummary[]>;
  getThreadSummaries(threadIds: string[]): Promise<EmailThreadSummary[]>;
  listDrafts(mailboxId: string, statuses?: DraftStatus[]): Promise<EmailDraft[]>;
  /** Most recent sync attempt across folders, with its error if it failed. */
  getSyncStatus(mailboxId: string): Promise<SyncStatus>;
}

export interface SyncStatus {
  lastAttemptAt: Date | null;
  lastError: string | null;
}

export interface EmailThreadSummary extends EmailThread {
  messageCount: number;
  lastFromAddress: string | null;
  snippet: string;
}

export type EmailAuditEvent =
  | "mailbox.credentials_stored"
  | "mailbox.send_enabled_changed"
  | "mailbox.status_changed"
  | "sync.completed"
  | "sync.failed"
  | "message.viewed"
  | "draft.created"
  | "draft.updated"
  | "draft.approval_requested"
  | "draft.approved"
  | "draft.rejected"
  | "send.blocked"
  | "send.attempted"
  | "send.succeeded"
  | "send.failed"
  | "access.denied"
  | "thread.linked";

export interface EmailAuditRecord {
  actor: Actor;
  mailbox: MailboxConnection;
  event: EmailAuditEvent;
  entityType: "EmailMailbox" | "EmailThread" | "EmailMessage" | "EmailDraft";
  entityId: string;
  /** Metadata only: never message bodies or credentials. */
  details?: Record<string, string | number | boolean | null>;
}

/** Audit boundary. Production writes BOF's existing AuditEvent table (prisma-repository.ts). */
export interface EmailAuditSink {
  record(entry: EmailAuditRecord): Promise<void>;
}

export class MemoryAuditSink implements EmailAuditSink {
  readonly entries: EmailAuditRecord[] = [];
  async record(entry: EmailAuditRecord): Promise<void> {
    this.entries.push(entry);
  }
}

/** In-memory repository for tests and local tooling. Mirrors the Prisma constraints. */
export class MemoryEmailRepository implements EmailRepository {
  readonly mailboxes = new Map<string, MailboxConnection>();
  readonly credentials = new Map<string, StoredCredential>();
  readonly cursors = new Map<string, SyncCursor & { lastError: string | null; syncedAt: Date }>();
  readonly threads = new Map<string, EmailThread>();
  readonly messages = new Map<string, EmailMessage>();
  readonly drafts = new Map<string, EmailDraft>();
  readonly approvals = new Map<string, EmailApproval>();
  readonly links: EntityLink[] = [];
  readonly grants = new Map<string, AgentAccessGrant>();

  async getMailbox(id: string) {
    const mb = this.mailboxes.get(id);
    return mb ? { ...mb } : null;
  }
  async listMailboxes() {
    return [...this.mailboxes.values()].map((m) => ({ ...m }));
  }
  async updateMailbox(id: string, patch: { sendEnabled?: boolean; status?: MailboxStatus }) {
    const mb = this.mailboxes.get(id);
    if (mb) Object.assign(mb, patch);
  }
  async getCredential(mailboxId: string) {
    return this.credentials.get(mailboxId) ?? null;
  }
  async putCredential(credential: StoredCredential) {
    this.credentials.set(credential.mailboxId, { ...credential });
  }
  async getSyncCursor(mailboxId: string, folder: string) {
    return this.cursors.get(`${mailboxId}|${folder}`) ?? null;
  }
  async putSyncCursor(mailboxId: string, folder: string, cursor: SyncCursor & { lastError: string | null; syncedAt: Date }) {
    this.cursors.set(`${mailboxId}|${folder}`, { ...cursor });
  }
  async findThreadKeys(mailboxId: string, messageIds: string[]) {
    const out = new Map<string, string>();
    for (const m of this.messages.values()) {
      if (m.mailboxId === mailboxId && messageIds.includes(m.messageIdHeader)) {
        const t = this.threads.get(m.threadId);
        if (t) out.set(m.messageIdHeader, t.threadKey);
      }
    }
    return out;
  }
  async upsertThread(mailboxId: string, threadKey: string, subject: string, at: Date) {
    const existing = [...this.threads.values()].find((t) => t.mailboxId === mailboxId && t.threadKey === threadKey);
    if (existing) {
      if (at > existing.lastMessageAt) existing.lastMessageAt = at;
      return { ...existing };
    }
    const t: EmailThread = { id: randomUUID(), mailboxId, threadKey, subject, lastMessageAt: at };
    this.threads.set(t.id, t);
    return { ...t };
  }
  async getThread(threadId: string) {
    const t = this.threads.get(threadId);
    return t ? { ...t } : null;
  }
  async insertMessage(mailboxId: string, threadId: string, message: IncomingMessage) {
    for (const m of this.messages.values()) {
      if (m.mailboxId === mailboxId && m.messageIdHeader === message.messageIdHeader) return null;
    }
    const stored: EmailMessage = { ...message, id: randomUUID(), mailboxId, threadId };
    this.messages.set(stored.id, stored);
    return { ...stored };
  }
  async queryMessages(mailboxId: string, query: MessageQuery) {
    const text = query.text?.toLowerCase();
    return [...this.messages.values()]
      .filter((m) => m.mailboxId === mailboxId)
      .filter((m) => !query.threadId || m.threadId === query.threadId)
      .filter((m) => !query.folders || query.folders.includes(m.folder))
      .filter(
        (m) =>
          !text ||
          [m.subject, m.textBody, m.fromAddress, ...m.toAddresses, ...m.ccAddresses].some((v) =>
            v.toLowerCase().includes(text),
          ),
      )
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
      .slice(0, query.limit ?? 100)
      .map((m) => ({ ...m }));
  }
  async createDraft(draft: Omit<EmailDraft, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const d: EmailDraft = { ...draft, id: randomUUID(), createdAt: now, updatedAt: now };
    this.drafts.set(d.id, d);
    return { ...d };
  }
  async getDraft(id: string) {
    const d = this.drafts.get(id);
    return d ? { ...d } : null;
  }
  async updateDraft(id: string, patch: Partial<Omit<EmailDraft, "id" | "mailboxId" | "createdAt">>) {
    const d = this.drafts.get(id);
    if (!d) throw new Error(`draft ${id} not found`);
    Object.assign(d, patch, { updatedAt: new Date() });
    return { ...d };
  }
  async transitionDraft(id: string, from: DraftStatus, to: DraftStatus) {
    const d = this.drafts.get(id);
    if (!d || d.status !== from) return false;
    d.status = to;
    d.updatedAt = new Date();
    return true;
  }
  async getApproval(draftId: string) {
    return this.approvals.get(draftId) ?? null;
  }
  async putApproval(approval: EmailApproval) {
    this.approvals.set(approval.draftId, { ...approval });
  }
  async deleteApproval(draftId: string) {
    this.approvals.delete(draftId);
  }
  async addLink(link: EntityLink) {
    const dup = this.links.some(
      (l) => l.threadId === link.threadId && l.entityType === link.entityType && l.entityId === link.entityId,
    );
    if (!dup) this.links.push({ ...link });
  }
  async listLinks(threadId: string) {
    return this.links.filter((l) => l.threadId === threadId).map((l) => ({ ...l }));
  }
  async getAgentGrantByTokenHash(tokenSha256: string) {
    return this.grants.get(tokenSha256) ?? null;
  }
  async createAgentGrant(grant: Omit<AgentAccessGrant, "id" | "revokedAt"> & { tokenSha256: string; createdById: string }) {
    const { tokenSha256, createdById: _createdBy, ...rest } = grant;
    void _createdBy;
    const created: AgentAccessGrant = { ...rest, id: randomUUID(), revokedAt: null };
    this.grants.set(tokenSha256, created);
    return { ...created };
  }
  async revokeAgentGrant(id: string, at: Date) {
    for (const g of this.grants.values()) {
      if (g.id === id && !g.revokedAt) {
        g.revokedAt = at;
        return true;
      }
    }
    return false;
  }
  async listAgentGrants(mailboxId: string) {
    return [...this.grants.values()].filter((g) => g.mailboxId === mailboxId).map((g) => ({ ...g }));
  }
  private summarize(t: EmailThread): EmailThreadSummary {
    const msgs = [...this.messages.values()]
      .filter((m) => m.threadId === t.id)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
    return { ...t, messageCount: msgs.length, lastFromAddress: msgs[0]?.fromAddress ?? null, snippet: (msgs[0]?.textBody ?? "").slice(0, 160) };
  }
  async listThreads(mailboxId: string, limit: number) {
    return [...this.threads.values()]
      .filter((t) => t.mailboxId === mailboxId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
      .slice(0, limit)
      .map((t) => this.summarize(t));
  }
  async getThreadSummaries(threadIds: string[]) {
    return threadIds.flatMap((id) => {
      const t = this.threads.get(id);
      return t ? [this.summarize(t)] : [];
    });
  }
  async listDrafts(mailboxId: string, statuses?: DraftStatus[]) {
    return [...this.drafts.values()]
      .filter((d) => d.mailboxId === mailboxId && (!statuses || statuses.includes(d.status)))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((d) => ({ ...d }));
  }
  async getSyncStatus(mailboxId: string): Promise<SyncStatus> {
    const latest = [...this.cursors.entries()]
      .filter(([k]) => k.startsWith(`${mailboxId}|`))
      .map(([, c]) => c)
      .sort((a, b) => b.syncedAt.getTime() - a.syncedAt.getTime())[0];
    return { lastAttemptAt: latest?.syncedAt ?? null, lastError: latest?.lastError ?? null };
  }
}
