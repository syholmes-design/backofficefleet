-- CreateEnum
CREATE TYPE "Stage0EnforcementMode" AS ENUM ('ENFORCE', 'OBSERVE');

-- AlterTable
ALTER TABLE "DispatchAssignment" ADD COLUMN     "effectiveAllowed" BOOLEAN,
ADD COLUMN     "enforcementMetadata" JSONB,
ADD COLUMN     "enforcementMode" "Stage0EnforcementMode",
ADD COLUMN     "enforcementOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enforcementPolicyVersion" TEXT,
ADD COLUMN     "shadowAllowed" BOOLEAN;

-- AlterTable
ALTER TABLE "DispatchRelease" ADD COLUMN     "effectiveAllowed" BOOLEAN,
ADD COLUMN     "enforcementMetadata" JSONB,
ADD COLUMN     "enforcementMode" "Stage0EnforcementMode",
ADD COLUMN     "enforcementOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enforcementPolicyVersion" TEXT,
ADD COLUMN     "shadowAllowed" BOOLEAN;

-- CreateTable
CREATE TABLE "Stage0EnforcementSetting" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "mode" "Stage0EnforcementMode" NOT NULL,
    "reason" TEXT NOT NULL,
    "configuredByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage0EnforcementSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage0EnforcementModeChange" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "previousMode" "Stage0EnforcementMode" NOT NULL,
    "newMode" "Stage0EnforcementMode" NOT NULL,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "actorRoleCode" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stage0EnforcementModeChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage0EnforcementSetting_fleetId_key" ON "Stage0EnforcementSetting"("fleetId");

-- CreateIndex
CREATE INDEX "Stage0EnforcementModeChange_fleetId_createdAt_idx" ON "Stage0EnforcementModeChange"("fleetId", "createdAt");

-- AddForeignKey
ALTER TABLE "Stage0EnforcementSetting" ADD CONSTRAINT "Stage0EnforcementSetting_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage0EnforcementSetting" ADD CONSTRAINT "Stage0EnforcementSetting_configuredByUserId_fkey" FOREIGN KEY ("configuredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage0EnforcementModeChange" ADD CONSTRAINT "Stage0EnforcementModeChange_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage0EnforcementModeChange" ADD CONSTRAINT "Stage0EnforcementModeChange_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

