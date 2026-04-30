import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const TEMPLATE_DIR = path.join(ROOT, "scripts", "templates", "load-docs");
const OUT_DIR = path.join(ROOT, "public", "generated", "loads");
const PUBLIC_DIR = path.join(ROOT, "public");
const MOCKS_DIR = path.join(PUBLIC_DIR, "mocks");
const PUBLIC_MANIFEST = path.join(OUT_DIR, "load-doc-manifest.json");
const LIB_MANIFEST = path.join(ROOT, "lib", "generated", "load-doc-manifest.json");

const CORE_DOCS = ["rateConfirmation", "bol", "pod", "invoice"];

const TEMPLATE_MAP = {
  rateConfirmation: "rate-confirmation.template.html",
  bol: "bol.template.html",
  pod: "pod.template.html",
  invoice: "invoice.template.html",
  sealVerification: "seal-verification.template.html",
  rfidProof: "rfid-proof.template.html",
  claimPacket: "claim-packet.template.html",
};

const FILE_MAP = {
  rateConfirmation: "rate-confirmation.html",
  bol: "bol.html",
  pod: "pod.html",
  invoice: "invoice.html",
  sealVerification: "seal-verification.html",
  rfidProof: "rfid-proof.html",
  claimPacket: "claim-packet.html",
};

