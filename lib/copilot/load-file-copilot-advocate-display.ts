/**
 * Load File Copilot Advocate — domain reasoning over existing Load File authorities.
 * Does not create readiness, proof, settlement, authorization, or workflow engines.
 */

import type { BofData } from "@/lib/load-bof-data";
import { normalizeCanonicalLoadId } from "@/lib/canonical-load-stories";
import { getCanonicalLoadEvidenceForLoad } from "@/lib/canonical-load-evidence";
import {
  getCanonicalDispatchLoadState,
  listCanonicalDispatchAttentionStates,
  type CanonicalDispatchLoadState,
} from "@/lib/dispatch/canonical-dispatch-operating-state";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { existingSettlementWorkflowHref } from "@/lib/load-file-proof-settlement-display";
import { getLoadProofItems, getLoadProofSummary, type LoadProofItem } from "@/lib/load-proof";
import { equipmentConflictsWithCanonicalAssignment, listMaintenanceAssetSummaries } from "@/lib/maintenance-data";
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

function loadHref(loadId: string): string {
  return `/loads/${encodeURIComponent(loadId)}`;
}

function loadFileCopilotHref(loadId: string): string {
  return `${loadHref(loadId)}#load-file-copilot-advocate`;
}

function piHref(loadId: string): string {
  return `${loadHref(loadId)}#process-intelligence`;
}

function assignHref(loadId: string): string {
  return `/dispatch?view=assign&loadId=${encodeURIComponent(loadId)}`;
}

function derivedPriority(state: CanonicalDispatchLoadState, proofBlocking: number): CopilotPriorityBand {
  if (state.releaseDisposition === "HOLD" || state.blockers.some((row) => row.impact === "HOLD") || proofBlocking > 0) {
    return "hold_or_block";
  }
  if (state.needsAttention || state.releaseDisposition === "REVIEW") return "review";
  return "monitor";
}

function blockingProofItems(items: LoadProofItem[]): LoadProofItem[] {
  return items.filter(
    (item) =>
      item.blocksPayment ||
      item.status === "Missing" ||
      item.status === "Disputed" ||
      (item.status === "Pending" && item.blocksPayment),
  );
}

function recordedCustomerName(data: BofData, loadId: string): string {
  const load = data.loads.find((row) => loadKey(row.id) === loadKey(loadId) || row.id === loadId);
  const name = typeof (load as { customerName?: unknown } | undefined)?.customerName === "string"
    ? String((load as { customerName?: string }).customerName).trim()
    : "";
  return name;
}

function listLoadFileStates(data: BofData, scope?: CopilotScope): CanonicalDispatchLoadState[] {
  const all = data.loads
    .map((load) => getCanonicalDispatchLoadState(data, load.id))
    .filter((row): row is CanonicalDispatchLoadState => Boolean(row))
    .filter((row) => inScope(scope, { loadId: row.loadId, driverId: row.driverId, assetId: row.assetId }));

  if (scope?.loadId || scope?.driverId || scope?.assetId) return all;

  const attention = listCanonicalDispatchAttentionStates(data);
  const proofAttention = all.filter((row) => row.proofBlocking > 0 || row.settlementHold);
  const merged = [...attention];
  for (const row of proofAttention) {
    if (!merged.some((item) => item.loadId === row.loadId)) merged.push(row);
  }
  return merged;
}

