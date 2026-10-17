import assert from "node:assert/strict";
import test from "node:test";

import { evaluateCarrierProfile } from "@/lib/services/fmcsa/carrierMonitoring";
import { fetchOpenDataCarrierProfiles } from "@/lib/services/fmcsa/openData/carrierSync";
import { FMCSA_DATASETS } from "@/lib/services/fmcsa/openData/datasets";
import { SodaClient, usdotInClause } from "@/lib/services/fmcsa/openData/sodaClient";

type Captured = { url: string; headers: Record<string, string> };

function mockFetch(byDataset: Record<string, unknown[] | number>, captured: Captured[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    captured.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    const id = /resource\/([a-z0-9-]+)\.json/.exec(url)?.[1] ?? "";
    const body = byDataset[id];
    if (typeof body === "number") return new Response("", { status: body });
    return new Response(JSON.stringify(body ?? []), { status: 200 });
  }) as typeof fetch;
}

test("IN clause keeps digits only, so input cannot inject SoQL", () => {
  assert.equal(usdotInClause("dot_number", ["123", "DOT 456", "1') or (1=1"]), "dot_number in ('123', '456', '111')");
  assert.equal(usdotInClause("dot_number", ["123"], false), "dot_number in (123)");
  assert.equal(usdotInClause("dot_number", ["abc"]), null);
  assert.throws(() => usdotInClause("dot_number; drop", ["1"]));
});

test("app token goes in a header and never in the URL", async () => {
  const captured: Captured[] = [];
  const client = new SodaClient("secret-app-token", mockFetch({}, captured));
  await client.query("az4n-8mr2", { where: "dot_number in ('1')" });
  assert.equal(captured[0].headers["X-App-Token"], "secret-app-token");
  assert.equal(captured[0].url.includes("secret-app-token"), false);
});

test("profiles merge census, Motus and OOS rows and drive monitoring alerts", async () => {
  const client = new SodaClient(
    null,
    mockFetch({
      [FMCSA_DATASETS.COMPANY_CENSUS.id]: [
        { dot_number: "1234567", legal_name: "Example Freight LLC", status_code: "A", power_units: "10", total_drivers: "12", mcs150_date: "20240101" },
      ],
      [FMCSA_DATASETS.MOTUS_CARRIER.id]: [
        { usdot_number: "1234567", common_stat: "A", bipd_req: "750000", bipd_file: "0" },
      ],
      [FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS.id]: [
        { dot_number: "1234567", oos_date: "2026-09-30T00:00:00.000", oos_reason: "New Entrant", status: "ACTIVE" },
        { dot_number: "1234567", oos_date: "2022-01-01T00:00:00.000", status: "RESCINDED" },
      ],
    }),
  );
  const result = await fetchOpenDataCarrierProfiles(client, ["USDOT 1234567", "7654321"]);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.missing, ["7654321"]);
  const [profile] = result.profiles;
  assert.equal(profile.legalName, "Example Freight LLC");
  assert.equal(profile.outOfServiceDate, "2026-09-30");
  assert.equal(profile.allowedToOperate, false);
  assert.equal(profile.mcs150Date, "2024-01-01");
  const codes = evaluateCarrierProfile(profile, new Date("2026-10-17T00:00:00Z")).map((row) => row.code).sort();
  assert.deepEqual(codes, ["BIPD_INSURANCE_BELOW_REQUIRED", "MCS150_OUTDATED", "NOT_ALLOWED_TO_OPERATE", "OUT_OF_SERVICE_ORDER"]);
  assert.ok(result.observedColumns[FMCSA_DATASETS.MOTUS_CARRIER.id].includes("bipd_file"));
});

test("an unknown USDOT column falls back to the next alias; outages are reported, not hidden", async () => {
  const calls: Captured[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(String(input)).pathname + " " + (new URL(String(input)).searchParams.get("$where") ?? "");
    calls.push({ url, headers: {} });
    if (url.includes("inys-ebih") && url.includes("usdot_number in")) return new Response("", { status: 400 });
    if (url.includes("p2mt-9ige")) return new Response("", { status: 503 });
    return new Response(JSON.stringify([{ dot_number: "1", legal_name: "A" }]), { status: 200 });
  }) as typeof fetch;
  const result = await fetchOpenDataCarrierProfiles(new SodaClient(null, fetchImpl), ["1"]);
  assert.ok(calls.some((call) => call.url.includes("inys-ebih") && call.url.includes("dot_number in")));
  assert.deepEqual(result.errors.map((error) => error.errorCode), ["HTTP_503"]);
  assert.equal(result.profiles[0].outOfServiceDate, null);
  assert.equal(result.profiles[0].allowedToOperate, null);
});
