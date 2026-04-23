import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import { generateLoadDocument } from "@/lib/document-engine";
import {
  formatDocSuccess,
  formatError,
  getBodyNumber,
  getBodyString,
  resolveLoad,
} from "../_shared";

export async function POST(req: Request) {
  const type = "BOL";
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
    return NextResponse.json(formatError(type, "Unable to generate BOL document"), {
      status: 500,
    });
  }

  return NextResponse.json(
    formatDocSuccess(type, doc, {
      loadId: load.id,
      loadNumber: load.number,
      bolDate: getBodyString(body, "bol_date", "bolDate"),
      shipperName: getBodyString(body, "shipper_name", "shipperName"),
      consigneeName: getBodyString(body, "consignee_name", "consigneeName"),
      commodity: getBodyString(body, "commodity"),
      weight: getBodyNumber(body, "weight"),
    })
  );
}
