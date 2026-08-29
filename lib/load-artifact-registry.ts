import type { BofData } from "@/lib/load-bof-data";
import {
  buildTripDocumentPacket,
  groupTripPacketRows,
  type TripPacketGroupId,
  type TripPacketRow,
  type TripPacketValidation,
} from "@/lib/load-trip-packet";

export type LoadArtifactKind = "document" | "photo" | "proof" | "workflow";

export type LoadPacketRole = "driver" | "dispatcher" | "manager" | "customer";

export type LoadPacketCategory =
  | "must_sign"
  | "preparedness"
  | "shipper_customer"
  | "equipment"
  | "route_ops"
  | "post_trip"
  | "billing_settlement"
  | "owner_financial"
  | "exceptions";

export type LoadPacketCriticality = "pretrip" | "en_route" | "post_trip" | "informational";

export type LoadArtifact = {
  key: string;
  loadId: string;
  label: string;
  group: TripPacketGroupId;
  groupLabel: string;
  kind: LoadArtifactKind;
  status: TripPacketRow["status"];
  canonicalUrl?: string;
  actionUrl: string;
  actionLabel: string;
  note?: string;
  sourceLabel: string;
  requiredForSettlementRelease: boolean;
  requiredForClaimRelease?: boolean;
  isReady: boolean;
};

export type LoadPacketItem = {
  key: string;
  loadId: string;
  title: string;
  description: string;
  category: LoadPacketCategory;
  criticality: LoadPacketCriticality;
  kind: LoadArtifactKind | "financial" | "signature" | "operations";
  visibility: LoadPacketRole[];
  signatureRequiredBy: LoadPacketRole[];
  informationalOnly?: boolean;
  status: TripPacketRow["status"] | "ready";
  sourceLabel: string;
  canonicalUrl?: string;
  actionUrl: string;
  actionLabel: string;
  requiredForSettlementRelease: boolean;
  requiredForClaimRelease?: boolean;
  artifact?: LoadArtifact;
};

export type LoadPacketRegistry = {
  loadId: string;
  load: {
    loadId: string;
    loadNumber: string;
    status: string;
    driverId: string;
    driverName: string;
    customerName: string;
    lane: string;
  };
  validation: TripPacketValidation;
  artifacts: LoadArtifact[];
  packetItems: LoadPacketItem[];
  packetItemsByKey: Record<string, LoadPacketItem>;
};

export type LoadArtifactPacket = {
  loadId: string;
  validation: TripPacketValidation;
  artifacts: LoadArtifact[];
  groups: { group: TripPacketGroupId; label: string; artifacts: LoadArtifact[] }[];
};

export const LOAD_PACKET_ROLES: Array<{
  role: LoadPacketRole;
  label: string;
  description: string;
}> = [
  {
    role: "driver",
    label: "Driver",
    description:
      "Signs required trip documents, confirms equipment and cargo readiness, and returns bad documents before departure.",
  },
  {
    role: "dispatcher",
    label: "Dispatcher",
    description:
      "Assembles the trip packet, verifies required proof, releases the driver, and corrects rejected items.",
  },
  {
    role: "manager",
    label: "Manager / fleet owner",
    description:
      "Sees the full operating record, profitability, settlement exposure, factoring readiness, holds, drivers, and equipment.",
  },
  {
    role: "customer",
    label: "Customer",
    description:
      "Sees shipment documents, proof, exceptions, invoices, and customer signature items without internal pay or margin data.",
  },
];

export const LOAD_PACKET_CATEGORIES: Array<{ category: LoadPacketCategory; label: string }> = [
  { category: "must_sign", label: "Must sign" },
  { category: "preparedness", label: "Trip preparedness" },
  { category: "shipper_customer", label: "Customer / shipper documents" },
  { category: "equipment", label: "Equipment & inspection" },
  { category: "route_ops", label: "Fuel / route / HOS" },
  { category: "post_trip", label: "Post-trip proof" },
  { category: "billing_settlement", label: "Billing & settlement" },
  { category: "owner_financial", label: "Owner financial review" },
  { category: "exceptions", label: "Exceptions / holds / claims" },
];

