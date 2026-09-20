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
} as const;
