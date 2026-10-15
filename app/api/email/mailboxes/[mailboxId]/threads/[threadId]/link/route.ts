import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, readJsonBody, requireEmailUser, stringField } from "@/lib/email-service/route-helpers";
import { EmailServiceError } from "@/lib/email-service/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ mailboxId: string; threadId: string }> };

const ENTITY_TYPES = new Set(["partner", "driver", "fleet", "compliance_case", "load"]);

/** Link a thread to a BOF record (e.g. a partner in the partnership tracker). */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const { mailboxId, threadId } = await ctx.params;
    const body = await readJsonBody(request);
    const entityType = stringField(body, "entityType", { required: true, max: 40 })!;
    if (!ENTITY_TYPES.has(entityType)) throw new EmailServiceError("Unknown entityType", 422);
    const entityId = stringField(body, "entityId", { required: true, max: 100 })!;
    return NextResponse.json({ link: await emailServices().service.linkThread(auth.user, mailboxId, threadId, entityType, entityId) }, { status: 201 });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
