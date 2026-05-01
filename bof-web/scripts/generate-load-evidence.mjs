import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateEvidenceImage } from "./lib/generate-ai-image.mjs";
import { buildEvidenceImagePrompt } from "./lib/build-evidence-image-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const PUBLIC_ROOT = path.join(ROOT, "public");
const EVIDENCE_ROOT = path.join(PUBLIC_ROOT, "evidence", "loads");
const PUBLIC_MANIFEST_PATH = path.join(EVIDENCE_ROOT, "load-evidence-manifest.json");
const LIB_MANIFEST_PATH = path.join(ROOT, "lib", "generated", "load-evidence-manifest.json");
const SOURCE_HINT = "Generated demo evidence";
const EVIDENCE_KEYS = [
  "cargoPhoto",
  "pickupPhoto",
  "deliveryPhoto",
  "equipmentPhoto",
  "sealPickupPhoto",
  "sealDeliveryPhoto",
  "emptyTrailerProof",
  "lumperReceipt",
  "cargoDamagePhoto",
  "claimEvidence",
  "rfidDockProof",
  "sealMismatchPhoto",
  "damagedPalletPhoto",
  "tempCheckPhoto",
  "weightTicketPhoto",
  "detentionProofPhoto",
  "safetyViolationPhoto",
];
const AI_PROMPT_TYPES = new Set([
  "cargoPhoto",
  "cargoDamagePhoto",
  "emptyTrailerProof",
  "sealPickupPhoto",
  "sealDeliveryPhoto",
  "equipmentPhoto",
  "pickupPhoto",
  "deliveryPhoto",
  "lumperReceipt",
  "claimEvidence",
  "rfidDockProof",
]);

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
  <text x="24" y="698" fill="#94a3b8" font-size="14" font-family="Segoe UI, Arial">${SOURCE_HINT}</text>
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

function resolveExistingEvidence(loadId, baseName) {
  const exts = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".pdf", ".html"];
  for (const ext of exts) {
    const p = path.join(EVIDENCE_ROOT, loadId, `${baseName}${ext}`);
    if (!fs.existsSync(p)) continue;
    const source = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".html"].includes(ext)
      ? "real"
      : "svg_demo";
    return {
      url: `/evidence/loads/${loadId}/${baseName}${ext}`,
      source,
      label: baseName,
    };
  }
  return undefined;
}

function canGenerateAi(options) {
  if (!options.aiEnabled) return false;
  if (!options.apiKey) return false;
  return true;
}

function outputExt(options) {
  const fmt = String(options.outputFormat || "png").toLowerCase();
  return fmt === "jpg" || fmt === "jpeg" ? "jpg" : "png";
}

async function resolveOrGenerate(load, evidenceKey, baseName, svgFactory, options, stats) {
  const aiEligible = AI_PROMPT_TYPES.has(evidenceKey) && canGenerateAi(options);
  const existing = resolveExistingEvidence(load.id, baseName);
  const shouldRegenerate = Boolean(options.regenerate);
  const shouldKeepExisting =
    existing &&
    !shouldRegenerate &&
    (existing.source === "real" || (!aiEligible && existing.source === "svg_demo"));
  if (shouldKeepExisting) {
    stats.reused += 1;
    return existing;
  }
  if (aiEligible) {
    const ext = outputExt(options);
    const prompt = buildEvidenceImagePrompt(load, evidenceKey);
    const outPath = path.join(EVIDENCE_ROOT, load.id, `${baseName}.${ext}`);
    try {
      await generateEvidenceImage({
        provider: options.provider,
        apiKey: options.apiKey,
        model: options.model,
        prompt,
        outputPath: outPath,
        outputFormat: ext,
      });
      stats.aiGenerated += 1;
      return {
        url: `/evidence/loads/${load.id}/${baseName}.${ext}`,
        source: "ai_generated",
        label: baseName,
        promptSummary: evidenceKey,
        generatedAt: isoNow(),
      };
    } catch (error) {
      stats.aiFailed += 1;
      console.warn(`[generate-load-evidence] AI failed for ${load.id}/${evidenceKey}: ${error}`);
    }
  }

  const url = writeEvidenceSvg(load.id, `${baseName}.svg`, svgFactory());
  stats.svgGenerated += 1;
  return {
    url,
    source: "svg_demo",
    label: baseName,
  };
}

