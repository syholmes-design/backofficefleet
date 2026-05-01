import type { LocalExtractionResult } from "@/lib/load-intake/extraction/provider-interface";
import { parseLoadText } from "@/lib/load-intake/extraction/parse-load-text";

export function normalizeLocalLoadText(text: string): LocalExtractionResult {
  const parsed = parseLoadText(text);
  const preview = text.slice(0, 3000);
  if (!preview.trim()) {
    return {
      providerName: "local",
      status: "failed",
      confidence: 0,
      normalizedFields: {},
      extractedTextPreview: "",
      warnings: ["No extractable text found in uploaded file."],
      fieldConfidence: {},
    };
  }
  const status =
    parsed.confidence >= 0.75 && parsed.warnings.length === 0
      ? "success"
      : "needs_review";
  return {
    providerName: "local",
    status,
    confidence: Number(parsed.confidence.toFixed(3)),
    normalizedFields: parsed.fields,
    extractedTextPreview: preview,
    warnings: parsed.warnings,
    fieldConfidence: parsed.fieldConfidence,
  };
}

