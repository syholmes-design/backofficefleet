import type { BofData } from "@/lib/load-bof-data";

export type BackhaulScanStatus =
  | "not_scanned"
  | "scanning"
  | "opportunity_found"
  | "no_match"
  | "booked"
  | "declined";

export type BackhaulOpportunityStatus =
  | "recommended"
  | "pending_approval"
  | "booked"
  | "rejected"
  | "expired";

export type BackhaulOpportunity = {
  opportunityId: string;
  driverId: string;
  source: "BOF Mock Feed" | "DAT Mock" | "Truckstop Mock" | "Direct Shipper Mock";
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  pickupWindow: string;
  deliveryWindow: string;
  equipmentType: string;
  rate: number;
  estimatedMiles: number;
  estimatedFuelCost: number;
  driverBackhaulPay: number;
  bofBackhaulBonus: number;
  netFleetRecovery: number;
  confidenceScore: number;
  linkedLoadId: string;
  status: BackhaulOpportunityStatus;
  reason: string;
};

export type BackhaulLoadSignal = {
  destinationMarket: string;
  nextKnownPickupMarket: string | null;
  estimatedDeadheadMiles: number;
  backhaulScanStatus: BackhaulScanStatus;
  backhaulOpportunityId?: string;
  backhaulRecommended?: boolean;
};

const MOCK_OPPORTUNITIES: readonly BackhaulOpportunity[] = [
  {
    opportunityId: "BH-001",
    driverId: "DRV-004",
    source: "BOF Mock Feed",
    pickupCity: "Columbus",
    pickupState: "OH",
    deliveryCity: "Mansfield",
    deliveryState: "OH",
    pickupWindow: "2026-04-05 08:00-11:00",
    deliveryWindow: "2026-04-05 14:00-18:00",
    equipmentType: "Dry Van",
    rate: 950,
    estimatedMiles: 82,
    estimatedFuelCost: 310,
    driverBackhaulPay: 175,
    bofBackhaulBonus: 150,
    netFleetRecovery: 315,
    confidenceScore: 94,
    linkedLoadId: "L004",
    status: "booked",
    reason:
      "Converts otherwise empty return miles into paid repositioning.",
  },
  {
    opportunityId: "BH-002",
    driverId: "DRV-007",
    source: "DAT Mock",
    pickupCity: "Joliet",
    pickupState: "IL",
    deliveryCity: "Indianapolis",
    deliveryState: "IN",
    pickupWindow: "2026-04-06 09:00-12:00",
    deliveryWindow: "2026-04-06 17:00-21:00",
    equipmentType: "Dry Van",
    rate: 1250,
    estimatedMiles: 185,
    estimatedFuelCost: 540,
    driverBackhaulPay: 225,
    bofBackhaulBonus: 200,
    netFleetRecovery: 285,
    confidenceScore: 88,
    linkedLoadId: "L007",
    status: "pending_approval",
    reason: "Matches driver hours and next pickup window.",
  },
];

const LOAD_SIGNALS: Readonly<Record<string, BackhaulLoadSignal>> = {
  L004: {
    destinationMarket: "Columbus, OH",
    nextKnownPickupMarket: "Mansfield, OH",
    estimatedDeadheadMiles: 82,
    backhaulScanStatus: "booked",
    backhaulOpportunityId: "BH-001",
    backhaulRecommended: true,
  },
  L007: {
    destinationMarket: "Chicago, IL",
    nextKnownPickupMarket: "Joliet, IL",
    estimatedDeadheadMiles: 185,
    backhaulScanStatus: "opportunity_found",
    backhaulOpportunityId: "BH-002",
    backhaulRecommended: true,
  },
  L006: {
    destinationMarket: "Cleveland, OH",
    nextKnownPickupMarket: null,
    estimatedDeadheadMiles: 140,
    backhaulScanStatus: "no_match",
    backhaulRecommended: false,
  },
};

export function getBackhaulLoadSignals(): Readonly<Record<string, BackhaulLoadSignal>> {
  return LOAD_SIGNALS;
}

export function getMockBackhaulOpportunities(data: BofData): BackhaulOpportunity[] {
  const loadIdSet = new Set((data.loads ?? []).map((l) => l.id));
  return MOCK_OPPORTUNITIES.filter((o) => loadIdSet.has(o.linkedLoadId)).map((o) => ({ ...o }));
}

export function getBackhaulOpportunityByLoadId(
  data: BofData,
  loadId: string
): BackhaulOpportunity | null {
  return getMockBackhaulOpportunities(data).find((o) => o.linkedLoadId === loadId) ?? null;
}

export function getBackhaulOpportunitySummary(data: BofData) {
  const opportunities = getMockBackhaulOpportunities(data);
  const opportunitiesFound = opportunities.length;
  const deadheadMilesAvoided = opportunities.reduce((sum, o) => sum + o.estimatedMiles, 0);
  const backhaulRevenueCaptured = opportunities
    .filter((o) => o.status === "booked")
    .reduce((sum, o) => sum + o.rate, 0);
  const bofBackhaulBonusPending = opportunities
    .filter((o) => o.status === "pending_approval")
    .reduce((sum, o) => sum + o.bofBackhaulBonus, 0);
  return {
    opportunitiesFound,
    deadheadMilesAvoided,
    backhaulRevenueCaptured,
    bofBackhaulBonusPending,
  };
}

export function getBackhaulPendingApprovalAlert(data: BofData) {
  const pending = getMockBackhaulOpportunities(data).find(
    (o) => o.status === "pending_approval"
  );
  if (!pending) return null;
  return {
    title: "Backhaul approval pending",
    severity: "Medium" as const,
    reason:
      "BOF found a qualifying backhaul, but manager approval is needed before booking.",
    recommendedFix:
      "Review backhaul lane, driver hours, and settlement impact.",
    linkedLoadId: pending.linkedLoadId,
    opportunityId: pending.opportunityId,
  };
}

export function getBookedOrApprovedBackhaulForDriver(
  data: BofData,
  driverId: string
): BackhaulOpportunity | null {
  const driverLoadIds = new Set(
    data.loads.filter((l) => l.driverId === driverId).map((l) => l.id)
  );
  return (
    getMockBackhaulOpportunities(data).find(
      (o) =>
        driverLoadIds.has(o.linkedLoadId) &&
        (o.status === "booked" || o.status === "pending_approval")
    ) ?? null
  );
}
