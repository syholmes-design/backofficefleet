/**
 * Driver Trip Release - aggregates BOF dispatch packet, driver credentials,
 * equipment seed rows, and pre-trip tablet model into a single go / no-go evaluation.
 * All inputs come from existing BofData + dispatch seed mappers; no load fields.
 */
import type { BofData } from "./load-bof-data";
import type { Driver, Load, Trailer, Tractor } from "@/types/dispatch";
import { buildDispatchLoadsFromBofData, createSeedDrivers, createSeedTractors, createSeedTrailers } from "./dispatch-dashboard-seed";
import { computeDocumentationReadiness, type DocumentationReadinessReport } from "./documentation-readiness";
import { buildPretripTabletModel, type PretripTabletModel } from "./pretrip-tablet";
import { getLoadProofItems, type LoadProofItem } from "./load-proof";
import { getOrderedDocumentsForDriver, type DocumentRow } from "./driver-queries";
import { listEngineDocumentsForLoad } from "./document-engine";
import { buildBofLoadRfidReadiness, resolveTripDispatchRfidGate } from "./bof-rfid-readiness";
import { getLoadArtifactActionUrl } from "./load-artifact-registry";

export type TripReleaseSeverity = "blocking" | "warning";

export type TripReleaseCheckCategory =
  | "load_packet"
  | "shipper_requirements"
  | "driver"
  | "equipment"
  | "pretrip"
  | "compliance";

export type TripReleaseCheck = {
  check_id: string;
  load_id: string;
  category: TripReleaseCheckCategory;
  severity: TripReleaseSeverity;
  message: string;
  fixHref?: string;
  fixLabel?: string;
};

export type TripReleaseStatus = "Cleared" | "At Risk" | "Blocked";

export type PretripReleasePhase = "Complete" | "Incomplete" | "Exception Review Needed";

function docStatusUpper(row: DocumentRow | undefined): string {
  return (row?.status ?? "MISSING").toUpperCase();
}

function proofByType(items: LoadProofItem[], t: string) {
  return items.find((p) => p.type === t) ?? null;
}

function formatLoadWeight(load: BofData["loads"][number]) {
  const weight = typeof load.weight === "number" ? `${load.weight.toLocaleString()} lb` : "Weight pending shipper confirmation";
  const pallets = typeof load.pallets === "number" ? `${load.pallets} pallets` : "pallet count pending";
  return `${weight} / ${pallets}`;
}

function temperatureRequirement(load: BofData["loads"][number]) {
  const commodity = String(load.commodity ?? "").toLowerCase();
  if (commodity.includes("frozen")) return "Reefer: maintain frozen set point per shipper tender";
  if (commodity.includes("beverage")) return "Protect from freeze / heat exposure";
  return "Dry van - no temperature control required";
}

function trailerType(load: BofData["loads"][number]) {
  return String(load.commodity ?? "").toLowerCase().includes("frozen") ? "Refrigerated 53 ft trailer" : "Dry van 53 ft trailer";
}

function isBlockingDocStatus(row: DocumentRow | undefined): boolean {
  const s = docStatusUpper(row);
  return s === "EXPIRED" || s === "MISSING";
}

function isWarningDocStatus(row: DocumentRow | undefined): boolean {
  const s = docStatusUpper(row);
  return s === "PENDING";
}

function proofBlocksDeparture(p: LoadProofItem | null, pendingTrip: boolean): TripReleaseSeverity | null {
  if (!p || p.status === "Not required") return null;
  if (p.status === "Complete") return null;
  if (p.status === "Disputed") return pendingTrip ? "blocking" : "warning";
  if (p.status === "Pending") return "warning";
  if (p.status === "Missing") {
    if (p.type === "Pre-Trip Cargo Photo" || p.type === "Pickup Seal Photo" || p.type === "Delivery Seal Photo") {
      return pendingTrip ? "blocking" : "warning";
    }
    if (p.type === "Rate Confirmation" || p.type === "BOL") return pendingTrip ? "blocking" : "warning";
    return "warning";
  }
  return null;
}

