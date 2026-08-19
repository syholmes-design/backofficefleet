import assert from "assert/strict";
import { rm } from "fs/promises";
import { resolve } from "path";

import { PrismaClient } from "@prisma/client";

import { prisma as sharedPrisma } from "../lib/prisma";
import {
  attachEvidence,
  confirmCondition,
  createCondition,
  getConditionEvidence,
  getConditionHistory,
  getCurrentConditionsForEquipment,
  recordConditionChange,
  reopenCondition,
  reportRepair,
  verifyResolution,
} from "../lib/services/conditionService";
import {
  applyPreTripConditionAction,
  attachAssignmentConditionEvidence,
  createPreTripCondition,
  getPreTripConditionBaseline,
} from "../lib/services/preTripConditionWorkflowService";
import { startPreTrip, updatePreTripItem, completePreTrip } from "../lib/services/preTripService";
import {
  assembleReleaseInputs,
  evaluateRelease,
  writeDispatchRelease,
} from "../lib/services/dispatchReleaseService";

const STORAGE_ROOT = resolve(process.cwd(), "storage");

function statusOf(error: unknown) {
  if (error && typeof error === "object" && "statusCode" in error) {
    return Number((error as { statusCode?: number }).statusCode) || 500;
  }
  return 500;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function expectDeniedWithAudit(
  prisma: PrismaClient,
  actorId: string,
  operation: string,
  expectedStatus: number,
  attempt: () => Promise<unknown>,
) {
  const before = await prisma.auditEvent.count({
    where: {
      actorId,
      action: "ACCESS_DENIED",
    },
  });

  await assert.rejects(
    async () => {
      await attempt();
    },
    (error) => statusOf(error) === expectedStatus,
    `Expected ${operation} to be denied with status ${expectedStatus}`,
  );

  const after = await prisma.auditEvent.count({
    where: {
      actorId,
      action: "ACCESS_DENIED",
    },
  });
  assert.equal(after, before + 1, `Expected ACCESS_DENIED audit count to increment for ${operation}`);

  const latest = await prisma.auditEvent.findFirst({
    where: {
      actorId,
      action: "ACCESS_DENIED",
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  assert(latest, `Expected ACCESS_DENIED audit record for ${operation}`);
  const details = asRecord(latest.details);
  assert.equal(details.operation, operation, `Expected audit operation to be ${operation}`);
}

function eventIdOf(result: unknown) {
  if (
    result &&
    typeof result === "object" &&
    "event" in result &&
    (result as { event?: unknown }).event &&
    typeof (result as { event?: { id?: unknown } }).event?.id === "string"
  ) {
    return (result as { event: { id: string } }).event.id;
  }
  throw new Error("Expected condition action result to include event.id");
}

async function countSnapshot(prisma: PrismaClient) {
  return {
    User: await prisma.user.count(),
    Driver: await prisma.driver.count(),
    FleetMembership: await prisma.fleetMembership.count(),
    Equipment: await prisma.equipment.count(),
    Load: await prisma.load.count(),
    DriverReadinessScore: await prisma.driverReadinessScore.count(),
    DispatchAssignment: await prisma.dispatchAssignment.count(),
    PreTripHeader: await prisma.preTripHeader.count(),
    PreTripItem: await prisma.preTripItem.count(),
    PreTripDefect: await prisma.preTripDefect.count(),
    DispatchRelease: await prisma.dispatchRelease.count(),
    ConditionThread: await prisma.conditionThread.count(),
    ConditionEvent: await prisma.conditionEvent.count(),
    OperationalEvidence: await prisma.operationalEvidence.count(),
    AuditEvent: await prisma.auditEvent.count(),
  };
}

async function purgeStaleFixtures(prisma: PrismaClient) {
  const staleUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { startsWith: "condition-" } }, { email: { startsWith: "condition-op-" } }],
    },
    select: { id: true },
  });
  const staleUserIds = staleUsers.map((user) => user.id);

  const staleDrivers = await prisma.driver.findMany({
    where: { userId: { in: staleUserIds } },
    select: { id: true },
  });
  const staleDriverIds = staleDrivers.map((driver) => driver.id);

  const staleMemberships = await prisma.fleetMembership.findMany({
    where: { userId: { in: staleUserIds } },
    select: { id: true },
  });
  const staleMembershipIds = staleMemberships.map((membership) => membership.id);

  const staleLoads = await prisma.load.findMany({
    where: { referenceNumber: { startsWith: "COND-" } },
    select: { id: true },
  });
  const staleLoadIds = staleLoads.map((load) => load.id);

  const staleAssignments = await prisma.dispatchAssignment.findMany({
    where: { OR: [{ loadId: { in: staleLoadIds } }, { assignedByUserId: { in: staleUserIds } }] },
    select: { id: true },
  });
  const staleAssignmentIds = staleAssignments.map((assignment) => assignment.id);

  const stalePreTrips = await prisma.preTripHeader.findMany({
    where: { assignmentId: { in: staleAssignmentIds } },
    select: { id: true },
  });
  const stalePreTripIds = stalePreTrips.map((preTrip) => preTrip.id);

  const staleThreads = await prisma.conditionThread.findMany({
    where: { title: "Right-side cab dent" },
    select: { id: true },
  });
  const staleThreadIds = staleThreads.map((thread) => thread.id);

  const staleEvents = await prisma.conditionEvent.findMany({
    where: {
      OR: [
        { conditionThreadId: { in: staleThreadIds } },
        { preTripHeaderId: { in: stalePreTripIds } },
        { dispatchAssignmentId: { in: staleAssignmentIds } },
        { loadId: { in: staleLoadIds } },
      ],
    },
    select: { id: true },
  });
  const staleEventIds = staleEvents.map((event) => event.id);

  const staleEvidence = await prisma.operationalEvidence.findMany({
    where: {
      OR: [
        { conditionThreadId: { in: staleThreadIds } },
        { conditionEventId: { in: staleEventIds } },
        { preTripHeaderId: { in: stalePreTripIds } },
        { dispatchAssignmentId: { in: staleAssignmentIds } },
        { loadId: { in: staleLoadIds } },
      ],
    },
    select: { id: true, storageKey: true },
  });

  if (staleEvidence.length > 0) {
    await prisma.operationalEvidence.deleteMany({
      where: { id: { in: staleEvidence.map((evidence) => evidence.id) } },
    }).catch(() => undefined);
    for (const evidence of staleEvidence) {
      await removeFile(evidence.storageKey);
    }
  }

  if (staleEventIds.length > 0) {
    await prisma.conditionEvent.deleteMany({
      where: { id: { in: staleEventIds } },
    }).catch(() => undefined);
  }

  if (staleThreadIds.length > 0) {
    await prisma.conditionThread.deleteMany({
      where: { id: { in: staleThreadIds } },
    }).catch(() => undefined);
  }

  if (stalePreTripIds.length > 0) {
    await prisma.preTripDefect.deleteMany({
      where: { preTripHeaderId: { in: stalePreTripIds } },
    }).catch(() => undefined);
    await prisma.preTripItem.deleteMany({
      where: { preTripHeaderId: { in: stalePreTripIds } },
    }).catch(() => undefined);
    await prisma.preTripHeader.deleteMany({
      where: { id: { in: stalePreTripIds } },
    }).catch(() => undefined);
  }

  if (staleAssignmentIds.length > 0) {
    await prisma.dispatchAssignment.deleteMany({
      where: { id: { in: staleAssignmentIds } },
    }).catch(() => undefined);
  }

  if (staleLoadIds.length > 0) {
    await prisma.load.deleteMany({
      where: { id: { in: staleLoadIds } },
    }).catch(() => undefined);
  }

  const staleEquipment = await prisma.equipment.findMany({
    where: {
      OR: [
        { unitNumber: "407", vin: { startsWith: "1FA" } },
        { unitNumber: "408", vin: { startsWith: "1FB" } },
        { unitNumber: "409", vin: { startsWith: "1FC" } },
      ],
    },
    select: { id: true },
  });
  const staleEquipmentIds = staleEquipment.map((equipment) => equipment.id);
  if (staleEquipmentIds.length > 0) {
    await prisma.equipment.deleteMany({
      where: { id: { in: staleEquipmentIds } },
    }).catch(() => undefined);
  }

  if (staleUserIds.length > 0 || staleDriverIds.length > 0 || staleMembershipIds.length > 0 || staleLoadIds.length > 0 || staleAssignmentIds.length > 0) {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { entityType: "ConditionThread", entityId: { in: staleThreadIds } },
          { entityType: "ConditionEvent", entityId: { in: staleEventIds } },
          { entityType: "OperationalEvidence", entityId: { in: staleEvidence.map((evidence) => evidence.id) } },
          { entityType: "PreTripHeader", entityId: { in: stalePreTripIds } },
          { entityType: "DispatchAssignment", entityId: { in: staleAssignmentIds } },
          { entityType: "Load", entityId: { in: staleLoadIds } },
          { entityType: "Equipment", entityId: { in: staleEquipmentIds } },
          { entityType: "Driver", entityId: { in: staleDriverIds } },
          { entityType: "User", entityId: { in: staleUserIds } },
          { entityType: "ConditionAccess", actorId: { in: staleUserIds } },
        ],
      },
    }).catch(() => undefined);
  }

  if (staleMembershipIds.length > 0) {
    await prisma.fleetMembership.deleteMany({
      where: { id: { in: staleMembershipIds } },
    }).catch(() => undefined);
  }

  if (staleDriverIds.length > 0) {
    await prisma.driver.deleteMany({
      where: { id: { in: staleDriverIds } },
    }).catch(() => undefined);
  }

  if (staleUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: staleUserIds } },
    }).catch(() => undefined);
  }

}

