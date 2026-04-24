import type { BofData } from "@/lib/load-bof-data";
import { getLoadProofItems } from "@/lib/load-proof";

/**
 * BOF-native RFID readiness (demo / system layer only — no hardware).
 * Derived from load rows, proof bundles, and light heuristics for demo variety.
 */

export type BofRfidMode = "none" | "seal" | "checkpoint" | "custody" | "enhanced_proof";

/**
 * Single BOF-native policy outcome for RFID vs a template or release action.
 * Drives template usage rows, Generate disable, trip release, and billing hints.
 */
export type BofRfidGateLevel = "advisory" | "soft_block" | "hard_block";

export type BofRfidTemplateGate = {
  level: BofRfidGateLevel;
  /** Short operator-facing label */
  label: string;
  /** One sentence: why this level applies */
  reason: string;
};

export type BofLoadRfidReadiness = {
  loadId: string;
  rfidEnabled: boolean;
  rfidMode: BofRfidMode;
  rfidEventsExpected: string[];
  rfidEventsCaptured: string[];
  rfidSealVerified: boolean;
  rfidCheckpointVerified: boolean;
  rfidTrailerVerified: boolean;
  rfidCustodyGapDetected: boolean;
  rfidLastEventAt: string | null;
  rfidExceptionFlag: boolean;
  rfidRequiredBeforeRelease: boolean;
  rfidRequiredBeforeBilling: boolean;
  rfidRequiredForClaimSupport: boolean;
};

function loadNumericSuffix(loadId: string): number {
  const m = loadId.match(/\d+/g);
  if (!m?.length) return 0;
  return parseInt(m[m.length - 1]!, 10) || 0;
}

function demoIsoLastEvent(loadId: string, complete: boolean): string | null {
  if (!complete) return null;
  const day = 14 + (loadNumericSuffix(loadId) % 12);
  return `2026-04-${String(day).padStart(2, "0")}T16:${String(loadNumericSuffix(loadId) % 50).padStart(2, "0")}:00Z`;
}

