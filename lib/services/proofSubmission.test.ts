import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { recordLoadProof } from "@/lib/process-intelligence/load-to-cash-service";
import { createMemoryOperatingProcessStore } from "@/lib/process-intelligence/memory-store";
import { ProcessIntelligenceError, type RecordLineage } from "@/lib/process-intelligence/types";
import { assertProofSubmission } from "@/lib/services/proofSettlementHoldService";

const lineage: RecordLineage = {
  lifecycleClass: "LIVE",
  originKind: "BOF_CREATED",
  verificationClass: "UNVERIFIED",
  derivationKind: "SOURCE",
  sourceSystem: "BOF",
  sourceRecordId: "proof-received:load-1:POD:1",
};

const operator: SessionUserLike = {
  id: "operator-1",
  memberships: [{ fleetId: "fleet-a", roleCode: "FLEET_ADMIN", status: "ACTIVE" }],
};

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

async function storeWithLoad() {
  const store = createMemoryOperatingProcessStore();
  await store.createLoad({
    id: "load-1",
    fleetId: "fleet-a",
    customerName: "Northline",
    origin: "Dallas, TX",
    destination: "Atlanta, GA",
    status: "PLANNED",
    lineage,
  });
  await store.createSettlement({
    id: "settlement-1",
    fleetId: "fleet-a",
    loadId: "load-1",
    settlementDate: new Date("2026-10-01T00:00:00.000Z"),
    grossAmount: "0.00",
    deductions: "0.00",
    reimbursements: "0.00",
    advances: "0.00",
    netAmount: "0.00",
    status: "HELD",
    holdReason: "Proof rejected by operator review",
    lineage,
    idempotencyKey: "bof:settlement:settlement-1",
  });
  return store;
}

test("submitting proof records RECEIVED and POD_RECEIVED without verifying it", async () => {
  const store = await storeWithLoad();
  const created = await recordLoadProof(store, operator, {
    fleetId: "fleet-a",
    loadId: "load-1",
    proofType: "POD",
    status: "RECEIVED",
    idempotencyKey: "bof:proof-received:load-1:POD:1",
    lineage,
  });
  assert.equal(created.duplicate, false);
  assert.equal(created.record.status, "RECEIVED");
  assert.equal(created.record.verifiedBy ?? null, null);
  const again = await recordLoadProof(store, operator, {
    fleetId: "fleet-a",
    loadId: "load-1",
    proofType: "POD",
    status: "RECEIVED",
    idempotencyKey: "bof:proof-received:load-1:POD:1",
    lineage,
  });
  assert.equal(again.duplicate, true);
  assert.equal(again.record.id, created.record.id);
  const events = await store.listEventsForLoad("fleet-a", "load-1");
  assert.equal(events.filter((event) => event.eventType === "POD_RECEIVED").length, 1);
  assert.equal(events.some((event) => event.eventType === "POD_VERIFIED"), false);
  const settlements = await store.listSettlementsForLoad("fleet-a", "load-1");
  assert.equal(settlements[0]?.status, "HELD");
});

test("proof submission refuses an unauthenticated caller and another fleet", async () => {
  const store = await storeWithLoad();
  await assert.rejects(
    () =>
      recordLoadProof(store, null, {
        fleetId: "fleet-a",
        loadId: "load-1",
        proofType: "POD",
        status: "RECEIVED",
        idempotencyKey: "bof:proof-received:load-1:POD:2",
      }),
    (error: unknown) => error instanceof ProcessIntelligenceError && error.statusCode === 401,
  );
  const otherFleet: SessionUserLike = {
    id: "operator-2",
    memberships: [{ fleetId: "fleet-b", roleCode: "FLEET_ADMIN", status: "ACTIVE" }],
  };
  await assert.rejects(
    () =>
      recordLoadProof(store, otherFleet, {
        fleetId: "fleet-a",
        loadId: "load-1",
        proofType: "POD",
        status: "RECEIVED",
        idempotencyKey: "bof:proof-received:load-1:POD:3",
      }),
    (error: unknown) => error instanceof ProcessIntelligenceError && error.statusCode === 403,
  );
});

test("demo keys, location proof, and web addresses are not submission evidence", () => {
  assert.equal(assertProofSubmission("load-1", "POD"), "POD");
  assert.throws(() => assertProofSubmission("L001", "POD"), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertProofSubmission("load-1", "GEOLOCATION"), /not delivery evidence/);
  assert.throws(() => assertProofSubmission("load-1", "https://example.test/pod"), /not delivery evidence/);
  assert.throws(() => assertProofSubmission("load-1", "INVOICE"), /not supported/);
});

test("the live proof submission route stays received and does not release a hold", () => {
  const service = readFileSync("lib/services/proofSettlementHoldService.ts", "utf8");
  const route = readFileSync("app/api/dispatch/load/[loadId]/proof/route.ts", "utf8");
  const detail = readFileSync("components/dispatch/LoadDetailContent.tsx", "utf8");
  const submit = service.slice(service.indexOf("export async function submitReceivedLoadProof"));
  const submitBody = submit.slice(0, submit.indexOf("export async function listStoredLoadProofs"));
  assert.match(route, /AUTH_REQUIRED/);
  assert.match(route, /submitReceivedLoadProof/);
  assert.match(route, /evidenceId/);
  assert.match(submitBody, /status: "RECEIVED"/);
  assert.match(submitBody, /recordLoadProof/);
  assert.match(submitBody, /assertProofFleetMembership/);
  assert.match(submitBody, /assertAuthorizedLoadEvidence/);
  assert.match(submitBody, /evidenceId: authorizedEvidenceId/);
  assert.match(submitBody, /settlementHoldChanged: false/);
  assert.doesNotMatch(submitBody, /updateSettlement|authorizedFleetAccess|documentId/);
  assert.match(detail, /\/proof`, \{/);
  assert.match(detail, /does not upload a file, accept a web address, or mark the proof verified/);
  assert.match(detail, /Operational evidence id/);
  assert.doesNotMatch(detail, /type="url"|type="file"/);
});
