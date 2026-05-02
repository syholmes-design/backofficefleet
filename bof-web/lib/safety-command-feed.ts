import type { BofData } from "@/lib/load-bof-data";
import type { SafetyEvent } from "@/types/safety";
import { getLoadEvidenceMeta, getLoadEvidenceUrl } from "@/lib/load-documents";
import { getGeneratedLoadDocUrl, normalizeLoadId } from "@/lib/load-doc-manifest";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import {
  getAtRiskSafetyDrivers,
  getSafetyScorecardRows,
  getSafetyViolationActions,
} from "@/lib/safety-scorecard";
import { safetyEvidenceItems } from "@/lib/safety-evidence";
import { resolveSafetyEvidencePublicUrl } from "@/lib/safety-evidence-url";
import { getDriverSafetyBonusRows } from "@/lib/safety-bonus";

/** Filter “Event type” values (UI); `all` / `resolved` handled separately. */
export type SafetyCommandEventTypeFilter =
  | "all"
  | "hos_violation"
  | "oos_violation"
  | "pretrip_missed"
  | "pod_certification_issue"
  | "seal_cargo_protocol"
  | "speeding_harsh_braking"
  | "accident_claim"
  | "coaching_required"
  | "resolved";

export type SafetyCommandDriverFilter = "all" | string;

export type SafetyCommandSeverityFilter = "all" | "critical" | "high" | "review" | "resolved";

export type SafetyCommandStatusFilter = "all" | "open" | "pending_review" | "resolved";

export type SafetyCommandFeedRow = {
  id: string;
  source: "compliance" | "protocol" | "load" | "store" | "evidence" | "coaching";
  /** Machine tags for event-type filter. */
  tags: string[];
  driverId: string;
  driverName: string;
  loadId?: string;
  eventTypeLabel: string;
  summary: string;
  whyMatters: string;
  recommendedAction: string;
  severityLabel: "Critical" | "High" | "Medium" | "Low" | "Review";
  workflowLabel: "Open" | "Pending review" | "Resolved";
  evidenceLabel?: string;
  /** Resolved href or null when missing / not applicable. */
  evidenceHref: string | null;
  loadProofHref: string | null;
  /** When set, “Mark resolved” can call safety store. */
  storeEventId?: string;
};

function driverNameMap(data: BofData): Map<string, string> {
  return new Map((data.drivers ?? []).map((d) => [d.id, d.name]));
}

function normalizeIncidentLoadId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = String(raw).match(/(\d+)/)?.[1];
  if (!digits) return undefined;
  return `L${digits.padStart(3, "0")}`;
}

function complianceSeverity(sev: string | undefined): { label: SafetyCommandFeedRow["severityLabel"] } {
  const u = String(sev ?? "").toUpperCase();
  if (u === "CRITICAL") return { label: "Critical" };
  if (u === "HIGH") return { label: "High" };
  if (u === "DUE_SOON" || u === "MEDIUM") return { label: "Review" };
  return { label: "Medium" };
}

function complianceWorkflow(status: string | undefined): { label: SafetyCommandFeedRow["workflowLabel"] } {
  const u = String(status ?? "").toUpperCase();
  if (u === "CLOSED" || u === "RESOLVED") return { label: "Resolved" };
  if (u === "PENDING" || u === "IN REVIEW" || u === "PENDING_REVIEW") return { label: "Pending review" };
  return { label: "Open" };
}

function storeEventWorkflow(st: SafetyEvent["status"]): { label: SafetyCommandFeedRow["workflowLabel"] } {
  if (st === "Closed" || st === "Reviewed") return { label: "Resolved" };
  if (st === "In Review") return { label: "Pending review" };
  return { label: "Open" };
}

function storeSeverity(sev: SafetyEvent["severity"]): { label: SafetyCommandFeedRow["severityLabel"] } {
  if (sev === "Critical") return { label: "Critical" };
  if (sev === "High") return { label: "High" };
  if (sev === "Medium") return { label: "Medium" };
  return { label: "Low" };
}

