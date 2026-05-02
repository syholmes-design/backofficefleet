import type { BofData } from "@/lib/load-bof-data";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getLoadDocumentPacket } from "@/lib/load-proof";

export type LoadRiskReasonSeverity = "critical" | "high" | "warning" | "info";
export type LoadRiskReasonCategory =
  | "driver"
  | "compliance"
  | "documents"
  | "proof"
  | "settlement"
  | "safety"
  | "route";

export type LoadRiskStatus = "clean" | "at_risk" | "blocked" | "needs_review";

export type LoadRiskReason = {
  id: string;
  severity: LoadRiskReasonSeverity;
  category: LoadRiskReasonCategory;
  title: string;
  detail: string;
  recommendedFix: string;
  actionHref?: string;
  actionLabel?: string;
  clearableInDemo: boolean;
};

export type DemoRiskOverrides = {
  loads: Record<
    string,
    {
      resolvedReasonIds: string[];
      resolvedAt: string;
      resolvedBy: "demo-editor";
      note?: string;
    }
  >;
  drivers: Record<
    string,
    {
      resolvedReasonIds: string[];
      resolvedAt: string;
      resolvedBy: "demo-editor";
      note?: string;
    }
  >;
};

export type LoadRiskExplanation = {
  loadId: string;
  riskStatus: LoadRiskStatus;
  reasons: LoadRiskReason[];
  primaryReasonLabel: string;
  recommendedNextStep: string;
  canDispatch: boolean;
};

function riskStatusFromReasons(reasons: LoadRiskReason[]): LoadRiskStatus {
  if (reasons.length === 0) return "clean";
  if (reasons.some((r) => r.severity === "critical")) return "blocked";
  if (reasons.some((r) => r.severity === "high")) return "at_risk";
  if (reasons.some((r) => r.severity === "warning")) return "needs_review";
  return "needs_review";
}

