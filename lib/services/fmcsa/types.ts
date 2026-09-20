/**
 * FMCSA QCMobile is the only confirmed carrier lookup API used here.
 * Official docs: https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi
 * Elements: https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiElements
 *
 * This layer is evidence, not BOF operational authority.
 */

export const FMCSA_QCMOBILE_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services";

export type FmcsaQueryKind = "USDOT" | "DOCKET";
export type FmcsaVerificationResult = "VERIFIED" | "NOT_VERIFIED" | "UNAVAILABLE" | "STALE" | "CONFLICT" | "ERROR";
export type FmcsaProvenance = "LIVE" | "CACHED" | "FIXTURE" | "UNAVAILABLE" | "ERROR";
export type FmcsaFreshnessState = "NEVER_VERIFIED" | "LIVE_RETRIEVED" | "CACHED" | "STALE" | "UNAVAILABLE";
export type FmcsaFieldCompare = "MATCH" | "MISMATCH" | "UNVERIFIED" | "UNAVAILABLE" | "STALE";

export type FmcsaLookupRequest = {
  kind: FmcsaQueryKind;
  value: string;
};

export type FmcsaNormalizedCarrier = {
  usdot: string | null;
  docketNumber: string | null;
  legalName: string | null;
  dbaName: string | null;
  allowToOperate: string | null;
  outOfService: string | null;
  outOfServiceDate: string | null;
};

export type FmcsaProviderOutcome = {
  status: "FOUND" | "NOT_FOUND" | "UNAVAILABLE" | "ERROR";
  provenance: Exclude<FmcsaProvenance, "CACHED">;
  retrievedAt: Date | null;
  endpointUsed: string | null;
  carrier: FmcsaNormalizedCarrier | null;
  errorCode?: string;
  errorMessage?: string;
};

export type FmcsaRegulatoryProvider = {
  id: "qcmobile" | "fixture" | "unavailable";
  lookup(request: FmcsaLookupRequest): Promise<FmcsaProviderOutcome>;
};

export type BofCarrierSnapshot = {
  id: string;
  legalName: string;
  dba: string;
  dotNumber: string;
  mcNumber: string;
  authorityStatus: string;
  authorityClass: "DEMO_REFERENCE";
};

export type FmcsaFieldComparison = {
  field: "usdot" | "docketNumber" | "legalName" | "dbaName" | "operatingStatus";
  bofValue: string | null;
  fmcsaValue: string | null;
  result: FmcsaFieldCompare;
};

export const FMCSA_VERIFY_ROLES = [
  "FLEET_ADMIN",
  "FLEET_OPERATIONS",
  "DISPATCH",
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
] as const;
