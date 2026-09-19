import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedRequisition, logRequisitionUnauthorized, updateDraftRequisition } from "@/lib/services/requisitionService";

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

export async function GET(_request: NextRequest, context: { params: Promise<{ requisitionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { requisitionId } = await context.params;
  try {
    const record = await getAuthorizedRequisition(session.user as RouteSessionUser, requisitionId);
    return NextResponse.json(record);
  } catch (error) {
    const { statusCode, message } = errorResponse(error);
    if (statusCode === 403) {
      await logRequisitionUnauthorized(session.user as RouteSessionUser, null, requisitionId, message);
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ requisitionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { requisitionId } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updated = await updateDraftRequisition({
      sessionUser: session.user as RouteSessionUser,
      requisitionId,
      body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const { statusCode, message } = errorResponse(error);
    if (statusCode === 403) {
      await logRequisitionUnauthorized(session.user as RouteSessionUser, null, requisitionId, message);
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
