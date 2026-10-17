import assert from "node:assert/strict";
import test from "node:test";

import { isBofStaff } from "@/lib/contact/bofStaffAccess";
import {
  CONTACT_INQUIRY_RATE_LIMIT,
  CONTACT_INQUIRY_RATE_WINDOW_MS,
  contactInquiryRateLimitReached,
  parseContactInquiry,
  ContactInquiryError,
  SAVED_INQUIRY_MESSAGE,
  type ContactInquiryInput,
} from "@/lib/contact/contactInquiry";
import { acceptContactInquiry, type ContactInquiryRecords } from "@/lib/contact/contactInquiryStore";
import { DatabaseUrlNotConfiguredError } from "@/lib/prisma";

const valid = {
  fullName: "Avery Cole",
  companyName: "North Line Carriers",
  email: "avery@northline.example",
  phone: "",
  organizationType: "MOTOR_CARRIER",
  services: ["Operations & Compliance"],
  message: "We need help with driver qualification files.",
  website_hp: "",
};

function statusOf(error: unknown) {
  return error instanceof ContactInquiryError ? error.statusCode : 0;
}

test("a complete inquiry parses and does not claim an email was sent", () => {
  const parsed = parseContactInquiry(valid);
  assert.equal(parsed.email, "avery@northline.example");
  assert.equal(parsed.phone, null);
  assert.equal(parsed.services.length, 1);
  assert.match(SAVED_INQUIRY_MESSAGE, /saved/i);
  assert.match(SAVED_INQUIRY_MESSAGE, /email notification was not sent/i);
});

test("missing required fields are rejected", () => {
  assert.throws(() => parseContactInquiry({ ...valid, fullName: "A", email: "not-an-email", services: [] }), (error: unknown) => {
    assert.equal(statusOf(error), 422);
    assert.ok(error instanceof ContactInquiryError);
    assert.equal((error.fields.fullName ?? "").length > 0, true);
    assert.equal((error.fields.email ?? "").length > 0, true);
    assert.equal((error.fields.services ?? "").length > 0, true);
    return true;
  });
});

test("a honeypot submission is rejected without a success message", () => {
  assert.throws(() => parseContactInquiry({ ...valid, website_hp: "https://spam.example" }), (error: unknown) => {
    assert.equal(statusOf(error), 422);
    assert.ok(error instanceof ContactInquiryError);
    assert.equal(error.message.includes("email"), false);
    return true;
  });
});

test("five saved inquiries for one normalized email are allowed and the sixth is rejected", async () => {
  const records = memoryRecords();
  const now = Date.parse("2026-10-17T12:00:00.000Z");
  for (let index = 0; index < CONTACT_INQUIRY_RATE_LIMIT; index += 1) {
    const saved = await acceptContactInquiry(inquiry(`Message number ${index} is long enough.`), now + index, records);
    assert.equal(saved.saved, true);
    assert.equal(saved.emailed, false);
  }
  await assert.rejects(
    () => acceptContactInquiry({ ...valid, email: "  Avery@NorthLine.example ", message: "A sixth distinct message for the same mailbox." }, now + 10, records),
    (error: unknown) => {
      assert.equal(statusOf(error), 429);
      assert.ok(error instanceof ContactInquiryError);
      assert.equal(error.message.includes("email notification was sent"), false);
      return true;
    },
  );
  assert.equal(records.rows.length, CONTACT_INQUIRY_RATE_LIMIT);
});

test("an inquiry older than the rate window no longer counts", async () => {
  const records = memoryRecords();
  const now = Date.parse("2026-10-17T12:00:00.000Z");
  records.rows.push(stored("Avery@northline.example", "Older saved inquiry message.", new Date(now - CONTACT_INQUIRY_RATE_WINDOW_MS - 1)));
  for (let index = 0; index < CONTACT_INQUIRY_RATE_LIMIT; index += 1) {
    await acceptContactInquiry(inquiry(`Window message ${index} is long enough.`), now, records);
  }
  assert.equal(records.rows.length, CONTACT_INQUIRY_RATE_LIMIT + 1);
  assert.equal(contactInquiryRateLimitReached(CONTACT_INQUIRY_RATE_LIMIT), true);
});

