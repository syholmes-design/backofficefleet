import type { BofData } from "@/lib/load-bof-data";
import { reconcileCredentialIncident } from "@/lib/compliance/credential-incident-reconciliation";
import {
  buildCommandCenterItems,
  settlementTotals,
  type CommandCenterItem,
} from "@/lib/executive-layer";
import {
  aggregateFleetRiskFromCommandItems,
  buildDriverReadinessBreakdown,
  buildLoadStatusBreakdownFromLoads,
  buildOwnerAttentionFromCommandItems,
  mergeCommandCenterItemsForDashboard,
  type OwnerAttentionEntityType,
} from "@/lib/dashboard-command-summary";
import { getDriverMedicalCardStatus } from "@/lib/driver-doc-registry";
import { getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import { getDriverReviewExplanation } from "@/lib/driver-review-explanation";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";

type Severity = "critical" | "high" | "medium";

export type BreakdownPoint = {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger" | "info";
};

export type DashboardKpi = {
  label: string;
  value: number | string;
  hint: string;
  delta?: string;
  tone: "ok" | "warn" | "danger" | "info";
};

export type OwnerAttentionItem = {
  id: string;
  severity: Severity;
  area: string;
  target: string;
  issue: string;
  financialImpact?: number;
  recommendedFix: string;
  actionLabel: string;
  actionHref: string;
  reviewDriverId?: string;
  reviewLoadId?: string;
  entityType?: OwnerAttentionEntityType;
  entityId?: string;
};

export type DriverDashboardSummary = {
  activeDrivers: number;
  dispatchReady: number;
  complianceBlocked: number;
  safetyAtRisk: number;
  settlementPending: number;
  expiringCredentials: number;
};

export type MainDashboardSummary = {
  activeLoads: number;
  driversReady: number;
  loadsAtRisk: number;
  /** Drivers in canonical dispatch-blocked review state (same gate as driver review). */
  complianceBlocked: number;
  /** Open compliance incidents still shown after credential reconciliation (queue depth). */
  openComplianceIncidents: number;
  settlementHolds: number;
  claimExposure: number;
  backhaulRecovery: number;
  safetyAtRisk: number;
};

function getSafetyTierMap() {
  return new Map(getSafetyScorecardRows().map((row) => [row.driverId, row.performanceTier]));
}

function isComplianceIncidentOpen(item: { status?: string }): boolean {
  const st = String(item.status ?? "").toUpperCase();
  return st !== "CLOSED" && st !== "RESOLVED";
}

/** Open incidents that still surface in Command Center / KPIs after canonical document reconciliation. */
export function countEffectiveOpenComplianceIncidents(data: BofData): number {
  return data.complianceIncidents.filter(
    (item) =>
      isComplianceIncidentOpen(item) &&
      reconcileCredentialIncident(data, item).display
  ).length;
}

function getDriverState(
  data: BofData,
  driverId: string,
  safetyTierMap: Map<string, "Elite" | "Standard" | "At Risk">
) {
  const review = getDriverReviewExplanation(data, driverId);
  const hasHold = data.moneyAtRisk.some(
    (row) => row.driverId === driverId && row.status.toUpperCase() === "BLOCKED"
  );
  const safetyTier = safetyTierMap.get(driverId) ?? "Standard";

  return {
    blocked: review.reviewStatus === "blocked",
    needsReview: review.reviewStatus === "needs_review",
    dispatchReady: review.reviewStatus === "ready",
    safetyTier,
    hasSettlementHold: hasHold,
  };
}

export function getDriverDashboardSummary(data: BofData): DriverDashboardSummary {
  const safetyTierMap = getSafetyTierMap();
  let dispatchReady = 0;
  let complianceBlocked = 0;
  let safetyAtRisk = 0;
  let settlementPending = 0;
  let expiringCredentials = 0;

  for (const driver of data.drivers) {
    const state = getDriverState(data, driver.id, safetyTierMap);
    if (state.dispatchReady) dispatchReady += 1;
    if (state.blocked) complianceBlocked += 1;
    if (state.safetyTier === "At Risk") safetyAtRisk += 1;

    const settlement = data.settlements.find((row) => row.driverId === driver.id);
    if (
      settlement?.status?.toUpperCase() === "PENDING" ||
      settlement?.status?.toUpperCase() === "ON HOLD" ||
      state.hasSettlementHold
    ) {
      settlementPending += 1;
    }

    const hasExpiring = getOrderedDocumentsForDriver(data, driver.id).some((doc) => {
      if (!doc.expirationDate || doc.status.toUpperCase() !== "VALID") return false;
      const days = Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / 86400000);
      return Number.isFinite(days) && days >= 0 && days <= 60;
    });
    if (hasExpiring) expiringCredentials += 1;
  }

  return {
    activeDrivers: data.drivers.length,
    dispatchReady,
    complianceBlocked,
    safetyAtRisk,
    settlementPending,
    expiringCredentials,
  };
}

