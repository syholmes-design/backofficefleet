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

export async function createRequirement(data: {
  driverIntakeId: string;
  requirementType: string;
  label: string;
  isRequired?: boolean;
  dueDate?: Date | null;
  expiresAt?: Date | null;
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
      ...(data.exceptionReason !== undefined ? { exceptionReason: data.exceptionReason } : {}),
      ...(data.status ? { status: data.status as never } : {}),
      ...(data.satisfiedByDocumentId !== undefined ? { satisfiedByDocumentId: data.satisfiedByDocumentId } : {}),
    },
    include: requirementInclude,
  });
}
