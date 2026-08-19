import { auth } from "@/auth";
import { unassign, type AssignmentClosureStatus } from "@/lib/services/dispatchAssignmentService";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseJsonBody(request: NextRequest) {
  const body = await request.json();
  if (!isRecord(body)) {
    throw Object.assign(new Error("Invalid JSON body"), { statusCode: 422 });
  }
  return body;
}

function assertAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const invalidFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    throw Object.assign(new Error(`Invalid fields: ${invalidFields.join(", ")}`), { statusCode: 422 });
  }
}

function getRequiredUnassignStatus(body: Record<string, unknown>) {
  const value = body.status;
  if (value !== "SUPERSEDED" && value !== "CANCELLED") {
    throw Object.assign(new Error("status must be SUPERSEDED or CANCELLED"), { statusCode: 422 });
  }
  return value as AssignmentClosureStatus;
}

function errorResponse(error: unknown) {
  const statusCode =
    error instanceof SyntaxError
      ? 422
      : error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;

  const message =
    error instanceof SyntaxError
      ? "Invalid JSON body"
      : CONTROLLED_ERROR_STATUSES.has(statusCode)
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
    const body = await parseJsonBody(request);
    assertAllowedFields(body, ["status"]);

    const assignment = await unassign(getSessionUser(session), assignmentId, getRequiredUnassignStatus(body));
    return NextResponse.json(assignment);
  } catch (error) {
    return errorResponse(error);
  }
}
