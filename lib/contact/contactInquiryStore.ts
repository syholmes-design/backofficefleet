import { Prisma } from "@prisma/client";

import {
  CONTACT_INQUIRY_RATE_LIMIT,
  CONTACT_INQUIRY_RATE_WINDOW_MS,
  ContactInquiryError,
  contactInquiryRateLimitReached,
  parseContactInquiry,
  SAVED_INQUIRY_MESSAGE,
  type ContactInquiryInput,
} from "@/lib/contact/contactInquiry";
import { isDatabaseUrlNotConfiguredError, prisma } from "@/lib/prisma";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MESSAGE = "Too many inquiries were submitted. Try again later.";
const DUPLICATE_MESSAGE = "This inquiry was already saved. An email notification was not sent.";
const STORAGE_MESSAGE = "We could not save your inquiry. Nothing was sent.";

export type SavedContactInquiry = ContactInquiryInput & {
  id: string;
  createdAt: Date;
};

export function isContactInquiryStorageUnavailable(error: unknown) {
  return (
    isDatabaseUrlNotConfiguredError(error) ||
    (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022"))
  );
}

export type ContactInquiryRecords = {
  countSince(email: string, since: Date): Promise<number>;
  hasDuplicate(email: string, message: string, since: Date): Promise<boolean>;
  create(input: ContactInquiryInput, createdAt: Date): Promise<SavedContactInquiry>;
};

export async function saveContactInquiry(
  input: ContactInquiryInput,
  now = new Date(),
  records?: ContactInquiryRecords,
): Promise<SavedContactInquiry> {
  if (records) return enforceContactInquiryLimit(records, input, now);
  return saveContactInquiryDurably(input, now);
}

async function enforceContactInquiryLimit(records: ContactInquiryRecords, input: ContactInquiryInput, now: Date) {
  const savedInWindow = await records.countSince(input.email, new Date(now.getTime() - CONTACT_INQUIRY_RATE_WINDOW_MS));
  if (contactInquiryRateLimitReached(savedInWindow, CONTACT_INQUIRY_RATE_LIMIT)) {
    throw new ContactInquiryError(429, RATE_LIMIT_MESSAGE);
  }
  const duplicate = await records.hasDuplicate(input.email, input.message, new Date(now.getTime() - DUPLICATE_WINDOW_MS));
  if (duplicate) throw new ContactInquiryError(409, DUPLICATE_MESSAGE);
  return records.create(input, now);
}

async function saveContactInquiryDurably(input: ContactInquiryInput, now: Date, attempt = 0): Promise<SavedContactInquiry> {
  try {
    return await prisma.$transaction(
      (tx) => enforceContactInquiryLimit(recordsFrom(tx), input, now),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (attempt < 1 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return saveContactInquiryDurably(input, now, attempt + 1);
    }
    throw error;
  }
}

function recordsFrom(tx: Prisma.TransactionClient): ContactInquiryRecords {
  return {
    countSince(email, since) {
      return tx.contactInquiry.count({ where: { email, createdAt: { gte: since } } });
    },
    async hasDuplicate(email, message, since) {
      const existing = await tx.contactInquiry.findFirst({
        where: { email, message, createdAt: { gte: since } },
        select: { id: true },
      });
      return Boolean(existing);
    },
    async create(input, createdAt) {
      const created = await tx.contactInquiry.create({
        data: {
          fullName: input.fullName,
          companyName: input.companyName,
          email: input.email,
          phone: input.phone,
          organizationType: input.organizationType,
          services: input.services,
          message: input.message,
          createdAt,
        },
      });
      return {
        id: created.id,
        fullName: created.fullName,
        companyName: created.companyName,
        email: created.email,
        phone: created.phone,
        organizationType: created.organizationType as ContactInquiryInput["organizationType"],
        services: created.services,
        message: created.message,
        createdAt: created.createdAt,
      };
    },
  };
}

export async function acceptContactInquiry(
  body: unknown,
  now = Date.now(),
  records?: ContactInquiryRecords,
) {
  const input = parseContactInquiry(body);
  try {
    await saveContactInquiry(input, new Date(now), records);
  } catch (error) {
    if (error instanceof ContactInquiryError) throw error;
    if (isContactInquiryStorageUnavailable(error)) {
      throw new ContactInquiryError(503, STORAGE_MESSAGE);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new ContactInquiryError(503, STORAGE_MESSAGE);
    }
    throw error;
  }
  return { accepted: true as const, saved: true as const, emailed: false as const, message: SAVED_INQUIRY_MESSAGE };
}

export async function listContactInquiries() {
  return prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
