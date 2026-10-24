import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import {
  DISQUALIFICATION_RULES,
  MANDATORY_REQUIREMENT_MAPPING,
  PROPOSED_ADMINISTRATIVE_MAPPING,
  buildQualificationProvenance,
  type FindingProvenance,
  type ProvenanceRows,
} from "@/lib/services/qualificationFindingProvenance";
import {
  APPROVED_ADMINISTRATIVE_CLASSIFICATIONS,
  CURRENTLY_MODELED_MANDATORY_ITEM_KEYS,
  classifyQualificationReasonCode,
} from "@/lib/services/qualificationEvidenceClassification";
import { MANDATORY_QUALIFICATION_EVIDENCE } from "@/lib/services/authoritativeDriverQualificationService";
import { SOFT_OVERRIDE_POLICY, observeAvailability } from "@/lib/services/stage0EnforcementPolicy";

/**
 * Stage 0 D-1 PR 2: finding provenance. Part 1 is pure; part 2 runs on the isolated bof_dev database with
 * deterministic synthetic fixtures. PR 2 changes no qualification or movement decision and activates no
 * administrative classification.
 */

const emptyRows: ProvenanceRows = {
  fleetId: "f", documents: [], requirements: [], licenses: [], medicalQualifications: [], drugTests: [],
  workHistory: [], accidentHistory: [], violationHistory: [], verificationSources: [],
};

// ---------------------------------------------------------------- Part 1: pure

test("mapping: mandatory requirements are exactly the registry plus employment history, each provisional", () => {
  assert.deepEqual(
    MANDATORY_REQUIREMENT_MAPPING.map((m) => m.requirementId).sort(),
    [...MANDATORY_QUALIFICATION_EVIDENCE.map((e) => e.key), "EMPLOYMENT_HISTORY"].sort(),
  );
  assert.ok(MANDATORY_REQUIREMENT_MAPPING.every((m) => m.regulatoryStatus === "PROVISIONAL_PENDING_LEGAL_REVIEW"));
  assert.deepEqual(DISQUALIFICATION_RULES.map((r) => r.code).sort(), ["DISQUALIFYING_ACCIDENT", "DISQUALIFYING_VIOLATION", "PRE_EMPLOYMENT_DRUG_TEST_REJECTED"]);
});

test("findings without records: absence is stated, nothing is invented", () => {
  const report = buildQualificationProvenance({
    reasonCodes: ["DRIVER_LICENSE_MISSING", "WORK_HISTORY_MISSING", "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_RECORDED"],
    conflicts: [], rows: emptyRows, legacyInputs: null,
  });
  for (const finding of report.findings) {
    assert.equal(finding.category, "MANDATORY", finding.code);
    assert.equal(finding.attribution, "AUTHORITATIVE_MAPPING");
    assert.equal(finding.sourceEvidence, "NONE_RECORDED");
    assert.deepEqual(finding.sources, []);
    assert.ok(finding.requirementId && MANDATORY_REQUIREMENT_MAPPING.some((m) => m.requirementId === finding.requirementId));
  }
  assert.ok(report.items.every((item) => item.provenanceState === "MISSING"), "no record means missing provenance, never verified");
});

test("generic legacy and unknown codes with no records stay UNCLASSIFIED with unknown provenance", () => {
  const codes = ["MISSING_REQUIRED_DOCUMENT", "DOCUMENT_PENDING_VERIFICATION", "DRUG_TEST_PENDING", "MANUAL_REVIEW_REQUIRED", "QUALIFICATION_RULES_NOT_MET", "SOMETHING_NEW", "DRIVER_NOT_FOUND"];
  const report = buildQualificationProvenance({ reasonCodes: codes, conflicts: [], rows: emptyRows, legacyInputs: null });
  for (const finding of report.findings) {
    assert.equal(finding.category, "UNCLASSIFIED", finding.code);
    assert.equal(finding.attribution, "UNATTRIBUTED", finding.code);
    assert.equal(finding.sourceEvidence, "UNKNOWN", finding.code);
    assert.equal(finding.requirementId, null);
    assert.deepEqual(finding.sources, []);
  }
});

