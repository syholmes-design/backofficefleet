import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasRole } from "@/lib/authorization";
import { validateOpenDataSchemas } from "@/lib/services/fmcsa/openData/schemaValidation";
import { createSodaClientFromEnv } from "@/lib/services/fmcsa/openData/sodaClient";
import { fmcsaErrorResponse, sessionUser } from "@/lib/services/fmcsa/routeSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Probes the live FMCSA dataset schemas (public data) without running monitoring. */
export async function GET() {
  const user = sessionUser(await auth());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await validateOpenDataSchemas(createSodaClientFromEnv()));
  } catch (error) {
    return fmcsaErrorResponse(error);
  }
}
