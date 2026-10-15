import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Authorizes the scheduled sync endpoint. Accepts `Authorization: Bearer <token>`
 * matching EMAIL_SYNC_TOKEN, or CRON_SECRET (what Vercel Cron sends). The token only
 * triggers an idempotent sync; it never grants mailbox or credential access.
 * With neither variable set, the endpoint is closed.
 */
export function isAuthorizedSyncRequest(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/.exec(header.trim());
  if (!match) return false;
  const presented = createHash("sha256").update(match[1]).digest();
  return [env.EMAIL_SYNC_TOKEN, env.CRON_SECRET]
    .filter((t): t is string => typeof t === "string" && t.length >= 16)
    .some((t) => timingSafeEqual(presented, createHash("sha256").update(t).digest()));
}
