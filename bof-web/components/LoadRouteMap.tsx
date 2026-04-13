"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BofLogo } from "@/components/BofLogo";
import type { LoadRouteMapModel } from "@/lib/load-route-map";

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

export function LoadRouteMap({ model }: { model: LoadRouteMapModel }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const latLngs = model.line.map(
      ([lat, lng]) => [lat, lng] as L.LatLngExpression
    );

    L.polyline(latLngs, {
      color: "#14b8a6",
      weight: 3,
      opacity: 0.88,
    }).addTo(map);

    const bounds = L.latLngBounds(latLngs);

    for (const m of model.markers) {
      const icon = L.divIcon({
        className: "bof-map-marker-wrap",
        html: `<div class="bof-map-pin bof-map-pin--${m.tier}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([m.lat, m.lng], { icon });
      marker.bindPopup(popupHtml(m.label, m.lines), {
        className: "bof-map-popup-outer",
        maxWidth: 280,
      });
      marker.addTo(map);
      bounds.extend([m.lat, m.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 });
    }

    return () => {
      map.remove();
      delete (el as unknown as { _leaflet_id?: number })._leaflet_id;
    };
  }, [model]);

  return (
    <section
      key={model.loadId}
      className="bof-route-map-section"
      aria-label="Route overview"
    >
      <div className="bof-route-map-head">
        <h2 className="bof-h3">Route map</h2>
        <p className="bof-muted bof-small">
          {model.originLabel} → {model.destLabel} · risk / proof overlay (not live
          fleet tracking)
        </p>
      </div>
      <div className="bof-route-map-canvas-wrap">
        <div ref={containerRef} className="bof-route-map-canvas" role="presentation" />
        <div className="bof-route-map-brand" aria-hidden>
          <BofLogo variant="dark" className="bof-route-map-brand-logo" />
        </div>
      </div>
      <ul className="bof-map-legend bof-small" aria-label="Marker legend">
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--on_time" /> On
          time
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--at_risk" /> At
          risk
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--issue" /> Delayed
          / issue
        </li>
        <li>
          <span className="bof-map-legend-swatch bof-map-pin--rfid_verified" />{" "}
          RFID verified (checkpoint)
        </li>
      </ul>
    </section>
  );
}
