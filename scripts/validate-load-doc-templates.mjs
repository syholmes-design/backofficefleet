import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LOAD_DOCUMENT_TEMPLATE_FILES } from "./lib/resolve-load-document-template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED_LOADS_DIR = path.join(ROOT, "public", "generated", "loads");
const PUBLIC_MANIFEST_PATH = path.join(GENERATED_LOADS_DIR, "load-doc-manifest.json");
const TEMPLATE_DIR = path.join(ROOT, "scripts", "templates", "load-docs");

const PROVENANCE_RE = /^<!--\s*BOF_TEMPLATE_SOURCE:\s*([^\n]+?)\s*-->/m;
const DOC_TYPE_RE = /^<!--\s*BOF_DOCUMENT_TYPE:\s*([^\n]+?)\s*-->/m;
const LOAD_ID_RE = /^<!--\s*BOF_LOAD_ID:\s*([^\n]+?)\s*-->/m;

const FORBIDDEN_MARKERS = [
  "workflow simulation only",
  "fallback",
  "mock document",
  "ai generated",
  "placeholder",
];

const DOC_KEY_TO_TEMPLATE = {
  rateConfirmation: "rate-confirmation.template.html",
  bol: "bol.template.html",
  pod: "pod.template.html",
  invoice: "invoice.template.html",
  workOrder: "work-order.template.html",
  masterAgreementReference: "master-agreement-reference.template.html",
  sealVerification: "seal-verification.template.html",
  rfidProof: "rfid-proof.template.html",
  claimIntake: "claim-intake.template.html",
  insuranceNotification: "insurance-notification.template.html",
  factoringNotification: "factoring-notification.template.html",
  settlementHoldNotice: "settlement-hold-notice.template.html",
  damagePhotoPacket: "damage-photo-packet.template.html",
  claimPacket: "claim-packet.template.html",
  lumperReceipt: "lumper-receipt.template.html",
};

const DOC_URL_KEY_TO_DOC_KEY = {
  "rate-confirmation.html": "rateConfirmation",
  "bol.html": "bol",
  "pod.html": "pod",
  "invoice.html": "invoice",
  "work-order.html": "workOrder",
  "master-agreement-reference.html": "masterAgreementReference",
  "seal-verification.html": "sealVerification",
  "rfid-proof.html": "rfidProof",
  "claim-intake.html": "claimIntake",
  "insurance-notification.html": "insuranceNotification",
  "factoring-notification.html": "factoringNotification",
  "settlement-hold-notice.html": "settlementHoldNotice",
  "damage-photo-packet.html": "damagePhotoPacket",
  "claim-packet.html": "claimPacket",
  "lumper-receipt.html": "lumperReceipt",
};

function fail(errors) {
  console.error("validate:load-doc-templates failed");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertTemplateRegistry() {
  const missing = [];
  for (const fileName of Object.values(LOAD_DOCUMENT_TEMPLATE_FILES)) {
    const p = path.join(TEMPLATE_DIR, fileName);
    if (!fs.existsSync(p)) {
      missing.push(`Missing approved template: ${path.relative(ROOT, p)}`);
    }
  }
  return missing;
}

function validateGeneratedHtmlFile(absPath, expectedLoadId, expectedDocKey, errors) {
  const rel = path.relative(ROOT, absPath).replaceAll("\\", "/");
  const body = fs.readFileSync(absPath, "utf8");
  const templateMatch = body.match(PROVENANCE_RE);
  const docTypeMatch = body.match(DOC_TYPE_RE);
  const loadIdMatch = body.match(LOAD_ID_RE);

  if (!templateMatch) {
    errors.push(`${rel}: missing BOF_TEMPLATE_SOURCE comment`);
    return;
  }
  if (!docTypeMatch) {
    errors.push(`${rel}: missing BOF_DOCUMENT_TYPE comment`);
  }
  if (!loadIdMatch) {
    errors.push(`${rel}: missing BOF_LOAD_ID comment`);
  }

  const templateSource = String(templateMatch[1] ?? "").trim();
  const docType = String(docTypeMatch?.[1] ?? "").trim();
  const loadId = String(loadIdMatch?.[1] ?? "").trim();

  const expectedTemplateFile = DOC_KEY_TO_TEMPLATE[expectedDocKey];
  const expectedTemplatePath = `scripts/templates/load-docs/${expectedTemplateFile}`;

  if (expectedTemplateFile && templateSource !== expectedTemplatePath) {
    errors.push(`${rel}: template source mismatch (expected ${expectedTemplatePath}, got ${templateSource})`);
  }
  const templateAbs = path.join(ROOT, templateSource);
  if (!fs.existsSync(templateAbs)) {
    errors.push(`${rel}: BOF_TEMPLATE_SOURCE does not exist (${templateSource})`);
  }
  if (docType && docType !== expectedDocKey) {
    errors.push(`${rel}: BOF_DOCUMENT_TYPE mismatch (expected ${expectedDocKey}, got ${docType})`);
  }
  if (loadId && loadId !== expectedLoadId) {
    errors.push(`${rel}: BOF_LOAD_ID mismatch (expected ${expectedLoadId}, got ${loadId})`);
  }

  const lower = body.toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (lower.includes(marker)) {
      errors.push(`${rel}: forbidden marker found "${marker}"`);
    }
  }
}

function main() {
  const errors = [];
  if (!fs.existsSync(PUBLIC_MANIFEST_PATH)) {
    fail([`Missing manifest: ${path.relative(ROOT, PUBLIC_MANIFEST_PATH)}`]);
  }

  errors.push(...assertTemplateRegistry());
  const manifest = readJson(PUBLIC_MANIFEST_PATH);

  for (const [loadId, entry] of Object.entries(manifest)) {
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value !== "string") continue;
      if (!value.startsWith("/")) {
        errors.push(`${loadId}.${key}: manifest URL must be absolute-from-public (${value})`);
        continue;
      }
      const abs = path.join(ROOT, "public", value.replace(/^\//, ""));
      if (!fs.existsSync(abs)) {
        errors.push(`${loadId}.${key}: manifest points to missing file (${value})`);
        continue;
      }

      if (!value.endsWith(".html")) continue;
      const fileName = path.basename(value);
      const expectedDocKey = DOC_URL_KEY_TO_DOC_KEY[fileName];
      if (!expectedDocKey) {
        errors.push(`${loadId}.${key}: unknown generated HTML doc file ${fileName}`);
        continue;
      }
      validateGeneratedHtmlFile(abs, loadId, expectedDocKey, errors);
    }
  }

  if (errors.length) fail(errors);
  console.log("validate:load-doc-templates passed");
}

main();
