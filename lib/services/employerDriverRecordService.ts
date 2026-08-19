import { createAuditRecord } from "@/lib/audit";
import { driverVaultDocumentTypeLabel } from "@/lib/driver-vault-document-types";
import { prisma } from "@/lib/prisma";
import { resolveContext } from "@/lib/services/contextResolver";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

function recordError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function requireText(value: string, fieldName: string) {
  const next = String(value ?? "").trim();
  if (!next) {
    throw recordError(`${fieldName} is required`, 422);
  }
  return next;
}

function jsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

async function loadDriverRecord(driverId: string) {
  return prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      fleetId: true,
      fleet: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      driverIntakes: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          fleetId: true,
          status: true,
          createdAt: true,
        },
      },
      claimTokens: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          fleetId: true,
          expiresAt: true,
          createdAt: true,
          claimedAt: true,
          revokedAt: true,
        },
      },
    },
  });
}

async function loadDriverDocuments(driverId: string, fleetId: string) {
  return prisma.driverDocument.findMany({
    where: { driverId },
    orderBy: [{ sourceDocumentId: "asc" }, { versionNumber: "asc" }, { uploadedAt: "asc" }],
    include: {
      documentAuthorizations: {
        where: { fleetId },
        select: {
          id: true,
          sourceDocumentId: true,
          sourceVersionNumber: true,
          driverId: true,
          fleetId: true,
          authorizedByUserId: true,
          authorizedAt: true,
          revokedAt: true,
          revokedByUserId: true,
          createdAt: true,
        },
      },
      employerDocumentMaterializations: {
        where: { fleetId },
        select: {
          id: true,
          authorizationId: true,
          sourceDocumentId: true,
          sourceVersionNumber: true,
          driverId: true,
          fleetId: true,
          materializedByUserId: true,
          materializedAt: true,
          storageMode: true,
          sourceStorageKey: true,
          employerStorageKey: true,
          originalFileName: true,
          mimeType: true,
          checksum: true,
          createdAt: true,
        },
      },
    },
  });
}

async function loadDriverIntakeRecord(driverId: string, fleetId: string) {
  return prisma.driverIntake.findFirst({
    where: {
      driverId,
      fleetId,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      fleetId: true,
      status: true,
      createdAt: true,
    },
  });
}

async function loadQualificationSnapshot(driverId: string, fleetId: string) {
  return prisma.driverQualificationSnapshot.findFirst({
    where: { driverId, fleetId },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      driverIntakeId: true,
      fleetId: true,
      status: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
  });
}

async function loadReadinessScore(driverId: string, fleetId: string) {
  return prisma.driverReadinessScore.findFirst({
    where: { driverId, fleetId },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      driverIntakeId: true,
      fleetId: true,
      status: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
  });
}

async function loadClaimToken(driverId: string, fleetId: string) {
  return prisma.driverClaimToken.findFirst({
    where: { driverId, fleetId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      driverId: true,
      fleetId: true,
      expiresAt: true,
      createdAt: true,
      claimedAt: true,
      revokedAt: true,
      createdByUserId: true,
    },
  });
}

type DriverDocumentRecord = Awaited<ReturnType<typeof loadDriverDocuments>>[number];
type DriverAuthorizationRecord = DriverDocumentRecord["documentAuthorizations"][number];
type EmployerMaterializationRecord = DriverDocumentRecord["employerDocumentMaterializations"][number];

type ReconciliationAuthorization = {
  id: string;
  fleetId: string;
  authorizedAt: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  materializationId: string | null;
  materializedAt: string | null;
};

