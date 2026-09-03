import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";

type RouteContext = { params: Promise<{ candidateId: string }> };

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

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const candidate = await prisma.candidate.findUnique({
    where: { candidateCode: candidateId },
    include: {
      position: true,
      documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] },
      complianceGates: { orderBy: [{ documentType: "asc" }] },
      interviews: { orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const documentRecords = candidate.documentRecords.map(serializeDocumentRecord);
  const documentGates = evaluateRecruitingV2DocumentGates(documentRecords);
  const latestDocuments = documentGates.map((gate) => ({
    documentType: gate.documentType,
    label: gate.label,
    latestDocument: gate.latestDocument,
  }));
  const interviews = candidate.interviews.map(serializeInterview);
  const latestInterview = getLatestRecruitingV2Interview(interviews);
  const aggregation = aggregateRecruitingV2Qualification({
    candidate,
    documentGates,
    latestInterview,
  });

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
      applicationStatus: candidate.applicationStatus,
      qualificationStatus: candidate.qualificationStatus,
      documentReviewStatus: candidate.documentReviewStatus,
      complianceStatus: candidate.complianceStatus,
      activationStage: candidate.activationStage,
      auditTrail: candidate.auditTrail,
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
    qualificationSummary: aggregation.qualificationSummary,
    documentGates,
    latestDocuments,
    latestInterview,
    operationalRisks: aggregation.operationalRisks,
    currentDecision: aggregation.qualificationSummary.currentDecision,
    nextRequiredAction: aggregation.qualificationSummary.nextRequiredAction,
    complianceGateRecords: candidate.complianceGates.map((gate) => ({
      id: gate.id,
      documentType: gate.documentType,
      state: gate.state,
      reason: gate.reason,
      requiredAction: gate.requiredAction,
      updatedAt: gate.updatedAt.toISOString(),
    })),
  });
}