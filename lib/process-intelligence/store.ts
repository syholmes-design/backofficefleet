import type {
  CanonicalLoadRecord,
  IngestionRecord,
  InvoicePaymentRecord,
  InvoiceRecord,
  LoadDeliveryRecord,
  LoadProofRecord,
  OperatingCorrectiveAction,
  OperatingException,
  OperatingProcessEvent,
  RecordEventInput,
  RecordLineage,
  SettlementRecord,
} from "@/lib/process-intelligence/types";

export type OperatingEventBusinessKey = {
  fleetId: string;
  eventType: OperatingProcessEvent["eventType"];
  entityType: string;
  entityId: string;
  relatedRecordType?: string | null;
  relatedRecordId?: string | null;
};

export type OperatingProcessStore = {
  createLoad(record: CanonicalLoadRecord): Promise<CanonicalLoadRecord>;
  getLoad(fleetId: string, loadId: string): Promise<CanonicalLoadRecord | null>;
  recordEvent(event: RecordEventInput & { id: string; recordedAt: Date; lineage: RecordLineage }): Promise<OperatingProcessEvent>;
  findEventByBusinessKey(key: OperatingEventBusinessKey): Promise<OperatingProcessEvent | null>;
  listEventsForLoad(fleetId: string, loadId: string): Promise<OperatingProcessEvent[]>;
  getEvent(fleetId: string, eventId: string): Promise<OperatingProcessEvent | null>;
  createException(exception: OperatingException): Promise<OperatingException>;
  getException(fleetId: string, exceptionId: string): Promise<OperatingException | null>;
  listExceptionsForLoad(fleetId: string, loadId: string): Promise<OperatingException[]>;
  createAction(action: OperatingCorrectiveAction): Promise<OperatingCorrectiveAction>;
  updateAction(fleetId: string, actionId: string, patch: Partial<OperatingCorrectiveAction>): Promise<OperatingCorrectiveAction>;
  listActionsForLoad(fleetId: string, loadId: string): Promise<OperatingCorrectiveAction[]>;
  createIngestionRecord(record: IngestionRecord): Promise<IngestionRecord>;
  findIngestionByIdempotency(fleetId: string, idempotencyKey: string): Promise<IngestionRecord | null>;
  updateIngestionRecord(fleetId: string, recordId: string, patch: Partial<IngestionRecord>): Promise<IngestionRecord>;
  createDelivery(record: LoadDeliveryRecord): Promise<LoadDeliveryRecord>;
  listDeliveriesForLoad(fleetId: string, loadId: string): Promise<LoadDeliveryRecord[]>;
  findDeliveryByIdempotency(fleetId: string, idempotencyKey: string): Promise<LoadDeliveryRecord | null>;
  createProof(record: LoadProofRecord): Promise<LoadProofRecord>;
  getProof(fleetId: string, proofId: string): Promise<LoadProofRecord | null>;
  updateProof(fleetId: string, proofId: string, patch: Partial<LoadProofRecord>): Promise<LoadProofRecord>;
  listProofsForLoad(fleetId: string, loadId: string): Promise<LoadProofRecord[]>;
  findProofByIdempotency(fleetId: string, idempotencyKey: string): Promise<LoadProofRecord | null>;
  createSettlement(record: SettlementRecord): Promise<SettlementRecord>;
  getSettlement(fleetId: string, settlementId: string): Promise<SettlementRecord | null>;
  updateSettlement(fleetId: string, settlementId: string, patch: Partial<SettlementRecord>): Promise<SettlementRecord>;
  listSettlementsForLoad(fleetId: string, loadId: string): Promise<SettlementRecord[]>;
  findSettlementByIdempotency(fleetId: string, idempotencyKey: string): Promise<SettlementRecord | null>;
  createInvoice(record: InvoiceRecord): Promise<InvoiceRecord>;
  getInvoice(fleetId: string, invoiceId: string): Promise<InvoiceRecord | null>;
  updateInvoice(fleetId: string, invoiceId: string, patch: Partial<InvoiceRecord>): Promise<InvoiceRecord>;
  listInvoicesForLoad(fleetId: string, loadId: string): Promise<InvoiceRecord[]>;
  findInvoiceByIdempotency(fleetId: string, idempotencyKey: string): Promise<InvoiceRecord | null>;
  createPayment(record: InvoicePaymentRecord): Promise<InvoicePaymentRecord>;
  listPaymentsForLoad(fleetId: string, loadId: string): Promise<InvoicePaymentRecord[]>;
  findPaymentByIdempotency(fleetId: string, idempotencyKey: string): Promise<InvoicePaymentRecord | null>;
};
