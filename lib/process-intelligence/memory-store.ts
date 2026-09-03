import type { OperatingProcessStore } from "@/lib/process-intelligence/store";
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
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function uniqueById<T extends { id: string; fleetId: string }>(map: Map<string, T>, fleetId: string) {
  const seen = new Set<string>();
  const rows: T[] = [];
  for (const value of map.values()) {
    if (value.fleetId !== fleetId || seen.has(value.id)) continue;
    seen.add(value.id);
    rows.push(value);
  }
  return rows;
}

export function createMemoryOperatingProcessStore(): OperatingProcessStore {
  const loads = new Map<string, CanonicalLoadRecord>();
  const events = new Map<string, OperatingProcessEvent>();
  const exceptions = new Map<string, OperatingException>();
  const actions = new Map<string, OperatingCorrectiveAction>();
  const ingestions = new Map<string, IngestionRecord>();
  const deliveries = new Map<string, LoadDeliveryRecord>();
  const proofs = new Map<string, LoadProofRecord>();
  const settlements = new Map<string, SettlementRecord>();
  const invoices = new Map<string, InvoiceRecord>();
  const payments = new Map<string, InvoicePaymentRecord>();

  const loadKey = (fleetId: string, loadId: string) => `${fleetId}::${loadId}`;

  return {
    async createLoad(record) {
      const key = loadKey(record.fleetId, record.id);
      if (loads.has(key)) {
        throw new ProcessIntelligenceError("Load already exists", 409);
      }
      loads.set(key, clone(record));
      return clone(record);
    },
    async getLoad(fleetId, loadId) {
      const record = loads.get(loadKey(fleetId, loadId));
      return record ? clone(record) : null;
    },
    async recordEvent(event: RecordEventInput & { id: string; recordedAt: Date; lineage: RecordLineage }) {
      const stored: OperatingProcessEvent = {
        ...event,
        evidenceIds: event.evidenceIds ? [...event.evidenceIds] : undefined,
        documentIds: event.documentIds ? [...event.documentIds] : undefined,
        lineage: { ...event.lineage },
      };
      events.set(`${event.fleetId}::${event.id}`, stored);
      return clone(stored);
    },
    async findEventByBusinessKey(key) {
      const match = [...events.values()].find(
        (event) =>
          event.fleetId === key.fleetId &&
          event.eventType === key.eventType &&
          event.entityType === key.entityType &&
          event.entityId === key.entityId &&
          (event.relatedRecordType ?? null) === (key.relatedRecordType ?? null) &&
          (event.relatedRecordId ?? null) === (key.relatedRecordId ?? null),
      );
      return match ? clone(match) : null;
    },
    async listEventsForLoad(fleetId, loadId) {
      return [...events.values()]
        .filter((event) => event.fleetId === fleetId && event.loadId === loadId)
        .sort((a, b) => a.eventTimestamp.getTime() - b.eventTimestamp.getTime() || a.id.localeCompare(b.id))
        .map((event) => clone(event));
    },
    async getEvent(fleetId, eventId) {
      const event = events.get(`${fleetId}::${eventId}`);
      return event ? clone(event) : null;
    },
    async createException(exception) {
      exceptions.set(`${exception.fleetId}::${exception.id}`, clone(exception));
      return clone(exception);
    },
    async getException(fleetId, exceptionId) {
      const exception = exceptions.get(`${fleetId}::${exceptionId}`);
      return exception ? clone(exception) : null;
    },
    async listExceptionsForLoad(fleetId, loadId) {
      return [...exceptions.values()]
        .filter((exception) => exception.fleetId === fleetId && exception.loadId === loadId)
        .map((exception) => clone(exception));
    },
    async createAction(action) {
      actions.set(`${action.fleetId}::${action.id}`, clone(action));
      return clone(action);
    },
    async updateAction(fleetId, actionId, patch) {
      const key = `${fleetId}::${actionId}`;
      const current = actions.get(key);
      if (!current) throw new ProcessIntelligenceError("Corrective action not found", 404);
      const next = { ...current, ...patch, id: current.id, fleetId };
      actions.set(key, next);
      return clone(next);
    },
    async listActionsForLoad(fleetId, loadId) {
      return [...actions.values()]
        .filter((action) => action.fleetId === fleetId && action.loadId === loadId)
        .map((action) => clone(action));
    },
    async createIngestionRecord(record) {
      ingestions.set(`${record.fleetId}::${record.idempotencyKey}`, clone(record));
      ingestions.set(`${record.fleetId}::id::${record.id}`, clone(record));
      return clone(record);
    },
    async findIngestionByIdempotency(fleetId, idempotencyKey) {
      const record = ingestions.get(`${fleetId}::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
    async updateIngestionRecord(fleetId, recordId, patch) {
      const current = ingestions.get(`${fleetId}::id::${recordId}`);
      if (!current) throw new ProcessIntelligenceError("Ingestion record not found", 404);
      const next = { ...current, ...patch, id: current.id, fleetId };
      ingestions.set(`${fleetId}::id::${recordId}`, next);
      ingestions.set(`${fleetId}::${next.idempotencyKey}`, next);
      return clone(next);
    },
    async createDelivery(record) {
      const existing = deliveries.get(`${record.fleetId}::idem::${record.idempotencyKey}`);
      if (existing) throw new ProcessIntelligenceError("Delivery already exists", 409);
      deliveries.set(`${record.fleetId}::${record.id}`, clone(record));
      deliveries.set(`${record.fleetId}::idem::${record.idempotencyKey}`, clone(record));
      return clone(record);
    },
    async listDeliveriesForLoad(fleetId, loadId) {
      return uniqueById(deliveries, fleetId).filter((item) => item.loadId === loadId).map(clone);
    },
    async findDeliveryByIdempotency(fleetId, idempotencyKey) {
      const record = deliveries.get(`${fleetId}::idem::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
    async createProof(record) {
      if (proofs.get(`${record.fleetId}::idem::${record.idempotencyKey}`)) {
        throw new ProcessIntelligenceError("Proof already exists", 409);
      }
      proofs.set(`${record.fleetId}::${record.id}`, clone(record));
      proofs.set(`${record.fleetId}::idem::${record.idempotencyKey}`, clone(record));
      return clone(record);
    },
    async getProof(fleetId, proofId) {
      const record = proofs.get(`${fleetId}::${proofId}`);
      return record ? clone(record) : null;
    },
    async updateProof(fleetId, proofId, patch) {
      const current = proofs.get(`${fleetId}::${proofId}`);
      if (!current) throw new ProcessIntelligenceError("Proof not found", 404);
      const next = { ...current, ...patch, id: current.id, fleetId };
      proofs.set(`${fleetId}::${proofId}`, next);
      proofs.set(`${fleetId}::idem::${next.idempotencyKey}`, next);
      return clone(next);
    },
    async listProofsForLoad(fleetId, loadId) {
      return uniqueById(proofs, fleetId).filter((item) => item.loadId === loadId).map(clone);
    },
    async findProofByIdempotency(fleetId, idempotencyKey) {
      const record = proofs.get(`${fleetId}::idem::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
    async createSettlement(record) {
      if (settlements.get(`${record.fleetId}::idem::${record.idempotencyKey}`)) {
        throw new ProcessIntelligenceError("Settlement already exists", 409);
      }
      settlements.set(`${record.fleetId}::${record.id}`, clone(record));
      settlements.set(`${record.fleetId}::idem::${record.idempotencyKey}`, clone(record));
      return clone(record);
    },
    async getSettlement(fleetId, settlementId) {
      const record = settlements.get(`${fleetId}::${settlementId}`);
      return record ? clone(record) : null;
    },
    async updateSettlement(fleetId, settlementId, patch) {
      const current = settlements.get(`${fleetId}::${settlementId}`);
      if (!current) throw new ProcessIntelligenceError("Settlement not found", 404);
      const next = { ...current, ...patch, id: current.id, fleetId };
      settlements.set(`${fleetId}::${settlementId}`, next);
      settlements.set(`${fleetId}::idem::${next.idempotencyKey}`, next);
      return clone(next);
    },
    async listSettlementsForLoad(fleetId, loadId) {
      return uniqueById(settlements, fleetId).filter((item) => item.loadId === loadId).map(clone);
    },
    async findSettlementByIdempotency(fleetId, idempotencyKey) {
      const record = settlements.get(`${fleetId}::idem::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
    async createInvoice(record) {
      if (invoices.get(`${record.fleetId}::idem::${record.idempotencyKey}`)) {
        throw new ProcessIntelligenceError("Invoice already exists", 409);
      }
      invoices.set(`${record.fleetId}::${record.id}`, clone(record));
      invoices.set(`${record.fleetId}::idem::${record.idempotencyKey}`, clone(record));
      return clone(record);
    },
    async getInvoice(fleetId, invoiceId) {
      const record = invoices.get(`${fleetId}::${invoiceId}`);
      return record ? clone(record) : null;
    },
    async updateInvoice(fleetId, invoiceId, patch) {
      const current = invoices.get(`${fleetId}::${invoiceId}`);
      if (!current) throw new ProcessIntelligenceError("Invoice not found", 404);
      const next = { ...current, ...patch, id: current.id, fleetId };
      invoices.set(`${fleetId}::${invoiceId}`, next);
      invoices.set(`${fleetId}::idem::${next.idempotencyKey}`, next);
      return clone(next);
    },
    async listInvoicesForLoad(fleetId, loadId) {
      return uniqueById(invoices, fleetId).filter((item) => item.loadId === loadId).map(clone);
    },
    async findInvoiceByIdempotency(fleetId, idempotencyKey) {
      const record = invoices.get(`${fleetId}::idem::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
    async createPayment(record) {
      if (payments.get(`${record.fleetId}::idem::${record.idempotencyKey}`)) {
        throw new ProcessIntelligenceError("Payment already exists", 409);
      }
      payments.set(`${record.fleetId}::${record.id}`, clone(record));
      payments.set(`${record.fleetId}::idem::${record.idempotencyKey}`, clone(record));
      return clone(record);
    },
    async listPaymentsForLoad(fleetId, loadId) {
      return uniqueById(payments, fleetId).filter((item) => item.loadId === loadId).map(clone);
    },
    async findPaymentByIdempotency(fleetId, idempotencyKey) {
      const record = payments.get(`${fleetId}::idem::${idempotencyKey}`);
      return record ? clone(record) : null;
    },
  };
}
