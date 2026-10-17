import { DEFAULT_ROAD_SPEED_MPH } from "@/lib/fleet-visibility/constants";
import { haversineDistanceMiles } from "@/lib/fleet-visibility/geo";
import type { DeliveryRiskInput, DeliveryRiskResult } from "@/lib/fleet-visibility/types";

export function assessDeliveryProgress(input: DeliveryRiskInput): DeliveryRiskResult {
  if (input.locationMissing) {
    return {
      progressStatus: "LOCATION_UNAVAILABLE",
      distanceToDeliveryMiles: null,
      estimatedArrivalAt: null,
      etaConfidenceNote: "No GPS observation is associated with this load or equipment.",
    };
  }
  if (input.locationStale) {
    return {
      progressStatus: "LOCATION_STALE",
      distanceToDeliveryMiles: null,
      estimatedArrivalAt: null,
      etaConfidenceNote: "The latest GPS observation is stale; ETA is not computed from stale coordinates.",
    };
  }
  if (!input.deliveryStop) {
    return {
      progressStatus: "ON_SCHEDULE",
      distanceToDeliveryMiles: null,
      estimatedArrivalAt: null,
      etaConfidenceNote: "Delivery coordinates are not recorded for this load; distance and ETA are unavailable.",
    };
  }

  const distanceMiles = haversineDistanceMiles(
    input.latitude,
    input.longitude,
    input.deliveryStop.latitude,
    input.deliveryStop.longitude,
  );

  if (distanceMiles <= 0.25) {
    return {
      progressStatus: "ARRIVED_AT_DESTINATION",
      distanceToDeliveryMiles: distanceMiles,
      estimatedArrivalAt: input.observedAt,
      etaConfidenceNote: "Vehicle is within ~0.25 mi of the recorded delivery coordinate. GPS arrival is not proof of delivery.",
    };
  }

  const speed = input.averageSpeedMph && input.averageSpeedMph > 5 ? input.averageSpeedMph : DEFAULT_ROAD_SPEED_MPH;
  const hours = distanceMiles / speed;
  const estimatedArrivalAt = new Date(input.observedAt.getTime() + hours * 3_600_000);
  const etaConfidenceNote = `ETA uses straight-line distance (${distanceMiles.toFixed(1)} mi) at ${speed} mph average. Traffic, HOS, and route geometry are not included.`;

  if (input.deliveryWindowEnd) {
    if (estimatedArrivalAt.getTime() > input.deliveryWindowEnd.getTime()) {
      const missedByMin = Math.round((estimatedArrivalAt.getTime() - input.deliveryWindowEnd.getTime()) / 60_000);
      if (missedByMin > 30) {
        return {
          progressStatus: "APPOINTMENT_MISSED",
          distanceToDeliveryMiles: distanceMiles,
          estimatedArrivalAt,
          etaConfidenceNote: `${etaConfidenceNote} Projected arrival is after the delivery appointment window.`,
        };
      }
      return {
        progressStatus: "DELIVERY_AT_RISK",
        distanceToDeliveryMiles: distanceMiles,
        estimatedArrivalAt,
        etaConfidenceNote: `${etaConfidenceNote} Projected arrival exceeds the scheduled delivery window.`,
      };
    }
    const bufferMs = input.deliveryWindowEnd.getTime() - estimatedArrivalAt.getTime();
    if (bufferMs < 30 * 60 * 1000) {
      return {
        progressStatus: "POTENTIALLY_DELAYED",
        distanceToDeliveryMiles: distanceMiles,
        estimatedArrivalAt,
        etaConfidenceNote: `${etaConfidenceNote} Arrival is within 30 minutes of the appointment window.`,
      };
    }
  }

  return {
    progressStatus: "ON_SCHEDULE",
    distanceToDeliveryMiles: distanceMiles,
    estimatedArrivalAt,
    etaConfidenceNote,
  };
}
