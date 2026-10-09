/**
 * Phase 2 document family registration guard.
 *
 *   node --import ./scripts/lib/ts-alias-loader.mjs ./scripts/validate-document-family-phase2.ts
 *
 * Read-only. Exit 1 on failure. Assert on issue codes, never message text.
 *
 * Frozen rule: an already-adopted instance pinned to an older approved master
 * that later becomes SUPERSEDED remains effective. This script must NOT expect
 * that case to error. The superseded negative fixture below is a NEW adoption
 * (NOT_ADOPTED), which must error as instance.master.supersededForNewAdoption.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as documentControlBarrel from "@/lib/document-control";
import * as familyBarrel from "@/lib/document-control/family";
import { CONTROLLED_DOCUMENT_ROSTER } from "@/lib/document-control/registry";
import { isMasterApproved, summarizeInstanceApproval } from "@/lib/document-control/family/approval";
import {
  liftControlledDocumentRoster,
  toControlledDocumentRecord,
} from "@/lib/document-control/family/compat";
import { isGlobalBofCode } from "@/lib/document-control/family/ids";
import { FAMILY_ISSUE_CODES as C } from "@/lib/document-control/family/issues";
import type { CarrierInstance, DocumentFamilyGraph } from "@/lib/document-control/family/types";
import { validateDocumentFamilyGraph } from "@/lib/document-control/family/validation";
import {
  buildPhase1CompatibilityGraph,
  buildPhase2DocumentFamilyGraph,
  PHASE2_COLLISIONS,
  PHASE2_COMPATIBILITY_QUALIFICATIONS,
  PHASE2_DELTA_FAMILY_QUALIFICATIONS,
  PHASE2_ROSTER_CLASSIFICATIONS,
  PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
} from "@/lib/document-control/family/phase2/graph";
import { PHASE2_DELTA_FAMILIES, PHASE2_DELTA_INSTANCES } from "@/lib/document-control/family/phase2/delta-instances";
import {
  PHASE2_CANDIDATE_SOURCE_CITATIONS,
  PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS,
  PHASE2_INSPECTION_ISSUE_CODES as IQ,
  PHASE2_QUALIFICATION_ISSUE_CODES as Q,
  buildCompatibilityQualifications,
  classifySourceBytes,
  collectPhase2CitationFacts,
  recordedDeltaCarrierTerms,
  validatePhase2QualificationRegister,
  validatePhase2UnreviewedInspections,
  type Phase2QualificationRegisterInput,
  type Phase2UnreviewedInspectionInput,
} from "@/lib/document-control/family/phase2/qualification";
import {
  PHASE2_CANDIDATE_CITATION_FIELDS,
  PHASE2_CANDIDATE_CITATIONS,
  PHASE2_MASTER_REVIEW_RELEASE_FIELDS,
  PHASE2_CANDIDATE_GATE_ISSUE_CODES as G,
  PHASE2_CANDIDACY_HOLDS,
  PHASE2_MASTER_REVIEW_RELEASES,
  citationRegisterIssues,
  canonicalMasterIdentity,
  classifyPhase2RegisterEntry,
  evaluatePhase2CandidateCitation,
  snapshotPhase2Citation,
  snapshotPhase2Release,
  evaluatePhase2MasterReviewRelease,
  type Phase2CandidateCitation,
  type Phase2CandidateGateContext,
  type Phase2CitationFacts,
} from "@/lib/document-control/family/phase2/candidate-gate";
import {
  PHASE2E_CARRIER_POLICY_SELECTIONS,
  PHASE2E_GENUINE_MASTER_STATE,
  PHASE2E_MASTER_APPROVALS,
  PHASE2E_MASTER_REVIEW_ISSUE_CODES as MR,
  PHASE2E_MASTER_REVIEWS,
  evaluatePhase2ECarrierPolicy,
  evaluatePhase2EMasterApproval,
  evaluatePhase2EMasterReview,
  type Phase2ECarrierPolicySelection,
  type Phase2EMasterReviewInput,
  type Phase2EPolicyProvision,
  type Phase2EReviewResult,
  type Phase2EReviewSubjects,
} from "@/lib/document-control/family/phase2/master-review";
import {
  LIFECYCLE_CANONICAL_INSTANCES,
  LIFECYCLE_CARRIER_ADOPTIONS,
  LIFECYCLE_GENUINE_MASTERS,
  LIFECYCLE_ISSUE_CODES as LC,
  LIFECYCLE_MASTER_APPROVALS,
  LIFECYCLE_OPERATIONAL_RECORDS,
  establishGenuineMaster,
  evaluateCanonicalInstance,
  evaluateCarrierAdoption,
  evaluateInflightInstance,
  evaluateMasterApproval,
  evaluateOperationalRecord,
} from "@/lib/document-control/family/phase2/lifecycle";
import {
  PHASE2_QUALIFICATION_BLOCKING_POSTURES,
  PHASE2_UNREVIEWED_INSPECTION_REASONS,
  type Phase2CompatibilityQualification,
} from "@/lib/document-control/family/phase2/types";

const EXPECTED_ROSTER = 64;
const EXPECTED_DELTA = 6;
const DELTA_CARRIER_ID = "delta-advanced-trucking";
const DELTA_FAMILY_KEYS = PHASE2_DELTA_FAMILIES.map((f) => f.familyKey);
/** Stripped forms that must not be stored as Delta carrier-local codes. */
const STRIPPED_DELTA_LOCAL_CODES = [
  "OPS-006",
  "OPS-007",
  "OPS-008",
  "OPS-009",
  "PAY-001",
  "PAY-002",
] as const;

function citesStrippedDeltaLocalCode(text: string): string | null {
  for (const code of STRIPPED_DELTA_LOCAL_CODES) {
    const found = new RegExp(`(?<!BOF-)${code}\\b`).test(text);
    if (found) return code;
  }
  return null;
}

type Report = ReturnType<typeof validateDocumentFamilyGraph>;
type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function check(name: string, fn: () => string | void): void {
  try {
    const detail = fn() ?? "";
    results.push({ name, ok: true, detail });
  } catch (e) {
    results.push({ name, ok: false, detail: (e as Error).message });
  }
}

function codesOf(issues: readonly { code: string }[]): string[] {
  return issues.map((i) => i.code);
}

function describe(r: Report): string {
  return `ok=${r.ok} errors=[${codesOf(r.errors).join(", ")}] warnings=[${codesOf(r.warnings).join(", ")}]`;
}

function expectCode(r: Report, severity: "error" | "warning", code: string): string {
  const pool = severity === "error" ? r.errors : r.warnings;
  assert.ok(codesOf(pool).includes(code), `expected ${severity} "${code}"; got ${describe(r)}`);
  if (severity === "error") assert.equal(r.ok, false, "ok must be false when errors exist");
  return `${severity} ${code}`;
}

function expectNoErrorCodes(r: Report): void {
  assert.equal(r.errors.length, 0, `expected 0 errors; got ${describe(r)}`);
  assert.equal(r.ok, true, `expected ok=true; got ${describe(r)}`);
}

function cloneGraph(graph: DocumentFamilyGraph): DocumentFamilyGraph {
  return structuredClone(graph);
}

function qualificationSourceExists(sourceRef: string): boolean {
  if (sourceRef.trim() === "" || sourceRef.includes("\0")) return false;
  const root = path.resolve(process.cwd());
  const abs = path.resolve(root, sourceRef);
  const relative = path.relative(root, abs);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function expectQualificationCode(
  issues: readonly { code: string }[],
  code: string,
): string {
  assert.ok(
    issues.some((issue) => issue.code === code),
    `expected ${code}; got [${issues.map((issue) => issue.code).join(", ")}]`,
  );
  return code;
}

function fixture(
  name: string,
  mutate: (g: DocumentFamilyGraph) => void,
  expect: (r: Report, g: DocumentFamilyGraph) => string | void,
): void {
  check(name, () => {
    const g = cloneGraph(phase2Graph);
    mutate(g);
    const r = validateDocumentFamilyGraph(g);
    return expect(r, g) ?? "";
  });
}

// ---------------------------------------------------------------------------
// 1. Phase 1 compatibility graph unchanged
// ---------------------------------------------------------------------------

const phase1Graph = buildPhase1CompatibilityGraph();
const phase1Report = validateDocumentFamilyGraph(phase1Graph);

check("1. Phase 1 compatibility graph shape (64/64/0/0/1)", () => {
  assert.equal(phase1Graph.families.length, EXPECTED_ROSTER);
  assert.equal(phase1Graph.masters.length, EXPECTED_ROSTER);
  assert.equal(phase1Graph.instances.length, 0);
  assert.equal(phase1Graph.records.length, 0);
  assert.equal(phase1Graph.carriers.length, 1);
  return `carriers=${phase1Graph.carriers.map((c) => c.carrierId).join(",")}`;
});

check("1. Phase 1 validateDocumentFamilyGraph has 0 errors", () => {
  expectNoErrorCodes(phase1Report);
  return `${phase1Report.warnings.length} warnings`;
});

// ---------------------------------------------------------------------------
// 2. Roster round-trip
// ---------------------------------------------------------------------------

const lifted = liftControlledDocumentRoster();

check("2. Roster round-trip 64/64 deep-equal", () => {
  assert.equal(lifted.length, EXPECTED_ROSTER);
  assert.equal(CONTROLLED_DOCUMENT_ROSTER.length, EXPECTED_ROSTER);
  lifted.forEach((entry, i) => {
    assert.deepStrictEqual(
      toControlledDocumentRecord(entry),
      CONTROLLED_DOCUMENT_ROSTER[i],
      `round-trip mismatch for ${CONTROLLED_DOCUMENT_ROSTER[i].code}`,
    );
  });
  return `${lifted.length}/${EXPECTED_ROSTER}`;
});

// ---------------------------------------------------------------------------
// 3. Roster classifications
// ---------------------------------------------------------------------------

check("3. PHASE2_ROSTER_CLASSIFICATIONS length 64, keys, masters, genuineBofMaster", () => {
  assert.equal(PHASE2_ROSTER_CLASSIFICATIONS.length, EXPECTED_ROSTER);
  const classKeys = PHASE2_ROSTER_CLASSIFICATIONS.map((c) => c.familyKey);
  const rosterCodes = CONTROLLED_DOCUMENT_ROSTER.map((r) => r.code);
  assert.equal(new Set(classKeys).size, EXPECTED_ROSTER, "classification family keys must be unique");
  assert.deepEqual([...classKeys].sort(), [...rosterCodes].sort());
  for (const row of PHASE2_ROSTER_CLASSIFICATIONS) {
    assert.equal(row.genuineBofMaster, false, `${row.familyKey} genuineBofMaster`);
    const roster = CONTROLLED_DOCUMENT_ROSTER.find((r) => r.code === row.familyKey);
    assert.ok(roster, `missing roster row for ${row.familyKey}`);
    assert.equal(row.compatibilityMasterId, `${roster.code}@${roster.version}`);
  }
  return `${PHASE2_ROSTER_CLASSIFICATIONS.length} classifications`;
});

check("3b. Compatibility masters are not approved and have no approval evidence", () => {
  assert.equal(phase1Graph.masters.length, EXPECTED_ROSTER);
  for (const master of phase1Graph.masters) {
    assert.equal(master.approval.scope, "BOF_MASTER", master.masterId);
    assert.notEqual(master.approval.status, "APPROVED", master.masterId);
    assert.equal(master.approval.approverName, null, master.masterId);
    assert.equal(master.approval.approvedAt, null, master.masterId);
    assert.equal(master.approval.evidenceRef, null, master.masterId);
    assert.equal(master.approval.revocation ?? null, null, master.masterId);
    assert.equal(isMasterApproved(master), false, `${master.masterId} must not be approved`);
    const row = PHASE2_ROSTER_CLASSIFICATIONS.find((c) => c.familyKey === master.familyKey);
    assert.equal(row?.genuineBofMaster, false, master.familyKey);
    assert.equal(row?.compatibilityMasterId, master.masterId, master.familyKey);
  }
  return "64 compatibility masters unapproved";
});

// ---------------------------------------------------------------------------
// 4–7. Phase 2 graph
// ---------------------------------------------------------------------------

const phase2Graph = buildPhase2DocumentFamilyGraph();
const phase2Report = validateDocumentFamilyGraph(phase2Graph);

check("4. Phase 2 graph shape (70 families, 64 masters, 6 instances, 0 records)", () => {
  assert.equal(phase2Graph.families.length, EXPECTED_ROSTER + EXPECTED_DELTA);
  assert.equal(phase2Graph.masters.length, EXPECTED_ROSTER);
  assert.equal(phase2Graph.instances.length, EXPECTED_DELTA);
  assert.equal(phase2Graph.records.length, 0);
  assert.equal(PHASE2_DELTA_FAMILIES.length, EXPECTED_DELTA);
  assert.equal(PHASE2_DELTA_INSTANCES.length, EXPECTED_DELTA);
  return `families=${phase2Graph.families.length}`;
});

check("5. Each delta instance: null master, CARRIER_ORIGINATED, NOT_ADOPTED, unknown localCode, printed number kept", () => {
  const deltaKeys = new Set(DELTA_FAMILY_KEYS);
  assert.equal(deltaKeys.size, EXPECTED_DELTA);
  for (const inst of phase2Graph.instances) {
    assert.equal(inst.masterId, null, `${inst.instanceId} masterId`);
    assert.equal(inst.provenance.origin, "CARRIER_ORIGINATED", `${inst.instanceId} origin`);
    assert.equal(inst.adoption.status, "NOT_ADOPTED", `${inst.instanceId} adoption`);
    assert.equal(inst.adoption.carrierId, DELTA_CARRIER_ID);
    assert.equal(inst.carrierId, DELTA_CARRIER_ID);
    assert.notEqual(inst.lifecycle, "ACTIVE", `${inst.instanceId} must not be ACTIVE`);
    assert.equal(inst.localCode, null, `${inst.instanceId} must not invent a local code`);
    const stripped = inst.familyKey.startsWith("BOF-") ? inst.familyKey.slice("BOF-".length) : inst.familyKey;
    assert.notEqual(inst.localCode, stripped, `${inst.instanceId} must not strip ${inst.familyKey}`);
    assert.ok(
      (STRIPPED_DELTA_LOCAL_CODES as readonly string[]).includes(stripped),
      `${stripped} expected among the six printed BOF numbers`,
    );
    const printedNote = inst.provenance.sourceRefs
      .map((ref) => ref.note ?? "")
      .join("\n");
    assert.ok(
      printedNote.includes(`Printed document number: ${inst.familyKey}`),
      `${inst.instanceId} provenance must keep printed ${inst.familyKey}`,
    );
    assert.equal(
      citesStrippedDeltaLocalCode(printedNote),
      null,
      `${inst.instanceId} provenance note must not use a stripped local code`,
    );
    assert.ok(deltaKeys.has(inst.familyKey), `${inst.familyKey} not a delta family`);
    const mastersForFamily = phase2Graph.masters.filter((m) => m.familyKey === inst.familyKey);
    assert.equal(mastersForFamily.length, 0, `${inst.familyKey} must have no master`);
  }
  const uniqueLocal = phase2Report.errors.filter((e) => e.code === C.localCodeUniqueInCarrier);
  assert.equal(uniqueLocal.length, 0, "unknown local codes must not count as duplicates");
  return `${phase2Graph.instances.length} delta instances with null localCode`;
});

check("5b. Delta localCodePrefix stays unresolved, including the empty-string candidate", () => {
  const delta = phase2Graph.carriers.find((c) => c.carrierId === DELTA_CARRIER_ID);
  assert.ok(delta, "Delta carrier profile missing");
  assert.equal(delta.localCodePrefix.status, "CONFLICTING");
  assert.equal(delta.localCodePrefix.value, null);
  const candidates = (delta.localCodePrefix.conflictingValues ?? []).map((c) => c.value);
  assert.ok(candidates.includes("DAT"), "DAT prefix candidate must remain");
  assert.ok(candidates.includes(""), "empty-string prefix candidate must remain unresolved");
  return `candidates=${candidates.map((v) => JSON.stringify(v)).join(",")}`;
});

check("6. Phase 2 validates with 0 errors; six instance.master.notAuthored warnings", () => {
  expectNoErrorCodes(phase2Report);
  const notAuthored = phase2Report.warnings.filter((w) => w.code === C.instanceMasterNotAuthored);
  assert.equal(notAuthored.length, EXPECTED_DELTA, `notAuthored: ${codesOf(notAuthored).join(", ")}`);
  for (const inst of phase2Graph.instances) {
    const subject = `${inst.instanceId}@${inst.instanceVersion}`;
    assert.ok(
      notAuthored.some((w) => w.subject === subject),
      `missing instance.master.notAuthored for ${subject}`,
    );
  }
  const allowedWarn = new Set<string>([
    C.carrierFactConflicting,
    C.carrierFactNotRecorded,
    C.instanceMasterNotAuthored,
  ]);
  const unexpected = phase2Report.warnings.filter((w) => !allowedWarn.has(w.code));
  assert.equal(unexpected.length, 0, `unexpected warnings: ${codesOf(unexpected).join(", ")}`);
  return describe(phase2Report);
});

check("7. No delta instance is effective (summarize with null master)", () => {
  for (const inst of phase2Graph.instances) {
    // Do not call isMasterApproved on a missing master.
    const summary = summarizeInstanceApproval(null, inst);
    assert.equal(summary.instanceEffective, false, `${inst.instanceId} must not be effective`);
    assert.equal(summary.masterApproved, false, `${inst.instanceId} masterApproved`);
    assert.equal(summary.masterApprovalSource, "NONE");
  }
  return `${phase2Graph.instances.length} not effective`;
});

// ---------------------------------------------------------------------------
// 8. Collisions
// ---------------------------------------------------------------------------

check("8. Collisions UNRESOLVED / DO_NOT_MERGE; required family keys; no delta/roster dupes", () => {
  assert.ok(PHASE2_COLLISIONS.length >= 12, `collisions length ${PHASE2_COLLISIONS.length}`);
  for (const c of PHASE2_COLLISIONS) {
    assert.equal(c.status, "UNRESOLVED", c.collisionId);
    assert.equal(c.decision, "DO_NOT_MERGE", c.collisionId);
    for (const doc of c.distinctDocuments) {
      if (doc.localCode !== null && doc.localCode !== undefined) {
        assert.equal(
          isGlobalBofCode(doc.localCode),
          false,
          `collision ${c.collisionId} localCode ${doc.localCode}`,
        );
        assert.equal(
          (STRIPPED_DELTA_LOCAL_CODES as readonly string[]).includes(doc.localCode),
          false,
          `collision ${c.collisionId} must not invent localCode ${doc.localCode}`,
        );
      }
      if (doc.familyKey !== null && DELTA_FAMILY_KEYS.includes(doc.familyKey)) {
        assert.equal(doc.localCode, null, `${c.collisionId} ${doc.familyKey} localCode`);
        assert.ok(
          doc.source.includes(`Printed document number: ${doc.familyKey}`),
          `${c.collisionId} must keep printed ${doc.familyKey}`,
        );
      }
    }
  }
  for (const row of PHASE2_ROSTER_CLASSIFICATIONS) {
    const stripped = citesStrippedDeltaLocalCode(row.note);
    assert.equal(stripped, null, `${row.familyKey} note uses stripped local code ${stripped}`);
  }
  const collisionFamilyKeys = new Set(
    PHASE2_COLLISIONS.flatMap((c) =>
      c.distinctDocuments.map((d) => d.familyKey).filter((k): k is string => k !== null),
    ),
  );
  for (const required of ["BOF-OPS-001", "BOF-FIN-POL-001", "BOF-FIN-REC-001"]) {
    assert.ok(collisionFamilyKeys.has(required), `collisions must mention ${required}`);
  }
  const rosterCodes = new Set(CONTROLLED_DOCUMENT_ROSTER.map((r) => r.code));
  for (const key of DELTA_FAMILY_KEYS) {
    assert.equal(rosterCodes.has(key), false, `delta family ${key} must not duplicate a roster code`);
  }
  return `${PHASE2_COLLISIONS.length} collisions`;
});

// ---------------------------------------------------------------------------
// 9. Negative fixtures (structured clones only)
// ---------------------------------------------------------------------------

fixture(
  "9a. duplicate delta family key → family.key.unique",
  (g) => {
    g.families.push(structuredClone(PHASE2_DELTA_FAMILIES[0]));
  },
  (r) => expectCode(r, "error", C.familyKeyUnique),
);

fixture(
  "9b. two instances, same supplied local code, same carrier → localCode.unique.inCarrier",
  (g) => {
    const supplied = "DAT-LOC-001";
    const first = g.instances.find((i) => i.familyKey === "BOF-OPS-006");
    assert.ok(first, "BOF-OPS-006 instance required");
    assert.equal(first.localCode, null, "fixture must start from an unknown Delta local code");
    first.localCode = supplied;
    const otherFamily = g.families.find((f) => f.familyKey !== "BOF-OPS-006")!;
    const dup: CarrierInstance = {
      instanceId: `${otherFamily.familyKey}::${DELTA_CARRIER_ID}`,
      familyKey: otherFamily.familyKey,
      carrierId: DELTA_CARRIER_ID,
      masterId: null,
      instanceVersion: "1.0",
      localCode: supplied,
      localTitle: "Duplicate local code fixture",
      lifecycle: "INTERNAL_REVIEW",
      adoption: {
        scope: "CARRIER_ADOPTION",
        carrierId: DELTA_CARRIER_ID,
        status: "NOT_ADOPTED",
        adoptedByName: null,
        adoptedByTitle: null,
        adoptedAt: null,
        evidenceRef: null,
      },
      overrides: [],
      provenance: {
        origin: "CARRIER_ORIGINATED",
        sourceRefs: [{ kind: "OTHER", ref: "fixture://localCode.unique" }],
      },
      stableAppIds: [],
    };
    // Avoid colliding with an existing instanceId for that family.
    if (g.instances.some((i) => i.instanceId === dup.instanceId)) {
      const rosterFamily = g.families.find(
        (f) =>
          !DELTA_FAMILY_KEYS.includes(f.familyKey) &&
          !g.instances.some((i) => i.familyKey === f.familyKey),
      )!;
      dup.familyKey = rosterFamily.familyKey;
      dup.instanceId = `${rosterFamily.familyKey}::${DELTA_CARRIER_ID}`;
    }
    g.instances.push(dup);
  },
  (r) => expectCode(r, "error", C.localCodeUniqueInCarrier),
);

fixture(
  "9c. localCode BOF-SAF-POL-099 → localCode.globalFormat",
  (g) => {
    g.instances[0].localCode = "BOF-SAF-POL-099";
  },
  (r) => expectCode(r, "error", C.localCodeGlobalFormat),
);

fixture(
  "9c2. another instance with null localCode is not localCode.unique.inCarrier",
  (g) => {
    const rosterFamily = g.families.find(
      (f) =>
        !DELTA_FAMILY_KEYS.includes(f.familyKey) &&
        !g.instances.some((i) => i.familyKey === f.familyKey),
    );
    assert.ok(rosterFamily, "roster family without an instance required");
    g.instances.push({
      instanceId: `${rosterFamily.familyKey}::${DELTA_CARRIER_ID}`,
      familyKey: rosterFamily.familyKey,
      carrierId: DELTA_CARRIER_ID,
      masterId: null,
      instanceVersion: "1.0",
      localCode: null,
      localTitle: "Unknown local code fixture",
      lifecycle: "INTERNAL_REVIEW",
      adoption: {
        scope: "CARRIER_ADOPTION",
        carrierId: DELTA_CARRIER_ID,
        status: "NOT_ADOPTED",
        adoptedByName: null,
        adoptedByTitle: null,
        adoptedAt: null,
        evidenceRef: null,
      },
      overrides: [],
      provenance: {
        origin: "CARRIER_ORIGINATED",
        sourceRefs: [{ kind: "OTHER", ref: "fixture://localCode.unknown" }],
      },
      stableAppIds: [],
    });
  },
  (r) => {
    assert.equal(
      r.errors.some((e) => e.code === C.localCodeUniqueInCarrier),
      false,
      `unknown local codes were treated as duplicates; ${describe(r)}`,
    );
    expectNoErrorCodes(r);
    return "null local codes are not duplicates";
  },
);

fixture(
  "9d. masterId BOF-OPS-006@9.9 → instance.master.missing",
  (g) => {
    const inst = g.instances.find((i) => i.familyKey === "BOF-OPS-006") ?? g.instances[0];
    inst.masterId = "BOF-OPS-006@9.9";
  },
  (r) => expectCode(r, "error", C.instanceMasterMissing),
);

fixture(
  "9e. provenance.origin NOPE → provenance.origin.invalid",
  (g) => {
    (g.instances[0].provenance as { origin: string }).origin = "NOPE";
  },
  (r) => expectCode(r, "error", C.provenanceOriginInvalid),
);

fixture(
  "9f. adoption.carrierId mismatch → approval.adoption.carrierMismatch",
  (g) => {
    g.instances[0].adoption.carrierId = "other-carrier-id";
  },
  (r) => expectCode(r, "error", C.approvalAdoptionCarrierMismatch),
);

fixture(
  "9g. DERIVED_FROM_INSTANCE other family → provenance.derived.familyMismatch",
  (g) => {
    const a = g.instances[0];
    const b = g.instances.find((i) => i.familyKey !== a.familyKey)!;
    a.provenance = {
      origin: "DERIVED_FROM_INSTANCE",
      sourceRefs: [{ kind: "OTHER", ref: "fixture://derived" }],
      derivedFromInstanceId: b.instanceId,
      derivedFromInstanceVersion: "1.0",
    };
  },
  (r) => expectCode(r, "error", C.provenanceDerivedFamilyMismatch),
);

fixture(
  "9h. lifecycle ACTIVE without effective → approval.instance.activeNotEffective",
  (g) => {
    g.instances[0].lifecycle = "ACTIVE";
    // still no approved master, adoption NOT_ADOPTED
  },
  (r) => expectCode(r, "error", C.approvalInstanceActiveNotEffective),
);

fixture(
  "9i. NEW adoption on SUPERSEDED roster master → instance.master.supersededForNewAdoption",
  (g) => {
    // Frozen rule: adopted-on-older-approved-then-superseded must NOT error.
    // This fixture is a NEW (NOT_ADOPTED) adoption only.
    const master = g.masters.find((m) =>
      CONTROLLED_DOCUMENT_ROSTER.some((r) => r.code === m.familyKey),
    );
    assert.ok(master, "roster master required");
    master.lifecycle = "SUPERSEDED";
    const familyKey = master.familyKey;
    assert.equal(
      g.instances.some((i) => i.familyKey === familyKey),
      false,
      "roster family must not already have a delta instance",
    );
    g.instances.push({
      instanceId: `${familyKey}::${DELTA_CARRIER_ID}`,
      familyKey,
      carrierId: DELTA_CARRIER_ID,
      masterId: master.masterId,
      instanceVersion: "1.0",
      localCode: "TMP-001",
      localTitle: "Stale master new-adoption fixture",
      lifecycle: "INTERNAL_REVIEW",
      adoption: {
        scope: "CARRIER_ADOPTION",
        carrierId: DELTA_CARRIER_ID,
        status: "NOT_ADOPTED",
        adoptedByName: null,
        adoptedByTitle: null,
        adoptedAt: null,
        evidenceRef: null,
      },
      overrides: [],
      provenance: {
        origin: "BOF_AUTHORED",
        sourceRefs: [{ kind: "OTHER", ref: "fixture://superseded-new-adoption" }],
      },
      stableAppIds: [],
    });
  },
  (r) => {
    expectCode(r, "error", C.instanceMasterSupersededForNewAdoption);
    // warning instance.master.stale is also fine
    return describe(r);
  },
);

// ---------------------------------------------------------------------------
// 10. Genuine-master qualification register
// ---------------------------------------------------------------------------

function liveQualificationInput(
  overrides: Partial<Phase2QualificationRegisterInput> = {},
): Phase2QualificationRegisterInput {
  return {
    classifications: PHASE2_ROSTER_CLASSIFICATIONS,
    compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS,
    deltaRows: PHASE2_DELTA_FAMILY_QUALIFICATIONS,
    deltaFamilyKeys: PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS,
    sourceExists: qualificationSourceExists,
    masters: phase2Graph.masters.map((master) => ({
      familyKey: master.familyKey,
      masterId: master.masterId,
      approvalStatus: master.approval.status,
    })),
    instanceFamilyKeys: phase2Graph.instances.map((instance) => instance.familyKey),
    adoptedFamilyKeys: phase2Graph.instances
      .filter((instance) => summarizeInstanceApproval(null, instance).carrierAdopted)
      .map((instance) => instance.familyKey),
    effectiveFamilyKeys: phase2Graph.instances
      .filter((instance) => summarizeInstanceApproval(null, instance).instanceEffective)
      .map((instance) => instance.familyKey),
    recordCount: phase2Graph.records.length,
    candidateCitations: PHASE2_CANDIDATE_CITATIONS,
    masterReviewReleases: PHASE2_MASTER_REVIEW_RELEASES,
    ...overrides,
  };
}

function unclassifiedQualification() {
  const row = PHASE2_COMPATIBILITY_QUALIFICATIONS.find((item) => item.contentPosture === "UNCLASSIFIED");
  assert.ok(row, "expected an UNCLASSIFIED compatibility master for the CANDIDATE negative fixture");
  return row;
}

function compatibilityRowsWithCandidate(sourceRef: string | null) {
  const sample = unclassifiedQualification();
  return PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
    row.compatibilityMasterId === sample.compatibilityMasterId
      ? { ...row, result: "CANDIDATE" as const, sourceRef }
      : row,
  );
}

