-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ON_HOLD', 'CANCELLED', 'FILLED');

-- CreateEnum
CREATE TYPE "RequisitionRecruitingPipelineState" AS ENUM ('NOT_OPEN', 'READY_FOR_RECRUITING');

-- CreateEnum
CREATE TYPE "RequisitionApprovalRole" AS ENUM ('REQUESTING_MANAGER', 'FLEET_SAFETY_DIRECTOR', 'FLEET_OWNER_GM', 'BOF_ACCOUNT_MANAGER', 'BOF_HR_REVIEW');

-- CreateEnum
CREATE TYPE "RequisitionApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'NOT_APPROVED');

-- CreateEnum
CREATE TYPE "RequisitionSignatureCaptureKind" AS ENUM ('FORM_FIELD', 'NOT_CAPTURED');

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "publicNumber" TEXT NOT NULL,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "recruitingPipelineState" "RequisitionRecruitingPipelineState" NOT NULL DEFAULT 'NOT_OPEN',
    "statusBeforeHold" "RequisitionStatus",
    "createdByUserId" TEXT NOT NULL,
    "requestingManagerUserId" TEXT,
    "dateSubmitted" TIMESTAMP(3),
    "targetStartDate" TIMESTAMP(3),
    "numberOfPositions" INTEGER NOT NULL DEFAULT 1,
    "requestingCarrierName" TEXT,
    "usdot" TEXT,
    "mcNumber" TEXT,
    "terminalDomicile" TEXT,
    "statesOfOperation" TEXT,
    "requestingManagerName" TEXT,
    "department" TEXT,
    "supervisor" TEXT,
    "positionClassification" TEXT,
    "employmentClassification" TEXT,
    "flsaClassification" TEXT,
    "urgency" TEXT,
    "positionTitle" TEXT,
    "reportingStructure" TEXT,
    "workLocation" TEXT,
    "homeTimePattern" TEXT,
    "routeLane" TEXT,
    "borderCrossings" BOOLEAN,
    "typicalNightsAway" TEXT,
    "equipmentType" TEXT,
    "soloTeamOperation" TEXT,
    "cdlClass" TEXT,
    "endorsements" TEXT,
    "experienceRequirements" TEXT,
    "minimumAge" INTEGER,
    "mvrSafetyRequirements" TEXT,
    "pspRequired" BOOLEAN,
    "clearinghouseRequired" BOOLEAN,
    "medicalRequired" BOOLEAN,
    "drugTestingRequired" BOOLEAN,
    "backgroundCheckRequired" BOOLEAN,
    "tsaRequired" BOOLEAN,
    "compensationStructure" TEXT,
    "payRange" TEXT,
    "accessorialPay" TEXT,
    "signOnBonus" TEXT,
    "performanceBonus" TEXT,
    "benefits" TEXT,
    "positionSummary" TEXT,
    "essentialFunctions" TEXT,
    "physicalRequirements" TEXT,
    "schedule" TEXT,
    "hosCycle" TEXT,
    "recruitingInstructions" TEXT,
    "sourcingChannels" TEXT,
    "screeningRequirements" TEXT,
    "applicationRouting" TEXT,
    "targetFillMetrics" TEXT,
    "budgetStatus" TEXT,
    "headcount" TEXT,
    "financialJustification" TEXT,
    "estimatedRecruitingCost" TEXT,
    "exceptions" TEXT,
    "bofHrUse" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "heldAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),
    "recruitingOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisitionApproval" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "approvalRole" "RequisitionApprovalRole" NOT NULL,
    "decision" "RequisitionApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "reviewerUserId" TEXT,
    "reviewerName" TEXT,
    "notes" TEXT,
    "signatureName" TEXT,
    "signatureCaptureKind" "RequisitionSignatureCaptureKind" NOT NULL DEFAULT 'NOT_CAPTURED',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequisitionApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Requisition_fleetId_publicNumber_key" ON "Requisition"("fleetId", "publicNumber");
CREATE INDEX "Requisition_fleetId_status_idx" ON "Requisition"("fleetId", "status");
CREATE INDEX "Requisition_fleetId_createdAt_idx" ON "Requisition"("fleetId", "createdAt");
CREATE INDEX "Requisition_status_recruitingPipelineState_idx" ON "Requisition"("status", "recruitingPipelineState");
CREATE UNIQUE INDEX "RequisitionApproval_requisitionId_approvalRole_key" ON "RequisitionApproval"("requisitionId", "approvalRole");
CREATE INDEX "RequisitionApproval_requisitionId_decision_idx" ON "RequisitionApproval"("requisitionId", "decision");

ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_requestingManagerUserId_fkey" FOREIGN KEY ("requestingManagerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RequisitionApproval" ADD CONSTRAINT "RequisitionApproval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequisitionApproval" ADD CONSTRAINT "RequisitionApproval_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
