import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import {
  APPROVED_ADMINISTRATIVE_CLASSIFICATIONS,
  CURRENTLY_MODELED_MANDATORY_ITEM_KEYS,
  KNOWN_REGISTRY_GAPS,
  classifyQualificationReasonCode,
  isEligibleForSoftPolicyConsideration,
  summarizeModeledMandatoryItems,
} from "@/lib/services/qualificationEvidenceClassification";
import { detectEvidenceConflicts } from "@/lib/services/driverQualificationEvidenceInventoryService";
import { MANDATORY_QUALIFICATION_EVIDENCE } from "@/lib/services/authoritativeDriverQualificationService";
import { SOFT_OVERRIDE_POLICY, observeAvailability, readPlatformMode } from "@/lib/services/stage0EnforcementPolicy";

/**
 * Stage 0 D-1 PR 1: classification contract (pure) and the read-only evidence inventory (isolated bof_dev,
 * deterministic synthetic fixtures). PR 1 changes no qualification or movement decision.
 */

const DAY = 86_400_000;
const asOf = new Date("2026-10-24T12:00:00.000Z");

// ---------------------------------------------------------------- Part 1: pure

test("classification: registry codes are MANDATORY with a separate evidence state", () => {
  const cases: Array<[string, string, string]> = [
    ["DRIVER_LICENSE_MISSING", "DRIVER_LICENSE", "MISSING"],
    ["MEDICAL_CERTIFICATE_UNVERIFIED", "MEDICAL_CERTIFICATE", "PENDING"],
    ["PRE_EMPLOYMENT_DRUG_TEST_NOT_COMPLIANCE_VERIFIED", "PRE_EMPLOYMENT_DRUG_TEST", "PENDING"],
    ["EMPLOYMENT_APPLICATION_EXPIRED", "EMPLOYMENT_APPLICATION", "EXPIRED"],
    ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_RECORDED", "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY", "MISSING"],
    ["ROAD_TEST_OR_EQUIVALENT_REJECTED", "ROAD_TEST_OR_EQUIVALENT", "REJECTED"],
    ["WORK_HISTORY_MISSING", "EMPLOYMENT_HISTORY", "MISSING"],
    ["WORK_HISTORY_INCOMPLETE", "EMPLOYMENT_HISTORY", "PENDING"],
    ["DISQUALIFYING_ACCIDENT", "DISQUALIFICATION", "REJECTED"],
    ["DISQUALIFYING_VIOLATION", "DISQUALIFICATION", "REJECTED"],
    ["PRE_EMPLOYMENT_DRUG_TEST_REJECTED", "PRE_EMPLOYMENT_DRUG_TEST", "REJECTED"],
  ];
  for (const [code, key, state] of cases) {
    const finding = classifyQualificationReasonCode(code);
    assert.deepEqual([finding.category, finding.evidenceKey, finding.evidenceState], ["MANDATORY", key, state], code);
  }
});

test("classification: generic legacy, internal and unknown codes are UNCLASSIFIED / UNKNOWN, never ADMINISTRATIVE", () => {
  const codes = [
    "MISSING_REQUIRED_DOCUMENT", "DOCUMENT_PENDING_VERIFICATION", "DRUG_TEST_PENDING", "MANUAL_REVIEW_REQUIRED",
    "QUALIFICATION_RULES_NOT_MET", "REQUIREMENT_EXCEPTION", "DOCUMENT_REJECTED", "DOCUMENT_EXPIRED", "LICENSE_INVALID",
    "MEDICAL_EXPIRED", "WORK_HISTORY_GAP_REVIEW_REQUIRED", "QUALIFICATION_RECORDS_MISSING", "DRIVER_NOT_FOUND",
    "DRIVER_FLEET_MISMATCH", "DRIVER_CONTEXT_REQUIRED", "SOMETHING_NEW", "", "DRIVER_LICENSE_SOMETHING_ELSE",
  ];
  for (const code of codes) {
    const finding = classifyQualificationReasonCode(code);
    assert.equal(finding.category, "UNCLASSIFIED", code);
    assert.equal(finding.evidenceState, "UNKNOWN", code);
    assert.equal(finding.evidenceKey, null, code);
    assert.equal(isEligibleForSoftPolicyConsideration(finding), false, `${code} must never qualify for a soft override`);
  }
});