check("10. One qualification row per compatibility master; ids unique", () => {
  assert.equal(PHASE2_CANDIDATE_SOURCE_CITATIONS.length, 0);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.length, EXPECTED_ROSTER);
  assert.deepEqual(
    PHASE2_COMPATIBILITY_QUALIFICATIONS,
    buildCompatibilityQualifications(PHASE2_ROSTER_CLASSIFICATIONS),
  );
  const ids = PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) => row.compatibilityMasterId);
  assert.equal(new Set(ids).size, EXPECTED_ROSTER);
  for (const classification of PHASE2_ROSTER_CLASSIFICATIONS) {
    const matches: readonly Phase2CompatibilityQualification[] =
      PHASE2_COMPATIBILITY_QUALIFICATIONS.filter(
        (item) => item.compatibilityMasterId === classification.compatibilityMasterId,
      );
    assert.equal(matches.length, 1, classification.compatibilityMasterId);
    assert.equal(matches[0].familyKey, classification.familyKey);
    assert.equal(matches[0].contentPosture, classification.contentPosture);
    assert.equal(classification.genuineBofMaster, false);
    assert.ok(matches[0].note.trim().length > 0, classification.familyKey);
    const master = phase2Graph.masters.find((item) => item.masterId === classification.compatibilityMasterId);
    assert.ok(master, classification.compatibilityMasterId);
    assert.equal(master.familyKey, classification.familyKey);
  }
  const issues = validatePhase2QualificationRegister(liveQualificationInput());
  assert.deepEqual(issues, [], issues.map((issue) => issue.code).join(", "));
  return `${ids.length} qualification rows`;
});

check("10b. Blocking postures and six Delta families are BLOCKED", () => {
  const blocking = new Set<string>(PHASE2_QUALIFICATION_BLOCKING_POSTURES);
  const counts: Record<string, number> = {};
  for (const posture of PHASE2_QUALIFICATION_BLOCKING_POSTURES) counts[posture] = 0;
  let unreviewed = 0;
  let candidate = 0;
  for (const row of PHASE2_COMPATIBILITY_QUALIFICATIONS) {
    if (blocking.has(row.contentPosture)) {
      assert.equal(row.result, "BLOCKED", `${row.familyKey} ${row.contentPosture}`);
      assert.equal(row.sourceRef, null, row.familyKey);
      counts[row.contentPosture] += 1;
    } else {
      assert.equal(row.contentPosture, "UNCLASSIFIED", row.familyKey);
      assert.equal(row.result, "UNREVIEWED", row.familyKey);
      assert.equal(row.sourceRef, null, row.familyKey);
      unreviewed += 1;
    }
    assert.notEqual(row.result, "CANDIDATE", row.familyKey);
  }
  assert.deepEqual(
    [...PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS],
    ["BOF-OPS-006", "BOF-OPS-007", "BOF-OPS-008", "BOF-OPS-009", "BOF-PAY-001", "BOF-PAY-002"],
  );
  assert.equal(PHASE2_DELTA_FAMILY_QUALIFICATIONS.length, EXPECTED_DELTA);
  const deltaKeys = new Set(PHASE2_DELTA_FAMILIES.map((family) => family.familyKey));
  for (const row of PHASE2_DELTA_FAMILY_QUALIFICATIONS) {
    assert.equal(row.result, "BLOCKED", row.familyKey);
    assert.equal(row.compatibilityMasterId, null, row.familyKey);
    assert.equal(row.sourceRef, null, row.familyKey);
    assert.ok(row.note.trim().length > 0, row.familyKey);
    assert.ok(deltaKeys.has(row.familyKey), row.familyKey);
    assert.equal(
      phase2Graph.masters.some((master) => master.familyKey === row.familyKey),
      false,
      `${row.familyKey} must not gain a master`,
    );
    assert.equal(
      PHASE2_COMPATIBILITY_QUALIFICATIONS.some((item) => item.familyKey === row.familyKey),
      false,
      `${row.familyKey} must not be a compatibility master`,
    );
  }
  candidate = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length;
  const blocked = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "BLOCKED").length;
  return `BLOCKED=${blocked} UNREVIEWED=${unreviewed} CANDIDATE=${candidate} postures=${JSON.stringify(counts)} deltaBlocked=${PHASE2_DELTA_FAMILY_QUALIFICATIONS.length}`;
});

check("10c. Qualification does not approve, adopt, instantiate, or record", () => {
  assert.equal(phase2Graph.families.length, EXPECTED_ROSTER + EXPECTED_DELTA);
  assert.equal(phase2Graph.masters.length, EXPECTED_ROSTER);
  assert.equal(phase2Graph.instances.length, EXPECTED_DELTA);
  assert.equal(phase2Graph.records.length, 0);
  assert.equal(PHASE2_COLLISIONS.length, 12);
  for (const collision of PHASE2_COLLISIONS) {
    assert.equal(collision.status, "UNRESOLVED", collision.collisionId);
    assert.equal(collision.decision, "DO_NOT_MERGE", collision.collisionId);
  }
  for (const master of phase2Graph.masters) {
    assert.notEqual(master.approval.status, "APPROVED", master.masterId);
    assert.equal(isMasterApproved(master), false, master.masterId);
  }
  for (const instance of phase2Graph.instances) {
    const summary = summarizeInstanceApproval(null, instance);
    assert.equal(summary.carrierAdopted, false, instance.instanceId);
    assert.equal(summary.instanceEffective, false, instance.instanceId);
    assert.equal(summary.masterApproved, false, instance.instanceId);
  }
  return "70/64/6/0, approved=0, collisions=12 UNRESOLVED/DO_NOT_MERGE";
});

check("10d. Qualification register is not exported through a production barrel", () => {
  const hidden = [
    "PHASE2_COMPATIBILITY_QUALIFICATIONS",
    "PHASE2_DELTA_FAMILY_QUALIFICATIONS",
    "PHASE2_CANDIDATE_SOURCE_CITATIONS",
    "validatePhase2QualificationRegister",
    "buildPhase2DocumentFamilyGraph",
  ];
  for (const name of hidden) {
    assert.equal(name in familyBarrel, false, `family barrel exports ${name}`);
    assert.equal(name in documentControlBarrel, false, `document-control barrel exports ${name}`);
  }
  return "family/index.ts and document-control/index.ts do not export Phase 2B";
});

check("10e. Missing qualification row is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.slice(1),
    }),
  );
  return expectQualificationCode(issues, Q.missingRow);
});

check("10f. Duplicate compatibilityMasterId is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: [
        ...PHASE2_COMPATIBILITY_QUALIFICATIONS,
        PHASE2_COMPATIBILITY_QUALIFICATIONS[0],
      ],
    }),
  );
  return expectQualificationCode(issues, Q.duplicateRow);
});

check("10g. Unknown compatibilityMasterId is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: [
        ...PHASE2_COMPATIBILITY_QUALIFICATIONS,
        {
          compatibilityMasterId: "BOF-NOT-A-FAMILY@1.0",
          familyKey: "BOF-NOT-A-FAMILY",
          result: "UNREVIEWED",
          contentPosture: "UNCLASSIFIED",
          sourceRef: null,
        },
      ],
    }),
  );
  return expectQualificationCode(issues, Q.unknownRow);
});

check("10h. Blocking posture cannot be UNREVIEWED or CANDIDATE", () => {
  const blocked = PHASE2_COMPATIBILITY_QUALIFICATIONS.find(
    (row) => row.contentPosture === "COLLISION_PRESENT",
  );
  assert.ok(blocked, "expected a COLLISION_PRESENT row");
  const unreviewed = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
        row.compatibilityMasterId === blocked.compatibilityMasterId
          ? { ...row, result: "UNREVIEWED" as const }
          : row,
      ),
    }),
  );
  expectQualificationCode(unreviewed, Q.blockedRequired);
  const candidate = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
        row.compatibilityMasterId === blocked.compatibilityMasterId
          ? {
              ...row,
              result: "CANDIDATE" as const,
              sourceRef: "scripts/validate-document-family-phase2.ts",
            }
          : row,
      ),
    }),
  );
  expectQualificationCode(candidate, Q.candidateOnBlocked);
  const built = buildCompatibilityQualifications(PHASE2_ROSTER_CLASSIFICATIONS, [
    {
      familyKey: blocked.familyKey,
      sourceRef: "scripts/validate-document-family-phase2.ts",
    },
  ]);
  const builtRow = built.find((row) => row.familyKey === blocked.familyKey);
  assert.equal(builtRow?.result, "BLOCKED");
  assert.equal(builtRow?.sourceRef, null);
  assert.equal(built.filter((row) => row.result === "CANDIDATE").length, 0);
  return `${Q.blockedRequired}; ${Q.candidateOnBlocked}`;
});

