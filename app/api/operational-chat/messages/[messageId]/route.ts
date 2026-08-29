import { NextResponse } from "next/server";
import { chatErrorResponse, queryFleetId, readJson, requireChatUser } from "@/lib/services/operationalChatRoute";
import { deleteOperationalChatMessage, editOperationalChatMessage } from "@/lib/services/operationalChatService";

export async function PATCH(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const { messageId } = await context.params;
    const body = await readJson(request);
    return NextResponse.json(await editOperationalChatMessage(authResult.user, queryFleetId(request), messageId, String(body.body ?? "")));
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const { messageId } = await context.params;
    return NextResponse.json(await deleteOperationalChatMessage(authResult.user, queryFleetId(request), messageId));
  } catch (error) {
    return chatErrorResponse(error);
  }
}
