import type { BofData } from "@/lib/load-bof-data";
import type {
  BofRequiredEntityKey,
  BofTemplateDefinition,
  BofTemplateUsageSurface,
} from "@/lib/bof-template-system";
import { getLoadProofItems, proofBlockingCount } from "@/lib/load-proof";
import {
  type BofLoadRfidReadiness,
  type BofRfidTemplateGate,
  buildBofLoadRfidReadiness,
  mergeBofRfidReadiness,
  resolveRfidTemplateGate,
  rfidHintsForTemplateRow,
} from "@/lib/bof-rfid-readiness";

export type TemplateUsageSurfaceContext = BofTemplateUsageSurface;

export type SettlementLoadLinkage =
  | "not_applicable"
  | "none"
  | "lines_explicit"
  | "driver_single_inferred"
  | "driver_multi_merged";

export type TemplateRowPrimaryState =
  | "final_available"
  | "draft_exists"
  | "missing_context"
  | "context_inferred"
  | "ready_to_generate";

export type TemplateWorkflowRole =
  | "required_before_release"
  | "required_before_billing"
  | "required_for_claim_packet"
  | "linked_proof_support"
  | "workflow_document"
  | "optional_reference";

export type ResolvedTemplateEntityContext = {
  loadId: string | null;
  driverId: string | null;
  settlementId: string | null;
  claimId: string | null;
  customerId: string | null;
  facilityId: string | null;
  billingPacketId: string | null;
  linkedLoadIds: string[];
  settlementLoadLinkage: SettlementLoadLinkage;
  settlementLinkageNote: string | null;
  missingContext: string[];
  presentContext: string[];
};

function rawSettlementById(data: BofData, settlementId: string) {
  if (!("settlements" in data) || !Array.isArray(data.settlements)) return null;
  return (
    data.settlements.find(
      (s) => (s as { settlementId?: string }).settlementId === settlementId
    ) ?? null
  );
}

function sortedDriverLoadIds(data: BofData, driverId: string): string[] {
  return data.loads
    .filter((l) => l.driverId === driverId)
    .map((l) => l.id)
    .sort();
}

function resolveLoadScopedContext(
  data: BofData,
  entityId: string,
  context: TemplateUsageSurfaceContext
): ResolvedTemplateEntityContext {
  const missing: string[] = [];
  const present: string[] = [];
  const load = data.loads.find((l) => l.id === entityId);

  if (!load) {
    missing.push("No load row for this entityId in BOF demo data");
    return {
      loadId: null,
      driverId: null,
      settlementId: null,
      claimId: context === "claims_insurance" ? entityId : null,
      customerId: null,
      facilityId: null,
      billingPacketId: null,
      linkedLoadIds: [],
      settlementLoadLinkage: "not_applicable",
      settlementLinkageNote: null,
      missingContext: missing,
      presentContext: present,
    };
  }

  present.push(`Load ${load.number} (${load.id})`);
  if (load.driverId) present.push(`Driver ${load.driverId}`);
  else missing.push("No driverId on load");
  if (load.origin) present.push("Route / origin context");

  const customerId = (load as { customerId?: string; shipperId?: string }).customerId ??
    (load as { customerId?: string; shipperId?: string }).shipperId ??
    null;
  const facilityId =
    (load as { originFacilityId?: string; facilityId?: string }).originFacilityId ??
    (load as { originFacilityId?: string; facilityId?: string }).facilityId ??
    null;
  if (customerId) present.push(`Customer ${customerId}`);
  if (facilityId) present.push(`Facility ${facilityId}`);

  return {
    loadId: load.id,
    driverId: load.driverId ?? null,
    settlementId: null,
    claimId: context === "claims_insurance" ? load.id : null,
    customerId,
    facilityId,
    billingPacketId: context === "settlement_billing" ? entityId : null,
    linkedLoadIds: [load.id],
    settlementLoadLinkage: "not_applicable",
    settlementLinkageNote: null,
    missingContext: missing,
    presentContext: present,
  };
}

