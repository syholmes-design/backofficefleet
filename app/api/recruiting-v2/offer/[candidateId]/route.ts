import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";
import {
  allowedRecruitingV2OfferTransition,
  evaluateRecruitingV2OfferDecision,
  isRecruitingV2OfferStatus,
  normalizeRecruitingV2OfferSummary,
  type RecruitingV2OfferMetadata,
} from "@/lib/recruiting-v2/offer-engine";

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
  if (Number.isNaN(parsed.getTime())) return { error: `${field} must be a valid date` };
  return parsed.toISOString();
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

async function getOfferContext(candidateId: string) {
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
  const interviews = candidate.interviews.map(serializeInterview);
  const latestInterview = getLatestRecruitingV2Interview(interviews);
  const qualification = aggregateRecruitingV2Qualification({ candidate, documentGates, latestInterview });
  const offerMetadata = normalizeRecruitingV2OfferSummary(candidate.offerSummary);
  const offerDecision = evaluateRecruitingV2OfferDecision({ qualificationSummary: qualification.qualificationSummary, offer: offerMetadata });

  return { candidate, documentGates, latestInterview, qualification, offerMetadata, offerDecision };
}

function offerPayload(context: NonNullable<Awaited<ReturnType<typeof getOfferContext>>>) {
  return {
    candidate: {
      id: context.candidate.id,
      candidateId: context.candidate.candidateCode,
      fullName: context.candidate.fullName,
      email: context.candidate.email,
      phone: context.candidate.phone,
      homeLocation: context.candidate.homeLocation,
      activationStage: context.candidate.activationStage,
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
    qualificationDecision: context.qualification.qualificationSummary,
    latestInterview: context.latestInterview,
    offerMetadata: context.offerMetadata,
    offerDecision: context.offerDecision,
    currentDecision: context.offerDecision.currentDecision,
    nextRequiredAction: context.offerDecision.nextRequiredAction,
    template: {
      label: "Offer Template",
      href: null,
      status: "Template not configured in the current BOF document foundation.",
    },
  };
}

function validateRequiredOfferFields(body: Record<string, unknown>, targetStatus: string) {
  if (targetStatus === "DRAFT" || targetStatus === "SENT") {
    if (!normalizeString(body.compensation)) return "compensation is required";
    if (!normalizeString(body.startDate)) return "startDate is required";
    if (!normalizeString(body.orientationDate)) return "orientationDate is required";
  }
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") return "notes must be a string when provided";
  if (targetStatus === "DECLINED" && !normalizeString(body.declineReason)) return "declineReason is required";
  return null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const offerContext = await getOfferContext(candidateId);
  if (!offerContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  return NextResponse.json(offerPayload(offerContext));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const offerContext = await getOfferContext(candidateId);
  if (!offerContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isRecord(body)) return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });

  const targetStatus = normalizeString(body.offerStatus);
  if (!targetStatus) return NextResponse.json({ error: "offerStatus is required" }, { status: 400 });
  if (!isRecruitingV2OfferStatus(targetStatus)) return NextResponse.json({ error: "offerStatus is invalid" }, { status: 400 });
  if (targetStatus === "NOT_PROVIDED") return NextResponse.json({ error: "offerStatus transition is invalid" }, { status: 400 });

  const requiredError = validateRequiredOfferFields(body, targetStatus);
  if (requiredError) return NextResponse.json({ error: requiredError }, { status: 400 });

  const startDate = parseDateField(body.startDate, "startDate");
  if (isRecord(startDate)) return NextResponse.json({ error: startDate.error }, { status: 400 });
  const orientationDate = parseDateField(body.orientationDate, "orientationDate");
  if (isRecord(orientationDate)) return NextResponse.json({ error: orientationDate.error }, { status: 400 });

  const currentOffer = offerContext.offerMetadata;
  if (!allowedRecruitingV2OfferTransition(currentOffer.offerStatus, targetStatus)) {
    return NextResponse.json({ error: `Invalid offer transition: ${currentOffer.offerStatus} to ${targetStatus}` }, { status: 400 });
  }

  if ((targetStatus === "DRAFT" || targetStatus === "SENT") && offerContext.qualification.qualificationSummary.status !== "READY") {
    return NextResponse.json({ error: offerContext.offerDecision.qualificationPrerequisite }, { status: 400 });
  }

  const now = new Date().toISOString();
  const offerCode = normalizeString(body.offerCode) || currentOffer.offerCode || `OFFV2-${offerContext.candidate.candidateCode}-${Date.now()}`;
  const nextOffer: RecruitingV2OfferMetadata = {
    offerCode,
    offerStatus: targetStatus,
    compensation: normalizeString(body.compensation) || currentOffer.compensation || null,
    startDate: startDate ?? currentOffer.startDate,
    orientationDate: orientationDate ?? currentOffer.orientationDate,
    notes: body.notes === undefined ? currentOffer.notes : normalizeString(body.notes) || null,
    createdAt: currentOffer.createdAt ?? now,
    updatedAt: now,
    sentAt: targetStatus === "SENT" ? now : currentOffer.sentAt,
    acceptedAt: targetStatus === "ACCEPTED" ? now : currentOffer.acceptedAt,
    declinedAt: targetStatus === "DECLINED" ? now : currentOffer.declinedAt,
    declineReason: targetStatus === "DECLINED" ? normalizeString(body.declineReason) : currentOffer.declineReason,
  };

  await prisma.candidate.update({
    where: { id: offerContext.candidate.id },
    data: { offerSummary: nextOffer as Prisma.InputJsonValue },
  });

  const updatedContext = await getOfferContext(candidateId);
  if (!updatedContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  return NextResponse.json({ operation: "Update Offer Metadata", ...offerPayload(updatedContext) }, { status: 200 });
}