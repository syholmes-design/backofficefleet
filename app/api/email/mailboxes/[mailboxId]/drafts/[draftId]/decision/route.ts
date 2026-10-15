import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, readJsonBody, requireEmailUser, stringField } from "@/lib/email-service/route-helpers";
import { EmailServiceError } from "@/lib/email-service/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; draftId: string }> };

/** Approve or reject. Only users listed as approvers for the mailbox may decide. */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    const body = await readJsonBody(request);
    const decision = stringField(body, "decision", { required: true });
    if (decision !== "APPROVED" && decision !== "REJECTED") throw new EmailServiceError("decision must be APPROVED or REJECTED", 422);
    const approval = await emailServices().service.decide(auth.user, mailboxId, draftId, decision, {
      note: stringField(body, "note", { max: 1000 }),
    });
    return NextResponse.json({ approval });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
