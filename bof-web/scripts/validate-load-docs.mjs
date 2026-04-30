import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const PUBLIC_MANIFEST = path.join(ROOT, "public", "generated", "loads", "load-doc-manifest.json");
const CORE_KEYS = ["rateConfirmation", "bol", "pod", "invoice"];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toFsPath(publicUrl) {
  return path.join(ROOT, "public", publicUrl.replace(/^\//, ""));
}

function main() {
  const data = readJson(DATA_PATH);
  const manifest = readJson(PUBLIC_MANIFEST);
  const errors = [];

  for (const load of data.loads || []) {
    const entry = manifest[load.id];
    if (!entry) {
      errors.push(`${load.id}: missing manifest entry`);
      continue;
    }
    for (const key of CORE_KEYS) {
      const url = entry[key];
      if (!url) {
        errors.push(`${load.id}: missing ${key} URL`);
        continue;
      }
      const fp = toFsPath(url);
      if (!fs.existsSync(fp)) {
        errors.push(`${load.id}: broken ${key} URL -> ${url}`);
      }
    }
    const loadDir = path.join(ROOT, "public", "generated", "loads", load.id);
    if (!fs.existsSync(loadDir)) {
      errors.push(`${load.id}: output folder missing`);
    }
  }

  if (errors.length > 0) {
    console.error("validate:load-docs failed");
    for (const err of errors) console.error(` - ${err}`);
    process.exit(1);
  }

  console.log(`validate:load-docs passed for ${(data.loads || []).length} loads.`);
}

main();
