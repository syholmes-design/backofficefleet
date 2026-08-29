import { AuditAction, OperationalChatMessageState, OperationalChatParticipantRole, OperationalChatRecordType, OperationalChatStatus, OperationalChatThreadType, OperationalChatVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { getAuthorizedOperatingRecord } from "@/lib/services/operatingRecordService";

const INTERNAL_ROLES = new Set(["BOF_OPERATIONS", "BOF_ADMINISTRATION", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN", "FLEET_OPERATIONS", "FLEET_MANAGER", "DISPATCH", "SAFETY", "FINANCE"]);

export class OperationalChatError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "OperationalChatError";
    this.statusCode = statusCode;
  }
}

export type ChatThreadCreateInput = {
  fleetId?: unknown;
  type?: unknown;
  subject?: unknown;
  visibility?: unknown;
  recordType?: unknown;
  recordId?: unknown;
  ownerId?: unknown;
  nextAction?: unknown;
  dueAt?: unknown;
  participants?: unknown;
};

export type ChatMessageCreateInput = {
  body?: unknown;
  visibility?: unknown;
  replyToId?: unknown;
};

function requiredString(value: unknown, field: string, maxLength = 240): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new OperationalChatError(`${field} is required`, 422);
  }
  return value.trim();
}

function optionalString(value: unknown, maxLength = 240): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength ? value.trim() : undefined;
}

function getUserId(user: SessionUserLike): string {
  if (!user.id) throw new OperationalChatError("AUTH_REQUIRED", 401);
  return user.id;
}

function accessOrThrow(user: SessionUserLike, fleetId: string, roles: string[] = []) {
  const access = requireFleetAccess(user, fleetId, roles);
  if (!access.allowed) throw new OperationalChatError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  return access.membership;
}

function userCanSeeInternal(user: SessionUserLike, fleetId: string) {
  const membership = user.memberships?.find((entry) => entry.fleetId === fleetId && entry.status !== "INACTIVE" && entry.status !== "INVITED");
  return Boolean(membership && INTERNAL_ROLES.has(membership.roleCode));
}

async function audit(user: SessionUserLike, tenantId: string | null, action: AuditAction, entityType: string, entityId: string | null, details?: Prisma.InputJsonValue) {
  await prisma.auditEvent.create({
    data: {
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      tenantId: tenantId ?? undefined,
      action,
      entityType,
      entityId: entityId ?? undefined,
      details,
    },
  });
}

const threadInclude = {
  participants: { select: { id: true, userId: true, role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } } },
  citations: { orderBy: { createdAt: "asc" as const } },
  messages: { orderBy: { createdAt: "asc" as const }, include: { sender: { select: { id: true, name: true, email: true } }, reads: { select: { userId: true, readAt: true } } } },
} satisfies Prisma.OperationalChatThreadInclude;

function publicThread(thread: Prisma.OperationalChatThreadGetPayload<{ include: typeof threadInclude }>, canSeeInternal: boolean) {
  return {
    ...thread,
    messages: thread.messages.filter((message) => canSeeInternal || message.visibility === "CUSTOMER_VISIBLE").map((message) => ({ ...message, body: message.deletedAt ? "Message deleted" : message.body })),
    participants: thread.participants.filter((participant) => canSeeInternal || participant.role === "CUSTOMER"),
  };
}

export async function listOperationalChatThreads(user: SessionUserLike, fleetId: string, recordContext?: { recordType: string; recordId: string }) {
  accessOrThrow(user, fleetId);
  const userId = getUserId(user);
  const canSeeInternal = userCanSeeInternal(user, fleetId);
  const threads = await prisma.operationalChatThread.findMany({ where: { tenantId: fleetId, ...(recordContext ? { recordType: recordContext.recordType as OperationalChatRecordType, recordId: recordContext.recordId } : {}), ...(canSeeInternal ? {} : { visibility: "CUSTOMER_VISIBLE", participants: { some: { userId } } }) }, orderBy: { updatedAt: "desc" }, include: { participants: { select: { userId: true, role: true } }, messages: { where: { senderId: { not: userId } }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, visibility: true, state: true, createdAt: true, editedAt: true, deletedAt: true, sender: { select: { id: true, name: true, email: true } }, reads: { where: { userId }, select: { id: true } } } }, citations: { select: { recordType: true, recordId: true, title: true, route: true } } } });
  return threads.map((thread) => { const visibleMessages = thread.messages.filter((message) => canSeeInternal || message.visibility === "CUSTOMER_VISIBLE"); return { ...thread, unreadCount: visibleMessages.filter((message) => message.reads.length === 0).length, messages: visibleMessages.map((message) => ({ id: message.id, body: message.deletedAt ? "Message deleted" : message.body, visibility: message.visibility, state: message.state, createdAt: message.createdAt, editedAt: message.editedAt, deletedAt: message.deletedAt, sender: message.sender })), participants: thread.participants.filter((participant) => canSeeInternal || participant.role === "CUSTOMER") }; });
}

