import { NextResponse } from "next/server";
import {
  generateClaimDocument,
  listEngineDocumentsForIncident,
} from "@/lib/document-engine";
import { getBofData } from "@/lib/load-bof-data";
import {
  formatDocSuccess,
  formatError,
  getBodyString,
  getBodyStringArray,
  resolveIncident,
} from "../_shared";

export async function POST(req: Request) {
  const type = "Claims";
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(formatError(type, "Invalid JSON payload"), {
      status: 400,
    });
  }

  const data = getBofData();
  const incident = resolveIncident(data, body);
  if (!incident) {
    return NextResponse.json(
      formatError(type, "Missing or unknown incidentId/claim_number/loadId/load_number"),
      { status: 404 }
    );
  }

  const primary = generateClaimDocument(data, incident.incidentId);
  if (!primary) {
    return NextResponse.json(formatError(type, "Unable to generate Claims document"), {
      status: 500,
    });
  }
  const related = listEngineDocumentsForIncident(data, incident.incidentId).map((d) => ({
    type: d.type,
    generatedUrl: d.fileUrl,
    publicUrl: d.previewUrl,
  }));

  return NextResponse.json(
    formatDocSuccess(type, primary, {
      incidentId: incident.incidentId,
      claimNumber: getBodyString(body, "claim_number", "claimNumber"),
      loadId: incident.loadId ?? null,
      description: getBodyString(body, "description"),
      claimPhotos: getBodyStringArray(body, "claim_photos", "claimPhotos"),
      relatedDocuments: related,
    })
  );
}
