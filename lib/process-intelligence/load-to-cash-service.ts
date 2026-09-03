import { randomUUID } from "crypto";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import type { OperatingProcessStore } from "@/lib/process-intelligence/store";
import {
  ProcessIntelligenceError,
  type InvoicePaymentRecord,
  type InvoiceRecord,
  type InvoiceRecordStatus,
  type LoadDeliveryRecord,
  type LoadProofRecord,
  type OperatingProcessEventType,
  type RecordLineage,
  type SettlementRecord,
  type SettlementRecordStatus,
} from "@/lib/process-intelligence/types";

const DEFAULT_LINEAGE: RecordLineage = {
  lifecycleClass: "LIVE",
  originKind: "BOF_CREATED",
  verificationClass: "UNVERIFIED",
  derivationKind: "SOURCE",
};

function assertTenant(user: SessionUserLike | null | undefined, fleetId: string) {
  if (!user?.id) throw new ProcessIntelligenceError("AUTH_REQUIRED", 401);
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw new ProcessIntelligenceError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  }
}

export function financialIdempotencyKey(sourceSystem: string, sourceRecordId: string) {
  return `${sourceSystem}:${sourceRecordId}`;
}

function withLineage(partial?: Partial<RecordLineage>): RecordLineage {
  return { ...DEFAULT_LINEAGE, ...partial };
}

async function requireLoad(store: OperatingProcessStore, fleetId: string, loadId: string) {
  const load = await store.getLoad(fleetId, loadId);
  if (!load) throw new ProcessIntelligenceError("Load not found for tenant", 404);
  return load;
}

const SETTLEMENT_EVENT: Record<SettlementRecordStatus, OperatingProcessEventType> = {
  DRAFT: "SETTLEMENT_CREATED",
  CREATED: "SETTLEMENT_CREATED",
  HELD: "SETTLEMENT_HELD",
  REVIEWED: "SETTLEMENT_REVIEWED",
  APPROVED: "SETTLEMENT_APPROVED",
  PAID: "SETTLEMENT_PAID",
  CLOSED: "SETTLEMENT_CLOSED",
  EXCEPTION: "SETTLEMENT_HELD",
};

const INVOICE_EVENT: Record<InvoiceRecordStatus, OperatingProcessEventType> = {
  DRAFT: "INVOICE_CREATED",
  CREATED: "INVOICE_CREATED",
  SUBMITTED: "INVOICE_SUBMITTED",
  EXCEPTION: "INVOICE_EXCEPTION",
  APPROVED: "INVOICE_APPROVED",
  PAID: "INVOICE_PAID",
  CLOSED: "INVOICE_CLOSED",
};

export async function recordLoadDelivery(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<LoadDeliveryRecord, "id" | "lineage" | "idempotencyKey"> & {
    id?: string;
    lineage?: Partial<RecordLineage>;
    idempotencyKey?: string;
  },
) {
  assertTenant(user, input.fleetId);
  await requireLoad(store, input.fleetId, input.loadId);
  const lineage = withLineage(input.lineage);
  const idempotencyKey =
    input.idempotencyKey ??
    (lineage.sourceSystem && lineage.sourceRecordId
      ? financialIdempotencyKey(lineage.sourceSystem, lineage.sourceRecordId)
      : `bof:delivery:${input.id ?? randomUUID()}`);
  const existing = await store.findDeliveryByIdempotency(input.fleetId, idempotencyKey);
  if (existing) return { record: existing, duplicate: true as const };
  const record = await store.createDelivery({
    ...input,
    id: input.id ?? randomUUID(),
    lineage,
    idempotencyKey,
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: record.fleetId,
    loadId: record.loadId,
    entityType: "LoadDelivery",
    entityId: record.id,
    eventType: record.status === "DELIVERY_EXCEPTION" ? "DELIVERY_EXCEPTION" : "DELIVERED",
    processStage: "DELIVERY_PROOF",
    eventTimestamp: record.deliveredAt ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "USER",
    lineage,
    resultingState: record.status,
    relatedRecordType: "LoadDelivery",
    relatedRecordId: record.id,
  });
  return { record, duplicate: false as const };
}

