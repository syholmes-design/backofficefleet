/**
 * Domain-neutral Copilot types and cause classification.
 * Does not import Dispatch, Safety, Settlement, Load File, or Master Command Center.
 */

export type CopilotClaimClass = "AUTHORITATIVE_FACT" | "DERIVED_INTERPRETATION" | "RECOMMENDATION" | "UNSUPPORTED";
export type CopilotCauseClass = "RECORDED_CAUSE" | "DERIVED_INTERPRETATION" | "CAUSE_NOT_ESTABLISHED";
export type CopilotPriorityBand = "hold_or_block" | "review" | "monitor";
export type CopilotSourceClass = "AUTHORITATIVE" | "DERIVED" | "REFERENCE_DEMO" | "UNSUPPORTED";

export type CopilotScope = {
  loadId?: string | null;
  driverId?: string | null;
  assetId?: string | null;
};

export type CopilotFact = {
  id: string;
  domain: string;
  source: string;
  sourceClass: CopilotSourceClass;
  fact: string;
  causeClass: CopilotCauseClass;
  recordedCause: string;
};

export type CopilotInterpretation = {
  id: string;
  claimClass: "DERIVED_INTERPRETATION";
  text: string;
  basedOnFactIds: string[];
};

export type CopilotConflict = {
  id: string;
  claimClass: "AUTHORITATIVE_FACT";
  sources: Array<{ name: string; authority: string; statement: string }>;
  explanation: string;
  owner: string;
  resolutionLabel: string;
  href?: string;
};

export type CopilotGuidanceItem = {
  id: string;
  claimClass: "RECOMMENDATION";
  source: string;
  fact: string;
  interpretation: string;
  recommendedAction: string;
  workflow: string;
  href: string;
  owner: string;
  derivedPriority: CopilotPriorityBand;
  priorityNote: string;
  executable: false;
};

export type CopilotCrossWorkflow = {
  relationship: string;
  note: string;
  relationshipClass: "AUTHORITATIVE" | "NAVIGATIONAL" | "DERIVED";
};

export type CopilotAdvocateView = {
  domainLabel?: string;
  assignmentProtectionNote?: string;
  triageNote?: string;
  decisionSupport?: CopilotInterpretation[];
  permissionNote: string;
  readOnlyNote: string;
  reasoningNote: string;
  overview: string;
  overviewClass: CopilotClaimClass;
  facts: CopilotFact[];
  interpretations: CopilotInterpretation[];
  conflicts: CopilotConflict[];
  guidance: CopilotGuidanceItem[];
  unsupported: string[];
  crossWorkflow: CopilotCrossWorkflow[];
};

/**
 * Classify cause from an authoritative recorded-cause field vs narrative context.
 * why-it-matters text never qualifies as RECORDED_CAUSE by itself.
 * Timestamps, sequence, and correlation are not accepted as cause evidence.
 */
export function classifyCopilotCause(input: {
  recordedCauseText?: string | null;
  whyItMatters?: string | null;
}): { causeClass: CopilotCauseClass; recordedCause: string } {
  const recorded = String(input.recordedCauseText ?? "").trim();
  if (recorded) {
    return { causeClass: "RECORDED_CAUSE", recordedCause: recorded };
  }
  const why = String(input.whyItMatters ?? "").trim();
  if (why) {
    return {
      causeClass: "DERIVED_INTERPRETATION",
      recordedCause: "Cause is not recorded on the authoritative source. why-it-matters is context, not a recorded cause.",
    };
  }
  return {
    causeClass: "CAUSE_NOT_ESTABLISHED",
    recordedCause: "The authoritative record does not establish a cause.",
  };
}
