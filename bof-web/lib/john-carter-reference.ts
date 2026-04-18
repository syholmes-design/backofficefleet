/**
 * John Carter gold-standard demo: BOF driver id vs CDL identifier.
 * Routes and folders use DRV-001; spreadsheet may key OH1668243.
 */
export const JOHN_CARTER_REFERENCE_DRIVER_ID = "DRV-001";
export const JOHN_CARTER_CDL_NUMBER = "OH1668243";

export const JOHN_CARTER_PRIMARY_EXTRA_TYPES = [
  "MCSA-5875",
  "Emergency Contact",
] as const;

/** Vault / profile ordering for John Carter secondary stack. */
export const JOHN_CARTER_SECONDARY_TYPE_ORDER = [
  "MCSA-5876 (signed PDF)",
  "Driver profile (HTML)",
  "Driver Application",
  "Safety Acknowledgment",
  "Qualification File",
  "Incident / Accident Report",
  "BOF Medical Summary",
] as const;

/** Primary extensions + secondary stack (vault + driver hub hide these from “ad hoc” supplementals). */
export const FLEET_STRUCTURED_SUPPLEMENTAL_TYPE_SET = new Set<string>([
  ...JOHN_CARTER_PRIMARY_EXTRA_TYPES,
  ...JOHN_CARTER_SECONDARY_TYPE_ORDER,
]);

export function isJohnCarterReferenceDriver(driverId: string) {
  return driverId === JOHN_CARTER_REFERENCE_DRIVER_ID;
}
