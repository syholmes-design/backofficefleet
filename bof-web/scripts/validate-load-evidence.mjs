import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const EVIDENCE_MANIFEST_PATH = path.join(ROOT, "public", "evidence", "loads", "load-evidence-manifest.json");
const PROOF_PANEL_PATH = path.join(ROOT, "components", "LoadProofPanel.tsx");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toFsPath(publicUrl) {
  return path.join(ROOT, "public", publicUrl.replace(/^\//, ""));
}

function main() {
  const data = readJson(DATA_PATH);
  const manifest = readJson(EVIDENCE_MANIFEST_PATH);
  const errors = [];

  for (const load of data.loads ?? []) {
    const loadDir = path.join(ROOT, "public", "evidence", "loads", load.id);
    if (!fs.existsSync(loadDir)) {
      errors.push(`${load.id}: missing evidence folder`);
    }
    const entry = manifest[load.id];
    if (!entry) {
      errors.push(`${load.id}: missing manifest entry`);
      continue;
    }
    for (const [key, value] of Object.entries(entry)) {
      if (!value) {
        errors.push(`${load.id}: ${key} has empty URL`);
        continue;
      }
      const url = typeof value === "string" ? value : value.url;
      if (!url) {
        errors.push(`${load.id}: ${key} is missing url field`);
        continue;
      }
      const fp = toFsPath(String(url));
      if (!fs.existsSync(fp)) {
        errors.push(`${load.id}: ${key} points to missing file ${url}`);
      }
    }
  }

  const proofPanel = fs.readFileSync(PROOF_PANEL_PATH, "utf8");
  if (/mocks\/mock_/i.test(proofPanel)) {
    errors.push("LoadProofPanel references /mocks paths");
  }
  if (/status:\s*\"ready\"[\s\S]{0,140}url:\s*undefined/gi.test(proofPanel)) {
    errors.push('Potential "ready without URL" pattern detected in LoadProofPanel');
  }

  if (errors.length > 0) {
    console.error("validate:load-evidence failed");
    for (const err of errors) console.error(` - ${err}`);
    process.exit(1);
  }

  console.log(`validate:load-evidence passed for ${(data.loads || []).length} loads.`);
}

main();
