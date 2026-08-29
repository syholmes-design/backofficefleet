import { NextResponse } from "next/server";
import { chatErrorResponse, queryFleetId, readJson, requireChatUser } from "@/lib/services/operationalChatRoute";
import { createOperationalChatThread, listOperationalChatThreads } from "@/lib/services/operationalChatService";

export async function GET(request: Request) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const url = new URL(request.url);
    const recordType = url.searchParams.get("recordType") ?? undefined;
    const recordId = url.searchParams.get("recordId") ?? undefined;
    return NextResponse.json(await listOperationalChatThreads(authResult.user, queryFleetId(request), recordType && recordId ? { recordType, recordId } : undefined));
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    return NextResponse.json(await createOperationalChatThread(authResult.user, await readJson(request)), { status: 201 });
  } catch (error) {
    return chatErrorResponse(error);
  }
}
