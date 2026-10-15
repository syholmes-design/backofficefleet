import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; draftId: string }> };

/**
 * Sends an APPROVED draft only if every gate passes. While EMAIL_SENDING_ENABLED is
 * not "true" (the default) no SMTP transport exists and this returns 409 with reasons.
 */
export async function POST(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    const result = await emailServices().service.sendApproved(auth.user, mailboxId, draftId);
    if (!result.allowed) return NextResponse.json({ sent: false, reasons: result.reasons }, { status: 409 });
    return NextResponse.json({ sent: true, messageId: result.result?.providerMessageId });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