async function removeFile(relativeKey: string | null | undefined) {
  if (!relativeKey) {
    return;
  }

  await rm(resolve(STORAGE_ROOT, relativeKey), { force: true }).catch(() => undefined);
}

async function cleanupFixtures(
  prisma: PrismaClient,
  fixture: {
    userIds: string[];
    driverIds: string[];
    fleetMembershipIds: string[];
    equipmentIds: string[];
    loadIds: string[];
    readinessIds: string[];
    assignmentIds: string[];
    preTripHeaderIds: string[];
    conditionThreadIds: string[];
    conditionEventIds: string[];
    evidenceIds: string[];
    releaseIds: string[];
    storageKeys: string[];
  },
) {
  if (fixture.evidenceIds.length > 0) {
    await prisma.operationalEvidence.deleteMany({
      where: { id: { in: fixture.evidenceIds } },
    }).catch(() => undefined);
  }

  if (fixture.conditionEventIds.length > 0) {
    await prisma.conditionEvent.deleteMany({
      where: { id: { in: fixture.conditionEventIds } },
    }).catch(() => undefined);
  }

  if (fixture.conditionThreadIds.length > 0) {
    await prisma.conditionThread.deleteMany({
      where: { id: { in: fixture.conditionThreadIds } },
    }).catch(() => undefined);
  }

  if (fixture.releaseIds.length > 0) {
    await prisma.dispatchRelease.deleteMany({
      where: { id: { in: fixture.releaseIds } },
    }).catch(() => undefined);
  }

  if (fixture.preTripHeaderIds.length > 0) {
    await prisma.preTripDefect.deleteMany({
      where: { preTripHeaderId: { in: fixture.preTripHeaderIds } },
    }).catch(() => undefined);
  }

  if (fixture.preTripHeaderIds.length > 0) {
    await prisma.preTripItem.deleteMany({
      where: { preTripHeaderId: { in: fixture.preTripHeaderIds } },
    }).catch(() => undefined);
    await prisma.preTripHeader.deleteMany({
      where: { id: { in: fixture.preTripHeaderIds } },
    }).catch(() => undefined);
  }

  if (fixture.assignmentIds.length > 0) {
    await prisma.dispatchAssignment.deleteMany({
      where: { id: { in: fixture.assignmentIds } },
    }).catch(() => undefined);
  }

  if (fixture.readinessIds.length > 0) {
    await prisma.driverReadinessScore.deleteMany({
      where: { id: { in: fixture.readinessIds } },
    }).catch(() => undefined);
  }

  if (fixture.loadIds.length > 0) {
    await prisma.load.deleteMany({
      where: { id: { in: fixture.loadIds } },
    }).catch(() => undefined);
  }

  if (fixture.equipmentIds.length > 0) {
    await prisma.equipment.deleteMany({
      where: { id: { in: fixture.equipmentIds } },
    }).catch(() => undefined);
  }

  if (fixture.fleetMembershipIds.length > 0) {
    await prisma.fleetMembership.deleteMany({
      where: { id: { in: fixture.fleetMembershipIds } },
    }).catch(() => undefined);
  }

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { entityType: "ConditionThread", entityId: { in: fixture.conditionThreadIds } },
        { entityType: "ConditionEvent", entityId: { in: fixture.conditionEventIds } },
        { entityType: "OperationalEvidence", entityId: { in: fixture.evidenceIds } },
        { entityType: "DispatchRelease", entityId: { in: fixture.releaseIds } },
        { entityType: "PreTripHeader", entityId: { in: fixture.preTripHeaderIds } },
        { entityType: "DispatchAssignment", entityId: { in: fixture.assignmentIds } },
        { entityType: "Load", entityId: { in: fixture.loadIds } },
        { entityType: "Equipment", entityId: { in: fixture.equipmentIds } },
        { entityType: "Driver", entityId: { in: fixture.driverIds } },
        { entityType: "User", entityId: { in: fixture.userIds } },
        { entityType: "ConditionAccess", actorId: { in: fixture.userIds } },
      ],
    },
  }).catch(() => undefined);

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

  for (const key of fixture.storageKeys) {
    await removeFile(key);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.includes("bof_dev")) {
    throw new Error("DATABASE_URL must point to bof_dev");
  }

  const prisma = sharedPrisma as unknown as PrismaClient;
  await purgeStaleFixtures(prisma);
  const baseline = await countSnapshot(prisma);

  const fleetA = await prisma.fleet.findUnique({ where: { slug: "fleet-a" } });
  const fleetB = await prisma.fleet.findUnique({ where: { slug: "fleet-b" } });
  const roleDriver = await prisma.role.findUnique({ where: { code: "DRIVER" } });
  const roleAdmin = await prisma.role.findUnique({ where: { code: "FLEET_ADMIN" } });
  assert(fleetA && fleetB && roleDriver && roleAdmin, "Required fixture fleets/roles missing");

  const userA = await prisma.user.create({
    data: {
      email: `condition-a-${Date.now()}@dev.local`,
      name: "Condition Driver A",
    },
    select: { id: true, email: true },
  });
  const driverA = await prisma.driver.create({
    data: {
      userId: userA.id,
      fleetId: fleetA.id,
      firstName: "Condition",
      lastName: "DriverA",
      email: userA.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  const fleetMembershipA = await prisma.fleetMembership.create({
    data: { userId: userA.id, fleetId: fleetA.id, roleId: roleDriver.id, status: "ACTIVE" },
    select: { id: true },
  });

  const userC = await prisma.user.create({
    data: {
      email: `condition-c-${Date.now()}@dev.local`,
      name: "Condition Driver C",
    },
    select: { id: true, email: true },
  });
  const driverC = await prisma.driver.create({
    data: {
      userId: userC.id,
      fleetId: fleetA.id,
      firstName: "Condition",
      lastName: "DriverC",
      email: userC.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  const fleetMembershipC = await prisma.fleetMembership.create({
    data: { userId: userC.id, fleetId: fleetA.id, roleId: roleDriver.id, status: "ACTIVE" },
    select: { id: true },
  });

  const userB = await prisma.user.create({
    data: {
      email: `condition-b-${Date.now()}@dev.local`,
      name: "Condition Driver B",
    },
    select: { id: true, email: true },
  });
  const driverB = await prisma.driver.create({
    data: {
      userId: userB.id,
      fleetId: fleetB.id,
      firstName: "Condition",
      lastName: "DriverB",
      email: userB.email,
      status: "ACTIVE",
    },
    select: { id: true, userId: true, fleetId: true },
  });
  const fleetMembershipB = await prisma.fleetMembership.create({
    data: { userId: userB.id, fleetId: fleetB.id, roleId: roleDriver.id, status: "ACTIVE" },
    select: { id: true },
  });

  const operatorA = await prisma.user.create({
    data: {
      email: `condition-op-a-${Date.now()}@dev.local`,
      name: "Condition Fleet A Operator",
    },
    select: { id: true, email: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: operatorA.id, fleetId: fleetA.id, roleId: roleAdmin.id, status: "ACTIVE" },
  });

  const operatorB = await prisma.user.create({
    data: {
      email: `condition-op-b-${Date.now()}@dev.local`,
      name: "Condition Fleet B Operator",
    },
    select: { id: true, email: true },
  });
  await prisma.fleetMembership.create({
    data: { userId: operatorB.id, fleetId: fleetB.id, roleId: roleAdmin.id, status: "ACTIVE" },
  });

  const truck407 = await prisma.equipment.create({
    data: {
      fleetId: fleetA.id,
      equipmentType: "TRACTOR",
      unitNumber: "407",
      vin: `1FA${Date.now()}`,
      status: "AVAILABLE",
    },
    select: { id: true, fleetId: true, unitNumber: true, status: true },
  });
  const supportTruck = await prisma.equipment.create({
    data: {
      fleetId: fleetB.id,
      equipmentType: "TRACTOR",
      unitNumber: "408",
      vin: `1FB${Date.now()}`,
      status: "AVAILABLE",
    },
    select: { id: true, fleetId: true, unitNumber: true, status: true },
  });
  const truck409 = await prisma.equipment.create({
    data: {
      fleetId: fleetA.id,
      equipmentType: "TRACTOR",
      unitNumber: "409",
      vin: `1FC${Date.now()}`,
      status: "AVAILABLE",
    },
    select: { id: true, fleetId: true, unitNumber: true, status: true },
  });

  const load = await prisma.load.create({
    data: {
      fleetId: fleetA.id,
      customerName: "Condition Cargo Test",
      origin: "Cleveland Receiver - Cleveland, OH",
      destination: "Prime Consumer - Atlanta, GA",
      status: "PLANNED",
      referenceNumber: `COND-${Date.now()}`,
    },
    select: { id: true, fleetId: true },
  });
  const loadForeign = await prisma.load.create({
    data: {
      fleetId: fleetB.id,
      customerName: "Condition Foreign Cargo Test",
      origin: "Nashville, TN",
      destination: "Savannah, GA",
      status: "PLANNED",
      referenceNumber: `COND-F-${Date.now()}`,
    },
    select: { id: true, fleetId: true },
  });

  const readiness = await prisma.driverReadinessScore.create({
    data: {
      driverId: driverA.id,
      driverIntakeId: null,
      fleetId: fleetA.id,
      status: "READY",
      score: 100,
      policyVersion: "step13f8-1-test",
      summary: "Condition foundation regression readiness",
      reasonCodes: [],
      evaluatedByUserId: operatorA.id,
    },
    select: { id: true },
  });

  const fixture = {
    userIds: [userA.id, userB.id, userC.id, operatorA.id, operatorB.id],
    driverIds: [driverA.id, driverB.id, driverC.id],
    fleetMembershipIds: [fleetMembershipA.id, fleetMembershipB.id, fleetMembershipC.id],
    equipmentIds: [truck407.id, supportTruck.id, truck409.id],
    loadIds: [load.id, loadForeign.id],
    readinessIds: [readiness.id],
    assignmentIds: [] as string[],
    preTripHeaderIds: [] as string[],
    conditionThreadIds: [] as string[],
    conditionEventIds: [] as string[],
    evidenceIds: [] as string[],
    releaseIds: [] as string[],
    storageKeys: [] as string[],
  };

  try {
    const driverSessionA = {
      id: userA.id,
      email: userA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: roleDriver.code, status: "ACTIVE" }],
    };
    const dirtyDriverSessionA = {
      ...driverSessionA,
      driverId: "spoofed-driver-id",
      fleetId: "spoofed-fleet-id",
      userId: "spoofed-user-id",
      tenantId: "spoofed-tenant-id",
    };
    const driverSessionB = {
      id: userB.id,
      email: userB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: roleDriver.code, status: "ACTIVE" }],
    };
    const driverSessionC = {
      id: userC.id,
      email: userC.email,
      memberships: [{ fleetId: fleetA.id, roleCode: roleDriver.code, status: "ACTIVE" }],
    };
    const operatorSessionA = {
      id: operatorA.id,
      email: operatorA.email,
      memberships: [{ fleetId: fleetA.id, roleCode: roleAdmin.code, status: "ACTIVE" }],
    };
    const operatorSessionB = {
      id: operatorB.id,
      email: operatorB.email,
      memberships: [{ fleetId: fleetB.id, roleCode: roleAdmin.code, status: "ACTIVE" }],
    };

    const assignment = await prisma.dispatchAssignment.create({
      data: {
        fleetId: fleetA.id,
        loadId: load.id,
        driverId: driverA.id,
        tractorEquipmentId: truck407.id,
        trailerEquipmentId: null,
        status: "ACTIVE",
        assignedByUserId: operatorA.id,
      },
      select: { id: true, fleetId: true, driverId: true, tractorEquipmentId: true },
    });
    fixture.assignmentIds.push(assignment.id);

    const preTrip = await startPreTrip(operatorSessionA, assignment.id);
    fixture.preTripHeaderIds.push(preTrip.id);

    const maintReport = await updatePreTripItem(operatorSessionA, preTrip.id, "maint-report", "PASS", "General maintenance note recorded");
    const maintReportItem = maintReport?.items.find((item) => item.itemCode === "maint-report");
    assert(maintReportItem, "maint-report item should exist");

    const foreignAssignment = await prisma.dispatchAssignment.create({
      data: {
        fleetId: fleetB.id,
        loadId: loadForeign.id,
        driverId: driverB.id,
        tractorEquipmentId: supportTruck.id,
        trailerEquipmentId: null,
        status: "ACTIVE",
        assignedByUserId: operatorB.id,
      },
      select: { id: true, fleetId: true, driverId: true, tractorEquipmentId: true },
    });
    fixture.assignmentIds.push(foreignAssignment.id);

    const foreignPreTrip = await startPreTrip(operatorSessionB, foreignAssignment.id);
    fixture.preTripHeaderIds.push(foreignPreTrip.id);
    const foreignMaintReport = await updatePreTripItem(
      operatorSessionB,
      foreignPreTrip.id,
      "maint-report",
      "PASS",
      "Foreign maintenance note recorded",
    );
    const foreignMaintReportItem = foreignMaintReport?.items.find((item) => item.itemCode === "maint-report");
    assert(foreignMaintReportItem, "foreign maint-report item should exist");

    const requiredItemCodes = ["rate-con", "bol", "dispatch-instructions", "pretrip-cargo", "seal-verify", "cdl", "med", "mvr"];
    for (const itemCode of requiredItemCodes) {
      await updatePreTripItem(driverSessionA, preTrip.id, itemCode, "PASS", `${itemCode} passed`);
    }

    const condition = await createCondition(dirtyDriverSessionA, {
      equipmentId: truck407.id,
      title: "Right-side cab dent",
      category: "STRUCTURAL",
      severity: "MINOR",
      impact: "COSMETIC_ONLY",
      notes: "Observed during pre-trip walkaround",
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      dispatchAssignmentId: assignment.id,
      loadId: load.id,
    });
    assert(condition, "Condition should be created");
    fixture.conditionThreadIds.push(condition.id);
    assert.equal(condition.fleetId, fleetA.id, "Condition must be scoped to Fleet A");
    assert.equal(condition.equipmentId, truck407.id, "Condition must stay locked to Truck 407");
    assert.equal(condition.lifecycleState, "IDENTIFIED", "Initial condition state mismatch");
    assert.equal(condition.evidenceCompleteness, "NONE", "Initial evidence completeness mismatch");
    assert.equal(condition.events.length, 1, "Initial condition should create one identifying event");
    assert.equal(condition.events[0].eventType, "IDENTIFIED", "Initial condition event mismatch");
    fixture.conditionEventIds.push(condition.events[0].id);

    const firstPhoto = new File([`dent-${Date.now()}-1`], "dent-identified.jpg", { type: "image/jpeg" });
    const firstEvidence = await attachEvidence(dirtyDriverSessionA, {
      conditionThreadId: condition.id,
      conditionEventId: condition.events[0].id,
      equipmentId: truck407.id,
      loadId: load.id,
      dispatchAssignmentId: assignment.id,
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      evidenceKind: "PHOTO",
      observationSource: "DRIVER",
      file: firstPhoto,
      notes: "Dent identified during pre-trip",
    });
    fixture.evidenceIds.push(firstEvidence.id);
    fixture.storageKeys.push(firstEvidence.storageKey);
    assert.equal(firstEvidence.conditionThreadId, condition.id, "Evidence must stay on the same condition thread");

    const baseline = await getPreTripConditionBaseline(dirtyDriverSessionA, assignment.id);
    const tractorBaseline = baseline.equipments.find((equipment) => equipment.kind === "TRACTOR");
    assert(tractorBaseline, "Tractor baseline should be available");
    assert(
      tractorBaseline.conditions.some((entry) => entry.conditionThreadId === condition.id),
      "Existing conditions should load for the active assignment equipment",
    );

    const noChangeEvent = await applyPreTripConditionAction(dirtyDriverSessionA, {
      assignmentId: assignment.id,
      conditionThreadId: condition.id,
      action: "NO_CHANGE",
      notes: "No change observed during current pre-trip baseline review",
      preTripHeaderId: preTrip.id,
      preTripItemCode: "maint-report",
    });
    fixture.conditionEventIds.push(eventIdOf(noChangeEvent));
    assert.equal(noChangeEvent.thread.lifecycleState, "CONFIRMED", "No-change action should append a confirmation event");

    const changedEventFromWorkflow = await applyPreTripConditionAction(driverSessionA, {
      assignmentId: assignment.id,
      conditionThreadId: condition.id,
      action: "CHANGED",
      notes: "Condition changed during baseline comparison",
      preTripHeaderId: preTrip.id,
      preTripItemCode: "maint-report",
    });
    const changedEventId = eventIdOf(changedEventFromWorkflow);
    fixture.conditionEventIds.push(changedEventId);
    assert.equal(changedEventFromWorkflow.thread.lifecycleState, "CHANGED", "Changed action should preserve thread identity");

    const changedEvidence = await attachAssignmentConditionEvidence(driverSessionA, {
      assignmentId: assignment.id,
      conditionThreadId: condition.id,
      conditionEventId: changedEventId,
      equipmentId: truck407.id,
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      notes: "Changed-condition evidence",
      file: new File([`dent-${Date.now()}-changed-workflow`], "dent-changed-workflow.jpg", { type: "image/jpeg" }),
    });
    fixture.evidenceIds.push(changedEvidence.id);
    fixture.storageKeys.push(changedEvidence.storageKey);

    const unsureRoute = await applyPreTripConditionAction(driverSessionA, {
      assignmentId: assignment.id,
      conditionThreadId: condition.id,
      action: "UNSURE",
      notes: "Driver is unsure and routing for review",
      preTripHeaderId: preTrip.id,
      preTripItemCode: "maint-report",
    });
    assert(
      (unsureRoute as { preTrip?: { id?: string } | null }).preTrip?.id === preTrip.id,
      "Unsure action should route through existing pre-trip semantics",
    );

    await expectDeniedWithAudit(prisma, operatorA.id, "condition.create", 422, async () => {
      await createCondition(operatorSessionA, {
        equipmentId: truck407.id,
        title: "Mismatched load condition",
        category: "STRUCTURAL",
        severity: "MINOR",
        impact: "COSMETIC_ONLY",
        loadId: loadForeign.id,
      });
    });

    await expectDeniedWithAudit(prisma, userA.id, "condition.attach_evidence", 422, async () => {
      await attachEvidence(driverSessionA, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck409.id,
        loadId: load.id,
        dispatchAssignmentId: assignment.id,
        preTripHeaderId: preTrip.id,
        preTripItemId: maintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`dent-${Date.now()}-same-fleet-foreign-equipment`], "dent-same-fleet-foreign-equipment.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    await expectDeniedWithAudit(prisma, userA.id, "condition.attach_evidence", 422, async () => {
      await attachEvidence(driverSessionA, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck407.id,
        loadId: loadForeign.id,
        dispatchAssignmentId: assignment.id,
        preTripHeaderId: preTrip.id,
        preTripItemId: maintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`dent-${Date.now()}-foreign-load`], "dent-foreign-load.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    await expectDeniedWithAudit(prisma, userA.id, "condition.attach_evidence", 422, async () => {
      await attachEvidence(driverSessionA, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck407.id,
        loadId: load.id,
        dispatchAssignmentId: foreignAssignment.id,
        preTripHeaderId: preTrip.id,
        preTripItemId: maintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`dent-${Date.now()}-foreign-assignment`], "dent-foreign-assignment.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    await expectDeniedWithAudit(prisma, userA.id, "condition.attach_evidence", 422, async () => {
      await attachEvidence(driverSessionA, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck407.id,
        loadId: load.id,
        dispatchAssignmentId: assignment.id,
        preTripHeaderId: foreignPreTrip.id,
        preTripItemId: maintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`dent-${Date.now()}-foreign-pretrip`], "dent-foreign-pretrip.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    await expectDeniedWithAudit(prisma, userA.id, "condition.attach_evidence", 422, async () => {
      await attachEvidence(driverSessionA, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck407.id,
        loadId: load.id,
        dispatchAssignmentId: assignment.id,
        preTripHeaderId: preTrip.id,
        preTripItemId: foreignMaintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`dent-${Date.now()}-wrong-pretrip-item`], "dent-wrong-pretrip-item.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    await expectDeniedWithAudit(prisma, operatorB.id, "condition.attach_evidence", 403, async () => {
      await attachEvidence(operatorSessionB, {
        conditionThreadId: condition.id,
        conditionEventId: condition.events[0].id,
        equipmentId: truck407.id,
        loadId: load.id,
        dispatchAssignmentId: assignment.id,
        preTripHeaderId: preTrip.id,
        preTripItemId: maintReportItem.id,
        evidenceKind: "PHOTO",
        observationSource: "DISPATCH",
        file: new File([`dent-${Date.now()}-cross-fleet`], "dent-cross-fleet.jpg", {
          type: "image/jpeg",
        }),
      });
    });

    const confirmedEvent = await confirmCondition(driverSessionA, condition.id, "Dent remains unchanged on follow-up look");
    fixture.conditionEventIds.push(confirmedEvent.event.id);
    assert.equal(confirmedEvent.thread.lifecycleState, "CONFIRMED", "Confirm should preserve the confirmed state");

    const repairReportedEvent = await reportRepair(operatorSessionA, condition.id, "Repair scheduled by maintenance");
    fixture.conditionEventIds.push(repairReportedEvent.event.id);
    assert.equal(repairReportedEvent.thread.lifecycleState, "AWAITING_VERIFICATION", "Repair should move the condition to awaiting verification");

    const repairPhoto = new File([`dent-${Date.now()}-2`], "dent-repair.jpg", { type: "image/jpeg" });
    const secondEvidence = await attachEvidence(driverSessionA, {
      conditionThreadId: condition.id,
      conditionEventId: repairReportedEvent.event.id,
      equipmentId: truck407.id,
      loadId: load.id,
      dispatchAssignmentId: assignment.id,
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      evidenceKind: "PHOTO",
      observationSource: "DRIVER",
      file: repairPhoto,
      notes: "Repair documentation captured",
    });
    fixture.evidenceIds.push(secondEvidence.id);
    fixture.storageKeys.push(secondEvidence.storageKey);

    const firstResolutionEvent = await verifyResolution(operatorSessionA, {
      conditionThreadId: condition.id,
      authority: "FLEET_MAINTENANCE",
      notes: "Fleet maintenance verified the dent had been repaired",
    });
    fixture.conditionEventIds.push(firstResolutionEvent.event.id);
    let history = firstResolutionEvent.thread;
    assert.equal(history.lifecycleState, "RESOLVED", "Resolution should close the first cycle");
    assert.equal(history.verificationState, "VERIFIED", "Resolution verification state mismatch");

    const reopenedEvent = await reopenCondition(operatorSessionA, condition.id, "Condition reappeared during later inspection");
    fixture.conditionEventIds.push(reopenedEvent.event.id);
    history = reopenedEvent.thread;
    assert.equal(history.lifecycleState, "REOPENED", "Reopen should preserve the condition identity");

    const changedEvent = await recordConditionChange(driverSessionA, condition.id, "Dent changed shape and location after a yard incident");
    fixture.conditionEventIds.push(changedEvent.event.id);
    history = changedEvent.thread;
    assert.equal(history.lifecycleState, "CHANGED", "Changed state should be preserved");

    const finalRepairEvent = await reportRepair(operatorSessionA, condition.id, "Second repair documented and ready for verification");
    fixture.conditionEventIds.push(finalRepairEvent.event.id);

    const finalResolutionEvent = await verifyResolution(driverSessionA, {
      conditionThreadId: condition.id,
      authority: "DRIVER",
      notes: "Driver confirmed the dent is no longer visible",
    });
    fixture.conditionEventIds.push(finalResolutionEvent.event.id);

    const resolutionPhoto = new File([`dent-${Date.now()}-3`], "dent-resolution.jpg", { type: "image/jpeg" });
    const thirdEvidence = await attachEvidence(driverSessionA, {
      conditionThreadId: condition.id,
      conditionEventId: finalResolutionEvent.event.id,
      equipmentId: truck407.id,
      loadId: load.id,
      dispatchAssignmentId: assignment.id,
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      evidenceKind: "PHOTO",
      observationSource: "DRIVER",
      file: resolutionPhoto,
      notes: "Resolution verification photo captured",
    });
    fixture.evidenceIds.push(thirdEvidence.id);
    fixture.storageKeys.push(thirdEvidence.storageKey);

    const newCondition = await createPreTripCondition(driverSessionA, {
      assignmentId: assignment.id,
      equipmentId: truck407.id,
      title: "Left mirror crack",
      category: "STRUCTURAL",
      severity: "MODERATE",
      impact: "DELAY_RISK",
      notes: "Newly observed crack while preparing to depart",
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
    });
    assert(newCondition, "New condition should be created");
    fixture.conditionThreadIds.push(newCondition.id);
    fixture.conditionEventIds.push(newCondition.events[0].id);
    assert.equal(newCondition.lifecycleState, "IDENTIFIED", "New condition should be identified");

    const newConditionEvidence = await attachAssignmentConditionEvidence(driverSessionA, {
      assignmentId: assignment.id,
      conditionThreadId: newCondition.id,
      conditionEventId: newCondition.events[0].id,
      equipmentId: truck407.id,
      preTripHeaderId: preTrip.id,
      preTripItemId: maintReportItem.id,
      notes: "Mirror crack baseline photo",
      file: new File([`mirror-${Date.now()}`], "mirror-crack.jpg", { type: "image/jpeg" }),
    });
    fixture.evidenceIds.push(newConditionEvidence.id);
    fixture.storageKeys.push(newConditionEvidence.storageKey);

    history = await getConditionHistory(operatorSessionA, condition.id);
    assert.equal(history.id, condition.id, "Condition identity must remain stable");
    assert.equal(history.lifecycleState, "RESOLVED", "Final condition state mismatch");
    assert.equal(history.verificationState, "VERIFIED", "Final verification state mismatch");
    assert.equal(history.evidenceCompleteness, "COMPLETE", "Final evidence completeness should be complete");
    assert.equal(history.events.length, 10, "History should preserve every event");
    assert.deepEqual(
      history.events.map((event) => event.eventType),
      [
        "IDENTIFIED",
        "CONFIRMED",
        "CHANGED",
        "CONFIRMED",
        "REPAIR_REPORTED",
        "RESOLUTION_VERIFIED",
        "REOPENED",
        "CHANGED",
        "REPAIR_REPORTED",
        "RESOLUTION_VERIFIED",
      ],
      "Condition history event order mismatch",
    );
    assert.equal(history.evidences.length, 4, "Condition should preserve all evidence rows");

    const currentBeforeRelease = await getCurrentConditionsForEquipment(driverSessionA, truck407.id);
    assert(
      currentBeforeRelease.some((entry) => entry.id === newCondition.id),
      "Newly identified condition should appear in current open-condition baseline",
    );
    assert(
      currentBeforeRelease.every((entry) => entry.id !== condition.id),
      "Resolved condition should not appear in current open-condition baseline",
    );

    const resolvedEvidence = await getConditionEvidence(operatorSessionA, thirdEvidence.id);
    assert.equal(resolvedEvidence.id, thirdEvidence.id, "Evidence retrieval mismatch");

    await expectDeniedWithAudit(prisma, userC.id, "condition.get_history", 403, async () => {
      await getConditionHistory(driverSessionC, condition.id);
    });

    await expectDeniedWithAudit(prisma, userC.id, "condition.get_evidence", 403, async () => {
      await getConditionEvidence(driverSessionC, thirdEvidence.id);
    });

    await expectDeniedWithAudit(prisma, operatorB.id, "condition.get_history", 403, async () => {
      await getConditionHistory(operatorSessionB, condition.id);
    });

    await expectDeniedWithAudit(prisma, operatorB.id, "condition.get_evidence", 403, async () => {
      await getConditionEvidence(operatorSessionB, thirdEvidence.id);
    });

    await updatePreTripItem(driverSessionA, preTrip.id, "maint-report", "PASS", "Condition review completed");
    const preTripComplete = await completePreTrip(operatorSessionA, preTrip.id);
    assert.equal(preTripComplete?.status, "COMPLETED", "Pre-trip should still complete");

    const releaseInputs = await assembleReleaseInputs(operatorSessionA, load.id);
    const evaluation = evaluateRelease(releaseInputs);
    assert.equal(evaluation.disposition, "RELEASED", "Dispatch release evaluation should remain authoritative");

    const release = await writeDispatchRelease(operatorSessionA, load.id, evaluation, releaseInputs.readiness.id);
    fixture.releaseIds.push(release.id);
    assert.equal(release.disposition, "RELEASED", "Dispatch release should be released");

    const currentAfterRelease = await getCurrentConditionsForEquipment(operatorSessionA, truck407.id);
    assert(
      currentAfterRelease.some((entry) => entry.id === newCondition.id),
      "Open condition should remain visible after release write",
    );
    assert(
      currentAfterRelease.every((entry) => entry.id !== condition.id),
      "Resolved condition should remain out of the current-condition list",
    );

    const dirtyHistory = await getConditionHistory(dirtyDriverSessionA, condition.id);
    assert.equal(dirtyHistory.id, condition.id, "Spoofed session fields must not affect authorization");
  } finally {
    await cleanupFixtures(prisma, fixture);
  }

  const after = await countSnapshot(prisma);
  assert.deepEqual(after, baseline, "Fixture cleanup must restore the database snapshot");

  console.log("STEP 13F.8.1 controlled condition foundation validation passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sharedPrisma.$disconnect();
  });