test("an incomplete evaluation yields no provenance claims and no verified item", () => {
  const report = buildQualificationProvenance({ reasonCodes: null, conflicts: [], rows: emptyRows, legacyInputs: null });
  assert.deepEqual(report.findings, []);
  assert.ok(report.items.every((item) => item.evidenceState === "UNKNOWN" && item.provenanceState === "MISSING"));
});

test("administrative classification is inactive: approved mapping empty, proposal inert and never consulted", () => {
  assert.equal(APPROVED_ADMINISTRATIVE_CLASSIFICATIONS.size, 0);
  assert.ok(PROPOSED_ADMINISTRATIVE_MAPPING.length > 0);
  for (const entry of PROPOSED_ADMINISTRATIVE_MAPPING) {
    assert.equal(classifyQualificationReasonCode(entry.requirementType).category, "UNCLASSIFIED");
  }
  const classification = readFileSync("lib/services/qualificationEvidenceClassification.ts", "utf8");
  assert.doesNotMatch(classification, /PROPOSED_ADMINISTRATIVE_MAPPING/);
  const provenance = readFileSync("lib/services/qualificationFindingProvenance.ts", "utf8");
  assert.equal([...provenance.matchAll(/PROPOSED_ADMINISTRATIVE_MAPPING/g)].length, 1, "declared once, consulted nowhere");
  const report = buildQualificationProvenance({ reasonCodes: ["MISSING_REQUIRED_DOCUMENT"], conflicts: [], rows: emptyRows, legacyInputs: null });
  assert.equal(report.administrativeClassificationActive, false);
});

test("D-2 safeguards and additivity: allowlist empty, production ENFORCE, no decision path imports the new modules", () => {
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0);
  assert.equal(observeAvailability({}).allowed, false);
  assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: "STAGING", VERCEL_ENV: "production" }).allowed, false);
  for (const file of [
    "lib/services/authoritativeDriverQualificationService.ts", "lib/services/qualificationService.ts",
    "lib/services/dispatchMovementAuthorizationService.ts", "lib/services/stage0EnforcementPolicy.ts",
    "lib/services/stage0EnforcementConfigService.ts", "lib/services/driverMovementInvalidationService.ts",
    "lib/services/equipmentSafetyInvalidationService.ts", "lib/services/qualificationEvidenceClassification.ts",
    "lib/services/driverQualificationEvidenceInventoryService.ts",
  ]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /qualificationFindingProvenance|driverQualificationProvenanceService/, file);
  }
  const loader = readFileSync("lib/services/driverQualificationProvenanceService.ts", "utf8");
  assert.doesNotMatch(loader, /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/);
  assert.doesNotMatch(loader, /driverQualificationSnapshot|withDriverQualificationLock|pg_advisory/);
});

// ---------------------------------------------------------------- Part 2: database

const stamp = `p2${Date.now().toString(36)}`;
const load = async () => ({
  prisma: (await import("@/lib/prisma")).prisma,
  fixture: await import("@/lib/test/qualifiedDriverFixture"),
  provenance: await import("@/lib/services/driverQualificationProvenanceService"),
  evaluator: await import("@/lib/services/authoritativeDriverQualificationService"),
  movement: await import("@/lib/services/dispatchMovementAuthorizationService"),
  policy: await import("@/lib/services/stage0EnforcementPolicy"),
});
type Mods = Awaited<ReturnType<typeof load>>;
let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
let fleetB = "";
const driverIds: string[] = [];
const loadIds: string[] = [];
const named: Record<string, string> = {};
const intakeOf: Record<string, string> = {};
let complianceA = "";
let complianceB = "";
let dispatcherSession: { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };

