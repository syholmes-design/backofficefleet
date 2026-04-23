import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import { generateLoadDocument } from "@/lib/document-engine";
import {
  formatDocSuccess,
  formatError,
  getBodyString,
  getBodyStringArray,
  resolveLoad,
} from "../_shared";

export async function POST(req: Request) {
  const type = "POD";
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(formatError(type, "Invalid JSON payload"), {
      status: 400,
    });
  }

  const data = getBofData();
  const load = resolveLoad(data, body);
  if (!load) {
    return NextResponse.json(
      formatError(type, "Missing or unknown loadId/load_number"),
      { status: 404 }
    );
  }

  const doc = generateLoadDocument(data, load.id, type);
  if (!doc) {
    return NextResponse.json(formatError(type, "Unable to generate POD document"), {
      status: 500,
    });
  }

  return NextResponse.json(
    formatDocSuccess(type, doc, {
      loadId: load.id,
      loadNumber: load.number,
      deliveryDate: getBodyString(body, "delivery_date", "deliveryDate"),
      receiverName: getBodyString(body, "receiver_name", "receiverName"),
      signaturePhotoUrl: getBodyString(body, "signature_photo_url", "signature_photo"),
      deliveryPhotos: getBodyStringArray(body, "delivery_photos"),
      deliveryLocation: getBodyString(body, "delivery_location", "deliveryLocation"),
    })
  );
}
