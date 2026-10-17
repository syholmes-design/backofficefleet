import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateGeofenceTransitions } from "@/lib/fleet-visibility/geofence";

describe("evaluateGeofenceTransitions", () => {
  const pickup = { stopKind: "PICKUP" as const, latitude: 41.0, longitude: -87.0 };
  const delivery = { stopKind: "DELIVERY" as const, latitude: 35.0, longitude: -90.0 };

  it("emits pickup arrival once when entering the arrival radius", () => {
    const first = evaluateGeofenceTransitions({
      latitude: 41.0005,
      longitude: -87.0005,
      pickup,
      delivery: null,
      previouslyInsidePickup: false,
      previouslyInsideDelivery: false,
    });
    assert.ok(first.events.includes("GEOFENCE_PICKUP_ARRIVED"));
    assert.equal(first.insidePickup, true);

    const second = evaluateGeofenceTransitions({
      latitude: 41.0005,
      longitude: -87.0005,
      pickup,
      delivery: null,
      previouslyInsidePickup: true,
      previouslyInsideDelivery: false,
    });
    assert.equal(second.events.length, 0);
  });

  it("emits departure after leaving pickup geofence", () => {
    const result = evaluateGeofenceTransitions({
      latitude: 41.05,
      longitude: -87.05,
      pickup,
      delivery: null,
      previouslyInsidePickup: true,
      previouslyInsideDelivery: false,
    });
    assert.ok(result.events.includes("GEOFENCE_PICKUP_DEPARTED"));
  });

  it("does not duplicate delivery arrival on repeated inside readings", () => {
    const inside = evaluateGeofenceTransitions({
      latitude: 35.0002,
      longitude: -90.0002,
      pickup: null,
      delivery,
      previouslyInsidePickup: false,
      previouslyInsideDelivery: false,
    });
    assert.deepEqual(inside.events, ["GEOFENCE_DELIVERY_ARRIVED"]);

    const repeat = evaluateGeofenceTransitions({
      latitude: 35.0002,
      longitude: -90.0002,
      pickup: null,
      delivery,
      previouslyInsidePickup: false,
      previouslyInsideDelivery: true,
    });
    assert.equal(repeat.events.length, 0);
  });
});
