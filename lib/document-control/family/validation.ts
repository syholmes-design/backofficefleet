/**
 * Architecture guard for the BOF document family graph.
 *
 * validateDocumentFamilyGraph() checks the structural invariants owned here
 * (family keys/aliases, master identity/supersession, instance identity,
 * carrier-local codes, graph-wide evidence reuse, approval-source assertions)
 * and aggregates structured FamilyIssue[] from the owning modules:
 *   provenance.ts, overrides.ts, approval.ts, versioning.ts,
 *   carrier-validation.ts.
 *
 * Classification is by FamilyIssue.code only. Message text is for humans and
 * is never parsed, matched or used to drop an issue.
 *
 * Pure: no I/O, no mutation of the input graph.
 */
import { isGlobalBofCode, makeInstanceId, makeMasterId, normalizeLocalCode } from "./ids";
import type { FamilyKey, MasterId } from "./ids";
import type {
  CarrierInstance,
  DocumentFamilyGraph,
  MasterDocument,
} from "./types";
import {
  FAMILY_ISSUE_CODES,
  familyIssue,
  normalizeEvidenceRef,
} from "./issues";
import type {
  FamilyIssue,
  FamilyIssueCode,
  FamilyIssueSeverity,
} from "./issues";
import { validateProvenance } from "./provenance";
import {
  isMasterApproved,
  summarizeInstanceApproval,
  validateApprovalSeparation,
  validateMasterApproval,
} from "./approval";
import { validateInstanceOverrides } from "./overrides";
import { validateVersioning } from "./versioning";
import { validateCarrierProfiles } from "./carrier-validation";

export type FamilyGraphIssue = {
  severity: FamilyIssueSeverity;
  /** Same value as `code`; kept for backward compatibility. */
  rule: FamilyIssueCode;
  code: FamilyIssueCode;
  subject: string;
  message: string;
};

export type FamilyGraphReport = {
  ok: boolean;
  errors: FamilyGraphIssue[];
  warnings: FamilyGraphIssue[];
};

/** Stable rule ids. Alias of FAMILY_ISSUE_CODES (same object). */
export const FAMILY_GRAPH_RULES: typeof FAMILY_ISSUE_CODES = FAMILY_ISSUE_CODES;

const R = FAMILY_ISSUE_CODES;

function instanceSubject(inst: CarrierInstance): string {
  return `${inst.instanceId}@${inst.instanceVersion}`;
}

function asArray<T>(v: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(v) ? v : [];
}

