import { NextRequest, NextResponse } from "next/server";

import { recruitingErrorResponse, recruitingSessionUser } from "@/lib/recruiting/api-helpers";
import { getAuthorizedRequisition } from "@/lib/services/requisitionService";
import { openRecruitingPositionForRequisition } from "@/lib/services/requisitionRecruitingBridge";

type RouteContext = { params: Promise<{ requisitionId: string }> };

/** Opens the recruiting position for a requisition approved before approval opened it automatically. */
export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await recruitingSessionUser();
  if (session.response) return session.response;
  const { requisitionId } = await context.params;
  try {
    await getAuthorizedRequisition(session.user, requisitionId);
    const position = await openRecruitingPositionForRequisition(requisitionId, session.user);
    return NextResponse.json({ positionId: position.id, positionCode: position.positionCode }, { status: 201 });
  } catch (error) {
    return recruitingErrorResponse(error);
  }
}
