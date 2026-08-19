import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";

import { Prisma } from "@prisma/client";

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

type DriverVaultDocumentRecord = {
  id: string;
  sourceDocumentId: string;
  versionNumber: number;
  previousVersionId: string | null;
  supersededAt: Date | null;
  supersededByDocumentId: string | null;
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  type: string;
  status: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string | null;
  checksum: string | null;
  uploadedByUserId: string;
  uploadedAt: Date;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  verifiedFromSourceAt: Date | null;
  certifiedAt: Date | null;
  certifiedByUserId: string | null;
  verificationExpiresAt: Date | null;
  nextVerificationDueAt: Date | null;
  verificationQuality: string | null;
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

export type DriverVaultStatusResult = {
  state: "LINKED";
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    fleetId: string;
    fleetName: string | null;
  };
  intakeId: string;
  documents: DriverVaultDocumentSummary[];
  missingDocumentTypes: Array<{ type: string; label: string }>;
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

function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function sanitizeFileName(value: string) {
  const next = basename(value || "document");
  return next.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
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

function toSummary(document: DriverVaultDocumentRecord): DriverVaultDocumentSummary {
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

function selectDriverVaultDocument() {
  return {
    id: true,
    sourceDocumentId: true,
    versionNumber: true,
    previousVersionId: true,
    supersededAt: true,
    supersededByDocumentId: true,
    driverId: true,
    driverIntakeId: true,
    fleetId: true,
    type: true,
    status: true,
    storageKey: true,
    originalFileName: true,
    mimeType: true,
    checksum: true,
    uploadedByUserId: true,
    uploadedAt: true,
    verifiedByUserId: true,
    verifiedAt: true,
    verifiedFromSourceAt: true,
    certifiedAt: true,
    certifiedByUserId: true,
    verificationExpiresAt: true,
    nextVerificationDueAt: true,
    verificationQuality: true,
    updatedAt: true,
  } as const;
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

async function createVersionRecord(input: {
  authenticatedDriver: Awaited<ReturnType<typeof requireDriverVaultContext>>["authenticatedDriver"];
  intakeId: string;
  documentType: string;
  fileEntry: File;
  bytes: Uint8Array;
  mimeType: string;
  checksum: string;
  sourceDocumentId?: string;
  previousVersionId?: string | null;
  supersedeDocumentId?: string | null;
}) {
  const baseDocumentId = randomUUID();
  const storageKey = storageKeyForDocument(
    input.authenticatedDriver.driver.id,
    baseDocumentId,
    input.fileEntry.name || `${input.documentType.toLowerCase()}.bin`,
  );

  await persistFile(storageKey, input.bytes);

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const sourceDocumentId = input.sourceDocumentId ?? baseDocumentId;
        const currentLatest = input.previousVersionId
          ? await tx.driverDocument.findUnique({
              where: { id: input.previousVersionId },
              select: selectDriverVaultDocument(),
            })
          : null;

        const nextVersionNumber = input.previousVersionId
          ? ((currentLatest?.versionNumber ?? 0) + 1)
          : 1;

        const document = await tx.driverDocument.create({
          data: {
            id: baseDocumentId,
            sourceDocumentId,
            versionNumber: nextVersionNumber,
            previousVersionId: input.previousVersionId ?? null,
            supersededAt: null,
            supersededByDocumentId: null,
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
          select: selectDriverVaultDocument(),
        });

        if (input.supersedeDocumentId) {
          const superseded = await tx.driverDocument.updateMany({
            where: {
              id: input.supersedeDocumentId,
              supersededAt: null,
            },
            data: {
              supersededAt: new Date(),
              supersededByDocumentId: baseDocumentId,
            },
          });

          if (superseded.count !== 1) {
            throw vaultConflict("Document version conflict");
          }
        }

        return document;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await createAuditRecord({
      actorId: input.authenticatedDriver.userId,
      actorEmail: input.authenticatedDriver.email,
      tenantId: input.authenticatedDriver.driver.fleetId,
      action: input.previousVersionId ? "UPDATED" : "CREATED",
      entityType: "DriverDocument",
      entityId: created.id,
      details: {
        event: input.previousVersionId ? "driver.document.replaced" : "driver.document.uploaded",
        driverId: input.authenticatedDriver.driver.id,
        intakeId: input.intakeId,
        documentId: created.id,
        sourceDocumentId: created.sourceDocumentId,
        versionNumber: created.versionNumber,
        previousVersionId: created.previousVersionId,
        documentType: input.documentType,
        storageKey,
      },
      metadata: {
        source: "driver-document-versioning-service",
        mimeType: input.mimeType,
      },
    });

    return toSummary(created);
  } catch (error) {
    await removeFile(storageKey);
    if (isKnownPrismaError(error, "P2002") || isKnownPrismaError(error, "P2034")) {
      throw vaultConflict("Document version conflict");
    }
    throw error;
  }
}

async function getExactDriverDocument(sessionUser: SessionUserLike | null | undefined, documentId: string) {
  const context = await requireDriverVaultContext(sessionUser);
  const document = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    select: selectDriverVaultDocument(),
  });

  if (!document || document.driverId !== context.authenticatedDriver.driver.id) {
    throw vaultNotFound("Document not found");
  }

  return document;
}

async function getCurrentVersionForThread(sessionUser: SessionUserLike | null | undefined, documentId: string) {
  const exactDocument = await getExactDriverDocument(sessionUser, documentId);
  const current = await prisma.driverDocument.findFirst({
    where: {
      sourceDocumentId: exactDocument.sourceDocumentId,
      supersededAt: null,
    },
    orderBy: [{ versionNumber: "desc" }, { uploadedAt: "desc" }, { id: "desc" }],
    select: selectDriverVaultDocument(),
  });

  if (!current) {
    throw vaultNotFound("Document not found");
  }

  return current;
}

export async function getExactAuthenticatedDriverVaultDocumentVersion(
  sessionUser: SessionUserLike | null | undefined,
  documentId: string,
) {
  return getExactDriverDocument(sessionUser, documentId);
}

export async function getAuthenticatedDriverVaultDocument(
  sessionUser: SessionUserLike | null | undefined,
  documentId: string,
) {
  const document = await getCurrentVersionForThread(sessionUser, documentId);
  return toSummary(document);
}

export async function resolveAuthenticatedDriverVaultDocumentDownload(
  sessionUser: SessionUserLike | null | undefined,
  documentId: string,
) {
  const context = await requireDriverVaultContext(sessionUser);
  const exactDocument = await prisma.driverDocument.findUnique({
    where: { id: documentId },
    select: selectDriverVaultDocument(),
  });

  if (!exactDocument || exactDocument.driverId !== context.authenticatedDriver.driver.id) {
    throw vaultNotFound("Document not found");
  }

  const current = await prisma.driverDocument.findFirst({
    where: {
      sourceDocumentId: exactDocument.sourceDocumentId,
      supersededAt: null,
    },
    orderBy: [{ versionNumber: "desc" }, { uploadedAt: "desc" }, { id: "desc" }],
    select: selectDriverVaultDocument(),
  });

  if (!current) {
    throw vaultNotFound("Document not found");
  }

  const file = await readFile(storagePathForKey(current.storageKey));
  await createAuditRecord({
    actorId: context.authenticatedDriver.userId,
    actorEmail: context.authenticatedDriver.email,
    tenantId: context.authenticatedDriver.driver.fleetId,
    action: "CREATED",
    entityType: "DriverDocument",
    entityId: current.id,
    details: {
      event: "driver.document.retrieved",
      driverId: context.authenticatedDriver.driver.id,
      intakeId: context.intake.id,
      documentId: current.id,
      sourceDocumentId: current.sourceDocumentId,
      versionNumber: current.versionNumber,
      documentType: current.type,
      storageKey: current.storageKey,
    },
    metadata: {
      source: "driver-document-versioning-service",
      mimeType: current.mimeType,
    },
  });

  return {
    document: current,
    file,
    downloadName: current.originalFileName,
    mimeType: current.mimeType ?? "application/octet-stream",
  };
}

export async function listCurrentAuthenticatedDriverVaultDocuments(
  sessionUser: SessionUserLike | null | undefined,
) {
  const context = await requireDriverVaultContext(sessionUser);
  const documents = await prisma.driverDocument.findMany({
    where: {
      driverId: context.authenticatedDriver.driver.id,
      supersededAt: null,
    },
    orderBy: [{ type: "asc" }, { uploadedAt: "desc" }, { id: "desc" }],
    select: selectDriverVaultDocument(),
  });

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
    missingDocumentTypes: DRIVER_VAULT_DOCUMENT_TYPES.filter(
      (item) => !documents.some((document) => document.type === item.value),
    ).map((item) => ({
      type: item.value,
      label: item.label,
    })),
  } satisfies DriverVaultStatusResult;
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

  return listCurrentAuthenticatedDriverVaultDocuments(sessionUser);
}

export async function createAuthenticatedDriverVaultDocument(
  sessionUser: SessionUserLike | null | undefined,
  formData: FormData,
) {
  const context = await requireDriverVaultContext(sessionUser);
  const upload = await readUploadFile(formData);
  return createVersionRecord({
    authenticatedDriver: context.authenticatedDriver,
    intakeId: context.intake.id,
    documentType: upload.documentType,
    fileEntry: upload.fileEntry,
    bytes: upload.bytes,
    mimeType: upload.mimeType,
    checksum: upload.checksum,
  });
}

export async function replaceAuthenticatedDriverVaultDocument(
  sessionUser: SessionUserLike | null | undefined,
  documentId: string,
  formData: FormData,
) {
  const context = await requireDriverVaultContext(sessionUser);
  const anchor = await getExactDriverDocument(sessionUser, documentId);
  const upload = await readUploadFile(formData);

  if (upload.documentType !== anchor.type) {
    throw vaultInvalid("documentType must match the existing document");
  }

  const current = await prisma.driverDocument.findFirst({
    where: {
      sourceDocumentId: anchor.sourceDocumentId,
      supersededAt: null,
    },
    orderBy: [{ versionNumber: "desc" }, { uploadedAt: "desc" }, { id: "desc" }],
    select: selectDriverVaultDocument(),
  });

  if (!current) {
    throw vaultNotFound("Document not found");
  }

  return createVersionRecord({
    authenticatedDriver: context.authenticatedDriver,
    intakeId: current.driverIntakeId,
    documentType: current.type,
    fileEntry: upload.fileEntry,
    bytes: upload.bytes,
    mimeType: upload.mimeType,
    checksum: upload.checksum,
    sourceDocumentId: current.sourceDocumentId,
    previousVersionId: current.id,
    supersedeDocumentId: current.id,
  });
}
