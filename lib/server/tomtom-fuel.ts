import type { BofData } from "@/lib/load-bof-data";
import { coordsForLoadRoute, interpolateAlongRoute } from "@/lib/load-route-geo";
import { estimateDemoTripGallons } from "@/lib/diesel-route-insight";
import type {
  TomTomFuelFeedResponse,
  TomTomFuelRouteContext,
  TomTomFuelStationNormalized,
  TomTomFuelSummary,
} from "@/lib/tomtom-fuel-types";

const TOMTOM_SEARCH_BASE = "https://api.tomtom.com/search/2";
const FUEL_STATION_CATEGORY_SET = "7311";
const RADIUS_MILES = 50;
const RADIUS_METERS = Math.round(RADIUS_MILES * 1609.34);
const CACHE_SECONDS = 300;

const BOF_NETWORK_KEYWORDS = [
  "pilot",
  "flying j",
  "loves",
  "love's",
  "ta ",
  "travelcenters of america",
  "petro",
  "sapp bros",
];

type SearchResultRow = {
  id?: string;
  dist?: number;
  poi?: { name?: string };
  address?: {
    freeformAddress?: string;
    municipality?: string;
    countrySubdivision?: string;
  };
  position?: { lat?: number; lon?: number };
  dataSources?: unknown;
};

function parseFuelPriceId(row: SearchResultRow): string | null {
  const ds = row.dataSources as
    | {
        fuelPrice?: unknown;
        fuel?: { fuelPrice?: unknown; id?: unknown };
      }
    | undefined;
  const candidates = [
    ds?.fuelPrice,
    ds?.fuel?.fuelPrice,
    ds?.fuel?.id,
    (row as { fuelPrice?: unknown }).fuelPrice,
    (row.poi as { fuelPrice?: unknown } | undefined)?.fuelPrice,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
    if (Array.isArray(c)) {
      const hit = c.find((x) => typeof x === "string" && x.trim().length > 0);
      if (typeof hit === "string") return hit.trim();
    }
    if (c && typeof c === "object" && "id" in c) {
      const idVal = (c as { id?: unknown }).id;
      if (typeof idVal === "string" && idVal.trim().length > 0) return idVal.trim();
    }
  }
  return null;
}

function etaMinutesFromMiles(miles: number): number {
  const avgMph = 52;
  return Math.max(3, Math.round((miles / avgMph) * 60));
}

function isBofNetworkStop(name: string): boolean {
  const n = name.toLowerCase();
  return BOF_NETWORK_KEYWORDS.some((k) => n.includes(k));
}

function toPerGallon(value: number, volumeUnit: string | undefined): number {
  const v = volumeUnit?.toLowerCase() ?? "";
  if (v.includes("liter")) return value * 3.78541;
  return value;
}

async function fetchNearbyFuelStations(
  lat: number,
  lon: number,
  key: string
): Promise<SearchResultRow[]> {
  const url = `${TOMTOM_SEARCH_BASE}/nearbySearch/.json?lat=${lat}&lon=${lon}&radius=${RADIUS_METERS}&limit=12&categorySet=${FUEL_STATION_CATEGORY_SET}&key=${encodeURIComponent(
    key
  )}`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  if (!res.ok) {
    throw new Error(`TomTom nearbySearch failed (${res.status})`);
  }
  const body = (await res.json()) as { results?: SearchResultRow[] };
  return body.results ?? [];
}

async function fetchDieselPricePerGallon(
  fuelPriceId: string,
  key: string
): Promise<{ dieselPricePerGal: number; currency: string; sourceTimestamp?: string } | null> {
  const url = `${TOMTOM_SEARCH_BASE}/fuelPrice.json?key=${encodeURIComponent(
    key
  )}&fuelPrice=${encodeURIComponent(fuelPriceId)}`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    fuels?: Array<{
      type?: string;
      updatedAt?: string;
      price?: Array<{ value?: number; currency?: string; volumeUnit?: string }>;
    }>;
  };

  const diesel = (body.fuels ?? []).find((f) => (f.type ?? "").toLowerCase().includes("diesel"));
  const firstPrice = diesel?.price?.[0];
  if (!firstPrice || typeof firstPrice.value !== "number") return null;

  return {
    dieselPricePerGal: toPerGallon(firstPrice.value, firstPrice.volumeUnit),
    currency: firstPrice.currency ?? "USD",
    sourceTimestamp: diesel?.updatedAt,
  };
}

function routeContextForLoad(load: BofData["loads"][number]): TomTomFuelRouteContext {
  const coords = coordsForLoadRoute(load.origin, load.destination);
  const t = load.status === "En Route" ? 0.58 : load.status === "Delivered" ? 0.95 : 0.2;
  const center = interpolateAlongRoute(coords.origin, coords.destination, t);
  return {
    origin: load.origin,
    destination: load.destination,
    centerLat: center[0],
    centerLon: center[1],
    contextMode:
      load.status === "En Route"
        ? "en_route_radius"
        : load.status === "Delivered"
          ? "delivered_radius"
          : "origin_radius",
  };
}

