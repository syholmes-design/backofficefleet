import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import { type SessionUserLike } from "@/lib/services/intakeService";

import { driverVaultDocumentTypeLabel, DRIVER_VAULT_DOCUMENT_TYPES } from "@/lib/driver-vault-document-types";

const DRIVER_VAULT_ROOT = resolve(process.cwd(), "storage", "driver-vault");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

type VaultDocSelect = {
  id: string;
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  type: string;
  status: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string | null;
  checksum: string | null;
  uploadedAt: Date;
  verifiedAt: Date | null;
  verificationExpiresAt: Date | null;
  nextVerificationDueAt: Date | null;
  updatedAt: Date;
};

export type DriverVaultDocumentSummary = {
  id: string;
  type: string;
  typeLabel: string;
  status: string;
  originalFileName: string;
  uploadedAt: string;
  verifiedAt: string | null;
  verificationExpiresAt: string | null;
  nextVerificationDueAt: string | null;
  downloadUrl: string;
};

function vaultConflict(message: string) {
  return Object.assign(new Error(message), { statusCode: 409 });
}

function vaultNotFound(message: string) {
  return Object.assign(new Error(message), { statusCode: 404 });
}

function vaultInvalid(message: string) {
  return Object.assign(new Error(message), { statusCode: 422 });
}