export function getDriverReadinessChartData(data: BofData): BreakdownPoint[] {
  /** Canonical readiness buckets — shared with executive dashboard (`buildDriverReadinessBreakdown`). */
  return buildDriverReadinessBreakdown(data).chart;
}

export function getSafetyTierChartData(data: BofData): BreakdownPoint[] {
  const tiers = getSafetyTierMap();
  let elite = 0;
  let standard = 0;
  let atRisk = 0;
  for (const driver of data.drivers) {
    const tier = tiers.get(driver.id) ?? "Standard";
    if (tier === "Elite") elite += 1;
    else if (tier === "At Risk") atRisk += 1;
    else standard += 1;
  }
  return [
    { label: "Elite", value: elite, tone: "ok" },
    { label: "Standard", value: standard, tone: "info" },
    { label: "At Risk", value: atRisk, tone: "danger" },
  ];
}

export function getComplianceStatusChartData(data: BofData): BreakdownPoint[] {
  let valid = 0;
  let expiringSoon = 0;
  let missing = 0;
  let pendingReview = 0;
  let expired = 0;

  const tallyCredential = (statusRaw: string, expirationDate?: string) => {
    const status = statusRaw.toUpperCase();
    if (status === "MISSING") {
      missing += 1;
      return;
    }
    if (status === "EXPIRED") {
      expired += 1;
      return;
    }
    if (status === "EXPIRING_SOON") {
      expiringSoon += 1;
      return;
    }
    if (status === "PENDING REVIEW" || status === "AT RISK") {
      pendingReview += 1;
      return;
    }
    if (status === "VALID" && expirationDate) {
      const days = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000);
      if (Number.isFinite(days) && days >= 0 && days <= 45) {
        expiringSoon += 1;
        return;
      }
    }
    valid += 1;
  };

  for (const doc of data.documents) {
    if (doc.type === "Medical Card") continue;
    tallyCredential(doc.status, doc.expirationDate);
  }

  for (const driver of data.drivers) {
    const med = getDriverMedicalCardStatus(data, driver.id);
    tallyCredential(med.rowStatus, med.expirationDate);
  }

  return [
    { label: "Valid", value: valid, tone: "ok" },
    { label: "Expiring Soon", value: expiringSoon, tone: "warn" },
    { label: "Missing", value: missing, tone: "danger" },
    { label: "Pending Review", value: pendingReview, tone: "info" },
    { label: "Expired", value: expired, tone: "danger" },
  ];
}

export function getSettlementStatusChartData(data: BofData): BreakdownPoint[] {
  let paid = 0;
  let pending = 0;
  let hold = 0;
  for (const settlement of data.settlements) {
    const status = settlement.status.toUpperCase();
    const hasHold = data.moneyAtRisk.some(
      (row) => row.driverId === settlement.driverId && row.status.toUpperCase() === "BLOCKED"
    );
    if (hasHold || status === "ON HOLD") hold += 1;
    else if (status === "PAID") paid += 1;
    else pending += 1;
  }
  return [
    { label: "Paid", value: paid, tone: "ok" },
    { label: "Pending", value: pending, tone: "warn" },
    { label: "Hold / Review", value: hold, tone: "danger" },
  ];
}

