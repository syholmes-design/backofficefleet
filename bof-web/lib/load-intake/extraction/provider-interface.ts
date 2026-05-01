import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";

export type LocalExtractionResult = {
  providerName: "local";
  status: "success" | "needs_review" | "failed";
  confidence: number;
  normalizedFields: Partial<LoadIntakeRecord>;
  extractedTextPreview: string;
  warnings: string[];
  fieldConfidence: Record<string, number>;
};

export type ExtractionProvider = {
  extractFromPdf(args: { filename: string; bytes: Uint8Array }): Promise<LocalExtractionResult>;
};