export function resolveTemplateEntityContext(
  data: BofData,
  context: TemplateUsageSurfaceContext,
  entityId: string,
  linkedLoadIdsFromParent?: string[]
): ResolvedTemplateEntityContext {
  if (context === "dispatch_load" || context === "claims_insurance" || context === "load_intake") {
    return resolveLoadScopedContext(data, entityId, context);
  }

  if (context === "vault_documents") {
    const drv = data.drivers.find((d) => d.id === entityId);
    const present: string[] = [];
    const missing: string[] = [];
    if (drv) present.push(`Driver ${drv.id}`);
    else missing.push("No driver row for this entityId in BOF demo data");
    return {
      loadId: null,
      driverId: drv?.id ?? null,
      settlementId: null,
      claimId: null,
      customerId: null,
      facilityId: null,
      billingPacketId: null,
      linkedLoadIds: [],
      settlementLoadLinkage: "not_applicable",
      settlementLinkageNote: null,
      missingContext: missing,
      presentContext: present,
    };
  }

  const missing: string[] = [];
  const present: string[] = [];
  const settlementId = entityId;
  const raw = rawSettlementById(data, settlementId);
  const driverId = raw ? (raw as { driverId: string }).driverId : null;
  present.push(`Settlement ${settlementId}`);
  if (!raw) missing.push("Settlement not found in demo settlements seed");
  if (driverId) present.push(`Driver ${driverId}`);
  else missing.push("No driver on settlement row");

  const fromParent = [...new Set((linkedLoadIdsFromParent ?? []).filter(Boolean) as string[])];
  let linkedLoadIds: string[] = [];
  let settlementLoadLinkage: SettlementLoadLinkage = "none";
  let settlementLinkageNote: string | null = null;

  if (fromParent.length > 0) {
    linkedLoadIds = fromParent;
    settlementLoadLinkage = "lines_explicit";
    present.push("Load IDs from settlement lines (explicit)");
  } else if (driverId) {
    const driverLoads = sortedDriverLoadIds(data, driverId);
    if (driverLoads.length === 0) {
      missing.push("No loads on file for this driver — cannot anchor billing context");
    } else if (driverLoads.length === 1) {
      linkedLoadIds = driverLoads;
      settlementLoadLinkage = "driver_single_inferred";
      settlementLinkageNote =
        "No settlement line supplied a load_id — using the driver's only load (inferred). Add line load IDs for a direct tie.";
      present.push(settlementLinkageNote);
    } else {
      linkedLoadIds = driverLoads;
      settlementLoadLinkage = "driver_multi_merged";
      settlementLinkageNote =
        "No settlement line supplied a load_id — BOF merged RFID/proof across all of this driver's loads (conservative). Tie payroll lines to loads for a tighter billing anchor.";
      present.push(settlementLinkageNote);
    }
  }

  const load = linkedLoadIds[0] ? data.loads.find((l) => l.id === linkedLoadIds[0]) : null;
  const customerId = (load as { customerId?: string; shipperId?: string } | null)?.customerId ??
    (load as { customerId?: string; shipperId?: string } | null)?.shipperId ??
    null;
  const facilityId =
    (load as { originFacilityId?: string; facilityId?: string } | null)?.originFacilityId ??
    (load as { originFacilityId?: string; facilityId?: string } | null)?.facilityId ??
    null;
  if (customerId) present.push(`Customer ${customerId}`);
  if (facilityId) present.push(`Facility ${facilityId}`);

  const holdLine = driverId
    ? data.loads.some(
        (l) => l.driverId === driverId && proofBlockingCount(getLoadProofItems(data, l.id)) > 0
      )
    : false;
  if (holdLine) present.push("At least one driver load shows proof blockers (payroll posture)");

  return {
    loadId: linkedLoadIds[0] ?? null,
    driverId,
    settlementId,
    claimId: null,
    customerId,
    facilityId,
    billingPacketId: settlementId,
    linkedLoadIds,
    settlementLoadLinkage,
    settlementLinkageNote,
    missingContext: missing,
    presentContext: present,
  };
}

function workflowRoleForRow(
  template: BofTemplateDefinition,
  context: TemplateUsageSurfaceContext
): TemplateWorkflowRole {
  if (template.requiredBeforeRelease) return "required_before_release";
  if (template.requiredBeforeBilling) return "required_before_billing";
  if (template.requiredForClaimPacket) return "required_for_claim_packet";
  if (template.appearsInFieldOps || (context === "settlement_billing" && template.appearsInFieldOps)) {
    return "linked_proof_support";
  }
  if (
    (context === "vault_documents" && !template.appearsInVault) ||
    (!template.appearsInIntake &&
      !template.appearsInDispatch &&
      !template.appearsInFieldOps &&
      !template.appearsInSettlements &&
      !template.appearsInClaims &&
      !template.appearsInVault)
  ) {
    return "optional_reference";
  }
  return "workflow_document";
}

function workflowRoleLabel(role: TemplateWorkflowRole): string {
  switch (role) {
    case "required_before_release":
      return "Required Before Release";
    case "required_before_billing":
      return "Required Before Billing";
    case "required_for_claim_packet":
      return "Required for Claim Packet";
    case "linked_proof_support":
      return "Linked Proof Support";
    case "optional_reference":
      return "Optional / Reference Only";
    default:
      return "Workflow Document";
  }
}

function contextValueForKey(
  key: BofRequiredEntityKey,
  resolved: ResolvedTemplateEntityContext
): string | null {
  if (key === "loadId") return resolved.loadId;
  if (key === "driverId") return resolved.driverId;
  if (key === "facilityId") return resolved.facilityId;
  if (key === "claimId") return resolved.claimId;
  if (key === "billingPacketId") return resolved.billingPacketId;
  if (key === "customerId") return resolved.customerId;
  return resolved.settlementId;
}

