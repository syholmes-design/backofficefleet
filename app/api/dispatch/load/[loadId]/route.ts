import { auth } from "@/auth";
import { getLoadById, updateLoad, type UpdateLoadPayload } from "@/lib/services/loadService";

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

export async function GET(_request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { loadId } = await context.params;

  try {
    const load = await getLoadById(getSessionUser(session), loadId);
    return NextResponse.json(load);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { loadId } = await context.params;

  try {
    const body = await parseJsonBody(request);
    const load = await updateLoad(getSessionUser(session), loadId, body as UpdateLoadPayload);
    return NextResponse.json(load);
  } catch (error) {
    return errorResponse(error);
  }
}
