import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  getOptionalString,
  parseJsonBody,
  pickupErrorResponse,
  reconcilePickupPhysicalArrival,
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
    const token = getOptionalString(body, "token");
    if (!token) {
      throw Object.assign(new Error("token is required"), { statusCode: 422 });
    }
    const intendedDisposition = getOptionalString(body, "intendedDisposition");
    if (intendedDisposition && intendedDisposition !== "RELEASE" && intendedDisposition !== "STOP") {
      throw Object.assign(new Error("intendedDisposition must be RELEASE or STOP"), { statusCode: 422 });
    }
    const result = await reconcilePickupPhysicalArrival(user, authorizationId, {
      token,
      method: getOptionalString(body, "method"),
      evidenceReference: getOptionalString(body, "evidenceReference"),
      intendedDisposition: intendedDisposition as "RELEASE" | "STOP" | null,
      stopReason: getOptionalString(body, "stopReason"),
      arriving: {
        authorizationId: getOptionalString(body, "arrivingAuthorizationId"),
        loadId: getOptionalString(body, "arrivingLoadId"),
        driverId: getOptionalString(body, "arrivingDriverId"),
        tractorId: getOptionalString(body, "arrivingTractorId"),
        trailerId: getOptionalString(body, "arrivingTrailerId"),
        tractorUnitNumber: getOptionalString(body, "arrivingTractorUnitNumber"),
        trailerUnitNumber: getOptionalString(body, "arrivingTrailerUnitNumber"),
        vin: getOptionalString(body, "arrivingVin"),
        plate: getOptionalString(body, "arrivingPlate"),
        qr: getOptionalString(body, "arrivingQr"),
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return pickupErrorResponse(error);
  }
}
