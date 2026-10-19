import type { Prisma } from "@prisma/client";
import { requireRecruitingCandidateAccess } from "@/lib/recruiting-v2/candidate-access";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPipelineForPosition } from "@/lib/services/requisitionRecruitingBridge";
import {
  INTERVIEW_RECOMMENDATIONS,
  STRUCTURED_INTERVIEW_CATEGORIES,
  recommendationLabel,
  validateStructuredInterview,
  type InterviewCategoryResponse,
  type StructuredInterviewRecord,
} from "@/lib/recruiting/structured-interview";

type RouteContext = { params: Promise<{ candidateId: string }> };
type InterviewerInput = string | { name: string; role?: string; email?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInterviewers(value: unknown): InterviewerInput[] | null {
  if (!Array.isArray(value)) return null;
  const rows: InterviewerInput[] = [];
  for (const entry of value) {
      if (typeof entry === "string") {
        const normalized = normalizeString(entry);
        if (normalized) rows.push(normalized);
        continue;
      }
      if (isRecord(entry)) {
        const name = normalizeString(entry.name);
        if (!name) continue;
        rows.push({
          name,
          role: normalizeString(entry.role) || undefined,
          email: normalizeString(entry.email) || undefined,
        });
        continue;
      }
      const normalized = normalizeString(entry);
      if (normalized) rows.push(normalized);
  }
  return rows.length > 0 ? rows : null;
}

function parseInterviewDate(value: unknown): Date | null {
  const raw = normalizeString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeInterview(interview: {
  id: string;
  interviewCode: string;
  candidateId: string;
  positionId: string;
  scheduledFor: Date | null;
  interviewType: string;
  location: string;
  status: string;
  score: number | null;
  recommendation: string;
  interviewers: unknown;
  categoryScores: unknown;
  notes: string | null;
  auditTrail: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: interview.id,
    interviewCode: interview.interviewCode,
    candidateId: interview.candidateId,
    positionId: interview.positionId,
    interviewDate: interview.scheduledFor?.toISOString() ?? null,
    interviewType: interview.interviewType,
    location: interview.location,
    status: titleCaseEnum(interview.status),
    score: interview.score,
    recommendation: titleCaseEnum(interview.recommendation),
    interviewers: interview.interviewers,
    scores: interview.categoryScores,
    notes: interview.notes,
    auditTrail: interview.auditTrail,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

async function findCandidate(candidateWhere: Prisma.CandidateWhereUniqueInput) {
  return prisma.candidate.findUnique({
    where: candidateWhere,
    include: {
      position: true,
      interviews: { orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }] },
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const candidate = await findCandidate(candidateWhere);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      candidateId: candidate.candidateCode,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      homeLocation: candidate.homeLocation,
      cdlClass: candidate.cdlClass,
      cdlState: candidate.cdlState,
      cdlNumberMasked: candidate.cdlNumberMasked,
      activationStage: candidate.activationStage,
    },
    position: {
      id: candidate.position.id,
      positionCode: candidate.position.positionCode,
      title: candidate.position.title,
      homeTerminal: candidate.position.homeTerminal,
      freightType: candidate.position.freightType,
      primaryLanes: candidate.position.primaryLanes,
      compensation: candidate.position.compensation,
      description: candidate.position.description,
    },
    interviews: candidate.interviews.map(serializeInterview),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const candidate = await findCandidate(candidateWhere);

  if (!candidate || !candidate.positionId) {
    return NextResponse.json({ error: "Candidate or candidate position not found" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const interviewDate = parseInterviewDate(body.interviewDate);
  const interviewType = normalizeString(body.interviewType);
  const location = normalizeString(body.location);
  const interviewers = normalizeInterviewers(body.interviewers);

  if (!interviewDate) {
    return NextResponse.json({ error: "interviewDate must be a valid date" }, { status: 400 });
  }
  if (!interviewType) {
    return NextResponse.json({ error: "interviewType is required" }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }
  if (!interviewers) {
    return NextResponse.json({ error: "interviewers must contain at least one interviewer" }, { status: 400 });
  }

  const interview = await prisma.interview.create({
    data: {
      interviewCode: `INTV2-${candidate.candidateCode}-${Date.now()}`,
      candidateId: candidate.id,
      positionId: candidate.positionId,
      scheduledFor: interviewDate,
      interviewType,
      location,
      status: "SCHEDULED",
      interviewers,
      notes: typeof body.notes === "string" ? body.notes : JSON.stringify(body.notes ?? {}),
      categoryScores: body.scores ?? {},
      auditTrail: [
        {
          action: "INTERVIEW_SCHEDULED",
          candidateId: candidate.candidateCode,
          recordedAt: new Date().toISOString(),
        },
      ],
    },
  });

  return NextResponse.json(
    {
      ...serializeInterview(interview),
      candidate: {
        id: candidate.id,
        candidateId: candidate.candidateCode,
        fullName: candidate.fullName,
      },
      position: {
        id: candidate.position.id,
        positionCode: candidate.position.positionCode,
        title: candidate.position.title,
        homeTerminal: candidate.position.homeTerminal,
        freightType: candidate.position.freightType,
        primaryLanes: candidate.position.primaryLanes,
        compensation: candidate.position.compensation,
        description: candidate.position.description,
      },
    },
    { status: 201 },
  );
}
/**
 * Records a completed structured interview (lib/recruiting/structured-interview.ts, new 2026-10-19):
 * questions, responses, category evaluations, conditions and the recruiter's recommendation. The
 * recommendation is stored on the Interview record, where the qualification engine already reads it.
 * Completes the latest scheduled interview, or records a new completed interview when none is scheduled.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidate = await findCandidate(access.access.where);
  if (!candidate || !candidate.positionId) {
    return NextResponse.json({ error: "Candidate or candidate position not found" }, { status: 400 });
  }
  if (candidate.dispositionStatus !== "ACTIVE") {
    return NextResponse.json({ error: `Candidate is ${candidate.dispositionStatus.toLowerCase()}; reopen the candidate before interviewing.` }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isRecord(body) || !isRecord(body.questionnaire)) {
    return NextResponse.json({ error: "questionnaire is required" }, { status: 400 });
  }
  const q = body.questionnaire;
  const recommendation = INTERVIEW_RECOMMENDATIONS.find((item) => item.value === q.recommendation)?.value ?? null;
  const categories: InterviewCategoryResponse[] = Array.isArray(q.categories)
    ? q.categories.filter(isRecord).map((item) => ({
        key: normalizeString(item.key),
        responses: Array.isArray(item.responses) ? item.responses.map((r) => normalizeString(r)) : [],
        evaluation: (["MEETS", "MEETS_WITH_CONDITIONS", "CONCERN", "NOT_ASSESSED"].includes(String(item.evaluation)) ? item.evaluation : "NOT_ASSESSED") as InterviewCategoryResponse["evaluation"],
        notes: normalizeString(item.notes),
      }))
    : [];
  const conditions = normalizeString(q.conditions);
  const decisionNotes = normalizeString(q.decisionNotes);
  const interviewer = normalizeString(q.interviewer);
  const errors = validateStructuredInterview({ categories, recommendation, conditions, decisionNotes, interviewer });
  if (errors.length || !recommendation) {
    return NextResponse.json({ error: errors[0] ?? "Choose a recommendation.", errors }, { status: 400 });
  }

  const completedAt = new Date().toISOString();
  const record: StructuredInterviewRecord = { version: "bof-structured-interview-v1", categories, recommendation, conditions, decisionNotes, interviewer, completedAt };
  const categoryScores = categories.map((item) => ({ label: STRUCTURED_INTERVIEW_CATEGORIES.find((c) => c.key === item.key)?.label ?? item.key, evaluation: item.evaluation, notes: item.notes }));
  const scheduled = await prisma.interview.findFirst({
    where: { candidateId: candidate.id, status: "SCHEDULED" },
    orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
  });
  const audit = { action: "INTERVIEW_COMPLETED", candidateId: candidate.candidateCode, recommendation, interviewer, recordedAt: completedAt };
  const data = {
    status: "COMPLETED" as const,
    recommendation,
    questionnaire: record as unknown as Prisma.InputJsonValue,
    categoryScores: categoryScores as unknown as Prisma.InputJsonValue,
    notes: decisionNotes || conditions || null,
  };
  const interview = scheduled
    ? await prisma.interview.update({
        where: { id: scheduled.id },
        data: { ...data, auditTrail: [...(Array.isArray(scheduled.auditTrail) ? scheduled.auditTrail : []), audit] as Prisma.InputJsonValue },
      })
    : await prisma.interview.create({
        data: {
          ...data,
          interviewCode: `INTV2-${candidate.candidateCode}-${Date.now()}`,
          candidateId: candidate.id,
          positionId: candidate.positionId,
          scheduledFor: new Date(completedAt),
          interviewType: "Structured driver interview",
          location: normalizeString(body.location) || "Recorded in Recruiting & Onboarding",
          interviewers: [interviewer],
          auditTrail: [audit],
        },
      });
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      auditTrail: [
        ...(Array.isArray(candidate.auditTrail) ? candidate.auditTrail : []),
        `Structured interview recorded by ${interviewer}: ${recommendationLabel(recommendation)} (${completedAt})`,
      ] as Prisma.InputJsonValue,
    },
  });
  await syncPipelineForPosition(candidate.positionId);
  return NextResponse.json(serializeInterview(interview));
}
