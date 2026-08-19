import { auth } from "@/auth";
import { getDriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";
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

export async function GET(_request: NextRequest, context: { params: Promise<{ driverId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { driverId } = await context.params;

  try {
    const summary = await getDriverOperationalSummary(getSessionUser(session), driverId);
    return NextResponse.json(summary);
  } catch (error) {
    const { statusCode, response } = errorResponse(error);

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(getSessionUser(session), null, null, error instanceof Error ? error.message : "Unknown error");
    }

    return response;
  }
}
