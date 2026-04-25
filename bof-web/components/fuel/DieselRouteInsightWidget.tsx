"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildDieselRouteInsight,
  type DieselRouteInsight,
  type DieselStopInsight,
} from "@/lib/diesel-route-insight";
import type { TomTomFuelFeedResponse, TomTomFuelStationNormalized } from "@/lib/tomtom-fuel-types";

export type DieselRouteInsightVariant = "full" | "compact" | "shipper";

type Props = {
  loadId: string;
  variant?: DieselRouteInsightVariant;
};

function fmtUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  );
}

function fmtGal(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

/** Positive cents = BOF diesel below demo corridor average */
function fmtDeltaVsAvgCpg(cents: number) {
  if (cents <= 0) return `${Math.abs(cents).toFixed(1)}¢/gal at or above demo average`;
  return `${cents.toFixed(1)}¢/gal below demo average`;
}

function StopBadge({ children, tone }: { children: ReactNode; tone: "bof" | "cheap" | "rec" }) {
  const cls =
    tone === "bof"
      ? "diesel-insight-badge diesel-insight-badge--bof"
      : tone === "cheap"
        ? "diesel-insight-badge diesel-insight-badge--cheap"
        : "diesel-insight-badge diesel-insight-badge--rec";
  return <span className={cls}>{children}</span>;
}

function StopRow({
  label,
  s,
  badges,
}: {
  label: string;
  s: DieselStopInsight;
  badges: ReactNode;
}) {
  return (
    <div className="diesel-insight-stop diesel-insight-stop--row">
      <div className="diesel-insight-stop-head">
        <span className="diesel-insight-stop-label">{label}</span>
        {badges}
      </div>
      <p className="diesel-insight-stop-name">{s.name}</p>
      <dl className="diesel-insight-dl">
        <div>
          <dt>Diesel</dt>
          <dd>
            <strong>${s.dieselPricePerGal.toFixed(3)}</strong>
            <span className="diesel-insight-muted"> /gal</span>
          </dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{s.distanceMiles} mi</dd>
        </div>
        <div>
          <dt>ETA</dt>
          <dd>~{s.etaMinutes} min</dd>
        </div>
      </dl>
    </div>
  );
}

export function DieselRouteInsightWidget({ loadId, variant = "full" }: Props) {
  const { data } = useBofDemoData();
  const [liveFuel, setLiveFuel] = useState<TomTomFuelFeedResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/fuel/tomtom?loadId=${encodeURIComponent(loadId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as TomTomFuelFeedResponse;
        if (!cancelled) setLiveFuel(body);
      } catch {
        // Keep demo fallback silent on API failure.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  const demoInsight = useMemo(() => buildDieselRouteInsight(data, loadId), [data, loadId]);
  const insight = useMemo(() => {
    if (!demoInsight) return null;
    if (!liveFuel?.live || !liveFuel.stations.length) return demoInsight;

    const sorted = [...liveFuel.stations]
      .filter((s) => Number.isFinite(s.dieselPricePerGal) && s.dieselPricePerGal > 0)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
    if (!sorted.length) return demoInsight;

    const mk = (
      s: TomTomFuelStationNormalized,
      key: string,
      cheapestPerGal: number
    ): DieselStopInsight => ({
      key,
      name: s.name,
      distanceMiles: s.distanceMiles,
      etaMinutes: s.etaMinutes,
      dieselPricePerGal: s.dieselPricePerGal,
      isBofNetwork: s.isBofNetwork,
      isCheapestInRadius: s.dieselPricePerGal === cheapestPerGal,
    });

    const nearest = sorted.find((s) => s.nearest) ?? sorted[0]!;
    const cheapestRaw =
      sorted.find((s) => s.cheapest) ??
      sorted.reduce((a, b) => (a.dieselPricePerGal <= b.dieselPricePerGal ? a : b));
    const bofRaw = sorted.find((s) => s.isBofNetwork && s.nearest) ?? sorted.find((s) => s.isBofNetwork) ?? nearest;
    const recRaw = sorted.find((s) => s.recommended) ?? bofRaw;
    const cheapestPrice = cheapestRaw.dieselPricePerGal;

    const baselineAveragePerGal =
      liveFuel.summary.baselineAveragePerGal ??
      Math.round((sorted.reduce((sum, s) => sum + s.dieselPricePerGal, 0) / sorted.length) * 1000) /
        1000;
    const estimatedTripGallons = liveFuel.summary.estimatedTripGallons ?? demoInsight.estimatedTripGallons;
    const estimatedTripSavingsUsdVsBaselineBof =
      liveFuel.summary.estimatedTripSavingsUsd ?? demoInsight.estimatedTripSavingsUsdVsBaselineBof;
    const cheapestVsBofPerGal =
      Math.round((cheapestRaw.dieselPricePerGal - bofRaw.dieselPricePerGal) * 1000) / 1000;
    const bofSavingsCentsPerGalVsBaseline =
      Math.round(((liveFuel.summary.savingsPerGalVsBaseline ?? baselineAveragePerGal - bofRaw.dieselPricePerGal) * 1000)) /
      10;

    const recommended = {
      ...mk(recRaw, "live-recommended", cheapestPrice),
      reason: recRaw.stationId === bofRaw.stationId
        ? "Live TomTom diesel scan recommends the BOF-relevant nearest network stop for this route context."
        : "Live TomTom diesel scan found a cheaper nearby diesel option within 50 miles.",
    };

    const nearbyAlternates = sorted
      .filter((s) => s.stationId !== recRaw.stationId)
      .slice(0, 3)
      .map((s, idx) => mk(s, `live-alt-${idx}`, cheapestPrice));

    const currencySet = Array.from(new Set(sorted.map((s) => s.currency).filter(Boolean)));
    const updatedLine = sorted.find((s) => s.sourceTimestamp)?.sourceTimestamp;

    const liveInsight: DieselRouteInsight = {
      ...demoInsight,
      baselineAveragePerGal,
      bofNetworkStop: mk(bofRaw, "live-bof", cheapestPrice),
      cheapestIn50: mk(cheapestRaw, "live-cheapest", cheapestPrice),
      recommended,
      nearbyAlternates,
      estimatedTripGallons,
      estimatedTripSavingsUsdVsBaselineBof,
      bofSavingsCentsPerGalVsBaseline,
      cheapestVsBofPerGal,
      dataSourceNote: `Live diesel prices via TomTom nearbySearch + fuelPrice (${liveFuel.fuelPriceIds.length} fuelPrice id(s)).${currencySet.length ? ` Currency: ${currencySet.join(", ")}.` : ""}${updatedLine ? ` Last update sample: ${updatedLine}.` : ""}`,
    };
    return liveInsight;
  }, [demoInsight, liveFuel]);

  if (!insight) return null;

  const compact = variant === "compact";
  const shipper = variant === "shipper";

  if (shipper) {
    return (
      <section className="diesel-insight diesel-insight--shipper" aria-labelledby={`diesel-ship-${loadId}`}>
        <h2 id={`diesel-ship-${loadId}`} className="diesel-insight-title diesel-insight-title--sm">
          Route fuel insight · Diesel
        </h2>
        <p className="diesel-insight-lane bof-small">
          {insight.laneLabel}
          {insight.hasRoutePolyline ? " · BOF polyline on file" : " · Demo geometry"}
        </p>
        {liveFuel && !liveFuel.live && (
          <p className="diesel-insight-live-unavailable bof-small">
            This view is using BOF&apos;s <strong>demo</strong> diesel numbers until the server is configured
            for live TomTom prices. <strong>Fix:</strong> add environment variable <code className="bof-code">TOMTOM_API_KEY</code>{" "}
            in your deployment (Vercel → Project → Settings → Environment Variables) and redeploy.{" "}
            {liveFuel.reason ? <span>Detail: {liveFuel.reason}</span> : null}
          </p>
        )}
        <div className="diesel-insight-shipper-row">
          <div>
            <p className="diesel-insight-kicker">Estimated BOF savings (demo trip model)</p>
            <p className="diesel-insight-big">
              {fmtUsd(insight.estimatedTripSavingsUsdVsBaselineBof)}{" "}
              <span className="diesel-insight-subbig">
                {fmtDeltaVsAvgCpg(insight.bofSavingsCentsPerGalVsBaseline)}
              </span>
            </p>
          </div>
          <div className="diesel-insight-shipper-cols">
            <p className="bof-muted bof-small">
              <strong className="diesel-insight-teal">BOF</strong> {insight.bofNetworkStop.name.slice(0, 48)}
              {insight.bofNetworkStop.name.length > 48 ? "…" : ""} · ${insight.bofNetworkStop.dieselPricePerGal.toFixed(3)}
            </p>
            <p className="bof-muted bof-small">
              <strong>Lowest ≤50 mi</strong> · ${insight.cheapestIn50.dieselPricePerGal.toFixed(3)} ·{" "}
              {insight.cheapestIn50.distanceMiles} mi
            </p>
          </div>
        </div>
        <p className="diesel-insight-foot bof-muted bof-small">{insight.dataSourceNote}</p>
      </section>
    );
  }

  return (
    <section
      className={compact ? "diesel-insight diesel-insight--compact" : "diesel-insight"}
      aria-labelledby={`diesel-insight-${loadId}`}
    >
      <div className="diesel-insight-header">
        <h2 id={`diesel-insight-${loadId}`} className="diesel-insight-title">
          Route fuel insight · <span className="diesel-insight-teal">Diesel</span>
        </h2>
        <p className="diesel-insight-eyebrow">BOF Fuel Advantage</p>
      </div>
      <p className="diesel-insight-lane bof-small">
        {insight.laneLabel}
        <span className="diesel-insight-muted">
          {insight.hasRoutePolyline ? " · Route polyline on file" : " · Straight-line demo route context"}
        </span>
      </p>
      {liveFuel && !liveFuel.live && (
        <p className="diesel-insight-live-unavailable bof-small">
          <strong>Demo mode:</strong> live TomTom diesel is off. Set server env{" "}
          <code className="bof-code">TOMTOM_API_KEY</code> (Vercel) to enable the live scan.{" "}
          {liveFuel.reason ? <span>Detail: {liveFuel.reason}</span> : null}
        </p>
      )}

      <div className="diesel-insight-savings" role="status">
        <p className="diesel-insight-savings-label">Estimated BOF savings this trip</p>
        <p className="diesel-insight-savings-value">{fmtUsd(insight.estimatedTripSavingsUsdVsBaselineBof)} total</p>
        <p className="diesel-insight-savings-delta">
          {fmtDeltaVsAvgCpg(insight.bofSavingsCentsPerGalVsBaseline)} at BOF network stop ·{" "}
          <span className="diesel-insight-muted">~{fmtGal(insight.estimatedTripGallons)} gal trip model</span>
        </p>
      </div>

      <div className="diesel-insight-hero">
        <StopBadge tone="rec">Recommended</StopBadge>
        <p className="diesel-insight-hero-name">{insight.recommended.name}</p>
        <dl className="diesel-insight-hero-metrics">
          <div>
            <dt>Diesel</dt>
            <dd>${insight.recommended.dieselPricePerGal.toFixed(3)}/gal</dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{insight.recommended.distanceMiles} mi</dd>
          </div>
          <div>
            <dt>ETA</dt>
            <dd>~{insight.recommended.etaMinutes} min</dd>
          </div>
        </dl>
        <p className="diesel-insight-reason bof-small">{insight.recommended.reason}</p>
      </div>

      <div className={compact ? "diesel-insight-pair diesel-insight-pair--stack" : "diesel-insight-pair"}>
        <StopRow
          label="Nearest BOF discount diesel"
          s={insight.bofNetworkStop}
          badges={<StopBadge tone="bof">BOF network</StopBadge>}
        />
        <StopRow
          label="Cheapest diesel ≤50 mi"
          s={insight.cheapestIn50}
          badges={
            insight.cheapestIn50.isBofNetwork ? (
              <StopBadge tone="cheap">Same as BOF</StopBadge>
            ) : (
              <StopBadge tone="cheap">Low scan</StopBadge>
            )
          }
        />
      </div>

      {!compact && insight.nearbyAlternates.length > 0 && (
        <div className="diesel-insight-alt">
          <h3 className="diesel-insight-subtitle">
            Nearby options {liveFuel?.live ? "(live)" : "(demo)"}
          </h3>
          <ul className="diesel-insight-alt-list">
            {insight.nearbyAlternates.map((s) => (
              <li key={s.key} className="diesel-insight-alt-li">
                <span className="diesel-insight-alt-name">{s.name}</span>
                <span className="diesel-insight-alt-meta">
                  ${s.dieselPricePerGal.toFixed(3)} · {s.distanceMiles} mi · ~{s.etaMinutes} min
                  {s.isBofNetwork ? " · BOF" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="diesel-insight-foot bof-muted bof-small">{insight.dataSourceNote}</p>
    </section>
  );
}
