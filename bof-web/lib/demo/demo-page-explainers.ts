export type DemoPageExplainerId =
  | "dashboard"
  | "command-center"
  | "drivers"
  | "documents"
  | "dispatch"
  | "loads"
  | "safety"
  | "settlements"
  | "portals";

export type DemoPageExplainerContent = {
  what: string;
  why: string;
  attention: string;
};

const CARRIER = "Delta Advanced Trucking, Inc.";
const BOF = "BackOfficeFleet (BOF)";

export const DEMO_PAGE_EXPLAINERS: Record<DemoPageExplainerId, DemoPageExplainerContent> = {
  dashboard: {
    what: `${BOF} demo lobby for ${CARRIER}—entry to command center, drivers, dispatch, documents, settlements, and safety.`,
    why: "Owners need one screen that shows where demo work is stacking before opening a workflow.",
    attention: "Open Command Center first for blocked drivers, proof gaps, and settlement holds.",
  },
  "command-center": {
    what: `${BOF} triage for ${CARRIER}: ranked issues with severity, exposure, owner, and next fix.`,
    why: "Keeps dispatch and finance from hunting tabs when pay, compliance, or proof is at risk.",
    attention: "Start with Critical items—proof gaps on active loads and blocked drivers.",
  },
  drivers: {
    what: `Twelve-driver roster in ${BOF} for ${CARRIER}—eligibility, compliance, safety tier, and settlement posture.`,
    why: "Wrong assignments create rework on proof, safety events, and payroll release.",
    attention: "Rows marked Needs Review or Blocked before the next dispatch assignment.",
  },
  documents: {
    what: `${BOF} document library for ${CARRIER}—driver vaults, load packets, templates, and operating records.`,
    why: "Missing or expired files usually stall loads before settlement release.",
    attention: "Vault rows for drivers or loads flagged missing credentials or pending review.",
  },
  dispatch: {
    what: `${BOF} dispatch board for ${CARRIER}—assignments, exceptions, proof chain, settlement readiness.`,
    why: "Seal, POD, and exception status decide if freight stays assignable and payable.",
    attention: "Attention-queue loads with exceptions or pending proof before assigning equipment.",
  },
  loads: {
    what: `${BOF} load list for ${CARRIER}—status, proof posture, and settlement confidence.`,
    why: "Dispatch and finance share this view to see which moves still need documents.",
    attention: "Loads with pending POD, seal mismatch, or dispatch exception flags.",
  },
  safety: {
    what: `${BOF} safety desk for ${CARRIER}—HOS posture, expirations, incidents, and claim-linked events.`,
    why: "Safety items can block dispatch even when driver credentials look current.",
    attention: "At-risk drivers and open events before reassigning the next load.",
  },
  settlements: {
    what: `${BOF} settlements for ${CARRIER}—holds, net pay, deductions, and export readiness.`,
    why: "Drivers expect timely pay; holds usually trace to proof or compliance on linked loads.",
    attention: "Settlements on hold until proof and exceptions on the source load clear.",
  },
  portals: {
    what: `Stakeholder portals for ${CARRIER} via ${BOF}—manager, driver, and customer views.`,
    why: "Each role sees only what they need without full back-office access.",
    attention: "Manager for control tower; driver for assigned work; customer for status and proof.",
  },
};

export function getDemoPageExplainer(id: DemoPageExplainerId): DemoPageExplainerContent {
  return DEMO_PAGE_EXPLAINERS[id];
}
