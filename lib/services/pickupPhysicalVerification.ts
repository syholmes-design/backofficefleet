/**
 * Phase 1 extension points for physical pickup verification.
 * These contracts exist so later provider integrations can bind without
 * inventing a second dispatch spine. No provider is implemented here.
 */

export type PickupPhysicalVerificationKind =
  | "IDENTITY_PROVIDER"
  | "DL_VERIFICATION"
  | "PHOTO_MATCH"
  | "LIVENESS"
  | "VIN_SCAN"
  | "PLATE_OCR"
  | "QR_BARCODE"
  | "GPS_GEOFENCE"
  | "TELEMATICS"
  | "SHIPPER_DOCK";

export type PickupPhysicalVerificationRequest = {
  kind: PickupPhysicalVerificationKind;
  fleetId: string;
  pickupAuthorizationId: string;
  loadId: string;
  driverId: string;
  tractorEquipmentId: string;
  trailerEquipmentId: string | null;
};

export type PickupPhysicalVerificationProvider = {
  kind: PickupPhysicalVerificationKind;
  verify(request: PickupPhysicalVerificationRequest): Promise<never>;
};

export const PHASE1_PHYSICAL_VERIFICATION_NOTE =
  "Phase 1 records expected identities from DispatchAssignment. Stored Driver and Equipment rows are not proof of the person or unit standing at the dock." as const;

export function assertPhysicalProviderNotImplemented(kind: PickupPhysicalVerificationKind): never {
  throw Object.assign(new Error(`Physical verification provider is not implemented: ${kind}`), {
    statusCode: 501,
    code: "PHYSICAL_VERIFICATION_NOT_IMPLEMENTED",
  });
}
