import type {
  ComplianceStatus,
  Driver,
  Load,
  LoadProofEvent,
  LoadStatus,
  ProofStatus,
  RouteStatus,
  SealStatus,
  Tractor,
  Trailer,
} from "@/types/dispatch";
import { getBofData, type BofData } from "@/lib/load-bof-data";
import { getBackhaulLoadSignals } from "@/lib/backhaul-opportunity-engine";
import { getGeneratedLoadDocEntry } from "@/lib/load-doc-manifest";
import { getLoadEvidenceUrl } from "@/lib/load-documents";
import { coordsForLoadRoute, interpolateAlongRoute } from "@/lib/load-route-geo";

/** Static demo PDFs from `public/mocks/` — only used when generated HTML docs are absent. */
export const MOCK_DOC_URLS = {
  rate_con: "/mocks/mock_rate_con.pdf",
  bol: "/mocks/mock_bol.pdf",
  invoice: "/mocks/mock_invoice.pdf",
} as const;

/**
 * First three workbook loads (PRO 501–503 / ids L001–L003) use signed PDFs from
 * `public/actual_docs/` — browser paths `/actual_docs/…` only.
 */
const ACTUAL_SIGNED_RATE_AND_BOL: Record<
  string,
  { rate_con_url: string; bol_url: string }
> = {
  L001: {
    rate_con_url: "/actual_docs/Rate_Confirmation_L-501_Signed.pdf",
    bol_url: "/actual_docs/BOL_L-501_Signed.pdf",
  },
  L002: {
    rate_con_url: "/actual_docs/Rate_Confirmation_L-502_Signed.pdf",
    bol_url: "/actual_docs/BOL_L-502_Signed.pdf",
  },
  L003: {
    rate_con_url: "/actual_docs/Rate_Confirmation_L-503_Signed.pdf",
    bol_url: "/actual_docs/BOL_L-503_Signed.pdf",
  },
};

type DemoDriver = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  referenceCdlNumber?: string;
};

type DemoLoad = {
  id: string;
  number: string;
  driverId: string;
  assetId: string;
  origin: string;
  destination: string;
  revenue: number;
  status: string;
  podStatus: string;
  pickupSeal?: string;
  deliverySeal?: string;
  sealStatus: string;
  dispatchExceptionFlag: boolean;
  dispatchOpsNotes?: string;
  masterAgreementId?: string;
  masterAgreementDate?: string;
  workOrderId?: string;
};

function mapDemoStatusToLoadStatus(
  status: string,
  hasDriver: boolean
): LoadStatus {
  const s = status.trim();
  if (s === "Delivered") return "Delivered";
  if (s === "En Route") return "In Transit";
  if (s === "Pending") return hasDriver ? "Assigned" : "Planned";
  return hasDriver ? "Assigned" : "Planned";
}

function mapProof(pod: string): ProofStatus {
  const p = pod.toLowerCase();
  if (p === "verified") return "Complete";
  if (p === "pending") return "Incomplete";
  return "Missing";
}

function mapSeal(seal: string): SealStatus {
  const u = seal.toUpperCase();
  if (u === "OK") return "Match";
  if (u === "MISMATCH") return "Mismatch";
  return "Missing";
}

function customerFromLane(origin: string): string {
  const part = origin.split(" - ")[0]?.trim() || origin;
  return part.length > 48 ? `${part.slice(0, 45)}…` : part;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 16);
}

function trailerIdForTractor(tractorId: string | null): string | null {
  if (!tractorId) return null;
  const n = parseInt(tractorId.replace(/^T-/, ""), 10);
  if (Number.isNaN(n)) return null;
  return `TR-${100 + n}`;
}

function laneCityLabel(lane: string): string {
  const parts = lane.split(" - ").map((x) => x.trim());
  return parts[parts.length - 1] || lane;
}

function routeStatusForLoad(st: LoadStatus, hasRisk: boolean): RouteStatus {
  if (st === "Delivered") return "delivered";
  if (st === "In Transit") return hasRisk ? "at_risk" : "in_transit";
  if (st === "Exception") return "delayed";
  if (st === "Dispatched" || st === "Assigned") return "dispatched";
  return "scheduled";
}

function routeMilesBetween(
  origin: [number, number],
  destination: [number, number]
): number {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const miles = 3958.8 * c;
  return Math.max(25, Math.round(miles));
}