export function validateDocumentFamilyGraph(
  graph: DocumentFamilyGraph,
): FamilyGraphReport {
  const issues: FamilyIssue[] = [];
  const error = (code: FamilyIssueCode, subject: string, message: string): void => {
    issues.push(familyIssue(code, "error", subject, message));
  };

  const families = asArray(graph.families);
  const masterList = asArray(graph.masters);
  const carriers = asArray(graph.carriers);
  const instances = asArray(graph.instances);

  // ---- families ----
  const familyKeys = new Set<FamilyKey>();
  for (const f of families) {
    if (familyKeys.has(f.familyKey)) {
      error(R.familyKeyUnique, f.familyKey, `family key "${f.familyKey}" is declared more than once`);
    }
    familyKeys.add(f.familyKey);
    if (!isGlobalBofCode(f.familyKey)) {
      error(R.familyKeyFormat, f.familyKey, `family key "${f.familyKey}" is not a global BOF code`);
    }
  }

  const aliasOwner = new Map<string, FamilyKey>();
  for (const f of families) {
    for (const alias of asArray(f.aliases)) {
      if (!isGlobalBofCode(alias)) {
        error(R.familyAliasFormat, f.familyKey, `alias "${alias}" is not a global BOF code`);
      }
      if (familyKeys.has(alias)) {
        error(
          R.familyAliasCollidesWithKey,
          f.familyKey,
          alias === f.familyKey
            ? `alias "${alias}" repeats the family's own key`
            : `alias "${alias}" equals the key of another family`,
        );
      }
      const owner = aliasOwner.get(alias);
      if (owner !== undefined) {
        error(
          R.familyAliasDuplicate,
          f.familyKey,
          owner === f.familyKey
            ? `alias "${alias}" is listed twice on the same family`
            : `alias "${alias}" is also claimed by family ${owner}`,
        );
      } else {
        aliasOwner.set(alias, f.familyKey);
      }
    }
  }

  // ---- masters (identity + supersession; approval via approval.ts) ----
  const masters = new Map<MasterId, MasterDocument>();
  for (const m of masterList) {
    const subject = m.masterId;
    if (!familyKeys.has(m.familyKey)) {
      error(R.masterFamilyMissing, subject, `master references unknown family "${m.familyKey}"`);
    }
    let expectedId: string | null = null;
    try {
      expectedId = makeMasterId(m.familyKey, m.version);
    } catch (e) {
      error(R.masterIdFormat, subject, `cannot build master id: ${(e as Error).message}`);
    }
    if (expectedId !== null && expectedId !== m.masterId) {
      error(R.masterIdFormat, subject, `masterId must be "${expectedId}" (familyKey@version)`);
    }
    if (masters.has(m.masterId)) {
      error(R.masterIdUnique, subject, `masterId "${m.masterId}" is declared more than once`);
    } else {
      masters.set(m.masterId, m);
    }
  }
  for (const m of masterList) {
    const sup = m.supersedesMasterId;
    if (sup === undefined || sup === null) continue;
    const target = masters.get(sup);
    if (!target || sup === m.masterId) {
      error(R.masterSupersedesMissing, m.masterId, `supersedesMasterId "${sup}" does not exist`);
    } else if (target.familyKey !== m.familyKey) {
      error(
        R.masterSupersedesFamilyMismatch,
        m.masterId,
        `supersedes ${sup} which belongs to family ${target.familyKey}, not ${m.familyKey}`,
      );
    }
  }
  for (const m of masterList) {
    issues.push(...validateMasterApproval(m));
    issues.push(...validateProvenance(m.provenance, m.masterId));
  }

  // ---- carriers (profile checks via carrier-validation.ts) ----
  issues.push(...validateCarrierProfiles(carriers));
  const carrierIds = new Set<string>(carriers.map((c) => c.carrierId));

  // ---- instances (identity, references, local codes) ----
  // Comparison key is trim + uppercase. The stored localCode is not rewritten.
  const localCodes = new Map<string, string>(); // key: carrierId + "\u0000" + normalized local code
  const normalizedFamilyKeys = new Set<string>();
  for (const key of familyKeys) normalizedFamilyKeys.add(normalizeLocalCode(key));
  const normalizedAliases = new Set<string>();
  for (const alias of aliasOwner.keys()) normalizedAliases.add(normalizeLocalCode(alias));
  for (const inst of instances) {
    const subject = instanceSubject(inst);
    let expectedId: string | null = null;
    try {
      expectedId = makeInstanceId(inst.familyKey, inst.carrierId);
    } catch (e) {
      error(R.instanceIdFormat, subject, `cannot build instance id: ${(e as Error).message}`);
    }
    if (expectedId !== null && expectedId !== inst.instanceId) {
      error(R.instanceIdFormat, subject, `instanceId must be "${expectedId}" (familyKey::carrierId)`);
    }
    if (!familyKeys.has(inst.familyKey)) {
      error(R.instanceFamilyMissing, subject, `instance references unknown family "${inst.familyKey}"`);
    }
    if (!carrierIds.has(inst.carrierId)) {
      error(R.instanceCarrierMissing, subject, `instance references unknown carrier "${inst.carrierId}"`);
    }

    // Local codes are carrier-scoped labels, never global identifiers.
    // Identity is trim + case-insensitive. Display text on the instance stays as supplied.
    // Null means the carrier-local code is unknown. Unknown codes are omitted
    // from this map, so several unknown codes in one carrier are not duplicates.
    // A supplied code is still checked for global shape, family-key collision,
    // and uniqueness within the carrier.
    if (inst.localCode !== null && inst.localCode !== undefined) {
      const code = inst.localCode;
      const normalized = normalizeLocalCode(code);
      if (normalized !== "") {
        if (isGlobalBofCode(normalized)) {
          error(R.localCodeGlobalFormat, subject, `local code "${code}" has the shape of a global BOF code`);
        }
        if (normalizedFamilyKeys.has(normalized) || normalizedAliases.has(normalized)) {
          error(R.localCodeEqualsFamilyKey, subject, `local code "${code}" equals a global family key or alias`);
        }
        const key = `${inst.carrierId}\u0000${normalized}`;
        const holder = localCodes.get(key);
        if (holder !== undefined && holder !== inst.instanceId) {
          error(
            R.localCodeUniqueInCarrier,
            subject,
            `local code "${code}" is already used by ${holder} within carrier ${inst.carrierId}`,
          );
        } else if (holder === undefined) {
          localCodes.set(key, inst.instanceId);
        }
      }
    }

    issues.push(...validateProvenance(inst.provenance, subject));
  }

  // ---- versioning, lifecycle uniqueness, master pinning, records ----
  issues.push(...validateVersioning(graph));

  // ---- approval (BOF master approval vs carrier adoption) + overrides ----
  const pinnedMaster = (inst: CarrierInstance): MasterDocument | null => {
    if (inst.masterId === null || inst.masterId === undefined) return null;
    const m = masters.get(inst.masterId);
    return m && m.familyKey === inst.familyKey ? m : null;
  };

  // Graph-wide evidence reuse: any master approval evidence reused as any
  // carrier adoption evidence. Blank evidence normalizes to null and is never a
  // match (blank non-null evidence is reported as approval.evidence.empty by
  // approval.ts).
  const masterEvidence = new Map<string, MasterId[]>();
  for (const m of masterList) {
    const ev = normalizeEvidenceRef(m.approval?.evidenceRef);
    if (ev === null) continue;
    const list = masterEvidence.get(ev) ?? [];
    list.push(m.masterId);
    masterEvidence.set(ev, list);
  }

  for (const inst of instances) {
    const subject = instanceSubject(inst);
    const master = pinnedMaster(inst);

    issues.push(...validateApprovalSeparation(master, inst));
    issues.push(...validateInstanceOverrides(master, inst));

    const ev = normalizeEvidenceRef(inst.adoption?.evidenceRef);
    const reusedBy = ev === null ? undefined : masterEvidence.get(ev);
    if (reusedBy !== undefined) {
      error(
        R.approvalEvidenceReused,
        subject,
        `carrier adoption evidence "${String(inst.adoption?.evidenceRef)}" is also BOF master approval evidence for ${reusedBy.join(", ")}`,
      );
    }

    // Structural approval-source assertions.
    const summary = summarizeInstanceApproval(master, inst);
    const source: string = summary.masterApprovalSource;
    if (source !== "BOF_MASTER" && source !== "NONE") {
      error(R.approvalMasterSource, subject, `masterApprovalSource must be BOF_MASTER or NONE (got "${source}")`);
    }
    const expectedMasterApproved = master !== null && isMasterApproved(master);
    if (
      summary.masterApproved !== expectedMasterApproved ||
      (source === "BOF_MASTER") !== summary.masterApproved
    ) {
      error(
        R.approvalMasterDerivedFromMaster,
        subject,
        `masterApproved=${String(summary.masterApproved)} (source ${source}) is not derived from the BOF master alone (expected ${String(expectedMasterApproved)})`,
      );
    }
    if (summary.carrierAdopted && !expectedMasterApproved && summary.instanceEffective) {
      error(
        R.approvalAdoptionImpliesMasterApproval,
        subject,
        "instance is effective on carrier adoption alone; BOF master is not approved",
      );
    }
  }

  // ---- de-duplicate and split ----
  const seen = new Set<string>();
  const errors: FamilyGraphIssue[] = [];
  const warnings: FamilyGraphIssue[] = [];
  for (const i of issues) {
    const key = `${i.severity}\u0000${i.code}\u0000${i.subject}\u0000${i.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const out: FamilyGraphIssue = {
      severity: i.severity,
      rule: i.code,
      code: i.code,
      subject: i.subject,
      message: i.message,
    };
    (i.severity === "error" ? errors : warnings).push(out);
  }

  return { ok: errors.length === 0, errors, warnings };
}
