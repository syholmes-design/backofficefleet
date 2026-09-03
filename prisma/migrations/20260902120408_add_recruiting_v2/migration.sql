-- CreateEnum
CREATE TYPE "RecruitingV2CandidateStage" AS ENUM ('APPLICANT', 'QUALIFICATION', 'INTERVIEW', 'DOCUMENT_REVIEW', 'COMPLIANCE', 'OFFER', 'ONBOARDING', 'DRIVER_ACTIVATION_READY', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "RecruitingV2WorkflowStatus" AS ENUM ('READY', 'PENDING', 'BLOCKED', 'NOT_PROVIDED', 'NOT_APPLICABLE', 'UNDER_REVIEW', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RecruitingV2InterviewStatus" AS ENUM ('NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED', 'NEEDS_FOLLOW_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecruitingV2Recommendation" AS ENUM ('ADVANCE', 'HOLD_FOR_REVIEW', 'DO_NOT_ADVANCE', 'PENDING');

-- DropForeignKey
ALTER TABLE "TrainingAssignment" DROP CONSTRAINT "TrainingAssignment_applicabilityId_fkey";

-- DropIndex
DROP INDEX "TrainingAssignment_id_key";

-- AlterTable
ALTER TABLE "DriverIntakeRequirement" ADD COLUMN     "actionStatus" TEXT,
ADD COLUMN     "advanceWindowDays" INTEGER,
ADD COLUMN     "affirmationStatus" TEXT,
ADD COLUMN     "affirmationTimestamp" TIMESTAMP(3),
ADD COLUMN     "affirmedBy" TEXT,
ADD COLUMN     "evidenceReference" TEXT,
ADD COLUMN     "requiredAction" TEXT,
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "resolutionStatus" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "triggerDate" TIMESTAMP(3),
ADD COLUMN     "verificationStatus" TEXT,
ADD COLUMN     "verificationTimestamp" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "positionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "homeTerminal" TEXT NOT NULL,
    "freightType" TEXT NOT NULL,
    "primaryLanes" TEXT NOT NULL,
    "compensation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "candidateCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "homeLocation" TEXT NOT NULL,
    "cdlClass" TEXT NOT NULL,
    "cdlState" TEXT NOT NULL,
    "cdlNumberMasked" TEXT NOT NULL,
    "applicationStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "qualificationStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "documentReviewStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "complianceStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "offerStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
    "onboardingStatus" "RecruitingV2WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "activationStage" "RecruitingV2CandidateStage" NOT NULL DEFAULT 'APPLICANT',
    "applicationSummary" JSONB NOT NULL,
    "qualificationSummary" JSONB NOT NULL,
    "documentRequirements" JSONB NOT NULL,
    "complianceSummary" JSONB NOT NULL,
    "offerSummary" JSONB,
    "onboardingSummary" JSONB NOT NULL,
    "auditTrail" JSONB NOT NULL,
    "positionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "interviewCode" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "interviewType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "RecruitingV2InterviewStatus" NOT NULL DEFAULT 'NOT_SCHEDULED',
    "score" INTEGER,
    "recommendation" "RecruitingV2Recommendation" NOT NULL DEFAULT 'PENDING',
    "interviewers" JSONB NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "notes" TEXT,
    "auditTrail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_positionCode_key" ON "Position"("positionCode");

-- CreateIndex
CREATE INDEX "Position_status_idx" ON "Position"("status");

-- CreateIndex
CREATE INDEX "Position_homeTerminal_idx" ON "Position"("homeTerminal");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_candidateCode_key" ON "Candidate"("candidateCode");

-- CreateIndex
CREATE INDEX "Candidate_candidateCode_idx" ON "Candidate"("candidateCode");

-- CreateIndex
CREATE INDEX "Candidate_positionId_idx" ON "Candidate"("positionId");

-- CreateIndex
CREATE INDEX "Candidate_activationStage_idx" ON "Candidate"("activationStage");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_interviewCode_key" ON "Interview"("interviewCode");

-- CreateIndex
CREATE INDEX "Interview_candidateId_idx" ON "Interview"("candidateId");

-- CreateIndex
CREATE INDEX "Interview_positionId_idx" ON "Interview"("positionId");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "DriverIntakeRequirement_driverIntakeId_actionStatus_idx" ON "DriverIntakeRequirement"("driverIntakeId", "actionStatus");

-- CreateIndex
CREATE INDEX "DriverIntakeRequirement_triggerDate_idx" ON "DriverIntakeRequirement"("triggerDate");

-- CreateIndex
CREATE INDEX "EmployerDocumentMaterialization_authorizationId_idx" ON "EmployerDocumentMaterialization"("authorizationId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "OperationalChatNotification_tenantId_userId_readAt_createdAt_id" RENAME TO "OperationalChatNotification_tenantId_userId_readAt_createdA_idx";

-- RenameIndex
ALTER INDEX "RegulatoryApplicability_fleetId_driverId_requirementVersionId_k" RENAME TO "RegulatoryApplicability_fleetId_driverId_requirementVersion_key";

-- RenameIndex
ALTER INDEX "RegulatoryTrainingLink_requirementVersionId_trainingModuleId_tr" RENAME TO "RegulatoryTrainingLink_requirementVersionId_trainingModuleI_key";
