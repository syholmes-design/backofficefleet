#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODEX_ROOT = path.join(ROOT, ".codex");
const REGISTRY_ROOT = path.join(CODEX_ROOT, "registry");
const REQUIRED_DIRS = ["agents", "skills", "playbooks", "reports", "registry"];
const REQUIRED_REGISTRIES = ["agents.json", "skills.json", "scripts.json", "route-ownership.json", "reports.json"];
const REQUIRED_AUTOLOAD_FILES = ["AGENTS.md", "CODEX.md", ".codex/README.md", ".codex/session-brief.md", ".codex/manifest.json", ".codexignore"];
const issues = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

for (const dir of REQUIRED_DIRS) {
  if (!fs.existsSync(path.join(CODEX_ROOT, dir))) {
    issues.push(`Missing .codex/${dir}`);
  }
}

for (const file of REQUIRED_AUTOLOAD_FILES) {
  if (!exists(file)) {
    issues.push(`Missing auto-load file: ${file}`);
  }
}

for (const file of REQUIRED_REGISTRIES) {
  const full = path.join(REGISTRY_ROOT, file);
  if (!fs.existsSync(full)) {
    issues.push(`Missing .codex/registry/${file}`);
    continue;
  }
  try {
    JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    issues.push(`Invalid JSON in .codex/registry/${file}: ${error.message}`);
  }
}

const agents = JSON.parse(fs.readFileSync(path.join(REGISTRY_ROOT, "agents.json"), "utf8"));
for (const agent of agents.agents ?? []) {
  if (!exists(agent.path)) issues.push(`Agent registry points to missing file: ${agent.path}`);
}

const skills = JSON.parse(fs.readFileSync(path.join(REGISTRY_ROOT, "skills.json"), "utf8"));
for (const skill of skills.skills ?? []) {
  if (!exists(skill.path)) issues.push(`Skill registry points to missing file: ${skill.path}`);
}

const routes = JSON.parse(fs.readFileSync(path.join(REGISTRY_ROOT, "route-ownership.json"), "utf8"));
for (const source of [routes.sourceOfTruth, ...(routes.primaryDataSources ?? [])]) {
  if (!exists(source)) issues.push(`Route/data registry points to missing source: ${source}`);
}

const scripts = JSON.parse(fs.readFileSync(path.join(REGISTRY_ROOT, "scripts.json"), "utf8"));
for (const script of scripts.auditScripts ?? []) {
  const command = script.command ?? "";
  const match = command.match(/npm run ([\w:-]+)/);
  if (!match) continue;
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  if (!pkg.scripts?.[match[1]]) issues.push(`Registry command missing package script: ${command}`);
}

const report = {
  ok: issues.length === 0,
  checkedAt: new Date().toISOString(),
  issues,
  recommendation: issues.length
    ? "Fix missing registry targets before relying on the Codex operating layer."
    : "Codex registry is internally consistent."
};

console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
