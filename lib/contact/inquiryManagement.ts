import { ContactInquiryActivityType, ContactInquiryStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const INQUIRY_STATUSES = [
  ContactInquiryStatus.NEW,
  ContactInquiryStatus.IN_REVIEW,
  ContactInquiryStatus.CONTACTED,
  ContactInquiryStatus.QUALIFIED,
  ContactInquiryStatus.CLOSED,
] as const;

export type InquiryListQuery = {
  q?: string;
  status?: ContactInquiryStatus;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "lastActivityAt";
};

export class InquiryManagementError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "InquiryManagementError";
    this.statusCode = statusCode;
  }
}

function parseStatus(value: string | null | undefined): ContactInquiryStatus | undefined {
  if (!value) return undefined;
  if ((INQUIRY_STATUSES as readonly string[]).includes(value)) {
    return value as ContactInquiryStatus;
  }
  throw new InquiryManagementError(422, "Invalid inquiry status.");
}

function clampLimit(limit: number | undefined) {
  if (!limit || limit < 1) return 25;
  return Math.min(limit, 100);
}

function clampPage(page: number | undefined) {
  if (!page || page < 1) return 1;
  return page;
}

export function serializeInquiry(inquiry: {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string | null;
  organizationType: string;
  services: string[];
  message: string;
  department: string | null;
  status: ContactInquiryStatus;
  assignedToUserId: string | null;
  nextFollowUpAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: { id: string; name: string | null; email: string } | null;
}) {
  return {
    id: inquiry.id,
    fullName: inquiry.fullName,
    companyName: inquiry.companyName,
    email: inquiry.email,
    phone: inquiry.phone,
    organizationType: inquiry.organizationType,
    services: inquiry.services,
    message: inquiry.message,
    department: inquiry.department,
    category: inquiry.organizationType,
    status: inquiry.status,
    assignedToUserId: inquiry.assignedToUserId,
    assignedTo: inquiry.assignedTo
      ? { id: inquiry.assignedTo.id, name: inquiry.assignedTo.name, email: inquiry.assignedTo.email }
      : null,
    nextFollowUpAt: inquiry.nextFollowUpAt?.toISOString() ?? null,
    lastActivityAt: inquiry.lastActivityAt.toISOString(),
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}

export function serializeActivity(activity: {
  id: string;
  inquiryId: string;
  activityType: ContactInquiryActivityType;
  description: string;
  actorUserId: string | null;
  metadata: unknown;
  createdAt: Date;
  actor?: { id: string; name: string | null; email: string } | null;
}) {
  return {
    id: activity.id,
    inquiryId: activity.inquiryId,
    activityType: activity.activityType,
    description: activity.description,
    actorUserId: activity.actorUserId,
    actor: activity.actor
      ? { id: activity.actor.id, name: activity.actor.name, email: activity.actor.email }
      : null,
    metadata: activity.metadata ?? null,
    createdAt: activity.createdAt.toISOString(),
  };
}

const inquiryInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ContactInquiryInclude;

export async function listInquiryReviewStaff() {
  const rows = await prisma.fleetMembership.findMany({
    where: {
      status: "ACTIVE",
      role: { code: "BOF_INQUIRY_REVIEW" },
      user: { status: "ACTIVE" },
    },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
    distinct: ["userId"],
  });
  return rows.map((row) => row.user);
}

async function assertAssignableUser(userId: string) {
  const staff = await listInquiryReviewStaff();
  if (!staff.some((member) => member.id === userId)) {
    throw new InquiryManagementError(422, "Assigned staff must have BOF inquiry review access.");
  }
}

export async function getInquirySummary() {
  const now = new Date();
  const [total, grouped, overdue] = await Promise.all([
    prisma.contactInquiry.count(),
    prisma.contactInquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contactInquiry.count({
      where: {
        nextFollowUpAt: { lt: now },
        status: { not: ContactInquiryStatus.CLOSED },
      },
    }),
  ]);
  const byStatus = Object.fromEntries(
    INQUIRY_STATUSES.map((status) => [status, 0]),
  ) as Record<ContactInquiryStatus, number>;
  for (const row of grouped) {
    byStatus[row.status] = row._count._all;
  }
  return { total, byStatus, overdueFollowUps: overdue };
}

export async function searchContactInquiries(raw: InquiryListQuery) {
  const q = raw.q?.trim();
  const status = raw.status ? parseStatus(raw.status) : undefined;
  const page = clampPage(raw.page);
  const limit = clampLimit(raw.limit);
  const sortField = raw.sort === "lastActivityAt" ? "lastActivityAt" : "createdAt";
  const where: Prisma.ContactInquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.contactInquiry.count({ where }),
    prisma.contactInquiry.findMany({
      where,
      include: inquiryInclude,
      orderBy: { [sortField]: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    inquiries: rows.map(serializeInquiry),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getContactInquiryById(id: string) {
  const inquiry = await prisma.contactInquiry.findUnique({
    where: { id },
    include: {
      ...inquiryInclude,
      activities: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!inquiry) throw new InquiryManagementError(404, "Inquiry not found.");
  return {
    inquiry: serializeInquiry(inquiry),
    activities: inquiry.activities.map(serializeActivity),
  };
}

export type PatchInquiryInput = {
  status?: ContactInquiryStatus;
  assignedToUserId?: string | null;
  department?: string | null;
  nextFollowUpAt?: string | null;
};

function parseFollowUp(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new InquiryManagementError(422, "Invalid follow-up date.");
  }
  return date;
}

export async function patchContactInquiry(
  inquiryId: string,
  actorUserId: string,
  input: PatchInquiryInput,
) {
  const existing = await prisma.contactInquiry.findUnique({ where: { id: inquiryId } });
  if (!existing) throw new InquiryManagementError(404, "Inquiry not found.");

  const data: Prisma.ContactInquiryUpdateInput = {};
  const activities: Prisma.ContactInquiryActivityCreateManyInput[] = [];
  let touchActivityClock = false;

  if (input.status !== undefined) {
    const status = parseStatus(input.status);
    if (!status) throw new InquiryManagementError(422, "Invalid inquiry status.");
    if (status !== existing.status) {
      data.status = status;
      touchActivityClock = true;
      activities.push({
        inquiryId,
        activityType: ContactInquiryActivityType.STATUS_CHANGE,
        description: `Status changed from ${existing.status} to ${status}.`,
        actorUserId,
        metadata: { from: existing.status, to: status },
      });
    }
  }

  if (input.assignedToUserId !== undefined) {
    if (input.assignedToUserId) await assertAssignableUser(input.assignedToUserId);
    if (input.assignedToUserId !== existing.assignedToUserId) {
      touchActivityClock = true;
      data.assignedTo = input.assignedToUserId
        ? { connect: { id: input.assignedToUserId } }
        : { disconnect: true };
      activities.push({
        inquiryId,
        activityType: ContactInquiryActivityType.ASSIGNMENT,
        description: input.assignedToUserId
          ? "Inquiry assignment updated."
          : "Inquiry assignment cleared.",
        actorUserId,
        metadata: { assignedToUserId: input.assignedToUserId },
      });
    }
  }

  if (input.department !== undefined) {
    const department = input.department?.trim() ? input.department.trim().slice(0, 120) : null;
    if (department !== existing.department) {
      data.department = department;
    }
  }

  if (input.nextFollowUpAt !== undefined) {
    const nextFollowUpAt = parseFollowUp(input.nextFollowUpAt);
    const existingTime = existing.nextFollowUpAt?.getTime() ?? null;
    const nextTime = nextFollowUpAt?.getTime() ?? null;
    if (existingTime !== nextTime) {
      data.nextFollowUpAt = nextFollowUpAt;
      touchActivityClock = true;
      activities.push({
        inquiryId,
        activityType: ContactInquiryActivityType.FOLLOW_UP,
        description: nextFollowUpAt
          ? `Follow-up scheduled for ${nextFollowUpAt.toISOString()}.`
          : "Follow-up date cleared.",
        actorUserId,
        metadata: { nextFollowUpAt: nextFollowUpAt?.toISOString() ?? null },
      });
    }
  }

  if (touchActivityClock) {
    data.lastActivityAt = new Date();
  }

  if (activities.length === 0 && Object.keys(data).length === 0) {
    const unchanged = await prisma.contactInquiry.findUnique({
      where: { id: inquiryId },
      include: inquiryInclude,
    });
    if (!unchanged) throw new InquiryManagementError(404, "Inquiry not found.");
    return serializeInquiry(unchanged);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (activities.length > 0) {
      await tx.contactInquiryActivity.createMany({ data: activities });
    }
    return tx.contactInquiry.update({
      where: { id: inquiryId },
      data,
      include: inquiryInclude,
    });
  });

  return serializeInquiry(updated);
}

export async function addContactInquiryActivity(
  inquiryId: string,
  actorUserId: string,
  body: { description?: string; activityType?: ContactInquiryActivityType },
) {
  const description = body.description?.trim() ?? "";
  if (description.length < 2 || description.length > 4000) {
    throw new InquiryManagementError(422, "Activity description must be between 2 and 4000 characters.");
  }
  const activityType = body.activityType ?? ContactInquiryActivityType.NOTE;
  if (!(Object.values(ContactInquiryActivityType) as string[]).includes(activityType)) {
    throw new InquiryManagementError(422, "Invalid activity type.");
  }
  const existing = await prisma.contactInquiry.findUnique({ where: { id: inquiryId }, select: { id: true } });
  if (!existing) throw new InquiryManagementError(404, "Inquiry not found.");

  const [activity] = await prisma.$transaction([
    prisma.contactInquiryActivity.create({
      data: { inquiryId, activityType, description, actorUserId },
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.contactInquiry.update({
      where: { id: inquiryId },
      data: { lastActivityAt: new Date() },
    }),
  ]);

  return serializeActivity(activity);
}

export function parseInquiryListQuery(searchParams: URLSearchParams): InquiryListQuery {
  const statusRaw = searchParams.get("status");
  return {
    q: searchParams.get("q") ?? undefined,
    status: statusRaw ? parseStatus(statusRaw) : undefined,
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "25"),
    sort: searchParams.get("sort") === "lastActivityAt" ? "lastActivityAt" : "createdAt",
  };
}
