import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import { SOFT_OVERRIDE_POLICY, observeAvailability } from "@/lib/services/stage0EnforcementPolicy";
import { APPROVED_ADMINISTRATIVE_CLASSIFICATIONS } from "@/lib/services/qualificationEvidenceClassification";
import {
  COMPLIANCE_REVIEW_ROLE_CODES,
  complianceReviewToCsv,
  type ComplianceReview,
  type ComplianceReviewDriver,
} from "@/lib/services/stage0ComplianceReviewService";

/**
 * Stage 0 D-1 PR 3A: read-only compliance review and export, on the isolated bof_dev database with deterministic
 * synthetic fixtures. The review adds no qualification logic and changes no decision.
 */

const stamp = `p3${Date.now().toString(36)}`;
const load = async () => ({
  prisma: (await import("@/lib/prisma")).prisma,
  fixture: await import("@/lib/test/qualifiedDriverFixture"),
  review: await import("@/lib/services/stage0ComplianceReviewService"),
  evaluator: await import("@/lib/services/authoritativeDriverQualificationService"),
  movement: await import("@/lib/services/dispatchMovementAuthorizationService"),
  policy: await import("@/lib/services/stage0EnforcementPolicy"),
});
type Mods = Awaited<ReturnType<typeof load>>;
type Actor = { id: string; email: string };
let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
let fleetB = "";
const driverIds: string[] = [];
const loadIds: string[] = [];
const named: Record<string, string> = {};
const actors: Record<string, Actor> = {};
let dispatcherSession: { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };

async function member(label: string, fleetId: string | null, roleCode: string, opts: { membershipStatus?: "ACTIVE" | "INACTIVE" | "INVITED"; userStatus?: "ACTIVE" | "SUSPENDED" } = {}) {
  const user = await m.prisma.user.create({ data: { email: `p3-${label}-${stamp}@dev.local`, name: label, status: opts.userStatus ?? "ACTIVE" } });
  if (fleetId) {
    const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
    await m.prisma.fleetMembership.create({ data: { userId: user.id, fleetId, roleId: role.id, status: opts.membershipStatus ?? "ACTIVE" } });
  }
  actors[label] = { id: user.id, email: user.email };
  return user;
}
async function driver(label: string, fleetId: string, qualified: boolean) {
  const row = await m.prisma.driver.create({ data: { fleetId, firstName: "Pthree", lastName: label, email: `p3-${label}-${stamp}@dev.local`, phone: "555-0100", status: "ACTIVE" } });
  driverIds.push(row.id);
  named[label] = row.id;
  const evidence = qualified
    ? await m.fixture.createQualifiedDriverEvidence(m.prisma, { driverId: row.id, fleetId, complianceUserId: fleetId === fleetA ? actors.complianceA.id : actors.complianceB.id })
    : null;
  return { row, evidence };
}
const docOf = (driverId: string, type: string) => m.prisma.driverDocument.findFirstOrThrow({ where: { driverId, type: type as never } });
const review = (actor: string, fleetId = fleetA, options: { driverId?: string } = {}) => m.review.buildComplianceReview(actors[actor], fleetId, options);
const driverOf = (r: ComplianceReview, label: string): ComplianceReviewDriver => {
  const found = r.drivers.find((d) => d.driverId === named[label]);
  assert.ok(found, `${label} in review`);
  return found;
};
const requirement = (d: ComplianceReviewDriver, id: string) => d.requirements.find((r) => r.requirementId === id)!;
const statusOf = (error: unknown) => (error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0);

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `P3 ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `P3 ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `p3-a-${stamp}`, name: `P3 A ${stamp}`, carrierGroupId: groupId } })).id;
  fleetB = (await m.prisma.fleet.create({ data: { slug: `p3-b-${stamp}`, name: `P3 B ${stamp}`, carrierGroupId: groupId } })).id;
  await member("complianceA", fleetA, "BOF_COMPLIANCE_REVIEW");
  await member("complianceB", fleetB, "BOF_COMPLIANCE_REVIEW");
  await member("bofOpsA", fleetA, "BOF_OPERATIONS");
  await member("dispatcherA", fleetA, "DISPATCH");
  await member("fleetAdminA", fleetA, "FLEET_ADMIN");
  await member("fleetOpsA", fleetA, "FLEET_OPERATIONS");
  await member("driverUserA", fleetA, "DRIVER");
  await member("inactiveComplianceA", fleetA, "BOF_COMPLIANCE_REVIEW", { membershipStatus: "INACTIVE" });
  await member("suspendedComplianceA", fleetA, "BOF_COMPLIANCE_REVIEW", { userStatus: "SUSPENDED" });
  await member("stranger", null, "NONE");
  dispatcherSession = { id: actors.dispatcherA.id, email: actors.dispatcherA.email, memberships: [{ fleetId: fleetA, roleCode: "DISPATCH", status: "ACTIVE" }] };

  await driver("qualified", fleetA, true);
  const incomplete = await driver("incomplete", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(incomplete.row.id, "DRIVER_LICENSE")).id }, data: { verifiedAt: null } });
  const expired = await driver("expired", fleetA, true);
  await m.prisma.driverDocument.update({ where: { id: (await docOf(expired.row.id, "DRIVER_LICENSE")).id }, data: { verificationExpiresAt: new Date(Date.now() - 2 * 86_400_000) } });
  const missing = await driver("missing", fleetA, true);
  await m.prisma.driverDocument.delete({ where: { id: (await docOf(missing.row.id, "DRUG_TEST")).id } });
  const conflict = await driver("conflict", fleetA, true);
  await m.prisma.medicalQualification.create({
    data: { driverId: conflict.row.id, driverIntakeId: conflict.evidence!.intakeId, status: "EXPIRED", verificationStatus: "VERIFIED", expirationDate: new Date(Date.now() - 3 * 86_400_000) },
  });
  const legacy = await driver("legacy", fleetA, true);
  await m.prisma.driverIntakeRequirement.create({ data: { driverIntakeId: legacy.evidence!.intakeId, requirementType: "CARRIER_ORIENTATION", label: "Carrier orientation", isRequired: true, status: "PENDING" } });
  const contradicted = await driver("contradicted", fleetA, true);
  await m.prisma.driverIntake.update({ where: { id: contradicted.evidence!.intakeId }, data: { isComplianceCertified: true } });
  await m.prisma.driverDocument.update({ where: { id: (await docOf(contradicted.row.id, "MEDICAL")).id }, data: { status: "REJECTED" } });
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

