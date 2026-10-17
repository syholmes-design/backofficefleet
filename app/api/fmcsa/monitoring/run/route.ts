import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { runFmcsaMonitoring, schedulingState } from "@/lib/services/fmcsa/monitoringService";
import { fmcsaErrorResponse, isAuthorizedMonitoringToken, sessionUser } from "@/lib/services/fmcsa/routeSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Starts a monitoring run.
 * - Signed-in user with a run role: MANUAL run over their fleets (optional body.fleetIds).
 * - Bearer token (FMCSA_MONITORING_TOKEN / CRON_SECRET): SCHEDULED run over all active
 *   fleets, accepted only when scheduling is enabled and never in production.
 */
export async function POST(request: Request) {
  const hasBearer = /^Bearer\s+/i.test(request.headers.get("authorization") ?? "");
  try {
    if (hasBearer) {
      if (!isAuthorizedMonitoringToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const scheduling = schedulingState();
      if (!scheduling.enabled) return NextResponse.json({ error: "Scheduled monitoring is disabled", reason: scheduling.reason }, { status: 403 });
      const run = await runFmcsaMonitoring({ trigger: "SCHEDULED" });
      return NextResponse.json({ run: summary(run) }, { status: 201 });
    }
    const user = sessionUser(await auth());
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { fleetIds?: unknown };
    const fleetIds = Array.isArray(body.fleetIds) ? body.fleetIds.filter((id): id is string => typeof id === "string") : undefined;
    const run = await runFmcsaMonitoring({ trigger: "MANUAL", actor: user, fleetIds });
    return NextResponse.json({ run: summary(run) }, { status: 201 });
  } catch (error) {
    return fmcsaErrorResponse(error);
  }
}

function summary(run: Awaited<ReturnType<typeof runFmcsaMonitoring>>) {
  return {
    id: run.id,
    status: run.status,
    fleetsChecked: run.fleetsChecked,
    counts: {
      clear: run.clearCount,
      attention: run.attentionCount,
      critical: run.criticalCount,
      unverified: run.unverifiedCount,
      notConfigured: run.notConfiguredCount,
    },
  };
}
