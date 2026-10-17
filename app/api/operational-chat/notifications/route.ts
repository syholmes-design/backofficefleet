import { NextResponse } from "next/server";
import { chatErrorResponse, queryFleetId, readJson, requireChatUser } from "@/lib/services/operationalChatRoute";
import {
  listOperationalChatNotifications,
  markOperationalChatNotificationsRead,
} from "@/lib/services/operationalChatService";

export async function GET(request: Request) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const fleetId = queryFleetId(request);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "30");
    return NextResponse.json(await listOperationalChatNotifications(authResult.user, fleetId, limit));
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireChatUser();
  if (!authResult.user) return authResult.response;
  try {
    const fleetId = queryFleetId(request);
    const body = await readJson(request);
    const notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined;
    return NextResponse.json(await markOperationalChatNotificationsRead(authResult.user, fleetId, notificationIds));
  } catch (error) {
    return chatErrorResponse(error);
  }
}