function storeEventTags(ev: SafetyEvent): string[] {
  const t = ev.event_type.toLowerCase();
  const tags: string[] = [];
  if (t.includes("accident") || ev.insurance_claim_needed) tags.push("accident_claim");
  if (t.includes("traffic") || t.includes("speed")) tags.push("speeding_harsh_braking");
  if (t.includes("equipment") || t.includes("dot inspection")) tags.push("oos_violation");
  if (t.includes("near miss")) tags.push("coaching_required");
  if (tags.length === 0) tags.push("coaching_required");
  return tags;
}

function evidenceTypeToTags(type: string): string[] {
  switch (type) {
    case "hos_violation":
      return ["hos_violation", "coaching_required"];
    case "tire_inspection":
    case "brake_inspection":
      return ["oos_violation", "coaching_required"];
    case "cargo_damage":
      return ["seal_cargo_protocol", "coaching_required"];
    case "safety_equipment":
    case "logbook_review":
      return ["coaching_required", "oos_violation"];
    default:
      return ["coaching_required"];
  }
}

export function dispatchImpactLabel(
  data: BofData,
  driverId: string
): "No impact" | "Needs review" | "Blocks dispatch" {
  const st = getDriverDispatchEligibility(data, driverId).status;
  if (st === "blocked") return "Blocks dispatch";
  if (st === "needs_review") return "Needs review";
  return "No impact";
}

