import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices } from "@/lib/email-service/route-helpers";
import { syncMailbox } from "@/lib/email-service/sync";
import { isAuthorizedSyncRequest } from "@/lib/email-service/sync-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIME_BUDGET_MS = 45_000;

/**
 * Scheduled sync of every ACTIVE correspondence mailbox. Called by Vercel Cron
 * (Authorization: Bearer $CRON_SECRET) or an external scheduler
 * (Authorization: Bearer $EMAIL_SYNC_TOKEN). Each run is bounded and resumable.
 */
async function run(request: Request) {
  if (!isAuthorizedSyncRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const started = Date.now();
    const { core, inbound } = emailServices();
    const mailboxes = (await core.repo.listMailboxes()).filter((m) => m.status === "ACTIVE" && m.lane === "CORRESPONDENCE");
    const results: Array<{ mailboxId: string; folders?: unknown; skipped?: string }> = [];
    for (const m of mailboxes) {
      if (Date.now() - started > TIME_BUDGET_MS) {
        results.push({ mailboxId: m.id, skipped: "time budget" });
        continue;
      }
      results.push({ mailboxId: m.id, folders: await syncMailbox(core, inbound, m.id) });
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return emailErrorResponse(error);
  }
}

export const GET = run;
export const POST = run;
