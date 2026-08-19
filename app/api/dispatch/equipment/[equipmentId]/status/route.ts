import { auth } from "@/auth";
import { setEquipmentStatus } from "@/lib/services/equipmentService";

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

function getRequiredString(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }
  return value.trim();
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ equipmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { equipmentId } = await context.params;

  try {
    const body = await parseJsonBody(request);
    assertAllowedFields(body, ["status"]);

    const equipment = await setEquipmentStatus(getSessionUser(session), equipmentId, getRequiredString(body, "status") as never);
    return NextResponse.json(equipment);
  } catch (error) {
    return errorResponse(error);
  }
}
