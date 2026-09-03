import type { SessionUserLike } from "@/lib/authorization";

export const LOAD_PROCESS_SPINE = [
  "LOAD_INTAKE",
  "CANONICAL_LOAD",
  "DISPATCH",
  "DRIVER_EQUIPMENT",
  "DOCUMENTS",
  "PRE_TRIP_EVIDENCE",
  "READINESS",
  "RELEASE",
  "DELIVERY_PROOF",
  "SETTLEMENT",
  "INVOICE_CASH",
] as const;

export type LoadProcessStage = (typeof LOAD_PROCESS_SPINE)[number];

export type RecordLifecycleClass = "LIVE" | "HISTORICAL";
export type RecordOriginKind = "BOF_CREATED" | "USER_CREATED" | "IMPORTED" | "EXTERNAL_SYSTEM" | "SYSTEM_GENERATED";
export type RecordVerificationClass = "VERIFIED" | "UNVERIFIED";
export type RecordDerivationKind = "SOURCE" | "DERIVED";
export type OriginValidationStatus = "PENDING" | "PASSED" | "FAILED";

export type OperatingProcessEventType =
  | "LOAD_INTAKE_RECORDED"
  | "CANONICAL_LOAD_RECORDED"
  | "DISPATCH_ASSIGNED"
  | "DRIVER_LINKED"
  | "EQUIPMENT_LINKED"
  | "DOCUMENT_ATTACHED"
  | "PRETRIP_RECORDED"
  | "EVIDENCE_CAPTURED"
  | "READINESS_EVALUATED"
  | "RELEASE_EVALUATED"
  | "DELIVERY_PROOF_RECORDED"
  | "SETTLEMENT_RECORDED"
  | "INVOICE_RECORDED"
  | "EXCEPTION_OPENED"
  | "CORRECTIVE_ACTION_RECORDED"
  | "EXCEPTION_VERIFIED"
  | "DELIVERED"
  | "DELIVERY_EXCEPTION"
  | "POD_RECEIVED"
  | "POD_VERIFIED"
  | "SETTLEMENT_CREATED"
  | "SETTLEMENT_HELD"
  | "SETTLEMENT_REVIEWED"
  | "SETTLEMENT_APPROVED"
  | "SETTLEMENT_PAID"
  | "SETTLEMENT_CLOSED"
  | "INVOICE_CREATED"
  | "INVOICE_SUBMITTED"
  | "INVOICE_EXCEPTION"
  | "INVOICE_APPROVED"
  | "INVOICE_PAID"
  | "INVOICE_CLOSED"
  | "PAYMENT_RECORDED";

export type OperatingActorType = "USER" | "DRIVER" | "BOF_OPERATIONS" | "SYSTEM" | "EXTERNAL";
export type OperatingOwnerTeam =
  | "BOF_OPERATIONS"
  | "COMPLIANCE"
  | "DISPATCH"
  | "FINANCE"
  | "HR"
  | "SAFETY"
  | "CUSTOMER_SUCCESS"
  | "FLEET_PERSONNEL";

export type OperatingExceptionStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "VERIFIED";
export type OperatingActionStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED";
export type IngestionSourceFormat = "CSV" | "EXCEL" | "JSON" | "API" | "STRUCTURED" | "DOCUMENT_METADATA";
export type IngestionRecordStatus =
  | "RECEIVED"
  | "MAPPED"
  | "NORMALIZED"
  | "VALIDATED"
  | "REJECTED"
  | "CANONICALIZED"
  | "EVENT_RECORDED";

export type RecordLineage = {
  lifecycleClass: RecordLifecycleClass;
  originKind: RecordOriginKind;
  verificationClass: RecordVerificationClass;
  derivationKind: RecordDerivationKind;
  sourceSystem?: string | null;
  sourceRecordId?: string | null;
  importedAt?: Date | null;
  originValidationStatus?: OriginValidationStatus | null;
};

export type OperatingProcessEvent = {
  id: string;
  fleetId: string;
  loadId?: string | null;
  entityType: string;
  entityId: string;
  eventType: OperatingProcessEventType;
  processStage: LoadProcessStage;
  eventTimestamp: Date;
  recordedAt: Date;
  actorId?: string | null;
  actorType: OperatingActorType;
  lineage: RecordLineage;
  priorState?: string | null;
  resultingState?: string | null;
  evidenceIds?: string[];
  documentIds?: string[];
  exceptionId?: string | null;
  decisionType?: string | null;
  decisionResult?: string | null;
  decisionReason?: string | null;
  decisionOwner?: string | null;
  operationalConsequence?: string | null;
  financialConsequence?: string | null;
  serviceConsequence?: string | null;
  actionId?: string | null;
  resolutionStatus?: string | null;
  resolutionTimestamp?: Date | null;
  verificationActor?: string | null;
  verificationEvidence?: string | null;
  relatedRecordType?: string | null;
  relatedRecordId?: string | null;
};

export type OperatingException = {
  id: string;
  fleetId: string;
  loadId?: string | null;
  entityType: string;
  entityId: string;
  processStage: LoadProcessStage;
  exceptionType: string;
  deviation: string;
  consequence: string;
  severity: string;
  ownerTeam: OperatingOwnerTeam;
  ownerUserId?: string | null;
  dueAt?: Date | null;
  status: OperatingExceptionStatus;
  recurrenceCount: number;
};

