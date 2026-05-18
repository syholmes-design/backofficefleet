"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import { getRouteGeometry } from "@/lib/mapbox-directions";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
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

type MarkerData = {
  id: string;
  type: "pickup" | "delivery" | "current" | "fuel" | "rest" | "rfid";
  latitude: number;
  longitude: number;
  loadId?: string;
  data?: any;
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

function popupHtml(load: Load, event?: LoadProofEvent, markerData?: MarkerData): string {
  const detail = event
    ? `<div class="bof-map-popup-line">Event: ${event.label}</div><div class="bof-map-popup-line">Status: ${event.status}</div>`
    : markerData?.type === "fuel"
    ? `<div class="bof-map-popup-line">Station: ${markerData.data.location}</div><div class="bof-map-popup-line">Price: $${markerData.data.dieselPrice}/gal</div><div class="bof-map-popup-line">Est. Gallons: ${markerData.data.estimatedGallons}</div><div class="bof-map-popup-line">Est. Cost: $${markerData.data.estimatedFuelCost.toFixed(2)}</div>`
    : markerData?.type === "rest"
    ? `<div class="bof-map-popup-line">Stop: ${markerData.data.location}</div><div class="bof-map-popup-line">Parking: ${markerData.data.parkingAvailable ? "Available" : "Unavailable"}</div><div class="bof-map-popup-line">Amenities: ${markerData.data.amenities.join(", ")}</div>`
    : markerData?.type === "rfid"
    ? `<div class="bof-map-popup-line">Event: ${markerData.data.eventType}</div><div class="bof-map-popup-line">Status: ${markerData.data.scanStatus}</div><div class="bof-map-popup-line">Seal Match: ${markerData.data.sealMatchStatus}</div>`
    : `<div class="bof-map-popup-line">ETA: ${load.eta ?? "—"}</div><div class="bof-map-popup-line">Current: ${load.currentLocationLabel ?? "—"}</div>`;
  
  const docLink = event?.documentUrl
    ? `<a class="bof-map-popup-link" href="${event.documentUrl}" target="_blank" rel="noopener noreferrer">Open event document</a>`
    : "";
  const podLink = load.pod_url
    ? `<a class="bof-map-popup-link" href="${load.pod_url}" target="_blank" rel="noopener noreferrer">Open POD</a>`
    : "";
  const packetLink = `/loads/${load.load_id}`;
  
  return `<div class="bof-map-popup"><div class="bof-map-popup-title">${load.load_id} · ${load.customer_name}</div><div class="bof-map-popup-line">Driver: ${load.driver_id ?? "Unassigned"}</div><div class="bof-map-popup-line">Status: ${statusLabel(load.routeStatus)}</div>${detail}<div class="bof-map-popup-line">${proofStatus(load)}</div><div class="bof-map-popup-line">Settlement hold: ${load.settlement_hold ? "Yes" : "No"}</div>${podLink}${docLink}<a class="bof-map-popup-link" href="${packetLink}" target="_blank" rel="noopener noreferrer">Open Load Proof Packet</a></div>`;
}

function fallbackSvg(loads: Load[], markerData: MarkerData[]) {
  const points = loads
    .flatMap((l) => [
      [l.pickupLat, l.pickupLng],
      [l.deliveryLat, l.deliveryLng],
      [l.currentLat, l.currentLng],
    ])
    .filter((x): x is [number, number] => Number.isFinite(x[0]) && Number.isFinite(x[1]));
  
  const markerPoints = markerData
    .map((m) => [m.latitude, m.longitude])
    .filter((x): x is [number, number] => Number.isFinite(x[0]) && Number.isFinite(x[1]));
  
  const allPoints = [...points, ...markerPoints];
  
  const minLat = Math.min(...allPoints.map((p) => p[0]), 30);
  const maxLat = Math.max(...allPoints.map((p) => p[0]), 50);
  const minLng = Math.min(...allPoints.map((p) => p[1]), -95);
  const maxLng = Math.max(...allPoints.map((p) => p[1]), -70);
  
  const toXY = (lat: number, lng: number) => {
    const x = ((lng - minLng) / Math.max(1e-6, maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / Math.max(1e-6, maxLat - minLat)) * 100;
    return { x, y };
  };
  
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full rounded-md bg-slate-900/60">
      <text x="50" y="10" textAnchor="middle" className="fill-yellow-400 text-xs font-medium">Demo Route Mode</text>
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
      
      {/* Additional markers */}
      {markerData.map((marker) => {
        const pos = toXY(marker.latitude, marker.longitude);
        const color = marker.type === "fuel" ? "#10b981" : marker.type === "rest" ? "#f59e0b" : "#ef4444";
        return (
          <circle key={marker.id} cx={pos.x} cy={pos.y} r={1.2} fill={color} />
        );
      })}
    </svg>
  );
}

export function DispatchRouteMapEnhanced({
  loads,
  selectedLoadId,
  onSelectLoad,
  mode = "all",
  compact = false,
}: Props) {
  // Support both NEXT_PUBLIC_MAPBOX_TOKEN and NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef | null>(null);
  const [popup, setPopup] = useState<{ load: Load; event?: LoadProofEvent; markerData?: MarkerData } | null>(null);
  const [routeData, setRouteData] = useState<{
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
    loadV4Data();
  }, []);

  const loadV4Data = async () => {
    try {
      const v4Available = await isV3DataAvailable();
      if (v4Available) {
        const v4Data = await getV3OperationalData();
        setRouteData({
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

  // Enhanced marker data with V4 workbook data
  const markerData = useMemo(() => {
    const markers: MarkerData[] = [];
    
    for (const load of scopedLoads) {
      // Basic load markers
      if (Number.isFinite(load.pickupLat) && Number.isFinite(load.pickupLng)) {
        markers.push({
          id: `${load.load_id}-pickup`,
          type: "pickup",
          latitude: load.pickupLat as number,
          longitude: load.pickupLng as number,
          loadId: load.load_id,
        });
      }
      
      if (Number.isFinite(load.deliveryLat) && Number.isFinite(load.deliveryLng)) {
        markers.push({
          id: `${load.load_id}-delivery`,
          type: "delivery",
          latitude: load.deliveryLat as number,
          longitude: load.deliveryLng as number,
          loadId: load.load_id,
        });
      }
      
      if (
        Number.isFinite(load.currentLat) &&
        Number.isFinite(load.currentLng) &&
        (load.routeStatus === "in_transit" || load.routeStatus === "at_risk" || load.routeStatus === "delayed")
      ) {
        markers.push({
          id: `${load.load_id}-current`,
          type: "current",
          latitude: load.currentLat as number,
          longitude: load.currentLng as number,
          loadId: load.load_id,
        });
      }

      // V4 workbook data markers
      const routeInfo = routeData.routeIntelligence.find(r => r.loadId === load.load_id);
      if (routeInfo) {
        // Fuel stops for this route
        const fuelStops = routeData.dieselPricing.filter(fuel => 
          routeInfo.fuelStops.includes(fuel.location)
        );
        
        fuelStops.forEach((fuel, index) => {
          if (Number.isFinite(fuel.coordinates[1]) && Number.isFinite(fuel.coordinates[0])) {
            markers.push({
              id: `${load.load_id}-fuel-${index}`,
              type: "fuel",
              latitude: fuel.coordinates[1],
              longitude: fuel.coordinates[0],
              loadId: load.load_id,
              data: fuel,
            });
          }
        });

        // Rest stops for this route
        const restStops = routeData.restStopLocations.filter(rest => 
          routeInfo.recommendedRestStops.includes(rest.location)
        );
        
        restStops.forEach((rest, index) => {
          if (Number.isFinite(rest.coordinates[1]) && Number.isFinite(rest.coordinates[0])) {
            markers.push({
              id: `${load.load_id}-rest-${index}`,
              type: "rest",
              latitude: rest.coordinates[1],
              longitude: rest.coordinates[0],
              loadId: load.load_id,
              data: rest,
            });
          }
        });
      }

      // RFID events for this load - note: RfidEvent doesn't have coordinates, so we'll use route coordinates as placeholders
      const rfidEvents = routeData.rfidEvents.filter(rfid => rfid.loadId === load.load_id);
      rfidEvents.forEach((rfid, index) => {
        // Use origin/destination coordinates as placeholder positions for RFID events
        const routeInfo = routeData.routeIntelligence.find(r => r.loadId === load.load_id);
        if (routeInfo) {
          const coords = index % 2 === 0 ? routeInfo.originCoordinates : routeInfo.destinationCoordinates;
          markers.push({
            id: `${load.load_id}-rfid-${index}`,
            type: "rfid",
            latitude: coords[1],
            longitude: coords[0],
            loadId: load.load_id,
            data: rfid,
          });
        }
      });

      // Legacy proof events
      for (const ev of load.proofEvents ?? []) {
        if (Number.isFinite(ev.lat) && Number.isFinite(ev.lng)) {
          markers.push({
            id: `${load.load_id}-legacy-${ev.id}`,
            type: "rfid",
            latitude: ev.lat,
            longitude: ev.lng,
            loadId: load.load_id,
            data: ev,
          });
        }
      }
    }
    
    return markers;
  }, [scopedLoads, routeData]);

  // Enhanced route geometry with straight lines for now
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

  // Auto-fit map bounds
  useEffect(() => {
    if (!mapboxToken || !mapRef.current || markerData.length === 0) return;
    
    let minLng = markerData[0].longitude;
    let maxLng = markerData[0].longitude;
    let minLat = markerData[0].latitude;
    let maxLat = markerData[0].latitude;
    
    for (const marker of markerData) {
      minLng = Math.min(minLng, marker.longitude);
      maxLng = Math.max(maxLng, marker.longitude);
      minLat = Math.min(minLat, marker.latitude);
      maxLat = Math.max(maxLat, marker.latitude);
    }
    
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: compact ? 24 : 40, duration: 500, maxZoom: compact ? 7 : 8 }
    );
  }, [compact, markerData, mapboxToken]);

  if (!mapboxToken) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <div className={compact ? "mb-2" : "mb-3"}>
          <h3 className="text-sm font-semibold text-slate-100">Dispatch route map</h3>
          <p className="text-xs text-slate-400">
            Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart the dev server.
          </p>
        </div>
        <div className={compact ? "h-44" : "h-72"}>{fallbackSvg(scopedLoads, markerData)}</div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className={compact ? "mb-2" : "mb-3"}>
        <h3 className="text-sm font-semibold text-slate-100">Dispatch route map</h3>
        <p className="text-xs text-slate-400">
          Live routes with fuel stops, rest stops, and RFID proof markers.
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
          
          {/* Enhanced markers */}
          {markerData.map((marker) => {
            const isSelected = marker.loadId === selectedLoadId;
            const markerStyle = {
              width: isSelected ? 14 : 10,
              height: isSelected ? 14 : 10,
              borderRadius: "999px",
              border: "2px solid #0f172a",
            };

            let backgroundColor = "#64748b"; // default
            switch (marker.type) {
              case "pickup":
                backgroundColor = "#22d3ee";
                break;
              case "delivery":
                backgroundColor = "#14b8a6";
                break;
              case "current":
                backgroundColor = routeColor(scopedLoads.find(l => l.load_id === marker.loadId)?.routeStatus);
                break;
              case "fuel":
                backgroundColor = "#10b981";
                break;
              case "rest":
                backgroundColor = "#f59e0b";
                break;
              case "rfid":
                backgroundColor = "#ef4444";
                break;
            }

            return (
              <Marker
                key={marker.id}
                latitude={marker.latitude}
                longitude={marker.longitude}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (marker.loadId && onSelectLoad) {
                      onSelectLoad(marker.loadId);
                    }
                    const load = scopedLoads.find(l => l.load_id === marker.loadId);
                    if (load) {
                      setPopup({ load, markerData: marker });
                    }
                  }}
                  title={`${marker.loadId || ''} ${marker.type}`}
                  style={{ ...markerStyle, backgroundColor }}
                />
              </Marker>
            );
          })}

          {popup && (
            <Popup
              longitude={popup.markerData?.longitude || ((popup.load.currentLng ?? popup.load.deliveryLng ?? popup.load.pickupLng) as number)}
              latitude={popup.markerData?.latitude || ((popup.load.currentLat ?? popup.load.deliveryLat ?? popup.load.pickupLat) as number)}
              onClose={() => setPopup(null)}
              closeButton
              closeOnClick={false}
              maxWidth="320px"
            >
              <div dangerouslySetInnerHTML={{ __html: popupHtml(popup.load, popup.event, popup.markerData) }} />
            </Popup>
          )}
        </Map>
      </div>
    </section>
  );
}
