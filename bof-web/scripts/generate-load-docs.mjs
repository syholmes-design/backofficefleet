import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  resolveLoadDocumentTemplate,
  resolveSharedDocumentStyles,
  LOAD_DOCUMENT_TEMPLATE_FILES,
} from "./lib/resolve-load-document-template.mjs";
import { buildLoadSignaturePlaceholders } from "./lib/load-signatures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const OUT_DIR = path.join(ROOT, "public", "generated", "loads");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_MANIFEST = path.join(OUT_DIR, "load-doc-manifest.json");
const LIB_MANIFEST = path.join(ROOT, "lib", "generated", "load-doc-manifest.json");

const CORE_DOCS = ["rateConfirmation", "bol", "pod", "invoice"];

/** Primary safety still image per load (matches `lib/safety-evidence.ts` URLs). */
const SAFETY_STILL_URL_BY_LOAD_ID = {
  L004: "/evidence/safety/b102-tires-irregular-wear.png",
  L008: "/evidence/safety/l405-hos-eld-violation.png",
};

const FILE_MAP = {
  rateConfirmation: "rate-confirmation.html",
  bol: "bol.html",
  pod: "pod.html",
  invoice: "invoice.html",
  workOrder: "work-order.html",
  masterAgreementReference: "master-agreement-reference.html",
  sealVerification: "seal-verification.html",
  rfidProof: "rfid-proof.html",
  claimIntake: "claim-intake.html",
  insuranceNotification: "insurance-notification.html",
  factoringNotification: "factoring-notification.html",
  settlementHoldNotice: "settlement-hold-notice.html",
  damagePhotoPacket: "damage-photo-packet.html",
  claimPacket: "claim-packet.html",
  lumperReceipt: "lumper-receipt.html",
};

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

function deriveLoadContext(data, load, now = new Date()) {
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
  const generatedAt = now.toISOString();
  const dateKey = now.toISOString().slice(0, 10).replaceAll("-", "");
  const loadDate = `${now.getUTCMonth() + 1}/${now.getUTCDate()}/${now.getUTCFullYear()}`;
  const totalAmount = rate + fuelSurcharge + backhaulPay + (lumperCharge > 0 ? lumperCharge : 0) + detention;
  const customer = laneOrigin.split(" ")[0] || "BOF Customer";

  const rawMaId = load.masterAgreementId != null ? String(load.masterAgreementId).trim() : "";
  const hasFormalMasterAgreement = Boolean(rawMaId);
  const masterAgreementId = hasFormalMasterAgreement
    ? rawMaId
    : "— Pending / needs review —";
  const masterAgreementDate =
    load.masterAgreementDate != null && String(load.masterAgreementDate).trim()
      ? String(load.masterAgreementDate).trim()
      : hasFormalMasterAgreement
        ? "01/15/2026"
        : "—";
  const masterAgreementStamp = hasFormalMasterAgreement ? "Active MA" : "Draft ref";
  const masterAgreementLegalNote = hasFormalMasterAgreement
    ? `This movement is executed under Master Agreement ${rawMaId} (effective ${masterAgreementDate}). The Schedule / Work Order for load ${load.id} supplements that agreement for this shipment only.`
    : `No executed master agreement ID is on file for this customer in demo data. This page is a draft reference generated only from the approved BOF master-agreement reference template — obtain countersigned MA before production dispatch.`;

  const workOrderId = load.workOrderId != null && String(load.workOrderId).trim()
    ? String(load.workOrderId).trim()
    : `WO-${load.id}-${load.number}`;
  const claimRequired = hasClaim;
  const settlementHold = String(load.podStatus).toLowerCase() !== "verified";
  const claimPacketLink = hasClaim
    ? `/generated/loads/${load.id}/claim-packet.html`
    : "Not applicable";
  const insuranceNotificationStatus = hasClaim
    ? "Queued for carrier/insurance review"
    : "Not required";

  return {
    loadId: load.id,
    loadNumber: load.number,
    customer,
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
    masterAgreementId,
    masterAgreementDate,
    masterAgreementStamp,
    masterAgreementLegalNote,
    workOrderId,
    claimRequired: yesNo(claimRequired),
    settlementHold: yesNo(settlementHold),
    claimDate: loadDate,
    claimPacketLink,
    insuranceNotificationStatus,
    hasFormalMasterAgreement: yesNo(hasFormalMasterAgreement),
  };
}

