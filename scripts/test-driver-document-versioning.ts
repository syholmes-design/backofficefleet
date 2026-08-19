import assert from "assert/strict";
import { existsSync } from "fs";
import { join, resolve } from "path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { prisma as sharedPrisma } from "../lib/prisma";
import {
  createAuthenticatedDriverVaultDocument,
  getAuthenticatedDriverVaultDocument,
  getExactAuthenticatedDriverVaultDocumentVersion,
  replaceAuthenticatedDriverVaultDocument,
} from "../lib/services/driverDocumentVersioningService";

const STORAGE_ROOT = resolve(process.cwd(), "storage", "driver-vault");

type Counts = Record<string, number>;

function makeFormData(documentType: string, fileName: string, label: string) {
  const formData = new FormData();
  formData.set("documentType", documentType);
  formData.set("file", new File([`test-${label}-${Date.now()}`], fileName, { type: "application/pdf" }));
  return formData;
}

function storagePath(storageKey: string) {
  return join(STORAGE_ROOT, storageKey);
}

async function captureCounts(prisma: PrismaClient): Promise<Counts> {
  return {
    DriverDocument: await prisma.driverDocument.count(),
    DriverIntake: await prisma.driverIntake.count(),
    DriverLicense: await prisma.driverLicense.count(),
    MedicalQualification: await prisma.medicalQualification.count(),
    DrugTestRecord: await prisma.drugTestRecord.count(),
    DriverQualificationSnapshot: await prisma.driverQualificationSnapshot.count(),
    DriverReadinessScore: await prisma.driverReadinessScore.count(),
    DispatchAssignment: await prisma.dispatchAssignment.count(),
    DispatchRelease: await prisma.dispatchRelease.count(),
    Driver: await prisma.driver.count(),
  };
}

