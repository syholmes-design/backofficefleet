import { randomUUID } from "crypto";

import type { OperatingProcessStore } from "@/lib/process-intelligence/store";
import type {
  CanonicalLoadRecord,
  IngestionRecord,
  IngestionSourceFormat,
  OriginValidationStatus,
  RecordLineage,
} from "@/lib/process-intelligence/types";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import type { SessionActor } from "@/lib/process-intelligence/types";

export type IngestionSourceRecord = {
  sourceRecordId: string;
  customerName?: unknown;
  origin?: unknown;
  destination?: unknown;
  referenceNumber?: unknown;
  status?: unknown;
  historical?: unknown;
};

export type MappedLoadRecord = {
  sourceRecordId: string;
  customerName: string;
  origin: string;
  destination: string;
  referenceNumber: string | null;
  status: string;
  historical: boolean;
};

function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ProcessIntelligenceError(`${field} is required`, 422);
  }
  return value.trim();
}

export function mapSourceLoad(source: IngestionSourceRecord): MappedLoadRecord {
  return {
    sourceRecordId: asNonEmptyString(source.sourceRecordId, "sourceRecordId"),
    customerName: asNonEmptyString(source.customerName, "customerName"),
    origin: asNonEmptyString(source.origin, "origin"),
    destination: asNonEmptyString(source.destination, "destination"),
    referenceNumber: typeof source.referenceNumber === "string" && source.referenceNumber.trim() ? source.referenceNumber.trim() : null,
    status: typeof source.status === "string" && source.status.trim() ? source.status.trim() : "PLANNED",
    historical: source.historical === true,
  };
}

export function normalizeMappedLoad(mapped: MappedLoadRecord): MappedLoadRecord {
  return {
    ...mapped,
    customerName: mapped.customerName.replace(/\s+/g, " "),
    origin: mapped.origin.replace(/\s+/g, " "),
    destination: mapped.destination.replace(/\s+/g, " "),
    status: mapped.status.toUpperCase(),
  };
}

export function validateNormalizedLoad(normalized: MappedLoadRecord): {
  status: OriginValidationStatus;
  message?: string;
} {
  if (!normalized.sourceRecordId || !normalized.customerName || !normalized.origin || !normalized.destination) {
    return { status: "FAILED", message: "Required load identity fields are missing." };
  }
  return { status: "PASSED" };
}

export function buildIdempotencyKey(fleetId: string, sourceSystem: string, sourceRecordId: string) {
  return `${fleetId}:${sourceSystem}:${sourceRecordId}`;
}

export async function ingestCanonicalLoad(options: {
  store: OperatingProcessStore;
  actor: SessionActor;
  fleetId: string;
  sourceSystem: string;
  sourceFormat: IngestionSourceFormat;
  source: IngestionSourceRecord;
  verificationClass?: RecordLineage["verificationClass"];
}): Promise<{ load: CanonicalLoadRecord; ingestion: IngestionRecord; duplicate: boolean }> {
  const { store, actor, fleetId, sourceSystem, sourceFormat, source } = options;
  const mapped = mapSourceLoad(source);
  const normalized = normalizeMappedLoad(mapped);
  const validation = validateNormalizedLoad(normalized);
  const idempotencyKey = buildIdempotencyKey(fleetId, sourceSystem, normalized.sourceRecordId);
  const existing = await store.findIngestionByIdempotency(fleetId, idempotencyKey);
  if (existing?.canonicalEntityId) {
    const load = await store.getLoad(fleetId, existing.canonicalEntityId);
    if (!load) throw new ProcessIntelligenceError("Canonical load missing for ingested record", 409);
    return { load, ingestion: existing, duplicate: true };
  }
  if (validation.status !== "PASSED") {
    throw new ProcessIntelligenceError(validation.message ?? "Validation failed", 422);
  }

  const loadId = randomUUID();
  const ingestionId = randomUUID();
  const lineage: RecordLineage = {
    lifecycleClass: normalized.historical ? "HISTORICAL" : "LIVE",
    originKind: "IMPORTED",
    verificationClass: options.verificationClass ?? "UNVERIFIED",
    derivationKind: "SOURCE",
    sourceSystem,
    sourceRecordId: normalized.sourceRecordId,
    importedAt: new Date(),
    originValidationStatus: "PASSED",
  };
  const load = await store.createLoad({
    id: loadId,
    fleetId,
    customerName: normalized.customerName,
    origin: normalized.origin,
    destination: normalized.destination,
    referenceNumber: normalized.referenceNumber,
    status: normalized.status,
    lineage,
  });
  const intakeTimestamp = lineage.importedAt ?? new Date();
  await recordOperatingProcessEvent(store, actor, {
    fleetId,
    loadId: load.id,
    entityType: "IngestionRecord",
    entityId: ingestionId,
    eventType: "LOAD_INTAKE_RECORDED",
    processStage: "LOAD_INTAKE",
    eventTimestamp: intakeTimestamp,
    actorId: actor.id ?? null,
    actorType: "SYSTEM",
    lineage,
    resultingState: "RECEIVED",
    relatedRecordType: "IngestionRecord",
    relatedRecordId: ingestionId,
  });
  const event = await recordOperatingProcessEvent(store, actor, {
    fleetId,
    loadId: load.id,
    entityType: "Load",
    entityId: load.id,
    eventType: "CANONICAL_LOAD_RECORDED",
    processStage: "CANONICAL_LOAD",
    eventTimestamp: new Date(intakeTimestamp.getTime() + 1),
    actorId: actor.id ?? null,
    actorType: "SYSTEM",
    lineage,
    resultingState: load.status,
    relatedRecordType: "Load",
    relatedRecordId: load.id,
  });
  const ingestion: IngestionRecord = {
    id: ingestionId,
    batchId: randomUUID(),
    fleetId,
    sourceRecordId: normalized.sourceRecordId,
    idempotencyKey,
      sourcePayload: { ...source, sourceFormat, sourceSystem },
    mappedPayload: mapped,
    normalizedPayload: normalized,
    validationStatus: "PASSED",
    status: "EVENT_RECORDED",
    canonicalEntityType: "Load",
    canonicalEntityId: load.id,
    loadId: load.id,
    operatingEventId: event.id,
  };
  await store.createIngestionRecord(ingestion);
  return { load, ingestion, duplicate: false };
}
