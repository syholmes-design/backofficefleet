import { NextResponse } from "next/server";
import { chatErrorResponse, queryFleetId, readJson, requireChatUser } from "@/lib/services/operationalChatRoute";
import { createOperationalChatMessage } from "@/lib/services/operationalChatService";

export async function POST(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const { threadId } = await context.params;
    return NextResponse.json(await createOperationalChatMessage(authResult.user, queryFleetId(request), threadId, await readJson(request)), { status: 201 });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
