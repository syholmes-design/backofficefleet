import type { RecruitingV2DocumentStatus, RecruitingV2DocumentType, RecruitingV2GateState } from "@prisma/client";

export const RECRUITING_V2_DOCUMENT_TYPES = [
  "CDL",
  "MVR",
  "MEDICAL",
  "CLEARINGHOUSE",
  "I9",
  "W9",
  "ROAD_TEST",
  "EMPLOYMENT_VERIFICATION",
] as const satisfies RecruitingV2DocumentType[];

export type RecruitingV2ExpirationStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_PROVIDED";

export type RecruitingV2DocumentRecordForGate = {
  documentCode: string;
  documentType: RecruitingV2DocumentType;
  status: RecruitingV2DocumentStatus;
  expirationDate: Date | string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  metadata: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type RecruitingV2DocumentGateEvaluation = {
  documentType: RecruitingV2DocumentType;
  label: string;
  templateLabel: string;
  templateHref: string | null;
  collectionInstruction: string;
  documentStatus: RecruitingV2DocumentStatus | "NOT_PROVIDED";
  gateState: RecruitingV2GateState;
  reason: string;
  requiredAction: string;
  expirationStatus: RecruitingV2ExpirationStatus;
  expirationWarning: string | null;
  latestDocument: RecruitingV2DocumentRecordForGate | null;
};

const EXPIRING_SOON_DAYS = 45;

const DOCUMENT_DEFINITIONS: Record<RecruitingV2DocumentType, {
  label: string;
  templateLabel: string;
  templateHref: string | null;
  collectionInstruction: string;
}> = {
  CDL: {
    label: "CDL",
    templateLabel: "CDL Verification Template",
    templateHref: "/generated/templates/driver-docs/cdl-template.html",
    collectionInstruction: "Collect the candidate CDL credential details and review identity match before qualification advances.",
  },
  MVR: {
    label: "MVR",
    templateLabel: "MVR Template",
    templateHref: "/generated/templates/driver-docs/mvr-template.html",
    collectionInstruction: "Request and review the motor vehicle record for the candidate state and role.",
  },
  MEDICAL: {
    label: "Medical",
    templateLabel: "Medical Certificate Template",
    templateHref: "/generated/templates/driver-docs/medical-card-template.html",
    collectionInstruction: "Collect the DOT medical certificate metadata and verify expiration before activation.",
  },
  CLEARINGHOUSE: {
    label: "Clearinghouse",
    templateLabel: "FMCSA / Clearinghouse Template",
    templateHref: "/generated/templates/driver-docs/fmcsa-compliance-template.html",
    collectionInstruction: "Record clearinghouse consent and review status for the candidate compliance gate.",
  },
  I9: {
    label: "I-9",
    templateLabel: "I-9 Template",
    templateHref: "/generated/templates/driver-docs/i9-template.html",
    collectionInstruction: "Register employment eligibility review metadata without treating the template as candidate evidence.",
  },
  W9: {
    label: "W-9",
    templateLabel: "W-9 Template",
    templateHref: "/generated/templates/driver-docs/w9-template.html",
    collectionInstruction: "Register tax classification metadata when this candidate workflow requires it.",
  },
  ROAD_TEST: {
    label: "Road Test",
    templateLabel: "Road Test Certificate Template",
    templateHref: "/generated/templates/driver-docs/road-test-certificate-template.html",
    collectionInstruction: "Register the road test certificate workflow result after the candidate completes the test.",
  },
  EMPLOYMENT_VERIFICATION: {
    label: "Employment Verification",
    templateLabel: "Employment Verification Template",
    templateHref: "/generated/templates/driver-docs/employment-verification-template.html",
    collectionInstruction: "Track prior-employer verification metadata and safety performance history review.",
  },
};

export function getRecruitingV2DocumentDefinition(documentType: RecruitingV2DocumentType) {
  return DOCUMENT_DEFINITIONS[documentType];
}

export function formatRecruitingV2DocumentType(documentType: RecruitingV2DocumentType) {
  return DOCUMENT_DEFINITIONS[documentType].label;
}

export function evaluateExpiration(expirationDate: Date | string | null, asOf = new Date()): {
  expirationStatus: RecruitingV2ExpirationStatus;
  expirationWarning: string | null;
} {
  if (!expirationDate) return { expirationStatus: "NOT_PROVIDED", expirationWarning: null };
  const expiration = expirationDate instanceof Date ? expirationDate : new Date(expirationDate);
  if (Number.isNaN(expiration.getTime())) return { expirationStatus: "NOT_PROVIDED", expirationWarning: null };

  const msUntilExpiration = expiration.getTime() - asOf.getTime();
  if (msUntilExpiration < 0) return { expirationStatus: "EXPIRED", expirationWarning: "Document expiration has passed." };

  const daysUntilExpiration = Math.ceil(msUntilExpiration / 86_400_000);
  if (daysUntilExpiration <= EXPIRING_SOON_DAYS) {
    return { expirationStatus: "EXPIRING_SOON", expirationWarning: `Expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? "" : "s"}.` };
  }

  return { expirationStatus: "VALID", expirationWarning: null };
}

export function evaluateRecruitingV2DocumentGate(args: {
  documentType: RecruitingV2DocumentType;
  latestDocument: RecruitingV2DocumentRecordForGate | null;
  asOf?: Date;
}): RecruitingV2DocumentGateEvaluation {
  const definition = DOCUMENT_DEFINITIONS[args.documentType];
  const expiration = evaluateExpiration(args.latestDocument?.expirationDate ?? null, args.asOf ?? new Date());

  if (!args.latestDocument) {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: "NOT_PROVIDED",
      gateState: "BLOCKED",
      reason: "Required document not provided.",
      requiredAction: "Submit document metadata for review.",
      ...expiration,
      latestDocument: null,
    };
  }

  if (args.latestDocument.status === "REJECTED") {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: args.latestDocument.status,
      gateState: "BLOCKED",
      reason: "Latest document record was rejected.",
      requiredAction: "Register corrected document metadata.",
      ...expiration,
      latestDocument: args.latestDocument,
    };
  }

  if (args.latestDocument.status === "RECEIVED") {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: args.latestDocument.status,
      gateState: "OPEN",
      reason: "Document received but not verified.",
      requiredAction: "Review document metadata.",
      ...expiration,
      latestDocument: args.latestDocument,
    };
  }

  if (args.latestDocument.status === "PENDING_REVIEW") {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: args.latestDocument.status,
      gateState: "OPEN",
      reason: "Verification pending.",
      requiredAction: "Complete document review.",
      ...expiration,
      latestDocument: args.latestDocument,
    };
  }

  if (expiration.expirationStatus === "EXPIRED") {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: args.latestDocument.status,
      gateState: "BLOCKED",
      reason: "Verified document is expired.",
      requiredAction: "Obtain current document.",
      ...expiration,
      latestDocument: args.latestDocument,
    };
  }

  if (expiration.expirationStatus === "EXPIRING_SOON") {
    return {
      documentType: args.documentType,
      ...definition,
      documentStatus: args.latestDocument.status,
      gateState: "OPEN",
      reason: "Verified document is approaching expiration.",
      requiredAction: "Plan renewal before expiration.",
      ...expiration,
      latestDocument: args.latestDocument,
    };
  }

  return {
    documentType: args.documentType,
    ...definition,
    documentStatus: args.latestDocument.status,
    gateState: "SATISFIED",
    reason: "Latest document record is verified and current.",
    requiredAction: "No document action required.",
    ...expiration,
    latestDocument: args.latestDocument,
  };
}

export function evaluateRecruitingV2DocumentGates(records: RecruitingV2DocumentRecordForGate[], asOf = new Date()) {
  const latestByType = new Map<RecruitingV2DocumentType, RecruitingV2DocumentRecordForGate>();
  for (const record of records) {
    const current = latestByType.get(record.documentType);
    const currentUpdatedAt = current ? new Date(current.updatedAt).getTime() : 0;
    const recordUpdatedAt = new Date(record.updatedAt).getTime();
    if (!current || recordUpdatedAt > currentUpdatedAt) latestByType.set(record.documentType, record);
  }

  return RECRUITING_V2_DOCUMENT_TYPES.map((documentType) =>
    evaluateRecruitingV2DocumentGate({ documentType, latestDocument: latestByType.get(documentType) ?? null, asOf }),
  );
}