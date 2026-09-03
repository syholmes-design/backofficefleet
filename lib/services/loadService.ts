import { LoadStatus, type Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordCanonicalLoadEvent, recordLoadIntakeEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

const MUTABLE_LOAD_FIELDS = new Set([
  "customerName",
  "origin",
  "destination",
  "pickupWindowStart",
  "pickupWindowEnd",
  "deliveryWindowStart",
  "deliveryWindowEnd",
  "referenceNumber",
  "secondaryReferenceNumber",
  "status",
] as const);

type LoadDateInput = Date | string | null | undefined;

export type CreateLoadPayload = {
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  pickupWindowStart?: LoadDateInput;
  pickupWindowEnd?: LoadDateInput;
  deliveryWindowStart?: LoadDateInput;
  deliveryWindowEnd?: LoadDateInput;
  referenceNumber?: string | null;
  secondaryReferenceNumber?: string | null;
  status: LoadStatus;
  lifecycleClass?: "LIVE" | "HISTORICAL";
  originKind?: "BOF_CREATED" | "USER_CREATED" | "IMPORTED" | "EXTERNAL_SYSTEM" | "SYSTEM_GENERATED";
  verificationClass?: "VERIFIED" | "UNVERIFIED";
  sourceSystem?: string | null;
  sourceRecordId?: string | null;
  importedAt?: LoadDateInput;
  originValidationStatus?: "PENDING" | "PASSED" | "FAILED" | null;
};

export type UpdateLoadPayload = Partial<Omit<CreateLoadPayload, "fleetId">>;

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function ensureNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }
  return value.trim();
}

function parseOptionalDate(value: LoadDateInput, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw Object.assign(new Error(`${fieldName} must be a valid date`), { statusCode: 422 });
  }
  return parsed;
}

function ensureValidLoadStatus(status: string) {
  if (!Object.values(LoadStatus).includes(status as LoadStatus)) {
    throw Object.assign(new Error("Invalid load status"), { statusCode: 422 });
  }
  return status as LoadStatus;
}

async function logUnauthorizedDispatchAccess(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string | null,
  entityId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: sessionUser?.id ?? null,
    actorEmail: sessionUser?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "Load",
    entityId,
    details: { event: "unauthorized dispatch access", reason },
    metadata: { source: "load-service" },
  });
}

