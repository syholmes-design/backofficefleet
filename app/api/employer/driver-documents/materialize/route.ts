import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { materializeEmployerDocument } from "@/lib/services/driverDocumentAuthorizationService";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { authorizationId?: string };
    if (!body.authorizationId) {
      return NextResponse.json({ error: "authorizationId is required" }, { status: 422 });
    }

    const result = await materializeEmployerDocument({
      sessionUser: session.user,
      authorizationId: body.authorizationId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
