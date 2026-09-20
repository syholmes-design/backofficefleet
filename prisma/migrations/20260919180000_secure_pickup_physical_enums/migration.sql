-- AlterEnum
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PICKUP_PHYSICAL_RECONCILED';

-- CreateEnum
CREATE TYPE "PickupArrivalResult" AS ENUM ('MATCH', 'MISMATCH', 'UNVERIFIED', 'EXPIRED', 'UNAUTHORIZED');

-- CreateEnum
CREATE TYPE "PickupPhysicalDisposition" AS ENUM ('PENDING', 'RELEASE', 'STOP');
