import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { createTrainingAssignment, listTrainingAssignments, RegulatoryKnowledgeError } from "@/lib/services/regulatoryKnowledgeService";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const fleetId = params.get("fleetId");
  if (!fleetId) return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
  try {
    return NextResponse.json(await listTrainingAssignments(session.user as SessionUserLike, fleetId, params.get("driverId") ?? undefined));
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to load training assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.fleetId !== "string" || typeof body.driverId !== "string" || typeof body.trainingModuleId !== "string") return NextResponse.json({ error: "fleetId, driverId, and trainingModuleId are required" }, { status: 422 });
  try {
    return NextResponse.json(await createTrainingAssignment(session.user as SessionUserLike, { fleetId: body.fleetId, driverId: body.driverId, trainingModuleId: body.trainingModuleId, requirementVersionId: typeof body.requirementVersionId === "string" ? body.requirementVersionId : undefined, dueAt: typeof body.dueAt === "string" ? body.dueAt : undefined, reason: typeof body.reason === "string" ? body.reason : undefined }), { status: 201 });
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to create training assignment" }, { status: 500 });
  }
}
