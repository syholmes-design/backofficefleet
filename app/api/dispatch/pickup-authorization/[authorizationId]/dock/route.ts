import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { getPickupDockView, pickupErrorResponse, requireRouteUser } from "../../_shared";

export async function GET(_request: Request, context: { params: Promise<{ authorizationId: string }> }) {
  const session = await auth();
  const user = requireRouteUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { authorizationId } = await context.params;
    const result = await getPickupDockView(user, authorizationId);
    return NextResponse.json(result);
  } catch (error) {
    return pickupErrorResponse(error);
  }
}
