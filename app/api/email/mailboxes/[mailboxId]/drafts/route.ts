import { NextResponse } from "next/server";

import {
  addressListField,
  draftStatusesParam,
  emailErrorResponse,
  emailServices,
  readJsonBody,
  requireEmailUser,
  stringField,
} from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string }> };

/** `?status=PENDING_APPROVAL,APPROVED` filters the approval queue. */
export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId } = await ctx.params;
    const statuses = draftStatusesParam(new URL(request.url).searchParams.get("status"));
    return NextResponse.json({ drafts: await emailServices().service.listDrafts(auth.user, mailboxId, statuses) });
  } catch (error) {
    return emailErrorResponse(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId } = await ctx.params;
    const body = await readJsonBody(request);
    const draft = await emailServices().service.createDraft(auth.user, {
      mailboxId,
      threadId: stringField(body, "threadId", { max: 100 }) ?? null,
      inReplyTo: stringField(body, "inReplyTo", { max: 500 }) ?? null,
      toAddresses: addressListField(body, "to", { required: true })!,
      ccAddresses: addressListField(body, "cc") ?? [],
      subject: stringField(body, "subject", { required: true, max: 300 })!,
      textBody: stringField(body, "body", { required: true, max: 20000 })!,
    });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
