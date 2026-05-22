/**
 * One-off / maintenance: align public/generated/drivers/{id}/medical-card.html
 * expiration + status table rows with demo policy (valid through 2027-06-15 except DRV-004 & DRV-008).
 */
import fs from "fs";
import path from "path";

const GENERATED_ROOT = path.join(process.cwd(), "public", "generated", "drivers");
const DOCUMENTS_ROOT = path.join(process.cwd(), "public", "documents", "drivers");
const EXPIRED_DRIVERS = new Set(["DRV-004", "DRV-008"]);

for (let i = 1; i <= 12; i += 1) {
  const id = `DRV-${String(i).padStart(3, "0")}`;
  const file = path.join(GENERATED_ROOT, id, "medical-card.html");
  let html = fs.readFileSync(file, "utf8");
  const exp = EXPIRED_DRIVERS.has(id) ? "2026-04-22" : "2027-06-15";
  const st = EXPIRED_DRIVERS.has(id) ? "EXPIRED" : "VALID";
  const re =
    /<tr><td>Medical Card Expiration<\/td><td>\d{4}-\d{2}-\d{2}<\/td><\/tr>\s*<tr><td>Status<\/td><td>[A-Z_ ]+<\/td><\/tr>/;
  if (!re.test(html)) {
    console.error(`patch-demo-compliance-html: medical-card pattern mismatch ${id}`);
    process.exitCode = 1;
    break;
  }
  html = html.replace(
    re,
    `<tr><td>Medical Card Expiration</td><td>${exp}</td></tr>\n<tr><td>Status</td><td>${st}</td></tr>`
  );
  fs.writeFileSync(file, html);
}

function patchFmcsaComplianceRoot(rootLabel, rootPath) {
  for (let i = 1; i <= 12; i += 1) {
    const id = `DRV-${String(i).padStart(3, "0")}`;
    const file = path.join(rootPath, id, "fmcsa-compliance.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    const medSt = EXPIRED_DRIVERS.has(id) ? "EXPIRED" : "VALID";
    const row = /<tr><td>Medical Card Status<\/td><td>[A-Z_ ]+<\/td><\/tr>/;
    if (!row.test(html)) {
      console.error(`patch-demo-compliance-html: fmcsa-compliance row mismatch ${rootLabel} ${id}`);
      process.exitCode = 1;
      return;
    }
    html = html.replace(row, `<tr><td>Medical Card Status</td><td>${medSt}</td></tr>`);
    fs.writeFileSync(file, html);
  }
}

patchFmcsaComplianceRoot("generated", GENERATED_ROOT);
if (!process.exitCode) patchFmcsaComplianceRoot("documents", DOCUMENTS_ROOT);

if (!process.exitCode)
  console.log("patched medical-card.html + fmcsa-compliance Medical Card row (generated + documents)");
