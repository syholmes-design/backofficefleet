import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readJsonObject, text } from "@/lib/recruiting/api-helpers";
import { requireRecruitingCandidateAccess } from "@/lib/recruiting-v2/candidate-access";
import { CONFIRMATION_REQUIREMENTS, applicationScreenPasses } from "@/lib/recruiting/requisition-screening";
import { requisitionScreeningForCandidate, syncPipelineForPosition } from "@/lib/services/requisitionRecruitingBridge";

type RouteContext = { params: Promise<{ candidateCode: string }> };

/**
 * Screening against the originating requisition.
 *   { action: "screen" }                      evaluate; passes the application review when no hard requirement fails
 *   { action: "confirm", key, notes? }        record a recruiter confirmation (PSP, drug test, TSA, equipment)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateCode } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateCode);
  if (access.response) return access.response;
  const target = await prisma.candidate.findUnique({ where: access.access.where, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const body = await readJsonObject(request);
  const action = text(body?.action);
  const actor = access.access.user.email ?? access.access.user.id ?? "recruiter";

  const context0 = await requisitionScreeningForCandidate(target.id);
  if (!context0) return NextResponse.json({ error: "Candidate is not attached to a requisition" }, { status: 422 });
  const { candidate } = context0;
  if (candidate.dispositionStatus !== "ACTIVE") return NextResponse.json({ error: `Candidate is ${candidate.dispositionStatus.toLowerCase()}` }, { status: 400 });
  const summary = { ...((candidate.applicationSummary ?? {}) as Record<string, unknown>) };
  const audit = Array.isArray(candidate.auditTrail) ? [...candidate.auditTrail] : [];
  const now = new Date().toISOString();

  if (action === "confirm") {
    const key = text(body?.key);
    if (!(CONFIRMATION_REQUIREMENTS as readonly string[]).includes(key)) return NextResponse.json({ error: "Unknown confirmation requirement" }, { status: 400 });
    const screening = { ...((summary.screening ?? {}) as Record<string, unknown>) };
    screening.confirmations = { ...((screening.confirmations ?? {}) as Record<string, unknown>), [key]: { confirmedBy: actor, confirmedAt: now, notes: text(body?.notes) || null } };
    summary.screening = screening;
    audit.push(`Screening confirmation "${key}" recorded by ${actor} at ${now}`);
    await prisma.candidate.update({ where: { id: candidate.id }, data: { applicationSummary: summary as Prisma.InputJsonValue, auditTrail: audit as Prisma.InputJsonValue } });
  } else if (action === "screen") {
    const passes = applicationScreenPasses(context0.evaluation);
    audit.push(
      `Screened against ${context0.publicNumber} by ${actor} at ${now}: ${passes ? "application review passed" : `failed (${context0.evaluation.blocking.join("; ")})`}`,
    );
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        ...(passes ? { applicationStatus: "COMPLETE" as const } : {}),
        auditTrail: audit as Prisma.InputJsonValue,
      },
    });
    await syncPipelineForPosition(candidate.positionId);
    if (!passes) {
      return NextResponse.json({ error: `Screening failed: ${context0.evaluation.blocking[0]}`, evaluation: context0.evaluation }, { status: 422 });
    }
  } else {
    return NextResponse.json({ error: "action must be screen or confirm" }, { status: 400 });
  }
  const refreshed = await requisitionScreeningForCandidate(candidate.id);
  return NextResponse.json({ evaluation: refreshed?.evaluation ?? null });
}
