import { randomUUID } from "crypto";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { reconstructLoadProcess } from "@/lib/process-intelligence/reconstruct";
import type { OperatingProcessStore } from "@/lib/process-intelligence/store";
import {
  ProcessIntelligenceError,
  type OperatingActionStatus,
  type OperatingException,
  type OperatingOwnerTeam,
  type RecordEventInput,
  type RecordLineage,
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

function withLineage(partial?: Partial<RecordLineage>): RecordLineage {
  return {
    ...DEFAULT_LINEAGE,
    ...partial,
  };
}

function businessKeyFromInput(input: RecordEventInput) {
  return {
    fleetId: input.fleetId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    relatedRecordType: input.relatedRecordType ?? null,
    relatedRecordId: input.relatedRecordId ?? input.lineage?.sourceRecordId ?? null,
  };
}

function withOperationalSource(input: RecordEventInput, lineage: RecordLineage): RecordEventInput {
  const sourceRecordId = input.lineage?.sourceRecordId ?? input.relatedRecordId ?? input.entityId;
  return {
    ...input,
    relatedRecordType: input.relatedRecordType ?? input.entityType,
    relatedRecordId: input.relatedRecordId ?? sourceRecordId,
    lineage: {
      ...lineage,
      sourceSystem: lineage.sourceSystem ?? "BOF",
      sourceRecordId: lineage.sourceRecordId ?? sourceRecordId,
    },
  };
}

export async function recordOperatingProcessEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: RecordEventInput,
) {
  assertTenant(user, input.fleetId);
  if (input.loadId) {
    const load = await store.getLoad(input.fleetId, input.loadId);
    if (!load) throw new ProcessIntelligenceError("Load not found for tenant", 404);
  }
  const lineage = withLineage(input.lineage);
  const normalized = withOperationalSource(input, lineage);
  const existing = await store.findEventByBusinessKey(businessKeyFromInput(normalized));
  if (existing) return existing;
  return store.recordEvent({
    ...normalized,
    id: normalized.id ?? randomUUID(),
    recordedAt: normalized.recordedAt ?? new Date(),
    lineage: withLineage(normalized.lineage),
  });
}

export async function getTenantLoadProcess(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  fleetId: string,
  loadId: string,
) {
  assertTenant(user, fleetId);
  const reconstruction = await reconstructLoadProcess(store, fleetId, loadId);
  if (!reconstruction.lineage && reconstruction.events.length === 0) {
    throw new ProcessIntelligenceError("Load process not found", 404);
  }
  return reconstruction;
}

export async function openOperatingException(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: Omit<OperatingException, "id" | "status" | "recurrenceCount"> & {
    id?: string;
    status?: OperatingException["status"];
    recurrenceCount?: number;
  },
) {
  assertTenant(user, input.fleetId);
  const existing = input.loadId ? await store.listExceptionsForLoad(input.fleetId, input.loadId) : [];
  const prior = existing.filter((item) => item.exceptionType === input.exceptionType && item.entityId === input.entityId);
  const exception = await store.createException({
    ...input,
    id: input.id ?? randomUUID(),
    status: input.status ?? "OPEN",
    recurrenceCount: prior.length + 1,
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: exception.fleetId,
    loadId: exception.loadId,
    entityType: exception.entityType,
    entityId: exception.entityId,
    eventType: "EXCEPTION_OPENED",
    processStage: exception.processStage,
    eventTimestamp: new Date(),
    actorId: user?.id ?? null,
    actorType: user?.id ? "USER" : "SYSTEM",
    exceptionId: exception.id,
    operationalConsequence: exception.consequence,
    resultingState: exception.status,
    relatedRecordType: "OperatingException",
    relatedRecordId: exception.id,
    lineage: { sourceSystem: "BOF", sourceRecordId: exception.id },
  });
  return exception;
}

