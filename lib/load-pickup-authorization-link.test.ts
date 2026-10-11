import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("the live load file lists stored pickup authorizations and does not issue them", () => {
  const links = read("components/dispatch/LoadPickupAuthorizationLinks.tsx");
  const load = read("components/dispatch/LoadDetailContent.tsx");
  const dock = read("components/dispatch/PickupDockClient.tsx");
  const dockPage = read("app/(bof)/dispatch/pickup/dock/page.tsx");
  assert.match(load, /LoadPickupAuthorizationLinks/);
  assert.match(links, /\/api\/dispatch\/pickup-authorization\?loadId=/);
  assert.match(links, /\/dispatch\/pickup\?loadId=/);
  assert.match(links, /\/dispatch\/pickup\/dock\?authorizationId=/);
  assert.match(links, /No pickup authorization is stored for this load/);
  assert.doesNotMatch(links, /issuePickupAuthorization|physical-reconcile|token/);
  assert.match(dock, /initialAuthorizationId/);
  assert.match(dockPage, /authorizationId/);
  assert.doesNotMatch(dock, /identityPhysicallyVerified:\s*true/);
});
