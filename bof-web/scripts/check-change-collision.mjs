#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGE_MEMORY_INDEX = path.join(ROOT, ".codex", "change-memory", "index.md");

function normalizePath(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function parseArgs(argv) {
  const result = {
    files: [],
    operation: "before edit",
    backup: "",
    since: "",
    log: false,
  };
  const positionals = [];
  let filesExplicit = false;
  let operationExplicit = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--files" || arg === "--file") {
      const value = argv[++i] ?? "";
      result.files.push(...value.split(",").map(normalizePath).filter(Boolean));
      filesExplicit = true;
    } else if (arg === "--operation") {
      result.operation = argv[++i] ?? result.operation;
      operationExplicit = true;
    } else if (arg === "--backup" || arg === "--checkpoint") {
      result.backup = argv[++i] ?? "";
    } else if (arg === "--since") {
      result.since = argv[++i] ?? "";
    } else if (arg === "--log") {
      result.log = true;
    } else if (!arg.startsWith("--")) {
      positionals.push(arg);
    }
  }

  if (positionals.length) {
    if (!filesExplicit) {
      result.files.push(...positionals[0].split(",").map(normalizePath).filter(Boolean));
      if (!operationExplicit && positionals.length > 1) {
        result.operation = positionals.slice(1).join(" ");
      }
    } else if (!operationExplicit) {
      result.operation = positionals.join(" ");
    } else {
      result.files.push(...positionals.flatMap((value) => value.split(",").map(normalizePath)).filter(Boolean));
    }
  }

  result.files = [...new Set(result.files)];
  return result;
}

