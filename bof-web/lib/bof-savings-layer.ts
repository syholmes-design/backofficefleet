/**
 * Derived savings / acceleration estimates for Command Center (display only).
 * Reads existing BOF arrays only — does not mutate data or change core business logic.
 */
import type { BofData } from "./load-bof-data";
import { buildSavingsEngineScorecard } from "./bof-savings-engine";
import { buildRfActions, getLoadProofItems } from "./load-proof";

export type SavingsScorecardModel = {
  insuranceSavingsUsd: number;
  legalSavingsUsd: number;
  recoveredRevenueUsd: number;
  cashFlowImpactUsd: number;
};

/** Flat numbers aligned with `bof-savings-engine` (auditable formulas). */
export function buildSavingsScorecard(data: BofData): SavingsScorecardModel {
  const e = buildSavingsEngineScorecard(data);
  return {
    insuranceSavingsUsd: e.insurance.value,
    legalSavingsUsd: e.legal.value,
    recoveredRevenueUsd: e.recovered.value,
    cashFlowImpactUsd: e.cashFlow.value,
  };
}

export type SavingsQualificationModel = {
  podVerifiedPct: number;
  compliancePassRatePct: number;
  rfVerifiedDeliveryCount: number;
  loadsWithoutDocumentationGaps: number;
  loadCount: number;
};

function proofGapCount(data: BofData, loadId: string): number {
  const items = getLoadProofItems(data, loadId);
  const applicable = items.filter((p) => p.status !== "Not required");
  return applicable.filter((p) => p.status !== "Complete").length;
}

export function buildSavingsQualification(data: BofData): SavingsQualificationModel {
  const loads = data.loads;
  const delivered = loads.filter((l) => l.status === "Delivered");
  const podOk = delivered.filter(
    (l) => String(l.podStatus).toLowerCase() === "verified"
  ).length;
  const podVerifiedPct =
    delivered.length === 0
      ? 100
      : Math.round((podOk / delivered.length) * 100);

  let docPenalty = 0;
  for (const d of data.documents) {
    if (d.status === "EXPIRED") docPenalty += 4;
    if (d.status === "MISSING") docPenalty += 5;
  }
  const compliancePassRatePct = Math.max(
    0,
    Math.min(100, Math.round(100 - Math.min(72, docPenalty)))
  );

  let rfVerifiedDeliveryCount = 0;
  let loadsWithoutDocumentationGaps = 0;
  for (const l of loads) {
    const items = getLoadProofItems(data, l.id);
    const rf = items.find((p) => p.type === "RFID / Dock Validation Record");
    if (l.status === "Delivered" && rf?.status === "Complete") {
      rfVerifiedDeliveryCount++;
    }
    if (proofGapCount(data, l.id) === 0) loadsWithoutDocumentationGaps++;
  }

  return {
    podVerifiedPct,
    compliancePassRatePct,
    rfVerifiedDeliveryCount,
    loadsWithoutDocumentationGaps,
    loadCount: loads.length,
  };
}

export type ImmediateActionPriority = "P0" | "P1" | "P2";

export type ImmediateActionRow = {
  id: string;
  priority: ImmediateActionPriority;
  label: string;
  loadId?: string;
  loadNumber?: string;
  driverId: string;
  driverName: string;
  amountAtRiskUsd: number | null;
  resolveHref: string;
  source: "rf" | "pod" | "compliance" | "settlement";
};

const PENDING_ST = new Set(["Pending", "On Hold", "Awaiting Receipts"]);

export function buildImmediateActionsRequired(
  data: BofData,
  limit = 24
): ImmediateActionRow[] {
  const rows: ImmediateActionRow[] = [];
  const seen = new Set<string>();

  const push = (r: ImmediateActionRow) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    rows.push(r);
  };

  const driverName = (id: string) =>
    data.drivers.find((d) => d.id === id)?.name ?? id;

  for (const a of buildRfActions(data)) {
    push({
      id: `ia-rf-${a.id}`,
      priority: a.priority,
      label: `${a.proofType} · ${a.action}`,
      loadId: a.loadId,
      loadNumber: a.loadNumber,
      driverId: a.driverId,
      driverName: a.driverName,
      amountAtRiskUsd: data.loads.find((l) => l.id === a.loadId)?.revenue ?? null,
      resolveHref: a.blocksPayment
        ? `/loads/${a.loadId}#document-engine`
        : `/rf-actions`,
      source: "rf",
    });
  }

  for (const l of data.loads) {
    if (l.status !== "Delivered") continue;
    if (String(l.podStatus).toLowerCase() === "verified") continue;
    push({
      id: `ia-pod-${l.id}`,
      priority: "P1",
      label: "POD pending — verify delivery documentation",
      loadId: l.id,
      loadNumber: l.number,
      driverId: l.driverId,
      driverName: driverName(l.driverId),
      amountAtRiskUsd: l.revenue,
      resolveHref: `/loads/${l.id}#document-engine`,
      source: "pod",
    });
  }

  for (const c of data.complianceIncidents) {
    if (c.status !== "OPEN") continue;
    const pr: ImmediateActionPriority =
      c.severity === "CRITICAL" ? "P0" : c.severity === "DUE_SOON" ? "P1" : "P2";
    push({
      id: `ia-cmp-${c.incidentId}`,
      priority: pr,
      label: `Compliance: ${c.type}`,
      driverId: c.driverId,
      driverName: driverName(c.driverId),
      amountAtRiskUsd: null,
      resolveHref: `/drivers/${c.driverId}#document-engine`,
      source: "compliance",
    });
  }

  if ("settlements" in data && Array.isArray(data.settlements)) {
    for (const s of data.settlements) {
      if (!PENDING_ST.has(s.status)) continue;
      const sid = s.settlementId ?? s.driverId;
      push({
        id: `ia-stl-${sid}`,
        priority: /hold/i.test(s.pendingReason ?? "") ? "P0" : "P1",
        label: `Settlement ${s.status}${s.pendingReason ? ` — ${s.pendingReason}` : ""}`,
        driverId: s.driverId,
        driverName: driverName(s.driverId),
        amountAtRiskUsd: s.netPay ?? null,
        resolveHref: "/settlements",
        source: "settlement",
      });
    }
  }

  const order = { P0: 0, P1: 1, P2: 2 };
  rows.sort(
    (a, b) =>
      order[a.priority] - order[b.priority] ||
      (b.amountAtRiskUsd ?? 0) - (a.amountAtRiskUsd ?? 0)
  );

  return rows.slice(0, limit);
}
