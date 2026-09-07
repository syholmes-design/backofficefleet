/**
 * Equipment Copilot Advocate — domain reasoning over existing maintenance summaries.
 * Does not create readiness, MAR, work-order, assignment, or inspection engines.
 */

import type { BofData } from "@/lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { existingSettlementWorkflowHref } from "@/lib/load-file-proof-settlement-display";
import {
  getMaintenanceAssetSummary,
  listMaintenanceAssetSummaries,
  type MaintenanceAssetSummary,
} from "@/lib/maintenance-data";
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

function idKey(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function assetHref(assetId: string): string {
  return `/maintenance/${encodeURIComponent(assetId)}`;
}

function piHref(loadId: string): string {
  return `/loads/${encodeURIComponent(loadId)}#process-intelligence`;
}

function derivedPriority(summary: MaintenanceAssetSummary): CopilotPriorityBand {
  if (summary.readiness === "Out of Service" || summary.readiness === "Blocked" || summary.oos) {
    return "hold_or_block";
  }
  if (summary.readiness === "At Risk") return "review";
  return "monitor";
}

function listEquipment(data: BofData, scope?: CopilotScope): MaintenanceAssetSummary[] {
  const all = listMaintenanceAssetSummaries(data);
  const scopedAsset = idKey(scope?.assetId);
  if (scopedAsset) {
    const row = getMaintenanceAssetSummary(data, scopedAsset);
    return row ? [row] : [];
  }

  const scopedLoad = idKey(scope?.loadId);
  if (scopedLoad) {
    const load = data.loads.find((row) => row.id === scopedLoad);
    const assetId = idKey((load as { assetId?: string } | undefined)?.assetId);
    const row = assetId ? getMaintenanceAssetSummary(data, assetId) : null;
    return row ? [row] : [];
  }

  const scopedDriver = idKey(scope?.driverId);
  if (scopedDriver) {
    const load = data.loads.find((row) => (row as { driverId?: string }).driverId === scopedDriver);
    const assetId = idKey((load as { assetId?: string } | undefined)?.assetId);
    const row = assetId ? getMaintenanceAssetSummary(data, assetId) : null;
    return row ? [row] : [];
  }

  const attention = all.filter((row) => row.readiness !== "Ready" || row.oos || row.open_mar_count > 0);
  const ready = all.filter((row) => row.readiness === "Ready" && !row.oos);
  const merged = [...attention];
  for (const row of ready) {
    if (!merged.some((item) => item.asset_id === row.asset_id)) merged.push(row);
  }
  return merged;
}

export function buildEquipmentCopilotAdvocateView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const scope = args.scope;
  const assets = listEquipment(args.data, scope);

  const facts: CopilotFact[] = [];
  const interpretations: CopilotInterpretation[] = [];
  const conflicts: CopilotConflict[] = [];
  const guidance: CopilotGuidanceItem[] = [];
  const decisionSupport: CopilotInterpretation[] = [];
  const unsupported: string[] = [
    "Equipment Copilot does not write equipment, MAR, work orders, DVIR, or inspection completions.",
    "listMaintenanceAssetSummaries remains the Copilot equipment readiness authority, matching Dispatch / Load File / Driver Copilot. The V4 maintenance workbook is not a second Copilot readiness engine and is not called here.",
    "PM calendar and DVIR completions are not in BOF JSON. Copilot copies the existing placeholder labels and does not invent inspections.",
    "Assignment remains the canonical load record assetId. Copilot does not assign or replace equipment.",
    "Process Intelligence stays load-scoped. Copilot does not synthesize an equipment timeline.",
    "Settlement identity remains driver-week via existingSettlementWorkflowHref when an assigned driver exists. Copilot does not calculate pay from MAR amounts.",
  ];

  const scopedMissing = idKey(scope?.assetId);
  if (scopedMissing && !getMaintenanceAssetSummary(args.data, scopedMissing)) {
    unsupported.unshift(
      `No maintenance asset summary exists for ${scopedMissing}. That is an honest empty, not READY, BLOCKED, or OOS.`,
    );
  }

  for (const asset of assets.slice(0, LIST_CAP * 2)) {
    const priority = derivedPriority(asset);
    const assignedLoad = asset.associated_loads[0];
    const assignedState = assignedLoad ? getCanonicalDispatchLoadState(args.data, assignedLoad.id) : null;
    const driverId = assignedState?.driverId || (assignedLoad as { driverId?: string } | undefined)?.driverId;
    const mar = asset.mar_rows[0];

    facts.push({
      id: `fact-ready-${asset.asset_id}`,
      domain: "Equipment readiness",
      source: `listMaintenanceAssetSummaries ${asset.asset_id}`,
      sourceClass: "AUTHORITATIVE",
      fact: `${asset.asset_id} readiness ${asset.readiness}; assignability ${asset.assignability}; fleet_status ${asset.fleet_status}.`,
      ...classifyCopilotCause({ recordedCauseText: asset.readiness_reason }),
    });
    facts.push({
      id: `fact-pm-${asset.asset_id}`,
      domain: "Equipment PM / inspection labels",
      source: "listMaintenanceAssetSummaries pm_status_label / inspection_status_label",
      sourceClass: asset.inspection_status_label === "Not in BOF dataset" ? "UNSUPPORTED" : "DERIVED",
      fact: `${asset.asset_id} PM ${asset.pm_status_label}; inspection ${asset.inspection_status_label}. These are existing maintenance-summary labels, not a new inspection engine.`,
      ...classifyCopilotCause({}),
    });

    if (mar) {
      facts.push({
        id: `fact-mar-${asset.asset_id}`,
        domain: "Equipment MAR / maintenance exposure",
        source: `moneyAtRisk ${mar.id}`,
        sourceClass: "AUTHORITATIVE",
        fact: `${asset.asset_id} MAR ${mar.id} ${mar.category ?? ""} ${mar.status ?? ""}.`,
        ...classifyCopilotCause({ recordedCauseText: mar.rootCause }),
      });
    }

    interpretations.push({
      id: `interp-ready-${asset.asset_id}`,
      claimClass: "DERIVED_INTERPRETATION",
      text:
        asset.readiness === "Ready"
          ? `${asset.asset_id} is Ready on the existing maintenance summary. Copilot does not certify a new dispatchable state.`
          : `${asset.asset_id} is ${asset.readiness} on the existing maintenance summary. Copilot does not change fleet_status or clear OOS.`,
      basedOnFactIds: [`fact-ready-${asset.asset_id}`],
    });

    guidance.push({
      id: `rec-asset-${asset.asset_id}`,
      claimClass: "RECOMMENDATION",
      source: `Maintenance asset summary ${asset.asset_id}`,
      fact: `${asset.asset_id} readiness ${asset.readiness}`,
      interpretation: "Open the existing asset maintenance file. Copilot does not update readiness or work orders.",
      recommendedAction: "Review equipment",
      workflow: "Maintenance asset file",
      href: assetHref(asset.asset_id),
      owner: "Maintenance",
      derivedPriority: priority,
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
      executable: false,
    });

    if (asset.pm_status_label !== "No PM alert in moneyAtRisk" || asset.inspection_status_label === "Not in BOF dataset") {
      guidance.push({
        id: `rec-pm-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: "Existing PM / inspections maintenance route",
        fact: `${asset.asset_id} PM ${asset.pm_status_label}; inspection ${asset.inspection_status_label}.`,
        interpretation: "Open the existing PM/inspections surface. Copilot does not complete or schedule inspections.",
        recommendedAction: "Open PM / inspections",
        workflow: "Maintenance PM / inspections",
        href: "/maintenance/pm-inspections",
        owner: "Maintenance",
        derivedPriority: asset.readiness === "Ready" ? "monitor" : "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
    }

    if (mar) {
      guidance.push({
        id: `rec-mar-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: `moneyAtRisk ${mar.id}`,
        fact: `${mar.id} is recorded against ${asset.asset_id}.`,
        interpretation: "MAR remains on Money at Risk. Copilot does not create or close a MAR.",
        recommendedAction: "Review money at risk",
        workflow: "Money at risk",
        href: "/money-at-risk",
        owner: "Maintenance / Finance",
        derivedPriority: "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
    }

    if (assignedState && assignedLoad) {
      facts.push({
        id: `fact-assign-${asset.asset_id}`,
        domain: "Equipment ↔ Load assignment",
        source: `Canonical dispatch operating state ${assignedState.loadId}`,
        sourceClass: "AUTHORITATIVE",
        fact: `${asset.asset_id} is on canonical load ${assignedState.loadId}; releaseDisposition=${assignedState.releaseDisposition}.`,
        ...classifyCopilotCause({}),
      });
      if (asset.readiness === "Out of Service" || asset.readiness === "Blocked" || asset.oos) {
        conflicts.push({
          id: `conflict-assign-oos-${asset.asset_id}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical assignment", authority: "Dispatch/Load operating state", statement: `${assignedState.loadId} is assigned to equipment ${asset.asset_id}.` },
            { name: "Maintenance asset summary", authority: "listMaintenanceAssetSummaries", statement: `${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / oos=true" : ""}.` },
          ],
          explanation: "Assignment and equipment readiness disagree. Copilot does not unassign the load or mark the unit Ready.",
          owner: "Dispatch / Maintenance",
          resolutionLabel: "Review equipment",
          href: assetHref(asset.asset_id),
        });
      }
      guidance.push({
        id: `rec-load-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical load ${assignedState.loadId}`,
        fact: `${asset.asset_id} is assigned on ${assignedState.loadId}.`,
        interpretation: "Open the existing Load File. Copilot does not change assignment.",
        recommendedAction: "Open assigned Load File",
        workflow: "Load File",
        href: `/loads/${encodeURIComponent(assignedState.loadId)}`,
        owner: "Load File",
        derivedPriority: assignedState.needsAttention ? "review" : "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
      guidance.push({
        id: `rec-pi-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: "Load File Process Intelligence panel",
        fact: `Process Intelligence for assigned load ${assignedState.loadId} stays on the Load File.`,
        interpretation: "Copilot does not invent an equipment-scoped PI engine.",
        recommendedAction: "Open Process Intelligence",
        workflow: "Process Intelligence",
        href: piHref(assignedState.loadId),
        owner: "Load File",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
    } else {
      unsupported.push(`${asset.asset_id} has no associated canonical load in demo BofData. Copilot does not invent an assignment.`);
    }

    if (driverId) {
      facts.push({
        id: `fact-driver-${asset.asset_id}`,
        domain: "Equipment ↔ Driver",
        source: "Canonical load driverId",
        sourceClass: "AUTHORITATIVE",
        fact: `${asset.asset_id} assigned load records driver ${driverId}.`,
        ...classifyCopilotCause({}),
      });
      guidance.push({
        id: `rec-driver-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: "Canonical load driverId",
        fact: `Driver ${driverId} is on the assigned load for ${asset.asset_id}.`,
        interpretation: "Open the existing driver file. Copilot does not assign a driver.",
        recommendedAction: "Open assigned driver file",
        workflow: "Driver hub",
        href: `/drivers/${encodeURIComponent(driverId)}`,
        owner: "Driver",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
      guidance.push({
        id: `rec-settle-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: "existingSettlementWorkflowHref",
        fact: `Settlement identity for equipment ${asset.asset_id} is the assigned driver's week, not an equipment Settlement ID.`,
        interpretation: "Copilot does not calculate pay from MAR.",
        recommendedAction: "Review settlement relevance",
        workflow: "Settlements",
        href: existingSettlementWorkflowHref({ driverId, loadId: assignedState?.loadId }),
        owner: "Settlement",
        derivedPriority: "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment or Settlement priority field.",
        executable: false,
      });
    }

    const safetyBlocks = (args.v3?.safetyEvents ?? []).filter(
      (event) =>
        event.dispatchBlock &&
        ((driverId && event.driverId === driverId) ||
          (assignedState && event.linkedLoadId === assignedState.loadId)),
    );
    if (safetyBlocks.length > 0) {
      const event = safetyBlocks[0];
      facts.push({
        id: `fact-safety-${asset.asset_id}`,
        domain: "Equipment safety relevance",
        source: "Workbook Safety_Events.dispatchBlock",
        sourceClass: "AUTHORITATIVE",
        fact: `${event.eventId} records dispatchBlock=true related to ${asset.asset_id} via driver/load join.`,
        ...classifyCopilotCause({ recordedCauseText: event.rootCause }),
      });
      guidance.push({
        id: `rec-safety-${asset.asset_id}`,
        claimClass: "RECOMMENDATION",
        source: `Safety Event ${event.eventId}`,
        fact: `${event.eventId} dispatchBlock=true`,
        interpretation: "Safety is not an equipment-first authority. Copilot navigates the existing Safety file and does not close the event.",
        recommendedAction: "Review Safety condition",
        workflow: "Safety",
        href: event.driverId ? `/drivers/${encodeURIComponent(event.driverId)}/safety` : "/safety",
        owner: "Safety",
        derivedPriority: "hold_or_block",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
        executable: false,
      });
    }

    guidance.push({
      id: `rec-cc-${asset.asset_id}`,
      claimClass: "RECOMMENDATION",
      source: "Command Center navigation",
      fact: `Command Center remains a separate operating surface from the equipment file for ${asset.asset_id}.`,
      interpretation: "Copilot is not a second Command Center engine.",
      recommendedAction: "Open Command Center",
      workflow: "Command Center",
      href: "/command-center",
      owner: "Command Center",
      derivedPriority: "monitor",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not an Equipment priority field.",
      executable: false,
    });

    decisionSupport.push({
      id: `decision-${asset.asset_id}`,
      claimClass: "DERIVED_INTERPRETATION",
      text:
        priority === "hold_or_block"
          ? `${asset.asset_id}: options are review the maintenance asset file, review the assigned Load File if recorded, or review MAR/money-at-risk when a MAR row exists. Copilot does not select or execute a path.`
          : `${asset.asset_id}: existing workflows remain the asset file, PM/inspections surface, assigned Load File, and Command Center. Copilot does not choose among them.`,
      basedOnFactIds: [`fact-ready-${asset.asset_id}`],
    });
  }

  const ranked = [...guidance].sort((a, b) => {
    const order: Record<CopilotPriorityBand, number> = { hold_or_block: 0, review: 1, monitor: 2 };
    return order[a.derivedPriority] - order[b.derivedPriority];
  });
  const pinned = guidance.filter((row) => /^(rec-asset-|rec-mar-|rec-load-|rec-pm-)/.test(row.id));
  const scopedGuidance = [...pinned, ...ranked.filter((row) => !pinned.some((item) => item.id === row.id))].slice(0, LIST_CAP);

  const overview = conflicts.length
    ? `${conflicts.length} Equipment source conflict(s) copied from existing authorities. Copilot does not resolve them or change equipment state.`
    : scopedGuidance.length
      ? `${scopedGuidance.length} existing Equipment workflow next action(s) are listed as recommendations. None mutate readiness, MAR, or assignment.`
      : "No Equipment Copilot recommendation is manufactured without an existing workflow CTA.";

  return {
    domainLabel: "Equipment Copilot Advocate",
    assignmentProtectionNote:
      "Copilot may recommend reviewing equipment or assignment. It does not assign, unassign, or replace units.",
    triageNote:
      "Triage order below is Copilot-derived from existing Ready / At Risk / Blocked / Out of Service labels and recorded MAR/assignment. It is not an Equipment severity or SLA field.",
    decisionSupport: decisionSupport.slice(0, LIST_CAP),
    permissionNote:
      "Equipment Copilot reuses existing BOF operator-role checks and the (bof) maintenance shell. It does not add a Copilot permission engine.",
    readOnlyNote:
      "Equipment Copilot is read-only. Links navigate to existing workflows. Copilot does not write equipment, drivers, loads, safety, settlement, or PI events.",
    reasoningNote:
      "AUTHORITATIVE FACT is copied from listMaintenanceAssetSummaries, moneyAtRisk rows, and canonical load assignment. Inspection labels that are not in BOF JSON are marked UNSUPPORTED. Suggested order is Copilot reasoning, not new Equipment state.",
    overview,
    overviewClass: conflicts.length || scopedGuidance.length ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts: facts.slice(0, LIST_CAP * 2),
    interpretations: interpretations.slice(0, LIST_CAP),
    conflicts: conflicts.slice(0, LIST_CAP),
    guidance: scopedGuidance,
    unsupported,
    crossWorkflow: [
      { relationship: "Equipment ↔ Driver", note: "Driver is copied from the assigned load record. Copilot does not assign a driver.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Equipment ↔ Dispatch", note: "Readiness is the maintenance summary. Assignment is the canonical load assetId.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Equipment ↔ Load", note: "associated_loads / canonical operating state. Copilot does not create a load.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Equipment ↔ Safety", note: "Safety dispatchBlock is only used via existing driver/load join. Copilot does not invent equipment safety events.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Equipment ↔ Settlement", note: "Settlement remains driver-week when a driver is on the assigned load.", relationshipClass: "NAVIGATIONAL" },
      { relationship: "Equipment ↔ Process Intelligence", note: "PI remains load-scoped. Copilot links to the assigned Load File when one exists.", relationshipClass: "NAVIGATIONAL" },
      { relationship: "Equipment ↔ Command Center", note: "Command Center is a separate surface. Copilot is not a second Command Center engine.", relationshipClass: "NAVIGATIONAL" },
    ],
  };
}