export function buildBofLoadRfidReadiness(
  data: BofData,
  loadId: string
): BofLoadRfidReadiness | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;

  const proofs = getLoadProofItems(data, loadId);
  const rfidProof = proofs.find((p) => p.type === "RFID / Dock Validation Record");
  const podDisputed = /pending|disput/i.test(String(load.podStatus ?? ""));
  const sealMismatch = load.sealStatus === "Mismatch";
  const hasSeals =
    Boolean(String(load.pickupSeal ?? "").trim()) &&
    Boolean(String(load.deliverySeal ?? "").trim());

  const n = loadNumericSuffix(loadId);
  /** ~1 in 9 loads: RFID capability off for this movement (demo). */
  const rfidEnabled = n % 9 !== 0;

  const highValue = load.revenue >= 4200;
  const custodyStory =
    sealMismatch ||
    (load.dispatchExceptionFlag && (podDisputed || sealMismatch));

  let rfidMode: BofRfidMode = "none";
  if (!rfidEnabled) rfidMode = "none";
  else if (highValue && (load.dispatchExceptionFlag || load.revenue >= 5200))
    rfidMode = "enhanced_proof";
  else if (custodyStory) rfidMode = "custody";
  else if (hasSeals && rfidProof?.status === "Complete") rfidMode = "seal";
  else if (rfidProof?.status === "Complete" || load.status === "Delivered")
    rfidMode = "checkpoint";
  else if (hasSeals) rfidMode = "seal";
  else rfidMode = "checkpoint";

  const rfidEventsExpected = rfidEnabled
    ? ["Seal handshake", "Dock / gate checkpoint", "Trailer / tag verification"]
    : [];

  const captured: string[] = [];
  if (hasSeals) captured.push("Seal handshake");
  if (rfidProof?.status === "Complete") {
    captured.push("Dock / gate checkpoint");
    captured.push("Trailer / tag verification");
  } else if (rfidProof?.status === "Pending") captured.push("Dock / gate checkpoint (partial)");

  const rfidSealVerified =
    rfidEnabled && hasSeals && !sealMismatch && load.sealStatus === "OK";
  const rfidCheckpointVerified = rfidProof?.status === "Complete";
  const rfidTrailerVerified =
    rfidCheckpointVerified && (load.status === "Delivered" || rfidProof?.status === "Complete");

  const rfidCustodyGapDetected =
    rfidEnabled &&
    (sealMismatch ||
      (load.dispatchExceptionFlag && rfidProof?.status !== "Complete" && rfidMode === "custody"));

  const rfidExceptionFlag =
    Boolean(load.dispatchExceptionFlag) || sealMismatch || rfidCustodyGapDetected;

  const rfidRequiredBeforeRelease =
    rfidEnabled &&
    (rfidMode === "enhanced_proof" ||
      rfidMode === "custody" ||
      (rfidMode === "seal" && !rfidSealVerified && load.status !== "Pending"));

  const blockingPayment = proofs.some((p) => p.blocksPayment);
  const rfidRequiredBeforeBilling =
    rfidEnabled &&
    (blockingPayment ||
      rfidMode === "custody" ||
      (rfidProof != null &&
        rfidProof.status !== "Complete" &&
        rfidProof.status !== "Not required" &&
        load.status === "Delivered"));

  const rfidRequiredForClaimSupport =
    rfidEnabled &&
    (rfidCustodyGapDetected ||
      sealMismatch ||
      (highValue && load.dispatchExceptionFlag) ||
      rfidMode === "enhanced_proof");

  return {
    loadId,
    rfidEnabled,
    rfidMode,
    rfidEventsExpected,
    rfidEventsCaptured: captured,
    rfidSealVerified,
    rfidCheckpointVerified,
    rfidTrailerVerified,
    rfidCustodyGapDetected,
    rfidLastEventAt: demoIsoLastEvent(loadId, rfidCheckpointVerified),
    rfidExceptionFlag,
    rfidRequiredBeforeRelease,
    rfidRequiredBeforeBilling,
    rfidRequiredForClaimSupport,
  };
}

/** Merge several loads (e.g. settlement lines) into one conservative readiness view. */
export function mergeBofRfidReadiness(
  data: BofData,
  loadIds: string[]
): BofLoadRfidReadiness | null {
  const uniq = [...new Set(loadIds.filter(Boolean))];
  if (!uniq.length) return null;
  const rows = uniq.map((id) => buildBofLoadRfidReadiness(data, id)).filter(Boolean) as BofLoadRfidReadiness[];
  if (!rows.length) return null;

  const rfidEnabled = rows.some((r) => r.rfidEnabled);
  const rank: Record<BofRfidMode, number> = {
    none: 0,
    checkpoint: 1,
    seal: 2,
    custody: 3,
    enhanced_proof: 4,
  };
  const rfidMode = rows.reduce(
    (best, r) => (rank[r.rfidMode] > rank[best] ? r.rfidMode : best),
    "none" as BofRfidMode
  );

  return {
    loadId: uniq.join("+"),
    rfidEnabled,
    rfidMode,
    rfidEventsExpected: rows[0]!.rfidEventsExpected,
    rfidEventsCaptured: [...new Set(rows.flatMap((r) => r.rfidEventsCaptured))],
    rfidSealVerified: rows.every((r) => !r.rfidEnabled || r.rfidSealVerified),
    /** Conservative: every RFID-enabled load must show a complete checkpoint read. */
    rfidCheckpointVerified: rows.every((r) => !r.rfidEnabled || r.rfidCheckpointVerified),
    rfidTrailerVerified: rows.every((r) => !r.rfidEnabled || r.rfidTrailerVerified),
    rfidCustodyGapDetected: rows.some((r) => r.rfidCustodyGapDetected),
    rfidLastEventAt: rows.map((r) => r.rfidLastEventAt).find(Boolean) ?? null,
    rfidExceptionFlag: rows.some((r) => r.rfidExceptionFlag),
    rfidRequiredBeforeRelease: rows.some((r) => r.rfidRequiredBeforeRelease),
    rfidRequiredBeforeBilling: rows.some((r) => r.rfidRequiredBeforeBilling),
    rfidRequiredForClaimSupport: rows.some((r) => r.rfidRequiredForClaimSupport),
  };
}

