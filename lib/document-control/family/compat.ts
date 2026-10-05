/**
 * Compatibility layer between the legacy flat controlled-document roster
 * (ControlledDocumentRecord) and the Phase 1 family -> master -> instance model.
 *
 * Pure and computed on demand. This is NOT a migration: nothing is persisted and
 * the legacy roster remains the source of truth in Phase 1.
 *
 * Invariants:
 *  - Existing roster codes ARE family keys; they are never renumbered.
 *  - A carrier-local code is never emitted as a roster `code`.
 *  - Carrier adoption is never shown as BOF master approval.
 *  - toControlledDocumentRecord(liftControlledDocumentRecord(r)) deep-equals r.
 */
import { CONTROLLED_DOCUMENT_ROSTER } from "@/lib/document-control/registry";
import type { ControlledDocumentRecord } from "@/lib/document-control/types";
import { makeMasterId } from "./ids";
import type {
  CarrierInstance,
  DocumentFamily,
  DocumentFamilyGraph,
  MasterApproval,
  MasterDocument,
} from "./types";

export type LiftedRosterEntry = { family: DocumentFamily; master: MasterDocument };

const NOT_APPROVED_APPROVER = "Not approved";

/**
 * Conservative master approval derived from the roster. The roster names only
 * an approver ROLE and records no executed approval (no approver name, date or
 * evidence), so a lifted master is NEVER "APPROVED": it is "NOT_APPROVED" when
 * the roster says "Not approved", otherwise "PENDING" (role assigned, approval
 * not evidenced). approverName / approvedAt / evidenceRef stay null. Status is
 * not written back by toControlledDocumentRecord, so round-trip is unaffected.
 */
function deriveMasterApproval(record: ControlledDocumentRecord): MasterApproval {
  const status: MasterApproval["status"] =
    record.approver === NOT_APPROVED_APPROVER ? "NOT_APPROVED" : "PENDING";
  return {
    scope: "BOF_MASTER",
    status,
    approverRole: record.approver,
    approverName: null,
    approvedAt: null,
    evidenceRef: null,
  };
}

export function liftControlledDocumentRecord(
  record: ControlledDocumentRecord,
): LiftedRosterEntry {
  const related: DocumentFamily["related"] = {};
  if (record.relatedPolicy !== undefined) related.policy = record.relatedPolicy;
  if (record.relatedSop !== undefined) related.sop = record.relatedSop;
  if (record.relatedForm !== undefined) related.form = record.relatedForm;

  const family: DocumentFamily = {
    familyKey: record.code,
    title: record.name,
    function: record.function,
    type: record.type,
    purpose: record.purpose,
    vaultClass: record.vaultClass,
    digitalBehavior: record.digitalBehavior,
    workflow: record.workflow,
    user: record.user,
    aliases: [],
    related,
  };

  const master: MasterDocument = {
    masterId: makeMasterId(record.code, record.version),
    familyKey: record.code,
    version: record.version,
    title: record.name,
    lifecycle: record.lifecycle,
    approval: deriveMasterApproval(record),
    productionGate: record.productionGate,
    regulatoryReview: record.regulatoryReview,
    owner: record.owner,
    steward: record.steward,
    complianceReviewer: record.complianceReviewer,
    recommendation: record.recommendation,
    overrideRules: [],
    provenance: {
      origin: "BOF_AUTHORED",
      sourceRefs: [
        { kind: "ROSTER_NOTE", ref: `lib/document-control/registry.ts#${record.code}` },
      ],
      note: "Lifted from legacy ControlledDocumentRecord; provenance not yet classified",
    },
    stableAppIds: [...record.stableAppIds],
    notes: record.notes,
  };
  if (record.evidenceMedium !== undefined) master.evidenceMedium = record.evidenceMedium;
  if (record.href !== undefined) master.href = record.href;

  return { family, master };
}

/**
 * Projects a family/master (and optionally a carrier instance) back to the
 * legacy roster shape. `version` is always the MASTER's version, never an
 * instanceVersion. An instance, if given, must be pinned to `master`.
 */
export function toControlledDocumentRecord(entry: {
  family: DocumentFamily;
  master: MasterDocument;
  instance?: CarrierInstance;
}): ControlledDocumentRecord {
  const { family, master, instance } = entry;
  if (master.familyKey !== family.familyKey) {
    throw new Error(
      `toControlledDocumentRecord: master ${master.masterId} does not belong to family ${family.familyKey}`,
    );
  }
  if (instance && instance.familyKey !== family.familyKey) {
    throw new Error(
      `toControlledDocumentRecord: instance ${instance.instanceId} does not belong to family ${family.familyKey}`,
    );
  }
  if (instance && instance.masterId !== master.masterId) {
    throw new Error(
      `toControlledDocumentRecord: instance ${instance.instanceId} is pinned to ${instance.masterId ?? "no master"}, not ${master.masterId}`,
    );
  }

  const href = instance ? instance.href : master.href;
  const stableAppIds = instance ? instance.stableAppIds : master.stableAppIds;

  // Key order mirrors the legacy roster; optional keys are only set when present.
  const out: ControlledDocumentRecord = {
    // Always the global family key; never a carrier-local code.
    code: family.familyKey,
    // Global name; an instance's localTitle is not the roster name.
    name: master.title,
    function: family.function,
    type: family.type,
    purpose: family.purpose,
    owner: master.owner,
    steward: master.steward,
    complianceReviewer: master.complianceReviewer,
    // BOF master approver role; carrier adoption is never shown here.
    approver: master.approval.approverRole,
  } as ControlledDocumentRecord;
  if (family.related.policy !== undefined) out.relatedPolicy = family.related.policy;
  if (family.related.sop !== undefined) out.relatedSop = family.related.sop;
  if (family.related.form !== undefined) out.relatedForm = family.related.form;
  if (master.evidenceMedium !== undefined) out.evidenceMedium = master.evidenceMedium;
  out.workflow = family.workflow;
  out.user = family.user;
  out.digitalBehavior = family.digitalBehavior;
  out.vaultClass = family.vaultClass;
  out.lifecycle = instance ? instance.lifecycle : master.lifecycle;
  out.version = master.version;
  out.stableAppIds = [...stableAppIds];
  if (href !== undefined) out.href = href;
  out.recommendation = master.recommendation;
  out.regulatoryReview = master.regulatoryReview;
  out.productionGate = master.productionGate;
  out.notes = master.notes;
  return out;
}

export function liftControlledDocumentRoster(
  records: readonly ControlledDocumentRecord[] = CONTROLLED_DOCUMENT_ROSTER,
): LiftedRosterEntry[] {
  return records.map((record) => liftControlledDocumentRecord(record));
}

export function toDocumentFamilyGraph(
  entries: readonly LiftedRosterEntry[],
  extra: Partial<DocumentFamilyGraph> = {},
): DocumentFamilyGraph {
  return {
    families: [...entries.map((e) => e.family), ...(extra.families ?? [])],
    masters: [...entries.map((e) => e.master), ...(extra.masters ?? [])],
    carriers: [...(extra.carriers ?? [])],
    instances: [...(extra.instances ?? [])],
    records: [...(extra.records ?? [])],
  };
}
