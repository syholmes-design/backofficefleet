import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { createDraftRequisition, listRequisitionsForUser, logRequisitionUnauthorized } from "@/lib/services/requisitionService";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

function errorResponse(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
  const message = error instanceof Error ? error.message : "Unknown error";
  return { statusCode, message };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestedFleetId = new URL(request.url).searchParams.get("fleetId");
  try {
    const records = await listRequisitionsForUser(session.user as RouteSessionUser, requestedFleetId);
    return NextResponse.json(records);
  } catch (error) {
    const { statusCode, message } = errorResponse(error);
    if (statusCode === 403) {
      await logRequisitionUnauthorized(session.user as RouteSessionUser, requestedFleetId, null, message);
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { fleetId?: string };
    const created = await createDraftRequisition({
      sessionUser: session.user as RouteSessionUser,
      fleetId: body.fleetId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { statusCode, message } = errorResponse(error);
    if (statusCode === 401 || statusCode === 403) {
      await logRequisitionUnauthorized(session.user as RouteSessionUser, null, null, message);
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
