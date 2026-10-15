import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId } = await ctx.params;
    return NextResponse.json(await emailServices().service.mailboxOverview(auth.user, mailboxId));
  } catch (error) {
    return emailErrorResponse(error);
  }
}