async function user(label: string, fleetId: string, roleCode: string) {
  const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
  const created = await m.prisma.user.create({ data: { email: `p2-${label}-${stamp}@dev.local`, name: label, status: "ACTIVE" } });
  await m.prisma.fleetMembership.create({ data: { userId: created.id, fleetId, roleId: role.id, status: "ACTIVE" } });
  return created;
}
async function driver(label: string, fleetId: string, qualified: boolean) {
  const row = await m.prisma.driver.create({ data: { fleetId, firstName: "P2", lastName: label, email: `p2-${label}-${stamp}@dev.local`, status: "ACTIVE" } });
  driverIds.push(row.id);
  named[label] = row.id;
  const evidence = qualified
    ? await m.fixture.createQualifiedDriverEvidence(m.prisma, { driverId: row.id, fleetId, complianceUserId: fleetId === fleetA ? complianceA : complianceB })
    : null;
  if (evidence) intakeOf[label] = evidence.intakeId;
  return { row, evidence };
}
const docOf = (driverId: string, type: string) => m.prisma.driverDocument.findFirstOrThrow({ where: { driverId, type: type as never } });
const report = (label: string, fleetId = fleetA) => m.prisma.$transaction((tx) => m.provenance.loadDriverQualificationProvenance(tx, named[label], fleetId));
const finding = (r: Awaited<ReturnType<typeof report>>, code: string): FindingProvenance => {
  const found = r.provenance.findings.find((f) => f.code === code);
  assert.ok(found, `${code} present in ${r.provenance.findings.map((f) => f.code).join(",")}`);
  return found;
};
const item = (r: Awaited<ReturnType<typeof report>>, id: string) => r.provenance.items.find((i) => i.requirementId === id)!;

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `P2 ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `P2 ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `p2-a-${stamp}`, name: `P2 A ${stamp}`, carrierGroupId: groupId } })).id;
  fleetB = (await m.prisma.fleet.create({ data: { slug: `p2-b-${stamp}`, name: `P2 B ${stamp}`, carrierGroupId: groupId } })).id;
  complianceA = (await user("compliance-a", fleetA, "BOF_COMPLIANCE_REVIEW")).id;
  complianceB = (await user("compliance-b", fleetB, "BOF_COMPLIANCE_REVIEW")).id;
  const dispatcher = await user("dispatch-a", fleetA, "DISPATCH");
  dispatcherSession = { id: dispatcher.id, email: dispatcher.email, memberships: [{ fleetId: fleetA, roleCode: "DISPATCH", status: "ACTIVE" }] };

  await driver("qualified", fleetA, true);
  const incomplete = await driver("incomplete", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(incomplete.row.id, "DRIVER_LICENSE")).id }, data: { verifiedAt: null } });
  const expired = await driver("expired", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(expired.row.id, "DRIVER_LICENSE")).id }, data: { verificationExpiresAt: new Date(Date.now() - 2 * 86_400_000) } });
  const pending = await driver("pending", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(pending.row.id, "MEDICAL")).id }, data: { status: "PENDING_VERIFICATION" } });
  const missing = await driver("missing", fleetA, true);
  await m.prisma.driverDocument.delete({ where: { id: (await docOf(missing.row.id, "DRUG_TEST")).id } });
  const unlinked = await driver("unlinked", fleetA, true);
  await m.prisma.driverIntakeRequirement.updateMany({ where: { driverIntakeId: unlinked.evidence!.intakeId, requirementType: "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY" }, data: { satisfiedByDocumentId: null } });
  const conflict = await driver("conflict", fleetA, true);
  await m.prisma.medicalQualification.create({
    data: { driverId: conflict.row.id, driverIntakeId: conflict.evidence!.intakeId, status: "EXPIRED", verificationStatus: "VERIFIED", expirationDate: new Date(Date.now() - 3 * 86_400_000) },
  });
  const legacy = await driver("legacy", fleetA, true);
  await m.prisma.driverIntakeRequirement.create({ data: { driverIntakeId: legacy.evidence!.intakeId, requirementType: "CARRIER_ORIENTATION", label: "Carrier orientation", isRequired: true, status: "PENDING" } });
  await m.prisma.driverIntakeRequirement.create({ data: { driverIntakeId: legacy.evidence!.intakeId, requirementType: "IDENTITY_SUPPORTING", label: "Identity", isRequired: true, status: "PENDING" } });
  await m.prisma.driverDocument.create({
    data: { driverId: legacy.row.id, driverIntakeId: legacy.evidence!.intakeId, fleetId: fleetA, type: "IDENTITY_SUPPORTING", status: "PENDING_VERIFICATION", storageKey: `test/p2/${legacy.row.id}/id`, originalFileName: "id.pdf", uploadedByUserId: complianceA },
  });
  const crossFleet = await driver("cross-fleet", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(crossFleet.row.id, "MEDICAL")).id }, data: { fleetId: fleetB } });
  const sourced = await driver("sourced", fleetA, true);
  await m.prisma.verificationSource.create({
    data: { driverDocumentId: (await docOf(sourced.row.id, "DRIVER_LICENSE")).id, providerName: "Synthetic Provider", verificationMethod: "MANUAL_REVIEW", verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedByUserId: complianceA },
  });
  await driver("no-intake", fleetA, false);
  await driver("b-qualified", fleetB, true);
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  const fleets = [fleetA, fleetB].filter(Boolean);
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

