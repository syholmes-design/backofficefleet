/**
 * Driver Copilot Advocate — domain reasoning over existing Driver authorities.
 * Does not create eligibility, credential, DQF, settlement, or assignment engines.
 */

import type { BofData } from "@/lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { getDriverCredentialStatus } from "@/lib/driver-credential-status";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getDriverOperatingIssuePaths } from "@/lib/driver-operating-issue-path";
import { getDriverById, primaryAssignedTruck } from "@/lib/driver-queries";
import { existingSettlementWorkflowHref } from "@/lib/load-file-proof-settlement-display";
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

function idKey(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function driverHref(driverId: string): string {
  return `/drivers/${encodeURIComponent(driverId)}`;
}

function piHref(loadId: string): string {
  return `/loads/${encodeURIComponent(loadId)}#process-intelligence`;
}

function derivedPriority(status: "ready" | "needs_review" | "blocked"): CopilotPriorityBand {
  if (status === "blocked") return "hold_or_block";
  if (status === "needs_review") return "review";
  return "monitor";
}

function listDriverIds(data: BofData, scope?: CopilotScope): string[] {
  const scoped = idKey(scope?.driverId);
  if (scoped) return [scoped];

  const fromLoad = idKey(scope?.loadId);
  if (fromLoad) {
    const load = data.loads.find((row) => row.id === fromLoad);
    const driverId = idKey((load as { driverId?: string } | undefined)?.driverId);
    if (driverId) return [driverId];
  }

  const fromAsset = idKey(scope?.assetId);
  if (fromAsset) {
    const match = data.loads.find((row) => (row as { assetId?: string }).assetId === fromAsset);
    const driverId = idKey((match as { driverId?: string } | undefined)?.driverId);
    if (driverId) return [driverId];
  }

  return data.drivers.map((row) => row.id);
}

export function buildDriverCopilotAdvocateView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const scope = args.scope;
  const equipment = listMaintenanceAssetSummaries(args.data);
  const driverIds = listDriverIds(args.data, scope);

  const facts: CopilotFact[] = [];
  const interpretations: CopilotInterpretation[] = [];
  const conflicts: CopilotConflict[] = [];
  const guidance: CopilotGuidanceItem[] = [];
  const decisionSupport: CopilotInterpretation[] = [];
  const unsupported: string[] = [
    "Driver Copilot does not write driver files, vault documents, eligibility overrides, or acknowledgments.",
    "getDriverDispatchEligibility remains the dispatch readiness authority. Copilot does not create a second eligibility engine.",
    "Settlement identity remains driver + week via existingSettlementWorkflowHref. Copilot does not calculate pay.",
    "Assignment remains the canonical load record. Copilot does not assign or replace a driver.",
    "Process Intelligence stays load-scoped. Copilot does not synthesize a driver timeline.",
    "Live Prisma Driver / DriverDocument snapshots are not called here. Authenticated hub workflow remains on DriverDetailPageClient.",
  ];

  const scopedMissing = idKey(scope?.driverId);
  if (scopedMissing && !getDriverById(args.data, scopedMissing)) {
    unsupported.unshift(
      `No driver record exists for ${scopedMissing}. That is an honest empty, not READY, BLOCKED, or a credential status.`,
    );
  }

  for (const driverId of driverIds.slice(0, LIST_CAP * 2)) {
    const driver = getDriverById(args.data, driverId);
    if (!driver) continue;

    const eligibility = getDriverDispatchEligibility(args.data, driverId);
    const credentials = getDriverCredentialStatus(args.data, driverId);
    const issuePaths = getDriverOperatingIssuePaths(args.data, driverId);
    const assignedLoads = args.data.loads.filter((row) => (row as { driverId?: string }).driverId === driverId);
    const assignedState = assignedLoads
      .map((row) => getCanonicalDispatchLoadState(args.data, row.id))
      .find((row) => Boolean(row));
    const assetId = primaryAssignedTruck(args.data, driverId) || assignedState?.assetId;
    const priority = derivedPriority(eligibility.status);
    const recHref = eligibility.recommendedAction?.href || `${driverHref(driverId)}/vault`;
    const recLabel = eligibility.recommendedAction?.label || "Review driver file";

    facts.push({
      id: `fact-elig-${driverId}`,
      domain: "Driver dispatch eligibility",
      source: "getDriverDispatchEligibility",
      sourceClass: "AUTHORITATIVE",
      fact: `${driverId} eligibility ${eligibility.status}. ${eligibility.hardBlockers[0] || eligibility.label}`,
      ...classifyCopilotCause({ recordedCauseText: eligibility.hardBlockers[0] }),
    });
    facts.push({
      id: `fact-cred-${driverId}`,
      domain: "Driver credentials",
      source: "getDriverCredentialStatus",
      sourceClass: "AUTHORITATIVE",
      fact: `${driverId} CDL ${credentials.cdl.status}; medical ${credentials.medicalCard.status}; MVR ${credentials.mvr.status}; FMCSA ${credentials.fmcsa.status}.`,
      ...classifyCopilotCause({
        recordedCauseText:
          credentials.cdl.reason || credentials.medicalCard.reason || credentials.fmcsa.reason || credentials.mvr.reason,
      }),
    });

    const cdlMissingGate = eligibility.hardBlockers.find((row) => /CDL/i.test(row));
    if (cdlMissingGate && credentials.cdl.status === "valid") {
      conflicts.push({
        id: `conflict-cdl-${driverId}`,
        claimClass: "AUTHORITATIVE_FACT",
        sources: [
          { name: "Driver credentials", authority: "getDriverCredentialStatus", statement: `${driverId} CDL status=${credentials.cdl.status}.` },
          { name: "Driver dispatch eligibility", authority: "getDriverDispatchEligibility", statement: cdlMissingGate },
        ],
        explanation: "Credential resolver and eligibility disagree on CDL. Copilot does not choose a winner or mark the driver READY.",
        owner: "Driver compliance",
        resolutionLabel: "Review CDL on driver vault",
        href: `/drivers/${encodeURIComponent(driverId)}/vault`,
      });
    }

    const issue = issuePaths[0];
    if (issue) {
      facts.push({
        id: `fact-issue-${driverId}-${issue.id}`,
        domain: "Driver compliance / DQF path",
        source: "getDriverOperatingIssuePaths",
        sourceClass: "AUTHORITATIVE",
        fact: `${driverId} ${issue.recordName}: ${issue.problem}`,
        ...classifyCopilotCause({ recordedCauseText: issue.cause }),
      });
    }

    interpretations.push({
      id: `interp-elig-${driverId}`,
      claimClass: "DERIVED_INTERPRETATION",
      text:
        eligibility.status === "blocked"
          ? `${driverId} is blocked by existing eligibility hard gates. Copilot does not clear a gate or mark the driver READY.`
          : eligibility.status === "needs_review"
            ? `${driverId} needs review on existing eligibility soft warnings. Copilot does not create a review status.`
            : `${driverId} is READY on existing eligibility. Copilot does not certify a new ready-to-dispatch state.`,
      basedOnFactIds: [`fact-elig-${driverId}`],
    });

    guidance.push({
      id: `rec-elig-${driverId}`,
      claimClass: "RECOMMENDATION",
      source: "getDriverDispatchEligibility.recommendedAction",
      fact: eligibility.label,
      interpretation: "Open the existing eligibility next-action workflow. Copilot does not resolve the blocker.",
      recommendedAction: recLabel,
      workflow: "Driver vault / eligibility CTA",
      href: recHref,
      owner: "Driver compliance",
      derivedPriority: priority,
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
      executable: false,
    });

    if (issue?.actionHref) {
      guidance.push({
        id: `rec-issue-${driverId}`,
        claimClass: "RECOMMENDATION",
        source: "getDriverOperatingIssuePaths",
        fact: issue.problem,
        interpretation: "This is the existing operating issue path. Copilot does not upload documents or acknowledge gates.",
        recommendedAction: issue.actionLabel || issue.nextStep,
        workflow: "Driver vault / DQF",
        href: issue.actionHref,
        owner: issue.owner,
        derivedPriority: issue.status === "expiring_soon" ? "review" : "hold_or_block",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
        executable: false,
      });
    }

    const safetyBlocks = (args.v3?.safetyEvents ?? []).filter(
      (event) => event.driverId === driverId && event.dispatchBlock,
    );
    if (safetyBlocks.length > 0) {
      const event = safetyBlocks[0];
      facts.push({
        id: `fact-safety-${driverId}`,
        domain: "Driver safety restriction",
        source: "Workbook Safety_Events.dispatchBlock",
        sourceClass: "AUTHORITATIVE",
        fact: `${event.eventId} records dispatchBlock=true for ${driverId}.`,
        ...classifyCopilotCause({ recordedCauseText: event.rootCause }),
      });
      guidance.push({
        id: `rec-safety-${driverId}`,
        claimClass: "RECOMMENDATION",
        source: `Safety Event ${event.eventId}`,
        fact: `${event.eventId} dispatchBlock=true`,
        interpretation: "Safety authority remains on the Safety Event / driver safety file. Copilot does not close it.",
        recommendedAction: "Review Safety condition",
        workflow: "Driver safety",
        href: `${driverHref(driverId)}/safety`,
        owner: "Safety",
        derivedPriority: "hold_or_block",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
        executable: false,
      });
    } else {
      guidance.push({
        id: `rec-safety-file-${driverId}`,
        claimClass: "RECOMMENDATION",
        source: "Existing driver safety subroute",
        fact: `Driver safety file for ${driverId} remains on /drivers/${driverId}/safety.`,
        interpretation: "No workbook dispatchBlock is in Copilot session scope. Copilot does not invent a safety restriction.",
        recommendedAction: "Open driver safety file",
        workflow: "Driver safety",
        href: `${driverHref(driverId)}/safety`,
        owner: "Safety",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
        executable: false,
      });
    }

    guidance.push({
      id: `rec-settle-${driverId}`,
      claimClass: "RECOMMENDATION",
      source: "existingSettlementWorkflowHref",
      fact: `${driverId} settlement identity is driver-week payroll, not a Driver ID settlement page.`,
      interpretation: "Copilot does not calculate, approve, or export settlement.",
      recommendedAction: "Review settlement relevance",
      workflow: "Settlements",
      href: existingSettlementWorkflowHref({ driverId }),
      owner: "Settlement",
      derivedPriority: "review",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver or Settlement priority field.",
      executable: false,
    });

    if (assignedState) {
      facts.push({
        id: `fact-assign-${driverId}`,
        domain: "Driver ↔ Load assignment",
        source: `Canonical dispatch operating state ${assignedState.loadId}`,
        sourceClass: "AUTHORITATIVE",
        fact: `${driverId} is on canonical load ${assignedState.loadId}; releaseDisposition=${assignedState.releaseDisposition}.`,
        ...classifyCopilotCause({}),
      });
      if (eligibility.status === "blocked") {
        conflicts.push({
          id: `conflict-assign-elig-${driverId}`,
          claimClass: "AUTHORITATIVE_FACT",
          sources: [
            { name: "Canonical assignment", authority: "Dispatch/Load operating state", statement: `${assignedState.loadId} is assigned to ${driverId}.` },
            { name: "Driver dispatch eligibility", authority: "getDriverDispatchEligibility", statement: eligibility.hardBlockers[0] || eligibility.label },
          ],
          explanation: "Assignment and eligibility disagree. Copilot does not unassign the load or mark the driver READY.",
          owner: "Dispatch / Driver compliance",
          resolutionLabel: "Review driver eligibility",
          href: recHref,
        });
      }
      guidance.push({
        id: `rec-load-${driverId}`,
        claimClass: "RECOMMENDATION",
        source: `Canonical load ${assignedState.loadId}`,
        fact: `${driverId} is assigned on ${assignedState.loadId}.`,
        interpretation: "Open the existing Load File. Copilot does not change assignment.",
        recommendedAction: "Open assigned Load File",
        workflow: "Load File",
        href: `/loads/${encodeURIComponent(assignedState.loadId)}`,
        owner: "Load File",
        derivedPriority: assignedState.needsAttention ? "review" : "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
        executable: false,
      });
      guidance.push({
        id: `rec-pi-${driverId}`,
        claimClass: "RECOMMENDATION",
        source: "Load File Process Intelligence panel",
        fact: `Process Intelligence for assigned load ${assignedState.loadId} stays on the Load File.`,
        interpretation: "Copilot does not invent a driver-scoped PI engine.",
        recommendedAction: "Open Process Intelligence",
        workflow: "Process Intelligence",
        href: piHref(assignedState.loadId),
        owner: "Load File",
        derivedPriority: "monitor",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
        executable: false,
      });
    } else {
      unsupported.push(`${driverId} has no canonical assigned load in demo BofData. Copilot does not invent an assignment.`);
    }

    if (assetId) {
      const asset = equipment.find((row) => row.asset_id === assetId);
      if (asset) {
        facts.push({
          id: `fact-eq-${driverId}`,
          domain: "Driver ↔ Equipment",
          source: "listMaintenanceAssetSummaries / primaryAssignedTruck",
          sourceClass: "AUTHORITATIVE",
          fact: `${driverId} equipment ${asset.asset_id} readiness ${asset.readiness}${asset.oos ? " / OOS" : ""}.`,
          ...classifyCopilotCause({ recordedCauseText: asset.readiness_reason }),
        });
        guidance.push({
          id: `rec-eq-${driverId}`,
          claimClass: "RECOMMENDATION",
          source: "Maintenance asset summary",
          fact: `${asset.asset_id} readiness ${asset.readiness}`,
          interpretation: "Equipment readiness remains on Maintenance. Copilot does not select replacement equipment.",
          recommendedAction: "Review equipment",
          workflow: "Maintenance",
          href: `/maintenance/${encodeURIComponent(asset.asset_id)}`,
          owner: "Maintenance",
          derivedPriority: asset.readiness === "Blocked" || asset.oos ? "hold_or_block" : "monitor",
          priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
          executable: false,
        });
      }
    }

    guidance.push({
      id: `rec-cc-${driverId}`,
      claimClass: "RECOMMENDATION",
      source: "Command Center navigation",
      fact: `Command Center remains a separate operating surface from the driver file for ${driverId}.`,
      interpretation: "Copilot is not a second Command Center engine.",
      recommendedAction: "Open Command Center",
      workflow: "Command Center",
      href: "/command-center",
      owner: "Command Center",
      derivedPriority: "monitor",
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Driver priority field.",
      executable: false,
    });

    decisionSupport.push({
      id: `decision-${driverId}`,
      claimClass: "DERIVED_INTERPRETATION",
      text:
        eligibility.status === "blocked"
          ? `${driverId}: options are open the eligibility CTA (${recLabel}), review the driver safety file, or review settlement relevance. Copilot does not select or execute a path.`
          : `${driverId}: existing workflows remain vault/documents, safety file, assigned Load File, and settlements. Copilot does not choose among them.`,
      basedOnFactIds: [`fact-elig-${driverId}`, `fact-cred-${driverId}`],
    });
  }

  const ranked = [...guidance].sort((a, b) => {
    const order: Record<CopilotPriorityBand, number> = { hold_or_block: 0, review: 1, monitor: 2 };
    return order[a.derivedPriority] - order[b.derivedPriority];
  });
  const pinned = guidance.filter((row) => /^(rec-elig-|rec-issue-|rec-settle-|rec-safety-)/.test(row.id));
  const scopedGuidance = [...pinned, ...ranked.filter((row) => !pinned.some((item) => item.id === row.id))].slice(0, LIST_CAP);

  const overview = conflicts.length
    ? `${conflicts.length} Driver source conflict(s) copied from existing authorities. Copilot does not resolve them or change driver files.`
    : scopedGuidance.length
      ? `${scopedGuidance.length} existing Driver workflow next action(s) are listed as recommendations. None mutate credentials, eligibility, or assignment.`
      : "No Driver Copilot recommendation is manufactured without an existing workflow CTA.";

  return {
    domainLabel: "Driver Copilot Advocate",
    assignmentProtectionNote:
      "Copilot may recommend reviewing eligibility or assignment. It does not assign, unassign, or replace drivers.",
    triageNote:
      "Triage order below is Copilot-derived from existing eligibility blocked/needs_review/ready and recorded hard gates. It is not a Driver severity or SLA field.",
    decisionSupport: decisionSupport.slice(0, LIST_CAP),
    permissionNote:
      "Driver Copilot reuses existing BOF operator-role checks and the (bof) driver shell. It does not add a Copilot permission engine.",
    readOnlyNote:
      "Driver Copilot is read-only. Links navigate to existing workflows. Copilot does not write drivers, documents, safety, settlement, dispatch, loads, equipment, or PI events.",
    reasoningNote:
      "AUTHORITATIVE FACT is copied from getDriverDispatchEligibility, getDriverCredentialStatus, operating issue paths, canonical assignment, equipment summaries, and Safety dispatchBlock. Suggested order is Copilot reasoning, not new Driver state.",
    overview,
    overviewClass: conflicts.length || scopedGuidance.length ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts: facts.slice(0, LIST_CAP * 2),
    interpretations: interpretations.slice(0, LIST_CAP),
    conflicts: conflicts.slice(0, LIST_CAP),
    guidance: scopedGuidance,
    unsupported,
    crossWorkflow: [
      { relationship: "Driver ↔ Safety", note: "Safety subroute and workbook dispatchBlock are copied, not re-scored.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Driver ↔ Settlement", note: "existingSettlementWorkflowHref keeps driver-week identity.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Driver ↔ Dispatch", note: "Eligibility is getDriverDispatchEligibility. Assignment is the load record.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Driver ↔ Load", note: "Assigned loads remain canonical load records. Copilot does not create a driver load engine.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Driver ↔ Equipment", note: "Equipment is the assigned asset summary. Copilot does not select equipment.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Driver ↔ Process Intelligence", note: "PI remains load-scoped. Copilot links to the assigned Load File when one exists.", relationshipClass: "NAVIGATIONAL" },
      { relationship: "Driver ↔ Command Center", note: "Command Center is a separate surface. Copilot is not a second Command Center engine.", relationshipClass: "NAVIGATIONAL" },
    ],
  };
}
