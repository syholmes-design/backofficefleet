/**
 * Executive dashboard / BOF risk summary — single pipeline for metrics that must match
 * Command Center and driver review modules.
 *
 * Source of truth:
 * - `buildCommandCenterItems` from `@/lib/executive-layer` — canonical Command Center queue
 *   (compliance, dispatch/proof, driver readiness docs, money-at-risk, safety signals).
 * - `getDriverReviewExplanation` from `@/lib/driver-review-explanation` — dispatch readiness,
 *   blocked vs action-needed vs ready (no “review” without listed issues).
 * - `data.loads` — same load register as dispatch (IDs like L001, L004).
 * - `settlementTotals` / `data.moneyAtRisk` — settlement holds and claim exposure (aligned with settlements / MAR).
 */

import type { BofData } from "@/lib/load-bof-data";
import {
  buildCommandCenterItems,
  settlementTotals,
  type CommandCenterItem,
} from "@/lib/executive-layer";
import { getDriverReviewExplanation } from "@/lib/driver-review-explanation";

/** Same shape as `BreakdownPoint` in dashboard-insights (kept here to avoid import cycles). */
export type DashboardBreakdownPoint = {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger" | "info";
};

export type OwnerAttentionEntityType =
  | "driver"
  | "load"
  | "document"
  | "settlement"
  | "claim"
  | "asset"
  | "dispatch";

export type ExecutiveDashboardOwnerItem = {
  id: string;
  severity: "critical" | "high" | "medium";
  area: string;
  target: string;
  issue: string;
  financialImpact?: number;
  recommendedFix: string;
  actionLabel: string;
  actionHref: string;
  reviewDriverId?: string;
  reviewLoadId?: string;
  entityType: OwnerAttentionEntityType;
  entityId: string;
};

export type DriverReadinessDetailRow = {
  driverId: string;
  segment: "ready" | "action_needed" | "blocked";
  /** Human-readable lines from canonical review issues (empty when ready). */
  reasonLines: string[];
};

export type ExecutiveDashboardTopSummary = {
  activeLoads: number;
  loadsAtRisk: number;
  dispatchBlockedDrivers: number;
  documentsNeedingAction: number;
  settlementHolds: number;
  claimExposureUsd: number;
};

export type ExecutiveDashboardModel = {
  topSummary: ExecutiveDashboardTopSummary;
  /** Merged Command Center items (intake first, then canonical), severity-sorted. */
  commandItems: CommandCenterItem[];
  ownerAttentionQueue: ExecutiveDashboardOwnerItem[];
  fleetRiskFromAlerts: DashboardBreakdownPoint[];
  driverReadiness: DashboardBreakdownPoint[];
  driverReadinessDetails: DriverReadinessDetailRow[];
  loadStatus: DashboardBreakdownPoint[];
};

const SEVERITY_ORDER: Record<CommandCenterItem["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

function sortCommandItems(items: CommandCenterItem[]): CommandCenterItem[] {
  return [...items].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.id.localeCompare(b.id)
  );
}

/** Same merge order as `CommandCenterPageClient` (intake-derived rows, then canonical). */
export function mergeCommandCenterItemsForDashboard(
  data: BofData,
  intakeItems: CommandCenterItem[]
): CommandCenterItem[] {
  return sortCommandItems([...intakeItems, ...buildCommandCenterItems(data)]);
}

function resolveEntity(item: CommandCenterItem): {
  entityType: OwnerAttentionEntityType;
  entityId: string;
} {
  if (item.bucket === "Money at risk") {
    const t = `${item.title}`.toLowerCase();
    if (t.includes("claim")) {
      return { entityType: "claim", entityId: item.id };
    }
    if (t.includes("settlement") || /ach|hold|payroll/i.test(t)) {
      return { entityType: "settlement", entityId: item.driverId ?? item.id };
    }
    if (item.loadId) return { entityType: "load", entityId: item.loadId };
    if (item.driverId) return { entityType: "driver", entityId: item.driverId };
    return { entityType: "settlement", entityId: item.id };
  }
  if (item.bucket === "Dispatch / proof") {
    if (item.loadId) return { entityType: "load", entityId: item.loadId };
    return { entityType: "dispatch", entityId: item.id };
  }
  if (item.bucket === "Driver readiness" || item.id.startsWith("DOC-")) {
    return { entityType: "document", entityId: item.driverId ?? item.id };
  }
  if (item.bucket === "Compliance") {
    return { entityType: "driver", entityId: item.driverId ?? item.id };
  }
  if (item.bucket === "Safety") {
    return { entityType: "driver", entityId: item.driverId ?? item.id };
  }
  if (item.assetId && !item.loadId) {
    return { entityType: "asset", entityId: item.assetId };
  }
  if (item.driverId) return { entityType: "driver", entityId: item.driverId };
  return { entityType: "dispatch", entityId: item.id };
}

