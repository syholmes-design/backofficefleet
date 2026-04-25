import type { BofData } from "@/lib/load-bof-data";

export type BofDocumentType = "generated_autofill_output" | "editable_template";
export type BofApprovalStatus = "not_required" | "pending_review" | "approved" | "rejected";
export type BofDocumentStatus = "ready" | "at_risk" | "blocked";
export type BofCommandCenterStatus = "none" | "watch" | "action_required";
export type BofReviewOutcome = "not_reviewed" | "accepted" | "needs_changes" | "blocked";
export type BofDispatchGate = "dispatch_hold_active" | "dispatch_release_ready";
export type BofSettlementGate = "settlement_hold_active" | "settlement_release_ready";

export type BofTemplatePackId =
  | "load-intake-v3"
  | "field-operations-v3"
  | "billing-settlement-v3"
  | "driver-dispatch-readiness-v2"
  | "insurance-claims-v2";

export type BofTemplateContextType =
  | "load"
  | "driver"
  | "dispatch_packet"
  | "billing_packet"
  | "claim_packet"
  | "facility"
  | "customer";

export type BofWorkflowModule =
  | "intake"
  | "dispatch"
  | "field_ops"
  | "billing"
  | "claims"
  | "vault"
  | "customer";

export type BofPrimarySurface =
  | "load_intake"
  | "load_detail"
  | "dispatch_release"
  | "field_proof"
  | "settlement_detail"
  | "claim_packet"
  | "vault_documents"
  | "customer_setup";

export type BofTemplateUsageSurface =
  | "load_intake"
  | "dispatch_load"
  | "settlement_billing"
  | "claims_insurance"
  | "vault_documents";

export type BofRequiredEntityKey =
  | "intakeId"
  | "loadId"
  | "driverId"
  | "facilityId"
  | "destinationFacility"
  | "routeMemoryKey"
  | "appointmentRequired"
  | "contractSelection"
  | "claimId"
  | "billingPacketId"
  | "customerId"
  | "settlementId";

export type BofTemplateDefinition = {
  templateId: string;
  packId: BofTemplatePackId;
  templateName: string;
  contextType: BofTemplateContextType;
  documentType: BofDocumentType;
  approvalStatus: BofApprovalStatus;
  documentStatus: BofDocumentStatus;
  commandCenterStatus: BofCommandCenterStatus;
  reviewedBy: string;
  reviewOutcome: BofReviewOutcome;
  dispatchGate: BofDispatchGate;
  settlementGate: BofSettlementGate;
  claimsSensitiveLoad: boolean;
  insuranceReviewRequired: boolean;
  escalationReviewBlock: string;
  triggerInBof: string[];
  primaryModule: BofWorkflowModule;
  secondaryModules: BofWorkflowModule[];
  primarySurface: BofPrimarySurface;
  requiredEntityKeys: BofRequiredEntityKey[];
  appearsInIntake: boolean;
  appearsInDispatch: boolean;
  appearsInFieldOps: boolean;
  appearsInSettlements: boolean;
  appearsInClaims: boolean;
  appearsInVault: boolean;
  requiredBeforeRelease: boolean;
  requiredBeforeBilling: boolean;
  requiredForClaimPacket: boolean;
  /** Vault alignment hints (optional, gradual rollout). */
  vaultCategory?: "driver_core" | "dispatch_reference" | "workflow_reference";
  vaultPrimaryOwner?: "vault" | "dispatch" | "billing" | "claims" | "load";
  vaultSortOrder?: number;
  vaultVisible?: boolean;
  vaultSecondaryVisible?: boolean;
};

export type BofTemplatePack = {
  packId: BofTemplatePackId;
  title: string;
  version: string;
  sourceFileName: string;
  roleSummary: string;
  templates: BofTemplateDefinition[];
};

type MappingProfile = Pick<
  BofTemplateDefinition,
  | "primaryModule"
  | "secondaryModules"
  | "primarySurface"
  | "requiredEntityKeys"
  | "appearsInIntake"
  | "appearsInDispatch"
  | "appearsInFieldOps"
  | "appearsInSettlements"
  | "appearsInClaims"
  | "appearsInVault"
  | "requiredBeforeRelease"
  | "requiredBeforeBilling"
  | "requiredForClaimPacket"
