/**
 * Maintenance module — aggregates BOF dispatch equipment (tractors/trailers),
 * loads[].assetId dispatch impact, and moneyAtRisk[] rows tied to assets.
 * PM calendar, DVIR, and vendor spend beyond MAR are not in demo JSON; those surfaces
 * show explicit placeholders rather than invented completions.
 */
import type { BofData } from "./load-bof-data";
import {
  buildDispatchLoadsFromBofData,
  createSeedTractors,
  createSeedTrailers,
} from "./dispatch-dashboard-seed";
import type { Load, Trailer, Tractor } from "@/types/dispatch";

export type MoneyAtRiskRow = NonNullable<BofData["moneyAtRisk"]>[number];

export type EquipmentReadiness = "Ready" | "At Risk" | "Blocked" | "Out of Service";

export type AssetKind = "tractor" | "trailer";

export type MaintenanceAssetSummary = {
  asset_id: string;
  kind: AssetKind;
  unit_number: string;
  /** Dispatch / fleet status from seed row */
  fleet_status: string;
  readiness: EquipmentReadiness;
  readiness_reason: string;
  pm_status_label: string;
  pm_due_display: string;
  inspection_status_label: string;
  inspection_expiration_display: string;
  open_mar_count: number;
  oos: boolean;
  current_terminal: string;
  /** MAR rows referencing this asset */
  mar_rows: MoneyAtRiskRow[];
  /** Loads where this tractor is assetId (power unit) */
  loads_as_power: BofData["loads"][number][];
  /** Loads where dispatch trailer_id matches this trailer */
  loads_as_trailer: BofData["loads"][number][];
};

export type MaintenanceKpis = {
  units_ready: number;
  pm_due_soon: number;
  pm_overdue: number;
  open_repair_issues: number;
  oos_units: number;
  estimated_maintenance_spend: number;
};

export type AttentionItem = {
  id: string;
  kind: "pm" | "oos" | "severity" | "dispatch";
  title: string;
  detail: string;
  href: string;
};

function marRows(data: BofData): MoneyAtRiskRow[] {
  if (!("moneyAtRisk" in data) || !Array.isArray(data.moneyAtRisk)) return [];
  return data.moneyAtRisk as MoneyAtRiskRow[];
}

export function marsForAsset(data: BofData, assetId: string): MoneyAtRiskRow[] {
  return marRows(data).filter((m) => m.assetId === assetId);
}

export function isMaintenanceMar(m: MoneyAtRiskRow): boolean {
  return /maintenance/i.test(m.category ?? "") || /pm\b/i.test(m.rootCause ?? "");
}

function isBlockedMar(m: MoneyAtRiskRow): boolean {
  return /blocked/i.test(m.status ?? "");
}

function isAtRiskMar(m: MoneyAtRiskRow): boolean {
  return /at\s*risk/i.test(m.status ?? "") || /at risk/i.test(m.status ?? "");
}

function isOpenMar(m: MoneyAtRiskRow): boolean {
  return /open/i.test(m.status ?? "");
}

/** MAR rows on an asset that represent operational / repair-style exposure (excludes null-asset payroll-only). */
export function repairLikeMarsForAsset(data: BofData, assetId: string): MoneyAtRiskRow[] {
  return marsForAsset(data, assetId).filter((m) => {
    const cat = `${m.category} ${m.rootCause}`.toLowerCase();
    return (
      /maintenance|claim|damage|settlement|dock|ach/i.test(cat) ||
      isBlockedMar(m) ||
      isAtRiskMar(m)
    );
  });
}

export function loadsUsingTractor(data: BofData, tractorId: string) {
  return data.loads.filter((l) => l.assetId === tractorId);
}

export function loadsUsingTrailer(data: BofData, trailerId: string) {
  const dispatchLoads = buildDispatchLoadsFromBofData(data);
  const ids = new Set(
    dispatchLoads.filter((l) => l.trailer_id === trailerId).map((l) => l.load_id)
  );
  return data.loads.filter((l) => ids.has(l.id));
}

function dispatchLoadFor(data: BofData, loadId: string): Load | undefined {
  return buildDispatchLoadsFromBofData(data).find((l) => l.load_id === loadId);
}