export type TripReleaseEvaluation = {
  load_id: string;
  trip_release_status: TripReleaseStatus;
  blocking_count: number;
  warning_count: number;
  primary_block_reason: string | null;
  checks: TripReleaseCheck[];

  /** Overview header */
  driver_name: string;
  driver_id: string;
  dispatch_ref: string;
  load_number: string;
  tractor_unit: string;
  trailer_unit: string;
  origin: string;
  destination: string;
  pickup_datetime: string;
  delivery_datetime: string;

  /** Load / shipper release context */
  shipper_name: string;
  facility_appointment: string;
  commodity: string;
  weight_pallets: string;
  equipment_type: string;
  temperature_requirement: string;
  seal_required: boolean;
  photo_requirements_summary: string;
  bol_instructions: string;
  pod_requirements_summary: string;
  accessorial_lumper_summary: string;
  load_packet_status: DocumentationReadinessReport["overall"];
  load_packet_missing_count: number;
  documentation_report: DocumentationReadinessReport;

  /** Driver qualification */
  cdl_status_label: string;
  med_status_label: string;
  mvr_status_label: string;
  endorsements_display: string;
  twic_display: string;
  hazmat_display: string;
  driver_dispatch_eligibility: string;

  /** Equipment */
  tractor_status: string;
  trailer_status: string;
  tractor_inspection_display: string;
  trailer_inspection_display: string;
  trailer_type_display: string;
  trailer_seal_display: string;
  asset_readiness_summary: string;

  /** Pre-trip */
  pretrip_model: PretripTabletModel;
  pretrip_phase: PretripReleasePhase;
  checklist_summary: string;
  cargo_photo_status: string;
  pickup_photo_status: string;
  seal_photo_status: string;
  seal_number_display: string;
  pretrip_exception_flag: boolean;
  pretrip_notes: string;

  dispatch_load: Load;
  dispatch_driver: Driver | null;
  dispatch_tractor: Tractor | null;
  dispatch_trailer: Trailer | null;
};

function push(
  out: TripReleaseCheck[],
  id: string,
  loadId: string,
  category: TripReleaseCheckCategory,
  severity: TripReleaseSeverity,
  message: string,
  fix?: { href: string; label: string }
) {
  out.push({
    check_id: id,
    load_id: loadId,
    category,
    severity,
    message,
    fixHref: fix?.href,
    fixLabel: fix?.label,
  });
}

