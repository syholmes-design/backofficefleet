import { copyFile, mkdir, rm } from "fs/promises";
import { dirname, join, resolve } from "path";

import { Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { driverVaultDocumentTypeLabel } from "@/lib/driver-vault-document-types";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import {
  getExactAuthenticatedDriverVaultDocumentVersion,
} from "@/lib/services/driverDocumentVersioningService";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";

const EMPLOYER_DOCUMENT_ROOT = resolve(process.cwd(), "storage", "employer-driver-documents");

export type DriverDocumentAuthorizationSummary = {
  id: string;
  driverId: string;
  fleetId: string;
  sourceDocumentId: string;
  sourceVersionNumber: number;
  authorizedByUserId: string;
  authorizedAt: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  materializedAt: string | null;
  currentDocument: {
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
};

export type EmployerDocumentMaterializationSummary = {
  id: string;
  authorizationId: string;
  driverId: string;
  fleetId: string;
  sourceDocumentId: string;
  sourceVersionNumber: number;
  sourceChecksum: string | null;
  originalFileName: string;
  mimeType: string | null;
  materializedAt: string;
  materializedByUserId: string;
  storageMode: "COPY" | "REFERENCE";
  employerDocumentUrl: string;
};

export type DriverDocumentAuthorizationStatus = {
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    fleetId: string;
    fleetName: string | null;
  };
  documents: Array<DriverDocumentAuthorizationSummary["currentDocument"] & {
    sourceDocumentId: string;
    versionNumber: number;
    authorizations: Array<{
      id: string;
      fleetId: string;
      authorizedAt: string;
      revokedAt: string | null;
      materializedAt: string | null;
    }>;
  }>;
};

function authError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function employerStoragePath(storageKey: string) {
  return join(EMPLOYER_DOCUMENT_ROOT, storageKey);
}

async function persistEmployerCopy(storageKey: string, sourceStorageKey: string) {
  const fullPath = employerStoragePath(storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await copyFile(join(resolve(process.cwd(), "storage", "driver-vault"), sourceStorageKey), fullPath);
  return fullPath;
}

async function removeEmployerCopy(storageKey: string) {
  await rm(employerStoragePath(storageKey), { force: true });
}

function toEmployerMaterializationSummary(materialization: {
  id: string;
  authorizationId: string;
  sourceDocumentId: string;
  sourceVersionNumber: number;
  driverId: string;
  fleetId: string;
  materializedByUserId: string;
  materializedAt: Date;
  storageMode: "COPY" | "REFERENCE";
  sourceStorageKey: string;
  employerStorageKey: string | null;
  originalFileName: string;
  mimeType: string | null;
  checksum: string | null;
}) {
  return {
    id: materialization.id,
    authorizationId: materialization.authorizationId,
    driverId: materialization.driverId,
    fleetId: materialization.fleetId,
    sourceDocumentId: materialization.sourceDocumentId,
    sourceVersionNumber: materialization.sourceVersionNumber,
    sourceChecksum: materialization.checksum,
    originalFileName: materialization.originalFileName,
    mimeType: materialization.mimeType,
    materializedAt: materialization.materializedAt.toISOString(),
    materializedByUserId: materialization.materializedByUserId,
    storageMode: materialization.storageMode,
    employerDocumentUrl: `/api/employer/driver-documents/${materialization.id}`,
  } satisfies EmployerDocumentMaterializationSummary;
}

async function requireLinkedDriver(sessionUser: SessionUserLike | null | undefined) {
  const authenticatedDriver = await getAuthenticatedDriver(sessionUser);
  if (authenticatedDriver.status === "UNAUTHENTICATED") {
    throw authError("Unauthorized", 401);
  }
  if (authenticatedDriver.status === "UNLINKED") {
    throw authError("Driver identity is not linked", 409);
  }
  return authenticatedDriver;
}

export async function listAuthorizableDriverDocuments(sessionUser: SessionUserLike | null | undefined) {
  const authenticatedDriver = await requireLinkedDriver(sessionUser);
  const documents = await prisma.driverDocument.findMany({
    where: {
      driverId: authenticatedDriver.driver.id,
      supersededAt: null,
    },
    orderBy: [{ type: "asc" }, { uploadedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      sourceDocumentId: true,
      versionNumber: true,
      type: true,
      status: true,
      originalFileName: true,
      uploadedAt: true,
      verifiedAt: true,
      verificationExpiresAt: true,
      nextVerificationDueAt: true,
    },
  });
  const authorizations = await prisma.documentAuthorization.findMany({
    where: { driverId: authenticatedDriver.driver.id },
    select: {
      id: true,
      driverId: true,
      fleetId: true,
      sourceDocumentId: true,
      sourceVersionNumber: true,
      authorizedByUserId: true,
      authorizedAt: true,
      revokedAt: true,
      revokedByUserId: true,
      createdAt: true,
      materializations: {
        select: { id: true, materializedAt: true },
        orderBy: { materializedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ authorizedAt: "desc" }, { id: "desc" }],
  });

  const authorizationMap = new Map<string, Array<{
    id: string;
    fleetId: string;
    authorizedAt: string;
    revokedAt: string | null;
    materializedAt: string | null;
  }>>();

  for (const authorization of authorizations) {
    const key = `${authorization.sourceDocumentId}:${authorization.sourceVersionNumber}`;
    const list = authorizationMap.get(key) ?? [];
    list.push({
      id: authorization.id,
      fleetId: authorization.fleetId,
      authorizedAt: authorization.authorizedAt.toISOString(),
      revokedAt: authorization.revokedAt ? authorization.revokedAt.toISOString() : null,
      materializedAt: authorization.materializations[0]?.materializedAt
        ? authorization.materializations[0].materializedAt.toISOString()
        : null,
    });
    authorizationMap.set(key, list);
  }

  return {
    driver: {
      id: authenticatedDriver.driver.id,
      firstName: authenticatedDriver.driver.firstName,
      lastName: authenticatedDriver.driver.lastName,
      fleetId: authenticatedDriver.driver.fleetId,
      fleetName: authenticatedDriver.driver.fleet?.name ?? null,
    },
    documents: documents.map((document) => ({
      id: document.id,
      sourceDocumentId: document.sourceDocumentId,
      versionNumber: document.versionNumber,
      type: document.type,
      typeLabel: driverVaultDocumentTypeLabel(document.type),
      status: document.status,
      originalFileName: document.originalFileName,
      uploadedAt: document.uploadedAt.toISOString(),
      verifiedAt: document.verifiedAt ? document.verifiedAt.toISOString() : null,
      verificationExpiresAt: document.verificationExpiresAt ? document.verificationExpiresAt.toISOString() : null,
      nextVerificationDueAt: document.nextVerificationDueAt ? document.nextVerificationDueAt.toISOString() : null,
      downloadUrl: `/api/driver/vault/documents/${document.id}/download`,
      authorizations: authorizationMap.get(`${document.sourceDocumentId}:${document.versionNumber}`) ?? [],
    })),
  };
}

export async function getDriverDocumentAuthorizationStatus(sessionUser: SessionUserLike | null | undefined) {
  return listAuthorizableDriverDocuments(sessionUser);
}

export async function authorizeDriverDocument(input: {
  sessionUser: SessionUserLike | null | undefined;
  documentId: string;
  fleetId: string;
}) {
  const authenticatedDriver = await requireLinkedDriver(input.sessionUser);
  const fleetAccess = await authorizedFleetAccess(input.sessionUser, input.fleetId);
  if (!fleetAccess.allowed) {
    throw authError("Forbidden", 403);
  }

  const exactDocument = await getExactAuthenticatedDriverVaultDocumentVersion(input.sessionUser, input.documentId);
  if (exactDocument.driverId !== authenticatedDriver.driver.id) {
    throw authError("Document not found", 404);
  }

  const existingActive = await prisma.documentAuthorization.findFirst({
    where: {
      sourceDocumentId: exactDocument.sourceDocumentId,
      sourceVersionNumber: exactDocument.versionNumber,
      fleetId: input.fleetId,
      revokedAt: null,
    },
    select: { id: true },
  });
  if (existingActive) {
    const authorization = await prisma.documentAuthorization.findUnique({
      where: { id: existingActive.id },
      select: {
        id: true,
        driverId: true,
        fleetId: true,
        sourceDocumentId: true,
        sourceVersionNumber: true,
        authorizedByUserId: true,
        authorizedAt: true,
        revokedAt: true,
        revokedByUserId: true,
        createdAt: true,
      },
    });
    if (!authorization) {
      throw authError("Authorization not found", 404);
    }
    return authorization;
  }

  try {
    const authorization = await prisma.documentAuthorization.create({
      data: {
        sourceDocumentId: exactDocument.sourceDocumentId,
        sourceVersionNumber: exactDocument.versionNumber,
        driverId: authenticatedDriver.driver.id,
        fleetId: input.fleetId,
        authorizedByUserId: authenticatedDriver.userId,
      },
      select: {
        id: true,
        driverId: true,
        fleetId: true,
        sourceDocumentId: true,
        sourceVersionNumber: true,
        authorizedByUserId: true,
        authorizedAt: true,
        revokedAt: true,
        revokedByUserId: true,
        createdAt: true,
      },
    });

    await createAuditRecord({
      actorId: authenticatedDriver.userId,
      actorEmail: authenticatedDriver.email,
      tenantId: input.fleetId,
      action: "CREATED",
      entityType: "DocumentAuthorization",
      entityId: authorization.id,
      details: {
        event: "driver.document.authorized",
        driverId: authenticatedDriver.driver.id,
        fleetId: input.fleetId,
        sourceDocumentId: exactDocument.sourceDocumentId,
        sourceVersionNumber: exactDocument.versionNumber,
      },
      metadata: { source: "driver-document-authorization-service" },
    });

    return authorization;
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      const authorization = await prisma.documentAuthorization.findFirst({
        where: {
          sourceDocumentId: exactDocument.sourceDocumentId,
          sourceVersionNumber: exactDocument.versionNumber,
          fleetId: input.fleetId,
          revokedAt: null,
        },
        select: {
          id: true,
          driverId: true,
          fleetId: true,
          sourceDocumentId: true,
          sourceVersionNumber: true,
          authorizedByUserId: true,
          authorizedAt: true,
          revokedAt: true,
          revokedByUserId: true,
          createdAt: true,
        },
      });
      if (authorization) {
        return authorization;
      }
      throw authError("Authorization conflict", 409);
    }

    throw error;
  }
}

export async function revokeDriverDocumentAuthorization(input: {
  sessionUser: SessionUserLike | null | undefined;
  authorizationId: string;
}) {
  const authenticatedDriver = await requireLinkedDriver(input.sessionUser);
  const authorization = await prisma.documentAuthorization.findUnique({
    where: { id: input.authorizationId },
    select: {
      id: true,
      driverId: true,
      fleetId: true,
      sourceDocumentId: true,
      sourceVersionNumber: true,
      authorizedByUserId: true,
      authorizedAt: true,
      revokedAt: true,
      revokedByUserId: true,
      createdAt: true,
    },
  });

  if (!authorization || authorization.driverId !== authenticatedDriver.driver.id) {
    throw authError("Authorization not found", 404);
  }

  if (authorization.revokedAt) {
    return authorization;
  }

  const revoked = await prisma.documentAuthorization.update({
    where: { id: input.authorizationId },
    data: {
      revokedAt: new Date(),
      revokedByUserId: authenticatedDriver.userId,
    },
    select: {
      id: true,
      driverId: true,
      fleetId: true,
      sourceDocumentId: true,
      sourceVersionNumber: true,
      authorizedByUserId: true,
      authorizedAt: true,
      revokedAt: true,
      revokedByUserId: true,
      createdAt: true,
    },
  });

  await createAuditRecord({
    actorId: authenticatedDriver.userId,
    actorEmail: authenticatedDriver.email,
    tenantId: authorization.fleetId,
    action: "UPDATED",
    entityType: "DocumentAuthorization",
    entityId: revoked.id,
    details: {
      event: "driver.document.authorization.revoked",
      driverId: authenticatedDriver.driver.id,
      fleetId: authorization.fleetId,
      sourceDocumentId: authorization.sourceDocumentId,
      sourceVersionNumber: authorization.sourceVersionNumber,
    },
    metadata: { source: "driver-document-authorization-service" },
  });

  return revoked;
}

export async function materializeEmployerDocument(input: {
  sessionUser: SessionUserLike | null | undefined;
  authorizationId: string;
}) {
  const authorization = await prisma.documentAuthorization.findUnique({
    where: { id: input.authorizationId },
    include: {
      sourceDocument: true,
      driver: { include: { fleet: { select: { id: true, name: true, slug: true } } } },
      materializations: true,
    },
  });

  if (!authorization) {
    throw authError("Authorization not found", 404);
  }

  const fleetAccess = await authorizedFleetAccess(input.sessionUser, authorization.fleetId);
  if (!fleetAccess.allowed) {
    throw authError("Forbidden", 403);
  }

  if (authorization.revokedAt) {
    throw authError("Authorization revoked", 409);
  }

  const existingMaterialization = await prisma.employerDocumentMaterialization.findUnique({
    where: { authorizationId: input.authorizationId },
  });
  if (existingMaterialization) {
    return toEmployerMaterializationSummary(existingMaterialization);
  }

  const materializedBy = await getAuthenticatedDriver(input.sessionUser);
  const materializingUserId = materializedBy.status === "LINKED" ? materializedBy.userId : input.sessionUser?.id ?? null;
  const sourceStorageKey = authorization.sourceDocument.storageKey;
  const employerStorageKey = join(
    "employer-driver-documents",
    authorization.fleetId,
    authorization.driverId,
    authorization.sourceDocumentId,
    `v${authorization.sourceVersionNumber}-${sanitizeFileName(authorization.sourceDocument.originalFileName)}`,
  );

  await persistEmployerCopy(employerStorageKey, sourceStorageKey);

  try {
    const materialization = await prisma.$transaction(
      async (tx) => {
        const created = await tx.employerDocumentMaterialization.create({
          data: {
            authorizationId: authorization.id,
            sourceDocumentId: authorization.sourceDocumentId,
            sourceVersionNumber: authorization.sourceVersionNumber,
            driverId: authorization.driverId,
            fleetId: authorization.fleetId,
            materializedByUserId: materializingUserId ?? authorization.authorizedByUserId,
            storageMode: "COPY",
            sourceStorageKey,
            employerStorageKey,
            originalFileName: authorization.sourceDocument.originalFileName,
            mimeType: authorization.sourceDocument.mimeType,
            checksum: authorization.sourceDocument.checksum,
            standardizedEntityType: null,
            standardizedEntityId: null,
          },
        });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await createAuditRecord({
      actorId: materializingUserId,
      actorEmail: null,
      tenantId: authorization.fleetId,
      action: "CREATED",
      entityType: "EmployerDocumentMaterialization",
      entityId: materialization.id,
      details: {
        event: "driver.document.materialized",
        driverId: authorization.driverId,
        fleetId: authorization.fleetId,
        authorizationId: authorization.id,
        sourceDocumentId: authorization.sourceDocumentId,
        sourceVersionNumber: authorization.sourceVersionNumber,
        sourceChecksum: authorization.sourceDocument.checksum,
      },
      metadata: { source: "driver-document-authorization-service", storageMode: "COPY" },
    });

    return toEmployerMaterializationSummary(materialization);
  } catch (error) {
    await removeEmployerCopy(employerStorageKey);
    if (isKnownPrismaError(error, "P2002")) {
      const existing = await prisma.employerDocumentMaterialization.findUnique({
        where: { authorizationId: authorization.id },
      });
      if (existing) {
        return toEmployerMaterializationSummary(existing);
      }
    }

    await createAuditRecord({
      actorId: materializingUserId,
      actorEmail: null,
      tenantId: authorization.fleetId,
      action: "ACCESS_DENIED",
      entityType: "EmployerDocumentMaterialization",
      entityId: authorization.id,
      details: {
        event: "driver.document.materialization.failed",
        driverId: authorization.driverId,
        fleetId: authorization.fleetId,
        authorizationId: authorization.id,
        sourceDocumentId: authorization.sourceDocumentId,
        sourceVersionNumber: authorization.sourceVersionNumber,
      },
      metadata: { source: "driver-document-authorization-service" },
    });

    throw error;
  }
}

export async function getEmployerDocumentMaterialization(
  input: {
    sessionUser: SessionUserLike | null | undefined;
    materializationId: string;
  },
) {
  const materialization = await prisma.employerDocumentMaterialization.findUnique({
    where: { id: input.materializationId },
    include: { authorization: true },
  });

  if (!materialization) {
    throw authError("Document not found", 404);
  }

  const fleetAccess = await authorizedFleetAccess(input.sessionUser, materialization.fleetId);
  if (!fleetAccess.allowed) {
    throw authError("Forbidden", 403);
  }

  return {
    id: materialization.id,
    authorizationId: materialization.authorizationId,
    driverId: materialization.driverId,
    fleetId: materialization.fleetId,
    sourceDocumentId: materialization.sourceDocumentId,
    sourceVersionNumber: materialization.sourceVersionNumber,
    sourceChecksum: materialization.checksum,
    originalFileName: materialization.originalFileName,
    mimeType: materialization.mimeType,
    materializedAt: materialization.materializedAt.toISOString(),
    materializedByUserId: materialization.materializedByUserId,
    storageMode: materialization.storageMode,
    employerDocumentUrl: `/api/employer/driver-documents/${materialization.id}`,
  } satisfies EmployerDocumentMaterializationSummary;
}
