/**
 * Copilot Advocate consolidation observation.
 * Composes certified domain views. Does not create a registry, token engine, or new SOT.
 */

import type { BofData } from "@/lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { existingSettlementWorkflowHref } from "@/lib/load-file-proof-settlement-display";
import { listMaintenanceAssetSummaries } from "@/lib/maintenance-data";
import type { V3OperationalData } from "@/lib/v3-operational-types";
import { buildCustomerCopilotAdvocateView } from "@/lib/copilot/customer-copilot-advocate-display";
import { buildDispatchCopilotAdvocateView } from "@/lib/copilot/dispatch-copilot-advocate-display";
import { buildDriverCopilotAdvocateView } from "@/lib/copilot/driver-copilot-advocate-display";
import { buildEquipmentCopilotAdvocateView } from "@/lib/copilot/equipment-copilot-advocate-display";
import { buildLoadFileCopilotAdvocateView } from "@/lib/copilot/load-file-copilot-advocate-display";
import {
  classifyCopilotCause,
  type CopilotAdvocateView,
  type CopilotFact,
  type CopilotScope,
} from "@/lib/copilot/copilot-shared";

export function representativeConsolidationScope(data: BofData): CopilotScope {
  const l001 = data.loads.find((row) => row.id === "L001");
  if (l001) {
    return {
      loadId: l001.id,
      driverId: (l001 as { driverId?: string }).driverId ?? null,
      assetId: (l001 as { assetId?: string }).assetId ?? null,
    };
  }
  const load = data.loads[0];
  return {
    loadId: load?.id ?? null,
    driverId: load ? (load as { driverId?: string }).driverId ?? null : null,
    assetId: load ? (load as { assetId?: string }).assetId ?? null : null,
  };
}

