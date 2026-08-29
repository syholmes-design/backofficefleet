import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { certifyTrainingAssignment, RegulatoryKnowledgeError } from "@/lib/services/regulatoryKnowledgeService";

export async function POST(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const { assignmentId } = await context.params;
  if (!body || typeof body.fleetId !== "string" || typeof body.outcome !== "string") return NextResponse.json({ error: "fleetId and outcome are required" }, { status: 422 });
  try {
    return NextResponse.json(await certifyTrainingAssignment(session.user as SessionUserLike, { fleetId: body.fleetId, assignmentId, outcome: body.outcome as "CERTIFIED" | "NOT_CERTIFIED" | "EXPIRED" | "REQUIRES_REVIEW", expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : undefined, notes: typeof body.notes === "string" ? body.notes : undefined }));
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to certify training assignment" }, { status: 500 });
  }
}
