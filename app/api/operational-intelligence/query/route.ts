import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import {
  answerOperationalQuestion,
  OperationalIntelligenceError,
} from "@/lib/operational-intelligence/operationalIntelligenceService";
import { fleetVisibilityErrorResponse } from "@/lib/fleet-visibility/fleet-api-response";
import type { OperatingRecordType } from "@/lib/services/operatingRecordService";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    fleetId?: string;
    question?: string;
    context?: { recordType?: OperatingRecordType; recordId?: string; loadId?: string; driverId?: string };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const fleetId = String(body.fleetId ?? "").trim();
  const question = String(body.question ?? "").trim();
  if (!fleetId) return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 422 });
  if (question.length > 2000) return NextResponse.json({ error: "question is too long" }, { status: 422 });

  try {
    const answer = await answerOperationalQuestion(session.user as SessionUserLike, fleetId, question, body.context);
    return NextResponse.json(answer);
  } catch (error) {
    const fleetMapped = fleetVisibilityErrorResponse(error);
    if (fleetMapped) return fleetMapped;
    if (error instanceof OperationalIntelligenceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
