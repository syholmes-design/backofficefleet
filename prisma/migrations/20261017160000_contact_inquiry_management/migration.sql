-- WEB-006: inquiry workflow and activity history. Preserves original submission fields.
-- Apply only with isolated db execute + migrate resolve. Do not run prisma migrate deploy.

CREATE TYPE "ContactInquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CONTACTED', 'QUALIFIED', 'CLOSED');
CREATE TYPE "ContactInquiryActivityType" AS ENUM ('NOTE', 'STATUS_CHANGE', 'ASSIGNMENT', 'FOLLOW_UP');

ALTER TABLE "ContactInquiry"
  ADD COLUMN "department" TEXT,
  ADD COLUMN "status" "ContactInquiryStatus" NOT NULL DEFAULT 'NEW',
  ADD COLUMN "assignedToUserId" TEXT,
  ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ContactInquiry"
SET "lastActivityAt" = "createdAt",
    "updatedAt" = "createdAt";

CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");
CREATE INDEX "ContactInquiry_assignedToUserId_idx" ON "ContactInquiry"("assignedToUserId");
CREATE INDEX "ContactInquiry_nextFollowUpAt_idx" ON "ContactInquiry"("nextFollowUpAt");
CREATE INDEX "ContactInquiry_lastActivityAt_idx" ON "ContactInquiry"("lastActivityAt");

ALTER TABLE "ContactInquiry"
  ADD CONSTRAINT "ContactInquiry_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ContactInquiryActivity" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "activityType" "ContactInquiryActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactInquiryActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactInquiryActivity_inquiryId_createdAt_idx" ON "ContactInquiryActivity"("inquiryId", "createdAt");

ALTER TABLE "ContactInquiryActivity"
  ADD CONSTRAINT "ContactInquiryActivity_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "ContactInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactInquiryActivity"
  ADD CONSTRAINT "ContactInquiryActivity_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
