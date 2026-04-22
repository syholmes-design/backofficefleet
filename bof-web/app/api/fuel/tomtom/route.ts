import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import { buildTomTomDieselFeedForLoad, CACHE_SECONDS } from "@/lib/server/tomtom-fuel";
import type { TomTomFuelFeedResponse } from "@/lib/tomtom-fuel-types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId")?.trim();
  if (!loadId) {
    return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
  }

  const key = process.env.TOMTOM_API_KEY;
  if (!key) {
    const noKey: TomTomFuelFeedResponse = {
      live: false,
      reason: "TOMTOM_API_KEY is not configured",
      loadId,
      fuelPriceIds: [],
      routeContext: {
        origin: "Unknown",
        destination: "Unknown",
        centerLat: 0,
        centerLon: 0,
        contextMode: "origin_radius",
      },
      stations: [],
      summary: { usedDemoBaseline: true },
      note: "TomTom key missing; BOF diesel widget should use demo fallback",
    };
    return NextResponse.json(noKey, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const data = getBofData();
  const hasLoad = data.loads.some((l) => l.id === loadId);
  if (!hasLoad) {
    return NextResponse.json({ error: `Load ${loadId} not found` }, { status: 404 });
  }

  try {
    const payload = await buildTomTomDieselFeedForLoad(data, loadId, key);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
      },
    });
  } catch (err) {
    const fallback: TomTomFuelFeedResponse = {
      live: false,
      reason: err instanceof Error ? err.message : "TomTom feed lookup failed",
      loadId,
      fuelPriceIds: [],
      routeContext: {
        origin: "Unknown",
        destination: "Unknown",
        centerLat: 0,
        centerLon: 0,
        contextMode: "origin_radius",
      },
      stations: [],
      summary: { usedDemoBaseline: true },
      note: "TomTom request failed; BOF diesel widget should continue with demo logic",
    };
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}