function writeDoc(loadId, docType, fileName, html, templateRelativePath) {
  const dir = path.join(OUT_DIR, loadId);
  ensureDir(dir);
  const outPath = path.join(dir, fileName);
  const withSource = [
    `<!-- BOF_TEMPLATE_SOURCE: ${templateRelativePath} -->`,
    `<!-- BOF_DOCUMENT_TYPE: ${docType} -->`,
    `<!-- BOF_LOAD_ID: ${loadId} -->`,
    html,
  ].join("\n");
  fs.writeFileSync(outPath, withSource, "utf8");
  return `/generated/loads/${loadId}/${fileName}`;
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;");
}

function parseUsLocalDateTime(str, fallback) {
  const fb = fallback instanceof Date ? fallback : new Date();
  const m = String(str ?? "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return fb;
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  return new Date(year, month, day, hour, minute, 0, 0);
}

function formatScanLocal(d) {
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dockBayFromLoadId(loadId) {
  const n = Number(String(loadId ?? "").replace(/^L/i, ""));
  return Number.isFinite(n) ? String(n).padStart(2, "0") : "01";
}

/**
 * @param {string | undefined} url
 * @param {string} caption
 */
function buildPodPhotoFrame(url, caption) {
  if (!url || typeof url !== "string" || !url.trim()) {
    return `<div class="pod-photo-cell"><div class="pod-photo-frame"><div class="pod-photo-missing">Photo evidence on file — image archived in BOF vault.</div><div class="pod-photo-label">${escText(caption)}</div></div></div>`;
  }
  const u = url.trim();
  return `<div class="pod-photo-cell"><div class="pod-photo-frame"><img src="${escAttr(u)}" alt="" /><div class="pod-photo-label">${escText(caption)}</div></div></div>`;
}

/**
 * Customer-facing POD fields (RFID times are deterministic from delivery timestamp in ctx.deliveryDate).
 * @param {object} ctx load context from deriveLoadContext
 * @param {object} load
 * @param {object | null} driver
 * @param {{ pickupPhoto?: string, deliveryPhoto?: string, sealPickupPhoto?: string, sealDeliveryPhoto?: string, cargoPhoto?: string }} ev
 * @param {Date} runNow
 */
function buildPodTemplateFields(ctx, load, driver, ev, runNow) {
  const beforeUrl = ev.pickupPhoto || ev.sealPickupPhoto || ev.cargoPhoto || "";
  const afterUrl = ev.deliveryPhoto || ev.sealDeliveryPhoto || "";
  const beforeDeliveryPhotoHtml = buildPodPhotoFrame(
    beforeUrl,
    "Before delivery — condition at pickup / gate"
  );
  const afterDeliveryPhotoHtml = buildPodPhotoFrame(
    afterUrl,
    "After delivery — condition at release"
  );

  const deliveryInstant = parseUsLocalDateTime(ctx.deliveryDate, runNow);
  const arrival = new Date(deliveryInstant.getTime() - 30 * 60 * 1000);
  const dockScanT = new Date(deliveryInstant.getTime() - 24 * 60 * 1000);
  const unloadT = new Date(deliveryInstant.getTime());
  const departure = new Date(deliveryInstant.getTime() + 18 * 60 * 1000);

  const trailerTail = String(ctx.trailerNumber ?? "")
    .replace(/^TR-/i, "")
    .trim();
  const podRfidTagId = trailerTail ? `RFID-TR-${trailerTail}` : `RFID-TR-${load.id}`;

  const dockBay = dockBayFromLoadId(load.id);
  const dockBayDisplay = `Dock ${dockBay}`;
  const podReaderLocation = `${ctx.deliveryFacility} — ${dockBayDisplay}`;

  const sealLower = String(ctx.sealStatus ?? "").toLowerCase();
  const sealMismatch = sealLower === "mismatch";
  const sealOk = sealLower === "ok" || sealLower === "match";

  const gpsStatusLine =
    load.status === "Delivered"
      ? "GPS arrival verified within consignee facility geofence."
      : "GPS monitoring attached — delivery confirmation pending.";

  const podDeliveryStatusLine = `${ctx.statusStamp} · POD ${ctx.podStatus}`;

  const shipperContactLine = "Shipping office — contact on file with shipper of record";
  const consigneeContactLine = "Receiving desk — facility contact on file";
  const carrierContactLine = driver?.phone
    ? `Carrier dispatch ${driver.phone}`
    : "Carrier dispatch — on file with carrier operations";

  const podOpsSummary = escText(
    String(load.dispatchOpsNotes ?? ctx.exceptionNotes ?? "Recorded per BOF delivery procedure.")
  );

  const sealMatchStatus = sealMismatch
    ? "MISMATCH — REVIEW REQUIRED"
    : sealOk
      ? "VERIFIED — SEALS RECONCILED"
      : "REVIEW — VERIFY SEAL RECORD";

  const hasException = Boolean(load.dispatchExceptionFlag) || sealMismatch;
  const sealExceptionPacketStatus = hasException
    ? "Created — linked seal verification record available"
    : "Not applicable — no seal exception on file";

  const podChainOfCustody = sealMismatch
    ? "Under review — seal exception coordination active"
    : "Verified — receiver confirmation aligned with RFID dock scans";

  const podTrailerPresence =
    "Confirmed — trailer presence matched at dock reader during unload window";

  const podRfidSealLaneStatus = sealMismatch
    ? "Exception — mismatch flagged; RFID lane reviewed"
    : "Verified — RFID lane consistent with seal capture";

  const podRfidStatus = ctx.rfidWorkflow ? "Active — dock reader synchronized" : "Inactive — lane not equipped";

  const dateKey = runNow.toISOString().slice(0, 10).replaceAll("-", "");
  const bofProofId = `BOF-PROOF-${dateKey}-${load.number}`;
  const vaultId = `VAULT-${load.id}-${load.number}`;

  const podAuditNarrative =
    "Generated from dispatch record, GPS event log, RFID dock reader events, photo evidence bundle, and receiver confirmation. Internal archive references are not displayed on this customer copy.";

  return {
    podDeliveryStatusLine,
    shipperContactLine,
    consigneeContactLine,
    carrierContactLine,
    beforeDeliveryPhotoHtml,
    afterDeliveryPhotoHtml,
    gpsStatusLine,
    dockBayDisplay,
    podRfidTagId,
    podReaderLocation,
    podArrivalScan: formatScanLocal(arrival),
    podDockScan: formatScanLocal(dockScanT),
    podUnloadScan: formatScanLocal(unloadT),
    podDepartureScan: formatScanLocal(departure),
    podChainOfCustody,
    podTrailerPresence,
    podRfidSealLaneStatus,
    podRfidStatus,
    rfidNarrative1: "Trailer tag detected at consignee dock reader.",
    rfidNarrative2: "Trailer presence confirmed during unload window.",
    rfidNarrative3: "RFID dock event matched GPS delivery window.",
    sealMatchStatus,
    sealExceptionPacketStatus,
    podOpsSummary,
    bofProofId,
    vaultId,
    podAuditNarrative,
  };
}

function linkLi(label, url) {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";
  return `<li><a class="doc-link" href="${escAttr(u)}">${escText(label)}</a><div class="mono">${escText(u)}</div></li>`;
}

function packetShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escText(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; max-width: 960px; margin: 0 auto; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .sub { font-size: 13px; color: #94a3b8; margin-bottom: 20px; }
    ul { list-style: none; padding: 0; }
    li { margin: 12px 0; padding: 12px; background: #1e293b; border-radius: 8px; border: 1px solid #334155; }
    .mono { font-size: 11px; color: #94a3b8; margin-top: 6px; word-break: break-all; }
    .doc-link { color: #5eead4; font-weight: 600; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escText(title)}</h1>
  <p class="sub">BOF manifest-backed bundle index — links open existing generated or evidence documents only.</p>
  <ul>${body}</ul>
</body>
</html>`;
}

/** HTML index pages for shipper / billing / insurance / claim bundles (one set per load). */
function writePacketBundlePages(loadId, entry) {
  const loadOut = path.join(OUT_DIR, loadId);
  ensureDir(loadOut);

  const shipBody = [
    ["Rate confirmation", entry.rateConfirmation],
    ["Work order / trip schedule", entry.workOrder],
    ["Bill of Lading", entry.bol],
    ["POD", entry.pod],
    ["Seal verification", entry.sealVerification],
    ["Pickup photo", entry.pickupPhoto],
    ["Cargo photo", entry.cargoPhoto],
    ["Seal pickup photo", entry.sealPickupPhoto],
    ["Seal delivery photo", entry.sealDeliveryPhoto],
    ["Delivery photo", entry.deliveryPhoto],
    ["RFID proof (summary)", entry.rfidProof],
  ]
    .map(([a, b]) => linkLi(a, b))
    .join("");

  const billingBody = [
    ["Invoice", entry.invoice],
    ["Bill of Lading", entry.bol],
    ["POD", entry.pod],
    ["Lumper receipt", entry.lumperReceipt],
    ["Factoring notification", entry.factoringNotification],
  ]
    .map(([a, b]) => linkLi(a, b))
    .join("");

  const insuranceBody = [
    ["Claim intake", entry.claimIntake],
    ["Claim packet", entry.claimPacket],
    ["Damage photo / packet", entry.damagePhotoPacket],
    ["Insurance notification", entry.insuranceNotification],
    ["POD", entry.pod],
    ["BOL", entry.bol],
  ]
    .map(([a, b]) => linkLi(a, b))
    .join("");

  const claimBody = [
    ["Claim intake", entry.claimIntake],
    ["Claim packet", entry.claimPacket],
    ["Damage photo / packet", entry.damagePhotoPacket],
    ["Insurance notification", entry.insuranceNotification],
    ["Pickup photo", entry.pickupPhoto],
    ["Cargo photo", entry.cargoPhoto],
    ["Claim evidence photo", entry.claimEvidence],
  ]
    .map(([a, b]) => linkLi(a, b))
    .join("");

  fs.writeFileSync(
    path.join(loadOut, "shipper-packet.html"),
    packetShell(`Shipper packet — ${loadId}`, shipBody),
    "utf8"
  );
  fs.writeFileSync(
    path.join(loadOut, "billing-packet.html"),
    packetShell(`Billing packet — ${loadId}`, billingBody),
    "utf8"
  );
  fs.writeFileSync(
    path.join(loadOut, "insurance-packet.html"),
    packetShell(`Insurance packet — ${loadId}`, insuranceBody),
    "utf8"
  );
  fs.writeFileSync(
    path.join(loadOut, "claim-packet-bundle.html"),
    packetShell(`Claim packet bundle — ${loadId}`, claimBody),
    "utf8"
  );
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

function safetyPhotoUrlForLoad(loadId) {
  const u = SAFETY_STILL_URL_BY_LOAD_ID[loadId];
  if (!u) return undefined;
  const abs = path.join(PUBLIC_DIR, u.replace(/^\//, "").split("/").join(path.sep));
  return fileExists(abs) ? u : undefined;
}

function shouldEmit(docKey, ctx) {
  if (docKey === "sealVerification") return ctx.hasSealData;
  if (docKey === "claimPacket") return ctx.hasClaim;
  if (docKey === "claimIntake") return ctx.hasClaim;
  if (docKey === "insuranceNotification") return ctx.hasClaim;
  if (docKey === "damagePhotoPacket") return ctx.hasClaim;
  if (docKey === "settlementHoldNotice") return ctx.settlementHold === "Yes";
  if (docKey === "factoringNotification") return true;
  if (docKey === "rfidProof") return ctx.rfidWorkflow;
  if (docKey === "lumperReceipt") return /Yes/i.test(String(ctx.lumperRequired ?? ""));
  return true;
}

function main() {
  const data = readJson(DATA_PATH);
  ensureDir(OUT_DIR);

  const { css: sharedStyles, relativeFromWebRoot: sharedStylesRel } = resolveSharedDocumentStyles();

  const templateBodies = {};
  for (const docType of Object.keys(LOAD_DOCUMENT_TEMPLATE_FILES)) {
    const { absolutePath, relativeFromWebRoot } = resolveLoadDocumentTemplate(docType);
    templateBodies[docType] = {
      html: fs.readFileSync(absolutePath, "utf8"),
      relativeFromWebRoot,
    };
  }

  const manifest = {};

  const runNow = new Date();
  for (const load of data.loads || []) {
    const ctx = deriveLoadContext(data, load, runNow);
    const driver = data.drivers?.find((d) => d.id === load.driverId) ?? null;
    const signaturePlaceholders = buildLoadSignaturePlaceholders(load, driver, runNow);
    const entry = {};

    const cargoPhoto = resolveEvidenceEntry(ctx.loadId, ["cargo-photo.svg", "cargo-photo.jpg", "cargo-photo.png"]);
    const sealPickupPhoto = resolveEvidenceEntry(ctx.loadId, ["seal-pickup-photo.svg", "seal-pickup.jpg", "seal-pickup.png"]);
    const sealDeliveryPhoto = resolveEvidenceEntry(ctx.loadId, ["seal-delivery-photo.svg", "seal-delivery.jpg", "seal-delivery.png"]);
    const equipmentPhoto = resolveEvidenceEntry(ctx.loadId, ["equipment-photo.svg", "equipment-photo.jpg", "equipment-photo.png"]);
    const pickupPhoto = resolveEvidenceEntry(ctx.loadId, ["pickup-photo.svg", "pickup-photo.jpg", "pickup-photo.png"]);
    const deliveryPhoto = resolveEvidenceEntry(ctx.loadId, ["delivery-photo.svg", "delivery-photo.jpg", "delivery-photo.png"]);
    const lumperReceiptFile = resolveEvidenceEntry(ctx.loadId, ["lumper-receipt.svg", "lumper-receipt.jpg", "lumper-receipt.png"]);
    const damageClaimPhoto = resolveEvidenceEntry(ctx.loadId, ["damage-photo.svg", "damage-photo.jpg", "damage-photo.png", "claim-photo.jpg"]);
    const claimEvidencePhoto = resolveEvidenceEntry(ctx.loadId, [
      "claim-evidence.png",
      "claim-evidence.svg",
    ]);
    const safetyViolationPhoto = safetyPhotoUrlForLoad(ctx.loadId);

    const ctxForTemplates = {
      ...ctx,
      cargoPhotoRef: cargoPhoto || "Not available",
      sealPickupPhotoRef: sealPickupPhoto || "Not available",
      sealDeliveryPhotoRef: sealDeliveryPhoto || "Not available",
      damageClaimPhotoRef: damageClaimPhoto || "Not available",
      claimEvidencePhotoRef: claimEvidencePhoto || "Not available",
      safetyViolationPhotoRef: safetyViolationPhoto || "Not available",
    };

    for (const docKey of Object.keys(FILE_MAP)) {
      if (!(docKey in LOAD_DOCUMENT_TEMPLATE_FILES)) continue;
      if (!shouldEmit(docKey, ctx)) continue;
      const fileName = FILE_MAP[docKey];
      const { html: tpl, relativeFromWebRoot } = templateBodies[docKey];
      const podEvidenceUrls =
        docKey === "pod"
          ? {
              pickupPhoto,
              deliveryPhoto,
              sealPickupPhoto,
              sealDeliveryPhoto,
              cargoPhoto,
            }
          : null;
      const podExtras =
        docKey === "pod"
          ? buildPodTemplateFields(ctx, load, driver, podEvidenceUrls, runNow)
          : {};
      const merged = renderTemplate(tpl, {
        ...ctxForTemplates,
        ...signaturePlaceholders,
        ...podExtras,
        styles: sharedStyles,
      });
      const outUrl = writeDoc(ctx.loadId, docKey, fileName, merged, relativeFromWebRoot);
      entry[docKey] = outUrl;
      const outAbs = path.join(OUT_DIR, ctx.loadId, fileName);
      console.log(
        `[generate-load-docs] type=${docKey} template=${relativeFromWebRoot} sharedStyles=${sharedStylesRel} output=${path.relative(ROOT, outAbs)}`
      );
    }

    if (cargoPhoto) entry.cargoPhoto = cargoPhoto;
    if (sealPickupPhoto) entry.sealPickupPhoto = sealPickupPhoto;
    if (sealDeliveryPhoto) entry.sealDeliveryPhoto = sealDeliveryPhoto;
    if (equipmentPhoto) entry.equipmentPhoto = equipmentPhoto;
    if (pickupPhoto) entry.pickupPhoto = pickupPhoto;
    if (deliveryPhoto) entry.deliveryPhoto = deliveryPhoto;
    if (lumperReceiptFile) entry.lumperReceipt = lumperReceiptFile;
    if (damageClaimPhoto) entry.damageClaimPhoto = damageClaimPhoto;
    if (claimEvidencePhoto) entry.claimEvidence = claimEvidencePhoto;
    if (safetyViolationPhoto) entry.safetyViolationPhoto = safetyViolationPhoto;

    for (const required of CORE_DOCS) {
      if (!entry[required]) {
        throw new Error(`Missing required generated doc ${required} for ${ctx.loadId}`);
      }
    }

    const damagePacketPng = evidencePathForLoad(ctx.loadId, "damage-photo-packet.png");
    if (fileExists(damagePacketPng)) {
      entry.damagePhotoPacket = publicUrlFromAbsolute(damagePacketPng);
    }

    writePacketBundlePages(ctx.loadId, entry);

    manifest[ctx.loadId] = entry;
  }

  writeJson(PUBLIC_MANIFEST, manifest);
  writeJson(LIB_MANIFEST, manifest);
  const docCount = Object.values(manifest).reduce((n, e) => n + Object.keys(e).length, 0);
  console.log(
    `[generate-load-docs] loads=${Object.keys(manifest).length} totalManifestEntries≈${docCount} (includes evidence URL keys)`
  );
}

main();
