import { createHash, randomBytes } from "crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

const CLAIM_TOKEN_BYTES = 32;
const CLAIM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

type ClaimAction = "driver.claim.initiated" | "driver.claim.completed" | "driver.claim.failed" | "driver.claim.revoked" | "unauthorized claim attempt";
type ClaimAuditAction = "CREATED" | "UPDATED" | "ACCESS_DENIED";

export type DriverClaimStatus = "UNLINKED" | "PENDING" | "LINKED";

export type DriverClaimStatusResult =
  | { status: "UNLINKED" | "PENDING" }
  | { status: "LINKED"; driverId: string; fleetId: string };

export type DriverClaimInitiationResult = {
  claimToken: string;
  expiresAt: Date;
};

export type DriverClaimCompletionResult = {
  status: "LINKED";
  driverId: string;
  fleetId: string;
};

export type DriverClaimRevocationResult = {
  status: "REVOKED";
};

type ClaimTx = Prisma.TransactionClient & {
  driverClaimToken: Prisma.DriverClaimTokenDelegate;
  auditEvent: Prisma.AuditEventDelegate;
};

type ClaimPrismaClient = PrismaClient & {
  driverClaimToken: Prisma.DriverClaimTokenDelegate;
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createRawClaimToken() {
  return randomBytes(CLAIM_TOKEN_BYTES).toString("base64url");
}

function claimConflict(message: string) {
  return Object.assign(new Error(message), { statusCode: 409 });
}

function invalidClaim(message: string) {
  return Object.assign(new Error(message), { statusCode: 422 });
}

function claimNotFound(message: string) {
  return Object.assign(new Error(message), { statusCode: 404 });
}

function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

async function writeClaimAudit(
  tx: ClaimTx | null,
  input: {
    actorId?: string | null;
    actorEmail?: string | null;
    fleetId?: string | null;
    entityId?: string | null;
    action: ClaimAction;
    auditAction: ClaimAuditAction;
    details: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
) {
  const details = {
    event: input.action,
    ...input.details,
  };
  const metadata = input.metadata ?? {};
  const data = {
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    tenantId: input.fleetId ?? null,
    action: input.auditAction,
    entityType: "Driver",
    entityId: input.entityId ?? null,
    details,
    metadata,
  };

  if (tx) {
    await tx.auditEvent.create({
      data: {
        ...data,
        details: details as Prisma.InputJsonValue,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    return;
  }

  await createAuditRecord(data);
}

async function logUnauthorizedClaimAttempt(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string | null,
  entityId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: sessionUser?.id ?? null,
    actorEmail: sessionUser?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "Driver",
    entityId,
    details: { event: "unauthorized claim attempt", reason },
    metadata: { source: "driver-claim-service" },
  });
}

export async function initiateDriverClaim(input: {
  sessionUser: SessionUserLike | null | undefined;
  driverId: string;
}) {
  requireSessionUser(input.sessionUser);

  const claimPrisma = prisma as ClaimPrismaClient;
  const actorId = input.sessionUser!.id!;
  const actorEmail = input.sessionUser!.email ?? null;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CLAIM_TOKEN_TTL_MS);

  try {
    return await claimPrisma.$transaction(async (tx) => {
      const claimTx = tx as ClaimTx;
      const driver = await tx.driver.findUnique({
        where: { id: input.driverId },
        select: { id: true, fleetId: true, userId: true },
      });

      if (!driver) {
        throw claimNotFound("Driver not found");
      }

      const access = await authorizedFleetAccess(input.sessionUser, driver.fleetId);
      if (!access.allowed) {
        await logUnauthorizedClaimAttempt(input.sessionUser, driver.fleetId, driver.id, access.reason ?? "TENANT_ACCESS_DENIED");
        throw claimNotFound("Driver not found");
      }

      const linkedDriver = await tx.driver.findUnique({
        where: { userId: actorId },
        select: { id: true },
      });
      if (linkedDriver) {
        throw claimConflict("User already linked");
      }

      if (driver.userId) {
        throw claimConflict("Driver already linked");
      }

      const revoked = await claimTx.driverClaimToken.updateMany({
        where: {
          driverId: driver.id,
          claimedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });

      const rawToken = createRawClaimToken();
      const tokenHash = sha256Hex(rawToken);

      const token = await claimTx.driverClaimToken.create({
        data: {
          driverId: driver.id,
          fleetId: driver.fleetId,
          tokenHash,
          expiresAt,
          createdByUserId: actorId,
        },
        select: {
          id: true,
        },
      });

      if (revoked.count > 0) {
        await writeClaimAudit(claimTx, {
          actorId,
          actorEmail,
          fleetId: driver.fleetId,
          entityId: driver.id,
          action: "driver.claim.revoked",
          auditAction: "UPDATED",
          details: {
            outcome: "SUCCESS",
            reason: "REPLACED_ACTIVE_TOKEN",
            tokenId: token.id,
          },
          metadata: { source: "driver-claim-service" },
        });
      }

      await writeClaimAudit(claimTx, {
        actorId,
        actorEmail,
        fleetId: driver.fleetId,
        entityId: driver.id,
        action: "driver.claim.initiated",
        auditAction: "CREATED",
        details: {
          outcome: "SUCCESS",
          expiresAt: expiresAt.toISOString(),
          tokenId: token.id,
        },
        metadata: { source: "driver-claim-service" },
      });

      return {
        claimToken: rawToken,
        expiresAt,
      };
    });
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      await createAuditRecord({
        actorId,
        actorEmail,
        tenantId: null,
        action: "ACCESS_DENIED",
        entityType: "Driver",
        entityId: input.driverId,
        details: { event: "driver.claim.failed", reason: "ACTIVE_CLAIM_CONFLICT" },
        metadata: { source: "driver-claim-service" },
      });
      throw claimConflict("Active claim conflict");
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = Number((error as { statusCode?: number }).statusCode) || 500;
      const message = error instanceof Error ? error.message : "Unknown error";
      if (statusCode !== 500) {
        await createAuditRecord({
          actorId,
          actorEmail,
          tenantId: null,
          action: "ACCESS_DENIED",
          entityType: "Driver",
          entityId: input.driverId,
          details: { event: "driver.claim.failed", reason: message, operation: "initiate" },
          metadata: { source: "driver-claim-service" },
        });
      }
      throw error;
    }

    throw error;
  }
}

export async function completeDriverClaim(input: {
  sessionUser: SessionUserLike | null | undefined;
  claimToken: string;
}): Promise<DriverClaimCompletionResult> {
  requireSessionUser(input.sessionUser);

  const claimPrisma = prisma as ClaimPrismaClient;
  const actorId = input.sessionUser!.id!;
  const actorEmail = input.sessionUser!.email ?? null;
  const tokenHash = sha256Hex(input.claimToken);
  const now = new Date();

  try {
    return await claimPrisma.$transaction(async (tx) => {
      const claimTx = tx as ClaimTx;
      const linkedDriver = await tx.driver.findUnique({
        where: { userId: actorId },
        select: { id: true },
      });
      if (linkedDriver) {
        throw claimConflict("User already linked");
      }

      const token = await claimTx.driverClaimToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          driverId: true,
          fleetId: true,
          expiresAt: true,
          claimedAt: true,
          revokedAt: true,
          createdByUserId: true,
          driver: {
            select: { id: true, fleetId: true, userId: true },
          },
        },
      });

      if (!token) {
        throw invalidClaim("Invalid token");
      }

      if (token.revokedAt) {
        throw invalidClaim("Revoked token");
      }

      if (token.claimedAt) {
        throw claimConflict("Token already claimed");
      }

      if (token.expiresAt.getTime() <= now.getTime()) {
        throw invalidClaim("Expired token");
      }

      if (!token.driver || token.driver.fleetId !== token.fleetId || token.driver.id !== token.driverId) {
        throw invalidClaim("Invalid token");
      }

      if (token.driver.userId) {
        throw claimConflict("Driver already linked");
      }

      const claimResult = await claimTx.driverClaimToken.updateMany({
        where: {
          id: token.id,
          claimedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { claimedAt: now },
      });

      if (claimResult.count !== 1) {
        const refreshed = await claimTx.driverClaimToken.findUnique({
          where: { tokenHash },
          select: { claimedAt: true, revokedAt: true, expiresAt: true },
        });

        if (!refreshed) {
          throw invalidClaim("Invalid token");
        }
        if (refreshed.revokedAt) {
          throw invalidClaim("Revoked token");
        }
        if (refreshed.claimedAt) {
          throw claimConflict("Token already claimed");
        }
        if (refreshed.expiresAt.getTime() <= now.getTime()) {
          throw invalidClaim("Expired token");
        }

        throw claimConflict("Claim conflict");
      }

      try {
        const ownershipResult = await tx.driver.updateMany({
          where: {
            id: token.driverId,
            userId: null,
          },
          data: {
            userId: actorId,
          },
        });

        if (ownershipResult.count !== 1) {
          const refreshedDriver = await tx.driver.findUnique({
            where: { id: token.driverId },
            select: { userId: true },
          });
          if (refreshedDriver?.userId) {
            throw claimConflict("Driver already linked");
          }
          throw claimConflict("Claim conflict");
        }
      } catch (error) {
        if (isKnownPrismaError(error, "P2002")) {
          throw claimConflict("User already linked");
        }
        throw error;
      }

      await writeClaimAudit(claimTx, {
        actorId,
        actorEmail,
        fleetId: token.fleetId,
        entityId: token.driverId,
        action: "driver.claim.completed",
        auditAction: "UPDATED",
        details: {
          outcome: "SUCCESS",
          tokenId: token.id,
        },
        metadata: { source: "driver-claim-service" },
      });

      return {
        status: "LINKED",
        driverId: token.driverId,
        fleetId: token.fleetId,
      };
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const reasonCode =
        message === "Token already claimed" || message === "Driver already linked" || message === "User already linked" || message === "Claim conflict"
          ? message.replace(/\s+/g, "_").toUpperCase()
          : message.replace(/\s+/g, "_").toUpperCase();

      await createAuditRecord({
        actorId,
        actorEmail,
        tenantId: null,
        action: "ACCESS_DENIED",
        entityType: "Driver",
        entityId: null,
        details: { event: "driver.claim.failed", reason: reasonCode, operation: "complete" },
        metadata: { source: "driver-claim-service" },
      });

      throw error;
    }

    throw error;
  }
}

export async function getDriverClaimStatus(input: {
  sessionUser: SessionUserLike | null | undefined;
}): Promise<DriverClaimStatusResult> {
  requireSessionUser(input.sessionUser);

  const actorId = input.sessionUser!.id!;

  const linkedDriver = await prisma.driver.findUnique({
    where: { userId: actorId },
    select: { id: true, fleetId: true },
  });

  if (linkedDriver) {
    return {
      status: "LINKED",
      driverId: linkedDriver.id,
      fleetId: linkedDriver.fleetId,
    };
  }

  const activeIssuedToken = await prisma.driverClaimToken.findFirst({
    where: {
      createdByUserId: actorId,
      claimedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
    orderBy: [{ createdAt: "desc" }],
  });

  if (activeIssuedToken) {
    return { status: "PENDING" };
  }

  return { status: "UNLINKED" };
}

export async function revokeDriverClaim(input: {
  sessionUser: SessionUserLike | null | undefined;
  driverId: string;
}): Promise<DriverClaimRevocationResult> {
  requireSessionUser(input.sessionUser);

  const claimPrisma = prisma as ClaimPrismaClient;
  const actorId = input.sessionUser!.id!;
  const actorEmail = input.sessionUser!.email ?? null;

  try {
    return await claimPrisma.$transaction(async (tx) => {
      const claimTx = tx as ClaimTx;
      const driver = await tx.driver.findUnique({
        where: { id: input.driverId },
        select: { id: true, fleetId: true },
      });

      if (!driver) {
        throw claimNotFound("Driver not found");
      }

      const access = await authorizedFleetAccess(input.sessionUser, driver.fleetId);
      if (!access.allowed) {
        await logUnauthorizedClaimAttempt(input.sessionUser, driver.fleetId, driver.id, access.reason ?? "TENANT_ACCESS_DENIED");
        throw claimNotFound("Driver not found");
      }

      const activeToken = await claimTx.driverClaimToken.findFirst({
        where: {
          driverId: driver.id,
          claimedAt: null,
          revokedAt: null,
        },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true },
      });

      if (!activeToken) {
        throw claimNotFound("Claim token not found");
      }

      const revoked = await claimTx.driverClaimToken.updateMany({
        where: {
          id: activeToken.id,
          claimedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      if (revoked.count !== 1) {
        throw claimConflict("Claim conflict");
      }

      await writeClaimAudit(claimTx, {
        actorId,
        actorEmail,
        fleetId: driver.fleetId,
        entityId: driver.id,
        action: "driver.claim.revoked",
        auditAction: "UPDATED",
        details: {
          outcome: "SUCCESS",
          tokenId: activeToken.id,
        },
        metadata: { source: "driver-claim-service" },
      });

      return { status: "REVOKED" };
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await createAuditRecord({
        actorId,
        actorEmail,
        tenantId: null,
        action: "ACCESS_DENIED",
        entityType: "Driver",
        entityId: input.driverId,
        details: { event: "driver.claim.failed", reason: message.replace(/\s+/g, "_").toUpperCase(), operation: "revoke" },
        metadata: { source: "driver-claim-service" },
      });
      throw error;
    }

    throw error;
  }
}
