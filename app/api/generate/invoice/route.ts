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
  const type = "Invoice";
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
    return NextResponse.json(
      formatError(type, "Unable to generate Invoice document"),
      { status: 500 }
    );
  }

  return NextResponse.json(
    formatDocSuccess(type, doc, {
      loadId: load.id,
      loadNumber: load.number,
      invoiceNumber: getBodyString(body, "invoice_number", "invoiceNumber"),
      rate: getBodyNumber(body, "rate"),
      accessorials: getBodyNumber(body, "accessorials"),
      total: getBodyNumber(body, "total"),
    })
  );
}
