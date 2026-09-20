import type { SambaEvidenceRef, SambaStatement } from "@/lib/services/samba/types";

export function renderSambaExplanation(input: {
  whatHappened: string;
  statements: SambaStatement[];
  evidence: SambaEvidenceRef[];
  whyFlagged: string;
  review: string;
  notVerified: string;
}): string {
  const evidenceLines = input.evidence
    .map(
      (row) =>
        `${row.source} ${row.entityType}:${row.entityId} provenance=${row.provenance}${row.freshness ? ` freshness=${row.freshness}` : ""}`,
    )
    .join("; ");
  const classified = input.statements.map((row) => `${row.class} (${row.authority}/${row.provenance}): ${row.text}`).join(" ");
  return [
    input.whatHappened,
    classified,
    `Evidence: ${evidenceLines || "none"}.`,
    input.whyFlagged,
    input.review,
    `Samba did not verify: ${input.notVerified}`,
    "Samba did not change BOF operational records.",
  ].join(" ");
}

export function sambaLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * LLM rendering is integration-dependent and never writes operational state.
 */
export function sambaLlmBoundary() {
  return {
    configured: sambaLlmConfigured(),
    capability: "AI-INTEGRATION-DEPENDENT" as const,
    mayAuthorOperationalState: false as const,
    usedForFindingState: false as const,
  };
}

export function renderSambaContextNarrative(input: {
  whatHappened: string;
  whyItMatters: string;
  whatSupportsThis: string[];
  whatIsNotVerified: string;
  whatToReviewNext: string;
  workflowHref: string | null;
}): string {
  return [
    `WHAT HAPPENED: ${input.whatHappened}`,
    `WHY IT MATTERS: ${input.whyItMatters}`,
    `WHAT SUPPORTS THIS: ${input.whatSupportsThis.join(" ") || "INSUFFICIENT_EVIDENCE"}`,
    `WHAT IS NOT VERIFIED: ${input.whatIsNotVerified}`,
    `WHAT TO REVIEW NEXT: ${input.whatToReviewNext}`,
    `EXISTING BOF WORKFLOW: ${input.workflowHref ?? "none"}`,
    "Samba did not change BOF operational records. Correlation is not causation.",
  ].join(" ");
}
