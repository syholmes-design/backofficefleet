import type { RecruitingV2DocumentGateEvaluation } from "@/lib/recruiting-v2/document-gate-engine";
import type { RecruitingV2OfferMetadata } from "@/lib/recruiting-v2/offer-engine";
import type { RecruitingV2QualificationSummary } from "@/lib/recruiting-v2/qualification-engine";

export const RECRUITING_V2_ONBOARDING_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETE"] as const;
export const RECRUITING_V2_CHECKLIST_STATUSES = ["COMPLETE", "PENDING", "BLOCKED", "NOT_APPLICABLE"] as const;

export type RecruitingV2OnboardingStatus = (typeof RECRUITING_V2_ONBOARDING_STATUSES)[number];
export type RecruitingV2ChecklistStatus = (typeof RECRUITING_V2_CHECKLIST_STATUSES)[number];

export type RecruitingV2OnboardingChecklistItem = {
  key: string;
  label: string;
  status: RecruitingV2ChecklistStatus;
  required: boolean;
  source: string;
  reason: string;
};

export type RecruitingV2OnboardingMetadata = {
  onboardingStatus: RecruitingV2OnboardingStatus;
  orientationDate: string | null;
  orientationLocation: string | null;
  onboardingChecklist: RecruitingV2OnboardingChecklistItem[];
  onboardingNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RecruitingV2OnboardingIssue = {
  problem: string;
  cause: string;
  owner: string | null;
  requiredAction: string;
  businessImpact: string;
  nextAction: string;
};

export type RecruitingV2OnboardingDecision = {
  currentDecision: "NOT ELIGIBLE" | "PENDING" | "IN PROGRESS" | "COMPLETE";
  onboardingStatus: RecruitingV2OnboardingStatus;
  onboardingEligible: boolean;
  reason: string;
  blockingItems: RecruitingV2OnboardingIssue[];
  pendingItems: RecruitingV2OnboardingIssue[];
  completedItems: string[];
  nextRequiredAction: "Complete qualification" | "Obtain offer acceptance" | "Begin onboarding" | "Complete orientation" | "Complete onboarding checklist" | "Complete training" | "Complete equipment assignment" | "Complete final onboarding review" | "Ready for activation";
  actions: Array<"START_ONBOARDING" | "SAVE_ONBOARDING_METADATA" | "UPDATE_CHECKLIST" | "COMPLETE_ONBOARDING">;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function existingChecklistStatus(existing: RecruitingV2OnboardingChecklistItem[], key: string): RecruitingV2ChecklistStatus | null {
  return existing.find((item) => item.key === key || item.label === key)?.status ?? null;
}

function normalizeRawChecklist(value: unknown): RecruitingV2OnboardingChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const record = asRecord(entry);
    const label = optionalString(record?.label);
    const key = optionalString(record?.key) ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const rawStatus = optionalString(record?.status);
    if (!label || !key) return [];
    return [{
      key,
      label,
      status: rawStatus === "COMPLETE" || rawStatus === "BLOCKED" || rawStatus === "NOT_APPLICABLE" ? rawStatus : "PENDING",
      required: record?.required === false ? false : true,
      source: optionalString(record?.source) ?? "Recruiting V2 onboarding metadata",
      reason: optionalString(record?.reason) ?? "Candidate onboarding metadata item.",
    }];
  });
}

export function isRecruitingV2OnboardingStatus(value: string): value is RecruitingV2OnboardingStatus {
  return RECRUITING_V2_ONBOARDING_STATUSES.includes(value as RecruitingV2OnboardingStatus);
}

export function normalizeRecruitingV2OnboardingMetadata(value: unknown, candidateOnboardingStatus: string): RecruitingV2OnboardingMetadata {
  const record = asRecord(value);
  const explicitStatus = optionalString(record?.onboardingStatus);
  const onboardingStatus = explicitStatus && isRecruitingV2OnboardingStatus(explicitStatus)
    ? explicitStatus
    : candidateOnboardingStatus === "COMPLETE"
      ? "COMPLETE"
      : candidateOnboardingStatus === "UNDER_REVIEW" || candidateOnboardingStatus === "READY"
        ? "IN_PROGRESS"
        : "PENDING";

  return {
    onboardingStatus,
    orientationDate: optionalString(record?.orientationDate),
    orientationLocation: optionalString(record?.orientationLocation),
    onboardingChecklist: normalizeRawChecklist(record?.onboardingChecklist),
    onboardingNotes: optionalString(record?.onboardingNotes),
    createdAt: optionalString(record?.createdAt),
    updatedAt: optionalString(record?.updatedAt),
  };
}

