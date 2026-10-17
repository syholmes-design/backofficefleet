import assert from "node:assert/strict";
import test from "node:test";

import { ContactInquiryStatus } from "@prisma/client";

import {
  InquiryManagementError,
  parseInquiryListQuery,
  serializeActivity,
  serializeInquiry,
} from "@/lib/contact/inquiryManagement";

test("serializeInquiry exposes workflow fields for the dashboard", () => {
  const created = new Date("2026-10-17T12:00:00.000Z");
  const payload = serializeInquiry({
    id: "inq_1",
    fullName: "Avery Cole",
    companyName: "North Line",
    email: "avery@example.com",
    phone: null,
    organizationType: "MOTOR_CARRIER",
    services: ["Operations & Compliance"],
    message: "Need help with DQ files.",
    department: "Sales",
    status: ContactInquiryStatus.NEW,
    assignedToUserId: null,
    nextFollowUpAt: null,
    lastActivityAt: created,
    createdAt: created,
    updatedAt: created,
    assignedTo: null,
  });
  assert.equal(payload.status, "NEW");
  assert.equal(payload.department, "Sales");
  assert.equal(payload.category, "MOTOR_CARRIER");
});

test("parseInquiryListQuery rejects unknown status filters", () => {
  const params = new URLSearchParams({ status: "SPAM" });
  assert.throws(() => parseInquiryListQuery(params), (error: unknown) => {
    assert.ok(error instanceof InquiryManagementError);
    assert.equal(error.statusCode, 422);
    return true;
  });
});

test("serializeActivity includes actor metadata", () => {
  const created = new Date("2026-10-17T13:00:00.000Z");
  const payload = serializeActivity({
    id: "act_1",
    inquiryId: "inq_1",
    activityType: "NOTE",
    description: "Left voicemail.",
    actorUserId: "user_1",
    metadata: null,
    createdAt: created,
    actor: { id: "user_1", name: "Reviewer", email: "reviewer@example.com" },
  });
  assert.equal(payload.description, "Left voicemail.");
  assert.equal(payload.actor?.email, "reviewer@example.com");
});