check("10i. Delta family cannot become CANDIDATE or receive a master id", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      deltaRows: PHASE2_DELTA_FAMILY_QUALIFICATIONS.map((row) =>
        row.familyKey === "BOF-OPS-006"
          ? {
              ...row,
              result: "CANDIDATE",
              compatibilityMasterId: "BOF-OPS-006@1.0",
              sourceRef: "source-assets/policies/BOF-OPS-006 Settlement Hold Notice.docx",
            }
          : row,
      ),
    }),
  );
  expectQualificationCode(issues, Q.deltaNotBlocked);
  expectQualificationCode(issues, Q.deltaMasterId);
  expectQualificationCode(issues, Q.candidateOnDelta);
  return `${Q.deltaNotBlocked}; ${Q.deltaMasterId}`;
});

check("10j. CANDIDATE without a source reference is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({ compatibilityRows: compatibilityRowsWithCandidate(null) }),
  );
  return expectQualificationCode(issues, Q.candidateSourceMissing);
});

check("10k. CANDIDATE source that is not in the repository is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: compatibilityRowsWithCandidate(
        "source-assets/policies/qualification-source-does-not-exist.txt",
      ),
    }),
  );
  return expectQualificationCode(issues, Q.candidateSourceAbsent);
});

check("10l. CANDIDATE cannot approve a master, create adoption, an instance, a record, or effectiveness", () => {
  const sample = unclassifiedQualification();
  const candidateRows = compatibilityRowsWithCandidate("scripts/validate-document-family-phase2.ts");
  assert.equal(qualificationSourceExists("scripts/validate-document-family-phase2.ts"), true);
  const approved = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: candidateRows,
      masters: phase2Graph.masters.map((master) => ({
        familyKey: master.familyKey,
        masterId: master.masterId,
        approvalStatus: master.familyKey === sample.familyKey ? "APPROVED" : master.approval.status,
      })),
    }),
  );
  expectQualificationCode(approved, Q.candidateApproved);
  expectQualificationCode(approved, Q.masterApproved);
  const instance = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: candidateRows,
      instanceFamilyKeys: [...phase2Graph.instances.map((item) => item.familyKey), sample.familyKey],
    }),
  );
  expectQualificationCode(instance, Q.candidateInstance);
  const adopted = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: candidateRows,
      adoptedFamilyKeys: [sample.familyKey],
    }),
  );
  expectQualificationCode(adopted, Q.candidateAdoption);
  const effective = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: candidateRows,
      effectiveFamilyKeys: [sample.familyKey],
    }),
  );
  expectQualificationCode(effective, Q.candidateEffective);
  const recorded = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: candidateRows,
      recordCount: 1,
    }),
  );
  expectQualificationCode(recorded, Q.candidateRecord);
  expectQualificationCode(recorded, Q.recordPresent);
  assert.equal(phase2Graph.records.length, 0);
  assert.equal(phase2Graph.instances.length, EXPECTED_DELTA);
  assert.equal(
    phase2Graph.masters.filter((master) => isMasterApproved(master)).length,
    0,
  );
  return `${Q.candidateApproved}; ${Q.candidateInstance}; ${Q.candidateAdoption}; ${Q.candidateRecord}; ${Q.candidateEffective}`;
});

check("10m. genuineBofMaster true is rejected", () => {
  const issues = validatePhase2QualificationRegister(
    liveQualificationInput({
      classifications: PHASE2_ROSTER_CLASSIFICATIONS.map((row, index) =>
        index === 0 ? { ...row, genuineBofMaster: true } : row,
      ),
    }),
  );
  return expectQualificationCode(issues, Q.genuineBofMaster);
});

// ---------------------------------------------------------------------------
// 11. UNREVIEWED evidence inspections
// ---------------------------------------------------------------------------

const PHASE2C_INSPECTION_IDS = [
  "BOF-SAF-SOP-002@3.1",
  "BOF-ONB-CHK-001@1.1",
  "BOF-HR-ACK-001@1.1",
  "BOF-DRV-REC-001@1.0",
  "BOF-DRV-REC-002@1.0",
  "BOF-DRV-REC-003@1.0",
  "BOF-DRV-REC-004@1.0",
  "BOF-HR-FORM-009@official",
  "BOF-FIN-FORM-009@official",
  "BOF-OPS-EVD-001@1.0",
  "BOF-OPS-EVD-002@1.0",
  "BOF-SEC-EVD-001@existing",
  "BOF-CUS-AGR-001@1.0",
  "BOF-SAF-POL-002@0.1",
  "BOF-DRV-FORM-001@1.0",
  "BOF-DRV-FORM-002@1.0",
  "BOF-DRV-FORM-003@1.0",
  "BOF-EQP-FORM-001@1.0",
  "BOF-SAF-FORM-004@1.0",
  "BOF-DRV-REC-005@1.0",
  "BOF-DRV-REC-006@1.0",
  "BOF-DRV-REC-007@1.0",
  "BOF-DRV-REC-008@1.0",
  "BOF-DRV-REC-009@1.0",
  "BOF-OPS-FORM-001@1.0",
  "BOF-OPS-EVD-004@1.0",
  "BOF-SAF-FORM-005@1.0",
  "BOF-CUS-AGR-002@1.0",
  "BOF-HR-FORM-001@1.0",
  "BOF-SAF-TPL-001@1.0",
  "BOF-GOV-REF-001@1.0",
  "BOF-FIN-EVD-001@1.0",
  "BOF-DRV-002@1.0",
  "BOF-VEH-001@1.0",
] as const;

function inspectionIssues(
  inspections: readonly Phase2UnreviewedInspectionInput[],
): ReturnType<typeof validatePhase2UnreviewedInspections> {
  const unreviewedMasterIds = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter(
    (row) => row.result === "UNREVIEWED",
  ).map((row) => row.compatibilityMasterId);
  const blockedMasterIds = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter(
    (row) => row.result === "BLOCKED",
  ).map((row) => row.compatibilityMasterId);
  return validatePhase2UnreviewedInspections({
    inspections,
    unreviewedMasterIds,
    blockedMasterIds,
    deltaFamilyKeys: PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS,
  });
}

check("11. Exactly 34 UNREVIEWED inspections; results and citations unchanged", () => {
  assert.equal(PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.length, 34);
  assert.equal(PHASE2_CANDIDATE_SOURCE_CITATIONS.length, 0);
  const inspectionIds = PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row) => row.compatibilityMasterId);
  assert.equal(new Set(inspectionIds).size, 34);
  assert.deepEqual([...inspectionIds].sort(), [...PHASE2C_INSPECTION_IDS].sort());
  const unreviewed = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "UNREVIEWED");
  const blocked = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "BLOCKED");
  assert.equal(unreviewed.length, 34);
  assert.equal(blocked.length, 30);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length, 0);
  assert.deepEqual(
    unreviewed.map((row) => row.compatibilityMasterId).sort(),
    [...PHASE2C_INSPECTION_IDS].sort(),
  );
  for (const inspection of PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS) {
    assert.equal(inspection.result, "UNREVIEWED", inspection.compatibilityMasterId);
    assert.ok(inspection.artifactsExamined.length > 0, inspection.compatibilityMasterId);
    assert.ok(inspection.reason.trim().length > 0, inspection.compatibilityMasterId);
    assert.equal(
      "approvalEvidenceRef" in inspection,
      false,
      inspection.compatibilityMasterId,
    );
    assert.equal(
      "adoptionEvidenceRef" in inspection,
      false,
      inspection.compatibilityMasterId,
    );
  }
  for (const row of blocked) assert.equal(row.result, "BLOCKED", row.compatibilityMasterId);
  for (const row of PHASE2_DELTA_FAMILY_QUALIFICATIONS) {
    assert.equal(row.result, "BLOCKED", row.familyKey);
    assert.equal(row.compatibilityMasterId, null, row.familyKey);
    assert.equal(
      PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.some((inspection) =>
        inspection.compatibilityMasterId === row.familyKey ||
        inspection.compatibilityMasterId.startsWith(`${row.familyKey}@`),
      ),
      false,
      row.familyKey,
    );
  }
  for (const classification of PHASE2_ROSTER_CLASSIFICATIONS) {
    assert.equal(classification.genuineBofMaster, false, classification.familyKey);
  }
  for (const master of phase2Graph.masters) {
    assert.equal(master.approval.evidenceRef, null, master.masterId);
    assert.equal(isMasterApproved(master), false, master.masterId);
  }
  for (const instance of phase2Graph.instances) {
    assert.equal(instance.adoption.evidenceRef, null, instance.instanceId);
    const summary = summarizeInstanceApproval(null, instance);
    assert.equal(summary.instanceEffective, false, instance.instanceId);
    assert.equal(summary.carrierAdopted, false, instance.instanceId);
  }
  assert.equal(phase2Graph.families.length, 70);
  assert.equal(phase2Graph.masters.length, 64);
  assert.equal(phase2Graph.instances.length, 6);
  assert.equal(phase2Graph.records.length, 0);
  assert.equal(PHASE2_COLLISIONS.length, 12);
  for (const collision of PHASE2_COLLISIONS) {
    assert.equal(collision.status, "UNRESOLVED", collision.collisionId);
    assert.equal(collision.decision, "DO_NOT_MERGE", collision.collisionId);
  }
  const issues = inspectionIssues(PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS);
  assert.deepEqual(issues, [], issues.map((issue) => issue.code).join(", "));
  assert.equal("PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS" in familyBarrel, false);
  assert.equal("PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS" in documentControlBarrel, false);
  return "34 inspections; BLOCKED=30 UNREVIEWED=34 CANDIDATE=0";
});

check("11b. Missing UNREVIEWED inspection is rejected", () => {
  const issues = inspectionIssues(PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.slice(1));
  return expectQualificationCode(issues, IQ.missing);
});

check("11c. Duplicate or non-UNREVIEWED inspection id is rejected", () => {
  const duplicate = inspectionIssues([
    ...PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS[0],
  ]);
  expectQualificationCode(duplicate, IQ.duplicate);
  const blocked = PHASE2_COMPATIBILITY_QUALIFICATIONS.find((row) => row.result === "BLOCKED");
  assert.ok(blocked, "expected a BLOCKED qualification row");
  const unknown = inspectionIssues([
    ...PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
    {
      ...PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS[0],
      compatibilityMasterId: blocked.compatibilityMasterId,
    },
  ]);
  expectQualificationCode(unknown, IQ.unknown);
  expectQualificationCode(unknown, IQ.onBlocked);
  const delta = inspectionIssues([
    ...PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS,
    {
      ...PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS[0],
      compatibilityMasterId: "BOF-OPS-006@1.0",
    },
  ]);
  expectQualificationCode(delta, IQ.onDelta);
  return `${IQ.duplicate}; ${IQ.unknown}; ${IQ.onBlocked}; ${IQ.onDelta}`;
});

check("11d. Inspection cannot change UNREVIEWED or omit the examined artifact", () => {
  const changed = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, result: "CANDIDATE" } : row,
    ),
  );
  expectQualificationCode(changed, IQ.result);
  const empty = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, artifactsExamined: [] } : row,
    ),
  );
  expectQualificationCode(empty, IQ.artifact);
  const badReason = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, reasonCategory: "invented category" } : row,
    ),
  );
  return `${expectQualificationCode(changed, IQ.result)}; ${expectQualificationCode(empty, IQ.artifact)}; ${expectQualificationCode(badReason, IQ.reason)}`;
});

check("11e. Inspection cannot carry approval or adoption evidence", () => {
  const approved = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, approvalEvidenceRef: "fixture://approval" } : row,
    ),
  );
  expectQualificationCode(approved, IQ.approvalEvidence);
  const adopted = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, adoptionEvidenceRef: "fixture://adoption" } : row,
    ),
  );
  expectQualificationCode(adopted, IQ.adoptionEvidence);
  assert.equal(
    phase2Graph.masters.filter((master) => master.approval.evidenceRef != null).length,
    0,
  );
  assert.equal(
    phase2Graph.instances.filter((instance) => instance.adoption.evidenceRef != null).length,
    0,
  );
  return `${IQ.approvalEvidence}; ${IQ.adoptionEvidence}`;
});

check("11f. Blank reason or blank artifact path is rejected; live inspections are well-formed", () => {
  for (const inspection of PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS) {
    assert.ok(inspection.artifactsExamined.length > 0, inspection.compatibilityMasterId);
    for (const artifact of inspection.artifactsExamined) {
      assert.equal(artifact, artifact.trim(), inspection.compatibilityMasterId);
      assert.ok(artifact.length > 0, inspection.compatibilityMasterId);
    }
    assert.equal(
      new Set(inspection.artifactsExamined).size,
      inspection.artifactsExamined.length,
      inspection.compatibilityMasterId,
    );
    assert.ok(
      (PHASE2_UNREVIEWED_INSPECTION_REASONS as readonly string[]).includes(inspection.reasonCategory),
      inspection.compatibilityMasterId,
    );
  }
  const blankReason = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, reason: "   " } : row,
    ),
  );
  const blankArtifact = inspectionIssues(
    PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.map((row, index) =>
      index === 0 ? { ...row, artifactsExamined: [" "] } : row,
    ),
  );
  return `${expectQualificationCode(blankReason, IQ.reason)}; ${expectQualificationCode(blankArtifact, IQ.artifact)}`;
});

// ---------------------------------------------------------------------------
// 12. Candidate gate. Does not change Phase 2C checks 11 through 11f.
// ---------------------------------------------------------------------------

const NEUTRAL_SOURCE = "docs/codex-environment-runbook.md";
const NEUTRAL_BASIS =
  "Reviewed docs/codex-environment-runbook.md. The source is BOF-authored. It is carrier-neutral because no recorded carrier fact is present.";
const POSITIVE_COMMIT = "c505f4044946c48f4a6f8f3ccd9f80a8e261cf38";
/**
 * Parent of the production phase-2 control plane. This commit is an ancestor of
 * this branch, and lib/document-control/family/phase2/types.ts is not in it.
 */
const PATH_ABSENT_ANCESTOR = "495ce8c1d3ee2ef01489dfbfe7913eb9701f1418";
const POSITIVE_SHA1 = "0e37ac8ccbfcb50e5266d89b800c13364761e383";
const CURVED_QUOTE_SOURCE = "source-assets/template-packs/BOF-template-pack-standardization.md";
const CARRIER_SOURCE = "public/generated/company-operations-vault/hr-templates/new-driver-onboarding-checklist.html";

function commitFor(sourcePath: string): string {
  return execFileSync("git", ["log", "-1", "--format=%H", "--", sourcePath], { encoding: "utf8" }).trim();
}

function citationFor(compatibilityMasterId: string, sourcePath: string, provenanceCommit: string): Phase2CandidateCitation {
  const facts = collectPhase2CitationFacts({ sourcePath, provenanceCommit });
  return {
    compatibilityMasterId,
    sourcePath,
    sourceSha1: facts.provenanceBlobSha1 ?? "0000000000000000000000000000000000000000",
    provenanceCommit,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
}

function identityFromCitation(citation: object): { canonicalFamilyKey: string; canonicalVersion: string } {
  const masterId = (citation as { compatibilityMasterId?: string }).compatibilityMasterId ?? "";
  const at = masterId.indexOf("@");
  if (at <= 0 || at !== masterId.lastIndexOf("@")) return { canonicalFamilyKey: "", canonicalVersion: "" };
  const familyKey = masterId.slice(0, at);
  const version = masterId.slice(at + 1);
  if (canonicalMasterIdentity(familyKey, version) !== masterId) return { canonicalFamilyKey: "", canonicalVersion: "" };
  return { canonicalFamilyKey: familyKey, canonicalVersion: version };
}

function gateContext(
  citation: { sourcePath: string; provenanceCommit: string; compatibilityMasterId?: string },
  overrides: Partial<Phase2CandidateGateContext> = {},
): Phase2CandidateGateContext {
  const { facts, carrierTerms, ...rest } = overrides;
  const identity = identityFromCitation(citation);
  return {
    knownMasterIds: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) => row.compatibilityMasterId),
    contentPosture: "UNCLASSIFIED",
    inspectionCategory: null,
    deltaFamilyKeys: [...PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS],
    collisionFamilyKeys: PHASE2_COLLISIONS.filter((collision) => collision.status === "UNRESOLVED").flatMap(
      (collision) =>
        collision.distinctDocuments.flatMap((document) => (document.familyKey == null ? [] : [document.familyKey])),
    ),
    facts: facts ?? collectPhase2CitationFacts(citation),
    carrierTerms: carrierTerms ?? recordedDeltaCarrierTerms(),
    canonicalFamilyKey: identity.canonicalFamilyKey,
    canonicalVersion: identity.canonicalVersion,
    ...rest,
  };
}

function evaluateCitation(citation: object, overrides: Partial<Phase2CandidateGateContext> = {}) {
  const snapshot = snapshotPhase2Citation(citation);
  if (!snapshot) {
    return evaluatePhase2CandidateCitation(citation, gateContext({
      compatibilityMasterId: "BOF-TST-001@1.0",
      sourcePath: NEUTRAL_SOURCE,
      provenanceCommit: POSITIVE_COMMIT,
    }, overrides));
  }
  return evaluatePhase2CandidateCitation(snapshot, gateContext(snapshot, overrides));
}

check("12a. Citation with a missing field is rejected", () => {
  const citation = citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE));
  const incomplete = { ...citation };
  delete (incomplete as { sourceSha1?: string }).sourceSha1;
  const issues = evaluateCitation(incomplete, {});
  return expectQualificationCode(issues, G.citationFieldMissing);
});

check("12b. Unexpected citation or release fields are rejected", () => {
  const citation = {
    ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    note: "implementer assessment",
  };
  expectQualificationCode(
    evaluateCitation(citation, {}),
    G.citationFieldUnexpected,
  );
  const release = evaluatePhase2MasterReviewRelease(
    {
      compatibilityMasterId: "BOF-TST-001@1.0",
      releasedBy: "Document Steward",
      releasedAt: "2026-09-26T00:00:00Z",
      masterWorkScopeRef: "master-review:fixture",
      approval: "APPROVED",
    },
    true,
  );
  return expectQualificationCode(release, G.releaseFieldUnexpected);
});

check("12c. A citation whose source file is absent is rejected", () => {
  const issues = evaluateCitation(
    {
      ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, "5a6fccbdd819804ae4a2d284b7b8efeb91481bef"),
      sourcePath: "source-assets/policies/phase2d-source-does-not-exist.txt",
      sourceSha1: "abc",
    },
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  return expectQualificationCode(issues, G.sourceMissing);
});

