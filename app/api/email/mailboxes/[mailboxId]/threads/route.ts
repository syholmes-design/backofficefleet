import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string }> };

/** Thread list, newest first. `?q=` searches subject, body and addresses. */
export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId } = await ctx.params;
    const q = new URL(request.url).searchParams.get("q")?.slice(0, 200) ?? undefined;
    return NextResponse.json({ threads: await emailServices().service.listThreads(auth.user, mailboxId, { text: q }) });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
