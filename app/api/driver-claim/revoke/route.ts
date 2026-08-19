import { auth } from "@/auth";
import { revokeDriverClaim } from "@/lib/services/driverClaimService";

import { NextRequest, NextResponse } from "next/server";

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 409, 422]);

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

  return { statusCode, response: NextResponse.json({ error: message }, { status: statusCode }) };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { driverId?: string };
    if (!body.driverId || body.driverId.trim().length === 0) {
      return NextResponse.json({ error: "driverId is required" }, { status: 422 });
    }

    const result = await revokeDriverClaim({
      sessionUser: session.user,
      driverId: body.driverId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { response } = errorResponse(error);
    return response;
  }
}