export async function getOperationalChatThread(user: SessionUserLike, fleetId: string, threadId: string) {
  accessOrThrow(user, fleetId);
  const thread = await prisma.operationalChatThread.findFirst({ where: { id: threadId, tenantId: fleetId }, include: threadInclude });
  if (!thread) throw new OperationalChatError("Thread not found", 404);
  const participant = thread.participants.some((entry) => entry.userId === user.id);
  const canSeeInternal = userCanSeeInternal(user, fleetId);
  if ((!participant && !canSeeInternal) || (!canSeeInternal && thread.visibility !== "CUSTOMER_VISIBLE")) throw new OperationalChatError("THREAD_ACCESS_DENIED", 403);
  return publicThread(thread, canSeeInternal);
}

export async function createOperationalChatThread(user: SessionUserLike, input: ChatThreadCreateInput) {
  const userId = getUserId(user);
  const fleetId = requiredString(input.fleetId, "fleetId", 80);
  const membership = accessOrThrow(user, fleetId);
  const type = requiredString(input.type, "type", 60) as OperationalChatThreadType;
  const subject = requiredString(input.subject, "subject");
  const visibility = (optionalString(input.visibility, 30) ?? "INTERNAL") as OperationalChatVisibility;
  if (visibility === "CUSTOMER_VISIBLE" && !userCanSeeInternal(user, fleetId)) throw new OperationalChatError("Customer visibility requires an authorized role", 403);
  const recordType = optionalString(input.recordType, 40) as OperationalChatRecordType | undefined;
  const recordId = optionalString(input.recordId, 100);
  const citation = recordType && recordId ? await getAuthorizedOperatingRecord(user, fleetId, recordType, recordId) : null;
  const participantInput = Array.isArray(input.participants) ? input.participants : [];
  const participants = participantInput.map((value) => {
    if (!value || typeof value !== "object") throw new OperationalChatError("Invalid participant", 422);
    const participant = value as { userId?: unknown; role?: unknown };
    return { tenantId: fleetId, userId: requiredString(participant.userId, "participant.userId", 100), role: requiredString(participant.role, "participant.role", 40) as OperationalChatParticipantRole, addedById: userId };
  });
  if (!participants.some((participant) => participant.userId === userId)) participants.push({ tenantId: fleetId, userId, role: (membership?.roleCode ?? "FLEET_MANAGER") as OperationalChatParticipantRole, addedById: userId });
  const participantUserIds = [...new Set(participants.map((participant) => participant.userId))];
  const activeMemberships = await prisma.fleetMembership.count({ where: { fleetId, userId: { in: participantUserIds }, status: "ACTIVE" } });
  if (activeMemberships !== participantUserIds.length) throw new OperationalChatError("Every participant must be an active member of this fleet", 403);
  const thread = await prisma.$transaction(async (tx) => {
    const created = await tx.operationalChatThread.create({ data: { tenantId: fleetId, type, visibility, subject, recordType, recordId, ownerId: optionalString(input.ownerId, 100), nextAction: optionalString(input.nextAction, 500), dueAt: input.dueAt ? new Date(String(input.dueAt)) : undefined, createdById: userId, participants: { create: participants }, citations: citation && recordType && recordId ? { create: { tenantId: fleetId, recordType, recordId, title: citation.title, snapshot: citation.snapshot as Prisma.InputJsonValue, route: citation.route } } : undefined } });
    await tx.auditEvent.create({ data: { actorId: userId, actorEmail: user.email ?? undefined, tenantId: fleetId, action: AuditAction.CREATED, entityType: "OperationalChatThread", entityId: created.id, details: { type, visibility, recordType, recordId } } });
    return created;
  });
  return getOperationalChatThread(user, fleetId, thread.id);
}