function assertCountsStable(before: Counts, after: Counts) {
  for (const key of Object.keys(before)) {
    if (key === "DriverDocument") {
      continue;
    }
    assert.equal(after[key], before[key], `${key} count changed`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const prisma = sharedPrisma as unknown as PrismaClient;
  const baseline = await captureCounts(prisma);

  const primaryDriver = await prisma.driver.findFirst({
    where: { userId: { not: null } },
    include: { user: true },
  });
  assert(primaryDriver, "Expected a linked driver");
  assert(primaryDriver.userId, "Primary driver missing userId");
  assert(primaryDriver.user, "Primary driver missing user");
  const primarySession = { id: primaryDriver.userId, email: primaryDriver.user.email };

  const alternateDriver = await prisma.driver.findFirst({
    where: {
      userId: { not: null },
      id: { not: primaryDriver.id },
    },
    include: { user: true },
  });
  const alternateSession = alternateDriver?.userId && alternateDriver.user
    ? { id: alternateDriver.userId, email: alternateDriver.user.email }
    : null;
  const crossFleetDriver = await prisma.driver.findFirst({
    where: {
      userId: { not: null },
      fleetId: { not: primaryDriver.fleetId },
    },
    include: { user: true },
  });

  const created = await createAuthenticatedDriverVaultDocument(
    primarySession,
    makeFormData("OTHER", "version-1.pdf", "v1"),
  );
  const version1 = await prisma.driverDocument.findUnique({ where: { id: created.id } });
  assert(version1, "Version 1 not found");
  assert.equal(version1.sourceDocumentId, version1.id, "Version 1 sourceDocumentId mismatch");
  assert.equal(version1.versionNumber, 1, "Version 1 number mismatch");
  assert.equal(version1.previousVersionId, null, "Version 1 previousVersionId should be null");
  assert.equal(version1.supersededAt, null, "Version 1 supersededAt should be null");
  assert.equal(version1.supersededByDocumentId, null, "Version 1 supersededByDocumentId should be null");
  assert.equal(version1.driverId, primaryDriver.id, "Version 1 driver mismatch");
  assert.equal(version1.fleetId, primaryDriver.fleetId, "Version 1 fleet mismatch");
  assert.ok(existsSync(storagePath(version1.storageKey)), "Version 1 storage object missing");

  const version2Summary = await replaceAuthenticatedDriverVaultDocument(
    primarySession,
    version1.id,
    makeFormData("OTHER", "version-2.pdf", "v2"),
  );
  const version2 = await prisma.driverDocument.findUnique({ where: { id: version2Summary.id } });
  const version1AfterV2 = await prisma.driverDocument.findUnique({ where: { id: version1.id } });
  assert(version2, "Version 2 not found");
  assert(version1AfterV2, "Version 1 after replacement not found");
  assert.equal(version2.sourceDocumentId, version1.sourceDocumentId, "Version 2 sourceDocumentId mismatch");
  assert.equal(version2.versionNumber, 2, "Version 2 number mismatch");
  assert.equal(version2.previousVersionId, version1.id, "Version 2 previousVersionId mismatch");
  assert.equal(version2.supersededAt, null, "Version 2 supersededAt should be null");
  assert.equal(version2.supersededByDocumentId, null, "Version 2 supersededByDocumentId should be null");
  assert.equal(version1AfterV2.supersededByDocumentId, version2.id, "Version 1 not superseded by Version 2");
  assert.ok(version1AfterV2.supersededAt, "Version 1 supersededAt not set");
  assert.ok(existsSync(storagePath(version2.storageKey)), "Version 2 storage object missing");

  const version3Summary = await replaceAuthenticatedDriverVaultDocument(
    primarySession,
    version2.id,
    makeFormData("OTHER", "version-3.pdf", "v3"),
  );
  const version3 = await prisma.driverDocument.findUnique({ where: { id: version3Summary.id } });
  assert(version3, "Version 3 not found");
  assert.equal(version3.sourceDocumentId, version1.sourceDocumentId, "Version 3 sourceDocumentId mismatch");
  assert.equal(version3.versionNumber, 3, "Version 3 number mismatch");
  assert.equal(version3.previousVersionId, version2.id, "Version 3 previousVersionId mismatch");
  assert.ok(existsSync(storagePath(version3.storageKey)), "Version 3 storage object missing");

  const concurrentInputs = [
    replaceAuthenticatedDriverVaultDocument(primarySession, version3.id, makeFormData("OTHER", "version-4a.pdf", "v4a")),
    replaceAuthenticatedDriverVaultDocument(primarySession, version3.id, makeFormData("OTHER", "version-4b.pdf", "v4b")),
  ];
  const concurrentResults = await Promise.allSettled(concurrentInputs);
  const acceptedConcurrentIds = concurrentResults
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof replaceAuthenticatedDriverVaultDocument>>> => result.status === "fulfilled")
    .map((result) => result.value.id);
  assert(acceptedConcurrentIds.length >= 1, "At least one concurrent replacement should succeed");

  const threadDocuments = await prisma.driverDocument.findMany({
    where: { sourceDocumentId: version1.sourceDocumentId },
    orderBy: [{ versionNumber: "asc" }, { uploadedAt: "asc" }, { id: "asc" }],
  });
  assert.equal(threadDocuments[0].id, version1.id, "Thread version 1 mismatch");
  assert.equal(threadDocuments[0].versionNumber, 1, "Thread version 1 number mismatch");
  for (let index = 1; index < threadDocuments.length; index += 1) {
    assert.equal(
      threadDocuments[index].versionNumber,
      threadDocuments[index - 1].versionNumber + 1,
      "Thread version numbers must be consecutive",
    );
    assert.equal(
      threadDocuments[index].previousVersionId,
      threadDocuments[index - 1].id,
      "Thread previousVersionId chain broken",
    );
    assert.ok(existsSync(storagePath(threadDocuments[index].storageKey)), `Storage missing for version ${threadDocuments[index].versionNumber}`);
  }
  for (let index = 0; index < threadDocuments.length - 1; index += 1) {
    assert.equal(
      threadDocuments[index].supersededByDocumentId,
      threadDocuments[index + 1].id,
      "Thread supersededByDocumentId chain broken",
    );
    assert.ok(threadDocuments[index].supersededAt, `Version ${threadDocuments[index].versionNumber} should be superseded`);
  }
  assert.equal(threadDocuments[threadDocuments.length - 1].supersededAt, null, "Current version should not be superseded");

  let crossDriverAttempt: string | null = null;
  if (alternateSession) {
    crossDriverAttempt = await replaceAuthenticatedDriverVaultDocument(
      alternateSession,
      version1.id,
      makeFormData("OTHER", "cross-driver.pdf", "cross"),
    )
      .then(() => "allowed")
      .catch((error: unknown) => (error && typeof error === "object" && "statusCode" in error ? String((error as { statusCode?: number }).statusCode) : "error"));
    assert.equal(crossDriverAttempt, "404", "Cross-driver replacement should be denied");
  }

  let crossFleetAttempt: string | null = null;
  if (crossFleetDriver && crossFleetDriver.userId && crossFleetDriver.user) {
    const crossFleetSession = { id: crossFleetDriver.userId, email: crossFleetDriver.user.email };
    crossFleetAttempt = await replaceAuthenticatedDriverVaultDocument(
      crossFleetSession,
      version1.id,
      makeFormData("OTHER", "cross-fleet.pdf", "crossfleet"),
    )
      .then(() => "allowed")
      .catch((error: unknown) => (error && typeof error === "object" && "statusCode" in error ? String((error as { statusCode?: number }).statusCode) : "error"));
    assert.equal(crossFleetAttempt, "404", "Cross-fleet replacement should be denied");
  }

  const currentByThread = await getAuthenticatedDriverVaultDocument(primarySession, version1.id);
  assert.equal(currentByThread.id, threadDocuments[threadDocuments.length - 1].id, "Current version resolution failed");

  const exactVersion1 = await getExactAuthenticatedDriverVaultDocumentVersion(primarySession, version1.id);
  assert.equal(exactVersion1.id, version1.id, "Exact retrieval should return version 1");
  assert.equal(exactVersion1.versionNumber, 1, "Exact retrieval version number mismatch");

  const after = await captureCounts(prisma);
  assertCountsStable(baseline, after);
  assert.ok(after.DriverDocument > baseline.DriverDocument, "DriverDocument count should increase");

  console.log(
    JSON.stringify(
      {
        baseline,
        after,
        threadVersionCount: threadDocuments.length,
        currentVersionId: threadDocuments[threadDocuments.length - 1].id,
        concurrentResults: concurrentResults.map((result) => result.status),
        crossDriverAttempt: crossDriverAttempt ?? "skipped-no-fixture",
        crossFleetAttempt: crossFleetAttempt ?? "skipped-no-fixture",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
