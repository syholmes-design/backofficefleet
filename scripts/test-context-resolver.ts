import assert from "assert/strict";
import { rm } from "fs/promises";
import { resolve } from "path";

import { PrismaClient } from "@prisma/client";

import { prisma as sharedPrisma } from "../lib/prisma";
import { getAuthenticatedDriver } from "../lib/services/authenticatedDriverService";
import { resolveContext } from "../lib/services/contextResolver";
import { getAuthenticatedDriverVaultStatus } from "../lib/services/driverDocumentVersioningService";
import { authorizeDriverDocument } from "../lib/services/driverDocumentAuthorizationService";
import { reconcileEmployerDriverRecord } from "../lib/services/employerDriverRecordService";
import { createAuthenticatedDriverVaultDocument } from "../lib/services/driverDocumentVersioningService";

const STORAGE_ROOT = resolve(process.cwd(), "storage");

function makeFormData(documentType: string, fileName: string, label: string) {
  const formData = new FormData();
  formData.set("documentType", documentType);
  formData.set("file", new File([`context-${label}-${Date.now()}`], fileName, { type: "application/pdf" }));
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
  documentIds: string[];
  authorizationIds: string[];
  materializationIds: string[];
  storageKeys: string[];
  auditEntityIds: string[];
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
        { entityType: "DriverDocument", entityId: { in: fixture.documentIds } },
        { entityType: "DocumentAuthorization", entityId: { in: fixture.authorizationIds } },
        { entityType: "EmployerDocumentMaterialization", entityId: { in: fixture.materializationIds } },
        { entityType: "EmployerDriverRecordReconciliation", entityId: { in: fixture.auditEntityIds } },
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
    where: { code: { in: ["FLEET_ADMIN", "FLEET_OPERATIONS", "BOF_OPERATIONS", "DRIVER"] } },
  });
  assert(fleetA && fleetB && role, "Required fixture fleets/role missing");

  const unlinkedUser = await prisma.user.create({
    data: {
      email: `context-unlinked-${Date.now()}@dev.local`,
      name: "Context Unlinked",
    },
    select: { id: true, email: true },
  });
  const userA = await prisma.user.create({
    data: {
      email: `context-a-${Date.now()}@dev.local`,
      name: "Context Driver A",
    },
    select: { id: true, email: true },
  });
  const driverA = await prisma.driver.create({
    data: {
      userId: userA.id,
      fleetId: fleetA.id,
      firstName: "Context",
      lastName: "DriverA",
      email: userA.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
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
      email: `context-b-${Date.now()}@dev.local`,
      name: "Context Driver B",
    },
    select: { id: true, email: true },
  });
  const driverB = await prisma.driver.create({
    data: {
      userId: userB.id,
      fleetId: fleetB.id,
      firstName: "Context",
      lastName: "DriverB",
      email: userB.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  const intakeB = await prisma.driverIntake.create({
    data: {
      driverId: driverB.id,
      fleetId: fleetB.id,
      createdByUserId: userB.id,
    },
    select: { id: true },
  });

  await prisma.fleetMembership.createMany({
    data: [
      { userId: userA.id, fleetId: fleetA.id, roleId: role.id, status: "ACTIVE" },
      { userId: userB.id, fleetId: fleetB.id, roleId: role.id, status: "ACTIVE" },
      { userId: unlinkedUser.id, fleetId: fleetA.id, roleId: role.id, status: "ACTIVE" },
    ],
  });

  const fixture = {
    userIds: [unlinkedUser.id, userA.id, userB.id],
    driverIds: [driverA.id, driverB.id],
    intakeIds: [intakeA.id, intakeB.id],
    documentIds: [] as string[],
    authorizationIds: [] as string[],
    materializationIds: [] as string[],
    storageKeys: [] as string[],
    auditEntityIds: [] as string[],
  };

  try {
    const unauthenticated = await resolveContext(null);
    assert.equal(unauthenticated.authentication, "UNAUTHENTICATED", "Unauthenticated state mismatch");
    assert.equal(unauthenticated.personal, null, "Unauthenticated personal context should be null");
    assert.equal(unauthenticated.employmentContexts.length, 0, "Unauthenticated employment contexts should be empty");

    const unlinked = await resolveContext({
      id: unlinkedUser.id,
      email: unlinkedUser.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    });
    assert.equal(unlinked.authentication, "AUTHENTICATED", "Unlinked auth state mismatch");
    assert.equal(unlinked.personal, null, "Unlinked personal context should be null");
    assert.equal(unlinked.employmentContexts.length, 0, "Unlinked employment contexts should be empty");

    const linked = await resolveContext({
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    });
    assert.equal(linked.personal?.userId, userA.id, "Linked user mismatch");
    assert.equal(linked.personal?.driverId, driverA.id, "Linked driver mismatch");
    assert.equal(linked.employmentContexts.length, 1, "Linked employment context should resolve");
    assert.equal(linked.employmentContexts[0].fleetId, fleetA.id, "Fleet A context missing");

    const personalVault = await getAuthenticatedDriverVaultStatus({
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    });
    assert.equal(personalVault.state, "LINKED", "Personal Vault should remain accessible while employed");
    assert(personalVault.driver, "Personal Vault driver should be available");
    assert.equal(personalVault.driver.id, driverA.id, "Personal Vault should remain accessible while employed");

    const version1 = await createAuthenticatedDriverVaultDocument({
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
    }, makeFormData("OTHER", "context-v1.pdf", "v1"));
    const version1Record = await prisma.driverDocument.findUnique({ where: { id: version1.id } });
    assert(version1Record, "Version 1 missing");
    fixture.documentIds.push(version1Record.id);
    fixture.storageKeys.push(version1Record.storageKey);

    const auth1 = await authorizeDriverDocument({
      sessionUser: {
        id: userA.id,
        email: userA.email,
        memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
      },
      documentId: version1.id,
      fleetId: fleetA.id,
    });
    fixture.authorizationIds.push(auth1.id);

    const employerReconcile = await reconcileEmployerDriverRecord({
      sessionUser: {
        id: userA.id,
        email: userA.email,
        memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
      },
      driverId: driverA.id,
      fleetId: fleetA.id,
    });
    fixture.auditEntityIds.push(`${driverA.id}:${fleetA.id}`);
    assert.equal(employerReconcile.threads[0].currentEmployerMaterialization, null, "Employer operation should require materialization but remain context-aware");

    const crossDriverStatus = await reconcileEmployerDriverRecord({
      sessionUser: {
        id: userA.id,
        email: userA.email,
        memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
      },
      driverId: driverB.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(crossDriverStatus, 404, "Driver A must not access Driver B operation");

    const crossFleetStatus = await authorizeDriverDocument({
      sessionUser: {
        id: userA.id,
        email: userA.email,
        memberships: [{ fleetId: fleetA.id, roleCode: role.code, status: "ACTIVE" }],
      },
      documentId: version1.id,
      fleetId: fleetB.id,
    }).then(
      () => 200,
      (error) => statusOf(error),
    );
    assert.equal(crossFleetStatus, 403, "Driver A must not operate Fleet B");

    await prisma.driver.update({
      where: { id: driverA.id },
      data: { fleetId: fleetB.id },
    });
    await prisma.fleetMembership.updateMany({
      where: { userId: userA.id, fleetId: fleetA.id },
      data: { status: "INACTIVE" },
    });
    await prisma.fleetMembership.create({
      data: { userId: userA.id, fleetId: fleetB.id, roleId: role.id, status: "ACTIVE" },
    });

    const afterMove = await resolveContext({
      id: userA.id,
      email: userA.email,
      memberships: [
        { fleetId: fleetA.id, roleCode: role.code, status: "INACTIVE" },
        { fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" },
      ],
    });
    assert.equal(afterMove.personal?.driverId, driverA.id, "Personal context should remain after employment change");
    assert.equal(afterMove.employmentContexts.some((item) => item.fleetId === fleetA.id), false, "Fleet A context should end");
    assert.equal(afterMove.employmentContexts.some((item) => item.fleetId === fleetB.id), true, "Fleet B context should be present");

    const driverBOnly = await resolveContext({
      id: userB.id,
      email: userB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: role.code, status: "ACTIVE" }],
    });
    assert.equal(driverBOnly.employmentContexts.length, 1, "Fleet B driver should have one employment context");
    assert.equal(driverBOnly.employmentContexts[0].fleetId, fleetB.id, "Fleet B context missing");

    const countsBeforeCleanup = await countSnapshot(prisma);

    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { entityType: "DriverDocument", entityId: { in: fixture.documentIds } },
          { entityType: "DocumentAuthorization", entityId: { in: fixture.authorizationIds } },
          { entityType: "EmployerDriverRecordReconciliation", entityId: { in: fixture.auditEntityIds } },
        ],
      },
    });

    await cleanupFixtures(prisma, fixture);

    const countsAfterCleanup = await countSnapshot(prisma);
    assert.deepEqual(countsAfterCleanup, baseline, "Counts were not restored after cleanup");

    console.log(JSON.stringify({
      countsBeforeCleanup,
      countsAfterCleanup,
      linkedEmploymentContexts: linked.employmentContexts.map((item) => item.fleetId),
      afterMoveContexts: afterMove.employmentContexts.map((item) => item.fleetId),
      driverBOnlyContexts: driverBOnly.employmentContexts.map((item) => item.fleetId),
      crossDriverStatus,
      crossFleetStatus,
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
