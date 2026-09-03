-- CreateEnum
CREATE TYPE "LoadDeliveryStatus" AS ENUM ('DELIVERED', 'DELIVERY_EXCEPTION', 'UNDELIVERED');

-- CreateEnum
CREATE TYPE "LoadProofType" AS ENUM ('POD', 'BOL', 'PHOTO', 'GEOLOCATION', 'SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "LoadProofStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'REJECTED', 'MISSING', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "SettlementRecordStatus" AS ENUM ('DRAFT', 'CREATED', 'HELD', 'REVIEWED', 'APPROVED', 'PAID', 'CLOSED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "InvoiceRecordStatus" AS ENUM ('DRAFT', 'CREATED', 'SUBMITTED', 'EXCEPTION', 'APPROVED', 'PAID', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('RECORDED', 'APPLIED', 'FAILED');

-- AlterEnum
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'DELIVERED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'DELIVERY_EXCEPTION';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'POD_RECEIVED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'POD_VERIFIED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_CREATED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_HELD';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_REVIEWED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_APPROVED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_PAID';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'SETTLEMENT_CLOSED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_CREATED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_SUBMITTED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_EXCEPTION';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_APPROVED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_PAID';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'INVOICE_CLOSED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PAYMENT_RECORDED';

-- CreateTable
CREATE TABLE "LoadDelivery" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "status" "LoadDeliveryStatus" NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "exceptionStatus" TEXT,
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "importedAt" TIMESTAMP(3),
    "originValidationStatus" "OriginValidationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadProofOfDelivery" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "proofType" "LoadProofType" NOT NULL,
    "status" "LoadProofStatus" NOT NULL DEFAULT 'RECEIVED',
    "evidenceId" TEXT,
    "documentId" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "exceptionStatus" TEXT,
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "importedAt" TIMESTAMP(3),
    "originValidationStatus" "OriginValidationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadProofOfDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "payBasis" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reimbursements" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "SettlementRecordStatus" NOT NULL DEFAULT 'CREATED',
    "holdReason" TEXT,
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "importedAt" TIMESTAMP(3),
    "originValidationStatus" "OriginValidationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "customerId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceRecordStatus" NOT NULL DEFAULT 'CREATED',
    "submittedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "terms" TEXT,
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "importedAt" TIMESTAMP(3),
    "originValidationStatus" "OriginValidationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "status" "InvoicePaymentStatus" NOT NULL DEFAULT 'RECORDED',
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "importedAt" TIMESTAMP(3),
    "originValidationStatus" "OriginValidationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoadDelivery_fleetId_idempotencyKey_key" ON "LoadDelivery"("fleetId", "idempotencyKey");
CREATE INDEX "LoadDelivery_fleetId_loadId_idx" ON "LoadDelivery"("fleetId", "loadId");
CREATE INDEX "LoadDelivery_fleetId_sourceSystem_sourceRecordId_idx" ON "LoadDelivery"("fleetId", "sourceSystem", "sourceRecordId");
CREATE UNIQUE INDEX "LoadProofOfDelivery_fleetId_idempotencyKey_key" ON "LoadProofOfDelivery"("fleetId", "idempotencyKey");
CREATE INDEX "LoadProofOfDelivery_fleetId_loadId_idx" ON "LoadProofOfDelivery"("fleetId", "loadId");
CREATE INDEX "LoadProofOfDelivery_deliveryId_idx" ON "LoadProofOfDelivery"("deliveryId");
CREATE INDEX "LoadProofOfDelivery_fleetId_sourceSystem_sourceRecordId_idx" ON "LoadProofOfDelivery"("fleetId", "sourceSystem", "sourceRecordId");
CREATE UNIQUE INDEX "Settlement_fleetId_idempotencyKey_key" ON "Settlement"("fleetId", "idempotencyKey");
CREATE INDEX "Settlement_fleetId_loadId_idx" ON "Settlement"("fleetId", "loadId");
CREATE INDEX "Settlement_driverId_idx" ON "Settlement"("driverId");
CREATE INDEX "Settlement_fleetId_sourceSystem_sourceRecordId_idx" ON "Settlement"("fleetId", "sourceSystem", "sourceRecordId");
CREATE UNIQUE INDEX "Invoice_fleetId_idempotencyKey_key" ON "Invoice"("fleetId", "idempotencyKey");
CREATE INDEX "Invoice_fleetId_loadId_idx" ON "Invoice"("fleetId", "loadId");
CREATE INDEX "Invoice_fleetId_customerId_idx" ON "Invoice"("fleetId", "customerId");
CREATE INDEX "Invoice_fleetId_sourceSystem_sourceRecordId_idx" ON "Invoice"("fleetId", "sourceSystem", "sourceRecordId");
CREATE UNIQUE INDEX "InvoicePayment_fleetId_idempotencyKey_key" ON "InvoicePayment"("fleetId", "idempotencyKey");
CREATE INDEX "InvoicePayment_fleetId_loadId_idx" ON "InvoicePayment"("fleetId", "loadId");
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX "InvoicePayment_fleetId_sourceSystem_sourceRecordId_idx" ON "InvoicePayment"("fleetId", "sourceSystem", "sourceRecordId");

-- AddForeignKey
ALTER TABLE "LoadDelivery" ADD CONSTRAINT "LoadDelivery_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadDelivery" ADD CONSTRAINT "LoadDelivery_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadProofOfDelivery" ADD CONSTRAINT "LoadProofOfDelivery_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadProofOfDelivery" ADD CONSTRAINT "LoadProofOfDelivery_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadProofOfDelivery" ADD CONSTRAINT "LoadProofOfDelivery_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "LoadDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
