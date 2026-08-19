import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  createDocument,
  getDocumentById,
  getDocumentsForIntake,
  updateDocument,
} from "@/lib/repositories/documentRepository";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import { authorizedFleetAccess, logUnauthorizedAttempt, type SessionUserLike } from "@/lib/services/intakeService";
import { evaluateIntakeRequirements } from "@/lib/services/requirementService";

const VALID_DOCUMENT_TYPES = [
  "DRIVER_LICENSE",
  "MEDICAL",
  "DRUG_TEST",
  "WORK_HISTORY",
  "ACCIDENT_HISTORY",
  "VIOLATION_HISTORY",
  "IDENTITY_SUPPORTING",
  "OTHER",
] as const;

const VALID_DOCUMENT_STATUSES = [
  "RECEIVED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "CERTIFIED",
  "REJECTED",
  "EXPIRED",
] as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["PENDING_VERIFICATION"],
  PENDING_VERIFICATION: ["VERIFIED", "REJECTED"],
  VERIFIED: ["REJECTED"],
  REJECTED: [],
  CERTIFIED: ["REJECTED"],
  EXPIRED: ["VERIFIED"],
};

export async function getAuthorizedDocument(user: SessionUserLike | null | undefined, documentId: string) {
  const document = await getDocumentById(documentId);
  if (!document) {
    return { document: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const authenticatedDriver = await getAuthenticatedDriver(user);
  if (authenticatedDriver.status === "LINKED") {
    if (authenticatedDriver.driver.id === document.driverId) {
      return { document, allowed: true, reason: undefined as string | undefined };
    }
  }

  const access = await authorizedFleetAccess(user, document.fleetId);
  if (!access.allowed) {
    if (authenticatedDriver.status === "LINKED") {
      return { document: null, allowed: false, reason: "NOT_FOUND" as const };
    }
    return { document, allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
  }

  return { document, allowed: true, reason: undefined as string | undefined };
}

export async function getAuthorizedIntakeDocuments(user: SessionUserLike | null | undefined, intakeId: string) {
  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    return { intake: null, documents: [], allowed: false, reason: "NOT_FOUND" as const };
  }

  const authenticatedDriver = await getAuthenticatedDriver(user);
  if (authenticatedDriver.status === "LINKED") {
    if (authenticatedDriver.driver.id !== intake.driverId) {
      const access = await authorizedFleetAccess(user, intake.fleetId);
      if (!access.allowed) {
        return { intake: null, documents: [], allowed: false, reason: "NOT_FOUND" as const };
      }
    } else {
      const documents = await getDocumentsForIntake(intakeId);
      return { intake, documents, allowed: true, reason: undefined as string | undefined };
    }
  }

  const access = await authorizedFleetAccess(user, intake.fleetId);
  if (!access.allowed) {
    return { intake, documents: [], allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
  }

  const documents = await getDocumentsForIntake(intakeId);
  return { intake, documents, allowed: true, reason: undefined as string | undefined };
}

export async function createDriverDocumentRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  intakeId: string;
  fleetId?: string;
  payload: {
    driverId?: string;
    documentType?: string;
    storageKey?: string;
    originalFileName?: string;
    mimeType?: string | null;
    checksum?: string | null;
    metadata?: Record<string, unknown> | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: input.intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const resolvedFleetId = input.fleetId ?? intake.fleetId;
  const access = await authorizedFleetAccess(input.sessionUser, resolvedFleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const driverId = input.payload.driverId ?? intake.driverId;
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { fleet: true },
  });
  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  if (driver.fleetId !== intake.fleetId || intake.driverId !== driver.id) {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: resolvedFleetId,
      action: "ACCESS_DENIED",
      entityType: "DriverDocument",
      entityId: null,
      details: { event: "cross.fleet.access", path: "/api/intake/[intakeId]/documents", reason: "driver-or-intake-fleet-mismatch" },
      metadata: { source: "document-api" },
    });
    throw Object.assign(new Error("Driver does not belong to the intake fleet"), { statusCode: 422 });
  }

  const documentType = input.payload.documentType ?? "OTHER";
  if (!VALID_DOCUMENT_TYPES.includes(documentType as (typeof VALID_DOCUMENT_TYPES)[number])) {
    throw Object.assign(new Error("Invalid document type"), { statusCode: 422 });
  }

  if (!input.payload.storageKey || typeof input.payload.storageKey !== "string" || input.payload.storageKey.trim().length === 0) {
    throw Object.assign(new Error("storageKey is required"), { statusCode: 422 });
  }

  if (!input.payload.originalFileName || input.payload.originalFileName.trim().length === 0) {
    throw Object.assign(new Error("originalFileName is required"), { statusCode: 422 });
  }

  if (input.payload.metadata !== undefined && (typeof input.payload.metadata !== "object" || input.payload.metadata === null || Array.isArray(input.payload.metadata))) {
    throw Object.assign(new Error("metadata must be an object"), { statusCode: 422 });
  }

  const document = await createDocument({
    driverId: driver.id,
    driverIntakeId: intake.id,
    fleetId: intake.fleetId,
    type: documentType,
    status: "RECEIVED",
    storageKey: input.payload.storageKey,
    originalFileName: input.payload.originalFileName,
    mimeType: input.payload.mimeType ?? null,
    checksum: input.payload.checksum ?? null,
    uploadedByUserId: input.sessionUser.id,
  });

  await evaluateIntakeRequirements(intake.id);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "CREATED",
    entityType: "DriverDocument",
    entityId: document.id,
    details: { event: "document.uploaded", intakeId: intake.id, driverId: driver.id, documentType, storageKey: input.payload.storageKey },
    metadata: { source: "document-api", metadata: input.payload.metadata ?? {} },
  });

  return document;
}

