import type { RecruitingV2QualificationSummary } from "@/lib/recruiting-v2/qualification-engine";

export const RECRUITING_V2_OFFER_STATUSES = ["NOT_PROVIDED", "DRAFT", "SENT", "ACCEPTED", "DECLINED"] as const;

export type RecruitingV2OfferStatus = (typeof RECRUITING_V2_OFFER_STATUSES)[number];

export type RecruitingV2OfferMetadata = {
  offerCode: string | null;
  offerStatus: RecruitingV2OfferStatus;
  compensation: string | null;
  startDate: string | null;
  orientationDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
};

export type RecruitingV2OfferDecision = {
  currentDecision: "Offer not yet available" | "Eligible for Offer Review" | "Offer Draft" | "Offer Sent" | "Offer Accepted" | "Offer Declined";
  reason: string;
  nextRequiredAction: "Complete qualification" | "Review interview recommendation" | "Create offer draft" | "Review offer" | "Send offer" | "Await candidate response" | "Start onboarding" | "Review recruiting disposition";
  qualificationPrerequisite: "Offer unavailable - qualification requirements remain blocked." | "Offer pending - qualification is not yet complete." | "Eligible for Offer Review.";
  offerActions: Array<"CREATE_DRAFT" | "UPDATE_DRAFT" | "SEND_OFFER" | "RECORD_ACCEPTANCE" | "RECORD_DECLINE">;
};

export function isRecruitingV2OfferStatus(value: string): value is RecruitingV2OfferStatus {
  return RECRUITING_V2_OFFER_STATUSES.includes(value as RecruitingV2OfferStatus);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeRecruitingV2OfferSummary(value: unknown): RecruitingV2OfferMetadata {
  const record = asRecord(value);
  const status = optionalString(record?.offerStatus);
  return {
    offerCode: optionalString(record?.offerCode),
    offerStatus: status && isRecruitingV2OfferStatus(status) ? status : "NOT_PROVIDED",
    compensation: optionalString(record?.compensation),
    startDate: optionalString(record?.startDate),
    orientationDate: optionalString(record?.orientationDate),
    notes: optionalString(record?.notes),
    createdAt: optionalString(record?.createdAt),
    updatedAt: optionalString(record?.updatedAt),
    sentAt: optionalString(record?.sentAt),
    acceptedAt: optionalString(record?.acceptedAt),
    declinedAt: optionalString(record?.declinedAt),
    declineReason: optionalString(record?.declineReason),
  };
}

export function evaluateRecruitingV2OfferDecision(args: {
  qualificationSummary: RecruitingV2QualificationSummary;
  offer: RecruitingV2OfferMetadata;
}): RecruitingV2OfferDecision {
  const prerequisite = args.qualificationSummary.status === "BLOCKED"
    ? "Offer unavailable - qualification requirements remain blocked."
    : args.qualificationSummary.status === "PENDING"
      ? "Offer pending - qualification is not yet complete."
      : "Eligible for Offer Review.";

  if (args.qualificationSummary.status === "BLOCKED") {
    return {
      currentDecision: "Offer not yet available",
      reason: args.qualificationSummary.reason,
      nextRequiredAction: "Complete qualification",
      qualificationPrerequisite: prerequisite,
      offerActions: [],
    };
  }

  if (args.qualificationSummary.status === "PENDING") {
    return {
      currentDecision: "Offer not yet available",
      reason: args.qualificationSummary.reason,
      nextRequiredAction: args.qualificationSummary.interviewEvaluation.status === "PENDING" ? "Review interview recommendation" : "Complete qualification",
      qualificationPrerequisite: prerequisite,
      offerActions: [],
    };
  }

  if (args.offer.offerStatus === "DRAFT") {
    return {
      currentDecision: "Offer Draft",
      reason: "Qualification is ready and a draft offer metadata record exists.",
      nextRequiredAction: "Review offer",
      qualificationPrerequisite: prerequisite,
      offerActions: ["UPDATE_DRAFT", "SEND_OFFER"],
    };
  }

  if (args.offer.offerStatus === "SENT") {
    return {
      currentDecision: "Offer Sent",
      reason: "Offer metadata has been marked sent and is awaiting candidate response.",
      nextRequiredAction: "Await candidate response",
      qualificationPrerequisite: prerequisite,
      offerActions: ["RECORD_ACCEPTANCE", "RECORD_DECLINE"],
    };
  }

  if (args.offer.offerStatus === "ACCEPTED") {
    return {
      currentDecision: "Offer Accepted",
      reason: "Candidate response metadata records offer acceptance.",
      nextRequiredAction: "Start onboarding",
      qualificationPrerequisite: prerequisite,
      offerActions: [],
    };
  }

  if (args.offer.offerStatus === "DECLINED") {
    return {
      currentDecision: "Offer Declined",
      reason: "Candidate response metadata records offer decline.",
      nextRequiredAction: "Review recruiting disposition",
      qualificationPrerequisite: prerequisite,
      offerActions: [],
    };
  }

  return {
    currentDecision: "Eligible for Offer Review",
    reason: "Qualification is ready and no offer metadata record has been created.",
    nextRequiredAction: "Create offer draft",
    qualificationPrerequisite: prerequisite,
    offerActions: ["CREATE_DRAFT"],
  };
}

export function allowedRecruitingV2OfferTransition(from: RecruitingV2OfferStatus, to: RecruitingV2OfferStatus) {
  if (from === "NOT_PROVIDED" && to === "DRAFT") return true;
  if (from === "DRAFT" && to === "DRAFT") return true;
  if (from === "DRAFT" && to === "SENT") return true;
  if (from === "SENT" && to === "ACCEPTED") return true;
  if (from === "SENT" && to === "DECLINED") return true;
  return false;
}