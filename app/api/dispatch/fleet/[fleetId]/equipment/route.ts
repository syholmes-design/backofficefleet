import { auth } from "@/auth";
import { listEquipmentForFleet } from "@/lib/services/equipmentService";

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

export async function GET(_request: NextRequest, context: { params: Promise<{ fleetId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fleetId } = await context.params;

  try {
    const equipment = await listEquipmentForFleet(getSessionUser(session), fleetId);
    return NextResponse.json(equipment);
  } catch (error) {
    return errorResponse(error);
  }
}
