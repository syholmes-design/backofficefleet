import { auth } from "@/auth";
import { createDispatchReleaseWithMovementAuthorization } from "@/lib/services/dispatchReleaseService";

import { NextRequest, NextResponse } from "next/server";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};
type RouteSession = { user?: RouteSessionUser | null };

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 409, 422]);

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

  return NextResponse.json({ error: message }, { status: statusCode });
}

export async function POST(_request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { loadId } = await context.params;

  try {
    const sessionUser = getSessionUser(session);
    const { movement, release } = await createDispatchReleaseWithMovementAuthorization(sessionUser, loadId, "RELEASE");

    const status = movement.allowed ? 200 : 409;
    return NextResponse.json(
      {
        ...release,
        movementAuthorization: {
          allowed: movement.allowed,
          disposition: movement.disposition,
          reasonCodes: movement.reasonCodes,
          policyVersion: movement.policyVersion,
          driverQualificationStatus: movement.driverQualificationStatus,
        },
      },
      { status },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
