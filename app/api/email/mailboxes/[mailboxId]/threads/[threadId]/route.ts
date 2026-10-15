import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; threadId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, threadId } = await ctx.params;
    return NextResponse.json(await emailServices().service.getThread(auth.user, mailboxId, threadId));
  } catch (error) {
    return emailErrorResponse(error);
  }
}
