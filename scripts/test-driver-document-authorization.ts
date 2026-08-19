import assert from "assert/strict";
import { rm } from "fs/promises";
import { resolve } from "path";

import { PrismaClient } from "@prisma/client";

import { prisma as sharedPrisma } from "../lib/prisma";
import {
  authorizeDriverDocument,
  getDriverDocumentAuthorizationStatus,
  getEmployerDocumentMaterialization,
  materializeEmployerDocument,
  revokeDriverDocumentAuthorization,
} from "../lib/services/driverDocumentAuthorizationService";
import {
  createAuthenticatedDriverVaultDocument,
  getAuthenticatedDriverVaultDocument,
  getExactAuthenticatedDriverVaultDocumentVersion,
  replaceAuthenticatedDriverVaultDocument,
  resolveAuthenticatedDriverVaultDocumentDownload,
} from "../lib/services/driverDocumentVersioningService";

const STORAGE_ROOT = resolve(process.cwd(), "storage");

function makeFormData(documentType: string, fileName: string, label: string) {
  const formData = new FormData();
  formData.set("documentType", documentType);
  formData.set("file", new File([`auth-${label}-${Date.now()}`], fileName, { type: "application/pdf" }));
  return formData;
}

function statusOf(error: unknown) {
  if (error && typeof error === "object" && "statusCode" in error) {
    return Number((error as { statusCode?: number }).statusCode) || 500;
  }
  return 500;
}

async function countSnapshot(prisma: PrismaClient) {
  return {
    Driver: await prisma.driver.count(),
    DriverDocument: await prisma.driverDocument.count(),
    DriverIntake: await prisma.driverIntake.count(),
    DriverLicense: await prisma.driverLicense.count(),
    MedicalQualification: await prisma.medicalQualification.count(),
    DrugTestRecord: await prisma.drugTestRecord.count(),
    DriverQualificationSnapshot: await prisma.driverQualificationSnapshot.count(),
    DriverReadinessScore: await prisma.driverReadinessScore.count(),
    DispatchAssignment: await prisma.dispatchAssignment.count(),
    DispatchRelease: await prisma.dispatchRelease.count(),
  };
}

async function removeFile(relativeKey: string | null | undefined) {
  if (!relativeKey) {
    return;
  }

  await rm(resolve(STORAGE_ROOT, relativeKey), { force: true }).catch(() => undefined);
}