check("12d. A citation whose source hash does not match the file is rejected", () => {
  const issues = evaluateCitation(
    {
      ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
      sourceSha1: "0000000000000000000000000000000000000000",
    },
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  return expectQualificationCode(issues, G.hashMismatch);
});

check("12e. An invalid provenance commit is rejected", () => {
  const issues = evaluateCitation(
    {
      ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
      provenanceCommit: "not-a-commit",
    },
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  return expectQualificationCode(issues, G.provenanceInvalid);
});

check("12f. A provenance commit that does not contain the source path is rejected", () => {
  const issues = evaluateCitation(
    citationFor(
      "BOF-TST-001@1.0",
      "lib/document-control/family/phase2/types.ts",
      PATH_ABSENT_ANCESTOR,
    ),
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  return expectQualificationCode(issues, G.provenancePathMissing);
});

check("12g. An unknown master id or a mismatched version is rejected", () => {
  const unknown = evaluateCitation(
    citationFor("BOF-ZZZ-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    {},
  );
  expectQualificationCode(unknown, G.masterUnknown);
  const mismatch = evaluateCitation(
    citationFor("BOF-DRV-FORM-002@9.9", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    {},
  );
  return expectQualificationCode(mismatch, G.versionMismatch);
});

check("12h. A carrier-identified source is rejected", () => {
  const issues = evaluateCitation(
    citationFor("BOF-TST-001@1.0", CARRIER_SOURCE, commitFor(CARRIER_SOURCE)),
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  return expectQualificationCode(issues, G.uninspectable);
});

check("12i. A blocked evidence category cannot become CANDIDATE", () => {
  const demo = PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.find(
    (row) => row.reasonCategory === "demo or sample",
  );
  assert.ok(demo, "expected a demo inspection");
  const issues = evaluateCitation(
    citationFor(demo.compatibilityMasterId, NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    ({ inspectionCategory: demo.reasonCategory }),
  );
  const built = buildCompatibilityQualifications(
    PHASE2_ROSTER_CLASSIFICATIONS,
    [],
    [citationFor(demo.compatibilityMasterId, NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE))],
  );
  assert.equal(
    built.find((row) => row.compatibilityMasterId === demo.compatibilityMasterId)?.result,
    "UNREVIEWED",
  );
  return expectQualificationCode(issues, G.categoryBlocked);
});

check("12j. A Delta family cannot be cited or released", () => {
  const issues = evaluateCitation(
    citationFor("BOF-OPS-006@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    ({ knownMasterIds: ["BOF-OPS-006@1.0"] }),
  );
  expectQualificationCode(issues, G.delta);
  const release = evaluatePhase2MasterReviewRelease(
    {
      compatibilityMasterId: "BOF-OPS-006@1.0",
      releasedBy: "Document Steward",
      releasedAt: "2026-09-26T00:00:00Z",
      masterWorkScopeRef: "master-review:delta",
    },
    false,
  );
  return expectQualificationCode(release, G.releaseCitationMissing);
});

check("12k. Held families cannot be promoted, and their qualification result stays UNREVIEWED", () => {
  for (const hold of PHASE2_CANDIDACY_HOLDS) {
    const issues = evaluateCitation(
      citationFor(hold.compatibilityMasterId, NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
      {},
    );
    expectQualificationCode(issues, G.hold);
    for (const code of hold.holds) {
      assert.ok(
        issues.some((issue) => issue.subject.endsWith(`:${code}`)),
        `${hold.compatibilityMasterId} missing ${code}`,
      );
    }
    const row = PHASE2_COMPATIBILITY_QUALIFICATIONS.find(
      (item) => item.compatibilityMasterId === hold.compatibilityMasterId,
    );
    assert.equal(row?.result, "UNREVIEWED", hold.compatibilityMasterId);
  }
  const held = PHASE2_COMPATIBILITY_QUALIFICATIONS.find(
    (row) => row.compatibilityMasterId === "BOF-DRV-002@1.0",
  );
  assert.ok(held);
  const bypass = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
        row.compatibilityMasterId === held.compatibilityMasterId
          ? { ...row, result: "CANDIDATE" as const, sourceRef: NEUTRAL_SOURCE }
          : row,
      ),
    }),
  );
  return expectQualificationCode(bypass, Q.candidateHeld);
});

check("12l. Release, collision, decision, narrowing, and the live zero-candidate state", () => {
  const collision = evaluateCitation(
    citationFor("BOF-DRV-003@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    ({ knownMasterIds: ["BOF-DRV-003@1.0"] }),
  );
  expectQualificationCode(collision, G.collision);
  const blankDecider = evaluateCitation(
    {
      ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
      decidedBy: "   ",
    },
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  expectQualificationCode(blankDecider, G.decidedByBlank);
  const badTime = evaluateCitation(
    {
      ...citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
      decidedAt: "June 1 2026",
    },
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  expectQualificationCode(badTime, G.timestampInvalid);
  const duplicate = citationRegisterIssues([
    citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
    citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE)),
  ]);
  expectQualificationCode(duplicate, G.duplicateCitation);
  const missingScope = evaluatePhase2MasterReviewRelease(
    {
      compatibilityMasterId: "BOF-TST-001@1.0",
      releasedBy: "Document Steward",
      releasedAt: "2026-09-26T00:00:00Z",
      masterWorkScopeRef: "   ",
    },
    true,
  );
  expectQualificationCode(missingScope, G.releaseScopeMissing);
  const badReleaseTime = evaluatePhase2MasterReviewRelease(
    {
      compatibilityMasterId: "BOF-TST-001@1.0",
      releasedBy: "Document Steward",
      releasedAt: "2026-09-26",
      masterWorkScopeRef: "master-review:fixture",
    },
    true,
  );
  expectQualificationCode(badReleaseTime, G.releaseInvalid);

  const passing = citationFor("BOF-TST-001@1.0", NEUTRAL_SOURCE, commitFor(NEUTRAL_SOURCE));
  const passed = evaluateCitation(
    passing,
    ({ knownMasterIds: ["BOF-TST-001@1.0"] }),
  );
  assert.deepEqual(passed, [], passed.map((issue) => issue.code).join(", "));
  const released = evaluatePhase2MasterReviewRelease(
    {
      compatibilityMasterId: "BOF-TST-001@1.0",
      releasedBy: "Document Steward",
      releasedAt: "2026-09-26T00:00:00Z",
      masterWorkScopeRef: "master-review:fixture",
    },
    true,
  );
  assert.deepEqual(released, [], released.map((issue) => issue.code).join(", "));

  const unregistered = validatePhase2QualificationRegister(
    liveQualificationInput({
      masters: [
        ...phase2Graph.masters.map((master) => ({
          familyKey: master.familyKey,
          masterId: master.masterId,
          approvalStatus: master.approval.status,
        })),
        { familyKey: "BOF-UNREG-001", masterId: "BOF-UNREG-001@1.0", approvalStatus: "APPROVED" },
      ],
    }),
  );
  assert.equal(
    unregistered.some((issue) => issue.subject === "BOF-UNREG-001@1.0"),
    false,
  );
  const deltaApproved = validatePhase2QualificationRegister(
    liveQualificationInput({
      masters: [
        ...phase2Graph.masters.map((master) => ({
          familyKey: master.familyKey,
          masterId: master.masterId,
          approvalStatus: master.approval.status,
        })),
        { familyKey: "BOF-OPS-006", masterId: "BOF-OPS-006@1.0", approvalStatus: "APPROVED" },
      ],
    }),
  );
  assert.ok(deltaApproved.some((issue) => issue.code === Q.masterApproved && issue.subject === "BOF-OPS-006@1.0"));

  const outsideRecord = validatePhase2QualificationRegister(
    liveQualificationInput({ records: [{ familyKey: "BOF-UNREG-001" }] }),
  );
  assert.equal(
    outsideRecord.some((issue) => issue.code === Q.recordPresent),
    false,
  );
  const candidate = unclassifiedQualification();
  const ownRecord = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: compatibilityRowsWithCandidate(NEUTRAL_SOURCE),
      records: [{ familyKey: candidate.familyKey }],
    }),
  );
  expectQualificationCode(ownRecord, Q.candidateRecord);

  const releasedRow = validatePhase2QualificationRegister(
    liveQualificationInput({
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
        row.compatibilityMasterId === candidate.compatibilityMasterId
          ? { ...row, result: "RELEASED_TO_MASTER_REVIEW" as const }
          : row,
      ),
    }),
  );
  expectQualificationCode(releasedRow, Q.releaseCitationMissing);
  expectQualificationCode(releasedRow, Q.releaseMissing);

  assert.equal(PHASE2_CANDIDATE_CITATIONS.length, 0);
  assert.equal(PHASE2_MASTER_REVIEW_RELEASES.length, 0);
  assert.equal(PHASE2_CANDIDATE_SOURCE_CITATIONS.length, 0);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length, 0);
  assert.equal(
    PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "RELEASED_TO_MASTER_REVIEW").length,
    0,
  );
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "BLOCKED").length, 30);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "UNREVIEWED").length, 34);
  assert.equal("PHASE2_CANDIDATE_CITATIONS" in familyBarrel, false);
  assert.equal("PHASE2_CANDIDATE_CITATIONS" in documentControlBarrel, false);
  assert.equal("evaluatePhase2CandidateCitation" in familyBarrel, false);
  assert.equal("evaluatePhase2CandidateCitation" in documentControlBarrel, false);
  assert.equal("PHASE2_MASTER_REVIEW_RELEASES" in familyBarrel, false);
  assert.equal("PHASE2_MASTER_REVIEW_RELEASES" in documentControlBarrel, false);
  const familyBarrelSource = fs.readFileSync("lib/document-control/family/index.ts", "utf8");
  const controlBarrelSource = fs.readFileSync("lib/document-control/index.ts", "utf8");
  assert.equal(familyBarrelSource.includes("candidate-gate"), false);
  assert.equal(controlBarrelSource.includes("candidate-gate"), false);
  assert.equal(familyBarrelSource.includes("phase2/"), false);
  assert.equal(controlBarrelSource.includes("phase2/"), false);
  return "gate passes only off-register; live citations=0 releases=0 CANDIDATE=0 RELEASED=0";
});

const NON_ANCESTOR_COMMIT = "c8d16c0ce8a43d84d37c05262b129385070d292c";
const MSA_PDF = "public/generated/agreements/DAT-MSA-001/delta-advanced-trucking-master-services-agreement.pdf";
const FIXTURE_ID = "BOF-TST-001@1.0";
const FIXTURE_KEY = "BOF-TST-001";

function fixtureCitation(provenanceCommit: string, sourcePath = NEUTRAL_SOURCE): Phase2CandidateCitation {
  return citationFor(FIXTURE_ID, sourcePath, provenanceCommit);
}

