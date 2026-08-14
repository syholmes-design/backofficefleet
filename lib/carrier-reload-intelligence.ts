import { getCarrierById, getCarrierRegistry, type CarrierRecord } from "@/lib/carrier-registry";
import { getCarrierDispatchGate, type CarrierDispatchGateTone } from "@/lib/carrier-dispatch-gates";

export type ReloadTrailerType = "Dry van" | "Reefer" | "Flatbed" | "Power only";
export type ReloadRecommendationStatus = "recommended" | "allowed_with_warning" | "operations_review_required" | "blocked";

export type ReloadOpportunity = {
  id: string;
  sourceLoadId: string;
  origin: string;
  destination: string;
  trailerType: ReloadTrailerType;
  pickupWindow: string;
  deliveryWindow: string;
  estimatedRpm: number;
  deadheadMilesReduced: number;
  eligibleCarrierIds: string[];
  blockedCarrierIds: string[];
  reviewCarrierIds: string[];
  reloadScore: number;
  recommendationStatus: ReloadRecommendationStatus;
  operationalReasoning: string;
  dispatchConsequence: string;
  financeConsequence: string;
  customerConsequence: string;
};

export type CarrierReloadFit = {
  opportunity: ReloadOpportunity;
  carrierId: string;
  status: ReloadRecommendationStatus;
  tone: CarrierDispatchGateTone;
  label: string;
  reason: string;
  nextAction: string;
};

export type ReloadEscalation = {
  id: string;
  title: string;
  tone: CarrierDispatchGateTone;
  opportunityId: string;
  carrierId: string;
  carrierName: string;
  impact: string;
  nextAction: string;
  href: string;
};

export const reloadOpportunities: ReloadOpportunity[] = [
  {
    id: "RLD-011-FIN",
    sourceLoadId: "L011",
    origin: "Chicago, IL",
    destination: "Columbus, OH",
    trailerType: "Dry van",
    pickupWindow: "May 24, 2026 09:00-13:00",
    deliveryWindow: "May 25, 2026 07:00-11:00",
    estimatedRpm: 2.86,
    deadheadMilesReduced: 142,
    eligibleCarrierIds: ["CAR-001"],
    blockedCarrierIds: ["CAR-003"],
    reviewCarrierIds: ["CAR-002", "CAR-005"],
    reloadScore: 94,
    recommendationStatus: "recommended",
    operationalReasoning: "CAR-001 is finance-clean after the L011 proof packet, and the lane fits its Ohio Valley reload profile.",
    dispatchConsequence: "Dispatch can assign this reload after confirming L011 customer release and next pickup timing.",
    financeConsequence: "Factoring support stays clean because W-9, agreement, invoice, POD, and carrier packet controls are aligned.",
    customerConsequence: "Customer release can show a complete carrier packet without exposing payment or tax details.",
  },
  {
    id: "RLD-002-DRY",
    sourceLoadId: "L002",
    origin: "Roanoke, VA",
    destination: "Nashville, TN",
    trailerType: "Dry van",
    pickupWindow: "May 24, 2026 12:00-16:00",
    deliveryWindow: "May 25, 2026 10:00-15:00",
    estimatedRpm: 2.41,
    deadheadMilesReduced: 96,
    eligibleCarrierIds: [],
    blockedCarrierIds: ["CAR-003"],
    reviewCarrierIds: ["CAR-002"],
    reloadScore: 81,
    recommendationStatus: "allowed_with_warning",
    operationalReasoning: "Blue Ridge Dedicated fits the dry-van lane, but cargo insurance is inside the renewal watch window.",
    dispatchConsequence: "Assignment can proceed for standard dry-van freight after compliance confirms no high-value cargo exposure.",
    financeConsequence: "Settlement can proceed after proof capture; finance should retain the insurance renewal note on the load file.",
    customerConsequence: "Customer packet can be released with a visible cargo-renewal watch note.",
  },
  {
    id: "RLD-004-REEFER",
    sourceLoadId: "L008",
    origin: "Atlanta, GA",
    destination: "Orlando, FL",
    trailerType: "Reefer",
    pickupWindow: "May 24, 2026 06:00-10:00",
    deliveryWindow: "May 24, 2026 18:00-22:00",
    estimatedRpm: 3.08,
    deadheadMilesReduced: 118,
    eligibleCarrierIds: [],
    blockedCarrierIds: ["CAR-003"],
    reviewCarrierIds: ["CAR-004"],
    reloadScore: 72,
    recommendationStatus: "operations_review_required",
    operationalReasoning: "Southern Cross Reefer has the equipment fit, but its reefer POD delay pattern requires manager review before release.",
    dispatchConsequence: "Dispatch should hold assignment until operations signs off on proof timing and temperature-documentation controls.",
    financeConsequence: "Late POD behavior can delay settlement and factoring readiness on refrigerated freight.",
    customerConsequence: "Customer release should include a proof-timeliness plan before the reefer reload is promised.",
  },
  {
    id: "RLD-003-BLOCK",
    sourceLoadId: "L009",
    origin: "Columbus, OH",
    destination: "Pittsburgh, PA",
    trailerType: "Flatbed",
    pickupWindow: "May 24, 2026 14:00-18:00",
    deliveryWindow: "May 25, 2026 08:00-12:00",
    estimatedRpm: 2.73,
    deadheadMilesReduced: 74,
    eligibleCarrierIds: [],
    blockedCarrierIds: ["CAR-003"],
    reviewCarrierIds: [],
    reloadScore: 39,
    recommendationStatus: "blocked",
    operationalReasoning: "Iron Mile has the flatbed profile, but expired auto liability and unsigned carrier terms block dispatch.",
    dispatchConsequence: "BOF excludes this carrier from the reload board until insurance and agreement controls clear.",
    financeConsequence: "No new settlement or factoring workflow should open while the carrier packet is blocked.",
    customerConsequence: "Customer-safe packet cannot be released with expired liability insurance.",
  },
  {
    id: "RLD-005-FIN",
    sourceLoadId: "L010",
    origin: "Indianapolis, IN",
    destination: "Columbus, OH",
    trailerType: "Power only",
    pickupWindow: "May 24, 2026 15:00-19:00",
    deliveryWindow: "May 25, 2026 06:00-10:00",
    estimatedRpm: 2.18,
    deadheadMilesReduced: 64,
    eligibleCarrierIds: [],
    blockedCarrierIds: ["CAR-003"],
    reviewCarrierIds: ["CAR-005"],
    reloadScore: 76,
    recommendationStatus: "allowed_with_warning",
    operationalReasoning: "Prairie Line fits the low-risk power-only lane, but W-9 and ACH controls create finance release risk.",
    dispatchConsequence: "Dispatch may plan the reload with manager approval and finance hold visibility.",
    financeConsequence: "Settlement and factoring release remain at risk until W-9 and payment instructions are verified.",
    customerConsequence: "Customer packet can show authority and insurance, while payment controls remain internal.",
  },
];

