/**
 * Phase 2 physical-arrival comparison. Record match is not physical verification.
 */

import type { PickupArrivalResult, PickupPhysicalDisposition, PickupStopReasonCode } from "@prisma/client";

import { assertPhysicalProviderNotImplemented, type PickupPhysicalVerificationKind } from "@/lib/services/pickupPhysicalVerification";

export const PICKUP_PHYSICAL_POLICY_VERSION = "bof-secure-pickup-physical-v1" as const;

export const PHASE2_PHYSICAL_UNVERIFIED_NOTE =
  "Phase 2 compares arriving identifiers to the Phase 1 authorization. UNVERIFIED means no physical identity or equipment provider confirmed the person or unit at the dock." as const;

export type VerificationCapability = "LIVE_CAPABLE" | "INTEGRATION_DEPENDENT" | "UNVERIFIED";

export const PHYSICAL_VERIFICATION_CAPABILITY: Record<PickupPhysicalVerificationKind, VerificationCapability> = {
  IDENTITY_PROVIDER: "INTEGRATION_DEPENDENT",
  DL_VERIFICATION: "INTEGRATION_DEPENDENT",
  PHOTO_MATCH: "INTEGRATION_DEPENDENT",
  LIVENESS: "INTEGRATION_DEPENDENT",
  VIN_SCAN: "LIVE_CAPABLE",
  PLATE_OCR: "INTEGRATION_DEPENDENT",
  QR_BARCODE: "LIVE_CAPABLE",
  GPS_GEOFENCE: "INTEGRATION_DEPENDENT",
  TELEMATICS: "INTEGRATION_DEPENDENT",
  SHIPPER_DOCK: "LIVE_CAPABLE",
};

export const UNIMPLEMENTED_PHYSICAL_KINDS: PickupPhysicalVerificationKind[] = [
  "IDENTITY_PROVIDER",
  "DL_VERIFICATION",
  "PHOTO_MATCH",
  "LIVENESS",
  "PLATE_OCR",
  "GPS_GEOFENCE",
  "TELEMATICS",
];

export type PickupArrivalObservation = {
  authorizationId?: string | null;
  loadId?: string | null;
  driverId?: string | null;
  tractorId?: string | null;
  trailerId?: string | null;
  tractorUnitNumber?: string | null;
  trailerUnitNumber?: string | null;
  vin?: string | null;
  plate?: string | null;
  qr?: string | null;
};

export type PickupAuthorizedArrival = {
  authorizationId: string;
  loadId: string;
  driverId: string;
  tractorId: string;
  trailerId: string | null;
  tractorUnitNumber: string;
  trailerUnitNumber: string | null;
  tractorVin: string | null;
  trailerVin: string | null;
};

