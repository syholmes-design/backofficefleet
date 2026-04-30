import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const TEMPLATE_DIR = path.join(ROOT, "scripts", "templates", "driver-docs");
const OUT_BASE = path.join(ROOT, "public", "generated", "drivers");
const PUBLIC_MANIFEST = path.join(OUT_BASE, "driver-doc-manifest.json");
const LIB_MANIFEST = path.join(ROOT, "lib", "generated", "driver-doc-manifest.json");

const DOCS = [
  ["cdl", "cdl.template.html", "cdl.html"],
  ["medicalCard", "medical-card.template.html", "medical-card.html"],
  ["mvr", "mvr.template.html", "mvr.html"],
  ["w9", "w9.template.html", "w9.html"],
  ["i9", "i9.template.html", "i9.html"],
  ["emergencyContact", "emergency-contact.template.html", "emergency-contact.html"],
  ["bankInformation", "bank-information.template.html", "bank-information.html"],
  ["fmcsaCompliance", "fmcsa-compliance.template.html", "fmcsa-compliance.html"],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function render(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? "Needs review"));
}

function statusFromExpiration(expirationDate) {
  if (!expirationDate) return "MISSING";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exp = new Date(expirationDate);
  if (Number.isNaN(exp.getTime())) return "MISSING";
  const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  if (expDate < today) return "EXPIRED";
  const sixty = new Date(today);
  sixty.setDate(sixty.getDate() + 60);
  if (expDate <= sixty) return "EXPIRING_SOON";
  return "VALID";
}

function warnMissing(driverId, key, value) {
  if (String(value ?? "").trim().length === 0) {
    console.warn(`[generate:driver-docs] ${driverId} missing ${key}`);
  }
}

function getDocByType(documents, driverId, type) {
  return documents.find((d) => d.driverId === driverId && d.type === type) ?? null;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Missing canonical data file: ${DATA_PATH}`);
  }
  const data = readJson(DATA_PATH);
  const drivers = data.drivers ?? [];
  if (drivers.length === 0) {
    throw new Error("No drivers found in canonical dataset.");
  }

  const templates = new Map(
    DOCS.map(([key, templateFile]) => [
      key,
      fs.readFileSync(path.join(TEMPLATE_DIR, templateFile), "utf8"),
    ])
  );

  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #0f172a; }
    header { border-bottom: 2px solid #0f172a; margin-bottom: 12px; padding-bottom: 6px; }
    h1 { margin: 0; font-size: 20px; }
    h2 { margin: 10px 0 14px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
    td:first-child { width: 220px; font-weight: 600; background: #f8fafc; }
  `;

  ensureDir(OUT_BASE);
  const manifest = {};

  for (const driver of drivers) {
    const driverId = driver.id;
    const outDir = path.join(OUT_BASE, driverId);
    ensureDir(outDir);

    const cdl = getDocByType(data.documents ?? [], driverId, "CDL");
    const med = getDocByType(data.documents ?? [], driverId, "Medical Card");
    const mvr = getDocByType(data.documents ?? [], driverId, "MVR");
    const w9 = getDocByType(data.documents ?? [], driverId, "W-9");
    const i9 = getDocByType(data.documents ?? [], driverId, "I-9");
    const fmcsa = getDocByType(data.documents ?? [], driverId, "FMCSA");

    const payload = {
      styles,
      driverId,
      fullName: driver.name,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
      licenseNumber: driver.referenceCdlNumber || cdl?.sourceLicenseNumber,
      licenseClass: driver.licenseClass,
      licenseState: driver.licenseState,
      cdlExpirationDate: cdl?.expirationDate,
      cdlStatus: statusFromExpiration(cdl?.expirationDate),
      medicalExpirationDate: med?.expirationDate,
      medicalStatus: statusFromExpiration(med?.expirationDate),
      mvrExpirationDate: mvr?.expirationDate,
      mvrStatus: mvr?.status || "MISSING",
      w9Status: w9?.status || "MISSING",
      i9Status: i9?.status || "MISSING",
      fmcsaStatus: fmcsa?.status || "MISSING",
      fmcsaReviewDate: driver.fmcsa_review_date,
      primaryEmergencyName: driver.emergencyContactName,
      primaryEmergencyRelationship: driver.emergencyContactRelationship,
      primaryEmergencyPhone: driver.emergencyContactPhone,
      primaryEmergencyEmail: driver.emergencyContactEmail,
      primaryEmergencyAddress: driver.emergencyContactAddress || driver.address,
      secondaryEmergencyName: driver.secondaryContactName,
      secondaryEmergencyRelationship: driver.secondaryContactRelationship,
      secondaryEmergencyPhone: driver.secondaryContactPhone,
      secondaryEmergencyEmail: driver.secondaryContactEmail,
      secondaryEmergencyAddress: driver.secondaryContactAddress || driver.address,
      bankName: driver.bankName,
      bankAccountType: driver.bankAccountType,
      bankRoutingNumber: driver.bankRoutingNumber,
      bankAccountLast4: driver.bankAccountLast4,
      paymentPreference: driver.paymentPreference,
      bankStatus: driver.bankInfoStatus,
      taxClassification: driver.taxClassification,
      tinType: driver.tinType,
    };

    warnMissing(driverId, "secondary emergency name", payload.secondaryEmergencyName);
    warnMissing(driverId, "secondary emergency phone", payload.secondaryEmergencyPhone);
    warnMissing(driverId, "bank name", payload.bankName);
    warnMissing(driverId, "bank account last4", payload.bankAccountLast4);

    const entry = {};
    for (const [manifestKey, , outputFile] of DOCS) {
      const template = templates.get(manifestKey);
      const html = render(template, payload);
      fs.writeFileSync(path.join(outDir, outputFile), html, "utf8");
      entry[manifestKey] = `/generated/drivers/${driverId}/${outputFile}`;
    }
    manifest[driverId] = entry;
  }

  fs.writeFileSync(PUBLIC_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  ensureDir(path.dirname(LIB_MANIFEST));
  fs.writeFileSync(LIB_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated driver docs for ${drivers.length} drivers.`);
}

main();
