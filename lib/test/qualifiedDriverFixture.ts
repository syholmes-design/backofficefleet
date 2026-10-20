import type { PrismaClient } from "@prisma/client";

/**
 * Test-only: the authoritative evidence that getAuthoritativeDriverQualification needs to return QUALIFIED
 * (contract §1, registry in authoritativeDriverQualificationService.ts). Development databases only.
 *
 * Creates, for an existing driver, an intake with compliance-verified DRIVER_LICENSE, MEDICAL, DRUG_TEST and
 * WORK_HISTORY documents, recorded CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY and ROAD_TEST_OR_EQUIVALENT
 * determinations, and an ACTIVE employment row covering more than three years. `complianceUserId` must hold an
 * ACTIVE BOF_COMPLIANCE_REVIEW membership in the driver's fleet. Rows are removed with the fleet's intakes,
 * documents and requirements; `cleanupQualifiedDriverEvidence` does that for the given drivers.
 */
export async function createQualifiedDriverEvidence(
  prisma: PrismaClient,
  input: { driverId: string; fleetId: string; complianceUserId: string },
) {
  const verifiedUntil = new Date(Date.now() + 365 * 86_400_000);
  const intake = await prisma.driverIntake.create({
    data: { driverId: input.driverId, fleetId: input.fleetId, createdByUserId: input.complianceUserId },
  });
  const document = (type: "DRIVER_LICENSE" | "MEDICAL" | "DRUG_TEST" | "WORK_HISTORY" | "OTHER", key: string) =>
    prisma.driverDocument.create({
      data: {
        driverId: input.driverId,
        driverIntakeId: intake.id,
        fleetId: input.fleetId,
        type,
        status: "VERIFIED",
        storageKey: `test/qualified/${input.driverId}/${key}`,
        originalFileName: `${key}.pdf`,
        uploadedByUserId: input.complianceUserId,
        verifiedByUserId: input.complianceUserId,
        verifiedAt: new Date(),
        verificationExpiresAt: verifiedUntil,
      },
    });
  const license = await document("DRIVER_LICENSE", "license");
  await document("MEDICAL", "medical");
  await document("DRUG_TEST", "drug-test");
  await document("WORK_HISTORY", "application");
  for (const requirementType of ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY", "ROAD_TEST_OR_EQUIVALENT"]) {
    const evidence = await document("OTHER", requirementType.toLowerCase());
    await prisma.driverIntakeRequirement.create({
      data: {
        driverIntakeId: intake.id,
        requirementType,
        label: requirementType,
        isRequired: true,
        status: "SATISFIED",
        satisfiedByDocumentId: evidence.id,
      },
    });
  }
  await prisma.workHistory.create({
    data: {
      driverId: input.driverId,
      driverIntakeId: intake.id,
      employerName: "Prior Carrier",
      startDate: new Date(Date.now() - 5 * 365 * 86_400_000),
      status: "ACTIVE",
    },
  });
  return { intakeId: intake.id, licenseDocumentId: license.id };
}

export async function cleanupQualifiedDriverEvidence(prisma: PrismaClient, driverIds: string[]) {
  if (driverIds.length === 0) return;
  await prisma.workHistory.deleteMany({ where: { driverId: { in: driverIds } } });
  await prisma.driverIntakeRequirement.deleteMany({ where: { driverIntake: { driverId: { in: driverIds } } } });
  await prisma.driverDocument.deleteMany({ where: { driverId: { in: driverIds } } });
  await prisma.driverIntake.deleteMany({ where: { driverId: { in: driverIds } } });
}
