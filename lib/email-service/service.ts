import type { SessionUserLike } from "@/lib/authorization";

import { resolveMailboxCapabilities } from "./access";
import { contentHash } from "./content-hash";
import type { EmailAuditEvent, EmailAuditRecord, EmailAuditSink, EmailRepository, MessageQuery } from "./repository";
import { evaluateSend, type SendDecision, type SendPolicyConfig } from "./send-policy";
import { referencedIds, resolveThreadKey, stripMessageId } from "./threading";
import type { OutboundTransport, SendResult } from "./transport";
import type {
  Actor,
  EmailCapability,
  EmailDraft,
  EmailMessage,
  EntityLink,
  IncomingMessage,
  MailboxConnection,
} from "./types";

/** Error shape matches BOF route helpers (statusCode is read by *ErrorResponse helpers). */
export class EmailServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 403 | 404 | 409 | 422,
  ) {
    super(message);
    this.name = "EmailServiceError";
  }
}

const DEFAULT_APPROVAL_TTL_MS = 72 * 60 * 60 * 1000;
const EDITABLE: ReadonlySet<EmailDraft["status"]> = new Set(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]);

export interface DraftInput {
  mailboxId: string;
  threadId?: string | null;
  inReplyTo?: string | null;
  toAddresses: string[];
  ccAddresses?: string[];
  subject: string;
  textBody: string;
}

function normalizeAddresses(list: string[] | undefined): string[] {
  return (list ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean);
}

/**
 * Actor-level operations with no authorization of their own. Only EmailService
 * (session users), AgentGateway (scoped agent grants) and the sync worker call
 * these, after authorizing.
 */
export class EmailCore {
  constructor(
    readonly repo: EmailRepository,
    private readonly audit: EmailAuditSink,
    private readonly transport: OutboundTransport,
    private readonly policy: () => SendPolicyConfig,
  ) {}

  async record(
    actor: Actor,
    mailbox: MailboxConnection,
    event: EmailAuditEvent,
    entityType: EmailAuditRecord["entityType"],
    entityId: string,
    details?: EmailAuditRecord["details"],
  ) {
    await this.audit.record({ actor, mailbox, event, entityType, entityId, details });
  }

  async mailboxOrThrow(mailboxId: string): Promise<MailboxConnection> {
    const mb = await this.repo.getMailbox(mailboxId);
    if (!mb) throw new EmailServiceError("Mailbox not found", 404);
    return mb;
  }

  async ingest(mailbox: MailboxConnection, message: IncomingMessage): Promise<EmailMessage | null> {
    const normalized: IncomingMessage = {
      ...message,
      messageIdHeader: stripMessageId(message.messageIdHeader),
      inReplyTo: message.inReplyTo ? stripMessageId(message.inReplyTo) : null,
      references: message.references.map(stripMessageId).filter(Boolean),
      fromAddress: message.fromAddress.trim().toLowerCase(),
      toAddresses: normalizeAddresses(message.toAddresses),
      ccAddresses: normalizeAddresses(message.ccAddresses),
    };
    const known = await this.repo.findThreadKeys(mailbox.id, referencedIds(normalized));
    const threadKey = resolveThreadKey(normalized, known);
    const thread = await this.repo.upsertThread(mailbox.id, threadKey, normalized.subject, normalized.receivedAt);
    return this.repo.insertMessage(mailbox.id, thread.id, normalized);
  }

  async createDraft(actor: Actor, mailbox: MailboxConnection, input: DraftInput): Promise<EmailDraft> {
    if (input.threadId) {
      const thread = await this.repo.getThread(input.threadId);
      if (!thread || thread.mailboxId !== mailbox.id) throw new EmailServiceError("Thread not found", 404);
    }
    const content = {
      mailboxId: mailbox.id,
      toAddresses: normalizeAddresses(input.toAddresses),
      ccAddresses: normalizeAddresses(input.ccAddresses),
      subject: input.subject,
      textBody: input.textBody,
      inReplyTo: input.inReplyTo ? stripMessageId(input.inReplyTo) : null,
    };
    if (content.toAddresses.length === 0) throw new EmailServiceError("At least one recipient is required", 422);
    const draft = await this.repo.createDraft({
      ...content,
      threadId: input.threadId ?? null,
      status: "DRAFT",
      contentHash: contentHash(content),
      createdByKind: actor.kind,
      createdById: actor.id,
      sentMessageId: null,
      lastError: null,
    });
    await this.record(actor, mailbox, "draft.created", "EmailDraft", draft.id, { by: actor.kind });
    return draft;
  }