export function rfidRelevantForTemplate(templateId: string): boolean {
  const id = templateId.toLowerCase();
  if (
    id.includes("dispatch-release") ||
    id.includes("pretrip") ||
    id.includes("driver-assignment") ||
    id.includes("proof-requirements") ||
    id.includes("seal") ||
    id.includes("facility-rules")
  )
    return true;
  if (
    id.includes("billing-packet") ||
    id.includes("settlement-hold") ||
    id.includes("accessorial") ||
    id.includes("detention")
  )
    return true;
  if (
    id.includes("claim") ||
    id.includes("damage") ||
    id.includes("incident") ||
    id.includes("high-value") ||
    id.includes("police-report")
  )
    return true;
  return false;
}

function gateAdvisory(reason: string, label = "RFID advisory"): BofRfidTemplateGate {
  return { level: "advisory", label, reason };
}

function gateSoft(reason: string, label = "RFID review recommended"): BofRfidTemplateGate {
  return { level: "soft_block", label, reason };
}

function gateHard(reason: string, label = "RFID hard block"): BofRfidTemplateGate {
  return { level: "hard_block", label, reason };
}

/**
 * RFID gate for a specific template row — source of truth for pills, tooltips, and Generate disable.
 */
export function resolveRfidTemplateGate(
  templateId: string,
  rfid: BofLoadRfidReadiness | null
): BofRfidTemplateGate {
  const id = templateId.toLowerCase();

  if (!rfidRelevantForTemplate(templateId)) {
    return gateAdvisory("RFID not in scope for this template.");
  }
  if (!rfid) {
    return gateAdvisory("No RFID summary for linked loads — treat RFID as not evaluated.");
  }
  if (!rfid.rfidEnabled) {
    return gateAdvisory(
      "RFID inactive on this movement (demo). Human proof and documents remain authoritative."
    );
  }

  const releaseHard =
    rfid.rfidRequiredBeforeRelease &&
    !rfid.rfidCheckpointVerified &&
    (id.includes("dispatch-release") || id.includes("pretrip-readiness") || id.includes("driver-assignment"));

  if (releaseHard) {
    return gateHard(
      "BOF policy: RFID checkpoint / dock evidence is required before dispatch-ready artifacts for this load.",
      "RFID required before release"
    );
  }

  if (
    id.includes("billing-packet") &&
    rfid.rfidRequiredBeforeBilling &&
    !rfid.rfidCheckpointVerified
  ) {
    return gateHard(
      "BOF policy: RFID-backed checkpoint evidence is required before billing packet cover may be treated as complete.",
      "RFID required before billing"
    );
  }

  const claimHardBase =
    rfid.rfidRequiredForClaimSupport &&
    !rfid.rfidCheckpointVerified &&
    (rfid.rfidCustodyGapDetected || rfid.rfidMode === "enhanced_proof");

  if ((id.includes("claim-support-packet") || id.includes("high-value-cargo")) && claimHardBase) {
    return gateHard(
      "BOF policy: custody / high-value posture requires RFID checkpoint evidence in the claim support stack.",
      "RFID required for claim support"
    );
  }

  if (
    id.includes("proof-requirements") &&
    rfid.rfidRequiredBeforeRelease &&
    !rfid.rfidCheckpointVerified
  ) {
    return gateSoft(
      "RFID checkpoint incomplete — proof sheet should call out RFID gaps alongside human evidence.",
      "RFID soft block"
    );
  }

  if (
    (id.includes("settlement-hold") || id.includes("accessorial") || id.includes("detention")) &&
    rfid.rfidRequiredBeforeBilling &&
    !rfid.rfidCheckpointVerified
  ) {
    return gateSoft(
      "RFID timing / checkpoint evidence still useful for billing dispute defense.",
      "RFID advisory / billing"
    );
  }

  if (id.includes("seal-verification") && rfid.rfidRequiredBeforeRelease && !rfid.rfidSealVerified) {
    return gateSoft("Seal verification should align with RFID seal handshake when RFID is on.", "RFID soft block");
  }

  return gateAdvisory("RFID context available; no stronger gate on this row.");
}