export function dispatchImpactForAsset(
  data: BofData,
  assetId: string,
  summary: MaintenanceAssetSummary
): { load_id: string; impact_status: string; message: string }[] {
  const out: { load_id: string; impact_status: string; message: string }[] = [];
  const active = new Set(["Pending", "En Route"]);
  const consider = [...summary.loads_as_power, ...summary.loads_as_trailer];
  const seen = new Set<string>();
  for (const load of consider) {
    if (seen.has(load.id)) continue;
    seen.add(load.id);
    if (!active.has(load.status)) continue;
    const dl = dispatchLoadFor(data, load.id);
    if (!dl) continue;
    if (summary.oos || summary.readiness === "Blocked") {
      out.push({
        load_id: load.id,
        impact_status: "Blocked",
        message: `Asset ${assetId} not dispatch-ready — load ${load.id} (${load.status}) is exposed.`,
      });
    } else if (summary.readiness === "At Risk") {
      out.push({
        load_id: load.id,
        impact_status: "At risk",
        message: `Load ${load.id} on ${assetId} while maintenance / MAR signals require review.`,
      });
    }
  }
  return out;
}

function pmLabelsForAsset(mars: MoneyAtRiskRow[]): { status: string; due: string } {
  const maint = mars.filter(isMaintenanceMar);
  if (maint.length === 0) {
    return {
      status: "No PM alert in moneyAtRisk",
      due: "—",
    };
  }
  const top = maint[0];
  return {
    status: `${top.status} — ${top.rootCause ?? top.category}`,
    due: "MAR-driven (no PM calendar in BOF JSON)",
  };
}

function inspectionPlaceholder(): { status: string; exp: string } {
  return {
    status: "Not in BOF dataset",
    exp: "—",
  };
}

function computeReadiness(
  kind: AssetKind,
  fleetStatus: string,
  mars: MoneyAtRiskRow[]
): { readiness: EquipmentReadiness; reason: string } {
  if (fleetStatus === "Unavailable") {
    return {
      readiness: "Out of Service",
      reason: "Fleet seed marks this unit Unavailable — blocked from dispatch.",
    };
  }
  const blockedMar = mars.find(isBlockedMar);
  if (blockedMar) {
    return {
      readiness: "Blocked",
      reason: `Open MAR ${blockedMar.id} (${blockedMar.status}): ${blockedMar.rootCause ?? blockedMar.category}.`,
    };
  }
  const maintRisk = mars.find((m) => isMaintenanceMar(m) && (isAtRiskMar(m) || isOpenMar(m)));
  if (maintRisk) {
    return {
      readiness: "At Risk",
      reason: `Maintenance exposure on ${maintRisk.id}: ${maintRisk.rootCause ?? maintRisk.category}.`,
    };
  }
  const anyOpen = mars.some((m) => isOpenMar(m) && !isMaintenanceMar(m));
  if (anyOpen) {
    return {
      readiness: "At Risk",
      reason: "Open money-at-risk row on this asset — review before assigning critical freight.",
    };
  }
  return { readiness: "Ready", reason: "No blocking MAR and unit is available/in service." };
}

function buildTractorSummary(data: BofData, t: Tractor): MaintenanceAssetSummary {
  const mars = marsForAsset(data, t.tractor_id);
  const loadsP = loadsUsingTractor(data, t.tractor_id);
  const { readiness, reason } = computeReadiness("tractor", t.status, mars);
  const insp = inspectionPlaceholder();
  const pm = pmLabelsForAsset(mars);
  return {
    asset_id: t.tractor_id,
    kind: "tractor",
    unit_number: t.unit_number,
    fleet_status: t.status,
    readiness,
    readiness_reason: reason,
    pm_status_label: pm.status,
    pm_due_display: pm.due,
    inspection_status_label: insp.status,
    inspection_expiration_display: insp.exp,
    open_mar_count: mars.filter((m) => isOpenMar(m) || isAtRiskMar(m)).length,
    oos: t.status === "Unavailable",
    current_terminal: "Not in BOF fleet JSON",
    mar_rows: mars,
    loads_as_power: loadsP,
    loads_as_trailer: [],
  };
}

