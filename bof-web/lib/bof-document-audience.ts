import type { BofTemplateDefinition } from "@/lib/bof-template-system";

/** BOF-native stakeholder groups for demo routing / visibility (no external ACL). */
export type BofDocumentStakeholder =
  | "driver"
  | "dispatch"
  | "manager_owner"
  | "shipper_customer"
  | "billing_settlements"
  | "claims_insurance"
  | "facility_ops";

export const ALL_BOF_DOCUMENT_STAKEHOLDERS: BofDocumentStakeholder[] = [
  "driver",
  "dispatch",
  "manager_owner",
  "shipper_customer",
  "billing_settlements",
  "claims_insurance",
  "facility_ops",
];

export const BOF_STAKEHOLDER_LABELS: Record<BofDocumentStakeholder, string> = {
  driver: "Driver",
  dispatch: "Dispatch",
  manager_owner: "Manager / Owner",
  shipper_customer: "Shipper / Customer",
  billing_settlements: "Billing / Settlements",
  claims_insurance: "Claims / Insurance",
  facility_ops: "Facility / Operations",
};

export type BofDocumentSurface =
  | "load_detail"
  | "dispatch_usage"
  | "billing_settlement"
  | "claims_insurance"
  | "template_workspace"
  | "documents_hub";

export type BofDocumentWorkflowImpact =
  | "required_before_release"
  | "required_before_billing"
  | "required_for_claim_packet"
  | "linked_proof_support"
  | "workflow_reference"
  | "optional";

export type BofDocumentAudienceModel = {
  /** Where this artifact should surface in BOF (same underlying key). */
  appearsIn: BofDocumentSurface[];
  /** Recommended / default audience. */
  recommendedRecipients: BofDocumentStakeholder[];
  /** Primary workflow audience label for ops copy. */
  workflowAudienceSummary: string;
  /** High-level packet / routing hints. */
  packetInclusion: string[];
  workflowImpacts: BofDocumentWorkflowImpact[];
};

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function id(t: string) {
  return t.toLowerCase();
}

/**
 * Derive stakeholder access, surfaces, and workflow impact from template definition.
 * Demo-grade: pattern rules, not a full policy engine.
 */
export function deriveDocumentAudienceModel(template: BofTemplateDefinition): BofDocumentAudienceModel {
  const tid = id(template.templateId);
  const impacts: BofDocumentWorkflowImpact[] = [];
  const appears: BofDocumentSurface[] = ["template_workspace", "documents_hub"];
  const recipients: BofDocumentStakeholder[] = [];
  const packets: string[] = [];

  const addImpact = (x: BofDocumentWorkflowImpact) => {
    if (!impacts.includes(x)) impacts.push(x);
  };

  if (template.contextType === "load" || template.contextType === "dispatch_packet") {
    appears.push("load_detail", "dispatch_usage");
    addImpact("workflow_reference");
  }
  if (template.contextType === "billing_packet") {
    appears.push("billing_settlement");
    addImpact("required_before_billing");
    recipients.push("billing_settlements", "manager_owner");
  }
  if (template.contextType === "claim_packet") {
    appears.push("claims_insurance");
    addImpact("required_for_claim_packet");
    recipients.push("claims_insurance", "manager_owner");
  }
  if (template.contextType === "facility") {
    recipients.push("facility_ops", "dispatch", "driver");
    packets.push("Field ops packet");
  }
  if (template.contextType === "customer") {
    recipients.push("shipper_customer", "manager_owner", "dispatch");
    packets.push("Customer commercial packet");
  }

  if (tid.includes("dispatch-release") || tid.includes("pretrip") || tid.includes("driver-assignment")) {
    recipients.push("dispatch", "driver", "manager_owner");
    addImpact("required_before_release");
    packets.push("Dispatch release packet");
  }
  if (tid.includes("proof-requirements") || tid.includes("load-instruction")) {
    recipients.push("driver", "dispatch");
    addImpact("required_before_release");
  }
  if (tid.includes("bol") || tid.includes("pod")) {
    recipients.push("dispatch", "billing_settlements", "shipper_customer");
    appears.push("billing_settlement");
    addImpact("linked_proof_support");
    packets.push("Billing packet", "Load proof bundle");
  }
  if (tid.includes("billing-packet") || tid.includes("invoice") || tid.includes("settlement-hold")) {
    recipients.push("billing_settlements", "manager_owner");
    appears.push("billing_settlement");
    addImpact("required_before_billing");
    packets.push("Billing packet");
    if (tid.includes("settlement-hold")) {
      appears.push("claims_insurance");
      packets.push("Exception / claim support (when claim-linked)");
    }
  }
  if (tid.includes("claim") || tid.includes("damage") || tid.includes("incident") || tid.includes("high-value")) {
    recipients.push("claims_insurance", "manager_owner");
    appears.push("claims_insurance");
    addImpact("required_for_claim_packet");
    packets.push("Claim support packet");
  }
  if (tid.includes("seal") || tid.includes("cargo-photo")) {
    recipients.push("driver", "dispatch", "claims_insurance");
    addImpact("linked_proof_support");
  }

  if (recipients.length === 0) {
    recipients.push("dispatch", "manager_owner");
  }
  if (impacts.length === 0) addImpact("workflow_reference");

  const workflowAudienceSummary =
    impacts.includes("required_before_release")
      ? "Primary: dispatch + driver before movement"
      : impacts.includes("required_before_billing")
        ? "Primary: billing + owner before AR / settlement"
        : impacts.includes("required_for_claim_packet")
          ? "Primary: claims + insurer-facing reviewers"
          : "Primary: operations + management reference";

  return {
    appearsIn: uniq(appears),
    recommendedRecipients: uniq(recipients),
    workflowAudienceSummary,
    packetInclusion: packets.length ? uniq(packets) : ["BOF standard document index"],
    workflowImpacts: impacts,
  };
}

export function workflowImpactLabel(i: BofDocumentWorkflowImpact): string {
  switch (i) {
    case "required_before_release":
      return "Required Before Release";
    case "required_before_billing":
      return "Required Before Billing";
    case "required_for_claim_packet":
      return "Required for Claim Packet";
    case "linked_proof_support":
      return "Linked Proof Support";
    case "optional":
      return "Optional";
    default:
      return "Workflow Reference";
  }
}

export function surfaceLabel(s: BofDocumentSurface): string {
  switch (s) {
    case "load_detail":
      return "Load Detail";
    case "dispatch_usage":
      return "Dispatch / Template Usage (Load)";
    case "billing_settlement":
      return "Billing / Settlements";
    case "claims_insurance":
      return "Claims / Insurance";
    case "template_workspace":
      return "Template Packs Workspace";
    case "documents_hub":
      return "Documents Hub";
    default:
      return s;
  }
}
