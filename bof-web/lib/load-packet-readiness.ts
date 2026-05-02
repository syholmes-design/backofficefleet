import type { BofData } from "./load-bof-data";
import { buildTripDocumentPacket } from "./load-trip-packet";
import type { TripPacketRow } from "./load-trip-packet";

export type PacketType = "shipper" | "billing" | "insurance" | "claim";

export type PacketReadinessStatus =
  | "ready"
  | "missing_required"
  | "not_applicable"
  | "needs_review";

export type PacketReadinessResult = {
  packetType: PacketType;
  status: PacketReadinessStatus;
  requiredItems: string[];
  readyItems: string[];
  missingItems: string[];
  outputUrl?: string;
  recommendedAction: string;
};

function rowReady(row: TripPacketRow): boolean {
  return row.status === "ready" && Boolean(String(row.url ?? "").trim());
}

function rowByKey(rows: TripPacketRow[], key: string): TripPacketRow | undefined {
  return rows.find((r) => r.key === key);
}

function evalGroup(
  packetType: PacketType,
  rows: TripPacketRow[],
  keys: string[],
  outputUrl: string | undefined,
  notApplicable: boolean,
  notApplicableReason: string
): PacketReadinessResult {
  if (notApplicable) {
    return {
      packetType,
      status: "not_applicable",
      requiredItems: [],
      readyItems: [],
      missingItems: [],
      recommendedAction: notApplicableReason,
    };
  }
  const requiredItems: string[] = [];
  const readyItems: string[] = [];
  const missingItems: string[] = [];
  for (const key of keys) {
    const row = rowByKey(rows, key);
    if (!row || row.status === "not_applicable") continue;
    requiredItems.push(row.label);
    if (rowReady(row)) readyItems.push(row.label);
    else missingItems.push(row.label);
  }
  const status: PacketReadinessStatus =
    missingItems.length === 0 ? "ready" : "missing_required";
  const recommendedAction =
    status === "ready"
      ? `Open ${packetType} packet index to review linked documents.`
      : `Add or generate: ${missingItems.join("; ")}.`;
  return {
    packetType,
    status,
    requiredItems,
    readyItems,
    missingItems,
    outputUrl: status === "ready" ? outputUrl : undefined,
    recommendedAction,
  };
}

function claimApplicableFromRows(rows: TripPacketRow[]): boolean {
  const claimIntake = rowByKey(rows, "claim_intake");
  return claimIntake != null && claimIntake.status !== "not_applicable";
}

function sealMismatchApplicable(rows: TripPacketRow[]): boolean {
  const sm = rowByKey(rows, "seal_mismatch_photo");
  return sm != null && sm.status !== "not_applicable";
}

/**
 * Manifest-backed readiness for shipper, billing, insurance, and claim packet bundles.
 * Uses the same trip packet rows as the load detail / proof UI (`buildTripDocumentPacket`).
 */
export function evaluateLoadPacketReadiness(
  data: BofData,
  loadId: string
): PacketReadinessResult[] {
  const trip = buildTripDocumentPacket(data, loadId);
  if (!trip) {
    return [
      {
        packetType: "shipper",
        status: "needs_review",
        requiredItems: [],
        readyItems: [],
        missingItems: ["Load record"],
        recommendedAction: "Load not found in demo data.",
      },
    ];
  }
  const rows = trip.rows;
  const id = trip.loadId;
  const base = `/generated/loads/${id}`;
  const claimOk = claimApplicableFromRows(rows);
  const mismatch = sealMismatchApplicable(rows);

  const shipperKeys = [
    "rate_confirmation",
    "work_order",
    "bol",
    "pod",
    "pickup_photo",
    "cargo_photo",
    "seal_pickup_photo",
    "seal_delivery_photo",
    "delivery_empty_trailer",
  ];

  const billingKeys = ["invoice", "bol", "pod"];
  const lumper = rowByKey(rows, "lumper_receipt");
  if (lumper && lumper.status !== "not_applicable") {
    billingKeys.push("lumper_receipt");
  }

  const insuranceKeys = [
    "claim_intake",
    "claim_packet",
    "damage_photo_packet",
    "insurance_notification",
    "pod",
    "bol",
  ];
  if (mismatch) insuranceKeys.push("seal_mismatch_photo");

  const claimKeys = [
    "claim_intake",
    "claim_packet",
    "damage_photo_packet",
    "pickup_photo",
    "cargo_photo",
    "insurance_notification",
  ];
  if (mismatch) claimKeys.push("seal_mismatch_photo");

  const shipper = evalGroup(
    "shipper",
    rows,
    shipperKeys,
    `${base}/shipper-packet.html`,
    false,
    ""
  );
  const billing = evalGroup(
    "billing",
    rows,
    billingKeys,
    `${base}/billing-packet.html`,
    false,
    ""
  );
  const insurance = evalGroup(
    "insurance",
    rows,
    insuranceKeys,
    `${base}/insurance-packet.html`,
    !claimOk,
    "No active claim / exception workflow for this load."
  );
  const claim = evalGroup(
    "claim",
    rows,
    claimKeys,
    `${base}/claim-packet-bundle.html`,
    !claimOk,
    "No active claim / exception workflow for this load."
  );

  return [shipper, billing, insurance, claim];
}