function equipmentFits(carrier: CarrierRecord, opportunity: ReloadOpportunity) {
  const target = opportunity.trailerType.toLowerCase();
  return carrier.equipmentTypes.some((equipment) => {
    const value = equipment.toLowerCase();
    return value === target || value.includes(target) || target.includes(value);
  });
}

function laneFits(carrier: CarrierRecord, opportunity: ReloadOpportunity) {
  const laneText = `${opportunity.origin} ${opportunity.destination}`.toLowerCase();
  return carrier.reloadQualifiedRegions.concat(carrier.preferredReloadLanes, carrier.lanes).some((lane) => {
    const normalized = lane.toLowerCase();
    return normalized.split(/\s+to\s+|,|\//).some((part) => {
      const trimmed = part.trim();
      return trimmed.length > 2 && laneText.includes(trimmed);
    });
  });
}

export function getReloadOpportunities(): ReloadOpportunity[] {
  return reloadOpportunities;
}

export function evaluateCarrierReloadFit(carrier: CarrierRecord, opportunity: ReloadOpportunity): CarrierReloadFit {
  const gate = getCarrierDispatchGate(carrier);
  const hasEquipmentFit = equipmentFits(carrier, opportunity);
  const hasLaneFit = laneFits(carrier, opportunity);

  if (gate.outcome === "blocked" || opportunity.blockedCarrierIds.includes(carrier.id)) {
    return {
      opportunity,
      carrierId: carrier.id,
      status: "blocked",
      tone: "blocked",
      label: "Reload blocked",
      reason: `${carrier.dba} is excluded: ${gate.operationalRisk}`,
      nextAction: gate.requiredNextAction,
    };
  }

  if (!hasEquipmentFit) {
    return {
      opportunity,
      carrierId: carrier.id,
      status: "blocked",
      tone: "blocked",
      label: "Equipment mismatch",
      reason: `${carrier.dba} does not match the ${opportunity.trailerType} requirement.`,
      nextAction: "Choose a carrier with matching equipment before dispatch release.",
    };
  }

  if (gate.outcome === "operations_review" || opportunity.reviewCarrierIds.includes(carrier.id)) {
    return {
      opportunity,
      carrierId: carrier.id,
      status: "operations_review_required",
      tone: "watch",
      label: gate.indicator,
      reason: hasLaneFit ? gate.operationalRisk : `${carrier.dba} has equipment fit, but lane fit needs manager confirmation.`,
      nextAction: gate.requiredNextAction,
    };
  }

  if (gate.outcome === "warning" || opportunity.reviewCarrierIds.includes(carrier.id)) {
    return {
      opportunity,
      carrierId: carrier.id,
      status: "allowed_with_warning",
      tone: "review",
      label: gate.indicator,
      reason: hasLaneFit ? gate.operationalRisk : `${carrier.dba} can be considered, but lane fit needs dispatch confirmation.`,
      nextAction: gate.requiredNextAction,
    };
  }

  if (opportunity.eligibleCarrierIds.includes(carrier.id) || (hasEquipmentFit && hasLaneFit)) {
    return {
      opportunity,
      carrierId: carrier.id,
      status: "recommended",
      tone: "ready",
      label: "Reload recommended",
      reason: opportunity.operationalReasoning,
      nextAction: "Confirm pickup timing, then release the reload through dispatch.",
    };
  }

  return {
    opportunity,
    carrierId: carrier.id,
    status: "operations_review_required",
    tone: "watch",
    label: "Lane fit review",
    reason: `${carrier.dba} is not blocked, but the reload lane is not in its preferred or qualified regions.`,
    nextAction: "Route owner should confirm lane acceptance before dispatch release.",
  };
}