test("classification: no ADMINISTRATIVE mapping is approved; mandatory findings are never soft-eligible", () => {
  assert.equal(APPROVED_ADMINISTRATIVE_CLASSIFICATIONS.size, 0);
  for (const evidence of MANDATORY_QUALIFICATION_EVIDENCE) {
    for (const suffix of ["MISSING", "EXPIRED", "REJECTED", "UNVERIFIED", "NOT_COMPLIANCE_VERIFIED", "NOT_RECORDED"]) {
      const finding = classifyQualificationReasonCode(`${evidence.key}_${suffix}`);
      assert.notEqual(finding.category, "ADMINISTRATIVE");
      assert.equal(isEligibleForSoftPolicyConsideration(finding), false);
    }
  }
});

test("aggregate: the modeled items are exactly the registry plus employment history and disqualification", () => {
  assert.deepEqual(
    [...CURRENTLY_MODELED_MANDATORY_ITEM_KEYS].sort(),
    [...MANDATORY_QUALIFICATION_EVIDENCE.map((e) => e.key), "EMPLOYMENT_HISTORY", "DISQUALIFICATION"].sort(),
  );
});

test("aggregate: positive only with no findings; it never claims regulatory completeness or authorizes anything", () => {
  const clean = summarizeModeledMandatoryItems([]);
  assert.equal(clean.allCurrentlyModeledMandatoryItemsVerified, true);
  assert.deepEqual(clean.withheldBecause, []);
  assert.equal(clean.regulatoryCompleteness, "NOT_ESTABLISHED");
  assert.equal(clean.authorizesMovement, false);
  assert.equal(clean.enablesSoftOverride, false);
  assert.ok(KNOWN_REGISTRY_GAPS.some((gap) => gap.id === "ANNUAL_MVR_REVIEW"), "annual MVR review is recorded as a potential gap");
  assert.ok(clean.knownRegistryGaps.length >= 1);
  assert.ok(clean.items.every((item) => item.evidenceState === "VERIFIED_CURRENT"));
  assert.equal("allMandatoryQualificationsVerifiedCurrent" in clean, false, "the broader name must not be exposed");
});

test("aggregate: each mandatory item failing each way withholds the positive result and reports the state", () => {
  for (const evidence of MANDATORY_QUALIFICATION_EVIDENCE) {
    for (const [suffix, state] of [["MISSING", "MISSING"], ["UNVERIFIED", "PENDING"], ["EXPIRED", "EXPIRED"], ["REJECTED", "REJECTED"], ["NOT_RECORDED", "MISSING"]] as const) {
      const summary = summarizeModeledMandatoryItems([`${evidence.key}_${suffix}`]);
      assert.equal(summary.allCurrentlyModeledMandatoryItemsVerified, false, `${evidence.key}_${suffix}`);
      assert.equal(summary.items.find((item) => item.key === evidence.key)?.evidenceState, state);
      assert.equal(summary.items.filter((item) => item.evidenceState !== "VERIFIED_CURRENT").length, 1, "only the failing item changes");
    }
  }
  for (const code of ["DISQUALIFYING_ACCIDENT", "WORK_HISTORY_MISSING", "PRE_EMPLOYMENT_DRUG_TEST_REJECTED"]) {
    assert.equal(summarizeModeledMandatoryItems([code]).allCurrentlyModeledMandatoryItemsVerified, false, code);
  }
});

test("aggregate: unknown, unclassified or incomplete input fails closed", () => {
  for (const codes of [["SOMETHING_NEW"], ["MISSING_REQUIRED_DOCUMENT"], ["WORK_HISTORY_GAP_REVIEW_REQUIRED"], ["REQUIREMENT_EXCEPTION"]]) {
    const summary = summarizeModeledMandatoryItems(codes);
    assert.equal(summary.allCurrentlyModeledMandatoryItemsVerified, false, codes.join());
    assert.ok(summary.withheldBecause.some((reason) => reason.startsWith("UNCLASSIFIED:")));
  }
  const unknown = summarizeModeledMandatoryItems(null);
  assert.equal(unknown.allCurrentlyModeledMandatoryItemsVerified, false);
  assert.ok(unknown.items.every((item) => item.evidenceState === "UNKNOWN"));
  assert.ok(unknown.withheldBecause.includes("EVALUATION_INCOMPLETE"));
});

