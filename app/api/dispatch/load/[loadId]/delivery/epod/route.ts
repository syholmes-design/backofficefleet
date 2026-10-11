import { auth } from "@/auth";
import { generateEpod } from "@/lib/services/epod/epodPersistence";
import { proofRouteStatus } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId } = await context.params;
  try {
    const result = await generateEpod(session.user, loadId);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    const status = proofRouteStatus(error);
    return NextResponse.json({ error: status >= 500 ? "Internal server error" : error instanceof Error ? error.message : "Request failed" }, { status });
  }
}
