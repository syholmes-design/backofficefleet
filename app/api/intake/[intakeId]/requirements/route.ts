import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { createDriverRequirementRecord, listDriverRequirementsForIntake } from "@/lib/services/requirementService";
import { logUnauthorizedAttempt } from "@/lib/services/intakeService";

export async function POST(request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const body = (await request.json()) as {
      requirementType?: string;
      label?: string;
      isRequired?: boolean;
      dueDate?: string | null;
      expiresAt?: string | null;
      exceptionReason?: string | null;
    };

    const requirement = await createDriverRequirementRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      intakeId,
      payload: {
        requirementType: body.requirementType,
        label: body.label,
        isRequired: body.isRequired,
        dueDate: body.dueDate,
        expiresAt: body.expiresAt,
        exceptionReason: body.exceptionReason,
      },
    });

    return NextResponse.json(requirement, { status: 201 });
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
    const rows = await listDriverRequirementsForIntake(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, intakeId);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, intakeId, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