function buildTrailerSummary(data: BofData, tr: Trailer): MaintenanceAssetSummary {
  const mars = marsForAsset(data, tr.trailer_id);
  const loadsT = loadsUsingTrailer(data, tr.trailer_id);
  const { readiness, reason } = computeReadiness("trailer", tr.status, mars);
  const insp = inspectionPlaceholder();
  const pm = pmLabelsForAsset(mars);
  return {
    asset_id: tr.trailer_id,
    kind: "trailer",
    unit_number: tr.unit_number,
    fleet_status: tr.status,
    readiness,
    readiness_reason: reason,
    pm_status_label: pm.status,
    pm_due_display: pm.due,
    inspection_status_label: insp.status,
    inspection_expiration_display: insp.exp,
    open_mar_count: mars.filter((m) => isOpenMar(m) || isAtRiskMar(m)).length,
    oos: tr.status === "Unavailable",
    current_terminal: "Not in BOF fleet JSON",
    mar_rows: mars,
    loads_as_power: [],
    loads_as_trailer: loadsT,
  };
}

export function listMaintenanceAssetSummaries(data: BofData): MaintenanceAssetSummary[] {
  const tractors = createSeedTractors();
  const trailers = createSeedTrailers();
  return [
    ...tractors.map((t) => buildTractorSummary(data, t)),
    ...trailers.map((tr) => buildTrailerSummary(data, tr)),
  ];
}

export function getMaintenanceAssetSummary(
  data: BofData,
  assetId: string
): MaintenanceAssetSummary | null {
  return listMaintenanceAssetSummaries(data).find((a) => a.asset_id === assetId) ?? null;
}

export function allMaintenanceAssetIds(): string[] {
  return [
    ...createSeedTractors().map((t) => t.tractor_id),
    ...createSeedTrailers().map((t) => t.trailer_id),
  ];
}

export function computeMaintenanceKpis(
  data: BofData,
  summaries: MaintenanceAssetSummary[]
): MaintenanceKpis {
  const units_ready = summaries.filter((s) => s.readiness === "Ready").length;
  const oos_units = summaries.filter((s) => s.oos).length;
  const pm_due_soon = countMaintenanceMarByMode(summaries, "pm_soon");
  const pm_overdue = countMaintenanceMarByMode(summaries, "pm_over");
  const open_repair_issues = new Set(
    marRows(data)
      .filter((m) => Boolean(m.assetId) && (isOpenMar(m) || isAtRiskMar(m)))
      .map((m) => m.id)
  ).size;
  const estimated_maintenance_spend = sumMaintenanceMarSpend(summaries);
  return {
    units_ready,
    pm_due_soon,
    pm_overdue,
    open_repair_issues,
    oos_units,
    estimated_maintenance_spend,
  };
}

function countMaintenanceMarByMode(
  summaries: MaintenanceAssetSummary[],
  mode: "pm_soon" | "pm_over"
): number {
  const seen = new Set<string>();
  let n = 0;
  for (const s of summaries) {
    for (const m of s.mar_rows) {
      if (!isMaintenanceMar(m) || seen.has(m.id)) continue;
      seen.add(m.id);
      if (
        mode === "pm_soon" &&
        isAtRiskMar(m) &&
        !/overdue|out of service risk/i.test(m.rootCause ?? "")
      ) {
        n += 1;
      }
      if (mode === "pm_over" && /overdue|out of service risk/i.test(m.rootCause ?? "")) n += 1;
    }
  }
  return n;
}

