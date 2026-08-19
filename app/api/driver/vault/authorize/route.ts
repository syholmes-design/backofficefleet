import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { authorizeDriverDocument, getDriverDocumentAuthorizationStatus } from "@/lib/services/driverDocumentAuthorizationService";

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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { documentId?: string; fleetId?: string };
    if (!body.documentId || !body.fleetId) {
      return NextResponse.json({ error: "documentId and fleetId are required" }, { status: 422 });
    }

    const result = await authorizeDriverDocument({
      sessionUser: session.user,
      documentId: body.documentId,
      fleetId: body.fleetId,
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
