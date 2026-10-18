import { requireRecruitingCandidateAccess } from "@/lib/recruiting-v2/candidate-access";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { normalizeRecruitingV2OfferSummary } from "@/lib/recruiting-v2/offer-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";
import {
  buildPaylocityEmployeePayload,
  evaluateRecruitingV2ActivationReadiness,
  normalizeRecruitingV2OnboardingSummary,
} from "@/lib/recruiting-v2/activation-engine";
import {
  activateRecruitingV2Candidate,
  readRecruitingV2DriverHandoff,
  RecruitingV2ActivationError,
} from "@/lib/recruiting-v2/driver-activation-service";
import { buildRecruitingActivationPresentation } from "@/lib/recruiting-v2/activation-presentation";
import { loadDriverOperationalProjection } from "@/lib/recruiting-v2/driver-operational-projection";
import { auth } from "@/auth";
import type { SessionUserLike } from "@/lib/authorization";

type RouteContext = { params: Promise<{ candidateId: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

async function getActivationContext(candidateWhere: Prisma.CandidateWhereUniqueInput) {
  const candidate = await prisma.candidate.findUnique({
    where: candidateWhere,
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
  const onboarding = normalizeRecruitingV2OnboardingSummary(candidate.onboardingSummary, candidate.onboardingStatus);
  const activationReadiness = evaluateRecruitingV2ActivationReadiness({
    qualificationSummary: qualification.qualificationSummary,
    qualificationRisks: qualification.operationalRisks,
    offer,
    onboarding,
  });
  const paylocityPreview = buildPaylocityEmployeePayload({ candidate, position: candidate.position, offer, onboarding, readiness: activationReadiness });

  return { candidate, documentGates, latestInterview, qualification, offer, onboarding, activationReadiness, paylocityPreview };
}

async function activationPayload(context: NonNullable<Awaited<ReturnType<typeof getActivationContext>>>) {
  const driverHandoff = readRecruitingV2DriverHandoff(context.candidate.applicationSummary);
  const driverOperational = await loadDriverOperationalProjection(driverHandoff);
  const presentation = buildRecruitingActivationPresentation({
    storedActivationStatus: context.candidate.activationStatus,
    storedActivationStage: context.candidate.activationStage,
    activationReadiness: context.activationReadiness,
    driverHandoff,
    driverOperational,
  });

  return {
    candidate: {
      id: context.candidate.id,
      candidateId: context.candidate.candidateCode,
      fullName: context.candidate.fullName,
      email: context.candidate.email,
      phone: context.candidate.phone,
      homeLocation: context.candidate.homeLocation,
      cdlClass: context.candidate.cdlClass,
      cdlState: context.candidate.cdlState,
      cdlNumberMasked: context.candidate.cdlNumberMasked,
      recordedActivationStage: context.candidate.activationStage,
      recordedActivationStatus: context.candidate.activationStatus,
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
    offerStatus: context.offer.offerStatus,
    onboardingStatus: context.onboarding.onboardingStatus,
    activationStage: presentation.activationStage,
    activationStatus: presentation.administrativeActivationStatus,
    administrativeActivationStatus: presentation.administrativeActivationStatus,
    recruitingHandoffEligible: presentation.recruitingHandoffEligible,
    currentRecruitingDecision: presentation.currentRecruitingDecision,
    activationReadiness: presentation.activationReadiness,
    readinessReasons: presentation.activationReadiness.readinessReasons,
    blockingItems: presentation.activationReadiness.blockingItems,
    pendingItems: presentation.activationReadiness.pendingItems,
    nextRequiredAction: presentation.nextRequiredAction,
    driverOperational: presentation.driverOperational,
    qualificationSummary: context.qualification.qualificationSummary,
    offerMetadata: context.offer,
    onboardingMetadata: context.onboarding,
    latestInterview: context.latestInterview,
    documentGateSummary: {
      total: context.documentGates.length,
      blocked: context.documentGates.filter((gate) => gate.gateState === "BLOCKED").length,
      open: context.documentGates.filter((gate) => gate.gateState === "OPEN").length,
      satisfied: context.documentGates.filter((gate) => gate.gateState === "SATISFIED").length,
    },
    paylocityHandoffPreview: {
      label: "PAYLOCITY HANDOFF PREVIEW",
      status: "PREVIEW ONLY - NOT SENT - NOT CREATED IN PAYLOCITY",
      payload: context.paylocityPreview,
    },
    manualActivation: {
      implemented: true,
      reason:
        "Authorized POST activationStatus=ACTIVE with fleetId creates a Prisma Driver, DriverIntake (QUALIFICATION_REVIEW), and bridges verified recruiting documents into the driver file.",
    },
    driverHandoff: presentation.driverHandoff,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const activationContext = await getActivationContext(candidateWhere);
  if (!activationContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  return NextResponse.json(await activationPayload(activationContext));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const activationContext = await getActivationContext(candidateWhere);
  if (!activationContext) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body)) return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  if (body.activationStatus !== undefined && body.activationStatus !== "ACTIVE") {
    return NextResponse.json({ error: "activationStatus can only request ACTIVE through the controlled activation operation" }, { status: 400 });
  }
  const existingHandoff = readRecruitingV2DriverHandoff(activationContext.candidate.applicationSummary);
  const alreadyAdministrativelyActive =
    activationContext.candidate.activationStatus === "ACTIVE" && Boolean(existingHandoff);
  if (
    body.activationStatus === "ACTIVE" &&
    !alreadyAdministrativelyActive &&
    !activationContext.activationReadiness.ready
  ) {
    return NextResponse.json({ error: "Activation prerequisites are incomplete; ACTIVE cannot be persisted." }, { status: 400 });
  }

  if (body.activationStatus !== "ACTIVE") {
    return NextResponse.json(
      {
        error: "Only activationStatus=ACTIVE is supported for driver handoff.",
        activationReadiness: activationContext.activationReadiness,
      },
      { status: 422 },
    );
  }

  const fleetId = typeof body.fleetId === "string" ? body.fleetId.trim() : "";
  if (!fleetId) {
    return NextResponse.json({ error: "fleetId is required to activate a driver into a fleet tenant." }, { status: 422 });
  }

  const session = await auth();
  try {
    const result = await activateRecruitingV2Candidate({
      sessionUser: session?.user as SessionUserLike,
      candidateCode: candidateId,
      fleetId,
    });
    const refreshed = await getActivationContext(candidateWhere);
    return NextResponse.json(
      {
        ...(await activationPayload(refreshed!)),
        activationResult: result,
      },
      { status: result.idempotent ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof RecruitingV2ActivationError) {
      return NextResponse.json({ error: error.message, activationReadiness: activationContext.activationReadiness }, { status: error.statusCode });
    }
    throw error;
  }
}