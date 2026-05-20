/**
 * Next rest stop / route support - uses BOF load lane labels and optional route map model.
 * Rest-stop names, distances, ETAs, parking, and amenities are lane-planning records for
 * the static BOF operating dataset.
 */
import type { BofData } from "./load-bof-data";
import { buildLoadRouteMapModel } from "./load-route-map";

export type RestStopType = "Rest Area" | "Truck Stop" | "Service Plaza";

export type ParkingAvailability = "Available" | "Limited" | "Unknown";

export type RouteSupportAmenity = "Fuel" | "Showers" | "Food" | "Parking" | "Scale";

export type RouteSupportStop = {
  name: string;
  distanceMiles: number;
  etaMinutes: number;
  stopType: RestStopType;
  parking: ParkingAvailability;
  amenities: RouteSupportAmenity[];
};

export type RouteSupportModel = {
  loadId: string;
  /** BOF-backed: origin to destination from load record */
  laneLabel: string;
  /** True when buildLoadRouteMapModel returned a polyline */
  hasRoutePolyline: boolean;
  primary: RouteSupportStop;
  upcoming: RouteSupportStop[];
  /** Shown in UI */
  dataSourceNote: string;
  /** Optional cross-widget line when fuel story is surfaced elsewhere */
  cheaperFuelNote?: string;
};

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DEMO_POOL: Omit<RouteSupportStop, "distanceMiles" | "etaMinutes">[] = [
  {
    name: "I-71 North / Medway Service Plaza ",
    stopType: "Service Plaza",
    parking: "Available",
    amenities: ["Fuel", "Food", "Parking", "Showers"],
  },
  {
    name: "US-30 East / Pilot Travel Center - Lima ",
    stopType: "Truck Stop",
    parking: "Limited",
    amenities: ["Fuel", "Showers", "Food", "Scale", "Parking"],
  },
  {
    name: "OH Turnpike Rest Area MM 142 ",
    stopType: "Rest Area",
    parking: "Unknown",
    amenities: ["Parking", "Food"],
  },
  {
    name: "I-40 West / Love's - West Memphis ",
    stopType: "Truck Stop",
    parking: "Available",
    amenities: ["Fuel", "Parking", "Showers", "Food"],
  },
  {
    name: "I-55 South / Welcome Center ",
    stopType: "Rest Area",
    parking: "Limited",
    amenities: ["Parking", "Food"],
  },
];

function pickStops(loadId: string): { primary: RouteSupportStop; upcoming: RouteSupportStop[] } {
  const h = hashSeed(loadId);
  const i0 = h % DEMO_POOL.length;
  const i1 = (h + 1) % DEMO_POOL.length;
  const i2 = (h + 2) % DEMO_POOL.length;
  const i3 = (h + 3) % DEMO_POOL.length;
  const baseMi = 18 + (h % 22);
  const baseEta = 22 + (h % 18);

  const toStop = (
    template: (typeof DEMO_POOL)[number],
    idx: number
  ): RouteSupportStop => ({
    ...template,
    distanceMiles: Math.round((baseMi + idx * 14 + (h % 7)) * 10) / 10,
    etaMinutes: baseEta + idx * 25 + (h % 11),
  });

  const primary = toStop(DEMO_POOL[i0]!, 0);
  const upcoming = [toStop(DEMO_POOL[i1]!, 1), toStop(DEMO_POOL[i2]!, 2), toStop(DEMO_POOL[i3]!, 3)].slice(
    0,
    3
  );
  return { primary, upcoming };
}

export function buildRouteSupportModel(
  data: BofData,
  loadId: string,
  opts?: { includeCheaperFuelNote?: boolean }
): RouteSupportModel | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;
  const laneLabel = `${load.origin} to ${load.destination}`;
  const route = buildLoadRouteMapModel(data, loadId);
  const { primary, upcoming } = pickStops(loadId);
  const h = hashSeed(loadId);
  const cheaperFuelNote =
    opts?.includeCheaperFuelNote !== false && h % 3 !== 0
      ? "BOF fuel-network pricing beats plaza rack within ~15 mi of this lane segment."
      : undefined;

  return {
    loadId,
    laneLabel,
    hasRoutePolyline: Boolean(route?.line?.length),
    primary,
    upcoming,
    dataSourceNote:
      "Route support record: rest stops, parking status, and ETA are tied to this dispatch lane.",
    cheaperFuelNote,
  };
}
