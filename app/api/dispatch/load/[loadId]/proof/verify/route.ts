import { auth } from "@/auth";
import {
  listStoredLoadProofs,
  proofRouteStatus,
  verifyStoredLoadProof,
} from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(error: unknown) {
  const statusCode = proofRouteStatus(error);
  const message =
    statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 409 || statusCode === 422
      ? error instanceof Error
        ? error.message
        : "Request failed"
      : "Internal server error";
  return NextResponse.json({ error: message }, { status: statusCode });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const { loadId } = await context.params;
  try {
    return NextResponse.json(await listStoredLoadProofs(session.user, loadId));
  } catch (error) {
    return errorResponse(error);
  }
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
    const proofId = typeof body.proofId === "string" ? body.proofId : "";
    const result = await verifyStoredLoadProof(session.user, loadId, proofId, body.confirm === true);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