export function getMainDashboardSummary(data: BofData): MainDashboardSummary {
  const readiness = getDriverReadinessChartData(data);
  const settlement = getSettlementStatusChartData(data);
  const activeLoads = data.loads.filter((load) => load.status === "En Route" || load.status === "Pending").length;
  const loadsAtRisk = data.loads.filter(
    (load) => load.dispatchExceptionFlag || load.sealStatus !== "OK" || load.podStatus === "pending"
  ).length;
  const safetyTierMap = getSafetyTierMap();
  let dispatchBlockedDrivers = 0;
  for (const driver of data.drivers) {
    if (getDriverState(data, driver.id, safetyTierMap).blocked) dispatchBlockedDrivers += 1;
  }
  const openComplianceIncidents = countEffectiveOpenComplianceIncidents(data);
  const claimExposure = data.moneyAtRisk
    .filter((item) => item.category.toLowerCase().includes("claim"))
    .reduce((sum, item) => sum + item.amount, 0);
  const backhaulRecovery = data.loads.reduce((sum, load) => sum + (load.backhaulPay ?? 0), 0);
  const safetyAtRisk = getSafetyScorecardRows().filter((row) => row.performanceTier === "At Risk").length;
  const driversReady = readiness.find((point) => point.label === "Ready")?.value ?? 0;
  const settlementHolds = settlement.find((point) => point.label === "Hold / Review")?.value ?? 0;
  return {
    activeLoads,
    driversReady,
    loadsAtRisk,
    complianceBlocked: dispatchBlockedDrivers,
    openComplianceIncidents,
    settlementHolds,
    claimExposure,
    backhaulRecovery,
    safetyAtRisk,
  };
}

export function getFleetRiskChartData(data: BofData): BreakdownPoint[] {
  /** Counts per lane match Command Center queue rows from `buildCommandCenterItems` (no parallel formulas). */
  return aggregateFleetRiskFromCommandItems(buildCommandCenterItems(data));
}

export function getLoadStatusChartData(data: BofData): BreakdownPoint[] {
  /** Partition of `data.loads` — same register as dispatch boards (`buildLoadStatusBreakdownFromLoads`). */
  return buildLoadStatusBreakdownFromLoads(data);
}

export function getOwnerAttentionQueue(
  data: BofData,
  intakeCommandItems: CommandCenterItem[] = []
): OwnerAttentionItem[] {
  const merged = mergeCommandCenterItemsForDashboard(data, intakeCommandItems);
  return buildOwnerAttentionFromCommandItems(merged).map((row) => ({
    id: row.id,
    severity: row.severity,
    area: row.area,
    target: row.target,
    issue: row.issue,
    financialImpact: row.financialImpact,
    recommendedFix: row.recommendedFix,
    actionLabel: row.actionLabel,
    actionHref: row.actionHref,
    reviewDriverId: row.reviewDriverId,
    reviewLoadId: row.reviewLoadId,
    entityType: row.entityType,
    entityId: row.entityId,
  }));
}

export function getDashboardTodayChanges(data: BofData): string[] {
  const loadRisk = data.loads.filter((load) => load.dispatchExceptionFlag || load.sealStatus !== "OK").length;
  const holds = data.moneyAtRisk.filter((row) => row.status.toUpperCase() === "BLOCKED").length;
  const ready = getDriverReadinessChartData(data).find((point) => point.label === "Ready")?.value ?? 0;
  const payroll = getPayrollMonthlyTrend();
  const lastPayroll = payroll[payroll.length - 1];
  const totals = settlementTotals(data);

  return [
    `${loadRisk} loads currently flagged at dispatch risk.`,
    `${holds} settlement/money holds still block release.`,
    `${ready} drivers are now dispatch-ready for assignment.`,
    `Backhaul pay is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(lastPayroll?.backhaulPay ?? totals.totalBackhaul)} in the latest period.`,
    `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totals.totalNet)} net pay currently tracked in settlement totals.`,
  ];
}
