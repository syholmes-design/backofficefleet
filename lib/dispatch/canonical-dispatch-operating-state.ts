import type { BofData } from "@/lib/load-bof-data";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import {
  getCanonicalOperatingProofStatus,
  getDerivedLoadProofItems,
  getLoadProofSummary,
} from "@/lib/load-proof";

type CanonicalLoad = BofData["loads"][number] & {
  driverId?: string;
  assetId?: string;
  trailerNumber?: string;
  customerName?: string;
  dispatcherName?: string;
  status?: string;
  podStatus?: string;
  sealStatus?: string;
  dispatchExceptionFlag?: boolean;
  settlementHold?: boolean;
  settlementHoldReason?: string;
  proofStatus?: string;
  documentStatus?: string;
  dispatchOpsNotes?: string;
};

export type CanonicalReleaseDisposition = "RELEASED" | "HOLD" | "REVIEW";

export type CanonicalBlockerSource =
  | "load"
  | "driver"
  | "equipment"
  | "document"
  | "maintenance"
  | "safety"
  | "settlement"
  | "exception";

export type CanonicalOperatingBlocker = {
  id: string;
  label: string;
  detail: string;
  source: CanonicalBlockerSource;
  owner: string;
  nextAction: string;
  impact: Exclude<CanonicalReleaseDisposition, "RELEASED">;
};

export type CanonicalDispatchLoadState = {
  loadId: string;
  assigned: boolean;
  driverId?: string;
  driverName?: string;
  assetId?: string;
  trailerId?: string;
  status: string;
  delivered: boolean;
  needsAttention: boolean;
  blockers: CanonicalOperatingBlocker[];
  attentionReasons: string[];
  releaseDisposition: CanonicalReleaseDisposition;
  releaseSummary: string;
  releaseConsequence: string;
  exceptionOwner: string;
  nextAction: string;
  settlementHold: boolean;
  settlementHoldReason?: string;
  pretripOverall?: "READY" | "BLOCKED";
  proofComplete: number;
  proofBlocking: number;
  proofLabel: string;
};

export type CanonicalDispatchBoardKpis = {
  loadsOnBoard: number;
  activeAssignments: number;
  delivered: number;
  needsAttention: number;
};

function asLoad(load: BofData["loads"][number]): CanonicalLoad {
  return load as CanonicalLoad;
}

function statusKey(status: string | undefined): string {
  return String(status ?? "").trim().toLowerCase().replace(/[\s_]+/g, " ");
}

function isDelivered(status: string | undefined): boolean {
  return statusKey(status) === "delivered";
}

function isExceptionStatus(status: string | undefined): boolean {
  return statusKey(status) === "exception";
}

function isSealMismatch(sealStatus: string | undefined): boolean {
  return String(sealStatus ?? "").trim().toUpperCase() === "MISMATCH";
}

function isWeakPod(podStatus: string | undefined): boolean {
  const pod = String(podStatus ?? "").trim().toLowerCase();
  return pod === "pending" || pod === "missing" || pod === "incomplete";
}

function sourceForPretripLine(lineId: string): CanonicalBlockerSource {
  if (lineId === "bol" || lineId === "rate-con") return "document";
  if (lineId === "seal-verify") return "load";
  if (lineId === "maint-report" || lineId === "tire-check") return "maintenance";
  if (lineId === "hos" || lineId === "cdl" || lineId === "med" || lineId === "mvr") return "safety";
  if (lineId === "settlements") return "settlement";
  return "load";
}

function nextActionForBlocker(args: {
  id: string;
  source: CanonicalBlockerSource;
  impact: CanonicalOperatingBlocker["impact"];
  detail: string;
}): string {
  if (args.id === "bol" || args.id === "rate-con") {
    return "Review and resolve BOL / rate-confirmation proof on the load file.";
  }
  if (args.id === "seal" || args.id === "seal-verify") {
    return args.impact === "HOLD"
      ? "Resolve the seal discrepancy and obtain manager signoff before the load can clear."
      : "Manager review: reconcile pickup and delivery seals on the load file.";
  }
  if (args.id === "maint-report" || args.id === "tire-check" || args.source === "maintenance") {
    return "Correct the equipment defect, attach repair proof, and re-run pre-trip inspection.";
  }
  if (args.id === "settlement" || args.source === "settlement") {
    return args.detail
      ? `Resolve the settlement exception: ${args.detail}`
      : "Resolve the settlement exception on the load record.";
  }
  if (args.id === "exception") {
    return "Resolve the dispatch exception on the load record and re-evaluate release.";
  }
  if (args.id === "pod") {
    return "Verify POD on the load file after delivery.";
  }
  if (args.id === "document-review") {
    return "Complete document review on the load file.";
  }
  if (args.id === "unassigned") {
    return "Assign a driver on the canonical load record.";
  }
  if (args.id === "dispatch-instructions") {
    return "Add dispatch instructions on the load record before release.";
  }
  if (args.source === "safety") {
    return "Clear the blocking safety / credential item and re-run readiness.";
  }
  return "Clear the blocking operating record and re-evaluate dispatch release.";
}

