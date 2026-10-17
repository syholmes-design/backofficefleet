import { GEFENCE_APPROACH_RADIUS_M, GEOFENCE_ARRIVAL_RADIUS_M } from "@/lib/fleet-visibility/constants";
import { isWithinRadiusMeters } from "@/lib/fleet-visibility/geo";
import type { GeofenceEventKind, StopCoordinate } from "@/lib/fleet-visibility/types";

export type GeofenceEvaluation = {
  events: GeofenceEventKind[];
  insidePickup: boolean;
  insideDelivery: boolean;
  nearPickup: boolean;
  nearDelivery: boolean;
};

export function evaluateGeofenceTransitions(input: {
  latitude: number;
  longitude: number;
  pickup?: StopCoordinate | null;
  delivery?: StopCoordinate | null;
  previouslyInsidePickup: boolean;
  previouslyInsideDelivery: boolean;
}): GeofenceEvaluation {
  const insidePickup = input.pickup
    ? isWithinRadiusMeters(input.latitude, input.longitude, input.pickup.latitude, input.pickup.longitude, GEOFENCE_ARRIVAL_RADIUS_M)
    : false;
  const insideDelivery = input.delivery
    ? isWithinRadiusMeters(input.latitude, input.longitude, input.delivery.latitude, input.delivery.longitude, GEOFENCE_ARRIVAL_RADIUS_M)
    : false;
  const nearPickup = input.pickup
    ? isWithinRadiusMeters(input.latitude, input.longitude, input.pickup.latitude, input.pickup.longitude, GEFENCE_APPROACH_RADIUS_M)
    : false;
  const nearDelivery = input.delivery
    ? isWithinRadiusMeters(input.latitude, input.longitude, input.delivery.latitude, input.delivery.longitude, GEFENCE_APPROACH_RADIUS_M)
    : false;

  const events: GeofenceEventKind[] = [];

  if (input.pickup) {
    if (!input.previouslyInsidePickup && nearPickup && !insidePickup) {
      events.push("GEOFENCE_PICKUP_APPROACHING");
    }
    if (!input.previouslyInsidePickup && insidePickup) {
      events.push("GEOFENCE_PICKUP_ARRIVED");
    }
    if (input.previouslyInsidePickup && !insidePickup) {
      events.push("GEOFENCE_PICKUP_DEPARTED");
    }
  }

  if (input.delivery) {
    if (!input.previouslyInsideDelivery && nearDelivery && !insideDelivery) {
      events.push("GEOFENCE_DELIVERY_APPROACHING");
    }
    if (!input.previouslyInsideDelivery && insideDelivery) {
      events.push("GEOFENCE_DELIVERY_ARRIVED");
    }
    if (input.previouslyInsideDelivery && !insideDelivery) {
      events.push("GEOFENCE_DELIVERY_DEPARTED");
    }
  }

  return { events, insidePickup, insideDelivery, nearPickup, nearDelivery };
}
