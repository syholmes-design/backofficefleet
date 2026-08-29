import { OperationalChatRecordType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";

export type OperatingRecordType = OperationalChatRecordType;

export type OperatingRecordReference = {
  tenantId: string;
  recordType: OperatingRecordType;
  recordId: string;
  title: string;
  snapshot: Record<string, unknown>;
  route: string;
};

export class OperatingRecordError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "OperatingRecordError";
    this.statusCode = statusCode;
  }
}

function requireUser(user: SessionUserLike | null | undefined) {
  if (!user?.id) throw new OperatingRecordError("AUTH_REQUIRED", 401);
  return user;
}

function requireValue(value: string, name: string) {
  const normalized = value.trim();
  if (!normalized) throw new OperatingRecordError(`${name} is required`, 422);
  return normalized;
}

function assertFleetAccess(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) throw new OperatingRecordError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
}

const loadSelect = Prisma.validator<Prisma.LoadSelect>()({
  id: true,
  fleetId: true,
  referenceNumber: true,
  secondaryReferenceNumber: true,
  customerName: true,
  origin: true,
  destination: true,
  status: true,
  pickupWindowStart: true,
  pickupWindowEnd: true,
  deliveryWindowStart: true,
  deliveryWindowEnd: true,
  updatedAt: true,
});

const driverSelect = Prisma.validator<Prisma.DriverSelect>()({
  id: true,
  fleetId: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  updatedAt: true,
});

const documentSelect = Prisma.validator<Prisma.DriverDocumentSelect>()({
  id: true,
  fleetId: true,
  driverId: true,
  type: true,
  status: true,
  originalFileName: true,
  versionNumber: true,
  verificationExpiresAt: true,
  nextVerificationDueAt: true,
  updatedAt: true,
});

const evidenceSelect = Prisma.validator<Prisma.OperationalEvidenceSelect>()({
  id: true,
  fleetId: true,
  loadId: true,
  equipmentId: true,
  evidenceKind: true,
  originalFileName: true,
  mimeType: true,
  capturedAt: true,
  updatedAt: true,
});

const conditionSelect = Prisma.validator<Prisma.ConditionThreadSelect>()({
  id: true,
  fleetId: true,
  equipmentId: true,
  title: true,
  category: true,
  severity: true,
  lifecycleState: true,
  verificationState: true,
  evidenceCompleteness: true,
  firstIdentifiedAt: true,
  updatedAt: true,
});

function asIsoSnapshot<T extends Record<string, unknown>>(record: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}

export async function getAuthorizedOperatingRecord(
  userInput: SessionUserLike | null | undefined,
  fleetIdInput: string,
  recordType: OperatingRecordType,
  recordIdInput: string,
): Promise<OperatingRecordReference> {
  const user = requireUser(userInput);
  const tenantId = requireValue(fleetIdInput, "fleetId");
  const recordId = requireValue(recordIdInput, "recordId");
  assertFleetAccess(user, tenantId);

  if (recordType === "REGULATION") {
    const record = await prisma.regulatoryRequirement.findUnique({ where: { id: recordId }, include: { source: true, versions: { orderBy: { effectiveDate: "desc" } } } });
    if (!record) throw new OperatingRecordError("Regulatory requirement not found", 404);
    return { tenantId, recordType, recordId, title: record.title, snapshot: { id: record.id, title: record.title, topic: record.topic, source: record.source, versions: record.versions }, route: `/qa#regulation-${record.id}` };
  }

  if (recordType === "TRAINING_MODULE") {
    const record = await prisma.trainingModule.findUnique({ where: { id: recordId }, include: { segments: true, regulatoryLinks: { include: { requirementVersion: { include: { requirement: true } } } } } });
    if (!record) throw new OperatingRecordError("Training module not found", 404);
    return { tenantId, recordType, recordId, title: record.title, snapshot: { id: record.id, title: record.title, category: record.category, ownership: record.ownership, version: record.version, regulatoryLinks: record.regulatoryLinks }, route: "/safety/training" };
  }

  if (recordType === "TRAINING_ASSIGNMENT") {
    const record = await prisma.trainingAssignment.findFirst({ where: { id: recordId, fleetId: tenantId }, include: { trainingModule: true, requirementVersion: { include: { requirement: true } }, certification: true } });
    if (!record) throw new OperatingRecordError("Training assignment not found", 404);
    return { tenantId, recordType, recordId, title: `Training assignment: ${record.trainingModule.title}`, snapshot: asIsoSnapshot(record), route: "/safety/training" };
  }

  if (recordType === "TRAINING_CERTIFICATION") {
    const record = await prisma.trainingCertification.findFirst({ where: { id: recordId, fleetId: tenantId }, include: { assignment: { include: { trainingModule: true, requirementVersion: { include: { requirement: true } } } } } });
    if (!record) throw new OperatingRecordError("Training certification not found", 404);
    return { tenantId, recordType, recordId, title: `Training certification: ${record.assignment.trainingModule.title}`, snapshot: asIsoSnapshot(record), route: "/safety/training" };
  }

  if (recordType === "LOAD") {
    const record = await prisma.load.findFirst({ where: { id: recordId, fleetId: tenantId }, select: loadSelect });
    if (!record) throw new OperatingRecordError("Record not found", 404);
    return { tenantId, recordType, recordId, title: `Load ${record.referenceNumber ?? record.id}`, snapshot: asIsoSnapshot(record), route: `/loads/${record.id}` };
  }

  if (recordType === "DRIVER") {
    const record = await prisma.driver.findFirst({ where: { id: recordId, fleetId: tenantId }, select: driverSelect });
    if (!record) throw new OperatingRecordError("Record not found", 404);
    return { tenantId, recordType, recordId, title: `Driver ${record.firstName} ${record.lastName}`.trim(), snapshot: asIsoSnapshot(record), route: `/drivers/${record.id}` };
  }

  if (recordType === "DOCUMENT_REQUEST") {
    const record = await prisma.driverDocument.findFirst({ where: { id: recordId, fleetId: tenantId }, select: documentSelect });
    if (!record) throw new OperatingRecordError("Record not found", 404);
    return { tenantId, recordType, recordId, title: `Document ${record.originalFileName}`, snapshot: asIsoSnapshot(record), route: "/documents" };
  }

  if (recordType === "PROOF") {
    const record = await prisma.operationalEvidence.findFirst({ where: { id: recordId, fleetId: tenantId }, select: evidenceSelect });
    if (!record) throw new OperatingRecordError("Record not found", 404);
    return { tenantId, recordType, recordId, title: `Evidence ${record.originalFileName}`, snapshot: asIsoSnapshot(record), route: record.loadId ? `/loads/${record.loadId}` : "/documents" };
  }

  if (["EXCEPTION", "SAFETY_EVENT", "COMPLIANCE_ISSUE", "MAINTENANCE_ISSUE"].includes(recordType)) {
    const record = await prisma.conditionThread.findFirst({ where: { id: recordId, fleetId: tenantId }, select: conditionSelect });
    if (!record) throw new OperatingRecordError("Record not found", 404);
    return { tenantId, recordType, recordId, title: record.title, snapshot: asIsoSnapshot(record), route: `/maintenance/${record.equipmentId}` };
  }

  throw new OperatingRecordError("This operating record type is not available in the durable operating-record layer", 422);
}

