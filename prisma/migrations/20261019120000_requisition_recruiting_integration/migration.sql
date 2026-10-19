-- CreateEnum
CREATE TYPE "RecruitingCandidateDisposition" AS ENUM ('ACTIVE', 'REJECTED', 'WITHDRAWN');
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
ALTER TYPE "RequisitionRecruitingPipelineState" ADD VALUE 'RECRUITING';
ALTER TYPE "RequisitionRecruitingPipelineState" ADD VALUE 'PARTIALLY_FILLED';
ALTER TYPE "RequisitionRecruitingPipelineState" ADD VALUE 'FILLED';
-- AlterEnum
ALTER TYPE "RecruitingV2Recommendation" ADD VALUE 'ADVANCE_WITH_CONDITIONS';
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "fleetId" TEXT,
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requisitionId" TEXT;
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "dispositionAt" TIMESTAMP(3),
ADD COLUMN     "dispositionByUserId" TEXT,
ADD COLUMN     "dispositionNotes" TEXT,
ADD COLUMN     "dispositionReason" TEXT,
ADD COLUMN     "dispositionStatus" "RecruitingCandidateDisposition" NOT NULL DEFAULT 'ACTIVE';
-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "questionnaire" JSONB;
-- CreateIndex
CREATE UNIQUE INDEX "Position_requisitionId_key" ON "Position"("requisitionId");
-- CreateIndex
CREATE INDEX "Position_fleetId_idx" ON "Position"("fleetId");
-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
