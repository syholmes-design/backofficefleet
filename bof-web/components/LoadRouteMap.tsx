"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl/mapbox";
import { BofLogo } from "@/components/BofLogo";
import type { LoadRouteMapModel } from "@/lib/load-route-map";
import { getRouteGeometry } from "@/lib/mapbox-directions";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(label: string, lines: string[]): string {
  const body = lines
    .map((line) => `<div class="bof-map-popup-line">${escapeHtml(line)}</div>`)
    .join("");
  return `<div class="bof-map-popup"><div class="bof-map-popup-title">${escapeHtml(label)}</div>${body}</div>`;
}

function markerColor(tier: string): string {
  switch (tier) {
    case "on_time": return "#22d3ee";
    case "at_risk": return "#f59e0b";
    case "issue": return "#fb7185";
    case "rfid_verified": return "#14b8a6";
    default: return "#64748b";
  }
}

function fallbackSvg(model: LoadRouteMapModel) {
  const points = [
    ...model.line,
    ...model.markers.map(m => [m.lng, m.lat])
  ];
  const minLat = Math.min(...points.map((p) => p[1]), 30);
  const maxLat = Math.max(...points.map((p) => p[1]), 50);
  const minLng = Math.min(...points.map((p) => p[0]), -95);
  const maxLng = Math.max(...points.map((p) => p[0]), -70);
  const toXY = (lng: number, lat: number) => {
    const x = ((lng - minLng) / Math.max(1e-6, maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / Math.max(1e-6, maxLat - minLat)) * 100;
    return { x, y };
  };
  
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full rounded-md bg-slate-900/60">
      {/* Draw route line */}
      {model.line.length >= 2 && model.line.map((point, i) => {
        if (i === 0) return null;
        const prev = toXY(model.line[i - 1][0], model.line[i - 1][1]);
        const curr = toXY(point[0], point[1]);
        return (
          <line
            key={`route-${i}`}
            x1={prev.x}
            y1={prev.y}
            x2={curr.x}
            y2={curr.y}
            stroke="#14b8a6"
            strokeOpacity={0.88}
            strokeWidth={2}
          />
        );
      })}
      
      {/* Draw markers */}
      {model.markers.map((m) => {
        const pos = toXY(m.lng, m.lat);
        return (
          <circle
            key={m.id}
            cx={pos.x}
            cy={pos.y}
            r={3}
            fill={markerColor(m.tier)}
            stroke="#0f172a"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

export function LoadRouteMap({ model }: { model: LoadRouteMapModel }) {
  // Support both NEXT_PUBLIC_MAPBOX_TOKEN and NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef | null>(null);
  const [popup, setPopup] = useState<{ marker: typeof model.markers[0] } | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>(model.line);

  // Fetch route geometry with Mapbox Directions API
  useEffect(() => {
    if (!mapboxToken) return;
    
    const fetchRoute = async () => {
      try {
        const origin: [number, number] = [model.line[0][0], model.line[0][1]];
        const destination: [number, number] = [model.line[model.line.length - 1][0], model.line[model.line.length - 1][1]];
        
        const geometry = await getRouteGeometry(origin, destination, mapboxToken);
        setRouteGeometry(geometry);
      } catch (error) {
        console.warn('Failed to fetch route geometry, using straight line:', error);
      }
    };
    
    fetchRoute();
  }, [model.line, mapboxToken]);

  // Fit map to bounds when route geometry or markers change
  useEffect(() => {
    if (!mapboxToken || !mapRef.current) return;
    
    const points = [
      ...routeGeometry,
      ...model.markers.map(m => [m.lng, m.lat])
    ];
    
    if (points.length === 0) return;
    
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
      { padding: 40, duration: 500, maxZoom: 9 }
    );
  }, [routeGeometry, model.markers, mapboxToken]);

  // Fallback mode when no Mapbox token
  if (!mapboxToken) {
    return (
      <section
        key={model.loadId}
        className="bof-route-map-section"
        aria-label="Route overview"
      >
        <div className="bof-route-map-head">
          <h2 className="bof-h3">Route map</h2>
          <p className="bof-muted bof-small">
            {model.originLabel} → {model.destLabel} · risk / proof overlay (not live fleet tracking)
          </p>
          <p className="bof-muted bof-small" style={{ marginTop: '0.5rem' }}>
            Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local and restart the dev server.
          </p>
        </div>
        <div className="bof-route-map-canvas-wrap">
          <div className="h-72 rounded-md overflow-hidden">
            {fallbackSvg(model)}
          </div>
          <div className="bof-route-map-brand" aria-hidden>
            <BofLogo variant="dark" className="bof-route-map-brand-logo" />
          </div>
        </div>
        <ul className="bof-map-legend bof-small" aria-label="Marker legend">
          <li>
            <span className="bof-map-legend-swatch bof-map-pin--on_time" /> On time
          </li>
          <li>
            <span className="bof-map-legend-swatch bof-map-pin--at_risk" /> At risk
          </li>
          <li>
            <span className="bof-map-legend-swatch bof-map-pin--issue" /> Delayed / issue
          </li>
          <li>
            <span className="bof-map-legend-swatch bof-map-pin--rfid_verified" /> RFID verified (checkpoint)
          </li>
        </ul>
      </section>
    );
  }

  // Mapbox mode
  return (
    <section
      key={model.loadId}
      className="bof-route-map-section"
      aria-label="Route overview"
    >
      <div className="bof-route-map-head">
        <h2 className="bof-h3">Route map</h2>
        <p className="bof-muted bof-small">
          {model.originLabel} → {model.destLabel} · risk / proof overlay (not live fleet tracking)
        </p>
      </div>
      <div className="bof-route-map-canvas-wrap">
        <div className="h-72 rounded-md overflow-hidden">
          <Map
            ref={mapRef}
            mapboxAccessToken={mapboxToken}
            initialViewState={{ longitude: -83.2, latitude: 40.2, zoom: 5 }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            attributionControl={false}
            scrollZoom={false}
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="top-right" />
            
            {/* Route line */}
            {routeGeometry.length >= 2 && (
              <Source
                id="route-line"
                type="geojson"
                data={{
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: routeGeometry,
                  },
                  properties: {},
                }}
              >
                <Layer
                  id="route-line-layer"
                  type="line"
                  paint={{
                    "line-color": "#14b8a6",
                    "line-width": 3,
                    "line-opacity": 0.88,
                  }}
                />
              </Source>
            )}
            
            {/* Markers */}
            {model.markers.map((marker) => (
              <Marker
                key={marker.id}
                longitude={marker.lng}
                latitude={marker.lat}
                anchor="center"
              >
                <button
                  type="button"
                  onClick={() => setPopup({ marker })}
                  title={marker.label}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2px solid #0f172a",
                    background: markerColor(marker.tier),
                    cursor: "pointer",
                  }}
                />
              </Marker>
            ))}
            
            {/* Popup */}
            {popup && (
              <div
                style={{
                  position: 'absolute',
                  left: popup.marker.lng,
                  top: popup.marker.lat,
                  transform: 'translate(-50%, -100%)',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '12px',
                  maxWidth: '280px',
                  zIndex: 1000,
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: popupHtml(popup.marker.label, popup.marker.lines) }} />
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </Map>
        </div>
        <div className="bof-route-map-brand" aria-hidden>
          <BofLogo variant="dark" className="bof-route-map-brand-logo" />
        </div>
      </div>
      <ul className="bof-map-legend bof-small" aria-label="Marker legend">
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--on_time" /> On time
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--at_risk" /> At risk
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--issue" /> Delayed / issue
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--rfid_verified" /> RFID verified (checkpoint)
        </li>
      </ul>
    </section>
  );
}