export type OperatingCorrectiveAction = {
  id: string;
  fleetId: string;
  exceptionId: string;
  loadId?: string | null;
  actionType: string;
  assignedOwnerTeam: OperatingOwnerTeam;
  assignedOwnerUserId?: string | null;
  status: OperatingActionStatus;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  verificationActor?: string | null;
  verificationEvidence?: string | null;
  outcome?: string | null;
};

export type CanonicalLoadRecord = {
  id: string;
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  referenceNumber?: string | null;
  status: string;
  lineage: RecordLineage;
};

export type IngestionRecord = {
  id: string;
  batchId: string;
  fleetId: string;
  sourceRecordId: string;
  idempotencyKey: string;
  sourcePayload: Record<string, unknown>;
  mappedPayload?: Record<string, unknown> | null;
  normalizedPayload?: Record<string, unknown> | null;
  validationStatus: OriginValidationStatus;
  validationMessage?: string | null;
  status: IngestionRecordStatus;
  canonicalEntityType?: string | null;
  canonicalEntityId?: string | null;
  loadId?: string | null;
  operatingEventId?: string | null;
};

export type RecordEventInput = Omit<OperatingProcessEvent, "id" | "recordedAt" | "lineage"> & {
  id?: string;
  recordedAt?: Date;
  lineage?: Partial<RecordLineage>;
};

export type LoadDeliveryStatus = "DELIVERED" | "DELIVERY_EXCEPTION" | "UNDELIVERED";
export type LoadProofType = "POD" | "BOL" | "PHOTO" | "GEOLOCATION" | "SIGNATURE" | "OTHER";
export type LoadProofStatus = "RECEIVED" | "VERIFIED" | "REJECTED" | "MISSING" | "EXCEPTION";
export type SettlementRecordStatus =
  | "DRAFT"
  | "CREATED"
  | "HELD"
  | "REVIEWED"
  | "APPROVED"
  | "PAID"
  | "CLOSED"
  | "EXCEPTION";
export type InvoiceRecordStatus = "DRAFT" | "CREATED" | "SUBMITTED" | "EXCEPTION" | "APPROVED" | "PAID" | "CLOSED";
export type InvoicePaymentStatus = "RECORDED" | "APPLIED" | "FAILED";
export type DataAuthority = "AUTHORITATIVE_PERSISTED_DATA" | "DEMO_DATA";

export type LoadDeliveryRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  status: LoadDeliveryStatus;
  deliveredAt?: Date | null;
  deliveryLocation?: string | null;
  exceptionStatus?: string | null;
  lineage: RecordLineage;
  idempotencyKey: string;
};

export type LoadProofRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  deliveryId?: string | null;
  proofType: LoadProofType;
  status: LoadProofStatus;
  evidenceId?: string | null;
  documentId?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  exceptionStatus?: string | null;
  lineage: RecordLineage;
  idempotencyKey: string;
};

export type SettlementRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  driverId?: string | null;
  settlementDate: Date;
  payBasis?: string | null;
  grossAmount: string;
  deductions: string;
  reimbursements: string;
  advances: string;
  netAmount: string;
  status: SettlementRecordStatus;
  holdReason?: string | null;
  lineage: RecordLineage;
  idempotencyKey: string;
};

export type InvoiceRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  customerId?: string | null;
  invoiceDate: Date;
  amount: string;
  status: InvoiceRecordStatus;
  submittedAt?: Date | null;
  paidAt?: Date | null;
  terms?: string | null;
  lineage: RecordLineage;
  idempotencyKey: string;
};

export type InvoicePaymentRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  invoiceId: string;
  amount: string;
  paidAt: Date;
  status: InvoicePaymentStatus;
  lineage: RecordLineage;
  idempotencyKey: string;
};

export type ReconstructionRecordClass =
  | "AUTHORITATIVE_PERSISTED_EVENT"
  | "AUTHORITATIVE_SUPPORTING_RECORD"
  | "EVIDENCE"
  | "EXCEPTION"
  | "CORRECTIVE_ACTION"
  | "UNAVAILABLE";

export type LoadProcessStageSummary = {
  stage: LoadProcessStage;
  status: "present" | "unavailable";
  recordClass: ReconstructionRecordClass;
  eventTypes: OperatingProcessEventType[];
  supportingRecordCount: number;
};

export type LoadProcessReconstruction = {
  fleetId: string;
  loadId: string;
  lineage: RecordLineage | null;
  dataAuthority: "AUTHORITATIVE_PERSISTED_DATA";
  events: OperatingProcessEvent[];
  exceptions: OperatingException[];
  actions: OperatingCorrectiveAction[];
  supportingRecords: {
    deliveries: LoadDeliveryRecord[];
    proofs: LoadProofRecord[];
    settlements: SettlementRecord[];
    invoices: InvoiceRecord[];
    payments: InvoicePaymentRecord[];
  };
  stages: Array<{ stage: LoadProcessStage; events: OperatingProcessEvent[] }>;
  stageSummaries: LoadProcessStageSummary[];
  missingStages: LoadProcessStage[];
  reconstructable: boolean;
};

export type SessionActor = SessionUserLike;

export class ProcessIntelligenceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ProcessIntelligenceError";
    this.statusCode = statusCode;
  }
}
