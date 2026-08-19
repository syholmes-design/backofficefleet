-- CreateEnum
CREATE TYPE "AggregatorStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CarrierGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DriverIntakeSource" AS ENUM ('EMAIL', 'PORTAL', 'MOBILE', 'UPLOAD', 'API', 'MANUAL');

-- CreateEnum
CREATE TYPE "DriverIntakeChannel" AS ENUM ('WEB', 'MOBILE', 'API', 'UPLOAD', 'INTERNAL_ADMIN');

-- CreateEnum
CREATE TYPE "DriverIntakeStageType" AS ENUM ('NEW', 'IDENTITY_REVIEW', 'DOCUMENT_COLLECTION', 'QUALIFICATION_REVIEW', 'COMPLIANCE_REVIEW', 'READY_FOR_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriverIntakeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEEDS_ATTENTION', 'READY_FOR_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('DRIVER_LICENSE', 'MEDICAL', 'DRUG_TEST', 'WORK_HISTORY', 'ACCIDENT_HISTORY', 'VIOLATION_HISTORY', 'IDENTITY_SUPPORTING', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverDocumentStatus" AS ENUM ('RECEIVED', 'PENDING_VERIFICATION', 'VERIFIED', 'CERTIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('RECEIVED', 'PENDING_VERIFICATION', 'VERIFIED', 'CERTIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('REQUIRED', 'PENDING', 'SATISFIED', 'REJECTED', 'EXPIRED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('ACTIVE', 'PENDING', 'REVIEW_REQUIRED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriverReadinessState" AS ENUM ('READY', 'CONDITIONAL', 'NOT_READY');

-- AlterTable
ALTER TABLE "Fleet" ADD COLUMN     "carrierGroupId" TEXT;

-- CreateTable
CREATE TABLE "Aggregator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AggregatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aggregator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierGroup" (
    "id" TEXT NOT NULL,
    "aggregatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CarrierGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatorFleet" (
    "id" TEXT NOT NULL,
    "aggregatorId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregatorFleet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatorMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aggregatorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregatorMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "ssnLast4" TEXT,
    "homeTerminalId" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverIntake" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "intakeSource" "DriverIntakeSource" NOT NULL DEFAULT 'PORTAL',
    "intakeChannel" "DriverIntakeChannel" NOT NULL DEFAULT 'WEB',
    "stage" "DriverIntakeStageType" NOT NULL DEFAULT 'NEW',
    "status" "DriverIntakeStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "isComplianceCertified" BOOLEAN NOT NULL DEFAULT false,
    "complianceCertifiedAt" TIMESTAMP(3),
    "complianceCertifiedByUserId" TEXT,
    "complianceCertificationNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverIntakeStage" (
    "id" TEXT NOT NULL,
    "driverIntakeId" TEXT NOT NULL,
    "stage" "DriverIntakeStageType" NOT NULL,
    "status" "DriverIntakeStatus",
    "changedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverIntakeStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "type" "DriverDocumentType" NOT NULL,
    "status" "DriverDocumentStatus" NOT NULL DEFAULT 'RECEIVED',
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedFromSourceAt" TIMESTAMP(3),
    "certifiedAt" TIMESTAMP(3),
    "certifiedByUserId" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "nextVerificationDueAt" TIMESTAMP(3),
    "verificationQuality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverIntakeRequirement" (
    "id" TEXT NOT NULL,
    "driverIntakeId" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequirementStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "satisfiedByDocumentId" TEXT,
    "exceptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverIntakeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLicense" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseClass" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverEndorsement" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "code" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "status" "QualificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalQualification" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "provider" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugTestRecord" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "provider" TEXT,
    "testDate" TIMESTAMP(3),
    "result" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugTestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "employerName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "QualificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccidentHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "severity" TEXT,
    "status" "QualificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccidentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViolationHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "violationDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "status" "QualificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViolationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverQualificationSnapshot" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "fleetId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedByUserId" TEXT,
    "status" "DriverReadinessState" NOT NULL DEFAULT 'NOT_READY',
    "score" INTEGER,
    "summary" TEXT,
    "reasonCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverQualificationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverReadinessScore" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverIntakeId" TEXT,
    "fleetId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedByUserId" TEXT,
    "status" "DriverReadinessState" NOT NULL DEFAULT 'NOT_READY',
    "score" INTEGER,
    "summary" TEXT,
    "reasonCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationSource" (
    "id" TEXT NOT NULL,
    "driverDocumentId" TEXT,
    "driverLicenseId" TEXT,
    "medicalQualificationId" TEXT,
    "drugTestRecordId" TEXT,
    "driverIntakeRequirementId" TEXT,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT,
    "verificationMethod" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "isCertifiedProvider" BOOLEAN NOT NULL DEFAULT false,
    "certificationLevel" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aggregator_status_idx" ON "Aggregator"("status");

-- CreateIndex
CREATE INDEX "CarrierGroup_aggregatorId_status_idx" ON "CarrierGroup"("aggregatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierGroup_aggregatorId_name_key" ON "CarrierGroup"("aggregatorId", "name");

-- CreateIndex
CREATE INDEX "AggregatorFleet_aggregatorId_status_idx" ON "AggregatorFleet"("aggregatorId", "status");

-- CreateIndex
CREATE INDEX "AggregatorFleet_fleetId_status_idx" ON "AggregatorFleet"("fleetId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AggregatorFleet_aggregatorId_fleetId_key" ON "AggregatorFleet"("aggregatorId", "fleetId");

-- CreateIndex
CREATE INDEX "AggregatorMembership_aggregatorId_status_idx" ON "AggregatorMembership"("aggregatorId", "status");

-- CreateIndex
CREATE INDEX "AggregatorMembership_userId_status_idx" ON "AggregatorMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AggregatorMembership_userId_aggregatorId_key" ON "AggregatorMembership"("userId", "aggregatorId");

-- CreateIndex
CREATE INDEX "Driver_fleetId_status_idx" ON "Driver"("fleetId", "status");

-- CreateIndex
CREATE INDEX "Driver_email_idx" ON "Driver"("email");

-- CreateIndex
CREATE INDEX "Driver_phone_idx" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "DriverIntake_fleetId_status_idx" ON "DriverIntake"("fleetId", "status");

-- CreateIndex
CREATE INDEX "DriverIntake_driverId_status_idx" ON "DriverIntake"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverIntake_createdAt_idx" ON "DriverIntake"("createdAt");

-- CreateIndex
CREATE INDEX "DriverIntakeStage_driverIntakeId_createdAt_idx" ON "DriverIntakeStage"("driverIntakeId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_type_status_idx" ON "DriverDocument"("driverId", "type", "status");

-- CreateIndex
CREATE INDEX "DriverDocument_fleetId_type_idx" ON "DriverDocument"("fleetId", "type");

-- CreateIndex
CREATE INDEX "DriverDocument_verifiedByUserId_idx" ON "DriverDocument"("verifiedByUserId");

-- CreateIndex
CREATE INDEX "DriverIntakeRequirement_driverIntakeId_status_idx" ON "DriverIntakeRequirement"("driverIntakeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DriverIntakeRequirement_driverIntakeId_requirementType_key" ON "DriverIntakeRequirement"("driverIntakeId", "requirementType");

-- CreateIndex
CREATE INDEX "DriverLicense_driverId_expirationDate_idx" ON "DriverLicense"("driverId", "expirationDate");

-- CreateIndex
CREATE INDEX "DriverLicense_driverId_status_idx" ON "DriverLicense"("driverId", "status");

-- CreateIndex
CREATE INDEX "DriverEndorsement_driverId_expirationDate_idx" ON "DriverEndorsement"("driverId", "expirationDate");

-- CreateIndex
CREATE INDEX "DriverEndorsement_driverId_status_idx" ON "DriverEndorsement"("driverId", "status");

-- CreateIndex
CREATE INDEX "MedicalQualification_driverId_expirationDate_idx" ON "MedicalQualification"("driverId", "expirationDate");

-- CreateIndex
CREATE INDEX "MedicalQualification_driverId_status_idx" ON "MedicalQualification"("driverId", "status");

-- CreateIndex
CREATE INDEX "DrugTestRecord_driverId_testDate_idx" ON "DrugTestRecord"("driverId", "testDate");

-- CreateIndex
CREATE INDEX "DrugTestRecord_driverId_status_idx" ON "DrugTestRecord"("driverId", "status");

-- CreateIndex
CREATE INDEX "WorkHistory_driverId_status_idx" ON "WorkHistory"("driverId", "status");

-- CreateIndex
CREATE INDEX "AccidentHistory_driverId_accidentDate_idx" ON "AccidentHistory"("driverId", "accidentDate");

-- CreateIndex
CREATE INDEX "ViolationHistory_driverId_violationDate_idx" ON "ViolationHistory"("driverId", "violationDate");

-- CreateIndex
CREATE INDEX "DriverQualificationSnapshot_driverId_evaluatedAt_idx" ON "DriverQualificationSnapshot"("driverId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DriverQualificationSnapshot_fleetId_evaluatedAt_idx" ON "DriverQualificationSnapshot"("fleetId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DriverReadinessScore_driverId_evaluatedAt_idx" ON "DriverReadinessScore"("driverId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DriverReadinessScore_fleetId_status_idx" ON "DriverReadinessScore"("fleetId", "status");

-- Backfill default carrier-group ownership for the seeded development fleets.
INSERT INTO "Aggregator" ("id", "name", "status", "createdAt", "updatedAt")
VALUES ('agg-bof-default', 'BOF Operations', 'ACTIVE', NOW(), NOW());

INSERT INTO "CarrierGroup" ("id", "aggregatorId", "name", "status", "createdAt", "updatedAt")
VALUES
  ('cg-bof-service', 'agg-bof-default', 'BOF Service', 'ACTIVE', NOW(), NOW()),
  ('cg-fleet-a', 'agg-bof-default', 'Fleet A', 'ACTIVE', NOW(), NOW()),
  ('cg-fleet-b', 'agg-bof-default', 'Fleet B', 'ACTIVE', NOW(), NOW());

INSERT INTO "AggregatorFleet" ("id", "aggregatorId", "fleetId", "status", "createdAt", "updatedAt")
SELECT 'af-bof-service', 'agg-bof-default', "id", 'ACTIVE', NOW(), NOW()
FROM "Fleet"
WHERE "slug" = 'bof-service';

INSERT INTO "AggregatorFleet" ("id", "aggregatorId", "fleetId", "status", "createdAt", "updatedAt")
SELECT 'af-fleet-a', 'agg-bof-default', "id", 'ACTIVE', NOW(), NOW()
FROM "Fleet"
WHERE "slug" = 'fleet-a';

INSERT INTO "AggregatorFleet" ("id", "aggregatorId", "fleetId", "status", "createdAt", "updatedAt")
SELECT 'af-fleet-b', 'agg-bof-default', "id", 'ACTIVE', NOW(), NOW()
FROM "Fleet"
WHERE "slug" = 'fleet-b';

UPDATE "Fleet"
SET "carrierGroupId" = CASE "slug"
  WHEN 'bof-service' THEN 'cg-bof-service'
  WHEN 'fleet-a' THEN 'cg-fleet-a'
  WHEN 'fleet-b' THEN 'cg-fleet-b'
  ELSE 'cg-bof-service'
END
WHERE "carrierGroupId" IS NULL;

ALTER TABLE "Fleet" ALTER COLUMN "carrierGroupId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "VerificationSource_driverDocumentId_idx" ON "VerificationSource"("driverDocumentId");

-- CreateIndex
CREATE INDEX "VerificationSource_driverLicenseId_idx" ON "VerificationSource"("driverLicenseId");

-- CreateIndex
CREATE INDEX "VerificationSource_medicalQualificationId_idx" ON "VerificationSource"("medicalQualificationId");

-- CreateIndex
CREATE INDEX "VerificationSource_drugTestRecordId_idx" ON "VerificationSource"("drugTestRecordId");

-- CreateIndex
CREATE INDEX "VerificationSource_driverIntakeRequirementId_idx" ON "VerificationSource"("driverIntakeRequirementId");

ALTER TABLE "VerificationSource"
ADD CONSTRAINT "VerificationSource_exactly_one_parent_check"
CHECK (
  num_nonnulls(
    "driverDocumentId",
    "driverLicenseId",
    "medicalQualificationId",
    "drugTestRecordId",
    "driverIntakeRequirementId"
  ) = 1
);

-- CreateIndex
CREATE INDEX "Fleet_carrierGroupId_status_idx" ON "Fleet"("carrierGroupId", "status");

-- AddForeignKey
ALTER TABLE "Fleet" ADD CONSTRAINT "Fleet_carrierGroupId_fkey" FOREIGN KEY ("carrierGroupId") REFERENCES "CarrierGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierGroup" ADD CONSTRAINT "CarrierGroup_aggregatorId_fkey" FOREIGN KEY ("aggregatorId") REFERENCES "Aggregator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatorFleet" ADD CONSTRAINT "AggregatorFleet_aggregatorId_fkey" FOREIGN KEY ("aggregatorId") REFERENCES "Aggregator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatorFleet" ADD CONSTRAINT "AggregatorFleet_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatorMembership" ADD CONSTRAINT "AggregatorMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatorMembership" ADD CONSTRAINT "AggregatorMembership_aggregatorId_fkey" FOREIGN KEY ("aggregatorId") REFERENCES "Aggregator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatorMembership" ADD CONSTRAINT "AggregatorMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntake" ADD CONSTRAINT "DriverIntake_complianceCertifiedByUserId_fkey" FOREIGN KEY ("complianceCertifiedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntakeStage" ADD CONSTRAINT "DriverIntakeStage_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntakeStage" ADD CONSTRAINT "DriverIntakeStage_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_certifiedByUserId_fkey" FOREIGN KEY ("certifiedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntakeRequirement" ADD CONSTRAINT "DriverIntakeRequirement_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverIntakeRequirement" ADD CONSTRAINT "DriverIntakeRequirement_satisfiedByDocumentId_fkey" FOREIGN KEY ("satisfiedByDocumentId") REFERENCES "DriverDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLicense" ADD CONSTRAINT "DriverLicense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLicense" ADD CONSTRAINT "DriverLicense_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEndorsement" ADD CONSTRAINT "DriverEndorsement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEndorsement" ADD CONSTRAINT "DriverEndorsement_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalQualification" ADD CONSTRAINT "MedicalQualification_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalQualification" ADD CONSTRAINT "MedicalQualification_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugTestRecord" ADD CONSTRAINT "DrugTestRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugTestRecord" ADD CONSTRAINT "DrugTestRecord_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentHistory" ADD CONSTRAINT "AccidentHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentHistory" ADD CONSTRAINT "AccidentHistory_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationHistory" ADD CONSTRAINT "ViolationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationHistory" ADD CONSTRAINT "ViolationHistory_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationSnapshot" ADD CONSTRAINT "DriverQualificationSnapshot_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationSnapshot" ADD CONSTRAINT "DriverQualificationSnapshot_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationSnapshot" ADD CONSTRAINT "DriverQualificationSnapshot_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQualificationSnapshot" ADD CONSTRAINT "DriverQualificationSnapshot_evaluatedByUserId_fkey" FOREIGN KEY ("evaluatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReadinessScore" ADD CONSTRAINT "DriverReadinessScore_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReadinessScore" ADD CONSTRAINT "DriverReadinessScore_driverIntakeId_fkey" FOREIGN KEY ("driverIntakeId") REFERENCES "DriverIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReadinessScore" ADD CONSTRAINT "DriverReadinessScore_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReadinessScore" ADD CONSTRAINT "DriverReadinessScore_evaluatedByUserId_fkey" FOREIGN KEY ("evaluatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_driverDocumentId_fkey" FOREIGN KEY ("driverDocumentId") REFERENCES "DriverDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_driverLicenseId_fkey" FOREIGN KEY ("driverLicenseId") REFERENCES "DriverLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_medicalQualificationId_fkey" FOREIGN KEY ("medicalQualificationId") REFERENCES "MedicalQualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_drugTestRecordId_fkey" FOREIGN KEY ("drugTestRecordId") REFERENCES "DrugTestRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_driverIntakeRequirementId_fkey" FOREIGN KEY ("driverIntakeRequirementId") REFERENCES "DriverIntakeRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSource" ADD CONSTRAINT "VerificationSource_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
