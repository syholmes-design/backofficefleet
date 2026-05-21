#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = path.join(ROOT, ".codex", "reports", "visual-polish-report.md");
const SHOT_DIR = path.join(ROOT, ".codex", "reports", "visual-smoke");
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, ".codex", "registry", "route-ownership.json"), "utf8"));
const BASE_URL = process.env.BOF_AUDIT_BASE_URL || "http://localhost:3000";
const ROUTES = (process.env.BOF_AUDIT_ROUTES?.split(",").map((s) => s.trim()).filter(Boolean)) || REGISTRY.priorityRoutes;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
];

function slug(route) {
  return route.replace(/^\//, "home").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

fs.mkdirSync(SHOT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const issues = [];

for (const viewport of VIEWPORTS) {
  const page = await browser.newPage({ viewport });
  for (const route of ROUTES) {
    const url = new URL(route, BASE_URL).toString();
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch((error) => {
      issues.push({ route, viewport: viewport.name, issue: "Page failed to load", detail: error.message, severity: "high" });
      return null;
    });
    if (!response || !response.ok()) {
      if (response) issues.push({ route, viewport: viewport.name, issue: "Non-OK response", detail: String(response.status()), severity: "high" });
      continue;
    }

    const metrics = await page.evaluate(() => {
      const bodyText = document.body.innerText.trim();
      const main = document.querySelector("main") || document.body;
      const rect = main.getBoundingClientRect();
      return {
        textLength: bodyText.length,
        mainHeight: rect.height,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headings: document.querySelectorAll("h1,h2,h3").length,
        links: document.querySelectorAll("a[href]").length,
        buttons: document.querySelectorAll("button,[role=button]").length
      };
    });

    if (metrics.textLength < 80 || metrics.mainHeight < 200) {
      issues.push({ route, viewport: viewport.name, issue: "Page appears sparse or blank", detail: JSON.stringify(metrics), severity: "high" });
    }
    if (metrics.scrollWidth > metrics.clientWidth + 8) {
      issues.push({ route, viewport: viewport.name, issue: "Horizontal overflow", detail: `${metrics.scrollWidth}px > ${metrics.clientWidth}px`, severity: "medium" });
    }

    const screenshot = path.join(SHOT_DIR, `${slug(route)}-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
  }
  await page.close();
}

await browser.close();

const plain = issues.length
  ? `The visual smoke audit found ${issues.length} possible rendering issue(s). Review screenshots in .codex/reports/visual-smoke.`
  : "The visual smoke audit loaded the priority pages on desktop and mobile without obvious blank-page or overflow failures.";

const report = [
  "# Visual Polish Report",
  "",
  "## Plain-English Summary",
  plain,
  "",
  "## Visual Issues",
  ...(issues.length
    ? issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.route} (${issue.viewport}) - ${issue.issue}: ${issue.detail}`)
    : ["- None found by smoke checks."]),
  "",
  "## Technical Appendix",
  `Base URL: ${BASE_URL}`,
  `Routes checked: ${ROUTES.length}`,
  `Screenshots: ${path.relative(ROOT, SHOT_DIR).replaceAll(path.sep, "/")}`,
  ""
].join("\n");

fs.writeFileSync(REPORT_PATH, report);
console.log(report);

if (issues.some((issue) => issue.severity === "high")) {
  process.exitCode = 1;
}