function rowMissingForTemplate(
  resolved: ResolvedTemplateEntityContext,
  template: BofTemplateDefinition,
  context: TemplateUsageSurfaceContext
): string[] {
  const out = [...resolved.missingContext];
  for (const key of template.requiredEntityKeys) {
    if (!contextValueForKey(key, resolved)) out.push(`Missing required ${key}`);
  }
  if (
    context === "settlement_billing" &&
    resolved.settlementLoadLinkage === "driver_multi_merged" &&
    (template.requiredBeforeBilling || template.requiredEntityKeys.includes("loadId"))
  ) {
    out.push("Context inferred from multiple driver loads — review load-to-settlement binding");
  }
  return [...new Set(out)];
}

function whyMattersLine(
  template: BofTemplateDefinition,
  role: TemplateWorkflowRole,
  context: TemplateUsageSurfaceContext
): string {
  const trigger = template.triggerInBof[0] ?? template.templateName;
  if (context === "load_intake") return `${trigger} — intake handoff to dispatch and billing.`;
  if (context === "dispatch_load") {
    if (role === "required_before_release") return `${trigger} — dispatch gate / release packet.`;
    return `${trigger} — supports dispatch and field execution.`;
  }
  if (context === "settlement_billing") {
    if (role === "required_before_billing") return `${trigger} — AR / settlement release chain.`;
    return `${trigger} — billing packet and proof alignment.`;
  }
  if (context === "vault_documents") return `${trigger} — driver compliance and document home.`;
  return `${trigger} — claim packet and insurer-facing controls.`;
}

export type TemplateRowReadiness = {
  primary: TemplateRowPrimaryState;
  workflowRole: TemplateWorkflowRole;
  workflowLabel: string;
  missingContext: string[];
  presentContext: string[];
  whyMatters: string;
  rfidHints: string[];
  rfidGate: BofRfidTemplateGate;
};

export function computeTemplateRowReadiness({
  context,
  resolved,
  template,
  hasDraft,
  hasFinal,
  rfid,
}: {
  context: TemplateUsageSurfaceContext;
  resolved: ResolvedTemplateEntityContext;
  template: BofTemplateDefinition;
  hasDraft: boolean;
  hasFinal: boolean;
  rfid: BofLoadRfidReadiness | null;
}): TemplateRowReadiness {
  const workflowRole = workflowRoleForRow(template, context);
  const missing = rowMissingForTemplate(resolved, template, context);
  const inferredOnly = missing.some((m) => m.includes("Context inferred"));
  const hardMissing = missing.some((m) => m.startsWith("Missing required"));
  const rfidHints = rfid ? rfidHintsForTemplateRow(template.templateId, rfid) : [];
  const rfidGate = resolveRfidTemplateGate(template.templateId, rfid);

  let primary: TemplateRowPrimaryState = "ready_to_generate";
  if (hasFinal) primary = "final_available";
  else if (hardMissing) primary = "missing_context";
  else if (inferredOnly) primary = "context_inferred";
  else if (hasDraft) primary = "draft_exists";

  return {
    primary,
    workflowRole,
    workflowLabel: workflowRoleLabel(workflowRole),
    missingContext: missing,
    presentContext: resolved.presentContext,
    whyMatters: whyMattersLine(template, workflowRole, context),
    rfidHints,
    rfidGate,
  };
}

export function resolveRfidForSurface(
  data: BofData,
  _context: TemplateUsageSurfaceContext,
  resolved: ResolvedTemplateEntityContext
): BofLoadRfidReadiness | null {
  if (!resolved.linkedLoadIds.length) return null;
  if (resolved.linkedLoadIds.length === 1)
    return buildBofLoadRfidReadiness(data, resolved.linkedLoadIds[0]!);
  return mergeBofRfidReadiness(data, resolved.linkedLoadIds);
}

export function primaryStateLabel(primary: TemplateRowPrimaryState): string {
  switch (primary) {
    case "final_available":
      return "Final Available";
    case "draft_exists":
      return "Draft Exists";
    case "missing_context":
      return "Missing Context";
    case "context_inferred":
      return "Context Inferred / Review";
    default:
      return "Ready to Generate";
  }
}

export function buildRfidReadinessSummaryForSurface(
  data: BofData,
  context: TemplateUsageSurfaceContext,
  entityId: string,
  linkedLoadIds?: string[]
): BofLoadRfidReadiness | null {
  const resolved = resolveTemplateEntityContext(data, context, entityId, linkedLoadIds);
  return resolveRfidForSurface(data, context, resolved);
}

export function resolveTemplateSurfaceBundle(
  data: BofData,
  context: TemplateUsageSurfaceContext,
  entityId: string,
  linkedLoadIds?: string[]
): { resolved: ResolvedTemplateEntityContext; rfid: BofLoadRfidReadiness | null } {
  const resolved = resolveTemplateEntityContext(data, context, entityId, linkedLoadIds);
  const rfid = resolveRfidForSurface(data, context, resolved);
  return { resolved, rfid };
}
