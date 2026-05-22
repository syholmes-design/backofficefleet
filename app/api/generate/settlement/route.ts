import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import {
  generateSettlementDocument,
  type SettlementDocKind,
} from "@/lib/document-engine";
import {
  formatDocSuccess,
  formatError,
  getBodyNumber,
  getBodyString,
  resolveSettlement,
} from "../_shared";

const SETTLEMENT_KIND_MAP: Record<string, SettlementDocKind> = {
  summary: "Settlement Summary",
  hold: "Settlement Hold Explanation",
  insurance: "Insurance Notice",
};

export async function POST(req: Request) {
  const type = "Settlement";
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(formatError(type, "Invalid JSON payload"), {
      status: 400,
    });
  }

  const data = getBofData();
  const settlement = resolveSettlement(data, body);
  if (!settlement) {
    return NextResponse.json(
      formatError(type, "Missing or unknown settlementId/loadId/load_number"),
      { status: 404 }
    );
  }

  const kindRaw = getBodyString(body, "kind", "documentKind")?.toLowerCase();
  const kind = (kindRaw ? SETTLEMENT_KIND_MAP[kindRaw] : undefined) ?? "Settlement Summary";
  const doc = generateSettlementDocument(data, settlement.settlementId, kind);
  if (!doc) {
    return NextResponse.json(
      formatError(type, "Unable to generate Settlement document"),
      { status: 500 }
    );
  }

  return NextResponse.json(
    formatDocSuccess(type, doc, {
      settlementId: settlement.settlementId,
      driverId: settlement.driverId,
      driverName: getBodyString(body, "driver_name", "driverName"),
      gross: getBodyNumber(body, "gross"),
      deductions: getBodyNumber(body, "deductions"),
      net: getBodyNumber(body, "net"),
      settlementStatus: getBodyString(body, "settlement_status", "settlementStatus"),
      settlementHoldInfo: getBodyString(
        body,
        "settlement_hold_info",
        "settlementHoldInfo"
      ),
      kind,
    })
  );
}
