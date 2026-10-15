import { createHash } from "node:crypto";

const REPLY_PREFIX = /^\s*((re|fw|fwd|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i;

export function normalizeSubject(subject: string): string {
  return subject.replace(REPLY_PREFIX, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function stripMessageId(id: string): string {
  return id.trim().replace(/^<|>$/g, "");
}

export interface ThreadingHeaders {
  messageIdHeader: string;
  inReplyTo: string | null;
  references: string[];
}

/** Message ids this message points at, oldest first. */
export function referencedIds(headers: ThreadingHeaders): string[] {
  const refs = headers.references.map(stripMessageId).filter(Boolean);
  const parent = headers.inReplyTo ? stripMessageId(headers.inReplyTo) : undefined;
  return parent && !refs.includes(parent) ? [...refs, parent] : refs;
}

/**
 * Resolve the thread key a message belongs to.
 *
 * Order: a known thread containing any referenced id, else a key derived from the
 * root of the References chain (or In-Reply-To, or the message itself). Subject is
 * deliberately not used: two vendors replying "Re: Partnership inquiry" must not
 * collapse into one conversation.
 *
 * @param knownThreadKeys message id (no brackets) -> thread key, for referenced ids
 */
export function resolveThreadKey(headers: ThreadingHeaders, knownThreadKeys: ReadonlyMap<string, string>): string {
  const refs = referencedIds(headers);
  for (const id of refs) {
    const existing = knownThreadKeys.get(id);
    if (existing) return existing;
  }
  const root = refs[0] ?? stripMessageId(headers.messageIdHeader);
  return `thr_${createHash("sha256").update(root).digest("hex").slice(0, 24)}`;
}
