import type { BofData } from "@/lib/load-bof-data";
import { getDriverTableRowModel } from "@/lib/drivers/driver-table-row-model";

export type DispatchCommandSummary = {
  activeLoads: number;
  loadsAtRisk: number;
  loadsWithDispatchBlockedDriver: number;
  proofCompleteLoads: number;
  missingOrWeakProofLoads: number;
  settlementOrClaimHolds: number;
};

const activeStatuses = new Set(["Pending", "En Route", "In Transit", "Assigned", "Exception"]);

/**
 * Fleet-wide dispatch / proof posture from canonical `data.loads` + driver eligibility.
 * Only counts true exceptions that require action, not every active load.
 */
export function getDispatchCommandSummary(data: BofData): DispatchCommandSummary {
  let activeLoads = 0;
  let loadsAtRisk = 0;
  let loadsWithDispatchBlockedDriver = 0;
  let proofCompleteLoads = 0;
  let missingOrWeakProofLoads = 0;
  let settlementOrClaimHolds = 0;

  for (const load of data.loads) {
    if (activeStatuses.has(load.status)) {
      activeLoads += 1;
    }

    // Only count true exceptions that require action
    const hasCriticalException = Boolean(load.dispatchExceptionFlag) && 
      (load.status === "In Transit" || load.status === "En Route" || load.status === "Assigned");
    const hasSealMismatch = String(load.sealStatus ?? "").toUpperCase() === "MISMATCH" &&
      (load.status === "Delivered" || load.status === "In Transit");
    const hasPodIssue = (String(load.podStatus ?? "").toLowerCase() === "pending" ||
      String(load.podStatus ?? "").toLowerCase() === "missing") &&
      load.status === "Delivered";

    const hasTrueException = hasCriticalException || hasSealMismatch || hasPodIssue;
    if (hasTrueException) loadsAtRisk += 1;

    if (load.driverId) {
      const m = getDriverTableRowModel(data, load.driverId);
      if (m.status === "blocked") loadsWithDispatchBlockedDriver += 1;
    }

    const podOk = String(load.podStatus ?? "").toLowerCase() === "verified";
    if (podOk && load.status === "Delivered") proofCompleteLoads += 1;
    if (!podOk && (load.status === "Delivered" || load.status === "En Route")) {
      missingOrWeakProofLoads += 1;
    }

    // Only count holds for active loads with true exceptions
    const hasHold = hasCriticalException || hasSealMismatch || hasPodIssue;
    if (hasHold && activeStatuses.has(load.status)) {
      settlementOrClaimHolds += 1;
    }
  }

  return {
    activeLoads,
    loadsAtRisk,
    loadsWithDispatchBlockedDriver,
    proofCompleteLoads,
    missingOrWeakProofLoads,
    settlementOrClaimHolds,
  };
}
