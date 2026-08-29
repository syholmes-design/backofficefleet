import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { OperationalChatError } from "@/lib/services/operationalChatService";
import { OperatingRecordError } from "@/lib/services/operatingRecordService";

export async function requireChatUser() {
  const session = await auth();
  if (!session?.user?.id) return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user: session.user as SessionUserLike, response: null };
}

export function chatErrorResponse(error: unknown) {
  if (error instanceof OperationalChatError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
  if (error instanceof OperatingRecordError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new OperationalChatError("Invalid JSON body", 422);
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof OperationalChatError) throw error;
    throw new OperationalChatError("Invalid JSON body", 422);
  }
}

export function queryFleetId(request: Request) {
  const fleetId = new URL(request.url).searchParams.get("fleetId")?.trim();
  if (!fleetId) throw new OperationalChatError("fleetId is required", 422);
  return fleetId;
}
