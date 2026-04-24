import type { BofData } from "@/lib/load-bof-data";
import type { BofTemplateDefinition } from "@/lib/bof-template-system";
import { getLoadProofItems, proofBlockingCount } from "@/lib/load-proof";
import {
  type BofLoadRfidReadiness,
  type BofRfidTemplateGate,
  buildBofLoadRfidReadiness,
  mergeBofRfidReadiness,
  resolveRfidTemplateGate,
  rfidHintsForTemplateRow,
} from "@/lib/bof-rfid-readiness";

export type TemplateUsageSurfaceContext =
  | "dispatch_load"
  | "settlement_billing"
  | "claims_insurance";

export type SettlementLoadLinkage =
  | "not_applicable"
  | "none"
  /** At least one settlement line supplied a `load_id` — preferred anchor. */
  | "lines_explicit"
  /** Driver has exactly one load; no line-level `load_id` in passed linkage. */
  | "driver_single_inferred"
  /** Driver has multiple loads; BOF merged RFID/proof across all (conservative). */
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
  /** Loads used for RFID / proof merge (order: explicit lines first, else driver set). */
  linkedLoadIds: string[];
  settlementLoadLinkage: SettlementLoadLinkage;
  /** Operator-facing note when linkage is not line-explicit. */
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

export function resolveTemplateEntityContext(
  data: BofData,
  context: TemplateUsageSurfaceContext,
  entityId: string,
  linkedLoadIdsFromParent?: string[]
): ResolvedTemplateEntityContext {
  const missing: string[] = [];
  const present: string[] = [];

  if (context === "dispatch_load" || context === "claims_insurance") {
    const load = data.loads.find((l) => l.id === entityId);
    if (!load) {
      missing.push("No load row for this entityId in BOF demo data");
      return {
        loadId: null,
        driverId: null,
        settlementId: null,
        linkedLoadIds: [],
        settlementLoadLinkage: "not_applicable",
        settlementLinkageNote: null,
        missingContext: missing,
        presentContext: present,
      };
    }
    present.push(`Load ${load.number} (${load.id})`);
    if (load.driverId) {
      present.push(`Driver ${load.driverId}`);
      const dr = data.drivers.find((d) => d.id === load.driverId);
      if (!dr) missing.push("Driver profile not found for load.driverId");
    } else missing.push("No driverId on load");

    if (load.origin) present.push("Route / origin context");
    if (context === "claims_insurance") present.push("Claim workflow scoped to this load");

    return {
      loadId: load.id,
      driverId: load.driverId,
      settlementId: null,
      linkedLoadIds: [load.id],
      settlementLoadLinkage: "not_applicable",
      settlementLinkageNote: null,
      missingContext: missing,
      presentContext: present,
    };
  }

  // settlement_billing
  const settlementId = entityId;
  present.push(`Settlement ${settlementId}`);
  const raw = rawSettlementById(data, settlementId);
  const driverId = raw ? (raw as { driverId: string }).driverId : null;
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
      linkedLoadIds = [];
      settlementLoadLinkage = "none";
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
  } else {
    settlementLoadLinkage = "none";
    settlementLinkageNote = null;
  }

  const holdLine = driverId
    ? data.loads.some(
        (l) =>
          l.driverId === driverId && proofBlockingCount(getLoadProofItems(data, l.id)) > 0
      )
    : false;
  if (holdLine) present.push("At least one driver load shows proof blockers (payroll posture)");
  else present.push("No proof blockers on driver loads (reference)");

  if (!linkedLoadIds.length && settlementLoadLinkage !== "none") {
    missing.push("No primary load linked to this settlement");
  }

  return {
    loadId: linkedLoadIds[0] ?? null,
    driverId,
    settlementId,
    linkedLoadIds,
    settlementLoadLinkage,
    settlementLinkageNote,
    missingContext: missing,
    presentContext: present,
  };
}

