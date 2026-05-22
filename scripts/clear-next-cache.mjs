#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(ROOT, ".next");

if (!fs.existsSync(nextDir)) {
  console.log("[clear-next-cache] No .next cache present.");
  process.exit(0);
}

const resolved = fs.realpathSync.native(path.dirname(nextDir));
const targetParent = path.dirname(nextDir);
if (resolved.toLowerCase() !== targetParent.toLowerCase()) {
  throw new Error(`Refusing to remove .next because parent resolved unexpectedly: ${resolved}`);
}

fs.rmSync(nextDir, { recursive: true, force: true });
console.log("[clear-next-cache] Removed .next build cache.");
