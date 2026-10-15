import type { EmailCore } from "./service";
import type { InboundSource } from "./transport";
import type { Actor } from "./types";

const SYNC_ACTOR: Actor = { kind: "SYSTEM", id: "email-sync" };
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;

export interface SyncOptions {
  /** Messages per folder per run; keeps each run well inside a serverless time limit. */
  batchSize?: number;
  now?: () => Date;
}

export interface FolderSyncResult {
  folder: string;
  fetched: number;
  inserted: number;
  lastUid: number;
  hasMore: boolean;
  error?: string;
}

function isAuthError(err: unknown): boolean {
  const e = err as { authenticationFailed?: boolean; responseCode?: number; code?: string; message?: string };
  return Boolean(
    e?.authenticationFailed || e?.responseCode === 535 || e?.code === "EAUTH" || /auth(entication)? failed|invalid credentials/i.test(e?.message ?? ""),
  );
}

/**
 * Bounded, incremental, resumable IMAP sync for one mailbox. Safe to call from a
 * Vercel function on a schedule or on demand: it fetches UIDs above the stored
 * cursor, resets on UIDVALIDITY change, deduplicates on Message-ID, and stops
 * retrying after repeated authentication failures (to avoid a cPanel lockout).
 */
export async function syncMailbox(
  core: EmailCore,
  source: InboundSource,
  mailboxId: string,
  opts: SyncOptions = {},
): Promise<FolderSyncResult[]> {
  const now = opts.now ?? (() => new Date());
  const batchSize = opts.batchSize ?? 50;
  const mailbox = await core.mailboxOrThrow(mailboxId);
  if (mailbox.status !== "ACTIVE" || mailbox.lane !== "CORRESPONDENCE") return [];

  const results: FolderSyncResult[] = [];
  for (const folder of mailbox.syncFolders) {
    const cursor = await core.repo.getSyncCursor(mailbox.id, folder);
    try {
      let batch = await source.fetchSince(mailbox, folder, cursor?.lastUid ?? 0, batchSize);
      if (cursor && batch.uidValidity !== cursor.uidValidity) {
        // Folder was rebuilt server-side; UIDs are meaningless now. Restart (dedupe protects us).
        batch = await source.fetchSince(mailbox, folder, 0, batchSize);
      }
      let inserted = 0;
      for (const msg of batch.messages) {
        if (await core.ingest(mailbox, msg)) inserted += 1;
      }
      await core.repo.putSyncCursor(mailbox.id, folder, {
        uidValidity: batch.uidValidity,
        lastUid: batch.lastUid,
        consecutiveFailures: 0,
        lastError: null,
        syncedAt: now(),
      });
      await core.record(SYNC_ACTOR, mailbox, "sync.completed", "EmailMailbox", mailbox.id, {
        folder,
        fetched: batch.messages.length,
        inserted,
      });
      results.push({ folder, fetched: batch.messages.length, inserted, lastUid: batch.lastUid, hasMore: batch.hasMore });
    } catch (err) {
      const message = (err as Error).message?.slice(0, 300) ?? "unknown error";
      const failures = (cursor?.consecutiveFailures ?? 0) + 1;
      await core.repo.putSyncCursor(mailbox.id, folder, {
        uidValidity: cursor?.uidValidity ?? 0,
        lastUid: cursor?.lastUid ?? 0,
        consecutiveFailures: failures,
        lastError: message,
        syncedAt: now(),
      });
      await core.record(SYNC_ACTOR, mailbox, "sync.failed", "EmailMailbox", mailbox.id, { folder, error: message, failures });
      if (isAuthError(err) && failures >= MAX_CONSECUTIVE_AUTH_FAILURES) {
        await core.repo.updateMailbox(mailbox.id, { status: "AUTH_FAILED" });
        await core.record(SYNC_ACTOR, mailbox, "mailbox.status_changed", "EmailMailbox", mailbox.id, { status: "AUTH_FAILED" });
      }
      results.push({ folder, fetched: 0, inserted: 0, lastUid: cursor?.lastUid ?? 0, hasMore: false, error: message });
    }
  }
  return results;
}
