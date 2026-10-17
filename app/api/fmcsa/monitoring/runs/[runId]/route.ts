import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMonitoringRunReport } from "@/lib/services/fmcsa/monitoringService";
import { fmcsaErrorResponse, sessionUser } from "@/lib/services/fmcsa/routeSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Exception report for one run, limited to the user's fleets. */
export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const user = sessionUser(await auth());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { runId } = await context.params;
    return NextResponse.json(await getMonitoringRunReport(user, runId));
  } catch (error) {
    return fmcsaErrorResponse(error);
  }
}
