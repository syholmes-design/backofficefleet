import { normalizeRecruitingV2OnboardingSummary, evaluateRecruitingV2ActivationReadiness, type RecruitingV2ActivationReadiness } from "@/lib/recruiting-v2/activation-engine";
import { evaluateRecruitingV2DocumentGates, type RecruitingV2DocumentGateEvaluation, type RecruitingV2DocumentRecordForGate } from "@/lib/recruiting-v2/document-gate-engine";
import { evaluateRecruitingV2OfferDecision, normalizeRecruitingV2OfferSummary, type RecruitingV2OfferMetadata } from "@/lib/recruiting-v2/offer-engine";
import {
  buildRecruitingV2OnboardingChecklist,
  evaluateRecruitingV2Onboarding,
  normalizeRecruitingV2OnboardingMetadata,
  type RecruitingV2OnboardingChecklistItem,
  type RecruitingV2OnboardingDecision,
} from "@/lib/recruiting-v2/onboarding-engine";
import {
  aggregateRecruitingV2Qualification,
  getLatestRecruitingV2Interview,
  type RecruitingV2InterviewForQualification,
  type RecruitingV2QualificationSummary,
} from "@/lib/recruiting-v2/qualification-engine";
import { recruitingPipelineState, requisitionPipelineCounts, type RecruitingPipelineState, type RequisitionPipelineCounts } from "@/lib/recruiting/requisition-pipeline";
import { evaluateRequisitionScreening, type RequisitionScreeningSource, type ScreeningEvaluation } from "@/lib/recruiting/requisition-screening";
import { isStructuredInterviewRecord, recommendationLabel, type StructuredInterviewRecord } from "@/lib/recruiting/structured-interview";

/** The workspace's original (Aug 29) position and candidate shapes, which the connected model extends. */
export type RecruitingPosition = {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  employmentType: string;
  homeTime: string;
  equipment: string;
  freightType: string;
  primaryLanes: string;
  schedule: string;
  compensation: string;
  benefits: string[];
  minimumQualifications: string[];
  cdlClass: string;
  experienceYears: number;
  endorsements: string[];
  safetyExpectations: string;
  physicalRequirements: string;
  applicationInstructions: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  createdAt: string;
};

export type RecruitingCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  homeLocation: string;
  positionId: string;
  positionTitle: string;
  appliedDate: string;
  experienceYears: number;
  cdlClass: string;
  cdlState: string;
  cdlNumberMasked: string;
  medCardStatus: "VALID" | "PENDING_VERIFICATION" | "EXPIRED";
  mvrStatus: "CLEAN" | "REVIEW_REQUIRED" | "PENDING_VERIFICATION";
  backgroundStatus: "CLEAN" | "PENDING_VERIFICATION";
  pipelineStage:
    | "APPLICATION_RECEIVED"
    | "SCREENING"
    | "QUALIFICATION_REVIEW"
    | "INTERVIEW"
    | "OFFER_PREPARED"
    | "OFFER_SENT"
    | "OFFER_ACCEPTED"
    | "ONBOARDING"
    | "ACTIVATED";
  interviewNotes?: string;
  offerDetails?: {
    salaryCPM: string;
    weeklyGuarantee: string;
    signOnBonus: string;
    startDate: string;
    homeTerminal: string;
  };
  onboardingChecklist: Array<{
    id: string;
    label: string;
    completed: boolean;
    requiredDocType?: string;
    verifiedAt?: string;
  }>;
  activatedDriverId?: string;
};


/**
 * View model for the Recruiting & Onboarding workspace (the approved Aug-29 "Michael Anderson"
 * interface). Built from plain records so the same function serves the signed-in workspace
 * (records from Postgres) and the public demonstration (fictional records in the browser).
 * Every decision comes from the existing Recruiting V2 engines plus the requisition's requirements.
 */

