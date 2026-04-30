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
  loadId,
  customer,
  driver,
  location,
  status,
  warning,
  timestamp,
}) {
  const warningLine = warning ? `<text x="24" y="228" fill="#fca5a5" font-size="16" font-weight="700">Warning: ${esc(warning)}</text>` : "";
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
  <text x="24" y="64" fill="#14b8a6" font-size="34" font-family="Segoe UI, Arial" font-weight="700">BOF Demo Evidence</text>
  <text x="24" y="108" fill="#e2e8f0" font-size="28" font-family="Segoe UI, Arial" font-weight="600">${esc(title)}</text>
  <text x="24" y="152" fill="#cbd5e1" font-size="20" font-family="Consolas, monospace">Load: ${esc(loadId)}</text>
  <text x="24" y="184" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">Customer: ${esc(customer)}</text>
  <text x="24" y="208" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">Driver: ${esc(driver)}</text>
  ${warningLine}
  <rect x="24" y="262" width="1232" height="330" rx="10" fill="#0b1220" stroke="#334155"/>
  <text x="48" y="308" fill="#93c5fd" font-size="18" font-family="Segoe UI, Arial">Location / Facility: ${esc(location)}</text>
  <text x="48" y="340" fill="#a7f3d0" font-size="18" font-family="Segoe UI, Arial">Status: ${esc(status)}</text>
  <text x="48" y="372" fill="#cbd5e1" font-size="16" font-family="Segoe UI, Arial">Timestamp: ${esc(timestamp)}</text>
  <rect x="990" y="286" width="230" height="230" rx="12" fill="#111827" stroke="#14b8a6" stroke-width="2"/>
  <circle cx="1105" cy="384" r="52" fill="#0f172a" stroke="#14b8a6" stroke-width="3"/>
  <path d="M1080 384h50M1105 359v50" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/>
  <text x="24" y="670" fill="#94a3b8" font-size="14" font-family="Segoe UI, Arial">
    Generated demo evidence - non-field photo artifact for BOF presentation
  </text>
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
    const common = {
      loadId: load.id,
      customer,
      driver: `${driverName} (${load.driverId})`,
      timestamp: ts,
      warning,
    };

    const cargoPhoto = writeEvidenceSvg(
      load.id,
      "cargo-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Cargo Photo",
        location: load.origin,
        status: "Pallets secured / cargo condition recorded",
      })
    );
    const sealPhoto = writeEvidenceSvg(
      load.id,
      "seal-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Seal Photo",
        location: `${load.origin} -> ${load.destination}`,
        status: `Seal captured at pickup/delivery (${load.pickupSeal || "N/A"} / ${load.deliverySeal || "N/A"})`,
      })
    );
    const equipmentPhoto = writeEvidenceSvg(
      load.id,
      "equipment-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Equipment Photo",
        location: load.origin,
        status: `Equipment inspection recorded (truck ${load.assetId}, trailer TR-${String(load.assetId || "").replace(/^T-/, "")})`,
      })
    );
    const pickupPhoto = writeEvidenceSvg(
      load.id,
      "pickup-photo.svg",
      renderEvidenceSvg({
        ...common,
        title: "Pickup Photo",
        location: load.origin,
        status: "Pickup proof captured",
      })
    );

    manifest[load.id] = {
      cargoPhoto,
      sealPhoto,
      equipmentPhoto,
      pickupPhoto,
    };
  }

  ensureDir(EVIDENCE_ROOT);
  writeJson(PUBLIC_MANIFEST_PATH, manifest);
  writeJson(LIB_MANIFEST_PATH, manifest);
  console.log(`Generated load evidence for ${Object.keys(manifest).length} loads.`);
}

main();