export function buildSafetyCommandFeed(data: BofData, storeEvents: SafetyEvent[]): SafetyCommandFeedRow[] {
  const names = driverNameMap(data);
  const rows: SafetyCommandFeedRow[] = [];
  const scoreRows = getSafetyScorecardRows();
  const atRiskIds = new Set(getAtRiskSafetyDrivers().map((r) => r.driverId));

  for (const c of data.complianceIncidents ?? []) {
    const driverId = c.driverId;
    const loadId = normalizeIncidentLoadId(c.loadId);
    const { label: severityLabel } = complianceSeverity(c.severity);
    const { label: workflowLabel } = complianceWorkflow(c.status);
    const tags: string[] = ["coaching_required"];
    if (String(c.type).toLowerCase().includes("mvr")) tags.push("oos_violation");

    const evidenceHref = loadId ? getGeneratedLoadDocUrl(loadId, "pod") ?? null : null;

    rows.push({
      id: `cmp-${c.incidentId}`,
      source: "compliance",
      tags,
      driverId,
      driverName: names.get(driverId) ?? driverId,
      loadId,
      eventTypeLabel: "Compliance incident",
      summary: `${c.type} (${c.incidentId})`,
      whyMatters:
        String(c.severity).toUpperCase() === "CRITICAL"
          ? "Critical compliance gaps can block dispatch and void insurance posture."
          : "Credential and review gaps increase audit and roadside exposure.",
      recommendedAction: "Resolve in Vault / HR queue and attach updated documentation.",
      severityLabel,
      workflowLabel,
      evidenceLabel: loadId ? "Load POD (context)" : undefined,
      evidenceHref: evidenceHref && evidenceHref.length > 0 ? evidenceHref : null,
      loadProofHref: loadId ? `/loads/${normalizeLoadId(loadId)}` : null,
    });
  }

  for (const v of getSafetyViolationActions()) {
    const isHos = /hos|l-405/i.test(v.code ?? "");
    const tags = isHos ? ["hos_violation", "coaching_required"] : ["oos_violation", "coaching_required"];
    const severityLabel: SafetyCommandFeedRow["severityLabel"] =
      v.severity === "High" ? "High" : v.severity === "Medium" ? "Medium" : "Review";
    rows.push({
      id: `vio-${v.driverId}-${(v.code ?? "protocol").replace(/\s+/g, "-")}`,
      source: "protocol",
      tags,
      driverId: v.driverId,
      driverName: names.get(v.driverId) ?? v.driverShortName,
      loadId: undefined,
      eventTypeLabel: isHos ? "HOS / ELD protocol" : "Tire / asset inspection protocol",
      summary: `${v.code ?? "Protocol"} — ${v.violations} open violation(s)`,
      whyMatters: isHos
        ? "Hours-of-service breaches drive immediate OOS and carrier liability."
        : "Tire and brake defects are leading OOS causes and tie to cargo securement risk.",
      recommendedAction: v.action,
      severityLabel,
      workflowLabel: "Open",
      evidenceLabel: "Driver safety workspace",
      evidenceHref: `/drivers/${v.driverId}/safety`,
      loadProofHref: null,
    });
  }

  for (const load of data.loads ?? []) {
    const driverId = load.driverId;
    const loadId = normalizeLoadId(load.id);
    const pod = String(load.podStatus ?? "").toLowerCase();
    const seal = String(load.sealStatus ?? "").toUpperCase();

    if (pod && pod !== "verified") {
      const podUrl = getGeneratedLoadDocUrl(loadId, "pod");
      rows.push({
        id: `load-pod-${loadId}`,
        source: "load",
        tags: ["pod_certification_issue"],
        driverId,
        driverName: names.get(driverId) ?? driverId,
        loadId,
        eventTypeLabel: "POD certification",
        summary: `POD status is “${load.podStatus}” on ${loadId}`,
        whyMatters: "Unverified POD delays settlement, fuels shipper disputes, and weakens claim defense.",
        recommendedAction: "Verify POD in load workspace and attach supporting proof photos.",
        severityLabel: "Review",
        workflowLabel: "Open",
        evidenceLabel: "Generated POD",
        evidenceHref: podUrl && podUrl.length > 0 ? podUrl : null,
        loadProofHref: `/loads/${loadId}`,
      });
    }

    if (seal === "MISMATCH") {
      const sealUrl =
        getLoadEvidenceUrl(loadId, "sealMismatchPhoto") ??
        getLoadEvidenceUrl(loadId, "sealPickupPhoto") ??
        getGeneratedLoadDocUrl(loadId, "sealVerification");
      rows.push({
        id: `load-seal-${loadId}`,
        source: "load",
        tags: ["seal_cargo_protocol"],
        driverId,
        driverName: names.get(driverId) ?? driverId,
        loadId,
        eventTypeLabel: "Seal / cargo protocol",
        summary: `Seal mismatch flagged on ${loadId}`,
        whyMatters: "Seal chain breaks trigger claims, cargo exposure, and customer chargebacks.",
        recommendedAction: "Run seal verification packet and document corrective handoff.",
        severityLabel: "High",
        workflowLabel: "Open",
        evidenceLabel: "Seal / verification proof",
        evidenceHref: sealUrl && sealUrl.length > 0 ? sealUrl : null,
        loadProofHref: `/loads/${loadId}`,
      });
    }

    const equipMeta = getLoadEvidenceMeta(loadId, "equipmentPhoto");
    const pickupMeta = getLoadEvidenceMeta(loadId, "pickupPhoto");
    const equipUrl = getLoadEvidenceUrl(loadId, "equipmentPhoto");
    const pickupUrl = getLoadEvidenceUrl(loadId, "pickupPhoto");
    const equipGap =
      equipMeta &&
      typeof equipMeta === "object" &&
      equipMeta.applicable === true &&
      (!equipUrl || equipUrl.length === 0);
    const pickupGap =
      pickupMeta &&
      typeof pickupMeta === "object" &&
      pickupMeta.applicable === true &&
      (!pickupUrl || pickupUrl.length === 0);
    if (equipGap || pickupGap) {
      rows.push({
        id: `load-pretrip-${loadId}`,
        source: "load",
        tags: ["pretrip_missed"],
        driverId,
        driverName: names.get(driverId) ?? driverId,
        loadId,
        eventTypeLabel: "Pre-trip / equipment proof",
        summary: `Required pre-trip evidence incomplete for ${loadId}`,
        whyMatters: "Missing equipment or pickup proof voids DVIR traceability for audits.",
        recommendedAction: "Capture equipment and pickup photos before departure.",
        severityLabel: "Review",
        workflowLabel: "Open",
        evidenceLabel: equipGap ? "Equipment photo" : "Pickup photo",
        evidenceHref: (equipGap ? equipUrl : pickupUrl) && (equipGap ? equipUrl : pickupUrl)!.length > 0 ? (equipGap ? equipUrl! : pickupUrl!) : null,
        loadProofHref: `/loads/${loadId}`,
      });
    }
  }

  for (const ev of storeEvents) {
    const { label: severityLabel } = storeSeverity(ev.severity);
    const { label: workflowLabel } = storeEventWorkflow(ev.status);
    const tags = storeEventTags(ev);
    let evidenceHref: string | null = ev.evidence_image_url;
    if (evidenceHref && evidenceHref.includes("/mocks/mock_")) evidenceHref = null;
    const loadId = ev.linked_load_id ? normalizeLoadId(ev.linked_load_id) : undefined;
    if (!evidenceHref && loadId) {
      evidenceHref =
        getLoadEvidenceUrl(loadId, "cargoDamagePhoto") ??
        getLoadEvidenceUrl(loadId, "damagePhoto") ??
        getGeneratedLoadDocUrl(loadId, "pod") ??
        null;
    }
    rows.push({
      id: `evt-${ev.event_id}`,
      source: "store",
      tags,
      driverId: ev.driver_id,
      driverName: ev.driver_name,
      loadId,
      eventTypeLabel: ev.event_type,
      summary: ev.notes ?? ev.event_type,
      whyMatters:
        ev.insurance_claim_needed && ev.estimated_claim_exposure > 0
          ? `Claim exposure ≈ ${ev.estimated_claim_exposure.toLocaleString()} USD — reserve legal / safety review.`
          : "Operational incidents compound into insurer and shipper scorecards.",
      recommendedAction: ev.internal_notes ?? "Document outcome and coaching in the safety drawer.",
      severityLabel,
      workflowLabel,
      evidenceLabel: evidenceHref ? "Linked proof" : undefined,
      evidenceHref: evidenceHref && evidenceHref.length > 0 ? evidenceHref : null,
      loadProofHref: loadId ? `/loads/${loadId}` : null,
      storeEventId: ev.event_id,
    });
  }

  for (const item of safetyEvidenceItems) {
    const href = resolveSafetyEvidencePublicUrl(item.url).url;
    rows.push({
      id: `evid-${item.id}`,
      source: "evidence",
      tags: evidenceTypeToTags(item.type),
      driverId: item.driverId,
      driverName: item.driverName,
      loadId: item.loadId ? normalizeLoadId(item.loadId) : undefined,
      eventTypeLabel: `Safety evidence — ${item.label}`,
      summary: item.note,
      whyMatters: "Photo and inspection evidence defend roadside outcomes and customer audits.",
      recommendedAction: "Review still and attach to coaching or settlement packet.",
      severityLabel: item.severity === "high" ? "High" : "Medium",
      workflowLabel: "Open",
      evidenceLabel: item.label,
      evidenceHref: href,
      loadProofHref: item.loadId ? `/loads/${normalizeLoadId(item.loadId)}` : null,
    });
  }

  for (const r of scoreRows) {
    if (!atRiskIds.has(r.driverId)) continue;
    rows.push({
      id: `coach-tier-${r.driverId}`,
      source: "coaching",
      tags: ["coaching_required"],
      driverId: r.driverId,
      driverName: r.driverName,
      loadId: undefined,
      eventTypeLabel: "Coaching required",
      summary: `Driver is ${r.performanceTier} tier with elevated operational risk.`,
      whyMatters: "At-risk tiers require documented coaching before premium lanes and bonus cycles.",
      recommendedAction: "Run documented coaching plan; verify inspections and HOS resets.",
      severityLabel: "Review",
      workflowLabel: "Open",
      evidenceLabel: "Driver safety profile",
      evidenceHref: `/drivers/${r.driverId}/safety`,
      loadProofHref: null,
    });
  }

  return rows.sort((a, b) => {
    const pri = (x: SafetyCommandFeedRow) =>
      x.workflowLabel === "Open" ? 0 : x.workflowLabel === "Pending review" ? 1 : 2;
    const p = pri(a) - pri(b);
    if (p !== 0) return p;
    return a.id.localeCompare(b.id);
  });
}

