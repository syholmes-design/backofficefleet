import type { PickupStopReasonCode } from "@prisma/client";

export const PICKUP_POLICY_VERSION = "bof-secure-pickup-v1" as const;

export type PickupExpectedIdentities = {
  authorizationId: string;
  loadId: string;
  driverId: string;
  tractorEquipmentId: string;
  trailerEquipmentId: string | null;
};

export type PickupPresentedIdentities = {
  authorizationId?: string | null;
  loadId?: string | null;
  driverId?: string | null;
  tractorEquipmentId?: string | null;
  trailerEquipmentId?: string | null;
};

export type PickupReconciliationDecision = {
  match: boolean;
  reasonCodes: PickupStopReasonCode[];
  summary: string;
};

function sameOptionalId(expected: string | null, presented: string | null | undefined): boolean {
  const presentedValue = presented?.trim() ? presented.trim() : null;
  return expected === presentedValue;
}

export function evaluatePickupReconciliation(
  expected: PickupExpectedIdentities,
  presented: PickupPresentedIdentities,
): PickupReconciliationDecision {
  const reasonCodes: PickupStopReasonCode[] = [];

  if (!presented.authorizationId?.trim() || presented.authorizationId.trim() !== expected.authorizationId) {
    reasonCodes.push("WRONG_LOAD");
  }
  if (!presented.loadId?.trim() || presented.loadId.trim() !== expected.loadId) {
    reasonCodes.push("WRONG_LOAD");
  }
  if (!presented.driverId?.trim() || presented.driverId.trim() !== expected.driverId) {
    reasonCodes.push("WRONG_DRIVER");
  }
  if (!presented.tractorEquipmentId?.trim() || presented.tractorEquipmentId.trim() !== expected.tractorEquipmentId) {
    reasonCodes.push("WRONG_TRACTOR");
  }
  if (!sameOptionalId(expected.trailerEquipmentId, presented.trailerEquipmentId)) {
    reasonCodes.push("WRONG_TRAILER");
  }

  const uniqueCodes = [...new Set(reasonCodes)];
  if (uniqueCodes.length === 0) {
    return {
      match: true,
      reasonCodes: [],
      summary: "Presented identities match the bound DispatchAssignment authorization. Physical dock identity was not verified.",
    };
  }

  return {
    match: false,
    reasonCodes: uniqueCodes,
    summary: `Pickup STOPPED — ${uniqueCodes.join(", ")}`,
  };
}

export function hasPresentedIdentities(presented: PickupPresentedIdentities): boolean {
  return Boolean(
    presented.authorizationId?.trim() ||
      presented.loadId?.trim() ||
      presented.driverId?.trim() ||
      presented.tractorEquipmentId?.trim() ||
      presented.trailerEquipmentId?.trim(),
  );
}
