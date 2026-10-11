import { randomUUID } from "crypto";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { createAuditRecord } from "@/lib/audit";
import { recordLoadProof, verifyLoadProof } from "@/lib/process-intelligence/load-to-cash-service";
import type { LoadProofType } from "@/lib/process-intelligence/types";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import type { OperatingProcessStore } from "@/lib/process-intelligence/store";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";
import { prisma } from "@/lib/prisma";
import { findLoadByOperatorKey } from "@/lib/services/loadService";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

const RECEIVED_PROOF_TYPES = ["POD", "BOL", "PHOTO", "SIGNATURE", "OTHER"] as const;

export function assertProofSubmission(loadKey: string, proofType: string): LoadProofType {
  rejectDemoOperationalKey(loadKey, "loadId");
  if (proofType === "GEOLOCATION" || /https?:\/\//i.test(proofType)) {
    throw Object.assign(new Error("Location proof and web addresses are not delivery evidence."), { statusCode: 422 });
  }
  if (!RECEIVED_PROOF_TYPES.includes(proofType as (typeof RECEIVED_PROOF_TYPES)[number])) {
    throw Object.assign(new Error("Proof type is not supported."), { statusCode: 422 });
  }
  return proofType as LoadProofType;
}

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export function assertProofFleetMembership(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  requireSessionUser(sessionUser);
  if (sessionUser?.id) rejectDemoOperationalKey(sessionUser.id, "actorId");
  if (sessionUser?.email) rejectDemoOperationalKey(sessionUser.email, "actorEmail");
  const access = requireFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Fleet membership is required."), { statusCode: 403 });
  }
}

export function assertProofOperatorReview(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  assertProofFleetMembership(sessionUser, fleetId);
  const access = requireFleetAccess(sessionUser, fleetId, ["FLEET_ADMIN"]);
  if (!access.allowed) {
    throw Object.assign(
      new Error("Operator review requires a fleet administrator. Collecting a signature does not verify the POD."),
      { statusCode: 403 },
    );
  }
}

export type ProofEvidenceReference = {
  id: string;
  fleetId: string;
  loadId: string | null;
  storageKey: string;
};

export function assertProofEvidenceShape(evidenceId: string) {
  const id = evidenceId.trim();
  if (!id) {
    throw Object.assign(new Error("Evidence reference is required."), { statusCode: 422 });
  }
  if (/https?:\/\//i.test(id)) {
    throw Object.assign(new Error("A web address is not delivery evidence."), { statusCode: 422 });
  }
  rejectDemoOperationalKey(id, "evidenceId");
  return id;
}

export function assertAuthorizedLoadEvidence(input: {
  evidenceId: string;
  fleetId: string;
  loadId: string;
  evidence: ProofEvidenceReference | null;
}) {
  const id = assertProofEvidenceShape(input.evidenceId);
  if (!input.evidence || input.evidence.id !== id) {
    throw Object.assign(new Error("Evidence not found."), { statusCode: 404 });
  }
  if (input.evidence.fleetId !== input.fleetId) {
    throw Object.assign(new Error("Evidence belongs to another fleet."), { statusCode: 403 });
  }
  if (input.evidence.loadId !== input.loadId) {
    throw Object.assign(new Error("Evidence is not associated with this load."), { statusCode: 422 });
  }
  const storageKey = input.evidence.storageKey.trim();
  if (!storageKey || /https?:\/\//i.test(storageKey)) {
    throw Object.assign(new Error("Evidence has no stored fleet file."), { statusCode: 422 });
  }
  return id;
}

export function assertProofCanBeRejected(input: {
  loadKey: string;
  proofId: string;
  reason: string;
  proof: { fleetId: string; loadId: string; status: string } | null;
  load: { id: string; fleetId: string };
}) {
  rejectDemoOperationalKey(input.loadKey, "loadId");
  const proofId = input.proofId.trim();
  if (!proofId) {
    throw Object.assign(new Error("Proof is required"), { statusCode: 422 });
  }
  rejectDemoOperationalKey(proofId, "proofId");
  const reason = input.reason.trim();
  if (!reason) {
    throw Object.assign(new Error("Rejection reason is required"), { statusCode: 422 });
  }
  if (!input.proof || input.proof.loadId !== input.load.id || input.proof.fleetId !== input.load.fleetId) {
    throw Object.assign(new Error("Proof not found"), { statusCode: 404 });
  }
  if (input.proof.status === "VERIFIED") {
    throw Object.assign(
      new Error("A verified proof cannot be rejected. The settlement hold is unchanged."),
      { statusCode: 409 },
    );
  }
  if (input.proof.status !== "RECEIVED") {
    throw Object.assign(new Error("Only a received proof can be rejected."), { statusCode: 409 });
  }
  return { proofId, reason };
}

