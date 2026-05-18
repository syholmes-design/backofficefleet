"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import type { Load, LoadProofEvent, RouteStatus } from "@/types/dispatch";
import type { RouteIntelligence, DieselPricing, RestStopLocation, RfidEvent } from "@/lib/v3-operational-types";

type Mode = "all" | "selected";

type Props = {
  loads: Load[];
  selectedLoadId?: string;
  onSelectLoad?: (loadId: string) => void;
  mode?: Mode;
  compact?: boolean;
};

function routeColor(status: RouteStatus | undefined): string {
  if (status === "delivered") return "#14b8a6";
  if (status === "at_risk") return "#f59e0b";
  if (status === "delayed") return "#fb7185";
  if (status === "in_transit") return "#22d3ee";
  return "#64748b";
}

function statusLabel(status: RouteStatus | undefined): string {
  if (status === "in_transit") return "In Transit";
  if (status === "at_risk") return "At Risk";
  if (status === "delayed") return "Delayed";
  if (status === "delivered") return "Delivered";
  if (status === "dispatched") return "Dispatched";
  return "Scheduled";
}

function proofStatus(load: Load): string {
  if (load.proof_status === "Complete") return "Proof ready";
  if (load.proof_status === "Incomplete") return "Proof pending";
  return "Proof missing";
}

function popupHtml(load: Load, event?: LoadProofEvent, markerType?: string, markerData?: any): string {
  let detail = "";
  
  if (event) {
    detail = `<div class="bof-map-popup-line">Event: ${event.label}</div><div class="bof-map-popup-line">Status: ${event.status}</div>`;
  } else if (markerType === "fuel" && markerData) {
    detail = `<div class="bof-map-popup-line">Station: ${markerData.location}</div><div class="bof-map-popup-line">Price: $${markerData.dieselPrice}/gal</div><div class="bof-map-popup-line">Est. Gallons: ${markerData.estimatedGallons}</div><div class="bof-map-popup-line">Est. Cost: $${markerData.estimatedFuelCost.toFixed(2)}</div>`;
  } else if (markerType === "rest" && markerData) {
    detail = `<div class="bof-map-popup-line">Stop: ${markerData.location}</div><div class="bof-map-popup-line">Parking: ${markerData.parkingAvailable ? "Available" : "Unavailable"}</div><div class="bof-map-popup-line">Amenities: ${markerData.amenities.join(", ")}</div>`;
  } else if (markerType === "rfid" && markerData) {
    const positionNote = markerData.isApproximate ? `<div class="bof-map-popup-line text-amber-400">⚠️ Approximate position along route</div>` : '';
    detail = `<div class="bof-map-popup-line">Event: ${markerData.eventType}</div><div class="bof-map-popup-line">Status: ${markerData.scanStatus}</div><div class="bof-map-popup-line">Seal Match: ${markerData.sealMatchStatus}</div><div class="bof-map-popup-line">Location: ${markerData.scanLocation}</div>${positionNote}`;
  } else {
    detail = `<div class="bof-map-popup-line">ETA: ${load.eta ?? "—"}</div><div class="bof-map-popup-line">Current: ${load.currentLocationLabel ?? "—"}</div>`;
  }
  
  const docLink = event?.documentUrl
    ? `<a class="bof-map-popup-link" href="${event.documentUrl}" target="_blank" rel="noopener noreferrer">Open event document</a>`
    : "";
  const podLink = load.pod_url
    ? `<a class="bof-map-popup-link" href="${load.pod_url}" target="_blank" rel="noopener noreferrer">Open POD</a>`
    : "";
  const packetLink = `/loads/${load.load_id}`;
  
  const markerLabel = markerType 
    ? `<div class="bof-map-popup-line">Type: ${markerType.charAt(0).toUpperCase() + markerType.slice(1)} Marker</div>`
    : "";
  
  return `<div class="bof-map-popup"><div class="bof-map-popup-title">${load.load_id} · ${load.customer_name}</div><div class="bof-map-popup-line">Driver: ${load.driver_id ?? "Unassigned"}</div><div class="bof-map-popup-line">Status: ${statusLabel(load.routeStatus)}</div>${markerLabel}${detail}<div class="bof-map-popup-line">${proofStatus(load)}</div><div class="bof-map-popup-line">Settlement hold: ${load.settlement_hold ? "Yes" : "No"}</div>${podLink}${docLink}<a class="bof-map-popup-link" href="${packetLink}" target="_blank" rel="noopener noreferrer">Open Load Proof Packet</a></div>`;
}