function getGitStatus() {
  try {
    const output = execFileSync("git", ["status", "--porcelain=v1", "-z"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const entries = output.split("\0").filter(Boolean);
    const modified = new Map();

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const status = entry.slice(0, 2);
      let filePath = normalizePath(entry.slice(3));
      if (status.includes("R") || status.includes("C")) {
        i += 1;
        filePath = normalizePath(entries[i] ?? filePath);
      }
      if (filePath) modified.set(filePath, status.trim() || "modified");
    }
    return modified;
  } catch {
    return new Map();
  }
}

function parseChangeMemoryEntries() {
  if (!fs.existsSync(CHANGE_MEMORY_INDEX)) return [];
  const text = fs.readFileSync(CHANGE_MEMORY_INDEX, "utf8");
  const chunks = text.split(/\n---\n/g);
  const entries = [];

  for (const chunk of chunks) {
    const id = chunk.match(/### Entry ID:\s*(.+)/)?.[1]?.trim();
    const dateText = chunk.match(/^Date:\s*(.+)$/m)?.[1]?.trim();
    const filesText = chunk.match(/^Files touched:\s*(.+)$/m)?.[1]?.trim();
    if (!id || !dateText || !filesText) continue;
    const date = new Date(dateText);
    const files = filesText.split(",").map(normalizePath).filter(Boolean);
    entries.push({ id, date, files });
  }

  return entries
    .filter((entry) => !Number.isNaN(entry.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function pathMatches(target, candidate) {
  const t = normalizePath(target).toLowerCase();
  const c = normalizePath(candidate).toLowerCase();
  return t === c || t.startsWith(`${c}/`) || c.startsWith(`${t}/`);
}

function getRiskRank(level) {
  return { low: 1, medium: 2, high: 3 }[level] ?? 0;
}

function highestRisk(findings) {
  return findings.reduce((level, finding) => {
    return getRiskRank(finding.risk) > getRiskRank(level) ? finding.risk : level;
  }, "low");
}

function isOverwriteOperation(operation) {
  return /restore|rollback|reverse|regenerate|rewrite|reset|checkout|switch|merge|pull|rebase|apply/i.test(operation);
}

function formatFinding(finding) {
  return `- ${finding.risk.toUpperCase()}: ${finding.file} - ${finding.reason}`;
}

const args = parseArgs(process.argv.slice(2));
const gitStatus = getGitStatus();
const changeMemoryEntries = parseChangeMemoryEntries();
const overwriteOperation = isOverwriteOperation(args.operation);
const findings = [];
const targetFiles = args.files;

if (targetFiles.length === 0) {
  const modifiedFiles = [...gitStatus.keys()];
  const summary = [
    "## Change Collision Check",
    "Operation: " + args.operation,
    "Files checked: none provided",
    modifiedFiles.length
      ? `Current modified files: ${modifiedFiles.length}. Pass --files to check a focused operation.`
      : "No modified files reported by git status.",
  ].join("\n");
  console.log(summary);
  process.exit(0);
}

let backupTime = null;
if (args.backup) {
  const backupPath = path.resolve(ROOT, args.backup);
  if (fs.existsSync(backupPath)) {
    backupTime = fs.statSync(backupPath).mtime;
  } else {
    findings.push({
      risk: "medium",
      file: args.backup,
      reason: "Backup/checkpoint path was provided but was not found.",
    });
  }
}

let sinceTime = null;
if (args.since) {
  const parsed = new Date(args.since);
  if (!Number.isNaN(parsed.getTime())) sinceTime = parsed;
}

for (const file of targetFiles) {
  const matchingGit = [...gitStatus.entries()].filter(([changed]) => pathMatches(file, changed));
  for (const [changed, status] of matchingGit) {
    findings.push({
      risk: overwriteOperation ? "high" : "medium",
      file: changed,
      reason: `File is currently modified in git status (${status}); ${overwriteOperation ? "operation may overwrite it" : "compare before editing"}.`,
    });
  }

  const full = path.join(ROOT, file);
  if (backupTime && fs.existsSync(full)) {
    const mtime = fs.statSync(full).mtime;
    if (mtime.getTime() > backupTime.getTime()) {
      findings.push({
        risk: "high",
        file,
        reason: `Current file timestamp (${mtime.toISOString()}) is newer than backup/checkpoint (${backupTime.toISOString()}).`,
      });
    }
  }

  const matchingEntries = changeMemoryEntries
    .filter((entry) => !sinceTime || entry.date.getTime() >= sinceTime.getTime())
    .filter((entry) => entry.files.some((changed) => pathMatches(file, changed)))
    .slice(0, 3);

  for (const entry of matchingEntries) {
    findings.push({
      risk: overwriteOperation ? "high" : "medium",
      file,
      reason: `Also appears in recent change-memory entry ${entry.id} (${entry.date.toISOString()}).`,
    });
  }
}

const unique = [];
const seen = new Set();
for (const finding of findings) {
  const key = `${finding.risk}|${finding.file}|${finding.reason}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(finding);
}

if (unique.length === 0) {
  console.log("No overwrite risk found for the files involved.");
  process.exit(0);
}

const level = highestRisk(unique);
const report = [
  "## Change Collision Warning",
  "",
  `Risk level: ${level.toUpperCase()}`,
  `Files at risk: ${targetFiles.join(", ")}`,
  `What appears to have happened: ${unique.length} possible overlap signal(s) were found from git status, file timestamps, or change-memory records.`,
  `What Codex is about to do: ${args.operation}`,
  "What could be overwritten:",
  ...unique.map(formatFinding),
  "Recommended safe option: Compare first, create a quick shared checkpoint, or narrow the operation to selected files.",
  "Other options: Merge both versions manually, skip risky files, or proceed only with owner override.",
].join("\n");

console.log(report);

if (args.log) {
  const logPath = path.join(ROOT, ".codex", "reports", "change-collision-log.md");
  const entry = [
    "",
    "## Entry",
    `Date: ${new Date().toISOString()}`,
    `Operation: ${args.operation}`,
    `Files at risk: ${targetFiles.join(", ")}`,
    `Risk level: ${level.toUpperCase()}`,
    "Recommended safe option: Compare first, create a quick shared checkpoint, or narrow the operation to selected files.",
    "Decision: pending",
    `Backup/checkpoint used: ${args.backup || "not provided"}`,
    "",
  ].join("\n");
  fs.appendFileSync(logPath, entry);
}

process.exitCode = 2;
