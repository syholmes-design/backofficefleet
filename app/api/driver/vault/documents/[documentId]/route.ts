import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  getAuthenticatedDriverVaultDocument,
  replaceAuthenticatedDriverVaultDocument,
} from "@/lib/services/driverDocumentVersioningService";

export async function GET(_request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const document = await getAuthenticatedDriverVaultDocument(session.user, documentId);
    return NextResponse.json(document);
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const formData = await request.formData();
    const document = await replaceAuthenticatedDriverVaultDocument(session.user, documentId, formData);
    return NextResponse.json(document);
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
