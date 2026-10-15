import { randomBytes } from "node:crypto";

import { hashAgentToken } from "./agent-gateway";
import type { EmailRepository } from "./repository";
import { AGENT_SCOPES, type AgentAccessGrant, type AgentScope, type MailboxConnection } from "./types";

export const ISSUE_AGENT_TOKEN_CONFIRMATION = "ISSUE AGENT TOKEN";
export const MAX_GRANT_DAYS = 90;

export interface IssueGrantInput {
  mailbox: MailboxConnection;
  /** BOF user issuing the grant; must be a listed approver of the mailbox. */
  createdById: string;
  agentId?: string;
  days?: number;
  scopes?: AgentScope[];
  folders?: string[];
  domains?: string[];
}

/**
 * Issue a scoped, expiring token for the Claude connector. Only the SHA-256 of the
 * token is stored; the plaintext is returned once to the operator's terminal.
 */
export async function issueAgentGrant(
  repo: EmailRepository,
  input: IssueGrantInput,
  now: Date = new Date(),
): Promise<{ token: string; grant: AgentAccessGrant }> {
  const { mailbox } = input;
  if (mailbox.lane !== "CORRESPONDENCE") throw new Error("Agent grants are only for correspondence mailboxes");
  if (!mailbox.approverUserIds.includes(input.createdById)) throw new Error("Only a listed approver of this mailbox may issue agent grants");
  const days = input.days ?? 30;
  if (!Number.isInteger(days) || days < 1 || days > MAX_GRANT_DAYS) throw new Error(`days must be 1–${MAX_GRANT_DAYS}`);
  const scopes = input.scopes ?? [...AGENT_SCOPES];
  for (const s of scopes) if (!AGENT_SCOPES.includes(s)) throw new Error(`Scope not allowed for agents: ${s}`);
  const folders = input.folders ?? mailbox.syncFolders;
  for (const f of folders) if (!mailbox.syncFolders.includes(f)) throw new Error(`Folder is not synced for this mailbox: ${f}`);
  if (folders.length === 0) throw new Error("At least one folder is required");

  const token = randomBytes(32).toString("base64url");
  const grant = await repo.createAgentGrant({
    agentId: input.agentId ?? "claude",
    mailboxId: mailbox.id,
    scopes,
    folderAllowlist: folders,
    domainAllowlist: (input.domains ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean),
    expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
    tokenSha256: hashAgentToken(token),
    createdById: input.createdById,
  });
  return { token, grant };
}
