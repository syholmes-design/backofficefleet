import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  createAuthenticatedDriverVaultDocument,
  getAuthenticatedDriverVaultStatus,
} from "@/lib/services/driverDocumentVersioningService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getAuthenticatedDriverVaultStatus(session.user);
    return NextResponse.json(result);
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
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
    const formData = await request.formData();
    const document = await createAuthenticatedDriverVaultDocument(session.user, formData);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
