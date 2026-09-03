import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
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
  RecordLineage,
  SettlementRecord,
} from "@/lib/process-intelligence/types";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function money(value: { toString(): string } | string | number) {
  return String(value);
}

function lineageFromLoad(load: {
  lifecycleClass: RecordLineage["lifecycleClass"];
  originKind: RecordLineage["originKind"];
  verificationClass: RecordLineage["verificationClass"];
  derivationKind: RecordLineage["derivationKind"];
  sourceSystem: string | null;
  sourceRecordId: string | null;
  importedAt: Date | null;
  originValidationStatus: RecordLineage["originValidationStatus"] | null;
}): RecordLineage {
  return {
    lifecycleClass: load.lifecycleClass,
    originKind: load.originKind,
    verificationClass: load.verificationClass,
    derivationKind: load.derivationKind,
    sourceSystem: load.sourceSystem,
    sourceRecordId: load.sourceRecordId,
    importedAt: load.importedAt,
    originValidationStatus: load.originValidationStatus,
  };
}

function toDelivery(row: {
  id: string;
  fleetId: string;
  loadId: string;
  status: LoadDeliveryRecord["status"];
  deliveredAt: Date | null;
  deliveryLocation: string | null;
  exceptionStatus: string | null;
  idempotencyKey: string;
} & Parameters<typeof lineageFromLoad>[0]): LoadDeliveryRecord {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    status: row.status,
    deliveredAt: row.deliveredAt,
    deliveryLocation: row.deliveryLocation,
    exceptionStatus: row.exceptionStatus,
    idempotencyKey: row.idempotencyKey,
    lineage: lineageFromLoad(row),
  };
}

function toProof(row: {
  id: string;
  fleetId: string;
  loadId: string;
  deliveryId: string | null;
  proofType: LoadProofRecord["proofType"];
  status: LoadProofRecord["status"];
  evidenceId: string | null;
  documentId: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  exceptionStatus: string | null;
  idempotencyKey: string;
} & Parameters<typeof lineageFromLoad>[0]): LoadProofRecord {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    deliveryId: row.deliveryId,
    proofType: row.proofType,
    status: row.status,
    evidenceId: row.evidenceId,
    documentId: row.documentId,
    verifiedBy: row.verifiedBy,
    verifiedAt: row.verifiedAt,
    exceptionStatus: row.exceptionStatus,
    idempotencyKey: row.idempotencyKey,
    lineage: lineageFromLoad(row),
  };
}

function toSettlement(row: {
  id: string;
  fleetId: string;
  loadId: string;
  driverId: string | null;
  settlementDate: Date;
  payBasis: string | null;
  grossAmount: { toString(): string };
  deductions: { toString(): string };
  reimbursements: { toString(): string };
  advances: { toString(): string };
  netAmount: { toString(): string };
  status: SettlementRecord["status"];
  holdReason: string | null;
  idempotencyKey: string;
} & Parameters<typeof lineageFromLoad>[0]): SettlementRecord {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    driverId: row.driverId,
    settlementDate: row.settlementDate,
    payBasis: row.payBasis,
    grossAmount: money(row.grossAmount),
    deductions: money(row.deductions),
    reimbursements: money(row.reimbursements),
    advances: money(row.advances),
    netAmount: money(row.netAmount),
    status: row.status,
    holdReason: row.holdReason,
    idempotencyKey: row.idempotencyKey,
    lineage: lineageFromLoad(row),
  };
}

function toInvoice(row: {
  id: string;
  fleetId: string;
  loadId: string;
  customerId: string | null;
  invoiceDate: Date;
  amount: { toString(): string };
  status: InvoiceRecord["status"];
  submittedAt: Date | null;
  paidAt: Date | null;
  terms: string | null;
  idempotencyKey: string;
} & Parameters<typeof lineageFromLoad>[0]): InvoiceRecord {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    customerId: row.customerId,
    invoiceDate: row.invoiceDate,
    amount: money(row.amount),
    status: row.status,
    submittedAt: row.submittedAt,
    paidAt: row.paidAt,
    terms: row.terms,
    idempotencyKey: row.idempotencyKey,
    lineage: lineageFromLoad(row),
  };
}

