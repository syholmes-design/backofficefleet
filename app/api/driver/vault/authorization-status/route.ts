import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { getDriverDocumentAuthorizationStatus } from "@/lib/services/driverDocumentAuthorizationService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getDriverDocumentAuthorizationStatus(session.user);
    return NextResponse.json(result);
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