function routeProgressForStatus(st: LoadStatus, idx: number): number {
  if (st === "Delivered") return 100;
  if (st === "In Transit") return 35 + ((idx * 17) % 45);
  if (st === "Exception") return 28 + ((idx * 11) % 40);
  if (st === "Dispatched" || st === "Assigned") return 6 + (idx % 10);
  return 0;
}

function homeTerminalFromAddress(addr: string): string | undefined {
  const parts = addr.split(",").map((p) => p.trim());
  if (parts.length < 3) return undefined;
  const city = parts[parts.length - 2];
  const stateZip = parts[parts.length - 1].split(/\s+/);
  const state = stateZip[0];
  if (!city || !state) return undefined;
  return `${city}, ${state}`;
}

/** Demo-only storyline: ready packet (L003), incomplete (L002), claim / exception (L001). */
/** When demo load is in claim / exception workflow, hydrate dispatch URL stamps from manifests so readiness matches trip packet rows. */
function hydrateClaimUrlsForDemoLoad(l: DemoLoad, load: Load): Partial<Load> {
  const claimWorkflow =
    Boolean(l.dispatchExceptionFlag) ||
    (String(l.status) === "Delivered" &&
      String(l.sealStatus).toUpperCase() === "MISMATCH");
  if (!claimWorkflow) return {};
  const gen = getGeneratedLoadDocEntry(l.id);
  const damagePacket = gen.damagePhotoPacket;
  const damage =
    getLoadEvidenceUrl(l.id, "damagePhoto") ||
    getLoadEvidenceUrl(l.id, "cargoDamagePhoto") ||
    (typeof damagePacket === "string" && /\.(png|jpe?g|webp|gif)$/i.test(damagePacket)
      ? damagePacket
      : undefined);
  const supporting =
    getLoadEvidenceUrl(l.id, "claimEvidence") || gen.bol || load.supporting_attachment_url;
  return {
    claim_form_url: gen.claimPacket ?? load.claim_form_url,
    damage_photo_url: damage ?? load.damage_photo_url,
    supporting_attachment_url: supporting ?? load.supporting_attachment_url,
  };
}

function applyDocumentationDemos(load: Load, l: DemoLoad): Load {
  if (l.id === "L002") {
    return {
      ...load,
      proof_status: "Incomplete",
      pod_url: undefined,
      delivery_photo_url: undefined,
      cargo_photo_url: undefined,
      seal_photo_url: undefined,
      lumper_receipt_required: true,
      lumper_photo_url: undefined,
      settlement_hold: true,
      settlement_hold_reason:
        "Shipper packet incomplete — POD, seal documentation, and cargo proof outstanding.",
    };
  }
  if (l.id === "L003") {
    return {
      ...load,
      lumper_receipt_required: true,
      lumper_photo_url: getLoadEvidenceUrl(l.id, "lumperReceipt"),
    };
  }
  if (l.id === "L001") {
    const gen = getGeneratedLoadDocEntry(l.id);
    return {
      ...load,
      lumper_receipt_required: false,
      claim_form_url: gen.claimPacket,
      damage_photo_url: getLoadEvidenceUrl(l.id, "damagePhoto"),
      supporting_attachment_url: gen.bol ?? load.supporting_attachment_url,
    };
  }
  return {
    ...load,
    lumper_receipt_required: load.lumper_receipt_required ?? false,
  };
}

function proofMediaUrlsForLoad(
  loadId: string,
  proof: ProofStatus,
  idx: number,
  generated: ReturnType<typeof getGeneratedLoadDocEntry>
): Pick<
  Load,
  | "pod_url"
  | "pickup_photo_url"
  | "delivery_photo_url"
  | "lumper_photo_url"
> {
  const pickup = getLoadEvidenceUrl(loadId, "pickupPhoto");
  const delivery = getLoadEvidenceUrl(loadId, "deliveryPhoto");
  const lumper = getLoadEvidenceUrl(loadId, "lumperReceipt");
  const pod = generated.pod;
  if (proof === "Complete") {
    return {
      pod_url: pod,
      pickup_photo_url: pickup,
      delivery_photo_url: delivery,
      lumper_photo_url: idx % 3 === 0 ? getLoadEvidenceUrl(loadId, "sealPhoto") : lumper,
    };
  }
  if (proof === "Incomplete") {
    return {
      pod_url: pod,
      pickup_photo_url: pickup,
      delivery_photo_url: undefined,
      lumper_photo_url: undefined,
    };
  }
  return {
    pod_url: pod,
    pickup_photo_url: pickup,
    delivery_photo_url: delivery,
    lumper_photo_url: lumper,
  };
}

