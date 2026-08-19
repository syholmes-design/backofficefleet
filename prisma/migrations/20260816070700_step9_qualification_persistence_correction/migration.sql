-- CreateEnum
CREATE TYPE "QualificationDisposition" AS ENUM (
    'QUALIFIED',
    'CONDITIONALLY_QUALIFIED',
    'NOT_QUALIFIED',
    'PENDING_REVIEW'
);

-- AlterTable
ALTER TABLE "DriverQualificationSnapshot"
    ADD COLUMN "policyVersion" TEXT,
    ADD COLUMN "status_new" "QualificationDisposition";

-- Backfill existing development snapshots using the persisted Step 9 summary text first,
-- then the legacy readiness-shaped status only as a fallback when no summary is available.
UPDATE "DriverQualificationSnapshot"
SET
    "policyVersion" = 'bof-step9-qualification-v1',
    "status_new" = CASE
        WHEN COALESCE("summary", '') LIKE 'Driver satisfies the current qualification rules.%' THEN 'QUALIFIED'::"QualificationDisposition"
        WHEN COALESCE("summary", '') LIKE 'Driver is conditionally qualified under the current policy.%' THEN 'CONDITIONALLY_QUALIFIED'::"QualificationDisposition"
        WHEN COALESCE("summary", '') LIKE 'Qualification is pending review because evidence requires additional verification.%' THEN 'PENDING_REVIEW'::"QualificationDisposition"
        WHEN COALESCE("summary", '') LIKE 'Driver does not satisfy the current qualification rules.%' THEN 'NOT_QUALIFIED'::"QualificationDisposition"
        WHEN "status" = 'READY' THEN 'QUALIFIED'::"QualificationDisposition"
        WHEN "status" = 'CONDITIONAL' THEN 'CONDITIONALLY_QUALIFIED'::"QualificationDisposition"
        WHEN "status" = 'NOT_READY' THEN 'NOT_QUALIFIED'::"QualificationDisposition"
        ELSE 'PENDING_REVIEW'::"QualificationDisposition"
    END;

ALTER TABLE "DriverQualificationSnapshot"
    ALTER COLUMN "policyVersion" SET NOT NULL;

ALTER TABLE "DriverQualificationSnapshot"
    DROP COLUMN "status";

ALTER TABLE "DriverQualificationSnapshot"
    RENAME COLUMN "status_new" TO "status";

ALTER TABLE "DriverQualificationSnapshot"
    ALTER COLUMN "status" SET NOT NULL,
    ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW';