function attentionTargetIds(item: CommandCenterItem): string {
  const bits: string[] = [];
  if (item.loadId) bits.push(`Load ${item.loadId}`);
  if (item.driverId) bits.push(`Driver ${item.driverId}`);
  if (item.assetId) bits.push(`Asset ${item.assetId}`);
  return bits.length ? bits.join(" · ") : "Fleet";
}

function mapCommandItemToOwnerAttention(
  item: CommandCenterItem
): ExecutiveDashboardOwnerItem {
  let actionHref = "/command-center";
  let actionLabel = "Open Command Center";

  if (item.driverId && item.bucket === "Compliance") {
    actionHref = `/drivers/${item.driverId}/vault`;
    actionLabel = "Open Documents";
  } else if (item.driverId && item.bucket === "Driver readiness") {
    actionHref = `/drivers/${item.driverId}/vault`;
    actionLabel = "Open Documents";
  } else if (item.driverId && item.bucket === "Safety") {
    actionHref = `/drivers/${item.driverId}/safety`;
    actionLabel = "Open Safety";
  } else if (item.driverId && item.bucket === "Settlement / payroll") {
    actionHref = `/drivers/${item.driverId}/settlements`;
    actionLabel = "Open Settlement";
  } else if (item.loadId && item.bucket === "Dispatch / proof") {
    actionHref = `/loads/${item.loadId}`;
    actionLabel = "Open Load Proof";
  } else if (item.bucket === "Money at risk") {
    actionHref = "/money-at-risk";
    actionLabel = "Open Money at Risk";
  }

  const { entityType, entityId } = resolveEntity(item);
  const issue = `${item.title}${item.detail ? ` — ${item.detail}` : ""}`.trim();

  return {
    id: item.id,
    severity: item.severity,
    area: item.bucket,
    target: attentionTargetIds(item),
    issue,
    financialImpact: item.sourceAmount,
    recommendedFix: item.nextAction,
    actionLabel,
    actionHref,
    reviewDriverId: item.driverId,
    reviewLoadId: item.loadId,
    entityType,
    entityId,
  };
}

export function buildOwnerAttentionFromCommandItems(
  items: CommandCenterItem[]
): ExecutiveDashboardOwnerItem[] {
  return items
    .filter((item) => item.title.trim().length > 0 && item.nextAction.trim().length > 0)
    .map(mapCommandItemToOwnerAttention);
}

/** Fleet risk buckets = counts of Command Center items by canonical risk lane (no second calculators). */
export function aggregateFleetRiskFromCommandItems(
  items: CommandCenterItem[]
): DashboardBreakdownPoint[] {
  let compliance = 0;
  let dispatchProof = 0;
  let safety = 0;
  let settlements = 0;
  let claims = 0;

  for (const item of items) {
    if (item.bucket === "Compliance" || item.bucket === "Driver readiness") {
      compliance += 1;
      continue;
    }
    if (item.bucket === "Dispatch / proof") {
      dispatchProof += 1;
      continue;
    }
    if (item.bucket === "Safety") {
      safety += 1;
      continue;
    }
    if (item.bucket === "Money at risk") {
      const t = `${item.title}`.toLowerCase();
      if (t.includes("claim")) claims += 1;
      else settlements += 1;
      continue;
    }
    if (item.bucket === "Settlement / payroll") {
      settlements += 1;
    }
  }

  return [
    { label: "Compliance", value: compliance, tone: "warn" },
    { label: "Dispatch / proof", value: dispatchProof, tone: "danger" },
    { label: "Safety", value: safety, tone: "warn" },
    { label: "Settlements", value: settlements, tone: "warn" },
    { label: "Claims", value: claims, tone: "info" },
  ];
}