test("a different email address is counted separately", async () => {
  const records = memoryRecords();
  const now = Date.parse("2026-10-17T12:00:00.000Z");
  for (let index = 0; index < CONTACT_INQUIRY_RATE_LIMIT; index += 1) {
    await acceptContactInquiry(inquiry(`Mailbox message ${index} is long enough.`), now, records);
  }
  const saved = await acceptContactInquiry(
    { ...valid, email: "other@northline.example", message: "A different mailbox can still save an inquiry." },
    now,
    records,
  );
  assert.equal(saved.saved, true);
  assert.equal(saved.emailed, false);
});

test("invalid and honeypot submissions do not consume the saved-inquiry limit or return success", async () => {
  const records = memoryRecords();
  const now = Date.parse("2026-10-17T12:00:00.000Z");
  await assert.rejects(() => acceptContactInquiry({ ...valid, email: "not-an-email" }, now, records), (error: unknown) => statusOf(error) === 422);
  await assert.rejects(() => acceptContactInquiry({ ...valid, website_hp: "spam" }, now, records), (error: unknown) => statusOf(error) === 422);
  assert.equal(records.rows.length, 0);
  const saved = await acceptContactInquiry(valid, now, records);
  assert.equal(saved.accepted, true);
  assert.equal(saved.saved, true);
  assert.equal(saved.emailed, false);
});

test("a database failure while saving does not return success", async () => {
  const records: ContactInquiryRecords = {
    countSince: async () => {
      throw new DatabaseUrlNotConfiguredError();
    },
    hasDuplicate: async () => false,
    create: async () => {
      throw new Error("create should not run");
    },
  };
  await assert.rejects(() => acceptContactInquiry(valid, Date.now(), records), (error: unknown) => {
    assert.equal(statusOf(error), 503);
    assert.ok(error instanceof ContactInquiryError);
    assert.equal(error.message, "We could not save your inquiry. Nothing was sent.");
    return true;
  });
});

function inquiry(message: string) {
  return { ...valid, message };
}

function stored(email: string, message: string, createdAt: Date): ContactInquiryInput & { createdAt: Date } {
  return {
    fullName: valid.fullName,
    companyName: valid.companyName,
    email: email.trim().toLowerCase(),
    phone: null,
    organizationType: "MOTOR_CARRIER",
    services: ["Operations & Compliance"],
    message,
    createdAt,
  };
}

function memoryRecords(): ContactInquiryRecords & { rows: Array<ContactInquiryInput & { createdAt: Date }> } {
  const rows: Array<ContactInquiryInput & { createdAt: Date }> = [];
  return {
    rows,
    async countSince(email, since) {
      return rows.filter((row) => row.email === email && row.createdAt >= since).length;
    },
    async hasDuplicate(email, message, since) {
      return rows.some((row) => row.email === email && row.message === message && row.createdAt >= since);
    },
    async create(input, createdAt) {
      const row = { ...input, createdAt };
      rows.push(row);
      return { id: `memory-${rows.length}`, ...row };
    },
  };
}

test("an identical inquiry already saved today is rejected without a second row", async () => {
  const records = memoryRecords();
  const now = Date.parse("2026-10-17T12:00:00.000Z");
  const first = await acceptContactInquiry(valid, now, records);
  assert.equal(first.saved, true);
  await assert.rejects(() => acceptContactInquiry(valid, now + 1, records), (error: unknown) => statusOf(error) === 409);
  assert.equal(records.rows.length, 1);
});

test("only BOF staff roles can review inquiries", () => {
  assert.equal(isBofStaff({ id: "staff", memberships: [{ fleetId: "f1", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] }), true);
  assert.equal(isBofStaff({ id: "review", memberships: [{ fleetId: "f1", roleCode: "BOF_COMPLIANCE_REVIEW", status: "ACTIVE" }] }), true);
  assert.equal(isBofStaff({ id: "inquiry", memberships: [{ fleetId: "inquiry-fleet", roleCode: "BOF_INQUIRY_REVIEW", status: "ACTIVE" }] }), true);
  assert.equal(isBofStaff({ id: "fleet", memberships: [{ fleetId: "f1", roleCode: "FLEET_ADMIN", status: "ACTIVE" }] }), false);
  assert.equal(isBofStaff({ id: "driver", memberships: [{ fleetId: "f1", roleCode: "DRIVER", status: "ACTIVE" }] }), false);
  assert.equal(isBofStaff({ id: "invited", memberships: [{ fleetId: "f1", roleCode: "BOF_OPERATIONS", status: "INVITED" }] }), false);
  assert.equal(isBofStaff(null), false);
});