export type WorkspaceRequisition = RequisitionScreeningSource & {
  id: string;
  fleetId: string;
  fleetName: string | null;
  publicNumber: string;
  status: string;
  recruitingPipelineState: string;
  numberOfPositions: number;
  targetStartDate: string | null;
  approvedAt: string | null;
  requestingCarrierName: string | null;
  usdot: string | null;
  mcNumber: string | null;
  terminalDomicile: string | null;
  statesOfOperation: string | null;
  requestingManagerName: string | null;
  department: string | null;
  positionTitle: string | null;
  positionClassification: string | null;
  employmentClassification: string | null;
  workLocation: string | null;
  homeTimePattern: string | null;
  routeLane: string | null;
  soloTeamOperation: string | null;
  compensationStructure: string | null;
  payRange: string | null;
  signOnBonus: string | null;
  benefits: string | null;
  positionSummary: string | null;
  physicalRequirements: string | null;
  schedule: string | null;
  recruitingInstructions: string | null;
  applicationRouting: string | null;
  approvals: Array<{ approvalRole: string; decision: string }>;
};

export type WorkspacePositionRow = {
  id: string;
  positionCode: string;
  title: string;
  homeTerminal: string;
  freightType: string;
  primaryLanes: string;
  compensation: string;
  description: string;
  status: string;
  requisitionId: string | null;
  fleetId: string | null;
  openings: number;
  createdAt: string;
};

export type WorkspaceInterviewRow = RecruitingV2InterviewForQualification & {
  notes: string | null;
  questionnaire: unknown;
};

export type WorkspaceCandidateRow = {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
  homeLocation: string;
  cdlClass: string;
  cdlState: string;
  cdlNumberMasked: string;
  applicationStatus: string;
  qualificationStatus: string;
  documentReviewStatus: string;
  complianceStatus: string;
  onboardingStatus: string;
  activationStage: string;
  activationStatus: string;
  applicationSummary: unknown;
  offerSummary: unknown;
  onboardingSummary: unknown;
  auditTrail: unknown;
  positionId: string;
  dispositionStatus: "ACTIVE" | "REJECTED" | "WITHDRAWN";
  dispositionReason: string | null;
  dispositionNotes: string | null;
  dispositionAt: string | null;
  createdAt: string;
  documents: RecruitingV2DocumentRecordForGate[];
  /** File attached to each document record, by documentCode (signed-in only; file bytes never included). */
  documentFiles?: Record<string, WorkspaceDocumentFile>;
  interviews: WorkspaceInterviewRow[];
};

export type WorkspaceDocumentFile = { fileName: string | null; viewUrl: string; downloadUrl: string; synthetic: boolean };

/** Real records created by activation (signed-in) or the simulated equivalent (demo). */
export type WorkspaceActivationFacts = {
  simulated: boolean;
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  activatedAt: string;
  driverHref: string | null;
  readinessHref: string | null;
  qualification: { status: string; reasons: string[] } | null;
  readiness: { status: string; score: number | null; blockers: string[]; dispatchEligible: boolean } | null;
  records: string[];
};

export type WorkspaceRequisitionSummary = {
  id: string;
  publicNumber: string;
  fleetId: string;
  fleetName: string | null;
  carrier: string | null;
  status: string;
  pipelineState: RecruitingPipelineState;
  storedPipelineState: string;
  approvalsApproved: number;
  approvalsTotal: number;
  targetStartDate: string | null;
  href: string;
  screeningRequirements: string[];
};

export type WorkspacePosition = RecruitingPosition & {
  positionCode: string;
  requisition: WorkspaceRequisitionSummary | null;
  counts: RequisitionPipelineCounts;
};

export type WorkspaceInterviewSummary = {
  status: string;
  recommendation: string;
  recommendationLabel: string;
  scheduledFor: string | null;
  interviewType: string;
  notes: string | null;
  structured: StructuredInterviewRecord | null;
};

