import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMonitoringOverview } from "@/lib/services/fmcsa/monitoringService";
import { fmcsaErrorResponse, sessionUser } from "@/lib/services/fmcsa/routeSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Carrier monitoring overview for the fleets the signed-in user belongs to. */
export async function GET() {
  const user = sessionUser(await auth());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getMonitoringOverview(user));
  } catch (error) {
    return fmcsaErrorResponse(error);
  }
}
