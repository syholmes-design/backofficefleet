import type { DeliveryProgressStatus, LocationObservationKind, LoadStopKind, TelematicsProvider } from "@prisma/client";

export type NormalizedLocationInput = {
  fleetId: string;
  provider: TelematicsProvider;
  providerDeviceId: string;
  latitude: number;
  longitude: number;
  observedAt: Date;
  observationKind?: LocationObservationKind;
  movementStatus?: string | null;
  speedMph?: number | null;
  headingDegrees?: number | null;
  accuracyMeters?: number | null;
  sourceReliability?: string | null;
  idempotencyKey: string;
  equipmentId?: string | null;
  driverId?: string | null;
  loadId?: string | null;
};

export type GeofenceEventKind =
  | "GEOFENCE_PICKUP_APPROACHING"
  | "GEOFENCE_PICKUP_ARRIVED"
  | "GEOFENCE_PICKUP_DEPARTED"
  | "GEOFENCE_DELIVERY_APPROACHING"
  | "GEOFENCE_DELIVERY_ARRIVED"
  | "GEOFENCE_DELIVERY_DEPARTED";

export type StopCoordinate = {
  stopKind: LoadStopKind;
  latitude: number;
  longitude: number;
  geocodeLabel?: string | null;
};

export type DeliveryRiskInput = {
  observedAt: Date;
  latitude: number;
  longitude: number;
  deliveryStop?: StopCoordinate | null;
  deliveryWindowEnd?: Date | null;
  averageSpeedMph?: number | null;
  locationStale: boolean;
  locationMissing: boolean;
};

export type DeliveryRiskResult = {
  progressStatus: DeliveryProgressStatus;
  distanceToDeliveryMiles: number | null;
  estimatedArrivalAt: Date | null;
  etaConfidenceNote: string;
};

export type FleetMapVehiclePin = {
  equipmentId: string;
  unitNumber: string;
  equipmentType: string;
  fleetId: string;
  latitude: number | null;
  longitude: number | null;
  observedAt: string | null;
  locationLabel: "LIVE" | "LAST_KNOWN" | "STALE" | "UNAVAILABLE" | "SYNTHETIC_TEST";
  provider: TelematicsProvider | null;
  activeLoadId: string | null;
  activeLoadReference: string | null;
  driverId: string | null;
  progressStatus: DeliveryProgressStatus | null;
  staleWarning: string | null;
};

export type FleetMapLoadOverlay = {
  loadId: string;
  referenceNumber: string | null;
  origin: string;
  destination: string;
  progressStatus: DeliveryProgressStatus | null;
  pickup: StopCoordinate | null;
  delivery: StopCoordinate | null;
  equipmentId: string | null;
};
