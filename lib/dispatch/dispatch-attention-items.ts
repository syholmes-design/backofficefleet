import type { BofData } from "@/lib/load-bof-data";
import {
  listCanonicalDispatchAttentionStates,
  type CanonicalDispatchLoadState,
} from "@/lib/dispatch/canonical-dispatch-operating-state";

const SEVERITY_ORDER: Record<"critical" | "high" | "medium", number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export type DispatchAttentionRow = {
  id: string;
  bucket: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  owner: string;
  nextAction: string;
  releaseConsequence: string;
  href: string;
  loadId: string;
};

function severityForState(state: CanonicalDispatchLoadState): DispatchAttentionRow["severity"] {
  if (state.releaseDisposition === "HOLD") return "critical";
  if (state.releaseDisposition === "REVIEW") return "high";
  return "medium";
}

/**
 * Dispatch attention queue — same canonical blockers as getCanonicalDispatchLoadState.
 * Titles always use canonical L00x identity, never workbook load numbers (501 / 015).
 */
export function getDispatchAttentionItems(
  data: BofData,
  limit?: number
): DispatchAttentionRow[] {
  const sorted = [...listCanonicalDispatchAttentionStates(data)].sort((a, b) => {
    const bySev = SEVERITY_ORDER[severityForState(a)] - SEVERITY_ORDER[severityForState(b)];
    if (bySev !== 0) return bySev;
    return a.loadId.localeCompare(b.loadId);
  });

  const rows = sorted.map((state) => ({
    id: `attention-${state.loadId}`,
    loadId: state.loadId,
    bucket: "Dispatch / operating gates",
    title: `${state.loadId} — ${state.releaseDisposition}`,
    detail: state.attentionReasons.join(" · "),
    severity: severityForState(state),
    owner: state.exceptionOwner,
    nextAction: state.nextAction,
    releaseConsequence: state.releaseConsequence,
    href: `/dispatch?loadId=${encodeURIComponent(state.loadId)}`,
  }));

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}