export async function recordLoadProof(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<LoadProofRecord, "id" | "lineage" | "idempotencyKey"> & {
    id?: string;
    lineage?: Partial<RecordLineage>;
    idempotencyKey?: string;
  },
) {
  assertTenant(user, input.fleetId);
  await requireLoad(store, input.fleetId, input.loadId);
  const lineage = withLineage(input.lineage);
  const idempotencyKey =
    input.idempotencyKey ??
    (lineage.sourceSystem && lineage.sourceRecordId
      ? financialIdempotencyKey(lineage.sourceSystem, lineage.sourceRecordId)
      : `bof:proof:${input.id ?? randomUUID()}`);
  const existing = await store.findProofByIdempotency(input.fleetId, idempotencyKey);
  if (existing) return { record: existing, duplicate: true as const };
  const record = await store.createProof({
    ...input,
    id: input.id ?? randomUUID(),
    lineage,
    idempotencyKey,
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: record.fleetId,
    loadId: record.loadId,
    entityType: "LoadProofOfDelivery",
    entityId: record.id,
    eventType: record.status === "VERIFIED" ? "POD_VERIFIED" : "POD_RECEIVED",
    processStage: "DELIVERY_PROOF",
    eventTimestamp: record.verifiedAt ?? record.lineage.importedAt ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "USER",
    lineage,
    evidenceIds: record.evidenceId ? [record.evidenceId] : undefined,
    documentIds: record.documentId ? [record.documentId] : undefined,
    resultingState: record.status,
    relatedRecordType: "LoadProofOfDelivery",
    relatedRecordId: record.id,
  });
  return { record, duplicate: false as const };
}

export async function verifyLoadProof(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: { fleetId: string; proofId: string; verifiedBy: string; verifiedAt?: Date },
) {
  assertTenant(user, input.fleetId);
  const existing = await store.getProof(input.fleetId, input.proofId);
  if (!existing) throw new ProcessIntelligenceError("Proof not found", 404);
  if (existing.status === "VERIFIED") return existing;
  const verifiedAt = input.verifiedAt ?? new Date();
  const updated = await store.updateProof(input.fleetId, input.proofId, {
    status: "VERIFIED",
    verifiedBy: input.verifiedBy,
    verifiedAt,
    lineage: { ...existing.lineage, verificationClass: "VERIFIED" },
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: updated.fleetId,
    loadId: updated.loadId,
    entityType: "LoadProofOfDelivery",
    entityId: updated.id,
    eventType: "POD_VERIFIED",
    processStage: "DELIVERY_PROOF",
    eventTimestamp: updated.verifiedAt ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "USER",
    evidenceIds: updated.evidenceId ? [updated.evidenceId] : undefined,
    verificationActor: input.verifiedBy,
    verificationEvidence: updated.evidenceId,
    resultingState: updated.status,
    relatedRecordType: "LoadProofOfDelivery",
    relatedRecordId: updated.id,
  });
  return updated;
}

export async function recordLoadSettlement(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<SettlementRecord, "id" | "lineage" | "idempotencyKey"> & {
    id?: string;
    lineage?: Partial<RecordLineage>;
    idempotencyKey?: string;
  },
) {
  assertTenant(user, input.fleetId);
  await requireLoad(store, input.fleetId, input.loadId);
  const lineage = withLineage(input.lineage);
  const idempotencyKey =
    input.idempotencyKey ??
    (lineage.sourceSystem && lineage.sourceRecordId
      ? financialIdempotencyKey(lineage.sourceSystem, lineage.sourceRecordId)
      : `bof:settlement:${input.id ?? randomUUID()}`);
  const existing = await store.findSettlementByIdempotency(input.fleetId, idempotencyKey);
  if (existing) return { record: existing, duplicate: true as const };
  const record = await store.createSettlement({
    ...input,
    id: input.id ?? randomUUID(),
    lineage,
    idempotencyKey,
  });
  await emitSettlementEvent(store, user, record, null);
  return { record, duplicate: false as const };
}

export async function updateLoadSettlementStatus(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: { fleetId: string; settlementId: string; status: SettlementRecordStatus; holdReason?: string | null },
) {
  assertTenant(user, input.fleetId);
  const current = await store.getSettlement(input.fleetId, input.settlementId);
  if (!current) throw new ProcessIntelligenceError("Settlement not found", 404);
  if (current.status === input.status) return current;
  const updated = await store.updateSettlement(input.fleetId, input.settlementId, {
    status: input.status,
    holdReason: input.holdReason,
  });
  await emitSettlementEvent(store, user, updated, current?.status ?? null);
  return updated;
}

async function emitSettlementEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  record: SettlementRecord,
  prior: SettlementRecordStatus | null,
) {
  await recordOperatingProcessEvent(store, user, {
    fleetId: record.fleetId,
    loadId: record.loadId,
    entityType: "Settlement",
    entityId: record.id,
    eventType: SETTLEMENT_EVENT[record.status],
    processStage: "SETTLEMENT",
    eventTimestamp: prior ? new Date(record.settlementDate.getTime() + 60_000) : record.settlementDate,
    actorId: user?.id ?? null,
    actorType: "BOF_OPERATIONS",
    lineage: record.lineage,
    priorState: prior ?? null,
    resultingState: record.status,
    financialConsequence: `net ${record.netAmount}`,
    decisionReason: record.holdReason,
    relatedRecordType: "Settlement",
    relatedRecordId: record.id,
  });
}

