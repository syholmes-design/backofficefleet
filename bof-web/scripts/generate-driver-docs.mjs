/**
 * Canonical driver credential HTML generator.
 * Writes 7 files per driver under public/generated/drivers/{driverId}/ and sets
 * fileUrl / previewUrl on existing documents[] rows (does not recreate rows).
 *
 * Data: lib/demo-data.json (from build:data / main-source.xlsx pipeline).
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
  CDL: "cdl.html",
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

function parseAddress(address) {
  const v = String(address ?? "").trim();
  const m = v.match(/^(.*?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!m) {
    return {
      line: v || "Not on file",
      city: "Not on file",
      state: "N/A",
      zip: "Not on file",
    };
  }
  return {
    line: m[1].trim(),
    city: m[2].trim(),
    state: m[3].trim(),
    zip: m[4].trim(),
  };
}

function cdlField(v, fallback = "Not on file") {
  const t = String(v ?? "").trim();
  return t ? escapeHtml(t) : `<span class="muted">${escapeHtml(fallback)}</span>`;
}

function buildOhioCdlCard(driver, doc) {
  const adr = parseAddress(driver?.address);
  const state = adr.state === "N/A" ? "OH" : adr.state;
  const expiration = doc.cdlExpiration || doc.expirationDate || "";
  const issue = doc.cdlIssueDate || "";
  const photo = driver?.id
    ? `/images/drivers/${escapeHtml(driver.id)}.png`
    : "/images/drivers/DRV-001.png";
  const name = driver?.name ? escapeHtml(driver.name) : "Not on file";
  const licenseNumber = cdlField(doc.cdlNumber);
  const licenseClass = cdlField(doc.licenseClass);
  const endorsements = cdlField(doc.cdlEndorsements);
  const restrictions = cdlField(doc.cdlRestrictions);
  const expirationLabel = expiration
    ? `<time datetime="${escapeHtml(expiration)}">${escapeHtml(expiration)}</time>`
    : `<span class="muted">Not on file</span>`;
  const issueLabel = issue
    ? `<time datetime="${escapeHtml(issue)}">${escapeHtml(issue)}</time>`
    : `<span class="muted">Not on file</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>CDL — ${escapeHtml(driver?.name ?? doc.driverId)} · Ohio · ${escapeHtml(doc.driverId)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #e9edf3; font-family: Arial, Helvetica, sans-serif; }
    .page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card {
      width: 1180px; height: 740px; position: relative; border-radius: 28px; overflow: hidden;
      background:
        radial-gradient(circle at 52% 48%, rgba(74, 107, 171, 0.12), transparent 20%),
        linear-gradient(135deg, #fbfcfe 0%, #f2f6fb 100%);
      border: 4px solid #d7deea; box-shadow: 0 12px 32px rgba(0,0,0,.16);
      --state-blue: #0f3a78; --state-red: #b91c1c;
    }
    .security-pattern {
      position: absolute; inset: 0; opacity: .22;
      background:
        repeating-radial-gradient(circle at 20% 20%, #7f95b8 0 1px, transparent 1px 14px),
        repeating-radial-gradient(circle at 80% 30%, #7f95b8 0 1px, transparent 1px 16px),
        repeating-radial-gradient(circle at 50% 80%, #7f95b8 0 1px, transparent 1px 15px);
      mix-blend-mode: multiply;
    }
    .header-state {
      position: absolute; top: 18px; left: 0; width: 100%; text-align: center;
      font-size: 92px; font-weight: 900; letter-spacing: 2px; color: var(--state-blue);
    }
    .header-banner {
      position: absolute; top: 144px; left: 88px; width: calc(100% - 176px); height: 56px;
      background: linear-gradient(90deg, var(--state-red), #d53b3b);
      color: #fff; display: grid; place-items: center; font-size: 28px; font-weight: 800; letter-spacing: 1px;
    }
    .state-emblem {
      position: absolute; top: 38px; width: 160px; height: 74px; display: grid; place-items: center;
      color: rgba(15,58,120,.68); font-weight: 900; font-size: 30px; letter-spacing: .08em;
    }
    .state-emblem.left { left: 170px; }
    .state-emblem.right { right: 170px; }
    .photo-box {
      position: absolute; left: 86px; top: 228px; width: 280px; height: 390px;
      background: #dde3ed; border: 3px solid rgba(36, 53, 90, 0.18); overflow: hidden;
    }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .center-block { position: absolute; left: 400px; top: 244px; width: 360px; color: #151515; }
    .right-block { position: absolute; left: 790px; top: 244px; width: 290px; color: #151515; }
    .label { font-size: 26px; font-weight: 700; color: #2b2b2b; margin-bottom: 2px; }
    .value-lg { font-size: 34px; font-weight: 900; line-height: 1.1; margin-bottom: 18px; }
    .value-md { font-size: 28px; font-weight: 800; line-height: 1.15; margin-bottom: 10px; }
    .value-sm { font-size: 25px; font-weight: 800; line-height: 1.2; margin-bottom: 12px; }
    .signature-label { margin-top: 16px; padding-top: 8px; border-top: 2px solid rgba(28, 43, 77, 0.18); }
    .signature { font-family: "Brush Script MT", "Segoe Script", cursive; font-size: 68px; line-height: 1; margin-top: 6px; }
    .barcode {
      position: absolute; left: 88px; bottom: 110px; width: 690px; height: 62px;
      background: repeating-linear-gradient(to right, #111 0 5px, transparent 5px 8px, #111 8px 12px, transparent 12px 16px, #111 16px 19px, transparent 19px 24px);
    }
    .barcode-label {
      position: absolute; left: 470px; bottom: 54px; transform: translateX(-50%);
      font-size: 28px; font-weight: 700; color: #222; font-family: ui-monospace, monospace;
    }
    .qr-box {
      position: absolute; right: 86px; bottom: 96px; width: 150px; height: 150px;
      background:
        linear-gradient(90deg,#111 12%,transparent 12% 24%,#111 24% 36%,transparent 36% 48%,#111 48% 60%,transparent 60% 72%,#111 72% 84%,transparent 84%),
        linear-gradient(#111 12%,transparent 12% 24%,#111 24% 36%,transparent 36% 48%,#111 48% 60%,transparent 60% 72%,#111 72% 84%,transparent 84%);
      border: 10px solid #fff; box-shadow: 0 0 0 2px #111;
    }
    .qr-label { position: absolute; right: 46px; bottom: 44px; font-size: 22px; font-weight: 500; color: #333; }
    .disclaimer { position: absolute; bottom: 12px; width: 100%; text-align: center; font-size: 22px; font-weight: 700; color: #1f1f1f; }
    .watermark {
      position: absolute; left: 430px; top: 238px; width: 380px; height: 380px; border-radius: 50%;
      border: 10px solid rgba(89, 111, 154, 0.12); display: grid; place-items: center;
      color: rgba(89, 111, 154, 0.16); font-size: 34px; font-weight: 800; text-align: center; line-height: 1.15;
    }
    .demo-stamp { position: absolute; right: 24px; top: 18px; font-size: 14px; font-weight: 800; color: rgba(0,0,0,.4); letter-spacing: 1px; }
    .meta-note {
      position: absolute; left: 88px; bottom: 188px; font-size: 12px; color: #334155;
      max-width: 690px;
    }
    @media print { body { background: #fff; } .page { padding: 0; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="security-pattern" aria-hidden="true"></div>
      <div class="demo-stamp">SYNTHETIC CDL DEMO</div>
      <div class="header-state">${escapeHtml(state === "OH" ? "OHIO" : state)}</div>
      <div class="state-emblem left" aria-hidden="true">OH</div>
      <div class="state-emblem right" aria-hidden="true">OH</div>
      <div class="header-banner">COMMERCIAL DRIVER LICENSE</div>

      <div class="photo-box">
        <img src="${photo}" alt="Driver headshot"/>
      </div>

      <div class="watermark" aria-hidden="true">BACK OFFICE<br/>FLEET<br/>DEMO</div>

      <div class="center-block">
        <div class="label">Full Name</div>
        <div class="value-lg">${name}</div>
        <div class="label">Address</div>
        <div class="value-sm">${escapeHtml(adr.line)}</div>
        <div class="value-sm">${escapeHtml(adr.city)}, ${escapeHtml(adr.state)} ${escapeHtml(adr.zip)}</div>
        <div class="label">Date of Issue</div>
        <div class="value-md">${issueLabel}</div>
        <div class="label">Expiration</div>
        <div class="value-md">${expirationLabel}</div>
      </div>

      <div class="right-block">
        <div class="label">DL / CDL Number</div>
        <div class="value-md">${licenseNumber}</div>
        <div class="label">Class</div>
        <div class="value-md">${licenseClass}</div>
        <div class="label">Endorsements</div>
        <div class="value-sm">${endorsements}</div>
        <div class="label">Restrictions</div>
        <div class="value-sm">${restrictions}</div>
        <div class="signature-label label">Signature</div>
        <div class="signature">${name}</div>
      </div>

      <div class="meta-note">Driver ID: ${escapeHtml(doc.driverId)} · Phone: ${escapeHtml(driver?.phone ?? "Not on file")} · Email: ${escapeHtml(driver?.email ?? "Not on file")}</div>
      <div class="barcode" aria-hidden="true"></div>
      <div class="barcode-label">${licenseNumber}</div>
      <div class="qr-box" aria-hidden="true"></div>
      <div class="qr-label">DOC CODE</div>
      <div class="disclaimer">BackOfficeFleet synthetic demo document - not a government-issued license</div>
    </div>
  </div>
</body>
</html>`;
}

function buildCdl(driver, doc, data) {
  if (doc.driverId === "DRV-001") {
    return buildOhioCdlCard(driver, doc);
  }

  const adr = parseAddress(driver?.address);
  const expiration = doc.cdlExpiration || doc.expirationDate || "";
  const issue = doc.cdlIssueDate || "";
  const inner = `
    <h1>Commercial Driver&apos;s License (CDL) — Record</h1>
    <p class="sub">Credential type: CDL · Source: demo-data.json CDL metadata fields</p>
    ${driverBlock(driver)}
    <h2>License details</h2>
    <dl>
      <dt>Status (demo)</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Expiration</dt><dd>${expiration ? escapeHtml(expiration) : '<span class="muted">Not on file</span>'}</dd>
      <dt>Issue date</dt><dd>${issue ? escapeHtml(issue) : '<span class="muted">Not on file</span>'}</dd>
      <dt>License number</dt><dd>${cdlField(doc.cdlNumber)}</dd>
      <dt>License class</dt><dd>${cdlField(doc.licenseClass)}</dd>
      <dt>Endorsements</dt><dd>${cdlField(doc.cdlEndorsements)}</dd>
      <dt>Restrictions</dt><dd>${cdlField(doc.cdlRestrictions)}</dd>
      <dt>Issuing state</dt><dd>${escapeHtml(adr.state === "N/A" ? "Not on file" : `${adr.state} (from driver address)`)}</dd>
      <dt>Photo reference</dt><dd>${driver?.id ? `/images/drivers/${escapeHtml(driver.id)}.png` : '<span class="muted">Not on file</span>'}</dd>
    </dl>
  `;
  return wrapPage(`CDL — ${driver?.name ?? doc.driverId}`, inner);
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

const BUILDERS = {
  CDL: buildCdl,
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

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`Updated ${updated} document rows in demo-data.json`);
  console.log(`Wrote ${fileCount} HTML files under public/generated/drivers/`);
}

main();
