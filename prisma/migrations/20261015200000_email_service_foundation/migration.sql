-- CreateEnum
CREATE TYPE "EmailMailboxScope" AS ENUM ('PLATFORM', 'FLEET');

-- CreateEnum
CREATE TYPE "EmailMailboxLane" AS ENUM ('TRANSACTIONAL', 'CORRESPONDENCE');

-- CreateEnum
CREATE TYPE "EmailMailboxStatus" AS ENUM ('PENDING_CREDENTIALS', 'ACTIVE', 'AUTH_FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "EmailThreadStatus" AS ENUM ('OPEN', 'WAITING_ON_THEM', 'WAITING_ON_US', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmailDraftStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmailActorKind" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "EmailMailbox" (
    "id" TEXT NOT NULL,
    "scope" "EmailMailboxScope" NOT NULL,
    "fleetId" TEXT,
    "lane" "EmailMailboxLane" NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "syncFolders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approverUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipientDomainAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "EmailMailboxStatus" NOT NULL DEFAULT 'PENDING_CREDENTIALS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMailboxCredential" (
    "mailboxId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "keyVersion" TEXT NOT NULL,
    "wrappedKey" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "aad" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMailboxCredential_pkey" PRIMARY KEY ("mailboxId")
);

-- CreateTable
CREATE TABLE "EmailSyncState" (
    "mailboxId" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "uidValidity" BIGINT NOT NULL,
    "lastUid" BIGINT NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailSyncState_pkey" PRIMARY KEY ("mailboxId","folder")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailThreadStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "folder" TEXT NOT NULL,
    "imapUid" BIGINT,
    "messageIdHeader" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEntityLink" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "linkedByKind" "EmailActorKind" NOT NULL,
    "linkedById" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "threadId" TEXT,
    "inReplyTo" TEXT,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "status" "EmailDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "contentHash" TEXT NOT NULL,
    "createdByKind" "EmailActorKind" NOT NULL,
    "createdById" TEXT NOT NULL,
    "sentMessageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailApproval" (
    "draftId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "EmailApprovalDecision" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "EmailApproval_pkey" PRIMARY KEY ("draftId")
);

-- CreateTable
CREATE TABLE "EmailAgentGrant" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "scopes" TEXT[],
    "folderAllowlist" TEXT[],
    "domainAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tokenSha256" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAgentGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailMailbox_address_key" ON "EmailMailbox"("address");

-- CreateIndex
CREATE INDEX "EmailMailbox_scope_status_idx" ON "EmailMailbox"("scope", "status");

-- CreateIndex
CREATE INDEX "EmailMailbox_fleetId_idx" ON "EmailMailbox"("fleetId");

-- CreateIndex
CREATE INDEX "EmailThread_mailboxId_lastMessageAt_idx" ON "EmailThread"("mailboxId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailThread_mailboxId_threadKey_key" ON "EmailThread"("mailboxId", "threadKey");

-- CreateIndex
CREATE INDEX "EmailMessage_mailboxId_receivedAt_idx" ON "EmailMessage"("mailboxId", "receivedAt");

-- CreateIndex
CREATE INDEX "EmailMessage_threadId_receivedAt_idx" ON "EmailMessage"("threadId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_mailboxId_messageIdHeader_key" ON "EmailMessage"("mailboxId", "messageIdHeader");

-- CreateIndex
CREATE INDEX "EmailEntityLink_entityType_entityId_idx" ON "EmailEntityLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEntityLink_threadId_entityType_entityId_key" ON "EmailEntityLink"("threadId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "EmailDraft_mailboxId_status_idx" ON "EmailDraft"("mailboxId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAgentGrant_tokenSha256_key" ON "EmailAgentGrant"("tokenSha256");

-- CreateIndex
CREATE INDEX "EmailAgentGrant_mailboxId_idx" ON "EmailAgentGrant"("mailboxId");

-- AddForeignKey
ALTER TABLE "EmailMailbox" ADD CONSTRAINT "EmailMailbox_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMailboxCredential" ADD CONSTRAINT "EmailMailboxCredential_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSyncState" ADD CONSTRAINT "EmailSyncState_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEntityLink" ADD CONSTRAINT "EmailEntityLink_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailApproval" ADD CONSTRAINT "EmailApproval_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "EmailDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailApproval" ADD CONSTRAINT "EmailApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAgentGrant" ADD CONSTRAINT "EmailAgentGrant_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAgentGrant" ADD CONSTRAINT "EmailAgentGrant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Hand-written integrity rules (not expressible in Prisma schema).
-- A FLEET mailbox must name its fleet; a PLATFORM mailbox must not.
ALTER TABLE "EmailMailbox" ADD CONSTRAINT "EmailMailbox_scope_fleet_check"
  CHECK (("scope" = 'FLEET' AND "fleetId" IS NOT NULL) OR ("scope" = 'PLATFORM' AND "fleetId" IS NULL));

-- Agents can never be granted send, approve or admin authority.
ALTER TABLE "EmailAgentGrant" ADD CONSTRAINT "EmailAgentGrant_scopes_check"
  CHECK ("scopes" <@ ARRAY['threads:read', 'drafts:write', 'approvals:request', 'links:write']::TEXT[]);
