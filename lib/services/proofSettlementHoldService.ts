import { randomUUID } from "crypto";

import { createAuditRecord } from "@/lib/audit";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { findLoadByOperatorKey } from "@/lib/services/loadService";

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export async function rejectProofAndHoldSettlement(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  reason: string,
) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  const holdReason = reason.trim();
  if (!holdReason) {
    throw Object.assign(new Error("Rejection reason is required"), { statusCode: 422 });
  }

  const load = await findLoadByOperatorKey(loadKey);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(actor, load.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const store = getOperatingProcessStore();
  const lineage = {
    lifecycleClass: "LIVE" as const,
    originKind: "BOF_CREATED" as const,
    verificationClass: "UNVERIFIED" as const,
    derivationKind: "SOURCE" as const,
    sourceSystem: "BOF",
    sourceRecordId: `proof-reject:${load.id}`,
  };

  const existingProofs = await store.listProofsForLoad(load.fleetId, load.id);
  const latestProof = existingProofs[0] ?? null;
  const proof = latestProof
    ? await store.updateProof(load.fleetId, latestProof.id, {
        status: "REJECTED",
        exceptionStatus: holdReason,
        verifiedBy: actor.id,
        verifiedAt: new Date(),
      })
    : await store.createProof({
        id: randomUUID(),
        fleetId: load.fleetId,
        loadId: load.id,
        proofType: "POD",
        status: "REJECTED",
        exceptionStatus: holdReason,
        verifiedBy: actor.id,
        verifiedAt: new Date(),
        lineage,
        idempotencyKey: `bof:proof-reject:${load.id}`,
      });

  const settlements = await store.listSettlementsForLoad(load.fleetId, load.id);
  const existingSettlement = settlements[0] ?? null;
  const settlement = existingSettlement
    ? await store.updateSettlement(load.fleetId, existingSettlement.id, {
        status: "HELD",
        holdReason,
      })
    : await store.createSettlement({
        id: randomUUID(),
        fleetId: load.fleetId,
        loadId: load.id,
        settlementDate: new Date(),
        payBasis: "LOAD_CONTEXT",
        grossAmount: "0.00",
        deductions: "0.00",
        reimbursements: "0.00",
        advances: "0.00",
        netAmount: "0.00",
        status: "HELD",
        holdReason,
        lineage: { ...lineage, sourceRecordId: `proof-hold:${load.id}` },
        idempotencyKey: `bof:proof-hold:${load.id}`,
      });

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: load.fleetId,
    action: "UPDATED",
    entityType: "LoadProofOfDelivery",
    entityId: proof.id,
    details: {
      event: "operator.proof.rejected",
      loadId: load.id,
      settlementId: settlement.id,
      holdReason,
    },
    metadata: { source: "proof-settlement-hold" },
  });

  return { load, proof, settlement };
}
