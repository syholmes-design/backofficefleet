import {
  cancelPickupAuthorization,
  getPickupAuthorization,
  issuePickupAuthorization,
  listPickupAuthorizations,
  verifyPickupAuthorization,
} from "@/lib/services/pickupAuthorizationService";

import { NextRequest, NextResponse } from "next/server";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};
type RouteSession = { user?: RouteSessionUser | null };

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 409, 422, 501]);

function getSessionUser(session: RouteSession) {
  return session.user as RouteSessionUser;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pickupErrorResponse(error: unknown) {
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

  const payload =
    error && typeof error === "object" && "payload" in error
      ? (error as { payload?: Record<string, unknown> }).payload
      : undefined;

  return NextResponse.json(payload ? { error: message, ...payload } : { error: message }, { status: statusCode });
}

export function requireRouteUser(session: RouteSession | null) {
  if (!session?.user?.id) {
    return null;
  }
  return getSessionUser(session);
}

export async function parseJsonBody(request: NextRequest) {
  const body = await request.json();
  if (!isRecord(body)) {
    throw Object.assign(new Error("Invalid JSON body"), { statusCode: 422 });
  }
  return body;
}

export function getRequiredString(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }
  return value.trim();
}

export function getOptionalString(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw Object.assign(new Error(`${fieldName} must be a string when provided`), { statusCode: 422 });
  }
  return value.trim();
}

export {
  cancelPickupAuthorization,
  getPickupAuthorization,
  issuePickupAuthorization,
  listPickupAuthorizations,
  verifyPickupAuthorization,
};
