#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = path.join(ROOT, ".codex", "reports", "broken-link-report.md");
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, ".codex", "registry", "route-ownership.json"), "utf8"));
const BASE_URL = process.env.BOF_AUDIT_BASE_URL || "http://localhost:3000";
const ROUTES = (process.env.BOF_AUDIT_ROUTES?.split(",").map((s) => s.trim()).filter(Boolean)) || REGISTRY.priorityRoutes;
const PUBLIC_PREFIXES = ["/generated/", "/documents/", "/proof/", "/evidence/", "/reference/", "/actual_docs/"];

function localPublicPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].replace(/^\/+/, ""));
  return path.join(ROOT, "public", clean);
}

function shouldCheckHref(href) {
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("#")) return false;
  if (/^javascript:/i.test(href)) return true;
  try {
    const url = new URL(href, BASE_URL);
    return url.origin === new URL(BASE_URL).origin;
  } catch {
    return false;
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const issues = [];
const checked = [];

for (const route of ROUTES) {
  const response = await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: "networkidle", timeout: 30000 }).catch((error) => {
    issues.push({ route, href: route, issue: "Route failed to load", detail: error.message, severity: "high" });
    return null;
  });
  if (!response || !response.ok()) continue;

  const hrefs = await page.locator("a[href]").evaluateAll((links) =>
    Array.from(new Set(links.map((link) => link.getAttribute("href")).filter(Boolean)))
  );

  for (const href of hrefs) {
    if (!shouldCheckHref(href)) continue;
    if (/^javascript:/i.test(href)) {
      issues.push({ route, href, issue: "javascript URL", detail: href, severity: "high" });
      continue;
    }
    const url = new URL(href, BASE_URL);
    checked.push(url.pathname);

    const isPublicArtifact = PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
    const existsOnDisk = isPublicArtifact ? fs.existsSync(localPublicPath(url.pathname)) : false;
    if (existsOnDisk) continue;

    const linkResponse = await page.request.get(url.toString(), { timeout: 15000 }).catch((error) => ({
      ok: () => false,
      status: () => error.message,
      headers: () => ({})
    }));
    if (!linkResponse.ok()) {
      issues.push({
        route,
        href: url.pathname,
        issue: isPublicArtifact ? "Artifact link missing and fallback failed" : "Internal link failed",
        detail: String(linkResponse.status()),
        severity: "high"
      });
    }
  }
}

await browser.close();

const plain = issues.length
  ? `The link audit found ${issues.length} link or artifact issue(s). Fix generated-document and internal navigation failures before a demo.`
  : "The link audit did not find broken priority-route links or artifact fallback failures.";

const report = [
  "# Broken Link Report",
  "",
  "## Plain-English Summary",
  plain,
  "",
  "## Broken Or Risky Links",
  ...(issues.length
    ? issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.route} -> ${issue.href}: ${issue.issue} (${issue.detail})`)
    : ["- None found."]),
  "",
  "## Technical Appendix",
  `Base URL: ${BASE_URL}`,
  `Routes checked: ${ROUTES.length}`,
  `Links checked: ${checked.length}`,
  ""
].join("\n");

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(report);

if (issues.some((issue) => issue.severity === "high")) {
  process.exitCode = 1;
}
