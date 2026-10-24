import { OperationalChatParticipantRole, Prisma, type Stage0EnforcementMode } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { SessionUserLike } from "@/lib/services/intakeService";
import {
  observeAvailability,
  resolveStage0EnforcementMode,
  STAGE0_ENFORCEMENT_POLICY_VERSION,
} from "@/lib/services/stage0EnforcementPolicy";

/**
 * Stage 0 D-2 — who may read and change the movement enforcement mode (policy §3).
 *
 *  - Change: ACTIVE BOF_OPERATIONS or BOF_COMPLIANCE_REVIEW membership in the target fleet, read from the
 *    database. Session claims, DISPATCH, FLEET_OPERATIONS, FLEET_MANAGER, FLEET_ADMIN and DRIVER cannot change it.
 *  - Read configuration and history: the same BOF roles, plus FLEET_ADMIN of the fleet (read-only).
 *  - Read the effective mode (for the dispatch banner): any ACTIVE member of the fleet.
 *
 * Every change writes the setting, an append-only history row, an audit event and a notification in one
 * transaction, so a failure of any of them leaves the mode unchanged. OBSERVE cannot be set where
 * observeAvailability() is false (production and undeclared environments).
 */

const CONFIGURE_ROLE_CODES = new Set(["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"]);
const READ_CONFIGURATION_ROLE_CODES = new Set([...CONFIGURE_ROLE_CODES, "FLEET_ADMIN"]);
const NOTIFIED_ROLES: Record<string, OperationalChatParticipantRole> = {
  BOF_OPERATIONS: OperationalChatParticipantRole.BOF_OPERATIONS,
  BOF_COMPLIANCE_REVIEW: OperationalChatParticipantRole.SAFETY,
  FLEET_ADMIN: OperationalChatParticipantRole.FLEET_OWNER,
};
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

const OBSERVE_BANNER_TEXT =
  "OBSERVE mode: movement policy results are being recorded for this fleet. Safety, qualification and equipment " +
  "restrictions are NOT waived; denied actions remain denied.";

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  return sessionUser.id;
}

async function activeRole(db: Prisma.TransactionClient | typeof prisma, userId: string, fleetId: string) {
  const membership = await db.fleetMembership.findFirst({
    where: { userId, fleetId, status: "ACTIVE", user: { status: "ACTIVE" } },
    select: { role: { select: { code: true } } },
  });
  return membership?.role.code ?? null;
}

async function refuse(sessionUser: SessionUserLike, fleetId: string, reason: string, operation: string): Promise<never> {
  await createAuditRecord({
    actorId: sessionUser.id ?? null,
    actorEmail: sessionUser.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "Stage0EnforcementSetting",
    entityId: fleetId,
    details: { event: "stage0.enforcement_access_denied", reason, operation },
    metadata: { source: "stage0-enforcement-config" },
  });
  throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
}

export type EnforcementStatus = {
  fleetId: string;
  effectiveMode: Stage0EnforcementMode;
  modeSource: string;
  /** True when dispatch interfaces must show the OBSERVE banner. */
  observeBanner: boolean;
  bannerText: string | null;
  canConfigure: boolean;
  /** Present only for roles allowed to read configuration. */
  configuration?: {
    setting: { mode: Stage0EnforcementMode; reason: string; configuredByUserId: string; updatedAt: Date } | null;
    observeAvailable: boolean;
    observeUnavailableReason: string | null;
    history: Array<{
      id: string;
      previousMode: Stage0EnforcementMode;
      newMode: Stage0EnforcementMode;
      reason: string;
      actorUserId: string;
      actorRoleCode: string;
      createdAt: Date;
    }>;
  };
};

