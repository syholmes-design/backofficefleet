/**
 * Versioning rules for the BOF document family graph.
 *
 * Locked decision: an already-approved carrier instance pinned to an older
 * master version REMAINS EFFECTIVE after a newer master version is published.
 * A SUPERSEDED master is closed for NEW adoption only; existing ADOPTED
 * instances pinned to it get a stale warning, never an error. Current master
 * is not the effective version for every existing carrier.
 *
 * One ACTIVE plus one in-flight (DRAFT..REVISION) version may coexist, for
 * masters (per family) and instances (per instanceId).
 *
 * Master version (master.version) and instance version (instanceVersion) are
 * distinct namespaces and are never compared with each other.
 *
 * Approval effectiveness lives in approval.ts, not here.
 */
import type {
  CarrierInstance,
  DocumentFamilyGraph,
  MasterDocument,
  Provenance,
} from "./types";
import type { FamilyIssue } from "./issues";
import { FAMILY_ISSUE_CODES, familyIssue, isBlank } from "./issues";
import { parseInstanceId } from "./ids";
import { isNewAdoptionAgainstSupersededMaster } from "./approval";

export const INFLIGHT_LIFECYCLES = [
  "DRAFT",
  "INTERNAL_REVIEW",
  "COMPLIANCE_REVIEW",
  "APPROVAL",
  "REVISION",
] as const;

export const RETIRED_LIFECYCLES = ["SUPERSEDED", "ARCHIVED"] as const;

export function isActiveLifecycle(l: string): boolean {
  return l === "ACTIVE";
}

export function isInflightLifecycle(l: string): boolean {
  return (INFLIGHT_LIFECYCLES as readonly string[]).includes(l);
}

export function isRetiredLifecycle(l: string): boolean {
  return (RETIRED_LIFECYCLES as readonly string[]).includes(l);
}

function instanceSubject(inst: CarrierInstance): string {
  return `${inst.instanceId}@${inst.instanceVersion}`;
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = out.get(k);
    if (list) list.push(item);
    else out.set(k, [item]);
  }
  return out;
}

