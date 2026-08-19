import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { updateDriverRequirementRecord } from "@/lib/services/requirementService";
import { logUnauthorizedAttempt } from "@/lib/services/intakeService";

export async function PATCH(request: NextRequest, context: { params: Promise<{ requirementId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requirementId } = await context.params;

  try {
    const body = (await request.json()) as {
      label?: string;
      isRequired?: boolean;
      dueDate?: string | null;
      expiresAt?: string | null;
      exceptionReason?: string | null;
    };

    const allowedFields = ["label", "isRequired", "dueDate", "expiresAt", "exceptionReason"];
    const invalidKeys = Object.keys(body).filter((key) => !allowedFields.includes(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: `Invalid fields: ${invalidKeys.join(", ")}` }, { status: 422 });
    }

    const requirement = await updateDriverRequirementRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      requirementId,
      payload: {
        label: body.label,
        isRequired: body.isRequired,
        dueDate: body.dueDate,
        expiresAt: body.expiresAt,
        exceptionReason: body.exceptionReason,
      },
    });

    return NextResponse.json(requirement);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, null, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
