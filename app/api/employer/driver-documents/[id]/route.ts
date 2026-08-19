import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getEmployerDocumentMaterialization } from "@/lib/services/driverDocumentAuthorizationService";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await getEmployerDocumentMaterialization({
      sessionUser: session.user,
      materializationId: id,
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