export async function assignCorrectiveAction(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    exceptionId: string;
    loadId?: string | null;
    actionType: string;
    assignedOwnerTeam: OperatingOwnerTeam;
    assignedOwnerUserId?: string | null;
  },
) {
  assertTenant(user, input.fleetId);
  const exception = await store.getException(input.fleetId, input.exceptionId);
  if (!exception) throw new ProcessIntelligenceError("Exception not found", 404);
  const action = await store.createAction({
    id: randomUUID(),
    fleetId: input.fleetId,
    exceptionId: exception.id,
    loadId: input.loadId ?? exception.loadId,
    actionType: input.actionType,
    assignedOwnerTeam: input.assignedOwnerTeam,
    assignedOwnerUserId: input.assignedOwnerUserId ?? null,
    status: "ASSIGNED",
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: action.fleetId,
    loadId: action.loadId,
    entityType: "OperatingCorrectiveAction",
    entityId: action.id,
    eventType: "CORRECTIVE_ACTION_RECORDED",
    processStage: exception.processStage,
    eventTimestamp: new Date(),
    actorId: user?.id ?? null,
    actorType: input.assignedOwnerTeam === "BOF_OPERATIONS" ? "BOF_OPERATIONS" : "USER",
    actionId: action.id,
    exceptionId: exception.id,
    resultingState: action.status,
    relatedRecordType: "OperatingCorrectiveAction",
    relatedRecordId: action.id,
    lineage: { sourceSystem: "BOF", sourceRecordId: action.id },
  });
  return action;
}

export async function completeAndVerifyAction(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    actionId: string;
    outcome: string;
    verificationEvidence: string;
    status?: OperatingActionStatus;
  },
) {
  assertTenant(user, input.fleetId);
  const now = new Date();
  const action = await store.updateAction(input.fleetId, input.actionId, {
    status: input.status ?? "VERIFIED",
    completedAt: now,
    verifiedAt: now,
    verificationActor: user?.id ?? null,
    verificationEvidence: input.verificationEvidence,
    outcome: input.outcome,
  });
  await recordOperatingProcessEvent(store, user, {
    fleetId: action.fleetId,
    loadId: action.loadId,
    entityType: "OperatingCorrectiveAction",
    entityId: action.id,
    eventType: "EXCEPTION_VERIFIED",
    processStage: "DOCUMENTS",
    eventTimestamp: now,
    actorId: user?.id ?? null,
    actorType: "BOF_OPERATIONS",
    actionId: action.id,
    exceptionId: action.exceptionId,
    resolutionStatus: action.status,
    resolutionTimestamp: now,
    verificationActor: user?.id ?? null,
    verificationEvidence: input.verificationEvidence,
    resultingState: action.status,
    relatedRecordType: "OperatingCorrectiveAction",
    relatedRecordId: action.id,
    lineage: { sourceSystem: "BOF", sourceRecordId: action.id, verificationClass: "VERIFIED" },
  });
  return action;
}

export async function recordLoadIntakeEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  load: {
    id: string;
    fleetId: string;
    status: string;
    createdAt?: Date;
    lineage?: Partial<RecordLineage>;
  },
) {
  return recordOperatingProcessEvent(store, user, {
    fleetId: load.fleetId,
    loadId: load.id,
    entityType: "Load",
    entityId: load.id,
    eventType: "LOAD_INTAKE_RECORDED",
    processStage: "LOAD_INTAKE",
    eventTimestamp: load.createdAt ?? load.lineage?.importedAt ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "USER",
    lineage: {
      sourceSystem: "BOF",
      sourceRecordId: load.id,
      ...load.lineage,
    },
    resultingState: "RECEIVED",
    relatedRecordType: "Load",
    relatedRecordId: load.id,
  });
}

export async function recordCanonicalLoadEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  load: {
    id: string;
    fleetId: string;
    status: string;
    createdAt?: Date;
    lineage?: Partial<RecordLineage>;
  },
) {
  const intakeAt = load.createdAt ?? load.lineage?.importedAt ?? new Date();
  return recordOperatingProcessEvent(store, user, {
    fleetId: load.fleetId,
    loadId: load.id,
    entityType: "Load",
    entityId: load.id,
    eventType: "CANONICAL_LOAD_RECORDED",
    processStage: "CANONICAL_LOAD",
    eventTimestamp: new Date(intakeAt.getTime() + 1),
    actorId: user?.id ?? null,
    actorType: "USER",
    lineage: {
      sourceSystem: "BOF",
      sourceRecordId: load.id,
      ...load.lineage,
    },
    resultingState: load.status,
    relatedRecordType: "Load",
    relatedRecordId: load.id,
  });
}

