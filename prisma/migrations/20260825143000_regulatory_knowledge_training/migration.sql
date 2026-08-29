-- Shared regulatory knowledge and durable training workflow.
CREATE TYPE "OperationalChatRecordType_new" AS ENUM ('LOAD', 'DRIVER', 'EXCEPTION', 'DOCUMENT_REQUEST', 'PROOF', 'SETTLEMENT', 'SAFETY_EVENT', 'COMPLIANCE_ISSUE', 'MAINTENANCE_ISSUE', 'CARRIER', 'CUSTOMER', 'REGULATION', 'TRAINING_MODULE', 'TRAINING_ASSIGNMENT', 'TRAINING_CERTIFICATION');
ALTER TABLE "OperationalChatCitation" ALTER COLUMN "recordType" TYPE TEXT USING "recordType"::text;
ALTER TABLE "OperationalChatCitation" ALTER COLUMN "recordType" TYPE "OperationalChatRecordType_new" USING "recordType"::text::"OperationalChatRecordType_new";
ALTER TABLE "OperationalChatThread" ALTER COLUMN "recordType" TYPE TEXT USING "recordType"::text;
ALTER TABLE "OperationalChatThread" ALTER COLUMN "recordType" TYPE "OperationalChatRecordType_new" USING "recordType"::text::"OperationalChatRecordType_new";
DROP TYPE "OperationalChatRecordType";
ALTER TYPE "OperationalChatRecordType_new" RENAME TO "OperationalChatRecordType";

