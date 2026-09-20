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
    mayAuthorOperationalState: false,
    usedForFindingState: false,
  };
}
