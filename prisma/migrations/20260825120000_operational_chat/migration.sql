-- CreateEnum
CREATE TYPE "OperationalChatThreadType" AS ENUM ('LOAD_THREAD', 'EXCEPTION_THREAD', 'DOCUMENT_THREAD', 'DRIVER_THREAD', 'CUSTOMER_THREAD', 'SETTLEMENT_THREAD', 'SAFETY_COMPLIANCE_THREAD', 'MAINTENANCE_THREAD', 'GENERAL_INTERNAL_THREAD');

-- CreateEnum
CREATE TYPE "OperationalChatVisibility" AS ENUM ('INTERNAL', 'CUSTOMER_VISIBLE');

-- CreateEnum
CREATE TYPE "OperationalChatStatus" AS ENUM ('OPEN', 'WAITING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "OperationalChatMessageState" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "OperationalChatParticipantRole" AS ENUM ('FLEET_OWNER', 'FLEET_MANAGER', 'DISPATCH', 'DRIVER', 'SAFETY', 'FINANCE', 'BOF_OPERATIONS', 'BOF_ADMINISTRATION', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OperationalChatRecordType" AS ENUM ('LOAD', 'DRIVER', 'EXCEPTION', 'DOCUMENT_REQUEST', 'PROOF', 'SETTLEMENT', 'SAFETY_EVENT', 'COMPLIANCE_ISSUE', 'MAINTENANCE_ISSUE', 'CARRIER', 'CUSTOMER');

-- CreateTable
CREATE TABLE "OperationalChatThread" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "OperationalChatThreadType" NOT NULL,
    "visibility" "OperationalChatVisibility" NOT NULL DEFAULT 'INTERNAL',
    "status" "OperationalChatStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "recordType" "OperationalChatRecordType",
    "recordId" TEXT,
    "ownerId" TEXT,
    "nextAction" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalChatThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalChatParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OperationalChatParticipantRole" NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalChatParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "OperationalChatVisibility" NOT NULL,
    "state" "OperationalChatMessageState" NOT NULL DEFAULT 'SENT',
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "OperationalChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalChatMessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalChatMessageRead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalChatCitation" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordType" "OperationalChatRecordType" NOT NULL,
    "recordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snapshot" JSONB,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalChatCitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalChatNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "messageId" TEXT,
    "kind" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalChatNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalChatParticipant_threadId_userId_key" ON "OperationalChatParticipant"("threadId", "userId");
CREATE UNIQUE INDEX "OperationalChatMessageRead_messageId_userId_key" ON "OperationalChatMessageRead"("messageId", "userId");
CREATE INDEX "OperationalChatThread_tenantId_updatedAt_idx" ON "OperationalChatThread"("tenantId", "updatedAt");
CREATE INDEX "OperationalChatThread_tenantId_type_status_idx" ON "OperationalChatThread"("tenantId", "type", "status");
CREATE INDEX "OperationalChatThread_tenantId_recordType_recordId_idx" ON "OperationalChatThread"("tenantId", "recordType", "recordId");
CREATE INDEX "OperationalChatParticipant_tenantId_userId_idx" ON "OperationalChatParticipant"("tenantId", "userId");
CREATE INDEX "OperationalChatMessage_threadId_createdAt_idx" ON "OperationalChatMessage"("threadId", "createdAt");
CREATE INDEX "OperationalChatMessage_tenantId_visibility_createdAt_idx" ON "OperationalChatMessage"("tenantId", "visibility", "createdAt");
CREATE INDEX "OperationalChatMessageRead_tenantId_userId_readAt_idx" ON "OperationalChatMessageRead"("tenantId", "userId", "readAt");
CREATE INDEX "OperationalChatCitation_tenantId_recordType_recordId_idx" ON "OperationalChatCitation"("tenantId", "recordType", "recordId");
CREATE INDEX "OperationalChatCitation_threadId_createdAt_idx" ON "OperationalChatCitation"("threadId", "createdAt");
CREATE INDEX "OperationalChatNotification_tenantId_userId_readAt_createdAt_idx" ON "OperationalChatNotification"("tenantId", "userId", "readAt", "createdAt");
CREATE INDEX "OperationalChatNotification_threadId_createdAt_idx" ON "OperationalChatNotification"("threadId", "createdAt");

ALTER TABLE "OperationalChatThread" ADD CONSTRAINT "OperationalChatThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatThread" ADD CONSTRAINT "OperationalChatThread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatThread" ADD CONSTRAINT "OperationalChatThread_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalChatParticipant" ADD CONSTRAINT "OperationalChatParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "OperationalChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalChatParticipant" ADD CONSTRAINT "OperationalChatParticipant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatParticipant" ADD CONSTRAINT "OperationalChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessage" ADD CONSTRAINT "OperationalChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "OperationalChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessage" ADD CONSTRAINT "OperationalChatMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessage" ADD CONSTRAINT "OperationalChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessage" ADD CONSTRAINT "OperationalChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "OperationalChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessageRead" ADD CONSTRAINT "OperationalChatMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OperationalChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessageRead" ADD CONSTRAINT "OperationalChatMessageRead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatMessageRead" ADD CONSTRAINT "OperationalChatMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalChatCitation" ADD CONSTRAINT "OperationalChatCitation_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "OperationalChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalChatCitation" ADD CONSTRAINT "OperationalChatCitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatNotification" ADD CONSTRAINT "OperationalChatNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalChatNotification" ADD CONSTRAINT "OperationalChatNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