CREATE TYPE "RegulatorySourceType" AS ENUM ('REGULATION', 'FMCSA_GUIDANCE', 'FEDERAL_REGISTER', 'FMCSA_TRAINING', 'BOF_TRAINING', 'BOF_POLICY');
CREATE TYPE "RegulatoryRecordStatus" AS ENUM ('CURRENT', 'SUPERSEDED', 'PROPOSED', 'ARCHIVED');
CREATE TYPE "RegulatoryApplicabilityStatus" AS ENUM ('NOT_REVIEWED', 'APPLICABLE', 'NOT_APPLICABLE', 'CONDITIONAL', 'REVIEW_REQUIRED');
CREATE TYPE "TrainingOwnership" AS ENUM ('BOF_INTERNAL', 'FMCSA_OFFICIAL');
CREATE TYPE "TrainingAssignmentStatus" AS ENUM ('ASSIGNED', 'STARTED', 'VIEWED', 'KNOWLEDGE_CHECK', 'PASSED', 'ACKNOWLEDGED', 'CERTIFIED', 'COMPLETE', 'REVIEW_REQUIRED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "TrainingCertificationOutcome" AS ENUM ('CERTIFIED', 'NOT_CERTIFIED', 'EXPIRED', 'REQUIRES_REVIEW');

CREATE TABLE "RegulatorySource" (
  "id" TEXT NOT NULL,
  "sourceType" "RegulatorySourceType" NOT NULL,
  "agency" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "externalIdentifier" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatorySource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryRequirement" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "cfrPart" TEXT,
  "section" TEXT,
  "subsection" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryRequirementVersion" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "citation" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "publicationDate" TIMESTAMP(3),
  "effectiveDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "version" TEXT NOT NULL,
  "status" "RegulatoryRecordStatus" NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegulatoryRequirementVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryApplicability" (
  "id" TEXT NOT NULL,
  "fleetId" TEXT NOT NULL,
  "driverId" TEXT,
  "requirementVersionId" TEXT NOT NULL,
  "status" "RegulatoryApplicabilityStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
  "rationale" TEXT,
  "determinedByUserId" TEXT,
  "determinedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryApplicability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingModule" (
  "id" TEXT NOT NULL,
  "ownership" "TrainingOwnership" NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "keywords" TEXT[] NOT NULL,
  "learningObjective" TEXT,
  "resourceUrl" TEXT NOT NULL,
  "resourceLabel" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "version" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "retiredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingSegment" (
  "id" TEXT NOT NULL,
  "trainingModuleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "chapter" TEXT,
  "startSeconds" INTEGER,
  "endSeconds" INTEGER,
  "sourceLocator" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryTrainingLink" (
  "id" TEXT NOT NULL,
  "requirementVersionId" TEXT NOT NULL,
  "trainingModuleId" TEXT NOT NULL,
  "trainingSegmentId" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "coverage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegulatoryTrainingLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingAssignment" (
  "id" TEXT NOT NULL,
  "fleetId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "trainingModuleId" TEXT NOT NULL,
  "requirementVersionId" TEXT,
  "applicabilityId" TEXT,
  "assignedByUserId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "status" "TrainingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
  "reason" TEXT,
  "startedAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "knowledgeCheckStatus" TEXT,
  "completedAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingCertification" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "fleetId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "outcome" "TrainingCertificationOutcome" NOT NULL,
  "certifiedById" TEXT,
  "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCertification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegulatoryRequirement_stableKey_key" ON "RegulatoryRequirement"("stableKey");
CREATE UNIQUE INDEX "RegulatoryRequirementVersion_requirementId_version_key" ON "RegulatoryRequirementVersion"("requirementId", "version");
CREATE UNIQUE INDEX "RegulatoryApplicability_fleetId_driverId_requirementVersionId_key" ON "RegulatoryApplicability"("fleetId", "driverId", "requirementVersionId");
CREATE UNIQUE INDEX "RegulatoryTrainingLink_requirementVersionId_trainingModuleId_trainingSegmentId_key" ON "RegulatoryTrainingLink"("requirementVersionId", "trainingModuleId", "trainingSegmentId");
CREATE UNIQUE INDEX "TrainingAssignment_id_key" ON "TrainingAssignment"("id");
CREATE UNIQUE INDEX "TrainingCertification_assignmentId_key" ON "TrainingCertification"("assignmentId");
CREATE INDEX "RegulatorySource_sourceType_agency_idx" ON "RegulatorySource"("sourceType", "agency");
CREATE INDEX "RegulatoryRequirement_sourceId_topic_idx" ON "RegulatoryRequirement"("sourceId", "topic");
CREATE INDEX "RegulatoryRequirementVersion_citation_effectiveDate_idx" ON "RegulatoryRequirementVersion"("citation", "effectiveDate");
CREATE INDEX "RegulatoryRequirementVersion_status_effectiveDate_idx" ON "RegulatoryRequirementVersion"("status", "effectiveDate");
CREATE INDEX "RegulatoryApplicability_fleetId_status_idx" ON "RegulatoryApplicability"("fleetId", "status");
CREATE INDEX "RegulatoryApplicability_requirementVersionId_status_idx" ON "RegulatoryApplicability"("requirementVersionId", "status");
CREATE INDEX "TrainingModule_category_ownership_idx" ON "TrainingModule"("category", "ownership");
CREATE INDEX "TrainingSegment_trainingModuleId_chapter_idx" ON "TrainingSegment"("trainingModuleId", "chapter");
CREATE INDEX "RegulatoryTrainingLink_trainingModuleId_isPrimary_idx" ON "RegulatoryTrainingLink"("trainingModuleId", "isPrimary");
CREATE INDEX "TrainingAssignment_fleetId_status_dueAt_idx" ON "TrainingAssignment"("fleetId", "status", "dueAt");
CREATE INDEX "TrainingAssignment_driverId_status_idx" ON "TrainingAssignment"("driverId", "status");
CREATE INDEX "TrainingAssignment_trainingModuleId_requirementVersionId_idx" ON "TrainingAssignment"("trainingModuleId", "requirementVersionId");
CREATE INDEX "TrainingCertification_fleetId_outcome_certifiedAt_idx" ON "TrainingCertification"("fleetId", "outcome", "certifiedAt");
CREATE INDEX "TrainingCertification_driverId_outcome_idx" ON "TrainingCertification"("driverId", "outcome");

ALTER TABLE "RegulatoryRequirement" ADD CONSTRAINT "RegulatoryRequirement_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RegulatorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulatoryRequirementVersion" ADD CONSTRAINT "RegulatoryRequirementVersion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "RegulatoryRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulatoryApplicability" ADD CONSTRAINT "RegulatoryApplicability_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulatoryApplicability" ADD CONSTRAINT "RegulatoryApplicability_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulatoryApplicability" ADD CONSTRAINT "RegulatoryApplicability_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "RegulatoryRequirementVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulatoryApplicability" ADD CONSTRAINT "RegulatoryApplicability_determinedByUserId_fkey" FOREIGN KEY ("determinedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingSegment" ADD CONSTRAINT "TrainingSegment_trainingModuleId_fkey" FOREIGN KEY ("trainingModuleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegulatoryTrainingLink" ADD CONSTRAINT "RegulatoryTrainingLink_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "RegulatoryRequirementVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegulatoryTrainingLink" ADD CONSTRAINT "RegulatoryTrainingLink_trainingModuleId_fkey" FOREIGN KEY ("trainingModuleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegulatoryTrainingLink" ADD CONSTRAINT "RegulatoryTrainingLink_trainingSegmentId_fkey" FOREIGN KEY ("trainingSegmentId") REFERENCES "TrainingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_trainingModuleId_fkey" FOREIGN KEY ("trainingModuleId") REFERENCES "TrainingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_requirementVersionId_fkey" FOREIGN KEY ("requirementVersionId") REFERENCES "RegulatoryRequirementVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_applicabilityId_fkey" FOREIGN KEY ("applicabilityId") REFERENCES "RegulatoryApplicability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingCertification" ADD CONSTRAINT "TrainingCertification_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrainingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingCertification" ADD CONSTRAINT "TrainingCertification_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingCertification" ADD CONSTRAINT "TrainingCertification_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingCertification" ADD CONSTRAINT "TrainingCertification_certifiedById_fkey" FOREIGN KEY ("certifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