export function buildDriverReadinessBreakdown(data: BofData): {
  chart: DashboardBreakdownPoint[];
  details: DriverReadinessDetailRow[];
} {
  let ready = 0;
  let actionNeeded = 0;
  let blocked = 0;
  const details: DriverReadinessDetailRow[] = [];

  for (const driver of data.drivers) {
    const explanation = getDriverReviewExplanation(data, driver.id);
    const active = explanation.issues.filter((i) => !i.resolved);
    let segment: DriverReadinessDetailRow["segment"];
    if (explanation.reviewStatus === "blocked") {
      segment = "blocked";
      blocked += 1;
    } else if (explanation.reviewStatus === "needs_review") {
      segment = "action_needed";
      actionNeeded += 1;
    } else {
      segment = "ready";
      ready += 1;
    }
    const reasonLines =
      segment === "ready"
        ? []
        : active.map(
            (i) => `${i.title}${i.detail ? `: ${i.detail}` : ""} — ${i.recommendedFix}`
          );
    details.push({ driverId: driver.id, segment, reasonLines });
  }

  return {
    chart: [
      { label: "Ready", value: ready, tone: "ok" },
      { label: "Action needed", value: actionNeeded, tone: "warn" },
      { label: "Dispatch blocked", value: blocked, tone: "danger" },
    ],
    details,
  };
}

/** Load posture from the same `data.loads` register as dispatch; each load counted once. */
export function buildLoadStatusBreakdownFromLoads(data: BofData): DashboardBreakdownPoint[] {
  let onTime = 0;
  let atRisk = 0;
  let delayed = 0;
  let completed = 0;
  let blocked = 0;

  for (const load of data.loads) {
    if (load.status === "Delivered") {
      completed += 1;
      continue;
    }
    if (load.dispatchExceptionFlag || load.sealStatus !== "OK") {
      blocked += 1;
      continue;
    }
    if (load.status === "En Route" && load.podStatus === "pending") {
      atRisk += 1;
      continue;
    }
    if (load.status === "Pending" || load.podStatus === "pending") {
      delayed += 1;
      continue;
    }
    onTime += 1;
  }

  return [
    { label: "On time", value: onTime, tone: "ok" },
    { label: "At risk", value: atRisk, tone: "warn" },
    { label: "Delayed", value: delayed, tone: "warn" },
    { label: "Completed", value: completed, tone: "info" },
    { label: "Blocked / exception", value: blocked, tone: "danger" },
  ];
}

export function buildExecutiveDashboardModel(
  data: BofData,
  intakeCommandItems: CommandCenterItem[]
): ExecutiveDashboardModel {
  const commandItems = mergeCommandCenterItemsForDashboard(data, intakeCommandItems);
  const ownerAttentionQueue = buildOwnerAttentionFromCommandItems(commandItems);

  const activeLoads = data.loads.filter(
    (load) => load.status === "En Route" || load.status === "Pending"
  ).length;
  const loadsAtRisk = data.loads.filter(
    (load) =>
      load.dispatchExceptionFlag || load.sealStatus !== "OK" || load.podStatus === "pending"
  ).length;

  let dispatchBlockedDrivers = 0;
  for (const driver of data.drivers) {
    if (getDriverReviewExplanation(data, driver.id).reviewStatus === "blocked") {
      dispatchBlockedDrivers += 1;
    }
  }

  const documentsNeedingAction = commandItems.filter(
    (i) => i.bucket === "Compliance" || i.bucket === "Driver readiness"
  ).length;

  const st = settlementTotals(data);
  const settlementHolds = st.pendingOrHold;

  const claimExposureUsd = data.moneyAtRisk
    .filter((row) => row.category.toLowerCase().includes("claim"))
    .reduce((sum, row) => sum + row.amount, 0);

  const { chart: driverReadiness, details: driverReadinessDetails } =
    buildDriverReadinessBreakdown(data);

  return {
    topSummary: {
      activeLoads,
      loadsAtRisk,
      dispatchBlockedDrivers,
      documentsNeedingAction,
      settlementHolds,
      claimExposureUsd,
    },
    commandItems,
    ownerAttentionQueue,
    fleetRiskFromAlerts: aggregateFleetRiskFromCommandItems(commandItems),
    driverReadiness,
    driverReadinessDetails,
    loadStatus: buildLoadStatusBreakdownFromLoads(data),
  };
}
