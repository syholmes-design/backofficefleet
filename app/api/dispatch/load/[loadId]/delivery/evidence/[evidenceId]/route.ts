import { auth } from "@/auth";
import { openEpodEvidence } from "@/lib/services/epod/epodPersistence";
import { proofRouteStatus } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, context: { params: Promise<{ loadId: string; evidenceId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId, evidenceId } = await context.params;
  try {
    const file = await openEpodEvidence(session.user, loadId, evidenceId);
    return new NextResponse(Buffer.from(file.bytes), {
      status: 200,
      headers: { "Content-Type": file.mimeType, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = proofRouteStatus(error);
    return NextResponse.json({ error: status >= 500 ? "Internal server error" : error instanceof Error ? error.message : "Request failed" }, { status });
  }
}