test("aggregate: a conflict is never VERIFIED_CURRENT and the worst state wins", () => {
  const conflicted = summarizeModeledMandatoryItems([], [{ evidenceKey: "MEDICAL_CERTIFICATE", kind: "STRUCTURED_RECORD_CONTRADICTS_DOCUMENT" }]);
  assert.equal(conflicted.allCurrentlyModeledMandatoryItemsVerified, false);
  assert.equal(conflicted.items.find((item) => item.key === "MEDICAL_CERTIFICATE")?.evidenceState, "CONFLICTING");
  const expiredAndConflicted = summarizeModeledMandatoryItems(["MEDICAL_CERTIFICATE_EXPIRED"], [{ evidenceKey: "MEDICAL_CERTIFICATE", kind: "MULTIPLE_CURRENT_VERSIONS" }]);
  assert.equal(expiredAndConflicted.items.find((item) => item.key === "MEDICAL_CERTIFICATE")?.evidenceState, "EXPIRED");
});

const doc = (over: Record<string, unknown>) => ({
  id: "d", type: "MEDICAL", status: "VERIFIED", fleetId: "f", uploadedAt: new Date(asOf.getTime() - DAY), versionNumber: 1,
  supersededAt: null, verificationExpiresAt: new Date(asOf.getTime() + 30 * DAY), ...over,
}) as Parameters<typeof detectEvidenceConflicts>[0]["documents"][number];
const none = { requirements: [], licenses: [], medicalQualifications: [], drugTests: [] };

test("conflicts: objective contradictions only; consistent evidence reports none", () => {
  assert.deepEqual(detectEvidenceConflicts({ asOf, documents: [doc({})], ...none }), []);
  const expiredRow = { status: "EXPIRED", verificationStatus: "VERIFIED", expirationDate: new Date(asOf.getTime() - DAY) };
  assert.deepEqual(detectEvidenceConflicts({ asOf, documents: [doc({})], ...none, medicalQualifications: [expiredRow] }), [
    { evidenceKey: "MEDICAL_CERTIFICATE", kind: "STRUCTURED_RECORD_CONTRADICTS_DOCUMENT" },
  ]);
  const currentRow = { status: "ACTIVE", verificationStatus: "VERIFIED", expirationDate: new Date(asOf.getTime() + 10 * DAY) };
  assert.equal(detectEvidenceConflicts({ asOf, documents: [doc({ status: "REJECTED" })], ...none, medicalQualifications: [currentRow] }).length, 1);
  assert.deepEqual(detectEvidenceConflicts({ asOf, documents: [doc({ id: "a", status: "VERIFIED" }), doc({ id: "b", status: "PENDING_VERIFICATION", versionNumber: 2 })], ...none }), [
    { evidenceKey: "MEDICAL_CERTIFICATE", kind: "MULTIPLE_CURRENT_VERSIONS" },
  ]);
  assert.deepEqual(
    detectEvidenceConflicts({ asOf, documents: [], ...none, requirements: [{ requirementType: "ROAD_TEST_OR_EQUIVALENT", status: "SATISFIED", exceptionReason: null, satisfiedByDocumentId: null }] }),
    [{ evidenceKey: "ROAD_TEST_OR_EQUIVALENT", kind: "REQUIREMENT_CLAIMS_SATISFIED_WITHOUT_VERIFIED_DOCUMENT" }],
  );
  assert.deepEqual(
    detectEvidenceConflicts({ asOf, documents: [], ...none, requirements: [{ requirementType: "DRIVER_LICENSE", status: "EXCEPTION", exceptionReason: "waived", satisfiedByDocumentId: null }] }),
    [{ evidenceKey: "DRIVER_LICENSE", kind: "WAIVER_ON_MANDATORY_ITEM" }],
  );
  // A structured row alone, with no document, is not a conflict and is not verification.
  assert.deepEqual(detectEvidenceConflicts({ asOf, documents: [], ...none, medicalQualifications: [currentRow] }), []);
});

test("D-2 safeguards: the soft-override allowlist is empty and production-like environments stay ENFORCE", () => {
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0);
  assert.equal(observeAvailability({}).allowed, false);
  assert.equal(observeAvailability({ BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" }).allowed, false);
  assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: "STAGING", VERCEL_ENV: "production" }).allowed, false);
  assert.equal(readPlatformMode({}).mode, "ENFORCE");
  const source = readFileSync("lib/services/stage0EnforcementPolicy.ts", "utf8");
  assert.match(source, /const PRODUCTION_OBSERVE_PERMITTED = false as const;/);
  assert.match(source, /softReasonCodes: new Set<string>\(\)|softReasonCodes: new Set\(\)/);
});

