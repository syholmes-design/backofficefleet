import { auth } from "@/auth";
import { recordDriverEligibilityReview } from "@/lib/services/driverEligibilityReviewService";
import { NextRequest, NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest, context: { params: Promise<{ driverId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const { driverId } = await context.params;
  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
    }
    const disposition = body.disposition === "ELIGIBLE" || body.disposition === "INELIGIBLE" ? body.disposition : null;
    const reason = typeof body.reason === "string" ? body.reason : "";
    if (!disposition) {
      return NextResponse.json({ error: "disposition must be ELIGIBLE or INELIGIBLE" }, { status: 422 });
    }
    const result = await recordDriverEligibilityReview(session.user, driverId, disposition, reason);
    return NextResponse.json(result);
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    const message =
      statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 422
        ? error instanceof Error
          ? error.message
          : "Request failed"
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
