import { auth } from "@/auth";
import { handleComplianceReviewRequest } from "@/lib/services/stage0ComplianceReviewService";

import { NextRequest, NextResponse } from "next/server";

/**
 * Read-only BOF compliance review/export for one fleet. Requires an ACTIVE BOF_COMPLIANCE_REVIEW membership in that
 * fleet, re-read from the database; session-claimed roles are never trusted. Query: driverId, format=json|csv.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ fleetId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { fleetId } = await context.params;
  const url = new URL(request.url);
  const result = await handleComplianceReviewRequest(
    { id: session.user.id, email: session.user.email ?? null },
    fleetId,
    { driverId: url.searchParams.get("driverId"), format: url.searchParams.get("format") },
  );
  return new NextResponse(result.body, {
    status: result.status,
    headers: { "Content-Type": result.contentType, "Cache-Control": "no-store" },
  });
}