export async function updateDriverDocumentRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  documentId: string;
  payload: {
    status?: string;
    verifiedByUserId?: string | null;
    verificationExpiresAt?: string | null;
    nextVerificationDueAt?: string | null;
    verificationSourceProvider?: string;
    rejectionReason?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const { document, allowed } = await getAuthorizedDocument(input.sessionUser, input.documentId);
  if (!document) {
    throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedAttempt(input.sessionUser, document.fleetId, document.driverIntakeId, "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const someStatus = input.payload.status ?? document.status;
  if ((VALID_DOCUMENT_STATUSES as readonly string[]).includes(someStatus) === false) {
    throw Object.assign(new Error("Invalid document status"), { statusCode: 422 });
  }

  const allowedTransitions = STATUS_TRANSITIONS[document.status] ?? [];
  if (input.payload.status && !allowedTransitions.includes(input.payload.status)) {
    throw Object.assign(new Error(`Illegal document status transition from ${document.status} to ${input.payload.status}`), { statusCode: 422 });
  }

  const nextStatus = input.payload.status ?? document.status;
  const verificationExpiresAt = input.payload.verificationExpiresAt ? new Date(input.payload.verificationExpiresAt) : document.verificationExpiresAt;
  const nextVerificationDueAt = input.payload.nextVerificationDueAt ? new Date(input.payload.nextVerificationDueAt) : document.nextVerificationDueAt;
  const verifiedByUserId = input.payload.verifiedByUserId ?? document.verifiedByUserId ?? (nextStatus === "VERIFIED" ? input.sessionUser.id : null);

  const updated = await updateDocument(document.id, {
    status: nextStatus,
    verifiedByUserId,
    verifiedAt: nextStatus === "VERIFIED" ? (document.verifiedAt ?? new Date()) : document.verifiedAt,
    verificationExpiresAt: nextStatus === "VERIFIED" ? (verificationExpiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) : verificationExpiresAt,
    nextVerificationDueAt: nextStatus === "VERIFIED" ? (nextVerificationDueAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) : nextVerificationDueAt,
    verificationQuality: input.payload.rejectionReason ?? document.verificationQuality,
  });

  if (input.payload.verificationSourceProvider) {
    await prisma.verificationSource.create({
      data: {
        driverDocumentId: updated.id,
        providerName: input.payload.verificationSourceProvider,
        providerType: "INTERNAL",
        verificationMethod: "SERVER",
        verificationStatus: nextStatus === "VERIFIED" ? "VERIFIED" : nextStatus === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION",
        verifiedAt: nextStatus === "VERIFIED" ? new Date() : null,
        verifiedByUserId: nextStatus === "VERIFIED" ? input.sessionUser.id : null,
      },
    });
  }

  await evaluateIntakeRequirements(document.driverIntakeId);

  if (nextStatus === "VERIFIED") {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: document.fleetId,
      action: "UPDATED",
      entityType: "DriverDocument",
      entityId: document.id,
      details: { event: "document.verified", documentId: document.id, nextStatus },
      metadata: { source: "document-api" },
    });
  }

  if (nextStatus === "REJECTED") {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: document.fleetId,
      action: "UPDATED",
      entityType: "DriverDocument",
      entityId: document.id,
      details: { event: "document.rejected", documentId: document.id, reason: input.payload.rejectionReason ?? "REJECTED" },
      metadata: { source: "document-api" },
    });
  }

  return updated;
}

export async function listDriverDocumentsForIntake(user: SessionUserLike | null | undefined, intakeId: string) {
  const access = await getAuthorizedIntakeDocuments(user, intakeId);
  if (!access.intake) {
    throw Object.assign(new Error("Intake not found"), { statusCode: 404 });
  }
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return access.documents;
}
