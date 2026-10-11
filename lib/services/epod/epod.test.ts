import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { assertCargoPhoto } from "@/lib/services/epod/cargoPhotoEvidence";
import { assertAssignedDriver, assertDeliveryReader, assertFleetOperator } from "@/lib/services/epod/deliveryAuthorization";
import { assertDeliveryTransition, assertEpodFleetMembership } from "@/lib/services/epod/deliveryLifecycle";
import { describeEvidenceStorage } from "@/lib/services/epod/evidenceStore";
import { assembleEpod, assertEpodReady } from "@/lib/services/epod/epodAssembly";
import { assertRecipientAcknowledgment } from "@/lib/services/epod/recipientAcknowledgment";
import { encodeRgbPng } from "@/lib/services/epod/signatureInk";
import { assertProofOperatorReview } from "@/lib/services/proofSettlementHoldService";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const drawnSignature = encodeRgbPng(16, 16, Uint8Array.from({ length: 16 * 16 * 3 }, (_, index) => (index < 48 ? 0 : 255)));
const blankSignature = encodeRgbPng(16, 16, new Uint8Array(16 * 16 * 3).fill(255));
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const member: SessionUserLike = { id: "operator-1", memberships: [{ fleetId: "fleet-a", roleCode: "FLEET_ADMIN", status: "ACTIVE" }] };
const assignedDriver: SessionUserLike = { id: "driver-user", memberships: [{ fleetId: "fleet-a", roleCode: "DRIVER", status: "ACTIVE" }] };
const otherDriver: SessionUserLike = { id: "other-driver", memberships: [{ fleetId: "fleet-a", roleCode: "DRIVER", status: "ACTIVE" }] };
const ordinaryMember: SessionUserLike = { id: "dispatch-1", memberships: [{ fleetId: "fleet-a", roleCode: "DISPATCH", status: "ACTIVE" }] };
const serviceUser: SessionUserLike = { id: "service-1", memberships: [{ fleetId: "fleet-b", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] };
const sameFleetService: SessionUserLike = { id: "service-2", memberships: [{ fleetId: "fleet-a", roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] };

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
}

test("delivery transitions reject skips and accept the same stage once", () => {
  assert.equal(assertDeliveryTransition("DELIVERY_PENDING", "ARRIVED").stage, "ARRIVED");
  assert.equal(assertDeliveryTransition("ARRIVED", "ARRIVED").idempotent, true);
  assert.throws(() => assertDeliveryTransition("DELIVERY_PENDING", "POD_GENERATED"), (error: unknown) => statusOf(error) === 409);
  assert.throws(() => assertDeliveryTransition("POD_GENERATED", "VERIFIED" as "ARRIVED"), (error: unknown) => statusOf(error) === 422);
});

test("fleet membership and demo load keys fail closed", () => {
  assert.throws(() => assertEpodFleetMembership(null, "fleet-a"), (error: unknown) => statusOf(error) === 401);
  assert.throws(() => assertEpodFleetMembership(serviceUser, "fleet-a"), (error: unknown) => statusOf(error) === 403);
  assert.doesNotThrow(() => assertEpodFleetMembership(member, "fleet-a"));
  assert.throws(
    () => assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "L001", fleetId: "fleet-a", mimeType: "image/png", bytes: png }),
    (error: unknown) => statusOf(error) === 422,
  );
});

test("cargo photos reject foreign fleets, web addresses, and caller storage keys", () => {
  assert.equal(assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "load-1", fleetId: "fleet-a", mimeType: "image/png", bytes: png }).role, "LOADED_TRAILER");
  assert.equal(assertCargoPhoto({ role: "EMPTY_TRAILER", loadId: "load-1", fleetId: "fleet-a", mimeType: "image/jpeg", bytes: jpeg }).role, "EMPTY_TRAILER");
  assert.throws(
    () => assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "load-1", fleetId: "fleet-a", evidenceFleetId: "fleet-b", mimeType: "image/png", bytes: png }),
    (error: unknown) => statusOf(error) === 403,
  );
  assert.throws(
    () => assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "load-1", fleetId: "fleet-a", evidenceLoadId: "load-2", mimeType: "image/png", bytes: png }),
    (error: unknown) => statusOf(error) === 422,
  );
  assert.throws(
    () => assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "load-1", fleetId: "fleet-a", mimeType: "image/png", bytes: png, callerStorageKey: "fleet-b/secret" }),
    /storage key/,
  );
  assert.throws(
    () => assertCargoPhoto({ role: "LOADED_TRAILER", loadId: "load-1", fleetId: "fleet-a", mimeType: "image/png", bytes: new Uint8Array() }),
    /required/,
  );
});

test("delivery authority follows the assignment and the fleet administrator role", () => {
  assert.equal(assertAssignedDriver(assignedDriver, "fleet-a", "driver-user"), "ASSIGNED_DRIVER");
  assert.equal(assertDeliveryReader(member, "fleet-a", "driver-user"), "FLEET_OPERATOR");
  assert.throws(() => assertAssignedDriver(member, "fleet-a", "driver-user"), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertAssignedDriver(otherDriver, "fleet-a", "driver-user"), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertAssignedDriver(ordinaryMember, "fleet-a", "driver-user"), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertDeliveryReader(serviceUser, "fleet-a", "driver-user"), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertDeliveryReader(sameFleetService, "fleet-a", "driver-user"), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertAssignedDriver({ id: "DRV-1", memberships: [{ fleetId: "fleet-a", roleCode: "DRIVER", status: "ACTIVE" }] }, "fleet-a", "DRV-1"), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertFleetOperator(assignedDriver, "fleet-a"), (error: unknown) => statusOf(error) === 403);
  assert.doesNotThrow(() => assertFleetOperator(member, "fleet-a"));
  assert.throws(() => assertProofOperatorReview(assignedDriver, "fleet-a"), (error: unknown) => statusOf(error) === 403);
  assert.doesNotThrow(() => assertProofOperatorReview(member, "fleet-a"));
  assert.equal(describeEvidenceStorage().productionDurable, false);
});

