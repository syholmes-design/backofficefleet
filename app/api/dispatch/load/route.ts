import { auth } from "@/auth";
import { createLoad, type CreateLoadPayload } from "@/lib/services/loadService";

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

function getRequiredString(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }
  return value.trim();
}

function getOptionalString(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value !== "string") {
    throw Object.assign(new Error(`${fieldName} must be a string`), { statusCode: 422 });
  }
  return value;
}

function assertAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const invalidFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    throw Object.assign(new Error(`Invalid fields: ${invalidFields.join(", ")}`), { statusCode: 422 });
  }
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request);
    assertAllowedFields(body, [
      "fleetId",
      "customerName",
      "origin",
      "destination",
      "pickupWindowStart",
      "pickupWindowEnd",
      "deliveryWindowStart",
      "deliveryWindowEnd",
      "referenceNumber",
      "secondaryReferenceNumber",
      "status",
    ]);

    const load = await createLoad(getSessionUser(session), {
      fleetId: getRequiredString(body, "fleetId"),
      customerName: getRequiredString(body, "customerName"),
      origin: getRequiredString(body, "origin"),
      destination: getRequiredString(body, "destination"),
      pickupWindowStart: body.pickupWindowStart as CreateLoadPayload["pickupWindowStart"],
      pickupWindowEnd: body.pickupWindowEnd as CreateLoadPayload["pickupWindowEnd"],
      deliveryWindowStart: body.deliveryWindowStart as CreateLoadPayload["deliveryWindowStart"],
      deliveryWindowEnd: body.deliveryWindowEnd as CreateLoadPayload["deliveryWindowEnd"],
      referenceNumber: getOptionalString(body, "referenceNumber") as string | null | undefined,
      secondaryReferenceNumber: getOptionalString(body, "secondaryReferenceNumber") as string | null | undefined,
      status: getRequiredString(body, "status") as CreateLoadPayload["status"],
    });

    return NextResponse.json(load);
  } catch (error) {
    return errorResponse(error);
  }
}
