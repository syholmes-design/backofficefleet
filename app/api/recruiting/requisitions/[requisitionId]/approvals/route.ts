import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { logRequisitionUnauthorized, recordRequisitionApproval } from "@/lib/services/requisitionService";

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

export async function POST(request: NextRequest, context: { params: Promise<{ requisitionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { requisitionId } = await context.params;
  try {
    const body = (await request.json()) as {
      approvalRole?: string;
      decision?: string;
      notes?: string;
      signatureName?: string;
      reviewerName?: string;
    };
    if (!body.approvalRole || !body.decision) {
      return NextResponse.json({ error: "approvalRole and decision are required" }, { status: 422 });
    }
    const updated = await recordRequisitionApproval({
      sessionUser: session.user as RouteSessionUser,
      requisitionId,
      approvalRole: body.approvalRole,
      decision: body.decision,
      notes: body.notes,
      signatureName: body.signatureName,
      reviewerName: body.reviewerName,
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