function toPayment(row: {
  id: string;
  fleetId: string;
  loadId: string;
  invoiceId: string;
  amount: { toString(): string };
  paidAt: Date;
  status: InvoicePaymentRecord["status"];
  idempotencyKey: string;
} & Parameters<typeof lineageFromLoad>[0]): InvoicePaymentRecord {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    invoiceId: row.invoiceId,
    amount: money(row.amount),
    paidAt: row.paidAt,
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    lineage: lineageFromLoad(row),
  };
}

function toCanonicalLoad(load: Parameters<typeof lineageFromLoad>[0] & {
  id: string;
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  referenceNumber: string | null;
  status: string;
}): CanonicalLoadRecord {
  return {
    id: load.id,
    fleetId: load.fleetId,
    customerName: load.customerName,
    origin: load.origin,
    destination: load.destination,
    referenceNumber: load.referenceNumber,
    status: load.status,
    lineage: lineageFromLoad(load),
  };
}

function toEvent(row: {
  id: string;
  fleetId: string;
  loadId: string | null;
  entityType: string;
  entityId: string;
  eventType: OperatingProcessEvent["eventType"];
  processStage: OperatingProcessEvent["processStage"];
  eventTimestamp: Date;
  recordedAt: Date;
  actorId: string | null;
  actorType: OperatingProcessEvent["actorType"];
  originKind: RecordLineage["originKind"];
  lifecycleClass: RecordLineage["lifecycleClass"];
  verificationClass: RecordLineage["verificationClass"];
  sourceSystem: string | null;
  sourceRecordId: string | null;
  priorState: string | null;
  resultingState: string | null;
  evidenceIds: Prisma.JsonValue | null;
  documentIds: Prisma.JsonValue | null;
  exceptionId: string | null;
  decisionType: string | null;
  decisionResult: string | null;
  decisionReason: string | null;
  decisionOwner: string | null;
  operationalConsequence: string | null;
  financialConsequence: string | null;
  serviceConsequence: string | null;
  actionId: string | null;
  resolutionStatus: string | null;
  resolutionTimestamp: Date | null;
  verificationActor: string | null;
  verificationEvidence: string | null;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
}): OperatingProcessEvent {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    entityType: row.entityType,
    entityId: row.entityId,
    eventType: row.eventType,
    processStage: row.processStage,
    eventTimestamp: row.eventTimestamp,
    recordedAt: row.recordedAt,
    actorId: row.actorId,
    actorType: row.actorType,
    lineage: {
      lifecycleClass: row.lifecycleClass,
      originKind: row.originKind,
      verificationClass: row.verificationClass,
      derivationKind: "SOURCE",
      sourceSystem: row.sourceSystem,
      sourceRecordId: row.sourceRecordId,
    },
    priorState: row.priorState,
    resultingState: row.resultingState,
    evidenceIds: asStringArray(row.evidenceIds),
    documentIds: asStringArray(row.documentIds),
    exceptionId: row.exceptionId,
    decisionType: row.decisionType,
    decisionResult: row.decisionResult,
    decisionReason: row.decisionReason,
    decisionOwner: row.decisionOwner,
    operationalConsequence: row.operationalConsequence,
    financialConsequence: row.financialConsequence,
    serviceConsequence: row.serviceConsequence,
    actionId: row.actionId,
    resolutionStatus: row.resolutionStatus,
    resolutionTimestamp: row.resolutionTimestamp,
    verificationActor: row.verificationActor,
    verificationEvidence: row.verificationEvidence,
    relatedRecordType: row.relatedRecordType,
    relatedRecordId: row.relatedRecordId,
  };
}