function getenvBool(name, fallback = false) {
  const value = String(process.env[name] ?? "").trim().toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

async function main() {
  const data = readJson(DATA_PATH);
  const manifest = {};
  const argvAi = process.argv.includes("--enable-ai");
  const aiEnabled = argvAi || getenvBool("BOF_ENABLE_AI_IMAGE_GENERATION", false);
  const provider = String(process.env.BOF_IMAGE_PROVIDER || "openai").toLowerCase();
  const outputFormat = String(process.env.BOF_IMAGE_OUTPUT_FORMAT || "png").toLowerCase();
  const model = String(process.env.BOF_IMAGE_MODEL || "").trim() || undefined;
  const apiKey = process.env.OPENAI_API_KEY;
  const regenerate = getenvBool("BOF_REGENERATE_EVIDENCE", false);
  const options = { aiEnabled, provider, outputFormat, model, apiKey, regenerate };
  const stats = {
    loads: 0,
    required: 0,
    reused: 0,
    svgGenerated: 0,
    aiGenerated: 0,
    aiFailed: 0,
    unresolved: 0,
  };

  if (aiEnabled && !apiKey) {
    console.warn(
      "[generate-load-evidence] BOF_ENABLE_AI_IMAGE_GENERATION=true but OPENAI_API_KEY is missing. Falling back to SVG."
    );
  }

  for (const load of data.loads ?? []) {
    stats.loads += 1;
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

    const cargoPhoto = await resolveOrGenerate(load, "cargoPhoto", "cargo-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Cargo Photo",
        evidenceType: "cargo_photo",
        location: `${load.origin} → ${load.destination}`,
        facility: load.origin,
        status: "Pallets secured / cargo condition recorded",
        sealNumber: load.pickupSeal || "",
      }), options, stats);
    const sealPhoto = await resolveOrGenerate(load, "sealPhoto", "seal-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Seal Photo",
        evidenceType: "seal_photo",
        location: `${load.origin} → ${load.destination}`,
        facility: "Pickup & delivery checkpoints",
        status: `Seal chain recorded (${load.pickupSeal || "N/A"} / ${load.deliverySeal || "N/A"})`,
        sealNumber: `${load.pickupSeal || "—"} / ${load.deliverySeal || "—"}`,
      }), options, stats);
    const equipmentPhoto = await resolveOrGenerate(load, "equipmentPhoto", "equipment-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Equipment Photo",
        evidenceType: "equipment_photo",
        location: load.origin,
        facility: load.origin,
        status: `Equipment inspection recorded`,
        sealNumber: "",
      }), options, stats);
    const pickupPhoto = await resolveOrGenerate(load, "pickupPhoto", "pickup-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Pickup Photo",
        evidenceType: "pickup_photo",
        location: load.origin,
        facility: load.origin,
        status: "Pickup proof captured",
        sealNumber: load.pickupSeal || "",
      }), options, stats);
    const deliveryPhoto = await resolveOrGenerate(load, "deliveryPhoto", "delivery-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Delivery Photo",
        evidenceType: "delivery_photo",
        location: load.destination,
        facility: load.destination,
        status: "Delivery proof captured",
        sealNumber: load.deliverySeal || "",
      }), options, stats);
    const sealPickupPhoto = await resolveOrGenerate(load, "sealPickupPhoto", "seal-pickup-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Seal Pickup Photo",
        evidenceType: "seal_pickup_photo",
        location: load.origin,
        facility: load.origin,
        status: `Seal captured at pickup`,
        sealNumber: load.pickupSeal || "N/A",
      }), options, stats);
    const sealDeliveryPhoto = await resolveOrGenerate(load, "sealDeliveryPhoto", "seal-delivery-photo", () =>
      renderEvidenceSvg({
        ...common,
        title: "Seal Delivery Photo",
        evidenceType: "seal_delivery_photo",
        location: load.destination,
        facility: load.destination,
        status: `Seal captured at delivery`,
        sealNumber: load.deliverySeal || "N/A",
      }), options, stats);
    const emptyTrailerProof = await resolveOrGenerate(load, "emptyTrailerProof", "empty-trailer-proof", () =>
      renderEvidenceSvg({
        ...common,
        title: "Empty Trailer Proof",
        evidenceType: "empty_trailer_proof",
        location: load.destination,
        facility: load.destination,
        status: "Trailer empty after delivery",
        sealNumber: load.deliverySeal || "",
        warning: "",
      }), options, stats);
    const rfidDockProof = await resolveOrGenerate(load, "rfidDockProof", "rfid-dock-proof", () =>
      renderEvidenceSvg({
        ...common,
        title: "RFID Dock Proof",
        evidenceType: "rfid_dock_proof",
        location: `${load.origin} dock`,
        facility: load.origin,
        status: "RFID dock validation record",
        sealNumber: load.pickupSeal || "",
      }), options, stats);
    const sealMismatchPhoto = String(load.sealStatus).toUpperCase() === "MISMATCH"
      ? await resolveOrGenerate(load, "sealMismatchPhoto", "seal-mismatch-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Seal Mismatch Photo",
            evidenceType: "seal_mismatch_photo",
            location: `${load.origin} → ${load.destination}`,
            facility: "Exception corridor",
            status: "Seal mismatch observed",
            sealNumber: `${load.pickupSeal || "—"} / ${load.deliverySeal || "—"}`,
            warning: "Seal mismatch - claim review required",
          }), options, stats)
      : undefined;
    const tempControlled = /reefer|temp|cold/i.test(
      `${load.commodity || ""} ${load.dispatchOpsNotes || ""}`
    );
    const tempCheckPhoto = tempControlled
      ? await resolveOrGenerate(load, "tempCheckPhoto", "temp-check-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Temperature Check Photo",
            evidenceType: "temp_check_photo",
            location: `${load.origin} → ${load.destination}`,
            facility: "In-transit checks",
            status: "Temperature evidence captured",
            sealNumber: "",
          }), options, stats)
      : undefined;
    const weightTicketPhoto = Number(load.weight || 0) > 0
      ? await resolveOrGenerate(load, "weightTicketPhoto", "weight-ticket-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Weight Ticket Photo",
            evidenceType: "weight_ticket_photo",
            location: load.origin,
            facility: load.origin,
            status: "Scale / weight evidence captured",
            sealNumber: "",
          }), options, stats)
      : undefined;
    const detentionProofPhoto = /detention|delay|hold/i.test(String(load.dispatchOpsNotes || ""))
      ? await resolveOrGenerate(load, "detentionProofPhoto", "detention-proof-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Detention Proof Photo",
            evidenceType: "detention_proof_photo",
            location: load.destination,
            facility: load.destination,
            status: "Detention/accessorial evidence",
            sealNumber: "",
          }), options, stats)
      : undefined;
    const lumperReceipt = hasLumperIssue(load, data.settlements)
      ? await resolveOrGenerate(load, "lumperReceipt", "lumper-receipt", () =>
          renderEvidenceSvg({
            ...common,
            title: "Lumper Receipt",
            evidenceType: "lumper_receipt",
            location: load.destination,
            facility: load.destination,
            status: "Lumper receipt pending/review tracked for settlement",
            sealNumber: "",
          }), options, stats)
      : undefined;
    const hasClaim = Boolean(load.dispatchExceptionFlag || String(load.sealStatus).toUpperCase() === "MISMATCH");
    const damagePhoto = hasClaim
      ? await resolveOrGenerate(load, "cargoDamagePhoto", "cargo-damage-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Cargo Damage Evidence",
            evidenceType: "damage_photo",
            location: `${load.origin} → ${load.destination}`,
            facility: "Exception corridor",
            status: "Damage observed / claim review required",
            sealNumber: `${load.pickupSeal || "—"} → ${load.deliverySeal || "—"}`,
            warning: warning || "Claim review required",
          }), options, stats)
      : undefined;
    const damagedPalletPhoto = hasClaim
      ? await resolveOrGenerate(load, "damagedPalletPhoto", "damaged-pallet-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Damaged Pallet Photo",
            evidenceType: "damaged_pallet_photo",
            location: `${load.origin} → ${load.destination}`,
            facility: "Claim packet support",
            status: "Damaged pallet evidence captured",
            sealNumber: "",
            warning: warning || undefined,
          }), options, stats)
      : undefined;
    const claimEvidence = hasClaim
      ? await resolveOrGenerate(load, "claimEvidence", "claim-evidence", () =>
          renderEvidenceSvg({
            ...common,
            title: "Claim Evidence Summary",
            evidenceType: "claim_evidence",
            location: `${load.origin} → ${load.destination}`,
            facility: "Claims desk queue",
            status: "Structured claim evidence placeholder (demo)",
            sealNumber: load.sealStatus || "",
            warning: warning || undefined,
          }), options, stats)
      : undefined;
    const safetyViolationPhoto = /safety/i.test(String(load.dispatchOpsNotes || ""))
      ? await resolveOrGenerate(load, "safetyViolationPhoto", "safety-violation-photo", () =>
          renderEvidenceSvg({
            ...common,
            title: "Safety Violation Photo",
            evidenceType: "safety_violation_photo",
            location: load.origin,
            facility: "Safety escalation lane",
            status: "Safety event evidence attached",
            sealNumber: "",
            warning: "Safety event linked to load",
          }), options, stats)
      : undefined;

    manifest[load.id] = {
      cargoPhoto,
      sealPhoto,
      sealPickupPhoto,
      sealDeliveryPhoto,
      equipmentPhoto,
      pickupPhoto,
      deliveryPhoto,
      emptyTrailerProof,
      rfidDockProof,
      ...(sealMismatchPhoto ? { sealMismatchPhoto } : {}),
      ...(tempCheckPhoto ? { tempCheckPhoto } : {}),
      ...(weightTicketPhoto ? { weightTicketPhoto } : {}),
      ...(detentionProofPhoto ? { detentionProofPhoto } : {}),
      ...(lumperReceipt ? { lumperReceipt } : {}),
      ...(damagePhoto ? { cargoDamagePhoto: damagePhoto, damagePhoto } : {}),
      ...(damagedPalletPhoto ? { damagedPalletPhoto } : {}),
      ...(claimEvidence ? { claimEvidence } : {}),
      ...(safetyViolationPhoto ? { safetyViolationPhoto } : {}),
    };
    stats.required += EVIDENCE_KEYS.length;
    console.log(
      `[generate-load-evidence] load=${load.id} files=${Object.keys(manifest[load.id]).length} out=${PUBLIC_MANIFEST_PATH}`
    );
  }

  ensureDir(EVIDENCE_ROOT);
  writeJson(PUBLIC_MANIFEST_PATH, manifest);
  writeJson(LIB_MANIFEST_PATH, manifest);
  console.log(
    `[generate-load-evidence] loads=${stats.loads} required=${stats.required} reused=${stats.reused} ai_generated=${stats.aiGenerated} svg_generated=${stats.svgGenerated} ai_failed=${stats.aiFailed} unresolved=${stats.unresolved} manifest=${PUBLIC_MANIFEST_PATH}`
  );
}

await main();
