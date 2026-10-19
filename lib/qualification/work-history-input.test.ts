import assert from "node:assert/strict";
import test from "node:test";
import { validateWorkHistoryInput } from "@/lib/qualification/work-history-input";

const now = new Date("2026-10-19T12:00:00Z");

test("accepts an employer with a start date and an optional end date", () => {
  const current = validateWorkHistoryInput({ employerName: "Great Lakes Freight (fictional)", startDate: "2022-03-01" }, now);
  assert.deepEqual(current.errors, []);
  assert.equal(current.input?.endDate, null);
  const past = validateWorkHistoryInput({ employerName: "Buckeye Haulers", startDate: "2019-01-15", endDate: "2022-02-28" }, now);
  assert.equal(past.input?.endDate?.toISOString().slice(0, 10), "2022-02-28");
});

test("rejects missing employer, missing or future start, bad formats and reversed dates", () => {
  assert.ok(validateWorkHistoryInput({ startDate: "2020-01-01" }, now).errors.includes("Employer name is required"));
  assert.ok(validateWorkHistoryInput({ employerName: "Acme" }, now).errors.includes("Start date is required"));
  assert.ok(validateWorkHistoryInput({ employerName: "Acme", startDate: "2027-01-01" }, now).errors.includes("Start date cannot be in the future"));
  assert.ok(validateWorkHistoryInput({ employerName: "Acme", startDate: "01/02/2020" }, now).errors[0].startsWith("Start date must be a date"));
  assert.ok(validateWorkHistoryInput({ employerName: "Acme", startDate: "2021-01-01", endDate: "2020-01-01" }, now).errors.includes("End date cannot be before the start date"));
  assert.deepEqual(validateWorkHistoryInput(null, now).errors, ["Request body must be an object"]);
});
