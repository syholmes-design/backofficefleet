import type { BofData } from "@/lib/load-bof-data";
import type { DriverMedicalExpanded } from "@/lib/driver-medical-expanded";

/**
 * Older demo snapshots + credential editors copied the same medical expiration onto every driver.
 * Seed data carries per-driver dates (only DRV-004 / DRV-008 are intentionally expired on this anchor date).
 */
export const LEGACY_SHARED_MEDICAL_EXPIRATION = "2026-04-22";

const MEDICAL_CARD_EXPIRED_DRIVER_ALLOWLIST = new Set(["DRV-004", "DRV-008"]);

function deepClone<T>(x: T): T {
  if (typeof structuredClone === "function") return structuredClone(x);
  return JSON.parse(JSON.stringify(x)) as T;
}

function seedPrimaryMedicalMap(seed: BofData): Map<
  string,
  { expirationDate?: string; status?: string }
> {
  const map = new Map<string, { expirationDate?: string; status?: string }>();
  for (const d of seed.documents) {
    if (d.type !== "Medical Card" || !d.driverId) continue;
    const prev = map.get(d.driverId);
    if (!prev || d.docTier === "primary") {
      map.set(d.driverId, {
        expirationDate: d.expirationDate?.trim(),
        status: typeof d.status === "string" ? d.status : undefined,
      });
    }
  }
  return map;
}

function pruneCredentialOverrides(map: NonNullable<BofData["driverCredentialOverrides"]>): void {
  for (const id of Object.keys(map)) {
    const row = map[id];
    if (
      !row.medicalCardExpirationDate?.trim() &&
      !row.cdlExpirationDate?.trim() &&
      !row.mvrReviewDate?.trim()
    ) {
      delete map[id];
    }
  }
}

/**
 * Repair poisoned local demo data: Medical Card rows (and matching overrides / expanded fields)
 * that still carry the fleet-wide legacy expiration although seed defines a different date for that driver.
 */
export function migrateLegacySharedMedicalExpiration(
  stored: BofData,
  seed: BofData,
): { data: BofData; mutated: boolean } {
  const seedMedical = seedPrimaryMedicalMap(seed);
  const next = deepClone(stored);
  let mutated = false;
  const legacy = LEGACY_SHARED_MEDICAL_EXPIRATION;

  for (let i = 0; i < next.documents.length; i += 1) {
    const d = next.documents[i];
    if (d.type !== "Medical Card" || !d.driverId) continue;
    if (d.expirationDate?.trim() !== legacy) continue;

    const seedRow = seedMedical.get(d.driverId);
    const seedExp = seedRow?.expirationDate?.trim();
    const allowLegacy =
      MEDICAL_CARD_EXPIRED_DRIVER_ALLOWLIST.has(d.driverId) && seedExp === legacy;

    if (allowLegacy) continue;

    if (seedExp && seedExp !== legacy) {
      next.documents[i] = {
        ...d,
        expirationDate: seedExp,
        status: seedRow?.status ?? d.status,
      };
      mutated = true;
    }
  }

  if (next.driverCredentialOverrides) {
    const map = { ...next.driverCredentialOverrides };
    for (const driverId of Object.keys(map)) {
      const row = map[driverId];
      const oExp = row.medicalCardExpirationDate?.trim();
      if (oExp !== legacy) continue;

      const seedRow = seedMedical.get(driverId);
      const seedExp = seedRow?.expirationDate?.trim();
      const allowLegacy =
        MEDICAL_CARD_EXPIRED_DRIVER_ALLOWLIST.has(driverId) && seedExp === legacy;

      if (allowLegacy) continue;

      if (seedExp && seedExp !== legacy) {
        delete row.medicalCardExpirationDate;
        mutated = true;
      }
    }
    pruneCredentialOverrides(map);
    if (Object.keys(map).length === 0) delete next.driverCredentialOverrides;
    else next.driverCredentialOverrides = map;
  }

  const dm = next.driverMedicalExpanded as Record<string, DriverMedicalExpanded> | undefined;
  if (dm) {
    for (const driverId of Object.keys(dm)) {
      const row = dm[driverId];
      const m = row.medicalExpirationDate?.trim();
      if (m !== legacy) continue;

      const seedRow = seedMedical.get(driverId);
      const seedExp = seedRow?.expirationDate?.trim();
      const allowLegacy =
        MEDICAL_CARD_EXPIRED_DRIVER_ALLOWLIST.has(driverId) && seedExp === legacy;

      if (allowLegacy) continue;

      if (seedExp && seedExp !== legacy) {
        dm[driverId] = { ...row, medicalExpirationDate: seedExp };
        mutated = true;
      }
    }
  }

  return { data: next, mutated };
}