test("authorization: only an ACTIVE BOF_COMPLIANCE_REVIEW member of the fleet may review; every refusal is audited", async () => {
  assert.deepEqual([...COMPLIANCE_REVIEW_ROLE_CODES], ["BOF_COMPLIANCE_REVIEW"]);
  assert.ok((await review("complianceA")).drivers.length > 0);
  const denied = ["bofOpsA", "dispatcherA", "fleetAdminA", "fleetOpsA", "driverUserA", "inactiveComplianceA", "suspendedComplianceA", "stranger", "complianceB"];
  const before = await m.prisma.auditEvent.count({ where: { tenantId: fleetA, action: "ACCESS_DENIED", entityType: "Stage0ComplianceReview" } });
  for (const actor of denied) await assert.rejects(review(actor), (e) => statusOf(e) === 403, actor);
  assert.equal(await m.prisma.auditEvent.count({ where: { tenantId: fleetA, action: "ACCESS_DENIED", entityType: "Stage0ComplianceReview" } }), before + denied.length);
  await assert.rejects(m.review.buildComplianceReview(null, fleetA), (e) => statusOf(e) === 401);
  await assert.rejects(m.review.buildComplianceReview({ id: "" }, fleetA), (e) => statusOf(e) === 401);
  await assert.rejects(review("complianceA", ""), (e) => statusOf(e) === 422);
  // A session-claimed role is irrelevant: only the database membership counts.
  await assert.rejects(m.review.buildComplianceReview({ ...actors.dispatcherA, memberships: [{ fleetId: fleetA, roleCode: "BOF_COMPLIANCE_REVIEW" }] } as never, fleetA), (e) => statusOf(e) === 403);
});

test("fleet isolation: no foreign drivers, ids or records; a reviewer of one fleet cannot read another", async () => {
  const a = await review("complianceA");
  const b = await review("complianceB", fleetB);
  assert.equal(b.drivers.length, 1);
  const textA = JSON.stringify(a);
  const textB = JSON.stringify(b);
  assert.ok(!textA.includes(fleetB) && !textA.includes(named["b-qualified"]), "fleet A review has no fleet B data");
  assert.ok(!textB.includes(fleetA) && !textB.includes(named.qualified), "fleet B review has no fleet A data");
  await assert.rejects(review("complianceA", fleetB), (e) => statusOf(e) === 403);
  await assert.rejects(review("complianceB", fleetA), (e) => statusOf(e) === 403);
  await assert.rejects(review("complianceA", fleetA, { driverId: named["b-qualified"] }), (e) => statusOf(e) === 404);
  const single = await review("complianceA", fleetA, { driverId: named.qualified });
  assert.deepEqual([single.scope, single.drivers.length], ["DRIVER", 1]);
  await assert.rejects(review("complianceA", "no-such-fleet"), (e) => statusOf(e) === 403, "unknown fleet is indistinguishable from no membership");
});

