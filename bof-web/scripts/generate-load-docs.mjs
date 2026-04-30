import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const TEMPLATE_DIR = path.join(ROOT, "scripts", "templates", "load-docs");
const OUT_DIR = path.join(ROOT, "public", "generated", "loads");
const PUBLIC_MANIFEST = path.join(OUT_DIR, "load-doc-manifest.json");
const LIB_MANIFEST = path.join(ROOT, "lib", "generated", "load-doc-manifest.json");

const CORE_DOCS = ["rateConfirmation", "bol", "pod", "invoice"];

const TEMPLATE_MAP = {
  rateConfirmation: "rate-confirmation.template.html",
  bol: "bol.template.html",
  pod: "pod.template.html",
  invoice: "invoice.template.html",
  lumperReceipt: "lumper-receipt.template.html",
  sealVerification: "seal-verification.template.html",
  rfidProof: "rfid-proof.template.html",
  claimPacket: "claim-packet.template.html",
};

const FILE_MAP = {
  rateConfirmation: "rate-confirmation.html",
  bol: "bol.html",
  pod: "pod.html",
  invoice: "invoice.html",
  lumperReceipt: "lumper-receipt.html",
  sealVerification: "seal-verification.html",
  rfidProof: "rfid-proof.html",
  claimPacket: "claim-packet.html",
};

const SHARED_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #0f172a; }
  header { border-bottom: 2px solid #0f172a; margin-bottom: 16px; padding-bottom: 8px; }
  h1 { margin: 0; font-size: 20px; }
  h2 { margin: 8px 0 14px; font-size: 16px; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
  td:first-child { width: 210px; font-weight: 600; background: #f8fafc; }
  footer { margin-top: 16px; font-size: 12px; color: #334155; }
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
    commodity: "Mixed Dry Goods",
    weight: String(42000 + Number(load.number || 0)),
    piecesPallets: "26 pallets",
    rate: money(rate),
    accessorials: money(backhaulPay),
    lumper: lumperCharge > 0 ? money(lumperCharge) : "N/A",
    bolNumber: `BOL-${load.id}-${load.number}`,
    invoiceNumber: `INV-${load.id}-${load.number}`,
    invoiceTotal: money(rate + backhaulPay + lumperCharge),
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
    lumperRequired: lumperFromSettlement,
    rfidWorkflow: true,
  };
}

function writeDoc(loadId, fileName, html) {
  const dir = path.join(OUT_DIR, loadId);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, fileName), html, "utf8");
  return `/generated/loads/${loadId}/${fileName}`;
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

    for (const [docKey, fileName] of Object.entries(FILE_MAP)) {
      if (!(docKey in TEMPLATE_MAP)) continue;
      if (docKey === "lumperReceipt" && !ctx.lumperRequired) continue;
      if (!shouldEmit(docKey, ctx)) continue;
      const html = renderTemplate(templates[docKey], { ...ctx, styles: SHARED_STYLES });
      entry[docKey] = writeDoc(ctx.loadId, fileName, html);
    }

    for (const required of CORE_DOCS) {
      if (!entry[required]) {
        throw new Error(`Missing required generated doc ${required} for ${ctx.loadId}`);
      }
    }
    manifest[ctx.loadId] = entry;
  }

  fs.writeFileSync(PUBLIC_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  ensureDir(path.dirname(LIB_MANIFEST));
  fs.writeFileSync(LIB_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated load docs for ${Object.keys(manifest).length} loads.`);
}

main();
