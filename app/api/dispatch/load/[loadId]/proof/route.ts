import { auth } from "@/auth";
import { assertEpodEnabled } from "@/lib/services/epod/deliveryLifecycle";
import { proofRouteStatus, submitReceivedLoadProof } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(error: unknown) {
  const statusCode = proofRouteStatus(error);
  const message =
    statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 409 || statusCode === 422 || statusCode === 503
      ? error instanceof Error
        ? error.message
        : "Request failed"
      : "Internal server error";
  return NextResponse.json({ error: message }, { status: statusCode });
}

export async function POST(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  try {
    assertEpodEnabled();
  } catch (error) {
    return errorResponse(error);
  }
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
    const proofType = typeof body.proofType === "string" ? body.proofType : "";
    const evidenceId = typeof body.evidenceId === "string" ? body.evidenceId : "";
    if (typeof body.documentId === "string" && body.documentId.trim()) {
      return NextResponse.json(
        { error: "A document id is not an authorized delivery-evidence reference." },
        { status: 422 },
      );
    }
    const result = await submitReceivedLoadProof(session.user, loadId, proofType, evidenceId);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
