import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  cancelPickupAuthorization,
  getOptionalString,
  parseJsonBody,
  pickupErrorResponse,
  requireRouteUser,
} from "../../_shared";

export async function POST(request: NextRequest, context: { params: Promise<{ authorizationId: string }> }) {
  const session = await auth();
  const user = requireRouteUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { authorizationId } = await context.params;
    const body = await parseJsonBody(request);
    const result = await cancelPickupAuthorization(user, authorizationId, getOptionalString(body, "reason"));
    return NextResponse.json(result);
  } catch (error) {
    return pickupErrorResponse(error);
  }
}