function sanitizeFileName(value: string) {
  const next = basename(value || "document");
  return next.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function requireDriverVaultContext(sessionUser: SessionUserLike | null | undefined) {
  const authenticatedDriver = await getAuthenticatedDriver(sessionUser);
  if (authenticatedDriver.status === "UNAUTHENTICATED") {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  if (authenticatedDriver.status === "UNLINKED") {
    throw vaultConflict("Driver identity is not linked");
  }
  const intake = await prisma.driverIntake.findFirst({
    where: { driverId: authenticatedDriver.driver.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, fleetId: true, driverId: true },
  });
  if (!intake) {
    throw vaultConflict("Driver intake context is not available");
  }
  return { authenticatedDriver, intake };
}

function storagePathForKey(storageKey: string) {
  return join(DRIVER_VAULT_ROOT, storageKey);
}

function storageKeyForDocument(driverId: string, documentId: string, fileName: string) {
  const safeFileName = sanitizeFileName(fileName);
  return join(driverId, documentId, safeFileName);
}

async function persistFile(storageKey: string, bytes: Uint8Array) {
  const fullPath = storagePathForKey(storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
  return fullPath;
}

async function removeFile(storageKey: string) {
  await rm(storagePathForKey(storageKey), { force: true });
}

function toSummary(document: VaultDocSelect): DriverVaultDocumentSummary {
  return {
    id: document.id,
    type: document.type,
    typeLabel: driverVaultDocumentTypeLabel(document.type),
    status: document.status,
    originalFileName: document.originalFileName,
    uploadedAt: document.uploadedAt.toISOString(),
    verifiedAt: document.verifiedAt ? document.verifiedAt.toISOString() : null,
    verificationExpiresAt: document.verificationExpiresAt ? document.verificationExpiresAt.toISOString() : null,
    nextVerificationDueAt: document.nextVerificationDueAt ? document.nextVerificationDueAt.toISOString() : null,
    downloadUrl: `/api/driver/vault/documents/${document.id}/download`,
  };
}

export async function listAuthenticatedDriverVaultDocuments(sessionUser: SessionUserLike | null | undefined) {
  const context = await requireDriverVaultContext(sessionUser);
  const documents = await prisma.driverDocument.findMany({
    where: { driverId: context.authenticatedDriver.driver.id },
    orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      type: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
      updatedAt: true,
    },
  });

  const requiredTypes = DRIVER_VAULT_DOCUMENT_TYPES.map((item) => item.value);
  const presentTypes = new Set(documents.map((document) => document.type));
  const missingDocumentTypes = requiredTypes.filter((type) => !presentTypes.has(type));

  return {
    state: "LINKED" as const,
    driver: {
      id: context.authenticatedDriver.driver.id,
      firstName: context.authenticatedDriver.driver.firstName,
      lastName: context.authenticatedDriver.driver.lastName,
      fleetId: context.authenticatedDriver.driver.fleetId,
      fleetName: context.authenticatedDriver.driver.fleet?.name ?? null,
    },
    intakeId: context.intake.id,
    documents: documents.map(toSummary),
    missingDocumentTypes: missingDocumentTypes.map((type) => ({
      type,
      label: driverVaultDocumentTypeLabel(type),
    })),
  };
}

export async function getAuthenticatedDriverVaultStatus(sessionUser: SessionUserLike | null | undefined) {
  const authenticatedDriver = await getAuthenticatedDriver(sessionUser);
  if (authenticatedDriver.status !== "LINKED") {
    return {
      state: authenticatedDriver.status,
      driver: null,
      documents: [],
      missingDocumentTypes: [],
    };
  }

  return listAuthenticatedDriverVaultDocuments(sessionUser);
}

async function readUploadFile(formData: FormData) {
  const documentType = String(formData.get("documentType") ?? "").trim();
  if (!documentType) {
    throw vaultInvalid("documentType is required");
  }

  if (!DRIVER_VAULT_DOCUMENT_TYPES.some((item) => item.value === documentType)) {
    throw vaultInvalid("Invalid document type");
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    throw vaultInvalid("file is required");
  }

  if (fileEntry.size <= 0) {
    throw vaultInvalid("file is required");
  }

  if (fileEntry.size > MAX_UPLOAD_BYTES) {
    throw vaultInvalid("file exceeds size limit");
  }

  const mimeType = String(fileEntry.type ?? "").trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw vaultInvalid("Unsupported file type");
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  return {
    documentType,
    fileEntry,
    bytes,
    mimeType,
    checksum: sha256Hex(bytes),
  };
}

async function writeDriverVaultDocument(input: {
  authenticatedDriver: Awaited<ReturnType<typeof getDriverContext>>["authenticatedDriver"];
  intakeId: string;
  documentType: string;
  fileEntry: File;
  bytes: Uint8Array;
  mimeType: string;
  checksum: string;
  existingDocumentId?: string;
}) {
  const documentId = input.existingDocumentId ?? randomUUID();
  const storageKey = storageKeyForDocument(input.authenticatedDriver.driver.id, documentId, input.fileEntry.name || `${input.documentType.toLowerCase()}.bin`);
  await persistFile(storageKey, input.bytes);

  try {
    const document =
      input.existingDocumentId
        ? await prisma.driverDocument.update({
            where: { id: input.existingDocumentId },
            data: {
              type: input.documentType as never,
              storageKey,
              originalFileName: sanitizeFileName(input.fileEntry.name || `${input.documentType}.bin`),
              mimeType: input.mimeType,
              checksum: input.checksum,
            },
            select: {
              id: true,
              driverId: true,
              driverIntakeId: true,
              fleetId: true,
              type: true,
              status: true,
              storageKey: true,
              originalFileName: true,
              mimeType: true,
              checksum: true,
              uploadedAt: true,
              verifiedAt: true,
              verificationExpiresAt: true,
              nextVerificationDueAt: true,
              updatedAt: true,
            },
          })
        : await prisma.driverDocument.create({
            data: {
              id: documentId,
              driverId: input.authenticatedDriver.driver.id,
              driverIntakeId: input.intakeId,
              fleetId: input.authenticatedDriver.driver.fleetId,
              type: input.documentType as never,
              status: "RECEIVED" as never,
              storageKey,
              originalFileName: sanitizeFileName(input.fileEntry.name || `${input.documentType}.bin`),
              mimeType: input.mimeType,
              checksum: input.checksum,
              uploadedByUserId: input.authenticatedDriver.userId,
            },
            select: {
              id: true,
              driverId: true,
              driverIntakeId: true,
              fleetId: true,
              type: true,
              status: true,
              storageKey: true,
              originalFileName: true,
              mimeType: true,
              checksum: true,
              uploadedAt: true,
              verifiedAt: true,
              verificationExpiresAt: true,
              nextVerificationDueAt: true,
              updatedAt: true,
            },
          });

    await createAuditRecord({
      actorId: input.authenticatedDriver.userId,
      actorEmail: input.authenticatedDriver.email,
      tenantId: input.authenticatedDriver.driver.fleetId,
      action: input.existingDocumentId ? "UPDATED" : "CREATED",
      entityType: "DriverDocument",
      entityId: document.id,
      details: {
        event: input.existingDocumentId ? "driver.document.replaced" : "driver.document.uploaded",
        driverId: input.authenticatedDriver.driver.id,
        intakeId: input.intakeId,
        documentType: input.documentType,
        storageKey,
      },
      metadata: {
        source: "driver-vault-service",
        mimeType: input.mimeType,
      },
    });

    return toSummary(document);
  } catch (error) {
    await removeFile(storageKey);
    throw error;
  }
}

async function getDriverContext(sessionUser: SessionUserLike | null | undefined) {
  const authenticatedDriver = await getAuthenticatedDriver(sessionUser);
  if (authenticatedDriver.status === "UNAUTHENTICATED") {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  if (authenticatedDriver.status === "UNLINKED") {
    throw vaultConflict("Driver identity is not linked");
  }
  const intake = await prisma.driverIntake.findFirst({
    where: { driverId: authenticatedDriver.driver.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, fleetId: true, driverId: true },
  });
  if (!intake) {
    throw vaultConflict("Driver intake context is not available");
  }
  return { authenticatedDriver, intake };
}

export async function createAuthenticatedDriverVaultDocument(sessionUser: SessionUserLike | null | undefined, formData: FormData) {
  const context = await getDriverContext(sessionUser);
  const upload = await readUploadFile(formData);
  return writeDriverVaultDocument({
    authenticatedDriver: context.authenticatedDriver,
    intakeId: context.intake.id,
    documentType: upload.documentType,
    fileEntry: upload.fileEntry,
    bytes: upload.bytes,
    mimeType: upload.mimeType,
    checksum: upload.checksum,
  });
}

export async function replaceAuthenticatedDriverVaultDocument(sessionUser: SessionUserLike | null | undefined, documentId: string, formData: FormData) {
  const context = await getDriverContext(sessionUser);
  const document = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      type: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
      updatedAt: true,
    },
  });

  if (!document || document.driverId !== context.authenticatedDriver.driver.id) {
    throw vaultNotFound("Document not found");
  }

  const upload = await readUploadFile(formData);
  if (upload.documentType !== document.type) {
    throw vaultInvalid("documentType must match the existing document");
  }

  await persistFile(document.storageKey, upload.bytes);
  const updated = await prisma.driverDocument.update({
    where: { id: documentId },
    data: {
      originalFileName: sanitizeFileName(upload.fileEntry.name || `${document.type}.bin`),
      mimeType: upload.mimeType,
      checksum: upload.checksum,
      uploadedByUserId: context.authenticatedDriver.userId,
    },
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      type: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
      updatedAt: true,
    },
  });

  await createAuditRecord({
    actorId: context.authenticatedDriver.userId,
    actorEmail: context.authenticatedDriver.email,
    tenantId: context.authenticatedDriver.driver.fleetId,
    action: "UPDATED",
    entityType: "DriverDocument",
    entityId: updated.id,
    details: {
      event: "driver.document.replaced",
      driverId: context.authenticatedDriver.driver.id,
      intakeId: context.intake.id,
      documentType: updated.type,
      storageKey: updated.storageKey,
    },
    metadata: {
      source: "driver-vault-service",
      mimeType: upload.mimeType,
    },
  });

  return toSummary(updated);
}

