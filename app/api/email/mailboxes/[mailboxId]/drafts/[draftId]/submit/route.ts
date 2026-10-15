import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; draftId: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    return NextResponse.json({ draft: await emailServices().service.requestApproval(auth.user, mailboxId, draftId) });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
