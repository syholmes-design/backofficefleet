import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedIntake, logUnauthorizedAttempt, updateDriverIntakeRecord } from "@/lib/services/intakeService";

export async function GET(_request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const access = await getAuthorizedIntake(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, intakeId);
    if (!access.intake) {
      return NextResponse.json({ error: "DriverIntake not found" }, { status: 404 });
    }
    if (!access.allowed) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, access.intake.fleetId, intakeId, "TENANT_ACCESS_DENIED");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(access.intake);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const body = (await request.json()) as {
      stage?: string;
      status?: string;
      notes?: string | null;
      submittedAt?: string | null;
      approvedAt?: string | null;
      rejectedAt?: string | null;
    };

    const allowedFields = ["stage", "status", "notes", "submittedAt", "approvedAt", "rejectedAt"];
    const extraKeys = Object.keys(body).filter((key) => !allowedFields.includes(key));
    if (extraKeys.length > 0) {
      return NextResponse.json({ error: `Invalid fields: ${extraKeys.join(", ")}` }, { status: 422 });
    }

    const revised = await updateDriverIntakeRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      intakeId,
      payload: {
        stage: body.stage,
        status: body.status,
        notes: body.notes,
        submittedAt: body.submittedAt,
        approvedAt: body.approvedAt,
        rejectedAt: body.rejectedAt,
      },
    });

    return NextResponse.json(revised);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, intakeId, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
