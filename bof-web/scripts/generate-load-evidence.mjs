import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const PUBLIC_ROOT = path.join(ROOT, "public");
const EVIDENCE_ROOT = path.join(PUBLIC_ROOT, "evidence", "loads");
const PUBLIC_MANIFEST_PATH = path.join(EVIDENCE_ROOT, "load-evidence-manifest.json");
const LIB_MANIFEST_PATH = path.join(ROOT, "lib", "generated", "load-evidence-manifest.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isoNow() {
  return new Date().toISOString();
}

function renderEvidenceSvg({
  title,
  evidenceType,
  loadId,
  workOrderId,
  customer,
  driver,
  location,
  facility,
  status,
  warning,
  timestamp,
  sealNumber,
  equipmentRef,
}) {
  const warningLine = warning
    ? `<text x="24" y="248" fill="#fca5a5" font-size="16" font-weight="700">Warning: ${esc(warning)}</text>`
    : "";
  const sealLine = sealNumber
    ? `<text x="48" y="404" fill="#fde68a" font-size="16" font-family="Segoe UI, Arial">Seal / lock ref: ${esc(sealNumber)}</text>`
    : "";
  const equipLine = equipmentRef
    ? `<text x="48" y="432" fill="#bae6fd" font-size="16" font-family="Consolas, monospace">${esc(equipmentRef)}</text>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1280" height="720" fill="url(#bg)"/>
  <rect x="22" y="22" width="1236" height="676" rx="14" fill="none" stroke="#14b8a6" stroke-width="2"/>
  <text x="24" y="56" fill="#14b8a6" font-size="22" font-family="Segoe UI, Arial" font-weight="700">BOF Demo Evidence</text>
  <text x="24" y="86" fill="#94a3b8" font-size="14" font-family="Consolas, monospace">${esc(evidenceType)} · ${esc(loadId)}</text>
  <text x="24" y="124" fill="#e2e8f0" font-size="28" font-family="Segoe UI, Arial" font-weight="600">${esc(title)}</text>
  <text x="24" y="162" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">Work order: ${esc(workOrderId)}</text>
  <text x="24" y="190" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">Customer: ${esc(customer)}</text>
  <text x="24" y="218" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">Driver: ${esc(driver)}</text>
  ${warningLine}
  <rect x="24" y="272" width="1232" height="360" rx="10" fill="#0b1220" stroke="#334155"/>
  <text x="48" y="318" fill="#93c5fd" font-size="18" font-family="Segoe UI, Arial">Facility / location: ${esc(facility || location)}</text>
  <text x="48" y="348" fill="#a7f3d0" font-size="18" font-family="Segoe UI, Arial">Lane / stop: ${esc(location)}</text>
  <text x="48" y="378" fill="#cbd5e1" font-size="16" font-family="Segoe UI, Arial">Status: ${esc(status)}</text>
  ${sealLine}
  ${equipLine}
  <text x="48" y="470" fill="#cbd5e1" font-size="16" font-family="Consolas, monospace">Timestamp (UTC): ${esc(timestamp)}</text>
  <rect x="990" y="296" width="230" height="230" rx="12" fill="#111827" stroke="#14b8a6" stroke-width="2"/>
  <circle cx="1105" cy="394" r="52" fill="#0f172a" stroke="#14b8a6" stroke-width="3"/>
  <path d="M1080 394h50M1105 369v50" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/>
  <text x="24" y="698" fill="#94a3b8" font-size="14" font-family="Segoe UI, Arial">Generated demo evidence</text>
</svg>`;
}

function findDriverName(drivers, driverId) {
  return drivers.find((d) => d.id === driverId)?.name ?? driverId;
}

function warningForLoad(load) {
  if (load.sealStatus === "Mismatch") return "Seal mismatch - claim review required";
  if (load.dispatchExceptionFlag) return "Dispatch exception - review required";
  if (String(load.podStatus).toLowerCase() === "pending") return "POD pending - settlement hold risk";
  return "";
}

function hasLumperIssue(load, settlements) {
  const s = (settlements ?? []).find((row) => row.driverId === load.driverId);
  return /lumper/i.test(String(s?.pendingReason ?? ""));
}

function workOrderIdFor(load) {
  if (load.workOrderId != null && String(load.workOrderId).trim()) return String(load.workOrderId).trim();
  return `WO-${load.id}-${load.number}`;
}

function writeEvidenceSvg(loadId, fileName, svgContent) {
  const loadDir = path.join(EVIDENCE_ROOT, loadId);
  ensureDir(loadDir);
  const absolutePath = path.join(loadDir, fileName);
  fs.writeFileSync(absolutePath, svgContent, "utf8");
  return `/evidence/loads/${loadId}/${fileName}`;
}

