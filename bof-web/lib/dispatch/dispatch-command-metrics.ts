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

    const atRisk =
      Boolean(load.dispatchExceptionFlag) ||
      String(load.sealStatus ?? "").toUpperCase() !== "OK" ||
      String(load.podStatus ?? "").toLowerCase() === "pending" ||
      String(load.podStatus ?? "").toLowerCase() === "missing";
    if (atRisk) loadsAtRisk += 1;

    if (load.driverId) {
      const m = getDriverTableRowModel(data, load.driverId);
      if (m.status === "blocked") loadsWithDispatchBlockedDriver += 1;
    }

    const podOk = String(load.podStatus ?? "").toLowerCase() === "verified";
    if (podOk && load.status === "Delivered") proofCompleteLoads += 1;
    if (!podOk && (load.status === "Delivered" || load.status === "En Route")) {
      missingOrWeakProofLoads += 1;
    }

    const holdish =
      String(load.podStatus ?? "").toLowerCase() === "pending" ||
      Boolean(load.dispatchExceptionFlag) ||
      String(load.sealStatus ?? "").toUpperCase() === "MISMATCH";
    if (holdish && activeStatuses.has(load.status)) {
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
