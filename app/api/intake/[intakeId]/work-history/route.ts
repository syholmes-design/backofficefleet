import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import type { SessionUserLike } from "@/lib/authorization";
import { validateWorkHistoryInput } from "@/lib/qualification/work-history-input";
import { listWorkHistory, recordWorkHistory } from "@/lib/services/workHistoryService";

type RouteContext = { params: Promise<{ intakeId: string }> };

function errorResponse(error: unknown) {
  const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 500;
  if ([403, 404, 422].includes(statusCode)) return NextResponse.json({ error: (error as Error).message }, { status: statusCode });
  return NextResponse.json({ error: "Employment history could not be saved." }, { status: 500 });
}

/** Employment history recorded on a driver's qualification intake. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { intakeId } = await context.params;
  try {
    const { rows, canEdit } = await listWorkHistory(session.user as SessionUserLike, intakeId);
    return NextResponse.json({ workHistory: rows, canEdit });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Records an employer and re-runs the driver's qualification and readiness evaluation. */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { intakeId } = await context.params;
  const body = await request.json().catch(() => null);
  const { input, errors } = validateWorkHistoryInput(body);
  if (!input) return NextResponse.json({ error: errors[0], errors }, { status: 422 });
  try {
    const { row, evaluation } = await recordWorkHistory(session.user as SessionUserLike, intakeId, input);
    return NextResponse.json(
      {
        workHistory: row,
        qualificationStatus: evaluation?.qualificationStatus ?? null,
        readinessStatus: evaluation?.readinessStatus ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