/**
 * Build dispatch `Load[]` from demo-shaped load rows (same mapping as static seed).
 * Used by the dispatch store and by the shipper portal so readiness stays aligned.
 */
export function buildDispatchLoadsFromDemoLoads(loads: DemoLoad[]): Load[] {
  const backhaulSignals = getBackhaulLoadSignals();
  return loads.map((l, idx) => {
    const base = new Date();
    base.setDate(base.getDate() + idx - 4);
    const pickup = new Date(base);
    const delivery = new Date(base);
    delivery.setDate(delivery.getDate() + 2);

    const st = mapDemoStatusToLoadStatus(l.status, Boolean(l.driverId));
    const signedDocs = ACTUAL_SIGNED_RATE_AND_BOL[l.id];
    const generatedDocs = getGeneratedLoadDocEntry(l.id);
    const proof_status: ProofStatus = signedDocs
      ? "Complete"
      : mapProof(l.podStatus);
    const settlement_hold =
      l.id === "L001" ||
      (l.podStatus === "pending" && l.status === "Delivered") ||
      false;
    const bh = (l as { backhaulPay?: number }).backhaulPay ?? 0;
    const tractor_id = l.assetId || null;
    const trailer_id = trailerIdForTractor(tractor_id);
    const laneOrigin = laneCityLabel(l.origin);
    const laneDestination = laneCityLabel(l.destination);
    const coords = coordsForLoadRoute(laneOrigin, laneDestination);
    const hasRouteRisk =
      l.dispatchExceptionFlag ||
      l.sealStatus === "Mismatch" ||
      (st === "Delivered" && proof_status !== "Complete");
    const routeStatus = routeStatusForLoad(st, hasRouteRisk);
    const routeProgressPct = routeProgressForStatus(st, idx);
    const routeMiles = routeMilesBetween(coords.origin, coords.destination);
    const currentPoint = interpolateAlongRoute(
      coords.origin,
      coords.destination,
      routeProgressPct / 100
    );
    const eta =
      routeStatus === "delivered"
        ? undefined
        : routeStatus === "in_transit" ||
            routeStatus === "at_risk" ||
            routeStatus === "delayed"
          ? isoDate(delivery)
          : isoDate(new Date(pickup.getTime() + 6 * 60 * 60 * 1000));
    const actualDeliveryTime =
      routeStatus === "delivered" ? isoDate(delivery) : undefined;

    const row: Load = {
      load_id: l.id,
      customer_name: customerFromLane(l.origin),
      origin: l.origin,
      destination: l.destination,
      pickup_datetime: isoDate(pickup),
      delivery_datetime: isoDate(delivery),
      status: st,
      driver_id: l.driverId || null,
      tractor_id,
      trailer_id,
      dispatcher_name:
        idx % 3 === 0 ? "M. Torres" : idx % 3 === 1 ? "J. Okonkwo" : "R. Singh",
      dispatch_notes: l.dispatchOpsNotes,

      proof_status,
      seal_status: mapSeal(l.sealStatus),
      exception_flag: Boolean(l.dispatchExceptionFlag),
      exception_reason: l.dispatchExceptionFlag
        ? "Dispatch / seal discrepancy — review proof stack"
        : undefined,
      settlement_hold,
      settlement_hold_reason: settlement_hold
        ? "Proof or seal validation incomplete for finance release"
        : undefined,
      total_pay: l.revenue + bh,
      insurance_claim_needed:
        Boolean(l.dispatchExceptionFlag) &&
        (l.sealStatus === "Mismatch" || l.podStatus === "pending"),

      pickup_seal_number: l.pickupSeal || undefined,
      delivery_seal_number: l.deliverySeal || undefined,

      rate_con_url:
        generatedDocs.rateConfirmation ?? signedDocs?.rate_con_url ?? MOCK_DOC_URLS.rate_con,
      bol_url: generatedDocs.bol ?? signedDocs?.bol_url ?? MOCK_DOC_URLS.bol,
      pod_url: generatedDocs.pod,
      invoice_url: generatedDocs.invoice ?? MOCK_DOC_URLS.invoice,
      equipment_photo_url: getLoadEvidenceUrl(l.id, "equipmentPhoto"),
      cargo_photo_url: getLoadEvidenceUrl(l.id, "cargoPhoto"),
      seal_photo_url: getLoadEvidenceUrl(l.id, "sealPhoto"),

      ...proofMediaUrlsForLoad(l.id, proof_status, idx, generatedDocs),

      rfid_tag_id: `RFID-${l.id}`,
      destinationMarket: backhaulSignals[l.id]?.destinationMarket,
      nextKnownPickupMarket: backhaulSignals[l.id]?.nextKnownPickupMarket ?? null,
      estimatedDeadheadMiles: backhaulSignals[l.id]?.estimatedDeadheadMiles,
      backhaulScanStatus: backhaulSignals[l.id]?.backhaulScanStatus ?? "not_scanned",
      backhaulOpportunityId: backhaulSignals[l.id]?.backhaulOpportunityId,
      backhaulRecommended: backhaulSignals[l.id]?.backhaulRecommended ?? false,
      pickupLat: coords.origin[0],
      pickupLng: coords.origin[1],
      deliveryLat: coords.destination[0],
      deliveryLng: coords.destination[1],
      currentLat:
        routeStatus === "in_transit" ||
        routeStatus === "at_risk" ||
        routeStatus === "delayed"
          ? currentPoint[0]
          : undefined,
      currentLng:
        routeStatus === "in_transit" ||
        routeStatus === "at_risk" ||
        routeStatus === "delayed"
          ? currentPoint[1]
          : undefined,
      routeStatus,
      routeProgressPct,
      eta,
      actualDeliveryTime,
      currentLocationLabel:
        routeStatus === "in_transit" ||
        routeStatus === "at_risk" ||
        routeStatus === "delayed"
          ? "Demo tracking position - derived from route progress"
          : routeStatus === "delivered"
            ? laneDestination
            : laneOrigin,
      nextStopLabel:
        routeStatus === "delivered"
          ? "Route complete"
          : routeStatus === "scheduled" || routeStatus === "dispatched"
            ? `Pickup - ${laneOrigin}`
            : `Delivery - ${laneDestination}`,
      routeMiles,
      deadheadMiles: backhaulSignals[l.id]?.estimatedDeadheadMiles,
    };

    const seeded = applyDocumentationDemos(row, l);
    const withDocs = {
      ...seeded,
      rate_con_url:
        generatedDocs.rateConfirmation ?? seeded.rate_con_url ?? signedDocs?.rate_con_url,
      bol_url: generatedDocs.bol ?? seeded.bol_url ?? signedDocs?.bol_url,
      pod_url: generatedDocs.pod ?? seeded.pod_url,
      invoice_url: generatedDocs.invoice ?? seeded.invoice_url,
      claim_form_url: generatedDocs.claimPacket ?? seeded.claim_form_url,
      lumper_photo_url: generatedDocs.lumperReceipt ?? seeded.lumper_photo_url,
    };
    const withClaim = { ...withDocs, ...hydrateClaimUrlsForDemoLoad(l, withDocs) };
    const proofEvents: LoadProofEvent[] = [
      {
        id: `${l.id}-pickup-proof`,
        loadId: l.id,
        type: "pickup",
        label: "Pickup geofence entered",
        lat: coords.origin[0],
        lng: coords.origin[1],
        timestamp: withClaim.pickup_datetime,
        status: withClaim.pickup_photo_url ? "ready" : "pending",
        documentUrl: withClaim.pickup_photo_url,
      },
      {
        id: `${l.id}-seal-proof`,
        loadId: l.id,
        type: "seal",
        label: "Seal photo captured",
        lat: coords.origin[0] + 0.04,
        lng: coords.origin[1] + 0.04,
        timestamp: withClaim.pickup_datetime,
        status: withClaim.seal_photo_url ? "ready" : "pending",
        documentUrl: withClaim.seal_photo_url,
      },
      {
        id: `${l.id}-rfid-proof`,
        loadId: l.id,
        type: "rfid",
        label: "RFID checkpoint validated",
        lat: (coords.origin[0] + coords.destination[0]) / 2,
        lng: (coords.origin[1] + coords.destination[1]) / 2,
        timestamp: withClaim.delivery_datetime,
        status: withClaim.rfid_tag_id ? "ready" : "pending",
      },
      {
        id: `${l.id}-delivery-proof`,
        loadId: l.id,
        type: "delivery",
        label: "Delivery geofence entered",
        lat: coords.destination[0],
        lng: coords.destination[1],
        timestamp: withClaim.delivery_datetime,
        status: withClaim.delivery_photo_url ? "ready" : "pending",
        documentUrl: withClaim.delivery_photo_url,
      },
      {
        id: `${l.id}-pod-proof`,
        loadId: l.id,
        type: "pod",
        label: "POD uploaded",
        lat: coords.destination[0] + 0.03,
        lng: coords.destination[1] - 0.03,
        timestamp: withClaim.delivery_datetime,
        status: withClaim.pod_url ? "ready" : "pending",
        documentUrl: withClaim.pod_url,
      },
    ];
    if (withClaim.claim_form_url || withClaim.damage_photo_url) {
      proofEvents.push({
        id: `${l.id}-claim-proof`,
        loadId: l.id,
        type: "claim",
        label: "Claim photo captured",
        lat: coords.destination[0] - 0.04,
        lng: coords.destination[1] + 0.04,
        timestamp: withClaim.delivery_datetime,
        status: withClaim.claim_form_url ? "exception" : "pending",
        documentUrl: withClaim.claim_form_url ?? withClaim.damage_photo_url,
      });
    }
    return {
      ...withClaim,
      proofEvents,
    };
  });
}