export function buildLoadFileCopilotAdvocateView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const scope = args.scope;
  const equipment = listMaintenanceAssetSummaries(args.data);
  const states = listLoadFileStates(args.data, scope);

  const facts: CopilotFact[] = [];
  const interpretations: CopilotInterpretation[] = [];
  const conflicts: CopilotConflict[] = [];
  const guidance: CopilotGuidanceItem[] = [];
  const decisionSupport: CopilotInterpretation[] = [];
  const unsupported: string[] = [
    "Load File Copilot does not write loads, proof packets, trip release, or Process Intelligence events.",
    "getLoadProofItems is the existing Load File proof presentation. Copilot does not invent proof lines or mark proof complete as a new status.",
    "Settlement identity remains driver + week via existingSettlementWorkflowHref. Load ID is not treated as a Settlement ID.",
    "Load File Copilot does not calculate revenue, pay, invoice, or factoring amounts.",
    "Process Intelligence stays on the Load File panel. Copilot does not fetch or synthesize PI event history.",
    "Live Prisma load workflow snapshots are not called here. Authenticated Load File workflow remains on LoadDetailContent.",
  ];

  if (scope?.loadId && !getCanonicalDispatchLoadState(args.data, scope.loadId) && states.length === 0) {
    unsupported.unshift(
      `No canonical Load File operating state exists for load ${scope.loadId}. That is an honest empty, not READY, RELEASED, or proof-complete.`,
    );
  }

  for (const load of states.slice(0, LIST_CAP * 2)) {
    const proofItems = getLoadProofItems(args.data, load.loadId);
    const proofSummary = getLoadProofSummary(proofItems);
    const blockingProof = blockingProofItems(proofItems);
    const evidence = getCanonicalLoadEvidenceForLoad(args.data, load.loadId);
    const missingEvidence = evidence.filter((row) => row.status === "missing");
    const customerName = recordedCustomerName(args.data, load.loadId);
    const priority = derivedPriority(load, proofSummary.blockingCount);

    facts.push({
      id: `fact-ready-${load.loadId}`,
      domain: "Load File readiness / release",
      source: `Canonical dispatch operating state ${load.loadId}`,
      sourceClass: "AUTHORITATIVE",
      fact: `${load.loadId} releaseDisposition=${load.releaseDisposition}. ${load.releaseSummary}`,
      ...classifyCopilotCause({}),
    });
    facts.push({
      id: `fact-proof-sum-${load.loadId}`,
      domain: "Load File proof",
      source: "Canonical operating state proofLabel / getLoadProofSummary",
      sourceClass: "DERIVED",
      fact: `${load.loadId} proof ${load.proofLabel}. blockingCount=${proofSummary.blockingCount}. Copilot copies the existing proof summary; it does not certify proof.`,
      ...classifyCopilotCause({}),
    });

    const blocker = load.blockers[0];
    if (blocker) {
      facts.push({
        id: `fact-blocker-${load.loadId}-${blocker.id}`,
        domain: "Load File blocker",
        source: `Canonical blocker ${blocker.id} (${blocker.source})`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} blocker: ${blocker.label}. Owner ${blocker.owner}.`,
        ...classifyCopilotCause({ recordedCauseText: blocker.detail }),
      });
      interpretations.push({
        id: `interp-blocker-${load.loadId}`,
        claimClass: "DERIVED_INTERPRETATION",
        text: `${load.loadId} has a recorded canonical blocker. Copilot does not create, clear, or re-score the blocker.`,
        basedOnFactIds: [`fact-blocker-${load.loadId}-${blocker.id}`],
      });
      guidance.push({
        id: `rec-blocker-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical blocker ${blocker.id}`,
        fact: blocker.label,
        interpretation: "Open the existing Load File blocker / next-action workflow. Copilot does not execute it.",
        recommendedAction: blocker.nextAction || load.nextAction,
        workflow: "Load File",
        href: loadHref(load.loadId),
        owner: blocker.owner,
        derivedPriority: priority,
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
        executable: false,
      });
    } else {
      interpretations.push({
        id: `interp-next-${load.loadId}`,
        claimClass: "DERIVED_INTERPRETATION",
        text: `${load.loadId} canonical nextAction is copied as guidance only: ${load.nextAction}`,
        basedOnFactIds: [`fact-ready-${load.loadId}`],
      });
      guidance.push({
        id: `rec-next-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical nextAction ${load.loadId}`,
        fact: load.nextAction,
        interpretation: "This is the existing Load File next action. Copilot does not invent a workflow step.",
        recommendedAction: load.nextAction,
        workflow: "Load File",
        href: loadFileCopilotHref(load.loadId),
        owner: load.exceptionOwner || "Load File",
        derivedPriority: priority,
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
        executable: false,
      });
    }

    const proofLine = blockingProof[0];
    if (proofLine) {
      facts.push({
        id: `fact-proof-line-${load.loadId}`,
        domain: "Load File proof line",
        source: "getLoadProofItems",
        sourceClass: "DERIVED",
        fact: `${load.loadId} proof ${proofLine.type} status=${proofLine.status}${proofLine.blocksPayment ? " blocksPayment=true" : ""}.`,
        ...classifyCopilotCause({ recordedCauseText: proofLine.notes || proofLine.riskNote }),
      });
      if (load.releaseDisposition === "RELEASED") {
        conflicts.push({
          id: `conflict-proof-release-${load.loadId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical release", authority: "Dispatch/Load File operating state", statement: `${load.loadId} releaseDisposition=RELEASED.` },
            { name: "Load File proof presentation", authority: "getLoadProofItems", statement: `${proofLine.type} status=${proofLine.status}.` },
          ],
          explanation: "Canonical release and the existing proof presentation disagree. Copilot does not override either source or mark proof complete.",
          owner: "Load File / Dispatch",
          resolutionLabel: "Review Load File proof",
          href: loadHref(load.loadId),
        });
      } else {
        guidance.push({
          id: `rec-proof-${load.loadId}`,
          claimClass: "RECOMMENDATION",
          source: "getLoadProofItems",
          fact: `${proofLine.type} ${proofLine.status}`,
          interpretation: "Proof remains on the Load File proof presentation. Copilot does not upload or clear proof.",
          recommendedAction: proofLine.rfAction || "Review Load File proof",
          workflow: "Load File proof",
          href: loadHref(load.loadId),
          owner: "Load File",
          derivedPriority: proofLine.blocksPayment ? "hold_or_block" : "review",
          priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
          executable: false,
        });
      }
    }

    if (missingEvidence.length > 0) {
      facts.push({
        id: `fact-evidence-${load.loadId}`,
        domain: "Load File evidence catalog",
        source: "getCanonicalLoadEvidenceForLoad",
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} canonical evidence catalog has ${missingEvidence.length} missing item(s); first ${missingEvidence[0].title}.`,
        ...classifyCopilotCause({ recordedCauseText: missingEvidence[0].reason }),
      });
    }

    if (customerName) {
      facts.push({
        id: `fact-customer-${load.loadId}`,
        domain: "Load File customer",
        source: `Canonical load record ${load.loadId}`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} recorded customerName=${customerName}.`,
        ...classifyCopilotCause({}),
      });
      guidance.push({
        id: `rec-customer-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: "Canonical load customerName",
        fact: `Customer name is recorded on ${load.loadId}.`,
        interpretation: "Copilot does not join a customer master or invent a customer file. Navigation is to the existing customer portal.",
        recommendedAction: "Open customer portal",
        workflow: "Customer portal",
        href: "/customer-portal",
        owner: "Customer",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
        executable: false,
      });
    } else {
      unsupported.push(`${load.loadId} has no recorded customerName. Copilot does not invent a customer.`);
    }

    if (load.settlementHold) {
      facts.push({
        id: `fact-settle-${load.loadId}`,
        domain: "Load File settlement relevance",
        source: `Canonical load ${load.loadId} settlementHold`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.loadId} settlementHold=true${load.settlementHoldReason ? `: ${load.settlementHoldReason}` : ""}. This is not a payroll Settlement ID.`,
        ...classifyCopilotCause({ recordedCauseText: load.settlementHoldReason }),
      });
      if (load.releaseDisposition === "RELEASED") {
        conflicts.push({
          id: `conflict-settle-release-${load.loadId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical release", authority: "Dispatch/Load File operating state", statement: `${load.loadId} releaseDisposition=RELEASED.` },
            { name: "Load settlementHold", authority: "Canonical load record", statement: `${load.loadId} settlementHold=true.` },
          ],
          explanation: "Release disposition and load-level settlement hold disagree. Copilot does not calculate pay or clear the hold.",
          owner: "Load File / Settlement",
          resolutionLabel: "Review settlement relevance",
          href: existingSettlementWorkflowHref({ driverId: load.driverId, loadId: load.loadId }),
        });
      } else {
        guidance.push({
          id: `rec-settle-${load.loadId}`,
          claimClass: "RECOMMENDATION",
          source: "Canonical settlementHold",
          fact: `${load.loadId} has a load-level settlement hold flag.`,
          interpretation: "Open the existing driver-week settlements workflow. Copilot does not treat Load ID as Settlement ID.",
          recommendedAction: "Review settlement relevance",
          workflow: "Settlements",
          href: existingSettlementWorkflowHref({ driverId: load.driverId, loadId: load.loadId }),
          owner: "Settlement",
          derivedPriority: "review",
          priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File or Settlement priority field.",
          executable: false,
        });
      }
    }

    guidance.push({
      id: `rec-pi-${load.loadId}`,
      claimClass: "RECOMMENDATION",
      source: "Load File Process Intelligence panel",
      fact: `Process Intelligence for ${load.loadId} stays on the Load File.`,
      interpretation: "Copilot does not invent operating events or a load timeline.",
      recommendedAction: "Open Process Intelligence",
      workflow: "Process Intelligence",
      href: piHref(load.loadId),
      owner: "Load File",
      derivedPriority: "monitor",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
      executable: false,
    });

    if (load.pretripOverall === "BLOCKED") {
      guidance.push({
        id: `rec-pretrip-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: "Canonical pretripOverall",
        fact: `${load.loadId} pretripOverall=BLOCKED.`,
        interpretation: "Open the existing pre-trip tablet. Copilot does not inspect or clear pre-trip.",
        recommendedAction: "Open pre-trip tablet",
        workflow: "Pre-trip",
        href: `/pretrip/${encodeURIComponent(load.loadId)}`,
        owner: "Load File",
        derivedPriority: "hold_or_block",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
        executable: false,
      });
    }

    if (load.assigned && load.driverId) {
      const eligibility = getDriverDispatchEligibility(args.data, load.driverId);
      facts.push({
        id: `fact-elig-${load.loadId}`,
        domain: "Load File driver eligibility",
        source: "getDriverDispatchEligibility",
        sourceClass: "AUTHORITATIVE",
        fact: `Assigned driver ${load.driverId} eligibility ${eligibility.status}. ${eligibility.hardBlockers[0] || eligibility.label}`,
        ...classifyCopilotCause({ recordedCauseText: eligibility.hardBlockers[0] }),
      });
      if (eligibility.status === "blocked") {
        conflicts.push({
          id: `conflict-assign-elig-${load.loadId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical assignment", authority: "Load/Dispatch operating state", statement: `${load.loadId} is assigned to ${load.driverId}.` },
            { name: "Driver dispatch eligibility", authority: "getDriverDispatchEligibility", statement: eligibility.hardBlockers[0] || eligibility.label },
          ],
          explanation: "The Load File assignment and driver eligibility disagree. Copilot does not unassign or replace the driver.",
          owner: "Load File / Driver compliance",
          resolutionLabel: "Review driver eligibility",
          href: eligibility.recommendedAction?.href || `/drivers/${encodeURIComponent(load.driverId)}`,
        });
      }
    } else {
      guidance.push({
        id: `rec-assign-${load.loadId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical assignment ${load.loadId}`,
        fact: `${load.loadId} has no driver on the canonical load record.`,
        interpretation: "Review the existing Dispatch assignment workflow. Copilot does not assign a driver.",
        recommendedAction: "Review driver assignment",
        workflow: "Dispatch assignment",
        href: assignHref(load.loadId),
        owner: "Dispatch",
        derivedPriority: "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
        executable: false,
      });
    }

    if (load.assigned && load.assetId) {
      const asset = equipment.find((row) => row.asset_id === load.assetId);
      if (asset) {
        facts.push({
          id: `fact-eq-${load.loadId}`,
          domain: "Load File equipment",
          source: "listMaintenanceAssetSummaries",
          sourceClass: "AUTHORITATIVE",
          fact: `Equipment ${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / OOS" : ""}.`,
          ...classifyCopilotCause({ recordedCauseText: asset.readiness_reason }),
        });
        if (equipmentConflictsWithCanonicalAssignment(asset)) {
          conflicts.push({
            id: `conflict-assign-eq-${load.loadId}`,
            claimClass: "AUTHORITATIVE_FACT",
            sources: [
              { name: "Canonical assignment", authority: "Load/Dispatch operating state", statement: `${load.loadId} is assigned to equipment ${load.assetId}.` },
              { name: "Maintenance asset summary", authority: "listMaintenanceAssetSummaries", statement: `${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / OOS" : ""}.` },
            ],
            explanation: "The Load File assignment and equipment readiness labels disagree. Copilot does not unassign or select replacement equipment.",
            owner: "Load File / Maintenance",
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
        domain: "Load File safety impact",
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
            { name: "Canonical release", authority: "Load/Dispatch operating state", statement: `${load.loadId} releaseDisposition=RELEASED.` },
          ],
          explanation: "Safety records a dispatch block while canonical release is RELEASED. Copilot does not override either authority.",
          owner: "Safety / Load File",
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
          priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
          executable: false,
        });
      }
    }

    guidance.push({
      id: `rec-cc-${load.loadId}`,
      claimClass: "RECOMMENDATION",
      source: "Command Center navigation",
      fact: `Command Center remains a separate operating surface from the Load File for ${load.loadId}.`,
      interpretation: "Copilot is not a second Command Center engine.",
      recommendedAction: "Open Command Center",
      workflow: "Command Center",
      href: "/command-center",
      owner: "Command Center",
      derivedPriority: "monitor",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Load File priority field.",
      executable: false,
    });

    decisionSupport.push({
      id: `decision-${load.loadId}`,
      claimClass: "DERIVED_INTERPRETATION",
      text: load.needsAttention || proofSummary.blockingCount > 0
        ? `${load.loadId}: options are review the recorded blocker, review proof presentation, open Process Intelligence, or open Settlement only when settlementHold is recorded. Copilot does not select or execute a path.`
        : `${load.loadId}: existing workflows remain Load File proof, Dispatch assignment review, Process Intelligence, and Command Center. Copilot does not choose among them.`,
      basedOnFactIds: [`fact-ready-${load.loadId}`, `fact-proof-sum-${load.loadId}`],
    });
  }

  const ranked = [...guidance].sort((a, b) => {
    const order: Record<CopilotPriorityBand, number> = { hold_or_block: 0, review: 1, monitor: 2 };
    return order[a.derivedPriority] - order[b.derivedPriority];
  });
  const pinned = guidance.filter((row) => /^(rec-blocker-|rec-proof-|rec-settle-|rec-pi-)/.test(row.id));
  const scopedGuidance = [...pinned, ...ranked.filter((row) => !pinned.some((item) => item.id === row.id))].slice(0, LIST_CAP);

  const overview = conflicts.length
    ? `${conflicts.length} Load File source conflict(s) copied from existing authorities. Copilot does not resolve them or change Load File state.`
    : scopedGuidance.length
      ? `${scopedGuidance.length} existing Load File workflow next action(s) are listed as recommendations. None mutate proof, release, or settlement.`
      : "No Load File Copilot recommendation is manufactured without an existing workflow CTA.";

  return {
    domainLabel: "Load File Copilot Advocate",
    assignmentProtectionNote:
      "Copilot may recommend reviewing assignment, proof, or settlement relevance. It does not assign, release, upload proof, or change settlement.",
    triageNote:
      "Triage order below is Copilot-derived from canonical HOLD/REVIEW/RELEASED, recorded blockers, and existing proof blocking counts. It is not a Load File severity or SLA field.",
    decisionSupport: decisionSupport.slice(0, LIST_CAP),
    permissionNote:
      "Load File Copilot reuses existing BOF operator-role checks and the (bof) Load File shell. It does not add a Copilot permission engine.",
    readOnlyNote:
      "Load File Copilot is read-only. Links navigate to existing workflows. Copilot does not write loads, proof, dispatch, safety, settlement, drivers, equipment, or PI events.",
    reasoningNote:
      "AUTHORITATIVE FACT is copied from canonical Load File/Dispatch operating state, evidence catalog, driver eligibility, equipment summaries, and Safety dispatchBlock. Proof line status is DERIVED from getLoadProofItems. Suggested order is Copilot reasoning, not new Load File state.",
    overview,
    overviewClass: conflicts.length || scopedGuidance.length ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts: facts.slice(0, LIST_CAP * 2),
    interpretations: interpretations.slice(0, LIST_CAP),
    conflicts: conflicts.slice(0, LIST_CAP),
    guidance: scopedGuidance,
    unsupported,
    crossWorkflow: [
      { relationship: "Load ↔ Dispatch", note: "Canonical operating state is shared. Copilot does not duplicate Dispatch Copilot or assignment engines.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Safety", note: "Only Safety Event dispatchBlock is treated as a Safety load block.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Settlement", note: "Load settlementHold is relevance only. existingSettlementWorkflowHref keeps driver-week identity.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Driver", note: "Assignment is the load record. Eligibility is getDriverDispatchEligibility. Conflicts are surfaced, not resolved.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Equipment", note: "Equipment readiness is copied from maintenance asset summaries.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Customer", note: "Only recorded customerName is copied. Customer portal is navigational.", relationshipClass: "NAVIGATIONAL" },
      { relationship: "Load ↔ Process Intelligence", note: "Persisted events remain on the Load File PI panel. Copilot does not synthesize history.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load ↔ Command Center", note: "Command Center is a separate surface. Copilot is not a second Command Center engine.", relationshipClass: "NAVIGATIONAL" },
    ],
  };
}
