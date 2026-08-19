import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedDocument, updateDriverDocumentRecord } from "@/lib/services/documentService";
import { logUnauthorizedAttempt } from "@/lib/services/intakeService";

export async function GET(_request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const access = await getAuthorizedDocument(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, documentId);
    if (!access.document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!access.allowed) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, access.document.fleetId, access.document.driverIntakeId, "TENANT_ACCESS_DENIED");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(access.document);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;
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
    const body = (await request.json()) as {
      status?: string;
      verifiedByUserId?: string | null;
      verificationExpiresAt?: string | null;
      nextVerificationDueAt?: string | null;
      verificationSourceProvider?: string;
      rejectionReason?: string | null;
    };

    const allowedFields = [
      "status",
      "verifiedByUserId",
      "verificationExpiresAt",
      "nextVerificationDueAt",
      "verificationSourceProvider",
      "rejectionReason",
    ];
    const invalidKeys = Object.keys(body).filter((key) => !allowedFields.includes(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: `Invalid fields: ${invalidKeys.join(", ")}` }, { status: 422 });
    }

    const document = await updateDriverDocumentRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      documentId,
      payload: {
        status: body.status,
        verifiedByUserId: body.verifiedByUserId,
        verificationExpiresAt: body.verificationExpiresAt,
        nextVerificationDueAt: body.nextVerificationDueAt,
        verificationSourceProvider: body.verificationSourceProvider,
        rejectionReason: body.rejectionReason,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, null, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
