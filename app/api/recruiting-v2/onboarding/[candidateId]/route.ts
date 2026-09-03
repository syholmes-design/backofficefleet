import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2ActivationReadiness } from "@/lib/recruiting-v2/activation-engine";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { normalizeRecruitingV2OfferSummary } from "@/lib/recruiting-v2/offer-engine";
import {
  buildRecruitingV2OnboardingChecklist,
  canCompleteRecruitingV2Onboarding,
  evaluateRecruitingV2Onboarding,
  isRecruitingV2OnboardingStatus,
  mapRecruitingV2OnboardingStatusToCandidateStatus,
  normalizeRecruitingV2OnboardingMetadata,
  type RecruitingV2OnboardingChecklistItem,
  type RecruitingV2OnboardingMetadata,
} from "@/lib/recruiting-v2/onboarding-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";

type RouteContext = { params: Promise<{ candidateId: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDateField(value: unknown, field: string): string | null | { error: string } {
  const raw = normalizeString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? { error: `${field} must be a valid date` } : parsed.toISOString();
}

function serializeDocumentRecord(record: {
  id: string;
  documentCode: string;
  candidateId: string;
  documentType: RecruitingV2DocumentType;
  status: RecruitingV2DocumentStatus;
  expirationDate: Date | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    documentCode: record.documentCode,
    candidateId: record.candidateId,
    documentType: record.documentType,
    status: record.status,
    expirationDate: record.expirationDate?.toISOString() ?? null,
    uploadedBy: record.uploadedBy,
    verifiedBy: record.verifiedBy,
    verificationNotes: record.verificationNotes,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
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
  interviewers: Prisma.JsonValue;
  categoryScores: Prisma.JsonValue;
  notes: string | null;
  auditTrail: Prisma.JsonValue;
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
    status: interview.status,
    score: interview.score,
    recommendation: interview.recommendation,
    interviewers: interview.interviewers,
    scores: interview.categoryScores,
    notes: interview.notes,
    auditTrail: interview.auditTrail,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

function normalizeChecklistInput(value: unknown): RecruitingV2OnboardingChecklistItem[] | { error: string } | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return { error: "onboardingChecklist must be an array when provided" };
  const rows: RecruitingV2OnboardingChecklistItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return { error: "onboardingChecklist entries must be objects" };
    const key = normalizeString(entry.key);
    const label = normalizeString(entry.label);
    const status = normalizeString(entry.status);
    if (!key || !label) return { error: "onboardingChecklist entries require key and label" };
    if (!["COMPLETE", "PENDING", "BLOCKED", "NOT_APPLICABLE"].includes(status)) return { error: "onboardingChecklist status is invalid" };
    rows.push({
      key,
      label,
      status: status as RecruitingV2OnboardingChecklistItem["status"],
      required: entry.required === false ? false : true,
      source: normalizeString(entry.source) || "Recruiting V2 onboarding API",
      reason: normalizeString(entry.reason) || "Onboarding checklist metadata updated.",
    });
  }
  return rows;
}

async function getOnboardingContext(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { candidateCode: candidateId },
    include: {
      position: true,
      documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] },
      interviews: { orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!candidate) return null;

  const documentRecords = candidate.documentRecords.map(serializeDocumentRecord);
  const documentGates = evaluateRecruitingV2DocumentGates(documentRecords);
  const latestInterview = getLatestRecruitingV2Interview(candidate.interviews.map(serializeInterview));
  const qualification = aggregateRecruitingV2Qualification({ candidate, documentGates, latestInterview });
  const offer = normalizeRecruitingV2OfferSummary(candidate.offerSummary);
  const onboarding = normalizeRecruitingV2OnboardingMetadata(candidate.onboardingSummary, candidate.onboardingStatus);
  const checklist = buildRecruitingV2OnboardingChecklist({ qualificationSummary: qualification.qualificationSummary, offer, documentGates, onboarding });
  const decision = evaluateRecruitingV2Onboarding({ qualificationSummary: qualification.qualificationSummary, offer, onboarding, checklist });
  const activationReadiness = evaluateRecruitingV2ActivationReadiness({
    qualificationSummary: qualification.qualificationSummary,
    qualificationRisks: qualification.operationalRisks,
    offer,
    onboarding: { ...onboarding, onboardingChecklist: checklist.filter((item) => item.status === "COMPLETE" || item.status === "PENDING").map((item) => ({ label: item.label, status: item.status === "COMPLETE" ? "COMPLETE" : "PENDING", source: item.source })) },
  });

  return { candidate, documentGates, latestInterview, qualification, offer, onboarding, checklist, decision, activationReadiness };
}

function onboardingPayload(context: NonNullable<Awaited<ReturnType<typeof getOnboardingContext>>>) {
  return {
    candidate: {
      id: context.candidate.id,
      candidateId: context.candidate.candidateCode,
      fullName: context.candidate.fullName,
      email: context.candidate.email,
      phone: context.candidate.phone,
      homeLocation: context.candidate.homeLocation,
      activationStage: context.candidate.activationStage,
      activationStatus: (context.candidate as { activationStatus?: string }).activationStatus ?? context.activationReadiness.activationStatus,
      auditTrail: context.candidate.auditTrail,
    },
    position: {
      id: context.candidate.position.id,
      positionCode: context.candidate.position.positionCode,
      title: context.candidate.position.title,
      homeTerminal: context.candidate.position.homeTerminal,
      freightType: context.candidate.position.freightType,
      primaryLanes: context.candidate.position.primaryLanes,
      compensation: context.candidate.position.compensation,
      description: context.candidate.position.description,
    },
    qualificationStatus: context.qualification.qualificationSummary.status,
    qualificationReason: context.qualification.qualificationSummary.reason,
    offerStatus: context.offer.offerStatus,
    onboardingStatus: context.decision.onboardingStatus,
    onboardingEligibility: {
      eligible: context.decision.onboardingEligible,
      reason: context.decision.onboardingEligible ? "Qualification is READY and offer is ACCEPTED." : context.decision.reason,
    },
    onboardingSummary: context.onboarding,
    onboardingChecklist: context.checklist,
    currentDecision: context.decision.currentDecision,
    blockingItems: context.decision.blockingItems,
    pendingItems: context.decision.pendingItems,
    completedItems: context.decision.completedItems,
    nextRequiredAction: context.decision.nextRequiredAction,
    actions: context.decision.actions,
    activationReadinessSummary: {
      activationStatus: context.activationReadiness.activationStatus,
      activationStage: context.activationReadiness.activationStage,
      ready: context.activationReadiness.ready,
      nextRequiredAction: context.activationReadiness.nextRequiredAction,
    },
    latestInterview: context.latestInterview,
    offerMetadata: context.offer,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const onboardingContext = await getOnboardingContext(candidateId);
  if (!onboardingContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  return NextResponse.json(onboardingPayload(onboardingContext));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const onboardingContext = await getOnboardingContext(candidateId);
  if (!onboardingContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isRecord(body)) return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });

  const targetStatus = normalizeString(body.onboardingStatus) || onboardingContext.onboarding.onboardingStatus;
  if (!isRecruitingV2OnboardingStatus(targetStatus)) return NextResponse.json({ error: "onboardingStatus is invalid" }, { status: 400 });

  const orientationDate = body.orientationDate === undefined ? onboardingContext.onboarding.orientationDate : parseDateField(body.orientationDate, "orientationDate");
  if (isRecord(orientationDate)) return NextResponse.json({ error: orientationDate.error }, { status: 400 });
  const orientationLocation = body.orientationLocation === undefined ? onboardingContext.onboarding.orientationLocation : normalizeString(body.orientationLocation) || null;
  const onboardingNotes = body.onboardingNotes === undefined ? onboardingContext.onboarding.onboardingNotes : normalizeString(body.onboardingNotes) || null;
  const checklistInput = normalizeChecklistInput(body.onboardingChecklist);
  if (isRecord(checklistInput)) return NextResponse.json({ error: checklistInput.error }, { status: 400 });

  const currentStatus = onboardingContext.onboarding.onboardingStatus;
  const eligible = onboardingContext.decision.onboardingEligible;
  if (!eligible && targetStatus !== "PENDING") return NextResponse.json({ error: onboardingContext.decision.blockingItems[0]?.requiredAction ?? "Onboarding is not eligible" }, { status: 400 });
  if (currentStatus === "PENDING" && targetStatus === "COMPLETE") return NextResponse.json({ error: "Invalid onboarding transition: PENDING to COMPLETE" }, { status: 400 });
  if (currentStatus === "COMPLETE" && targetStatus !== "COMPLETE") return NextResponse.json({ error: `Invalid onboarding transition: COMPLETE to ${targetStatus}` }, { status: 400 });
  if (currentStatus === "PENDING" && targetStatus !== "PENDING" && targetStatus !== "IN_PROGRESS") return NextResponse.json({ error: `Invalid onboarding transition: PENDING to ${targetStatus}` }, { status: 400 });
  if (currentStatus === "IN_PROGRESS" && targetStatus === "PENDING") return NextResponse.json({ error: "Invalid onboarding transition: IN_PROGRESS to PENDING" }, { status: 400 });

  const now = new Date().toISOString();
  const nextMetadata: RecruitingV2OnboardingMetadata = {
    onboardingStatus: targetStatus,
    orientationDate,
    orientationLocation,
    onboardingChecklist: checklistInput ?? onboardingContext.checklist,
    onboardingNotes,
    createdAt: onboardingContext.onboarding.createdAt ?? now,
    updatedAt: now,
  };
  const nextChecklist = buildRecruitingV2OnboardingChecklist({ qualificationSummary: onboardingContext.qualification.qualificationSummary, offer: onboardingContext.offer, documentGates: onboardingContext.documentGates, onboarding: nextMetadata });
  const nextDecision = evaluateRecruitingV2Onboarding({ qualificationSummary: onboardingContext.qualification.qualificationSummary, offer: onboardingContext.offer, onboarding: nextMetadata, checklist: nextChecklist });
  if (targetStatus === "COMPLETE" && !canCompleteRecruitingV2Onboarding(nextDecision)) {
    return NextResponse.json({ error: nextDecision.blockingItems[0]?.requiredAction ?? nextDecision.pendingItems[0]?.requiredAction ?? "Required onboarding checklist is incomplete" }, { status: 400 });
  }

  await prisma.candidate.update({
    where: { id: onboardingContext.candidate.id },
    data: {
      onboardingSummary: { ...nextMetadata, onboardingChecklist: nextChecklist } as Prisma.InputJsonValue,
      onboardingStatus: mapRecruitingV2OnboardingStatusToCandidateStatus(targetStatus),
    },
  });

  const updatedContext = await getOnboardingContext(candidateId);
  if (!updatedContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  return NextResponse.json({ operation: "Update Onboarding Metadata", ...onboardingPayload(updatedContext) });
}