import { auth } from "@/auth";
import {
  ConditionCategory,
  ConditionImpact,
  ConditionSeverity,
} from "@prisma/client";
import {
  applyPreTripConditionAction,
  createPreTripCondition,
  getPreTripConditionBaseline,
} from "@/lib/services/preTripConditionWorkflowService";

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
    return undefined;
  }
  if (typeof value !== "string") {
    throw Object.assign(new Error(`${fieldName} must be a string`), { statusCode: 422 });
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

export async function GET(_request: NextRequest, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assignmentId } = await context.params;

  try {
    const baseline = await getPreTripConditionBaseline(getSessionUser(session), assignmentId);
    return NextResponse.json(baseline);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assignmentId } = await context.params;

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      throw Object.assign(new Error("Invalid JSON body"), { statusCode: 422 });
    }

    const operation = getRequiredString(body, "operation");

    if (operation === "APPLY_ACTION") {
      const action = getRequiredString(body, "action") as
        | "NO_CHANGE"
        | "CHANGED"
        | "REPAIRED_REMOVED"
        | "VERIFY_RESOLUTION"
        | "UNSURE";
      if (!["NO_CHANGE", "CHANGED", "REPAIRED_REMOVED", "VERIFY_RESOLUTION", "UNSURE"].includes(action)) {
        throw Object.assign(new Error("Invalid action"), { statusCode: 422 });
      }

      const result = await applyPreTripConditionAction(getSessionUser(session), {
        assignmentId,
        conditionThreadId: getRequiredString(body, "conditionThreadId"),
        action,
        notes: getOptionalString(body, "notes"),
        preTripHeaderId: getOptionalString(body, "preTripHeaderId"),
        preTripItemCode: getOptionalString(body, "preTripItemCode"),
      });
      return NextResponse.json(result);
    }

    if (operation === "CREATE_CONDITION") {
      const created = await createPreTripCondition(getSessionUser(session), {
        assignmentId,
        equipmentId: getRequiredString(body, "equipmentId"),
        title: getRequiredString(body, "title"),
        category:
          toEnumValue(ConditionCategory, getRequiredString(body, "category"), "category") ?? ConditionCategory.OTHER,
        severity:
          toEnumValue(ConditionSeverity, getRequiredString(body, "severity"), "severity") ??
          ConditionSeverity.MINOR,
        impact: toEnumValue(ConditionImpact, getOptionalString(body, "impact"), "impact"),
        notes: getOptionalString(body, "notes"),
        preTripHeaderId: getOptionalString(body, "preTripHeaderId"),
        preTripItemId: getOptionalString(body, "preTripItemId"),
      });
      return NextResponse.json(created, { status: 201 });
    }

    throw Object.assign(new Error("Unsupported operation"), { statusCode: 422 });
  } catch (error) {
    return errorResponse(error);
  }
}
