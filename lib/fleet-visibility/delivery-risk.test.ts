import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessDeliveryProgress } from "@/lib/fleet-visibility/delivery-risk";

describe("assessDeliveryProgress", () => {
  const deliveryStop = { stopKind: "DELIVERY" as const, latitude: 35.0, longitude: -90.0 };
  const observedAt = new Date("2026-10-17T18:00:00.000Z");

  it("returns LOCATION_UNAVAILABLE when GPS is missing", () => {
    const result = assessDeliveryProgress({
      observedAt,
      latitude: 0,
      longitude: 0,
      deliveryStop,
      locationMissing: true,
      locationStale: false,
    });
    assert.equal(result.progressStatus, "LOCATION_UNAVAILABLE");
  });

  it("flags DELIVERY_AT_RISK when straight-line ETA exceeds appointment window", () => {
    const result = assessDeliveryProgress({
      observedAt,
      latitude: 41.0,
      longitude: -87.0,
      deliveryStop,
      deliveryWindowEnd: new Date("2026-10-17T19:00:00.000Z"),
      averageSpeedMph: 55,
      locationMissing: false,
      locationStale: false,
    });
    assert.ok(["DELIVERY_AT_RISK", "APPOINTMENT_MISSED"].includes(result.progressStatus));
    assert.ok(result.estimatedArrivalAt);
  });

  it("marks ARRIVED_AT_DESTINATION near delivery coordinate", () => {
    const result = assessDeliveryProgress({
      observedAt,
      latitude: 35.0001,
      longitude: -90.0001,
      deliveryStop,
      locationMissing: false,
      locationStale: false,
    });
    assert.equal(result.progressStatus, "ARRIVED_AT_DESTINATION");
  });
});
