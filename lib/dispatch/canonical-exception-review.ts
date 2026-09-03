import type { ReviewDrawerIssue } from "@/components/review/review-types";
import type {
  CanonicalBlockerSource,
  CanonicalDispatchLoadState,
  CanonicalOperatingBlocker,
} from "@/lib/dispatch/canonical-dispatch-operating-state";

export type CanonicalEvidenceLink = {
  label: string;
  href: string;
};

export type CanonicalExceptionReviewModel = {
  loadId: string;
  disposition: CanonicalDispatchLoadState["releaseDisposition"];
  releaseConsequence: string;
  owner: string;
  problem: string;
  whyItMatters: string;
  recommendedFix: string;
  nextAction: string;
  primaryAction?: { label: string; href: string };
  evidenceLinks: CanonicalEvidenceLink[];
  issues: ReviewDrawerIssue[];
  categoryOrder: string[];
  categoryLabels: Record<string, string>;
};

const SOURCE_LABEL: Record<CanonicalBlockerSource, string> = {
  load: "Load record",
  driver: "Driver",
  equipment: "Equipment",
  document: "Document / proof",
  maintenance: "Maintenance",
  safety: "Safety",
  settlement: "Settlement",
  exception: "Dispatch exception",
};

function impactWhy(blocker: CanonicalOperatingBlocker): string {
  if (blocker.impact === "HOLD") {
    if (blocker.id === "seal" || blocker.id === "seal-verify") {
      return "Seal mismatch holds operating clear: cargo custody is not verified, so the load cannot be treated as released.";
    }
    if (blocker.id === "bol" || blocker.id === "rate-con") {
      return "Canonical proof is incomplete, so dispatch release stays held until the packet on the load file is cleared.";
    }
    if (blocker.id === "dispatch-instructions") {
      return "A pending load cannot release until dispatch instructions exist on the load record.";
    }
    if (blocker.source === "maintenance") {
      return "An equipment defect on the operating packet holds dispatch until repair proof is attached and pre-trip is re-run.";
    }
    if (blocker.source === "safety") {
      return "A safety or credential gate holds assignment until the driver record is cleared.";
    }
    return `${blocker.detail} Release stays held until this canonical record is cleared.`;
  }
  if (blocker.source === "settlement") {
    return "Settlement cannot be treated as clear until this hold on the load record is resolved.";
  }
  if (blocker.id === "document-review") {
    return "The load packet remains in document review and is not operating-clear.";
  }
  if (blocker.id === "exception") {
    return "The dispatch exception flag keeps this load in review until it is cleared on the load record.";
  }
  if (blocker.id === "pod") {
    return "POD is not verified after delivery, so closeout and settlement proof stay in review.";
  }
  if (blocker.id === "seal" || blocker.id === "seal-verify") {
    return "Seal mismatch requires manager review before settlement or proof closeout.";
  }
  return `${blocker.detail} The load stays in review until this record is resolved.`;
}

function actionForBlocker(
  state: CanonicalDispatchLoadState,
  blocker: CanonicalOperatingBlocker
): { href: string; label: string } {
  if (blocker.source === "settlement" && state.driverId) {
    return { href: `/settlements?driver=${encodeURIComponent(state.driverId)}`, label: "Open settlement" };
  }
  if (blocker.source === "safety" && state.driverId) {
    return { href: `/drivers/${encodeURIComponent(state.driverId)}/safety`, label: "Open driver safety" };
  }
  if (blocker.id === "unassigned") {
    return {
      href: `/dispatch?view=assign&loadId=${encodeURIComponent(state.loadId)}`,
      label: "Assign driver",
    };
  }
  if (blocker.source === "document" || blocker.id === "pod" || blocker.id === "bol") {
    return { href: `/loads/${encodeURIComponent(state.loadId)}`, label: "Open load proof" };
  }
  return {
    href: `/dispatch?view=load-detail&loadId=${encodeURIComponent(state.loadId)}`,
    label: "Open dispatch load file",
  };
}

function evidenceLinksForState(state: CanonicalDispatchLoadState): CanonicalEvidenceLink[] {
  const links: CanonicalEvidenceLink[] = [
    { label: "Load file", href: `/loads/${encodeURIComponent(state.loadId)}` },
    {
      label: "Dispatch load file",
      href: `/dispatch?view=load-detail&loadId=${encodeURIComponent(state.loadId)}`,
    },
  ];
  if (state.driverId) {
    links.push({
      label: state.driverName ? `Driver · ${state.driverName}` : "Driver record",
      href: `/drivers/${encodeURIComponent(state.driverId)}`,
    });
    links.push({
      label: "Driver vault",
      href: `/drivers/${encodeURIComponent(state.driverId)}/vault`,
    });
  }
  if (state.blockers.some((row) => row.source === "safety") && state.driverId) {
    links.push({
      label: "Safety record",
      href: `/drivers/${encodeURIComponent(state.driverId)}/safety`,
    });
  }
  if (state.settlementHold && state.driverId) {
    links.push({
      label: "Settlement",
      href: `/settlements?driver=${encodeURIComponent(state.driverId)}`,
    });
  }
  return links;
}

function toIssue(state: CanonicalDispatchLoadState, blocker: CanonicalOperatingBlocker): ReviewDrawerIssue {
  const action = actionForBlocker(state, blocker);
  return {
    id: blocker.id,
    severity: blocker.impact === "HOLD" ? "critical" : "high",
    category: blocker.source,
    title: blocker.label,
    detail: blocker.detail,
    whyItMatters: impactWhy(blocker),
    recommendedFix: blocker.nextAction,
    actionHref: action.href,
    actionLabel: action.label,
    canResolveInDemo: false,
  };
}

/**
 * Presentation-only mapping. Disposition, blockers, owner, and next action
 * come from getCanonicalDispatchLoadState — this does not invent gates.
 */
export function toCanonicalExceptionReviewModel(
  state: CanonicalDispatchLoadState
): CanonicalExceptionReviewModel {
  const primary = state.blockers.find((row) => row.impact === "HOLD") ?? state.blockers[0];
  const issues = state.blockers.map((blocker) => toIssue(state, blocker));
  const categories = Array.from(new Set(issues.map((issue) => issue.category)));
  const primaryAction = primary ? actionForBlocker(state, primary) : undefined;
  const whyItMatters = primary
    ? impactWhy(primary)
    : "No canonical operating blocker is open on this load.";

  return {
    loadId: state.loadId,
    disposition: state.releaseDisposition,
    releaseConsequence: state.releaseConsequence,
    owner: state.exceptionOwner,
    problem: primary?.label ?? "No canonical operating blocker",
    whyItMatters,
    recommendedFix: state.nextAction,
    nextAction: state.nextAction,
    primaryAction,
    evidenceLinks: evidenceLinksForState(state),
    issues,
    categoryOrder: categories,
    categoryLabels: SOURCE_LABEL,
  };
}