export function buildDispatchLoadsFromBofData(data: BofData): Load[] {
  return buildDispatchLoadsFromDemoLoads((data.loads ?? []) as DemoLoad[]);
}

export function createSeedLoads(): Load[] {
  const demoData = getBofData();
  return buildDispatchLoadsFromDemoLoads((demoData.loads ?? []) as DemoLoad[]);
}

function complianceForDriverId(driverId: string): ComplianceStatus {
  if (driverId === "DRV-004") return "EXPIRING_SOON";
  if (driverId === "DRV-008") return "EXPIRED";
  return "VALID";
}

export function createSeedDrivers(): Driver[] {
  const demoData = getBofData();
  const drivers = (demoData.drivers ?? []) as DemoDriver[];
  return drivers.map((d) => {
    const c = complianceForDriverId(d.id);
    return {
      driver_id: d.id,
      name: d.name,
      status: d.id === "DRV-012" ? "Inactive" : "Active",
      compliance_status: c,
      phone: d.phone,
      email: d.email,
      home_terminal: homeTerminalFromAddress(d.address),
      cdl_number: d.referenceCdlNumber,
      cdl_expiration_date: "2027-08-22",
      med_card_expiration_date:
        c === "EXPIRED"
          ? "2024-01-10"
          : c === "EXPIRING_SOON"
            ? "2026-05-01"
            : "2026-09-07",
      mvr_expiration_date: "2026-12-31",
    };
  });
}

