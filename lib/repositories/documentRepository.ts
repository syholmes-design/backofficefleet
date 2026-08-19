import { prisma } from "@/lib/prisma";

export const documentInclude = {
  driver: true,
  driverIntake: true,
  fleet: true,
  uploadedByUser: true,
  verifiedByUser: true,
  certifiedByUser: true,
  verificationSources: true,
  requirementsSatisfied: true,
} as const;

export async function getDocumentById(documentId: string) {
  return prisma.driverDocument.findUnique({
    where: { id: documentId },
    include: documentInclude,
  });
}

export async function getDocumentsForIntake(intakeId: string) {
  return prisma.driverDocument.findMany({
    where: { driverIntakeId: intakeId },
    include: documentInclude,
    orderBy: { uploadedAt: "desc" },
  });
}

export async function createDocument(data: {
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  type: string;
  status?: string;
  storageKey: string;
  originalFileName: string;
  mimeType?: string | null;
  checksum?: string | null;
  uploadedByUserId: string;
}) {
  return prisma.driverDocument.create({
    data: {
      driverId: data.driverId,
      driverIntakeId: data.driverIntakeId,
      fleetId: data.fleetId,
      type: data.type as never,
      status: (data.status ?? "RECEIVED") as never,
      storageKey: data.storageKey,
      originalFileName: data.originalFileName,
      mimeType: data.mimeType ?? null,
      checksum: data.checksum ?? null,
      uploadedByUserId: data.uploadedByUserId,
    },
    include: documentInclude,
  });
}

export async function updateDocument(documentId: string, data: {
  status?: string;
  verifiedByUserId?: string | null;
  verifiedAt?: Date | null;
  verificationExpiresAt?: Date | null;
  nextVerificationDueAt?: Date | null;
  verificationQuality?: string | null;
}) {
  return prisma.driverDocument.update({
    where: { id: documentId },
    data: {
      ...(data.status ? { status: data.status as never } : {}),
      ...(data.verifiedByUserId !== undefined ? { verifiedByUserId: data.verifiedByUserId } : {}),
      ...(data.verifiedAt !== undefined ? { verifiedAt: data.verifiedAt } : {}),
      ...(data.verificationExpiresAt !== undefined ? { verificationExpiresAt: data.verificationExpiresAt } : {}),
      ...(data.nextVerificationDueAt !== undefined ? { nextVerificationDueAt: data.nextVerificationDueAt } : {}),
      ...(data.verificationQuality !== undefined ? { verificationQuality: data.verificationQuality } : {}),
    },
    include: documentInclude,
  });
}

export async function createVerificationSource(data: {
  driverDocumentId?: string | null;
  driverIntakeRequirementId?: string | null;
  providerName: string;
  providerType?: string | null;
  verificationMethod: string;
  verificationStatus?: string;
  verifiedAt?: Date | null;
  verifiedByUserId?: string | null;
  notes?: string | null;
}) {
  return prisma.verificationSource.create({
    data: {
      driverDocumentId: data.driverDocumentId ?? null,
      driverIntakeRequirementId: data.driverIntakeRequirementId ?? null,
      providerName: data.providerName,
      providerType: data.providerType ?? null,
      verificationMethod: data.verificationMethod,
      verificationStatus: (data.verificationStatus ?? "PENDING_VERIFICATION") as never,
      verifiedAt: data.verifiedAt ?? null,
      verifiedByUserId: data.verifiedByUserId ?? null,
      notes: data.notes ?? null,
    },
  });
}