const SHARED_STYLES = `
  @page { size: auto; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font-family: "Inter", "Segoe UI", Arial, Helvetica, sans-serif; margin: 0; background: #f3f4f6; color: #111827; }
  .paper { width: 8.5in; max-width: 100%; margin: 20px auto; background: #fff; border: 1px solid #d1d5db; padding: 26px; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08); }
  .doc-header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 14px; }
  .doc-title { margin: 0; font-size: 22px; letter-spacing: .2px; }
  .generated-label { margin-top: 4px; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: .08em; }
  .status-stamp { border: 2px solid #111827; padding: 6px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
  .meta-grid, .entity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
  .meta-box { border: 1px solid #d1d5db; background: #f9fafb; padding: 8px; }
  .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #4b5563; margin-bottom: 4px; }
  .meta-value { font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #d1d5db; padding: 7px 8px; vertical-align: top; text-align: left; font-size: 12px; }
  th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #374151; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .section-title { margin: 14px 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #1f2937; }
  .sig-line { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sig-slot { border-top: 1px solid #1f2937; padding-top: 4px; font-size: 11px; color: #4b5563; }
  .terms-box { border: 1px solid #d1d5db; background: #f9fafb; padding: 10px; font-size: 11px; color: #374151; }
  .barcode-ref { margin-top: 10px; display: inline-block; font-family: "Courier New", monospace; letter-spacing: 2px; font-size: 11px; border: 1px solid #111827; padding: 3px 8px; }
  footer { margin-top: 16px; padding-top: 8px; border-top: 1px dashed #9ca3af; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function money(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00";
}

function yesNo(v) {
  return v ? "Yes" : "No";
}

function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));
}

function sanitizeSegment(v) {
  return String(v ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
}

function deriveLoadContext(data, load) {
  const driver = data.drivers.find((d) => d.id === load.driverId);
  const settlement = data.settlements?.find((s) => s.driverId === load.driverId) ?? null;
  const hasSealData = Boolean(String(load.pickupSeal || "").trim() || String(load.deliverySeal || "").trim());
  const hasClaim = Boolean(load.dispatchExceptionFlag || load.sealStatus === "Mismatch");
  const lumperFromSettlement = /lumper/i.test(String(settlement?.pendingReason ?? ""));
  const laneOrigin = sanitizeSegment(load.origin);
  const laneDestination = sanitizeSegment(load.destination);
  const pickupFacility = laneOrigin.split(" ")[0] ? laneOrigin : "Origin Facility";
  const deliveryFacility = laneDestination.split(" ")[0] ? laneDestination : "Destination Facility";
  const rate = Number(load.revenue ?? 0);
  const backhaulPay = Number(load.backhaulPay ?? 0);
  const lumperCharge = lumperFromSettlement ? 185 : 0;
  const detention = load.status === "En Route" ? 0 : 75;
  const fuelSurcharge = Math.round(rate * 0.09 * 100) / 100;
  const now = new Date();
  const generatedAt = now.toISOString();
  const dateKey = now.toISOString().slice(0, 10).replaceAll("-", "");
  const loadDate = `${now.getUTCMonth() + 1}/${now.getUTCDate()}/${now.getUTCFullYear()}`;
  const totalAmount = rate + fuelSurcharge + backhaulPay + (lumperCharge > 0 ? lumperCharge : 0) + detention;

  return {
    loadId: load.id,
    loadNumber: load.number,
    customer: laneOrigin.split(" ")[0] || "BOF Customer",
    carrier: "BackOfficeFleet Carrier Group",
    driverId: load.driverId,
    driverName: driver?.name ?? load.driverId,
    truckNumber: load.assetId,
    trailerNumber: `TR-${String(load.assetId || "").replace(/^T-/, "") || "000"}`,
    pickupFacility,
    pickupAddress: load.origin,
    pickupAppointment: `${load.id} 08:00 local`,
    deliveryFacility,
    deliveryAddress: load.destination,
    deliveryAppointment: `${load.id} 16:00 local`,
    pickupDate: `${loadDate} 08:00`,
    deliveryDate: `${loadDate} 16:00`,
    commodity: "Mixed Dry Goods",
    weight: String(42000 + Number(load.number || 0)),
    piecesPallets: "26 pallets",
    equipmentType: "53' Dry Van",
    nmfcClass: "NMFC 156600 / Class 70 (demo)",
    rate: money(rate),
    fuelSurcharge: money(fuelSurcharge),
    accessorials: money(backhaulPay + detention),
    detention: detention > 0 ? money(detention) : "$0.00",
    backhaulPay: backhaulPay > 0 ? money(backhaulPay) : "$0.00",
    lumper: lumperCharge > 0 ? money(lumperCharge) : "$0.00",
    lumperRequired: yesNo(lumperFromSettlement),
    bolNumber: `BOL-${load.id}-${load.number}`,
    invoiceNumber: `INV-${dateKey}-${load.number}`,
    rateConfirmationNumber: `RC-${dateKey}-${load.number}`,
    podNumber: `POD-${dateKey}-${load.number}`,
    invoiceTotal: money(totalAmount),
    podStatus: load.podStatus,
    claimStatus: hasClaim ? "Open review" : "No claim",
    settlementStatus: settlement?.status ?? "Pending",
    sealPickup: String(load.pickupSeal || "N/A"),
    sealDelivery: String(load.deliverySeal || "N/A"),
    sealStatus: load.sealStatus,
    loadStatus: load.status,
    rfidTag: `RFID-${load.id}`,
    exceptionNotes: load.dispatchOpsNotes || "Dispatch exception workflow in review.",
    hasSealData,
    hasClaim,
    rfidWorkflow: true,
    generatedAt,
    generatedDate: now.toLocaleString("en-US"),
    statusStamp:
      load.status === "Delivered"
        ? "Delivered"
        : load.status === "En Route"
          ? "In Transit"
          : "Pending Review",
    receivedBy: "Receiving Clerk",
    conditionAtDelivery: hasClaim ? "Exception noted - review required" : "Received in apparent good condition",
    paymentTerms: "Net 30 from POD receipt",
    remittanceNote: "Remit to BOF Demo Clearing · ACH Ref: BOF-DEMO",
    claimExposure: hasClaim ? money(Math.max(450, Math.round(rate * 0.18))) : "$0.00",
  };
}

function writeDoc(loadId, fileName, html) {
  const dir = path.join(OUT_DIR, loadId);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, fileName), html, "utf8");
  return `/generated/loads/${loadId}/${fileName}`;
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function publicUrlFromAbsolute(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath).replaceAll("\\", "/");
  return `/${rel}`;
}

function fileExists(absPath) {
  return fs.existsSync(absPath);
}

function firstExisting(paths) {
  for (const p of paths) {
    if (fileExists(p)) return p;
  }
  return null;
}

function evidencePathForLoad(loadId, fileName) {
  return path.join(PUBLIC_DIR, "evidence", "loads", loadId, fileName);
}

function resolveEvidenceEntry(loadId, candidates) {
  const found = firstExisting(candidates.map((name) => evidencePathForLoad(loadId, name)));
  if (found) return publicUrlFromAbsolute(found);
  return undefined;
}

function resolveMockEvidence(mockFile) {
  const abs = path.join(MOCKS_DIR, mockFile);
  if (!fileExists(abs)) return undefined;
  return `/mocks/${mockFile}`;
}

function shouldEmit(docKey, ctx) {
  if (docKey === "sealVerification") return ctx.hasSealData;
  if (docKey === "claimPacket") return ctx.hasClaim;
  if (docKey === "rfidProof") return ctx.rfidWorkflow;
  return true;
}

function main() {
  const data = readJson(DATA_PATH);
  ensureDir(OUT_DIR);

  const templates = {};
  for (const [k, file] of Object.entries(TEMPLATE_MAP)) {
    templates[k] = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf8");
  }

  const manifest = {};

  for (const load of data.loads || []) {
    const ctx = deriveLoadContext(data, load);
    const entry = {};

    const cargoPhoto =
      resolveEvidenceEntry(ctx.loadId, ["cargo-photo.jpg", "cargo-photo.png"]) ||
      resolveMockEvidence("mock_cargo.jpg");
    const sealPickupPhoto =
      resolveEvidenceEntry(ctx.loadId, ["seal-pickup.jpg", "seal-pickup.png"]) ||
      resolveMockEvidence("mock_seal.jpg");
    const sealDeliveryPhoto =
      resolveEvidenceEntry(ctx.loadId, ["seal-delivery.jpg", "seal-delivery.png"]) ||
      resolveMockEvidence("mock_seal.jpg");
    const lumperReceipt =
      resolveEvidenceEntry(ctx.loadId, ["lumper-receipt.jpg", "lumper-receipt.png"]) ||
      (ctx.lumperRequired === "Yes" ? resolveMockEvidence("mock_seal.jpg") : undefined);
    const damageClaimPhoto =
      resolveEvidenceEntry(ctx.loadId, ["damage-photo.jpg", "damage-photo.png", "claim-photo.jpg"]) ||
      (ctx.hasClaim ? resolveMockEvidence("trailerdamage.PNG") : undefined);
    const safetyViolationPhoto = ctx.hasClaim ? resolveMockEvidence("hosviolation.PNG") : undefined;
    const ctxForTemplates = {
      ...ctx,
      cargoPhotoRef: cargoPhoto || "Not available",
      sealPickupPhotoRef: sealPickupPhoto || "Not available",
      sealDeliveryPhotoRef: sealDeliveryPhoto || "Not available",
      damageClaimPhotoRef: damageClaimPhoto || "Not available",
      safetyViolationPhotoRef: safetyViolationPhoto || "Not available",
    };

    for (const [docKey, fileName] of Object.entries(FILE_MAP)) {
      if (!(docKey in TEMPLATE_MAP)) continue;
      if (!shouldEmit(docKey, ctx)) continue;
      const html = renderTemplate(templates[docKey], { ...ctxForTemplates, styles: SHARED_STYLES });
      entry[docKey] = writeDoc(ctx.loadId, fileName, html);
    }

    if (cargoPhoto) entry.cargoPhoto = cargoPhoto;
    if (sealPickupPhoto) entry.sealPickupPhoto = sealPickupPhoto;
    if (sealDeliveryPhoto) entry.sealDeliveryPhoto = sealDeliveryPhoto;
    if (lumperReceipt) entry.lumperReceipt = lumperReceipt;
    if (damageClaimPhoto) entry.damageClaimPhoto = damageClaimPhoto;
    if (safetyViolationPhoto) entry.safetyViolationPhoto = safetyViolationPhoto;

    for (const required of CORE_DOCS) {
      if (!entry[required]) {
        throw new Error(`Missing required generated doc ${required} for ${ctx.loadId}`);
      }
    }
    manifest[ctx.loadId] = entry;
  }

  writeJson(PUBLIC_MANIFEST, manifest);
  writeJson(LIB_MANIFEST, manifest);
  console.log(`Generated load docs for ${Object.keys(manifest).length} loads.`);
}

main();
