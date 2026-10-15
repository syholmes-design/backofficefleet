import { Prisma, type AuditAction, type PrismaClient } from "@prisma/client";

import type {
  EmailAuditEvent,
  EmailAuditRecord,
  EmailAuditSink,
  EmailRepository,
  EmailThreadSummary,
  MessageQuery,
  SyncStatus,
  SyncCursor,
} from "./repository";
import type {
  AgentAccessGrant,
  AgentScope,
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

type MailboxRow = Prisma.EmailMailboxGetPayload<object>;
type MessageRow = Prisma.EmailMessageGetPayload<object>;
type DraftRow = Prisma.EmailDraftGetPayload<object>;

function toMailbox(r: MailboxRow): MailboxConnection {
  return {
    id: r.id,
    scope: r.scope,
    fleetId: r.fleetId,
    lane: r.lane,
    address: r.address,
    displayName: r.displayName,
    imapHost: r.imapHost,
    imapPort: r.imapPort,
    smtpHost: r.smtpHost,
    smtpPort: r.smtpPort,
    syncFolders: r.syncFolders,
    approverUserIds: r.approverUserIds,
    recipientDomainAllowlist: r.recipientDomainAllowlist,
    sendEnabled: r.sendEnabled,
    status: r.status,
  };
}

function toMessage(r: MessageRow): EmailMessage {
  return {
    id: r.id,
    mailboxId: r.mailboxId,
    threadId: r.threadId,
    direction: r.direction,
    folder: r.folder,
    imapUid: r.imapUid === null ? null : Number(r.imapUid),
    messageIdHeader: r.messageIdHeader,
    inReplyTo: r.inReplyTo,
    references: r.references,
    fromAddress: r.fromAddress,
    fromName: r.fromName,
    toAddresses: r.toAddresses,
    ccAddresses: r.ccAddresses,
    subject: r.subject,
    textBody: r.textBody,
    receivedAt: r.receivedAt,
  };
}

function toDraft(r: DraftRow): EmailDraft {
  return { ...r };
}

/** Prisma-backed repository on BOF's existing Neon database. */
export class PrismaEmailRepository implements EmailRepository {
  constructor(private readonly db: PrismaClient) {}

  async getMailbox(id: string) {
    const r = await this.db.emailMailbox.findUnique({ where: { id } });
    return r ? toMailbox(r) : null;
  }

  async listMailboxes() {
    return (await this.db.emailMailbox.findMany({ orderBy: { address: "asc" } })).map(toMailbox);
  }

  async updateMailbox(id: string, patch: { sendEnabled?: boolean; status?: MailboxStatus }) {
    await this.db.emailMailbox.update({ where: { id }, data: patch });
  }

  async getCredential(mailboxId: string): Promise<StoredCredential | null> {
    const r = await this.db.emailMailboxCredential.findUnique({ where: { mailboxId } });
    return r
      ? { mailboxId: r.mailboxId, username: r.username, keyVersion: r.keyVersion, wrappedKey: r.wrappedKey, ciphertext: r.ciphertext, aad: r.aad }
      : null;
  }

  async putCredential(c: StoredCredential) {
    const data = { username: c.username, keyVersion: c.keyVersion, wrappedKey: c.wrappedKey, ciphertext: c.ciphertext, aad: c.aad, rotatedAt: new Date() };
    await this.db.emailMailboxCredential.upsert({ where: { mailboxId: c.mailboxId }, create: { mailboxId: c.mailboxId, ...data }, update: data });
  }

  async getSyncCursor(mailboxId: string, folder: string): Promise<SyncCursor | null> {
    const r = await this.db.emailSyncState.findUnique({ where: { mailboxId_folder: { mailboxId, folder } } });
    return r ? { uidValidity: Number(r.uidValidity), lastUid: Number(r.lastUid), consecutiveFailures: r.consecutiveFailures } : null;
  }

  async putSyncCursor(mailboxId: string, folder: string, c: SyncCursor & { lastError: string | null; syncedAt: Date }) {
    const data = {
      uidValidity: BigInt(c.uidValidity),
      lastUid: BigInt(c.lastUid),
      consecutiveFailures: c.consecutiveFailures,
      lastError: c.lastError,
      lastSyncedAt: c.syncedAt,
    };
    await this.db.emailSyncState.upsert({
      where: { mailboxId_folder: { mailboxId, folder } },
      create: { mailboxId, folder, ...data },
      update: data,
    });
  }

  async findThreadKeys(mailboxId: string, messageIds: string[]) {
    if (messageIds.length === 0) return new Map<string, string>();
    const rows = await this.db.emailMessage.findMany({
      where: { mailboxId, messageIdHeader: { in: messageIds } },
      select: { messageIdHeader: true, thread: { select: { threadKey: true } } },
    });
    return new Map(rows.map((r) => [r.messageIdHeader, r.thread.threadKey]));
  }

  async upsertThread(mailboxId: string, threadKey: string, subject: string, at: Date): Promise<EmailThread> {
    const t = await this.db.emailThread.upsert({
      where: { mailboxId_threadKey: { mailboxId, threadKey } },
      create: { mailboxId, threadKey, subject, lastMessageAt: at },
      update: {},
    });
    if (at > t.lastMessageAt) {
      await this.db.emailThread.update({ where: { id: t.id }, data: { lastMessageAt: at } });
      t.lastMessageAt = at;
    }
    return { id: t.id, mailboxId: t.mailboxId, threadKey: t.threadKey, subject: t.subject, lastMessageAt: t.lastMessageAt };
  }

  async getThread(threadId: string) {
    const t = await this.db.emailThread.findUnique({ where: { id: threadId } });
    return t ? { id: t.id, mailboxId: t.mailboxId, threadKey: t.threadKey, subject: t.subject, lastMessageAt: t.lastMessageAt } : null;
  }

  async insertMessage(mailboxId: string, threadId: string, m: IncomingMessage) {
    try {
      const r = await this.db.emailMessage.create({
        data: {
          mailboxId,
          threadId,
          direction: m.direction,
          folder: m.folder,
          imapUid: m.imapUid === null ? null : BigInt(m.imapUid),
          messageIdHeader: m.messageIdHeader,
          inReplyTo: m.inReplyTo,
          references: m.references,
          fromAddress: m.fromAddress,
          fromName: m.fromName,
          toAddresses: m.toAddresses,
          ccAddresses: m.ccAddresses,
          subject: m.subject,
          textBody: m.textBody,
          receivedAt: m.receivedAt,
        },
      });
      return toMessage(r);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null; // duplicate Message-ID
      throw err;
    }
  }

  async queryMessages(mailboxId: string, q: MessageQuery) {
    const text = q.text?.trim();
    const rows = await this.db.emailMessage.findMany({
      where: {
        mailboxId,
        ...(q.threadId ? { threadId: q.threadId } : {}),
        ...(q.folders ? { folder: { in: q.folders } } : {}),
        ...(text
          ? {
              OR: [
                { subject: { contains: text, mode: "insensitive" } },
                { textBody: { contains: text, mode: "insensitive" } },
                { fromAddress: { contains: text, mode: "insensitive" } },
                { toAddresses: { has: text.toLowerCase() } },
              ],
            }
          : {}),
      },
      orderBy: { receivedAt: "desc" },
      take: q.limit ?? 100,
    });
    return rows.map(toMessage);
  }

  async createDraft(d: Omit<EmailDraft, "id" | "createdAt" | "updatedAt">) {
    return toDraft(await this.db.emailDraft.create({ data: d }));
  }

  async getDraft(id: string) {
    const r = await this.db.emailDraft.findUnique({ where: { id } });
    return r ? toDraft(r) : null;
  }

  async updateDraft(id: string, patch: Partial<Omit<EmailDraft, "id" | "mailboxId" | "createdAt">>) {
    const { threadId, ...rest } = patch;
    return toDraft(
      await this.db.emailDraft.update({
        where: { id },
        data: { ...rest, ...(threadId !== undefined ? { thread: threadId ? { connect: { id: threadId } } : { disconnect: true } } : {}) },
      }),
    );
  }

  async transitionDraft(id: string, from: DraftStatus, to: DraftStatus) {
    const res = await this.db.emailDraft.updateMany({ where: { id, status: from }, data: { status: to } });
    return res.count === 1;
  }

  async getApproval(draftId: string): Promise<EmailApproval | null> {
    const r = await this.db.emailApproval.findUnique({ where: { draftId } });
    return r
      ? { draftId: r.draftId, approverId: r.approverId, decision: r.decision, contentHash: r.contentHash, decidedAt: r.decidedAt, expiresAt: r.expiresAt, note: r.note }
      : null;
  }

  async putApproval(a: EmailApproval) {
    const data = { approverId: a.approverId, decision: a.decision, contentHash: a.contentHash, decidedAt: a.decidedAt, expiresAt: a.expiresAt, note: a.note };
    await this.db.emailApproval.upsert({ where: { draftId: a.draftId }, create: { draftId: a.draftId, ...data }, update: data });
  }

  async deleteApproval(draftId: string) {
    await this.db.emailApproval.deleteMany({ where: { draftId } });
  }

  async addLink(l: EntityLink) {
    await this.db.emailEntityLink.upsert({
      where: { threadId_entityType_entityId: { threadId: l.threadId, entityType: l.entityType, entityId: l.entityId } },
      create: l,
      update: {},
    });
  }

  async listLinks(threadId: string) {
    const rows = await this.db.emailEntityLink.findMany({ where: { threadId } });
    return rows.map((r) => ({ threadId: r.threadId, entityType: r.entityType, entityId: r.entityId, linkedByKind: r.linkedByKind, linkedById: r.linkedById }));
  }

  async getAgentGrantByTokenHash(tokenSha256: string): Promise<AgentAccessGrant | null> {
    const r = await this.db.emailAgentGrant.findUnique({ where: { tokenSha256 } });
    return r ? toGrant(r) : null;
  }

  async createAgentGrant(g: Omit<AgentAccessGrant, "id" | "revokedAt"> & { tokenSha256: string; createdById: string }) {
    return toGrant(
      await this.db.emailAgentGrant.create({
        data: {
          agentId: g.agentId,
          mailboxId: g.mailboxId,
          scopes: g.scopes,
          folderAllowlist: g.folderAllowlist,
          domainAllowlist: g.domainAllowlist,
          tokenSha256: g.tokenSha256,
          expiresAt: g.expiresAt,
          createdById: g.createdById,
        },
      }),
    );
  }

  async revokeAgentGrant(id: string, at: Date) {
    const res = await this.db.emailAgentGrant.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: at } });
    return res.count === 1;
  }

  async listAgentGrants(mailboxId: string) {
    return (await this.db.emailAgentGrant.findMany({ where: { mailboxId }, orderBy: { createdAt: "desc" } })).map(toGrant);
  }

  private async summaries(threads: Array<{ id: string; mailboxId: string; threadKey: string; subject: string; lastMessageAt: Date }>): Promise<EmailThreadSummary[]> {
    if (threads.length === 0) return [];
    const ids = threads.map((t) => t.id);
    const [counts, latest] = await Promise.all([
      this.db.emailMessage.groupBy({ by: ["threadId"], where: { threadId: { in: ids } }, _count: { _all: true } }),
      this.db.emailMessage.findMany({
        where: { threadId: { in: ids } },
        orderBy: { receivedAt: "desc" },
        distinct: ["threadId"],
        select: { threadId: true, fromAddress: true, textBody: true },
      }),
    ]);
    const countBy = new Map(counts.map((c) => [c.threadId, c._count._all]));
    const lastBy = new Map(latest.map((m) => [m.threadId, m]));
    return threads.map((t) => ({
      id: t.id,
      mailboxId: t.mailboxId,
      threadKey: t.threadKey,
      subject: t.subject,
      lastMessageAt: t.lastMessageAt,
      messageCount: countBy.get(t.id) ?? 0,
      lastFromAddress: lastBy.get(t.id)?.fromAddress ?? null,
      snippet: (lastBy.get(t.id)?.textBody ?? "").slice(0, 160),
    }));
  }

  async listThreads(mailboxId: string, limit: number) {
    return this.summaries(await this.db.emailThread.findMany({ where: { mailboxId }, orderBy: { lastMessageAt: "desc" }, take: limit }));
  }

  async getThreadSummaries(threadIds: string[]) {
    if (threadIds.length === 0) return [];
    const rows = await this.db.emailThread.findMany({ where: { id: { in: threadIds } } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return this.summaries(threadIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])));
  }

  async listDrafts(mailboxId: string, statuses?: DraftStatus[]) {
    const rows = await this.db.emailDraft.findMany({
      where: { mailboxId, ...(statuses ? { status: { in: statuses } } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return rows.map(toDraft);
  }

  async getSyncStatus(mailboxId: string): Promise<SyncStatus> {
    const r = await this.db.emailSyncState.findFirst({ where: { mailboxId, lastSyncedAt: { not: null } }, orderBy: { lastSyncedAt: "desc" } });
    return { lastAttemptAt: r?.lastSyncedAt ?? null, lastError: r?.lastError ?? null };
  }
}

function toGrant(r: Prisma.EmailAgentGrantGetPayload<object>): AgentAccessGrant {
  return {
    id: r.id,
    agentId: r.agentId,
    mailboxId: r.mailboxId,
    scopes: r.scopes as AgentScope[],
    folderAllowlist: r.folderAllowlist,
    domainAllowlist: r.domainAllowlist,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
  };
}

const ACTION_BY_EVENT: Record<EmailAuditEvent, AuditAction> = {
  "mailbox.credentials_stored": "UPDATED",
  "mailbox.send_enabled_changed": "UPDATED",
  "mailbox.status_changed": "UPDATED",
  "sync.completed": "IMPORTED",
  "sync.failed": "IMPORTED",
  "message.viewed": "VIEWED",
  "draft.created": "CREATED",
  "draft.updated": "UPDATED",
  "draft.approval_requested": "UPDATED",
  "draft.approved": "UPDATED",
  "draft.rejected": "UPDATED",
  "send.blocked": "ACCESS_DENIED",
  "send.attempted": "EXPORTED",
  "send.succeeded": "EXPORTED",
  "send.failed": "EXPORTED",
  "access.denied": "ACCESS_DENIED",
  "thread.linked": "UPDATED",
};

/**
 * Writes email events into BOF's existing AuditEvent table. tenantId is the
 * mailbox's fleet (null for PLATFORM mailboxes); actorId is set only for real users.
 */
export class PrismaAuditSink implements EmailAuditSink {
  constructor(private readonly db: PrismaClient) {}

  async record(e: EmailAuditRecord) {
    await this.db.auditEvent.create({
      data: {
        actorId: e.actor.kind === "USER" ? e.actor.id : null,
        actorEmail: e.actor.email ?? null,
        tenantId: e.mailbox.fleetId,
        action: ACTION_BY_EVENT[e.event],
        entityType: e.entityType,
        entityId: e.entityId,
        details: { event: e.event, actorKind: e.actor.kind, actorId: e.actor.id, ...(e.details ?? {}) },
        metadata: { mailboxId: e.mailbox.id, mailboxScope: e.mailbox.scope },
      },
    });
  }
}
