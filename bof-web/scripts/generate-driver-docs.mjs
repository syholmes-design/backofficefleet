/**
 * Canonical driver credential HTML generator.
 * Writes 6 credential HTML files per driver under public/generated/drivers/{driverId}/
 * (CDL image proofs live under public/documents/drivers/{driverId}/cdl.png — not
 * overwritten here) and sets fileUrl / previewUrl on existing documents[] rows.
 *
 * Data: lib/demo-data.json (from build:data / main workbook pipeline).
 *
 * Run: node scripts/generate-driver-docs.mjs
 * npm:  npm run generate:driver-docs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const OUT_BASE = path.join(ROOT, "public", "generated", "drivers");

const TYPE_TO_FILE = {
  "Medical Card": "medical-card.html",
  MVR: "mvr.html",
  "I-9": "i9.html",
  FMCSA: "fmcsa.html",
  "W-9": "w9.html",
  "Bank Info": "bank-info.html",
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function loadDriver(data, driverId) {
  return data.drivers.find((d) => d.id === driverId) ?? null;
}

function complianceNotes(data, driverId, predicate) {
  return (data.complianceIncidents ?? []).filter(
    (c) => c.driverId === driverId && predicate(c)
  );
}

function wrapPage(title, innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #f1f5f9; color: #0f172a; line-height: 1.45; font-size: 14px; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 28px 32px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    h1 { font-size: 1.15rem; margin: 0 0 4px; color: #0f172a; }
    .sub { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    dl { display: grid; grid-template-columns: 160px 1fr; gap: 6px 16px; margin: 0; }
    dt { color: #64748b; font-size: 12px; }
    dd { margin: 0; font-weight: 500; }
    .muted { color: #64748b; font-weight: 400; }
    .banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; padding: 10px 12px; border-radius: 6px; font-size: 13px; margin-top: 12px; }
    .warn { background: #fffbeb; border-color: #fde68a; color: #78350f; }
    footer { margin-top: 24px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="sheet">
    ${innerHtml}
    <footer>BackOfficeFleet · Demo generated credential shell · Not a legal document</footer>
  </div>
</body>
</html>`;
}

function driverBlock(driver) {
  if (!driver) {
    return `<h2>Driver</h2><p class="muted">Driver record not found in demo data.</p>`;
  }
  return `<h2>Driver</h2>
<dl>
  <dt>Name</dt><dd>${escapeHtml(driver.name)}</dd>
  <dt>Driver ID</dt><dd><code>${escapeHtml(driver.id)}</code></dd>
  <dt>Address</dt><dd>${escapeHtml(driver.address)}</dd>
  <dt>Phone</dt><dd>${escapeHtml(driver.phone)}</dd>
  <dt>Email</dt><dd>${escapeHtml(driver.email)}</dd>
</dl>`;
}

function buildMedical(driver, doc, data) {
  const medInc = complianceNotes(
    data,
    doc.driverId,
    (c) => c.type === "Medical Card Expiring"
  );
  const flag =
    medInc.length > 0
      ? `<div class="banner warn">Compliance: ${escapeHtml(medInc[0].type)} (${escapeHtml(medInc[0].incidentId)}) — ${escapeHtml(medInc[0].status)}</div>`
      : "";
  const inner = `
    <h1>Medical Examiner&apos;s Certificate</h1>
    <p class="sub">DOT medical card · Demo record</p>
    ${driverBlock(driver)}
    <h2>Medical card</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Expiration</dt><dd>${doc.expirationDate ? escapeHtml(doc.expirationDate) : '<span class="muted">Not on file</span>'}</dd>
      <dt>Medical examiner</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Restriction codes</dt><dd><span class="muted">Pending</span></dd>
    </dl>
    ${flag}
  `;
  return wrapPage(`Medical Card — ${driver?.name ?? doc.driverId}`, inner);
}

function buildMvr(driver, doc, data) {
  const mvrInc = complianceNotes(
    data,
    doc.driverId,
    (c) => c.type === "MVR Review Required"
  );
  const flag =
    mvrInc.length > 0
      ? `<div class="banner warn">Compliance: ${escapeHtml(mvrInc[0].type)} (${escapeHtml(mvrInc[0].incidentId)}) — ${escapeHtml(mvrInc[0].status)}</div>`
      : "";
  const inner = `
    <h1>Motor Vehicle Record (MVR)</h1>
    <p class="sub">Driver history summary · Demo layout</p>
    ${driverBlock(driver)}
    <h2>Report</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Report run date</dt><dd><span class="muted">Pending</span></dd>
      <dt>Jurisdiction</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Violations / points</dt><dd><span class="muted">Not on file — see compliance if flagged</span></dd>
    </dl>
    ${flag}
  `;
  return wrapPage(`MVR — ${driver?.name ?? doc.driverId}`, inner);
}

function buildI9(driver, doc, data) {
  const inner = `
    <h1>Form I-9 — Employment Eligibility Verification</h1>
    <p class="sub">Demo shell · HR record</p>
    ${driverBlock(driver)}
    <h2>Eligibility</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Employment eligibility</dt><dd><span class="muted">Pending verification — see HR</span></dd>
      <dt>Document A / B / C</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Reverification date</dt><dd>${doc.expirationDate ? escapeHtml(doc.expirationDate) : '<span class="muted">Not on file</span>'}</dd>
    </dl>
  `;
  return wrapPage(`I-9 — ${driver?.name ?? doc.driverId}`, inner);
}

function buildFmcsa(driver, doc, data) {
  const inner = `
    <h1>FMCSA / Clearinghouse — Compliance record</h1>
    <p class="sub">Demo carrier qualification snapshot</p>
    ${driverBlock(driver)}
    <h2>Registration</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Last query date</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Drug &amp; alcohol program</dt><dd><span class="muted">Pending</span></dd>
      <dt>Disclosure</dt><dd><span class="muted">See compliance dashboard for live flags</span></dd>
    </dl>
  `;
  return wrapPage(`FMCSA — ${driver?.name ?? doc.driverId}`, inner);
}

function buildW9(driver, doc, data) {
  const inner = `
    <h1>Form W-9 — Request for Taxpayer Identification</h1>
    <p class="sub">Demo contractor / payee record</p>
    ${driverBlock(driver)}
    <h2>Taxpayer</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Name (as shown)</dt><dd>${driver ? escapeHtml(driver.name) : '<span class="muted">Not on file</span>'}</dd>
      <dt>Business name</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Tax classification</dt><dd>Individual / sole proprietor (demo)</dd>
      <dt>TIN</dt><dd><span class="muted">Not on file</span></dd>
    </dl>
  `;
  return wrapPage(`W-9 — ${driver?.name ?? doc.driverId}`, inner);
}

function buildBank(driver, doc, data) {
  const inner = `
    <h1>Direct deposit — Bank information</h1>
    <p class="sub">Demo payroll banking shell</p>
    ${driverBlock(driver)}
    <h2>Account</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Account holder</dt><dd>${driver ? escapeHtml(driver.name) : '<span class="muted">Not on file</span>'}</dd>
      <dt>Financial institution</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Routing number</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Account number (last 4)</dt><dd><span class="muted">Not on file</span></dd>
      <dt>Account type</dt><dd><span class="muted">Pending</span></dd>
    </dl>
  `;
  return wrapPage(`Bank Info — ${driver?.name ?? doc.driverId}`, inner);
}

const SUPPLEMENTAL_TYPE_TO_FILE = {
  "MCSA-5875": "mcsa-5875.html",
  "Emergency Contact": "emergency-contact.html",
  "Driver Application": "driver-application.html",
  "Safety Acknowledgment": "safety-acknowledgment.html",
  "Qualification File": "qualification-file.html",
  "Incident / Accident Report": "incident-report.html",
  "BOF Medical Summary": "bof-medical-summary.html",
  "MCSA-5876 (signed PDF)": "mcsa-5876-signed.html",
  "Driver profile (HTML)": "driver-profile.html",
};

function buildSupplementalShell(title, driver, doc, extraHtml = "") {
  const inner = `
    <h1>${escapeHtml(title)}</h1>
    <p class="sub">Demo workflow shell · Not a legal filing</p>
    ${driverBlock(driver)}
    <h2>Record</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Expiration</dt><dd>${doc.expirationDate ? escapeHtml(doc.expirationDate) : '<span class="muted">—</span>'}</dd>
    </dl>
    ${extraHtml}
  `;
  return wrapPage(`${title} — ${driver?.name ?? doc.driverId}`, inner);
}

function buildMcsa5875(driver, doc) {
  return buildSupplementalShell(
    "Medical Examination Report (MCSA-5875)",
    driver,
    doc,
    `<div class="banner">Long-form exam data is merged from driver_templates_expanded.xlsx when present.</div>`
  );
}

function buildEmergencyContact(driver, doc) {
  return buildSupplementalShell("Emergency contact packet", driver, doc);
}

function buildDriverApplication(driver, doc) {
  return buildSupplementalShell("Driver application", driver, doc);
}

function buildSafetyAck(driver, doc) {
  return buildSupplementalShell("Safety acknowledgment", driver, doc);
}

function buildQualFile(driver, doc) {
  return buildSupplementalShell("Qualification file status", driver, doc);
}

function buildIncident(driver, doc) {
  return buildSupplementalShell("Incident / accident register", driver, doc);
}

function buildBofMedicalSummary(driver, doc) {
  return buildSupplementalShell("BOF medical summary", driver, doc);
}

function buildMcsa5876Placeholder(driver, doc) {
  return buildSupplementalShell(
    "MCSA-5876 (demo HTML placeholder)",
    driver,
    doc,
    `<div class="banner">Reference driver DRV-001 uses the signed PDF under /documents/drivers/DRV-001/.</div>`
  );
}

function buildDriverProfilePlaceholder(driver, doc) {
  return buildSupplementalShell("Driver profile (demo HTML)", driver, doc);
}

const SUPPLEMENTAL_BUILDERS = {
  "MCSA-5875": buildMcsa5875,
  "Emergency Contact": buildEmergencyContact,
  "Driver Application": buildDriverApplication,
  "Safety Acknowledgment": buildSafetyAck,
  "Qualification File": buildQualFile,
  "Incident / Accident Report": buildIncident,
  "BOF Medical Summary": buildBofMedicalSummary,
  "MCSA-5876 (signed PDF)": buildMcsa5876Placeholder,
  "Driver profile (HTML)": buildDriverProfilePlaceholder,
};

const BUILDERS = {
  "Medical Card": buildMedical,
  MVR: buildMvr,
  "I-9": buildI9,
  FMCSA: buildFmcsa,
  "W-9": buildW9,
  "Bank Info": buildBank,
};

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`Missing ${DATA_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  let fileCount = 0;
  let updated = 0;

  for (const doc of data.documents) {
    if (!doc.driverId || !TYPE_TO_FILE[doc.type]) continue;

    const fileName = TYPE_TO_FILE[doc.type];
    const publicPath = `/generated/drivers/${doc.driverId}/${fileName}`;
    doc.fileUrl = publicPath;
    doc.previewUrl = publicPath;
    updated += 1;

    const driver = loadDriver(data, doc.driverId);
    const builder = BUILDERS[doc.type];
    const html = builder(driver, doc, data);
    const dir = path.join(OUT_BASE, doc.driverId);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, fileName), html, "utf8");
    fileCount += 1;
  }

  for (const doc of data.documents) {
    if (!doc.driverId) continue;
    const fileName = SUPPLEMENTAL_TYPE_TO_FILE[doc.type];
    if (!fileName) continue;
    const fu = String(doc.fileUrl ?? "");
    if (!fu.includes(`/generated/drivers/${doc.driverId}/`)) continue;

    const publicPath = `/generated/drivers/${doc.driverId}/${fileName}`;
    doc.fileUrl = publicPath;
    doc.previewUrl = publicPath;
    updated += 1;

    const driver = loadDriver(data, doc.driverId);
    const builder = SUPPLEMENTAL_BUILDERS[doc.type];
    const html = builder(driver, doc, data);
    const dir = path.join(OUT_BASE, doc.driverId);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, fileName), html, "utf8");
    fileCount += 1;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`Updated ${updated} document rows in demo-data.json`);
  console.log(`Wrote ${fileCount} HTML files under public/generated/drivers/`);
}

main();