check("12m. Provenance must be a full ancestor commit and pin the source bytes", () => {
  const head = commitFor(NEUTRAL_SOURCE);
  const nonAncestor = evaluateCitation(fixtureCitation(NON_ANCESTOR_COMMIT), { knownMasterIds: [FIXTURE_ID] });
  expectQualificationCode(nonAncestor, G.provenanceInvalid);
  const symbolic = evaluateCitation(
    { ...fixtureCitation(head), provenanceCommit: "HEAD" },
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(symbolic, G.provenanceInvalid);
  const abbreviated = evaluateCitation(
    { ...fixtureCitation(head), provenanceCommit: head.slice(0, 8) },
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(abbreviated, G.provenanceInvalid);
  const wrongHash = evaluateCitation(
    { ...fixtureCitation(head), sourceSha1: "0000000000000000000000000000000000000000" },
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(wrongHash, G.hashMismatch);
  const absentPath = evaluateCitation(
    citationFor(FIXTURE_ID, "lib/document-control/family/phase2/types.ts", PATH_ABSENT_ANCESTOR),
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(absentPath, G.provenancePathMissing);
  const valid = evaluateCitation(fixtureCitation(head), { knownMasterIds: [FIXTURE_ID] });
  assert.deepEqual(valid, [], valid.map((issue) => issue.code).join(", "));
  return "non-ancestor, HEAD, abbreviated, wrong hash, and absent path fail; pinned ancestor passes";
});

check("12n. Carrier neutrality fails closed, including an uninspectable PDF", () => {
  const terms = recordedDeltaCarrierTerms();
  const legal = terms.names[0];
  assert.ok(legal, "recorded carrier name");
  const head = commitFor(NEUTRAL_SOURCE);
  const base = fixtureCitation(head);
  const real = collectPhase2CitationFacts(base);
  function withText(text: string) {
    return evaluateCitation(base, {
      knownMasterIds: [FIXTURE_ID],
      facts: { ...real, carrierInspection: "text", inspectedText: text },
    });
  }
  expectQualificationCode(withText(legal), G.notNeutral);
  expectQualificationCode(withText(legal.toUpperCase()), G.notNeutral);
  expectQualificationCode(withText(legal.replace(/ /g, "   ")), G.notNeutral);
  expectQualificationCode(withText(legal.split(/\s+/).join("\n")), G.notNeutral);
  expectQualificationCode(withText("Preserved identifier DAT-MSA-001."), G.notNeutral);
  const fact = terms.tokens[0];
  assert.ok(fact, "recorded carrier fact");
  expectQualificationCode(withText(`Recorded carrier fact ${fact}.`), G.notNeutral);
  const pdf = evaluateCitation(citationFor(FIXTURE_ID, MSA_PDF, commitFor(MSA_PDF)), {
    knownMasterIds: [FIXTURE_ID],
  });
  expectQualificationCode(pdf, G.uninspectable);
  const neutral = evaluateCitation(base, { knownMasterIds: [FIXTURE_ID] });
  assert.deepEqual(neutral, [], neutral.map((issue) => issue.code).join(", "));
  return "name, case, whitespace, split, identifier, fact, and PDF fail; neutral text passes";
});

check("12o. A CANDIDATE row is revalidated by the candidate gate", () => {
  const head = commitFor(NEUTRAL_SOURCE);
  const classification = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false,
    contentPosture: "UNCLASSIFIED",
  };
  const master = { familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" };
  function candidateInput(citation: Phase2CandidateCitation | null, sourcePath = NEUTRAL_SOURCE) {
    return liveQualificationInput({
      classifications: [...PHASE2_ROSTER_CLASSIFICATIONS, classification],
      compatibilityRows: [
        ...PHASE2_COMPATIBILITY_QUALIFICATIONS,
        {
          compatibilityMasterId: FIXTURE_ID,
          familyKey: FIXTURE_KEY,
          result: "CANDIDATE" as const,
          contentPosture: "UNCLASSIFIED",
          sourceRef: sourcePath,
        },
      ],
      masters: [
        ...phase2Graph.masters.map((item) => ({
          familyKey: item.familyKey,
          masterId: item.masterId,
          approvalStatus: item.approval.status,
        })),
        master,
      ],
      candidateCitations: citation ? [citation] : [],
    });
  }
  expectQualificationCode(validatePhase2QualificationRegister(candidateInput(null)), Q.candidateGate);
  expectQualificationCode(
    validatePhase2QualificationRegister(candidateInput({ ...fixtureCitation(head), provenanceCommit: "HEAD" })),
    Q.candidateGate,
  );
  expectQualificationCode(
    validatePhase2QualificationRegister(
      candidateInput(citationFor(FIXTURE_ID, CARRIER_SOURCE, commitFor(CARRIER_SOURCE)), CARRIER_SOURCE),
    ),
    Q.candidateGate,
  );
  const valid = validatePhase2QualificationRegister(candidateInput(fixtureCitation(head)));
  assert.equal(
    valid.some((issue) => issue.code === Q.candidateGate && issue.subject === FIXTURE_ID),
    false,
  );
  return "missing, invalid provenance, and carrier source fail; a passing citation does not";
});

check("12p. A RELEASED row still runs instance, adoption, and effectiveness checks", () => {
  const head = commitFor(NEUTRAL_SOURCE);
  const classification = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false,
    contentPosture: "UNCLASSIFIED",
  };
  const row = {
    compatibilityMasterId: FIXTURE_ID,
    familyKey: FIXTURE_KEY,
    result: "RELEASED_TO_MASTER_REVIEW" as const,
    contentPosture: "UNCLASSIFIED",
    sourceRef: NEUTRAL_SOURCE,
  };
  const release = {
    compatibilityMasterId: FIXTURE_ID,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
  function releasedInput(flags: { instance?: boolean; adopted?: boolean; effective?: boolean }) {
    return liveQualificationInput({
      classifications: [...PHASE2_ROSTER_CLASSIFICATIONS, classification],
      compatibilityRows: [...PHASE2_COMPATIBILITY_QUALIFICATIONS, row],
      masters: [
        ...phase2Graph.masters.map((item) => ({
          familyKey: item.familyKey,
          masterId: item.masterId,
          approvalStatus: item.approval.status,
        })),
        { familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" },
      ],
      candidateCitations: [fixtureCitation(head)],
      masterReviewReleases: [release],
      instanceFamilyKeys: flags.instance ? [FIXTURE_KEY] : [],
      adoptedFamilyKeys: flags.adopted ? [FIXTURE_KEY] : [],
      effectiveFamilyKeys: flags.effective ? [FIXTURE_KEY] : [],
    });
  }
  const blocked = validatePhase2QualificationRegister(
    releasedInput({ instance: true, adopted: true, effective: true }),
  );
  expectQualificationCode(blocked, Q.candidateInstance);
  expectQualificationCode(blocked, Q.candidateAdoption);
  expectQualificationCode(blocked, Q.candidateEffective);
  const valid = validatePhase2QualificationRegister(releasedInput({}));
  assert.equal(valid.some((issue) => issue.code === Q.candidateInstance && issue.subject === FIXTURE_KEY), false);
  assert.equal(valid.some((issue) => issue.code === Q.candidateAdoption && issue.subject === FIXTURE_KEY), false);
  assert.equal(valid.some((issue) => issue.code === Q.candidateEffective && issue.subject === FIXTURE_KEY), false);
  assert.equal(valid.some((issue) => issue.code === Q.releaseCitationMissing), false);
  return "instance, adoption, and effectiveness still fail a RELEASED row; a clean release does not bypass them";
});

check("12q. The candidate gate evaluates supplied facts and does not discover files or Git", () => {
  const gateSource = fs.readFileSync("lib/document-control/family/phase2/candidate-gate.ts", "utf8");
  assert.equal(gateSource.includes("node:fs"), false);
  assert.equal(gateSource.includes("node:child_process"), false);
  assert.equal(gateSource.includes("execFileSync"), false);
  assert.equal(gateSource.includes("readFileSync"), false);
  assert.equal(gateSource.includes("existsSync"), false);
  const syntheticFacts: Phase2CitationFacts = {
    sourcePresent: true,
    provenanceIsCommit: true,
    provenanceIsAncestor: true,
    provenancePathPresent: true,
    provenanceBlobSha1: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sourcePath: "source-assets/policies/phase2d-source-does-not-exist.txt",
    carrierInspection: "text",
    inspectedText: "Carrier neutral operating standard.",
    byteLength: 36,
  };
  const synthetic = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: "source-assets/policies/phase2d-source-does-not-exist.txt",
    sourceSha1: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    provenanceCommit: "0123456789abcdef0123456789abcdef01234567",
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const passed = evaluatePhase2CandidateCitation(
    synthetic,
    gateContext(synthetic, { knownMasterIds: [FIXTURE_ID], facts: syntheticFacts }),
  );
  assert.deepEqual(passed, [], passed.map((issue) => issue.code).join(", "));
  const rejected = evaluatePhase2CandidateCitation(
    synthetic,
    gateContext(synthetic, {
      knownMasterIds: [FIXTURE_ID],
      facts: { ...syntheticFacts, provenanceIsAncestor: false },
    }),
  );
  return expectQualificationCode(rejected, G.provenanceInvalid);
});

check("12r. HTML, identifiers, unicode, and an empty source cannot pass as carrier-neutral", () => {
  const terms = recordedDeltaCarrierTerms();
  const legal = terms.names[0];
  const usdot = terms.tokens.find((token) => token === "2481936");
  const mc = terms.tokens.find((token) => token === "874201");
  assert.ok(legal && usdot && mc, "recorded carrier name and identifiers");
  const head = commitFor(NEUTRAL_SOURCE);
  const base = fixtureCitation(head);
  const real = collectPhase2CitationFacts(base);
  function withText(text: string) {
    return evaluateCitation(base, {
      knownMasterIds: [FIXTURE_ID],
      facts: { ...real, carrierInspection: "text", inspectedText: text, byteLength: Math.max(text.length, 1) },
    });
  }
  const ordinary = withText("Ordinary carrier-neutral operating standard.");
  assert.equal(
    ordinary.some((issue) => issue.code === G.notNeutral || issue.code === G.uninspectable || issue.code === G.sourceEmpty),
    false,
  );
  expectQualificationCode(withText(legal), G.notNeutral);
  expectQualificationCode(withText("Delta\n   Advanced\n   Trucking"), G.notNeutral);
  for (const markup of [
    "<html><body>Delta Advanced Trucking</body></html>",
    "<b>Delta</b>",
    "De<span>lta</span>",
    "Delta Adv<i>anced</i> Trucking",
    "Delta <!--Advanced--> Trucking",
    "<!DOCTYPE html> Delta Advanced Trucking",
    "<?xml version=\"1.0\"?> Delta Advanced Trucking",
    "<a href=\"Delta Advanced Trucking\">note</a>",
    "<DeltaAdvancedTrucking>note</DeltaAdvancedTrucking>",
  ]) {
    const issues = withText(markup);
    expectQualificationCode(issues, G.uninspectable);
    assert.equal(issues.some((issue) => issue.code === G.notNeutral), false, markup);
  }
  for (const entity of [
    "Delta&nbsp;Advanced Trucking",
    "&#68;elta Advanced Trucking",
    "&#x44;elta Advanced Trucking",
    "&#X44;elta Advanced Trucking",
    "Delta&nbsp Advanced Trucking",
    "&notarealentity;Delta Advanced Trucking",
    "&lt;img src=delta&gt;",
  ]) {
    expectQualificationCode(withText(entity), G.uninspectable);
  }
  for (const hidden of [
    "Delta\u200BAdvanced Trucking",
    "Delta\u200DAdvanced Trucking",
    "Delta\u200CAdvanced Trucking",
    "Delta\u00ADAdvanced Trucking",
    "Delta\u2060Advanced Trucking",
    "Delta\uFFFDAdvanced Trucking",
  ]) {
    expectQualificationCode(withText(hidden), G.uninspectable);
  }
  expectQualificationCode(withText(`USDOT ${usdot}`), G.notNeutral);
  expectQualificationCode(withText(`USDOT-${usdot}`), G.notNeutral);
  expectQualificationCode(withText(`USDOT_${usdot}`), G.notNeutral);
  expectQualificationCode(withText(`USDOT${usdot}`), G.notNeutral);
  expectQualificationCode(withText(`MC ${mc}`), G.notNeutral);
  expectQualificationCode(withText(`MC-${mc}`), G.notNeutral);
  expectQualificationCode(withText(`MC_${mc}`), G.notNeutral);
  expectQualificationCode(withText(`MC${mc}`), G.notNeutral);
  const empty = evaluateCitation(base, {
    knownMasterIds: [FIXTURE_ID],
    facts: {
      ...real,
      carrierInspection: "text",
      inspectedText: "",
      byteLength: 0,
      provenanceBlobSha1: base.sourceSha1,
    },
  });
  expectQualificationCode(empty, G.sourceEmpty);
  expectQualificationCode(withText(" \n\t "), G.sourceEmpty);
  expectQualificationCode(withText("<b></b>"), G.uninspectable);
  function fromBytes(name: string, bytes: Buffer) {
    const classified = classifySourceBytes(name, bytes);
    return evaluateCitation(base, {
      knownMasterIds: [FIXTURE_ID],
      facts: { ...real, ...classified, provenanceBlobSha1: base.sourceSha1 },
    });
  }
  expectQualificationCode(fromBytes("note.txt", Buffer.from([0xc3, 0x28])), G.uninspectable);
  expectQualificationCode(fromBytes("note.txt", Buffer.from([0xff, 0xfe, 0x41, 0x00])), G.uninspectable);
  expectQualificationCode(fromBytes("note.bin", Buffer.from([0x00, 0x01, 0x02])), G.uninspectable);
  expectQualificationCode(fromBytes("file.pdf", Buffer.from("%PDF-1.4")), G.uninspectable);
  expectQualificationCode(fromBytes("file.docx", Buffer.from("PK\u0003\u0004")), G.uninspectable);
  expectQualificationCode(fromBytes("file.png", Buffer.from([0x89, 0x50, 0x4e, 0x47])), G.uninspectable);
  const neutral = evaluateCitation(base, { knownMasterIds: [FIXTURE_ID] });
  assert.deepEqual(neutral, [], neutral.map((issue) => issue.code).join(", "));
  const curved = evaluateCitation(citationFor(FIXTURE_ID, CURVED_QUOTE_SOURCE, commitFor(CURVED_QUOTE_SOURCE)), {
    knownMasterIds: [FIXTURE_ID],
  });
  expectQualificationCode(curved, G.uninspectable);
  const nonAncestor = evaluateCitation(fixtureCitation(NON_ANCESTOR_COMMIT), { knownMasterIds: [FIXTURE_ID] });
  expectQualificationCode(nonAncestor, G.provenanceInvalid);
  const symbolic = evaluateCitation(
    { ...fixtureCitation(head), provenanceCommit: "HEAD" },
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(symbolic, G.provenanceInvalid);
  return "plain text may continue; markup, entities, format characters, and non-text bytes are uninspectable";
});

check("12s. sourceRef must match the citation, and a hold follows the family key", () => {
  const head = commitFor(NEUTRAL_SOURCE);
  const citation = fixtureCitation(head);
  const classification = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false,
    contentPosture: "UNCLASSIFIED",
  };
  const masters = [
    ...phase2Graph.masters.map((item) => ({
      familyKey: item.familyKey,
      masterId: item.masterId,
      approvalStatus: item.approval.status,
    })),
    { familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" },
  ];
  function candidateRow(sourceRef: string) {
    return liveQualificationInput({
      classifications: [...PHASE2_ROSTER_CLASSIFICATIONS, classification],
      compatibilityRows: [
        ...PHASE2_COMPATIBILITY_QUALIFICATIONS,
        {
          compatibilityMasterId: FIXTURE_ID,
          familyKey: FIXTURE_KEY,
          result: "CANDIDATE" as const,
          contentPosture: "UNCLASSIFIED",
          sourceRef,
        },
      ],
      masters,
      candidateCitations: [citation],
    });
  }
  const matched = validatePhase2QualificationRegister(candidateRow(NEUTRAL_SOURCE));
  assert.equal(matched.some((issue) => issue.code === Q.sourceRefMismatch), false);
  assert.equal(matched.some((issue) => issue.code === Q.candidateGate && issue.subject === FIXTURE_ID), false);
  expectQualificationCode(
    validatePhase2QualificationRegister(candidateRow("source-assets/policies/phase2d-other-file.txt")),
    Q.sourceRefMismatch,
  );
  expectQualificationCode(
    validatePhase2QualificationRegister(candidateRow(MSA_PDF)),
    Q.sourceRefMismatch,
  );
  const currentHold = evaluateCitation(citationFor("BOF-DRV-002@1.0", NEUTRAL_SOURCE, head), {
    knownMasterIds: ["BOF-DRV-002@1.0"],
  });
  expectQualificationCode(currentHold, G.hold);
  const otherVersion = evaluateCitation(citationFor("BOF-DRV-002@2.0", NEUTRAL_SOURCE, head), {
    knownMasterIds: ["BOF-DRV-002@1.0", "BOF-DRV-002@2.0"],
  });
  expectQualificationCode(otherVersion, G.hold);
  assert.ok(otherVersion.some((issue) => issue.subject === "BOF-DRV-002:IDENTITY_UNRESOLVED"));
  return "matching sourceRef passes; a different path and an alternate held version fail";
});

check("12t. Master identity must equal familyKey@version before a hold lookup", () => {
  assert.equal(canonicalMasterIdentity("BOF-DRV-002", "1.0"), "BOF-DRV-002@1.0");
  assert.equal(canonicalMasterIdentity("bof-drv-002", "1.0"), null);
  assert.equal(canonicalMasterIdentity("BOF-DRV-002 ", "1.0"), null);
  assert.equal(canonicalMasterIdentity("BOF-DRV-0002", "1.0"), null);
  assert.equal(canonicalMasterIdentity("BOF-DRV-002", "01.0"), null);
  assert.equal(canonicalMasterIdentity("BOF-DRV-002", "1.0@b"), null);
  assert.equal(canonicalMasterIdentity("BOF-DRV-002", ""), null);

  const head = commitFor(NEUTRAL_SOURCE);
  const family = "BOF-DRV-002";
  function cited(masterId: string, version: string) {
    return evaluateCitation(citationFor(masterId, NEUTRAL_SOURCE, head), {
      knownMasterIds: ["BOF-DRV-002@1.0", "BOF-DRV-002@2.0", "BOF-DRV-002@9.9", masterId],
      canonicalFamilyKey: family,
      canonicalVersion: version,
    });
  }
  const current = cited("BOF-DRV-002@1.0", "1.0");
  assert.equal(current.some((issue) => issue.code === G.identityInvalid), false);
  expectQualificationCode(current, G.hold);
  const next = cited("BOF-DRV-002@2.0", "2.0");
  assert.equal(next.some((issue) => issue.code === G.identityInvalid), false);
  expectQualificationCode(next, G.hold);
  const later = cited("BOF-DRV-002@9.9", "9.9");
  assert.equal(later.some((issue) => issue.code === G.identityInvalid), false);
  expectQualificationCode(later, G.hold);

  for (const masterId of [
    "BOF-DRV-002@1.0@b",
    "OTHER-ID@1.0",
    "BOF-DRV-002",
    "BOF-DRV-002@",
    "BOF-VEH-001@1.0",
    "bof-drv-002@1.0",
    "BOF-DRV-0002@1.0",
  ]) {
    const issues = cited(masterId, "1.0");
    expectQualificationCode(issues, G.identityInvalid);
    expectQualificationCode(issues, G.hold);
    assert.equal(issues.some((issue) => issue.code === G.hold && issue.subject.startsWith("OTHER-")), false);
  }

  const malformedId = "BOF-DRV-002@1.0@b";
  const register = validatePhase2QualificationRegister(
    liveQualificationInput({
      classifications: PHASE2_ROSTER_CLASSIFICATIONS.map((row) =>
        row.compatibilityMasterId === "BOF-DRV-002@1.0" ? { ...row, compatibilityMasterId: malformedId } : row,
      ),
      compatibilityRows: PHASE2_COMPATIBILITY_QUALIFICATIONS.map((row) =>
        row.compatibilityMasterId === "BOF-DRV-002@1.0"
          ? { ...row, compatibilityMasterId: malformedId, result: "CANDIDATE" as const, sourceRef: NEUTRAL_SOURCE }
          : row,
      ),
    }),
  );
  expectQualificationCode(register, Q.identityInvalid);
  expectQualificationCode(register, Q.candidateHeld);
  return "canonical identity agrees before the family hold; a malformed id stays rejected and held";
});

check("12u. Condition 4 requires an admissible source, a clear screen, and a named human determination", () => {
  const fixtureClass = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false as const,
    contentPosture: "UNCLASSIFIED" as const,
    note: "isolated fixture",
  };
  const positive = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const built = buildCompatibilityQualifications(
    [...PHASE2_ROSTER_CLASSIFICATIONS, fixtureClass],
    [],
    [positive],
  );
  assert.equal(built.find((row) => row.compatibilityMasterId === FIXTURE_ID)?.result, "CANDIDATE");
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length, 0);
  assert.equal(PHASE2_CANDIDATE_CITATIONS.length, 0);

  const baseFacts = collectPhase2CitationFacts(positive);
  function withSource(sourcePath: string, text: string) {
    return evaluateCitation(
      { ...positive, sourcePath },
      {
        knownMasterIds: [FIXTURE_ID],
        facts: {
          ...baseFacts,
          sourcePath,
          sourcePresent: true,
          carrierInspection: "text" as const,
          inspectedText: text,
          byteLength: Math.max(text.length, 1),
        },
      },
    );
  }
  for (const sourcePath of ["notes/plain.txt", "notes/plain.md"]) {
    const issues = withSource(sourcePath, "Ordinary carrier-neutral operating standard.");
    assert.equal(issues.some((issue) => issue.code === G.uninspectable || issue.code === G.notNeutral), false, sourcePath);
  }
  for (const sourcePath of [
    "notes/plain.TXT",
    "notes/plain.MD",
    "notes/plain.rtf",
    "notes/plain.json",
    "notes/plain.csv",
    "notes/plain.html",
    "notes/plain.xml",
    "notes/plain.svg",
    "notes/README",
  ]) {
    expectQualificationCode(withSource(sourcePath, "Ordinary carrier-neutral operating standard."), G.uninspectable);
  }
  expectQualificationCode(withSource("notes/plain.txt", ""), G.sourceEmpty);
  expectQualificationCode(withSource("notes/plain.txt", " \n\t "), G.sourceEmpty);
  for (const text of ["a<b", "a>b", "a&b", "Delta\u200B", "Delta\u00AD", "caf\u00e9", "\u0394elta"]) {
    expectQualificationCode(withSource("notes/plain.txt", text), G.uninspectable);
  }
  const invalidUtf8 = classifySourceBytes("notes/plain.txt", Buffer.from([0xc3, 0x28]));
  assert.equal(invalidUtf8.carrierInspection, "uninspectable");

  const terms = recordedDeltaCarrierTerms();
  const phone = terms.phones.find((item) => item.includes("804"));
  assert.ok(phone, "recorded phone");
  for (const text of [
    "Delta Advanced Trucking",
    "DeltaAdvancedTrucking",
    "Del*t*a Advanced Trucking",
    "D e l t a",
    "Delta.Advanced.Trucking",
    "8045550148",
    "+18045550148",
    "DAT-MSA-001",
    "DAT_MSA_001",
    "DAT MSA 001",
    "X_DAT-MSA-001",
    "file_DAT_SOP_CLM_001",
    "2025DAT-MSA-001",
  ]) {
    const screened = withSource("notes/plain.txt", text);
    expectQualificationCode(screened, G.notNeutral);
    assert.equal(screened.some((issue) => issue.code === G.neutralityDetermination), false, text);
  }
  const unrelated = withSource("notes/plain.txt", "Reference 9999999999 and 80455501480 only.");
  assert.equal(unrelated.some((issue) => issue.code === G.notNeutral), false);

  const wrongDetermination = evaluateCitation(
    { ...positive, neutralityDetermination: "NOT_NEUTRAL" },
    { knownMasterIds: [FIXTURE_ID] },
  );
  expectQualificationCode(wrongDetermination, G.neutralityDetermination);
  expectQualificationCode(
    evaluateCitation({ ...positive, neutralityBasis: "   " }, { knownMasterIds: [FIXTURE_ID] }),
    G.citationFieldMissing,
  );
  expectQualificationCode(
    evaluateCitation({ ...positive, neutralityBasis: 12 as unknown as string }, { knownMasterIds: [FIXTURE_ID] }),
    G.citationFieldMissing,
  );
  expectQualificationCode(
    evaluateCitation({ ...positive, override: "yes" }, { knownMasterIds: [FIXTURE_ID] }),
    G.citationFieldUnexpected,
  );
  const carrierDespiteHuman = withSource("notes/plain.txt", "Delta Advanced Trucking");
  expectQualificationCode(carrierDespiteHuman, G.notNeutral);

  let getterReads = 0;
  const getterCitation: Record<string, unknown> = {};
  for (const field of Object.keys(positive)) {
    Object.defineProperty(getterCitation, field, {
      enumerable: true,
      get() {
        getterReads += 1;
        return positive[field as keyof typeof positive];
      },
    });
  }
  expectQualificationCode(evaluateCitation(getterCitation, { knownMasterIds: [FIXTURE_ID] }), G.notPlain);
  assert.equal(getterReads, 0);
  const proxied = new Proxy(positive, {
    get(target, property, receiver) {
      getterReads += 1;
      return Reflect.get(target, property, receiver);
    },
  });
  expectQualificationCode(evaluateCitation(proxied, { knownMasterIds: [FIXTURE_ID] }), G.notPlain);
  assert.equal(getterReads, 0);
  const inherited = Object.assign(Object.create({ extra: "inherited" }), positive);
  expectQualificationCode(evaluateCitation(inherited, { knownMasterIds: [FIXTURE_ID] }), G.notPlain);
  const hidden = { ...positive };
  Object.defineProperty(hidden, "hidden", { enumerable: false, value: "secret" });
  expectQualificationCode(evaluateCitation(hidden, { knownMasterIds: [FIXTURE_ID] }), G.notPlain);
  const symbolic = { ...positive, [Symbol("extra")]: "symbol" };
  expectQualificationCode(evaluateCitation(symbolic, { knownMasterIds: [FIXTURE_ID] }), G.notPlain);
  let mutablePath = NEUTRAL_SOURCE;
  const mutating: Record<string, unknown> = { ...positive };
  Object.defineProperty(mutating, "sourcePath", {
    enumerable: true,
    get() {
      const current = mutablePath;
      mutablePath = "notes/other.md";
      return current;
    },
  });
  assert.equal(buildCompatibilityQualifications([fixtureClass], [], [mutating])[0]?.result, "UNREVIEWED");
  assert.equal(mutablePath, NEUTRAL_SOURCE);
  const release = {
    compatibilityMasterId: FIXTURE_ID,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
  let releaseReads = 0;
  const releaseProxy = new Proxy(release, {
    get(target, property, receiver) {
      releaseReads += 1;
      return Reflect.get(target, property, receiver);
    },
  });
  expectQualificationCode(evaluatePhase2MasterReviewRelease(releaseProxy, true), G.releaseNotPlain);
  assert.equal(releaseReads, 0);
  assert.equal(snapshotPhase2Release(releaseProxy), null);

  const bad = { ...positive, sourceSha1: "0000000000000000000000000000000000000000" };
  for (const citations of [[positive, bad], [bad, positive]]) {
    const rows = buildCompatibilityQualifications([fixtureClass], [], citations);
    assert.equal(rows[0]?.result, "UNREVIEWED");
    expectQualificationCode(
      validatePhase2QualificationRegister(
        liveQualificationInput({
          classifications: [fixtureClass],
          compatibilityRows: [
            {
              compatibilityMasterId: FIXTURE_ID,
              familyKey: FIXTURE_KEY,
              result: "UNREVIEWED",
              contentPosture: "UNCLASSIFIED",
              sourceRef: null,
            },
          ],
          deltaRows: [],
          deltaFamilyKeys: [],
          masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
          candidateCitations: citations,
        }),
      ),
      Q.citationDuplicate,
    );
  }
  return "4A, 4B, and 4C are all required; duplicates and mutable citations stay UNREVIEWED";
});

check("12v. Adjacent phone groups match, and a malformed duplicate blocks promotion", () => {
  const positive = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const baseFacts = collectPhase2CitationFacts(positive);
  function screened(text: string) {
    return evaluateCitation(positive, {
      knownMasterIds: [FIXTURE_ID],
      facts: {
        ...baseFacts,
        sourcePath: positive.sourcePath,
        carrierInspection: "text" as const,
        inspectedText: text,
        byteLength: Math.max(text.length, 1),
      },
    });
  }
  for (const text of [
    "Suite 2 (804) 555-0148",
    "Call (804) 555-0148 24/7",
    "Room 12, phone 804-555-0148",
    "(804) 555-0148",
    "8045550148",
    "+18045550148",
  ]) {
    expectQualificationCode(screened(text), G.notNeutral);
  }
  const unrelated = screened("Reference 9999999999 and 80455501480 only.");
  assert.equal(unrelated.some((issue) => issue.code === G.notNeutral), false);
  const usdot = screened("USDOT 2481936");
  expectQualificationCode(usdot, G.notNeutral);
  const dat = screened("file_DAT_SOP_CLM_001");
  expectQualificationCode(dat, G.notNeutral);

  const fixtureClass = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false as const,
    contentPosture: "UNCLASSIFIED" as const,
    note: "isolated fixture",
  };
  const missing: Record<string, unknown> = { ...positive };
  delete missing.sourceSha1;
  const getter: Record<string, unknown> = {};
  for (const field of Object.keys(positive)) {
    Object.defineProperty(getter, field, {
      enumerable: true,
      get() {
        return positive[field as keyof typeof positive];
      },
    });
  }
  const malformedCitations = [
    { ...positive, override: "yes" },
    getter,
    new Proxy(positive, { get: (target, property, receiver) => Reflect.get(target, property, receiver) }),
    missing,
    Object.assign(Object.create(null), positive),
  ];
  function citationIssues(citations: readonly unknown[]) {
    const built = buildCompatibilityQualifications([fixtureClass], [], citations);
    assert.equal(built[0]?.result, "UNREVIEWED");
    return validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "UNREVIEWED" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: null,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: citations,
      }),
    );
  }
  const otherValid = { ...positive, sourceSha1: "0000000000000000000000000000000000000000" };
  for (const citations of [
    [positive, otherValid],
    [otherValid, positive],
  ]) {
    const issues = citationIssues(citations);
    expectQualificationCode(issues, Q.citationDuplicate);
  }
  for (const malformed of malformedCitations) {
    for (const citations of [
      [positive, malformed],
      [malformed, positive],
    ]) {
      const issues = citationIssues(citations);
      expectQualificationCode(issues, Q.citationMalformed);
    }
  }

  const release = {
    compatibilityMasterId: FIXTURE_ID,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
  const releaseGetter: Record<string, unknown> = {};
  for (const field of Object.keys(release)) {
    Object.defineProperty(releaseGetter, field, {
      enumerable: true,
      get() {
        return release[field as keyof typeof release];
      },
    });
  }
  const malformedReleases = [
    { ...release, approval: "APPROVED" },
    releaseGetter,
    new Proxy(release, { get: (target, property, receiver) => Reflect.get(target, property, receiver) }),
    (() => {
      const copy: Record<string, unknown> = { ...release };
      delete copy.releasedBy;
      return copy;
    })(),
    Object.assign(Object.create(null), release),
  ];
  function releaseIssues(releases: readonly unknown[]) {
    return validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "RELEASED_TO_MASTER_REVIEW" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: NEUTRAL_SOURCE,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: [positive],
        masterReviewReleases: releases,
      }),
    );
  }
  const otherRelease = { ...release, masterWorkScopeRef: "master-review:other" };
  for (const releases of [
    [release, otherRelease],
    [otherRelease, release],
  ]) {
    const issues = releaseIssues(releases);
    expectQualificationCode(issues, Q.releaseDuplicate);
    expectQualificationCode(issues, Q.releaseMissing);
  }
  for (const malformed of malformedReleases) {
    for (const releases of [
      [release, malformed],
      [malformed, release],
    ]) {
      const issues = releaseIssues(releases);
      expectQualificationCode(issues, Q.releaseMalformed);
      expectQualificationCode(issues, Q.releaseMissing);
    }
  }
  return "adjacent phone text is carrier; malformed citation and release duplicates do not promote";
});

