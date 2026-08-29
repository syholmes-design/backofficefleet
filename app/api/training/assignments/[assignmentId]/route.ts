import { auth } from "@/auth";
import { TrainingAssignmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { RegulatoryKnowledgeError, updateTrainingAssignment } from "@/lib/services/regulatoryKnowledgeService";

export async function PATCH(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const { assignmentId } = await context.params;
  if (!body || typeof body.fleetId !== "string" || typeof body.status !== "string") return NextResponse.json({ error: "fleetId and status are required" }, { status: 422 });
  try {
    return NextResponse.json(await updateTrainingAssignment(session.user as SessionUserLike, { fleetId: body.fleetId, assignmentId, status: body.status as TrainingAssignmentStatus, knowledgeCheckStatus: typeof body.knowledgeCheckStatus === "string" ? body.knowledgeCheckStatus : undefined, acknowledge: body.acknowledge === true }));
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to update training assignment" }, { status: 500 });
  }
}