export function getLoadRiskExplanation(
  data: BofData,
  loadId: string,
  overrides?: DemoRiskOverrides
): LoadRiskExplanation {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) {
    return {
      loadId,
      riskStatus: "clean",
      reasons: [],
      primaryReasonLabel: "Load not found",
      recommendedNextStep: "Review load records.",
      canDispatch: false,
    };
  }

  const reasons: LoadRiskReason[] = [];
  const eligibility = getDriverDispatchEligibility(data, load.driverId);
  const driver = data.drivers.find((d) => d.id === load.driverId);

  for (const hard of eligibility.hardBlockers) {
    const hardId = `driver-hard:${load.driverId}:${hard}`;
    reasons.push({
      id: hardId,
      severity: "critical",
      category: hard.includes("Safety")
        ? "safety"
        : hard.includes("compliance") || hard.includes("Medical") || hard.includes("MVR")
          ? "compliance"
          : "driver",
      title: "Driver compliance block",
      detail: `${driver?.name ?? load.driverId}: ${hard}`,
      recommendedFix: "Open driver profile and clear hard blocker before dispatch.",
      actionHref: `/drivers/${load.driverId}`,
      actionLabel: "Open Driver",
      clearableInDemo: true,
    });
  }

  for (const soft of eligibility.softWarnings) {
    const softId = `driver-soft:${load.driverId}:${soft}`;
    reasons.push({
      id: softId,
      severity: "warning",
      category: soft.includes("Safety")
        ? "safety"
        : soft.includes("compliance") || soft.includes("Card") || soft.includes("MVR")
          ? "compliance"
          : "driver",
      title: "Driver needs review",
      detail: `${driver?.name ?? load.driverId}: ${soft}`,
      recommendedFix: "Review driver warning and clear before assigning premium lanes.",
      actionHref: `/drivers/${load.driverId}`,
      actionLabel: "Open Driver",
      clearableInDemo: true,
    });
  }

  const pod = String(load.podStatus ?? "").toUpperCase();
  if (pod === "PENDING" || pod === "MISSING") {
    reasons.push({
      id: `proof:pod:${load.id}`,
      severity: load.status === "Delivered" ? "high" : "warning",
      category: "proof",
      title: `POD ${pod.toLowerCase()}`,
      detail: `Load ${load.number}: POD is ${pod.toLowerCase()} and may block settlement release.`,
      recommendedFix: "Upload and verify POD in load proof packet.",
      actionHref: `/loads/${load.id}`,
      actionLabel: "Open Load Proof",
      clearableInDemo: true,
    });
  }

  const seal = String(load.sealStatus ?? "").toUpperCase();
  if (seal === "MISMATCH") {
    reasons.push({
      id: `proof:seal-mismatch:${load.id}`,
      severity: "high",
      category: "proof",
      title: "Seal mismatch",
      detail: `Pickup seal ${load.pickupSeal || "—"} vs delivery seal ${load.deliverySeal || "—"} do not match.`,
      recommendedFix: "Review seal evidence and resolve exception with receiver/broker.",
      actionHref: `/loads/${load.id}`,
      actionLabel: "Open Load Proof",
      clearableInDemo: true,
    });
  }

  if (load.dispatchExceptionFlag) {
    reasons.push({
      id: `route:dispatch-exception:${load.id}`,
      severity: "high",
      category: "route",
      title: "Dispatch exception flag",
      detail: load.dispatchOpsNotes || "Dispatch exception flagged on this load.",
      recommendedFix: "Resolve dispatch exception and verify proof package completeness.",
      actionHref: `/loads/${load.id}`,
      actionLabel: "Open Load",
      clearableInDemo: true,
    });
  }

  const hold = data.moneyAtRisk.find(
    (m) =>
      m.loadId === load.id &&
      String(m.status || "").toUpperCase() === "BLOCKED"
  );
  if (hold) {
    reasons.push({
      id: `settlement:hold:${load.id}:${hold.id}`,
      severity: "high",
      category: "settlement",
      title: "Settlement hold",
      detail: `${hold.category}: ${hold.rootCause}`,
      recommendedFix: hold.nextBestAction || "Review settlement hold and release after documentation is complete.",
      actionHref: `/settlements`,
      actionLabel: "Open Settlement",
      clearableInDemo: true,
    });
  }

  const packet = getLoadDocumentPacket(data, load.id);
  if (packet && packet.tripValidation?.status !== "complete") {
    const missing = packet.tripValidation?.missingRequiredLabels ?? [];
    if (missing.length > 0) {
      reasons.push({
        id: `documents:trip-missing:${load.id}`,
        severity: "warning",
        category: "documents",
        title: "Trip packet incomplete",
        detail: `Missing required docs: ${missing.join(", ")}`,
        recommendedFix: "Generate or upload missing packet docs and re-check filing readiness.",
        actionHref: `/loads/${load.id}`,
        actionLabel: "Open Load Documents",
        clearableInDemo: true,
      });
    }
  }

  const openIncidents = data.complianceIncidents.filter(
    (c) =>
      c.driverId === load.driverId &&
      !["CLOSED", "RESOLVED"].includes(String(c.status || "").toUpperCase())
  );
  for (const incident of openIncidents) {
    reasons.push({
      id: `compliance:incident:${incident.incidentId}`,
      severity:
        incident.severity === "CRITICAL"
          ? "critical"
          : incident.severity === "HIGH"
            ? "high"
            : "warning",
      category: "compliance",
      title: `Compliance incident: ${incident.type}`,
      detail: `Incident ${incident.incidentId} is ${incident.status}.`,
      recommendedFix: "Open compliance workflow and resolve or document closure.",
      actionHref: `/drivers/${load.driverId}/safety`,
      actionLabel: "Open Safety",
      clearableInDemo: true,
    });
  }

  const resolvedLoadIds = new Set(
    overrides?.loads?.[loadId]?.resolvedReasonIds ?? []
  );
  const resolvedDriverIds = new Set(
    overrides?.drivers?.[load.driverId]?.resolvedReasonIds ?? []
  );
  const unresolved = reasons.filter(
    (r) => !resolvedLoadIds.has(r.id) && !resolvedDriverIds.has(r.id)
  );

  const riskStatus = riskStatusFromReasons(unresolved);
  const first = unresolved[0];
  return {
    loadId,
    riskStatus,
    reasons: unresolved,
    primaryReasonLabel: first?.title ?? "Clean",
    recommendedNextStep: first?.recommendedFix ?? "No action required.",
    canDispatch: riskStatus !== "blocked",
  };
}

