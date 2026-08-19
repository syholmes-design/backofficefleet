import { auth } from "@/auth";
import { startPreTrip } from "@/lib/services/preTripService";

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

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const preTrip = await startPreTrip(getSessionUser(session), id);
    return NextResponse.json(preTrip);
  } catch (error) {
    return errorResponse(error);
  }
}
