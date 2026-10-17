/** Location older than this is treated as stale for operational answers and map labeling. */
export const LOCATION_STALE_MS = 45 * 60 * 1000;

/** Geofence radii (meters). Arrival uses a tighter threshold than approach. */
export const GEOFENCE_ARRIVAL_RADIUS_M = 250;
export const GEFENCE_APPROACH_RADIUS_M = 5_000;

export const DEFAULT_ROAD_SPEED_MPH = 55;