test("verified provenance: a qualified driver's items cite the verified document, verifier and timestamps", async () => {
  const r = await report("qualified");
  assert.equal(r.qualificationStatus, "QUALIFIED");
  assert.deepEqual(r.provenance.findings, []);
  const license = item(r, "DRIVER_LICENSE");
  assert.equal(license.evidenceState, "VERIFIED_CURRENT");
  assert.equal(license.provenanceState, "VERIFIED");
  const doc = await docOf(named.qualified, "DRIVER_LICENSE");
  assert.equal(license.sources[0].id, doc.id);
  assert.equal(license.sources[0].verification?.verifiedByUserId, complianceA);
  assert.equal(license.sources[0].timestamps.verifiedAt, doc.verifiedAt!.toISOString());
  assert.equal(license.origin, "BOF_MANDATORY_REGISTRY");
  for (const key of ["MEDICAL_CERTIFICATE", "PRE_EMPLOYMENT_DRUG_TEST", "EMPLOYMENT_APPLICATION", "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY", "ROAD_TEST_OR_EQUIVALENT"]) {
    assert.equal(item(r, key).provenanceState, "VERIFIED", key);
  }
  assert.equal(item(r, "EMPLOYMENT_HISTORY").provenanceState, "INCOMPLETE", "work-history rows carry no verification fields; that is stated, not assumed");
  assert.equal(r.provenance.items.length, CURRENTLY_MODELED_MANDATORY_ITEM_KEYS.length - 1, "disqualification has no positive evidence to cite");
});

test("missing verification detail is INCOMPLETE, not verified, and does not change the evaluator's QUALIFIED", async () => {
  const r = await report("incomplete");
  assert.equal(r.qualificationStatus, "QUALIFIED");
  assert.equal(item(r, "DRIVER_LICENSE").evidenceState, "VERIFIED_CURRENT");
  assert.equal(item(r, "DRIVER_LICENSE").provenanceState, "INCOMPLETE");
});

test("mandatory findings are attributed to authoritative requirements and the exact records", async () => {
  const expired = await report("expired");
  const e = finding(expired, "DRIVER_LICENSE_EXPIRED");
  assert.deepEqual([e.category, e.classificationReason, e.requirementId, e.attribution, e.sourceEvidence], ["MANDATORY", "REGISTRY_REQUIREMENT_MAPPING", "DRIVER_LICENSE", "AUTHORITATIVE_MAPPING", "RECORDED"]);
  assert.equal(e.sources[0].id, (await docOf(named.expired, "DRIVER_LICENSE")).id);
  assert.equal(e.sources[0].kind, "DRIVER_DOCUMENT");
  assert.equal(item(expired, "DRIVER_LICENSE").provenanceState, "NOT_VERIFIED");

  const pending = finding(await report("pending"), "MEDICAL_CERTIFICATE_UNVERIFIED");
  assert.equal(pending.evidenceState, "PENDING");
  assert.equal(pending.sources[0].id, (await docOf(named.pending, "MEDICAL")).id);

  const missing = await report("missing");
  const miss = finding(missing, "PRE_EMPLOYMENT_DRUG_TEST_MISSING");
  assert.deepEqual([miss.category, miss.sourceEvidence, miss.sources.length], ["MANDATORY", "NONE_RECORDED", 0]);
  assert.equal(item(missing, "PRE_EMPLOYMENT_DRUG_TEST").provenanceState, "MISSING");

  const unlinked = finding(await report("unlinked"), "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_RECORDED");
  assert.equal(unlinked.sources.length, 1, "the requirement row exists; no linked document is invented");
  assert.equal(unlinked.sources[0].kind, "DRIVER_INTAKE_REQUIREMENT");
});

