export type TomTomFuelStationNormalized = {
  stationId: string;
  fuelPriceId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles: number;
  etaMinutes: number;
  dieselPricePerGal: number;
  currency: string;
  fuelType: "diesel";
  sourceTimestamp?: string;
  isBofNetwork: boolean;
  nearest: boolean;
  cheapest: boolean;
  recommended: boolean;
};

export type TomTomFuelSummary = {
  nearestStationId?: string;
  bofNearestStationId?: string;
  cheapestStationId?: string;
  recommendedStationId?: string;
  baselineAveragePerGal?: number;
  savingsPerGalVsBaseline?: number;
  estimatedTripGallons?: number;
  estimatedTripSavingsUsd?: number;
  usedDemoBaseline: boolean;
};

export type TomTomFuelRouteContext = {
  origin: string;
  destination: string;
  centerLat: number;
  centerLon: number;
  contextMode: "origin_radius" | "en_route_radius" | "delivered_radius";
};

export type TomTomFuelFeedResponse = {
  live: boolean;
  reason?: string;
  loadId: string;
  fuelPriceIds: string[];
  routeContext: TomTomFuelRouteContext;
  stations: TomTomFuelStationNormalized[];
  summary: TomTomFuelSummary;
  note: string;
};

