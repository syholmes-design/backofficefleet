import { NextRequest, NextResponse } from "next/server";

import { readJsonObject, recruitingErrorResponse, recruitingSessionUser, text } from "@/lib/recruiting/api-helpers";
import { attachCandidateToPosition, requireRecruitingPosition } from "@/lib/services/requisitionRecruitingBridge";

type RouteContext = { params: Promise<{ positionId: string }> };

/** Attaches a candidate to a recruiting position (and so to its originating requisition). */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await recruitingSessionUser();
  if (session.response) return session.response;
  const { positionId } = await context.params;
  try {
    const position = await requireRecruitingPosition(session.user, positionId);
    const body = await readJsonObject(request);
    if (!body) return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });

    const fullName = text(body.fullName);
    const email = text(body.email).toLowerCase();
    const cdlClass = text(body.cdlClass);
    if (!fullName) return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (!cdlClass) return NextResponse.json({ error: "cdlClass is required" }, { status: 400 });

    const experienceYears = Number(body.experienceYears);
    const candidate = await attachCandidateToPosition(position, {
      fullName,
      email,
      phone: text(body.phone),
      homeLocation: text(body.homeLocation),
      cdlClass,
      cdlState: text(body.cdlState),
      cdlNumber: text(body.cdlNumber) || text(body.cdlNumberMasked),
      experienceYears: Number.isFinite(experienceYears) ? experienceYears : null,
      endorsements: Array.isArray(body.endorsements) ? body.endorsements.map(text).filter(Boolean) : text(body.endorsements).split(",").map((e) => e.trim()).filter(Boolean),
      equipmentExperience: text(body.equipmentExperience) || null,
      source: text(body.source) || "Recruiter attached in Recruiting & Onboarding",
      attachedBy: session.user.email ?? session.user.id ?? "recruiter",
    });
    return NextResponse.json({ candidateCode: candidate.candidateCode }, { status: 201 });
  } catch (error) {
    return recruitingErrorResponse(error);
  }
}
