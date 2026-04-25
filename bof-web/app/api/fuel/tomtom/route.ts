import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import { buildTomTomDieselFeedForLoad, CACHE_SECONDS } from "@/lib/server/tomtom-fuel";
import { getTomTomApiKey } from "@/lib/server/tomtom-env";
import type { TomTomFuelFeedResponse } from "@/lib/tomtom-fuel-types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId")?.trim();
  if (!loadId) {
    return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
  }

  const key = getTomTomApiKey();
  if (!key) {
    const envDebug = {
      hasTomTom: !!process.env.TOMTOM_API_KEY,
      hasTomTomMaps: !!process.env.TOMTOM_MAPS_API_KEY,
      hasTT: !!process.env.TT_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    };
    
    const noKey: TomTomFuelFeedResponse = {
      live: false,
      reason: `No TomTom key configured. Expected TOMTOM_API_KEY. Debug: ${JSON.stringify(envDebug)}`,
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
      note: "Server-only secret. Primary: TOMTOM_API_KEY. TomTom Search + fuelPrice are never called from the browser.",
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

