"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Load, LoadProofEvent, RouteStatus } from "@/types/dispatch";

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

function popupHtml(load: Load, event?: LoadProofEvent): string {
  const detail = event
    ? `<div class="bof-map-popup-line">Event: ${event.label}</div><div class="bof-map-popup-line">Status: ${event.status}</div>`
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
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const scopedLoads = useMemo(() => {
    if (mode === "selected" && selectedLoadId) {
      return loads.filter((l) => l.load_id === selectedLoadId);
    }
    return loads;
  }, [loads, mode, selectedLoadId]);

  useEffect(() => {
    if (!token) return;
    const el = containerRef.current;
    if (!el) return;
    const m = L.map(el, { scrollWheelZoom: false, zoomControl: !compact });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    const bounds = L.latLngBounds([]);
    for (const load of scopedLoads) {
      if (
        !Number.isFinite(load.pickupLat) ||
        !Number.isFinite(load.pickupLng) ||
        !Number.isFinite(load.deliveryLat) ||
        !Number.isFinite(load.deliveryLng)
      ) {
        continue;
      }
      const a: [number, number] = [load.pickupLat as number, load.pickupLng as number];
      const b: [number, number] = [load.deliveryLat as number, load.deliveryLng as number];
      const route = L.polyline([a, b], {
        color: routeColor(load.routeStatus),
        weight: load.load_id === selectedLoadId ? 5 : 3,
        opacity: load.routeStatus === "scheduled" ? 0.35 : 0.9,
        dashArray:
          load.routeStatus === "scheduled" || load.routeStatus === "dispatched"
            ? "8 8"
            : undefined,
      }).addTo(m);
      route.on("click", () => onSelectLoad?.(load.load_id));
      bounds.extend(a);
      bounds.extend(b);

      const pickupMarker = L.circleMarker(a, {
        radius: load.load_id === selectedLoadId ? 7 : 5,
        color: "#22d3ee",
        weight: 2,
        fillColor: "#22d3ee",
        fillOpacity: 0.9,
      })
        .addTo(m)
        .bindPopup(popupHtml(load), { className: "bof-dispatch-map-popup", maxWidth: 300 });
      pickupMarker.on("click", () => onSelectLoad?.(load.load_id));

      const deliveryMarker = L.circleMarker(b, {
        radius: load.load_id === selectedLoadId ? 7 : 5,
        color: "#14b8a6",
        weight: 2,
        fillColor: "#14b8a6",
        fillOpacity: 0.9,
      })
        .addTo(m)
        .bindPopup(popupHtml(load), { className: "bof-dispatch-map-popup", maxWidth: 300 });
      deliveryMarker.on("click", () => onSelectLoad?.(load.load_id));

      if (
        Number.isFinite(load.currentLat) &&
        Number.isFinite(load.currentLng) &&
        (load.routeStatus === "in_transit" ||
          load.routeStatus === "at_risk" ||
          load.routeStatus === "delayed")
      ) {
        const current = L.circleMarker([load.currentLat as number, load.currentLng as number], {
          radius: load.load_id === selectedLoadId ? 8 : 6,
          color: "#f8fafc",
          weight: 2,
          fillColor: routeColor(load.routeStatus),
          fillOpacity: 1,
        })
          .addTo(m)
          .bindPopup(popupHtml(load), { className: "bof-dispatch-map-popup", maxWidth: 300 });
        current.on("click", () => onSelectLoad?.(load.load_id));
        bounds.extend([load.currentLat as number, load.currentLng as number]);
      }

      for (const event of load.proofEvents ?? []) {
        if (load.routeStatus !== "delivered" && event.type !== "claim") continue;
        const eventColor =
          event.status === "ready"
            ? "#14b8a6"
            : event.status === "exception"
              ? "#fb7185"
              : "#f59e0b";
        const marker = L.circleMarker([event.lat, event.lng], {
          radius: 4,
          color: eventColor,
          fillColor: eventColor,
          fillOpacity: 0.95,
          weight: 1,
        })
          .addTo(m)
          .bindPopup(popupHtml(load, event), {
            className: "bof-dispatch-map-popup",
            maxWidth: 300,
          });
        marker.on("click", () => onSelectLoad?.(load.load_id));
        bounds.extend([event.lat, event.lng]);
      }
    }
    if (bounds.isValid()) {
      m.fitBounds(bounds, { padding: [24, 24], maxZoom: compact ? 7 : 8 });
    } else {
      m.setView([40.2, -83.2], 5);
    }
    return () => {
      m.remove();
      delete (el as unknown as { _leaflet_id?: number })._leaflet_id;
    };
  }, [scopedLoads, onSelectLoad, selectedLoadId, compact, token]);

  if (!token) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <div className={compact ? "mb-2" : "mb-3"}>
          <h3 className="text-sm font-semibold text-slate-100">Dispatch route map</h3>
          <p className="text-xs text-slate-400">
            Map token not configured - route data available in demo mode.
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
          Delivered, in-transit, and scheduled lanes with proof markers.
        </p>
      </div>
      <div ref={containerRef} className={compact ? "h-44 rounded-md" : "h-72 rounded-md"} />
    </section>
  );
}