function main() {
  const data = readJson(DATA_PATH);
  const manifest = {};

  for (const load of data.loads ?? []) {
    const customer = String(load.origin ?? "BOF Customer").split(" - ")[0] || "BOF Customer";
    const driverName = findDriverName(data.drivers ?? [], load.driverId);
    const warning = warningForLoad(load);
    const ts = isoNow();
    const wo = workOrderIdFor(load);
    const equipmentRef = `Truck ${load.assetId} · Trailer TR-${String(load.assetId || "").replace(/^T-/, "")}`;
    const common = {
      loadId: load.id,
      workOrderId: wo,
      customer,
      driver: `${driverName} (${load.driverId})`,
      timestamp: ts,
      warning,
      equipmentRef,
    };

    const cargoPhoto = writeEvidenceSvg(
      load.id,
      "cargo-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Cargo Photo",
        evidenceType: "cargo_photo",
        location: `${load.origin} → ${load.destination}`,
        facility: load.origin,
        status: "Pallets secured / cargo condition recorded",
        sealNumber: load.pickupSeal || "",
      })
    );
    const sealPhoto = writeEvidenceSvg(
      load.id,
      "seal-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Seal Photo",
        evidenceType: "seal_photo",
        location: `${load.origin} → ${load.destination}`,
        facility: "Pickup & delivery checkpoints",
        status: `Seal chain recorded (${load.pickupSeal || "N/A"} / ${load.deliverySeal || "N/A"})`,
        sealNumber: `${load.pickupSeal || "—"} / ${load.deliverySeal || "—"}`,
      })
    );
    const equipmentPhoto = writeEvidenceSvg(
      load.id,
      "equipment-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Equipment Photo",
        evidenceType: "equipment_photo",
        location: load.origin,
        facility: load.origin,
        status: `Equipment inspection recorded`,
        sealNumber: "",
      })
    );
    const pickupPhoto = writeEvidenceSvg(
      load.id,
      "pickup-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Pickup Photo",
        evidenceType: "pickup_photo",
        location: load.origin,
        facility: load.origin,
        status: "Pickup proof captured",
        sealNumber: load.pickupSeal || "",
      })
    );
    const deliveryPhoto = writeEvidenceSvg(
      load.id,
      "delivery-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Delivery Photo",
        evidenceType: "delivery_photo",
        location: load.destination,
        facility: load.destination,
        status: "Delivery proof captured",
        sealNumber: load.deliverySeal || "",
      })
    );
    const sealPickupPhoto = writeEvidenceSvg(
      load.id,
      "seal-pickup-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Seal Pickup Photo",
        evidenceType: "seal_pickup_photo",
        location: load.origin,
        facility: load.origin,
        status: `Seal captured at pickup`,
        sealNumber: load.pickupSeal || "N/A",
      })
    );
    const sealDeliveryPhoto = writeEvidenceSvg(
      load.id,
      "seal-delivery-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Seal Delivery Photo",
        evidenceType: "seal_delivery_photo",
        location: load.destination,
        facility: load.destination,
        status: `Seal captured at delivery`,
        sealNumber: load.deliverySeal || "N/A",
      })
    );
    const lumperReceipt = hasLumperIssue(load, data.settlements)
      ? writeEvidenceSvg(
          load.id,
          "lumper-receipt.svg",
          renderEvidenceSvg({
            ...common,
            title: "Lumper Receipt",
            evidenceType: "lumper_receipt",
            location: load.destination,
            facility: load.destination,
            status: "Lumper receipt pending/review tracked for settlement",
            sealNumber: "",
          })
        )
      : undefined;
    const hasClaim = Boolean(load.dispatchExceptionFlag || String(load.sealStatus).toUpperCase() === "MISMATCH");
    const damagePhoto = hasClaim
      ? writeEvidenceSvg(
          load.id,
          "damage-photo.svg",
          renderEvidenceSvg({
            ...common,
            title: "Damage Photo",
            evidenceType: "damage_photo",
            location: `${load.origin} → ${load.destination}`,
            facility: "Exception corridor",
            status: "Damage observed / claim review required",
            sealNumber: `${load.pickupSeal || "—"} → ${load.deliverySeal || "—"}`,
            warning: warning || "Claim review required",
          })
        )
      : undefined;
    const claimEvidence = hasClaim
      ? writeEvidenceSvg(
          load.id,
          "claim-evidence.svg",
          renderEvidenceSvg({
            ...common,
            title: "Claim Evidence Summary",
            evidenceType: "claim_evidence",
            location: `${load.origin} → ${load.destination}`,
            facility: "Claims desk queue",
            status: "Structured claim evidence placeholder (demo)",
            sealNumber: load.sealStatus || "",
            warning: warning || undefined,
          })
        )
      : undefined;

    manifest[load.id] = {
      cargoPhoto,
      sealPhoto,
      sealPickupPhoto,
      sealDeliveryPhoto,
      equipmentPhoto,
      pickupPhoto,
      deliveryPhoto,
      ...(lumperReceipt ? { lumperReceipt } : {}),
      ...(damagePhoto ? { damagePhoto } : {}),
      ...(claimEvidence ? { claimEvidence } : {}),
    };
    console.log(
      `[generate-load-evidence] load=${load.id} files=${Object.keys(manifest[load.id]).length} out=${PUBLIC_MANIFEST_PATH}`
    );
  }

  ensureDir(EVIDENCE_ROOT);
  writeJson(PUBLIC_MANIFEST_PATH, manifest);
  writeJson(LIB_MANIFEST_PATH, manifest);
  console.log(`Generated load evidence for ${Object.keys(manifest).length} loads.`);
}

main();
