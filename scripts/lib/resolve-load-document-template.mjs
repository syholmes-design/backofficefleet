import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_WEB_ROOT = path.resolve(__dirname, "..", "..");
const TEMPLATE_DIR = path.join(REPO_WEB_ROOT, "scripts", "templates", "load-docs");

/**
 * Single source of truth: approved BOF load-document HTML templates live under
 * `scripts/templates/load-docs/`. Do not add parallel "fallback" HTML generators.
 */
export const LOAD_DOCUMENT_TEMPLATE_FILES = {
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

const SHARED_STYLES_FILE = "_bof-document-shared.css";

/**
 * @param {keyof typeof LOAD_DOCUMENT_TEMPLATE_FILES} documentType
 * @returns {{ absolutePath: string, relativeFromWebRoot: string }}
 */
export function resolveLoadDocumentTemplate(documentType) {
  const fileName = LOAD_DOCUMENT_TEMPLATE_FILES[documentType];
  if (!fileName) {
    throw new Error(`Unknown load document type: ${documentType}`);
  }
  const absolutePath = path.join(TEMPLATE_DIR, fileName);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Approved BOF template missing for ${documentType}: expected file at ${absolutePath}`
    );
  }
  return {
    absolutePath,
    relativeFromWebRoot: path.posix.join("scripts/templates/load-docs", fileName.replace(/\\/g, "/")),
  };
}

export function resolveSharedDocumentStyles() {
  const absolutePath = path.join(TEMPLATE_DIR, SHARED_STYLES_FILE);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Approved BOF shared document styles missing: expected ${absolutePath}`
    );
  }
  return {
    absolutePath,
    relativeFromWebRoot: path.posix.join("scripts/templates/load-docs", SHARED_STYLES_FILE),
    css: fs.readFileSync(absolutePath, "utf8"),
  };
}

export { TEMPLATE_DIR, REPO_WEB_ROOT };
