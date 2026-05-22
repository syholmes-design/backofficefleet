/**
 * Static checks: dashboard hero/header links are real routes; no dead hash/javascript hrefs
 * in hero wiring; Book Demo env chain documented in lib/site-links.ts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const ROUTE_GROUPS = ["(bof)", "(marketing)"];

function routeExists(urlPath) {
  const clean = urlPath.replace(/^\//, "").split("#")[0];
  const segments = clean.split("/").filter(Boolean);
  for (const group of ROUTE_GROUPS) {
    const candidate = path.join(ROOT, "app", group, ...segments, "page.tsx");
    if (fs.existsSync(candidate)) return true;
  }
  return false;
}

function main() {
  const issues = [];

  const dashPath = path.join(ROOT, "components", "dashboard", "DashboardPageClient.tsx");
  const dash = fs.readFileSync(dashPath, "utf8");

  if (/href\s*=\s*{\s*["']#["']\s*}/.test(dash) || /href\s*=\s*["']#["']/.test(dash)) {
    issues.push("DashboardPageClient.tsx must not use href=\"#\"");
  }
  if (/href\s*=\s*["']\s*["']/.test(dash)) {
    issues.push("DashboardPageClient.tsx must not use empty href");
  }
  if (/javascript\s*:/i.test(dash)) {
    issues.push("DashboardPageClient.tsx must not use javascript: URLs");
  }
  if (!dash.includes("BookDemoLink")) {
    issues.push("Dashboard hero should render BookDemoLink for booking (wraps getBookDemoHref)");
  }

  const siteLinksPath = path.join(ROOT, "lib", "site-links.ts");
  const siteLinks = fs.readFileSync(siteLinksPath, "utf8");
  if (!siteLinks.includes("export function getBookDemoHref")) {
    issues.push("lib/site-links.ts must export getBookDemoHref");
  }
  if (!siteLinks.includes("NEXT_PUBLIC_BOOK_DEMO_URL")) {
    issues.push("getBookDemoHref should read NEXT_PUBLIC_BOOK_DEMO_URL");
  }
  if (!siteLinks.includes("NEXT_PUBLIC_CALENDAR_URL")) {
    issues.push("getBookDemoHref should read NEXT_PUBLIC_CALENDAR_URL");
  }
  if (!siteLinks.includes('/book-assessment?source=dashboard-hero')) {
    issues.push("getBookDemoHref should fall back to /book-assessment?source=dashboard-hero");
  }

  const heroRoutes = [
    "/",
    "/dispatch",
    "/dashboard",
    "/settlements",
    "/command-center",
    "/drivers",
    "/load-requests",
    "/for-hire-carriers",
    "/private-fleets",
    "/government",
    "/book-assessment",
  ];
  for (const r of heroRoutes) {
    if (!routeExists(r)) {
      issues.push(`Expected route file for hero/link ${r} under app/(bof)/…/page.tsx`);
    }
  }

  if (issues.length) {
    for (const i of issues) console.error(i);
    process.exitCode = 1;
    return;
  }
  console.log("validate-dashboard-links: OK");
}

main();
