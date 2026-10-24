import { auth } from "@/auth";
import { getFleetEnforcementStatus, setFleetEnforcementMode } from "@/lib/services/stage0EnforcementConfigService";

import { NextRequest, NextResponse } from "next/server";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

const CONTROLLED_ERROR_STATUSES = new Set([401, 403, 404, 409, 422]);

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
      : CONTROLLED_ERROR_STATUSES.has(statusCode) && error instanceof Error
        ? error.message
        : "Internal server error";
  const code = error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : undefined;
  return NextResponse.json(typeof code === "string" ? { error: message, code } : { error: message }, { status: statusCode });
}

/** Effective enforcement mode for a fleet (any active member); configuration and history for BOF roles and the fleet admin. */
export async function GET(_request: NextRequest, context: { params: Promise<{ fleetId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { fleetId } = await context.params;
    return NextResponse.json(await getFleetEnforcementStatus(session.user as RouteSessionUser, fleetId));
  } catch (error) {
    return errorResponse(error);
  }
}

/** BOF_OPERATIONS / BOF_COMPLIANCE_REVIEW of the fleet only; authorization is re-read from the database. */
export async function PUT(request: NextRequest, context: { params: Promise<{ fleetId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { fleetId } = await context.params;
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw Object.assign(new Error("Invalid JSON body"), { statusCode: 422 });
    }
    const { mode, reason, ...extra } = body as Record<string, unknown>;
    if (Object.keys(extra).length > 0) {
      throw Object.assign(new Error(`Invalid fields: ${Object.keys(extra).join(", ")}`), { statusCode: 422 });
    }
    return NextResponse.json(await setFleetEnforcementMode(session.user as RouteSessionUser, fleetId, mode, reason));
  } catch (error) {
    return errorResponse(error);
  }
}
