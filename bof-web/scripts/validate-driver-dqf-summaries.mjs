import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const GEN_TS = path.join(ROOT, "scripts", "generate-driver-dqf-summaries.ts");
const GEN_MJS = path.join(ROOT, "scripts", "generate-driver-dqf-summaries.mjs");
const SYNTH = path.join(ROOT, "scripts", "lib", "dqf-demo-synthetic-data.mjs");
const MANIFEST = path.join(ROOT, "lib", "generated", "driver-doc-manifest.json");
const PACKET = path.join(ROOT, "lib", "driver-document-packet.ts");

function fail(msg) {
  console.error(`validate-driver-dqf-summaries: ${msg}`);
  process.exitCode = 1;
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function main() {
  const errors = [];

  for (let i = 1; i <= 12; i += 1) {
    const driverId = `DRV-${String(i).padStart(3, "0")}`;
    const file = path.join(ROOT, "public", "documents", "drivers", driverId, "dqf-compliance-summary.html");
    if (!fs.existsSync(file)) {
      errors.push(`Missing ${path.relative(ROOT, file)}`);
      continue;
    }
    const html = readText(file);
    if (!html.includes("<!-- BOF_TEMPLATE_SOURCE: scripts/templates/driver-docs/dqf-compliance-summary.template.html -->")) {
      errors.push(`${driverId}: missing BOF_TEMPLATE_SOURCE comment`);
    }
    if (!html.includes("<!-- BOF_DOCUMENT_TYPE: dqf_compliance_summary -->")) {
      errors.push(`${driverId}: missing BOF_DOCUMENT_TYPE comment`);
    }
    const idComment = `<!-- BOF_DRIVER_ID: ${driverId} -->`;
    if (!html.includes(idComment)) {
      errors.push(`${driverId}: missing or mismatched BOF_DRIVER_ID`);
    }
    if (!html.includes("<!-- BOF_SYNTHETIC_DEMO_FIELDS:")) {
      errors.push(`${driverId}: missing BOF_SYNTHETIC_DEMO_FIELDS comment`);
    }
    if (!/Marcus Reed|Alicia Morgan|Danielle Brooks|Ethan Wallace/.test(html)) {
      errors.push(`${driverId}: expected synthetic reviewer pool name in output`);
    }
    if (!/BOF Compliance Coordinator|BOF Safety|Qualification Specialist|Operations Compliance Lead/.test(html)) {
      errors.push(`${driverId}: expected reviewer title in output`);
    }
    if (!/Signed \(demo\)/i.test(html)) {
      errors.push(`${driverId}: expected reviewer signature block`);
    }
    const forbidden = [/VALID\s*\(synthetic\)/i, /EXPIRED\s*\(demo\)\s*override/i];
    for (const re of forbidden) {
      if (re.test(html)) errors.push(`${driverId}: suspicious override phrasing: ${re}`);
    }
  }

  for (const p of [GEN_TS, GEN_MJS, SYNTH]) {
    const src = readText(p);
    if (/\bDate\.now\s*\(/.test(src)) {
      errors.push(`${path.relative(ROOT, p)} must not use Date.now()`);
    }
    if (/\bMath\.random\s*\(/.test(src)) {
      errors.push(`${path.relative(ROOT, p)} must not use Math.random()`);
    }
  }

  const manifest = JSON.parse(readText(MANIFEST));
  for (let i = 1; i <= 12; i += 1) {
    const driverId = `DRV-${String(i).padStart(3, "0")}`;
    const url = manifest[driverId]?.dqfComplianceSummary;
    const expected = `/documents/drivers/${driverId}/dqf-compliance-summary.html`;
    if (url !== expected) {
      errors.push(`Manifest ${driverId}: expected dqfComplianceSummary ${expected}, got ${url ?? "(missing)"}`);
    }
    const abs = path.join(ROOT, "public", url?.replace(/^\//, "") ?? "");
    if (!url || !fs.existsSync(abs)) {
      errors.push(`Manifest ${driverId}: dqf file missing on disk for ${url}`);
    }
  }

  const packetSrc = readText(PACKET);
  if (!packetSrc.includes("canonicalType: \"dqf_compliance_summary\"")) {
    errors.push("driver-document-packet.ts should declare dqf_compliance_summary canonicalType once");
  }
  const labelInPacket = (packetSrc.match(/label:\s*"FMCSA DQF Compliance Summary"/g) || []).length;
  if (labelInPacket !== 1) {
    errors.push(
      `Expected exactly one FMCSA DQF Compliance Summary row in driver-document-packet.ts, found ${labelInPacket}`
    );
  }

  if (errors.length) {
    console.error(`validate-driver-dqf-summaries: ${errors.length} issue(s)`);
    for (const e of errors) console.error(`- ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-dqf-summaries: OK");
}

main();
