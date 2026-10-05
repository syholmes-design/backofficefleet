/**
 * BOF document family model.
 *
 * BOF DOCUMENT FAMILY -> BOF MASTER DOCUMENT (carrier-neutral, BOF-owned,
 * versioned) -> CARRIER CANONICAL INSTANCE (carrier-branded, local code/title,
 * permitted overrides, pinned to a master version, carrier adoption) -> RECORD
 * (filled/signed copy pinned to instance@version).
 *
 * Carrier-local codes are labels within one carrier, never global IDs.
 * Carrier adoption is NEVER BOF master approval.
 */
import type {
  DigitalBehavior,
  DocumentFunction,
  DocumentLifecycle,
  DocumentTypeCode,
  EvidenceMedium,
  ProductionGate,
  RegulatoryReview,
  RosterRecommendation,
  VaultClass,
} from "@/lib/document-control/types";
import type { CarrierId, FamilyKey, InstanceId, MasterId } from "./ids";

export type { CarrierId, FamilyKey, InstanceId, MasterId };

// ---- Provenance ----

export const PROVENANCE_ORIGINS = [
  "BOF_AUTHORED",
  "CARRIER_ORIGINATED",
  "DERIVED_FROM_INSTANCE",
] as const;
export type ProvenanceOrigin = (typeof PROVENANCE_ORIGINS)[number];

export const SOURCE_REF_KINDS = [
  "REPO_FILE",
  "DOCX",
  "PRISMA_SEED",
  "ROSTER_NOTE",
  "OTHER",
] as const;
export type SourceRefKind = (typeof SOURCE_REF_KINDS)[number];

export type SourceRef = {
  kind: SourceRefKind;
  ref: string;
  commit?: string;
  note?: string;
};

export type Provenance = {
  origin: ProvenanceOrigin;
  sourceRefs: SourceRef[];
  /** Set when origin is DERIVED_FROM_INSTANCE. */
  derivedFromInstanceId?: InstanceId;
  /**
   * The specific instance version (instanceVersion, never a master version)
   * that a DERIVED_FROM_INSTANCE master/instance came from.
   */
  derivedFromInstanceVersion?: string;
  note?: string;
};

// ---- Approval / adoption (distinct scopes; never conflate) ----

export const MASTER_APPROVAL_STATUSES = [
  "NOT_APPROVED",
  "PENDING",
  "APPROVED",
] as const;
export type MasterApprovalStatus = (typeof MASTER_APPROVAL_STATUSES)[number];

export const MASTER_REVOCATION_REASONS = [
  "LEGAL",
  "REGULATORY",
  "SAFETY",
  "EXPLICIT",
] as const;
export type MasterRevocationReason = (typeof MASTER_REVOCATION_REASONS)[number];

/**
 * Revocation of an approved master version. Besides ARCHIVED, revocation is
 * the only thing that immediately invalidates carrier instances pinned to
 * that master version. A newer master version being published does NOT.
 */
export type MasterRevocation = {
  reason: MasterRevocationReason;
  revokedAt: string;
  evidenceRef: string | null;
  note?: string;
};

/** BOF approval of a master document. */
export type MasterApproval = {
  scope: "BOF_MASTER";
  status: MasterApprovalStatus;
  approverRole: string;
  approverName: string | null;
  approvedAt: string | null;
  evidenceRef: string | null;
  /** A revoked master version is not approved, regardless of status. */
  revocation?: MasterRevocation | null;
};

export const CARRIER_ADOPTION_STATUSES = [
  "NOT_ADOPTED",
  "PENDING",
  "ADOPTED",
] as const;
export type CarrierAdoptionStatus = (typeof CARRIER_ADOPTION_STATUSES)[number];

/** A carrier's adoption of its instance. Never implies BOF master approval. */
export type CarrierAdoption = {
  scope: "CARRIER_ADOPTION";
  carrierId: CarrierId;
  status: CarrierAdoptionStatus;
  adoptedByName: string | null;
  adoptedByTitle: string | null;
  adoptedAt: string | null;
  evidenceRef: string | null;
};

// ---- Overrides ----

export const OVERRIDE_KINDS = ["IDENTITY", "FACT", "TEXT"] as const;
export type OverrideKind = (typeof OVERRIDE_KINDS)[number];

export type OverrideConstraint = {
  min?: number;
  max?: number;
  enum?: readonly (string | number)[];
  pattern?: string;
};

/** Declared on a master: which paths a carrier instance may override. */
export type OverrideRule = {
  path: string;
  kind: OverrideKind;
  allowed: boolean;
  regulatory: boolean;
  requiresComplianceReview: boolean;
  constraint?: OverrideConstraint;
  description?: string;
};

