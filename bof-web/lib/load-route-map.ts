import type { BofData } from "./load-bof-data";
import { formatUsd } from "./format-money";
import {
  getLoadProofItems,
  proofBlockingCount,
  proofStatusDisplay,
} from "./load-proof";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelRowForLoad,
  loadShowsRfPanel,
} from "./rfid-intelligence";
import {
  coordsForLoadRoute,
  interpolateAlongRoute,
  jitterLatLng,
} from "./load-route-geo";

export type MapMarkerTier = "on_time" | "at_risk" | "issue" | "rfid_verified";

export type LoadRouteMapMarker = {
  id: string;
  lat: number;
  lng: number;
  tier: MapMarkerTier;
  label: string;
  lines: string[];
};

export type LoadRouteMapModel = {
  loadId: string;
  loadNumber: string;
  originLabel: string;
  destLabel: string;
  line: [number, number][];
  markers: LoadRouteMapMarker[];
};

function proofLine(
  items: ReturnType<typeof getLoadProofItems>,
  type: string
): string {
  const p = items.find((x) => x.type === type);
  if (!p) return `${type}: —`;
  const pay = p.blocksPayment ? " · blocks pay" : "";
  const risk = p.disputeExposure ? " · risk" : "";
  return `${type}: ${proofStatusDisplay(p.status)}${pay}${risk}`;
}

function primaryNextAction(
  items: ReturnType<typeof getLoadProofItems>
): string {
  const b = items.find((i) => i.blocksPayment);
  if (b?.rfAction) return b.rfAction;
  if (b?.riskNote) return b.riskNote;
  const d = items.find((i) => i.disputeExposure && i.status !== "Complete");
  return d?.rfAction ?? d?.riskNote ?? "Review load proof stack";
}

function moneyLine(
  load: {
    revenue: number;
    dispatchExceptionFlag?: boolean;
    sealStatus?: string;
  },
  blocking: number
): string {
  if (blocking > 0)
    return `${formatUsd(load.revenue)} linehaul at risk until proof clears`;
  if (load.dispatchExceptionFlag || load.sealStatus === "Mismatch")
    return `${formatUsd(load.revenue)} linehaul exposed (exceptions / seals — proof will gate pay)`;
  return `No payment-blocking proof (linehaul ${formatUsd(load.revenue)} reference)`;
}

