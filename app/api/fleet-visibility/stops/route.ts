import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { upsertLoadStopGeography } from "@/lib/fleet-visibility/fleet-visibility-service";
import { fleetVisibilityErrorResponse } from "@/lib/fleet-visibility/fleet-api-response";
import type { LoadStopKind } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });

  const body = (await request.json()) as {
    fleetId?: string;
    loadId?: string;
    stopKind?: LoadStopKind;
    latitude?: number;
    longitude?: number;
    geocodeLabel?: string;
  };

  if (!body.fleetId || !body.loadId || !body.stopKind || body.latitude == null || body.longitude == null) {
    return NextResponse.json({ error: "fleetId, loadId, stopKind, latitude, longitude required", code: "VALIDATION" }, { status: 422 });
  }

  try {
    const row = await upsertLoadStopGeography(session.user as SessionUserLike, {
      fleetId: body.fleetId,
      loadId: body.loadId,
      stopKind: body.stopKind,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      geocodeLabel: body.geocodeLabel,
    });
    return NextResponse.json({ ok: true, stop: row });
  } catch (error) {
    const mapped = fleetVisibilityErrorResponse(error);
    if (mapped) return mapped;
    throw error;
  }
}