async function getAuthorizedLoadRecord(sessionUser: SessionUserLike | null | undefined, loadId: string) {
  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    return { load: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, load.fleetId);
  if (!access.allowed) {
    return { load, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { load, allowed: true, reason: undefined as string | undefined };
}

function buildLoadUpdateData(payload: UpdateLoadPayload): Prisma.LoadUpdateInput {
  const invalidKeys = Object.keys(payload).filter(
    (key) => !MUTABLE_LOAD_FIELDS.has(key as keyof typeof payload & (typeof MUTABLE_LOAD_FIELDS extends Set<infer T> ? T : never)),
  );
  if (invalidKeys.length > 0) {
    throw Object.assign(new Error(`Invalid fields: ${invalidKeys.join(", ")}`), { statusCode: 422 });
  }

  const data: Prisma.LoadUpdateInput = {};

  if (payload.customerName !== undefined) {
    data.customerName = ensureNonEmptyString(payload.customerName, "customerName");
  }
  if (payload.origin !== undefined) {
    data.origin = ensureNonEmptyString(payload.origin, "origin");
  }
  if (payload.destination !== undefined) {
    data.destination = ensureNonEmptyString(payload.destination, "destination");
  }
  if (payload.pickupWindowStart !== undefined) {
    data.pickupWindowStart = parseOptionalDate(payload.pickupWindowStart, "pickupWindowStart");
  }
  if (payload.pickupWindowEnd !== undefined) {
    data.pickupWindowEnd = parseOptionalDate(payload.pickupWindowEnd, "pickupWindowEnd");
  }
  if (payload.deliveryWindowStart !== undefined) {
    data.deliveryWindowStart = parseOptionalDate(payload.deliveryWindowStart, "deliveryWindowStart");
  }
  if (payload.deliveryWindowEnd !== undefined) {
    data.deliveryWindowEnd = parseOptionalDate(payload.deliveryWindowEnd, "deliveryWindowEnd");
  }
  if (payload.referenceNumber !== undefined) {
    data.referenceNumber = payload.referenceNumber?.trim() ? payload.referenceNumber.trim() : null;
  }
  if (payload.secondaryReferenceNumber !== undefined) {
    data.secondaryReferenceNumber = payload.secondaryReferenceNumber?.trim()
      ? payload.secondaryReferenceNumber.trim()
      : null;
  }
  if (payload.status !== undefined) {
    data.status = ensureValidLoadStatus(payload.status);
  }

  return data;
}

export async function getLoadById(sessionUser: SessionUserLike | null | undefined, loadId: string) {
  requireSessionUser(sessionUser);

  const { load, allowed, reason } = await getAuthorizedLoadRecord(sessionUser, loadId);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, load.fleetId, load.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return load;
}

export async function listLoadsForFleet(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  requireSessionUser(sessionUser);

  const access = await authorizedFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.load.findMany({
    where: { fleetId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function createLoad(sessionUser: SessionUserLike | null | undefined, payload: CreateLoadPayload) {
  requireSessionUser(sessionUser);

  const fleetId = ensureNonEmptyString(payload.fleetId, "fleetId");
  const access = await authorizedFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const data: Prisma.LoadCreateInput = {
    fleet: { connect: { id: fleetId } },
    customerName: ensureNonEmptyString(payload.customerName, "customerName"),
    origin: ensureNonEmptyString(payload.origin, "origin"),
    destination: ensureNonEmptyString(payload.destination, "destination"),
    pickupWindowStart: parseOptionalDate(payload.pickupWindowStart, "pickupWindowStart") ?? null,
    pickupWindowEnd: parseOptionalDate(payload.pickupWindowEnd, "pickupWindowEnd") ?? null,
    deliveryWindowStart: parseOptionalDate(payload.deliveryWindowStart, "deliveryWindowStart") ?? null,
    deliveryWindowEnd: parseOptionalDate(payload.deliveryWindowEnd, "deliveryWindowEnd") ?? null,
    referenceNumber: payload.referenceNumber?.trim() ? payload.referenceNumber.trim() : null,
    secondaryReferenceNumber: payload.secondaryReferenceNumber?.trim()
      ? payload.secondaryReferenceNumber.trim()
      : null,
    status: ensureValidLoadStatus(payload.status),
    lifecycleClass: payload.lifecycleClass ?? "LIVE",
    originKind: payload.originKind ?? "BOF_CREATED",
    verificationClass: payload.verificationClass ?? "UNVERIFIED",
    sourceSystem: payload.sourceSystem?.trim() ? payload.sourceSystem.trim() : null,
    sourceRecordId: payload.sourceRecordId?.trim() ? payload.sourceRecordId.trim() : null,
    importedAt: parseOptionalDate(payload.importedAt, "importedAt") ?? null,
    originValidationStatus: payload.originValidationStatus ?? null,
  };

  const created = await prisma.load.create({ data });
  const store = getOperatingProcessStore();
  const lineage = {
    lifecycleClass: created.lifecycleClass,
    originKind: created.originKind,
    verificationClass: created.verificationClass,
    derivationKind: created.derivationKind,
    sourceSystem: created.sourceSystem,
    sourceRecordId: created.sourceRecordId,
    importedAt: created.importedAt,
    originValidationStatus: created.originValidationStatus,
  };
  await recordLoadIntakeEvent(store, sessionUser, {
    id: created.id,
    fleetId: created.fleetId,
    status: created.status,
    createdAt: created.createdAt,
    lineage,
  });
  await recordCanonicalLoadEvent(store, sessionUser, {
    id: created.id,
    fleetId: created.fleetId,
    status: created.status,
    createdAt: created.createdAt,
    lineage,
  });
  return created;
}

export async function updateLoad(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
  payload: UpdateLoadPayload,
) {
  requireSessionUser(sessionUser);

  const { load, allowed, reason } = await getAuthorizedLoadRecord(sessionUser, loadId);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, load.fleetId, load.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const data = buildLoadUpdateData(payload);
  return prisma.load.update({
    where: { id: load.id },
    data,
  });
}