function computeSummary(
  stations: TomTomFuelStationNormalized[],
  load: BofData["loads"][number]
): TomTomFuelSummary {
  if (!stations.length) {
    return { usedDemoBaseline: true };
  }
  const nearest = stations.reduce((a, b) => (a.distanceMiles <= b.distanceMiles ? a : b));
  const bofNearest = stations
    .filter((s) => s.isBofNetwork)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)[0];
  const cheapest = stations.reduce((a, b) => (a.dieselPricePerGal <= b.dieselPricePerGal ? a : b));
  const baselineAveragePerGal =
    Math.round((stations.reduce((sum, s) => sum + s.dieselPricePerGal, 0) / stations.length) * 1000) /
    1000;
  const bofAnchor = bofNearest ?? nearest;
  const savingsPerGalVsBaseline =
    Math.round((baselineAveragePerGal - bofAnchor.dieselPricePerGal) * 1000) / 1000;
  const estimatedTripGallons = estimateDemoTripGallons(load.id, load.revenue);
  const estimatedTripSavingsUsd = Math.round(
    Math.max(0, savingsPerGalVsBaseline) * estimatedTripGallons
  );
  return {
    nearestStationId: nearest.stationId,
    bofNearestStationId: bofNearest?.stationId,
    cheapestStationId: cheapest.stationId,
    recommendedStationId: stations.find((s) => s.recommended)?.stationId,
    baselineAveragePerGal,
    savingsPerGalVsBaseline,
    estimatedTripGallons,
    estimatedTripSavingsUsd,
    usedDemoBaseline: true,
  };
}

export async function buildTomTomDieselFeedForLoad(
  data: BofData,
  loadId: string,
  apiKey: string
): Promise<TomTomFuelFeedResponse> {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) {
    throw new Error(`Load ${loadId} not found`);
  }
  const routeContext = routeContextForLoad(load);
  const searchRows = await fetchNearbyFuelStations(routeContext.centerLat, routeContext.centerLon, apiKey);

  const rowsWithIds = searchRows
    .map((r) => ({ row: r, fuelPriceId: parseFuelPriceId(r) }))
    .filter((x): x is { row: SearchResultRow; fuelPriceId: string } => Boolean(x.fuelPriceId));

  const uniqueFuelPriceIds = Array.from(new Set(rowsWithIds.map((x) => x.fuelPriceId)));

  const pricedById = await Promise.all(
    uniqueFuelPriceIds.map(async (fuelPriceId) => ({
      fuelPriceId,
      price: await fetchDieselPricePerGallon(fuelPriceId, apiKey),
    }))
  );
  const priceMap = new Map(
    pricedById
      .filter((x): x is { fuelPriceId: string; price: NonNullable<typeof x.price> } => Boolean(x.price))
      .map((x) => [x.fuelPriceId, x.price])
  );

  const rawStations = rowsWithIds
    .map(({ row, fuelPriceId }) => {
      const p = priceMap.get(fuelPriceId);
      if (!p) return null;
      const distanceMiles = Number(((row.dist ?? 0) / 1609.34).toFixed(1));
      const name = row.poi?.name ?? row.address?.freeformAddress ?? "Fuel station";
      return {
        stationId: row.id ?? fuelPriceId,
        fuelPriceId,
        name,
        address: row.address?.freeformAddress,
        city: row.address?.municipality,
        state: row.address?.countrySubdivision,
        latitude: row.position?.lat,
        longitude: row.position?.lon,
        distanceMiles,
        etaMinutes: etaMinutesFromMiles(distanceMiles),
        dieselPricePerGal: Number(p.dieselPricePerGal.toFixed(3)),
        currency: p.currency,
        fuelType: "diesel" as const,
        sourceTimestamp: p.sourceTimestamp,
        isBofNetwork: isBofNetworkStop(name),
      };
    })
    .filter((x): x is Exclude<typeof x, null> => x !== null)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  if (!rawStations.length) {
    return {
      live: false,
      reason:
        uniqueFuelPriceIds.length > 0
          ? "TomTom fuelPrice lookup returned no diesel prices for nearby stations"
          : "TomTom Search returned no usable fuelPrice IDs",
      loadId,
      fuelPriceIds: uniqueFuelPriceIds,
      routeContext,
      stations: [],
      summary: { usedDemoBaseline: true },
      note: "TomTom two-step lookup executed server-side with BOF fallback",
    };
  }

  const nearestId = rawStations[0]?.stationId;
  const cheapestPrice = Math.min(...rawStations.map((s) => s.dieselPricePerGal));
  const cheapestId = rawStations.find((s) => s.dieselPricePerGal === cheapestPrice)?.stationId;
  const bofNearest = rawStations.find((s) => s.isBofNetwork);
  const bofAnchor = bofNearest ?? rawStations[0]!;
  const cheapest = rawStations.find((s) => s.stationId === cheapestId) ?? rawStations[0]!;
  const bofCloseEnough = cheapest.dieselPricePerGal - bofAnchor.dieselPricePerGal >= -0.008;
  const recommendedId = (bofCloseEnough ? bofAnchor : cheapest).stationId;

  const stations: TomTomFuelStationNormalized[] = rawStations.map((s) => ({
    ...s,
    nearest: s.stationId === nearestId,
    cheapest: s.stationId === cheapestId,
    recommended: s.stationId === recommendedId,
  }));

  const summary = computeSummary(stations, load);

  return {
    live: true,
    loadId,
    fuelPriceIds: uniqueFuelPriceIds,
    routeContext,
    stations,
    summary,
    note: "Stations discovered via TomTom nearbySearch; diesel prices resolved via TomTom fuelPrice IDs",
  };
}

export { CACHE_SECONDS };

