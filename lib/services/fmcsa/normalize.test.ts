import assert from "node:assert/strict";
import test from "node:test";

import { normalizeQcMobileCarrier, compareIdentifier, compareText } from "@/lib/services/fmcsa/normalize";
import { QcMobileFmcsaProvider } from "@/lib/services/fmcsa/qcmobileProvider";

test("normalize unwraps content.carrier and official element names", () => {
  const carrier = normalizeQcMobileCarrier({
    content: {
      carrier: {
        dotNumber: 2481936,
        legalName: "Delta Advanced Trucking, Inc.",
        dbaName: "Delta Advanced Trucking",
        mcNumber: 874201,
        allowToOperate: "Y",
        outOfService: "N",
      },
    },
  });
  assert.equal(carrier?.usdot, "2481936");
  assert.equal(carrier?.docketNumber, "874201");
  assert.equal(carrier?.allowToOperate, "Y");
});

test("normalize accepts allowedToOperate alias and ignores unknown keys", () => {
  const carrier = normalizeQcMobileCarrier({
    content: { carrier: { dotNumber: "1", legalName: "A", allowedToOperate: "N", inventedField: "nope" } },
  });
  assert.equal(carrier?.allowToOperate, "N");
  assert.equal("inventedField" in (carrier ?? {}), false);
});

test("malformed payload is not a carrier", () => {
  assert.equal(normalizeQcMobileCarrier({ foo: 1 }), null);
  assert.equal(normalizeQcMobileCarrier("nope"), null);
});

test("identifier compare uses digits only", () => {
  assert.equal(compareIdentifier("DOT-2481936", "2481936"), "MATCH");
  assert.equal(compareIdentifier("DOT-1", "2"), "MISMATCH");
  assert.equal(compareIdentifier("DOT-1", null), "UNAVAILABLE");
});

test("text compare is case-insensitive", () => {
  assert.equal(compareText("Delta Advanced Trucking, Inc.", "delta advanced trucking, inc."), "MATCH");
});

test("QCMobile HTTP mock 200 is LIVE provenance without inventing carrier fields", async () => {
  const provider = new QcMobileFmcsaProvider("test-key", async () => {
    return new Response(
      JSON.stringify({ content: { carrier: { dotNumber: 44110, legalName: "Greyhound" } } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  const outcome = await provider.lookup({ kind: "USDOT", value: "44110" });
  assert.equal(outcome.status, "FOUND");
  assert.equal(outcome.provenance, "LIVE");
  assert.equal(outcome.carrier?.legalName, "Greyhound");
  assert.equal(outcome.endpointUsed, "/carriers/44110");
});

test("QCMobile HTTP mock 404 is NOT_FOUND live, not VERIFIED", async () => {
  const provider = new QcMobileFmcsaProvider("test-key", async () => new Response("{}", { status: 404 }));
  const outcome = await provider.lookup({ kind: "USDOT", value: "0000000" });
  assert.equal(outcome.status, "NOT_FOUND");
  assert.equal(outcome.provenance, "LIVE");
  assert.equal(outcome.carrier, null);
});
