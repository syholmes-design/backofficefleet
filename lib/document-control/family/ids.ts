/**
 * Identifier types and helpers for the BOF document family model.
 *
 * Hierarchy: DocumentFamily (FamilyKey) -> MasterDocument (MasterId)
 *   -> CarrierInstance (InstanceId) -> Record.
 *
 * This module must NOT import ./types (avoids import cycles).
 */

/**
 * Global BOF family code, e.g. "BOF-SAF-POL-001".
 * Existing roster codes are family keys and are never renumbered.
 */
export type FamilyKey = string;

/**
 * Lowercase slug identifying a carrier, e.g. "delta-advanced-trucking".
 * NOT a carrier-local document code (e.g. "OPS-001" is a local label only).
 */
export type CarrierId = string;

/** `${familyKey}@${version}` */
export type MasterId = `${string}@${string}`;

/** `${familyKey}::${carrierId}` (double colon) */
export type InstanceId = `${string}::${string}`;

const MASTER_SEP = "@";
const INSTANCE_SEP = "::";

/** Matches existing roster formats: BOF-FUNC-TYPE-NNN and BOF-FUNC-NNN. */
export const GLOBAL_BOF_CODE_PATTERN: RegExp = /^BOF-[A-Z]+(?:-[A-Z]+)?-\d{3}$/;

/** Lowercase kebab-case slug. */
export const CARRIER_ID_PATTERN: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isGlobalBofCode(code: string): boolean {
  return GLOBAL_BOF_CODE_PATTERN.test(code);
}

/**
 * Comparison form of a carrier-local code: trim, then uppercase.
 * Validation and uniqueness use this. The carrier's stored display value
 * is left unchanged.
 */
export function normalizeLocalCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isCarrierId(value: string): boolean {
  return CARRIER_ID_PATTERN.test(value);
}

export function makeMasterId(familyKey: FamilyKey, version: string): MasterId {
  if (!familyKey || familyKey.includes(MASTER_SEP)) {
    throw new Error(`makeMasterId: invalid familyKey "${familyKey}"`);
  }
  if (!version || version.includes(MASTER_SEP)) {
    throw new Error(`makeMasterId: invalid version "${version}"`);
  }
  return `${familyKey}${MASTER_SEP}${version}`;
}

export function parseMasterId(
  id: string,
): { familyKey: FamilyKey; version: string } | null {
  const idx = id.indexOf(MASTER_SEP);
  if (idx <= 0 || idx !== id.lastIndexOf(MASTER_SEP)) return null;
  const familyKey = id.slice(0, idx);
  const version = id.slice(idx + MASTER_SEP.length);
  if (!version) return null;
  return { familyKey, version };
}

export function makeInstanceId(
  familyKey: FamilyKey,
  carrierId: CarrierId,
): InstanceId {
  if (!familyKey || familyKey.includes(INSTANCE_SEP)) {
    throw new Error(`makeInstanceId: invalid familyKey "${familyKey}"`);
  }
  if (!isCarrierId(carrierId)) {
    throw new Error(`makeInstanceId: invalid carrierId "${carrierId}"`);
  }
  return `${familyKey}${INSTANCE_SEP}${carrierId}`;
}

export function parseInstanceId(
  id: string,
): { familyKey: FamilyKey; carrierId: CarrierId } | null {
  const idx = id.indexOf(INSTANCE_SEP);
  if (idx <= 0 || idx !== id.lastIndexOf(INSTANCE_SEP)) return null;
  const familyKey = id.slice(0, idx);
  const carrierId = id.slice(idx + INSTANCE_SEP.length);
  if (!isCarrierId(carrierId)) return null;
  return { familyKey, carrierId };
}
