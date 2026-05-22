#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODEX_ROOT = path.join(ROOT, ".codex");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function oneLineList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

const manifest = readJson(".codex/manifest.json");
const agents = readJson(".codex/registry/agents.json").agents ?? [];
const skills = readJson(".codex/registry/skills.json").skills ?? [];
const scripts = readJson(".codex/registry/scripts.json").auditScripts ?? [];
const routes = readJson(".codex/registry/route-ownership.json");

const required = [
  "AGENTS.md",
  "CODEX.md",
  ".codex/session-brief.md",
  ".codex/README.md",
  ".codexignore",
  "docs/codex-environment-runbook.md",
  "docs/BOF_ROUTE_MAP.md"
];

const missing = required.filter((rel) => !exists(rel));
const sharedCloudPath = /OneDrive|Dropbox|Google Drive|iCloud/i.test(ROOT);
const gitPresent = exists(".git");

const output = [
  "# BackOfficeFleet Codex Bootstrap",
  "",
  "## Auto-Load Files",
  `Root instructions: ${manifest.autoLoad.rootInstructions}`,
  `Fallback instructions: ${manifest.autoLoad.fallbackInstructions}`,
  `Session brief: ${manifest.autoLoad.sessionBrief}`,
  "",
  "## Available Agents",
  oneLineList(agents.map((agent) => `${agent.id}: ${agent.trigger}`)),
  "",
  "## Available Skills",
  oneLineList(skills.map((skill) => skill.id)),
  "",
  "## Audit Commands",
  oneLineList(scripts.map((script) => `${script.command}${script.requiresDevServer ? " (requires dev server)" : ""}`)),
  "",
  "## Priority Routes",
  oneLineList(routes.priorityRoutes ?? []),
  "",
  "## Environment Status",
  `Workspace: ${ROOT}`,
  `Shared cloud folder detected: ${sharedCloudPath ? "yes" : "no"}`,
  `Git metadata present: ${gitPresent ? "yes" : "no"}`,
  missing.length ? `Missing required files:\n${oneLineList(missing)}` : "Required Codex files: OK",
  "",
  "## Next Step",
  sharedCloudPath
    ? "This shared cloud folder is supported. If Node read errors appear, check hydration, file locks, dependency install state, and build caches in place."
    : "Run npm run codex:registry-sync, then the audit command relevant to the task.",
  ""
].join("\n");

console.log(output);

if (missing.length) {
  process.exitCode = 1;
}

if (!fs.existsSync(CODEX_ROOT)) {
  process.exitCode = 1;
}