/** Same policy as `dispatch-release-checklist` — for trip release footer and dispatch surfaces. */
export function resolveTripDispatchRfidGate(rfid: BofLoadRfidReadiness | null): BofRfidTemplateGate {
  return resolveRfidTemplateGate("dispatch-release-checklist", rfid);
}

/** Same policy as `billing-packet-cover` — for settlement export / billing UX. */
export function resolveBillingPacketRfidGate(rfid: BofLoadRfidReadiness | null): BofRfidTemplateGate {
  return resolveRfidTemplateGate("billing-packet-cover", rfid);
}

export function describeRfidSurfacePosture(rfid: BofLoadRfidReadiness | null): string | null {
  if (!rfid) return null;
  if (!rfid.rfidEnabled) return "RFID inactive (demo) — human proof remains primary.";
  const parts = [`mode ${rfid.rfidMode.replace(/_/g, " ")}`];
  if (rfid.rfidRequiredBeforeRelease) parts.push("release-sensitive");
  if (rfid.rfidRequiredBeforeBilling) parts.push("billing-sensitive");
  if (rfid.rfidRequiredForClaimSupport) parts.push("claim-support posture");
  if (rfid.rfidCustodyGapDetected) parts.push("custody gap");
  const g = resolveTripDispatchRfidGate(rfid);
  if (g.level === "hard_block") parts.push("dispatch RFID gate: blocked");
  else if (g.level === "soft_block") parts.push("dispatch RFID gate: review");
  return parts.join(" · ");
}

export function rfidHintsForTemplateRow(
  templateId: string,
  rfid: BofLoadRfidReadiness | null
): string[] {
  if (!rfid || !rfidRelevantForTemplate(templateId)) return [];
  const out: string[] = [];
  const id = templateId.toLowerCase();

  if (!rfid.rfidEnabled) {
    out.push("RFID inactive for this movement");
    return out.slice(0, 2);
  }

  if (rfid.rfidMode === "enhanced_proof" && (id.includes("high-value") || id.includes("proof-requirements"))) {
    out.push("RFID enhanced proof protocol active");
  }
  if (rfid.rfidCustodyGapDetected && (id.includes("claim") || id.includes("damage") || id.includes("incident"))) {
    out.push("RFID custody gap detected");
  }
  if (!rfid.rfidSealVerified && (id.includes("dispatch-release") || id.includes("seal"))) {
    out.push("RFID seal verification incomplete");
  }
  if (rfid.rfidCheckpointVerified && (id.includes("billing") || id.includes("settlement-hold"))) {
    out.push("RFID checkpoint evidence on file");
  }
  if (!rfid.rfidCheckpointVerified && rfid.rfidRequiredBeforeBilling && id.includes("billing-packet")) {
    out.push("RFID proof incomplete for billing");
  }
  if (rfid.rfidRequiredBeforeRelease && !rfid.rfidCheckpointVerified && id.includes("dispatch-release")) {
    out.push("RFID required before release — checkpoint / seal events incomplete");
  }
  if (rfid.rfidTrailerVerified && id.includes("driver-assignment")) {
    out.push("RFID trailer / tag verified (demo)");
  }
  if (id.includes("claim-support") && rfid.rfidCheckpointVerified) {
    out.push("RFID checkpoint history available");
  }

  if (!out.length && rfid.rfidExceptionFlag) out.push("RFID exception — review chain-of-custody");
  return out.slice(0, 2);
}