check("12w. A blank or whitespace master id blocks the valid sibling", () => {
  for (const blank of ["", " ", "   ", "\t", "\n", "\r"]) {
    const citation = classifyPhase2RegisterEntry(
      { compatibilityMasterId: blank, sourcePath: "a.txt", sourceSha1: "a", provenanceCommit: "b", decidedBy: "c", decidedAt: "d", neutralityDetermination: "e", neutralityBasis: "f" },
      PHASE2_CANDIDATE_CITATION_FIELDS,
    );
    assert.equal(citation.status, "unreadable", JSON.stringify(blank));
    const release = classifyPhase2RegisterEntry(
      { compatibilityMasterId: blank, releasedBy: "c", releasedAt: "d", masterWorkScopeRef: "e" },
      PHASE2_MASTER_REVIEW_RELEASE_FIELDS,
    );
    assert.equal(release.status, "unreadable", JSON.stringify(blank));
  }
  const padded = classifyPhase2RegisterEntry(
    {
      compatibilityMasterId: "   BOF-TST-001@1.0   ",
      sourcePath: NEUTRAL_SOURCE,
      sourceSha1: POSITIVE_SHA1,
      provenanceCommit: POSITIVE_COMMIT,
      decidedBy: "Document Steward",
      decidedAt: "2026-09-26T00:00:00Z",
      neutralityDetermination: "CARRIER_NEUTRAL",
      neutralityBasis: NEUTRAL_BASIS,
    },
    PHASE2_CANDIDATE_CITATION_FIELDS,
  );
  assert.equal(padded.status, "invalid");
  if (padded.status === "invalid") {
    assert.equal(padded.masterId, "   BOF-TST-001@1.0   ");
    assert.equal(padded.blocksRegister, true);
  }

  const positive = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const fixtureClass = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false as const,
    contentPosture: "UNCLASSIFIED" as const,
    note: "isolated fixture",
  };
  const alone = buildCompatibilityQualifications([fixtureClass], [], [positive]);
  assert.equal(alone[0]?.result, "CANDIDATE");
  const otherValid = { ...positive, sourceSha1: "0000000000000000000000000000000000000000" };
  const duplicate = buildCompatibilityQualifications([fixtureClass], [], [positive, otherValid]);
  assert.equal(duplicate[0]?.result, "UNREVIEWED");

  function citationIssues(citations: readonly unknown[]) {
    const built = buildCompatibilityQualifications([fixtureClass], [], citations);
    assert.equal(built[0]?.result, "UNREVIEWED");
    return validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "UNREVIEWED" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: null,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: citations,
      }),
    );
  }
  function releaseIssues(releases: readonly unknown[]) {
    const issues = validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "RELEASED_TO_MASTER_REVIEW" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: NEUTRAL_SOURCE,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: [positive],
        masterReviewReleases: releases,
      }),
    );
    expectQualificationCode(issues, Q.releaseMalformed);
    expectQualificationCode(issues, Q.releaseMissing);
    return issues;
  }
  const release = {
    compatibilityMasterId: FIXTURE_ID,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
  for (const blank of ["", "   "]) {
    const badCitation = { ...positive, compatibilityMasterId: blank };
    for (const citations of [
      [positive, badCitation],
      [badCitation, positive],
    ]) {
      expectQualificationCode(citationIssues(citations), Q.citationMalformed);
    }
    const badRelease = { ...release, compatibilityMasterId: blank };
    for (const releases of [
      [release, badRelease],
      [badRelease, release],
    ]) {
      releaseIssues(releases);
    }
  }
  return "a blank or whitespace id is unreadable and blocks the valid sibling in either order";
});

check("12x. A noncanonical master id is not a valid register entry", () => {
  const known = [FIXTURE_ID];
  const noncanonical = [
    "BOF-TST-001@1.0 ",
    " BOF-TST-001@1.0",
    "BOF-TST-001@01.0",
    "bof-tst-001@1.0",
    "\u200b",
    "\u200bBOF-TST-001@1.0",
    "BOF-TST-001@9.9",
    "BOF-ZZZ-001@1.0",
  ];
  const canonical = classifyPhase2RegisterEntry(
    {
      compatibilityMasterId: FIXTURE_ID,
      sourcePath: NEUTRAL_SOURCE,
      sourceSha1: POSITIVE_SHA1,
      provenanceCommit: POSITIVE_COMMIT,
      decidedBy: "Document Steward",
      decidedAt: "2026-09-26T00:00:00Z",
      neutralityDetermination: "CARRIER_NEUTRAL",
      neutralityBasis: NEUTRAL_BASIS,
    },
    PHASE2_CANDIDATE_CITATION_FIELDS,
    known,
  );
  assert.equal(canonical.status, "valid");
  if (canonical.status === "valid") assert.equal(canonical.masterId, FIXTURE_ID);
  for (const masterId of noncanonical) {
    const citation = classifyPhase2RegisterEntry(
      {
        compatibilityMasterId: masterId,
        sourcePath: NEUTRAL_SOURCE,
        sourceSha1: POSITIVE_SHA1,
        provenanceCommit: POSITIVE_COMMIT,
        decidedBy: "Document Steward",
        decidedAt: "2026-09-26T00:00:00Z",
        neutralityDetermination: "CARRIER_NEUTRAL",
        neutralityBasis: NEUTRAL_BASIS,
      },
      PHASE2_CANDIDATE_CITATION_FIELDS,
      known,
    );
    assert.equal(citation.status, "invalid", JSON.stringify(masterId));
    if (citation.status === "invalid") {
      assert.equal(citation.masterId, masterId);
      assert.equal(citation.blocksRegister, true);
    }
    const releaseEntry = classifyPhase2RegisterEntry(
      {
        compatibilityMasterId: masterId,
        releasedBy: "Document Steward",
        releasedAt: "2026-09-26T00:00:00Z",
        masterWorkScopeRef: "master-review:fixture",
      },
      PHASE2_MASTER_REVIEW_RELEASE_FIELDS,
      known,
    );
    assert.equal(releaseEntry.status, "invalid", JSON.stringify(masterId));
    if (releaseEntry.status === "invalid") {
      assert.equal(releaseEntry.masterId, masterId);
      assert.equal(releaseEntry.blocksRegister, true);
    }
  }

  const positive = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const fixtureClass = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false as const,
    contentPosture: "UNCLASSIFIED" as const,
    note: "isolated fixture",
  };
  assert.equal(buildCompatibilityQualifications([fixtureClass], [], [positive])[0]?.result, "CANDIDATE");
  const otherValid = { ...positive, sourceSha1: "0000000000000000000000000000000000000000" };
  assert.equal(buildCompatibilityQualifications([fixtureClass], [], [positive, otherValid])[0]?.result, "UNREVIEWED");

  function recorded(issues: readonly { code: string; subject: string }[], code: string, subject: string): void {
    assert.ok(
      issues.some((issue) => issue.code === code && issue.subject === subject),
      `expected ${code} for ${JSON.stringify(subject)}; got [${issues.map((issue) => `${issue.code}:${JSON.stringify(issue.subject)}`).join(", ")}]`,
    );
  }
  function citationIssues(citations: readonly unknown[]) {
    const built = buildCompatibilityQualifications([fixtureClass], [], citations);
    assert.equal(built[0]?.result, "UNREVIEWED");
    return validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "UNREVIEWED" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: null,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: citations,
      }),
    );
  }
  function releaseIssues(releases: readonly unknown[]) {
    return validatePhase2QualificationRegister(
      liveQualificationInput({
        classifications: [fixtureClass],
        compatibilityRows: [
          {
            compatibilityMasterId: FIXTURE_ID,
            familyKey: FIXTURE_KEY,
            result: "RELEASED_TO_MASTER_REVIEW" as const,
            contentPosture: "UNCLASSIFIED",
            sourceRef: NEUTRAL_SOURCE,
          },
        ],
        deltaRows: [],
        deltaFamilyKeys: [],
        masters: [{ familyKey: FIXTURE_KEY, masterId: FIXTURE_ID, approvalStatus: "NOT_APPROVED" }],
        candidateCitations: [positive],
        masterReviewReleases: releases,
      }),
    );
  }
  const release = {
    compatibilityMasterId: FIXTURE_ID,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
  for (const masterId of noncanonical) {
    const badCitation = { ...positive, compatibilityMasterId: masterId };
    for (const citations of [
      [positive, badCitation],
      [badCitation, positive],
    ]) {
      recorded(citationIssues(citations), Q.citationMalformed, masterId);
    }
    recorded(citationIssues([badCitation]), Q.citationMalformed, masterId);
    const badRelease = { ...release, compatibilityMasterId: masterId };
    for (const releases of [
      [release, badRelease],
      [badRelease, release],
    ]) {
      const issues = releaseIssues(releases);
      recorded(issues, Q.releaseMalformed, masterId);
      expectQualificationCode(issues, Q.releaseMissing);
    }
  }
  return "a noncanonical or orphan id is reported and blocks promotion in either order";
});

check("12y. A backslash source path is rejected and is not rewritten", () => {
  const positive = {
    compatibilityMasterId: FIXTURE_ID,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const fixtureClass = {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    genuineBofMaster: false as const,
    contentPosture: "UNCLASSIFIED" as const,
    note: "isolated fixture",
  };
  const forwardFacts = collectPhase2CitationFacts(positive);
  assert.equal(forwardFacts.sourcePath, NEUTRAL_SOURCE);
  assert.equal(forwardFacts.sourcePresent, true);
  assert.equal(forwardFacts.provenancePathPresent, true);
  assert.equal(forwardFacts.provenanceBlobSha1, POSITIVE_SHA1);
  assert.equal(buildCompatibilityQualifications([fixtureClass], [], [positive])[0]?.result, "CANDIDATE");

  const backslash = NEUTRAL_SOURCE.split(path.posix.sep).join(path.win32.sep);
  const mixed = `docs${path.posix.sep}codex${path.win32.sep}environment-runbook.md`;
  assert.notEqual(backslash, NEUTRAL_SOURCE);
  assert.ok(backslash.includes("\\"));
  assert.ok(mixed.includes("\\") && mixed.includes("/"));
  for (const sourcePath of [backslash, mixed]) {
    const citation = { ...positive, sourcePath };
    const facts = collectPhase2CitationFacts(citation);
    assert.equal(facts.sourcePath, sourcePath);
    assert.equal(facts.sourcePresent, false);
    assert.equal(facts.provenancePathPresent, false);
    assert.equal(facts.provenanceBlobSha1, null);
    assert.equal(buildCompatibilityQualifications([fixtureClass], [], [citation])[0]?.result, "UNREVIEWED");
    const issues = evaluateCitation(citation);
    assert.ok(
      issues.some((issue) => issue.code === G.sourceMissing && issue.subject === sourcePath),
      sourcePath,
    );
  }
  return "forward-slash paths stay admissible; backslash paths are rejected unchanged";
});

check("12z. The live validator reads the live citation and release registers", () => {
  const live = liveQualificationInput();
  assert.equal(live.candidateCitations, PHASE2_CANDIDATE_CITATIONS);
  assert.equal(live.masterReviewReleases, PHASE2_MASTER_REVIEW_RELEASES);
  assert.equal(PHASE2_CANDIDATE_CITATIONS.length, 0);
  assert.equal(PHASE2_MASTER_REVIEW_RELEASES.length, 0);
  assert.deepEqual(validatePhase2QualificationRegister(live), []);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length, 0);
  assert.equal(
    PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "RELEASED_TO_MASTER_REVIEW").length,
    0,
  );

  const sample = unclassifiedQualification();
  const malformedCitation = { compatibilityMasterId: "" };
  expectQualificationCode(
    validatePhase2QualificationRegister(liveQualificationInput({ candidateCitations: [malformedCitation] })),
    Q.citationMalformed,
  );
  const malformedRelease = { compatibilityMasterId: "" };
  expectQualificationCode(
    validatePhase2QualificationRegister(liveQualificationInput({ masterReviewReleases: [malformedRelease] })),
    Q.releaseMalformed,
  );

  const validCitation = {
    compatibilityMasterId: sample.compatibilityMasterId,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
  const oneCitation = validatePhase2QualificationRegister(
    liveQualificationInput({ candidateCitations: [validCitation] }),
  );
  assert.equal(oneCitation.some((issue) => issue.code === Q.citationMalformed || issue.code === Q.citationDuplicate), false);
  expectQualificationCode(
    validatePhase2QualificationRegister(
      liveQualificationInput({ candidateCitations: [validCitation, { ...validCitation }] }),
    ),
    Q.citationDuplicate,
  );
  const validRelease = {
    compatibilityMasterId: sample.compatibilityMasterId,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:validator",
  };
  const oneRelease = validatePhase2QualificationRegister(
    liveQualificationInput({ masterReviewReleases: [validRelease] }),
  );
  assert.equal(oneRelease.some((issue) => issue.code === Q.releaseMalformed || issue.code === Q.releaseDuplicate), false);
  expectQualificationCode(
    validatePhase2QualificationRegister(
      liveQualificationInput({ masterReviewReleases: [validRelease, { ...validRelease }] }),
    ),
    Q.releaseDuplicate,
  );
  assert.equal(PHASE2_CANDIDATE_CITATIONS.length, 0);
  assert.equal(PHASE2_MASTER_REVIEW_RELEASES.length, 0);
  return "empty live registers pass; malformed and valid entries are inspected";
});

function phase2eSubjects(): Phase2EReviewSubjects {
  return {
    documentIdentity: true,
    documentFunction: true,
    documentContent: true,
    documentVersion: true,
    bofAuthorship: true,
    carrierNeutrality: true,
    regulatoryRole: true,
    provenance: true,
  };
}

function phase2eCitation(compatibilityMasterId = FIXTURE_ID) {
  return {
    compatibilityMasterId,
    sourcePath: NEUTRAL_SOURCE,
    sourceSha1: POSITIVE_SHA1,
    provenanceCommit: POSITIVE_COMMIT,
    decidedBy: "Document Steward",
    decidedAt: "2026-09-26T00:00:00Z",
    neutralityDetermination: "CARRIER_NEUTRAL",
    neutralityBasis: NEUTRAL_BASIS,
  };
}

function phase2eRelease(compatibilityMasterId = FIXTURE_ID) {
  return {
    compatibilityMasterId,
    releasedBy: "Document Steward",
    releasedAt: "2026-09-26T00:00:00Z",
    masterWorkScopeRef: "master-review:fixture",
  };
}

function phase2eReviewInput(overrides: Partial<Phase2EMasterReviewInput> = {}): Phase2EMasterReviewInput {
  const citation = phase2eCitation();
  return {
    familyKey: FIXTURE_KEY,
    compatibilityMasterId: FIXTURE_ID,
    version: "1.0",
    versionChange: "MINOR",
    deltaFamilyKeys: [],
    collisionFamilyKeys: [],
    citationIssueCount: 0,
    releaseIssueCount: 0,
    qualificationRows: [
      {
        compatibilityMasterId: FIXTURE_ID,
        familyKey: FIXTURE_KEY,
        result: "RELEASED_TO_MASTER_REVIEW",
      },
    ],
    citations: [citation],
    citationContext: gateContext(citation, {
      knownMasterIds: [FIXTURE_ID],
      deltaFamilyKeys: [],
      collisionFamilyKeys: [],
      inspectionCategory: null,
    }),
    releases: [phase2eRelease()],
    authorship: "BOF_AUTHORED",
    subjects: phase2eSubjects(),
    reviewer: "Document Steward",
    reviewedAt: "2026-09-26T00:00:00Z",
    disposition: "GENUINE_MASTER",
    rationale: "Identity, function, content, version, authorship, neutrality, policy role, and provenance were each reviewed.",
    evidenceRef: "review:fixture",
    rejectionRationale: null,
    insufficientEvidenceRationale: null,
    reviewHistory: [],
    callerHistory: [],
    ...overrides,
  };
}

