import type { BofData } from "@/lib/load-bof-data";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getLoadEvidenceMeta, getLoadEvidenceUrl } from "@/lib/load-documents";
import { normalizeLoadId } from "@/lib/load-doc-manifest";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

export type DriverSafetyBonusEligibility = "eligible" | "at_risk" | "not_eligible";

export type DriverSafetyBonusRow = {
  driverId: string;
  driverName: string;
  eligibilityStatus: DriverSafetyBonusEligibility;
  /** Demo: mirrors accrued safety bonus USD from scorecard (payout signal). */
  bonusScore: number;
  preTripCompliancePct: number;
  podCertificationPct: number;
  sealProtocolPct: number;
  hosCompliancePct: number;
  oosEvents: number;
  preventableIncidents: number;
  openSafetySignals: number;
  recommendedAction: string;
};

function loadsForDriver(data: BofData, driverId: string) {
  return (data.loads ?? []).filter((l) => l.driverId === driverId);
}

function preTripPctForDriver(data: BofData, driverId: string): number {
  const loads = loadsForDriver(data, driverId);
  let num = 0;
  let den = 0;
  for (const load of loads) {
    const lid = normalizeLoadId(load.id);
    const em = getLoadEvidenceMeta(lid, "equipmentPhoto");
    const pm = getLoadEvidenceMeta(lid, "pickupPhoto");
    const eu = getLoadEvidenceUrl(lid, "equipmentPhoto");
    const pu = getLoadEvidenceUrl(lid, "pickupPhoto");
    const needEquip = em && typeof em === "object" && em.applicable === true;
    const needPick = pm && typeof pm === "object" && pm.applicable === true;
    if (!needEquip && !needPick) continue;
    den += 1;
    const ok =
      (!needEquip || Boolean(eu && eu.length > 0)) && (!needPick || Boolean(pu && pu.length > 0));
    if (ok) num += 1;
  }
  return den === 0 ? 100 : Math.round((num / den) * 100);
}

function podPctForDriver(data: BofData, driverId: string): number {
  const loads = loadsForDriver(data, driverId);
  let ok = 0;
  let tot = 0;
  for (const load of loads) {
    const pod = String(load.podStatus ?? "").trim();
    if (!pod) continue;
    tot += 1;
    if (pod.toLowerCase() === "verified") ok += 1;
  }
  return tot === 0 ? 100 : Math.round((ok / tot) * 100);
}

function sealPctForDriver(data: BofData, driverId: string): number {
  const loads = loadsForDriver(data, driverId);
  if (loads.length === 0) return 100;
  const ok = loads.filter((l) => String(l.sealStatus ?? "").toUpperCase() === "OK").length;
  return Math.round((ok / loads.length) * 100);
}

function openSafetySignalsForDriver(data: BofData, driverId: string): number {
  let n = 0;
  for (const c of data.complianceIncidents ?? []) {
    if (c.driverId !== driverId) continue;
    const u = String(c.status ?? "").toUpperCase();
    if (u !== "CLOSED" && u !== "RESOLVED") n += 1;
  }
  for (const load of loadsForDriver(data, driverId)) {
    const pod = String(load.podStatus ?? "").toLowerCase();
    if (pod && pod !== "verified") n += 1;
    if (String(load.sealStatus ?? "").toUpperCase() === "MISMATCH") n += 1;
  }
  return n;
}

export function getDriverSafetyBonusRows(data: BofData): DriverSafetyBonusRow[] {
  const scoreById = new Map(getSafetyScorecardRows().map((r) => [r.driverId, r]));

  return (data.drivers ?? []).map((d) => {
    const row = scoreById.get(d.id);
    const dispatch = getDriverDispatchEligibility(data, d.id);
    const preTripCompliancePct = preTripPctForDriver(data, d.id);
    const podCertificationPct = podPctForDriver(data, d.id);
    const sealProtocolPct = sealPctForDriver(data, d.id);
    const hosCompliancePct = row?.hosCompliancePct ?? 0;
    const oosEvents = row?.oosViolations ?? 0;
    const preventableIncidents = row && row.cargoDamageUsd > 0 ? 1 : 0;
    const openSafetySignals = openSafetySignalsForDriver(data, d.id);

    let eligibilityStatus: DriverSafetyBonusEligibility = "not_eligible";
    if (!row) {
      eligibilityStatus = "not_eligible";
    } else if (dispatch.status === "blocked") {
      eligibilityStatus = "not_eligible";
    } else if (row.performanceTier === "At Risk") {
      eligibilityStatus = "at_risk";
    } else if (row.performanceTier === "Elite" && dispatch.status === "ready") {
      eligibilityStatus = "eligible";
    } else if (row.performanceTier === "Standard") {
      eligibilityStatus = dispatch.status === "ready" ? "eligible" : "at_risk";
    }

    const bonusScore = row?.safetyBonusUsd ?? 0;

    let recommendedAction = "Maintain current coaching cadence and lane mix.";
    if (eligibilityStatus === "not_eligible") {
      recommendedAction =
        dispatch.hardBlockers[0] ??
        "Clear compliance / safety hard gates before bonus eligibility returns.";
    } else if (eligibilityStatus === "at_risk") {
      recommendedAction =
        "Run focused inspections, HOS coaching, and seal/POD verification drills before next settlement.";
    }

    return {
      driverId: d.id,
      driverName: d.name,
      eligibilityStatus,
      bonusScore,
      preTripCompliancePct,
      podCertificationPct,
      sealProtocolPct,
      hosCompliancePct,
      oosEvents,
      preventableIncidents,
      openSafetySignals,
      recommendedAction,
    };
  });
}
