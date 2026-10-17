import assert from "node:assert/strict";
import test from "node:test";
import { buildLoadFinanceHandoff } from "@/lib/load-finance-handoff";

test("buildLoadFinanceHandoff blocks settlement without verified POD", () => {
  const handoff = buildLoadFinanceHandoff({
    id: "load_1",
    status: "DELIVERED",
    referenceNumber: "REF-1",
    proofsOfDelivery: [{ id: "p1", status: "RECEIVED", verifiedAt: null, lifecycleClass: "LIVE" }],
    invoices: [],
    settlements: [],
    operatingExceptions: [],
  });

  assert.equal(handoff.settlementEligibility.state, "INSUFFICIENT_EVIDENCE");
  assert.ok(handoff.settlementEligibility.reasons.length > 0);
});

test("buildLoadFinanceHandoff flags open exceptions as blocked", () => {
  const handoff = buildLoadFinanceHandoff({
    id: "load_2",
    status: "DELIVERED",
    referenceNumber: "REF-2",
    proofsOfDelivery: [{ id: "p1", status: "VERIFIED", verifiedAt: new Date(), lifecycleClass: "LIVE" }],
    invoices: [{ id: "inv1", status: "SUBMITTED" }],
    settlements: [{ id: "s1", status: "CREATED", holdReason: null, netAmount: 100 as never, lifecycleClass: "LIVE" }],
    operatingExceptions: [{ id: "e1", exceptionType: "SHORTAGE", status: "OPEN", deviation: "SHORT" }],
  });

  assert.equal(handoff.settlementEligibility.state, "BLOCKED");
});
