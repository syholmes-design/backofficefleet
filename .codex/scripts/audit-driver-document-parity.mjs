import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const siteRoot = path.join(repoRoot, "Website");
const chromeExe = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find((candidate) => existsSync(candidate));

if (!chromeExe) {
  throw new Error("Chrome or Edge executable not found in standard Windows install locations.");
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function resolveSitePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let relative = decoded.replace(/^\/+/, "");
  if (!relative || relative.endsWith("/")) relative += "index.html";
  const resolved = path.normalize(path.join(siteRoot, relative));
  if (!resolved.startsWith(siteRoot)) return null;
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    const filePath = resolveSitePath(req.url || "/");
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

function listen(serverInstance) {
  return new Promise((resolve) => {
    serverInstance.listen(0, "127.0.0.1", () => resolve(serverInstance.address().port));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readDevToolsPort(profileDir) {
  const activePortFile = path.join(profileDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(activePortFile)) {
      const content = await readFile(activePortFile, "utf8");
      const [port] = content.trim().split(/\r?\n/);
      if (port) return Number(port);
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Chrome DevToolsActivePort.");
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
      else resolve(message.result);
      return;
    }
    if (message.method && this.waiters.has(message.method)) {
      const waiters = this.waiters.get(message.method);
      for (const waiter of [...waiters]) {
        if (!waiter.predicate || waiter.predicate(message.params || {})) {
          clearTimeout(waiter.timer);
          waiters.delete(waiter);
          waiter.resolve(message.params || {});
        }
      }
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitFor(method, predicate, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || new Set();
      const waiter = {
        predicate,
        resolve,
        timer: setTimeout(() => {
          waiters.delete(waiter);
          reject(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs)
      };
      waiters.add(waiter);
      this.waiters.set(method, waiters);
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Runtime evaluation failed.");
    }
    return result.result.value;
  }

  close() {
    this.ws.close();
  }
}

async function gotoPage(cdp, url) {
  const loaded = cdp.waitFor("Page.loadEventFired", null, 15000);
  await cdp.send("Page.navigate", { url });
  await loaded;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const ready = await cdp.evaluate(`(() => document.readyState === "complete" && !!document.querySelector(".route-app-main") && !!document.querySelector(".driver-doc-card"))()`);
    if (ready) return;
    await delay(100);
  }
  throw new Error(`Route did not become ready: ${url}`);
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const report = {
  generatedAt: new Date().toISOString(),
  browser: chromeExe,
  driversChecked: 0,
  documentSurfacesChecked: 0,
  failures: [],
  drivers: []
};
const reportPath = path.join(repoRoot, ".codex", "reports", "reference-driver-document-parity-render-audit.json");

const serverPort = await listen(server);
const baseUrl = `http://127.0.0.1:${serverPort}`;
const profileDir = path.join(repoRoot, ".codex", "tmp", `chrome-driver-parity-${Date.now()}`);
let chrome;
let cdp;

try {
  chrome = spawn(chromeExe, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  const debugPort = await readDevToolsPort(profileDir);
  const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" }).then((response) => response.json());
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (let i = 1; i <= 12; i += 1) {
    const slug = `drv-${String(i).padStart(3, "0")}`;
    const driverUrl = `${baseUrl}/interactive-demo/drivers/${slug}/`;
    const failures = [];
    await gotoPage(cdp, driverUrl);
    const routeState = await cdp.evaluate(`(() => {
      const cards = [...document.querySelectorAll(".driver-doc-card")];
      const photo = document.querySelector(".driver-record-photo");
      return {
        title: document.title,
        heading: document.querySelector("h1")?.textContent.trim() || "",
        hero: document.querySelector(".driver-record-hero")?.textContent || "",
        docCount: cards.length,
        docTitles: cards.map((card) => card.querySelector("strong")?.textContent.trim() || ""),
        hrefs: cards.map((card) => card.getAttribute("href")),
        photoSrc: photo?.getAttribute("src") || "",
        photoComplete: !!photo && photo.complete && photo.naturalWidth > 0 && photo.naturalHeight > 0,
        dqfText: document.querySelector(".dqf-command-panel")?.textContent || "",
        requestTable: document.body.textContent.includes("Document requests"),
        generatedForms: document.body.textContent.includes("Generated HR and safety forms")
      };
    })()`);
    assert(routeState.heading.includes(`DRV-${String(i).padStart(3, "0")}`), `${slug}: route heading does not include driver id`, failures);
    assert(routeState.docCount === 23, `${slug}: expected 23 document cards, found ${routeState.docCount}`, failures);
    assert(routeState.photoComplete, `${slug}: driver photo did not load`, failures);
    assert(routeState.dqfText.includes("DQF Readiness"), `${slug}: DQF readiness panel missing`, failures);
    assert(routeState.requestTable, `${slug}: document request workflow missing`, failures);
    assert(routeState.generatedForms, `${slug}: generated forms workflow missing`, failures);

    const driverResult = {
      slug,
      heading: routeState.heading,
      photoSrc: routeState.photoSrc,
      docCount: routeState.docCount,
      docTitles: routeState.docTitles,
      documentFailures: []
    };

    for (let docIndex = 0; docIndex < 23; docIndex += 1) {
      await gotoPage(cdp, `${driverUrl}?doc=${docIndex}#driver-document-viewer`);
      const docState = await cdp.evaluate(`(() => {
        const paper = document.querySelector("[data-driver-document-paper] .driver-document-paper");
        const text = paper?.textContent || "";
        const viewerTitle = document.querySelector("[data-driver-doc-title]")?.textContent.trim() || "";
        const activeCard = document.querySelector('.driver-doc-card[data-driver-doc="${docIndex}"]');
        return {
          hasPaper: !!paper,
          viewerTitle,
          activeCardTitle: activeCard?.querySelector("strong")?.textContent.trim() || "",
          text,
          hasLicenseVisual: !!document.querySelector(".synthetic-license-card, .license-card, .document-kind-license-id"),
          textLength: text.length
        };
      })()`);
      const docFailures = [];
      assert(docState.hasPaper, `${slug} doc ${docIndex}: document paper missing`, docFailures);
      assert(docState.viewerTitle === routeState.docTitles[docIndex], `${slug} doc ${docIndex}: viewer title mismatch`, docFailures);
      assert(docState.textLength > 1200, `${slug} doc ${docIndex}: document paper too thin (${docState.textLength} chars)`, docFailures);
      for (const required of ["Driver", "Driver ID", "Document owner", "Review date", "Status", "Expiration / renewal", "Next action", "Reviewed by"]) {
        assert(docState.text.includes(required), `${slug} doc ${docIndex}: missing required field "${required}"`, docFailures);
      }
      assert(/Dispatch consequence|Release consequence|Dispatch effect/i.test(docState.text), `${slug} doc ${docIndex}: missing dispatch/release consequence`, docFailures);
      assert(/Audit|Activity|History|timeline/i.test(docState.text), `${slug} doc ${docIndex}: missing audit/history signal`, docFailures);
      assert(!/\b(Masked|Private value|On file|TBD|555|fake API|static demo|static site)\b/i.test(docState.text), `${slug} doc ${docIndex}: placeholder/private/demo wording found`, docFailures);
      if (docIndex === 0) {
        assert(docState.hasLicenseVisual, `${slug} doc 0: license-style visual missing`, docFailures);
      }
      if (docFailures.length) {
        driverResult.documentFailures.push({ docIndex, title: routeState.docTitles[docIndex], failures: docFailures });
        report.failures.push(...docFailures);
      }
      report.documentSurfacesChecked += 1;
    }

    if (failures.length) {
      driverResult.routeFailures = failures;
      report.failures.push(...failures);
    }
    report.drivers.push(driverResult);
    report.driversChecked += 1;
  }
} finally {
  if (cdp) cdp.close();
  if (chrome && !chrome.killed) chrome.kill();
  server.close();
  await delay(250);
  await rm(profileDir, { recursive: true, force: true }).catch(() => {});
}

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({
  generatedAt: report.generatedAt,
  reportPath,
  driversChecked: report.driversChecked,
  documentSurfacesChecked: report.documentSurfacesChecked,
  failureCount: report.failures.length,
  firstFailures: report.failures.slice(0, 20)
}, null, 2));
if (report.failures.length) process.exit(1);
