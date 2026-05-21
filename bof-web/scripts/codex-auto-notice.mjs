#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SENTINEL = path.join(ROOT, ".codex", ".auto-notice-seen");

if (process.env.BOF_CODEX_AUTO_NOTICE === "0") {
  process.exit(0);
}

const required = [
  "AGENTS.md",
  "CODEX.md",
  ".codex/manifest.json",
  ".codex/session-brief.md",
  ".codex/registry/agents.json"
];

const missing = required.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
if (missing.length) {
  console.warn(`[codex] Project-local Codex setup is incomplete. Missing: ${missing.join(", ")}`);
  process.exit(0);
}

if (!fs.existsSync(SENTINEL)) {
  fs.mkdirSync(path.dirname(SENTINEL), { recursive: true });
  fs.writeFileSync(SENTINEL, new Date().toISOString());
  console.log("[codex] BackOfficeFleet project-local Codex setup is available. See AGENTS.md and .codex/session-brief.md.");
  console.log("[codex] Run `npm run codex:bootstrap` for the full environment summary when needed.");
}