export async function createOperationalChatMessage(user: SessionUserLike, fleetId: string, threadId: string, input: ChatMessageCreateInput) {
  const userId = getUserId(user);
  accessOrThrow(user, fleetId);
  const thread = await prisma.operationalChatThread.findFirst({ where: { id: threadId, tenantId: fleetId }, include: { participants: true } });
  if (!thread) throw new OperationalChatError("Thread not found", 404);
  if (!thread.participants.some((participant) => participant.userId === userId)) throw new OperationalChatError("THREAD_ACCESS_DENIED", 403);
  const visibility = (optionalString(input.visibility, 30) ?? thread.visibility) as OperationalChatVisibility;
  if (visibility === "INTERNAL" && !userCanSeeInternal(user, fleetId)) throw new OperationalChatError("INTERNAL_VISIBILITY_DENIED", 403);
  if (visibility === "CUSTOMER_VISIBLE" && thread.visibility !== "CUSTOMER_VISIBLE" && !userCanSeeInternal(user, fleetId)) throw new OperationalChatError("THREAD_VISIBILITY_DENIED", 403);
  const body = requiredString(input.body, "body", 10000);
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.operationalChatMessage.create({ data: { threadId, tenantId: fleetId, senderId: userId, body, visibility, state: OperationalChatMessageState.SENT, replyToId: optionalString(input.replyToId, 100) }, include: { sender: { select: { id: true, name: true, email: true } }, reads: true } });
    await tx.operationalChatThread.update({ where: { id: threadId }, data: { updatedAt: new Date(), status: OperationalChatStatus.OPEN } });
    await tx.operationalChatNotification.createMany({ data: thread.participants.filter((participant) => participant.userId !== userId && (visibility === "INTERNAL" || participant.role === "CUSTOMER")).map((participant) => ({ tenantId: fleetId, userId: participant.userId, threadId, messageId: created.id, kind: "CHAT_MESSAGE" })) });
    await tx.auditEvent.create({ data: { actorId: userId, actorEmail: user.email ?? undefined, tenantId: fleetId, action: AuditAction.CREATED, entityType: "OperationalChatMessage", entityId: created.id, details: { threadId, visibility } } });
    return created;
  });
  return { ...message, deletedAt: null };
}

export async function markOperationalChatThreadRead(user: SessionUserLike, fleetId: string, threadId: string) {
  const userId = getUserId(user);
  const thread = await getOperationalChatThread(user, fleetId, threadId);
  const messageIds = thread.messages.filter((message) => message.senderId !== userId).map((message) => message.id);
  if (messageIds.length > 0) await prisma.operationalChatMessageRead.createMany({ data: messageIds.map((messageId) => ({ messageId, tenantId: fleetId, userId })), skipDuplicates: true });
  await prisma.operationalChatNotification.updateMany({ where: { tenantId: fleetId, userId, threadId, readAt: null }, data: { readAt: new Date() } });
  await audit(user, fleetId, AuditAction.VIEWED, "OperationalChatThread", threadId, { messageCount: messageIds.length });
  return { ...thread, unreadCount: 0 };
}

export async function resolveOperationalChatThread(user: SessionUserLike, fleetId: string, threadId: string, nextAction?: string) {
  accessOrThrow(user, fleetId, ["BOF_OPERATIONS", "BOF_ADMINISTRATION", "FLEET_ADMIN", "FLEET_MANAGER", "FLEET_OPERATIONS"]);
  const thread = await prisma.operationalChatThread.updateMany({ where: { id: threadId, tenantId: fleetId }, data: { status: "RESOLVED", resolvedAt: new Date(), nextAction: optionalString(nextAction, 500) } });
  if (thread.count !== 1) throw new OperationalChatError("Thread not found", 404);
  await audit(user, fleetId, AuditAction.UPDATED, "OperationalChatThread", threadId, { status: "RESOLVED" });
  return getOperationalChatThread(user, fleetId, threadId);
}

export async function editOperationalChatMessage(user: SessionUserLike, fleetId: string, messageId: string, body: string) {
  const userId = getUserId(user);
  accessOrThrow(user, fleetId);
  const message = await prisma.operationalChatMessage.findFirst({ where: { id: messageId, tenantId: fleetId } });
  if (!message) throw new OperationalChatError("Message not found", 404);
  if (message.senderId !== userId && !userCanSeeInternal(user, fleetId)) throw new OperationalChatError("MESSAGE_ACCESS_DENIED", 403);
  const updated = await prisma.operationalChatMessage.update({ where: { id: messageId, tenantId: fleetId }, data: { body: requiredString(body, "body", 10000), editedAt: new Date() }, include: { sender: { select: { id: true, name: true, email: true } } } });
  await audit(user, fleetId, AuditAction.UPDATED, "OperationalChatMessage", messageId, { threadId: message.threadId });
  return updated;
}

export async function deleteOperationalChatMessage(user: SessionUserLike, fleetId: string, messageId: string) {
  const userId = getUserId(user);
  accessOrThrow(user, fleetId);
  const message = await prisma.operationalChatMessage.findFirst({ where: { id: messageId, tenantId: fleetId } });
  if (!message) throw new OperationalChatError("Message not found", 404);
  if (message.senderId !== userId && !userCanSeeInternal(user, fleetId)) throw new OperationalChatError("MESSAGE_ACCESS_DENIED", 403);
  const updated = await prisma.operationalChatMessage.update({ where: { id: messageId, tenantId: fleetId }, data: { deletedAt: new Date() } });
  await audit(user, fleetId, AuditAction.DELETED, "OperationalChatMessage", messageId, { threadId: message.threadId, retained: true });
  return { id: updated.id, deletedAt: updated.deletedAt };
}
