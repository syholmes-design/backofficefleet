import type { BofData } from "./load-bof-data";
import { reconcileCredentialIncident } from "./compliance/credential-incident-reconciliation";
import { buildFleetProofRiskSummary } from "./bof-ops-layer";
import { buildClaimQueueRows } from "./claim-packet";
import {
  type CommandCenterItem,
  buildCommandCenterItems,
  settlementTotals,
} from "./executive-layer";
import { formatUsd } from "./format-money";
import { buildRfActions, getLoadProofItems } from "./load-proof";
import { getBackhaulOpportunitySummary } from "./backhaul-opportunity-engine";

const PENDING_SETTLEMENT = new Set([
  "Pending",
  "On Hold",
  "Awaiting Receipts",
]);

export type FleetScorecard = {
  fleetScore: number;
  compliance: number;
  safety: number;
  operations: number;
  financial: number;
};

/** Derived 0–100 sub-scores + fleet average (no new JSON fields). */
export function buildFleetScorecard(data: BofData): FleetScorecard {
  let compPenalty = 0;
  for (const doc of data.documents) {
    if (doc.status === "EXPIRED") compPenalty += 5;
    if (doc.status === "MISSING") compPenalty += 4;
  }
  const compliance = Math.max(0, Math.round(100 - Math.min(88, compPenalty)));

  let safetyPen = 0;
  for (const c of data.complianceIncidents) {
    const st = String(c.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") continue;
    if (!reconcileCredentialIncident(data, c).display) continue;
    if (c.severity === "CRITICAL") safetyPen += 10;
    else if (c.severity === "DUE_SOON") safetyPen += 5;
    else safetyPen += 3;
  }
  for (const load of data.loads) {
    if (load.sealStatus === "Mismatch") safetyPen += 4;
    if (load.dispatchExceptionFlag) safetyPen += 2;
  }
  const safety = Math.max(0, Math.round(100 - Math.min(92, safetyPen)));

  let opsPen = 0;
  for (const load of data.loads) {
    if (load.dispatchExceptionFlag) opsPen += 4;
    if (load.sealStatus === "Mismatch") opsPen += 5;
    if (load.status === "Delivered" && load.podStatus !== "verified")
      opsPen += 6;
    if (load.status === "Pending") opsPen += 3;
  }
  const operations = Math.max(0, Math.round(100 - Math.min(96, opsPen)));

  let financial = 100;
  if ("moneyAtRiskSummary" in data && data.moneyAtRiskSummary) {
    const s = data.moneyAtRiskSummary;
    financial -= Math.min(38, Math.round(s.totalAtRisk / 3200));
    financial -= Math.min(22, Math.round(s.settlementHolds / 700));
    financial -= Math.min(16, Math.round(s.payrollPending / 1100));
  }
  financial = Math.max(0, Math.round(financial));

  const fleetScore = Math.round(
    (compliance + safety + operations + financial) / 4
  );

  return { fleetScore, compliance, safety, operations, financial };
}

export type BofNetworkImpact = {
  settlementRecoveryUsd: number;
  claimExposurePreventedUsd: number;
  fuelEfficiencyOpportunityUsd: number;
  maintenanceAvoidanceUsd: number;
};

/** KPI-style estimates from existing summary + loads (no new datasets). */
export function buildBofNetworkImpact(data: BofData): BofNetworkImpact {
  const s =
    "moneyAtRiskSummary" in data && data.moneyAtRiskSummary
      ? data.moneyAtRiskSummary
      : null;

  const settlementRecoveryUsd = s
    ? Math.round(s.settlementHolds * 0.41 + s.payrollPending * 0.17)
    : 0;

  const claimExposurePreventedUsd = s
    ? Math.round(s.claimsExposure * 0.27 + s.complianceRisk * 0.065)
    : 0;

  const delayProxyLoads = data.loads.filter(
    (l) =>
      l.status === "En Route" ||
      (l.status === "Delivered" && l.podStatus === "pending")
  ).length;
  const fuelEfficiencyOpportunityUsd = Math.round(
    delayProxyLoads * 92 + (s?.payrollPending ?? 0) * 0.035
  );

  const maintMar =
    "moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)
      ? data.moneyAtRisk.filter((m) =>
          /maintenance/i.test(m.category)
        )
      : [];
  const maintSum = maintMar.reduce((a, m) => a + m.amount, 0);
  const maintenanceAvoidanceUsd = s
    ? Math.round(s.maintenanceRisk * 0.11 + maintSum * 0.33)
    : Math.round(maintSum * 0.33);

  return {
    settlementRecoveryUsd,
    claimExposurePreventedUsd,
    fuelEfficiencyOpportunityUsd,
    maintenanceAvoidanceUsd,
  };
}

/** Display-only KPI strip for Command Center (reads existing registers; no new business rules). */
export type CommandCenterKpiStripModel = {
  totalMoneyAtRisk: number;
  driversAtRisk: number;
  settlementHoldsCount: number;
  settlementHoldsUsd: number;
  claimsExposureUsd: number;
  openRfActions: number;
  claimWorkspaces: number;
  disputedProofLoads: number;
  maintenanceIssues: number;
  networkImpactTotalUsd: number;
  backhaulOpportunitiesFound: number;
  deadheadMilesAvoided: number;
  backhaulRevenueCapturedUsd: number;
  bofBackhaulBonusPendingUsd: number;
};

export function buildCommandCenterKpiStrip(data: BofData): CommandCenterKpiStripModel {
  const s =
    "moneyAtRiskSummary" in data && data.moneyAtRiskSummary
      ? data.moneyAtRiskSummary
      : null;
  const mar =
    "moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)
      ? data.moneyAtRisk
      : [];

  const totalMoneyAtRisk =
    s?.totalAtRisk ??
    mar.reduce((a, m) => a + (typeof m.amount === "number" ? m.amount : 0), 0);

  const driversAtRisk = new Set(mar.map((m) => m.driverId).filter(Boolean)).size;

  const st = settlementTotals(data);

  const proof = buildFleetProofRiskSummary(data);
  const claims = buildClaimQueueRows(data, 50);
  const recoverableClaims = claims.reduce((a, c) => a + c.amountAtRiskUsd, 0);

  const impact = buildBofNetworkImpact(data);
  const backhaul = getBackhaulOpportunitySummary(data);
  const networkImpactTotalUsd =
    impact.settlementRecoveryUsd +
    impact.claimExposurePreventedUsd +
    impact.fuelEfficiencyOpportunityUsd +
    impact.maintenanceAvoidanceUsd;

  const maintMarCount = mar.filter((m) =>
    /maintenance/i.test(m.category)
  ).length;

  return {
    totalMoneyAtRisk,
    driversAtRisk,
    settlementHoldsCount: st.pendingOrHold,
    settlementHoldsUsd: s?.settlementHolds ?? 0,
    claimsExposureUsd: s?.claimsExposure ?? recoverableClaims,
    openRfActions: buildRfActions(data).length,
    claimWorkspaces: claims.length,
    disputedProofLoads: proof.loadsWithDisputeSensitivity,
    maintenanceIssues: maintMarCount,
    networkImpactTotalUsd,
    backhaulOpportunitiesFound: backhaul.opportunitiesFound,
    deadheadMilesAvoided: backhaul.deadheadMilesAvoided,
    backhaulRevenueCapturedUsd: backhaul.backhaulRevenueCaptured,
    bofBackhaulBonusPendingUsd: backhaul.bofBackhaulBonusPending,
  };
}

export type MoneyImpactKind =
  | "at_risk"
  | "blocked"
  | "exposure"
  | "net_pay_held";

export type CommandCenterDraftKind =
  | "pod_request"
  | "claim_packet"
  | "settlement_hold"
  | "payroll_hold"
  | "upload_docs"
  | "lumper"
  | "compliance_exposure"
  | "maintenance"
  | "generic_rf";

export type EnrichedCommandCenterItem = CommandCenterItem & {
  moneyImpactUsd: number | null;
  moneyImpactKind: MoneyImpactKind;
  /** Short column-style label, e.g. "Blocked revenue" */
  moneyColumnLabel: string;
  actionLabel: string;
  draftKind: CommandCenterDraftKind;
  /** Pre-rendered draft for the action modal (UI only). */
  draftBody: string;
};

function loadRecord(data: BofData, loadId: string) {
  return data.loads.find((l) => l.id === loadId) ?? null;
}

function marSumForDriver(data: BofData, driverId: string): number {
  if (!("moneyAtRisk" in data) || !Array.isArray(data.moneyAtRisk)) return 0;
  return data.moneyAtRisk
    .filter((m) => m.driverId === driverId)
    .reduce((a, m) => a + m.amount, 0);
}

function settlementRow(data: BofData, driverId: string) {
  if (!("settlements" in data) || !Array.isArray(data.settlements))
    return undefined;
  return data.settlements.find((s) => s.driverId === driverId);
}

function moneyImpactMeta(
  item: CommandCenterItem
): { kind: MoneyImpactKind; column: string } {
  if (item.bucket === "Money at risk") {
    if (
      item.status === "Blocked" ||
      /settlement/i.test(item.title) ||
      /ACH|hold/i.test(item.detail)
    ) {
      return { kind: "blocked", column: "Blocked revenue" };
    }
    if (/compliance/i.test(item.title)) {
      return { kind: "exposure", column: "Compliance exposure" };
    }
    return { kind: "at_risk", column: "Money at risk" };
  }
  if (item.bucket === "Driver readiness" || item.bucket === "Compliance") {
    return { kind: "exposure", column: "Compliance exposure" };
  }
  if (item.bucket === "Safety") {
    return { kind: "exposure", column: "Safety exposure" };
  }
  if (item.bucket === "Dispatch / proof") {
    return { kind: "at_risk", column: "Revenue at risk" };
  }
  return { kind: "at_risk", column: "Money at risk" };
}

function resolveMoneyUsd(data: BofData, item: CommandCenterItem): number | null {
  if (item.sourceAmount != null && item.sourceAmount >= 0) {
    return item.sourceAmount;
  }
  if (item.loadId) {
    const load = loadRecord(data, item.loadId);
    if (load) return load.revenue;
  }
  if (item.driverId) {
    const mar = marSumForDriver(data, item.driverId);
    if (mar > 0) return mar;
    const st = settlementRow(data, item.driverId);
    if (st && PENDING_SETTLEMENT.has(st.status)) return st.netPay;
  }
  return null;
}

function pickActionAndDraft(
  data: BofData,
  item: CommandCenterItem
): { actionLabel: string; draftKind: CommandCenterDraftKind } {
  if (item.id.startsWith("PROOF-") && item.loadId) {
    const proofs = getLoadProofItems(data, item.loadId);
    const lumperBlock = proofs.some(
      (p) => p.type === "Lumper Receipt" && p.blocksPayment
    );
    if (lumperBlock) {
      return { actionLabel: "Validate Lumper Receipt", draftKind: "lumper" };
    }
    const podBlock = proofs.some(
      (p) => p.type === "POD" && p.blocksPayment
    );
    if (podBlock || /POD/i.test(item.detail)) {
      return { actionLabel: "Generate POD Request", draftKind: "pod_request" };
    }
    return { actionLabel: "Clear proof stack", draftKind: "generic_rf" };
  }

  if (item.id.startsWith("LOAD-") && item.loadId) {
    const load = loadRecord(data, item.loadId);
    if (load?.sealStatus === "Mismatch") {
      return { actionLabel: "Generate Claim Packet", draftKind: "claim_packet" };
    }
    if (load?.status === "Delivered" && load.podStatus === "pending") {
      return { actionLabel: "Generate POD Request", draftKind: "pod_request" };
    }
    return {
      actionLabel: "Resolve dispatch exception",
      draftKind: "generic_rf",
    };
  }

  if (item.bucket === "Money at risk") {
    if (/settlement/i.test(item.title)) {
      return {
        actionLabel: "Resolve Settlement Hold",
        draftKind: "settlement_hold",
      };
    }
    if (/payroll|receipt/i.test(item.title)) {
      return {
        actionLabel: "Resolve Payroll Hold",
        draftKind: "payroll_hold",
      };
    }
    if (/compliance/i.test(item.title)) {
      return {
        actionLabel: "Fix Compliance Exposure",
        draftKind: "compliance_exposure",
      };
    }
    if (/maintenance/i.test(item.title)) {
      return {
        actionLabel: "Schedule maintenance window",
        draftKind: "maintenance",
      };
    }
    if (/claim|damage/i.test(item.title)) {
      return {
        actionLabel: "Generate Claim Packet",
        draftKind: "claim_packet",
      };
    }
  }

  if (item.bucket === "Driver readiness" || item.id.startsWith("DOC-")) {
    return { actionLabel: "Upload to Unlock Driver", draftKind: "upload_docs" };
  }

  if (item.bucket === "Compliance") {
    return { actionLabel: "Upload to Unlock Driver", draftKind: "upload_docs" };
  }

  if (item.bucket === "Safety" && item.driverId) {
    return { actionLabel: "Open Safety workspace", draftKind: "generic_rf" };
  }

  return { actionLabel: "Run RF playbook", draftKind: "generic_rf" };
}

function buildDraftBody(
  data: BofData,
  item: CommandCenterItem,
  draftKind: CommandCenterDraftKind,
  money: number | null,
  meta: { kind: MoneyImpactKind; column: string }
): string {
  const moneyStr =
    money != null ? formatUsd(money) : "amount to be confirmed";
  const driver = item.driver ?? item.driverId ?? "Driver";
  const load = item.loadId ? loadRecord(data, item.loadId) : null;
  const loadLine = load
    ? `Load ${load.number} (${item.loadId}) — linehaul revenue ${formatUsd(load.revenue)}`
    : item.loadId
      ? `Load ${item.loadId}`
      : "";

  const rfHeader = `[BOF RF DRAFT — ${item.id}]`;

  switch (draftKind) {
    case "pod_request":
      return [
        rfHeader,
        "",
        `Subject: POD required — ${loadLine || "open load"}`,
        "",
        `TO: ${driver} / Dispatch`,
        `RE: Proof of delivery — ${moneyStr} labeled as ${meta.column.toLowerCase()}`,
        "",
        "Body:",
        `- Please upload verified POD for the load above within 24 hours.`,
        `- Confirm seal numbers match BOL; flag mismatches immediately.`,
        `- Reference Command Center item for audit trail (no outbound send from this demo).`,
        "",
        `Ops note: ${item.detail}`,
      ].join("\n");

    case "claim_packet":
      return [
        rfHeader,
        "",
        `Subject: Claim packet prep — ${loadLine || item.title}`,
        "",
        `Driver: ${driver}`,
        `Financial anchor: ${moneyStr} (${meta.column})`,
        "",
        "Checklist:",
        "- BOL + delivery photos + seal images",
        "- Correspondence with shipper/consignee",
        "- Internal timeline from dispatch exception log",
        "",
        `Context: ${item.detail}`,
      ].join("\n");

    case "settlement_hold":
      return [
        rfHeader,
        "",
        `Subject: Settlement hold — ${driver}`,
        "",
        `Blocked / held amount (register): ${moneyStr}`,
        "",
        "Next steps:",
        "- Validate root cause in Money at Risk register",
        "- Coordinate with Finance on release or adjustment",
        "- Update driver comms when cleared",
        "",
        `Hold detail: ${item.detail}`,
      ].join("\n");

    case "payroll_hold":
      return [
        rfHeader,
        "",
        `Subject: Payroll / receipt follow-up — ${driver}`,
        "",
        `Exposure: ${moneyStr}`,
        "",
        "- Send in-app checklist for missing receipts or approvals",
        "- Set deadline for period close",
        "",
        `Detail: ${item.detail}`,
      ].join("\n");

    case "upload_docs":
      return [
        rfHeader,
        "",
        `Subject: Credential upload — unlock dispatch for ${driver}`,
        "",
        `Estimated exposure if idle: ${moneyStr}`,
        "",
        "- Open driver file and upload renewed / missing credentials",
        "- Mark compliance queue resolved when verified",
        "",
        `Gap summary: ${item.detail}`,
      ].join("\n");

    case "lumper":
      return [
        rfHeader,
        "",
        `Subject: Lumper receipt validation — ${loadLine || item.loadId}`,
        "",
        `Amount context: ${moneyStr} revenue tied to load`,
        "",
        "- Collect itemized lumper receipt",
        "- Match to payroll / settlement line items",
        "",
        `Proof detail: ${item.detail}`,
      ].join("\n");

    case "compliance_exposure":
      return [
        rfHeader,
        "",
        `Subject: Compliance exposure mitigation — ${driver}`,
        "",
        `Register exposure: ${moneyStr}`,
        "",
        "- Expedite document collection before next settlement run",
        "- Align with Compliance owner on audit readiness",
        "",
        `Cause: ${item.detail}`,
      ].join("\n");

    case "maintenance":
      return [
        rfHeader,
        "",
        `Subject: Maintenance risk — ${driver} / ${item.assetId ?? "asset"}`,
        "",
        `Downtime / reroute exposure: ${moneyStr}`,
        "",
        "- Schedule PM within SLA",
        "- Reassign freight if OOS risk is high",
        "",
        `Detail: ${item.detail}`,
      ].join("\n");

    default:
      return [
        rfHeader,
        "",
        `Title: ${item.title}`,
        `Bucket: ${item.bucket}`,
        "",
        `Suggested owner: ${item.owner}`,
        `Suggested action: ${item.nextAction}`,
        "",
        `Money context: ${moneyStr} (${meta.column})`,
        "",
        `Detail: ${item.detail}`,
      ].join("\n");
  }
}

/** Enrich any Command Center row shape (canonical data or Intake Engine injections). */
export function enrichCommandCenterItemList(
  data: BofData,
  items: CommandCenterItem[]
): EnrichedCommandCenterItem[] {
  return items.map((item) => {
    const { actionLabel, draftKind } = pickActionAndDraft(data, item);
    let money = resolveMoneyUsd(data, item);
    const meta = moneyImpactMeta(item);

    if (
      meta.kind === "exposure" &&
      item.driverId &&
      (money == null || money === 0)
    ) {
      const mar = marSumForDriver(data, item.driverId);
      if (mar > 0) money = mar;
    }

    let moneyImpactKind = meta.kind;
    let moneyColumnLabel = meta.column;
    const stRow = item.driverId ? settlementRow(data, item.driverId) : undefined;
    if (
      item.id.startsWith("DOC-") &&
      item.driverId &&
      stRow &&
      PENDING_SETTLEMENT.has(stRow.status) &&
      money === stRow.netPay &&
      marSumForDriver(data, item.driverId) === 0
    ) {
      moneyImpactKind = "net_pay_held";
      moneyColumnLabel = "Net pay held";
    }

    const draftBody = buildDraftBody(
      data,
      item,
      draftKind,
      money,
      { kind: moneyImpactKind, column: moneyColumnLabel }
    );

    return {
      ...item,
      moneyImpactUsd: money,
      moneyImpactKind,
      moneyColumnLabel,
      actionLabel,
      draftKind,
      draftBody,
    };
  });
}

/** Extends canonical Command Center rows with money, primary action, and draft copy. */
export function enrichCommandCenterItems(
  data: BofData
): EnrichedCommandCenterItem[] {
  return enrichCommandCenterItemList(data, buildCommandCenterItems(data));
}