export function buildTripReleaseEvaluation(data: BofData, loadId: string): TripReleaseEvaluation | null {
  const bofLoad = data.loads.find((l) => l.id === loadId) ?? null;
  if (!bofLoad) return null;

  const dispatchLoads = buildDispatchLoadsFromBofData(data);
  const dispatchLoad = dispatchLoads.find((l) => l.load_id === loadId) ?? null;
  if (!dispatchLoad) return null;

  const drivers = createSeedDrivers();
  const tractors = createSeedTractors();
  const trailers = createSeedTrailers();
  const dispatchDriver = drivers.find((d) => d.driver_id === dispatchLoad.driver_id) ?? null;
  const dispatchTractor = tractors.find((t) => t.tractor_id === dispatchLoad.tractor_id) ?? null;
  const dispatchTrailer = trailers.find((t) => t.trailer_id === dispatchLoad.trailer_id) ?? null;

  const pretrip = buildPretripTabletModel(data, loadId);
  if (!pretrip) return null;

  const proofItems = getLoadProofItems(data, loadId);
  const docs = getOrderedDocumentsForDriver(data, bofLoad.driverId);
  const cdlRow = docs.find((d) => d.type === "CDL");
  const medRow = docs.find((d) => d.type === "Medical Card");
  const mvrRow = docs.find((d) => d.type === "MVR");

  const docReport = computeDocumentationReadiness(dispatchLoad);
  const pendingTrip =
    bofLoad.status === "Pending" ||
    dispatchLoad.status === "Planned" ||
    dispatchLoad.status === "Assigned";

  const checks: TripReleaseCheck[] = [];
  const artifactHref = (key: string, fallback = `/trip-release/${loadId}#artifact-${key}`) =>
    getLoadArtifactActionUrl(data, loadId, key, fallback);

  /** Driver credentials */
  if (isBlockingDocStatus(cdlRow)) {
    push(
      checks,
      "drv-cdl",
      loadId,
      "driver",
      "blocking",
      `CDL is ${docStatusUpper(cdlRow)} - trip cannot release until credential is valid.`,
      { href: `/drivers/${bofLoad.driverId}/vault`, label: "Fix in driver file" }
    );
  } else if (isWarningDocStatus(cdlRow)) {
    push(
      checks,
      "drv-cdl-w",
      loadId,
      "driver",
      "warning",
      `CDL requires attention (${cdlRow?.status ?? "pending"}).`,
      { href: `/drivers/${bofLoad.driverId}/vault`, label: "Review CDL" }
    );
  }

  if (isBlockingDocStatus(medRow)) {
    push(
      checks,
      "drv-med",
      loadId,
      "driver",
      "blocking",
      `Medical card is ${docStatusUpper(medRow)} - blocking release.`,
      { href: `/drivers/${bofLoad.driverId}/vault`, label: "Fix medical card" }
    );
  } else if (isWarningDocStatus(medRow)) {
    push(
      checks,
      "drv-med-w",
      loadId,
      "driver",
      "warning",
      `Medical card status: ${medRow?.status ?? "pending"}.`,
      { href: `/drivers/${bofLoad.driverId}/vault`, label: "Review medical" }
    );
  }

  if (isBlockingDocStatus(mvrRow)) {
    push(
      checks,
      "drv-mvr",
      loadId,
      "driver",
      "blocking",
      `MVR is ${docStatusUpper(mvrRow)} - trip release stays blocked until cleared.`,
      { href: `/drivers/${bofLoad.driverId}/vault`, label: "Fix MVR" }
    );
  } else if (docStatusUpper(mvrRow) === "VALID" && dispatchDriver?.compliance_status === "EXPIRING_SOON") {
    push(
      checks,
      "drv-mvr-soon",
      loadId,
      "driver",
      "warning",
      "Driver compliance is expiring soon - confirm MVR and monitoring plan.",
      { href: `/drivers/${bofLoad.driverId}`, label: "Open driver" }
    );
  }

  if (dispatchDriver?.compliance_status === "EXPIRED") {
    push(
      checks,
      "drv-fleet-exp",
      loadId,
      "compliance",
      "blocking",
      "Driver compliance is expired - release blocked.",
      { href: `/drivers/${bofLoad.driverId}`, label: "Open driver" }
    );
  } else if (dispatchDriver?.compliance_status === "EXPIRING_SOON") {
    push(
      checks,
      "drv-fleet-soon",
      loadId,
      "compliance",
      "warning",
      "Driver compliance is expiring soon - dispatch requires documented approval.",
      { href: `/drivers/${bofLoad.driverId}`, label: "Open driver" }
    );
  }

  /** Equipment */
  if (dispatchTractor?.status === "Unavailable") {
    push(
      checks,
      "eq-tractor",
      loadId,
      "equipment",
      "blocking",
      `Power unit ${dispatchTractor.unit_number} is unavailable - cannot release trip.`,
      { href: "/dispatch", label: "Open dispatch" }
    );
  }
  if (dispatchTrailer?.status === "Unavailable") {
    push(
      checks,
      "eq-trailer",
      loadId,
      "equipment",
      "blocking",
      `Trailer ${dispatchTrailer.unit_number} is unavailable - cannot release trip.`,
      { href: "/dispatch", label: "Open dispatch" }
    );
  }

  const maintMar =
    "moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)
      ? data.moneyAtRisk.find(
          (m) =>
            m.assetId === bofLoad.assetId &&
            /maintenance/i.test(m.category) &&
            /open|at risk|blocked/i.test(m.status)
        )
      : undefined;
  if (maintMar) {
    push(
      checks,
      "eq-maint-mar",
      loadId,
      "equipment",
      "blocking",
      `Open maintenance exposure on asset ${bofLoad.assetId}: ${maintMar.category} - ${maintMar.status}.`,
      { href: "/money-at-risk", label: "Review MAR" }
    );
  }

  /** Load packet - critical lines for departure */
  for (const key of ["rate_con", "bol"] as const) {
    const line = docReport.lines.find((l) => l.key === key);
    if (line?.status === "Missing" && pendingTrip) {
      push(
        checks,
        `pkt-${key}`,
        loadId,
        "load_packet",
        "blocking",
        `${line.label} missing on dispatch packet - required before departure.`,
        { href: artifactHref(key === "rate_con" ? "rate_confirmation" : "bol"), label: `Open ${line.label}` }
      );
    } else if (line?.status === "Missing" && !pendingTrip) {
      push(
        checks,
        `pkt-${key}-w`,
        loadId,
        "load_packet",
        "warning",
        `${line.label} still missing (post-assign phase).`,
        { href: `/loads/${loadId}`, label: "Load detail" }
      );
    }
  }

  if (dispatchLoad.lumper_receipt_required && !dispatchLoad.lumper_photo_url?.trim()) {
    const sev: TripReleaseSeverity = pendingTrip ? "blocking" : "warning";
    push(
      checks,
      "pkt-lumper",
      loadId,
      "load_packet",
      sev,
      "Lumper receipt required on this move; proof is not attached to the dispatch packet.",
      { href: artifactHref("lumper_receipt"), label: "Open lumper receipt item" }
    );
  }

  if (docReport.overall === "Claim Required" || docReport.overall === "Exception") {
    push(
      checks,
      "pkt-exception",
      loadId,
      "load_packet",
      dispatchLoad.insurance_claim_needed ? "blocking" : "warning",
      docReport.overallDetail,
      { href: `/shipper-portal/${loadId}`, label: "Shipper / packet view" }
    );
  } else if (docReport.missingRequired.length > 0 && pendingTrip) {
    push(
      checks,
      "pkt-missing",
      loadId,
      "load_packet",
      "warning",
      `Packet incomplete: ${docReport.missingRequired.join(", ")}.`,
      { href: `/shipper-portal/${loadId}`, label: "Review packet" }
    );
  }

  /** Shipper schedule completeness */
  if (!dispatchLoad.pickup_datetime?.trim() || !dispatchLoad.delivery_datetime?.trim()) {
    push(
      checks,
      "shp-window",
      loadId,
      "shipper_requirements",
      "warning",
      "Pickup or delivery schedule slot missing on dispatch row.",
      { href: "/dispatch", label: "Dispatch" }
    );
  }

  if (!bofLoad.dispatchOpsNotes?.trim()) {
    if (pendingTrip) {
      push(
        checks,
        "shp-ops-notes",
        loadId,
        "shipper_requirements",
        "warning",
        "Dispatch instructions need to be added to the release packet.",
        { href: `/loads/${loadId}`, label: "Add dispatch notes" }
      );
    }
  }

  /** Pre-trip aggregate + proof lines */
  if (pretrip.overall === "BLOCKED") {
    const top = pretrip.blockReasons.slice(0, 4).join("; ");
    push(
      checks,
      "pt-blocked",
      loadId,
      "pretrip",
      "blocking",
      `Pre-trip gate BLOCKED: ${top || "see pre-trip tablet"}.`,
      { href: `/pretrip/${loadId}`, label: "Open pre-trip" }
    );
  }

  for (const label of [
    "Pre-Trip Cargo Photo",
    "Pickup Seal Photo",
    "Delivery Seal Photo",
  ] as const) {
    const p = proofByType(proofItems, label);
    const sev = proofBlocksDeparture(p, pendingTrip);
    if (sev) {
      push(
        checks,
        `pt-proof-${label.replace(/\s+/g, "-")}`,
        loadId,
        "pretrip",
        sev,
        `${label}: ${p?.status ?? "Missing"}${p?.blocksPayment ? " - blocks payment" : ""}.`,
        {
          href: artifactHref(
            label === "Pre-Trip Cargo Photo"
              ? "cargo_photo"
              : label === "Pickup Seal Photo"
                ? "seal_pickup_photo"
                : "seal_delivery_photo"
          ),
          label: `Open ${label}`
        }
      );
    }
  }

  const sealRequired =
    Boolean(bofLoad.pickupSeal?.trim()) || Boolean(bofLoad.deliverySeal?.trim());
  if (sealRequired && pendingTrip) {
    if (!bofLoad.pickupSeal?.trim()) {
      push(
        checks,
        "pt-seal-pu-missing",
        loadId,
        "pretrip",
        "blocking",
        "Seal chain required but pickup seal number is blank on load record.",
        { href: `/loads/${loadId}`, label: "Enter seal on load" }
      );
    }
    const sealPhotoMissing = !dispatchLoad.seal_photo_url?.trim();
    if (sealPhotoMissing) {
      push(
        checks,
        "pt-seal-photo",
        loadId,
        "pretrip",
        "blocking",
        "Seal documentation photo missing on dispatch packet URL fields.",
        { href: artifactHref("seal_pickup_photo"), label: "Open seal photo item" }
      );
    }
  }

  if (bofLoad.dispatchExceptionFlag) {
    push(
      checks,
      "pt-ex-flag",
      loadId,
      "pretrip",
      pretrip.overall === "BLOCKED" ? "blocking" : "warning",
      dispatchLoad.exception_reason ??
        "Exception review required before trip release.",
      { href: `/loads/${loadId}`, label: "Resolve on load" }
    );
  }

  const rfidReadiness = buildBofLoadRfidReadiness(data, loadId);
  const rfidDispatchGate = resolveTripDispatchRfidGate(rfidReadiness);
  if (rfidDispatchGate.level === "hard_block") {
    push(
      checks,
      "rfid-dispatch-release",
      loadId,
      "compliance",
      "blocking",
      rfidDispatchGate.reason,
      { href: `/loads/${loadId}`, label: "RFID / proof on load" }
    );
  } else if (rfidDispatchGate.level === "soft_block") {
    push(
      checks,
      "rfid-dispatch-release-w",
      loadId,
      "compliance",
      "warning",
      rfidDispatchGate.reason,
      { href: `/loads/${loadId}`, label: "Review RFID posture" }
    );
  }

  const blocking = checks.filter((c) => c.severity === "blocking");
  const warnings = checks.filter((c) => c.severity === "warning");
  let trip_release_status: TripReleaseStatus;
  if (blocking.length > 0) trip_release_status = "Blocked";
  else if (warnings.length > 0) trip_release_status = "At Risk";
  else trip_release_status = "Cleared";

  const primary_block_reason =
    blocking.length > 0 ? blocking[0].message : trip_release_status === "At Risk" ? warnings[0]?.message ?? null : null;

  const cdlExtras = cdlRow as DocumentRow & { cdlEndorsements?: string };
  const endorsementsDisplay = cdlExtras?.cdlEndorsements?.trim() || "Not listed";

  let pretripPhase: PretripReleasePhase;
  if (bofLoad.dispatchExceptionFlag || dispatchLoad.insurance_claim_needed) {
    pretripPhase = "Exception Review Needed";
  } else if (pretrip.overall === "READY" && blocking.length === 0) {
    pretripPhase = "Complete";
  } else {
    pretripPhase = "Incomplete";
  }

  const cargoP = proofByType(proofItems, "Pre-Trip Cargo Photo");
  const pickupP = proofByType(proofItems, "Pickup Seal Photo");
  const delSealP = proofByType(proofItems, "Delivery Seal Photo");

  return {
    load_id: loadId,
    trip_release_status,
    blocking_count: blocking.length,
    warning_count: warnings.length,
    primary_block_reason,
    checks,

    driver_name: pretrip.driverName,
    driver_id: bofLoad.driverId,
    dispatch_ref: `${dispatchLoad.dispatcher_name} - ${dispatchLoad.rfid_tag_id ?? "RFID"}`,
    load_number: bofLoad.number,
    tractor_unit: dispatchTractor
      ? `${dispatchTractor.unit_number} (${dispatchTractor.tractor_id})`
      : dispatchLoad.tractor_id ?? "Not assigned",
    trailer_unit: dispatchTrailer
      ? `${dispatchTrailer.unit_number} (${dispatchTrailer.trailer_id})`
      : dispatchLoad.trailer_id ?? "Not assigned",
    origin: bofLoad.origin,
    destination: bofLoad.destination,
    pickup_datetime: dispatchLoad.pickup_datetime,
    delivery_datetime: dispatchLoad.delivery_datetime,

    shipper_name: dispatchLoad.customer_name,
    facility_appointment: `${dispatchLoad.pickup_datetime} to ${dispatchLoad.delivery_datetime}`,
    commodity: bofLoad.commodity || "General freight",
    weight_pallets: formatLoadWeight(bofLoad),
    equipment_type: `Power ${bofLoad.assetId} - Trailer ${dispatchLoad.trailer_id ?? "Not assigned"}`,
    temperature_requirement: temperatureRequirement(bofLoad),
    seal_required: sealRequired,
    photo_requirements_summary:
      "Pre-trip cargo + pickup/delivery seal photos per BOF proof stack; pickup/empty trailer where applicable.",
    bol_instructions: bofLoad.dispatchOpsNotes?.trim()
      ? bofLoad.dispatchOpsNotes
      : "BOL required at pickup; signed POD required at delivery before settlement release.",
    pod_requirements_summary: `POD status: ${bofLoad.podStatus}; dispatch proof status: ${dispatchLoad.proof_status}.`,
    accessorial_lumper_summary: dispatchLoad.lumper_receipt_required
      ? "Lumper / detention receipt required on this move (dispatch packet rule)."
      : "Lumper receipt not required for this move.",
    load_packet_status: docReport.overall,
    load_packet_missing_count: docReport.missingRequired.length,
    documentation_report: docReport,

    cdl_status_label: `${cdlRow?.status ?? "MISSING"}${cdlRow?.expirationDate ? ` - exp ${cdlRow.expirationDate}` : ""}`,
    med_status_label: `${medRow?.status ?? "MISSING"}${medRow?.expirationDate ? ` - exp ${medRow.expirationDate}` : ""}`,
    mvr_status_label: `${mvrRow?.status ?? "MISSING"}${mvrRow?.expirationDate ? ` - exp ${mvrRow.expirationDate}` : ""}`,
    endorsements_display: endorsementsDisplay,
    twic_display: "Not required on this lane",
    hazmat_display: String(bofLoad.commodity ?? "").toLowerCase().includes("plastic")
      ? "Review SDS / commodity classification before release"
      : "Not required for this commodity",
    driver_dispatch_eligibility:
      blocking.some((c) => c.category === "driver" || c.category === "compliance")
        ? "Not eligible - credential or fleet compliance blockers."
        : warnings.some((c) => c.category === "driver" || c.category === "compliance")
          ? "Eligible with warnings - review before signing release."
          : "Eligible on credentials for this evaluation.",

    tractor_status: dispatchTractor?.status ?? "Not assigned",
    trailer_status: dispatchTrailer?.status ?? "Not assigned",
    tractor_inspection_display: maintMar
      ? `Hold: ${maintMar.status} (${maintMar.category})`
      : "No open maintenance hold on this power unit.",
    trailer_inspection_display:
      "Trailer inspection clear for dispatch; driver completes final walk-around before departure.",
    trailer_type_display: trailerType(bofLoad),
    trailer_seal_display: `Dispatch seal_status: ${dispatchLoad.seal_status} - pickup # ${bofLoad.pickupSeal || "Not recorded"} - delivery # ${bofLoad.deliverySeal || "Not recorded"}`,
    asset_readiness_summary:
      dispatchTractor?.status === "Unavailable" || dispatchTrailer?.status === "Unavailable"
        ? "Equipment unavailable - cannot release."
        : maintMar
          ? "Power unit under maintenance risk - blocked until cleared."
          : "Equipment is available and clear for release after driver walk-around.",

    pretrip_model: pretrip,
    pretrip_phase: pretripPhase,
    checklist_summary:
      pretrip.overall === "READY"
        ? "Pre-trip checklist evaluation: READY (no critical blockers in tablet model)."
        : `Pre-trip checklist evaluation: BLOCKED - ${pretrip.blockReasons.slice(0, 5).join("; ") || "see tablet"}`,
    cargo_photo_status: cargoP?.status ?? "Not recorded",
    pickup_photo_status: dispatchLoad.pickup_photo_url ? "Uploaded (packet URL)" : "Missing (packet URL)",
    seal_photo_status: `${pickupP?.status ?? "Not recorded"} pickup - ${delSealP?.status ?? "Not recorded"} delivery seal proof lines`,
    seal_number_display: `Pickup: ${bofLoad.pickupSeal || "Not recorded"} - Delivery: ${bofLoad.deliverySeal || "Not recorded"}`,
    pretrip_exception_flag: bofLoad.dispatchExceptionFlag,
    pretrip_notes: bofLoad.dispatchOpsNotes?.trim() || "No dispatch notes recorded",

    dispatch_load: dispatchLoad,
    dispatch_driver: dispatchDriver,
    dispatch_tractor: dispatchTractor,
    dispatch_trailer: dispatchTrailer,
  };
}

export function tripReleaseCanRelease(ev: TripReleaseEvaluation): boolean {
  return ev.blocking_count === 0;
}

/** Local UI helper: returns checks after merge for client-side state. */
export function mergeTripReleaseChecks(
  base: TripReleaseEvaluation,
  extra: TripReleaseCheck[]
): TripReleaseEvaluation {
  const checks = [...base.checks, ...extra];
  const blocking = checks.filter((c) => c.severity === "blocking");
  const warnings = checks.filter((c) => c.severity === "warning");
  let trip_release_status: TripReleaseStatus;
  if (blocking.length > 0) trip_release_status = "Blocked";
  else if (warnings.length > 0) trip_release_status = "At Risk";
  else trip_release_status = "Cleared";
  const primary_block_reason =
    blocking.length > 0 ? blocking[0].message : trip_release_status === "At Risk" ? warnings[0]?.message ?? null : null;
  return {
    ...base,
    checks,
    blocking_count: blocking.length,
    warning_count: warnings.length,
    trip_release_status,
    primary_block_reason,
  };
}

export function listTripReleaseEngineDocs(data: BofData, loadId: string) {
  return listEngineDocumentsForLoad(data, loadId);
}
