import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { PUBLIC_MARKETING_SEGMENTS, isPublicRoute, signInRedirectPath } from "@/lib/security/route-access";

test("every marketing page group segment is public", () => {
  const dir = join(process.cwd(), "app/(marketing)");
  const segments = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory() && !name.startsWith("[") && !name.startsWith("("));
  assert.deepEqual([...segments].sort(), [...PUBLIC_MARKETING_SEGMENTS].sort());
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
