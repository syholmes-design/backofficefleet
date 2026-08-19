import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import { attachEvidence, createCondition } from "../lib/services/conditionService";

const FIXTURE_PASSWORD = "DevPass123!";
const FIXTURE_MARKER = "mobile-pretrip-fixture-v1";
const FIXTURE_LOAD_REF_A = "MOBILE-FIXTURE-LOAD-A";
const FIXTURE_LOAD_REF_B = "MOBILE-FIXTURE-LOAD-B";

type SessionUserLike = {
  id: string;
  email: string | null;
  memberships: Array<{ fleetId: string; roleCode: string; status: string }>;
};

async function ensureRole(code: string, name: string) {
  return prisma.role.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function ensureFleet(slug: string, name: string) {
  const aggregator =
    (await prisma.aggregator.findFirst({ where: { name: "BOF Development" } })) ??
    (await prisma.aggregator.create({ data: { name: "BOF Development" } }));

  const carrierGroup = await prisma.carrierGroup.upsert({
    where: {
      aggregatorId_name: {
        aggregatorId: aggregator.id,
        name,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      aggregatorId: aggregator.id,
      name,
      status: "ACTIVE",
    },
  });

  return prisma.fleet.upsert({
    where: { slug },
    update: { name, carrierGroupId: carrierGroup.id, status: "ACTIVE" },
    create: { slug, name, carrierGroupId: carrierGroup.id, status: "ACTIVE" },
  });
}

async function ensureFixtureUser(input: {
  email: string;
  name: string;
  fleetId: string;
  roleId: string;
}) {
  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      status: "ACTIVE",
      passwordHash,
    },
    create: {
      email: input.email,
      name: input.name,
      status: "ACTIVE",
      passwordHash,
    },
  });

  await prisma.fleetMembership.upsert({
    where: {
      fleetId_userId: {
        fleetId: input.fleetId,
        userId: user.id,
      },
    },
    update: {
      roleId: input.roleId,
      status: "ACTIVE",
    },
    create: {
      fleetId: input.fleetId,
      userId: user.id,
      roleId: input.roleId,
      status: "ACTIVE",
    },
  });

  return user;
}