/** Serialized model for the load route map (Leaflet client). */
export function buildLoadRouteMapModel(
  data: BofData,
  loadId: string
): LoadRouteMapModel | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;

  const { origin: oRaw, destination: dRaw } = coordsForLoadRoute(
    load.origin,
    load.destination
  );
  const line: [number, number][] = [oRaw, dRaw];
  const items = getLoadProofItems(data, load.id);
  const blockCount = proofBlockingCount(items);
  const podOk = load.podStatus === "verified";
  const sealBad = load.sealStatus === "Mismatch";

  const markers: LoadRouteMapMarker[] = [];

  // --- Pickup ---
  let pickupTier: MapMarkerTier = "on_time";
  if (load.status === "Pending") {
    pickupTier = load.dispatchExceptionFlag ? "issue" : "at_risk";
  } else if (sealBad && load.pickupSeal) {
    pickupTier = "at_risk";
  }

  const pickupLines = [
    `Pickup — ${load.origin}`,
    load.status === "Pending"
      ? load.dispatchExceptionFlag
        ? "Status: Delayed / issue (pre-dispatch)"
        : "Status: At risk (pending dispatch)"
      : "Status: On time (pickup complete)",
    proofLine(items, "Pickup Seal Photo"),
    proofLine(items, "BOL"),
    moneyLine(load, blockCount),
    `Next: ${primaryNextAction(items)}`,
  ];
  const pickupPos = jitterLatLng(oRaw[0], oRaw[1], `${load.id}-pickup`);
  markers.push({
    id: "pickup",
    lat: pickupPos[0],
    lng: pickupPos[1],
    tier: pickupTier,
    label: "Pickup",
    lines: pickupLines,
  });

  // --- Delivery ---
  let deliveryTier: MapMarkerTier = "at_risk";
  if (load.status === "Delivered") {
    if (podOk && !sealBad) deliveryTier = "on_time";
    else deliveryTier = "issue";
  } else if (load.status === "En Route") {
    deliveryTier = sealBad || load.dispatchExceptionFlag ? "at_risk" : "on_time";
  }

  const deliveryLines = [
    `Delivery — ${load.destination}`,
    load.status === "Delivered"
      ? podOk && !sealBad
        ? "Status: On time"
        : "Status: Delayed / issue (POD or seals)"
      : load.status === "En Route"
        ? "Status: In transit (at risk if exceptions)"
        : "Status: At risk (not arrived)",
    proofLine(items, "POD"),
    proofLine(items, "Delivery Seal Photo"),
    moneyLine(load, blockCount),
    `Next: ${primaryNextAction(items)}`,
  ];
  const delPos = jitterLatLng(dRaw[0], dRaw[1], `${load.id}-delivery`);
  markers.push({
    id: "delivery",
    lat: delPos[0],
    lng: delPos[1],
    tier: deliveryTier,
    label: "Delivery",
    lines: deliveryLines,
  });

  // --- Current (simulated) ---
  let t = 0.12;
  if (load.status === "En Route") t = 0.58;
  if (load.status === "Delivered") t = 0.98;
  const cur = interpolateAlongRoute(oRaw, dRaw, t);
  const curJ = jitterLatLng(cur[0], cur[1], `${load.id}-current`);

  let curTier: MapMarkerTier = "on_time";
  if (blockCount > 0 || (load.status === "Delivered" && !podOk) || sealBad)
    curTier = "issue";
  else if (load.dispatchExceptionFlag || load.status === "Pending")
    curTier = "at_risk";

  const curLines = [
    "Current position (simulated along lane)",
    `Load status: ${load.status} · POD: ${load.podStatus} · Seals: ${load.sealStatus}`,
    proofLine(items, "POD"),
    proofLine(items, "Claim Support Docs"),
    moneyLine(load, blockCount),
    `Next: ${primaryNextAction(items)}`,
  ];
  markers.push({
    id: "current",
    lat: curJ[0],
    lng: curJ[1],
    tier: curTier,
    label: "Current",
    lines: curLines,
  });

  // --- Delay / issue checkpoint (optional) ---
  if (load.dispatchExceptionFlag && load.status === "En Route") {
    const p = interpolateAlongRoute(oRaw, dRaw, 0.4);
    const pj = jitterLatLng(p[0], p[1], `${load.id}-delay`);
    markers.push({
      id: "delay",
      lat: pj[0],
      lng: pj[1],
      tier: "issue",
      label: "Delay point",
      lines: [
        "Operational exception checkpoint (demo)",
        "Dispatch exception flag set while en route",
        moneyLine(load, blockCount),
        `Next: ${primaryNextAction(items)}`,
      ],
    });
  }

  // --- RFID checkpoint (verification, not full tracking) ---
  if (loadShowsRfPanel(data, load.id)) {
    const rf = interpolateAlongRoute(oRaw, dRaw, 0.72);
    const rfj = jitterLatLng(rf[0], rf[1], `${load.id}-rfid`);
    const fuel = buildRfidFuelRowForLoad(data, load.id);
    const dock = buildRfidDockRowForLoad(data, load.id);
    const dockArrival = dock?.trailerConfirmedAtDock ? "Yes" : "Pending";
    const fuelVal = fuel?.unauthorizedFuelingFlag
      ? "Review — exception proxy"
      : fuel?.routeCheckpointMatch
        ? "Checkpoint aligned (attribution)"
        : "Validate route vs RFID reads";

    markers.push({
      id: "rfid",
      lat: rfj[0],
      lng: rfj[1],
      tier: "rfid_verified",
      label: "RFID checkpoint",
      lines: [
        "RFID = verification & attribution — not GPS fleet tracking",
        `Dock arrival (RFID proxy): ${dockArrival}`,
        `Fueling validation: ${fuelVal}`,
        `Lumper / dock workflow: ${dock?.lumperWorkflowStatus ?? "—"}`,
        dock?.receiptStillRequired
          ? "Receipt/photo still required where policy applies"
          : "Supporting docs: match RFID timestamps to POD/BOL",
        `Next: ${dock?.nextAction ?? fuel?.nextAction ?? "Confirm dock handoff"}`,
      ],
    });
  }

  return {
    loadId: load.id,
    loadNumber: load.number,
    originLabel: load.origin,
    destLabel: load.destination,
    line,
    markers,
  };
}
