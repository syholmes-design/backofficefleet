import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { transitionSambaFinding } from "@/lib/services/samba/sambaIntelligenceService";

export async function POST(request: NextRequest, context: { params: Promise<{ findingId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { findingId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = body.status;
    if (status !== "ACKNOWLEDGED" && status !== "RESOLVED" && status !== "DISMISSED") {
      return NextResponse.json({ error: "status must be ACKNOWLEDGED, RESOLVED, or DISMISSED" }, { status: 422 });
    }
    const result = await transitionSambaFinding(
      session.user,
      findingId,
      status,
      typeof body.reason === "string" ? body.reason : null,
    );
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