async function ensureDriver(input: {
  fleetId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const existing = await prisma.driver.findFirst({
    where: {
      fleetId: input.fleetId,
      email: input.email,
    },
  });

  if (existing) {
    return prisma.driver.update({
      where: { id: existing.id },
      data: {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        status: "ACTIVE",
      },
    });
  }

  return prisma.driver.create({
    data: {
      fleetId: input.fleetId,
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      status: "ACTIVE",
    },
  });
}

async function ensureDriverIntake(input: {
  driverId: string;
  fleetId: string;
  createdByUserId: string;
}) {
  const existing = await prisma.driverIntake.findFirst({
    where: {
      driverId: input.driverId,
      fleetId: input.fleetId,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const intake = await prisma.driverIntake.create({
    data: {
      driverId: input.driverId,
      fleetId: input.fleetId,
      createdByUserId: input.createdByUserId,
      intakeSource: "MOBILE",
      intakeChannel: "MOBILE",
      stage: "APPROVED",
      status: "APPROVED",
      submittedAt: now,
      approvedAt: now,
      approvedByUserId: input.createdByUserId,
      isComplianceCertified: true,
      complianceCertifiedAt: now,
      complianceCertifiedByUserId: input.createdByUserId,
      complianceCertificationNotes: "Fixture-created intake baseline",
      notes: "Mobile pre-trip fixture intake context",
    },
  });

  await prisma.driverIntakeStage.create({
    data: {
      driverIntakeId: intake.id,
      stage: "APPROVED",
      status: "APPROVED",
      changedByUserId: input.createdByUserId,
      notes: "Fixture intake approved",
    },
  });

  return intake;
}

async function ensureEquipment(input: {
  fleetId: string;
  unitNumber: string;
  equipmentType: "TRACTOR" | "TRAILER";
  vinSeed: string;
}) {
  return prisma.equipment.upsert({
    where: {
      fleetId_unitNumber: {
        fleetId: input.fleetId,
        unitNumber: input.unitNumber,
      },
    },
    update: {
      status: "AVAILABLE",
      equipmentType: input.equipmentType,
      vin: input.vinSeed,
    },
    create: {
      fleetId: input.fleetId,
      unitNumber: input.unitNumber,
      equipmentType: input.equipmentType,
      status: "AVAILABLE",
      vin: input.vinSeed,
    },
  });
}

async function ensureLoad(input: {
  fleetId: string;
  referenceNumber: string;
  customerName: string;
  origin: string;
  destination: string;
}) {
  const existing = await prisma.load.findFirst({
    where: {
      referenceNumber: input.referenceNumber,
      fleetId: input.fleetId,
    },
  });
  if (existing) {
    return prisma.load.update({
      where: { id: existing.id },
      data: {
        status: "PLANNED",
        customerName: input.customerName,
        origin: input.origin,
        destination: input.destination,
      },
    });
  }
  return prisma.load.create({
    data: {
      fleetId: input.fleetId,
      status: "PLANNED",
      referenceNumber: input.referenceNumber,
      customerName: input.customerName,
      origin: input.origin,
      destination: input.destination,
    },
  });
}

async function ensureAssignment(input: {
  fleetId: string;
  loadId: string;
  driverId: string;
  tractorEquipmentId: string;
  assignedByUserId: string;
}) {
  const existing = await prisma.dispatchAssignment.findFirst({
    where: {
      loadId: input.loadId,
      status: "ACTIVE",
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  if (existing) {
    return prisma.dispatchAssignment.update({
      where: { id: existing.id },
      data: {
        fleetId: input.fleetId,
        driverId: input.driverId,
        tractorEquipmentId: input.tractorEquipmentId,
      },
    });
  }

  return prisma.dispatchAssignment.create({
    data: {
      fleetId: input.fleetId,
      loadId: input.loadId,
      driverId: input.driverId,
      tractorEquipmentId: input.tractorEquipmentId,
      trailerEquipmentId: null,
      status: "ACTIVE",
      assignedByUserId: input.assignedByUserId,
    },
  });
}

async function ensureReadiness(input: { driverId: string; fleetId: string; evaluatedByUserId: string }) {
  const existing = await prisma.driverReadinessScore.findFirst({
    where: {
      driverId: input.driverId,
      policyVersion: FIXTURE_MARKER,
    },
  });
  if (existing) {
    return existing;
  }
  return prisma.driverReadinessScore.create({
    data: {
      driverId: input.driverId,
      driverIntakeId: null,
      fleetId: input.fleetId,
      status: "READY",
      score: 100,
      policyVersion: FIXTURE_MARKER,
      summary: "Mobile pre-trip fixture readiness",
      reasonCodes: [],
      evaluatedByUserId: input.evaluatedByUserId,
    },
  });
}

async function ensureConditionFixture(input: {
  sessionUser: SessionUserLike;
  assignmentId: string;
  loadId: string;
  equipmentId: string;
}) {
  const existing = await prisma.conditionThread.findMany({
    where: {
      equipmentId: input.equipmentId,
      title: { startsWith: "Mobile fixture condition" },
      lifecycleState: { not: "RESOLVED" },
    },
    include: {
      events: {
        orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
      },
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ firstIdentifiedAt: "asc" }, { createdAt: "asc" }],
  });

  const created: string[] = [];
  for (let index = existing.length; index < 4; index += 1) {
    const thread = await createCondition(input.sessionUser, {
      equipmentId: input.equipmentId,
      title: `Mobile fixture condition ${index + 1}`,
      category: "STRUCTURAL",
      severity: "MINOR",
      impact: "COSMETIC_ONLY",
      notes: "Fixture-created historical condition for mobile NO_CHANGE validation",
      dispatchAssignmentId: input.assignmentId,
      loadId: input.loadId,
    });

    created.push(thread?.id ?? "");
    if (thread?.id && thread.events[0]?.id) {
      await attachEvidence(input.sessionUser, {
        conditionThreadId: thread.id,
        conditionEventId: thread.events[0].id,
        equipmentId: input.equipmentId,
        dispatchAssignmentId: input.assignmentId,
        loadId: input.loadId,
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        file: new File([`fixture-${thread.id}`], `fixture-${index + 1}.jpg`, { type: "image/jpeg" }),
        notes: "Fixture baseline photo",
      });
    }
  }

  const finalThreads = await prisma.conditionThread.findMany({
    where: {
      equipmentId: input.equipmentId,
      title: { startsWith: "Mobile fixture condition" },
      lifecycleState: { not: "RESOLVED" },
    },
    orderBy: [{ firstIdentifiedAt: "asc" }, { createdAt: "asc" }],
    include: {
      events: {
        orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
      },
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return { created, finalThreads };
}

async function ensureForeignCondition(input: {
  sessionUser: SessionUserLike;
  assignmentId: string;
  loadId: string;
  equipmentId: string;
}) {
  const existing = await prisma.conditionThread.findFirst({
    where: {
      equipmentId: input.equipmentId,
      title: "Mobile fixture foreign condition",
    },
    include: { events: true },
  });

  if (existing) {
    return existing;
  }

  return createCondition(input.sessionUser, {
    equipmentId: input.equipmentId,
    title: "Mobile fixture foreign condition",
    category: "STRUCTURAL",
    severity: "MODERATE",
    impact: "COSMETIC_ONLY",
    notes: "Foreign fleet fixture condition",
    dispatchAssignmentId: input.assignmentId,
    loadId: input.loadId,
  });
}

async function main() {
  const roleDriver = await ensureRole("DRIVER", "Driver");
  const roleFleetAdmin = await ensureRole("FLEET_ADMIN", "Fleet Administrator");
  const fleetA = await ensureFleet("fleet-a", "Fleet A");
  const fleetB = await ensureFleet("fleet-b", "Fleet B");

  const userA = await ensureFixtureUser({
    email: "mobile-fixture-driver-a@dev.local",
    name: "Mobile Fixture Driver A",
    fleetId: fleetA.id,
    roleId: roleDriver.id,
  });
  const userB = await ensureFixtureUser({
    email: "mobile-fixture-driver-b@dev.local",
    name: "Mobile Fixture Driver B",
    fleetId: fleetB.id,
    roleId: roleDriver.id,
  });
  const operatorA = await ensureFixtureUser({
    email: "mobile-fixture-operator-a@dev.local",
    name: "Mobile Fixture Operator A",
    fleetId: fleetA.id,
    roleId: roleFleetAdmin.id,
  });
  const operatorB = await ensureFixtureUser({
    email: "mobile-fixture-operator-b@dev.local",
    name: "Mobile Fixture Operator B",
    fleetId: fleetB.id,
    roleId: roleFleetAdmin.id,
  });

  const driverA = await ensureDriver({
    fleetId: fleetA.id,
    userId: userA.id,
    email: userA.email,
    firstName: "Fixture",
    lastName: "DriverA",
  });
  const driverB = await ensureDriver({
    fleetId: fleetB.id,
    userId: userB.id,
    email: userB.email,
    firstName: "Fixture",
    lastName: "DriverB",
  });

  const intakeA = await ensureDriverIntake({
    driverId: driverA.id,
    fleetId: fleetA.id,
    createdByUserId: operatorA.id,
  });
  const intakeB = await ensureDriverIntake({
    driverId: driverB.id,
    fleetId: fleetB.id,
    createdByUserId: operatorB.id,
  });

  const truckA = await ensureEquipment({
    fleetId: fleetA.id,
    unitNumber: "FX-A-407",
    equipmentType: "TRACTOR",
    vinSeed: "FXA407VIN",
  });
  const truckB = await ensureEquipment({
    fleetId: fleetB.id,
    unitNumber: "FX-B-408",
    equipmentType: "TRACTOR",
    vinSeed: "FXB408VIN",
  });

  const loadA = await ensureLoad({
    fleetId: fleetA.id,
    referenceNumber: FIXTURE_LOAD_REF_A,
    customerName: "Mobile Fixture Freight A",
    origin: "Cleveland, OH",
    destination: "Atlanta, GA",
  });
  const loadB = await ensureLoad({
    fleetId: fleetB.id,
    referenceNumber: FIXTURE_LOAD_REF_B,
    customerName: "Mobile Fixture Freight B",
    origin: "Nashville, TN",
    destination: "Savannah, GA",
  });

  const assignmentA = await ensureAssignment({
    fleetId: fleetA.id,
    loadId: loadA.id,
    driverId: driverA.id,
    tractorEquipmentId: truckA.id,
    assignedByUserId: operatorA.id,
  });
  const assignmentB = await ensureAssignment({
    fleetId: fleetB.id,
    loadId: loadB.id,
    driverId: driverB.id,
    tractorEquipmentId: truckB.id,
    assignedByUserId: operatorB.id,
  });

  await ensureReadiness({ driverId: driverA.id, fleetId: fleetA.id, evaluatedByUserId: operatorA.id });
  await ensureReadiness({ driverId: driverB.id, fleetId: fleetB.id, evaluatedByUserId: operatorB.id });

  const driverSessionA: SessionUserLike = {
    id: userA.id,
    email: userA.email,
    memberships: [{ fleetId: fleetA.id, roleCode: "DRIVER", status: "ACTIVE" }],
  };
  const driverSessionB: SessionUserLike = {
    id: userB.id,
    email: userB.email,
    memberships: [{ fleetId: fleetB.id, roleCode: "DRIVER", status: "ACTIVE" }],
  };

  const { created, finalThreads } = await ensureConditionFixture({
    sessionUser: driverSessionA,
    assignmentId: assignmentA.id,
    loadId: loadA.id,
    equipmentId: truckA.id,
  });

  const foreignCondition = await ensureForeignCondition({
    sessionUser: driverSessionB,
    assignmentId: assignmentB.id,
    loadId: loadB.id,
    equipmentId: truckB.id,
  });

  console.log(
    JSON.stringify(
      {
        fixture: FIXTURE_MARKER,
        login: {
          email: userA.email,
          passwordHint: "Use DevPass123! (development-only fixture credential)",
        },
        fleetA: {
          id: fleetA.id,
          intakeId: intakeA.id,
          loadId: loadA.id,
          loadReferenceNumber: FIXTURE_LOAD_REF_A,
          assignmentId: assignmentA.id,
          driverId: driverA.id,
          equipmentId: truckA.id,
          conditionThreadIds: finalThreads.map((thread) => thread.id),
          conditionCount: finalThreads.length,
          createdConditionThreadIds: created.filter(Boolean),
        },
        fleetB: {
          id: fleetB.id,
          intakeId: intakeB.id,
          loadId: loadB.id,
          loadReferenceNumber: FIXTURE_LOAD_REF_B,
          assignmentId: assignmentB.id,
          driverId: driverB.id,
          equipmentId: truckB.id,
          foreignConditionThreadId: foreignCondition?.id ?? null,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
