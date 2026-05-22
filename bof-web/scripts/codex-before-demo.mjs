#!/usr/bin/env node

import fs from "fs";
import net from "net";
import path from "path";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = path.join(ROOT, ".codex", "reports", "before-demo-readiness.md");
const DEFAULT_PORT = 3000;
const ENV_BASE_URL = process.env.BOF_AUDIT_BASE_URL;

const requiredSteps = [
  { name: "Codex registry sync", command: "npm run codex:registry-sync", timeoutMs: 60000 },
  { name: "Demo completeness scan", command: "npm run audit:demo-completeness", timeoutMs: 60000 },
  { name: "TypeScript typecheck", command: "npm run typecheck", timeoutMs: 120000 },
  { name: "ESLint app scan", command: "npm run lint", timeoutMs: 120000 },
  { name: "Production build", command: "npm run build", timeoutMs: 420000 },
  { name: "Driver document validation", command: "npm run validate:driver-docs", timeoutMs: 60000 },
  { name: "Load document validation", command: "npm run validate:load-docs", timeoutMs: 60000 },
  { name: "Load evidence validation", command: "npm run validate:load-evidence", timeoutMs: 60000 },
  { name: "Safety evidence validation", command: "npm run validate:safety-evidence", timeoutMs: 60000 }
];

const browserSteps = [
  { name: "Demo clickability audit", command: "npm run audit:demo-clickability", timeoutMs: 180000 },
  { name: "BOF link and artifact audit", command: "npm run audit:bof-links", timeoutMs: 180000 },
  { name: "Visual smoke audit", command: "npm run audit:visual-smoke", timeoutMs: 420000 }
];

function runStep(step) {
  console.log(`\n## ${step.name}`);
  console.log(`$ ${step.command}`);
  const result = spawnSync(step.command, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    env: { ...process.env, BOF_AUDIT_BASE_URL: activeBaseUrl },
    timeout: step.timeoutMs ?? 180000
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    ...step,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status ?? 1
  };
}

async function devServerLooksReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(activeBaseUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    function tryPort(port) {
      const server = net.createServer();
      server.once("error", (error) => {
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          tryPort(port + 1);
        } else {
          reject(error);
        }
      });
      server.once("listening", () => {
        server.close(() => resolve(port));
      });
      server.listen(port, "127.0.0.1");
    }
    tryPort(startPort);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDevServer(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await devServerLooksReady()) return true;
    await sleep(1000);
  }
  return false;
}

function stopDevServer(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      cwd: ROOT,
      stdio: "ignore"
    });
    return;
  }
  child.kill("SIGTERM");
}

function startDevServer(port) {
  console.log(`\nStarting temporary production server at http://localhost:${port} ...`);
  return spawn("npm", ["run", "start", "--", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env
  });
}

function writeReport(results, skippedBrowserAudits, startedDevServer) {
  const failed = results.filter((result) => result.status === "fail");
  const passed = results.filter((result) => result.status === "pass");
  const plain = failed.length
    ? `Before-demo checks found ${failed.length} blocker(s). Fix the failed gate(s), then rerun this command.`
    : skippedBrowserAudits
      ? "Core readiness checks passed. Browser route/link/visual audits were skipped because the dev server was not reachable."
      : "Before-demo checks passed, including browser route, link, artifact, and visual smoke audits.";

  const lines = [
    "# Before-Demo Readiness Report",
    "",
    "## Plain-English Summary",
    plain,
    "",
    "## Gate Results",
    "| Status | Check | Command |",
    "| --- | --- | --- |",
    ...results.map((result) => `| ${result.status.toUpperCase()} | ${result.name} | \`${result.command}\` |`),
    ...(skippedBrowserAudits
      ? browserSteps.map((step) => `| SKIPPED | ${step.name} | \`${step.command}\` |`)
      : []),
    "",
    "## Owner Notes",
    skippedBrowserAudits
      ? `Browser audits were skipped because ${activeBaseUrl} was not reachable and the temporary dev server did not become ready in time.`
      : startedDevServer
        ? "A temporary dev server was started for browser-based checks and stopped after the audits completed."
        : "The dev server was already reachable, so browser-based checks ran against the configured audit URL.",
    "",
    "## Technical Appendix",
    `Base URL: ${activeBaseUrl}`,
    `Passed checks: ${passed.length}`,
    `Failed checks: ${failed.length}`,
    `Generated at: ${new Date().toISOString()}`,
    ""
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"));
  console.log(`\nWrote ${path.relative(ROOT, REPORT_PATH).replaceAll(path.sep, "/")}`);
}

const results = [];
let activeBaseUrl = ENV_BASE_URL || `http://localhost:${DEFAULT_PORT}`;
let devServerProcess = null;
let startedDevServer = false;

for (const step of requiredSteps) {
  results.push(runStep(step));
}

const requiredFailed = results.some((result) => result.status === "fail");
if (requiredFailed) {
  writeReport(results, true, false);
  process.exitCode = 1;
  process.exit();
}

let devServerReady = await devServerLooksReady();
if (!devServerReady && !ENV_BASE_URL) {
  const port = await findAvailablePort(DEFAULT_PORT);
  activeBaseUrl = `http://localhost:${port}`;
  devServerProcess = startDevServer(port);
  startedDevServer = true;

  devServerProcess.stdout.on("data", (chunk) => process.stdout.write(chunk));
  devServerProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

  devServerReady = await waitForDevServer();
}

try {
  if (devServerReady) {
    for (const step of browserSteps) {
      results.push(runStep(step));
    }
  } else {
    console.log(`\nBrowser audits skipped: ${activeBaseUrl} is not reachable.`);
  }
} finally {
  stopDevServer(devServerProcess);
}

writeReport(results, !devServerReady, startedDevServer);

if (results.some((result) => result.status === "fail")) {
  process.exitCode = 1;
}
