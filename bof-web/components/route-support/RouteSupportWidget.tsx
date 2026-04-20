"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildRouteSupportModel, type RouteSupportAmenity } from "@/lib/route-support";

export type RouteSupportVariant = "full" | "compact";

type Props = {
  loadId: string;
  variant?: RouteSupportVariant;
  /** When false, omit the optional cheaper-fuel line */
  showCheaperFuelNote?: boolean;
};

function AmenityBadge({ a }: { a: RouteSupportAmenity }) {
  return <span className="route-support-badge">{a}</span>;
}

function ParkingBadge({ p }: { p: string }) {
  const tone =
    p === "Available" ? "route-support-pill route-support-pill-ok" : p === "Limited" ? "route-support-pill route-support-pill-warn" : "route-support-pill route-support-pill-muted";
  return <span className={tone}>Parking: {p}</span>;
}

export function RouteSupportWidget({
  loadId,
  variant = "full",
  showCheaperFuelNote = true,
}: Props) {
  const { data } = useBofDemoData();
  const model = useMemo(
    () => buildRouteSupportModel(data, loadId, { includeCheaperFuelNote: showCheaperFuelNote }),
    [data, loadId, showCheaperFuelNote]
  );

  if (!model) return null;

  const compact = variant === "compact";

  return (
    <section
      className={compact ? "route-support route-support--compact" : "route-support"}
      aria-labelledby={`route-support-${loadId}`}
    >
      <h2 id={`route-support-${loadId}`} className="route-support-title">
        Route support · Next rest stop
      </h2>
      <p className="route-support-lane bof-small">
        Lane: <span className="route-support-lane-text">{model.laneLabel}</span>
        {model.hasRoutePolyline ? (
          <span className="route-support-meta"> · BOF route polyline on file</span>
        ) : (
          <span className="route-support-meta"> · Straight-line demo geometry only</span>
        )}
      </p>

      <div className="route-support-primary">
        <div className="route-support-primary-header">
          <span className="route-support-type">{model.primary.stopType}</span>
          <ParkingBadge p={model.primary.parking} />
        </div>
        <p className="route-support-name">{model.primary.name}</p>
        <p className="route-support-metrics">
          <strong>{model.primary.distanceMiles} mi</strong>
          <span aria-hidden> · </span>
          <strong>~{model.primary.etaMinutes} min</strong>
          <span className="route-support-metrics-hint"> (demo ETA from illustrative position)</span>
        </p>
        <div className="route-support-amenities" aria-label="Amenities">
          {model.primary.amenities.map((a) => (
            <AmenityBadge key={a} a={a} />
          ))}
        </div>
      </div>

      {!compact && (
        <div className="route-support-upcoming">
          <h3 className="route-support-sub">Upcoming on this segment</h3>
          <ul className="route-support-list">
            {model.upcoming.map((s, idx) => (
              <li key={`${s.name}-${idx}`}>
                <span className="route-support-list-name">{s.name}</span>
                <span className="route-support-list-meta">
                  {s.stopType} · {s.distanceMiles} mi · ~{s.etaMinutes} min ·{" "}
                  <span className="route-support-list-parking">{s.parking}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCheaperFuelNote && model.cheaperFuelNote && !compact && (
        <p className="route-support-fuel-note bof-small">{model.cheaperFuelNote}</p>
      )}

      <p className="route-support-disclaimer bof-muted bof-small">{model.dataSourceNote}</p>

      {!compact && (
        <p className="bof-small" style={{ marginTop: "0.35rem" }}>
          <Link href={`/loads/${loadId}`} className="bof-link-secondary">
            Load detail
          </Link>
          {" · "}
          <Link href={`/pretrip/${loadId}`} className="bof-link-secondary">
            Pre-trip tablet
          </Link>
        </p>
      )}
    </section>
  );
}
