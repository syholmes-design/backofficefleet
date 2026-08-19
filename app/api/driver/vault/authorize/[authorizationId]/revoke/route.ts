import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { revokeDriverDocumentAuthorization } from "@/lib/services/driverDocumentAuthorizationService";

export async function POST(_request: NextRequest, context: { params: Promise<{ authorizationId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { authorizationId } = await context.params;
    const result = await revokeDriverDocumentAuthorization({
      sessionUser: session.user,
      authorizationId,
    });
    return NextResponse.json(result);
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