export async function rejectProofInStore(
  store: OperatingProcessStore,
  sessionUser: SessionUserLike | null | undefined,
  input: { fleetId: string; loadId: string; proofId: string; reason: string },
) {
  assertProofFleetMembership(sessionUser, input.fleetId);
  const actor = sessionUser as SessionUserLike & { id: string };
  const proof = input.proofId.trim() ? await store.getProof(input.fleetId, input.proofId.trim()) : null;
  const decision = assertProofCanBeRejected({
    loadKey: input.loadId,
    proofId: input.proofId,
    reason: input.reason,
    proof,
    load: { id: input.loadId, fleetId: input.fleetId },
  });
  const rejected = await store.updateProof(input.fleetId, decision.proofId, {
    status: "REJECTED",
    exceptionStatus: decision.reason,
  });
  const settlements = await store.listSettlementsForLoad(input.fleetId, input.loadId);
  const existingSettlement = settlements[0] ?? null;
  const lineage = {
    lifecycleClass: "LIVE" as const,
    originKind: "BOF_CREATED" as const,
    verificationClass: "UNVERIFIED" as const,
    derivationKind: "SOURCE" as const,
    sourceSystem: "BOF",
    sourceRecordId: `proof-hold:${input.loadId}`,
  };
  const settlement = existingSettlement
    ? await store.updateSettlement(input.fleetId, existingSettlement.id, {
        status: "HELD",
        holdReason: decision.reason,
      })
    : await store.createSettlement({
        id: randomUUID(),
        fleetId: input.fleetId,
        loadId: input.loadId,
        settlementDate: new Date(),
        payBasis: "LOAD_CONTEXT",
        grossAmount: "0.00",
        deductions: "0.00",
        reimbursements: "0.00",
        advances: "0.00",
        netAmount: "0.00",
        status: "HELD",
        holdReason: decision.reason,
        lineage,
        idempotencyKey: `bof:proof-hold:${input.loadId}`,
      });
  return { actor, proof: rejected, settlement };
}

export async function rejectProofAndHoldSettlement(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  proofId: string,
  reason: string,
) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  rejectDemoOperationalKey(loadKey, "loadId");
  const load = await findLoadByOperatorKey(loadKey);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  assertProofOperatorReview(actor, load.fleetId);
  const rejected = await rejectProofInStore(getOperatingProcessStore(), actor, {
    fleetId: load.fleetId,
    loadId: load.id,
    proofId,
    reason,
  });

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: load.fleetId,
    action: "UPDATED",
    entityType: "LoadProofOfDelivery",
    entityId: rejected.proof.id,
    details: {
      event: "operator.proof.rejected",
      loadId: load.id,
      proofId: rejected.proof.id,
      settlementId: rejected.settlement.id,
      holdReason: reason.trim(),
    },
    metadata: { source: "proof-settlement-hold" },
  });

  return { load, proof: rejected.proof, settlement: rejected.settlement };
}

export function assertProofCanBeVerified(input: {
  loadKey: string;
  proofId: string;
  confirm: boolean;
  proof: { fleetId: string; loadId: string; status: string } | null;
  load: { id: string; fleetId: string };
}) {
  rejectDemoOperationalKey(input.loadKey, "loadId");
  const proofId = input.proofId.trim();
  if (!proofId) {
    throw Object.assign(new Error("Proof is required"), { statusCode: 422 });
  }
  rejectDemoOperationalKey(proofId, "proofId");
  if (input.confirm !== true) {
    throw Object.assign(new Error("Proof verification requires an explicit operator confirmation"), { statusCode: 422 });
  }
  if (!input.proof || input.proof.loadId !== input.load.id || input.proof.fleetId !== input.load.fleetId) {
    throw Object.assign(new Error("Proof not found"), { statusCode: 404 });
  }
  if (input.proof.status === "REJECTED") {
    throw Object.assign(
      new Error("A rejected proof cannot be verified. The settlement hold is unchanged."),
      { statusCode: 409 },
    );
  }
}