export async function getAuthenticatedDriverVaultDocument(sessionUser: SessionUserLike | null | undefined, documentId: string) {
  const context = await getDriverContext(sessionUser);
  const document = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      type: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
      updatedAt: true,
    },
  });

  if (!document || document.driverId !== context.authenticatedDriver.driver.id) {
    throw vaultNotFound("Document not found");
  }

  return toSummary(document);
}

export async function resolveAuthenticatedDriverVaultDocumentDownload(sessionUser: SessionUserLike | null | undefined, documentId: string) {
  const context = await getDriverContext(sessionUser);
  const document = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      type: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
      updatedAt: true,
    },
  });

  if (!document || document.driverId !== context.authenticatedDriver.driver.id) {
    throw vaultNotFound("Document not found");
  }

  const fullPath = storagePathForKey(document.storageKey);
  const file = await readFile(fullPath);
  await createAuditRecord({
    actorId: context.authenticatedDriver.userId,
    actorEmail: context.authenticatedDriver.email,
    tenantId: context.authenticatedDriver.driver.fleetId,
    action: "CREATED",
    entityType: "DriverDocument",
    entityId: document.id,
    details: {
      event: "driver.document.retrieved",
      driverId: context.authenticatedDriver.driver.id,
      intakeId: context.intake.id,
      documentType: document.type,
      storageKey: document.storageKey,
    },
    metadata: {
      source: "driver-vault-service",
      mimeType: document.mimeType,
    },
  });

  return {
    document,
    file,
    downloadName: document.originalFileName,
    mimeType: document.mimeType ?? "application/octet-stream",
  };
}