function releaseConsequenceFor(
  disposition: CanonicalReleaseDisposition,
  blockers: CanonicalOperatingBlocker[]
): string {
  if (disposition === "RELEASED") {
    return "Load release approved: pre-dispatch gates and credential checks are satisfied.";
  }
  const labels = blockers.map((row) => row.label).join("; ");
  if (disposition === "HOLD") {
    return `Release held: ${labels || "a canonical operating defect must clear before dispatch."}`;
  }
  return `Release under review: ${labels || "an operating exception requires review before the load is treated as clear."}`;
}

export function getCanonicalDispatchLoadState(data: BofData, loadId: string): CanonicalDispatchLoadState | null {
  const raw = data.loads.find((load) => load.id === loadId);
  if (!raw) return null;

  const load = asLoad(raw);
  const spine = data.loadRelationshipSpine?.[load.id];
  const pretrip = buildPretripTabletModel(data, load.id);
  const driverId = load.driverId || spine?.driverId || pretrip?.driverId;
  const driver = driverId ? data.drivers.find((row) => row.id === driverId) : undefined;
  const proofItems = getDerivedLoadProofItems(data, load.id);
  const proofSummary = getLoadProofSummary(proofItems);
  const owner = load.dispatcherName?.trim() || "Dispatch";

  const assigned = Boolean(driverId);
  const delivered = isDelivered(load.status);
  const settlementHold = Boolean(load.settlementHold);
  const sealMismatch = isSealMismatch(load.sealStatus);
  const exceptionFlag = Boolean(load.dispatchExceptionFlag) || isExceptionStatus(load.status);
  const pretripBlocked = pretrip?.overall === "BLOCKED";
  const podGap = delivered && isWeakPod(load.podStatus);
  const operatingBol = getCanonicalOperatingProofStatus(data, load.id, "BOL");

  const blockers: CanonicalOperatingBlocker[] = [];

  const pushBlocker = (
    blocker: Omit<CanonicalOperatingBlocker, "owner" | "nextAction"> & { nextAction?: string }
  ) => {
    const nextAction = blocker.nextAction ?? nextActionForBlocker({
      id: blocker.id,
      source: blocker.source,
      impact: blocker.impact,
      detail: blocker.detail,
    });
    blockers.push({
      ...blocker,
      owner,
      nextAction,
    });
  };

  if (!assigned) {
    pushBlocker({
      id: "unassigned",
      label: "No driver assigned",
      detail: "No driver assigned on the canonical load record",
      source: "load",
      impact: "REVIEW",
    });
  }

  if (pretrip) {
    for (const section of pretrip.sections) {
      for (const line of section.lines) {
        const blocks = line.critical && (line.status === "Missing" || line.status === "Warning");
        if (!blocks) continue;
        pushBlocker({
          id: line.id,
          label: `${line.label}: ${line.status}`,
          detail: `${line.label} is ${line.status} on the pre-trip operating packet`,
          source: sourceForPretripLine(line.id),
          impact: "HOLD",
        });
      }
    }
  }

  if (sealMismatch && !blockers.some((row) => row.id === "seal-verify" || row.id === "seal")) {
    pushBlocker({
      id: "seal",
      label: "Seal verification: Warning",
      detail: `Pickup and delivery seals do not match on the load record (${load.pickupSeal || "none"} vs ${load.deliverySeal || "none"}).`,
      source: "load",
      impact: delivered ? "REVIEW" : "HOLD",
    });
  }

  if (
    operatingBol &&
    operatingBol !== "Complete" &&
    operatingBol !== "Not required" &&
    !delivered &&
    !blockers.some((row) => row.id === "bol")
  ) {
    pushBlocker({
      id: "bol",
      label: `BOL: ${operatingBol === "Disputed" ? "Warning" : operatingBol === "Pending" ? "Warning" : "Missing"}`,
      detail: `Canonical load proof status is ${load.proofStatus || operatingBol}.`,
      source: "document",
      impact: "HOLD",
    });
  }

  if (settlementHold) {
    const reason = load.settlementHoldReason?.trim() || "Settlement hold is active";
    pushBlocker({
      id: "settlement",
      label: reason,
      detail: reason,
      source: "settlement",
      impact: "REVIEW",
    });
  }

  const hasSealOrHold = blockers.some(
    (row) => row.id === "seal" || row.id === "seal-verify" || row.source === "maintenance"
  );
  if (exceptionFlag && !hasSealOrHold && !pretripBlocked) {
    pushBlocker({
      id: "exception",
      label: "Dispatch exception flag is active",
      detail: "Dispatch exception flag is set on the canonical load record",
      source: "exception",
      impact: "REVIEW",
    });
  }

  if (podGap) {
    pushBlocker({
      id: "pod",
      label: "POD is not verified after delivery",
      detail: `POD status on the load record is ${load.podStatus || "not verified"}`,
      source: "document",
      impact: "REVIEW",
    });
  }

  if (/needs review/i.test(String(load.documentStatus ?? "")) && !blockers.some((row) => row.impact === "HOLD")) {
    pushBlocker({
      id: "document-review",
      label: "Document status: Needs Review",
      detail: "Document status on the canonical load record is Needs Review",
      source: "document",
      impact: "REVIEW",
    });
  }

  const unique = blockers
    .filter((row, index, all) => all.findIndex((other) => other.id === row.id) === index)
    .filter((row, _, all) => row.id !== "rate-con" || !all.some((other) => other.id === "bol"));
  const releaseDisposition: CanonicalReleaseDisposition = unique.some((row) => row.impact === "HOLD")
    ? "HOLD"
    : unique.length > 0
      ? "REVIEW"
      : "RELEASED";
  const releaseConsequence = releaseConsequenceFor(releaseDisposition, unique);
  const primary = unique.find((row) => row.impact === "HOLD") ?? unique[0];
  const nextAction = primary
    ? primary.nextAction
    : delivered
      ? "Keep proof packet attached to settlement closeout."
      : "Proceed with the current assignment and operating gates.";

  return {
    loadId: load.id,
    assigned,
    driverId,
    driverName: driver?.name || pretrip?.driverName,
    assetId: load.assetId || spine?.assetId || pretrip?.assetId,
    trailerId: load.trailerNumber || spine?.trailerId,
    status: String(load.status ?? "Pending"),
    delivered,
    needsAttention: unique.length > 0,
    blockers: unique,
    attentionReasons: unique.map((row) => row.label),
    releaseDisposition,
    releaseSummary: releaseConsequence,
    releaseConsequence,
    exceptionOwner: owner,
    nextAction,
    settlementHold,
    settlementHoldReason: load.settlementHoldReason?.trim() || undefined,
    pretripOverall: pretrip?.overall,
    proofComplete: proofSummary.completeCount,
    proofBlocking: proofSummary.blockingCount,
    proofLabel: load.proofStatus
      ? `Load proof status: ${load.proofStatus}`
      : proofSummary.blockingCount > 0
        ? `${proofSummary.blockingCount} proof item(s) still blocking`
        : `${proofSummary.completeCount} of ${proofSummary.applicableCount} applicable proof items complete`,
  };
}

export function listCanonicalDispatchAttentionStates(data: BofData): CanonicalDispatchLoadState[] {
  return data.loads
    .map((load) => getCanonicalDispatchLoadState(data, load.id))
    .filter((row): row is CanonicalDispatchLoadState => Boolean(row?.needsAttention));
}

export function getCanonicalDispatchBoardKpis(data: BofData): CanonicalDispatchBoardKpis {
  const states = data.loads
    .map((load) => getCanonicalDispatchLoadState(data, load.id))
    .filter((row): row is CanonicalDispatchLoadState => Boolean(row));

  return {
    loadsOnBoard: states.length,
    activeAssignments: states.filter((row) => row.assigned).length,
    delivered: states.filter((row) => row.delivered).length,
    needsAttention: states.filter((row) => row.needsAttention).length,
  };
}