test("verification sources are cited only when they exist", async () => {
  const r = await report("sourced");
  const sources = item(r, "DRIVER_LICENSE").sources[0].verification!.verificationSources;
  assert.equal(sources.length, 1);
  assert.equal(sources[0].providerName, "Synthetic Provider");
  assert.deepEqual((await report("qualified")).provenance.items[0].sources[0].verification!.verificationSources, []);
});

test("generic legacy findings with attributed records stay UNCLASSIFIED; attribution never becomes mandatory or administrative", async () => {
  const r = await report("legacy");
  const missingDoc = finding(r, "MISSING_REQUIRED_DOCUMENT");
  assert.deepEqual([missingDoc.category, missingDoc.classificationReason, missingDoc.attribution, missingDoc.evidenceState], ["UNCLASSIFIED", "NO_APPROVED_MAPPING_INTAKE_REQUIREMENT", "RULE_REPLAY", "UNKNOWN"]);
  assert.equal(missingDoc.requirementId, null);
  assert.deepEqual(missingDoc.origins, ["INTAKE_REQUIREMENT_ROW"]);
  const row = await m.prisma.driverIntakeRequirement.findFirstOrThrow({ where: { driverIntakeId: intakeOf.legacy, requirementType: "CARRIER_ORIENTATION" } });
  assert.deepEqual(missingDoc.sources.map((s) => s.id), [row.id], "only the requirement that produced the code");

  const pendingDoc = finding(r, "DOCUMENT_PENDING_VERIFICATION");
  assert.equal(pendingDoc.category, "UNCLASSIFIED");
  assert.ok(pendingDoc.sources.some((s) => s.kind === "DRIVER_INTAKE_REQUIREMENT"));
  const manual = finding(r, "MANUAL_REVIEW_REQUIRED");
  assert.equal(manual.category, "UNCLASSIFIED");
  assert.ok(manual.classificationReason.startsWith("NO_APPROVED_MAPPING_"));
  const identity = await docOf(named.legacy, "IDENTITY_SUPPORTING");
  const identityRequirement = await m.prisma.driverIntakeRequirement.findFirstOrThrow({ where: { driverIntakeId: intakeOf.legacy, requirementType: "IDENTITY_SUPPORTING" } });
  assert.deepEqual(manual.sources.map((s) => s.id).sort(), [identity.id, identityRequirement.id].sort(), "only the pending document and the requirement it satisfies, not the unrelated orientation requirement");
  for (const f of r.provenance.findings) assert.notEqual(f.category, "ADMINISTRATIVE");
});

test("structured-record findings carry a registry hint but are not mandatory; conflicting evidence is never verified", async () => {
  const r = await report("conflict");
  const medical = finding(r, "MEDICAL_EXPIRED");
  assert.deepEqual([medical.category, medical.classificationReason, medical.relatedRegistryRequirementHint], ["UNCLASSIFIED", "NO_APPROVED_MAPPING_STRUCTURED_RECORD", "MEDICAL_CERTIFICATE"]);
  assert.equal(medical.sources[0].kind, "MEDICAL_QUALIFICATION");
  assert.equal(item(r, "MEDICAL_CERTIFICATE").evidenceState, "CONFLICTING");
  assert.equal(item(r, "MEDICAL_CERTIFICATE").provenanceState, "CONFLICTING");
  assert.ok(r.provenance.conflicts.length >= 1);
});

test("a record belonging to another fleet makes the item CONFLICTING, never verified", async () => {
  const r = await report("cross-fleet");
  assert.equal(item(r, "MEDICAL_CERTIFICATE").provenanceState, "CONFLICTING");
  assert.equal(item(r, "MEDICAL_CERTIFICATE").sources[0].fleetMatchesDriver, false);
});

test("no intake: unknown provenance is reported as such", async () => {
  const r = await report("no-intake");
  const f = finding(r, "QUALIFICATION_RECORDS_MISSING");
  assert.deepEqual([f.category, f.classificationReason, f.attribution, f.sourceEvidence], ["UNCLASSIFIED", "EVALUATOR_CONTEXT_CODE", "UNATTRIBUTED", "UNKNOWN"]);
  assert.ok(r.provenance.items.every((i) => i.provenanceState === "MISSING"));
});

