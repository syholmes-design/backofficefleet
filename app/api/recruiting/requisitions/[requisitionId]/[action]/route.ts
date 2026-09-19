import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { logRequisitionUnauthorized, transitionRequisition } from "@/lib/services/requisitionService";
import type { RequisitionAction } from "@/lib/recruiting/requisition-transitions";

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

async function handleAction(action: RequisitionAction, request: NextRequest, requisitionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { notes?: string };
    const updated = await transitionRequisition({
      sessionUser: session.user as RouteSessionUser,
      requisitionId,
      action,
      notes: body.notes,
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

export async function POST(request: NextRequest, context: { params: Promise<{ requisitionId: string; action: string }> }) {
  const { requisitionId, action } = await context.params;
  const allowed: RequisitionAction[] = ["submit", "review", "approve", "hold", "cancel", "fill"];
  if (!allowed.includes(action as RequisitionAction)) {
    return NextResponse.json({ error: "Unknown requisition action" }, { status: 404 });
  }
  return handleAction(action as RequisitionAction, request, requisitionId);
}
