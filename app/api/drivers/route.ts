import { auth } from "@/auth";
import { listDriverOperationalSummaries } from "@/lib/services/driverOperationalReadModelService";
import { logUnauthorizedAttempt } from "@/lib/services/intakeService";

import { NextRequest, NextResponse } from "next/server";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

type RouteSession = { user?: RouteSessionUser | null };

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 422]);

function getSessionUser(session: RouteSession) {
  return session.user as RouteSessionUser;
}

function errorResponse(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;

  const message = CONTROLLED_ERROR_STATUSES.has(statusCode)
    ? error instanceof Error
      ? error.message
      : "Unknown error"
    : "Internal server error";

  return { statusCode, response: NextResponse.json({ error: message }, { status: statusCode }) };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fleetId = searchParams.get("fleetId");

  if (!fleetId || fleetId.trim().length === 0) {
    return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
  }

  try {
    const summaries = await listDriverOperationalSummaries(getSessionUser(session), fleetId);
    return NextResponse.json(summaries);
  } catch (error) {
    const { statusCode, response } = errorResponse(error);

    if (statusCode === 403) {
      await logUnauthorizedAttempt(getSessionUser(session), fleetId, null, "TENANT_ACCESS_DENIED");
    }

    return response;
  }
}
