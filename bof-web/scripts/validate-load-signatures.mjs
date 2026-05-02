import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildLoadSignaturePlaceholders } from "./lib/load-signatures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const PUBLIC_MANIFEST = path.join(ROOT, "public", "generated", "loads", "load-doc-manifest.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function toFsPath(publicUrl) {
  return path.join(ROOT, "public", publicUrl.replace(/^\//, ""));
}

function main() {
  const data = readJson(DATA_PATH);
  const manifest = readJson(PUBLIC_MANIFEST);
  const errors = [];

  const requiredSigMarkers = [
    "signature-section-title",
    "signature-status",
    "data-bof-sig-role",
  ];

  for (const load of data.loads || []) {
    const entry = manifest[load.id];
    if (!entry) {
      errors.push(`${load.id}: missing manifest entry`);
      continue;
    }
    const driver = data.drivers?.find((d) => d.id === load.driverId) ?? null;
    const sig = buildLoadSignaturePlaceholders(load, driver, new Date());
    const isDelivered = load.status === "Delivered";

    const podUrl = entry.pod;
    if (podUrl) {
      const podPath = toFsPath(podUrl);
      if (!fs.existsSync(podPath)) {
        errors.push(`${load.id}: POD file missing at ${podPath}`);
      } else {
        const html = readUtf8(podPath);
        for (const m of requiredSigMarkers) {
          if (!html.includes(m)) {
            errors.push(`${load.id}: POD missing signature marker "${m}"`);
          }
        }
        if (!html.includes("<!-- bof-sig-pod:")) {
          errors.push(`${load.id}: POD missing bof-sig-pod validation comment`);
        }
        if (isDelivered) {
          if (!html.includes("<!-- bof-sig-pod:complete -->")) {
            errors.push(`${load.id}: delivered POD must include <!-- bof-sig-pod:complete -->`);
          }
          if (!html.includes('data-bof-sig-role="receiver_pod"')) {
            errors.push(`${load.id}: delivered POD missing receiver_pod marker`);
          }
        } else {
          if (html.includes("<!-- bof-sig-pod:complete -->")) {
            errors.push(`${load.id}: non-delivered POD must not use complete signature bundle`);
          }
        }
      }
    }

    const bolUrl = entry.bol;
    if (bolUrl) {
      const bolPath = toFsPath(bolUrl);
      if (!fs.existsSync(bolPath)) {
        errors.push(`${load.id}: BOL file missing`);
      } else {
        const html = readUtf8(bolPath);
        if (!html.includes("<!-- bof-sig-bol:")) {
          errors.push(`${load.id}: BOL missing bof-sig-bol validation comment`);
        }
        if (isDelivered) {
          if (!html.includes('data-bof-sig-role="receiver_bol"')) {
            errors.push(`${load.id}: delivered BOL missing receiver_bol marker`);
          }
        }
      }
    }

    if (sig.signatureStatusSummary === "complete" && !isDelivered) {
      errors.push(`${load.id}: signature summary complete but load not Delivered`);
    }
    if (isDelivered && sig.signatureStatusSummary !== "complete") {
      errors.push(`${load.id}: Delivered load expected complete signature summary`);
    }

    const rateUrl = entry.rateConfirmation;
    if (rateUrl) {
      const p = toFsPath(rateUrl);
      if (fs.existsSync(p)) {
        const html = readUtf8(p);
        if (!html.includes("<!-- bof-sig-ratecon:")) {
          errors.push(`${load.id}: rate con missing bof-sig-ratecon comment`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(`validate-load-signatures: ${errors.length} issue(s)`);
    for (const e of errors) console.error(`- ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log("validate-load-signatures: OK");
}

main();
