import pdfParse from "pdf-parse";
import { normalizeLocalLoadText } from "@/lib/load-intake/extraction/normalize-local-load";
import type { ExtractionProvider, LocalExtractionResult } from "@/lib/load-intake/extraction/provider-interface";

export class LocalPdfProvider implements ExtractionProvider {
  async extractFromPdf(args: { filename: string; bytes: Uint8Array }): Promise<LocalExtractionResult> {
    const data = await pdfParse(Buffer.from(args.bytes));
    const text = (data.text || "").trim();
    return normalizeLocalLoadText(text);
  }
}

