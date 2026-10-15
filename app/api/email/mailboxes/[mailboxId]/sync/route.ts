import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";
import { syncMailbox } from "@/lib/email-service/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ mailboxId: string }> };

const MIN_INTERVAL_MS = 60_000;

/** "Sync now" from the inbox. Rate-limited to protect the cPanel account from lockouts. */
export async function POST(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId } = await ctx.params;
    const { core, service, inbound } = emailServices();
    const mailbox = await service.authorizeSync(auth.user, mailboxId);
    if (mailbox.status !== "ACTIVE") {
      return NextResponse.json({ synced: false, reason: `Mailbox is ${mailbox.status}` }, { status: 409 });
    }
    const { lastAttemptAt } = await core.repo.getSyncStatus(mailbox.id);
    if (lastAttemptAt && Date.now() - lastAttemptAt.getTime() < MIN_INTERVAL_MS) {
      return NextResponse.json({ synced: false, reason: "Synced less than a minute ago" }, { status: 429 });
    }
    return NextResponse.json({ synced: true, folders: await syncMailbox(core, inbound, mailbox.id) });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