export async function listAuthorizedOperatingRecords(
  userInput: SessionUserLike | null | undefined,
  fleetIdInput: string,
  recordType: OperatingRecordType,
  options?: { limit?: number },
) {
  const user = requireUser(userInput);
  const tenantId = requireValue(fleetIdInput, "fleetId");
  assertFleetAccess(user, tenantId);
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);

  if (recordType === "LOAD") {
    const records = await prisma.load.findMany({ where: { fleetId: tenantId }, orderBy: { updatedAt: "desc" }, take: limit, select: loadSelect });
    return records.map((record) => ({ tenantId, recordType, recordId: record.id, title: `Load ${record.referenceNumber ?? record.id}`, snapshot: asIsoSnapshot(record), route: `/loads/${record.id}` }));
  }
  if (recordType === "DRIVER") {
    const records = await prisma.driver.findMany({ where: { fleetId: tenantId }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: limit, select: driverSelect });
    return records.map((record) => ({ tenantId, recordType, recordId: record.id, title: `Driver ${record.firstName} ${record.lastName}`.trim(), snapshot: asIsoSnapshot(record), route: `/drivers/${record.id}` }));
  }
  if (recordType === "DOCUMENT_REQUEST") {
    const records = await prisma.driverDocument.findMany({ where: { fleetId: tenantId }, orderBy: { updatedAt: "desc" }, take: limit, select: documentSelect });
    return records.map((record) => ({ tenantId, recordType, recordId: record.id, title: `Document ${record.originalFileName}`, snapshot: asIsoSnapshot(record), route: "/documents" }));
  }
  if (recordType === "PROOF") {
    const records = await prisma.operationalEvidence.findMany({ where: { fleetId: tenantId }, orderBy: { updatedAt: "desc" }, take: limit, select: evidenceSelect });
    return records.map((record) => ({ tenantId, recordType, recordId: record.id, title: `Evidence ${record.originalFileName}`, snapshot: asIsoSnapshot(record), route: record.loadId ? `/loads/${record.loadId}` : "/documents" }));
  }
  if (["EXCEPTION", "SAFETY_EVENT", "COMPLIANCE_ISSUE", "MAINTENANCE_ISSUE"].includes(recordType)) {
    const records = await prisma.conditionThread.findMany({ where: { fleetId: tenantId }, orderBy: { updatedAt: "desc" }, take: limit, select: conditionSelect });
    return records.map((record) => ({ tenantId, recordType, recordId: record.id, title: record.title, snapshot: asIsoSnapshot(record), route: `/maintenance/${record.equipmentId}` }));
  }
  throw new OperatingRecordError("This operating record type is not available in the durable operating-record layer", 422);
}
