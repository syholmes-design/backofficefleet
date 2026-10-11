import assert from "node:assert/strict";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { verifyLoadProof } from "@/lib/process-intelligence/load-to-cash-service";
import { createMemoryOperatingProcessStore } from "@/lib/process-intelligence/memory-store";
import type { RecordLineage } from "@/lib/process-intelligence/types";
import {
  assertAuthorizedLoadEvidence,
  assertProofCanBeRejected,
  assertProofEvidenceShape,
  assertProofFleetMembership,
  rejectProofInStore,
} from "@/lib/services/proofSettlementHoldService";

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

const serviceUser: SessionUserLike = {
  id: "service-1",
  memberships: [{ fleetId: "fleet-b", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }],
};

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

const evidence = {
  id: "evidence-1",
  fleetId: "fleet-a",
  loadId: "load-1",
  storageKey: "fleet-a/evidence-1/pod.pdf",
};

async function storeWithProof(status: "RECEIVED" | "VERIFIED" = "RECEIVED") {
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
    status,
    evidenceId: "evidence-1",
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
    holdReason: "Existing hold",
    lineage,
    idempotencyKey: "bof:settlement:settlement-1",
  });
  return store;
}

test("empty evidence, a missing reference, a web address, and a demo key are refused", () => {
  assert.throws(() => assertProofEvidenceShape(""), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertProofEvidenceShape("   "), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertProofEvidenceShape("https://example.test/pod"), /not delivery evidence/);
  assert.throws(() => assertProofEvidenceShape("L001"), (error: unknown) => statusOf(error) === 422);
  assert.throws(
    () => assertAuthorizedLoadEvidence({ evidenceId: "evidence-1", fleetId: "fleet-a", loadId: "load-1", evidence: null }),
    (error: unknown) => statusOf(error) === 404,
  );
});

test("a stored fleet file for this load is an authorized evidence reference", () => {
  assert.equal(
    assertAuthorizedLoadEvidence({ evidenceId: "evidence-1", fleetId: "fleet-a", loadId: "load-1", evidence }),
    "evidence-1",
  );
});

test("evidence from another fleet or another load is refused", () => {
  assert.throws(
    () =>
      assertAuthorizedLoadEvidence({
        evidenceId: "evidence-1",
        fleetId: "fleet-a",
        loadId: "load-1",
        evidence: { ...evidence, fleetId: "fleet-b" },
      }),
    (error: unknown) => statusOf(error) === 403,
  );
  assert.throws(
    () =>
      assertAuthorizedLoadEvidence({
        evidenceId: "evidence-1",
        fleetId: "fleet-a",
        loadId: "load-1",
        evidence: { ...evidence, loadId: "load-2" },
      }),
    (error: unknown) => statusOf(error) === 422,
  );
  assert.throws(
    () =>
      assertAuthorizedLoadEvidence({
        evidenceId: "evidence-1",
        fleetId: "fleet-a",
        loadId: "load-1",
        evidence: { ...evidence, storageKey: "https://example.test/pod.pdf" },
      }),
    /no stored fleet file/,
  );
});

test("aggregator and service roles are refused without membership on the load fleet", () => {
  assert.throws(() => assertProofFleetMembership(null, "fleet-a"), (error: unknown) => statusOf(error) === 401);
  assert.throws(() => assertProofFleetMembership(serviceUser, "fleet-a"), (error: unknown) => statusOf(error) === 403);
  assert.throws(
    () => assertProofFleetMembership({ id: "aggregator-1", memberships: [] }, "fleet-a"),
    (error: unknown) => statusOf(error) === 403,
  );
  assert.doesNotThrow(() => assertProofFleetMembership(operator, "fleet-a"));
});

test("rejection requires the selected received proof and a reason", async () => {
  const store = await storeWithProof();
  await assert.rejects(
    () => rejectProofInStore(store, operator, { fleetId: "fleet-a", loadId: "load-1", proofId: "", reason: "Missing scan" }),
    (error: unknown) => statusOf(error) === 422,
  );
  await assert.rejects(
    () => rejectProofInStore(store, operator, { fleetId: "fleet-a", loadId: "load-1", proofId: "proof-1", reason: " " }),
    (error: unknown) => statusOf(error) === 422,
  );
  await assert.rejects(
    () => rejectProofInStore(store, operator, { fleetId: "fleet-a", loadId: "load-1", proofId: "missing", reason: "Missing scan" }),
    (error: unknown) => statusOf(error) === 404,
  );
  await assert.rejects(
    () => rejectProofInStore(store, serviceUser, { fleetId: "fleet-a", loadId: "load-1", proofId: "proof-1", reason: "Missing scan" }),
    (error: unknown) => statusOf(error) === 403,
  );
  await assert.rejects(
    () => rejectProofInStore(store, operator, { fleetId: "fleet-a", loadId: "L001", proofId: "proof-1", reason: "Missing scan" }),
    (error: unknown) => statusOf(error) === 422,
  );
  const rejected = await rejectProofInStore(store, operator, {
    fleetId: "fleet-a",
    loadId: "load-1",
    proofId: "proof-1",
    reason: "Missing scan",
  });
  assert.equal(rejected.proof.status, "REJECTED");
  assert.equal(rejected.settlement.status, "HELD");
  const events = await store.listEventsForLoad("fleet-a", "load-1");
  assert.equal(events.some((event) => event.eventType === "POD_VERIFIED"), false);
});

test("a verified proof stays verified and the hold stays in place", async () => {
  const store = await storeWithProof("RECEIVED");
  await verifyLoadProof(store, operator, { fleetId: "fleet-a", proofId: "proof-1", verifiedBy: "operator-1" });
  await assert.rejects(
    () =>
      rejectProofInStore(store, operator, {
        fleetId: "fleet-a",
        loadId: "load-1",
        proofId: "proof-1",
        reason: "Changed my mind",
      }),
    (error: unknown) => statusOf(error) === 409,
  );
  const proof = await store.getProof("fleet-a", "proof-1");
  assert.equal(proof?.status, "VERIFIED");
  const events = await store.listEventsForLoad("fleet-a", "load-1");
  assert.equal(events.filter((event) => event.eventType === "POD_VERIFIED").length, 1);
  const settlements = await store.listSettlementsForLoad("fleet-a", "load-1");
  assert.equal(settlements[0]?.status, "HELD");
  assert.throws(
    () =>
      assertProofCanBeRejected({
        loadKey: "load-1",
        proofId: "proof-1",
        reason: "Changed my mind",
        proof: { fleetId: "fleet-a", loadId: "load-1", status: "VERIFIED" },
        load: { id: "load-1", fleetId: "fleet-a" },
      }),
    /settlement hold is unchanged/,
  );
});
