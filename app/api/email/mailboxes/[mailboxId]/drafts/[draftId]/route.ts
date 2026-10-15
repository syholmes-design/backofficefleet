import { NextResponse } from "next/server";

import {
  addressListField,
  emailErrorResponse,
  emailServices,
  readJsonBody,
  requireEmailUser,
  stringField,
} from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; draftId: string }> };

/** Draft, its approval, and a dry-run of every send gate (nothing is sent). */
export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    return NextResponse.json(await emailServices().service.getDraft(auth.user, mailboxId, draftId));
  } catch (error) {
    return emailErrorResponse(error);
  }
}

/** Editing returns the draft to DRAFT and voids any approval. */
export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    const body = await readJsonBody(request);
    const draft = await emailServices().service.updateDraft(auth.user, mailboxId, draftId, {
      toAddresses: addressListField(body, "to"),
      ccAddresses: addressListField(body, "cc"),
      subject: stringField(body, "subject", { max: 300 }),
      textBody: stringField(body, "body", { max: 20000 }),
    });
    return NextResponse.json({ draft });
  } catch (error) {
    return emailErrorResponse(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, draftId } = await ctx.params;
    await emailServices().service.cancelDraft(auth.user, mailboxId, draftId);
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
