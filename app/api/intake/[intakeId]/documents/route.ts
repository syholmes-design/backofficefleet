import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { createDriverDocumentRecord, listDriverDocumentsForIntake } from "@/lib/services/documentService";
import { logUnauthorizedAttempt } from "@/lib/services/intakeService";

export async function POST(request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const body = (await request.json()) as {
      fleetId?: string;
      driverId?: string;
      documentType?: string;
      storageKey?: string;
      originalFileName?: string;
      mimeType?: string | null;
      checksum?: string | null;
      metadata?: Record<string, unknown> | null;
    };

    const document = await createDriverDocumentRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      intakeId,
      fleetId: body.fleetId,
      payload: {
        driverId: body.driverId,
        documentType: body.documentType,
        storageKey: body.storageKey,
        originalFileName: body.originalFileName,
        mimeType: body.mimeType,
        checksum: body.checksum,
        metadata: body.metadata,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, intakeId, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const docs = await listDriverDocumentsForIntake(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, intakeId);
    return NextResponse.json(docs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, intakeId, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