check("13. Phase 2E review admits only a still-valid release", () => {
  const citationIssues = evaluateCitation(phase2eCitation(), {
    knownMasterIds: [FIXTURE_ID],
    deltaFamilyKeys: [],
    collisionFamilyKeys: [],
    inspectionCategory: null,
  });
  assert.equal(citationIssues.length, 0, citationIssues.map((issue) => issue.code).join(","));
  const passed = evaluatePhase2EMasterReview(phase2eReviewInput());
  assert.equal(passed.entered, true);
  assert.equal(passed.genuineBofMaster, false);
  assert.equal(passed.genuineMasterQualified, true);
  assert.equal(passed.approved, false);
  assert.equal(passed.adoptionCreated, false);
  assert.equal(passed.instanceCreated, false);
  assert.equal(passed.recordCreated, false);
  assert.equal(passed.metadata?.approved, false);
  assert.equal(passed.metadata?.genuineBofMaster, false);
  assert.equal(passed.metadata?.compatibilityMasterId, FIXTURE_ID);
  assert.equal(passed.metadata?.genuineMasterState.kind, PHASE2E_GENUINE_MASTER_STATE);
  assert.equal(passed.metadata?.genuineMasterState.reviewedCompatibilityMasterId, FIXTURE_ID);
  assert.notEqual(passed.metadata?.genuineMasterState.kind, FIXTURE_ID);

  for (const result of ["BLOCKED", "UNREVIEWED", "CANDIDATE"]) {
    const denied = evaluatePhase2EMasterReview(
      phase2eReviewInput({
        qualificationRows: [
          { compatibilityMasterId: FIXTURE_ID, familyKey: FIXTURE_KEY, result },
        ],
      }),
    );
    assert.equal(denied.entered, false, result);
    assert.equal(denied.genuineBofMaster, false, result);
    assert.equal(denied.genuineMasterQualified, false, result);
    expectQualificationCode(denied.issues, MR.entry);
  }
  const countedBypass = {
    ...phase2eReviewInput(),
    rowResult: "RELEASED_TO_MASTER_REVIEW",
    qualificationRows: [{ compatibilityMasterId: FIXTURE_ID, familyKey: FIXTURE_KEY, result: "UNREVIEWED" }],
    citationIssueCount: 0,
    releaseIssueCount: 0,
  };
  const ignoredCount = evaluatePhase2EMasterReview(countedBypass);
  assert.equal(ignoredCount.genuineMasterQualified, false);
  expectQualificationCode(ignoredCount.issues, MR.entry);

  const staleCitation = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      citations: [{ ...phase2eCitation(), sourceSha1: "0000000000000000000000000000000000000000" }],
      citationIssueCount: 0,
    }),
  );
  assert.equal(staleCitation.entered, false);
  assert.equal(staleCitation.genuineMasterQualified, false);
  expectQualificationCode(staleCitation.issues, MR.citation);
  const staleRelease = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      releases: [{ ...phase2eRelease(), releasedAt: "not-a-timestamp" }],
      releaseIssueCount: 0,
    }),
  );
  assert.equal(staleRelease.entered, false);
  expectQualificationCode(staleRelease.issues, MR.release);
  const nanCount = evaluatePhase2EMasterReview(phase2eReviewInput({ citationIssueCount: Number.NaN }));
  assert.equal(nanCount.genuineMasterQualified, false);
  expectQualificationCode(nanCount.issues, MR.citation);
  const negativeCount = evaluatePhase2EMasterReview(phase2eReviewInput({ releaseIssueCount: -1 }));
  assert.equal(negativeCount.genuineMasterQualified, false);
  expectQualificationCode(negativeCount.issues, MR.release);
  const moved = evaluatePhase2EMasterReview(phase2eReviewInput({ version: "2.0", compatibilityMasterId: FIXTURE_ID }));
  assert.equal(moved.genuineBofMaster, false);
  assert.equal(moved.genuineMasterQualified, false);
  expectQualificationCode(moved.issues, MR.identity);

  const formatOnly = "\u200b";
  const formatAndSpace = " \u200b\t";
  const citationOverrides = {
    knownMasterIds: [FIXTURE_ID],
    deltaFamilyKeys: [],
    collisionFamilyKeys: [],
    inspectionCategory: null,
  };
  function reviewCannotApprove(citations: object[], releases: object[]): void {
    const review = evaluatePhase2EMasterReview(
      phase2eReviewInput({ citations, releases, citationIssueCount: 0, releaseIssueCount: 0 }),
    );
    assert.equal(review.genuineMasterQualified, false);
    assert.equal(review.genuineBofMaster, false);
    assert.equal(review.metadata, null);
    const approval = evaluatePhase2EMasterApproval({
      review,
      approvalAuthority: "Document Steward",
      approvedAt: "2026-09-27T00:00:00Z",
      evidenceRef: "approval:fixture",
    });
    assert.equal(approval.approved, false);
    assert.equal(approval.genuineBofMaster, false);
  }
  const formatDecider = { ...phase2eCitation(), decidedBy: formatOnly };
  expectQualificationCode(evaluateCitation(formatDecider, citationOverrides), G.decidedByBlank);
  assert.equal(formatDecider.decidedBy, formatOnly);
  reviewCannotApprove([formatDecider], [phase2eRelease()]);
  expectQualificationCode(
    evaluateCitation({ ...phase2eCitation(), decidedBy: "   " }, citationOverrides),
    G.decidedByBlank,
  );
  expectQualificationCode(
    evaluateCitation({ ...phase2eCitation(), decidedBy: formatAndSpace }, citationOverrides),
    G.decidedByBlank,
  );
  reviewCannotApprove([{ ...phase2eCitation(), decidedBy: formatAndSpace }], [phase2eRelease()]);

  const formatReleaser = { ...phase2eRelease(), releasedBy: formatOnly };
  expectQualificationCode(evaluatePhase2MasterReviewRelease(formatReleaser, true), G.releaseFieldMissing);
  assert.equal(formatReleaser.releasedBy, formatOnly);
  reviewCannotApprove([phase2eCitation()], [formatReleaser]);
  expectQualificationCode(
    evaluatePhase2MasterReviewRelease({ ...phase2eRelease(), releasedBy: "   " }, true),
    G.releaseFieldMissing,
  );
  expectQualificationCode(
    evaluatePhase2MasterReviewRelease({ ...phase2eRelease(), releasedBy: formatAndSpace }, true),
    G.releaseFieldMissing,
  );
  reviewCannotApprove([phase2eCitation()], [{ ...phase2eRelease(), releasedBy: formatAndSpace }]);

  const formatScope = { ...phase2eRelease(), masterWorkScopeRef: formatOnly };
  expectQualificationCode(evaluatePhase2MasterReviewRelease(formatScope, true), G.releaseScopeMissing);
  assert.equal(formatScope.masterWorkScopeRef, formatOnly);
  reviewCannotApprove([phase2eCitation()], [formatScope]);
  expectQualificationCode(
    evaluatePhase2MasterReviewRelease({ ...phase2eRelease(), masterWorkScopeRef: "   " }, true),
    G.releaseScopeMissing,
  );
  expectQualificationCode(
    evaluatePhase2MasterReviewRelease({ ...phase2eRelease(), masterWorkScopeRef: formatAndSpace }, true),
    G.releaseScopeMissing,
  );
  reviewCannotApprove([phase2eCitation()], [{ ...phase2eRelease(), masterWorkScopeRef: formatAndSpace }]);
  assert.equal(evaluatePhase2MasterReviewRelease(phase2eRelease(), true).length, 0);

  return "the gate re-checks the release; format-only citation and release actors cannot qualify or approve";
});

check("13b. Phase 2E rejection and insufficient evidence stay distinct", () => {
  const rejected = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      versionChange: "MAJOR",
      disposition: "REJECTED",
      rationale: "The review did not accept the artifact.",
      rejectionRationale: "Content did not meet the genuine-master subjects.",
    }),
  );
  assert.equal(rejected.entered, true);
  assert.equal(rejected.disposition, "REJECTED");
  assert.equal(rejected.genuineBofMaster, false);
  assert.equal(rejected.genuineMasterQualified, false);
  assert.equal(rejected.approved, false);
  assert.equal(PHASE2E_MASTER_REVIEWS.length, 0);
  const omittedCallerHistory = {
    ...phase2eReviewInput({ disposition: "GENUINE_MASTER" }),
    reviewHistory: [{ compatibilityMasterId: FIXTURE_ID, disposition: "REJECTED" }],
    callerHistory: [],
    priorDispositions: [],
  };
  const afterRejection = evaluatePhase2EMasterReview(omittedCallerHistory);
  assert.equal(afterRejection.entered, false);
  assert.equal(afterRejection.genuineMasterQualified, false);
  expectQualificationCode(afterRejection.issues, MR.rejected);
  const otherId = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      reviewHistory: [{ compatibilityMasterId: "BOF-TST-009@1.0", disposition: "REJECTED" }],
      callerHistory: [{ compatibilityMasterId: "BOF-TST-009@1.0", disposition: "REJECTED" }],
    }),
  );
  assert.equal(otherId.genuineMasterQualified, true);

  const insufficient = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      disposition: "INSUFFICIENT_EVIDENCE",
      rejectionRationale: null,
      insufficientEvidenceRationale: "Provenance is present and the content review is incomplete.",
    }),
  );
  assert.equal(insufficient.disposition, "INSUFFICIENT_EVIDENCE");
  assert.equal(insufficient.genuineBofMaster, false);
  assert.equal(insufficient.genuineMasterQualified, false);
  const resubmitted = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      reviewHistory: [{ compatibilityMasterId: FIXTURE_ID, disposition: "INSUFFICIENT_EVIDENCE" }],
      callerHistory: [],
    }),
  );
  assert.equal(resubmitted.genuineBofMaster, false);
  assert.equal(resubmitted.genuineMasterQualified, true);
  assert.equal(resubmitted.approved, false);
  const qualificationOnly = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      qualificationRows: [{ compatibilityMasterId: FIXTURE_ID, familyKey: FIXTURE_KEY, result: "CANDIDATE" }],
    }),
  );
  assert.equal(qualificationOnly.genuineMasterQualified, false);
  const originated = evaluatePhase2EMasterReview(phase2eReviewInput({ authorship: "CARRIER_ORIGINATED" }));
  assert.equal(originated.genuineMasterQualified, false);
  expectQualificationCode(originated.issues, MR.authorship);
  const blankReviewer = evaluatePhase2EMasterReview(phase2eReviewInput({ reviewer: "\u200b" }));
  assert.equal(blankReviewer.genuineMasterQualified, false);
  expectQualificationCode(blankReviewer.issues, MR.reviewer);
  const blankRationale = evaluatePhase2EMasterReview(phase2eReviewInput({ rationale: "\u200b" }));
  assert.equal(blankRationale.genuineMasterQualified, false);
  expectQualificationCode(blankRationale.issues, MR.rationale);
  const blankEvidence = evaluatePhase2EMasterReview(phase2eReviewInput({ evidenceRef: "\u200b" }));
  assert.equal(blankEvidence.genuineMasterQualified, false);
  expectQualificationCode(blankEvidence.issues, MR.evidence);
  return "a keyed rejection survives an empty caller history; insufficient evidence can be resubmitted";
});

function blockedFamilyReview(familyKey: string): Phase2EMasterReviewInput {
  const masterId = `${familyKey}@1.0`;
  return phase2eReviewInput({
    familyKey,
    compatibilityMasterId: masterId,
    deltaFamilyKeys: [],
    collisionFamilyKeys: [],
    citationIssueCount: 0,
    releaseIssueCount: 0,
    qualificationRows: [
      { compatibilityMasterId: masterId, familyKey, result: "RELEASED_TO_MASTER_REVIEW" },
    ],
  });
}

check("13c. Phase 2E approval, adoption, collisions, and Delta stay separate", () => {
  const genuine = evaluatePhase2EMasterReview(phase2eReviewInput({ rationale: "Each review subject was affirmed." }));
  const approval = evaluatePhase2EMasterApproval({
    review: genuine,
    approvalAuthority: "Document Steward",
    approvedAt: "2026-09-27T00:00:00Z",
    evidenceRef: "approval:fixture",
  });
  assert.equal(genuine.genuineBofMaster, false);
  assert.equal(genuine.genuineMasterQualified, true);
  assert.equal(genuine.approved, false);
  assert.equal(approval.approved, true);
  assert.equal(approval.genuineBofMaster, false);
  assert.equal(approval.adoptionCreated, false);
  assert.equal(approval.instanceCreated, false);
  assert.equal(approval.recordCreated, false);
  const unapproved = evaluatePhase2EMasterApproval({
    review: { ...genuine, metadata: null, genuineMasterQualified: false },
    approvalAuthority: "Document Steward",
    approvedAt: "2026-09-27T00:00:00Z",
    evidenceRef: "approval:fixture",
  });
  assert.equal(unapproved.approved, false);
  expectQualificationCode(unapproved.issues, MR.approvalReview);
  const forgedFlag = evaluatePhase2EMasterApproval({
    review: { ...genuine, genuineBofMaster: true } as unknown as Phase2EReviewResult,
    approvalAuthority: "Document Steward",
    approvedAt: "2026-09-27T00:00:00Z",
    evidenceRef: "approval:fixture",
  });
  assert.equal(forgedFlag.approved, false);
  expectQualificationCode(forgedFlag.issues, MR.approvalReview);
  const insufficient = evaluatePhase2EMasterReview(
    phase2eReviewInput({
      disposition: "INSUFFICIENT_EVIDENCE",
      insufficientEvidenceRationale: "The content review is incomplete.",
    }),
  );
  const forgedInsufficient = evaluatePhase2EMasterApproval({
    review: {
      ...insufficient,
      genuineBofMaster: true,
      genuineMasterQualified: true,
      metadata: genuine.metadata,
    } as unknown as Phase2EReviewResult,
    approvalAuthority: "Document Steward",
    approvedAt: "2026-09-27T00:00:00Z",
    evidenceRef: "approval:fixture",
  });
  assert.equal(forgedInsufficient.approved, false);
  assert.equal(forgedInsufficient.genuineBofMaster, false);

  const collisionKey = PHASE2_COLLISIONS.flatMap((collision) =>
    collision.distinctDocuments.flatMap((document) => (document.familyKey == null ? [] : [document.familyKey])),
  )[0];
  assert.ok(collisionKey);
  const collision = evaluatePhase2EMasterReview(blockedFamilyReview(collisionKey));
  assert.equal(collision.entered, false);
  assert.equal(collision.genuineMasterQualified, false);
  expectQualificationCode(collision.issues, MR.collision);
  const deltaKey = PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS[0];
  const delta = evaluatePhase2EMasterReview(blockedFamilyReview(deltaKey));
  assert.equal(delta.entered, false);
  assert.equal(delta.genuineMasterQualified, false);
  expectQualificationCode(delta.issues, MR.delta);
  const held = evaluatePhase2EMasterReview(blockedFamilyReview("BOF-DRV-002"));
  assert.equal(held.entered, false);
  expectQualificationCode(held.issues, MR.hold);

  assert.equal(PHASE2E_MASTER_REVIEWS.length, 0);
  assert.equal(PHASE2E_MASTER_APPROVALS.length, 0);
  assert.equal(PHASE2E_CARRIER_POLICY_SELECTIONS.length, 0);
  assert.equal(PHASE2_ROSTER_CLASSIFICATIONS.every((row) => row.genuineBofMaster === false), true);
  assert.equal(PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length, 0);
  assert.equal(
    PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "RELEASED_TO_MASTER_REVIEW").length,
    0,
  );
  return "approval re-checks the review; empty caller lists do not admit Delta or a collision";
});

function policyProvision(overrides: Partial<Phase2EPolicyProvision> = {}): Phase2EPolicyProvision {
  return {
    classification: "BOF_DEFAULT_CARRIER_CONFIGURABLE",
    bofDefault: "controlled-default",
    permittedChoices: ["controlled-default", "permitted-alternative"],
    overridePermitted: true,
    additionalApprovalRequired: false,
    ...overrides,
  };
}

function policySelection(overrides: Partial<Phase2ECarrierPolicySelection> = {}): Phase2ECarrierPolicySelection {
  return {
    selectedValue: "permitted-alternative",
    selectionProvenance: "carrier-selection:fixture",
    effectiveDate: "2026-09-26T00:00:00Z",
    approvalEvidenceRef: null,
    ...overrides,
  };
}

check("13d. Carrier policy configuration stays inside the BOF choice set", () => {
  const mandatory = evaluatePhase2ECarrierPolicy(
    policyProvision({
      classification: "BOF_MANDATORY",
      permittedChoices: ["controlled-default"],
      overridePermitted: false,
    }),
    policySelection({ selectedValue: "other-value", selectionProvenance: null, effectiveDate: null }),
  );
  expectQualificationCode(mandatory, MR.policyMandatory);
  const kept = evaluatePhase2ECarrierPolicy(
    policyProvision({ additionalApprovalRequired: true }),
    policySelection({ approvalEvidenceRef: "approval:fixture" }),
  );
  assert.equal(kept.length, 0);
  const outside = evaluatePhase2ECarrierPolicy(
    policyProvision(),
    policySelection({ selectedValue: "unlisted-value" }),
  );
  expectQualificationCode(outside, MR.policyChoice);
  const specific = evaluatePhase2ECarrierPolicy(
    policyProvision({
      classification: "CARRIER_SPECIFIC",
      bofDefault: null,
      permittedChoices: ["framework-a", "framework-b"],
    }),
    policySelection({ selectedValue: "framework-b" }),
  );
  assert.equal(specific.length, 0);
  const unbounded = evaluatePhase2ECarrierPolicy(
    policyProvision({ classification: "CARRIER_SPECIFIC", bofDefault: null, permittedChoices: [] }),
    policySelection({ selectedValue: "anything" }),
  );
  expectQualificationCode(unbounded, MR.policyChoice);
  const specificNull = evaluatePhase2ECarrierPolicy(
    policyProvision({
      classification: "CARRIER_SPECIFIC",
      bofDefault: null,
      permittedChoices: ["framework-a", "framework-b"],
    }),
    policySelection({ selectedValue: null }),
  );
  expectQualificationCode(specificNull, MR.policyChoice);
  const configurableNull = evaluatePhase2ECarrierPolicy(policyProvision(), policySelection({ selectedValue: null }));
  expectQualificationCode(configurableNull, MR.policyChoice);
  const redefinedDefault = {
    selectedValue: "attacker-default",
    selectionProvenance: "carrier-selection:fixture",
    effectiveDate: "2026-09-26T00:00:00Z",
    approvalEvidenceRef: null,
    bofDefault: "attacker-default",
    permittedChoices: ["attacker-default", "controlled-default"],
    overridePermitted: true,
  };
  const mandatoryRedefined = evaluatePhase2ECarrierPolicy(
    policyProvision({
      classification: "BOF_MANDATORY",
      permittedChoices: ["controlled-default"],
      overridePermitted: false,
    }),
    redefinedDefault,
  );
  expectQualificationCode(mandatoryRedefined, MR.policyMandatory);
  const expandedChoices = evaluatePhase2ECarrierPolicy(
    policyProvision({ permittedChoices: ["controlled-default"] }),
    redefinedDefault,
  );
  expectQualificationCode(expandedChoices, MR.policyChoice);
  const blankProvenance = evaluatePhase2ECarrierPolicy(
    policyProvision(),
    policySelection({ selectionProvenance: "\u200b" }),
  );
  expectQualificationCode(blankProvenance, MR.policyProvenance);
  assert.equal(PHASE2E_CARRIER_POLICY_SELECTIONS.length, 0);
  return "the carrier selection cannot replace the BOF provision or pass a null choice";
});