export type PickupPhysicalDecision = {
  driverArrivalResult: PickupArrivalResult;
  tractorArrivalResult: PickupArrivalResult;
  trailerArrivalResult: PickupArrivalResult;
  loadArrivalResult: PickupArrivalResult;
  authorizationArrivalResult: PickupArrivalResult;
  identityMatchToAuthorizedRecord: boolean;
  identityPhysicalClass: "UNVERIFIED";
  equipmentPhysicalClass: "UNVERIFIED";
  disposition: PickupPhysicalDisposition;
  reasonCodes: PickupStopReasonCode[];
  summary: string;
};

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeKey(value: string | null | undefined): string | null {
  const normalized = normalize(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function comparePresentedId(expected: string | null, arriving: string | null | undefined): PickupArrivalResult {
  const presented = normalize(arriving);
  if (!presented) return "UNVERIFIED";
  if (!expected) return "MISMATCH";
  return presented === expected ? "MATCH" : "MISMATCH";
}

export function compareOptionalStoredSignal(
  stored: string | null | undefined,
  arriving: string | null | undefined,
): PickupArrivalResult {
  const presented = normalizeKey(arriving);
  if (!presented) return "UNVERIFIED";
  const expected = normalizeKey(stored);
  if (!expected) return "UNVERIFIED";
  return presented === expected ? "MATCH" : "MISMATCH";
}

function compareQrForKnownValue(
  expected: string | null | undefined,
  arriving: string | null | undefined,
  otherKnown: Array<string | null | undefined>,
): PickupArrivalResult {
  const presented = normalizeKey(arriving);
  if (!presented) return "UNVERIFIED";
  const expectedKey = normalizeKey(expected);
  if (expectedKey && presented === expectedKey) return "MATCH";
  if (otherKnown.some((value) => normalizeKey(value) === presented)) return "UNVERIFIED";
  return expectedKey ? "MISMATCH" : "UNVERIFIED";
}

function mergeEquipmentResult(parts: PickupArrivalResult[]): PickupArrivalResult {
  if (parts.includes("MISMATCH")) return "MISMATCH";
  if (parts.includes("MATCH")) return "MATCH";
  if (parts.includes("EXPIRED")) return "EXPIRED";
  if (parts.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  return "UNVERIFIED";
}

export function refuseUnimplementedPhysicalKind(kind: PickupPhysicalVerificationKind | string) {
  if (UNIMPLEMENTED_PHYSICAL_KINDS.includes(kind as PickupPhysicalVerificationKind)) {
    assertPhysicalProviderNotImplemented(kind as PickupPhysicalVerificationKind);
  }
}

export function evaluatePickupPhysicalArrival(
  authorized: PickupAuthorizedArrival,
  arriving: PickupArrivalObservation,
  options?: { expired?: boolean; unauthorized?: boolean },
): PickupPhysicalDecision {
  if (options?.unauthorized) {
    return {
      driverArrivalResult: "UNAUTHORIZED",
      tractorArrivalResult: "UNAUTHORIZED",
      trailerArrivalResult: "UNAUTHORIZED",
      loadArrivalResult: "UNAUTHORIZED",
      authorizationArrivalResult: "UNAUTHORIZED",
      identityMatchToAuthorizedRecord: false,
      identityPhysicalClass: "UNVERIFIED",
      equipmentPhysicalClass: "UNVERIFIED",
      disposition: "STOP",
      reasonCodes: [],
      summary: "Pickup STOPPED — unauthorized shipper or fleet cannot reconcile physical arrival.",
    };
  }

  if (options?.expired) {
    return {
      driverArrivalResult: "EXPIRED",
      tractorArrivalResult: "EXPIRED",
      trailerArrivalResult: "EXPIRED",
      loadArrivalResult: "EXPIRED",
      authorizationArrivalResult: "EXPIRED",
      identityMatchToAuthorizedRecord: false,
      identityPhysicalClass: "UNVERIFIED",
      equipmentPhysicalClass: "UNVERIFIED",
      disposition: "STOP",
      reasonCodes: ["EXPIRED"],
      summary: "Pickup STOPPED — authorization expired.",
    };
  }

  const authorizationArrivalResult = arriving.authorizationId
    ? comparePresentedId(authorized.authorizationId, arriving.authorizationId)
    : compareQrForKnownValue(authorized.authorizationId, arriving.qr, [
        authorized.tractorUnitNumber,
        authorized.trailerUnitNumber,
        authorized.tractorId,
        authorized.trailerId,
      ]);
  const loadArrivalResult = comparePresentedId(authorized.loadId, arriving.loadId);
  const driverArrivalResult = comparePresentedId(authorized.driverId, arriving.driverId);

  const tractorArrivalResult = mergeEquipmentResult([
    comparePresentedId(authorized.tractorId, arriving.tractorId),
    compareOptionalStoredSignal(authorized.tractorUnitNumber, arriving.tractorUnitNumber),
    compareOptionalStoredSignal(authorized.tractorVin, arriving.vin),
    compareQrForKnownValue(authorized.tractorUnitNumber, arriving.qr, [
      authorized.authorizationId,
      authorized.trailerUnitNumber,
      authorized.trailerId,
      authorized.tractorId,
    ]),
  ]);
  const trailerArrivalResult = mergeEquipmentResult([
    comparePresentedId(authorized.trailerId, arriving.trailerId),
    compareOptionalStoredSignal(authorized.trailerUnitNumber, arriving.trailerUnitNumber),
    compareQrForKnownValue(authorized.trailerUnitNumber, arriving.qr, [
      authorized.authorizationId,
      authorized.tractorUnitNumber,
      authorized.tractorId,
      authorized.trailerId,
    ]),
  ]);

  const reasonCodes: PickupStopReasonCode[] = [];
  if (driverArrivalResult === "MISMATCH") reasonCodes.push("WRONG_DRIVER");
  if (tractorArrivalResult === "MISMATCH") reasonCodes.push("WRONG_TRACTOR");
  if (trailerArrivalResult === "MISMATCH") reasonCodes.push("WRONG_TRAILER");
  if (loadArrivalResult === "MISMATCH" || authorizationArrivalResult === "MISMATCH") reasonCodes.push("WRONG_LOAD");

  const identityMatchToAuthorizedRecord = driverArrivalResult === "MATCH";
  const disposition: PickupPhysicalDisposition = reasonCodes.length > 0 ? "STOP" : "RELEASE";

  return {
    driverArrivalResult,
    tractorArrivalResult,
    trailerArrivalResult,
    loadArrivalResult,
    authorizationArrivalResult,
    identityMatchToAuthorizedRecord,
    identityPhysicalClass: "UNVERIFIED",
    equipmentPhysicalClass: "UNVERIFIED",
    disposition,
    reasonCodes: [...new Set(reasonCodes)],
    summary:
      disposition === "STOP"
        ? `Phase 2 STOPPED — ${[...new Set(reasonCodes)].join(", ")}. Physical identity and equipment remain UNVERIFIED.`
        : "Phase 2 RELEASE. Arriving records have no mismatch against the Phase 1 authorization. Physical identity and equipment remain UNVERIFIED.",
  };
}