type ReconciliationMaterialization = {
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

type ReconciliationVersion = {
  id: string;
  versionNumber: number;
  previousVersionId: string | null;
  supersededAt: string | null;
  supersededByDocumentId: string | null;
  originalFileName: string;
  mimeType: string | null;
  checksum: string | null;
  uploadedAt: string;
  authorizations: ReconciliationAuthorization[];
  materializations: ReconciliationMaterialization[];
};

type ReconciliationThread = {
  sourceDocumentId: string;
  documentType: string;
  documentTypeLabel: string;
  currentPersonalVersionId: string;
  currentPersonalVersionNumber: number;
  currentPersonalChecksum: string | null;
  currentPersonalUploadedAt: string;
  versions: ReconciliationVersion[];
  latestAuthorizedVersionNumber: number | null;
  latestMaterializedVersionNumber: number | null;
  currentEmployerMaterialization: ReconciliationMaterialization | null;
  hasCurrentPersonalVersionAuthorization: boolean;
  hasCurrentPersonalVersionMaterialization: boolean;
  hasPersonalVersionAheadOfEmployer: boolean;
};

export type EmployerDriverRecordReconciliation = {
  driver: {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    currentFleetId: string;
    currentFleetName: string;
    currentFleetSlug: string;
  };
  fleet: {
    id: string;
    name: string;
    slug: string;
  };
  operationalRecord: {
    latestIntakeId: string | null;
    latestIntakeStatus: string | null;
    qualificationSnapshot: {
      id: string;
      driverIntakeId: string | null;
      fleetId: string;
      status: string;
      reasonCodes: string[];
      summary: string | null;
      policyVersion: string;
      evaluatedAt: string;
      evaluatedByUserId: string | null;
    } | null;
    readinessScore: {
      id: string;
      driverIntakeId: string | null;
      fleetId: string;
      status: string;
      reasonCodes: string[];
      summary: string | null;
      policyVersion: string;
      evaluatedAt: string;
      evaluatedByUserId: string | null;
    } | null;
    claimToken: {
      id: string;
      fleetId: string;
      expiresAt: string;
      createdAt: string;
      claimedAt: string | null;
      revokedAt: string | null;
      createdByUserId: string;
    } | null;
  };
  threads: ReconciliationThread[];
};

function mapReconciliationMaterialization(
  materialization: EmployerMaterializationRecord,
): ReconciliationMaterialization {
  if (!materialization.sourceDocumentId || materialization.sourceVersionNumber <= 0 || materialization.checksum === undefined) {
    throw recordError("Employer materialization provenance is incomplete", 409);
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
  };
}

function mapReconciliationAuthorization(
  authorization: DriverAuthorizationRecord,
  materializations: EmployerMaterializationRecord[],
): ReconciliationAuthorization {
  if (!authorization.sourceDocumentId || authorization.sourceVersionNumber <= 0) {
    throw recordError("Document authorization provenance is incomplete", 409);
  }

  const materialization = materializations.find((item) => item.authorizationId === authorization.id) ?? null;
  return {
    id: authorization.id,
    fleetId: authorization.fleetId,
    authorizedAt: authorization.authorizedAt.toISOString(),
    revokedAt: authorization.revokedAt ? authorization.revokedAt.toISOString() : null,
    revokedByUserId: authorization.revokedByUserId,
    materializationId: materialization?.id ?? null,
    materializedAt: materialization ? materialization.materializedAt.toISOString() : null,
  };
}

function buildThreads(documents: DriverDocumentRecord[]) {
  const bySourceDocument = new Map<string, DriverDocumentRecord[]>();
  for (const document of documents) {
    const list = bySourceDocument.get(document.sourceDocumentId) ?? [];
    list.push(document);
    bySourceDocument.set(document.sourceDocumentId, list);
  }

  return [...bySourceDocument.entries()]
    .map(([sourceDocumentId, versions]) => {
      const orderedVersions = [...versions].sort((left, right) => left.versionNumber - right.versionNumber);
      const currentVersion =
        orderedVersions.find((version) => version.supersededAt === null) ??
        orderedVersions[orderedVersions.length - 1] ??
        null;

      if (!currentVersion) {
        throw recordError("Document version chain is empty", 409);
      }

      const threadMaterializations = orderedVersions.flatMap((version) => version.employerDocumentMaterializations);
      const currentEmployerMaterialization = threadMaterializations
        .slice()
        .sort((left, right) => new Date(right.materializedAt).getTime() - new Date(left.materializedAt).getTime())[0] ?? null;

      const latestAuthorizedVersionNumber = orderedVersions.reduce((latest, version) => {
        const hasActiveAuthorization = version.documentAuthorizations.some((authorization) => !authorization.revokedAt);
        return hasActiveAuthorization ? Math.max(latest, version.versionNumber) : latest;
      }, 0);

      const latestMaterializedVersionNumber = threadMaterializations.reduce((latest, materialization) => {
        return Math.max(latest, materialization.sourceVersionNumber);
      }, 0);

      const versionsPayload: ReconciliationVersion[] = orderedVersions.map((version) => {
        const versionMaterializations = [...version.employerDocumentMaterializations]
          .map(mapReconciliationMaterialization)
          .sort((left, right) => new Date(right.materializedAt).getTime() - new Date(left.materializedAt).getTime());

        return {
          id: version.id,
          versionNumber: version.versionNumber,
          previousVersionId: version.previousVersionId,
          supersededAt: version.supersededAt ? version.supersededAt.toISOString() : null,
          supersededByDocumentId: version.supersededByDocumentId,
          originalFileName: version.originalFileName,
          mimeType: version.mimeType,
          checksum: version.checksum,
          uploadedAt: version.uploadedAt.toISOString(),
          authorizations: version.documentAuthorizations
            .map((authorization) => mapReconciliationAuthorization(authorization, version.employerDocumentMaterializations))
            .sort((left, right) => new Date(right.authorizedAt).getTime() - new Date(left.authorizedAt).getTime()),
          materializations: versionMaterializations,
        };
      });

      return {
        sourceDocumentId,
        documentType: currentVersion.type,
        documentTypeLabel: driverVaultDocumentTypeLabel(currentVersion.type),
        currentPersonalVersionId: currentVersion.id,
        currentPersonalVersionNumber: currentVersion.versionNumber,
        currentPersonalChecksum: currentVersion.checksum,
        currentPersonalUploadedAt: currentVersion.uploadedAt.toISOString(),
        versions: versionsPayload,
        latestAuthorizedVersionNumber: latestAuthorizedVersionNumber > 0 ? latestAuthorizedVersionNumber : null,
        latestMaterializedVersionNumber: latestMaterializedVersionNumber > 0 ? latestMaterializedVersionNumber : null,
        currentEmployerMaterialization: currentEmployerMaterialization ? mapReconciliationMaterialization(currentEmployerMaterialization) : null,
        hasCurrentPersonalVersionAuthorization: currentVersion.documentAuthorizations.some((authorization) => !authorization.revokedAt),
        hasCurrentPersonalVersionMaterialization: currentVersion.employerDocumentMaterializations.length > 0,
        hasPersonalVersionAheadOfEmployer:
          latestMaterializedVersionNumber > 0 && currentVersion.versionNumber > latestMaterializedVersionNumber,
      } satisfies ReconciliationThread;
    })
    .sort((left, right) => left.documentTypeLabel.localeCompare(right.documentTypeLabel) || left.currentPersonalVersionNumber - right.currentPersonalVersionNumber);
}

export async function reconcileEmployerDriverRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  driverId: string;
  fleetId: string;
}) {
  const driverId = requireText(input.driverId, "driverId");
  const fleetId = requireText(input.fleetId, "fleetId");

  if (!input.sessionUser?.id) {
    throw recordError("Unauthorized", 401);
  }

  const resolvedContext = await resolveContext(input.sessionUser);
  const authenticatedDriver = await getAuthenticatedDriver(input.sessionUser);
  if (authenticatedDriver.status === "LINKED" && authenticatedDriver.driver.id !== driverId) {
    throw recordError("Driver not found", 404);
  }

  const selfView = authenticatedDriver.status === "LINKED" && authenticatedDriver.driver.id === driverId;

  if (!selfView) {
    const fleetAccess = await authorizedFleetAccess(input.sessionUser, fleetId);
    if (!fleetAccess.allowed) {
      throw recordError("Forbidden", 403);
    }
  }

  const [driver, fleet, documents, intake, qualificationSnapshot, readinessScore, claimToken] = await Promise.all([
    loadDriverRecord(driverId),
    prisma.fleet.findUnique({
      where: { id: fleetId },
      select: { id: true, name: true, slug: true },
    }),
    loadDriverDocuments(driverId, fleetId),
    loadDriverIntakeRecord(driverId, fleetId),
    loadQualificationSnapshot(driverId, fleetId),
    loadReadinessScore(driverId, fleetId),
    loadClaimToken(driverId, fleetId),
  ]);

  if (!driver) {
    throw recordError("Driver not found", 404);
  }

  if (!fleet) {
    throw recordError("Fleet not found", 404);
  }

  const operationalRecord = {
    latestIntakeId: intake?.id ?? null,
    latestIntakeStatus: intake?.status ?? null,
    qualificationSnapshot: qualificationSnapshot
      ? {
          id: qualificationSnapshot.id,
          driverIntakeId: qualificationSnapshot.driverIntakeId,
          fleetId: qualificationSnapshot.fleetId,
          status: qualificationSnapshot.status,
          reasonCodes: jsonStringArray(qualificationSnapshot.reasonCodes),
          summary: qualificationSnapshot.summary,
          policyVersion: qualificationSnapshot.policyVersion,
          evaluatedAt: qualificationSnapshot.evaluatedAt.toISOString(),
          evaluatedByUserId: qualificationSnapshot.evaluatedByUserId,
        }
      : null,
    readinessScore: readinessScore
      ? {
          id: readinessScore.id,
          driverIntakeId: readinessScore.driverIntakeId,
          fleetId: readinessScore.fleetId,
          status: readinessScore.status,
          reasonCodes: jsonStringArray(readinessScore.reasonCodes),
          summary: readinessScore.summary,
          policyVersion: readinessScore.policyVersion,
          evaluatedAt: readinessScore.evaluatedAt.toISOString(),
          evaluatedByUserId: readinessScore.evaluatedByUserId,
        }
      : null,
    claimToken: claimToken
      ? {
          id: claimToken.id,
          fleetId: claimToken.fleetId,
          expiresAt: claimToken.expiresAt.toISOString(),
          createdAt: claimToken.createdAt.toISOString(),
          claimedAt: claimToken.claimedAt ? claimToken.claimedAt.toISOString() : null,
          revokedAt: claimToken.revokedAt ? claimToken.revokedAt.toISOString() : null,
          createdByUserId: claimToken.createdByUserId,
        }
      : null,
  };

  const threads = buildThreads(documents);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: fleetId,
    action: "VIEWED",
    entityType: "EmployerDriverRecordReconciliation",
    entityId: `${driverId}:${fleetId}`,
    details: {
      event: "employer.record.reconciled",
      driverId,
      fleetId,
      threadCount: threads.length,
      currentMaterializationCount: threads.filter((thread) => thread.currentEmployerMaterialization).length,
      authentication: resolvedContext.authentication,
      personalContext: resolvedContext.personal,
      employmentContexts: resolvedContext.employmentContexts,
    },
    metadata: { source: "employer-driver-record-service" },
  });

  return {
    driver: {
      id: driver.id,
      userId: driver.userId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      currentFleetId: driver.fleetId,
      currentFleetName: driver.fleet?.name ?? "",
      currentFleetSlug: driver.fleet?.slug ?? "",
    },
    fleet,
    operationalRecord,
    threads,
  } satisfies EmployerDriverRecordReconciliation;
}