test("verified requirements are distinguished from missing, incomplete, expired and conflicting ones", async () => {
  const r = await review("complianceA");
  const q = driverOf(r, "qualified");
  assert.equal(q.authoritativeQualificationStatus, "QUALIFIED");
  for (const id of ["DRIVER_LICENSE", "MEDICAL_CERTIFICATE", "PRE_EMPLOYMENT_DRUG_TEST", "EMPLOYMENT_APPLICATION", "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY", "ROAD_TEST_OR_EQUIVALENT"]) {
    assert.equal(requirement(q, id).reviewStatus, "VERIFIED", id);
  }
  const license = await docOf(named.qualified, "DRIVER_LICENSE");
  assert.equal(requirement(q, "DRIVER_LICENSE").sources[0].id, license.id, "provenance cites the actual record");
  assert.deepEqual(requirement(q, "DRIVER_LICENSE").sources[0].evidenceReference, { kind: "DRIVER_DOCUMENT", id: license.id });

  assert.equal(requirement(driverOf(r, "missing"), "PRE_EMPLOYMENT_DRUG_TEST").reviewStatus, "MISSING_EVIDENCE");
  assert.deepEqual(requirement(driverOf(r, "missing"), "PRE_EMPLOYMENT_DRUG_TEST").sources, [], "missing evidence cites nothing");
  assert.equal(requirement(driverOf(r, "incomplete"), "DRIVER_LICENSE").reviewStatus, "INCOMPLETE_VERIFICATION_PROVENANCE");
  assert.equal(driverOf(r, "incomplete").authoritativeQualificationStatus, "QUALIFIED", "the evaluator's decision is unchanged by incomplete provenance");
  assert.equal(requirement(driverOf(r, "expired"), "DRIVER_LICENSE").reviewStatus, "EXPIRED_EVIDENCE");
  const conflict = driverOf(r, "conflict");
  assert.equal(requirement(conflict, "MEDICAL_CERTIFICATE").reviewStatus, "CONFLICTING_EVIDENCE");
  assert.ok(conflict.conflicts.length >= 1);
  assert.equal(requirement(driverOf(r, "contradicted"), "MEDICAL_CERTIFICATE").reviewStatus, "REJECTED_EVIDENCE");
  assert.equal(driverOf(r, "contradicted").priorCertificationContradicted, true);
  assert.equal(r.summary.driversWithPriorCertificationContradiction, 1);
  for (const id of Object.keys(r.summary.byRequirementReviewStatus)) {
    assert.equal(Object.values(r.summary.byRequirementReviewStatus[id]).reduce((x, y) => x + y, 0), r.drivers.length, id);
  }
});

test("unknown and unclassified findings stay unclassified; inference is labelled; the absence of intake is unknown", async () => {
  const r = await review("complianceA");
  const legacy = driverOf(r, "legacy");
  const finding = legacy.findings.find((f) => f.code === "MISSING_REQUIRED_DOCUMENT")!;
  assert.deepEqual([finding.category, finding.classificationEstablished, finding.evidenceBasis], ["UNCLASSIFIED", false, "REPLAY_ATTRIBUTED_INFERENCE"]);
  assert.ok(legacy.unclassifiedFindings.includes("MISSING_REQUIRED_DOCUMENT"));
  const none = driverOf(r, "no-intake");
  const context = none.findings.find((f) => f.code === "QUALIFICATION_RECORDS_MISSING")!;
  assert.deepEqual([context.category, context.evidenceBasis, context.sourceEvidence], ["UNCLASSIFIED", "UNATTRIBUTED", "UNKNOWN"]);
  assert.ok(none.requirements.every((req) => req.reviewStatus === "MISSING_EVIDENCE"));
  const mandatory = driverOf(r, "missing").findings.find((f) => f.code === "PRE_EMPLOYMENT_DRUG_TEST_MISSING")!;
  assert.deepEqual([mandatory.category, mandatory.evidenceBasis, mandatory.classificationEstablished], ["MANDATORY", "AUTHORITATIVE_RULE", true]);
  assert.ok(r.drivers.every((d) => d.findings.every((f) => f.category !== "ADMINISTRATIVE")));
  assert.equal(r.administrativeClassificationActive, false);
  assert.equal(APPROVED_ADMINISTRATIVE_CLASSIFICATIONS.size, 0);
});

