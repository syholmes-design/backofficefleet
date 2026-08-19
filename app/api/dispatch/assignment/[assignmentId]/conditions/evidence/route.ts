import { auth } from "@/auth";
import { ConditionEvidenceKind, ConditionObservationSource } from "@prisma/client";
import { attachAssignmentConditionEvidence } from "@/lib/services/preTripConditionWorkflowService";

import { NextRequest, NextResponse } from "next/server";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};
type RouteSession = { user?: RouteSessionUser | null };

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 409, 422]);

function getSessionUser(session: RouteSession) {
  return session.user as RouteSessionUser;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const next = value.trim();
  return next.length > 0 ? next : undefined;
}

function toEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: string | undefined,
  fieldName: string,
) {
  if (!value) {
    return undefined;
  }
  if (!Object.values(enumObject).includes(value)) {
    throw Object.assign(new Error(`Invalid ${fieldName}`), { statusCode: 422 });
  }
  return value as T[keyof T];
}

function errorResponse(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;

  const message = CONTROLLED_ERROR_STATUSES.has(statusCode)
    ? error instanceof Error
      ? error.message
      : "Unknown error"
    : "Internal server error";

  return NextResponse.json({ error: message }, { status: statusCode });
}

export async function POST(request: NextRequest, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assignmentId } = await context.params;

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
      throw Object.assign(new Error("file is required"), { statusCode: 422 });
    }

    const conditionThreadId = parseOptionalString(formData.get("conditionThreadId"));
    if (!conditionThreadId) {
      throw Object.assign(new Error("conditionThreadId is required"), { statusCode: 422 });
    }

    const evidence = await attachAssignmentConditionEvidence(getSessionUser(session), {
      assignmentId,
      conditionThreadId,
      conditionEventId: parseOptionalString(formData.get("conditionEventId")),
      equipmentId: parseOptionalString(formData.get("equipmentId")),
      preTripHeaderId: parseOptionalString(formData.get("preTripHeaderId")),
      preTripItemId: parseOptionalString(formData.get("preTripItemId")),
      notes: parseOptionalString(formData.get("notes")),
      evidenceKind: toEnumValue(
        ConditionEvidenceKind,
        parseOptionalString(formData.get("evidenceKind")),
        "evidenceKind",
      ),
      observationSource: toEnumValue(
        ConditionObservationSource,
        parseOptionalString(formData.get("observationSource")),
        "observationSource",
      ),
      file: fileEntry,
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