export function validateVersioning(graph: DocumentFamilyGraph): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const C = FAMILY_ISSUE_CODES;

  // ---- Masters: at most one ACTIVE and one in-flight per family ----
  for (const [familyKey, masters] of groupBy(graph.masters, (m) => m.familyKey)) {
    const active = masters.filter((m) => isActiveLifecycle(m.lifecycle));
    const inflight = masters.filter((m) => isInflightLifecycle(m.lifecycle));
    if (active.length > 1) {
      const ids = active.map((m) => m.masterId).join(", ");
      for (const m of active.slice(1)) {
        issues.push(
          familyIssue(
            C.masterCurrentUnique,
            "error",
            m.masterId,
            `Family ${familyKey} has more than one ACTIVE master (${ids}).`,
          ),
        );
      }
    }
    if (inflight.length > 1) {
      const ids = inflight.map((m) => m.masterId).join(", ");
      for (const m of inflight.slice(1)) {
        issues.push(
          familyIssue(
            C.masterInflightUnique,
            "error",
            m.masterId,
            `Family ${familyKey} has more than one in-flight master (${ids}).`,
          ),
        );
      }
    }
  }

  // ---- Instances: version uniqueness and ACTIVE/in-flight uniqueness ----
  const instancesById = groupBy(graph.instances, (i) => i.instanceId);
  for (const [instanceId, versions] of instancesById) {
    const seen = new Set<string>();
    for (const inst of versions) {
      if (seen.has(inst.instanceVersion)) {
        issues.push(
          familyIssue(
            C.instanceVersionUnique,
            "error",
            instanceSubject(inst),
            `Instance ${instanceId} declares version ${inst.instanceVersion} more than once.`,
          ),
        );
      }
      seen.add(inst.instanceVersion);
    }

    const active = versions.filter((i) => isActiveLifecycle(i.lifecycle));
    const inflight = versions.filter((i) => isInflightLifecycle(i.lifecycle));
    if (active.length > 1) {
      const vs = active.map((i) => i.instanceVersion).join(", ");
      for (const inst of active.slice(1)) {
        issues.push(
          familyIssue(
            C.instanceCurrentUnique,
            "error",
            instanceSubject(inst),
            `Instance ${instanceId} has more than one ACTIVE version (${vs}).`,
          ),
        );
      }
    }
    if (inflight.length > 1) {
      const vs = inflight.map((i) => i.instanceVersion).join(", ");
      for (const inst of inflight.slice(1)) {
        issues.push(
          familyIssue(
            C.instanceInflightUnique,
            "error",
            instanceSubject(inst),
            `Instance ${instanceId} has more than one in-flight version (${vs}).`,
          ),
        );
      }
    }
  }

  const hasInstanceVersion = (instanceId: string, instanceVersion: string): boolean =>
    (instancesById.get(instanceId) ?? []).some((i) => i.instanceVersion === instanceVersion);

  // ---- Instances: master pin and supersedes chain ----
  const mastersById = new Map<string, MasterDocument>();
  for (const m of graph.masters) {
    if (!mastersById.has(m.masterId)) mastersById.set(m.masterId, m);
  }

  for (const inst of graph.instances) {
    const subject = instanceSubject(inst);

    if (inst.masterId === null) {
      issues.push(
        familyIssue(
          C.instanceMasterNotAuthored,
          "warning",
          subject,
          `Instance ${subject} has no BOF master authored yet.`,
        ),
      );
    } else {
      const master = mastersById.get(inst.masterId);
      if (!master) {
        issues.push(
          familyIssue(
            C.instanceMasterMissing,
            "error",
            subject,
            `Instance ${subject} pins master ${inst.masterId}, which does not exist.`,
          ),
        );
      } else if (master.familyKey !== inst.familyKey) {
        issues.push(
          familyIssue(
            C.instanceMasterMissing,
            "error",
            subject,
            `Instance ${subject} (family ${inst.familyKey}) pins master ${inst.masterId}, which belongs to family ${master.familyKey}.`,
          ),
        );
      } else if (isRetiredLifecycle(master.lifecycle)) {
        // Stale is a warning only: an adopted instance pinned to an older
        // master version stays effective after a newer master is published.
        issues.push(
          familyIssue(
            C.instanceMasterStale,
            "warning",
            subject,
            `Instance ${subject} is pinned to master ${master.masterId} v${master.version}, which is ${master.lifecycle}.`,
          ),
        );
        if (inst.adoption.status !== "ADOPTED") {
          issues.push(
            familyIssue(
              C.instanceMasterSupersededForNewAdoption,
              "error",
              subject,
              `Instance ${subject} is not adopted and targets master ${master.masterId} v${master.version}, which is ${master.lifecycle} and closed for new adoption.`,
            ),
          );
        } else if (isNewAdoptionAgainstSupersededMaster(master, inst)) {
          // "New" is decided by WHEN the adoption happened, not by its status:
          // an ADOPTED instance is an existing adoption only if its adoptedAt
          // is provably before the master's supersededAt.
          issues.push(
            familyIssue(
              C.instanceMasterSupersededForNewAdoption,
              "error",
              subject,
              `Instance ${subject} adoption (adoptedAt ${String(inst.adoption.adoptedAt)}) is not provably before master ${master.masterId} supersededAt ${String(master.supersededAt ?? null)}; a new adoption against a superseded master is prohibited.`,
            ),
          );
        }
      }
    }

    if (!isBlank(inst.supersedesInstanceVersion)) {
      const prev = inst.supersedesInstanceVersion as string;
      if (!hasInstanceVersion(inst.instanceId, prev)) {
        issues.push(
          familyIssue(
            C.instanceSupersedesMissing,
            "error",
            subject,
            `Instance ${subject} supersedes version ${prev}, which does not exist for ${inst.instanceId}.`,
          ),
        );
      }
    }
  }

  // ---- Provenance: DERIVED_FROM_INSTANCE targets ----
  // Expected family is the family of the document that carries the provenance.
  // A citation may not name an instance from any other family.
  const checkDerived = (subject: string, provenance: Provenance, expectedFamilyKey: string): void => {
    if (!provenance || provenance.origin !== "DERIVED_FROM_INSTANCE") return;
    const targetId = provenance.derivedFromInstanceId;
    // Missing target id is reported by provenance.ts (provenance.derived.missingTarget).
    if (isBlank(targetId)) return;
    const id = targetId as string;
    const versions = instancesById.get(id);
    if (versions === undefined) {
      issues.push(
        familyIssue(
          C.provenanceDerivedTargetNotFound,
          "error",
          subject,
          `${subject} is derived from instance ${id}, which does not exist.`,
        ),
      );
      return;
    }
    const targetVersion = provenance.derivedFromInstanceVersion;
    const versionKnown = !isBlank(targetVersion) && hasInstanceVersion(id, targetVersion as string);
    if (!isBlank(targetVersion) && !versionKnown) {
      issues.push(
        familyIssue(
          C.provenanceDerivedTargetVersionNotFound,
          "error",
          subject,
          `${subject} is derived from instance ${id}@${targetVersion}, which does not exist.`,
        ),
      );
    }
    const cited = (versionKnown ? versions.find((i) => i.instanceVersion === targetVersion) : versions[0]) ?? versions[0];
    const idFamily = parseInstanceId(id)?.familyKey ?? null;
    if (cited.familyKey !== expectedFamilyKey || (idFamily !== null && idFamily !== expectedFamilyKey)) {
      const actualFamily = cited.familyKey !== expectedFamilyKey ? cited.familyKey : idFamily;
      issues.push(
        familyIssue(
          C.provenanceDerivedFamilyMismatch,
          "error",
          subject,
          `${subject} (family ${expectedFamilyKey}) is derived from instance ${id}, which belongs to family ${actualFamily ?? cited.familyKey}.`,
        ),
      );
    }
  };
  for (const m of graph.masters) checkDerived(m.masterId, m.provenance, m.familyKey);
  for (const inst of graph.instances) checkDerived(instanceSubject(inst), inst.provenance, inst.familyKey);

  // ---- Records: pinned to an existing instance@version ----
  const recordIds = new Set<string>();
  for (const rec of graph.records) {
    if (recordIds.has(rec.recordId)) {
      issues.push(
        familyIssue(
          C.recordIdUnique,
          "error",
          rec.recordId,
          `Record id ${rec.recordId} is declared more than once.`,
        ),
      );
    }
    recordIds.add(rec.recordId);

    const versionBlank = isBlank(rec.instanceVersion);
    if (versionBlank) {
      issues.push(
        familyIssue(
          C.recordInstanceVersionEmpty,
          "error",
          rec.recordId,
          `Record ${rec.recordId} has no instance version.`,
        ),
      );
    }
    if (!instancesById.has(rec.instanceId)) {
      issues.push(
        familyIssue(
          C.recordInstanceMissing,
          "error",
          rec.recordId,
          `Record ${rec.recordId} references instance ${rec.instanceId}, which does not exist.`,
        ),
      );
    } else if (!versionBlank && !hasInstanceVersion(rec.instanceId, rec.instanceVersion)) {
      issues.push(
        familyIssue(
          C.recordInstanceVersionUnknown,
          "error",
          rec.recordId,
          `Record ${rec.recordId} is pinned to ${rec.instanceId}@${rec.instanceVersion}, which does not exist.`,
        ),
      );
    }
  }

  return issues;
}