export async function recordLoadInvoice(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<InvoiceRecord, "id" | "lineage" | "idempotencyKey"> & {
    id?: string;
    lineage?: Partial<RecordLineage>;
    idempotencyKey?: string;
  },
) {
  assertTenant(user, input.fleetId);
  await requireLoad(store, input.fleetId, input.loadId);
  const lineage = withLineage(input.lineage);
  const idempotencyKey =
    input.idempotencyKey ??
    (lineage.sourceSystem && lineage.sourceRecordId
      ? financialIdempotencyKey(lineage.sourceSystem, lineage.sourceRecordId)
      : `bof:invoice:${input.id ?? randomUUID()}`);
  const existing = await store.findInvoiceByIdempotency(input.fleetId, idempotencyKey);
  if (existing) return { record: existing, duplicate: true as const };
  const record = await store.createInvoice({
    ...input,
    id: input.id ?? randomUUID(),
    lineage,
    idempotencyKey,
  });
  await emitInvoiceEvent(store, user, record, null);
  return { record, duplicate: false as const };
}

export async function updateLoadInvoiceStatus(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: { fleetId: string; invoiceId: string; status: InvoiceRecordStatus; submittedAt?: Date | null; paidAt?: Date | null },
) {
  assertTenant(user, input.fleetId);
  const current = await store.getInvoice(input.fleetId, input.invoiceId);
  if (!current) throw new ProcessIntelligenceError("Invoice not found", 404);
  if (current.status === input.status) return current;
  const updated = await store.updateInvoice(input.fleetId, input.invoiceId, {
    status: input.status,
    submittedAt: input.submittedAt,
    paidAt: input.paidAt,
  });
  await emitInvoiceEvent(store, user, updated, current?.status ?? null);
  return updated;
}

async function emitInvoiceEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  record: InvoiceRecord,
  prior: InvoiceRecordStatus | null,
) {
  await recordOperatingProcessEvent(store, user, {
    fleetId: record.fleetId,
    loadId: record.loadId,
    entityType: "Invoice",
    entityId: record.id,
    eventType: INVOICE_EVENT[record.status],
    processStage: "INVOICE_CASH",
    eventTimestamp:
      record.status === "PAID" && record.paidAt
        ? new Date(record.paidAt.getTime() + 1000)
        : (record.paidAt ?? record.submittedAt ?? record.invoiceDate),
    actorId: user?.id ?? null,
    actorType: "BOF_OPERATIONS",
    lineage: record.lineage,
    priorState: prior ?? null,
    resultingState: record.status,
    financialConsequence: `amount ${record.amount}`,
    relatedRecordType: "Invoice",
    relatedRecordId: record.id,
  });
}

export async function recordLoadPayment(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<InvoicePaymentRecord, "id" | "lineage" | "idempotencyKey"> & {
    id?: string;
    lineage?: Partial<RecordLineage>;
    idempotencyKey?: string;
  },
) {
  assertTenant(user, input.fleetId);
  await requireLoad(store, input.fleetId, input.loadId);
  const lineage = withLineage(input.lineage);
  const idempotencyKey =
    input.idempotencyKey ??
    (lineage.sourceSystem && lineage.sourceRecordId
      ? financialIdempotencyKey(lineage.sourceSystem, lineage.sourceRecordId)
      : `bof:payment:${input.id ?? randomUUID()}`);
  const existing = await store.findPaymentByIdempotency(input.fleetId, idempotencyKey);
  if (existing) return { record: existing, duplicate: true as const };
  const record = await store.createPayment({
    ...input,
    id: input.id ?? randomUUID(),
    lineage,
    idempotencyKey,
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: record.fleetId,
    loadId: record.loadId,
    entityType: "InvoicePayment",
    entityId: record.id,
    eventType: "PAYMENT_RECORDED",
    processStage: "INVOICE_CASH",
    eventTimestamp: record.paidAt,
    actorId: user?.id ?? null,
    actorType: "BOF_OPERATIONS",
    lineage,
    financialConsequence: `paid ${record.amount}`,
    resultingState: record.status,
    relatedRecordType: "InvoicePayment",
    relatedRecordId: record.id,
  });
  return { record, duplicate: false as const };
}

export async function getTenantDeliveryRecords(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  fleetId: string,
  loadId: string,
) {
  assertTenant(user, fleetId);
  await requireLoad(store, fleetId, loadId);
  return {
    deliveries: await store.listDeliveriesForLoad(fleetId, loadId),
    proofs: await store.listProofsForLoad(fleetId, loadId),
  };
}

export async function getTenantSettlements(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  fleetId: string,
  loadId: string,
) {
  assertTenant(user, fleetId);
  await requireLoad(store, fleetId, loadId);
  return store.listSettlementsForLoad(fleetId, loadId);
}

export async function getTenantInvoices(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  fleetId: string,
  loadId: string,
) {
  assertTenant(user, fleetId);
  await requireLoad(store, fleetId, loadId);
  return {
    invoices: await store.listInvoicesForLoad(fleetId, loadId),
    payments: await store.listPaymentsForLoad(fleetId, loadId),
  };
}