export function buildRecruitingV2OnboardingChecklist(args: {
  qualificationSummary: RecruitingV2QualificationSummary;
  offer: RecruitingV2OfferMetadata;
  documentGates: RecruitingV2DocumentGateEvaluation[];
  onboarding: RecruitingV2OnboardingMetadata;
}): RecruitingV2OnboardingChecklistItem[] {
  const existing = args.onboarding.onboardingChecklist;
  const gateItem = (documentType: string, label: string): RecruitingV2OnboardingChecklistItem => {
    const gate = args.documentGates.find((item) => item.documentType === documentType);
    const status = gate?.gateState === "SATISFIED" ? "COMPLETE" : gate?.gateState === "BLOCKED" ? "BLOCKED" : "PENDING";
    return {
      key: documentType.toLowerCase(),
      label,
      status,
      required: true,
      source: "Recruiting V2 document gate engine",
      reason: gate?.reason ?? "Document gate not evaluated.",
    };
  };

  return [
    {
      key: "application",
      label: "Application",
      status: args.qualificationSummary.satisfiedItems.includes("Application review complete") ? "COMPLETE" : "PENDING",
      required: true,
      source: "Recruiting V2 candidate application state",
      reason: "Application must be complete before onboarding can finish.",
    },
    {
      key: "qualification",
      label: "Qualification",
      status: args.qualificationSummary.status === "READY" ? "COMPLETE" : args.qualificationSummary.status === "BLOCKED" ? "BLOCKED" : "PENDING",
      required: true,
      source: "Recruiting V2 qualification engine",
      reason: args.qualificationSummary.reason,
    },
    gateItem("CDL", "CDL"),
    gateItem("MEDICAL", "Medical"),
    gateItem("MVR", "MVR"),
    gateItem("CLEARINGHOUSE", "Clearinghouse"),
    gateItem("I9", "I-9"),
    gateItem("W9", "W-9"),
    {
      key: "interview",
      label: "Interview",
      status: args.qualificationSummary.interviewEvaluation.status === "SATISFIED" ? "COMPLETE" : args.qualificationSummary.interviewEvaluation.status === "BLOCKED" ? "BLOCKED" : "PENDING",
      required: true,
      source: "Recruiting V2 interview/qualification state",
      reason: args.qualificationSummary.interviewEvaluation.reason,
    },
    {
      key: "offer",
      label: "Offer",
      status: args.offer.offerStatus === "ACCEPTED" ? "COMPLETE" : args.offer.offerStatus === "DECLINED" ? "BLOCKED" : "PENDING",
      required: true,
      source: "Recruiting V2 offer metadata",
      reason: `Offer status is ${args.offer.offerStatus}.`,
    },
    {
      key: "orientation",
      label: "Orientation",
      status: args.onboarding.orientationDate && args.onboarding.orientationLocation ? "COMPLETE" : existingChecklistStatus(existing, "orientation") ?? "PENDING",
      required: true,
      source: "Recruiting V2 onboarding metadata",
      reason: args.onboarding.orientationDate && args.onboarding.orientationLocation ? "Orientation date and location are configured." : "Orientation date and location must be configured.",
    },
    {
      key: "training",
      label: "Training",
      status: existingChecklistStatus(existing, "training") ?? "PENDING",
      required: true,
      source: "Recruiting V2 onboarding metadata",
      reason: "Training completion must be recorded in onboarding metadata.",
    },
    {
      key: "equipment-assignment",
      label: "Equipment Assignment",
      status: existingChecklistStatus(existing, "equipment-assignment") ?? existingChecklistStatus(existing, "Equipment Assignment") ?? "PENDING",
      required: true,
      source: "Recruiting V2 onboarding metadata",
      reason: "Equipment assignment completion must be recorded in onboarding metadata.",
    },
  ];
}

