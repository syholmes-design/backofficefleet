import { auth } from "@/auth";
import { RegulatoryRecordStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { RegulatoryKnowledgeError, searchRegulatoryKnowledge } from "@/lib/services/regulatoryKnowledgeService";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return NextResponse.json(await searchRegulatoryKnowledge({ query: params.get("query") ?? undefined, topic: params.get("topic") ?? undefined, citation: params.get("citation") ?? undefined, status: params.get("status") as RegulatoryRecordStatus | undefined, publicOnly: true }));
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUserLike;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.fleetId !== "string") return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
  const access = requireFleetAccess(user, body.fleetId, ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "BOF_ADMINISTRATION"]);
  if (!access.allowed) return NextResponse.json({ error: access.reason ?? "Forbidden" }, { status: 403 });
  try {
    const source = await prisma.regulatorySource.create({ data: { sourceType: String(body.sourceType ?? "REGULATION") as never, agency: String(body.agency ?? ""), title: String(body.sourceTitle ?? ""), sourceUrl: String(body.sourceUrl ?? ""), externalIdentifier: typeof body.externalIdentifier === "string" ? body.externalIdentifier : undefined } });
    const requirement = await prisma.regulatoryRequirement.create({ data: { sourceId: source.id, stableKey: String(body.stableKey ?? ""), title: String(body.title ?? ""), topic: String(body.topic ?? ""), cfrPart: typeof body.cfrPart === "string" ? body.cfrPart : undefined, section: typeof body.section === "string" ? body.section : undefined, subsection: typeof body.subsection === "string" ? body.subsection : undefined, versions: { create: { citation: String(body.citation ?? ""), summary: String(body.summary ?? ""), version: String(body.version ?? "1"), status: String(body.status ?? "CURRENT") as never, sourceUrl: String(body.sourceUrl ?? ""), effectiveDate: typeof body.effectiveDate === "string" ? new Date(body.effectiveDate) : undefined } } } });
    return NextResponse.json({ source, requirement }, { status: 201 });
  } catch (error) {
    if (error instanceof RegulatoryKnowledgeError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to create regulatory record" }, { status: 422 });
  }
}