export type OverrideValue = string | number | boolean;

/** Applied on a carrier instance. */
export type CarrierOverride = {
  path: string;
  value: OverrideValue;
  rationale: string;
  masterDefault?: OverrideValue | null;
};

// ---- Carrier profile ----

export const CARRIER_FACT_STATUSES = [
  "RECORDED",
  "CONFLICTING",
  "NOT_RECORDED",
] as const;
export type CarrierFactStatus = (typeof CARRIER_FACT_STATUSES)[number];

export type CarrierFact<T> = {
  value: T | null;
  status: CarrierFactStatus;
  sources: SourceRef[];
  conflictingValues?: { value: T; source: SourceRef }[];
  note?: string;
};

export type PostalAddress = {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type CarrierContact = {
  role: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type ApprovalAuthority = {
  role: string;
  name: string | null;
  title: string | null;
};

export type CarrierProfile = {
  carrierId: CarrierId;
  fleetRef: { fleetSlug: string | null; fleetId: string | null };
  profileStatus: "DEMO" | "LIVE";
  legalName: CarrierFact<string>;
  dba: CarrierFact<string>;
  logoRef: CarrierFact<string>;
  address: CarrierFact<PostalAddress>;
  usdot: CarrierFact<string>;
  mc: CarrierFact<string>;
  contacts: CarrierFact<CarrierContact[]>;
  approvalAuthority: CarrierFact<ApprovalAuthority>;
  /** Carrier-local code prefix (label only, never a global ID). */
  localCodePrefix: CarrierFact<string>;
};

// ---- Family / master / instance ----

export type DocumentFamily = {
  familyKey: FamilyKey;
  title: string;
  function: DocumentFunction;
  type: DocumentTypeCode;
  purpose: string;
  vaultClass: VaultClass;
  digitalBehavior: DigitalBehavior;
  workflow: string;
  user: string;
  aliases: FamilyKey[];
  related: { policy?: FamilyKey; sop?: FamilyKey; form?: FamilyKey };
};

/** Carrier-neutral, BOF-owned, versioned master. */
export type MasterDocument = {
  masterId: MasterId;
  familyKey: FamilyKey;
  version: string;
  title: string;
  lifecycle: DocumentLifecycle;
  approval: MasterApproval;
  productionGate: ProductionGate;
  regulatoryReview: RegulatoryReview;
  owner: string;
  steward: string;
  complianceReviewer: string;
  evidenceMedium?: EvidenceMedium;
  recommendation: RosterRecommendation;
  overrideRules: OverrideRule[];
  provenance: Provenance;
  href?: string;
  stableAppIds: string[];
  effectiveDate?: string | null;
  supersedesMasterId?: MasterId | null;
  /**
   * ISO timestamp at which this master version stopped accepting NEW
   * adoptions (lifecycle SUPERSEDED). A carrier adoption dated before it is
   * an existing adoption and may remain effective; one dated on or after it
   * is a new adoption against a superseded master and is rejected.
   */
  supersededAt?: string | null;
  contentHash?: string | null;
  notes: string;
};

/** Carrier-branded canonical instance pinned to a master version. */
export type CarrierInstance = {
  instanceId: InstanceId;
  familyKey: FamilyKey;
  carrierId: CarrierId;
  /** null = BOF master not yet authored (carrier-originated). */
  masterId: MasterId | null;
  instanceVersion: string;
  /**
   * Carrier-local label within one carrier, never a global ID.
   * null when source evidence does not establish a carrier-local code.
   * A printed BOF document number is provenance, not a local code.
   */
  localCode: string | null;
  localTitle: string;
  lifecycle: DocumentLifecycle;
  adoption: CarrierAdoption;
  overrides: CarrierOverride[];
  provenance: Provenance;
  href?: string;
  stableAppIds: string[];
  effectiveDate?: string | null;
  supersedesInstanceVersion?: string | null;
  notes?: string;
};

// ---- Records ----

export const RECORD_KINDS = ["FILLED", "SIGNED", "SAMPLE"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

/** Filled/signed copy pinned to instance@version. */
export type DocumentRecordRef = {
  recordId: string;
  kind: RecordKind;
  instanceId: InstanceId;
  instanceVersion: string;
};

export type DocumentFamilyGraph = {
  families: DocumentFamily[];
  masters: MasterDocument[];
  carriers: CarrierProfile[];
  instances: CarrierInstance[];
  records: DocumentRecordRef[];
};
