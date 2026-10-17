import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import type { SessionUserLike } from "@/lib/authorization";

/** Maps service errors (statusCode/payload) to JSON responses without leaking internals. */
export function fmcsaErrorResponse(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;
  const message = [401, 403, 404, 409, 422].includes(statusCode) && error instanceof Error ? error.message : "Internal server error";
  const payload = error && typeof error === "object" && "payload" in error ? (error as { payload?: Record<string, unknown> }).payload : undefined;
  if (statusCode === 500) console.error("[fmcsa-monitoring]", error instanceof Error ? error.message : error);
  return NextResponse.json(payload ? { error: message, ...payload } : { error: message }, { status: statusCode });
}

export function sessionUser(session: { user?: unknown } | null): SessionUserLike | null {
  const user = session?.user as SessionUserLike | undefined;
  return user?.id ? user : null;
}

/**
 * Bearer token for scheduled runs: FMCSA_MONITORING_TOKEN, or CRON_SECRET (what
 * Vercel Cron sends). With neither set (>= 16 chars), token runs are refused.
 */
export function isAuthorizedMonitoringToken(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const match = /^Bearer\s+(.+)$/.exec((request.headers.get("authorization") ?? "").trim());
  if (!match) return false;
  const presented = createHash("sha256").update(match[1]).digest();
  return [env.FMCSA_MONITORING_TOKEN, env.CRON_SECRET]
    .filter((t): t is string => typeof t === "string" && t.length >= 16)
    .some((t) => timingSafeEqual(presented, createHash("sha256").update(t).digest()));
}
