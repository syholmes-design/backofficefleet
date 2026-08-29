import { NextResponse } from "next/server";
import { chatErrorResponse, queryFleetId, requireChatUser } from "@/lib/services/operationalChatRoute";
import { getOperationalChatThread, markOperationalChatThreadRead, resolveOperationalChatThread } from "@/lib/services/operationalChatService";

export async function GET(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const { threadId } = await context.params;
    return NextResponse.json(await getOperationalChatThread(authResult.user, queryFleetId(request), threadId));
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const { threadId } = await context.params;
    const fleetId = queryFleetId(request);
    const body = await request.json().catch(() => ({})) as { action?: string; nextAction?: string };
    if (body.action === "read") return NextResponse.json(await markOperationalChatThreadRead(authResult.user, fleetId, threadId));
    if (body.action === "resolve") return NextResponse.json(await resolveOperationalChatThread(authResult.user, fleetId, threadId, body.nextAction));
    return NextResponse.json({ error: "Unsupported thread action" }, { status: 422 });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