export function getCarrierReloadFits(carrierId: string): CarrierReloadFit[] {
  const carrier = getCarrierById(carrierId);
  if (!carrier) return [];
  return reloadOpportunities.map((opportunity) => evaluateCarrierReloadFit(carrier, opportunity));
}

export function getTopReloadRecommendations(limit = 4): ReloadOpportunity[] {
  return [...reloadOpportunities]
    .sort((a, b) => b.reloadScore - a.reloadScore)
    .slice(0, limit);
}

export function getReloadOpportunitiesForLoad(loadId: string): ReloadOpportunity[] {
  return reloadOpportunities.filter((opportunity) => opportunity.sourceLoadId === loadId);
}

export function getReloadEscalations(): ReloadEscalation[] {
  const carriers = getCarrierRegistry();
  const carrierMap = new Map(carriers.map((carrier) => [carrier.id, carrier]));
  return [
    {
      id: "reload-deadhead-reduction",
      title: "Deadhead reduction opportunity",
      opportunityId: "RLD-011-FIN",
      carrierId: "CAR-001",
      impact: "CAR-001 can cut 142 empty miles after L011 while keeping the finance packet clean.",
      nextAction: "Confirm L011 customer release and pickup timing.",
    },
    {
      id: "reload-blocked-assignment",
      title: "Blocked reload assignment",
      opportunityId: "RLD-003-BLOCK",
      carrierId: "CAR-003",
      impact: "Flatbed reload is excluded because Iron Mile has expired liability and unsigned carrier terms.",
      nextAction: "Resolve insurance and agreement holds before any dispatch release.",
    },
    {
      id: "reload-reefer-review",
      title: "Reefer review escalation",
      opportunityId: "RLD-004-REEFER",
      carrierId: "CAR-004",
      impact: "Reefer reload has good lane fit, but POD delay history requires operations signoff.",
      nextAction: "Confirm proof timing plan before customer commitment.",
    },
    {
      id: "reload-finance-hold",
      title: "Finance hold affecting reload release",
      opportunityId: "RLD-005-FIN",
      carrierId: "CAR-005",
      impact: "Power-only reload can be planned, but W-9 and ACH controls keep finance risk visible.",
      nextAction: "Collect W-9 and verify ACH before settlement release.",
    },
    {
      id: "reload-customer-release-risk",
      title: "Customer-release delay risk",
      opportunityId: "RLD-002-DRY",
      carrierId: "CAR-002",
      impact: "Dry-van reload can move with a cargo-renewal note; high-value freight should stay under review.",
      nextAction: "Confirm updated cargo certificate for higher-value exposure.",
    },
  ].map((item) => {
    const carrier = carrierMap.get(item.carrierId);
    const gate = carrier ? getCarrierDispatchGate(carrier) : null;
    return {
      ...item,
      carrierName: carrier?.dba ?? item.carrierId,
      tone: gate?.tone ?? "review",
      href: `/carriers/${item.carrierId}`,
    };
  });
}