export function evaluateRecruitingV2Onboarding(args: {
  qualificationSummary: RecruitingV2QualificationSummary;
  offer: RecruitingV2OfferMetadata;
  onboarding: RecruitingV2OnboardingMetadata;
  checklist: RecruitingV2OnboardingChecklistItem[];
}): RecruitingV2OnboardingDecision {
  const blockingItems: RecruitingV2OnboardingIssue[] = [];
  const pendingItems: RecruitingV2OnboardingIssue[] = [];
  const completedItems = args.checklist.filter((item) => item.status === "COMPLETE").map((item) => item.label);

  if (args.qualificationSummary.status !== "READY") {
    blockingItems.push({
      problem: "Qualification not complete",
      cause: args.qualificationSummary.reason,
      owner: null,
      requiredAction: "Complete qualification",
      businessImpact: "Candidate cannot enter onboarding until Qualification V2 is READY.",
      nextAction: "Complete qualification",
    });
  }

  if (args.offer.offerStatus !== "ACCEPTED") {
    blockingItems.push({
      problem: "Offer has not been accepted",
      cause: `Offer status is ${args.offer.offerStatus}.`,
      owner: null,
      requiredAction: "Obtain offer acceptance",
      businessImpact: "Onboarding cannot begin or complete until the offer is accepted.",
      nextAction: "Obtain offer acceptance",
    });
  }

  for (const item of args.checklist.filter((row) => row.required && row.status !== "COMPLETE" && row.status !== "NOT_APPLICABLE")) {
    const target = item.status === "BLOCKED" ? blockingItems : pendingItems;
    target.push({
      problem: `${item.label} incomplete`,
      cause: item.reason,
      owner: null,
      requiredAction: item.label === "Orientation" ? "Complete orientation" : item.label === "Training" ? "Complete training" : item.label === "Equipment Assignment" ? "Complete equipment assignment" : "Complete onboarding checklist",
      businessImpact: "Onboarding cannot be marked complete until this required item is complete.",
      nextAction: item.label === "Orientation" ? "Complete orientation" : item.label === "Training" ? "Complete training" : item.label === "Equipment Assignment" ? "Complete equipment assignment" : "Complete onboarding checklist",
    });
  }

  const onboardingEligible = args.qualificationSummary.status === "READY" && args.offer.offerStatus === "ACCEPTED";
  const currentDecision = !onboardingEligible
    ? "NOT ELIGIBLE"
    : args.onboarding.onboardingStatus === "COMPLETE"
      ? "COMPLETE"
      : args.onboarding.onboardingStatus === "IN_PROGRESS"
        ? "IN PROGRESS"
        : "PENDING";
  const firstBlocking = blockingItems[0];
  const firstPending = pendingItems[0];

  return {
    currentDecision,
    onboardingStatus: onboardingEligible ? args.onboarding.onboardingStatus : "PENDING",
    onboardingEligible,
    reason: firstBlocking?.cause ?? firstPending?.cause ?? (args.onboarding.onboardingStatus === "COMPLETE" ? "Onboarding is complete and activation readiness can be evaluated." : "Onboarding prerequisites are satisfied and onboarding can proceed."),
    blockingItems,
    pendingItems,
    completedItems,
    nextRequiredAction: firstBlocking?.nextAction as RecruitingV2OnboardingDecision["nextRequiredAction"] ?? firstPending?.nextAction as RecruitingV2OnboardingDecision["nextRequiredAction"] ?? (args.onboarding.onboardingStatus === "COMPLETE" ? "Ready for activation" : args.onboarding.onboardingStatus === "PENDING" ? "Begin onboarding" : "Complete final onboarding review"),
    actions: !onboardingEligible
      ? []
      : args.onboarding.onboardingStatus === "PENDING"
        ? ["START_ONBOARDING", "SAVE_ONBOARDING_METADATA", "UPDATE_CHECKLIST"]
        : args.onboarding.onboardingStatus === "IN_PROGRESS"
          ? ["SAVE_ONBOARDING_METADATA", "UPDATE_CHECKLIST", "COMPLETE_ONBOARDING"]
          : ["SAVE_ONBOARDING_METADATA"],
  };
}

export function canCompleteRecruitingV2Onboarding(decision: RecruitingV2OnboardingDecision) {
  return decision.onboardingEligible && decision.blockingItems.length === 0 && decision.pendingItems.length === 0;
}

export function mapRecruitingV2OnboardingStatusToCandidateStatus(status: RecruitingV2OnboardingStatus) {
  if (status === "COMPLETE") return "COMPLETE";
  if (status === "IN_PROGRESS") return "UNDER_REVIEW";
  return "PENDING";
}