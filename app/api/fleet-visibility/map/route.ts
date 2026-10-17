import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { getFleetMapView } from "@/lib/fleet-visibility/fleet-visibility-service";
import { fleetVisibilityErrorResponse } from "@/lib/fleet-visibility/fleet-api-response";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });

  const fleetId = new URL(request.url).searchParams.get("fleetId") ?? "";
  if (!fleetId) return NextResponse.json({ error: "fleetId is required", code: "VALIDATION" }, { status: 422 });

  try {
    const view = await getFleetMapView(session.user as SessionUserLike, fleetId);
    return NextResponse.json(view);
  } catch (error) {
    const mapped = fleetVisibilityErrorResponse(error);
    if (mapped) return mapped;
    throw error;
  }
}
