import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { maintenanceEquipmentClassLabel } from "../lib/maintenance-data";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const pkg = read("package.json");
assert.doesNotMatch(pkg, /git add \./, "020: deploy scripts must not use git add .");
assert.doesNotMatch(pkg, /git add -A/, "020: deploy scripts must not use git add -A");
assert.match(pkg, /"deploy:full": "npm run generate:driver-docs && npx --yes vercel --prod"/, "020: deploy:full keeps Vercel without auto-commit");
assert.match(pkg, /"demo:reset:deploy": "npm run demo:reset && npx --yes vercel --prod"/, "020: demo:reset:deploy keeps Vercel without auto-commit");

const gate = read("lib/require-operator-session.ts");
assert.match(gate, /from "@\/auth"/, "005: reuse existing auth()");
assert.match(gate, /status: 401/, "005: unauthenticated callers get 401");
assert.doesNotMatch(gate, /DEMO_SHELL_OPEN/, "005: DEMO_SHELL_OPEN is not production auth");

for (const rel of [
  "app/api/generate/invoice/route.ts",
  "app/api/generate/bol/route.ts",
  "app/api/generate/pod/route.ts",
  "app/api/generate/settlement/route.ts",
  "app/api/generate/claims/route.ts",
  "app/api/places/autocomplete/route.ts",
  "app/api/places/details/route.ts",
  "app/api/fuel/tomtom/route.ts",
  "app/api/load-intake/extract/route.ts",
  "app/api/load-process-intelligence/discovery/route.ts",
  "app/api/load-process-intelligence/[loadId]/route.ts",
]) {
  const src = read(rel);
  assert.match(src, /operatorUnauthorizedResponse/, `005: ${rel} must gate with existing session`);
}

const tomtom = read("app/api/fuel/tomtom/route.ts");
assert.doesNotMatch(tomtom, /hasTomTom/, "013: TomTom missing-key payload must not dump env presence");

const fallback = read("components/loads/RuntimeLoadDetailFallback.tsx");
assert.doesNotMatch(fallback, /Peachtree Foods/, "017: fallback must not invent Peachtree Foods");
assert.doesNotMatch(fallback, /T-102/, "017: fallback must not invent T-102");
assert.doesNotMatch(fallback, /SEAL-83921/, "017: fallback must not invent seals");

const loads = read("components/loads/LoadsPageClient.tsx");
assert.doesNotMatch(loads, /\|\| "T-102"/, "017: loads roster must not default truck to T-102");
assert.doesNotMatch(loads, /Peachtree Foods/, "017: loads roster must not default customer to Peachtree");

const header = read("components/BofHeader.tsx");
assert.match(header, /session not established/, "025: unauthenticated nav label must not claim authenticated");
assert.match(header, /\/api\/auth\/session/, "025: label binds to existing session helper");

const safety = read("components/safety-v4/SafetyDashboardV4.tsx");
assert.match(safety, /REFERENCE \/ DEMO/, "011: telematics heading must be REFERENCE/DEMO in the primary viewport");
assert.doesNotMatch(safety, /Last check: 45 seconds ago/, "011: must not present fake live poll timing");
assert.doesNotMatch(safety, /Connected \(demo\)/, "011: must not look live-connected");

assert.equal(maintenanceEquipmentClassLabel("T-102", "Equipment"), "Tractor");
assert.equal(maintenanceEquipmentClassLabel("TRL-2559", "Equipment"), "Trailer");

const assetDetail = read("components/maintenance/MaintenanceAssetDetailClient.tsx");
assert.match(assetDetail, /maintenanceEquipmentClassLabel/, "009: T-102 class must use canonical notes, not Trailer fallback");

const dispatchV2 = read("app/(bof)/dispatch-v2/page.tsx");
assert.match(dispatchV2, /REFERENCE \/ DEMO/, "021: dispatch-v2 must be labeled preview");
const settlementsV2 = read("app/(bof)/settlements-v2/page.tsx");
assert.match(settlementsV2, /REFERENCE \/ DEMO/, "021: settlements-v2 must be labeled preview");

const routeMap = read("docs/BOF_ROUTE_MAP.md");
assert.match(routeMap, /\/portals\/customer/, "022: route map lists customer portal");
assert.match(routeMap, /\/dispatch-v2/, "022: route map lists dispatch-v2");
assert.match(routeMap, /\/customer-portal/, "022: route map lists customer-portal");

console.log("PROMPT_013_SOURCE_CHECKS_OK");