export function filterSafetyCommandFeed(
  rows: SafetyCommandFeedRow[],
  filters: {
    eventType: SafetyCommandEventTypeFilter;
    driverId: SafetyCommandDriverFilter;
    severity: SafetyCommandSeverityFilter;
    status: SafetyCommandStatusFilter;
  }
): SafetyCommandFeedRow[] {
  return rows.filter((row) => {
    if (filters.driverId !== "all" && row.driverId !== filters.driverId) return false;

    const wfTag: SafetyCommandStatusFilter =
      row.workflowLabel === "Resolved"
        ? "resolved"
        : row.workflowLabel === "Pending review"
          ? "pending_review"
          : "open";
    if (filters.status !== "all" && wfTag !== filters.status) return false;

    const sevTag: SafetyCommandSeverityFilter =
      row.severityLabel === "Critical"
        ? "critical"
        : row.severityLabel === "High"
          ? "high"
          : row.workflowLabel === "Resolved"
            ? "resolved"
            : "review";

    if (filters.severity !== "all") {
      if (filters.severity === "resolved") {
        if (row.workflowLabel !== "Resolved") return false;
      } else if (sevTag !== filters.severity) return false;
    }

    if (filters.eventType === "all") return true;
    if (filters.eventType === "resolved") return row.workflowLabel === "Resolved";
    return row.tags.includes(filters.eventType);
  });
}