>;

const DEFAULTS = {
  approvalStatus: "pending_review" as BofApprovalStatus,
  documentStatus: "at_risk" as BofDocumentStatus,
  commandCenterStatus: "watch" as BofCommandCenterStatus,
  reviewedBy: "BOF Ops Review Queue",
  reviewOutcome: "not_reviewed" as BofReviewOutcome,
  dispatchGate: "dispatch_hold_active" as BofDispatchGate,
  settlementGate: "settlement_hold_active" as BofSettlementGate,
  claimsSensitiveLoad: false,
  insuranceReviewRequired: false,
};

function t(
  templateId: string,
  packId: BofTemplatePackId,
  templateName: string,
  contextType: BofTemplateContextType,
  documentType: BofDocumentType,
  triggerInBof: string[],
  mapping: MappingProfile,
  overrides?: Partial<
    Omit<
      BofTemplateDefinition,
      | "templateId"
      | "packId"
      | "templateName"
      | "contextType"
      | "documentType"
      | "triggerInBof"
      | keyof MappingProfile
    >
  >
): BofTemplateDefinition {
  return {
    templateId,
    packId,
    templateName,
    contextType,
    documentType,
    triggerInBof,
    ...mapping,
    approvalStatus: overrides?.approvalStatus ?? DEFAULTS.approvalStatus,
    documentStatus: overrides?.documentStatus ?? DEFAULTS.documentStatus,
    commandCenterStatus: overrides?.commandCenterStatus ?? DEFAULTS.commandCenterStatus,
    reviewedBy: overrides?.reviewedBy ?? DEFAULTS.reviewedBy,
    reviewOutcome: overrides?.reviewOutcome ?? DEFAULTS.reviewOutcome,
    dispatchGate: overrides?.dispatchGate ?? DEFAULTS.dispatchGate,
    settlementGate: overrides?.settlementGate ?? DEFAULTS.settlementGate,
    claimsSensitiveLoad: overrides?.claimsSensitiveLoad ?? DEFAULTS.claimsSensitiveLoad,
    insuranceReviewRequired: overrides?.insuranceReviewRequired ?? DEFAULTS.insuranceReviewRequired,
    escalationReviewBlock:
      overrides?.escalationReviewBlock ??
      "Escalate to Ops Manager when unresolved after first review cycle.",
  };
}

function inSurface(template: BofTemplateDefinition, surface: BofTemplateUsageSurface): boolean {
  if (surface === "load_intake") return template.appearsInIntake;
  if (surface === "dispatch_load") return template.appearsInDispatch || template.appearsInFieldOps;
  if (surface === "settlement_billing") return template.appearsInSettlements || template.requiredBeforeBilling;
  if (surface === "claims_insurance") return template.appearsInClaims || template.requiredForClaimPacket;
  if (template.vaultVisible === true) return true;
  if (template.vaultVisible === false) return false;
  return template.appearsInVault || Boolean(template.vaultSecondaryVisible);
}

function isPrimaryOnSurface(template: BofTemplateDefinition, surface: BofTemplateUsageSurface): boolean {
  if (surface === "load_intake") return template.primarySurface === "load_intake";
  if (surface === "dispatch_load") {
    return template.primarySurface === "load_detail" || template.primarySurface === "dispatch_release";
  }
  if (surface === "settlement_billing") return template.primarySurface === "settlement_detail";
  if (surface === "claims_insurance") return template.primarySurface === "claim_packet";
  return template.primarySurface === "vault_documents";
}