async function cleanupFixtures(prisma: PrismaClient, fixture: {
  userIds: string[];
  driverIds: string[];
  intakeIds: string[];
  authorizationIds: string[];
  materializationIds: string[];
  documentIds: string[];
  storageKeys: string[];
}) {
  if (fixture.materializationIds.length > 0) {
    await prisma.employerDocumentMaterialization.deleteMany({
      where: { id: { in: fixture.materializationIds } },
    }).catch(() => undefined);
  }

  if (fixture.authorizationIds.length > 0) {
    await prisma.documentAuthorization.deleteMany({
      where: { id: { in: fixture.authorizationIds } },
    }).catch(() => undefined);
  }

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { entityType: "DocumentAuthorization", entityId: { in: fixture.authorizationIds } },
        { entityType: "EmployerDocumentMaterialization", entityId: { in: fixture.materializationIds } },
        { entityType: "DriverDocument", entityId: { in: fixture.documentIds } },
      ],
    },
  }).catch(() => undefined);

  for (const key of fixture.storageKeys) {
    await removeFile(key);
  }

  if (fixture.documentIds.length > 0) {
    await prisma.driverDocument.deleteMany({
      where: { id: { in: fixture.documentIds } },
    }).catch(() => undefined);
  }

  if (fixture.intakeIds.length > 0) {
    await prisma.driverIntake.deleteMany({
      where: { id: { in: fixture.intakeIds } },
    }).catch(() => undefined);
  }

  if (fixture.driverIds.length > 0) {
    await prisma.driver.deleteMany({
      where: { id: { in: fixture.driverIds } },
    }).catch(() => undefined);
  }

  if (fixture.userIds.length > 0) {
    await prisma.fleetMembership.deleteMany({
      where: { userId: { in: fixture.userIds } },
    }).catch(() => undefined);
    await prisma.user.deleteMany({
      where: { id: { in: fixture.userIds } },
    }).catch(() => undefined);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.includes("bof_dev")) {
    throw new Error("DATABASE_URL must point to bof_dev");
  }

  const prisma = sharedPrisma as unknown as PrismaClient;
  const baseline = await countSnapshot(prisma);

  const fleetA = await prisma.fleet.findUnique({ where: { slug: "fleet-a" } });
  const fleetB = await prisma.fleet.findUnique({ where: { slug: "fleet-b" } });
  const role = await prisma.role.findFirst({
    where: { code: { in: ["FLEET_ADMIN", "FLEET_OPERATIONS", "BOF_OPERATIONS"] } },
  });
  assert(fleetA && fleetB && role, "Required fixture fleets/role missing");

  const userA = await prisma.user.create({
    data: {
      email: `auth-a-${Date.now()}@dev.local`,
      name: "Authorization Driver A",
    },
    select: { id: true, email: true },
  });
  const driverA = await prisma.driver.create({
    data: {
      userId: userA.id,
      fleetId: fleetA.id,
      firstName: "Authorization",
      lastName: "DriverA",
      email: userA.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: userA.id, fleetId: fleetA.id, roleId: role.id, status: "ACTIVE" },
  });
  const intakeA = await prisma.driverIntake.create({
    data: {
      driverId: driverA.id,
      fleetId: fleetA.id,
      createdByUserId: userA.id,
    },
    select: { id: true },
  });

  const userB = await prisma.user.create({
    data: {
      email: `auth-b-${Date.now()}@dev.local`,
      name: "Authorization Driver B",
    },
    select: { id: true, email: true },
  });
  const driverB = await prisma.driver.create({
    data: {
      userId: userB.id,
      fleetId: fleetB.id,
      firstName: "Authorization",
      lastName: "DriverB",
      email: userB.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: userB.id, fleetId: fleetB.id, roleId: role.id, status: "ACTIVE" },
  });
  const intakeB = await prisma.driverIntake.create({
    data: {
      driverId: driverB.id,
      fleetId: fleetB.id,
      createdByUserId: userB.id,
    },
    select: { id: true },
  });

  const operatorA = await prisma.user.create({
    data: {
      email: `auth-op-a-${Date.now()}@dev.local`,
      name: "Fleet A Operator",
    },
    select: { id: true, email: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: operatorA.id, fleetId: fleetA.id, roleId: role.id, status: "ACTIVE" },
  });

  const operatorB = await prisma.user.create({
    data: {
      email: `auth-op-b-${Date.now()}@dev.local`,
      name: "Fleet B Operator",
    },
    select: { id: true, email: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: operatorB.id, fleetId: fleetB.id, roleId: role.id, status: "ACTIVE" },
  });

  const fixture = {
    userIds: [userA.id, userB.id, operatorA.id, operatorB.id],
    driverIds: [driverA.id, driverB.id],
    intakeIds: [intakeA.id, intakeB.id],
    authorizationIds: [] as string[],
    materializationIds: [] as string[],
    documentIds: [] as string[],
    storageKeys: [] as string[],
  };

  try {
    const dirtySessionA = {
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
      driverId: "bogus-driver-id",
      fleetId: "bogus-fleet-id",
      userId: "bogus-user-id",
      tenantId: "bogus-tenant-id",
    };
    const driverSessionB = {
      id: userB.id,
      email: userB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" }],
      driverId: "bogus-driver-id",
      fleetId: "bogus-fleet-id",
      userId: "bogus-user-id",
      tenantId: "bogus-tenant-id",
    };
    const operatorSessionA = {
      id: operatorA.id,
      email: operatorA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    };
    const operatorSessionB = {
      id: operatorB.id,
      email: operatorB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" }],
    };

    const version1 = await createAuthenticatedDriverVaultDocument(dirtySessionA, makeFormData("OTHER", "auth-v1.pdf", "v1"));
    const version1Record = await prisma.driverDocument.findUnique({ where: { id: version1.id } });
    assert(version1Record, "Version 1 missing");
    fixture.documentIds.push(version1Record.id);
    fixture.storageKeys.push(version1Record.storageKey);
    assert.equal(version1Record.driverId, driverA.id, "Version 1 driver mismatch");
    assert.equal(version1Record.fleetId, fleetA.id, "Version 1 fleet mismatch");
    assert.equal(version1Record.sourceDocumentId, version1Record.id, "Version 1 sourceDocumentId mismatch");
    assert.equal(version1Record.versionNumber, 1, "Version 1 number mismatch");

    const auth1 = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version1.id,
      fleetId: fleetA.id,
    });
    fixture.authorizationIds.push(auth1.id);

    const mat1 = await materializeEmployerDocument({
      sessionUser: operatorSessionA,
      authorizationId: auth1.id,
    });
    fixture.materializationIds.push(mat1.id);
    const mat1Record = await prisma.employerDocumentMaterialization.findUnique({
      where: { id: mat1.id },
      select: { employerStorageKey: true },
    });
    fixture.storageKeys.push(mat1Record?.employerStorageKey ?? "");
    assert.equal(mat1.driverId, driverA.id, "Materialization driver mismatch");
    assert.equal(mat1.fleetId, fleetA.id, "Materialization fleet mismatch");
    assert.equal(mat1.sourceDocumentId, version1Record.sourceDocumentId, "Materialization sourceDocumentId mismatch");
    assert.equal(mat1.sourceVersionNumber, 1, "Materialization source version mismatch");
    assert.equal(mat1.sourceChecksum, version1Record.checksum, "Materialization checksum mismatch");

    const mat1Repeat = await materializeEmployerDocument({
      sessionUser: operatorSessionA,
      authorizationId: auth1.id,
    });
    assert.equal(mat1Repeat.id, mat1.id, "Repeated materialization should return existing record");

    const currentAfterV1 = await getAuthenticatedDriverVaultDocument(dirtySessionA, version1.id);
    assert.equal(currentAfterV1.id, version1.id, "Current version should still be v1");
    const exactV1 = await getExactAuthenticatedDriverVaultDocumentVersion(dirtySessionA, version1.id);
    assert.equal(exactV1.id, version1.id, "Exact version retrieval failed for v1");

    const version2 = await replaceAuthenticatedDriverVaultDocument(dirtySessionA, version1.id, makeFormData("OTHER", "auth-v2.pdf", "v2"));
    const version2Record = await prisma.driverDocument.findUnique({ where: { id: version2.id } });
    const version1AfterV2 = await prisma.driverDocument.findUnique({ where: { id: version1.id } });
    assert(version2Record && version1AfterV2, "Version 2 or version 1 missing");
    fixture.documentIds.push(version2Record.id);
    fixture.storageKeys.push(version2Record.storageKey);
    assert.equal(version2Record.sourceDocumentId, version1Record.sourceDocumentId, "Version 2 sourceDocumentId mismatch");
    assert.equal(version2Record.versionNumber, 2, "Version 2 number mismatch");
    assert.equal(version2Record.previousVersionId, version1.id, "Version 2 previousVersionId mismatch");
    assert.equal(version1AfterV2.supersededByDocumentId, version2.id, "Version 1 should point to Version 2");

    const currentAfterV2 = await getAuthenticatedDriverVaultDocument(dirtySessionA, version1.id);
    assert.equal(currentAfterV2.id, version2.id, "Current version should resolve to v2");

    const auth2 = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version2.id,
      fleetId: fleetA.id,
    });
    fixture.authorizationIds.push(auth2.id);

    const mat2 = await materializeEmployerDocument({
      sessionUser: operatorSessionA,
      authorizationId: auth2.id,
    });
    fixture.materializationIds.push(mat2.id);
    const mat2Record = await prisma.employerDocumentMaterialization.findUnique({
      where: { id: mat2.id },
      select: { employerStorageKey: true },
    });
    fixture.storageKeys.push(mat2Record?.employerStorageKey ?? "");
    assert.equal(mat2.sourceVersionNumber, 2, "Version 2 materialization should reference v2");
    assert.notEqual(mat2.id, mat1.id, "Version 2 materialization must be separate");

    const status = await getDriverDocumentAuthorizationStatus(dirtySessionA);
    assert(status.documents.length >= 1, "Authorization status should expose driver documents");

    const driverAOwnDocAccess = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version1.id,
      fleetId: fleetA.id,
    }).then(() => true, () => false);
    assert(driverAOwnDocAccess, "Driver A should authorize own doc");

    const driverAOnDriverBDocStatus = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version1.id === version2.id ? version1.id : version1.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverAOnDriverBDocStatus, 403, "Fleet B authorization should be forbidden");

    const driverBVersion1 = await createAuthenticatedDriverVaultDocument(driverSessionB, makeFormData("OTHER", "b-v1.pdf", "bv1"));
    const driverBRecord1 = await prisma.driverDocument.findUnique({ where: { id: driverBVersion1.id } });
    assert(driverBRecord1, "Driver B version 1 missing");
    fixture.documentIds.push(driverBRecord1.id);
    fixture.storageKeys.push(driverBRecord1.storageKey);

    const driverAReadDriverBStatus = await getAuthenticatedDriverVaultDocument(dirtySessionA, driverBVersion1.id).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverAReadDriverBStatus, 404, "Driver A should not read Driver B document");

    const driverAExactDriverBStatus = await getExactAuthenticatedDriverVaultDocumentVersion(dirtySessionA, driverBVersion1.id).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverAExactDriverBStatus, 404, "Driver A should not exact-fetch Driver B document");

    const driverADownloadDriverBStatus = await resolveAuthenticatedDriverVaultDocumentDownload(dirtySessionA, driverBVersion1.id).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverADownloadDriverBStatus, 404, "Driver A download should be 404");

    const driverAAuthDriverBStatus = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: driverBVersion1.id,
      fleetId: fleetA.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverAAuthDriverBStatus, 404, "Cross-driver authorization should be 404");

    const driverAAuthFleetBStatus = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version1.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverAAuthFleetBStatus, 403, "Cross-fleet authorization should be 403");

    const driverBAuth = await authorizeDriverDocument({
      sessionUser: driverSessionB,
      documentId: driverBVersion1.id,
      fleetId: fleetB.id,
    });
    fixture.authorizationIds.push(driverBAuth.id);

    const driverBMat = await materializeEmployerDocument({
      sessionUser: operatorSessionB,
      authorizationId: driverBAuth.id,
    });
    fixture.materializationIds.push(driverBMat.id);
    const driverBMatRecord = await prisma.employerDocumentMaterialization.findUnique({
      where: { id: driverBMat.id },
      select: { employerStorageKey: true },
    });
    fixture.storageKeys.push(driverBMatRecord?.employerStorageKey ?? "");

    const operatorAReadDriverBPersonalStatus = await getAuthenticatedDriverVaultDocument(operatorSessionA, driverBVersion1.id).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(operatorAReadDriverBPersonalStatus, 409, "Operator A personal-vault read should be 409");

    const operatorAReadDriverBEmployerStatus = await getEmployerDocumentMaterialization({
      sessionUser: operatorSessionA,
      materializationId: driverBMat.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(operatorAReadDriverBEmployerStatus, 403, "Cross-fleet employer access should be 403");

    const version3 = await replaceAuthenticatedDriverVaultDocument(dirtySessionA, version2.id, makeFormData("OTHER", "auth-v3.pdf", "v3"));
    const version3Record = await prisma.driverDocument.findUnique({ where: { id: version3.id } });
    assert(version3Record, "Version 3 missing");
    fixture.documentIds.push(version3Record.id);
    fixture.storageKeys.push(version3Record.storageKey);

    const auth3 = await authorizeDriverDocument({
      sessionUser: dirtySessionA,
      documentId: version3.id,
      fleetId: fleetA.id,
    });
    fixture.authorizationIds.push(auth3.id);
    await revokeDriverDocumentAuthorization({
      sessionUser: dirtySessionA,
      authorizationId: auth3.id,
    });

    const materializeRevokedStatus = await materializeEmployerDocument({
      sessionUser: operatorSessionA,
      authorizationId: auth3.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(materializeRevokedStatus, 409, "Revoked authorization should yield conflict");

    const authStatus = await getDriverDocumentAuthorizationStatus(dirtySessionA);
    assert(authStatus.documents.some((document) => document.authorizations.length > 0), "Authorization status should expose authorizations");

    const countsBeforeCleanup = await countSnapshot(prisma);

    const auditEventIds = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { entityType: "DocumentAuthorization", entityId: { in: fixture.authorizationIds } },
          { entityType: "EmployerDocumentMaterialization", entityId: { in: fixture.materializationIds } },
          { entityType: "DriverDocument", entityId: { in: fixture.documentIds } },
        ],
      },
      select: { id: true },
    });
    if (auditEventIds.length > 0) {
      await prisma.auditEvent.deleteMany({ where: { id: { in: auditEventIds.map((row) => row.id) } } });
    }

    await cleanupFixtures(prisma, fixture);

    const countsAfterCleanup = await countSnapshot(prisma);
    assert.deepEqual(countsAfterCleanup, baseline, "Counts were not restored after cleanup");

    console.log(JSON.stringify({
      countsBeforeCleanup,
      countsAfterCleanup,
      version1Id: version1.id,
      version2Id: version2.id,
      driverBVersion1Id: driverBVersion1.id,
      auth1Id: auth1.id,
      auth2Id: auth2.id,
      driverBAuthId: driverBAuth.id,
      mat1Id: mat1.id,
      mat2Id: mat2.id,
      driverBMatId: driverBMat.id,
      repeatedMaterializationReturnedExisting: mat1Repeat.id === mat1.id,
    }, null, 2));
  } finally {
    await cleanupFixtures(prisma, fixture).catch(() => undefined);
  }
}

main().catch(async (error) => {
  console.error(error);
  const prisma = sharedPrisma as unknown as PrismaClient;
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
