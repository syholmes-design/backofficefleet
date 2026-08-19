import assert from "assert/strict";
import { rm } from "fs/promises";
import { resolve } from "path";

import { PrismaClient } from "@prisma/client";

import { prisma as sharedPrisma } from "../lib/prisma";
import { authorizeDriverDocument, materializeEmployerDocument, revokeDriverDocumentAuthorization } from "../lib/services/driverDocumentAuthorizationService";
import { reconcileEmployerDriverRecord } from "../lib/services/employerDriverRecordService";
import {
  createAuthenticatedDriverVaultDocument,
  replaceAuthenticatedDriverVaultDocument,
} from "../lib/services/driverDocumentVersioningService";

const STORAGE_ROOT = resolve(process.cwd(), "storage");

function makeFormData(documentType: string, fileName: string, label: string) {
  const formData = new FormData();
  formData.set("documentType", documentType);
  formData.set("file", new File([`reconcile-${label}-${Date.now()}`], fileName, { type: "application/pdf" }));
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
    DriverQualificationSnapshot: await prisma.driverQualificationSnapshot.count(),
    DriverReadinessScore: await prisma.driverReadinessScore.count(),
    DispatchAssignment: await prisma.dispatchAssignment.count(),
    DispatchRelease: await prisma.dispatchRelease.count(),
    DocumentAuthorization: await prisma.documentAuthorization.count(),
    EmployerDocumentMaterialization: await prisma.employerDocumentMaterialization.count(),
    FleetMembership: await prisma.fleetMembership.count(),
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
  reconciliationEntityIds: string[];
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
        { entityType: "EmployerDriverRecordReconciliation", entityId: { in: fixture.reconciliationEntityIds } },
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
      email: `recon-a-${Date.now()}@dev.local`,
      name: "Reconciliation Driver A",
    },
    select: { id: true, email: true },
  });
  const driverA = await prisma.driver.create({
    data: {
      userId: userA.id,
      fleetId: fleetA.id,
      firstName: "Reconciliation",
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
      email: `recon-b-${Date.now()}@dev.local`,
      name: "Reconciliation Driver B",
    },
    select: { id: true, email: true },
  });
  const driverB = await prisma.driver.create({
    data: {
      userId: userB.id,
      fleetId: fleetB.id,
      firstName: "Reconciliation",
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
      email: `recon-op-a-${Date.now()}@dev.local`,
      name: "Fleet A Operator",
    },
    select: { id: true, email: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: operatorA.id, fleetId: fleetA.id, roleId: role.id, status: "ACTIVE" },
  });

  const operatorB = await prisma.user.create({
    data: {
      email: `recon-op-b-${Date.now()}@dev.local`,
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
    reconciliationEntityIds: [] as string[],
  };

  try {
    const driverSessionA = {
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    };
    const movedDriverSessionA = {
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" }],
    };
    const driverSessionB = {
      id: userB.id,
      email: userB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" }],
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

    const version1 = await createAuthenticatedDriverVaultDocument(driverSessionA, makeFormData("OTHER", "recon-v1.pdf", "v1"));
    const version1Record = await prisma.driverDocument.findUnique({ where: { id: version1.id } });
    assert(version1Record, "Version 1 missing");
    fixture.documentIds.push(version1Record.id);
    fixture.storageKeys.push(version1Record.storageKey);

    const auth1 = await authorizeDriverDocument({
      sessionUser: driverSessionA,
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

    const reconcile1 = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    fixture.reconciliationEntityIds.push(`${driverA.id}:${fleetA.id}`);
    assert.equal(reconcile1.threads.length, 1, "Fleet A should reconcile one document thread");
    assert.equal(reconcile1.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 1, "Fleet A should retain V1");
    assert.equal(reconcile1.operationalRecord.latestIntakeId, intakeA.id, "Fleet A intake should be retained");

    const version2 = await replaceAuthenticatedDriverVaultDocument(driverSessionA, version1.id, makeFormData("OTHER", "recon-v2.pdf", "v2"));
    const version2Record = await prisma.driverDocument.findUnique({ where: { id: version2.id } });
    assert(version2Record, "Version 2 missing");
    fixture.documentIds.push(version2Record.id);
    fixture.storageKeys.push(version2Record.storageKey);

    const reconcileAfterV2 = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    assert.equal(reconcileAfterV2.threads[0].currentPersonalVersionNumber, 2, "Personal vault should advance to V2");
    assert.equal(reconcileAfterV2.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 1, "Employer should remain on V1");
    assert.equal(reconcileAfterV2.threads[0].hasPersonalVersionAheadOfEmployer, true, "Employer should lag behind personal vault");

    const auth2 = await authorizeDriverDocument({
      sessionUser: driverSessionA,
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

    const reconcileAfterV2Materialized = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    assert.equal(reconcileAfterV2Materialized.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 2, "Fleet A should advance to V2 after authorization");

    const version3 = await replaceAuthenticatedDriverVaultDocument(driverSessionA, version2.id, makeFormData("OTHER", "recon-v3.pdf", "v3"));
    const version3Record = await prisma.driverDocument.findUnique({ where: { id: version3.id } });
    assert(version3Record, "Version 3 missing");
    fixture.documentIds.push(version3Record.id);
    fixture.storageKeys.push(version3Record.storageKey);

    const reconcileAfterV3 = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    assert.equal(reconcileAfterV3.threads[0].currentPersonalVersionNumber, 3, "Personal vault should advance to V3");
    assert.equal(reconcileAfterV3.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 2, "Employer should stay on V2 without explicit authorization");

    const driverACrossDriverStatus = await reconcileEmployerDriverRecord({
      sessionUser: driverSessionA,
      driverId: driverB.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(driverACrossDriverStatus, 404, "Driver A must not inspect Driver B employer records");

    const operatorAcrossFleetStatus = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(operatorAcrossFleetStatus, 403, "Fleet A operator must not inspect Fleet B records");

    await prisma.fleetMembership.updateMany({
      where: { userId: userA.id, fleetId: fleetA.id },
      data: { status: "INACTIVE" },
    });
    await prisma.fleetMembership.create({
      data: { userId: userA.id, fleetId: fleetB.id, roleId: role.id, status: "ACTIVE" },
    });
    await prisma.driver.update({
      where: { id: driverA.id },
      data: { fleetId: fleetB.id },
    });
    const intakeBForDriverA = await prisma.driverIntake.create({
      data: {
        driverId: driverA.id,
        fleetId: fleetB.id,
        createdByUserId: userA.id,
      },
      select: { id: true },
    });
    fixture.intakeIds.push(intakeBForDriverA.id);

    const reconcileFleetAAfterMove = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionA,
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    fixture.reconciliationEntityIds.push(`${driverA.id}:${fleetA.id}`);
    assert.equal(reconcileFleetAAfterMove.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 2, "Fleet A history must remain retained after employment change");

    const reconcileFleetBBeforeAuth = await reconcileEmployerDriverRecord({
      sessionUser: movedDriverSessionA,
      driverId: driverA.id,
      fleetId: fleetB.id,
    });
    fixture.reconciliationEntityIds.push(`${driverA.id}:${fleetB.id}`);
    assert.equal(reconcileFleetBBeforeAuth.threads[0].currentEmployerMaterialization, null, "Fleet B must not inherit Fleet A materializations");
    assert.equal(reconcileFleetBBeforeAuth.operationalRecord.latestIntakeId, intakeBForDriverA.id, "Fleet B should see its own intake");

    const auth3 = await authorizeDriverDocument({
      sessionUser: movedDriverSessionA,
      documentId: version3.id,
      fleetId: fleetB.id,
    });
    fixture.authorizationIds.push(auth3.id);

    const mat3 = await materializeEmployerDocument({
      sessionUser: operatorSessionB,
      authorizationId: auth3.id,
    });
    fixture.materializationIds.push(mat3.id);
    const mat3Record = await prisma.employerDocumentMaterialization.findUnique({
      where: { id: mat3.id },
      select: { employerStorageKey: true },
    });
    fixture.storageKeys.push(mat3Record?.employerStorageKey ?? "");

    const reconcileFleetBAfterAuth = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionB,
      driverId: driverA.id,
      fleetId: fleetB.id,
    });
    assert.equal(reconcileFleetBAfterAuth.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 3, "Fleet B should materialize V3 only after explicit authorization");
    assert.equal(reconcileFleetBAfterAuth.threads[0].hasPersonalVersionAheadOfEmployer, false, "Fleet B should not lag after V3 materialization");

    const revokedAuth = await revokeDriverDocumentAuthorization({
      sessionUser: movedDriverSessionA,
      authorizationId: auth3.id,
    });
    assert.equal(revokedAuth.revokedAt !== null, true, "Authorization should be revoked");

    const revokedMaterializationStatus = await materializeEmployerDocument({
      sessionUser: operatorSessionB,
      authorizationId: auth3.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(revokedMaterializationStatus, 409, "Revoked authorization must block new materialization");

    const reconcileFleetBAfterRevoke = await reconcileEmployerDriverRecord({
      sessionUser: operatorSessionB,
      driverId: driverA.id,
      fleetId: fleetB.id,
    });
    assert.equal(reconcileFleetBAfterRevoke.threads[0].currentEmployerMaterialization?.sourceVersionNumber, 3, "Historical employer evidence must remain retained after revocation");
    assert.equal(reconcileFleetBAfterRevoke.threads[0].hasCurrentPersonalVersionAuthorization, false, "Revoked version should no longer be authorized");

    const countsBeforeCleanup = await countSnapshot(prisma);

    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { entityType: "DocumentAuthorization", entityId: { in: fixture.authorizationIds } },
          { entityType: "EmployerDocumentMaterialization", entityId: { in: fixture.materializationIds } },
          { entityType: "DriverDocument", entityId: { in: fixture.documentIds } },
          { entityType: "EmployerDriverRecordReconciliation", entityId: { in: fixture.reconciliationEntityIds } },
        ],
      },
    });

    await cleanupFixtures(prisma, fixture);

    const countsAfterCleanup = await countSnapshot(prisma);
    assert.deepEqual(countsAfterCleanup, baseline, "Counts were not restored after cleanup");

    console.log(JSON.stringify({
      countsBeforeCleanup,
      countsAfterCleanup,
      version1Id: version1.id,
      version2Id: version2.id,
      version3Id: version3.id,
      auth1Id: auth1.id,
      auth2Id: auth2.id,
      auth3Id: auth3.id,
      mat1Id: mat1.id,
      mat2Id: mat2.id,
      mat3Id: mat3.id,
      fleetAEmployerVersion: reconcileFleetAAfterMove.threads[0].currentEmployerMaterialization?.sourceVersionNumber ?? null,
      fleetBEmployerVersion: reconcileFleetBAfterAuth.threads[0].currentEmployerMaterialization?.sourceVersionNumber ?? null,
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
