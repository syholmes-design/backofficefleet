import type { TelematicsProvider } from "@prisma/client";
import type { NormalizedLocationInput } from "@/lib/fleet-visibility/types";

export type ProviderPayload = Record<string, unknown>;

function requireNumber(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}`);
  return n;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid ${field}`);
  return value.trim();
}

export function normalizeGenericWebhookObservation(
  fleetId: string,
  body: ProviderPayload,
): NormalizedLocationInput {
  return {
    fleetId,
    provider: (body.provider as TelematicsProvider) ?? "GENERIC_WEBHOOK",
    providerDeviceId: requireString(body.providerDeviceId ?? body.deviceId, "providerDeviceId"),
    latitude: requireNumber(body.latitude ?? body.lat, "latitude"),
    longitude: requireNumber(body.longitude ?? body.lng ?? body.lon, "longitude"),
    observedAt: new Date(requireString(body.observedAt ?? body.timestamp, "observedAt")),
    movementStatus: typeof body.movementStatus === "string" ? body.movementStatus : null,
    speedMph: body.speedMph != null ? requireNumber(body.speedMph, "speedMph") : null,
    headingDegrees: body.headingDegrees != null ? requireNumber(body.headingDegrees, "headingDegrees") : null,
    accuracyMeters: body.accuracyMeters != null ? requireNumber(body.accuracyMeters, "accuracyMeters") : null,
    sourceReliability: typeof body.sourceReliability === "string" ? body.sourceReliability : "GENERIC_WEBHOOK",
    idempotencyKey: requireString(body.idempotencyKey ?? body.eventId, "idempotencyKey"),
    equipmentId: typeof body.equipmentId === "string" ? body.equipmentId : null,
    driverId: typeof body.driverId === "string" ? body.driverId : null,
    loadId: typeof body.loadId === "string" ? body.loadId : null,
    observationKind: body.observationKind === "SYNTHETIC_TEST" ? "SYNTHETIC_TEST" : "LIVE",
  };
}

/** Samsara vehicle stats snapshot (subset). */
export function normalizeSamsaraObservation(fleetId: string, body: ProviderPayload): NormalizedLocationInput {
  const gps = (body.gps as ProviderPayload) ?? body;
  return {
    fleetId,
    provider: "SAMSARA",
    providerDeviceId: requireString(body.vehicleId ?? body.id, "vehicleId"),
    latitude: requireNumber(gps.latitude, "latitude"),
    longitude: requireNumber(gps.longitude, "longitude"),
    observedAt: new Date(requireString(gps.time ?? body.time, "observedAt")),
    speedMph: gps.speedMilesPerHour != null ? requireNumber(gps.speedMilesPerHour, "speedMph") : null,
    headingDegrees: gps.headingDegrees != null ? requireNumber(gps.headingDegrees, "headingDegrees") : null,
    idempotencyKey: requireString(body.idempotencyKey ?? `${body.vehicleId}-${gps.time}`, "idempotencyKey"),
    sourceReliability: "SAMSARA_API",
    observationKind: "LIVE",
  };
}

export function normalizeMotiveObservation(fleetId: string, body: ProviderPayload): NormalizedLocationInput {
  const loc = (body.location as ProviderPayload) ?? body;
  return {
    fleetId,
    provider: "MOTIVE",
    providerDeviceId: requireString(body.vehicle_id ?? body.vehicleId, "vehicle_id"),
    latitude: requireNumber(loc.lat ?? loc.latitude, "latitude"),
    longitude: requireNumber(loc.lon ?? loc.longitude, "longitude"),
    observedAt: new Date(requireString(loc.located_at ?? body.located_at, "observedAt")),
    speedMph: loc.speed != null ? requireNumber(loc.speed, "speedMph") : null,
    idempotencyKey: requireString(body.idempotencyKey ?? `${body.vehicle_id}-${loc.located_at}`, "idempotencyKey"),
    sourceReliability: "MOTIVE_API",
    observationKind: "LIVE",
  };
}

export function normalizeGeotabObservation(fleetId: string, body: ProviderPayload): NormalizedLocationInput {
  return {
    fleetId,
    provider: "GEOTAB",
    providerDeviceId: requireString(
      body.deviceId ?? (typeof (body.device as ProviderPayload | undefined)?.id === "string" ? (body.device as ProviderPayload).id : undefined),
      "deviceId",
    ),
    latitude: requireNumber(body.latitude, "latitude"),
    longitude: requireNumber(body.longitude, "longitude"),
    observedAt: new Date(requireString(body.dateTime ?? body.timestamp, "observedAt")),
    speedMph: body.speed != null ? requireNumber(body.speed, "speedMph") : null,
    idempotencyKey: requireString(body.idempotencyKey ?? `${body.deviceId}-${body.dateTime}`, "idempotencyKey"),
    sourceReliability: "GEOTAB_API",
    observationKind: "LIVE",
  };
}

export function normalizeProviderObservation(
  fleetId: string,
  provider: TelematicsProvider,
  body: ProviderPayload,
): NormalizedLocationInput {
  switch (provider) {
    case "SAMSARA":
      return normalizeSamsaraObservation(fleetId, body);
    case "MOTIVE":
      return normalizeMotiveObservation(fleetId, body);
    case "GEOTAB":
      return normalizeGeotabObservation(fleetId, body);
    default:
      return normalizeGenericWebhookObservation(fleetId, { ...body, provider });
  }
}
