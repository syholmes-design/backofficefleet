import type { RecruitingV2OfferMetadata } from "@/lib/recruiting-v2/offer-engine";
import type { RecruitingV2QualificationSummary, RecruitingV2OperationalRisk } from "@/lib/recruiting-v2/qualification-engine";

export type RecruitingV2ActivationStatus = "PENDING" | "READY" | "ACTIVE";
export type RecruitingV2OnboardingStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE";

export type RecruitingV2OnboardingMetadata = {
  onboardingStatus: RecruitingV2OnboardingStatus;
  orientationDate: string | null;
  orientationLocation: string | null;
  onboardingChecklist: Array<{ label: string; status: "PENDING" | "COMPLETE"; source: string }>;
  onboardingNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RecruitingV2ActivationIssue = {
  problem: string;
  cause: string;
  owner: string | null;
  correction: string;
  businessImpact: string;
  nextAction: string;
  recheck: string;
};

export type RecruitingV2ActivationReadiness = {
  activationStatus: RecruitingV2ActivationStatus;
  activationStage: "QUALIFICATION" | "OFFER" | "ONBOARDING" | "ACTIVATION";
  ready: boolean;
  readinessReasons: string[];
  blockingItems: RecruitingV2ActivationIssue[];
  pendingItems: RecruitingV2ActivationIssue[];
  nextRequiredAction: "Complete qualification before activation" | "Offer acceptance required" | "Complete onboarding before activation" | "Review Paylocity Handoff Payload" | "Activation not yet implemented";
  currentDecision: "NOT READY FOR ACTIVATION" | "READY FOR ACTIVATION" | "ACTIVE";
};

export type PaylocityEmployeePreviewPayload = {
  fullName: string;
  email: string;
  phone: string;
  homeLocation: string;
  positionCode: string;
  startDate: string | null;
  orientationDate: string | null;
  cdlClass: string;
  cdlState: string;
  activationDate: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeChecklist(value: unknown): RecruitingV2OnboardingMetadata["onboardingChecklist"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const record = asRecord(entry);
    const label = optionalString(record?.label);
    const status = optionalString(record?.status);
    if (!label) return [];
    return [{ label, status: status === "COMPLETE" ? "COMPLETE" : "PENDING", source: optionalString(record?.source) ?? "Recruiting V2 onboarding metadata" }];
  });
}

export function normalizeRecruitingV2OnboardingSummary(value: unknown, candidateOnboardingStatus: string): RecruitingV2OnboardingMetadata {
  const record = asRecord(value);
  const explicitStatus = optionalString(record?.onboardingStatus);
  const status = explicitStatus === "COMPLETE" || candidateOnboardingStatus === "COMPLETE"
    ? "COMPLETE"
    : explicitStatus === "IN_PROGRESS" || candidateOnboardingStatus === "UNDER_REVIEW" || candidateOnboardingStatus === "READY"
      ? "IN_PROGRESS"
      : "PENDING";

  return {
    onboardingStatus: status,
    orientationDate: optionalString(record?.orientationDate),
    orientationLocation: optionalString(record?.orientationLocation),
    onboardingChecklist: normalizeChecklist(record?.onboardingChecklist),
    onboardingNotes: optionalString(record?.onboardingNotes),
    createdAt: optionalString(record?.createdAt),
    updatedAt: optionalString(record?.updatedAt),
  };
}

export function evaluateRecruitingV2ActivationReadiness(args: {
  qualificationSummary: RecruitingV2QualificationSummary;
  offer: RecruitingV2OfferMetadata;
  onboarding: RecruitingV2OnboardingMetadata;
  qualificationRisks: RecruitingV2OperationalRisk[];
}): RecruitingV2ActivationReadiness {
  const blockingItems: RecruitingV2ActivationIssue[] = [];
  const pendingItems: RecruitingV2ActivationIssue[] = [];
  const readinessReasons: string[] = [];

  if (args.qualificationSummary.status !== "READY") {
    blockingItems.push({
      problem: "Qualification incomplete",
      cause: args.qualificationSummary.reason,
      owner: args.qualificationRisks[0]?.owner ?? null,
      correction: args.qualificationSummary.nextRequiredAction,
      businessImpact: "Candidate cannot enter driver activation readiness until Qualification V2 is READY.",
      nextAction: "Complete qualification before activation",
      recheck: "Re-run the Recruiting V2 activation readiness API after qualification clears.",
    });
  } else {
    readinessReasons.push("Qualification is READY.");
  }

  if (args.offer.offerStatus !== "ACCEPTED") {
    blockingItems.push({
      problem: "Offer not accepted",
      cause: `Offer status is ${args.offer.offerStatus}.`,
      owner: null,
      correction: "Record offer acceptance in the Offer V2 workflow.",
      businessImpact: "Candidate cannot proceed to activation readiness until an accepted offer is recorded.",
      nextAction: "Offer acceptance required",
      recheck: "Re-run activation readiness after the offer is accepted.",
    });
  } else {
    readinessReasons.push("Offer is ACCEPTED.");
  }

  if (args.onboarding.onboardingStatus !== "COMPLETE") {
    pendingItems.push({
      problem: "Onboarding incomplete",
      cause: `Onboarding status is ${args.onboarding.onboardingStatus}.`,
      owner: null,
      correction: "Complete onboarding checklist and orientation metadata.",
      businessImpact: "Activation cannot be ready until onboarding is complete.",
      nextAction: "Complete onboarding before activation",
      recheck: "Re-run activation readiness after onboarding is marked COMPLETE.",
    });
  } else {
    readinessReasons.push("Onboarding is COMPLETE.");
  }

  const ready = blockingItems.length === 0 && pendingItems.length === 0;
  return {
    activationStatus: ready ? "READY" : "PENDING",
    activationStage: args.qualificationSummary.status !== "READY" ? "QUALIFICATION" : args.offer.offerStatus !== "ACCEPTED" ? "OFFER" : args.onboarding.onboardingStatus !== "COMPLETE" ? "ONBOARDING" : "ACTIVATION",
    ready,
    readinessReasons: ready ? [...readinessReasons, "Ready for authorized employee / driver activation handoff."] : readinessReasons,
    blockingItems,
    pendingItems,
    nextRequiredAction: blockingItems[0]?.nextAction as RecruitingV2ActivationReadiness["nextRequiredAction"] ?? pendingItems[0]?.nextAction as RecruitingV2ActivationReadiness["nextRequiredAction"] ?? "Review Paylocity Handoff Payload",
    currentDecision: ready ? "READY FOR ACTIVATION" : "NOT READY FOR ACTIVATION",
  };
}

export function buildPaylocityEmployeePayload(args: {
  candidate: { fullName: string; email: string; phone: string; homeLocation: string; cdlClass: string; cdlState: string };
  position: { positionCode: string };
  offer: RecruitingV2OfferMetadata;
  onboarding: RecruitingV2OnboardingMetadata;
  readiness: RecruitingV2ActivationReadiness;
}): PaylocityEmployeePreviewPayload {
  return {
    fullName: args.candidate.fullName,
    email: args.candidate.email,
    phone: args.candidate.phone,
    homeLocation: args.candidate.homeLocation,
    positionCode: args.position.positionCode,
    startDate: args.offer.startDate,
    orientationDate: args.onboarding.orientationDate ?? args.offer.orientationDate,
    cdlClass: args.candidate.cdlClass,
    cdlState: args.candidate.cdlState,
    activationDate: null,
  };
}