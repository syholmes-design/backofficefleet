export const SAMBA_OPERATOR_ROLES = [
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
  "FLEET_ADMIN",
  "FLEET_MANAGER",
  "FLEET_OPERATIONS",
  "DISPATCH",
] as const;

export type SambaStatementClass = "FACT" | "VERIFIED_EVIDENCE" | "INFERENCE" | "RECOMMENDATION";

export type SambaStatement = {
  class: SambaStatementClass;
  text: string;
  source: string;
  provenance: string;
  authority: "LIVE_BOF" | "DEMO_REFERENCE" | "EXTERNAL" | "INFERENCE";
};

export type SambaEvidenceRef = {
  source: string;
  entityType: string;
  entityId: string;
  provenance: string;
  timestamp: string | null;
  freshness?: string | null;
};

export const SAMBA_FINDING_TYPES = {
  FMCSA_CARRIER_CONFLICT: "FMCSA_CARRIER_CONFLICT",
  FMCSA_STALE_EVIDENCE: "FMCSA_STALE_EVIDENCE",
  PICKUP_STOPPED: "PICKUP_STOPPED",
  PICKUP_PHYSICAL_STOP: "PICKUP_PHYSICAL_STOP",
  PICKUP_REPEATED_STOP: "PICKUP_REPEATED_STOP",
  DRIVER_CREDENTIAL_EXPIRED: "DRIVER_CREDENTIAL_EXPIRED",
  DRIVER_NOT_READY: "DRIVER_NOT_READY",
  EQUIPMENT_UNAVAILABLE: "EQUIPMENT_UNAVAILABLE",
  EQUIPMENT_CONDITION_OPEN: "EQUIPMENT_CONDITION_OPEN",
  DRIVER_NOT_READY_PICKUP_RELATED: "DRIVER_NOT_READY_PICKUP_RELATED",
  EQUIPMENT_CONDITION_PICKUP_RELATED: "EQUIPMENT_CONDITION_PICKUP_RELATED",
  FMCSA_CARRIER_WORKFLOW_RELATED: "FMCSA_CARRIER_WORKFLOW_RELATED",
} as const;

export const SAMBA_PATTERN_TYPES = {
  REPEATED_PICKUP_STOP: "REPEATED_PICKUP_STOP",
  REPEATED_PICKUP_STOP_SAME_DRIVER: "REPEATED_PICKUP_STOP_SAME_DRIVER",
  REPEATED_PICKUP_STOP_SAME_EQUIPMENT: "REPEATED_PICKUP_STOP_SAME_EQUIPMENT",
  REPEATED_DRIVER_NOT_READY: "REPEATED_DRIVER_NOT_READY",
  REPEATED_EQUIPMENT_CONDITION: "REPEATED_EQUIPMENT_CONDITION",
  STALE_EXTERNAL_EVIDENCE: "STALE_EXTERNAL_EVIDENCE",
  UNRESOLVED_FMCSA_CONFLICT: "UNRESOLVED_FMCSA_CONFLICT",
} as const;

export type SambaTemporalLabel = "CURRENT" | "RECENT" | "HISTORICAL" | "STALE" | "UNAVAILABLE";

export type SambaRelatedEntity = {
  entityType: string;
  entityId: string;
  relationship: string;
  provenance: string;
  authority: SambaStatement["authority"];
  timestamp: string | null;
  temporalLabel: SambaTemporalLabel;
};

export type SambaContextNarrative = {
  whatHappened: string;
  whyItMatters: string;
  whatSupportsThis: string[];
  whatIsNotVerified: string;
  whatToReviewNext: string;
  workflowHref: string | null;
  workflowLabel: string | null;
};

export type SambaRecommendedReview = {
  text: string;
  workflowHref: string;
  workflowLabel: string;
  executesAction: false;
};

export type SambaOperationalContext = {
  authority: "SAMBA_INTELLIGENCE";
  mayAuthorOperationalState: false;
  mutatedOperationalRecords: false;
  llm: {
    configured: boolean;
    capability: "AI-INTEGRATION-DEPENDENT";
    mayAuthorOperationalState: false;
    usedForFindingState: false;
  };
  primaryEntity: SambaRelatedEntity | null;
  relatedEntities: SambaRelatedEntity[];
  recentEvents: Array<{
    eventType: string;
    entityType: string;
    entityId: string;
    resultingState: string | null;
    timestamp: string;
    temporalLabel: SambaTemporalLabel;
    provenance: "LIVE";
  }>;
  relevantFindings: Array<{ id: string; findingType: string; status: string; provenance: string }>;
  verifiedEvidence: SambaEvidenceRef[];
  externalEvidence: SambaEvidenceRef[];
  unresolvedExceptions: Array<{ id: string; exceptionType: string; entityType: string; entityId: string; status: string }>;
  repeatedPatterns: Array<{ patternType: string; relatedEntityType: string; relatedEntityId: string; evidenceCount: number; inference: string }>;
  missingEvidence: string[];
  recommendedReview: SambaRecommendedReview | null;
  narrative: SambaContextNarrative;
  summary: string;
  provenance: string;
  timestamps: { generatedAt: string };
};
