import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { setFleetCarrierIdentity } from "@/lib/services/fmcsa/monitoringService";
import { fmcsaErrorResponse, sessionUser } from "@/lib/services/fmcsa/routeSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sets a fleet's USDOT / MC identity. Body: { fleetId, usdotNumber, mcNumber }. Audited. */
export async function PUT(request: Request) {
  const user = sessionUser(await auth());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.fleetId !== "string" || !body.fleetId) return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
    const fleet = await setFleetCarrierIdentity(user, body.fleetId, { usdotNumber: body.usdotNumber, mcNumber: body.mcNumber });
    return NextResponse.json({ fleet });
  } catch (error) {
    return fmcsaErrorResponse(error);
  }
}