test("the review never claims full compliance and keeps employment-history limits and coverage gaps visible", async () => {
  const r = await review("complianceA");
  assert.equal(r.regulatoryCompleteness, "NOT_ESTABLISHED");
  assert.equal(r.authorizesMovement, false);
  assert.equal(r.enablesSoftOverride, false);
  assert.ok(r.notModeledRequirements.some((g) => g.id === "ANNUAL_MVR_REVIEW" && g.status === "NOT_MODELED"));
  for (const d of r.drivers) {
    assert.equal(d.complianceStatement, "NOT_A_FULL_COMPLIANCE_DETERMINATION");
    assert.ok(d.employmentHistory.limitations.length >= 3, d.driverId);
    assert.notEqual(d.employmentHistory.provenanceState, "VERIFIED", "work-history rows have no verification fields");
  }
  assert.doesNotMatch(JSON.stringify(r), /fully compliant|"compliant":\s*true/i);
  assert.equal(driverOf(r, "qualified").employmentHistory.activeRecordCount, 1);
  assert.ok(Date.parse(r.evaluatedAt) > 0);
  assert.ok(r.drivers.every((d) => !d.evaluationInconsistent));
});

test("exports carry no unnecessary sensitive data: no names, emails, phones, file names, storage keys or credentials", async () => {
  const r = await review("complianceA");
  const json = JSON.stringify(r);
  const csv = complianceReviewToCsv(r);
  for (const text of [json, csv]) {
    for (const forbidden of ["@dev.local", "Pthree", "555-0100", "license.pdf", "medical.pdf", "test/qualified/", "storageKey", "originalFileName", "checksum", "postgres://", "licenseNumber", "ssnLast4", "http://", "https://"]) {
      assert.ok(!text.includes(forbidden), `export must not contain ${forbidden}`);
    }
  }
  assert.ok(csv.split("\r\n")[0].includes('"driverId"'));
  const requirementRows = csv.split("\r\n").filter((line) => line.includes('"REQUIREMENT"')).length;
  assert.equal(requirementRows, r.drivers.reduce((n, d) => n + d.requirements.length, 0));
  assert.equal(csv.split("\r\n").filter((line) => line.includes('"FINDING"')).length, r.drivers.reduce((n, d) => n + d.findings.length, 0));
  assert.equal(csv.split("\r\n").filter((line) => line.includes('"NOT_MODELED"')).length, r.notModeledRequirements.length);
});

test("CSV neutralizes spreadsheet formulas and quotes every cell", () => {
  const hostile = {
    fleetId: "=cmd|' /C calc'!A0", evaluatedAt: "2026-01-01T00:00:00.000Z", notModeledRequirements: [],
    drivers: [{ driverId: '+SUM(1,1)', authoritativeQualificationStatus: '@x', requirements: [{ requirementId: '-1+1', reviewStatus: 'V"Q', evidenceState: "VERIFIED_CURRENT", provenanceState: "VERIFIED", sources: [] }], findings: [] }],
  } as unknown as ComplianceReview;
  const csv = complianceReviewToCsv(hostile);
  assert.match(csv, /"'=cmd\|' \/C calc'!A0"/);
  assert.match(csv, /"'\+SUM\(1,1\)"/);
  assert.match(csv, /"'@x"/);
  assert.match(csv, /"'-1\+1"/);
  assert.match(csv, /"V""Q"/);
});

test("request handling: status codes, formats and no leakage in errors", async () => {
  const handle = (actor: Actor | null, fleetId: string, query: { driverId?: string | null; format?: string | null }) =>
    m.review.handleComplianceReviewRequest(actor, fleetId, query);
  assert.equal((await handle(null, fleetA, {})).status, 401);
  assert.equal((await handle(actors.dispatcherA, fleetA, {})).status, 403);
  assert.equal((await handle(actors.complianceA, fleetA, { format: "xml" })).status, 422);
  assert.equal((await handle(actors.complianceA, fleetA, { driverId: named["b-qualified"] })).status, 404);
  const json = await handle(actors.complianceA, fleetA, {});
  assert.equal(json.status, 200);
  assert.equal(JSON.parse(json.body).schemaVersion, "bof-stage0-d1-compliance-review-v1");
  const csv = await handle(actors.complianceA, fleetA, { format: "CSV" });
  assert.deepEqual([csv.status, csv.contentType], [200, "text/csv; charset=utf-8"]);
  const forbidden = await handle(actors.dispatcherA, fleetA, {});
  assert.deepEqual(JSON.parse(forbidden.body), { error: "Forbidden" });
});

