import { auth } from "@/auth";
import { saveCargoPhoto } from "@/lib/services/epod/epodPersistence";
import { proofRouteStatus } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId } = await context.params;
  try {
    const body = (await request.json()) as {
      role?: string;
      image?: string;
      mimeType?: string;
      storageKey?: string;
      documentId?: string;
      capturedAt?: string;
    };
    const result = await saveCargoPhoto(session.user, loadId, body.role ?? "", body.image ?? "", body.mimeType ?? "", {
      storageKey: body.storageKey,
      documentId: body.documentId,
      capturedAt: body.capturedAt,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = proofRouteStatus(error);
    return NextResponse.json({ error: status >= 500 ? "Internal server error" : error instanceof Error ? error.message : "Request failed" }, { status });
  }
}
