import type { BofData } from "@/lib/load-bof-data";
import { reconcileCredentialIncident } from "@/lib/compliance/credential-incident-reconciliation";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getLoadDocumentPacket } from "@/lib/load-proof";
import { getCanonicalLoadStory } from "@/lib/canonical-load-stories";

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
  whyItMatters: string;
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

function normalizeOperationalCopy(text: string): string {
  return text.replace(/\s+â€”\s+/g, " - ").replace(/\s+—\s+/g, " - ").trim();
}

function driverHardBlockTitle(blocker: string): string {
  const text = normalizeOperationalCopy(blocker);
  if (/CDL/i.test(text)) return "CDL dispatch block";
  if (/FMCSA|Clearinghouse/i.test(text)) return "FMCSA dispatch block";
  if (/Medical/i.test(text)) return "Medical card dispatch block";
  return `Driver dispatch block: ${text}`;
}

function driverSoftWarningTitle(warning: string): string {
  const text = normalizeOperationalCopy(warning);
  if (/Settlement|pay hold/i.test(text)) return "Settlement/pay hold affects dispatch";
  if (/I-9/i.test(text)) return "I-9 missing from driver file";
  if (/W-9/i.test(text)) return "W-9 missing from driver file";
  if (/Bank|direct deposit|ACH/i.test(text)) return "Bank/payment setup incomplete";
  if (/Safety tier/i.test(text)) return "Safety tier requires lane review";
  if (/Open compliance/i.test(text)) return text.replace(/^Open compliance:\s*/i, "Compliance open: ");
  if (/Medical/i.test(text)) return `Medical card ${text.replace(/^Medical\s*/i, "").toLowerCase()}`;
  if (/MVR/i.test(text)) return "MVR requires dispatch verification";
  if (/CDL expiring/i.test(text)) return "CDL expiration window approaching";
  if (/FMCSA/i.test(text)) return "FMCSA status requires verification";
  return `Driver file warning: ${text}`;
}

function driverSoftWarningFix(warning: string): string {
  const text = normalizeOperationalCopy(warning);
  if (/Settlement|pay hold/i.test(text)) {
    return "Finance owner clears the pay/settlement hold or records an approved dispatch override.";
  }
  if (/I-9/i.test(text)) return "HR owner uploads the I-9 or records why it is not required before dispatch signoff.";
  if (/W-9/i.test(text)) return "Finance owner uploads the W-9 before settlement or carrier payment release.";
  if (/Bank|direct deposit|ACH/i.test(text)) {
    return "Finance owner verifies payment instructions before settlement release.";
  }
  if (/Safety tier/i.test(text)) return "Safety owner reviews lane length and documents coaching status before long-haul assignment.";
  if (/MVR/i.test(text)) return "Compliance owner verifies the MVR status before assigning premium or long-haul freight.";
  if (/CDL|Medical|FMCSA|compliance/i.test(text)) return "Compliance owner verifies the credential and records disposition before assignment.";
  return "Review the driver file warning and record the owner disposition before assigning restricted freight.";
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
  const canonicalStory = getCanonicalLoadStory(load.id);

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
      title: driverHardBlockTitle(hard),
      detail: `Assigned driver ${load.driverId}: ${normalizeOperationalCopy(hard)}`,
      whyItMatters:
        "Hard gates stop legal dispatch and revenue capture until the assigned driver record is brought current.",
      recommendedFix: "Open driver hub and clear hard blocker before dispatch.",
      actionHref: `/drivers/${load.driverId}`,
      actionLabel: "Open Driver",
      clearableInDemo: true,
    });
  }

  for (const soft of eligibility.softWarnings) {
    if (soft.startsWith("Demo override active")) continue;
    const softId = `driver-soft:${load.driverId}:${soft}`;
    reasons.push({
      id: softId,
      severity: "warning",
      category: soft.includes("Safety")
        ? "safety"
        : soft.includes("compliance") || soft.includes("Card") || soft.includes("MVR")
          ? "compliance"
          : "driver",
      title: driverSoftWarningTitle(soft),
      detail: `Assigned driver ${load.driverId}: ${normalizeOperationalCopy(soft)}`,
      whyItMatters:
        "This does not always hard-stop dispatch, but it can block premium freight, settlement release, or customer-sensitive lanes until an owner signs off.",
      recommendedFix: driverSoftWarningFix(soft),
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
      whyItMatters: "Proof-of-delivery gaps delay invoice proofing and settlement release on this load.",
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
      whyItMatters: "Seal exceptions are high-severity integrity signals for cargo claims and insurer review.",
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
      whyItMatters: "Flagged exceptions route loads into manual review and can pause downstream billing.",
      recommendedFix: "Resolve dispatch exception and verify proof package completeness.",
      actionHref: `/loads/${load.id}`,
      actionLabel: "Open Load",
      clearableInDemo: true,
    });
  }

  if (canonicalStory?.loadId === "L009") {
    reasons.push({
      id: `pretrip:tire-asset-defect:${load.id}`,
      severity: "critical",
      category: "route",
      title: "Tire / asset defect blocks dispatch",
      detail:
        "BOF stopped dispatch before departure because the pre-trip inspection and RFID yard read flagged an unresolved tire / asset defect.",
      whyItMatters:
        "The load should not move until the tire defect is repaired, the work order is closed, and pre-trip proof is rechecked.",
      recommendedFix:
        "Clear maintenance work order WO-003, upload repair proof, and rerun the pre-trip release check.",
      actionHref: "/maintenance",
      actionLabel: "Open Maintenance Board",
      clearableInDemo: true,
    });
  }

  if (canonicalStory?.loadId === "L008") {
    reasons.push({
      id: `safety:claim-escalation:${load.id}`,
      severity: "high",
      category: "safety",
      title: "Safety / cargo claim review open",
      detail:
        "Liam Smith's HOS violation is tied to an active cargo-damage claim; BOF has partial evidence and manager review is required.",
      whyItMatters:
        "Claim files need driver statements, damage photos, proof packet support, and safety coaching before the carrier can close the exposure cleanly.",
      recommendedFix:
        "Complete the claim evidence packet, driver statement, and HOS coaching acknowledgment in the safety workflow.",
      actionHref: "/safety",
      actionLabel: "Open Safety Claim",
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
      whyItMatters: "Blocked settlement rows stop driver pay release until finance clears proof and root cause.",
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
        whyItMatters: "Incomplete trip packets fail filing readiness checks and slow broker/customer sign-off.",
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
      !["CLOSED", "RESOLVED"].includes(String(c.status || "").toUpperCase()) &&
      reconcileCredentialIncident(data, c).display
  );
  for (const incident of openIncidents) {
    const rec = reconcileCredentialIncident(data, incident);
    reasons.push({
      id: `compliance:incident:${incident.incidentId}`,
      severity:
        incident.severity === "CRITICAL"
          ? "critical"
          : incident.severity === "HIGH"
            ? "high"
            : "warning",
      category: "compliance",
      title: `Compliance incident: ${rec.presentationTitle ?? incident.type}`,
      detail: `Incident ${incident.incidentId} is ${incident.status}.`,
      whyItMatters:
        incident.severity === "CRITICAL"
          ? "Critical incidents can hard-stop dispatch until compliance disposition is recorded."
          : "Open incidents elevate insurer and customer scrutiny on affected loads.",
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

