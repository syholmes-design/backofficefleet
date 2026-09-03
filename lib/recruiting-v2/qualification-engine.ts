import type { RecruitingV2CandidateStage, RecruitingV2Recommendation, RecruitingV2WorkflowStatus } from "@prisma/client";
import type { RecruitingV2DocumentGateEvaluation } from "@/lib/recruiting-v2/document-gate-engine";

export type RecruitingV2QualificationStatus = "READY" | "PENDING" | "BLOCKED";

export type RecruitingV2InterviewForQualification = {
  id: string;
  interviewCode: string;
  interviewDate: Date | string | null;
  interviewType: string;
  location: string;
  status: string;
  score: number | null;
  recommendation: RecruitingV2Recommendation | string;
  interviewers: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type RecruitingV2CandidateForQualification = {
  candidateCode: string;
  fullName: string;
  applicationStatus: RecruitingV2WorkflowStatus;
  qualificationStatus: RecruitingV2WorkflowStatus;
  documentReviewStatus: RecruitingV2WorkflowStatus;
  complianceStatus: RecruitingV2WorkflowStatus;
  activationStage: RecruitingV2CandidateStage;
};

export type RecruitingV2OperationalRisk = {
  problem: string;
  cause: string;
  owner: string | null;
  requiredAction: string;
  businessImpact: string;
  nextAction: string;
  source: "DOCUMENT_GATE" | "INTERVIEW" | "APPLICATION";
  severity: "BLOCKING" | "PENDING";
};

export type RecruitingV2InterviewEvaluation = {
  state: "INTERVIEW_REQUIRED" | "INTERVIEW_SCHEDULED" | "INTERVIEW_COMPLETED_RECOMMENDATION_PENDING" | "INTERVIEW_COMPLETED_ADVANCE" | "INTERVIEW_COMPLETED_HOLD" | "INTERVIEW_COMPLETED_REJECT" | "INTERVIEW_REVIEW_REQUIRED";
  label: string;
  status: "SATISFIED" | "PENDING" | "BLOCKED";
  reason: string;
  requiredAction: string;
};

export type RecruitingV2QualificationSummary = {
  status: RecruitingV2QualificationStatus;
  reason: string;
  blockingItems: string[];
  pendingItems: string[];
  satisfiedItems: string[];
  nextRequiredAction: string;
  currentDecision: RecruitingV2QualificationStatus;
  calculatedStateLabel: "Current calculated state";
  gateCounts: { blocked: number; open: number; satisfied: number; total: number };
  interviewEvaluation: RecruitingV2InterviewEvaluation;
};

function interviewTime(interview: RecruitingV2InterviewForQualification) {
  const scheduled = interview.interviewDate ? new Date(interview.interviewDate).getTime() : 0;
  const created = new Date(interview.createdAt).getTime();
  return Math.max(Number.isNaN(scheduled) ? 0 : scheduled, Number.isNaN(created) ? 0 : created);
}

export function getLatestRecruitingV2Interview(interviews: RecruitingV2InterviewForQualification[]) {
  return [...interviews].sort((left, right) => interviewTime(right) - interviewTime(left))[0] ?? null;
}

export function evaluateRecruitingV2InterviewQualification(interview: RecruitingV2InterviewForQualification | null): RecruitingV2InterviewEvaluation {
  if (!interview) {
    return {
      state: "INTERVIEW_REQUIRED",
      label: "Interview required",
      status: "PENDING",
      reason: "No Recruiting V2 interview record exists for this candidate.",
      requiredAction: "Schedule and complete interview.",
    };
  }

  if (interview.status === "SCHEDULED" || interview.status === "Scheduled") {
    return {
      state: "INTERVIEW_SCHEDULED",
      label: "Interview scheduled",
      status: "PENDING",
      reason: "Latest interview is scheduled but not completed.",
      requiredAction: "Complete interview.",
    };
  }

  if (interview.status === "COMPLETED" || interview.status === "Completed") {
    if (interview.recommendation === "ADVANCE" || interview.recommendation === "Advance") {
      return {
        state: "INTERVIEW_COMPLETED_ADVANCE",
        label: "Interview completed - advance",
        status: "SATISFIED",
        reason: "Latest completed interview recommends advancing the candidate.",
        requiredAction: "Continue qualification review.",
      };
    }
    if (interview.recommendation === "HOLD_FOR_REVIEW" || interview.recommendation === "Hold For Review") {
      return {
        state: "INTERVIEW_COMPLETED_HOLD",
        label: "Interview completed - hold",
        status: "BLOCKED",
        reason: "Latest completed interview is on hold for review.",
        requiredAction: "Resolve interview hold before offer review.",
      };
    }
    if (interview.recommendation === "DO_NOT_ADVANCE" || interview.recommendation === "Do Not Advance") {
      return {
        state: "INTERVIEW_COMPLETED_REJECT",
        label: "Interview completed - reject",
        status: "BLOCKED",
        reason: "Latest completed interview does not recommend advancing the candidate.",
        requiredAction: "Do not advance candidate to offer review.",
      };
    }
    return {
      state: "INTERVIEW_COMPLETED_RECOMMENDATION_PENDING",
      label: "Interview completed - recommendation pending",
      status: "PENDING",
      reason: "Latest interview is complete but recommendation is pending.",
      requiredAction: "Record interview recommendation.",
    };
  }

  return {
    state: "INTERVIEW_REVIEW_REQUIRED",
    label: "Interview review required",
    status: "PENDING",
    reason: `Latest interview status is ${interview.status}.`,
    requiredAction: "Review interview record.",
  };
}

function gateOwner(gate: RecruitingV2DocumentGateEvaluation) {
  return gate.latestDocument?.verifiedBy ?? gate.latestDocument?.uploadedBy ?? null;
}

export function aggregateRecruitingV2Qualification(args: {
  candidate: RecruitingV2CandidateForQualification;
  documentGates: RecruitingV2DocumentGateEvaluation[];
  latestInterview: RecruitingV2InterviewForQualification | null;
}): { qualificationSummary: RecruitingV2QualificationSummary; operationalRisks: RecruitingV2OperationalRisk[] } {
  const interviewEvaluation = evaluateRecruitingV2InterviewQualification(args.latestInterview);
  const blockingGates = args.documentGates.filter((gate) => gate.gateState === "BLOCKED");
  const openGates = args.documentGates.filter((gate) => gate.gateState === "OPEN");
  const satisfiedGates = args.documentGates.filter((gate) => gate.gateState === "SATISFIED");
  const operationalRisks: RecruitingV2OperationalRisk[] = [];

  for (const gate of blockingGates) {
    operationalRisks.push({
      problem: `${gate.label} gate blocked`,
      cause: gate.reason,
      owner: gateOwner(gate),
      requiredAction: gate.requiredAction,
      businessImpact: "Candidate cannot complete qualification while this required document gate is blocked.",
      nextAction: gate.requiredAction,
      source: "DOCUMENT_GATE",
      severity: "BLOCKING",
    });
  }

  for (const gate of openGates) {
    operationalRisks.push({
      problem: `${gate.label} gate open`,
      cause: gate.reason,
      owner: gateOwner(gate),
      requiredAction: gate.requiredAction,
      businessImpact: "Qualification remains pending until this document gate is resolved.",
      nextAction: gate.requiredAction,
      source: "DOCUMENT_GATE",
      severity: "PENDING",
    });
  }

  if (interviewEvaluation.status !== "SATISFIED") {
    operationalRisks.push({
      problem: interviewEvaluation.label,
      cause: interviewEvaluation.reason,
      owner: null,
      requiredAction: interviewEvaluation.requiredAction,
      businessImpact: interviewEvaluation.status === "BLOCKED" ? "Candidate cannot advance to offer review while interview disposition blocks advancement." : "Qualification remains pending until interview state is complete.",
      nextAction: interviewEvaluation.requiredAction,
      source: "INTERVIEW",
      severity: interviewEvaluation.status === "BLOCKED" ? "BLOCKING" : "PENDING",
    });
  }

  if (args.candidate.applicationStatus !== "COMPLETE" && args.candidate.applicationStatus !== "READY") {
    operationalRisks.push({
      problem: "Application incomplete",
      cause: `Application status is ${args.candidate.applicationStatus}.`,
      owner: null,
      requiredAction: "Complete candidate application review.",
      businessImpact: "Qualification cannot be ready until application review is complete.",
      nextAction: "Complete candidate application review.",
      source: "APPLICATION",
      severity: "PENDING",
    });
  }

  const blockingItems = operationalRisks.filter((risk) => risk.severity === "BLOCKING").map((risk) => risk.problem);
  const pendingItems = operationalRisks.filter((risk) => risk.severity === "PENDING").map((risk) => risk.problem);
  const satisfiedItems = [
    ...satisfiedGates.map((gate) => `${gate.label} gate satisfied`),
    ...(interviewEvaluation.status === "SATISFIED" ? [interviewEvaluation.label] : []),
    ...(args.candidate.applicationStatus === "COMPLETE" || args.candidate.applicationStatus === "READY" ? ["Application review complete"] : []),
  ];

  const status: RecruitingV2QualificationStatus = blockingItems.length > 0 ? "BLOCKED" : pendingItems.length > 0 ? "PENDING" : "READY";
  const firstBlocking = operationalRisks.find((risk) => risk.severity === "BLOCKING");
  const firstPending = operationalRisks.find((risk) => risk.severity === "PENDING");
  const nextRequiredAction = firstBlocking?.nextAction ?? firstPending?.nextAction ?? "Eligible for Offer Review";
  const reason = firstBlocking
    ? `${firstBlocking.problem}: ${firstBlocking.cause}`
    : firstPending
      ? `${firstPending.problem}: ${firstPending.cause}`
      : "All required document gates are satisfied and the interview requirement is complete.";

  return {
    qualificationSummary: {
      status,
      reason,
      blockingItems,
      pendingItems,
      satisfiedItems,
      nextRequiredAction,
      currentDecision: status,
      calculatedStateLabel: "Current calculated state",
      gateCounts: {
        blocked: blockingGates.length,
        open: openGates.length,
        satisfied: satisfiedGates.length,
        total: args.documentGates.length,
      },
      interviewEvaluation,
    },
    operationalRisks,
  };
}