function workflowRoleForRow(
  templateId: string,
  context: TemplateUsageSurfaceContext
): TemplateWorkflowRole {
  const id = templateId.toLowerCase();
  if (context === "dispatch_load") {
    if (id.includes("release") || id.includes("proof-requirements") || id.includes("pretrip"))
      return "required_before_release";
    if (id.includes("high-value")) return "required_before_release";
    return "workflow_document";
  }
  if (context === "settlement_billing") {
    if (id.includes("invoice") || id.includes("billing-packet") || id.includes("settlement-hold"))
      return "required_before_billing";
    if (id.includes("pod") || id.includes("bol") || id.includes("lumper")) return "linked_proof_support";
    return "workflow_document";
  }
  if (id.includes("claim") || id.includes("incident") || id.includes("damage")) {
    return "required_for_claim_packet";
  }
  if (id.includes("pod") || id.includes("bol") || id.includes("settlement-hold")) return "linked_proof_support";
  if (id.includes("invoice")) return "required_before_billing";
  if (id.includes("insurance") || id.includes("coi") || id.includes("facility-insurance"))
    return "workflow_document";
  return "optional_reference";
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

function templateNeedsLoad(template: BofTemplateDefinition): boolean {
  return (
    template.contextType === "load" ||
    template.contextType === "dispatch_packet" ||
    template.contextType === "billing_packet" ||
    template.contextType === "claim_packet"
  );
}

function templateNeedsDriverOnly(template: BofTemplateDefinition): boolean {
  return template.contextType === "driver" && template.templateId === "compliance-missing-doc-notice";
}

function templateNeedsFacility(template: BofTemplateDefinition): boolean {
  return template.contextType === "facility";
}

function templateNeedsCustomer(template: BofTemplateDefinition): boolean {
  return template.contextType === "customer";
}

function strictSettlementBillingAnchor(template: BofTemplateDefinition, role: TemplateWorkflowRole) {
  if (role !== "required_before_billing" && role !== "linked_proof_support") return false;
  return (
    template.contextType === "billing_packet" ||
    template.templateId === "pod" ||
    template.templateId === "bol"
  );
}

function rowMissingForTemplate(
  resolved: ResolvedTemplateEntityContext,
  template: BofTemplateDefinition,
  context: TemplateUsageSurfaceContext
): string[] {
  const extra = [...resolved.missingContext];
  if (templateNeedsLoad(template) && !resolved.loadId) {
    if (!extra.some((m) => m.includes("No loads on file") || m.includes("No primary load linked")))
      extra.push("No loadId for this template row");
  }
  if (templateNeedsDriverOnly(template) && !resolved.driverId) extra.push("No driverId");
  if (templateNeedsFacility(template) && !resolved.loadId && context === "settlement_billing") {
    extra.push("No facility / load anchor on settlement surface");
  }
  if (templateNeedsCustomer(template) && context === "settlement_billing") {
    extra.push("Customer context is load-scoped — open from load detail for richer autofill");
  }
  if (template.templateId === "invoice" && context === "settlement_billing" && !resolved.loadId) {
    extra.push("No linked load for invoice line items (demo)");
  }
  return [...new Set(extra)];
}

function whyMattersLine(
  template: BofTemplateDefinition,
  role: TemplateWorkflowRole,
  context: TemplateUsageSurfaceContext
): string {
  const trigger = template.triggerInBof[0] ?? template.templateName;
  if (context === "dispatch_load") {
    if (role === "required_before_release") return `${trigger} — dispatch gate / release packet.`;
    return `${trigger} — supports dispatch and field execution.`;
  }
  if (context === "settlement_billing") {
    if (role === "required_before_billing") return `${trigger} — AR / settlement release chain.`;
    return `${trigger} — billing packet and proof alignment.`;
  }
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
  const workflowRole = workflowRoleForRow(template.templateId, context);
  const missing = rowMissingForTemplate(resolved, template, context);
  const rfidHints = rfid ? rfidHintsForTemplateRow(template.templateId, rfid) : [];
  const rfidGate = resolveRfidTemplateGate(template.templateId, rfid);

  const hardMissing =
    missing.length > 0 &&
    (missing.some((m) => m.includes("No loadId")) ||
      missing.some((m) => m.includes("No load row")) ||
      missing.some((m) => m.includes("No driverId")) ||
      missing.some((m) => m.includes("No loads on file")) ||
      missing.some((m) => m.includes("No primary load linked")));

  const billingAnchorAmbiguous =
    context === "settlement_billing" &&
    resolved.settlementLoadLinkage === "driver_multi_merged" &&
    strictSettlementBillingAnchor(template, workflowRole);

  if (hasFinal) {
    return {
      primary: "final_available",
      workflowRole,
      workflowLabel: workflowRoleLabel(workflowRole),
      missingContext: missing,
      presentContext: resolved.presentContext,
      whyMatters: whyMattersLine(template, workflowRole, context),
      rfidHints,
      rfidGate,
    };
  }

  if (hardMissing) {
    return {
      primary: "missing_context",
      workflowRole,
      workflowLabel: workflowRoleLabel(workflowRole),
      missingContext: missing,
      presentContext: resolved.presentContext,
      whyMatters: whyMattersLine(template, workflowRole, context),
      rfidHints,
      rfidGate,
    };
  }

  if (billingAnchorAmbiguous) {
    return {
      primary: "context_inferred",
      workflowRole,
      workflowLabel: workflowRoleLabel(workflowRole),
      missingContext: missing,
      presentContext: resolved.presentContext,
      whyMatters: whyMattersLine(template, workflowRole, context),
      rfidHints,
      rfidGate,
    };
  }

  if (hasDraft) {
    return {
      primary: "draft_exists",
      workflowRole,
      workflowLabel: workflowRoleLabel(workflowRole),
      missingContext: missing,
      presentContext: resolved.presentContext,
      whyMatters: whyMattersLine(template, workflowRole, context),
      rfidHints,
      rfidGate,
    };
  }

  return {
    primary: "ready_to_generate",
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
  context: TemplateUsageSurfaceContext,
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

/** Single object: merged RFID row for a resolved template surface (dispatch / settlement / claims). */
export function buildRfidReadinessSummaryForSurface(
  data: BofData,
  context: TemplateUsageSurfaceContext,
  entityId: string,
  linkedLoadIds?: string[]
): BofLoadRfidReadiness | null {
  const resolved = resolveTemplateEntityContext(data, context, entityId, linkedLoadIds);
  return resolveRfidForSurface(data, context, resolved);
}

/** One resolution pass for template usage UI + gates (avoids duplicating entity resolution). */
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