test("PR 1 is additive: no existing decision path imports the new modules", () => {
  for (const file of [
    "lib/services/authoritativeDriverQualificationService.ts",
    "lib/services/qualificationService.ts",
    "lib/services/dispatchMovementAuthorizationService.ts",
    "lib/services/stage0EnforcementPolicy.ts",
    "lib/services/stage0EnforcementConfigService.ts",
    "lib/services/driverMovementInvalidationService.ts",
    "lib/services/equipmentSafetyInvalidationService.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /qualificationEvidenceClassification|driverQualificationEvidenceInventory/, file);
  }
});

test("inventory service contains no write, lock or snapshot call", () => {
  const source = readFileSync("lib/services/driverQualificationEvidenceInventoryService.ts", "utf8");
  assert.doesNotMatch(source, /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/);
  assert.doesNotMatch(source, /driverQualificationSnapshot|lockDriver|withDriverQualificationLock|pg_advisory/);
  assert.equal([...source.matchAll(/\$executeRaw\w*\(([^)]*)\)/g)].map((m) => m[1]).join("|"), '"SET TRANSACTION READ ONLY"');
});

// ---------------------------------------------------------------- Part 2: database

const stamp = `d1${Date.now().toString(36)}`;
const load = async () => ({
  prisma: (await import("@/lib/prisma")).prisma,
  fixture: await import("@/lib/test/qualifiedDriverFixture"),
  inventory: await import("@/lib/services/driverQualificationEvidenceInventoryService"),
  evaluator: await import("@/lib/services/authoritativeDriverQualificationService"),
  movement: await import("@/lib/services/dispatchMovementAuthorizationService"),
  assignments: await import("@/lib/services/dispatchAssignmentService"),
  policy: await import("@/lib/services/stage0EnforcementPolicy"),
});
type Mods = Awaited<ReturnType<typeof load>>;
let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
let fleetB = "";
let fleetEmpty = "";
const driverIds: string[] = [];
const loadIds: string[] = [];
const named: Record<string, string> = {};
let complianceA = "";
let complianceB = "";
let dispatcherSession: { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };
let sharedUserId = "";

