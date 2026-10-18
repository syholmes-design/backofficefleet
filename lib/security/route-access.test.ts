import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { PUBLIC_MARKETING_SEGMENTS, PUBLIC_STATIC_ROOTS, isPublicRoute, signInRedirectPath } from "@/lib/security/route-access";

test("every marketing page group segment is public", () => {
  const dir = join(process.cwd(), "app/(marketing)");
  const segments = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory() && !name.startsWith("[") && !name.startsWith("("));
  assert.deepEqual([...segments].sort(), [...PUBLIC_MARKETING_SEGMENTS].sort());
});

test("every public/ folder is a static root", () => {
  const dir = join(process.cwd(), "public");
  const folders = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
  assert.deepEqual([...folders].sort(), [...PUBLIC_STATIC_ROOTS].sort());
});

test("static files stay public; a file extension on a private route does not bypass the gate", () => {
  for (const path of [
    "/documents/drivers/DRV-001/cdl.png",
    "/documents/drivers/DRV-001/w9-drv-001.pdf",
    "/data/main-source-v2_enhanced_bof_aligned.xlsx",
    "/generated/drivers/DRV-001/driver-application.html",
    "/recovered-assets/static-20260729/scoped.css",
    "/images/drivers/DRV-001.png",
  ]) {
    assert.equal(isPublicRoute(path), true, path);
  }
  for (const path of [
    "/carriers/CAR-001/x.json",
    "/carriers/CAR-001/report.pdf",
    "/carriers/CAR-001/.x",
    "/drivers/DRV-001.json",
    "/loads/L-1001.json",
    "/pretrip/x.json",
    "/trip-release/x.json",
    "/intake/x.json",
    "/maintenance/photos/a.jpg",
    "/documents/vault/DRV-001.json",
    "/documents/vault/final.pdf",
    "/x.json",
    "/api/drivers/x.json",
    "/documents/%76ault/x.json",
    "/documents//vault/x.json",
    "/%64rivers/DRV-001",
    "/carriers%2FCAR-001",
    "/documents/%E0%A4%A.json",
  ]) {
    assert.equal(isPublicRoute(path), false, path);
  }
});

test("public pages stay reachable without a session", () => {
  for (const path of [
    "/",
    "/business-operations",
    "/business-operations/hr-tier/recruiting-onboarding",
    "/contact",
    "/careers",
    "/apply",
    "/book-assessment",
    "/assessment",
    "/assessment/private-fleets",
    "/demo/dispatch",
    "/demo/drivers",
    "/dashboard",
    "/documents",
    "/documents/company-operations-vault",
    "/documents/template-packs/x",
    "/customer-portal/quotes",
    "/portals",
    "/portals/manager",
    "/safety",
    "/business-operations/",
  ]) {
    assert.equal(isPublicRoute(path), true, path);
  }
});

test("private operating pages require a session", () => {
  for (const path of [
    "/dispatch",
    "/dispatch/intake",
    "/drivers",
    "/drivers/DRV-001/bank-info",
    "/drivers/DRV-001/profile",
    "/documents/vault",
    "/documents/vault/DRV-001",
    "/emergency-contacts",
    "/command-center",
    "/loads/L001",
    "/settlements",
    "/settlements/workbook",
    "/pretrip/L009",
    "/trip-release/L001",
    "/recruiting",
    "/recruiting-v2",
    "/recruiting-v2/candidates/CAND-001",
    "/carriers/CAR-003",
    "/portals/customer",
    "/portals/driver",
    "/customers",
    "/contact-inquiries",
    "/safety/training",
    "/maintenance",
    "/intake",
    "/source-of-truth",
    "/operational-chat",
    "/fleet-financials",
    "/some-future-route",
    "/demo-lookalike",
    "/documentsx",
  ]) {
    assert.equal(isPublicRoute(path), false, path);
  }
});

test("APIs are private except sign-in, public media/feeds and the two public submissions", () => {
  assert.equal(isPublicRoute("/api/auth/signin"), true);
  assert.equal(isPublicRoute("/api/auth/callback/credentials", "POST"), true);
  assert.equal(isPublicRoute("/api/marketing-demo-media"), true);
  assert.equal(isPublicRoute("/api/regulatory-feed"), true);
  assert.equal(isPublicRoute("/api/contact/inquiries", "POST"), true);
  assert.equal(isPublicRoute("/api/contact/inquiries", "GET"), false);
  assert.equal(isPublicRoute("/api/contact/inquiries/abc", "POST"), false);
  assert.equal(isPublicRoute("/api/recruiting/apply", "POST"), true);
  assert.equal(isPublicRoute("/api/recruiting/apply", "GET"), false);
  assert.equal(isPublicRoute("/api/recruiting-v2/qualification/CAND-001"), false);
  assert.equal(isPublicRoute("/api/dispatch/operating-spine"), false);
  assert.equal(isPublicRoute("/api/authx"), false);
});

test("sign-in redirect keeps the destination, drops RSC markers and stays relative", () => {
  assert.equal(signInRedirectPath("/dispatch", ""), "/api/auth/signin?callbackUrl=%2Fdispatch");
  assert.equal(
    signInRedirectPath("/dispatch", "?view=exceptions&_rsc=abc"),
    "/api/auth/signin?callbackUrl=%2Fdispatch%3Fview%3Dexceptions",
  );
});

test("public demo pages send anonymous visitors to demonstrations, never to private records", async () => {
  const { publicDemoTarget } = await import("./public-demo-links");
  assert.equal(publicDemoTarget("/loads/L001"), "/demo/loads");
  assert.equal(publicDemoTarget("/dispatch?view=exceptions&loadId=L003"), "/demo/dispatch?view=exceptions&loadId=L003");
  assert.equal(publicDemoTarget("/drivers/DRV-001/safety"), "/demo/drivers");
  assert.equal(publicDemoTarget("/documents/vault/DRV-001"), "/documents");
  assert.equal(publicDemoTarget("/carriers/CAR-002"), "/interactive-demo/carriers");
  // Public pages and API routes are left alone.
  assert.equal(publicDemoTarget("/demo/loads"), null);
  assert.equal(publicDemoTarget("/services/dispatch"), null);
  assert.equal(publicDemoTarget("/api/auth/signin"), null);
  assert.equal(publicDemoTarget("https://example.com/loads/L001"), null);
  // Every mapped destination is itself public.
  const { isPublicRoute } = await import("./route-access");
  for (const href of ["/loads/L1", "/pretrip/L1", "/trip-release/L1", "/maintenance/T-1", "/dispatch/intake", "/load-intake", "/command-center", "/dispatch/command-center", "/settlements/workbook", "/fleet-financials", "/portals/driver/DRV-1", "/portals/customer", "/safety/training", "/recruiting", "/operational-chat"]) {
    const target = publicDemoTarget(href);
    assert.ok(target, href);
    assert.ok(isPublicRoute(target.split("?")[0]), `${href} -> ${target}`);
  }
});