function sumMaintenanceMarSpend(summaries: MaintenanceAssetSummary[]): number {
  const seen = new Set<string>();
  let sum = 0;
  for (const s of summaries) {
    for (const m of s.mar_rows) {
      if (!isMaintenanceMar(m)) continue;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      sum += Number(m.amount) || 0;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function isHighSeverityMar(m: MoneyAtRiskRow): boolean {
  return isBlockedMar(m) || (Number(m.amount) >= 4000 && (isOpenMar(m) || isAtRiskMar(m)));
}

export function buildAttentionItems(
  data: BofData,
  summaries: MaintenanceAssetSummary[]
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const s of summaries) {
    if (s.oos) {
      items.push({
        id: `oos-${s.asset_id}`,
        kind: "oos",
        title: `${s.unit_number} out of service`,
        detail: s.readiness_reason,
        href: `/maintenance/${s.asset_id}`,
      });
    }
    for (const m of s.mar_rows) {
      if (isMaintenanceMar(m) && isAtRiskMar(m)) {
        items.push({
          id: `pm-${m.id}`,
          kind: "pm",
          title: `PM / maintenance risk · ${s.unit_number}`,
          detail: m.rootCause ?? m.category,
          href: `/maintenance/${s.asset_id}`,
        });
      }
      if (isMaintenanceMar(m) && /overdue|out of service risk/i.test(m.rootCause ?? "")) {
        items.push({
          id: `pmo-${m.id}`,
          kind: "pm",
          title: `Overdue PM signal · ${s.unit_number}`,
          detail: m.rootCause ?? m.category,
          href: `/maintenance/${s.asset_id}`,
        });
      }
      if (isHighSeverityMar(m) && m.assetId) {
        items.push({
          id: `sev-${m.id}`,
          kind: "severity",
          title: `High-severity MAR · ${m.id}`,
          detail: `${m.category} — ${m.rootCause ?? ""}`,
          href: "/money-at-risk",
        });
      }
    }
    const impacts = dispatchImpactForAsset(data, s.asset_id, s);
    for (const im of impacts) {
      items.push({
        id: `dip-${s.asset_id}-${im.load_id}`,
        kind: "dispatch",
        title: `Dispatch impact · ${im.load_id}`,
        detail: im.message,
        href: `/loads/${im.load_id}`,
      });
    }
  }
  return dedupeAttention(items);
}

function dedupeAttention(items: AttentionItem[]): AttentionItem[] {
  const seen = new Set<string>();
  const out: AttentionItem[] = [];
  for (const it of items) {
    const k = `${it.kind}|${it.title}|${it.detail}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export type MaintenanceCostRow = {
  record_id: string;
  asset_id: string;
  unit_number: string;
  kind: AssetKind;
  vendor_name: string;
  maintenance_type: string;
  estimated_cost: number;
  actual_cost_display: string;
  status: string;
};

/** Every MAR row tied to an asset (for vendor / cost grid — not limited to maintenance category). */
export function listMaintenanceCostRows(summaries: MaintenanceAssetSummary[]): MaintenanceCostRow[] {
  const rows: MaintenanceCostRow[] = [];
  for (const s of summaries) {
    for (const m of s.mar_rows) {
      rows.push({
        record_id: m.id,
        asset_id: s.asset_id,
        unit_number: s.unit_number,
        kind: s.kind,
        vendor_name: m.owner ?? "—",
        maintenance_type: m.category ?? "—",
        estimated_cost: Number(m.amount) || 0,
        actual_cost_display: "Not in BOF JSON",
        status: m.status ?? "—",
      });
    }
  }
  return rows;
}

export function sumAllMarEstimatedSpend(rows: MaintenanceCostRow[]): number {
  return Math.round(rows.reduce((a, r) => a + r.estimated_cost, 0) * 100) / 100;
}

export type RepairIssueRow = {
  issue_id: string;
  asset_id: string;
  unit_number: string;
  kind: AssetKind;
  description: string;
  severity: string;
  status: string;
  out_of_service: boolean;
  linked_load_id: string | null;
  reported_display: string;
};

export function listRepairIssueRows(
  data: BofData,
  summaries: MaintenanceAssetSummary[]
): RepairIssueRow[] {
  const byAsset = new Map(summaries.map((s) => [s.asset_id, s]));
  return marRows(data)
    .filter((m) => m.assetId)
    .map((m) => {
      const aid = m.assetId as string;
      const s = byAsset.get(aid);
      return {
        issue_id: m.id,
        asset_id: aid,
        unit_number: s?.unit_number ?? aid,
        kind: s?.kind ?? "tractor",
        description: m.rootCause ?? m.category ?? "—",
        severity: isHighSeverityMar(m) ? "HIGH" : isBlockedMar(m) ? "HIGH" : "MEDIUM",
        status: m.status ?? "—",
        out_of_service: s?.oos ?? false,
        linked_load_id: m.loadId ?? null,
        reported_display: "Not in MAR row (demo)",
      } satisfies RepairIssueRow;
    });
}