async function user(label: string, fleetId: string, roleCode: string) {
  const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
  const created = await m.prisma.user.create({ data: { email: `d1-${label}-${stamp}@dev.local`, name: label, status: "ACTIVE" } });
  await m.prisma.fleetMembership.create({ data: { userId: created.id, fleetId, roleId: role.id, status: "ACTIVE" } });
  return created;
}
async function driver(label: string, fleetId: string, qualified: boolean, email?: string, userId?: string) {
  const row = await m.prisma.driver.create({
    data: { fleetId, firstName: "D1", lastName: label, email: email ?? `d1-${label}-${stamp}@dev.local`, status: "ACTIVE", ...(userId ? { userId } : {}) },
  });
  driverIds.push(row.id);
  named[label] = row.id;
  const evidence = qualified
    ? await m.fixture.createQualifiedDriverEvidence(m.prisma, { driverId: row.id, fleetId, complianceUserId: fleetId === fleetA ? complianceA : complianceB })
    : null;
  return { row, evidence };
}
const docOf = (driverId: string, type: string) => m.prisma.driverDocument.findFirstOrThrow({ where: { driverId, type: type as never } });

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `D1 ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `D1 ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `d1-a-${stamp}`, name: `D1 A ${stamp}`, carrierGroupId: groupId } })).id;
  fleetB = (await m.prisma.fleet.create({ data: { slug: `d1-b-${stamp}`, name: `D1 B ${stamp}`, carrierGroupId: groupId } })).id;
  fleetEmpty = (await m.prisma.fleet.create({ data: { slug: `d1-e-${stamp}`, name: `D1 E ${stamp}`, carrierGroupId: groupId } })).id;
  complianceA = (await user("compliance-a", fleetA, "BOF_COMPLIANCE_REVIEW")).id;
  complianceB = (await user("compliance-b", fleetB, "BOF_COMPLIANCE_REVIEW")).id;
  const dispatcher = await user("dispatch-a", fleetA, "DISPATCH");
  dispatcherSession = { id: dispatcher.id, email: dispatcher.email, memberships: [{ fleetId: fleetA, roleCode: "DISPATCH", status: "ACTIVE" }] };

  // Fleet A: eight deterministic drivers covering every evidence state.
  await driver("qualified", fleetA, true);
  await driver("no-intake", fleetA, false);
  const expired = await driver("expired", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(expired.row.id, "DRIVER_LICENSE")).id }, data: { verificationExpiresAt: new Date(Date.now() - 2 * DAY) } });
  const pending = await driver("pending", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(pending.row.id, "MEDICAL")).id }, data: { status: "PENDING_VERIFICATION" } });
  const missing = await driver("missing", fleetA, true);
  await m.prisma.driverDocument.delete({ where: { id: (await docOf(missing.row.id, "DRUG_TEST")).id } });
  const conflict = await driver("conflict", fleetA, true);
  await m.prisma.medicalQualification.create({
    data: { driverId: conflict.row.id, driverIntakeId: conflict.evidence!.intakeId, status: "EXPIRED", verificationStatus: "VERIFIED", expirationDate: new Date(Date.now() - 3 * DAY) },
  });
  const unclassified = await driver("unclassified", fleetA, true);
  await m.prisma.driverIntakeRequirement.create({
    data: { driverIntakeId: unclassified.evidence!.intakeId, requirementType: "CARRIER_ORIENTATION", label: "Carrier orientation", isRequired: true, status: "PENDING" },
  });
  const contradicted = await driver("contradicted", fleetA, true);
  await m.prisma.driverIntake.update({ where: { id: contradicted.evidence!.intakeId }, data: { isComplianceCertified: true } });
  await m.prisma.driverDocument.update({ where: { id: (await docOf(contradicted.row.id, "MEDICAL")).id }, data: { status: "REJECTED" } });

  // Fleet B plus a person who appears in both fleets: same email on two Driver rows, and one user with a
  // membership in each fleet linked to the fleet A driver.
  const both = await m.prisma.user.create({ data: { email: `d1-both-${stamp}@dev.local`, name: "both", status: "ACTIVE" } });
  sharedUserId = both.id;
  const role = await m.prisma.role.upsert({ where: { code: "DRIVER" }, update: {}, create: { code: "DRIVER", name: "DRIVER" } });
  await m.prisma.fleetMembership.create({ data: { userId: both.id, fleetId: fleetA, roleId: role.id, status: "ACTIVE" } });
  await m.prisma.fleetMembership.create({ data: { userId: both.id, fleetId: fleetB, roleId: role.id, status: "ACTIVE" } });
  await driver("shared-a", fleetA, true, `d1-same-${stamp}@dev.local`, both.id);
  await driver("shared-b", fleetB, true, `d1-same-${stamp}@dev.local`);
  await driver("b-only", fleetB, false);
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  const fleets = [fleetA, fleetB, fleetEmpty].filter(Boolean);
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.preTripHeader.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: driverIds } } });
  await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: driverIds } } });
  await prisma.medicalQualification.deleteMany({ where: { driverId: { in: driverIds } } });
  await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: driverIds } } } });
  await m.fixture.cleanupQualifiedDriverEvidence(prisma, driverIds);
  await prisma.load.deleteMany({ where: { id: { in: loadIds } } });
  await prisma.equipment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driver.deleteMany({ where: { id: { in: driverIds } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
  await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
  await prisma.carrierGroup.deleteMany({ where: { id: groupId } });
  await prisma.aggregator.deleteMany({ where: { id: aggregatorId } });
});

const stable = (inventory: object) => {
  const copy = { ...(inventory as { asOf?: string }) };
  delete copy.asOf;
  return JSON.stringify(copy);
};
const evaluate = (id: string, fleetId: string) =>
  m.prisma.$transaction(async (tx) => {
    const result = await m.evaluator.getAuthoritativeDriverQualification(tx, id, fleetId);
    const copy: Partial<typeof result> = { ...result };
    delete copy.evaluatedAt;
    return copy;
  });

test("inventory: exact counts for the deterministic fleet A fixture, with every evidence state distinguished", async () => {
  const inv = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true, asOf: new Date() });
  assert.equal(inv.readOnly, true);
  assert.equal(inv.regulatoryCompleteness, "NOT_ESTABLISHED");
  assert.equal(inv.totals.drivers, 9);
  assert.equal(inv.totals.withoutIntake, 1);
  assert.equal(inv.totals.evaluationFailed, 0);
  assert.equal(inv.totals.allCurrentlyModeledMandatoryItemsVerified + inv.totals.notAllCurrentlyModeledMandatoryItemsVerified, 9);
  const byLabel = (label: string) => inv.drivers!.find((d) => d.driverId === named[label])!;

  assert.equal(byLabel("qualified").summary.allCurrentlyModeledMandatoryItemsVerified, true);
  assert.equal(byLabel("qualified").qualificationStatus, "QUALIFIED");
  assert.equal(byLabel("shared-a").summary.allCurrentlyModeledMandatoryItemsVerified, true);

  const state = (label: string, key: string) => byLabel(label).summary.items.find((i) => i.key === key)!.evidenceState;
  assert.equal(state("expired", "DRIVER_LICENSE"), "EXPIRED");
  assert.equal(state("pending", "MEDICAL_CERTIFICATE"), "PENDING");
  assert.equal(state("missing", "PRE_EMPLOYMENT_DRUG_TEST"), "MISSING");
  assert.equal(state("conflict", "MEDICAL_CERTIFICATE"), "CONFLICTING");
  assert.equal(state("contradicted", "MEDICAL_CERTIFICATE"), "REJECTED");
  assert.equal(byLabel("no-intake").qualificationStatus, "PENDING_COMPLIANCE");
  assert.equal(byLabel("no-intake").intakeCount, 0);

  for (const label of ["expired", "pending", "missing", "conflict", "unclassified", "contradicted", "no-intake"]) {
    assert.equal(byLabel(label).summary.allCurrentlyModeledMandatoryItemsVerified, false, label);
  }
  const unclassified = byLabel("unclassified").summary;
  assert.ok(unclassified.findings.some((f) => f.category === "UNCLASSIFIED"), "non-registry requirement finding is unclassified");
  assert.ok(unclassified.findings.every((f) => f.category !== "ADMINISTRATIVE"));
  assert.equal(byLabel("contradicted").priorCertificationContradicted, true);
  assert.equal(byLabel("qualified").priorCertificationContradicted, false);
  assert.equal(inv.totals.priorCertificationContradicted, 1);
  assert.equal(inv.conflicts["MEDICAL_CERTIFICATE:STRUCTURED_RECORD_CONTRADICTS_DOCUMENT"], 1);

  // Every item and every state is present; zero is explicit rather than omitted.
  for (const key of CURRENTLY_MODELED_MANDATORY_ITEM_KEYS) {
    assert.deepEqual(Object.keys(inv.itemStates[key]).sort(), ["CONFLICTING", "EXPIRED", "MISSING", "PENDING", "REJECTED", "UNKNOWN", "VERIFIED_CURRENT"]);
    assert.equal(Object.values(inv.itemStates[key]).reduce((a, b) => a + b, 0), 9, key);
  }
  assert.equal(inv.itemStates.DRIVER_LICENSE.EXPIRED, 1);
  assert.equal(inv.totals.byDriverStatus.ACTIVE, 9);
  // Affiliation is reported per driver and equals the requested fleet.
  assert.ok(inv.drivers!.every((d) => d.affiliation.fleetId === fleetA && d.affiliation.driverId === d.driverId));
});

