import type { BofData } from "@/lib/load-bof-data";
import { buildCommandCenterItems, settlementTotals } from "@/lib/executive-layer";
import { getDriverMedicalCardStatus } from "@/lib/driver-doc-registry";
import { getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
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
  complianceBlocked: number;
  settlementHolds: number;
  claimExposure: number;
  backhaulRecovery: number;
  safetyAtRisk: number;
};

function getSafetyTierMap() {
  return new Map(getSafetyScorecardRows().map((row) => [row.driverId, row.performanceTier]));
}

function getDriverState(
  data: BofData,
  driverId: string,
  safetyTierMap: Map<string, "Elite" | "Standard" | "At Risk">
) {
  const eligibility = getDriverDispatchEligibility(data, driverId);
  const compliance = data.complianceIncidents.filter(
    (item) =>
      item.driverId === driverId &&
      item.status.toUpperCase() !== "CLOSED" &&
      item.status.toUpperCase() !== "RESOLVED"
  );
  const hasHold = data.moneyAtRisk.some(
    (row) => row.driverId === driverId && row.status.toUpperCase() === "BLOCKED"
  );
  const safetyTier = safetyTierMap.get(driverId) ?? "Standard";

  const blocked = eligibility.status === "blocked";
  const needsReview = eligibility.status === "needs_review";

  return {
    blocked,
    needsReview,
    dispatchReady: eligibility.status === "ready",
    eligibility,
    safetyTier,
    complianceOpen: compliance.length,
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
  const safetyTierMap = getSafetyTierMap();
  let ready = 0;
  let needsReview = 0;
  let blocked = 0;

  for (const driver of data.drivers) {
    const state = getDriverState(data, driver.id, safetyTierMap);
    if (state.dispatchReady) ready += 1;
    else if (state.blocked) blocked += 1;
    else needsReview += 1;
  }
  return [
    { label: "Ready", value: ready, tone: "ok" },
    { label: "Needs Review", value: needsReview, tone: "warn" },
    { label: "Blocked", value: blocked, tone: "danger" },
  ];
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
  const complianceBlocked = data.complianceIncidents.filter((item) => item.status === "OPEN").length;
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
    complianceBlocked,
    settlementHolds,
    claimExposure,
    backhaulRecovery,
    safetyAtRisk,
  };
}

export function getFleetRiskChartData(data: BofData): BreakdownPoint[] {
  const complianceRisk = data.complianceIncidents.filter((item) => item.status === "OPEN").length;
  const dispatchRisk = data.loads.filter((load) => load.dispatchExceptionFlag || load.sealStatus !== "OK").length;
  const safetyRisk = getSafetyScorecardRows().filter(
    (row) => row.performanceTier === "At Risk" || row.hosCompliancePct < 92
  ).length;
  const settlementsRisk = data.settlements.filter((row) => row.status.toUpperCase() !== "PAID").length;
  const claimsRisk = data.moneyAtRisk.filter((row) => row.category.toLowerCase().includes("claim")).length;

  return [
    { label: "Compliance", value: complianceRisk, tone: "warn" },
    { label: "Dispatch", value: dispatchRisk, tone: "danger" },
    { label: "Safety", value: safetyRisk, tone: "danger" },
    { label: "Settlements", value: settlementsRisk, tone: "warn" },
    { label: "Claims", value: claimsRisk, tone: "info" },
  ];
}

export function getLoadStatusChartData(data: BofData): BreakdownPoint[] {
  let onTime = 0;
  let atRisk = 0;
  let delayed = 0;
  let completed = 0;

  for (const load of data.loads) {
    if (load.status === "Delivered") {
      completed += 1;
      continue;
    }
    if (load.dispatchExceptionFlag || load.sealStatus !== "OK") {
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
    { label: "On Time", value: onTime, tone: "ok" },
    { label: "At Risk", value: atRisk, tone: "danger" },
    { label: "Delayed", value: delayed, tone: "warn" },
    { label: "Completed", value: completed, tone: "info" },
  ];
}

export function getOwnerAttentionQueue(data: BofData): OwnerAttentionItem[] {
  const fromCommandCenter = buildCommandCenterItems(data).map((item) => {
    let actionHref = "/command-center";
    let actionLabel = "Open Command Center";
    if (item.driverId && item.bucket === "Compliance") {
      actionHref = `/drivers/${item.driverId}/vault`;
      actionLabel = "Open Documents";
    } else if (item.driverId && item.bucket === "Driver readiness") {
      actionHref = `/drivers/${item.driverId}/dispatch`;
      actionLabel = "Open Driver Dispatch";
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

    const target =
      item.loadId && item.driver ? `Load ${item.loadId} · ${item.driver}` : item.driver ?? item.loadId ?? "Fleet";

    return {
      id: item.id,
      severity: item.severity,
      area: item.bucket,
      target,
      issue: item.title,
      financialImpact: item.sourceAmount,
      recommendedFix: item.nextAction,
      actionLabel,
      actionHref,
    } satisfies OwnerAttentionItem;
  });

  return fromCommandCenter.slice(0, 10);
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