export async function submitReceivedLoadProof(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  proofType: string,
  evidenceId: string,
) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  const supportedType = assertProofSubmission(loadKey, proofType);
  const requestedEvidenceId = assertProofEvidenceShape(evidenceId);
  const load = await findLoadByOperatorKey(loadKey);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  assertProofFleetMembership(actor, load.fleetId);
  const evidence = await prisma.operationalEvidence.findUnique({
    where: { id: requestedEvidenceId },
    select: { id: true, fleetId: true, loadId: true, storageKey: true },
  });
  const authorizedEvidenceId = assertAuthorizedLoadEvidence({
    evidenceId: requestedEvidenceId,
    fleetId: load.fleetId,
    loadId: load.id,
    evidence,
  });

  const store = getOperatingProcessStore();
  const existing = await store.listProofsForLoad(load.fleetId, load.id);
  const open = existing.find(
    (proof) =>
      proof.evidenceId === authorizedEvidenceId && (proof.status === "RECEIVED" || proof.status === "VERIFIED"),
  );
  if (open) {
    return { loadId: load.id, proof: open, duplicate: true as const, settlementHoldChanged: false as const };
  }

  const sourceRecordId = `proof-received:${load.id}:${supportedType}:${authorizedEvidenceId}`;
  const created = await recordLoadProof(store, actor, {
    fleetId: load.fleetId,
    loadId: load.id,
    proofType: supportedType,
    status: "RECEIVED",
    evidenceId: authorizedEvidenceId,
    idempotencyKey: `bof:${sourceRecordId}`,
    lineage: {
      lifecycleClass: "LIVE",
      originKind: "BOF_CREATED",
      verificationClass: "UNVERIFIED",
      derivationKind: "SOURCE",
      sourceSystem: "BOF",
      sourceRecordId,
    },
  });

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: load.fleetId,
    action: "CREATED",
    entityType: "LoadProofOfDelivery",
    entityId: created.record.id,
    details: {
      event: "operator.proof.submitted",
      loadId: load.id,
      proofType: supportedType,
      evidenceId: authorizedEvidenceId,
      proofStatus: created.record.status,
      duplicate: created.duplicate,
      settlementHoldChanged: false,
    },
    metadata: { source: "proof-submission" },
  });

  return {
    loadId: load.id,
    proof: created.record,
    duplicate: created.duplicate,
    settlementHoldChanged: false as const,
  };
}

export async function listStoredLoadProofs(sessionUser: SessionUserLike | null | undefined, loadKey: string) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  rejectDemoOperationalKey(loadKey, "loadId");
  const load = await findLoadByOperatorKey(loadKey);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  assertProofFleetMembership(actor, load.fleetId);
  const proofs = await getOperatingProcessStore().listProofsForLoad(load.fleetId, load.id);
  return {
    loadId: load.id,
    proofs: proofs.map((proof) => ({
      id: proof.id,
      status: proof.status,
      proofType: proof.proofType,
    })),
  };
}

export async function verifyStoredLoadProof(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  proofId: string,
  confirm: boolean,
) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  rejectDemoOperationalKey(loadKey, "loadId");
  const load = await findLoadByOperatorKey(loadKey);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  assertProofOperatorReview(actor, load.fleetId);

  const store = getOperatingProcessStore();
  const proof = proofId.trim() ? await store.getProof(load.fleetId, proofId.trim()) : null;
  assertProofCanBeVerified({
    loadKey,
    proofId,
    confirm,
    proof,
    load: { id: load.id, fleetId: load.fleetId },
  });
  const verified = await verifyLoadProof(store, actor, {
    fleetId: load.fleetId,
    proofId: proofId.trim(),
    verifiedBy: actor.id,
  });
  const settlements = await store.listSettlementsForLoad(load.fleetId, load.id);

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: load.fleetId,
    action: "UPDATED",
    entityType: "LoadProofOfDelivery",
    entityId: verified.id,
    details: {
      event: "operator.proof.verified",
      loadId: load.id,
      proofStatus: verified.status,
      settlementHoldChanged: false,
    },
    metadata: { source: "proof-verification" },
  });

  return { loadId: load.id, proof: verified, settlements, settlementHoldChanged: false as const };
}

export function proofRouteStatus(error: unknown) {
  if (error instanceof ProcessIntelligenceError) return error.statusCode;
  if (error && typeof error === "object" && "statusCode" in error) {
    return Number((error as { statusCode?: number }).statusCode) || 500;
  }
  return 500;
}
