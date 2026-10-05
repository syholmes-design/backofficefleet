/**
 * Phase 2 document-family graph builders.
 *
 * Phase 1 compatibility graph = roster lift + carrier profiles only.
 * Phase 2 graph = that lift plus the six carrier-originated Delta families/
 * instances. The six families are NOT pushed through the compatibility lift:
 * they have no masters.
 *
 * Frozen rule (must stay true of the validators): an already-adopted instance
 * pinned to an older approved master that later becomes SUPERSEDED remains
 * effective. Only a NEW (NOT_ADOPTED) adoption against a superseded master is
 * an error.
 */
import { CARRIER_PROFILES } from "../carrier-profiles";
import { liftControlledDocumentRoster, toDocumentFamilyGraph } from "../compat";
import type { DocumentFamilyGraph } from "../types";
import { PHASE2_COLLISIONS } from "./collisions";
import { PHASE2_DELTA_FAMILIES, PHASE2_DELTA_INSTANCES } from "./delta-instances";
import { PHASE2_ROSTER_CLASSIFICATIONS } from "./roster-classification";
import {
  PHASE2_COMPATIBILITY_QUALIFICATIONS,
  PHASE2_DELTA_FAMILY_QUALIFICATIONS,
  PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
} from "./qualification";

export {
  PHASE2_ROSTER_CLASSIFICATIONS,
  PHASE2_COLLISIONS,
  PHASE2_COMPATIBILITY_QUALIFICATIONS,
  PHASE2_DELTA_FAMILY_QUALIFICATIONS,
  PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
};

/** Live Phase 1 surface: roster lift + carriers. No instances or extra families. */
export function buildPhase1CompatibilityGraph(): DocumentFamilyGraph {
  return toDocumentFamilyGraph(liftControlledDocumentRoster(), {
    carriers: [...CARRIER_PROFILES],
  });
}

/**
 * Phase 2 registration graph: roster lift + 6 Delta families/instances.
 * Delta families are appended as-is (no masters); they are not lifted.
 */
export function buildPhase2DocumentFamilyGraph(): DocumentFamilyGraph {
  return toDocumentFamilyGraph(liftControlledDocumentRoster(), {
    families: [...PHASE2_DELTA_FAMILIES],
    carriers: [...CARRIER_PROFILES],
    instances: [...PHASE2_DELTA_INSTANCES],
    records: [],
  });
}
