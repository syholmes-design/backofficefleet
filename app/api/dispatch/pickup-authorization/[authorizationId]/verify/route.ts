import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  getOptionalString,
  parseJsonBody,
  pickupErrorResponse,
  requireRouteUser,
  verifyPickupAuthorization,
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
    const token = getOptionalString(body, "token");
    if (!token) {
      throw Object.assign(new Error("token is required"), { statusCode: 422 });
    }
    const result = await verifyPickupAuthorization(user, authorizationId, {
      token,
      method: getOptionalString(body, "method"),
      presented: {
        authorizationId: getOptionalString(body, "presentedAuthorizationId"),
        loadId: getOptionalString(body, "presentedLoadId"),
        driverId: getOptionalString(body, "presentedDriverId"),
        tractorEquipmentId: getOptionalString(body, "presentedTractorEquipmentId"),
        trailerEquipmentId: getOptionalString(body, "presentedTrailerEquipmentId"),
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return pickupErrorResponse(error);
  }
}
