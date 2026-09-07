/**
 * Dispatch Copilot Advocate — domain reasoning over existing Dispatch authorities.
 * Does not assign, release, score, or persist Dispatch state.
 */

import type { BofData } from "@/lib/load-bof-data";
import { normalizeCanonicalLoadId } from "@/lib/canonical-load-stories";
import {
  getCanonicalDispatchLoadState,
  listCanonicalDispatchAttentionStates,
  type CanonicalDispatchLoadState,
} from "@/lib/dispatch/canonical-dispatch-operating-state";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { listMaintenanceAssetSummaries } from "@/lib/maintenance-data";
import type { V3OperationalData } from "@/lib/v3-operational-types";
import {
  classifyCopilotCause,
  type CopilotAdvocateView,
  type CopilotConflict,
  type CopilotFact,
  type CopilotGuidanceItem,
  type CopilotInterpretation,
  type CopilotPriorityBand,
  type CopilotScope,
} from "@/lib/copilot/copilot-shared";

const LIST_CAP = 6;

function loadKey(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (/^PI-TEST-/i.test(trimmed)) return trimmed.toUpperCase();
  return normalizeCanonicalLoadId(trimmed);
}

function idKey(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function inScope(scope: CopilotScope | undefined, keys: { loadId?: string | null; driverId?: string | null; assetId?: string | null }): boolean {
  if (!scope?.loadId && !scope?.driverId && !scope?.assetId) return true;
  const load = loadKey(scope?.loadId);
  const driver = idKey(scope?.driverId);
  const asset = idKey(scope?.assetId);
  if (load && loadKey(keys.loadId) === load) return true;
  if (driver && idKey(keys.driverId) === driver) return true;
  if (asset && idKey(keys.assetId) === asset) return true;
  return false;
}

function assignHref(loadId: string): string {
  return `/dispatch?view=assign&loadId=${encodeURIComponent(loadId)}`;
}

function loadHref(loadId: string): string {
  return `/loads/${encodeURIComponent(loadId)}`;
}

/** Navigation only: existing /settlements query join. No payroll or Load File logic. */
function settlementsRelevanceHref(driverId?: string | null, loadId?: string | null): string {
  const params = new URLSearchParams();
  const driver = driverId?.trim();
  const load = loadId?.trim();
  if (driver) params.set("driverId", driver);
  if (load) params.set("loadId", load);
  const query = params.toString();
  return query ? `/settlements?${query}` : "/settlements";
}

function piHref(loadId: string): string {
  return `/loads/${encodeURIComponent(loadId)}#process-intelligence`;
}

function derivedPriority(state: CanonicalDispatchLoadState): CopilotPriorityBand {
  if (state.releaseDisposition === "HOLD" || state.blockers.some((row) => row.impact === "HOLD")) {
    return "hold_or_block";
  }
  if (state.needsAttention) return "review";
  return "monitor";
}

function listDispatchStates(data: BofData, scope?: CopilotScope): CanonicalDispatchLoadState[] {
  const all = data.loads
    .map((load) => getCanonicalDispatchLoadState(data, load.id))
    .filter((row): row is CanonicalDispatchLoadState => Boolean(row))
    .filter((row) => inScope(scope, { loadId: row.loadId, driverId: row.driverId, assetId: row.assetId }));

  if (scope?.loadId || scope?.driverId || scope?.assetId) return all;

  const attention = listCanonicalDispatchAttentionStates(data);
  const clearAssigned = all.filter((row) => row.assigned && row.releaseDisposition === "RELEASED" && !row.needsAttention);
  const merged = [...attention];
  for (const row of clearAssigned) {
    if (!merged.some((item) => item.loadId === row.loadId)) merged.push(row);
  }
  return merged;
}

export function buildDispatchCopilotAdvocateView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const scope = args.scope;
  const equipment = listMaintenanceAssetSummaries(args.data);
  const states = listDispatchStates(args.data, scope);

  const facts: CopilotFact[] = [];
  const interpretations: CopilotInterpretation[] = [];
  const conflicts: CopilotConflict[] = [];
  const guidance: CopilotGuidanceItem[] = [];
  const decisionSupport: CopilotInterpretation[] = [];
  const unsupported: string[] = [
    "Dispatch Copilot does not call DispatchAssignment or DispatchRelease APIs. Live Prisma assignment/release remains on the Dispatch Command Center workflow snapshot.",
    "dispatch-triage / dispatch-severity bands are presentation-derived. Copilot does not copy them as Dispatch state.",
    "Fleet-wide Process Intelligence event lists are load-scoped. Copilot does not synthesize a dispatch timeline.",
    "Settlement amounts, payroll, payment, invoice, and factoring are not calculated here. Load settlementHold is relevance only.",
  ];

  if (scope?.loadId && !getCanonicalDispatchLoadState(args.data, scope.loadId) && states.length === 0) {
    unsupported.unshift(
      `No canonical dispatch operating state exists for load ${scope.loadId}. That is an honest empty, not a READY or RELEASED state.`,
    );
  }

  for (const load of states.slice(0, LIST_CAP * 2)) {
    const assignedFact = load.assigned
      ? `${load.loadId} is assigned to ${load.driverId || "a driver"} on the canonical load record.`
      : `${load.loadId} has no driver on the canonical load record.`;
    facts.push({
      id: `fact-assign-${load.loadId}`,
      domain: "Dispatch assignment",
      source: `Canonical dispatch operating state ${load.loadId}`,
      sourceClass: "AUTHORITATIVE",
      fact: assignedFact,
      ...classifyCopilotCause({}),
    });
    facts.push({
      id: `fact-release-${load.loadId}`,
      domain: "Dispatch readiness / release",
      source: `Canonical dispatch operating state ${load.loadId}`,
      sourceClass: "AUTHORITATIVE",
      fact: `${load.loadId} canonical releaseDisposition=${load.releaseDisposition}. ${load.releaseSummary}`,
      ...classifyCopilotCause({}),
    });

    const blocker = load.blockers[0];
    if (blocker) {
      facts.push({
        id: `fact-blocker-${load.loadId}-${blocker.id}`,
        domain: "Dispatch blocker",
        source: `Canonical blocker ${blocker.id} (${blocker.source})`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} blocker: ${blocker.label}. Owner ${blocker.owner}.`,
        ...classifyCopilotCause({ recordedCauseText: blocker.detail }),
      });
      interpretations.push({
        id: `interp-blocker-${load.loadId}`,
        claimClass: "DERIVED_INTERPRETATION",
        text: `${load.loadId} is in canonical attention because recorded blockers exist. Copilot does not create a blocker or a severity field.`,
        basedOnFactIds: [`fact-blocker-${load.loadId}-${blocker.id}`],
      });
      guidance.push({
        id: `rec-blocker-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical blocker ${blocker.id}`,
        fact: blocker.label,
        interpretation: "Open the existing Load File / Dispatch blocker workflow. Copilot does not clear the blocker.",
        recommendedAction: blocker.nextAction || load.nextAction,
        workflow: "Load File / Dispatch Command Center",
        href: loadHref(load.loadId),
        owner: blocker.owner,
        derivedPriority: derivedPriority(load),
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Dispatch priority field.",
        executable: false,
      });
    } else if (load.assigned && load.releaseDisposition === "RELEASED") {
      interpretations.push({
        id: `interp-clear-${load.loadId}`,
        claimClass: "DERIVED_INTERPRETATION",
        text: `${load.loadId} has a canonical assignment and RELEASED disposition with no copied blockers. Copilot does not mark the load READY as a new state.`,
        basedOnFactIds: [`fact-assign-${load.loadId}`, `fact-release-${load.loadId}`],
      });
      guidance.push({
        id: `rec-review-assignment-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical assignment ${load.loadId}`,
        fact: assignedFact,
        interpretation: "Review the existing assignment workflow. Copilot does not assign or replace a driver.",
        recommendedAction: "Review driver assignment",
        workflow: "Dispatch assignment",
        href: assignHref(load.loadId),
        owner: load.exceptionOwner || "Dispatch",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Dispatch priority field.",
        executable: false,
      });
    }

    if (load.settlementHold) {
      facts.push({
        id: `fact-settle-rel-${load.loadId}`,
        domain: "Settlement relevance",
        source: `Canonical load ${load.loadId} settlementHold`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} settlementHold=true${load.settlementHoldReason ? `: ${load.settlementHoldReason}` : ""}. This is load-level relevance, not payroll or payment.`,
        ...classifyCopilotCause({ recordedCauseText: load.settlementHoldReason }),
      });
      guidance.push({
        id: `rec-settle-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: "Canonical settlementHold",
        fact: `${load.loadId} has a load-level settlement hold flag.`,
        interpretation: "Settlement identity remains driver + week. Copilot does not calculate or change settlement.",
        recommendedAction: "Review settlement relevance",
        workflow: "Settlements",
        href: settlementsRelevanceHref(load.driverId, load.loadId),
        owner: "Settlement",
        derivedPriority: "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Dispatch or Settlement priority field.",
        executable: false,
      });
    }

    guidance.push({
      id: `rec-pi-${load.loadId}`,
      claimClass: "RECOMMENDATION",
      source: "Load File Process Intelligence anchor",
      fact: `Process Intelligence for ${load.loadId} stays on the Load File.`,
      interpretation: "Copilot does not invent operating events or a dispatch timeline.",
      recommendedAction: "Open Process Intelligence",
      workflow: "Process Intelligence",
      href: piHref(load.loadId),
      owner: "Load File",
      derivedPriority: "monitor",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Dispatch priority field.",
      executable: false,
    });

    if (load.assigned && load.driverId) {
      const eligibility = getDriverDispatchEligibility(args.data, load.driverId);
      facts.push({
        id: `fact-elig-${load.loadId}`,
        domain: "Driver dispatch eligibility",
        source: "getDriverDispatchEligibility",
        sourceClass: "AUTHORITATIVE",
        fact: `Driver ${load.driverId} eligibility ${eligibility.status}. ${eligibility.hardBlockers[0] || eligibility.label}`,
        ...classifyCopilotCause({ recordedCauseText: eligibility.hardBlockers[0] }),
      });
      if (eligibility.status === "blocked") {
        conflicts.push({
          id: `conflict-assign-elig-${load.loadId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical assignment", authority: "Dispatch operating state", statement: `${load.loadId} is assigned to ${load.driverId}.` },
            { name: "Driver dispatch eligibility", authority: "getDriverDispatchEligibility", statement: eligibility.hardBlockers[0] || eligibility.label },
          ],
          explanation: "Assignment and eligibility disagree. Copilot does not choose a winner, unassign, or invent a new status.",
          owner: "Dispatch / Driver compliance",
          resolutionLabel: "Review driver eligibility",
          href: eligibility.recommendedAction?.href || `/drivers/${encodeURIComponent(load.driverId)}`,
        });
      }
    }

    if (load.assigned && load.assetId) {
      const asset = equipment.find((row) => row.asset_id === load.assetId);
      if (asset) {
        facts.push({
          id: `fact-eq-${load.loadId}`,
          domain: "Equipment eligibility",
          source: "listMaintenanceAssetSummaries",
          sourceClass: "AUTHORITATIVE",
          fact: `Equipment ${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / OOS" : ""}.`,
          ...classifyCopilotCause({ recordedCauseText: asset.readiness_reason }),
        });
        if (asset.readiness === "Blocked" || asset.oos) {
          conflicts.push({
            id: `conflict-assign-eq-${load.loadId}`,
            claimClass: "AUTHORITATIVE_FACT",
            sources: [
              { name: "Canonical assignment", authority: "Dispatch operating state", statement: `${load.loadId} is assigned to equipment ${load.assetId}.` },
              { name: "Maintenance asset summary", authority: "listMaintenanceAssetSummaries", statement: `${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / OOS" : ""}.` },
            ],
            explanation: "The load assignment and equipment readiness labels disagree. Copilot does not release, unassign, or select replacement equipment.",
            owner: "Dispatch / Maintenance",
            resolutionLabel: "Review equipment",
            href: `/maintenance/${encodeURIComponent(asset.asset_id)}`,
          });
        }
      }
    }

    const safetyBlocks = (args.v3?.safetyEvents ?? []).filter(
      (event) =>
        event.dispatchBlock &&
        (loadKey(event.linkedLoadId) === loadKey(load.loadId) || (load.driverId && event.driverId === load.driverId)),
    );
    if (safetyBlocks.length > 0) {
      const event = safetyBlocks[0];
      facts.push({
        id: `fact-safety-block-${load.loadId}`,
        domain: "Safety dispatch impact",
        source: "Workbook Safety_Events.dispatchBlock",
        sourceClass: "AUTHORITATIVE",
        fact: `${event.eventId} records dispatchBlock=true for ${load.loadId}.`,
        ...classifyCopilotCause({ recordedCauseText: event.rootCause }),
      });
      if (load.releaseDisposition === "RELEASED") {
        conflicts.push({
          id: `conflict-safety-release-${load.loadId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Safety Event dispatchBlock", authority: "Workbook Safety_Events", statement: `${event.eventId} records dispatchBlock=true.` },
            { name: "Canonical release", authority: "Dispatch operating state", statement: `${load.loadId} releaseDisposition=RELEASED.` },
          ],
          explanation: "Safety records a dispatch block while canonical release is RELEASED. Copilot does not override either authority or release the load.",
          owner: "Safety / Dispatch",
          resolutionLabel: "Review Safety condition",
          href: event.driverId ? `/drivers/${encodeURIComponent(event.driverId)}/safety` : "/safety",
        });
      } else {
        guidance.push({
          id: `rec-safety-${load.loadId}`,
          claimClass: "RECOMMENDATION",
          source: `Safety Event ${event.eventId}`,
          fact: `${event.eventId} dispatchBlock=true`,
          interpretation: "Safety authority remains on the Safety Event. Copilot does not create or close safety records.",
          recommendedAction: "Review Safety condition",
          workflow: "Safety",
          href: event.driverId ? `/drivers/${encodeURIComponent(event.driverId)}/safety` : "/safety",
          owner: "Safety",
          derivedPriority: "hold_or_block",
          priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Dispatch priority field.",
          executable: false,
        });
      }
    }

    decisionSupport.push({
      id: `decision-${load.loadId}`,
      claimClass: "DERIVED_INTERPRETATION",
      text: load.needsAttention
        ? `${load.loadId}: options are review the recorded blocker on the Load File, review assignment eligibility if assigned, or open Safety/Settlement only when those flags are recorded. Copilot does not select or execute a path.`
        : `${load.loadId}: existing workflows remain Load File, assignment review, and Process Intelligence. Copilot does not choose among them.`,
      basedOnFactIds: [`fact-assign-${load.loadId}`, `fact-release-${load.loadId}`],
    });
  }

  const scopedGuidance = [...guidance]
    .sort((a, b) => {
      const order: Record<CopilotPriorityBand, number> = { hold_or_block: 0, review: 1, monitor: 2 };
      return order[a.derivedPriority] - order[b.derivedPriority];
    })
    .slice(0, LIST_CAP);

  const overview = conflicts.length
    ? `${conflicts.length} Dispatch source conflict(s) copied from existing authorities. Copilot does not resolve them or change assignment/release.`
    : scopedGuidance.length
      ? `${scopedGuidance.length} existing Dispatch workflow next action(s) are listed as recommendations. None assign, release, or mutate.`
      : "No Dispatch Copilot recommendation is manufactured without an existing workflow CTA.";

  return {
    domainLabel: "Dispatch Copilot Advocate",
    assignmentProtectionNote:
      "Copilot may recommend reviewing assignment. It does not assign, select, replace, or modify drivers or equipment.",
    triageNote:
      "Triage order below is Copilot-derived from canonical HOLD/REVIEW/RELEASED and recorded blockers. It is not a Dispatch severity, SLA, or risk score.",
    decisionSupport: decisionSupport.slice(0, LIST_CAP),
    permissionNote:
      "Dispatch Copilot reuses existing BOF operator-role checks and the (bof) Dispatch/Load File shell. It does not add a Copilot permission engine.",
    readOnlyNote:
      "Dispatch Copilot is read-only. Links navigate to existing workflows. Copilot does not assign, release, approve, resolve, or write records.",
    reasoningNote:
      "AUTHORITATIVE FACT is copied from canonical dispatch operating state, driver eligibility, equipment summaries, and Safety dispatchBlock. DERIVED INTERPRETATION and suggested order are Copilot reasoning, not new Dispatch state.",
    overview,
    overviewClass: conflicts.length || scopedGuidance.length ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts: facts.slice(0, LIST_CAP * 2),
    interpretations: interpretations.slice(0, LIST_CAP),
    conflicts: conflicts.slice(0, LIST_CAP),
    guidance: scopedGuidance,
    unsupported,
    crossWorkflow: [
      { relationship: "Dispatch ↔ Load File", note: "Canonical operating state is shared. Copilot does not duplicate it.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Driver", note: "Assignment is the load record. Eligibility is getDriverDispatchEligibility. Conflicts are surfaced, not resolved.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Equipment", note: "Equipment readiness is copied from maintenance asset summaries. Copilot does not select equipment.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Safety", note: "Only Safety Event dispatchBlock is treated as a Safety dispatch block.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Settlement", note: "Load settlementHold is relevance only. Copilot does not calculate pay or create holds.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Process Intelligence", note: "Persisted events remain load-scoped. Copilot does not synthesize history.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch ↔ Command Center", note: "Dispatch Command Center copies canonical records. Copilot is not a second Command Center engine.", relationshipClass: "NAVIGATIONAL" },
    ],
  };
}
