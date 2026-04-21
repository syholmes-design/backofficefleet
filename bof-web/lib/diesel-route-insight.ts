/**
 * Route-aware diesel pricing insight (demo).
 * Anchors stops to `buildRouteSupportModel` (same lane / distances / ETAs as route support).
 * Dollar and ¢/gal values are illustrative until a live fuel-price API is integrated.
 */
import type { BofData } from "./load-bof-data";
import { buildRouteSupportModel, type RouteSupportStop } from "./route-support";

export type DieselStopInsight = {
  key: string;
  name: string;
  distanceMiles: number;
  etaMinutes: number;
  /** Demo rack-style diesel $/gal at the pump */
  dieselPricePerGal: number;
  isBofNetwork: boolean;
  /** True when this row is the lowest $/gal among candidates within 50 mi */
  isCheapestInRadius: boolean;
};

export type DieselRouteInsight = {
  loadId: string;
  /** BOF-backed: load origin → destination */
  laneLabel: string;
  hasRoutePolyline: boolean;
  /** Mean $/gal of all candidate stops within 50 mi (demo pricing) — "nearby baseline" */
  baselineAveragePerGal: number;
  /** Route primary with BOF network discount applied in demo pricing */
  bofNetworkStop: DieselStopInsight;
  /** Lowest $/gal within 50 mi (may differ from BOF stop) */
  cheapestIn50: DieselStopInsight;
  /** Single operational recommendation (usually lowest out-of-pocket; BOF when within tolerance) */
  recommended: DieselStopInsight & { reason: string };
  /** Other stops in radius for comparison rows (excludes recommended duplicate) */
  nearbyAlternates: DieselStopInsight[];
  /** Demo trip gallons — keyed to load id + revenue scale, not telematics */
  estimatedTripGallons: number;
  /** (baselineAvg − BOF price) × gallons — "BOF Fuel Advantage" trip line */
  estimatedTripSavingsUsdVsBaselineBof: number;
  /** BOF vs baseline, cents per gallon (positive = BOF below average) */
  bofSavingsCentsPerGalVsBaseline: number;
  /** cheapest − BOF (negative $/gal means cheapest is lower price than BOF) */
  cheapestVsBofPerGal: number;
  dataSourceNote: string;
};

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function roundMoney(n: number, decimals: number) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

function stopsToCandidates(rs: { primary: RouteSupportStop; upcoming: RouteSupportStop[] }) {
  return [rs.primary, ...rs.upcoming].filter((s) => s.distanceMiles <= 50);
}

/**
 * Demo trip gallons: base tank draw scaled lightly by linehaul revenue and load-id hash.
 * Not MPG or actual purchased gallons — replace with fuel-plan integration later.
 */
export function estimateDemoTripGallons(loadId: string, linehaulRevenue: number): number {
  const h = hashSeed(loadId);
  const fromRev = Math.round(linehaulRevenue / 4200);
  const g = 78 + (h % 38) + Math.min(45, fromRev);
  return Math.min(175, Math.max(82, g));
}

/**
 * Builds diesel insight for a load. Returns null if load missing.
 */
export function buildDieselRouteInsight(data: BofData, loadId: string): DieselRouteInsight | null {
  const load = data.loads.find((l) => l.id === loadId);
  const rs = buildRouteSupportModel(data, loadId, { includeCheaperFuelNote: false });
  if (!load || !rs) return null;

  const h = hashSeed(loadId);
  const rack = roundMoney(3.52 + (h % 18) * 0.009, 3);

  const raw = stopsToCandidates(rs);
  if (raw.length === 0) {
    return null;
  }

  const priceOffsets = [
    -(0.1 + (h % 5) * 0.014),
    0.045 + (h % 4) * 0.008,
    -(0.035 + (h % 6) * 0.012),
    0.028 + (h % 3) * 0.006,
  ];

  const priced: DieselStopInsight[] = raw.map((s, i) => {
    const off = priceOffsets[i % priceOffsets.length] ?? 0;
    const dieselPricePerGal = roundMoney(Math.max(2.85, rack + off), 3);
    return {
      key: i === 0 ? "bof-primary" : `up-${i}`,
      name: s.name,
      distanceMiles: s.distanceMiles,
      etaMinutes: s.etaMinutes,
      dieselPricePerGal,
      isBofNetwork: i === 0,
      isCheapestInRadius: false,
    };
  });

  const minPrice = Math.min(...priced.map((p) => p.dieselPricePerGal));
  for (const p of priced) {
    p.isCheapestInRadius = p.dieselPricePerGal <= minPrice + 0.0001;
  }

  const bofNetworkStop = priced.find((p) => p.isBofNetwork) ?? priced[0]!;
  const cheapestIn50 = priced.reduce((a, b) => (a.dieselPricePerGal <= b.dieselPricePerGal ? a : b));

  const baselineAveragePerGal = roundMoney(
    priced.reduce((s, p) => s + p.dieselPricePerGal, 0) / priced.length,
    3
  );

  const cheapestVsBofPerGal = roundMoney(cheapestIn50.dieselPricePerGal - bofNetworkStop.dieselPricePerGal, 3);

  /** Recommend BOF when within ~0.8 ¢/gal of cheapest (network controls / billing), else absolute cheapest */
  const bofCloseEnough = cheapestVsBofPerGal >= -0.008;
  const recommendedBase = bofCloseEnough ? bofNetworkStop : cheapestIn50;
  const recommended: DieselStopInsight & { reason: string } = {
    ...recommendedBase,
    reason: bofCloseEnough
      ? "BOF contract diesel within tolerance of lowest retail scan — default to network stop for controls and settlement."
      : "Lowest diesel in 50 mi scan is off-network — use for pure pump price; BOF stop remains best contracted option.",
  };

  const nearbyAlternates = priced
    .filter((p) => p.key !== recommendedBase.key)
    .slice(0, 3);

  const estimatedTripGallons = estimateDemoTripGallons(loadId, load.revenue);

  const bofSavingsCentsPerGalVsBaseline = roundMoney(
    (baselineAveragePerGal - bofNetworkStop.dieselPricePerGal) * 100,
    1
  );

  const estimatedTripSavingsUsdVsBaselineBof = roundMoney(
    Math.max(0, baselineAveragePerGal - bofNetworkStop.dieselPricePerGal) * estimatedTripGallons,
    0
  );

  return {
    loadId,
    laneLabel: rs.laneLabel,
    hasRoutePolyline: rs.hasRoutePolyline,
    baselineAveragePerGal,
    bofNetworkStop,
    cheapestIn50,
    recommended,
    nearbyAlternates,
    estimatedTripGallons,
    estimatedTripSavingsUsdVsBaselineBof,
    bofSavingsCentsPerGalVsBaseline,
    cheapestVsBofPerGal,
    dataSourceNote:
      "Diesel $/gal, corridor baseline, trip gallons, and savings are demo calculations from this load id and BOF route-support geometry — not live OPIS/rack or pump reads.",
  };
}
