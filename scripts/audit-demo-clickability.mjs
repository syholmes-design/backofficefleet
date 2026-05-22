#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, ".codex", "registry", "route-ownership.json"), "utf8"));
const BASE_URL = process.env.BOF_AUDIT_BASE_URL || "http://localhost:3000";
const ROUTES = (process.env.BOF_AUDIT_ROUTES?.split(",").map((s) => s.trim()).filter(Boolean)) || REGISTRY.priorityRoutes;

function isInternalHref(href) {
  if (!href || href === "#") return false;
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

for (const route of ROUTES) {
  const url = new URL(route, BASE_URL).toString();
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch((error) => {
    issues.push({ route, issue: "Route navigation failed", detail: error.message, severity: "high" });
    return null;
  });
  if (!response) continue;
  if (!response.ok()) {
    issues.push({ route, issue: "Route returned non-OK status", detail: String(response.status()), severity: "high" });
    continue;
  }

  const controls = await page.locator("a, button, [role=button], [role=tab]").evaluateAll((nodes) =>
    nodes.map((node) => {
      const el = node;
      const text = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().replace(/\s+/g, " ");
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text,
        href: el.getAttribute("href"),
        disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
        visible: rect.width > 0 && rect.height > 0,
        role: el.getAttribute("role")
      };
    })
  );

  for (const control of controls) {
    if (!control.visible || control.disabled) continue;
    if (control.tag === "a") {
      if (!control.href || control.href === "#" || /^javascript:/i.test(control.href)) {
        issues.push({
          route,
          issue: "Anchor has no useful destination",
          detail: control.text || control.href || "(unlabeled)",
          severity: "high"
        });
        continue;
      }
      if (isInternalHref(control.href)) {
        const linkResponse = await page.request.get(new URL(control.href, BASE_URL).toString(), { timeout: 15000 }).catch((error) => ({
          ok: () => false,
          status: () => error.message
        }));
        if (!linkResponse.ok()) {
          issues.push({
            route,
            issue: "Internal link did not resolve",
            detail: `${control.text || control.href} -> ${control.href} (${linkResponse.status()})`,
            severity: "high"
          });
        }
      }
    } else if (!control.text && !control.role) {
      issues.push({
        route,
        issue: "Visible control is unlabeled",
        detail: control.tag,
        severity: "medium"
      });
    }
  }
}

await browser.close();

const summary = {
  baseUrl: BASE_URL,
  routesChecked: ROUTES.length,
  issues
};

console.log(JSON.stringify(summary, null, 2));
if (issues.some((issue) => issue.severity === "high")) {
  process.exitCode = 1;
}
