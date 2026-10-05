/**
 * Generic carrier profile registry.
 *
 * Carrier-neutral: no carrier is special-cased here. Each carrier exists only
 * as a data entry under ./carriers/ and is listed in CARRIER_PROFILES.
 */
import type { CarrierFact, CarrierProfile } from "./types";
import { DELTA_ADVANCED_TRUCKING_PROFILE } from "./carriers/delta-advanced-trucking";

export const CARRIER_PROFILES: readonly CarrierProfile[] = Object.freeze([
  DELTA_ADVANCED_TRUCKING_PROFILE,
]);

const FACT_FIELDS = [
  "legalName",
  "dba",
  "logoRef",
  "address",
  "usdot",
  "mc",
  "contacts",
  "approvalAuthority",
  "localCodePrefix",
] as const satisfies readonly (keyof CarrierProfile)[];

export function listCarrierProfiles(): readonly CarrierProfile[] {
  return CARRIER_PROFILES;
}

export function getCarrierProfile(carrierId: string): CarrierProfile | undefined {
  return CARRIER_PROFILES.find((profile) => profile.carrierId === carrierId);
}

export function requireCarrierProfile(carrierId: string): CarrierProfile {
  const profile = getCarrierProfile(carrierId);
  if (!profile) {
    throw new Error(`Unknown carrier profile: "${carrierId}"`);
  }
  return profile;
}

export function getCarrierProfileByFleetSlug(fleetSlug: string): CarrierProfile | undefined {
  if (!fleetSlug) return undefined;
  return CARRIER_PROFILES.find((profile) => profile.fleetRef.fleetSlug === fleetSlug);
}

/** Value only when RECORDED; CONFLICTING and NOT_RECORDED resolve to null. */
export function resolveCarrierFactValue<T>(fact: CarrierFact<T>): T | null {
  return fact.status === "RECORDED" ? fact.value : null;
}

export function listCarrierFactIssues(
  profile: CarrierProfile,
): { field: string; status: "CONFLICTING" | "NOT_RECORDED"; note?: string }[] {
  const issues: { field: string; status: "CONFLICTING" | "NOT_RECORDED"; note?: string }[] = [];
  for (const field of FACT_FIELDS) {
    const fact: CarrierFact<unknown> = profile[field];
    if (fact.status === "RECORDED") continue;
    issues.push(
      fact.note === undefined
        ? { field, status: fact.status }
        : { field, status: fact.status, note: fact.note },
    );
  }
  return issues;
}
