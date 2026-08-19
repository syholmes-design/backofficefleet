import { prisma } from "@/lib/prisma";

const intakeInclude = {
  driver: true,
  fleet: true,
  createdByUser: true,
  approvedByUser: true,
  rejectedByUser: true,
  complianceCertifiedByUser: true,
  stageHistory: {
    orderBy: { createdAt: "desc" as const },
  },
  documents: true,
  requirements: true,
  licenses: true,
  endorsements: true,
  medicalQualifications: true,
  drugTests: true,
  workHistory: true,
  accidentHistory: true,
  violationHistory: true,
  qualificationSnapshots: true,
  readinessScores: true,
};

export async function getIntakeById(intakeId: string) {
  return prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: intakeInclude,
  });
}

export async function getDriverById(driverId: string) {
  return prisma.driver.findUnique({
    where: { id: driverId },
    include: { fleet: true },
  });
}

export async function listIntakesForFleet(
  fleetId: string,
  filters: {
    status?: string | null;
    stage?: string | null;
    driverId?: string | null;
  } = {},
) {
  return prisma.driverIntake.findMany({
    where: {
      fleetId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.stage ? { stage: filters.stage as never } : {}),
      ...(filters.driverId ? { driverId: filters.driverId } : {}),
    },
    include: intakeInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createIntake(data: {
  driverId: string;
  fleetId: string;
  createdByUserId: string;
  intakeSource: string;
  intakeChannel: string;
  stage: string;
  status: string;
}) {
  return prisma.driverIntake.create({
    data: {
      driverId: data.driverId,
      fleetId: data.fleetId,
      createdByUserId: data.createdByUserId,
      intakeSource: data.intakeSource as never,
      intakeChannel: data.intakeChannel as never,
      stage: data.stage as never,
      status: data.status as never,
    },
    include: intakeInclude,
  });
}

export async function updateIntake(
  intakeId: string,
  data: {
    stage?: string;
    status?: string;
    submittedAt?: Date | null;
    approvedAt?: Date | null;
    approvedByUserId?: string | null;
    rejectedAt?: Date | null;
    rejectedByUserId?: string | null;
    notes?: string | null;
  },
) {
  return prisma.driverIntake.update({
    where: { id: intakeId },
    data: {
      ...(data.stage ? { stage: data.stage as never } : {}),
      ...(data.status ? { status: data.status as never } : {}),
      ...(data.submittedAt !== undefined ? { submittedAt: data.submittedAt } : {}),
      ...(data.approvedAt !== undefined ? { approvedAt: data.approvedAt } : {}),
      ...(data.approvedByUserId !== undefined ? { approvedByUserId: data.approvedByUserId } : {}),
      ...(data.rejectedAt !== undefined ? { rejectedAt: data.rejectedAt } : {}),
      ...(data.rejectedByUserId !== undefined ? { rejectedByUserId: data.rejectedByUserId } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: intakeInclude,
  });
}

export async function createStageAudit(
  intakeId: string,
  stage: string,
  status: string | null,
  changedByUserId: string | null,
  notes?: string | null,
) {
  return prisma.driverIntakeStage.create({
    data: {
      driverIntakeId: intakeId,
      stage: stage as never,
      status: status ? (status as never) : null,
      changedByUserId: changedByUserId ?? null,
      notes: notes ?? null,
    },
  });
}