const ALL_ROLES: LoadPacketRole[] = ["driver", "dispatcher", "manager", "customer"];
const OPS_ROLES: LoadPacketRole[] = ["driver", "dispatcher", "manager"];
const INTERNAL_ROLES: LoadPacketRole[] = ["dispatcher", "manager"];
const OWNER_ONLY: LoadPacketRole[] = ["manager"];
const CUSTOMER_OPS: LoadPacketRole[] = ["dispatcher", "manager", "customer"];

type PacketRule = Pick<
  LoadPacketItem,
  "title" | "description" | "category" | "criticality" | "visibility" | "signatureRequiredBy"
> &
  Partial<Pick<LoadPacketItem, "informationalOnly">>;

const PACKET_RULES: Record<string, PacketRule> = {
  rate_confirmation: {
    title: "Rate confirmation",
    description: "Commercial terms, lane, pickup/delivery requirements, rate, and accessorial rules.",
    category: "shipper_customer",
    criticality: "pretrip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  work_order: {
    title: "Dispatch work order",
    description: "Dispatch instructions, route notes, equipment assignment, and driver operating instructions.",
    category: "preparedness",
    criticality: "pretrip",
    visibility: OPS_ROLES,
    signatureRequiredBy: ["dispatcher", "driver"],
  },
  bol: {
    title: "Bill of lading",
    description: "Shipment identity, commodity, quantity, shipper requirements, and final signed freight record.",
    category: "shipper_customer",
    criticality: "pretrip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["dispatcher", "driver", "customer"],
  },
  pod: {
    title: "Proof of delivery",
    description: "Receiver-signed proof needed for customer billing, driver pay, factoring, and claims defense.",
    category: "post_trip",
    criticality: "post_trip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["driver", "customer"],
  },
  invoice: {
    title: "Customer invoice",
    description: "Billing document matched against rate confirmation, POD, and accessorial backup.",
    category: "billing_settlement",
    criticality: "post_trip",
    visibility: CUSTOMER_OPS,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  pickup_photo: {
    title: "Pickup facility photo",
    description: "Pickup location proof and facility context before loading.",
    category: "preparedness",
    criticality: "pretrip",
    visibility: ALL_ROLES,
    signatureRequiredBy: [],
  },
  cargo_photo: {
    title: "Pre-trip cargo photo",
    description: "Cargo condition, count, securement, and visible loading state before departure.",
    category: "preparedness",
    criticality: "pretrip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["driver"],
  },
  seal_pickup_photo: {
    title: "Pickup seal proof",
    description: "Pickup seal number and photo before the driver leaves shipper custody.",
    category: "equipment",
    criticality: "pretrip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["driver", "dispatcher"],
  },
  seal_delivery_photo: {
    title: "Delivery seal proof",
    description: "Delivery seal number and receiver-side seal condition for proof-chain continuity.",
    category: "post_trip",
    criticality: "post_trip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["driver", "dispatcher"],
  },
  delivery_empty_trailer: {
    title: "Delivery / empty-trailer proof",
    description: "Receiver-side cargo closeout, empty trailer proof, and delivery condition record.",
    category: "post_trip",
    criticality: "post_trip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["driver"],
  },
  rfid_geo: {
    title: "RFID / telematics proof",
    description: "RFID and geofence trail for location, custody, and proof-chain continuity.",
    category: "route_ops",
    criticality: "en_route",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: [],
    informationalOnly: true,
  },
  proof_card_composite: {
    title: "Proof packet preview",
    description:
      "Visual proof-card summary for quick review; individual BOL, POD, rate, seal, cargo, RFID, and closeout records remain available.",
    category: "shipper_customer",
    criticality: "informational",
    visibility: ALL_ROLES,
    signatureRequiredBy: [],
    informationalOnly: true,
  },
  lumper_receipt: {
    title: "QR lumper closeout",
    description: "Trailer QR authorization, dock/empty-trailer proof, and BOF payment support for lumper or accessorial settlement.",
    category: "post_trip",
    criticality: "post_trip",
    visibility: ALL_ROLES,
    signatureRequiredBy: ["dispatcher"],
  },
  factoring_notification: {
    title: "Factoring packet",
    description: "Funding-ready packet for invoice, POD, BOL, rate confirmation, accessorials, and exception support.",
    category: "billing_settlement",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  settlement_hold_notice: {
    title: "Settlement hold notice",
    description: "Internal driver-pay hold tied to missing proof, safety, claim, or compliance issue.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  claim_intake: {
    title: "Claim intake",
    description: "Initial claim facts, involved parties, damages, amount at risk, and insurance escalation status.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  claim_packet: {
    title: "Claim proof packet",
    description: "Claim backup package with proof, photos, driver statement, carrier docs, and escalation notes.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  damage_photo_packet: {
    title: "Damage photo packet",
    description: "Cargo, seal, trailer, or incident photos tied to a claim or insurance escalation.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher", "manager"],
  },
  insurance_notification: {
    title: "Insurance notice",
    description: "Carrier/insurance notification for potential cargo, liability, or safety exposure.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["manager"],
  },
  seal_mismatch_photo: {
    title: "Seal mismatch photo",
    description: "Exception photo that supports seal discrepancy review and claim defense.",
    category: "exceptions",
    criticality: "post_trip",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: ["dispatcher"],
  },
  master_agreement_reference: {
    title: "Delta Advanced Trucking, Inc. Master Services Agreement",
    description: "Executed customer operating agreement for shipment terms, payment rules, claims, insurance, and dispute support.",
    category: "shipper_customer",
    criticality: "informational",
    visibility: INTERNAL_ROLES,
    signatureRequiredBy: [],
    informationalOnly: true,
  },
};

const PHOTO_KEYS = new Set([
  "pickup_photo",
  "cargo_photo",
  "seal_pickup_photo",
  "seal_delivery_photo",
  "delivery_empty_trailer",
  "proof_card_composite",
  "damage_photo_packet",
  "seal_mismatch_photo",
]);

const GENERATED_DOCUMENT_KEYS = new Set([
  "rate_confirmation",
  "work_order",
  "bol",
  "pod",
  "invoice",
  "claim_intake",
  "claim_packet",
  "insurance_notification",
  "settlement_hold_notice",
  "factoring_notification",
  "master_agreement_reference",
]);

function artifactKind(row: TripPacketRow): LoadArtifactKind {
  if (PHOTO_KEYS.has(row.key)) return "photo";
  if (row.key === "rfid_geo") return "proof";
  if (GENERATED_DOCUMENT_KEYS.has(row.key)) return "document";
  return "workflow";
}

function actionLabel(row: TripPacketRow, kind: LoadArtifactKind) {
  if (row.status === "ready" && row.url) {
    if (kind === "photo") return "Open photo";
    if (kind === "proof") return "Open proof";
    return "Open document";
  }
  if (row.status === "pending") return "Review pending item";
  if (row.status === "not_applicable") return "View context";
  return "Resolve this item";
}

function sourceLabel(row: TripPacketRow) {
  if (!row.source || row.source === "missing") return "No file on record";
  if (row.source === "real" || row.source === "actual_docs" || row.source === "manual_upload") return "Source file attached";
  if (row.source === "ai_generated") return "Evidence preview attached";
  if (row.source === "svg_demo" || row.source === "generated") return "Operating document attached";
  if (row.source === "rfid") return "RFID / telematics record";
  return "Registered artifact";
}

function workflowUrl(loadId: string, row: TripPacketRow) {
  if (row.group === "exceptions") return `/trip-release/${loadId}#artifact-${row.key}`;
  if (row.group === "reference") return `/loads/${loadId}#artifact-${row.key}`;
  return `/pretrip/${loadId}#artifact-${row.key}`;
}

function toArtifact(loadId: string, groupLabel: string, row: TripPacketRow): LoadArtifact {
  const kind = artifactKind(row);
  const canonicalUrl = row.url?.trim() || undefined;
  const readyWithUrl = row.status === "ready" && Boolean(canonicalUrl);
  return {
    key: row.key,
    loadId,
    label: row.label,
    group: row.group,
    groupLabel,
    kind,
    status: row.status,
    canonicalUrl,
    actionUrl: readyWithUrl ? canonicalUrl! : workflowUrl(loadId, row),
    actionLabel: actionLabel(row, kind),
    note: row.note,
    sourceLabel: sourceLabel(row),
    requiredForSettlementRelease: row.requiredForSettlementRelease,
    requiredForClaimRelease: row.requiredForClaimRelease,
    isReady: readyWithUrl || row.status === "not_applicable",
  };
}

function defaultPacketRule(artifact: LoadArtifact): PacketRule {
  const postTripKeys = new Set(["pod", "seal_delivery_photo", "delivery_empty_trailer", "invoice"]);
  return {
    title: artifact.label,
    description: artifact.note ?? "Registered trip packet document or proof record.",
    category: artifact.group === "exceptions" ? "exceptions" : "preparedness",
    criticality: artifact.group === "exceptions" || postTripKeys.has(artifact.key) ? "post_trip" : "pretrip",
    visibility: OPS_ROLES,
    signatureRequiredBy: [],
  };
}

function toPacketItem(loadId: string, artifact: LoadArtifact): LoadPacketItem {
  const rule = { ...defaultPacketRule(artifact), ...PACKET_RULES[artifact.key] };
  return {
    key: artifact.key,
    loadId,
    title: artifact.key === "proof_card_composite" ? artifact.label : rule.title,
    description: rule.description,
    category: rule.category,
    criticality: rule.criticality,
    kind: artifact.kind,
    visibility: rule.visibility,
    signatureRequiredBy: rule.signatureRequiredBy,
    informationalOnly: rule.informationalOnly,
    status: artifact.status,
    sourceLabel: artifact.sourceLabel,
    canonicalUrl: artifact.canonicalUrl,
    actionUrl: artifact.actionUrl,
    actionLabel: artifact.actionLabel,
    requiredForSettlementRelease: artifact.requiredForSettlementRelease,
    requiredForClaimRelease: artifact.requiredForClaimRelease,
    artifact,
  };
}

function syntheticPacketItem(
  loadId: string,
  item: Omit<LoadPacketItem, "loadId" | "status" | "sourceLabel" | "actionUrl" | "actionLabel" | "requiredForSettlementRelease">
): LoadPacketItem {
  return {
    ...item,
    loadId,
    status: "ready",
    sourceLabel: "Operational workspace",
    actionUrl: item.canonicalUrl ?? `/loads/${loadId}`,
    actionLabel: "Open workspace",
    requiredForSettlementRelease: false,
  };
}

function syntheticPacketItems(data: BofData, loadId: string): LoadPacketItem[] {
  const load = data.loads.find((row) => row.id === loadId);
  const driver = data.drivers?.find((row) => row.id === load?.driverId);
  const settlement = data.settlements?.find((row) => row.driverId === load?.driverId);
  const backhaulHref = `/dispatch?loadId=${loadId}#backhaul-opportunities`;
  const settlementHref = load ? `/drivers/${load.driverId}/settlements` : "/settlements";
  const driverLabel = driver ? ` for ${driver.name}` : settlement ? ` for ${settlement.driverId}` : "";

  return [
    syntheticPacketItem(loadId, {
      key: "truck_inspection",
      title: "Truck and trailer inspection",
      description: "Driver walk-around, tire, light, brake, trailer, and visible equipment condition before departure.",
      category: "equipment",
      criticality: "pretrip",
      kind: "operations",
      visibility: OPS_ROLES,
      signatureRequiredBy: ["driver"],
      canonicalUrl: `/pretrip/${loadId}#inspection`,
    }),
    syntheticPacketItem(loadId, {
      key: "fuel_level",
      title: "Fuel level and diesel plan",
      description: "Starting fuel level, planned diesel stops, fuel-card posture, and route cost awareness.",
      category: "route_ops",
      criticality: "pretrip",
      kind: "operations",
      visibility: OPS_ROLES,
      signatureRequiredBy: ["driver"],
      canonicalUrl: `/trip-release/${loadId}#fuel-plan`,
    }),
    syntheticPacketItem(loadId, {
      key: "traffic_weather_hos",
      title: "Traffic, weather, HOS, and rest stops",
      description: "En-route operating plan for traffic, weather, available hours, rest stops, and route exceptions.",
      category: "route_ops",
      criticality: "en_route",
      kind: "operations",
      visibility: OPS_ROLES,
      signatureRequiredBy: [],
      canonicalUrl: `/trip-release/${loadId}#route-plan`,
    }),
    syntheticPacketItem(loadId, {
      key: "profitability_review",
      title: "Owner profitability review",
      description: `Internal margin view for revenue, driver pay, deductions, fuel, accessorials, and settlement impact${driverLabel}.`,
      category: "owner_financial",
      criticality: "informational",
      kind: "financial",
      visibility: OWNER_ONLY,
      signatureRequiredBy: ["manager"],
      canonicalUrl: settlementHref,
    }),
    syntheticPacketItem(loadId, {
      key: "other_driver_holds",
      title: "Fleet readiness and driver holds",
      description: "Dispatch and owner view of other driver holds, preparedness gaps, available drivers, and available equipment.",
      category: "owner_financial",
      criticality: "informational",
      kind: "operations",
      visibility: INTERNAL_ROLES,
      signatureRequiredBy: [],
      canonicalUrl: "/dispatch",
    }),
    syntheticPacketItem(loadId, {
      key: "backhaul_opportunity",
      title: "Backhaul opportunity",
      description: "Post-delivery reload fit, empty miles, rate opportunity, and operational recommendation.",
      category: "post_trip",
      criticality: "post_trip",
      kind: "financial",
      visibility: OWNER_ONLY,
      signatureRequiredBy: ["manager"],
      canonicalUrl: backhaulHref,
    }),
    syntheticPacketItem(loadId, {
      key: "customer_delivery_signoff",
      title: "Customer delivery signoff",
      description: "Receiver/customer signoff confirming delivery, exceptions, cargo condition, and required billing proof.",
      category: "must_sign",
      criticality: "post_trip",
      kind: "signature",
      visibility: CUSTOMER_OPS,
      signatureRequiredBy: ["customer"],
      canonicalUrl: `/loads/${loadId}`,
    }),
  ];
}

export function buildLoadArtifactPacket(data: BofData, loadId: string): LoadArtifactPacket | null {
  const trip = buildTripDocumentPacket(data, loadId);
  if (!trip) return null;

  const groups = groupTripPacketRows(trip, { hideNotApplicable: false }).map((group) => ({
    group: group.group,
    label: group.label,
    artifacts: group.rows.map((row) => toArtifact(loadId, group.label, row)),
  }));

  return {
    loadId,
    validation: trip.validation,
    artifacts: groups.flatMap((group) => group.artifacts),
    groups,
  };
}

export function buildLoadPacketRegistry(data: BofData, loadId: string): LoadPacketRegistry | null {
  const artifactPacket = buildLoadArtifactPacket(data, loadId);
  const load = data.loads.find((row) => row.id === loadId);
  if (!artifactPacket || !load) return null;

  const driver = data.drivers.find((row) => row.id === load.driverId);
  const packetItems = [
    ...artifactPacket.artifacts.map((artifact) => toPacketItem(loadId, artifact)),
    ...syntheticPacketItems(data, loadId),
  ];

  return {
    loadId,
    load: {
      loadId,
      loadNumber: load.number,
      status: load.status,
      driverId: load.driverId,
      driverName: driver?.name ?? load.driverId,
      customerName: load.customerName,
      lane: `${load.origin} to ${load.destination}`,
    },
    validation: artifactPacket.validation,
    artifacts: artifactPacket.artifacts,
    packetItems,
    packetItemsByKey: Object.fromEntries(packetItems.map((item) => [item.key, item])),
  };
}

export function getLoadPacketItem(data: BofData, loadId: string, key: string): LoadPacketItem | undefined {
  return buildLoadPacketRegistry(data, loadId)?.packetItemsByKey[key];
}

export function getLoadPacketItemActionUrl(data: BofData, loadId: string, key: string, fallback: string) {
  return getLoadPacketItem(data, loadId, key)?.actionUrl ?? fallback;
}

export function getLoadArtifact(data: BofData, loadId: string, key: string): LoadArtifact | undefined {
  return buildLoadArtifactPacket(data, loadId)?.artifacts.find((artifact) => artifact.key === key);
}

export function getLoadArtifactActionUrl(data: BofData, loadId: string, key: string, fallback: string) {
  return getLoadArtifact(data, loadId, key)?.actionUrl ?? fallback;
}