export function buildCopilotAdvocateConsolidationView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const scope = args.scope && (args.scope.loadId || args.scope.driverId || args.scope.assetId)
    ? args.scope
    : representativeConsolidationScope(args.data);

  const dispatch = buildDispatchCopilotAdvocateView(args);
  const loadFile = buildLoadFileCopilotAdvocateView(args);
  const driver = buildDriverCopilotAdvocateView(args);
  const equipment = buildEquipmentCopilotAdvocateView(args);
  const customer = buildCustomerCopilotAdvocateView(args);

  const loadId = String(scope.loadId ?? "").trim();
  const state = loadId ? getCanonicalDispatchLoadState(args.data, loadId) : null;
  const asset = scope.assetId
    ? listMaintenanceAssetSummaries(args.data).find((row) => row.asset_id === scope.assetId)
    : null;

  const facts: CopilotFact[] = [];
  const pick = (view: CopilotAdvocateView, prefix: string, domain: string) => {
    const row = view.facts.find((item) => item.id.startsWith(prefix)) || view.facts[0];
    if (!row) return;
    facts.push({ ...row, id: `consol-${domain}-${row.id}`, domain: `${domain} · ${row.domain}` });
  };

  pick(dispatch, "fact-assign-", "Dispatch");
  pick(loadFile, "fact-proof-sum-", "Load File");
  pick(driver, "fact-elig-", "Driver");
  pick(equipment, "fact-ready-", "Equipment");
  pick(customer, "fact-customer-", "Customer");

  if (state?.settlementHold) {
    facts.push({
      id: "consol-fact-settlement-join",
      domain: "Settlement identity join",
      source: "existingSettlementWorkflowHref",
      sourceClass: "AUTHORITATIVE",
      fact: `${loadId} has load-level settlementHold; Copilot settlement navigation is ${existingSettlementWorkflowHref({ driverId: state.driverId, loadId })}. Load ID is not a Settlement ID.`,
      ...classifyCopilotCause({ recordedCauseText: state.settlementHoldReason }),
    });
  }

  const dispatchEqConflict = dispatch.conflicts.some((row) => row.id.startsWith("conflict-assign-eq-"));
  const equipmentOosConflict = equipment.conflicts.some((row) => row.id.startsWith("conflict-assign-oos-"));
  const conflicts = [];
  if (asset && (dispatchEqConflict !== equipmentOosConflict)) {
    conflicts.push({
      id: "consol-conflict-eq-dispatch-read-rule",
      claimClass: "AUTHORITATIVE_FACT" as const,
      sources: [
        {
          name: "Equipment Copilot",
          authority: "listMaintenanceAssetSummaries readiness string / oos",
          statement: equipmentOosConflict
            ? `${asset.asset_id} assignment vs Out of Service/Blocked/oos conflict is surfaced.`
            : `${asset.asset_id} Equipment Copilot did not surface an assignment conflict.`,
        },
        {
          name: "Dispatch Copilot",
          authority: "listMaintenanceAssetSummaries Blocked || oos boolean",
          statement: dispatchEqConflict
            ? `${loadId} assignment vs equipment Blocked/oos conflict is surfaced.`
            : `${loadId} Dispatch Copilot did not surface equipment Blocked/oos conflict (readiness=${asset.readiness}; oos=${String(asset.oos)}).`,
        },
      ],
      explanation:
        "Both Copilots copy the same maintenance summary without changing it. They use different recorded fields to decide whether a conflict card is shown. Copilot does not resolve the field difference or mark the unit Ready.",
      owner: "Dispatch / Equipment (certified domain read rules)",
      resolutionLabel: "Review equipment",
      href: `/maintenance/${encodeURIComponent(asset.asset_id)}`,
    });
  }

  return {
    domainLabel: "Copilot Advocate consolidation",
    permissionNote:
      "Consolidation reuses resolveCopilotAdvocateAccess and PORTAL_VISIBILITY.customer. It does not add a Copilot permission engine, certification registry, or Domain A–F runtime.",
    readOnlyNote:
      "Consolidation is read-only observation of certified domain Copilots. It does not write BOF state or execute workflows.",
    assignmentProtectionNote:
      "Consolidation does not assign, unassign, release, or override readiness, safety, or settlement.",
    triageNote:
      "Suggested order remains each domain Copilot's derived triage. Consolidation does not create a fleet SLA field.",
    reasoningNote:
      "Facts below are copied from certified Dispatch, Load File, Driver, Equipment, and Customer Copilot views. Settlement identity uses existingSettlementWorkflowHref. Safety remains workbook dispatchBlock when V3 is present; otherwise it is unsupported for this session.",
    overview: loadId
      ? `Observing certified Copilot domains on ${loadId} (driver ${scope.driverId || "none"}; equipment ${scope.assetId || "none"}). Command Center V4 workbook counts are not a second Copilot SOT.`
      : "No representative canonical load was available. Honest empty for consolidation scope.",
    overviewClass: loadId ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts,
    interpretations: [
      {
        id: "consol-interp-chain",
        claimClass: "DERIVED_INTERPRETATION",
        text: "Cross-domain conclusions are Copilot-derived from certified domain copies. They are not a new BOF system-of-record fact.",
        basedOnFactIds: facts.slice(0, 3).map((row) => row.id),
      },
    ],
    conflicts,
    guidance: [
      ...dispatch.guidance.slice(0, 1),
      ...loadFile.guidance.slice(0, 1),
      ...equipment.guidance.slice(0, 1),
      ...customer.guidance.filter((row) => row.id.startsWith("rec-shipment-")).slice(0, 1),
    ].map((row) => ({ ...row, id: `consol-${row.id}` })),
    decisionSupport: [
      {
        id: "consol-decision-cc",
        claimClass: "DERIVED_INTERPRETATION",
        text: "Command Center remains the existing operational observation surface (V4 risk queue + settlement summary). Consolidation Copilot observes BOF canonical copies beside it and does not replace Command Center.",
        basedOnFactIds: facts.slice(0, 1).map((row) => row.id),
      },
    ],
    unsupported: [
      "Prompt 008 Domains A–F, Certification Registry, and Certification Tokens are governance requirements. Equivalent runtime engines were not built and are not required to duplicate existing BOF auth, settlement, safety, or dispatch authorities.",
      "Safety Copilot / Settlement Copilot from 001–002 remain the existing Safety Event dispatchBlock copies and settlement-operating-display / existingSettlementWorkflowHref — not a second Advocate panel.",
      args.v3
        ? "V3 workbook is present for Safety dispatchBlock copies. Command Center V4 risk counts are still not a Copilot readiness engine."
        : "V3 workbook is not in this Copilot session. Safety dispatchBlock facts are unavailable (honest empty), not invented.",
      "Customer Copilot continues to withhold internal settlementHold, OOS, and assignability from the customer-visible view.",
    ],
    crossWorkflow: [
      { relationship: "Safety → Dispatch", note: "Only Safety Event dispatchBlock copied by Dispatch Copilot when V3 is present.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Safety → Driver", note: "Driver Copilot copies dispatchBlock / driver safety subroute; it does not score CSA.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Equipment → Dispatch", note: "Both copy listMaintenanceAssetSummaries; conflict cards may differ if oos boolean is false while readiness is Out of Service.", relationshipClass: "DERIVED" },
      { relationship: "Driver eligibility → Dispatch", note: "getDriverDispatchEligibility is shared; Copilot does not unassign.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Dispatch → Load File", note: "getCanonicalDispatchLoadState is shared.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Load File → Proof", note: "getLoadProofItems / evidence catalog remain Load File authority.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Proof → Settlement", note: "settlementHold is relevance; navigation is existingSettlementWorkflowHref.", relationshipClass: "AUTHORITATIVE" },
      { relationship: "Customer-visible → Customer Copilot", note: "Only customer-visible packet/status fields; internal holds are not copied.", relationshipClass: "AUTHORITATIVE" },
    ],
  };
}