test("finding codes equal the evaluator's reason codes; status and codes are unchanged; no source id is invented", async () => {
  for (const label of Object.keys(named)) {
    const fleetId = label === "b-qualified" ? fleetB : fleetA;
    const direct = await m.prisma.$transaction((tx) => m.evaluator.getAuthoritativeDriverQualification(tx, named[label], fleetId));
    const r = await report(label, fleetId);
    assert.equal(r.qualificationStatus, direct.status, label);
    assert.deepEqual(r.provenance.findings.map((f) => f.code), [...direct.reasonCodes].sort(), label);
    for (const f of r.provenance.findings) assert.equal(f.category, classifyQualificationReasonCode(f.code).category === "MANDATORY" ? "MANDATORY" : "UNCLASSIFIED", `${label}/${f.code}`);

    const known = new Set<string>();
    for (const table of ["driverDocument", "driverIntakeRequirement", "driverLicense", "medicalQualification", "drugTestRecord", "workHistory", "accidentHistory", "violationHistory"] as const) {
      const rows = await (m.prisma[table] as unknown as { findMany: (a: object) => Promise<Array<{ id: string }>> }).findMany(
        table === "driverIntakeRequirement" ? { where: { driverIntake: { driverId: named[label] } } } : { where: { driverId: named[label] } },
      );
      rows.forEach((row) => known.add(row.id));
    }
    (await m.prisma.verificationSource.findMany({ where: { OR: [{ driverDocument: { driverId: named[label] } }] } })).forEach((row) => known.add(row.id));
    const cited = [...r.provenance.findings.flatMap((f) => f.sources), ...r.provenance.items.flatMap((i) => i.sources)];
    for (const source of cited) assert.ok(known.has(source.id), `${label}: cited ${source.kind} ${source.id} exists`);
  }
});

