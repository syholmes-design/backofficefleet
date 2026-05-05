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

/**
 * All counts derived from canonical `data` + per-driver document rows (ID-keyed only).
 */
export function getDriverCommandSummary(data: BofData): DriverCommandSummary {
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
    if (docs.some((doc) => st(doc.status) === "EXPIRING_SOON")) {
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

export function driverHasExpiringSoonDoc(data: BofData, driverId: string): boolean {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  return docs.some((d) => d.status.toUpperCase() === "EXPIRING_SOON");
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