test("inventory: evaluator output and status agree and are unchanged by the inventory", async () => {
  const before = new Map<string, unknown>();
  for (const id of driverIds) before.set(id, await evaluate(id, driverIds.indexOf(id) >= 0 && [named["shared-b"], named["b-only"]].includes(id) ? fleetB : fleetA));
  const inv = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetB, includeDrivers: true });
  for (const id of driverIds) {
    const fleetId = [named["shared-b"], named["b-only"]].includes(id) ? fleetB : fleetA;
    assert.deepEqual(await evaluate(id, fleetId), before.get(id), "evaluator result unchanged after inventory");
  }
  for (const record of inv.drivers!) {
    const direct = (await evaluate(record.driverId, fleetA)) as { status: string; reasonCodes: string[] };
    assert.equal(record.qualificationStatus, direct.status);
    assert.deepEqual(record.summary.findings.map((f) => f.code), direct.reasonCodes);
    if (record.summary.allCurrentlyModeledMandatoryItemsVerified) assert.equal(direct.status, "QUALIFIED", "a positive aggregate implies the evaluator's QUALIFIED");
  }
});

test("inventory: movement-authorization decisions are unchanged", async () => {
  const mk = async (qualified: boolean) => {
    const d = await driver(`mv-${qualified}-${driverIds.length}`, fleetA, qualified);
    const load = await m.prisma.load.create({
      data: { fleetId: fleetA, customerName: "D1", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED", pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000) },
    });
    loadIds.push(load.id);
    const n = driverIds.length;
    const tractor = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `D1T-${stamp}-${n}`, vin: `1XPBDP9X0D1${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
    const trailer = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRAILER", unitNumber: `D1L-${stamp}-${n}`, status: "AVAILABLE" } });
    return { driverId: d.row.id, loadId: load.id, tractorId: tractor.id, trailerId: trailer.id };
  };
  const decide = async (c: Awaited<ReturnType<typeof mk>>) =>
    m.prisma.$transaction(async (tx) => {
      const result = await m.movement.authorizeMovement(tx, "PLANNING_RESERVE", {
        sessionUser: dispatcherSession,
        loadId: c.loadId,
        proposedAssignment: { driverId: c.driverId, tractorId: c.tractorId, trailerId: c.trailerId },
      });
      return { allowed: result.allowed, disposition: result.disposition, reasonCodes: result.reasonCodes, status: result.driverQualificationStatus, mode: result.enforcement?.mode, overridden: result.enforcement?.overridden };
    });
  const good = await mk(true);
  const bad = await mk(false);
  const goodBefore = await decide(good);
  const badBefore = await decide(bad);
  assert.equal(goodBefore.allowed, true);
  assert.equal(badBefore.allowed, false);
  await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  assert.deepEqual(await decide(good), goodBefore);
  assert.deepEqual(await decide(bad), badBefore);
  assert.equal(badBefore.overridden, false);
});

test("inventory: missing evidence is never verified and the aggregate is never positive for non-clean drivers", async () => {
  const inv = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  for (const record of inv.drivers!) {
    const clean = record.summary.items.every((i) => i.evidenceState === "VERIFIED_CURRENT");
    assert.equal(record.summary.allCurrentlyModeledMandatoryItemsVerified, clean && record.summary.findings.length === 0 && record.summary.conflicts.length === 0);
    assert.equal(record.summary.authorizesMovement, false);
    assert.equal(record.summary.enablesSoftOverride, false);
  }
  const noIntake = inv.drivers!.find((d) => d.driverId === named["no-intake"])!;
  assert.ok(noIntake.summary.withheldBecause.some((r) => r.startsWith("UNCLASSIFIED:QUALIFICATION_RECORDS_MISSING")), "an absent intake is reported, not assumed verified");
});

test("inventory: fleet isolation with a person affiliated to two fleets", async () => {
  const a = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  const b = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetB, includeDrivers: true });
  assert.equal(b.totals.drivers, 2);
  const textA = JSON.stringify(a);
  const textB = JSON.stringify(b);
  assert.ok(!textA.includes(fleetB) && !textA.includes(named["shared-b"]) && !textA.includes(named["b-only"]), "fleet A output never mentions fleet B");
  assert.ok(!textB.includes(fleetA) && !textB.includes(named["shared-a"]) && !textB.includes(named.qualified), "fleet B output never mentions fleet A");
  const sharedA = a.drivers!.find((d) => d.driverId === named["shared-a"])!;
  assert.equal(sharedA.affiliation.activeFleetMembership, true, "membership counted only for the requested fleet");
  assert.equal(b.drivers!.find((d) => d.driverId === named["shared-b"])!.affiliation.userLinked, false);
  assert.ok(!textA.includes(`d1-same-${stamp}`) && !textB.includes(`d1-same-${stamp}`), "no email is reported");
  // Another fleet's id passed with this fleet's driver evaluates nothing across the boundary.
  assert.equal((await evaluate(named["shared-a"], fleetB) as { status: string }).status, "NOT_QUALIFIED");
  assert.ok(sharedUserId);
});

test("inventory: no database mutation, and the read-only transaction rejects writes", async () => {
  const fingerprint = async () => {
    const q = async (sql: string) => JSON.stringify(await m.prisma.$queryRawUnsafe(sql));
    return [
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "Driver" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntake" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverDocument" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntakeRequirement"`),
      await q(`SELECT count(*)::int AS n FROM "DriverQualificationSnapshot" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DriverReadinessScore" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "AuditEvent" WHERE "tenantId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DispatchAssignment" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DispatchRelease" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "Stage0EnforcementSetting" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
    ].join("\n");
  };
  const before = await fingerprint();
  await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetB });
  assert.equal(await fingerprint(), before);

  await assert.rejects(
    m.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.driver.update({ where: { id: named.qualified }, data: { phone: "000" } });
    }),
    /read-only/i,
  );
  assert.equal((await m.prisma.driver.findUniqueOrThrow({ where: { id: named.qualified } })).phone, null);
});

test("inventory: reproducible, deterministic and explicit about empty or unknown fleets", async () => {
  const one = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  const two = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  assert.equal(stable(one), stable(two));
  assert.deepEqual(one.drivers!.map((d) => d.driverId), [...one.drivers!.map((d) => d.driverId)].sort());

  const empty = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetEmpty });
  assert.equal(empty.totals.drivers, 0);
  assert.deepEqual(empty.totals.byQualificationStatus, {});
  assert.equal(empty.drivers, undefined, "driver ids are opt-in");
  assert.equal(empty.regulatoryCompleteness, "NOT_ESTABLISHED");
  await assert.rejects(m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: "no-such-fleet" }), /Fleet not found/);
  await assert.rejects(m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: "  " }), /fleetId is required/);

  const aggregateOnly = await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA });
  const text = JSON.stringify(aggregateOnly);
  assert.ok(!text.includes(named.qualified) && !text.includes("@dev.local") && !text.includes("D1"), "aggregate output carries no ids, emails or names");
});

test("D-2 and production safeguards are untouched after running the inventory", async () => {
  await m.inventory.runDriverQualificationEvidenceInventory(m.prisma, { fleetId: fleetA, includeDrivers: true });
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0);
  const resolution = await m.prisma.$transaction((tx) => m.policy.resolveStage0EnforcementMode(tx, fleetA, {}));
  assert.equal(resolution.mode, "ENFORCE");
  assert.equal(resolution.source, "PRODUCTION_LOCK");
  const hostile = await m.prisma.$transaction((tx) => m.policy.resolveStage0EnforcementMode(tx, fleetA, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE", VERCEL_ENV: "production" }));
  assert.equal(hostile.mode, "ENFORCE");
  assert.equal(await m.prisma.stage0EnforcementSetting.count({ where: { fleetId: { in: [fleetA, fleetB] } } }), 0);
});

test("script: refuses without confirmation or a declared non-production environment, and never prints the connection string", async () => {
  const run = (args: string[], env: Record<string, string | undefined>) => {
    try {
      const stdout = execFileSync("npx", ["tsx", "scripts/driver-qualification-evidence-inventory.ts", ...args], {
        env: { ...process.env, BOF_STAGE0_ENVIRONMENT_CLASS: undefined, VERCEL_ENV: undefined, ...env } as NodeJS.ProcessEnv,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, stdout, stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
    }
  };
  assert.notEqual(run(["--fleet-id", fleetA], { BOF_STAGE0_ENVIRONMENT_CLASS: "TEST" }).code, 0, "no confirmation flag");
  assert.notEqual(run(["--confirm-approved-nonproduction-snapshot"], { BOF_STAGE0_ENVIRONMENT_CLASS: "TEST" }).code, 0, "no fleet");
  assert.notEqual(run(["--fleet-id", fleetA, "--confirm-approved-nonproduction-snapshot"], {}).code, 0, "environment undeclared");
  assert.notEqual(run(["--fleet-id", fleetA, "--confirm-approved-nonproduction-snapshot"], { BOF_STAGE0_ENVIRONMENT_CLASS: "TEST", VERCEL_ENV: "production" }).code, 0);
  const ok = run(["--fleet-id", fleetA, "--confirm-approved-nonproduction-snapshot"], { BOF_STAGE0_ENVIRONMENT_CLASS: "TEST" });
  assert.equal(ok.code, 0, ok.stderr);
  const parsed = JSON.parse(ok.stdout);
  assert.equal(parsed.totals.drivers, await m.prisma.driver.count({ where: { fleetId: fleetA } }));
  assert.ok(!ok.stdout.includes("postgres://") && !ok.stderr.includes("postgres://") && !ok.stderr.includes("@"), "no credentials in output");
});
