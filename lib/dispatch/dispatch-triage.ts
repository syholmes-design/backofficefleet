import type { BofData } from "@/lib/load-bof-data";
import {
  getCanonicalDispatchLoadState,
  type CanonicalDispatchLoadState,
  type CanonicalOperatingBlocker,
} from "@/lib/dispatch/canonical-dispatch-operating-state";
import {
  groupDispatchIssues,
  nextActionHref,
  nextActionLabel,
  type DispatchIssueCategory,
  type GroupedDispatchIssueCategory,
} from "@/lib/dispatch/dispatch-issue-grouping";
import { classifyIssueSeverity, classifyLoadSeverity, type DispatchIssueSeverity } from "@/lib/dispatch/dispatch-severity";

export type DispatchReadinessStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";
export type DispatchTriageRole = "dispatcher" | "manager";

export type DispatchTriageCard = {
  loadId: string;
  loadStatus: string;
  customerName: string;
  origin: string;
  destination: string;
  lane: string;
  driverId?: string;
  driverName: string;
  equipmentId?: string;
  trailerId?: string;
  readiness: DispatchReadinessStatus;
  severity: DispatchIssueSeverity;
  categories: GroupedDispatchIssueCategory[];
  issueSummary: string;
  issueCount: number;
  holdCount: number;
  nextAction: string;
  nextActionHref: string;
  nextActionLabel: string;
  requiresManagerReview: boolean;
  escalationReason: string | null;
};

export type DispatchTriageFilters = {
  severity?: DispatchIssueSeverity | "ALL";
  readiness?: DispatchReadinessStatus | "ALL";
  loadStatus?: string;
  customer?: string;
  driver?: string;
  equipment?: string;
  lane?: string;
  category?: DispatchIssueCategory | "ALL";
};

function readinessFromState(state: CanonicalDispatchLoadState): DispatchReadinessStatus {
  if (state.releaseDisposition === "HOLD") return "BLOCKED";
  if (state.releaseDisposition === "REVIEW") return "REVIEW_REQUIRED";
  return "READY";
}

function primaryBlocker(state: CanonicalDispatchLoadState): CanonicalOperatingBlocker | undefined {
  const ranked = [...state.blockers].sort((a, b) => {
    const order = { CRITICAL: 0, MAJOR: 1, MINOR: 2 };
    return order[classifyIssueSeverity(a)] - order[classifyIssueSeverity(b)];
  });
  return ranked.find((row) => row.impact === "HOLD") ?? ranked[0];
}

export function toDispatchTriageCard(data: BofData, state: CanonicalDispatchLoadState): DispatchTriageCard | null {
  const severity = classifyLoadSeverity(state.blockers);
  if (!severity) return null;
  const load = data.loads.find((row) => row.id === state.loadId) as
    | (BofData["loads"][number] & { customerName?: string })
    | undefined;
  const categories = groupDispatchIssues(state.blockers);
  const primary = primaryBlocker(state);
  const requiresManagerReview = state.blockers.some(
    (row) =>
      row.impact === "HOLD" &&
      (row.id === "seal" || row.id === "seal-verify" || row.source === "safety" || row.id === "exception"),
  );
  return {
    loadId: state.loadId,
    loadStatus: state.status,
    customerName: load?.customerName ?? "Customer not available",
    origin: load?.origin ?? "Origin not available",
    destination: load?.destination ?? "Destination not available",
    lane: `${load?.origin ?? "Unknown"} → ${load?.destination ?? "Unknown"}`,
    driverId: state.driverId,
    driverName: state.driverName ?? "Unassigned",
    equipmentId: state.assetId,
    trailerId: state.trailerId,
    readiness: readinessFromState(state),
    severity,
    categories,
    issueSummary: categories.map((row) => `${row.label}: ${row.summary}`).join(" · ") || state.nextAction,
    issueCount: state.blockers.length,
    holdCount: state.blockers.filter((row) => row.impact === "HOLD").length,
    nextAction: primary ? primary.nextAction : state.nextAction,
    nextActionHref: primary
      ? nextActionHref(state.loadId, primary, state.driverId, state.assetId)
      : `/trip-release/${encodeURIComponent(state.loadId)}`,
    nextActionLabel: primary ? nextActionLabel(primary) : "Review release gate",
    requiresManagerReview,
    escalationReason: requiresManagerReview
      ? primary
        ? `${primary.label}. Existing dispatch release remains ${state.releaseDisposition}; no client override is applied.`
        : "A hold requires authorized review. No override API is available."
      : null,
  };
}

export function listDispatchTriageCards(data: BofData): DispatchTriageCard[] {
  return data.loads
    .map((load) => getCanonicalDispatchLoadState(data, load.id))
    .filter((row): row is CanonicalDispatchLoadState => Boolean(row?.needsAttention))
    .map((state) => toDispatchTriageCard(data, state))
    .filter((row): row is DispatchTriageCard => Boolean(row));
}

export function sortTriageColumn(cards: DispatchTriageCard[], severity: DispatchIssueSeverity): DispatchTriageCard[] {
  const rows = cards.filter((card) => card.severity === severity);
  if (severity === "CRITICAL") {
    return rows.sort((a, b) => b.holdCount - a.holdCount || a.loadId.localeCompare(b.loadId));
  }
  if (severity === "MAJOR") {
    return rows.sort((a, b) => b.issueCount - a.issueCount || a.loadId.localeCompare(b.loadId));
  }
  return rows.sort((a, b) => a.loadId.localeCompare(b.loadId));
}

export function filterTriageCards(cards: DispatchTriageCard[], filters: DispatchTriageFilters): DispatchTriageCard[] {
  return cards.filter((card) => {
    if (filters.severity && filters.severity !== "ALL" && card.severity !== filters.severity) return false;
    if (filters.readiness && filters.readiness !== "ALL" && card.readiness !== filters.readiness) return false;
    if (filters.loadStatus && filters.loadStatus !== "ALL" && card.loadStatus !== filters.loadStatus) return false;
    if (filters.customer && filters.customer !== "ALL" && card.customerName !== filters.customer) return false;
    if (filters.driver && filters.driver !== "ALL" && card.driverName !== filters.driver) return false;
    if (filters.equipment && filters.equipment !== "ALL" && card.equipmentId !== filters.equipment) return false;
    if (filters.lane && filters.lane !== "ALL" && card.lane !== filters.lane) return false;
    if (
      filters.category &&
      filters.category !== "ALL" &&
      !card.categories.some((row) => row.category === filters.category)
    ) {
      return false;
    }
    return true;
  });
}
