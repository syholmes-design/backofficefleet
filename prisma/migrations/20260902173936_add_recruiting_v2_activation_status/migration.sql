-- CreateEnum
CREATE TYPE "RecruitingV2ActivationStatus" AS ENUM ('PENDING', 'READY', 'ACTIVE');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "activationStatus" "RecruitingV2ActivationStatus" NOT NULL DEFAULT 'PENDING';