test("no database writes during an authorized review or export; the transaction is read-only", async () => {
  const fingerprint = async () => {
    const q = async (sql: string) => JSON.stringify(await m.prisma.$queryRawUnsafe(sql));
    return [
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "Driver" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntake" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverDocument" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n, max("updatedAt") AS u FROM "DriverIntakeRequirement"`),
      await q(`SELECT count(*)::int AS n FROM "VerificationSource"`),
      await q(`SELECT count(*)::int AS n FROM "DriverQualificationSnapshot" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DriverReadinessScore" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "AuditEvent" WHERE "tenantId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DispatchAssignment" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "DispatchRelease" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
      await q(`SELECT count(*)::int AS n FROM "Stage0EnforcementSetting" WHERE "fleetId" IN ('${fleetA}','${fleetB}')`),
    ].join("\n");
  };
  const before = await fingerprint();
  const one = await review("complianceA");
  await m.review.handleComplianceReviewRequest(actors.complianceA, fleetA, { format: "csv" });
  await review("complianceB", fleetB);
  assert.equal(await fingerprint(), before, "an authorized review writes nothing, not even an audit row");
  const two = await review("complianceA");
  const strip = (r: ComplianceReview) => JSON.stringify({ ...r, evaluatedAt: "" });
  assert.equal(strip(one), strip(two), "reproducible");
  const source = readFileSync("lib/services/stage0ComplianceReviewService.ts", "utf8");
  assert.match(source, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(source, /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/);
  assert.doesNotMatch(source, /driverQualificationSnapshot|withDriverQualificationLock|pg_advisory/);
  assert.equal([...source.matchAll(/createAuditRecord\(/g)].length, 1, "the only write path is the refusal audit");
});

test("existing qualification and movement decisions are unchanged by reviews and exports", async () => {
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
      data: { fleetId: fleetA, customerName: "P3", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED", pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000) },
    });
    loadIds.push(load.id);
    const n = driverIds.length;
    const tractor = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `P3T-${stamp}-${n}`, vin: `1XPBDP9X0P3${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
    const trailer = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRAILER", unitNumber: `P3L-${stamp}-${n}`, status: "AVAILABLE" } });
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

  await review("complianceA");
  await m.review.handleComplianceReviewRequest(actors.complianceA, fleetA, { format: "csv" });

  for (const [label, expected] of before) assert.deepEqual(await evaluate(named[label], label === "b-qualified" ? fleetB : fleetA), expected, label);
  assert.deepEqual(await decide(good), goodBefore);
  assert.deepEqual(await decide(bad), badBefore);
  assert.equal(badBefore.overridden, false);
});

test("D-2 overrides stay disabled and production stays ENFORCE; no decision path imports the review", async () => {
  await review("complianceA");
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0);
  assert.equal(observeAvailability({}).allowed, false);
  assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: "STAGING", VERCEL_ENV: "production" }).allowed, false);
  for (const env of [{}, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE", VERCEL_ENV: "production" }]) {
    const resolution = await m.prisma.$transaction((tx) => m.policy.resolveStage0EnforcementMode(tx, fleetA, env));
    assert.deepEqual([resolution.mode, resolution.source], ["ENFORCE", "PRODUCTION_LOCK"]);
  }
  assert.equal(await m.prisma.stage0EnforcementSetting.count({ where: { fleetId: { in: [fleetA, fleetB] } } }), 0);
  for (const file of [
    "lib/services/authoritativeDriverQualificationService.ts", "lib/services/qualificationService.ts",
    "lib/services/dispatchMovementAuthorizationService.ts", "lib/services/stage0EnforcementPolicy.ts",
    "lib/services/stage0EnforcementConfigService.ts", "lib/services/driverMovementInvalidationService.ts",
    "lib/services/equipmentSafetyInvalidationService.ts", "lib/services/qualificationEvidenceClassification.ts",
    "lib/services/qualificationFindingProvenance.ts", "lib/services/driverQualificationProvenanceService.ts",
  ]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /stage0ComplianceReviewService/, file);
  }
  const route = readFileSync("app/api/stage0/compliance-review/[fleetId]/route.ts", "utf8");
  assert.match(route, /handleComplianceReviewRequest/);
  assert.doesNotMatch(route, /roleCode|memberships|prisma/, "the route trusts neither session roles nor the database directly");
});
