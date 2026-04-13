/**
 * One-off test batch (legacy layout): regenerates DRV-001 HTML from JSON.
 * WARNING: Overwrites the curated realistic pages in public/generated/drivers/DRV-001/
 * with data-driven shells. Prefer editing those HTML files or npm run generate:driver-docs
 * for full-fleet regeneration; do not run this if you want to keep demo realism.
 *
 * Run: node scripts/generate-driver-test-batch-drv001.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const OUT_DIR = path.join(ROOT, "public", "generated", "drivers", "DRV-001");

const DRIVER_ID = "DRV-001";

const FILES = [
  { type: "CDL", name: "cdl.html", title: "Commercial Driver's License (CDL)" },
  { type: "Medical Card", name: "medical-card.html", title: "Medical Examiner's Certificate" },
  { type: "MVR", name: "mvr.html", title: "Motor Vehicle Record (MVR)" },
  { type: "I-9", name: "i9.html", title: "Form I-9 — Employment Eligibility" },
  { type: "FMCSA", name: "fmcsa.html", title: "FMCSA / Clearinghouse compliance" },
  { type: "W-9", name: "w9.html", title: "Form W-9 — Taxpayer identification" },
  { type: "Bank Info", name: "bank-info.html", title: "Direct deposit — Bank information" },
];

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapPage(pageTitle, inner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(pageTitle)}</title>
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
    table.ops { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    table.ops th, table.ops td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
    table.ops th { background: #f8fafc; color: #64748b; font-weight: 600; }
    footer { margin-top: 24px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="sheet">
    ${inner}
    <footer>BackOfficeFleet · DRV-001 compliance test batch · Demo — not a legal filing</footer>
  </div>
</body>
</html>`;
}

function driverBlock(d) {
  return `<h2>Driver (Drivers_Clean)</h2>
<dl>
  <dt>Name</dt><dd>${escapeHtml(d.name)}</dd>
  <dt>Driver ID</dt><dd><code>${escapeHtml(d.id)}</code></dd>
  <dt>Address</dt><dd>${escapeHtml(d.address)}</dd>
  <dt>Phone</dt><dd>${escapeHtml(d.phone)}</dd>
  <dt>Email</dt><dd>${escapeHtml(d.email)}</dd>
</dl>`;
}

function loadsSection(loads) {
  if (!loads.length) {
    return `<h2>Loads tied to this driver</h2><p class="muted">No loads[] rows for ${DRIVER_ID} in demo data.</p>`;
  }
  const rows = loads
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.id)}</td><td>${escapeHtml(l.number)}</td><td>${escapeHtml(l.assetId)}</td><td>${escapeHtml(l.origin)}</td><td>${escapeHtml(l.destination)}</td><td>${escapeHtml(l.status)}</td></tr>`
    )
    .join("");
  return `<h2>Loads tied to this driver (loads[])</h2>
<table class="ops" aria-label="Driver loads">
  <thead><tr><th>Load ID</th><th>Number</th><th>Asset</th><th>Origin</th><th>Destination</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function docMeta(doc) {
  const exp = doc.expirationDate
    ? escapeHtml(doc.expirationDate)
    : '<span class="muted">Not in Documents_Clean export</span>';
  return `<dl>
    <dt>Credential type</dt><dd>${escapeHtml(doc.type)}</dd>
    <dt>Status (documents[])</dt><dd>${escapeHtml(doc.status)}</dd>
    <dt>Expiration on file</dt><dd>${exp}</dd>
    <dt>Linked preview</dt><dd><code>${escapeHtml(doc.previewUrl || doc.fileUrl || "—")}</code></dd>
  </dl>`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const driver = data.drivers.find((d) => d.id === DRIVER_ID);
  if (!driver) {
    console.error("DRV-001 not in drivers[]");
    process.exit(1);
  }
  const loads = (data.loads ?? []).filter((l) => l.driverId === DRIVER_ID);
  const byType = new Map();
  for (const r of data.documents) {
    if (r.driverId === DRIVER_ID) byType.set(r.type, r);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of FILES) {
    const doc = byType.get(spec.type);
    if (!doc) {
      console.error("Missing document row:", spec.type);
      process.exit(1);
    }
    let extra = "";
    if (spec.type === "CDL") {
      extra = `<h2>License / credential fields</h2>
${docMeta(doc)}
<p class="muted">License number, class, endorsements, and issuing state are not present in the current Excel → JSON export. Use carrier vault upload when available.</p>
<div class="banner">Operational context: domicile address on file lists Cleveland, OH — use verified CDL image/PDF for legal class and restrictions.</div>`;
    } else if (spec.type === "Medical Card") {
      extra = `<h2>Medical card fields</h2>
${docMeta(doc)}
<p class="muted">Examiner name and restriction codes are not in source data.</p>`;
    } else if (spec.type === "MVR") {
      extra = `<h2>MVR fields</h2>
${docMeta(doc)}
<p class="muted">Report run date and jurisdiction are not in source data.</p>`;
    } else if (spec.type === "I-9") {
      extra = `<h2>Eligibility (demo shell)</h2>
${docMeta(doc)}
<p class="muted">List A/B/C document references are not in source — awaiting HR upload.</p>`;
    } else if (spec.type === "FMCSA") {
      extra = `<h2>FMCSA / clearinghouse</h2>
${docMeta(doc)}
<p class="muted">Last query date and program enrollment details are not in source data.</p>`;
    } else if (spec.type === "W-9") {
      extra = `<h2>Taxpayer</h2>
${docMeta(doc)}
<dl>
  <dt>Name (as shown)</dt><dd>${escapeHtml(driver.name)}</dd>
  <dt>TIN</dt><dd><span class="muted">Not in source data</span></dd>
  <dt>Entity type (demo label)</dt><dd>Individual / contractor (verify on signed W-9)</dd>
</dl>`;
    } else if (spec.type === "Bank Info") {
      extra = `<h2>Direct deposit</h2>
${docMeta(doc)}
<dl>
  <dt>Account holder</dt><dd>${escapeHtml(driver.name)}</dd>
  <dt>Bank / routing / account</dt><dd><span class="muted">Not in source data</span></dd>
</dl>`;
    }

    const inner = `
    <h1>${escapeHtml(spec.title)}</h1>
    <p class="sub">DRV-001 test batch · Data from lib/demo-data.json only</p>
    ${driverBlock(driver)}
    ${loadsSection(loads)}
    ${extra}
  `;
    const html = wrapPage(`${spec.title} — ${driver.name}`, inner);
    fs.writeFileSync(path.join(OUT_DIR, spec.name), html, "utf8");
    console.log("Wrote", path.relative(ROOT, path.join(OUT_DIR, spec.name)));
  }
}

main();