check("14. Remaining lifecycle gates fail closed", () => {
  const review = phase2eReviewInput();
  const established = establishGenuineMaster({ review, genuineVersion: "2.0" });
  assert.equal(established.issues.length, 0);
  assert.ok(established.record);
  assert.equal(established.record.master.masterId, "BOF-TST-001@2.0");
  assert.notEqual(established.record.master.masterId, FIXTURE_ID);
  assert.equal(established.record.reviewedCompatibilityMasterId, FIXTURE_ID);
  assert.equal(established.record.master.approval.status, "NOT_APPROVED");

  const approvalInput = {
    review,
    genuineVersion: "2.0",
    approvalAuthority: "BOF Master Approval Authority",
    approvedAt: "2026-10-01T00:00:00Z",
    evidenceRef: "approval:lifecycle-fixture",
    regulatoryReview: "COMPANY_POLICY" as const,
    productionGate: "ACTIVE",
    lifecycle: "ACTIVE",
  };
  const approved = evaluateMasterApproval(approvalInput);
  assert.equal(approved.issues.length, 0);
  assert.equal(approved.master?.approval.status, "APPROVED");
  assert.equal(approved.master?.masterId, "BOF-TST-001@2.0");

  const adoptionInput = {
    ...approvalInput,
    carrierId: "example-carrier",
    adoptionAuthority: "Carrier Adoption Authority",
    adoptedAt: "2026-10-02T00:00:00Z",
    adoptionEvidenceRef: "adoption:lifecycle-fixture",
  };
  const adopted = evaluateCarrierAdoption(adoptionInput);
  assert.equal(adopted.issues.length, 0);

  const instance = evaluateCanonicalInstance({
    ...adoptionInput,
    instanceVersion: "1.0",
  });
  assert.equal(instance.issues.length, 0);
  assert.equal(instance.instance?.instanceId, "BOF-TST-001::example-carrier");
  assert.equal(instance.instance?.instanceVersion, "1.0");
  assert.notEqual(instance.instance?.instanceVersion, approved.master?.version);

  const record = evaluateOperationalRecord({
    ...adoptionInput,
    instanceVersion: "1.0",
    recordId: "record:lifecycle-fixture",
    pinnedInstanceId: instance.instance?.instanceId ?? null,
    pinnedInstanceVersion: instance.instance?.instanceVersion ?? null,
    kind: "FILLED",
    actor: null,
    signedAt: null,
    recordEvidenceRef: null,
  });
  assert.equal(record.issues.length, 0);
  assert.equal(record.record?.signatureState, "UNSIGNED");

  const expectCode = (issues: { code: string }[], code: string) => {
    assert.equal(issues.some((item) => item.code === code), true, code);
  };

  const ignoredRecord = evaluateMasterApproval({ ...approvalInput, genuineMasters: [established.record] });
  assert.equal(ignoredRecord.issues.length, 0);
  assert.equal(ignoredRecord.master?.approval.evidenceRef, "approval:lifecycle-fixture");
  expectCode(
    establishGenuineMaster({ review, genuineVersion: "1.0", claimedMasterId: FIXTURE_ID }).issues,
    LC.compatibility,
  );
  expectCode(
    evaluateCarrierAdoption({ ...adoptionInput, claimedApproved: true }).issues,
    LC.approvalMissing,
  );
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      review: phase2eReviewInput({ citations: [] }),
      claimedMaster: established.record.master,
    }).issues,
    LC.adoptionMaster,
  );
  expectCode(
    evaluateOperationalRecord({
      ...adoptionInput,
      review: phase2eReviewInput({ citations: [] }),
      instanceVersion: "1.0",
      instances: instance.instance ? [instance.instance] : [],
      recordId: "record:forged-instance",
      pinnedInstanceId: "BOF-TST-001::example-carrier",
      pinnedInstanceVersion: "1.0",
      kind: "FILLED",
      actor: null,
      signedAt: null,
      recordEvidenceRef: null,
    }).issues,
    LC.recordInstance,
  );
  expectCode(
    evaluateOperationalRecord({
      ...adoptionInput,
      instanceVersion: "1.0",
      recordId: "record:master-only",
      pinnedInstanceId: null,
      pinnedInstanceVersion: null,
      masterId: approved.master?.masterId,
      kind: "FILLED",
      actor: null,
      signedAt: null,
      recordEvidenceRef: null,
    }).issues,
    LC.recordMasterPin,
  );
  expectCode(
    evaluateOperationalRecord({
      ...adoptionInput,
      instanceVersion: "1.0",
      recordId: "record:missing-version",
      pinnedInstanceId: instance.instance?.instanceId ?? null,
      pinnedInstanceVersion: "9.9",
      kind: "FILLED",
      actor: null,
      signedAt: null,
      recordEvidenceRef: null,
    }).issues,
    LC.recordInstance,
  );
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      supersededAt: "2026-09-01T00:00:00Z",
      adoptedAt: "2026-10-03T00:00:00Z",
    }).issues,
    LC.adoptionSuperseded,
  );
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      supersededAt: "not-a-timestamp",
    }).issues,
    LC.adoptionSuperseded,
  );
  expectCode(
    evaluateCarrierAdoption({ ...adoptionInput, adoptionEvidenceRef: "approval:lifecycle-fixture" }).issues,
    LC.adoptionReused,
  );
  expectCode(
    evaluateCarrierAdoption({ ...adoptionInput, claimedApproved: true }).issues,
    LC.approvalMissing,
  );
  expectCode(
    establishGenuineMaster({ review, genuineVersion: "2.0", claimedGenuineBofMaster: true, claimedMasterId: FIXTURE_ID }).issues,
    LC.identity,
  );
  expectCode(
    establishGenuineMaster({
      review: blockedFamilyReview("BOF-OPS-006"),
      genuineVersion: "2.0",
    }).issues,
    LC.review,
  );
  for (const authority of ["", "   ", "\u200b"]) {
    expectCode(evaluateMasterApproval({ ...approvalInput, approvalAuthority: authority }).issues, LC.approvalAuthority);
    expectCode(evaluateCarrierAdoption({ ...adoptionInput, adoptionAuthority: authority }).issues, LC.adoptionAuthority);
  }
  for (const evidence of ["", "   ", "\u200b"]) {
    expectCode(evaluateMasterApproval({ ...approvalInput, evidenceRef: evidence }).issues, LC.approvalEvidence);
    expectCode(evaluateCarrierAdoption({ ...adoptionInput, adoptionEvidenceRef: evidence }).issues, LC.adoptionEvidence);
  }
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      policy: [{
        provision: policyProvision({
          classification: "BOF_MANDATORY",
          overridePermitted: false,
          permittedChoices: ["controlled-default"],
        }),
        selection: policySelection({ selectedValue: "carrier-override" }),
      }],
    }).issues,
    LC.adoptionPolicy,
  );
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      policy: [
        {
          provision: policyProvision({ classification: "BOF_DEFAULT_CARRIER_CONFIGURABLE", overridePermitted: true, permittedChoices: ["controlled-default"] }),
          selection: policySelection({ selectedValue: "not-permitted" }),
        },
      ],
    }).issues,
    LC.adoptionPolicy,
  );
  const replaced = policySelection({ selectedValue: "carrier-replacement" });
  const withDefault = replaced as Phase2ECarrierPolicySelection & { bofDefault?: string };
  withDefault.bofDefault = "carrier-replacement";
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      policy: [{ provision: policyProvision(), selection: withDefault }],
    }).issues,
    LC.adoptionPolicy,
  );
  expectCode(
    evaluateCarrierAdoption({
      ...adoptionInput,
      policy: [
        {
          provision: policyProvision({ classification: "CARRIER_SPECIFIC", overridePermitted: true, bofDefault: null, permittedChoices: ["carrier-choice"] }),
          selection: policySelection({ selectedValue: null }),
        },
      ],
    }).issues,
    LC.adoptionPolicy,
  );
  expectCode(
    evaluateCanonicalInstance({
      ...adoptionInput,
      review: phase2eReviewInput({ citations: [] }),
      instanceVersion: "1.0",
      claimedAdoptionStatus: "ADOPTED",
    }).issues,
    LC.instanceAdoption,
  );
  expectCode(
    evaluateMasterApproval({
      ...approvalInput,
      genuineVersion: "3.0",
      existingMasters: approved.master ? [approved.master] : [],
    }).issues,
    LC.masterVersion,
  );
  const draft = establishGenuineMaster({ review, genuineVersion: "3.0" });
  assert.ok(draft.record);
  expectCode(
    establishGenuineMaster({
      review,
      genuineVersion: "4.0",
      existingMasters: [draft.record.master],
    }).issues,
    LC.masterVersion,
  );
  expectCode(
    evaluateCanonicalInstance({
      ...adoptionInput,
      instanceVersion: "1.1",
      existingInstances: instance.instance ? [instance.instance] : [],
    }).issues,
    LC.instanceLimit,
  );
  const inflight = evaluateInflightInstance({
    familyKey: "BOF-TST-001",
    carrierId: "example-carrier",
    instanceVersion: "0.1",
  });
  assert.equal(inflight.issues.length, 0);
  expectCode(
    evaluateInflightInstance({
      familyKey: "BOF-TST-001",
      carrierId: "example-carrier",
      instanceVersion: "0.2",
      existingInstances: inflight.instance ? [inflight.instance] : [],
    }).issues,
    LC.instanceLimit,
  );
  expectCode(evaluateMasterApproval({ ...approvalInput, regulatoryReview: "REQUIRES_LEGAL_REVIEW" }).issues, LC.approvalRegulatory);

  const supersededLater = approved.master
    ? { ...approved.master, lifecycle: "SUPERSEDED" as const, supersededAt: "2026-10-03T00:00:00Z" }
    : null;
  if (supersededLater && instance.instance) {
    assert.equal(summarizeInstanceApproval(supersededLater, instance.instance).instanceEffective, true);
    expectCode(
      evaluateCarrierAdoption({
        ...adoptionInput,
        lifecycle: "SUPERSEDED",
        supersededAt: "2026-10-03T00:00:00Z",
      }).issues,
      LC.approvalGate,
    );
  }
  assert.equal(LIFECYCLE_GENUINE_MASTERS.length, 0);
  assert.equal(LIFECYCLE_MASTER_APPROVALS.length, 0);
  assert.equal(LIFECYCLE_CARRIER_ADOPTIONS.length, 0);
  assert.equal(LIFECYCLE_CANONICAL_INSTANCES.length, 0);
  assert.equal(LIFECYCLE_OPERATIONAL_RECORDS.length, 0);
  assert.equal(phase2Graph.records.length, 0);
  assert.equal(PHASE2_ROSTER_CLASSIFICATIONS.every((row) => row.genuineBofMaster === false), true);
  return "genuine identity, approval, adoption, instance, and record stay separate and the live registers stay empty";
});

check("15. Lifecycle gates recheck the previous transition", () => {
  const review = phase2eReviewInput();
  const established = establishGenuineMaster({ review, genuineVersion: "2.0" });
  assert.ok(established.record);
  const base = {
    review,
    genuineVersion: "2.0",
    approvalAuthority: "BOF Master Approval Authority",
    approvedAt: "2026-10-01T00:00:00Z",
    evidenceRef: "approval:lifecycle-fixture",
    regulatoryReview: "COMPANY_POLICY" as const,
    productionGate: "ACTIVE",
    lifecycle: "ACTIVE",
    carrierId: "example-carrier",
    adoptionAuthority: "Carrier Adoption Authority",
    adoptedAt: "2026-10-02T00:00:00Z",
    adoptionEvidenceRef: "adoption:lifecycle-fixture",
  };
  const forged = {
    ...established.record,
    reviewer: "Fake Reviewer",
    reviewEvidenceRef: "not-a-citation",
  };
  const handBuilt = evaluateMasterApproval({
    ...base,
    review: phase2eReviewInput({ citations: [], releases: [] }),
    genuineMasters: [forged],
    claimedGenuineBofMaster: true,
  });
  assert.equal(handBuilt.master, null);
  expectQualificationCode(handBuilt.issues, LC.review);
  for (const broken of [
    phase2eReviewInput({ reviewer: "Fake Reviewer", citations: [] }),
    phase2eReviewInput({ releases: [] }),
    phase2eReviewInput({ familyKey: "BOF-SAF-POL-001", compatibilityMasterId: FIXTURE_ID }),
    phase2eReviewInput({ authorship: "CARRIER_ORIGINATED" }),
    phase2eReviewInput({ subjects: { ...phase2eSubjects(), documentContent: false } }),
  ]) {
    const denied = evaluateMasterApproval({ ...base, review: broken, genuineMasters: [forged] });
    assert.equal(denied.master, null);
  }
  const govId = "BOF-GOV-POL-001@9.9";
  const govCitation = phase2eCitation(govId);
  const govReview = phase2eReviewInput({
    familyKey: "BOF-GOV-POL-001",
    compatibilityMasterId: govId,
    version: "9.9",
    qualificationRows: [{ compatibilityMasterId: govId, familyKey: "BOF-GOV-POL-001", result: "RELEASED_TO_MASTER_REVIEW" }],
    citations: [govCitation],
    releases: [phase2eRelease(govId)],
    citationContext: gateContext(govCitation, {
      knownMasterIds: [govId],
      deltaFamilyKeys: [],
      collisionFamilyKeys: [],
      inspectionCategory: null,
    }),
  });
  expectQualificationCode(
    establishGenuineMaster({ review: govReview, genuineVersion: "2.2" }).issues,
    LC.compatibility,
  );
  expectQualificationCode(
    evaluateMasterApproval({ ...base, review: govReview, genuineVersion: "3.0", existingMasters: [] }).issues,
    LC.masterVersion,
  );
  expectQualificationCode(
    evaluateMasterApproval({ ...base, review: govReview, genuineVersion: "3.0" }).issues,
    LC.masterVersion,
  );
  const approved = evaluateMasterApproval(base);
  assert.ok(approved.master);
  const mutated = {
    ...approved.master,
    approval: { ...approved.master.approval, evidenceRef: "approval:changed" },
    supersededAt: null,
  };
  expectQualificationCode(
    evaluateCanonicalInstance({
      ...base,
      instanceVersion: "1.0",
      adoptionEvidenceRef: "approval:lifecycle-fixture\u200b",
      claimedAdoptionStatus: "ADOPTED",
    }).issues,
    LC.adoptionReused,
  );
  expectQualificationCode(
    evaluateCanonicalInstance({
      ...base,
      instanceVersion: "1.0",
      adoptionAuthority: "\u200b",
      claimedAdoptionStatus: "ADOPTED",
    }).issues,
    LC.adoptionAuthority,
  );
  expectQualificationCode(
    evaluateCanonicalInstance({ ...base, instanceVersion: "1.0", adoptedAt: "not-a-timestamp" }).issues,
    LC.adoptionTimestamp,
  );
  expectQualificationCode(
    evaluateCanonicalInstance({
      ...base,
      instanceVersion: "1.0",
      supersededAt: "2026-09-01T00:00:00Z",
      adoptedAt: "2026-10-03T00:00:00Z",
      claimedMaster: mutated,
      claimedAdoptionStatus: "ADOPTED",
    }).issues,
    LC.adoptionSuperseded,
  );
  expectQualificationCode(
    evaluateCarrierAdoption({ ...base, adoptionEvidenceRef: "approval:lifecycle-fixture\u200c" }).issues,
    LC.adoptionReused,
  );
  expectQualificationCode(
    evaluateCarrierAdoption({ ...base, adoptionEvidenceRef: " APPROVAL:lifecycle-fixture " }).issues,
    LC.adoptionReused,
  );
  let evidenceReads = 0;
  const gated = evaluateCarrierAdoption({
    ...base,
    adoptionEvidenceRef: "approval:lifecycle-fixture",
    get evidenceRef() {
      evidenceReads += 1;
      return evidenceReads === 1 ? "Approval:Lifecycle-Fixture" : "approval:mutated-each-read";
    },
  });
  expectQualificationCode(gated.issues, LC.adoptionReused);
  assert.equal(evidenceReads, 1);
  expectQualificationCode(
    evaluateCarrierAdoption({ ...base, claimedMaster: mutated }).issues,
    LC.adoptionReused,
  );
  expectQualificationCode(
    evaluateCarrierAdoption({
      ...base,
      evidenceRef: "approval:new",
      adoptionEvidenceRef: "approval:lifecycle-fixture",
      claimedMaster: approved.master,
    }).issues,
    LC.adoptionReused,
  );
  assert.equal(LIFECYCLE_GENUINE_MASTERS.length, 0);
  assert.equal(LIFECYCLE_MASTER_APPROVALS.length, 0);
  return "a hand-built master, a skipped adoption, a roster id, and format-only evidence reuse all fail";
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("Document family Phase 2 validation");
console.log("==================================");
console.log(
  `Phase 1: families=${phase1Graph.families.length} masters=${phase1Graph.masters.length} instances=${phase1Graph.instances.length} carriers=${phase1Graph.carriers.length}`,
);
console.log(
  `Phase 2: families=${phase2Graph.families.length} masters=${phase2Graph.masters.length} instances=${phase2Graph.instances.length} records=${phase2Graph.records.length}`,
);
const qualificationBlocked = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "BLOCKED").length;
const qualificationUnreviewed = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "UNREVIEWED").length;
const qualificationCandidate = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter((row) => row.result === "CANDIDATE").length;
const qualificationReleased = PHASE2_COMPATIBILITY_QUALIFICATIONS.filter(
  (row) => row.result === "RELEASED_TO_MASTER_REVIEW",
).length;
console.log(
  `Qualification: BLOCKED=${qualificationBlocked} UNREVIEWED=${qualificationUnreviewed} CANDIDATE=${qualificationCandidate} RELEASED=${qualificationReleased} deltaBlocked=${PHASE2_DELTA_FAMILY_QUALIFICATIONS.length}`,
);
console.log(
  `Citations: ${PHASE2_CANDIDATE_CITATIONS.length} Releases: ${PHASE2_MASTER_REVIEW_RELEASES.length} Reviews: ${PHASE2E_MASTER_REVIEWS.length} Approvals: ${PHASE2E_MASTER_APPROVALS.length}`,
);
console.log(`Inspections: ${PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.length}`);
console.log("");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` -- ${r.detail}` : ""}`);
}
const failed = results.filter((r) => !r.ok);
console.log("");
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length > 0 ? 1 : 0;
