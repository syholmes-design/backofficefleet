/**
 * Phase 2 registration types.
 *
 * These sit beside the legacy roster. They do not replace
 * ControlledDocumentRecord, and they are not part of the Phase 1 live graph.
 * Phase 1 lift still produces zero instances until a caller opts into the
 * Phase 2 graph.
 *
 * A compatibility master created by the roster lift is not a genuine
 * carrier-neutral BOF master. genuineBofMaster stays false until a later
 * decision reviews content into one. Carrier adoption is never that decision.
 */
export const PHASE2_CONTENT_POSTURES = [
  "UNCLASSIFIED",
  "SOURCE_NOT_RECOVERED",
  "CATALOG_SHELL",
  "HUMAN_DECISION",
  "COLLISION_PRESENT",
] as const;

export type Phase2ContentPosture = (typeof PHASE2_CONTENT_POSTURES)[number];

/** One roster family. Does not renumber the family key. */
export type Phase2RosterClassification = {
  familyKey: string;
  /** `${familyKey}@${roster.version}` from the compatibility lift. */
  compatibilityMasterId: string;
  /**
   * False in this pass for every roster row. The lift master exists only so
   * the legacy record still round-trips. It is not BOF master approval and
   * not a carrier-neutral rewrite of Delta text.
   */
  genuineBofMaster: false;
  contentPosture: Phase2ContentPosture;
  note: string;
};

export const PHASE2_QUALIFICATION_RESULTS = [
  "BLOCKED",
  "UNREVIEWED",
  "CANDIDATE",
  "RELEASED_TO_MASTER_REVIEW",
] as const;

export type Phase2QualificationResult = (typeof PHASE2_QUALIFICATION_RESULTS)[number];

/**
 * Postures that cannot become CANDIDATE. UNCLASSIFIED is the only
 * non-blocking posture, and it still defaults to UNREVIEWED.
 */
export const PHASE2_QUALIFICATION_BLOCKING_POSTURES = [
  "COLLISION_PRESENT",
  "HUMAN_DECISION",
  "CATALOG_SHELL",
  "SOURCE_NOT_RECOVERED",
] as const satisfies readonly Phase2ContentPosture[];

/**
 * Qualification of one compatibility master. This is not a master, not
 * approval, and not adoption. CANDIDATE does not set genuineBofMaster.
 */
export type Phase2CompatibilityQualification = {
  compatibilityMasterId: string;
  familyKey: string;
  result: Phase2QualificationResult;
  contentPosture: Phase2ContentPosture;
  /**
   * Repository path of a recovered carrier-neutral source.
   * Required for CANDIDATE. Null for BLOCKED and UNREVIEWED.
   * This is not master-approval evidence and not carrier-adoption evidence.
   */
  sourceRef: string | null;
  note: string;
};

/**
 * The six Delta families have no compatibility master. compatibilityMasterId
 * stays null so this row cannot be read as a master id.
 */
export type Phase2DeltaFamilyQualification = {
  compatibilityMasterId: null;
  familyKey: string;
  result: "BLOCKED";
  sourceRef: null;
  note: string;
};

/**
 * Why an existing artifact was examined and not cited as a recovered
 * carrier-neutral BOF master source. Not a qualification result.
 */
export const PHASE2_UNREVIEWED_INSPECTION_REASONS = [
  "carrier-identified file",
  "government or third-party form",
  "demo or sample",
  "superseded historical alias",
  "operational evidence rather than a master body",
  "external reference",
  "generated compatibility projection",
] as const;

export type Phase2UnreviewedInspectionReason =
  (typeof PHASE2_UNREVIEWED_INSPECTION_REASONS)[number];

/**
 * Evidence inspection attached to one UNREVIEWED compatibility master.
 * It does not change the qualification result and it is not approval evidence.
 */
export type Phase2UnreviewedEvidenceInspection = {
  compatibilityMasterId: string;
  result: "UNREVIEWED";
  /** Repository path, or the existing roster href when that href is the artifact. */
  artifactsExamined: readonly string[];
  reasonCategory: Phase2UnreviewedInspectionReason;
  /** Grounded in the examined artifact or the existing roster note. */
  reason: string;
};

/**
 * A known identity collision. distinctDocuments must not be merged, and this
 * record must not assign a new global family key.
 */
export type Phase2Collision = {
  collisionId: string;
  status: "UNRESOLVED";
  decision: "DO_NOT_MERGE";
  distinctDocuments: {
    label: string;
    /** Existing roster family key, when the document is already that family. */
    familyKey: string | null;
    /**
     * Carrier-local printed code when the source establishes one.
     * Null when it does not. Never a global BOF id, and never a BOF
     * document number with the prefix removed.
     */
    localCode: string | null;
    source: string;
  }[];
  note: string;
};
