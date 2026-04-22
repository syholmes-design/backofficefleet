import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import { coordsForLoadRoute, interpolateAlongRoute } from "@/lib/load-route-geo";

type SearchResultRow = {
  id?: string;
  dist?: number;
  poi?: { name?: string };
  address?: { freeformAddress?: string };
  position?: { lat?: number; lon?: number };
  dataSources?: unknown;
};

type LiveFuelStop = {
  stationId: string;
  fuelPriceId: string;
  name: string;
  distanceMiles: number;
  etaMinutes: number;
  dieselPricePerGal: number;
  currency: string;
  updatedAt?: string;
  isBofNetwork: boolean;
};

const TOMTOM_SEARCH_BASE = "https://api.tomtom.com/search/2";
const FUEL_STATION_CATEGORY_SET = "7311";
const RADIUS_MILES = 50;
const RADIUS_METERS = Math.round(RADIUS_MILES * 1609.34);

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
  const url = `${TOMTOM_SEARCH_BASE}/nearbySearch/.json?lat=${lat}&lon=${lon}&radius=${RADIUS_METERS}&limit=8&categorySet=${FUEL_STATION_CATEGORY_SET}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`TomTom nearbySearch failed (${res.status})`);
  }
  const body = (await res.json()) as { results?: SearchResultRow[] };
  return body.results ?? [];
}

async function fetchDieselPricePerGallon(
  fuelPriceId: string,
  key: string
): Promise<{ dieselPricePerGal: number; currency: string; updatedAt?: string } | null> {
  const url = `${TOMTOM_SEARCH_BASE}/fuelPrice.json?key=${encodeURIComponent(key)}&fuelPrice=${encodeURIComponent(fuelPriceId)}`;
  const res = await fetch(url, { cache: "no-store" });
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
    updatedAt: diesel?.updatedAt,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId")?.trim();
  if (!loadId) {
    return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
  }

  const key = process.env.TOMTOM_API_KEY;
  if (!key) {
    return NextResponse.json({
      live: false,
      reason: "TOMTOM_API_KEY is not configured",
      fuelPriceIds: [],
      stops: [],
    });
  }

  const data = getBofData();
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) {
    return NextResponse.json({ error: `Load ${loadId} not found` }, { status: 404 });
  }

  const coords = coordsForLoadRoute(load.origin, load.destination);
  const t = load.status === "En Route" ? 0.58 : load.status === "Delivered" ? 0.95 : 0.2;
  const center = interpolateAlongRoute(coords.origin, coords.destination, t);
  const [lat, lon] = center;

  try {
    const searchRows = await fetchNearbyFuelStations(lat, lon, key);
    const rowsWithIds = searchRows
      .map((r) => ({ row: r, fuelPriceId: parseFuelPriceId(r) }))
      .filter((x): x is { row: SearchResultRow; fuelPriceId: string } => Boolean(x.fuelPriceId));

    const priced = await Promise.all(
      rowsWithIds.map(async ({ row, fuelPriceId }) => {
        const p = await fetchDieselPricePerGallon(fuelPriceId, key);
        if (!p) return null;
        const distanceMiles = Number(((row.dist ?? 0) / 1609.34).toFixed(1));
        const name = row.poi?.name ?? row.address?.freeformAddress ?? "Fuel station";
        return {
          stationId: row.id ?? fuelPriceId,
          fuelPriceId,
          name,
          distanceMiles,
          etaMinutes: etaMinutesFromMiles(distanceMiles),
          dieselPricePerGal: Number(p.dieselPricePerGal.toFixed(3)),
          currency: p.currency,
          updatedAt: p.updatedAt,
          isBofNetwork: isBofNetworkStop(name),
        } satisfies LiveFuelStop;
      })
    );

    const stops = priced.filter((x): x is LiveFuelStop => Boolean(x)).sort((a, b) => a.distanceMiles - b.distanceMiles);

    return NextResponse.json({
      live: stops.length > 0,
      reason: stops.length > 0 ? undefined : "TomTom returned no diesel prices for nearby stations",
      loadId,
      center: { lat, lon },
      fuelPriceIds: rowsWithIds.map((x) => x.fuelPriceId),
      stops,
      note: "Stations from TomTom nearbySearch with dataSources.fuelPrice IDs; diesel prices from TomTom fuelPrice endpoint.",
    });
  } catch (err) {
    return NextResponse.json({
      live: false,
      reason: err instanceof Error ? err.message : "TomTom fetch failed",
      fuelPriceIds: [],
      stops: [],
    });
  }
}