export async function getFleetEnforcementStatus(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
): Promise<EnforcementStatus> {
  const userId = requireSessionUser(sessionUser);
  return prisma.$transaction(async (tx) => {
    const roleCode = await activeRole(tx, userId, fleetId);
    if (!roleCode) {
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
    const resolution = await resolveStage0EnforcementMode(tx, fleetId);
    const canConfigure = CONFIGURE_ROLE_CODES.has(roleCode);
    const status: EnforcementStatus = {
      fleetId,
      effectiveMode: resolution.mode,
      modeSource: resolution.source,
      observeBanner: resolution.mode === "OBSERVE",
      bannerText: resolution.mode === "OBSERVE" ? OBSERVE_BANNER_TEXT : null,
      canConfigure,
    };
    if (READ_CONFIGURATION_ROLE_CODES.has(roleCode)) {
      const availability = observeAvailability();
      // Sequential: the reads share the transaction's connection.
      const setting = await tx.stage0EnforcementSetting.findUnique({
        where: { fleetId },
        select: { mode: true, reason: true, configuredByUserId: true, updatedAt: true },
      });
      const history = await tx.stage0EnforcementModeChange.findMany({
        where: { fleetId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
        select: { id: true, previousMode: true, newMode: true, reason: true, actorUserId: true, actorRoleCode: true, createdAt: true },
      });
      status.configuration = {
        setting,
        observeAvailable: availability.allowed,
        observeUnavailableReason: availability.allowed ? null : availability.reason,
        history,
      };
    }
    return status;
  });
}

async function notifyModeChange(
  tx: Prisma.TransactionClient,
  input: { fleetId: string; actorId: string; previousMode: Stage0EnforcementMode; newMode: Stage0EnforcementMode; reason: string; roleCode: string },
) {
  const members = await tx.fleetMembership.findMany({
    where: { fleetId: input.fleetId, status: "ACTIVE", user: { status: "ACTIVE" }, role: { code: { in: Object.keys(NOTIFIED_ROLES) } } },
    select: { userId: true, role: { select: { code: true } } },
  });
  const recipients = new Map<string, OperationalChatParticipantRole>();
  for (const member of members) recipients.set(member.userId, NOTIFIED_ROLES[member.role.code]);
  recipients.set(input.actorId, recipients.get(input.actorId) ?? OperationalChatParticipantRole.BOF_OPERATIONS);

  let thread = await tx.operationalChatThread.findFirst({
    where: { tenantId: input.fleetId, recordType: "CARRIER", recordId: input.fleetId, subject: "Stage 0 movement enforcement mode" },
    select: { id: true },
  });
  if (!thread) {
    thread = await tx.operationalChatThread.create({
      data: {
        tenantId: input.fleetId,
        type: "SAFETY_COMPLIANCE_THREAD",
        visibility: "INTERNAL",
        subject: "Stage 0 movement enforcement mode",
        recordType: "CARRIER",
        recordId: input.fleetId,
        createdById: input.actorId,
      },
      select: { id: true },
    });
  }
  const existing = new Set((await tx.operationalChatParticipant.findMany({ where: { threadId: thread.id }, select: { userId: true } })).map((row) => row.userId));
  const toAdd = [...recipients.entries()].filter(([userId]) => !existing.has(userId));
  if (toAdd.length > 0) {
    await tx.operationalChatParticipant.createMany({
      data: toAdd.map(([userId, role]) => ({ threadId: thread!.id, tenantId: input.fleetId, userId, role, addedById: input.actorId })),
      skipDuplicates: true,
    });
  }
  const message = await tx.operationalChatMessage.create({
    data: {
      threadId: thread.id,
      tenantId: input.fleetId,
      senderId: input.actorId,
      visibility: "INTERNAL",
      body: `Movement enforcement mode changed ${input.previousMode} → ${input.newMode} by ${input.roleCode}. Reason: ${input.reason}`,
    },
    select: { id: true },
  });
  const others = [...recipients.keys()].filter((userId) => userId !== input.actorId);
  if (others.length > 0) {
    await tx.operationalChatNotification.createMany({
      data: others.map((userId) => ({ tenantId: input.fleetId, userId, threadId: thread!.id, messageId: message.id, kind: "STAGE0_ENFORCEMENT_MODE_CHANGED" })),
    });
  }
}

export type EnforcementChangeResult = { changed: boolean; previousMode: Stage0EnforcementMode; mode: Stage0EnforcementMode };

export async function setFleetEnforcementMode(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  mode: unknown,
  reason: unknown,
): Promise<EnforcementChangeResult> {
  const userId = requireSessionUser(sessionUser);
  if (mode !== "ENFORCE" && mode !== "OBSERVE") {
    throw Object.assign(new Error("mode must be ENFORCE or OBSERVE"), { statusCode: 422 });
  }
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason.length < MIN_REASON_LENGTH || trimmedReason.length > MAX_REASON_LENGTH) {
    throw Object.assign(new Error(`reason must be ${MIN_REASON_LENGTH}-${MAX_REASON_LENGTH} characters`), { statusCode: 422 });
  }

  const fleet = await prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true } });
  if (!fleet) {
    throw Object.assign(new Error("Fleet not found"), { statusCode: 404 });
  }

  const roleCode = await activeRole(prisma, userId, fleetId);
  if (!roleCode || !CONFIGURE_ROLE_CODES.has(roleCode)) {
    return refuse(sessionUser!, fleetId, roleCode ? "ROLE_REQUIRED" : "TENANT_ACCESS_DENIED", `set:${mode}`);
  }
  if (mode === "OBSERVE") {
    const availability = observeAvailability();
    if (!availability.allowed) {
      throw Object.assign(new Error(`OBSERVE is not available in this environment: ${availability.reason}`), {
        statusCode: 409,
        code: "STAGE0_OBSERVE_NOT_AVAILABLE",
      });
    }
  }

  return prisma.$transaction(async (tx) => {
    // The role is re-read under the per-fleet lock so a membership revoked meanwhile cannot change the mode, and
    // concurrent changes are recorded in order.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bof-stage0-enforcement:${fleetId}`}))`;
    const lockedRole = await activeRole(tx, userId, fleetId);
    if (!lockedRole || !CONFIGURE_ROLE_CODES.has(lockedRole)) {
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }

    const current = await tx.stage0EnforcementSetting.findUnique({ where: { fleetId }, select: { mode: true } });
    const previousMode: Stage0EnforcementMode = current?.mode ?? "ENFORCE";
    if (previousMode === mode && current) {
      return { changed: false, previousMode, mode };
    }

    await tx.stage0EnforcementSetting.upsert({
      where: { fleetId },
      update: { mode, reason: trimmedReason, configuredByUserId: userId },
      create: { fleetId, mode, reason: trimmedReason, configuredByUserId: userId },
    });
    await tx.stage0EnforcementModeChange.create({
      data: {
        fleetId,
        previousMode,
        newMode: mode,
        reason: trimmedReason,
        actorUserId: userId,
        actorEmail: sessionUser!.email ?? null,
        actorRoleCode: lockedRole,
        policyVersion: STAGE0_ENFORCEMENT_POLICY_VERSION,
      },
    });
    await createAuditRecord(
      {
        actorId: userId,
        actorEmail: sessionUser!.email ?? null,
        tenantId: fleetId,
        action: "UPDATED",
        entityType: "Stage0EnforcementSetting",
        entityId: fleetId,
        details: {
          event: "stage0.enforcement_mode_changed",
          scope: "fleet",
          fleetId,
          previousMode,
          newMode: mode,
          reason: trimmedReason,
          actorRoleCode: lockedRole,
          policyVersion: STAGE0_ENFORCEMENT_POLICY_VERSION,
        },
        metadata: { source: "stage0-enforcement-config" },
      },
      tx,
    );
    await notifyModeChange(tx, { fleetId, actorId: userId, previousMode, newMode: mode, reason: trimmedReason, roleCode: lockedRole });
    return { changed: true, previousMode, mode };
  });
}