export function createSeedTractors(): Tractor[] {
  const nums = [
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
  ];
  return nums.map((n) => {
    const id = `T-${n}`;
    const status: Tractor["status"] =
      n === 102
        ? "Unavailable"
        : n === 103 || n === 104
          ? "In Service"
          : "Available";
    return {
      tractor_id: id,
      unit_number: `TRK-${n}`,
      status,
    };
  });
}

export function createSeedTrailers(): Trailer[] {
  const out: Trailer[] = [];
  for (let n = 201; n <= 220; n++) {
    const i = n - 201;
    out.push({
      trailer_id: `TR-${n}`,
      unit_number: `TL-${n}`,
      status: i === 1 || i === 7 ? "In Service" : "Available",
    });
  }
  return out;
}

export function driverNameById(
  drivers: Driver[],
  driverId: string | null
): string {
  if (!driverId) return "—";
  return drivers.find((d) => d.driver_id === driverId)?.name ?? driverId;
}

export function tractorLabel(
  tractors: Tractor[],
  tractorId: string | null
): string {
  if (!tractorId) return "—";
  const t = tractors.find((x) => x.tractor_id === tractorId);
  return t ? `${t.unit_number} (${t.tractor_id})` : tractorId;
}

export function trailerLabel(
  trailers: Trailer[],
  trailerId: string | null
): string {
  if (!trailerId) return "—";
  const t = trailers.find((x) => x.trailer_id === trailerId);
  return t ? `${t.unit_number} (${t.trailer_id})` : trailerId;
}
