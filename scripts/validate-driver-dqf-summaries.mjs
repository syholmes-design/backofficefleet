import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GEN_TS = path.join(ROOT, "scripts", "generate-driver-dqf-summaries.ts");
const GEN_MJS = path.join(ROOT, "scripts", "generate-driver-dqf-summaries.mjs");
const SYNTH = path.join(ROOT, "scripts", "lib", "dqf-demo-synthetic-data.mjs");
const MANIFEST = path.join(ROOT, "lib", "generated", "driver-doc-manifest.json");
const PACKET = path.join(ROOT, "lib", "driver-document-packet.ts");
const INDEX_PATH = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");
const REGISTRY = path.join(ROOT, "lib", "driver-doc-registry.ts");

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function main() {
  const errors = [];

  for (let i = 1; i <= 12; i += 1) {
    const suffix3 = String(i).padStart(3, "0");
    const driverId = `DRV-${suffix3}`;
    const pdfRel = path.join(
      "public",
      "documents",
      "drivers",
      driverId,
      `dqf-compliance-summary-drv-${suffix3}.pdf`
    );
    const pdfAbs = path.join(ROOT, pdfRel);
    if (!fs.existsSync(pdfAbs)) {
      errors.push(`Missing canonical DQF PDF: ${pdfRel}`);
    }
  }

  const manifest = JSON.parse(readText(MANIFEST));
  for (let i = 1; i <= 12; i += 1) {
    const suffix3 = String(i).padStart(3, "0");
    const driverId = `DRV-${suffix3}`;
    const expected = `/documents/drivers/${driverId}/dqf-compliance-summary-drv-${suffix3}.pdf`;
    const url = manifest[driverId]?.dqfComplianceSummary;
    if (url !== expected) {
      errors.push(`Manifest ${driverId}: expected dqfComplianceSummary ${expected}, got ${url ?? "(missing)"}`);
    }
    if (typeof url === "string" && /\.html(\?|$)/i.test(url)) {
      errors.push(`Manifest ${driverId}: dqfComplianceSummary must not reference legacy HTML`);
    }
    const abs = path.join(ROOT, "public", url?.replace(/^\//, "") ?? "");
    if (!url || !fs.existsSync(abs)) {
      errors.push(`Manifest ${driverId}: dqf PDF missing on disk for ${url}`);
    }
  }

  const index = JSON.parse(readText(INDEX_PATH));
  const fileSet = new Set((index.files ?? []).map((x) => String(x).trim()));
  for (let i = 1; i <= 12; i += 1) {
    const suffix3 = String(i).padStart(3, "0");
    const driverId = `DRV-${suffix3}`;
    const expected = `/documents/drivers/${driverId}/dqf-compliance-summary-drv-${suffix3}.pdf`;
    if (!fileSet.has(expected)) {
      errors.push(`driver-public-doc-index missing ${expected}`);
    }
  }

  const registrySrc = readText(REGISTRY);
  if (!registrySrc.includes("dqf-compliance-summary-${driverId.toLowerCase()}")) {
    errors.push(
      "driver-doc-registry.ts must resolve FMCSA DQF Compliance Summary via dqf-compliance-summary-{driverIdLower} basename"
    );
  }

  const packetSrc = readText(PACKET);
  if (!packetSrc.includes('canonicalType: "dqf_compliance_summary"')) {
    errors.push("driver-document-packet.ts should declare dqf_compliance_summary canonicalType once");
  }
  const labelInPacket = (packetSrc.match(/label:\s*"FMCSA DQF Compliance Summary"/g) || []).length;
  if (labelInPacket !== 1) {
    errors.push(
      `Expected exactly one FMCSA DQF Compliance Summary row in driver-document-packet.ts, found ${labelInPacket}`
    );
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

  if (errors.length) {
    console.error(`validate-driver-dqf-summaries: ${errors.length} issue(s)`);
    for (const e of errors) console.error(`- ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-dqf-summaries: OK");
}

main();