export const BOF_TEMPLATE_PACKS: BofTemplatePack[] = [
  {
    packId: "load-intake-v3",
    title: "BOF Load Intake Template Pack",
    version: "v3",
    sourceFileName: "BOF Load Intake Template Pack v3.docx",
    roleSummary:
      "Intake setup, commercial order intake, service schedule/work order, onboarding and customer setup.",
    templates: [
      t("load-tender", "load-intake-v3", "Load Tender", "load", "editable_template", ["Creates intake packet baseline and dispatch intake gate."], {
        primaryModule: "intake",
        secondaryModules: ["dispatch", "billing"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("rate-confirmation", "load-intake-v3", "Rate Confirmation", "load", "generated_autofill_output", ["Defines commercial baseline for billing and proof expectations."], {
        primaryModule: "intake",
        secondaryModules: ["billing", "customer"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("trip-schedule", "load-intake-v3", "Trip Schedule", "load", "generated_autofill_output", ["Sets appointment and route schedule controls."], {
        primaryModule: "intake",
        secondaryModules: ["dispatch", "field_ops"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId", "facilityId", "destinationFacility", "routeMemoryKey"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("multi-trip-batch", "load-intake-v3", "Multi-Trip Batch Sheet", "dispatch_packet", "editable_template", ["Groups multi-stop/multi-leg execution into one dispatch packet."], {
        primaryModule: "intake",
        secondaryModules: ["dispatch"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("service-schedule-work-order", "load-intake-v3", "Service Schedule / Work Order", "facility", "editable_template", ["Activates field operations schedule and proof checklist."], {
        primaryModule: "intake",
        secondaryModules: ["field_ops", "dispatch"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId", "facilityId", "appointmentRequired"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("customer-setup", "load-intake-v3", "Customer Setup", "customer", "editable_template", ["Creates customer profile controls and compliance expectations."], {
        primaryModule: "customer",
        secondaryModules: ["intake", "billing"],
        primarySurface: "customer_setup",
        requiredEntityKeys: ["intakeId", "customerId"],
        appearsInIntake: true,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("carrier-broker-agreement-summary", "load-intake-v3", "Carrier-Broker Agreement Summary", "customer", "generated_autofill_output", ["Flags legal/commercial controls before dispatch release."], {
        primaryModule: "intake",
        secondaryModules: ["customer", "dispatch"],
        primarySurface: "load_intake",
        requiredEntityKeys: ["intakeId", "customerId", "contractSelection"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
    ],
  },
  {
    packId: "field-operations-v3",
    title: "BOF Field Operations Template Pack",
    version: "v3",
    sourceFileName: "BOF Field Operations Template Pack v3.docx",
    roleSummary:
      "Execution proof, pickup/delivery evidence, seal/photo/appointment/special-handling controls.",
    templates: [
      t("bol", "field-operations-v3", "Bill of Lading (BOL)", "load", "generated_autofill_output", ["Required proof expectation for dispatch and billing packet release."], {
        primaryModule: "field_ops",
        secondaryModules: ["dispatch", "billing", "claims"],
        primarySurface: "field_proof",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: true,
        requiredForClaimPacket: true,
      }, {
        vaultCategory: "workflow_reference",
        vaultPrimaryOwner: "load",
        vaultSortOrder: 320,
        vaultSecondaryVisible: true,
      }),
      t("pod", "field-operations-v3", "Proof of Delivery (POD)", "load", "generated_autofill_output", ["Settlement release control and dispute defense evidence."], {
        primaryModule: "field_ops",
        secondaryModules: ["billing", "claims"],
        primarySurface: "field_proof",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: true,
      }, {
        vaultCategory: "workflow_reference",
        vaultPrimaryOwner: "load",
        vaultSortOrder: 330,
        vaultSecondaryVisible: true,
      }),
      t("seal-verification", "field-operations-v3", "Seal Verification Form", "load", "editable_template", ["Updates seal acknowledgment readiness and exception logic."], {
        primaryModule: "field_ops",
        secondaryModules: ["dispatch", "claims"],
        primarySurface: "field_proof",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }),
      t("pickup-checklist", "field-operations-v3", "Pickup Checklist", "facility", "editable_template", ["Confirms pickup execution controls at facility level."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId", "facilityId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("delivery-checklist", "field-operations-v3", "Delivery Checklist", "facility", "editable_template", ["Confirms delivery execution controls at facility level."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId", "facilityId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("cargo-photo-checklist", "field-operations-v3", "Cargo Photo Checklist", "load", "editable_template", ["Closes pre-trip and cargo evidence requirements."], {
        primaryModule: "field_ops",
        secondaryModules: ["dispatch", "claims"],
        primarySurface: "field_proof",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }),
      t("empty-trailer-confirmation", "field-operations-v3", "Empty Trailer Photo Confirmation", "load", "editable_template", ["Closes trailer condition and pre-trip gate checks."], {
        primaryModule: "field_ops",
        secondaryModules: ["dispatch"],
        primarySurface: "field_proof",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("appointment-confirmation", "field-operations-v3", "Appointment Confirmation Sheet", "facility", "generated_autofill_output", ["Updates appointment confirmation readiness check."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops", "customer"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["facilityId", "appointmentRequired"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("special-handling-sheet", "field-operations-v3", "Special Handling Instructions Sheet", "load", "generated_autofill_output", ["Requires acknowledgment before dispatch release."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
    ],
  },
  {
    packId: "billing-settlement-v3",
    title: "BOF Billing and Settlement Template Pack",
    version: "v3",
    sourceFileName: "BOF Billing and Settlement Template Pack v3.docx",
    roleSummary: "Invoice, accessorials, factoring, settlement hold, and billing packet control forms.",
    templates: [
      t("invoice", "billing-settlement-v3", "Invoice", "billing_packet", "generated_autofill_output", ["Starts billing packet lifecycle and AR flow."], {
        primaryModule: "billing",
        secondaryModules: [],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "loadId", "customerId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("accessorial-summary", "billing-settlement-v3", "Accessorial Summary", "billing_packet", "editable_template", ["Validates additional charge controls before invoice finalization."], {
        primaryModule: "billing",
        secondaryModules: ["dispatch"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("lumper-cover-sheet", "billing-settlement-v3", "Lumper Receipt Cover Sheet", "billing_packet", "editable_template", ["Clears lumper proof blockers on settlement."], {
        primaryModule: "billing",
        secondaryModules: ["field_ops", "claims"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("detention-layover-request", "billing-settlement-v3", "Detention / Layover Request", "billing_packet", "editable_template", ["Routes exception charge requests for manager approval."], {
        primaryModule: "billing",
        secondaryModules: ["dispatch"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }),
      t("factoring-notice", "billing-settlement-v3", "Factoring Notice", "billing_packet", "generated_autofill_output", ["Signals receivables handoff controls in billing packet."], {
        primaryModule: "billing",
        secondaryModules: [],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "customerId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("settlement-hold-notice", "billing-settlement-v3", "Settlement Hold Notice", "billing_packet", "generated_autofill_output", ["Activates settlement hold status when required proof is missing."], {
        primaryModule: "billing",
        secondaryModules: ["claims"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["settlementId", "billingPacketId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: true,
      }),
      t("billing-packet-cover", "billing-settlement-v3", "Billing Packet Cover Sheet", "billing_packet", "generated_autofill_output", ["Summarizes packet readiness and release posture."], {
        primaryModule: "billing",
        secondaryModules: ["claims"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "settlementId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: true,
      }),
      t("lumper-overrun-authorization", "billing-settlement-v3", "Lumper Exception / Additional Charge Authorization", "billing_packet", "editable_template", ["Approval control for lumper overrun workflow."], {
        primaryModule: "billing",
        secondaryModules: ["claims"],
        primarySurface: "settlement_detail",
        requiredEntityKeys: ["billingPacketId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: true,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: true,
        requiredForClaimPacket: false,
      }, { insuranceReviewRequired: false }),
    ],
  },
  {
    packId: "driver-dispatch-readiness-v2",
    title: "BOF Driver and Dispatch Readiness Template Pack",
    version: "v2",
    sourceFileName: "BOF Driver and Dispatch Readiness Template Pack v2.docx",
    roleSummary:
      "Dispatch gate, pre-trip readiness, assignment packet, dispatch release, and proof expectations.",
    templates: [
      t("driver-assignment-packet", "driver-dispatch-readiness-v2", "Driver Assignment Packet", "dispatch_packet", "generated_autofill_output", ["Consolidated dispatch-ready reference for assigned driver/load."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "load_detail",
        requiredEntityKeys: ["loadId", "driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }, {
        vaultCategory: "dispatch_reference",
        vaultPrimaryOwner: "dispatch",
        vaultSortOrder: 210,
        vaultSecondaryVisible: true,
      }),
      t("pretrip-readiness-summary", "driver-dispatch-readiness-v2", "Pre-Trip Readiness Summary", "dispatch_packet", "generated_autofill_output", ["Readiness rollup gate to Ready / At Risk / Blocked."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId", "driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }, {
        vaultCategory: "dispatch_reference",
        vaultPrimaryOwner: "dispatch",
        vaultSortOrder: 220,
        vaultSecondaryVisible: true,
      }),
      t("load-instruction-sheet", "driver-dispatch-readiness-v2", "Load-Specific Instruction Sheet", "dispatch_packet", "generated_autofill_output", ["Dispatch instructions acknowledgment requirement."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "load_detail",
        requiredEntityKeys: ["loadId", "driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("facility-rules-sheet", "driver-dispatch-readiness-v2", "Facility Rules Sheet", "facility", "generated_autofill_output", ["Facility-specific compliance acknowledgment control."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["facilityId"],
        appearsInIntake: true,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }),
      t("proof-requirements-sheet", "driver-dispatch-readiness-v2", "Proof Requirements Sheet", "dispatch_packet", "generated_autofill_output", ["Defines expected BOL/POD/seal/photo requirements."], {
        primaryModule: "dispatch",
        secondaryModules: ["field_ops", "billing"],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId", "driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: true,
        requiredForClaimPacket: true,
      }, {
        vaultCategory: "dispatch_reference",
        vaultPrimaryOwner: "dispatch",
        vaultSortOrder: 230,
        vaultSecondaryVisible: true,
      }),
      t("dispatch-release-checklist", "driver-dispatch-readiness-v2", "Dispatch Release Checklist", "dispatch_packet", "editable_template", ["Final release authorization control."], {
        primaryModule: "dispatch",
        secondaryModules: [],
        primarySurface: "dispatch_release",
        requiredEntityKeys: ["loadId", "driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }, {
        vaultCategory: "dispatch_reference",
        vaultPrimaryOwner: "dispatch",
        vaultSortOrder: 240,
        vaultSecondaryVisible: true,
      }),
      t("compliance-missing-doc-notice", "driver-dispatch-readiness-v2", "Compliance Reminder / Missing Doc Notice", "driver", "editable_template", ["Creates waiting-on response loop for driver compliance updates."], {
        primaryModule: "vault",
        secondaryModules: ["dispatch"],
        primarySurface: "vault_documents",
        requiredEntityKeys: ["driverId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: false,
        appearsInVault: true,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: false,
      }, {
        vaultCategory: "driver_core",
        vaultPrimaryOwner: "vault",
        vaultSortOrder: 10,
        vaultVisible: true,
      }),
    ],
  },
  {
    packId: "insurance-claims-v2",
    title: "BOF Insurance and Claims Template Pack",
    version: "v2",
    sourceFileName: "BOF Insurance and Claims Template Pack v2.docx",
    roleSummary:
      "COI/additional insured/facility insurance, claim intake, incident handling, and high-value cargo controls.",
    templates: [
      t("insurance-notice-coi", "insurance-claims-v2", "Insurance Notice / COI Request", "claim_packet", "generated_autofill_output", ["Triggers insurance review and command center watch."], {
        primaryModule: "claims",
        secondaryModules: ["customer", "vault"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId", "customerId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: true,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("additional-insured-request", "insurance-claims-v2", "Additional Insured Request", "claim_packet", "editable_template", ["Routes COI endorsement updates to insurance review."], {
        primaryModule: "claims",
        secondaryModules: ["customer", "vault"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "customerId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: true,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("facility-insurance-notice", "insurance-claims-v2", "Facility Insurance Requirement Notice", "facility", "generated_autofill_output", ["Links facility requirements to claims-sensitive controls."], {
        primaryModule: "claims",
        secondaryModules: ["dispatch", "vault"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "facilityId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: true,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("claim-intake", "insurance-claims-v2", "Claim Intake", "claim_packet", "editable_template", ["Opens claim packet and sets reserve/exposure tracking."], {
        primaryModule: "claims",
        secondaryModules: ["dispatch", "billing"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("damage-report", "insurance-claims-v2", "Damage Report", "claim_packet", "editable_template", ["Feeds claim packet support stack and command center watch."], {
        primaryModule: "claims",
        secondaryModules: ["field_ops"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("incident-report", "insurance-claims-v2", "Incident Report", "claim_packet", "editable_template", ["Documents incident facts and links to reserve exposure review."], {
        primaryModule: "claims",
        secondaryModules: ["dispatch"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("police-report-cover", "insurance-claims-v2", "Police Report Cover", "claim_packet", "generated_autofill_output", ["Links police artifacts into claim support packet."], {
        primaryModule: "claims",
        secondaryModules: ["vault"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: false,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: true,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("claim-support-packet-cover", "insurance-claims-v2", "Claim Support Packet Cover", "claim_packet", "generated_autofill_output", ["Consolidates claim-support evidence for settlement and insurer review."], {
        primaryModule: "claims",
        secondaryModules: ["billing", "field_ops"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: false,
        appearsInFieldOps: true,
        appearsInSettlements: true,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: false,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, { claimsSensitiveLoad: true, insuranceReviewRequired: true }),
      t("high-value-cargo-review", "insurance-claims-v2", "High-Value Cargo Review Sheet", "claim_packet", "editable_template", ["Major BOF control artifact for command center watch and dispatch block decisions."], {
        primaryModule: "claims",
        secondaryModules: ["dispatch", "field_ops"],
        primarySurface: "claim_packet",
        requiredEntityKeys: ["claimId", "loadId"],
        appearsInIntake: false,
        appearsInDispatch: true,
        appearsInFieldOps: true,
        appearsInSettlements: false,
        appearsInClaims: true,
        appearsInVault: false,
        requiredBeforeRelease: true,
        requiredBeforeBilling: false,
        requiredForClaimPacket: true,
      }, {
        claimsSensitiveLoad: true,
        insuranceReviewRequired: true,
        documentStatus: "blocked",
        commandCenterStatus: "action_required",
        escalationReviewBlock:
          "High-value cargo requires insurance + management approval before dispatch release.",
      }),
    ],
  },
];

export function listAllBofTemplates() {
  return BOF_TEMPLATE_PACKS.flatMap((p) => p.templates);
}

export function findBofTemplateById(templateId: string): BofTemplateDefinition | null {
  return listAllBofTemplates().find((x) => x.templateId === templateId) ?? null;
}

export function findPackForTemplate(templateId: string): BofTemplatePack | null {
  return BOF_TEMPLATE_PACKS.find((p) => p.templates.some((x) => x.templateId === templateId)) ?? null;
}

export function templatesForContext(contextType: BofTemplateContextType) {
  return listAllBofTemplates().filter((x) => x.contextType === contextType);
}

export function listTemplatesForUsageSurface(surface: BofTemplateUsageSurface) {
  const rows = listAllBofTemplates().filter((x) => inSurface(x, surface));
  return rows.sort((a, b) => {
    if (surface === "vault_documents") {
      const ap = a.vaultPrimaryOwner === "vault" ? 0 : 1;
      const bp = b.vaultPrimaryOwner === "vault" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const as = a.vaultSortOrder ?? 999;
      const bs = b.vaultSortOrder ?? 999;
      if (as !== bs) return as - bs;
    }
    const ap = isPrimaryOnSurface(a, surface) ? 0 : 1;
    const bp = isPrimaryOnSurface(b, surface) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    if (a.requiredBeforeRelease !== b.requiredBeforeRelease) return a.requiredBeforeRelease ? -1 : 1;
    if (a.requiredBeforeBilling !== b.requiredBeforeBilling) return a.requiredBeforeBilling ? -1 : 1;
    if (a.requiredForClaimPacket !== b.requiredForClaimPacket) return a.requiredForClaimPacket ? -1 : 1;
    return a.templateName.localeCompare(b.templateName);
  });
}

export function buildTemplateDefaultBody(data: BofData, template: BofTemplateDefinition, entityId: string) {
  const load = data.loads.find((l) => l.id === entityId);
  const driverId = load?.driverId ?? entityId;
  const driver = data.drivers.find((d) => d.id === driverId);
  return [
    `Template: ${template.templateName}`,
    `Pack: ${template.packId}`,
    `Entity Context: ${template.contextType}`,
    `Entity ID: ${entityId}`,
    `Document Type: ${
      template.documentType === "generated_autofill_output"
        ? "Generated / Autofill Output"
        : "Editable Template"
    }`,
    `Primary Module: ${template.primaryModule}`,
    `Primary Surface: ${template.primarySurface}`,
    `Required Entity Keys: ${template.requiredEntityKeys.join(", ") || "None"}`,
    `Required Before Release: ${template.requiredBeforeRelease ? "Yes" : "No"}`,
    `Required Before Billing: ${template.requiredBeforeBilling ? "Yes" : "No"}`,
    `Required For Claim Packet: ${template.requiredForClaimPacket ? "Yes" : "No"}`,
    `Approval Status: ${template.approvalStatus}`,
    `Document Status: ${template.documentStatus}`,
    `Command Center Status: ${template.commandCenterStatus}`,
    `Reviewed By: ${template.reviewedBy}`,
    `Review Outcome: ${template.reviewOutcome}`,
    `Dispatch Gate: ${template.dispatchGate}`,
    `Settlement Gate: ${template.settlementGate}`,
    `Claims-Sensitive Load: ${template.claimsSensitiveLoad ? "Yes" : "No"}`,
    `Insurance Review Required: ${template.insuranceReviewRequired ? "Yes" : "No"}`,
    `Waiting On: ${template.documentStatus === "ready" ? "None" : "Ops Review Queue"}`,
    `Driver Acknowledgment Received: ${
      template.contextType === "driver" || template.contextType === "dispatch_packet"
        ? "No"
        : "N/A"
    }`,
    `Load Ready Notification Sent: ${
      template.contextType === "load" || template.contextType === "dispatch_packet" ? "No" : "N/A"
    }`,
    `Next Action Required: ${template.escalationReviewBlock}`,
    "",
    `Auto context: Load ${load?.number ?? "N/A"} (${load?.id ?? entityId})`,
    `Auto context: Driver ${driver?.name ?? "N/A"} (${driver?.id ?? driverId})`,
    "",
    "What Does This Document Trigger in BOF?",
    ...template.triggerInBof.map((row, idx) => `${idx + 1}. ${row}`),
  ].join("\n");
}

export function buildTemplateArtifactHtml(
  title: string,
  body: string,
  generatedAt: string,
  template: BofTemplateDefinition
) {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const htmlRows = lines.map((line) => `<p>${line.replace(/</g, "&lt;")}</p>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>
  body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#0f1419;color:#dbe7f3;padding:24px}
  .card{max-width:980px;margin:0 auto;border:1px solid #223041;border-radius:10px;background:#121a23}
  .head{padding:18px 20px;border-bottom:1px solid #223041}.k{font-size:11px;letter-spacing:.08em;color:#5eead4;text-transform:uppercase}
  h1{margin:8px 0 0;font-size:24px}.meta{padding:10px 20px;color:#93a8bd}.body{padding:14px 20px}
  p{margin:0 0 8px 0;padding-bottom:8px;border-bottom:1px solid #1f2b39;font-size:13px}
  </style></head><body><div class="card"><div class="head"><div class="k">BOF Unified Document System</div><h1>${title}</h1></div>
  <div class="meta">Generated ${new Date(generatedAt).toLocaleString()} · Document Type ${
    template.documentType === "generated_autofill_output"
      ? "Generated / Autofill Output"
      : "Editable Template"
  }</div><div class="body">${htmlRows}</div></div></body></html>`;
}
