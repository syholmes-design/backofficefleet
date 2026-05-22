import { NextResponse } from "next/server";
import { LocalPdfProvider } from "@/lib/load-intake/extraction/local-pdf-provider";

export const runtime = "nodejs";

const provider = new LocalPdfProvider();
const configuredProvider = process.env.LOAD_INTAKE_EXTRACTION_PROVIDER || "local";

export async function POST(req: Request) {
  try {
    if (configuredProvider !== "local") {
      return NextResponse.json(
        { error: `Unsupported extraction provider '${configuredProvider}'. Set LOAD_INTAKE_EXTRACTION_PROVIDER=local.` },
        { status: 400 }
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload field `file`." }, { status: 400 });
    }
    const filename = file.name || "upload.pdf";
    const isPdf =
      file.type === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { error: "Unsupported file type. Only PDF uploads are supported right now." },
        { status: 415 }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const result = await provider.extractFromPdf({ filename, bytes });
    if (!result.extractedTextPreview.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. Ensure this is a text-based PDF." },
        { status: 422 }
      );
    }
    if (result.status === "failed") {
      return NextResponse.json({ error: result.warnings.join(" ") || "Extraction failed." }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

