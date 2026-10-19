#!/usr/bin/env node
/**
 * Read-only post-release check of a deployed BOF site. Creates no records (GET requests only).
 *
 *   BASE=https://backofficefleet.com node scripts/release/verify-public-routes.mjs
 *
 * Checks the public pages from the 2026-10-19 release, that private pages and APIs still require
 * sign-in, that careers postings stay blind, and that superseded wording is absent.
 */
const BASE = (process.env.BASE ?? "").replace(/\/$/, "");
if (!BASE) {
  console.error("Set BASE, e.g. BASE=https://backofficefleet.com");
  process.exit(2);
}

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

async function get(path) {
  const response = await fetch(BASE + path, { redirect: "manual", headers: { "User-Agent": "bof-release-verify" } });
  const text = response.status === 200 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location") ?? "", text };
}

const PUBLIC_PAGES = {
  "/": ["How the service works"],
  "/contact": ["Send an inquiry"],
  "/business-operations": ["How the service works"],
  "/recruiting-onboarding": ["From staffing need to dispatch-ready driver"],
  "/careers": ["CAREERS"],
  "/demo/recruiting": [],
  "/demo/recruiting/workspace": [],
  "/assessment": [],
};
for (const [path, phrases] of Object.entries(PUBLIC_PAGES)) {
  const r = await get(path);
  const missing = phrases.filter((p) => !r.text.includes(p));
  check(`public ${path}`, r.status === 200 && missing.length === 0, r.status !== 200 ? `HTTP ${r.status}` : missing.length ? `missing text: ${missing.join(", ")}` : "200");
  if (r.status === 200 && /CONTROL\s*[•·]\s*COMPLY\s*[•·]\s*CLEAR/i.test(r.text)) check(`superseded tagline absent on ${path}`, false, "found CONTROL • COMPLY • CLEAR");
}

for (const path of ["/recruiting", "/recruiting/workspace", "/contact-inquiries", "/drivers"]) {
  const r = await get(path);
  const gated = (r.status === 307 || r.status === 302 || r.status === 303) && r.location.includes("signin");
  check(`private ${path} requires sign-in`, gated, `HTTP ${r.status} ${r.location}`);
}
for (const path of ["/api/recruiting/workspace", "/api/contact/inquiries"]) {
  const r = await get(path);
  check(`private API ${path}`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

const openings = await get("/api/recruiting/openings");
if (openings.status === 200) {
  const body = JSON.parse(openings.text);
  const leaked = /fleetId|usdot|mcNumber|requestingCarrierName|requestingManager|estimatedRecruitingCost/i.test(openings.text);
  check("careers openings API", Array.isArray(body.openings) && !leaked, `${body.openings?.length ?? 0} openings; carrier fields ${leaked ? "LEAKED" : "absent"}`);
} else {
  check("careers openings API", false, `HTTP ${openings.status} (503 means the database is unavailable or the 20261019120000 migration is not applied)`);
}

const removed = await get("/recruiting-v2");
check("retired /recruiting-v2 removed", removed.status === 404 || removed.location.includes("signin"), `HTTP ${removed.status}`);

let failed = 0;
for (const c of checks) {
  if (!c.ok) failed += 1;
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  (${c.detail})`);
}
console.log(failed ? `\n${failed} check(s) failed against ${BASE}` : `\nAll ${checks.length} checks passed against ${BASE}`);
process.exit(failed ? 1 : 0);