export function createPrismaOperatingProcessStore(): OperatingProcessStore {
  return {
    async createLoad(record) {
      const created = await prisma.load.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          customerName: record.customerName,
          origin: record.origin,
          destination: record.destination,
          referenceNumber: record.referenceNumber ?? null,
          status: record.status as never,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
        },
      });
      return toCanonicalLoad(created);
    },
    async getLoad(fleetId, loadId) {
      const load = await prisma.load.findFirst({ where: { id: loadId, fleetId } });
      return load ? toCanonicalLoad(load) : null;
    },
    async findEventByBusinessKey(key) {
      const row = await prisma.operatingProcessEvent.findFirst({
        where: {
          fleetId: key.fleetId,
          eventType: key.eventType,
          entityType: key.entityType,
          entityId: key.entityId,
          relatedRecordType: key.relatedRecordType ?? null,
          relatedRecordId: key.relatedRecordId ?? null,
        },
        orderBy: [{ eventTimestamp: "asc" }, { id: "asc" }],
      });
      return row ? toEvent(row) : null;
    },
    async recordEvent(event) {
      const created = await prisma.operatingProcessEvent.create({
        data: {
          id: event.id,
          fleetId: event.fleetId,
          loadId: event.loadId ?? null,
          entityType: event.entityType,
          entityId: event.entityId,
          eventType: event.eventType,
          processStage: event.processStage,
          eventTimestamp: event.eventTimestamp,
          recordedAt: event.recordedAt,
          actorId: event.actorId ?? null,
          actorType: event.actorType,
          originKind: event.lineage.originKind,
          lifecycleClass: event.lineage.lifecycleClass,
          verificationClass: event.lineage.verificationClass,
          sourceSystem: event.lineage.sourceSystem ?? null,
          sourceRecordId: event.lineage.sourceRecordId ?? null,
          priorState: event.priorState ?? null,
          resultingState: event.resultingState ?? null,
          evidenceIds: event.evidenceIds ?? Prisma.JsonNull,
          documentIds: event.documentIds ?? Prisma.JsonNull,
          exceptionId: event.exceptionId ?? null,
          decisionType: event.decisionType ?? null,
          decisionResult: event.decisionResult ?? null,
          decisionReason: event.decisionReason ?? null,
          decisionOwner: event.decisionOwner ?? null,
          operationalConsequence: event.operationalConsequence ?? null,
          financialConsequence: event.financialConsequence ?? null,
          serviceConsequence: event.serviceConsequence ?? null,
          actionId: event.actionId ?? null,
          resolutionStatus: event.resolutionStatus ?? null,
          resolutionTimestamp: event.resolutionTimestamp ?? null,
          verificationActor: event.verificationActor ?? null,
          verificationEvidence: event.verificationEvidence ?? null,
          relatedRecordType: event.relatedRecordType ?? null,
          relatedRecordId: event.relatedRecordId ?? null,
        },
      });
      return toEvent(created);
    },
    async listEventsForLoad(fleetId, loadId) {
      const rows = await prisma.operatingProcessEvent.findMany({
        where: { fleetId, loadId },
        orderBy: [{ eventTimestamp: "asc" }, { id: "asc" }],
      });
      return rows.map(toEvent);
    },
    async getEvent(fleetId, eventId) {
      const row = await prisma.operatingProcessEvent.findFirst({ where: { id: eventId, fleetId } });
      return row ? toEvent(row) : null;
    },
    async createException(exception) {
      const created = await prisma.operatingException.create({ data: exception });
      return created as OperatingException;
    },
    async getException(fleetId, exceptionId) {
      const row = await prisma.operatingException.findFirst({ where: { id: exceptionId, fleetId } });
      return row as OperatingException | null;
    },
    async listExceptionsForLoad(fleetId, loadId) {
      const rows = await prisma.operatingException.findMany({ where: { fleetId, loadId } });
      return rows as OperatingException[];
    },
    async createAction(action) {
      const created = await prisma.operatingCorrectiveAction.create({ data: action });
      return created as OperatingCorrectiveAction;
    },
    async updateAction(fleetId, actionId, patch) {
      const existing = await prisma.operatingCorrectiveAction.findFirst({ where: { id: actionId, fleetId } });
      if (!existing) throw new ProcessIntelligenceError("Corrective action not found", 404);
      const updated = await prisma.operatingCorrectiveAction.update({
        where: { id: actionId },
        data: {
          status: patch.status,
          completedAt: patch.completedAt,
          verifiedAt: patch.verifiedAt,
          verificationActor: patch.verificationActor,
          verificationEvidence: patch.verificationEvidence,
          outcome: patch.outcome,
        },
      });
      return updated as OperatingCorrectiveAction;
    },
    async listActionsForLoad(fleetId, loadId) {
      const rows = await prisma.operatingCorrectiveAction.findMany({ where: { fleetId, loadId } });
      return rows as OperatingCorrectiveAction[];
    },
    async createIngestionRecord(record) {
      const sourceSystem =
        typeof record.sourcePayload.sourceSystem === "string" ? record.sourcePayload.sourceSystem : "unknown";
      const sourceFormat =
        typeof record.sourcePayload.sourceFormat === "string" ? record.sourcePayload.sourceFormat : "JSON";
      await prisma.ingestionBatch.upsert({
        where: { id: record.batchId },
        create: {
          id: record.batchId,
          fleetId: record.fleetId,
          sourceSystem,
          sourceFormat: sourceFormat as never,
        },
        update: {},
      });
      const created = await prisma.ingestionRecord.create({
        data: {
          id: record.id,
          batchId: record.batchId,
          fleetId: record.fleetId,
          sourceRecordId: record.sourceRecordId,
          idempotencyKey: record.idempotencyKey,
          sourcePayload: record.sourcePayload as Prisma.InputJsonValue,
          mappedPayload: (record.mappedPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          normalizedPayload: (record.normalizedPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          validationStatus: record.validationStatus,
          validationMessage: record.validationMessage ?? null,
          status: record.status,
          canonicalEntityType: record.canonicalEntityType ?? null,
          canonicalEntityId: record.canonicalEntityId ?? null,
          loadId: record.loadId ?? null,
          operatingEventId: record.operatingEventId ?? null,
        },
      });
      return created as unknown as IngestionRecord;
    },
    async findIngestionByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.ingestionRecord.findUnique({
        where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } },
      });
      return row as unknown as IngestionRecord | null;
    },
    async updateIngestionRecord(fleetId, recordId, patch) {
      const existing = await prisma.ingestionRecord.findFirst({ where: { id: recordId, fleetId } });
      if (!existing) throw new ProcessIntelligenceError("Ingestion record not found", 404);
      const updated = await prisma.ingestionRecord.update({
        where: { id: recordId },
        data: {
          status: patch.status,
          canonicalEntityId: patch.canonicalEntityId,
          loadId: patch.loadId,
          operatingEventId: patch.operatingEventId,
        },
      });
      return updated as unknown as IngestionRecord;
    },
    async createDelivery(record) {
      const created = await prisma.loadDelivery.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          loadId: record.loadId,
          status: record.status,
          deliveredAt: record.deliveredAt ?? null,
          deliveryLocation: record.deliveryLocation ?? null,
          exceptionStatus: record.exceptionStatus ?? null,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
          idempotencyKey: record.idempotencyKey,
        },
      });
      return toDelivery(created);
    },
    async listDeliveriesForLoad(fleetId, loadId) {
      const rows = await prisma.loadDelivery.findMany({ where: { fleetId, loadId } });
      return rows.map(toDelivery);
    },
    async findDeliveryByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.loadDelivery.findUnique({ where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } } });
      return row ? toDelivery(row) : null;
    },
    async createProof(record) {
      const created = await prisma.loadProofOfDelivery.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          loadId: record.loadId,
          deliveryId: record.deliveryId ?? null,
          proofType: record.proofType,
          status: record.status,
          evidenceId: record.evidenceId ?? null,
          documentId: record.documentId ?? null,
          verifiedBy: record.verifiedBy ?? null,
          verifiedAt: record.verifiedAt ?? null,
          exceptionStatus: record.exceptionStatus ?? null,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
          idempotencyKey: record.idempotencyKey,
        },
      });
      return toProof(created);
    },
    async getProof(fleetId, proofId) {
      const row = await prisma.loadProofOfDelivery.findFirst({ where: { id: proofId, fleetId } });
      return row ? toProof(row) : null;
    },
    async updateProof(fleetId, proofId, patch) {
      const existing = await prisma.loadProofOfDelivery.findFirst({ where: { id: proofId, fleetId } });
      if (!existing) throw new ProcessIntelligenceError("Proof not found", 404);
      const updated = await prisma.loadProofOfDelivery.update({
        where: { id: proofId },
        data: {
          status: patch.status,
          verifiedBy: patch.verifiedBy,
          verifiedAt: patch.verifiedAt,
          exceptionStatus: patch.exceptionStatus,
          verificationClass: patch.lineage?.verificationClass,
        },
      });
      return toProof(updated);
    },
    async listProofsForLoad(fleetId, loadId) {
      const rows = await prisma.loadProofOfDelivery.findMany({ where: { fleetId, loadId } });
      return rows.map(toProof);
    },
    async findProofByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.loadProofOfDelivery.findUnique({ where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } } });
      return row ? toProof(row) : null;
    },
    async createSettlement(record) {
      const created = await prisma.settlement.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          loadId: record.loadId,
          driverId: record.driverId ?? null,
          settlementDate: record.settlementDate,
          payBasis: record.payBasis ?? null,
          grossAmount: record.grossAmount,
          deductions: record.deductions,
          reimbursements: record.reimbursements,
          advances: record.advances,
          netAmount: record.netAmount,
          status: record.status,
          holdReason: record.holdReason ?? null,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
          idempotencyKey: record.idempotencyKey,
        },
      });
      return toSettlement(created);
    },
    async getSettlement(fleetId, settlementId) {
      const row = await prisma.settlement.findFirst({ where: { id: settlementId, fleetId } });
      return row ? toSettlement(row) : null;
    },
    async updateSettlement(fleetId, settlementId, patch) {
      const existing = await prisma.settlement.findFirst({ where: { id: settlementId, fleetId } });
      if (!existing) throw new ProcessIntelligenceError("Settlement not found", 404);
      const updated = await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: patch.status,
          holdReason: patch.holdReason,
          verificationClass: patch.lineage?.verificationClass,
        },
      });
      return toSettlement(updated);
    },
    async listSettlementsForLoad(fleetId, loadId) {
      const rows = await prisma.settlement.findMany({ where: { fleetId, loadId } });
      return rows.map(toSettlement);
    },
    async findSettlementByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.settlement.findUnique({ where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } } });
      return row ? toSettlement(row) : null;
    },
    async createInvoice(record) {
      const created = await prisma.invoice.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          loadId: record.loadId,
          customerId: record.customerId ?? null,
          invoiceDate: record.invoiceDate,
          amount: record.amount,
          status: record.status,
          submittedAt: record.submittedAt ?? null,
          paidAt: record.paidAt ?? null,
          terms: record.terms ?? null,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
          idempotencyKey: record.idempotencyKey,
        },
      });
      return toInvoice(created);
    },
    async getInvoice(fleetId, invoiceId) {
      const row = await prisma.invoice.findFirst({ where: { id: invoiceId, fleetId } });
      return row ? toInvoice(row) : null;
    },
    async updateInvoice(fleetId, invoiceId, patch) {
      const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, fleetId } });
      if (!existing) throw new ProcessIntelligenceError("Invoice not found", 404);
      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: patch.status,
          submittedAt: patch.submittedAt,
          paidAt: patch.paidAt,
          verificationClass: patch.lineage?.verificationClass,
        },
      });
      return toInvoice(updated);
    },
    async listInvoicesForLoad(fleetId, loadId) {
      const rows = await prisma.invoice.findMany({ where: { fleetId, loadId } });
      return rows.map(toInvoice);
    },
    async findInvoiceByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.invoice.findUnique({ where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } } });
      return row ? toInvoice(row) : null;
    },
    async createPayment(record) {
      const created = await prisma.invoicePayment.create({
        data: {
          id: record.id,
          fleetId: record.fleetId,
          loadId: record.loadId,
          invoiceId: record.invoiceId,
          amount: record.amount,
          paidAt: record.paidAt,
          status: record.status,
          lifecycleClass: record.lineage.lifecycleClass,
          originKind: record.lineage.originKind,
          verificationClass: record.lineage.verificationClass,
          derivationKind: record.lineage.derivationKind,
          sourceSystem: record.lineage.sourceSystem ?? null,
          sourceRecordId: record.lineage.sourceRecordId ?? null,
          importedAt: record.lineage.importedAt ?? null,
          originValidationStatus: record.lineage.originValidationStatus ?? null,
          idempotencyKey: record.idempotencyKey,
        },
      });
      return toPayment(created);
    },
    async listPaymentsForLoad(fleetId, loadId) {
      const rows = await prisma.invoicePayment.findMany({ where: { fleetId, loadId } });
      return rows.map(toPayment);
    },
    async findPaymentByIdempotency(fleetId, idempotencyKey) {
      const row = await prisma.invoicePayment.findUnique({ where: { fleetId_idempotencyKey: { fleetId, idempotencyKey } } });
      return row ? toPayment(row) : null;
    },
  };
}