  async draftInMailbox(draftId: string, mailbox: MailboxConnection): Promise<EmailDraft> {
    const d = await this.repo.getDraft(draftId);
    if (!d || d.mailboxId !== mailbox.id) throw new EmailServiceError("Draft not found", 404);
    return d;
  }

  async requestApproval(actor: Actor, mailbox: MailboxConnection, draftId: string): Promise<EmailDraft> {
    await this.draftInMailbox(draftId, mailbox);
    if (!(await this.repo.transitionDraft(draftId, "DRAFT", "PENDING_APPROVAL"))) {
      throw new EmailServiceError("Only a DRAFT can be submitted for approval", 409);
    }
    await this.record(actor, mailbox, "draft.approval_requested", "EmailDraft", draftId);
    return (await this.repo.getDraft(draftId))!;
  }

  async link(actor: Actor, mailbox: MailboxConnection, threadId: string, entityType: string, entityId: string) {
    const thread = await this.repo.getThread(threadId);
    if (!thread || thread.mailboxId !== mailbox.id) throw new EmailServiceError("Thread not found", 404);
    const link: EntityLink = { threadId, entityType, entityId, linkedByKind: actor.kind, linkedById: actor.id };
    await this.repo.addLink(link);
    await this.record(actor, mailbox, "thread.linked", "EmailThread", threadId, { entityType, entityId });
    return link;
  }

  async sendApproved(actor: Actor, mailbox: MailboxConnection, draftId: string): Promise<SendDecision & { result?: SendResult }> {
    const draft = await this.draftInMailbox(draftId, mailbox);
    const approval = await this.repo.getApproval(draftId);
    const decision = evaluateSend(draft, approval, mailbox, this.policy());
    if (!decision.allowed) {
      await this.record(actor, mailbox, "send.blocked", "EmailDraft", draftId, { reasons: decision.reasons.join("; ") });
      return decision;
    }
    // Atomic claim prevents a double send from concurrent requests.
    if (!(await this.repo.transitionDraft(draftId, "APPROVED", "SENDING"))) {
      throw new EmailServiceError("Draft is no longer APPROVED", 409);
    }
    await this.record(actor, mailbox, "send.attempted", "EmailDraft", draftId);
    try {
      const result = await this.transport.send(mailbox, {
        fromAddress: mailbox.address,
        fromName: mailbox.displayName,
        toAddresses: draft.toAddresses,
        ccAddresses: draft.ccAddresses,
        subject: draft.subject,
        textBody: draft.textBody,
        inReplyTo: draft.inReplyTo,
      });
      await this.repo.updateDraft(draftId, { status: "SENT", sentMessageId: result.providerMessageId, lastError: null });
      await this.record(actor, mailbox, "send.succeeded", "EmailDraft", draftId, {
        providerMessageId: result.providerMessageId,
        rejected: result.rejectedRecipients.length,
      });
      return { allowed: true, result };
    } catch (err) {
      const message = (err as Error).message.slice(0, 300);
      await this.repo.updateDraft(draftId, { status: "FAILED", lastError: message });
      await this.record(actor, mailbox, "send.failed", "EmailDraft", draftId, { error: message });
      throw err;
    }
  }
}

