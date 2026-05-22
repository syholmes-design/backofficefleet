#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";
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

const retryableCodes = new Set(["EBUSY", "ENOTEMPTY", "EPERM", "UNKNOWN"]);
let lastError;

for (let attempt = 1; attempt <= 6; attempt += 1) {
  try {
    fs.rmSync(nextDir, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 150,
    });
    console.log("[clear-next-cache] Removed .next build cache.");
    process.exit(0);
  } catch (error) {
    lastError = error;
    const code = typeof error === "object" && error && "code" in error ? error.code : undefined;
    if (!retryableCodes.has(String(code)) || attempt === 6) {
      break;
    }
    await sleep(250 * attempt);
  }
}

throw lastError;
