import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { verifyLoadProof } from "@/lib/process-intelligence/load-to-cash-service";
import { createMemoryOperatingProcessStore } from "@/lib/process-intelligence/memory-store";
import { ProcessIntelligenceError, type RecordLineage } from "@/lib/process-intelligence/types";
import { assertProofCanBeVerified } from "@/lib/services/proofSettlementHoldService";

const lineage: RecordLineage = {
  lifecycleClass: "LIVE",
  originKind: "BOF_CREATED",
  verificationClass: "UNVERIFIED",
  derivationKind: "SOURCE",
  sourceSystem: "BOF",
  sourceRecordId: "proof-1",
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

async function seed() {
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
  await store.createProof({
    id: "proof-1",
    fleetId: "fleet-a",
    loadId: "load-1",
    proofType: "POD",
    status: "RECEIVED",
    lineage,
    idempotencyKey: "bof:proof:proof-1",
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

test("an authorized operator verifies a stored proof and records POD_VERIFIED", async () => {
  const store = await seed();
  const proof = await verifyLoadProof(store, operator, {
    fleetId: "fleet-a",
    proofId: "proof-1",
    verifiedBy: "operator-1",
  });
  assert.equal(proof.status, "VERIFIED");
  assert.equal(proof.verifiedBy, "operator-1");
  const events = await store.listEventsForLoad("fleet-a", "load-1");
  assert.equal(events.some((event) => event.eventType === "POD_VERIFIED"), true);
  const settlements = await store.listSettlementsForLoad("fleet-a", "load-1");
  assert.equal(settlements[0]?.status, "HELD");
  assert.equal(settlements[0]?.holdReason, "Proof rejected by operator review");
});

test("verification requires an authenticated fleet member", async () => {
  const store = await seed();
  await assert.rejects(
    () => verifyLoadProof(store, null, { fleetId: "fleet-a", proofId: "proof-1", verifiedBy: "operator-1" }),
    (error: unknown) => error instanceof ProcessIntelligenceError && error.statusCode === 401,
  );
});

test("verification denies a member of another fleet", async () => {
  const store = await seed();
  const otherFleet: SessionUserLike = {
    id: "operator-2",
    memberships: [{ fleetId: "fleet-b", roleCode: "FLEET_ADMIN", status: "ACTIVE" }],
  };
  await assert.rejects(
    () => verifyLoadProof(store, otherFleet, { fleetId: "fleet-a", proofId: "proof-1", verifiedBy: "operator-2" }),
    (error: unknown) => error instanceof ProcessIntelligenceError && error.statusCode === 403,
  );
});

test("a missing proof is not verified", async () => {
  const store = await seed();
  await assert.rejects(
    () => verifyLoadProof(store, operator, { fleetId: "fleet-a", proofId: "missing", verifiedBy: "operator-1" }),
    (error: unknown) => error instanceof ProcessIntelligenceError && error.statusCode === 404,
  );
});

test("demo keys, a missing confirmation, a foreign proof, and a rejected proof are refused", () => {
  const load = { id: "load-1", fleetId: "fleet-a" };
  const proof = { fleetId: "fleet-a", loadId: "load-1", status: "RECEIVED" };
  assert.throws(
    () => assertProofCanBeVerified({ loadKey: "L001", proofId: "proof-1", confirm: true, proof, load }),
    (error: unknown) => statusOf(error) === 422,
  );
  assert.throws(
    () => assertProofCanBeVerified({ loadKey: "load-1", proofId: "", confirm: true, proof, load }),
    (error: unknown) => statusOf(error) === 422,
  );
  assert.throws(
    () => assertProofCanBeVerified({ loadKey: "load-1", proofId: "proof-1", confirm: false, proof, load }),
    (error: unknown) => statusOf(error) === 422,
  );
  assert.throws(
    () =>
      assertProofCanBeVerified({
        loadKey: "load-1",
        proofId: "proof-9",
        confirm: true,
        proof: null,
        load,
      }),
    (error: unknown) => statusOf(error) === 404,
  );
  assert.throws(
    () =>
      assertProofCanBeVerified({
        loadKey: "load-1",
        proofId: "proof-1",
        confirm: true,
        proof: { ...proof, status: "REJECTED" },
        load,
      }),
    /settlement hold is unchanged/,
  );
});

test("the live proof routes keep rejection and do not release a hold on verification", () => {
  const service = readFileSync("lib/services/proofSettlementHoldService.ts", "utf8");
  const verifyRoute = readFileSync("app/api/dispatch/load/[loadId]/proof/verify/route.ts", "utf8");
  const rejectRoute = readFileSync("app/api/dispatch/load/[loadId]/proof/reject/route.ts", "utf8");
  const detail = readFileSync("components/dispatch/LoadDetailContent.tsx", "utf8");
  assert.match(rejectRoute, /rejectProofAndHoldSettlement/);
  assert.match(service, /status: "HELD"/);
  assert.match(service, /verifyLoadProof/);
  assert.match(service, /settlementHoldChanged: false/);
  assert.doesNotMatch(service.slice(service.indexOf("export async function verifyStoredLoadProof")), /updateSettlement/);
  assert.match(verifyRoute, /AUTH_REQUIRED/);
  assert.match(verifyRoute, /verifyStoredLoadProof/);
  assert.match(detail, /\/proof\/verify/);
  assert.match(detail, /settlement hold stays as stored/i);
  assert.match(detail, /ProofRejectHoldForm/);
});