export function getSafetyCommandHeroStats(data: BofData, feed: SafetyCommandFeedRow[]) {
  const summary = getSafetyScorecardRows();
  const atRisk = summary.filter((r) => r.performanceTier === "At Risk").length;
  const openHosOos = feed.filter(
    (r) =>
      r.workflowLabel !== "Resolved" &&
      (r.tags.includes("hos_violation") || r.tags.includes("oos_violation"))
  ).length;

  const loads = data.loads ?? [];
  let preTripNumer = 0;
  let preTripDenom = 0;
  for (const load of loads) {
    const lid = normalizeLoadId(load.id);
    const em = getLoadEvidenceMeta(lid, "equipmentPhoto");
    const pm = getLoadEvidenceMeta(lid, "pickupPhoto");
    const eu = getLoadEvidenceUrl(lid, "equipmentPhoto");
    const pu = getLoadEvidenceUrl(lid, "pickupPhoto");
    const needEquip = em && typeof em === "object" && em.applicable === true;
    const needPick = pm && typeof pm === "object" && pm.applicable === true;
    if (!needEquip && !needPick) continue;
    preTripDenom += 1;
    const ok =
      (!needEquip || Boolean(eu && eu.length > 0)) && (!needPick || Boolean(pu && pu.length > 0));
    if (ok) preTripNumer += 1;
  }
  const preTripPct = preTripDenom === 0 ? 100 : Math.round((preTripNumer / preTripDenom) * 100);

  let podOk = 0;
  let podTot = 0;
  for (const load of loads) {
    const pod = String(load.podStatus ?? "").trim();
    if (!pod) continue;
    podTot += 1;
    if (pod.toLowerCase() === "verified") podOk += 1;
  }
  const podPct = podTot === 0 ? 100 : Math.round((podOk / podTot) * 100);

  const bonusRows = getDriverSafetyBonusRows(data);
  const bonusEligible = bonusRows.filter((r) => r.eligibilityStatus === "eligible").length;

  return {
    driversAtRisk: atRisk,
    openHosOosIssues: openHosOos,
    preTripCompliancePct: preTripPct,
    podCertificationPct: podPct,
    safetyBonusEligibleDrivers: bonusEligible,
  };
}
