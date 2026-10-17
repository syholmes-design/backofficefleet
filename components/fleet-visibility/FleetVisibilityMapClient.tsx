"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/mapbox";
import type { FleetMapVehiclePin } from "@/lib/fleet-visibility/types";

type MapResponse = {
  fleetId: string;
  generatedAt: string;
  vehicles: FleetMapVehiclePin[];
  limitations: string[];
};

function pinColor(label: FleetMapVehiclePin["locationLabel"]): string {
  if (label === "LIVE") return "#22d3ee";
  if (label === "LAST_KNOWN") return "#94a3b8";
  if (label === "STALE") return "#f59e0b";
  if (label === "SYNTHETIC_TEST") return "#a78bfa";
  return "#475569";
}

export function FleetVisibilityMapClient({ fleetId }: { fleetId: string }) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef | null>(null);
  const [data, setData] = useState<MapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FleetMapVehiclePin | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fleet-visibility/map?fleetId=${encodeURIComponent(fleetId)}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as MapResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fleet map");
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mappable = useMemo(
    () => (data?.vehicles ?? []).filter((v) => v.latitude != null && v.longitude != null),
    [data],
  );

  useEffect(() => {
    if (!mapboxToken || !mapRef.current || mappable.length === 0) return;
    const lngs = mappable.map((v) => v.longitude as number);
    const lats = mappable.map((v) => v.latitude as number);
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 800, maxZoom: 8 },
    );
  }, [mappable, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-100">
        Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the unified fleet map.
      </div>
    );
  }

  return (
    <div className="flex h-[min(70vh,720px)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
        <p>
          <strong className="text-teal-400">Authoritative GPS layer</strong> — pins from persisted observations only.
          {data?.generatedAt ? ` Updated ${new Date(data.generatedAt).toLocaleString()}.` : null}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
        >
          Refresh
        </button>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading && !data ? <p className="text-sm text-slate-400">Loading fleet visibility…</p> : null}
      <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-lg border border-slate-800">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{ longitude: -96, latitude: 39, zoom: 3.5 }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          {mappable.map((vehicle) => (
            <Marker
              key={vehicle.equipmentId}
              longitude={vehicle.longitude as number}
              latitude={vehicle.latitude as number}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelected(vehicle);
              }}
            >
              <div
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-slate-900 text-[10px] font-bold text-slate-950"
                style={{ backgroundColor: pinColor(vehicle.locationLabel) }}
                title={vehicle.unitNumber}
              >
                {vehicle.unitNumber.replace(/^TR-?/i, "").slice(0, 3)}
              </div>
            </Marker>
          ))}
          {selected && selected.latitude != null && selected.longitude != null ? (
            <Popup
              longitude={selected.longitude}
              latitude={selected.latitude}
              onClose={() => setSelected(null)}
              closeButton
              closeOnClick={false}
              className="bof-map-popup-wrap"
            >
              <div className="text-sm text-slate-900">
                <p className="font-semibold">{selected.unitNumber}</p>
                <p>Location: {selected.locationLabel}</p>
                <p>{selected.observedAt ? `Observed ${selected.observedAt}` : "No timestamp"}</p>
                {selected.provider ? <p>Provider: {selected.provider}</p> : null}
                {selected.activeLoadReference ? <p>Load: {selected.activeLoadReference}</p> : null}
                {selected.progressStatus ? <p>Progress: {selected.progressStatus}</p> : null}
                {selected.staleWarning ? <p className="text-amber-800">{selected.staleWarning}</p> : null}
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {(data?.vehicles ?? []).map((v) => (
          <li key={v.equipmentId} className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-100">{v.unitNumber}</span> · {v.locationLabel}
            {v.latitude == null ? " — no coordinates (not fabricated)" : ` — ${v.latitude.toFixed(4)}, ${v.longitude?.toFixed(4)}`}
          </li>
        ))}
      </ul>
      {data?.limitations?.length ? (
        <p className="text-xs text-slate-500">{data.limitations.join(" ")}</p>
      ) : null}
    </div>
  );
}