export type WorkspaceCandidate = RecruitingCandidate & {
  candidateCode: string;
  positionCode: string;
  requisitionNumber: string | null;
  disposition: { status: "ACTIVE" | "REJECTED" | "WITHDRAWN"; reason: string | null; notes: string | null; at: string | null };
  applicationStatus: string;
  screening: ScreeningEvaluation;
  qualification: RecruitingV2QualificationSummary;
  documentGates: RecruitingV2DocumentGateEvaluation[];
  documentFiles: Record<string, WorkspaceDocumentFile>;
  interview: WorkspaceInterviewSummary | null;
  offer: RecruitingV2OfferMetadata;
  offerBlockedReason: string | null;
  onboardingItems: RecruitingV2OnboardingChecklistItem[];
  onboardingDecision: RecruitingV2OnboardingDecision;
  onboardingStatus: string;
  orientation: { date: string | null; location: string | null };
  activationReadiness: RecruitingV2ActivationReadiness;
  activation: WorkspaceActivationFacts | null;
  auditTrail: string[];
};

export type RecruitingWorkspaceModel = {
  mode: "live" | "demo";
  positions: WorkspacePosition[];
  candidates: WorkspaceCandidate[];
  /** Approved requisitions whose recruiting position has not been opened yet (approved before integration). */
  unopenedRequisitions: WorkspaceRequisitionSummary[];
  requisitionsHref: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function splitList(value: string | null | undefined) {
  return String(value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function screeningRequirementLines(req: RequisitionScreeningSource): string[] {
  return [
    req.cdlClass ? `CDL class ${req.cdlClass}` : null,
    req.endorsements ? `Endorsements: ${req.endorsements}` : null,
    req.experienceRequirements ? `Experience: ${req.experienceRequirements}` : null,
    req.mvrSafetyRequirements ? `MVR: ${req.mvrSafetyRequirements}` : null,
    req.medicalRequired ? "DOT medical certificate" : null,
    req.clearinghouseRequired ? "Clearinghouse query" : null,
    req.drugTestingRequired ? "Pre-employment drug test" : null,
    req.pspRequired ? "PSP report" : null,
    req.backgroundCheckRequired ? "Background / employment verification" : null,
    req.tsaRequired ? "TSA credential" : null,
    req.equipmentType ? `Equipment: ${req.equipmentType}` : null,
  ].filter((item): item is string => Boolean(item));
}

function candidateProfile(row: WorkspaceCandidateRow) {
  const summary = asRecord(row.applicationSummary);
  const screening = asRecord(summary.screening);
  const confirmations = asRecord(screening.confirmations) as Record<string, { confirmedBy: string; confirmedAt: string; notes?: string | null }>;
  const years = typeof summary.experienceYears === "number" ? summary.experienceYears : Number(summary.experienceYears);
  return {
    appliedDate: typeof summary.appliedDate === "string" ? summary.appliedDate : row.createdAt.slice(0, 10),
    experienceYears: Number.isFinite(years) ? years : null,
    endorsements: asStringList(summary.endorsements),
    equipmentExperience: typeof summary.equipmentExperience === "string" ? summary.equipmentExperience : null,
    confirmations,
  };
}

function credentialStatus(gate: RecruitingV2DocumentGateEvaluation | undefined, kind: "medical" | "mvr" | "background") {
  if (gate?.gateState === "SATISFIED") return kind === "medical" ? "VALID" : "CLEAN";
  if (kind === "medical" && gate?.expirationStatus === "EXPIRED") return "EXPIRED";
  if (kind === "mvr" && gate?.gateState === "BLOCKED") return "REVIEW_REQUIRED";
  return "PENDING_VERIFICATION";
}

/** Stage shown on the approved pipeline bar, derived from the recorded facts (never set by hand). */
function pipelineStage(row: WorkspaceCandidateRow, latest: WorkspaceInterviewRow | null, offer: RecruitingV2OfferMetadata, onboardingStatus: string): RecruitingCandidate["pipelineStage"] {
  if (row.activationStatus === "ACTIVE") return "ACTIVATED";
  if (offer.offerStatus === "ACCEPTED") return onboardingStatus === "PENDING" ? "OFFER_ACCEPTED" : "ONBOARDING";
  if (offer.offerStatus === "SENT") return "OFFER_SENT";
  if (offer.offerStatus === "DRAFT") return "OFFER_PREPARED";
  if (latest) return "INTERVIEW";
  if (row.documents.length) return "QUALIFICATION_REVIEW";
  if (row.applicationStatus === "COMPLETE" || row.applicationStatus === "READY") return "SCREENING";
  return "APPLICATION_RECEIVED";
}

function interviewNotes(latest: WorkspaceInterviewRow | null, structured: StructuredInterviewRecord | null) {
  if (!latest) return undefined;
  if (structured) {
    return `${recommendationLabel(structured.recommendation)} (${structured.interviewer}, ${structured.completedAt.slice(0, 10)})${structured.conditions ? ` · Conditions: ${structured.conditions}` : ""}${structured.decisionNotes ? ` · ${structured.decisionNotes}` : ""}`;
  }
  if (latest.status === "SCHEDULED" || latest.status === "Scheduled") {
    return `Interview scheduled${latest.interviewDate ? ` for ${String(latest.interviewDate).slice(0, 16).replace("T", " ")}` : ""} (${latest.interviewType}).`;
  }
  return latest.notes ?? undefined;
}

export function buildRecruitingWorkspaceModel(input: {
  mode: "live" | "demo";
  requisitions: WorkspaceRequisition[];
  positions: WorkspacePositionRow[];
  candidates: WorkspaceCandidateRow[];
  activations: Record<string, WorkspaceActivationFacts>;
  requisitionHref: (requisitionId: string) => string;
  requisitionsHref: string;
}): RecruitingWorkspaceModel {
  const requisitionById = new Map(input.requisitions.map((req) => [req.id, req]));
  const positionById = new Map(input.positions.map((pos) => [pos.id, pos]));

  const candidates: WorkspaceCandidate[] = input.candidates.map((row) => {
    const position = positionById.get(row.positionId);
    const requisition = position?.requisitionId ? requisitionById.get(position.requisitionId) ?? null : null;
    const profile = candidateProfile(row);
    const documentGates = evaluateRecruitingV2DocumentGates(row.documents);
    const latest = (getLatestRecruitingV2Interview(row.interviews) as WorkspaceInterviewRow | null) ?? null;
    const qualification = aggregateRecruitingV2Qualification({
      candidate: {
        candidateCode: row.candidateCode,
        fullName: row.fullName,
        applicationStatus: row.applicationStatus as never,
        qualificationStatus: row.qualificationStatus as never,
        documentReviewStatus: row.documentReviewStatus as never,
        complianceStatus: row.complianceStatus as never,
        activationStage: row.activationStage as never,
      },
      documentGates,
      latestInterview: latest,
    });
    const offer = normalizeRecruitingV2OfferSummary(row.offerSummary);
    const offerDecision = evaluateRecruitingV2OfferDecision({ qualificationSummary: qualification.qualificationSummary, offer });
    const onboardingMeta = normalizeRecruitingV2OnboardingMetadata(row.onboardingSummary, row.onboardingStatus);
    const onboardingItems = buildRecruitingV2OnboardingChecklist({ qualificationSummary: qualification.qualificationSummary, offer, documentGates, onboarding: onboardingMeta });
    const onboardingDecision = evaluateRecruitingV2Onboarding({ qualificationSummary: qualification.qualificationSummary, offer, onboarding: onboardingMeta, checklist: onboardingItems });
    const activationReadiness = evaluateRecruitingV2ActivationReadiness({
      qualificationSummary: qualification.qualificationSummary,
      qualificationRisks: qualification.operationalRisks,
      offer,
      onboarding: normalizeRecruitingV2OnboardingSummary(row.onboardingSummary, row.onboardingStatus),
    });
    const screening = evaluateRequisitionScreening({
      requisition: requisition ?? {},
      candidate: { cdlClass: row.cdlClass, experienceYears: profile.experienceYears, endorsements: profile.endorsements, equipmentExperience: profile.equipmentExperience, confirmations: profile.confirmations },
      documentGates,
    });
    const structured = latest && isStructuredInterviewRecord(latest.questionnaire) ? latest.questionnaire : null;
    const gate = (type: string) => documentGates.find((item) => item.documentType === type);
    const activation = input.activations[row.candidateCode] ?? null;
    const disposition = { status: row.dispositionStatus, reason: row.dispositionReason, notes: row.dispositionNotes, at: row.dispositionAt };
    const offerBlockedReason =
      disposition.status !== "ACTIVE"
        ? `Candidate is ${disposition.status.toLowerCase()}${disposition.reason ? ` (${disposition.reason})` : ""}.`
        : screening.status === "FAIL"
          ? `Screening against ${requisition?.publicNumber ?? "the requisition"} failed: ${screening.blocking[0] ?? "requirement not met"}.`
          : qualification.qualificationSummary.status !== "READY"
            ? offerDecision.qualificationPrerequisite
            : null;

    return {
      id: row.candidateCode,
      candidateCode: row.candidateCode,
      name: row.fullName,
      email: row.email,
      phone: row.phone,
      homeLocation: row.homeLocation,
      positionId: row.positionId,
      positionCode: position?.positionCode ?? row.positionId,
      positionTitle: position?.title ?? "Position",
      requisitionNumber: requisition?.publicNumber ?? null,
      appliedDate: profile.appliedDate,
      experienceYears: profile.experienceYears ?? 0,
      cdlClass: row.cdlClass,
      cdlState: row.cdlState,
      cdlNumberMasked: row.cdlNumberMasked,
      medCardStatus: credentialStatus(gate("MEDICAL"), "medical") as RecruitingCandidate["medCardStatus"],
      mvrStatus: credentialStatus(gate("MVR"), "mvr") as RecruitingCandidate["mvrStatus"],
      backgroundStatus: credentialStatus(gate("EMPLOYMENT_VERIFICATION"), "background") as RecruitingCandidate["backgroundStatus"],
      pipelineStage: pipelineStage(row, latest, offer, onboardingMeta.onboardingStatus),
      interviewNotes: interviewNotes(latest, structured),
      offerDetails:
        offer.offerStatus === "NOT_PROVIDED"
          ? undefined
          : {
              salaryCPM: offer.compensation ?? "Not set",
              weeklyGuarantee: requisition?.compensationStructure ?? "—",
              signOnBonus: requisition?.signOnBonus ?? "—",
              startDate: offer.startDate?.slice(0, 10) ?? "Not set",
              homeTerminal: position?.homeTerminal ?? "—",
            },
      onboardingChecklist: onboardingItems.map((item) => ({
        id: item.key,
        label: item.label,
        completed: item.status === "COMPLETE" || item.status === "NOT_APPLICABLE",
        requiredDocType: ["cdl", "medical", "mvr", "clearinghouse", "i9", "w9"].includes(item.key) ? item.label : undefined,
        verifiedAt: item.status === "COMPLETE" ? item.source.replace(/^Recruiting V2 /, "") : undefined,
      })),
      activatedDriverId: activation?.driverId,
      disposition,
      applicationStatus: row.applicationStatus,
      screening,
      qualification: qualification.qualificationSummary,
      documentGates,
      documentFiles: row.documentFiles ?? {},
      interview: latest
        ? {
            status: String(latest.status),
            recommendation: String(latest.recommendation),
            recommendationLabel: recommendationLabel(String(latest.recommendation)),
            scheduledFor: latest.interviewDate ? String(latest.interviewDate) : null,
            interviewType: latest.interviewType,
            notes: latest.notes,
            structured,
          }
        : null,
      offer,
      offerBlockedReason,
      onboardingItems,
      onboardingDecision,
      onboardingStatus: onboardingMeta.onboardingStatus,
      orientation: { date: onboardingMeta.orientationDate, location: onboardingMeta.orientationLocation },
      activationReadiness,
      activation,
      auditTrail: asStringList(row.auditTrail),
    };
  });

  const summaryFor = (req: WorkspaceRequisition, counts: RequisitionPipelineCounts): WorkspaceRequisitionSummary => ({
    id: req.id,
    publicNumber: req.publicNumber,
    fleetId: req.fleetId,
    fleetName: req.fleetName,
    carrier: req.requestingCarrierName,
    status: req.status,
    pipelineState: recruitingPipelineState(req.status === "APPROVED" || req.status === "FILLED", counts),
    storedPipelineState: req.recruitingPipelineState,
    approvalsApproved: req.approvals.filter((a) => a.decision === "APPROVED").length,
    approvalsTotal: req.approvals.length,
    targetStartDate: req.targetStartDate,
    href: input.requisitionHref(req.id),
    screeningRequirements: screeningRequirementLines(req),
  });

  const positions: WorkspacePosition[] = input.positions.map((pos) => {
    const req = pos.requisitionId ? requisitionById.get(pos.requisitionId) ?? null : null;
    const own = candidates.filter((c) => c.positionId === pos.id);
    const counts = requisitionPipelineCounts(
      req?.numberOfPositions ?? pos.openings,
      own.map((c) => ({
        dispositionStatus: c.disposition.status,
        applicationStatus: c.applicationStatus,
        interviewCompleted: c.interview?.status === "COMPLETED" || c.interview?.status === "Completed",
        offerStatus: c.offer.offerStatus,
        activationStatus: c.activation ? "ACTIVE" : "PENDING",
      })),
    );
    return {
      id: pos.id,
      positionCode: pos.positionCode,
      title: pos.title,
      department: req?.department ?? "Fleet Operations",
      location: pos.homeTerminal,
      openings: req?.numberOfPositions ?? pos.openings,
      employmentType: req?.employmentClassification ?? "—",
      homeTime: req?.homeTimePattern ?? "—",
      equipment: req?.equipmentType ?? pos.freightType,
      freightType: pos.freightType,
      primaryLanes: pos.primaryLanes,
      schedule: req?.schedule ?? "—",
      compensation: pos.compensation,
      benefits: splitList(req?.benefits),
      minimumQualifications: req ? screeningRequirementLines(req) : [],
      cdlClass: req?.cdlClass ?? "",
      experienceYears: Number(String(req?.experienceRequirements ?? "").match(/\d+/)?.[0] ?? 0),
      endorsements: splitList(req?.endorsements),
      safetyExpectations: req?.mvrSafetyRequirements ?? "",
      physicalRequirements: req?.physicalRequirements ?? "",
      applicationInstructions: req?.applicationRouting ?? req?.recruitingInstructions ?? "",
      status: pos.status === "CLOSED" ? "CLOSED" : "OPEN",
      createdAt: pos.createdAt.slice(0, 10),
      requisition: req ? summaryFor(req, counts) : null,
      counts,
    };
  });

  const openedRequisitionIds = new Set(input.positions.map((pos) => pos.requisitionId).filter(Boolean));
  const unopenedRequisitions = input.requisitions
    .filter((req) => req.status === "APPROVED" && !openedRequisitionIds.has(req.id))
    .map((req) => summaryFor(req, requisitionPipelineCounts(req.numberOfPositions, [])));

  return { mode: input.mode, positions, candidates, unopenedRequisitions, requisitionsHref: input.requisitionsHref };
}

/** Recruiting position fields mapped from an approved requisition (no manual re-entry). */
export function positionFieldsFromRequisition(req: {
  publicNumber: string;
  fleetId: string;
  positionTitle: string | null;
  terminalDomicile: string | null;
  workLocation: string | null;
  equipmentType: string | null;
  positionClassification: string | null;
  routeLane: string | null;
  statesOfOperation: string | null;
  compensationStructure: string | null;
  payRange: string | null;
  positionSummary: string | null;
  numberOfPositions: number;
}) {
  return {
    positionCode: `${req.publicNumber}-${req.fleetId.slice(-6).toUpperCase()}`,
    title: req.positionTitle?.trim() || `${req.publicNumber} driver position`,
    homeTerminal: req.terminalDomicile?.trim() || req.workLocation?.trim() || "Not specified",
    freightType: req.equipmentType?.trim() || req.positionClassification?.trim() || "Not specified",
    primaryLanes: req.routeLane?.trim() || req.statesOfOperation?.trim() || "Not specified",
    compensation: [req.payRange, req.compensationStructure].filter((part) => part && part.trim()).join(" · ") || "Not specified",
    description: req.positionSummary?.trim() || `Opened from approved requisition ${req.publicNumber}.`,
    openings: Math.max(1, req.numberOfPositions),
  };
}
