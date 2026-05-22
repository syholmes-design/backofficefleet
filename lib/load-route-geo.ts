/**
 * Approximate city centers for demo loads (no geocoder API).
 * Keys must match `loads[].origin` / `loads[].destination` strings in demo-data.
 */
export const BOF_DEMO_CITY_COORDS: Record<string, [number, number]> = {
  "Cleveland, OH": [41.4993, -81.6944],
  "Chicago, IL": [41.8781, -87.6298],
  "Akron, OH": [41.0814, -81.519],
  "Detroit, MI": [42.3314, -83.0458],
  "Columbus, OH": [39.9612, -82.9988],
  "Indianapolis, IN": [39.7684, -86.1581],
  "Cincinnati, OH": [39.1031, -84.512],
  "Louisville, KY": [38.2527, -85.7585],
  "Toledo, OH": [41.6528, -83.5379],
  "Pittsburgh, PA": [40.4406, -79.9959],
  "Dayton, OH": [39.7589, -84.1916],
  "Lexington, KY": [38.0406, -84.5037],
  "Canton, OH": [40.7989, -81.3784],
  "Youngstown, OH": [41.0998, -80.6495],
  "Sandusky, OH": [41.4489, -82.708],
  "Mansfield, OH": [40.7584, -82.5154],
  "Springfield, OH": [39.9242, -83.8088],
  "Buffalo, NY": [42.8864, -78.8784],
};

const FALLBACK: [number, number] = [40.4173, -82.9061];

export function coordsForCity(label: string): [number, number] {
  const hit = BOF_DEMO_CITY_COORDS[label.trim()];
  if (hit) return hit;
  const city = label.split(",")[0]?.trim().toLowerCase() ?? "";
  const entry = Object.entries(BOF_DEMO_CITY_COORDS).find(([k]) =>
    k.toLowerCase().startsWith(city)
  );
  return entry ? entry[1] : FALLBACK;
}

export function coordsForLoadRoute(
  origin: string,
  destination: string
): { origin: [number, number]; destination: [number, number] } {
  return {
    origin: coordsForCity(origin),
    destination: coordsForCity(destination),
  };
}

/** Tiny offset so stacked markers (e.g. pickup + current) remain visible. */
export function jitterLatLng(
  lat: number,
  lng: number,
  salt: string
): [number, number] {
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h << 5) - h + salt.charCodeAt(i);
  const dx = ((Math.abs(h) % 19) - 9) * 0.00035;
  const dy = ((Math.abs(h >> 5) % 19) - 9) * 0.00035;
  return [lat + dx, lng + dy];
}

export function interpolateAlongRoute(
  from: [number, number],
  to: [number, number],
  t: number
): [number, number] {
  const u = Math.min(1, Math.max(0, t));
  return [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u];
}