function fallbackSvg(loads: Load[]) {
  const points = loads
    .flatMap((l) => [
      [l.pickupLat, l.pickupLng],
      [l.deliveryLat, l.deliveryLng],
      [l.currentLat, l.currentLng],
    ])
    .filter((x): x is [number, number] => Number.isFinite(x[0]) && Number.isFinite(x[1]));
  const minLat = Math.min(...points.map((p) => p[0]), 30);
  const maxLat = Math.max(...points.map((p) => p[0]), 50);
  const minLng = Math.min(...points.map((p) => p[1]), -95);
  const maxLng = Math.max(...points.map((p) => p[1]), -70);
  const toXY = (lat: number, lng: number) => {
    const x = ((lng - minLng) / Math.max(1e-6, maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / Math.max(1e-6, maxLat - minLat)) * 100;
    return { x, y };
  };
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full rounded-md bg-slate-900/60">
      {loads.map((l) => {
        if (
          !Number.isFinite(l.pickupLat) ||
          !Number.isFinite(l.pickupLng) ||
          !Number.isFinite(l.deliveryLat) ||
          !Number.isFinite(l.deliveryLng)
        )
          return null;
        const a = toXY(l.pickupLat as number, l.pickupLng as number);
        const b = toXY(l.deliveryLat as number, l.deliveryLng as number);
        return (
          <g key={`line-${l.load_id}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={routeColor(l.routeStatus)}
              strokeOpacity={l.routeStatus === "scheduled" ? 0.45 : 0.92}
              strokeWidth={1.4}
            />
            <circle cx={a.x} cy={a.y} r={1.6} fill="#22d3ee" />
            <circle cx={b.x} cy={b.y} r={1.6} fill="#14b8a6" />
          </g>
        );
      })}
    </svg>
  );
}

export function DispatchRouteMap({
  loads,
  selectedLoadId,
  onSelectLoad,
  mode = "all",
  compact = false,
}: Props) {
  // Support both NEXT_PUBLIC_MAPBOX_TOKEN and NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef | null>(null);
  const [popup, setPopup] = useState<{ load: Load; event?: LoadProofEvent; markerType?: string; markerData?: any } | null>(null);
  const [v4Data, setV4Data] = useState<{
    routeIntelligence: RouteIntelligence[];
    dieselPricing: DieselPricing[];
    restStopLocations: RestStopLocation[];
    rfidEvents: RfidEvent[];
  }>({
    routeIntelligence: [],
    dieselPricing: [],
    restStopLocations: [],
    rfidEvents: [],
  });

  // Load V4 workbook data
  useEffect(() => {
    const loadV4Data = async () => {
      try {
        const v4Available = await isV3DataAvailable();
        if (v4Available) {
          const v4Data = await getV3OperationalData();
          setV4Data({
            routeIntelligence: v4Data.routeIntelligence,
            dieselPricing: v4Data.dieselPricing,
            restStopLocations: v4Data.restStopLocations,
            rfidEvents: v4Data.rfidEvents,
          });
        }
      } catch (error) {
        console.error('Failed to load V4 data for map:', error);
      }
    };
    
    loadV4Data();
  }, []);

  useEffect(() => {
    const tokenSource = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'NEXT_PUBLIC_MAPBOX_TOKEN' : 
                       process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN' : 
                       'none';
    console.log(`Mapbox token configured: ${Boolean(mapboxToken)} (source: ${tokenSource})`);
  }, [mapboxToken]);

  const scopedLoads = useMemo(() => {
    if (mode === "selected" && selectedLoadId) {
      return loads.filter((l) => l.load_id === selectedLoadId);
    }
    return loads;
  }, [loads, mode, selectedLoadId]);

  const points = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (const l of scopedLoads) {
      if (Number.isFinite(l.pickupLat) && Number.isFinite(l.pickupLng)) {
        out.push([l.pickupLng as number, l.pickupLat as number]);
      }
      if (Number.isFinite(l.deliveryLat) && Number.isFinite(l.deliveryLng)) {
        out.push([l.deliveryLng as number, l.deliveryLat as number]);
      }
      if (Number.isFinite(l.currentLat) && Number.isFinite(l.currentLng)) {
        out.push([l.currentLng as number, l.currentLat as number]);
      }
      for (const ev of l.proofEvents ?? []) {
        if (Number.isFinite(ev.lat) && Number.isFinite(ev.lng)) out.push([ev.lng, ev.lat]);
      }
    }
    return out;
  }, [scopedLoads]);

  useEffect(() => {
    if (!mapboxToken || !mapRef.current || points.length === 0) return;
    let minLng = points[0][0];
    let maxLng = points[0][0];
    let minLat = points[0][1];
    let maxLat = points[0][1];
    for (const [lng, lat] of points) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: compact ? 24 : 40, duration: 500, maxZoom: compact ? 7 : 8 }
    );
  }, [compact, points, mapboxToken]);

  const lineFeatures = useMemo(
    () =>
      scopedLoads
        .filter(
          (l) =>
            Number.isFinite(l.pickupLat) &&
            Number.isFinite(l.pickupLng) &&
            Number.isFinite(l.deliveryLat) &&
            Number.isFinite(l.deliveryLng)
        )
        .map((l) => ({
          type: "Feature" as const,
          properties: {
            loadId: l.load_id,
            color: routeColor(l.routeStatus),
            width: l.load_id === selectedLoadId ? 5 : 3,
            dashed: l.routeStatus === "scheduled" || l.routeStatus === "dispatched" ? 1 : 0,
            opacity: l.routeStatus === "scheduled" ? 0.35 : 0.9,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [l.pickupLng as number, l.pickupLat as number],
              [l.deliveryLng as number, l.deliveryLat as number],
            ],
          },
        })),
    [scopedLoads, selectedLoadId]
  );

  if (!mapboxToken) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <div className={compact ? "mb-2" : "mb-3"}>
          <h3 className="text-sm font-semibold text-slate-100">Dispatch route map</h3>
          <p className="text-xs text-slate-400">
            Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart the dev server.
          </p>
        </div>
        <div className={compact ? "h-44" : "h-72"}>{fallbackSvg(scopedLoads)}</div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className={compact ? "mb-2" : "mb-3"}>
        <h3 className="text-sm font-semibold text-slate-100">Dispatch route map</h3>
        <p className="text-xs text-slate-400">
          Live routes with fuel stops, rest stops, RFID proof markers, and operational data.
        </p>
      </div>
      <div className={compact ? "h-44 rounded-md overflow-hidden" : "h-72 rounded-md overflow-hidden"}>
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{ longitude: -83.2, latitude: 40.2, zoom: 5 }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          attributionControl={false}
          scrollZoom={false}
          style={{ width: "100%", height: "100%" }}
        >
          {!compact && <NavigationControl position="top-right" />}
          {lineFeatures.length > 0 && (
            <Source
              id="dispatch-routes"
              type="geojson"
              data={{ type: "FeatureCollection", features: lineFeatures }}
            >
              <Layer
                id="dispatch-routes-layer"
                type="line"
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": ["get", "width"],
                  "line-opacity": ["get", "opacity"],
                  "line-dasharray": ["case", ["==", ["get", "dashed"], 1], ["literal", [2, 2]], ["literal", [1, 0]]],
                }}
              />
            </Source>
          )}

          {scopedLoads.map((load) => {
            const markers: ReactElement[] = [];
            if (Number.isFinite(load.pickupLat) && Number.isFinite(load.pickupLng)) {
              markers.push(
                <Marker key={`${load.load_id}-pickup`} latitude={load.pickupLat as number} longitude={load.pickupLng as number}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLoad?.(load.load_id);
                      setPopup({ load });
                    }}
                    title={`${load.load_id} pickup`}
                    style={{
                      width: load.load_id === selectedLoadId ? 14 : 10,
                      height: load.load_id === selectedLoadId ? 14 : 10,
                      borderRadius: "999px",
                      border: "2px solid #0f172a",
                      background: "#22d3ee",
                    }}
                  />
                </Marker>
              );
            }
            if (Number.isFinite(load.deliveryLat) && Number.isFinite(load.deliveryLng)) {
              markers.push(
                <Marker key={`${load.load_id}-delivery`} latitude={load.deliveryLat as number} longitude={load.deliveryLng as number}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLoad?.(load.load_id);
                      setPopup({ load });
                    }}
                    title={`${load.load_id} delivery`}
                    style={{
                      width: load.load_id === selectedLoadId ? 14 : 10,
                      height: load.load_id === selectedLoadId ? 14 : 10,
                      borderRadius: "999px",
                      border: "2px solid #0f172a",
                      background: "#14b8a6",
                    }}
                  />
                </Marker>
              );
            }
            if (
              Number.isFinite(load.currentLat) &&
              Number.isFinite(load.currentLng) &&
              (load.routeStatus === "in_transit" ||
                load.routeStatus === "at_risk" ||
                load.routeStatus === "delayed")
            ) {
              markers.push(
                <Marker key={`${load.load_id}-current`} latitude={load.currentLat as number} longitude={load.currentLng as number}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLoad?.(load.load_id);
                      setPopup({ load });
                    }}
                    title={`${load.load_id} current`}
                    style={{
                      width: load.load_id === selectedLoadId ? 16 : 12,
                      height: load.load_id === selectedLoadId ? 16 : 12,
                      borderRadius: "999px",
                      border: "2px solid #f8fafc",
                      background: routeColor(load.routeStatus),
                    }}
                  />
                </Marker>
              );
            }
            for (const ev of load.proofEvents ?? []) {
              if (load.routeStatus !== "delivered" && ev.type !== "claim") continue;
              const eventColor =
                ev.status === "ready" ? "#14b8a6" : ev.status === "exception" ? "#fb7185" : "#f59e0b";
              markers.push(
                <Marker key={`${load.load_id}-${ev.id}`} latitude={ev.lat} longitude={ev.lng}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLoad?.(load.load_id);
                      setPopup({ load, event: ev });
                    }}
                    title={`${load.load_id} ${ev.label}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "999px",
                      border: "1px solid #0f172a",
                      background: eventColor,
                    }}
                  />
                </Marker>
              );
            }

            // Enhanced V4 workbook data markers
            const routeInfo = v4Data.routeIntelligence.find(r => r.loadId === load.load_id);
            if (routeInfo) {
              // Fuel stop markers
              const fuelStops = v4Data.dieselPricing.filter(fuel => 
                routeInfo.fuelStops.includes(fuel.location)
              );
              
              fuelStops.forEach((fuel, index) => {
                if (Number.isFinite(fuel.coordinates[1]) && Number.isFinite(fuel.coordinates[0])) {
                  markers.push(
                    <Marker key={`${load.load_id}-fuel-${index}`} latitude={fuel.coordinates[1]} longitude={fuel.coordinates[0]}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLoad?.(load.load_id);
                          setPopup({ load, markerType: "fuel", markerData: fuel });
                        }}
                        title={`${load.load_id} fuel stop: ${fuel.location}`}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "999px",
                          border: "2px solid #0f172a",
                          background: "#10b981",
                        }}
                      />
                    </Marker>
                  );
                }
              });

              // Rest stop markers
              const restStops = v4Data.restStopLocations.filter(rest => 
                routeInfo.recommendedRestStops.includes(rest.location)
              );
              
              restStops.forEach((rest, index) => {
                if (Number.isFinite(rest.coordinates[1]) && Number.isFinite(rest.coordinates[0])) {
                  markers.push(
                    <Marker key={`${load.load_id}-rest-${index}`} latitude={rest.coordinates[1]} longitude={rest.coordinates[0]}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLoad?.(load.load_id);
                          setPopup({ load, markerType: "rest", markerData: rest });
                        }}
                        title={`${load.load_id} rest stop: ${rest.location}`}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "999px",
                          border: "2px solid #0f172a",
                          background: "#f59e0b",
                        }}
                      />
                    </Marker>
                  );
                }
              });
            }

            // RFID event markers (approximate route positions - not exact coordinates)
            const rfidEvents = v4Data.rfidEvents.filter(rfid => rfid.loadId === load.load_id);
            rfidEvents.forEach((rfid, index) => {
              const routeInfo = v4Data.routeIntelligence.find(r => r.loadId === load.load_id);
              if (routeInfo) {
                // Use approximate positions along the route (not exact RFID coordinates)
                const coords = index % 2 === 0 ? routeInfo.originCoordinates : routeInfo.destinationCoordinates;
                markers.push(
                  <Marker key={`${load.load_id}-rfid-${index}`} latitude={coords[1]} longitude={coords[0]}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLoad?.(load.load_id);
                        setPopup({ load, markerType: "rfid", markerData: { ...rfid, isApproximate: true } });
                      }}
                      title={`${load.load_id} RFID event (approximate position): ${rfid.eventType}`}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        border: "1px solid #0f172a",
                        background: "#ef4444",
                        opacity: 0.7, // Reduced opacity to indicate approximate position
                      }}
                    />
                  </Marker>
                );
              }
            });

            return markers;
          })}

          {popup && (
            <Popup
              longitude={popup.event ? popup.event.lng : ((popup.load.currentLng ?? popup.load.deliveryLng ?? popup.load.pickupLng) as number)}
              latitude={popup.event ? popup.event.lat : ((popup.load.currentLat ?? popup.load.deliveryLat ?? popup.load.pickupLat) as number)}
              onClose={() => setPopup(null)}
              closeButton
              closeOnClick={false}
              maxWidth="320px"
            >
              <div dangerouslySetInnerHTML={{ __html: popupHtml(popup.load, popup.event, popup.markerType, popup.markerData) }} />
            </Popup>
          )}
        </Map>
      </div>
    </section>
  );
}

