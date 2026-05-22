import type { BofData } from "@/lib/load-bof-data";
import { getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import { getDriverTableRowModel } from "@/lib/drivers/driver-table-row-model";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";

export type DriverCommandSummary = {
  totalDrivers: number;
  ready: number;
  needsReview: number;
  dispatchBlocked: number;
  expiringSoonDrivers: number;
  missingOrInvalidDocsDrivers: number;
  safetyAtRiskDrivers: number;
};

/** True if any credential on file expires within `maxDaysInclusive` (0 = today or past midnight). */
export function driverHasCredentialExpiringWithin(
  data: BofData,
  driverId: string,
  maxDaysInclusive: number
): boolean {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const now = Date.now();
  for (const doc of docs) {
    const raw = doc.expirationDate?.trim();
    if (!raw) continue;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) continue;
    const days = Math.ceil((t - now) / 86400000);
    if (days >= 0 && days <= maxDaysInclusive) return true;
  }
  return false;
}

/**
 * All counts derived from canonical `data` + per-driver document rows (ID-keyed only).
 * Expiring-soon uses expiration dates vs today for the selected credential window (default 90 days).
 */
export function getDriverCommandSummary(
  data: BofData,
  credentialExpiryWindowDays: number = 90
): DriverCommandSummary {
  const totalDrivers = data.drivers.length;
  let ready = 0;
  let needsReview = 0;
  let dispatchBlocked = 0;
  let expiringSoonDrivers = 0;
  let missingOrInvalidDocsDrivers = 0;
  let safetyAtRiskDrivers = 0;

  for (const d of data.drivers) {
    const m = getDriverTableRowModel(data, d.id);
    if (m.status === "ready") ready += 1;
    if (m.status === "needs_review") needsReview += 1;
    if (m.status === "blocked") dispatchBlocked += 1;
    if (m.safetyLabel === "At Risk") safetyAtRiskDrivers += 1;

    const docs = getOrderedDocumentsForDriver(data, d.id);
    const st = (s: string) => s.toUpperCase();
    if (driverHasCredentialExpiringWithin(data, d.id, credentialExpiryWindowDays)) {
      expiringSoonDrivers += 1;
    }
    if (
      docs.some(
        (doc) => st(doc.status) === "MISSING" || st(doc.status) === "EXPIRED" || st(doc.status) === "INVALID"
      )
    ) {
      missingOrInvalidDocsDrivers += 1;
    }
  }

  return {
    totalDrivers,
    ready,
    needsReview,
    dispatchBlocked,
    expiringSoonDrivers,
    missingOrInvalidDocsDrivers,
    safetyAtRiskDrivers,
  };
}

export function driverHasExpiringSoonDoc(
  data: BofData,
  driverId: string,
  credentialExpiryWindowDays: number = 90
): boolean {
  return driverHasCredentialExpiringWithin(data, driverId, credentialExpiryWindowDays);
}

export function driverHasMissingOrInvalidDoc(data: BofData, driverId: string): boolean {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const st = (s: string) => s.toUpperCase();
  return docs.some((d) => {
    const x = st(d.status);
    return x === "MISSING" || x === "EXPIRED" || x === "INVALID";
  });
}

/** Dispatch-hard-blocked per canonical eligibility engine (not just roster status label). */
export function driverIsDispatchHardBlocked(data: BofData, driverId: string): boolean {
  return getDriverDispatchEligibility(data, driverId).hardBlockerCount > 0;
}
