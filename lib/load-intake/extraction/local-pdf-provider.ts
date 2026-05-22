import { PDFParse } from "pdf-parse";
import { normalizeLocalLoadText } from "@/lib/load-intake/extraction/normalize-local-load";
import type { ExtractionProvider, LocalExtractionResult } from "@/lib/load-intake/extraction/provider-interface";

export class LocalPdfProvider implements ExtractionProvider {
  async extractFromPdf(args: { filename: string; bytes: Uint8Array }): Promise<LocalExtractionResult> {
    const parser = new PDFParse({ data: Buffer.from(args.bytes) });
    try {
      const text = await parser.getText();
      return normalizeLocalLoadText((text.text || "").trim());
    } finally {
      await parser.destroy();
    }
  }
}

