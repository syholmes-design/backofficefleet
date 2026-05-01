import type { BofData } from "@/lib/load-bof-data";
import type { IntakeWizardState, LoadRequirement } from "@/lib/load-requirements-intake-types";
import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";

export type IntakeCanonicalLoad = {
  loadId: string;
  customerName: string;
  driverId: string;
  driverName: string;
  pickupFacility: string;
  pickupAddress: string;
  pickupAt: string;
  deliveryFacility: string;
  deliveryAddress: string;
  deliveryAt: string;
  commodity: string;
  weight: number;
  pieces: number;
  equipmentType: string;
  rate: number;
  status: "scheduled" | "dispatched" | "in_transit" | "delivered";
  settlementStatus: "Pending" | "Ready" | "Released";
  proofStatus: "Pending" | "Complete";
  documentStatus: "Pending Generation" | "Ready";
  claimStatus: "Open" | "None";
  sealNumber: string;
  invoiceNumber: string;
  bolNumber: string;
};

type NormalizeResult = {
  canonical: IntakeCanonicalLoad;
  bofLoad: BofData["loads"][number];
  loadProofBundle: {
    claimApplicable?: boolean;
    items?: Record<string, Record<string, unknown>>;
  };
};

function nowIsoMinute() {
  return new Date().toISOString().slice(0, 16);
}

function parseStatus(raw?: string): IntakeCanonicalLoad["status"] {
  if (raw === "dispatched" || raw === "in_transit" || raw === "delivered") return raw;
  return "scheduled";
}

