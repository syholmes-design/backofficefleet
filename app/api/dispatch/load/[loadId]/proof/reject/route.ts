import { auth } from "@/auth";
import { rejectProofAndHoldSettlement } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const { loadId } = await context.params;
  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
    }
    const reason = typeof body.reason === "string" ? body.reason : "";
    const result = await rejectProofAndHoldSettlement(session.user, loadId, reason);
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
