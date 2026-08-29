import { prisma } from "@/lib/prisma";

export const requirementInclude = {
  driverIntake: true,
  satisfiedByDocument: true,
  verificationSources: true,
} as const;

export async function getRequirementById(requirementId: string) {
  return prisma.driverIntakeRequirement.findUnique({
    where: { id: requirementId },
    include: requirementInclude,
  });
}

export async function getRequirementsForIntake(intakeId: string) {
  return prisma.driverIntakeRequirement.findMany({
    where: { driverIntakeId: intakeId },
    include: requirementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequirementsForDriver(driverId: string, fleetId: string) {
  return prisma.driverIntakeRequirement.findMany({
    where: { driverIntake: { driverId, fleetId } },
    select: {
      id: true,
      driverIntake: { select: { driverId: true } },
      requirementType: true,
      label: true,
      dueDate: true,
      actionStatus: true,
      requiredAction: true,
      resolutionStatus: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRequirement(data: {
  driverIntakeId: string;
  requirementType: string;
  label: string;
  isRequired?: boolean;
  dueDate?: Date | null;
  expiresAt?: Date | null;
  advanceWindowDays?: number | null;
  triggerDate?: Date | null;
  requiredAction?: string | null;
  actionStatus?: string | null;
  affirmationStatus?: string | null;
  affirmationTimestamp?: Date | null;
  affirmedBy?: string | null;
  evidenceReference?: string | null;
  verificationStatus?: string | null;
  verificationTimestamp?: Date | null;
  resolutionStatus?: string | null;
  resolvedAt?: Date | null;
  resolutionNotes?: string | null;
  exceptionReason?: string | null;
  status?: string | null;
}) {
  return prisma.driverIntakeRequirement.create({
    data: {
      driverIntakeId: data.driverIntakeId,
      requirementType: data.requirementType,
      label: data.label,
      isRequired: data.isRequired ?? true,
      dueDate: data.dueDate ?? null,
      expiresAt: data.expiresAt ?? null,
      advanceWindowDays: data.advanceWindowDays ?? null,
      triggerDate: data.triggerDate ?? null,
      requiredAction: data.requiredAction ?? null,
      actionStatus: data.actionStatus ?? null,
      affirmationStatus: data.affirmationStatus ?? null,
      affirmationTimestamp: data.affirmationTimestamp ?? null,
      affirmedBy: data.affirmedBy ?? null,
      evidenceReference: data.evidenceReference ?? null,
      verificationStatus: data.verificationStatus ?? null,
      verificationTimestamp: data.verificationTimestamp ?? null,
      resolutionStatus: data.resolutionStatus ?? null,
      resolvedAt: data.resolvedAt ?? null,
      resolutionNotes: data.resolutionNotes ?? null,
      exceptionReason: data.exceptionReason ?? null,
      status: (data.status ?? "REQUIRED") as never,
    },
    include: requirementInclude,
  });
}

export async function updateRequirement(requirementId: string, data: {
  label?: string;
  isRequired?: boolean;
  dueDate?: Date | null;
  expiresAt?: Date | null;
  advanceWindowDays?: number | null;
  triggerDate?: Date | null;
  requiredAction?: string | null;
  actionStatus?: string | null;
  affirmationStatus?: string | null;
  affirmationTimestamp?: Date | null;
  affirmedBy?: string | null;
  evidenceReference?: string | null;
  verificationStatus?: string | null;
  verificationTimestamp?: Date | null;
  resolutionStatus?: string | null;
  resolvedAt?: Date | null;
  resolutionNotes?: string | null;
  exceptionReason?: string | null;
  status?: string;
  satisfiedByDocumentId?: string | null;
}) {
  return prisma.driverIntakeRequirement.update({
    where: { id: requirementId },
    data: {
      ...(data.label ? { label: data.label } : {}),
      ...(data.isRequired !== undefined ? { isRequired: data.isRequired } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
      ...(data.advanceWindowDays !== undefined ? { advanceWindowDays: data.advanceWindowDays } : {}),
      ...(data.triggerDate !== undefined ? { triggerDate: data.triggerDate } : {}),
      ...(data.requiredAction !== undefined ? { requiredAction: data.requiredAction } : {}),
      ...(data.actionStatus !== undefined ? { actionStatus: data.actionStatus } : {}),
      ...(data.affirmationStatus !== undefined ? { affirmationStatus: data.affirmationStatus } : {}),
      ...(data.affirmationTimestamp !== undefined ? { affirmationTimestamp: data.affirmationTimestamp } : {}),
      ...(data.affirmedBy !== undefined ? { affirmedBy: data.affirmedBy } : {}),
      ...(data.evidenceReference !== undefined ? { evidenceReference: data.evidenceReference } : {}),
      ...(data.verificationStatus !== undefined ? { verificationStatus: data.verificationStatus } : {}),
      ...(data.verificationTimestamp !== undefined ? { verificationTimestamp: data.verificationTimestamp } : {}),
      ...(data.resolutionStatus !== undefined ? { resolutionStatus: data.resolutionStatus } : {}),
      ...(data.resolvedAt !== undefined ? { resolvedAt: data.resolvedAt } : {}),
      ...(data.resolutionNotes !== undefined ? { resolutionNotes: data.resolutionNotes } : {}),
      ...(data.exceptionReason !== undefined ? { exceptionReason: data.exceptionReason } : {}),
      ...(data.status ? { status: data.status as never } : {}),
      ...(data.satisfiedByDocumentId !== undefined ? { satisfiedByDocumentId: data.satisfiedByDocumentId } : {}),
    },
    include: requirementInclude,
  });
}