test("existing evaluator and movement decisions are unchanged by provenance", async () => {
  const evaluate = (id: string, fleetId: string) =>
    m.prisma.$transaction(async (tx) => {
      const result: Partial<Awaited<ReturnType<typeof m.evaluator.getAuthoritativeDriverQualification>>> = { ...(await m.evaluator.getAuthoritativeDriverQualification(tx, id, fleetId)) };
      delete result.evaluatedAt;
      return result;
    });
  const before = new Map<string, unknown>();
  for (const label of Object.keys(named)) before.set(label, await evaluate(named[label], label === "b-qualified" ? fleetB : fleetA));

  const mk = async (qualified: boolean) => {
    const d = await driver(`mv-${qualified}-${driverIds.length}`, fleetA, qualified);
    const load = await m.prisma.load.create({
      data: { fleetId: fleetA, customerName: "P2", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED", pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000) },
    });
    loadIds.push(load.id);
    const n = driverIds.length;
    const tractor = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `P2T-${stamp}-${n}`, vin: `1XPBDP9X0P2${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
    const trailer = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRAILER", unitNumber: `P2L-${stamp}-${n}`, status: "AVAILABLE" } });
    return { driverId: d.row.id, loadId: load.id, tractorId: tractor.id, trailerId: trailer.id };
  };
  const decide = (c: Awaited<ReturnType<typeof mk>>) =>
    m.prisma.$transaction(async (tx) => {
      const result = await m.movement.authorizeMovement(tx, "PLANNING_RESERVE", {
        sessionUser: dispatcherSession, loadId: c.loadId, proposedAssignment: { driverId: c.driverId, tractorId: c.tractorId, trailerId: c.trailerId },
      });
      return { allowed: result.allowed, disposition: result.disposition, reasonCodes: result.reasonCodes, status: result.driverQualificationStatus, mode: result.enforcement?.mode, overridden: result.enforcement?.overridden };
    });
  const good = await mk(true);
  const bad = await mk(false);
  const goodBefore = await decide(good);
  const badBefore = await decide(bad);
  assert.equal(goodBefore.allowed, true);
  assert.equal(badBefore.allowed, false);
  assert.equal(badBefore.overridden, false);

  for (const label of Object.keys(named)) if (!label.startsWith("mv-")) await report(label, label === "b-qualified" ? fleetB : fleetA);
  await m.prisma.$transaction((tx) => m.provenance.buildFleetProvenanceSummary(tx, fleetA));

  for (const [label, expected] of before) assert.deepEqual(await evaluate(named[label], label === "b-qualified" ? fleetB : fleetA), expected, label);
  assert.deepEqual(await decide(good), goodBefore);
  assert.deepEqual(await decide(bad), badBefore);
});

test("fleet isolation: a driver is never reported through another fleet, and summaries carry no foreign data", async () => {
  await assert.rejects(report("qualified", fleetB), /not found in this fleet/);
  await assert.rejects(report("b-qualified", fleetA), /not found in this fleet/);
  await assert.rejects(m.prisma.$transaction((tx) => m.provenance.loadDriverQualificationProvenance(tx, "", fleetA)), /required/);
  const a = await m.provenance.runFleetProvenanceSummary(m.prisma, fleetA);
  const b = await m.provenance.runFleetProvenanceSummary(m.prisma, fleetB);
  assert.equal(b.drivers, 1);
  assert.equal(a.drivers, await m.prisma.driver.count({ where: { fleetId: fleetA } }));
  const textA = JSON.stringify(a);
  const textB = JSON.stringify(b);
  assert.ok(!textA.includes(fleetB) && !textA.includes(named["b-qualified"]));
  assert.ok(!textB.includes(fleetA) && !textB.includes(named.qualified));
  assert.ok(!textA.includes("@dev.local") && !textA.includes(named.qualified), "aggregate only");
  assert.equal(a.administrativeClassificationActive, false);
  assert.equal(a.regulatoryCompleteness, "NOT_ESTABLISHED");
  assert.ok(Object.keys(a.findings).every((key) => !key.startsWith("ADMINISTRATIVE|")));
  for (const states of Object.values(a.itemProvenance)) {
    assert.deepEqual(Object.keys(states).sort(), ["CONFLICTING", "INCOMPLETE", "MISSING", "NOT_VERIFIED", "VERIFIED"]);
    assert.equal(Object.values(states).reduce((x, y) => x + y, 0), a.drivers);
  }
  await assert.rejects(m.provenance.runFleetProvenanceSummary(m.prisma, "no-such-fleet"), /Fleet not found/);
});

test("provenance is read-only: no database mutation, a write inside the read-only transaction fails, output is reproducible", async () => {
  const fingerprint = async () => {
    const q = async (sql: string) => JSON.stringify(await m.prisma.$queryRawUnsafe(sql));
    return [
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "Driver" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntake" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverDocument" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntakeRequirement"`),
      await q(`SELECT count(*)::int AS n FROM "VerificationSource"`),
      await q(`SELECT count(*)::int AS n FROM "DriverQualificationSnapshot" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "AuditEvent" WHERE "tenantId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DispatchAssignment" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "Stage0EnforcementSetting" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
    ].join("\n");
  };
  const before = await fingerprint();
  const one = await m.provenance.runFleetProvenanceSummary(m.prisma, fleetA);
  const two = await m.provenance.runFleetProvenanceSummary(m.prisma, fleetA);
  assert.deepEqual(one, two);
  for (const label of Object.keys(named)) await report(label, label === "b-qualified" ? fleetB : fleetA);
  assert.equal(await fingerprint(), before);
  await assert.rejects(
    m.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.driver.update({ where: { id: named.qualified }, data: { phone: "000" } });
    }),
    /read-only/i,
  );
});

test("production remains ENFORCE and the D-2 allowlist empty after provenance runs", async () => {
  await m.provenance.runFleetProvenanceSummary(m.prisma, fleetA);
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0);
  for (const env of [{}, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE", VERCEL_ENV: "production" }]) {
    const resolution = await m.prisma.$transaction((tx) => m.policy.resolveStage0EnforcementMode(tx, fleetA, env));
    assert.equal(resolution.mode, "ENFORCE");
    assert.equal(resolution.source, "PRODUCTION_LOCK");
  }
  assert.equal(await m.prisma.stage0EnforcementSetting.count({ where: { fleetId: { in: [fleetA, fleetB] } } }), 0);
});
