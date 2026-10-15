import { createHash } from "node:crypto";

import { domainAllowed, domainOf } from "./send-policy";
import { EmailServiceError, type DraftInput, type EmailCore } from "./service";
import type { Actor, AgentAccessGrant, AgentScope, EmailDraft, EmailMessage, EntityLink, MailboxConnection } from "./types";

/**
 * The only surface an AI agent (Claude or otherwise) gets. It has no send, approve,
 * credential or mailbox-settings operations, and every read is filtered to the
 * grant's mailbox, folder allowlist and domain allowlist.
 *
 * Exposed later as an authenticated MCP endpoint: the agent presents a bearer token,
 * BOF looks up EmailAgentGrant by its SHA-256, and builds this gateway.
 */
export interface AgentMessageView {
  id: string;
  threadId: string;
  direction: EmailMessage["direction"];
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  receivedAt: string;
  textBody: string;
}

export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export class AgentGateway {
  private readonly actor: Actor;

  private constructor(
    private readonly core: EmailCore,
    private readonly grant: AgentAccessGrant,
    private readonly mailbox: MailboxConnection,
    private readonly now: () => Date,
  ) {
    this.actor = { kind: "AGENT", id: grant.agentId };
  }

  /** Builds a gateway from a presented bearer token; null when invalid, revoked or expired. */
  static async fromToken(core: EmailCore, token: string, now: () => Date = () => new Date()): Promise<AgentGateway | null> {
    const grant = await core.repo.getAgentGrantByTokenHash(hashAgentToken(token));
    if (!grant) return null;
    return AgentGateway.fromGrant(core, grant, now);
  }

  static async fromGrant(core: EmailCore, grant: AgentAccessGrant, now: () => Date = () => new Date()): Promise<AgentGateway | null> {
    if (grant.revokedAt || grant.expiresAt <= now()) return null;
    const mailbox = await core.repo.getMailbox(grant.mailboxId);
    if (!mailbox || mailbox.lane !== "CORRESPONDENCE") return null;
    return new AgentGateway(core, grant, mailbox, now);
  }

  private async require(scope: AgentScope): Promise<void> {
    if (this.grant.revokedAt || this.grant.expiresAt <= this.now()) await this.deny("grant expired or revoked");
    if (!this.grant.scopes.includes(scope)) await this.deny(`missing scope ${scope}`);
  }

  private async deny(reason: string): Promise<never> {
    await this.core.record(this.actor, this.mailbox, "access.denied", "EmailMailbox", this.mailbox.id, { reason });
    throw new EmailServiceError(`Agent access denied: ${reason}`, 403);
  }

  private visible(m: EmailMessage): boolean {
    if (!this.grant.folderAllowlist.includes(m.folder)) return false;
    if (this.grant.domainAllowlist.length === 0) return true;
    const counterparties = m.direction === "INBOUND" ? [m.fromAddress] : [...m.toAddresses, ...m.ccAddresses];
    return counterparties.some((a) => domainAllowed(a, this.grant.domainAllowlist));
  }

  private view(m: EmailMessage): AgentMessageView {
    return {
      id: m.id,
      threadId: m.threadId,
      direction: m.direction,
      from: m.fromAddress,
      to: m.toAddresses,
      cc: m.ccAddresses,
      subject: m.subject,
      receivedAt: m.receivedAt.toISOString(),
      textBody: m.textBody,
    };
  }

  private async audited(messages: EmailMessage[]): Promise<AgentMessageView[]> {
    for (const m of messages) {
      await this.core.record(this.actor, this.mailbox, "message.viewed", "EmailMessage", m.id);
    }
    return messages.map((m) => this.view(m));
  }

  async searchMessages(text?: string, limit = 25): Promise<AgentMessageView[]> {
    await this.require("threads:read");
    const msgs = await this.core.repo.queryMessages(this.mailbox.id, {
      text,
      folders: this.grant.folderAllowlist,
      limit: Math.min(limit, 100),
    });
    return this.audited(msgs.filter((m) => this.visible(m)));
  }

  async getThread(threadId: string): Promise<AgentMessageView[]> {
    await this.require("threads:read");
    const msgs = (await this.core.repo.queryMessages(this.mailbox.id, { threadId, limit: 200 }))
      .filter((m) => this.visible(m))
      .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
    if (msgs.length === 0) await this.deny(`thread ${threadId} is not visible to this grant`);
    return this.audited(msgs);
  }

  async createDraft(input: Omit<DraftInput, "mailboxId">): Promise<EmailDraft> {
    await this.require("drafts:write");
    if (input.threadId) await this.getThread(input.threadId); // replies only to visible threads
    if (this.grant.domainAllowlist.length > 0) {
      for (const r of [...input.toAddresses, ...(input.ccAddresses ?? [])]) {
        if (!domainAllowed(r, this.grant.domainAllowlist)) await this.deny(`recipient outside allowlist: ${domainOf(r)}`);
      }
    }
    return this.core.createDraft(this.actor, this.mailbox, { ...input, mailboxId: this.mailbox.id });
  }

  async requestApproval(draftId: string): Promise<EmailDraft> {
    await this.require("approvals:request");
    return this.core.requestApproval(this.actor, this.mailbox, draftId);
  }

  async linkThread(threadId: string, entityType: string, entityId: string): Promise<EntityLink> {
    await this.require("links:write");
    await this.getThread(threadId);
    return this.core.link(this.actor, this.mailbox, threadId, entityType, entityId);
  }
}