function nextLoadId(data: BofData): string {
  const max = data.loads.reduce((m, l) => {
    const n = Number(String(l.id).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `L${String(max + 1).padStart(3, "0")}`;
}

function defaultLoadNumber(loadId: string): string {
  const n = Number(String(loadId).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "500";
  return String(500 + n);
}

function appointmentOrFallback(value?: string) {
  return value?.trim() ? value.trim() : nowIsoMinute();
}

export function normalizeLoadIntakeForm(
  state: IntakeWizardState,
  data: BofData,
  intakeRecord?: Partial<LoadIntakeRecord>
): NormalizeResult {
  const req: LoadRequirement = state.loadRequirement;
  const driverId = req.assigned_driver_id?.trim() || "UNASSIGNED";
  const driverName =
    data.drivers.find((d) => d.id === driverId)?.name ??
    (driverId === "UNASSIGNED" ? "Unassigned" : driverId);
  const loadId = req.load_id_input?.trim() || nextLoadId(data);
  const status = parseStatus(req.intake_status);
  const pickupAt = appointmentOrFallback(req.pickup_at || state.compliance.appointment_window_start);
  const deliveryAt = appointmentOrFallback(req.delivery_at || state.compliance.appointment_window_end);
  const rate = Number(req.rate_linehaul ?? 0);
  const backhaulPay = Number(req.backhaul_pay ?? 0);
  const bolNumber = req.bol_number?.trim() || `BOL-${loadId}`;
  const invoiceNumber = req.invoice_number?.trim() || `INV-${loadId}`;
  const sealNumber = req.seal_number?.trim() || "";
  const claim = Boolean(req.claim_damage_flag);

  const canonical: IntakeCanonicalLoad = {
    loadId,
    customerName: state.shipper.shipper_name.trim(),
    driverId,
    driverName,
    pickupFacility: state.facility.facility_name.trim(),
    pickupAddress: [
      state.facility.address.trim(),
      state.facility.city.trim(),
      state.facility.state.trim(),
      (state.facility.zip || "").trim(),
    ]
      .filter(Boolean)
      .join(", "),
    pickupAt,
    deliveryFacility: (req.destination_facility_name || "").trim(),
    deliveryAddress: [
      (req.destination_address || "").trim(),
      (req.destination_city || "").trim(),
      (req.destination_state || "").trim(),
      (req.destination_zip || "").trim(),
    ]
      .filter(Boolean)
      .join(", "),
    deliveryAt,
    commodity: req.commodity.trim(),
    weight: Number(req.weight || 0),
    pieces: Number(req.piece_count || req.pallet_count || 0),
    equipmentType: req.equipment_type.trim(),
    rate,
    status,
    settlementStatus: "Pending",
    proofStatus: "Pending",
    documentStatus: "Pending Generation",
    claimStatus: claim ? "Open" : "None",
    sealNumber,
    invoiceNumber,
    bolNumber,
  };

  const statusMap: Record<IntakeCanonicalLoad["status"], BofData["loads"][number]["status"]> = {
    scheduled: "Pending",
    dispatched: "Pending",
    in_transit: "En Route",
    delivered: "Delivered",
  };

  const bofLoad = {
    id: canonical.loadId,
    number: defaultLoadNumber(canonical.loadId),
    driverId: canonical.driverId,
    assetId: req.truck_id?.trim() || "UNASSIGNED",
    origin: `${canonical.pickupFacility} - ${state.facility.city}, ${state.facility.state}`,
    destination: `${canonical.deliveryFacility || "Destination TBD"} - ${req.destination_city || "TBD"}, ${req.destination_state || "TBD"}`,
    revenue: canonical.rate,
    backhaulPay,
    status: statusMap[canonical.status],
    podStatus: "Pending",
    pickupSeal: canonical.sealNumber || "",
    deliverySeal: "",
    sealStatus: canonical.sealNumber ? "Pending" : "Missing",
    dispatchExceptionFlag: claim,
    dispatchOpsNotes: [
      `Intake generated load from ${state.loadRequirement.load_requirement_id}.`,
      req.special_handling?.trim() ? `Special handling: ${req.special_handling.trim()}` : "",
      canonical.documentStatus === "Pending Generation"
        ? "Pending generation — run npm run generate:load-docs && npm run generate:load-evidence."
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    intakeStatus: canonical.status,
    pickupAt: canonical.pickupAt,
    deliveryAt: canonical.deliveryAt,
    customerName: canonical.customerName,
    driverName: canonical.driverName,
    commodity: canonical.commodity,
    weight: canonical.weight,
    pieces: canonical.pieces,
    equipmentType: canonical.equipmentType,
    settlementStatus: canonical.settlementStatus,
    proofStatus: canonical.proofStatus,
    documentStatus: canonical.documentStatus,
    claimStatus: canonical.claimStatus,
    sealNumber: canonical.sealNumber,
    invoiceNumber: canonical.invoiceNumber,
    bolNumber: canonical.bolNumber,
    intakeSourceType: intakeRecord?.sourceType ?? "manual",
    intakeSourceDocumentUrl: intakeRecord?.sourceDocumentUrl,
    extractionProvider: intakeRecord?.extractionProvider,
    extractionConfidence: intakeRecord?.extractionConfidence,
    extractionWarnings: intakeRecord?.extractionWarnings,
    reviewedAt: intakeRecord?.reviewedAt,
    reviewedBy: intakeRecord?.reviewedBy,
  } as BofData["loads"][number];

  const loadProofBundle: NormalizeResult["loadProofBundle"] = {
    claimApplicable: claim,
    items: {
      "Rate Confirmation": { status: "Pending", notes: "Pending generation from intake." },
      BOL: { status: "Pending", notes: "Pending generation from intake." },
      POD: { status: "Pending", blocksPayment: true, notes: "Pending POD capture." },
      Invoice: { status: "Pending", notes: "Pending generation from intake." },
      "Pre-Trip Cargo Photo": { status: "Pending", notes: "Pending capture." },
      "Pickup Seal Photo": { status: "Pending", notes: "Pending pickup evidence." },
      "Delivery Seal Photo": { status: "Pending", notes: "Pending delivery evidence." },
      "Delivery / Empty-Trailer Photo": { status: "Pending", notes: "Pending delivery photo." },
      "RFID / Dock Validation Record": {
        status: req.rfid_proof_required ? "Pending" : "Not required",
        notes: req.rfid_proof_required ? "RFID workflow required by intake." : "Not required.",
      },
    },
  };

  return { canonical, bofLoad, loadProofBundle };
}