function mapLoadReadinessResult(status: string) {
  if (status === "READY" || status === "RELEASED") return "READY";
  if (status === "BLOCKED" || status === "NOT_READY") return "BLOCKED";
  return "REVIEW_REQUIRED";
}

export async function recordReadinessDecisionEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    loadId?: string | null;
    driverId: string;
    readinessScoreId: string;
    status: string;
    reason: string;
    owner?: string | null;
    eventTimestamp?: Date;
  },
) {
  const resultingState = mapLoadReadinessResult(input.status);
  return recordOperatingProcessEvent(store, user, {
    fleetId: input.fleetId,
    loadId: input.loadId,
    entityType: "Driver",
    entityId: input.driverId,
    eventType: "READINESS_EVALUATED",
    processStage: "READINESS",
    eventTimestamp: input.eventTimestamp ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "SYSTEM",
    relatedRecordType: "DriverReadinessScore",
    relatedRecordId: input.readinessScoreId,
    decisionType: "DRIVER_READINESS",
    decisionResult: resultingState,
    decisionReason: input.reason,
    decisionOwner: input.owner ?? user?.id ?? null,
    resultingState,
    lineage: { sourceSystem: "BOF", sourceRecordId: input.readinessScoreId },
  });
}

export async function recordLoadReadinessEvaluatedEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    loadId: string;
    sourceRecordType: string;
    sourceRecordId: string;
    status: string;
    reason: string;
    owner?: string | null;
    eventTimestamp?: Date;
  },
) {
  const resultingState = mapLoadReadinessResult(input.status);
  return recordOperatingProcessEvent(store, user, {
    fleetId: input.fleetId,
    loadId: input.loadId,
    entityType: "Load",
    entityId: input.loadId,
    eventType: "READINESS_EVALUATED",
    processStage: "READINESS",
    eventTimestamp: input.eventTimestamp ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "SYSTEM",
    relatedRecordType: input.sourceRecordType,
    relatedRecordId: input.sourceRecordId,
    decisionType: "LOAD_READINESS",
    decisionResult: resultingState,
    decisionReason: input.reason,
    decisionOwner: input.owner ?? user?.id ?? null,
    resultingState,
    lineage: { sourceSystem: "BOF", sourceRecordId: input.sourceRecordId },
  });
}

export async function recordReleaseDecisionEvent(
  store: OperatingProcessStore,
  user: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    loadId: string;
    releaseId: string;
    disposition: string;
    reason: string;
    owner?: string | null;
    evidenceIds?: string[];
    eventTimestamp?: Date;
  },
) {
  return recordOperatingProcessEvent(store, user, {
    fleetId: input.fleetId,
    loadId: input.loadId,
    entityType: "Load",
    entityId: input.loadId,
    eventType: "RELEASE_EVALUATED",
    processStage: "RELEASE",
    eventTimestamp: input.eventTimestamp ?? new Date(),
    actorId: user?.id ?? null,
    actorType: "USER",
    relatedRecordType: "DispatchRelease",
    relatedRecordId: input.releaseId,
    lineage: { sourceSystem: "BOF", sourceRecordId: input.releaseId },
    decisionType: "LOAD_RELEASE",
    decisionResult: input.disposition,
    decisionReason: input.reason,
    decisionOwner: input.owner ?? user?.id ?? null,
    evidenceIds: input.evidenceIds,
    resultingState: input.disposition,
    operationalConsequence:
      input.disposition === "RELEASED" || input.disposition === "CONDITIONALLY_RELEASED"
        ? "Load may proceed."
        : "Load is held or blocked.",
  });
}
