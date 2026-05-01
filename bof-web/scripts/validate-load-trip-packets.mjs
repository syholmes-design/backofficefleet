/**
 * Validates canonical trip document packets against demo data + public manifests.
 * Mirrors rules in lib/load-trip-packet.ts (manifest-backed URLs only).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const DOC_MANIFEST_PATH = path.join(ROOT, "public", "generated", "loads", "load-doc-manifest.json");
const EV_MANIFEST_PATH = path.join(ROOT, "public", "evidence", "loads", "load-evidence-manifest.json");

/** Must match TripPacketRow keys in lib/load-trip-packet.ts — proves no duplicate logical rows. */
const TRIP_PACKET_ROW_KEYS = [
  "rate_confirmation",
  "work_order",
  "bol",
  "pod",
  "invoice",
  "pickup_photo",
  "cargo_photo",
  "seal_pickup_photo",
  "seal_delivery_photo",
  "delivery_empty_trailer",
  "rfid_geo",
  "lumper_receipt",
  "claim_intake",
  "claim_packet",
  "damage_photo_packet",
  "insurance_notification",
  "settlement_hold_notice",
  "factoring_notification",
  "seal_mismatch_photo",
  "master_agreement_reference",
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toFsPath(publicUrl) {
  return path.join(ROOT, "public", String(publicUrl).replace(/^\//, ""));
}

function trimSeal(s) {
  return String(s ?? "").trim();
}

function settlementLumperFlag(load, settlements) {
  const s = (settlements ?? []).find((row) => row.driverId === load.driverId);
  return /lumper/i.test(String(s?.pendingReason ?? ""));
}

function settlementHoldApplicable(load, settlements) {
  const s = (settlements ?? []).find((row) => row.driverId === load.driverId);
  return String(s?.status ?? "")
    .trim()
    .toLowerCase() === "hold";
}

function bundleClaimApplicable(load, data) {
  const b = data.loadProofBundles?.[load.id];
  if (b && typeof b.claimApplicable === "boolean") return b.claimApplicable;
  return Boolean(
    load.dispatchExceptionFlag ||
      (load.status === "Delivered" && String(load.sealStatus).toUpperCase() === "MISMATCH")
  );
}

function gen(docEntry, key) {
  const raw = docEntry?.[key];
  const u = typeof raw === "string" ? raw.trim() : "";
  return u || "";
}

function ev(evEntry, key) {
  const v = evEntry?.[key];
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return typeof v.url === "string" ? v.url.trim() : "";
}

function assertNoMockPath(url, ctx, errors) {
  if (!url) return;
  if (/\/mocks\/mock_/i.test(url)) {
    errors.push(`${ctx}: mock path forbidden -> ${url}`);
  }
}

function assertFile(url, ctx, errors) {
  if (!url) return;
  assertNoMockPath(url, ctx, errors);
  const fp = toFsPath(url);
  if (!fs.existsSync(fp)) {
    errors.push(`${ctx}: missing file for ${url}`);
  }
}

function collectPacketUrls(load, data, docEntry, evEntry) {
  const delivered = load.status === "Delivered";
  const claimOk = bundleClaimApplicable(load, data);
  const requiredSeal = Boolean(trimSeal(load.pickupSeal) || trimSeal(load.deliverySeal));
  const lumperRequired = delivered && settlementLumperFlag(load, data.settlements);
  const sealMismatch = String(load.sealStatus ?? "").toUpperCase() === "MISMATCH";
  const holdApplicable = settlementHoldApplicable(load, data.settlements);

  const rateUrl = gen(docEntry, "rateConfirmation");
  const bolUrl = gen(docEntry, "bol");
  const podUrl = gen(docEntry, "pod");
  const invoiceUrl = gen(docEntry, "invoice");
  const workOrderUrl = gen(docEntry, "workOrder");
  const masterUrl = gen(docEntry, "masterAgreementReference");

  const pickupPhotoUrl = ev(evEntry, "pickupPhoto");
  const cargoPhotoUrl = ev(evEntry, "cargoPhoto") || gen(docEntry, "cargoPhoto");
  const sealPickupUrl = ev(evEntry, "sealPickupPhoto") || gen(docEntry, "sealPickupPhoto");
  const sealDeliveryUrl = ev(evEntry, "sealDeliveryPhoto") || gen(docEntry, "sealDeliveryPhoto");
  const emptyTrailerUrl = ev(evEntry, "emptyTrailerProof");
  const deliveryPhotoUrl = ev(evEntry, "deliveryPhoto");
  const deliveryMergedUrl = emptyTrailerUrl || deliveryPhotoUrl;
  const rfidUrl = ev(evEntry, "rfidDockProof") || gen(docEntry, "rfidProof");
  const lumperUrl = ev(evEntry, "lumperReceipt") || gen(docEntry, "lumperReceipt");

  const claimIntakeUrl = gen(docEntry, "claimIntake");
  const claimPacketUrl = gen(docEntry, "claimPacket");
  const damagePhotoPacketUrl = gen(docEntry, "damagePhotoPacket");
  const insuranceUrl = gen(docEntry, "insuranceNotification");
  const settlementHoldNoticeUrl = gen(docEntry, "settlementHoldNotice");
  const factoringUrl = gen(docEntry, "factoringNotification");
  const sealMismatchPhotoUrl = ev(evEntry, "sealMismatchPhoto");

  const urlsByKey = {
    rate_confirmation: rateUrl,
    work_order: workOrderUrl,
    bol: bolUrl,
    pod: podUrl,
    invoice: invoiceUrl,
    pickup_photo: pickupPhotoUrl,
    cargo_photo: cargoPhotoUrl,
    seal_pickup_photo: requiredSeal ? sealPickupUrl : "",
    seal_delivery_photo: requiredSeal ? sealDeliveryUrl : "",
    delivery_empty_trailer: deliveryMergedUrl,
    rfid_geo: rfidUrl,
    lumper_receipt: lumperRequired ? lumperUrl : "",
    claim_intake: claimOk ? claimIntakeUrl : "",
    claim_packet: claimOk ? claimPacketUrl : "",
    damage_photo_packet: claimOk ? damagePhotoPacketUrl : "",
    insurance_notification: claimOk ? insuranceUrl : "",
    settlement_hold_notice: holdApplicable ? settlementHoldNoticeUrl : "",
    factoring_notification: factoringUrl,
    seal_mismatch_photo: sealMismatch ? sealMismatchPhotoUrl : "",
    master_agreement_reference: masterUrl,
  };

  return {
    urlsByKey,
    delivered,
    claimOk,
    requiredSeal,
    lumperRequired,
    sealMismatch,
    holdApplicable,
  };
}

function main() {
  const errors = [];

  if (new Set(TRIP_PACKET_ROW_KEYS).size !== TRIP_PACKET_ROW_KEYS.length) {
    errors.push("TRIP_PACKET_ROW_KEYS contains duplicates");
  }

  const data = readJson(DATA_PATH);
  const docManifest = readJson(DOC_MANIFEST_PATH);
  const evManifest = readJson(EV_MANIFEST_PATH);

  for (const load of data.loads ?? []) {
    const docEntry = docManifest[load.id] ?? {};
    const evEntry = evManifest[load.id];
    if (!evEntry) {
      errors.push(`${load.id}: missing evidence manifest entry`);
      continue;
    }

    const ctx = collectPacketUrls(load, data, docEntry, evEntry);
    const { urlsByKey, delivered, claimOk, requiredSeal, lumperRequired, sealMismatch, holdApplicable } =
      ctx;

    Object.entries(urlsByKey).forEach(([key, url]) => {
      assertNoMockPath(url, `${load.id}:${key}`, errors);
      if (url) assertFile(url, `${load.id}:${key}`, errors);
    });

    if (delivered) {
      for (const k of ["rate_confirmation", "work_order", "bol", "pod", "invoice"]) {
        if (!urlsByKey[k]) errors.push(`${load.id}: delivered missing required ${k} URL`);
      }
      if (!urlsByKey.delivery_empty_trailer) {
        errors.push(`${load.id}: delivered missing delivery / empty-trailer proof URL`);
      }
      if (requiredSeal) {
        if (!urlsByKey.seal_pickup_photo) errors.push(`${load.id}: delivered missing seal pickup photo`);
        if (!urlsByKey.seal_delivery_photo) errors.push(`${load.id}: delivered missing seal delivery photo`);
      }
      if (lumperRequired && !urlsByKey.lumper_receipt) {
        errors.push(`${load.id}: delivered missing lumper receipt`);
      }
      if (claimOk) {
        for (const k of ["claim_intake", "claim_packet", "damage_photo_packet", "insurance_notification"]) {
          if (!urlsByKey[k]) errors.push(`${load.id}: claim path missing ${k} URL`);
        }
      }
      if (holdApplicable && !urlsByKey.settlement_hold_notice) {
        errors.push(`${load.id}: settlement hold active but hold notice URL missing`);
      }
      if (sealMismatch && !urlsByKey.seal_mismatch_photo) {
        errors.push(`${load.id}: seal mismatch without mismatch photo URL`);
      }
    }

  }

  if (errors.length > 0) {
    console.error("validate:load-trip-packets failed");
    for (const err of errors) console.error(` - ${err}`);
    process.exit(1);
  }

  console.log(`validate:load-trip-packets passed for ${(data.loads ?? []).length} loads.`);
}

main();
