import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditActionValue =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "LOGIN"
  | "LOGOUT"
  | "ROLE_ASSIGNED"
  | "ROLE_REMOVED"
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "VIEWED"
  | "IMPORTED"
  | "EXPORTED";

export type AuditRecordInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  tenantId?: string | null;
  action: AuditActionValue;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export async function createAuditRecord(input: AuditRecordInput) {
  return prisma.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      tenantId: input.tenantId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details: (input.details ?? {}) as Prisma.InputJsonValue,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function createAuditRecordWithActor(
  actor: { id?: string | null; email?: string | null },
  tenantId: string | null,
  action: AuditActionValue,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  return createAuditRecord({
    actorId: actor.id ?? null,
    actorEmail: actor.email ?? null,
    tenantId,
    action,
    entityType,
    entityId,
    details,
  });
}
