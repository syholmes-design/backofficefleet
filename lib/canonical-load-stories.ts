export type CanonicalLoadStory = {
  loadId: string;
  driverId: string;
  driverName: string;
  assetId: string;
  trailerId: string;
  origin: string;
  destination: string;
  theme: string;
  status: string;
  primaryIssue: string;
  maintenanceWorkOrderId?: string;
  rfidEventId?: string;
  evidenceStatus?: string;
  claimActive: boolean;
  factoringActive: boolean;
};

export const L009_CANONICAL_STORY: CanonicalLoadStory = {
  loadId: "L009",
  driverId: "DRV-009",
  driverName: "Emma Brown",
  assetId: "T-111",
  trailerId: "TRL-2170",
  origin: "BlueLine Retail - Cleveland, OH",
  destination: "Lakeside Grocery - Dallas, TX",
  theme: "Dispatch Readiness / Pre-Trip Block",
  status: "Dispatch blocked / manager review required",
  primaryIssue: "Tire / asset defect from pre-trip inspection",
  maintenanceWorkOrderId: "WO-003",
  rfidEventId: "RFID-509-PRE",
  claimActive: false,
  factoringActive: false,
};

export const L011_CANONICAL_STORY: CanonicalLoadStory = {
  loadId: "L011",
  driverId: "DRV-011",
  driverName: "Olivia Lee",
  assetId: "T-112",
  trailerId: "TRL-2584",
  origin: "Rapid Parts - Indianapolis, IN",
  destination: "Delta Retail DC - Atlanta, GA",
  theme: "Factoring / Settlement Readiness",
  status: "Delivered / proof packet under finance review / factoring packet ready",
  primaryIssue: "Post-trip proof packet and factoring submission readiness",
  claimActive: false,
  factoringActive: true,
  evidenceStatus: "Ready",
};

const LOAD_STORIES: Record<string, CanonicalLoadStory> = {
  [L009_CANONICAL_STORY.loadId]: L009_CANONICAL_STORY,
  [L011_CANONICAL_STORY.loadId]: L011_CANONICAL_STORY,
};

export function normalizeCanonicalLoadId(loadId: string): string {
  const raw = String(loadId ?? "").trim().toUpperCase();
  const digits = raw.match(/\d+/)?.[0] ?? "";
  if (!digits) return raw;
  return `L${digits.padStart(3, "0")}`;
}

export function getCanonicalLoadStory(loadId: string): CanonicalLoadStory | null {
  return LOAD_STORIES[normalizeCanonicalLoadId(loadId)] ?? null;
}

export function canonicalLoadHasClaim(loadId: string): boolean | null {
  const story = getCanonicalLoadStory(loadId);
  return story ? story.claimActive : null;
}

export function canonicalLoadHasFactoring(loadId: string): boolean | null {
  const story = getCanonicalLoadStory(loadId);
  return story ? story.factoringActive : null;
}
