"use client";

import { BofLogo } from "@/components/BofLogo";
import type { LoadRouteMapModel } from "@/lib/load-route-map";
import { createRoadLikeFallback } from "@/lib/mapbox-directions";

function markerColor(tier: string): string {
  switch (tier) {
    case "on_time":
      return "#22d3ee";
    case "at_risk":
      return "#f59e0b";
    case "issue":
      return "#fb7185";
    case "rfid_verified":
      return "#14b8a6";
    default:
      return "#64748b";
  }
}

function fallbackSvg(model: LoadRouteMapModel) {
  const routeLine =
    model.line.length < 2
      ? model.line
      : createRoadLikeFallback(model.line[0], model.line[model.line.length - 1]);
  const points = [...routeLine, ...model.markers.map((m) => [m.lng, m.lat])];
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
      {routeLine.length >= 2 &&
        routeLine.map((point, i) => {
          if (i === 0) return null;
          const prev = toXY(routeLine[i - 1][0], routeLine[i - 1][1]);
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
  return (
    <section key={model.loadId} className="bof-route-map-section" aria-label="Route overview">
      <div className="bof-route-map-head">
        <h2 className="bof-h3">Route map</h2>
        <p className="bof-muted bof-small">
          {model.originLabel} to {model.destLabel} - risk / proof overlay (not live fleet tracking)
        </p>
        <p className="bof-muted bof-small" style={{ marginTop: "0.5rem" }}>
          Deterministic route preview with BOF risk, proof, and RFID checkpoints.
        </p>
      </div>
      <div className="bof-route-map-canvas-wrap">
        <div className="h-72 rounded-md overflow-hidden">{fallbackSvg(model)}</div>
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