/** Entry point for authenticated BOF users (NextAuth session users). */
export class EmailService {
  constructor(
    readonly core: EmailCore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private actorOf(user: SessionUserLike): Actor {
    return { kind: "USER", id: user.id!, email: user.email ?? null };
  }

  private async authorize(user: SessionUserLike | null | undefined, mailboxId: string, cap: EmailCapability) {
    const mailbox = await this.core.mailboxOrThrow(mailboxId);
    const caps = resolveMailboxCapabilities(user, mailbox);
    if (!user?.id || !caps.has(cap)) {
      if (user?.id && caps.size > 0) {
        await this.core.record(this.actorOf(user), mailbox, "access.denied", "EmailMailbox", mailbox.id, { needed: cap });
      }
      // Don't reveal existence of mailboxes the user has no access to at all.
      throw new EmailServiceError(caps.size > 0 ? `Missing mailbox capability: ${cap}` : "Mailbox not found", caps.size > 0 ? 403 : 404);
    }
    return { mailbox, actor: this.actorOf(user), caps };
  }

  async listMailboxes(user: SessionUserLike | null | undefined) {
    const all = await this.core.repo.listMailboxes();
    return all
      .map((mailbox) => ({ mailbox, capabilities: [...resolveMailboxCapabilities(user, mailbox)] }))
      .filter((m) => m.capabilities.length > 0);
  }

  async searchMessages(user: SessionUserLike | null | undefined, mailboxId: string, query: MessageQuery) {
    const { mailbox } = await this.authorize(user, mailboxId, "read");
    return this.core.repo.queryMessages(mailbox.id, { ...query, limit: Math.min(query.limit ?? 50, 200) });
  }

  async createDraft(user: SessionUserLike | null | undefined, input: DraftInput) {
    const { mailbox, actor } = await this.authorize(user, input.mailboxId, "draft");
    return this.core.createDraft(actor, mailbox, input);
  }

  async updateDraft(
    user: SessionUserLike | null | undefined,
    mailboxId: string,
    draftId: string,
    patch: { toAddresses?: string[]; ccAddresses?: string[]; subject?: string; textBody?: string },
  ) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "draft");
    const d = await this.core.draftInMailbox(draftId, mailbox);
    if (!EDITABLE.has(d.status)) throw new EmailServiceError(`Cannot edit a draft in status ${d.status}`, 409);
    const next = {
      toAddresses: patch.toAddresses ? normalizeAddresses(patch.toAddresses) : d.toAddresses,
      ccAddresses: patch.ccAddresses ? normalizeAddresses(patch.ccAddresses) : d.ccAddresses,
      subject: patch.subject ?? d.subject,
      textBody: patch.textBody ?? d.textBody,
    };
    // Any edit voids prior approval: the approver must see the final text.
    await this.core.repo.deleteApproval(draftId);
    const updated = await this.core.repo.updateDraft(draftId, {
      ...next,
      status: "DRAFT",
      contentHash: contentHash({ ...d, ...next }),
    });
    await this.core.record(actor, mailbox, "draft.updated", "EmailDraft", draftId);
    return updated;
  }

  async requestApproval(user: SessionUserLike | null | undefined, mailboxId: string, draftId: string) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "draft");
    return this.core.requestApproval(actor, mailbox, draftId);
  }

  async decide(
    user: SessionUserLike | null | undefined,
    mailboxId: string,
    draftId: string,
    decision: "APPROVED" | "REJECTED",
    opts: { note?: string; ttlMs?: number } = {},
  ) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "approve");
    const d = await this.core.draftInMailbox(draftId, mailbox);
    if (!(await this.core.repo.transitionDraft(draftId, "PENDING_APPROVAL", decision))) {
      throw new EmailServiceError(`Draft is ${d.status}, not PENDING_APPROVAL`, 409);
    }
    const now = this.now();
    const approval = {
      draftId,
      approverId: actor.id,
      decision,
      contentHash: d.contentHash,
      decidedAt: now,
      expiresAt: new Date(now.getTime() + (opts.ttlMs ?? DEFAULT_APPROVAL_TTL_MS)),
      note: opts.note ?? null,
    };
    await this.core.repo.putApproval(approval);
    await this.core.record(actor, mailbox, decision === "APPROVED" ? "draft.approved" : "draft.rejected", "EmailDraft", draftId);
    return approval;
  }

  /** Sender must be a listed approver; every send-policy gate still applies. */
  async sendApproved(user: SessionUserLike | null | undefined, mailboxId: string, draftId: string) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "approve");
    return this.core.sendApproved(actor, mailbox, draftId);
  }

  async setSendEnabled(user: SessionUserLike | null | undefined, mailboxId: string, enabled: boolean) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "admin");
    await this.core.repo.updateMailbox(mailbox.id, { sendEnabled: enabled });
    await this.core.record(actor, mailbox, "mailbox.send_enabled_changed", "EmailMailbox", mailbox.id, { enabled });
  }

  async linkThread(user: SessionUserLike | null | undefined, mailboxId: string, threadId: string, entityType: string, entityId: string) {
    const { mailbox, actor } = await this.authorize(user, mailboxId, "draft");
    return this.core.link(actor, mailbox, threadId, entityType, entityId);
  }
}