test("tablet signature requires identity, disposition, and an immutable png", () => {
  const base = {
    loadId: "load-1",
    name: "Ada Clerk",
    title: "Receiving clerk",
    facility: "Metro Dock",
    disposition: "ACCEPTED",
    exceptions: "",
    refusalReason: "",
    statementAccepted: true,
    channel: "TABLET",
    signatureBytes: drawnSignature,
    mimeType: "image/png",
    alreadyStored: false,
  };
  assert.throws(() => assertRecipientAcknowledgment({ ...base, signatureBytes: png }), /PNG/);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, signatureBytes: blankSignature }), /blank/);
  assert.equal(assertRecipientAcknowledgment(base).authority, "SELF_DECLARED");
  assert.throws(() => assertRecipientAcknowledgment({ ...base, name: " " }), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, title: "" }), (error: unknown) => statusOf(error) === 422);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, disposition: "REFUSED" }), /Refusal reason/);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, disposition: "ACCEPTED_WITH_EXCEPTIONS" }), /Exception description/);
  assert.equal(assertRecipientAcknowledgment({ ...base, disposition: "REFUSED", refusalReason: "Count short" }).disposition, "REFUSED");
  assert.equal(
    assertRecipientAcknowledgment({ ...base, disposition: "ACCEPTED_WITH_EXCEPTIONS", exceptions: "2 cartons short" }).exceptions,
    "2 cartons short",
  );
  const huge = new Uint8Array(2 * 1024 * 1024 + 1);
  huge.set(drawnSignature.subarray(0, 8));
  assert.throws(() => assertRecipientAcknowledgment({ ...base, signatureBytes: huge }), /too large/);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, channel: "PORTAL" }), (error: unknown) => statusOf(error) === 403);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, alreadyStored: true }), (error: unknown) => statusOf(error) === 409);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, existingLoadId: "load-2" }), (error: unknown) => statusOf(error) === 409);
  assert.throws(() => assertRecipientAcknowledgment({ ...base, mimeType: "https://example.test/sign.png" }), /PNG/);
});

test("assembled POD leaves GPS and RFID disconnected and does not verify itself", () => {
  const input = {
    loadId: "load-1",
    loadNumber: "B-100",
    carrierName: "Northline",
    driverName: "Sam Driver",
    truckNumber: "T100",
    trailerNumber: "TR9",
    pickupFacility: "Dallas",
    deliveryFacility: "Atlanta",
    pickupAuthorizationId: "auth-1",
    stage: "ACCEPTED" as const,
    proofStatus: "RECEIVED",
    settlementStatus: "HELD",
    loaded: { evidenceId: "photo-1", capturedAt: "2026-10-10T00:00:00.000Z" },
    empty: { evidenceId: "photo-2", capturedAt: "2026-10-10T02:00:00.000Z" },
    acknowledgment: {
      evidenceId: "sig-1",
      name: "Ada Clerk",
      title: "Receiving clerk",
      facility: "Atlanta dock",
      disposition: "ACCEPTED" as const,
      exceptions: "",
      refusalReason: "",
      statement: "I represent the receiving facility named here and I am authorized to acknowledge this delivery.",
      channel: "TABLET" as const,
      authority: "SELF_DECLARED" as const,
      receivedAt: "2026-10-10T02:05:00.000Z",
      actorId: "driver-1",
    },
    generatedEvidenceId: null,
    generatedAt: null,
  };
  const view = assembleEpod(input);
  assert.equal(view.gps.connected, false);
  assert.equal(view.rfid.connected, false);
  assert.equal(view.operatorVerification, "UNVERIFIED");
  assert.equal(view.settlementHold, true);
  assert.doesNotThrow(() => assertEpodReady(view));
  assert.throws(() => assertEpodReady({ ...view, loadedTrailer: { ...view.loadedTrailer, missing: true, evidenceId: null } }), /incomplete/);
  const verified = assembleEpod({ ...input, proofStatus: "VERIFIED", stage: "POD_GENERATED", generatedEvidenceId: "pod-1", generatedAt: "2026-10-10T03:00:00.000Z" });
  assert.equal(verified.operatorVerification, "VERIFIED");
  assert.equal(verified.settlementHold, true);
});

test("delivery routes keep verification and settlement release out of POD generation", () => {
  const persistence = readFileSync("lib/services/epod/epodPersistence.ts", "utf8");
  const screen = readFileSync("components/dispatch/LoadDeliveryScreen.tsx", "utf8");
  assert.match(persistence, /submitReceivedLoadProof/);
  assert.match(persistence, /pg_advisory_xact_lock/);
  assert.match(readFileSync("prisma/migrations/20261010220000_epod_evidence_role_uniqueness/migration.sql", "utf8"), /OperationalEvidence_epod_role_key/);
  assert.doesNotMatch(persistence, /verifyLoadProof|updateSettlement/);
  assert.match(persistence, /settlementHoldChanged: false/);
  assert.match(screen, /GPS evidence not connected/);
  assert.match(screen, /RFID evidence not connected/);
  assert.match(screen, /Offline signing is not available/);
  assert.doesNotMatch(screen, /token/);
});
