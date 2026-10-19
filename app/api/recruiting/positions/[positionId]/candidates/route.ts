import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readJsonObject, recruitingErrorResponse, recruitingSessionUser, text } from "@/lib/recruiting/api-helpers";
import { requireRecruitingPosition, syncPipelineForPosition } from "@/lib/services/requisitionRecruitingBridge";

type RouteContext = { params: Promise<{ positionId: string }> };

function maskCdl(value: string, state: string) {
  const digits = value.replace(/[^0-9A-Za-z]/g, "");
  if (!digits) return "";
  return `${state || "XX"}••••${digits.slice(-4)}`;
}

async function nextCandidateCode() {
  const existing = await prisma.candidate.findMany({ where: { candidateCode: { startsWith: "CAND-" } }, select: { candidateCode: true } });
  const max = existing.reduce((m, c) => Math.max(m, Number(c.candidateCode.slice(5)) || 0), 0);
  return `CAND-${String(max + 1).padStart(3, "0")}`;
}

/** Attaches a candidate to a recruiting position (and so to its originating requisition). */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await recruitingSessionUser();
  if (session.response) return session.response;
  const { positionId } = await context.params;
  try {
    const position = await requireRecruitingPosition(session.user, positionId);
    if (position.status === "CLOSED") return NextResponse.json({ error: "Position is closed" }, { status: 422 });
    const body = await readJsonObject(request);
    if (!body) return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });

    const fullName = text(body.fullName);
    const email = text(body.email).toLowerCase();
    const cdlClass = text(body.cdlClass);
    const cdlState = text(body.cdlState).toUpperCase().slice(0, 2);
    if (!fullName) return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (!cdlClass) return NextResponse.json({ error: "cdlClass is required" }, { status: 400 });
    const duplicate = await prisma.candidate.findFirst({ where: { positionId, email: { equals: email, mode: "insensitive" } }, select: { candidateCode: true } });
    if (duplicate) return NextResponse.json({ error: `This candidate is already attached as ${duplicate.candidateCode}` }, { status: 409 });

    const experienceYears = Number(body.experienceYears);
    const endorsements = Array.isArray(body.endorsements) ? body.endorsements.map(text).filter(Boolean) : text(body.endorsements).split(",").map((e) => e.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const requisitionNumber = position.requisition?.publicNumber ?? null;
    const candidate = await prisma.candidate.create({
      data: {
        candidateCode: await nextCandidateCode(),
        fullName,
        email,
        phone: text(body.phone),
        homeLocation: text(body.homeLocation),
        cdlClass,
        cdlState,
        cdlNumberMasked: maskCdl(text(body.cdlNumber) || text(body.cdlNumberMasked), cdlState),
        positionId,
        applicationSummary: {
          source: text(body.source) || "Recruiter attached in Recruiting & Onboarding",
          appliedDate: now.slice(0, 10),
          experienceYears: Number.isFinite(experienceYears) ? experienceYears : null,
          endorsements,
          equipmentExperience: text(body.equipmentExperience) || null,
          requisitionId: position.requisitionId,
          requisitionNumber,
          tenant: { fleetId: position.fleetId },
          screening: { confirmations: {} },
        } as Prisma.InputJsonValue,
        qualificationSummary: {},
        documentRequirements: [],
        complianceSummary: {},
        onboardingSummary: {},
        auditTrail: [`Attached to ${requisitionNumber ?? position.positionCode} (${position.title}) by ${session.user.email ?? session.user.id} at ${now}`],
      },
    });
    await syncPipelineForPosition(positionId);
    return NextResponse.json({ candidateCode: candidate.candidateCode }, { status: 201 });
  } catch (error) {
    return recruitingErrorResponse(error);
  }
}
