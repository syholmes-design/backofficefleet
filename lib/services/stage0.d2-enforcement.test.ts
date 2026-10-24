import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";
import {
  decideEffectiveAuthorization,
  observeAvailability,
  readPlatformMode,
  SOFT_OVERRIDE_POLICY,
  type EnforcementResolution,
  type SoftOverridePolicy,
} from "@/lib/services/stage0EnforcementPolicy";

/**
 * Stage 0 D-2: enforcement / observe-mode policy. Part 1 is pure. Part 2 runs on the real services against the
 * isolated bof_dev database, with BOF_STAGE0_ENVIRONMENT_CLASS=TEST declared per test.
 */

const resolution = (mode: "ENFORCE" | "OBSERVE"): EnforcementResolution => ({
  mode,
  source: mode === "OBSERVE" ? "FLEET_SETTING" : "FAIL_SAFE_DEFAULT",
  settingId: null,
  configuredByUserId: null,
  detail: "test",
});
const denied = (reasonCodes: string[], driverQualificationStatus: string | null = "PENDING_COMPLIANCE") => ({
  allowed: false,
  reasonCodes,
  driverQualificationStatus,
});
const injected: SoftOverridePolicy = {
  stages: new Set(["PLANNING_RESERVE", "RELEASE", "PICKUP_VERIFY"]),
  softReasonCodes: new Set(["SOFT_ADMIN_ITEM"]),
};

// ---------------------------------------------------------------- Part 1: pure policy

test("policy: no soft reason code is enumerated, and pickup release is never an overridable stage", () => {
  assert.equal(SOFT_OVERRIDE_POLICY.softReasonCodes.size, 0, "classification is missing: nothing may be soft");
  assert.equal(SOFT_OVERRIDE_POLICY.stages.has("PICKUP_VERIFY"), false);
  assert.equal(SOFT_OVERRIDE_POLICY.stages.has("PICKUP_ISSUE"), false);
});

test("policy: OBSERVE is available only in explicitly declared non-production environment classes", () => {
  assert.equal(observeAvailability({}).allowed, false, "undeclared → production-like");
  assert.equal(observeAvailability({ BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" }).allowed, false, "env var alone never enables it");
  for (const klass of ["PRODUCTION", "PREVIEW", "bogus", ""]) {
    assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: klass }).allowed, false, klass);
  }
  for (const klass of ["LOCAL", "TEST", "STAGING", "staging"]) {
    assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: klass }).allowed, true, klass);
  }
  assert.equal(observeAvailability({ BOF_STAGE0_ENVIRONMENT_CLASS: "STAGING", VERCEL_ENV: "production" }).allowed, false);
});

test("policy: platform mode parsing fails safe", () => {
  assert.deepEqual(readPlatformMode({ BOF_STAGE0_MOVEMENT_ENFORCEMENT: "observe" }), { mode: "OBSERVE", valid: true });
  assert.deepEqual(readPlatformMode({ BOF_STAGE0_MOVEMENT_ENFORCEMENT: "ENFORCE" }), { mode: "ENFORCE", valid: true });
  assert.deepEqual(readPlatformMode({}), { mode: "ENFORCE", valid: true });
  assert.deepEqual(readPlatformMode({ BOF_STAGE0_MOVEMENT_ENFORCEMENT: "off" }), { mode: "ENFORCE", valid: false });
});

test("policy: the shadow result is preserved; an allowed result passes through", () => {
  const decision = decideEffectiveAuthorization({
    stage: "RELEASE",
    shadow: { allowed: true, reasonCodes: [], driverQualificationStatus: "QUALIFIED" },
    resolution: resolution("OBSERVE"),
  });
  assert.deepEqual([decision.shadowAllowed, decision.effectiveAllowed, decision.overridden], [true, true, false]);
});

test("policy: with the shipped policy no denial is overridden in any mode or stage", () => {
  for (const mode of ["ENFORCE", "OBSERVE"] as const) {
    for (const stage of ["PLANNING_RESERVE", "RELEASE", "PICKUP_ISSUE", "PICKUP_VERIFY"] as const) {
      const decision = decideEffectiveAuthorization({ stage, shadow: denied(["DRIVER_LICENSE_UNVERIFIED"]), resolution: resolution(mode) });
      assert.equal(decision.shadowAllowed, false);
      assert.equal(decision.effectiveAllowed, false, `${mode}/${stage}`);
      assert.equal(decision.overridden, false);
    }
  }
});

test("policy: override rules (injected soft policy) — enumerated, single-class, soft-stage, OBSERVE-only", () => {
  const decide = (stage: "PLANNING_RESERVE" | "RELEASE" | "PICKUP_ISSUE" | "PICKUP_VERIFY", shadow: ReturnType<typeof denied>, mode: "ENFORCE" | "OBSERVE" = "OBSERVE") =>
    decideEffectiveAuthorization({ stage, shadow, resolution: resolution(mode), policy: injected });

  const soft = decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM"]));
  assert.deepEqual([soft.shadowAllowed, soft.effectiveAllowed, soft.overridden], [false, true, true]);
  assert.deepEqual(soft.overriddenReasonCodes, ["SOFT_ADMIN_ITEM"]);

  assert.equal(decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM"]), "ENFORCE").effectiveAllowed, false, "ENFORCE never overrides");
  assert.equal(decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM", "DRIVER_LICENSE_MISSING"])).effectiveAllowed, false, "mixed → hard");
  assert.equal(decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM", "SOMETHING_NEW"])).effectiveAllowed, false, "unknown → hard");
  assert.equal(decide("PLANNING_RESERVE", denied([])).effectiveAllowed, false, "no reason codes → hard");
  assert.equal(decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM"], "NOT_QUALIFIED")).effectiveAllowed, false, "NOT_QUALIFIED is never soft");
  assert.equal(decide("PLANNING_RESERVE", denied(["SOFT_ADMIN_ITEM"], null)).effectiveAllowed, false, "unevaluated driver → hard");
  assert.equal(decide("PLANNING_RESERVE", denied(["TRUCK_UNAVAILABLE"])).effectiveAllowed, false, "7.3: UNAVAILABLE stays hard");
  assert.equal(decide("PICKUP_ISSUE", denied(["SOFT_ADMIN_ITEM"])).effectiveAllowed, false, "stage not enumerated");
  assert.equal(decide("PICKUP_VERIFY", denied(["SOFT_ADMIN_ITEM"])).effectiveAllowed, false, "pickup release is never overridden");
});

// ---------------------------------------------------------------- Part 2: real database

assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `d2${Date.now().toString(36)}`;

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
}

const load = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    documents: await import("@/lib/services/documentService"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    movement: await import("@/lib/services/dispatchMovementAuthorizationService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    physical: await import("@/lib/services/pickupPhysicalReconciliationService"),
    equipment: await import("@/lib/services/equipmentService"),
    conditions: await import("@/lib/services/conditionService"),
    config: await import("@/lib/services/stage0EnforcementConfigService"),
    policy: await import("@/lib/services/stage0EnforcementPolicy"),
  };
};
type Mods = Awaited<ReturnType<typeof load>>;
type Session = { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };

let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
let fleetB = "";
const users: Record<string, Session> = {};
const ids = { drivers: [] as string[], loads: [] as string[] };

/** Runs fn with the given environment variables (undefined removes one), restoring them afterwards. */
async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
const TEST_ENV = { BOF_STAGE0_ENVIRONMENT_CLASS: "TEST", BOF_STAGE0_MOVEMENT_ENFORCEMENT: undefined, VERCEL_ENV: undefined };
const inTest = <T,>(fn: () => Promise<T>) => withEnv(TEST_ENV, fn);

async function member(label: string, fleetId: string, roleCode: string, opts: { membershipStatus?: "ACTIVE" | "INACTIVE" | "INVITED"; userStatus?: "ACTIVE" | "SUSPENDED" } = {}) {
  const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
  const user = await m.prisma.user.create({ data: { email: `d2-${label}-${stamp}@dev.local`, name: label, status: opts.userStatus ?? "ACTIVE" } });
  await m.prisma.fleetMembership.create({ data: { userId: user.id, fleetId, roleId: role.id, status: opts.membershipStatus ?? "ACTIVE" } });
  return { id: user.id, email: user.email, memberships: [{ fleetId, roleCode, status: "ACTIVE" }] } as Session;
}
const claim = (s: Session, fleetId: string, roleCode: string): Session => ({ ...s, memberships: [{ fleetId, roleCode, status: "ACTIVE" }] });

type Chain = {
  driver: { id: string };
  evidence: { licenseDocumentId: string } | null;
  load: { id: string };
  tractor: { id: string; unitNumber: string; vin: string | null };
  trailer: { id: string; unitNumber: string };
  assignment: { id: string } | null;
  pickup: { id: string; token: string } | null;
};

/** stage: NONE = driver/equipment/load only; ASSIGNED; RELEASED; PICKUP_ISSUED. `qualified: false` = no evidence. */
async function chain(fleetId: string, stage: "NONE" | "ASSIGNED" | "RELEASED" | "PICKUP_ISSUED", qualified = true): Promise<Chain> {
  const { prisma } = m;
  const dispatcher = fleetId === fleetA ? users.dispatcher : users.dispatcherB;
  const compliance = fleetId === fleetA ? users.complianceA : users.complianceB;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({ data: { fleetId, firstName: "D2", lastName: stamp, email: `d2-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" } });
  ids.drivers.push(driver.id);
  const evidence = qualified ? await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId, complianceUserId: compliance.id }) : null;
  const loadRow = await prisma.load.create({
    data: {
      fleetId, customerName: "D2", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(loadRow.id);
  const tractor = await prisma.equipment.create({ data: { fleetId, equipmentType: "TRACTOR", unitNumber: `D2T-${stamp}-${n}`, vin: `1XPBDP9X0D2${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
  const trailer = await prisma.equipment.create({ data: { fleetId, equipmentType: "TRAILER", unitNumber: `D2L-${stamp}-${n}`, status: "AVAILABLE" } });
  const result: Chain = { driver, evidence, load: loadRow, tractor, trailer, assignment: null, pickup: null };
  if (stage === "NONE") return result;
  result.assignment = await m.assignments.createAssignment(dispatcher, loadRow.id, driver.id, tractor.id, trailer.id);
  await prisma.preTripHeader.create({ data: { fleetId, assignmentId: result.assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: dispatcher.id } });
  await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId, status: "READY", policyVersion: "d2", summary: "d2", score: 90 } });
  if (stage === "ASSIGNED") return result;
  assert.equal((await m.releases.createDispatchReleaseWithMovementAuthorization(dispatcher, loadRow.id, "RELEASE")).movement.allowed, true);
  if (stage === "RELEASED") return result;
  const issued = await m.pickups.issuePickupAuthorization(dispatcher, loadRow.id);
  result.pickup = { id: issued.authorization.id, token: issued.credential.token };
  return result;
}

const authorize = (session: Session, stage: "PLANNING_RESERVE" | "RELEASE" | "PICKUP_ISSUE" | "PICKUP_VERIFY", c: Chain, proposed = false) =>
  m.prisma.$transaction((tx) =>
    m.movement.authorizeMovement(tx, stage, {
      sessionUser: session,
      loadId: c.load.id,
      ...(proposed ? { proposedAssignment: { driverId: c.driver.id, tractorId: c.tractor.id, trailerId: c.trailer.id } } : {}),
    }),
  );
const setMode = (session: Session, fleetId: string, mode: unknown, reason: unknown = "D-2 pilot rehearsal for fleet") => m.config.setFleetEnforcementMode(session, fleetId, mode, reason);
const reconcile = (c: Chain, dispatcher: Session) =>
  m.physical.reconcilePickupPhysicalArrival(dispatcher, c.pickup!.id, {
    token: c.pickup!.token,
    method: "SHIPPER_DOCK",
    arriving: {
      authorizationId: c.pickup!.id, loadId: c.load.id, driverId: c.driver.id, tractorId: c.tractor.id, trailerId: c.trailer.id,
      tractorUnitNumber: c.tractor.unitNumber, trailerUnitNumber: c.trailer.unitNumber, vin: c.tractor.vin, qr: c.tractor.unitNumber,
    },
    evidenceReference: `d2-dock-${c.pickup!.id}`,
    intendedDisposition: "RELEASE",
  });
const pickupEvidence = async (id: string) => {
  const row = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id }, include: { verificationAttempts: { orderBy: { createdAt: "asc" } }, physicalReconciliation: true } });
  return { status: row.status, attempts: row.verificationAttempts.map((a) => a.result), physical: row.physicalReconciliation?.disposition ?? null };
};
/** Puts fleet A in a known mode so tests do not depend on each other's leftovers. */
async function ensureFleetAMode(mode: "ENFORCE" | "OBSERVE") {
  await withEnv(TEST_ENV, async () => {
    const current = await m.prisma.stage0EnforcementSetting.findUnique({ where: { fleetId: fleetA } });
    if (current?.mode !== mode) await setMode(users.bofOps, fleetA, mode, "test fixture reset of the fleet mode");
  });
}
const settingCount = () => m.prisma.stage0EnforcementSetting.count({ where: { fleetId: { in: [fleetA, fleetB] } } });
const historyFor = (fleetId: string) => m.prisma.stage0EnforcementModeChange.findMany({ where: { fleetId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `D2 ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `D2 ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `d2-a-${stamp}`, name: `D2 A ${stamp}`, carrierGroupId: groupId } })).id;
  fleetB = (await m.prisma.fleet.create({ data: { slug: `d2-b-${stamp}`, name: `D2 B ${stamp}`, carrierGroupId: groupId } })).id;
  users.dispatcher = await member("dispatch", fleetA, "DISPATCH");
  users.complianceA = await member("compliance", fleetA, "BOF_COMPLIANCE_REVIEW");
  users.bofOps = await member("bof-ops", fleetA, "BOF_OPERATIONS");
  users.fleetAdmin = await member("fleet-admin", fleetA, "FLEET_ADMIN");
  users.fleetOps = await member("fleet-ops", fleetA, "FLEET_OPERATIONS");
  users.fleetManager = await member("fleet-manager", fleetA, "FLEET_MANAGER");
  users.driverUser = await member("driver", fleetA, "DRIVER");
  users.inactiveBofOps = await member("inactive-bof-ops", fleetA, "BOF_OPERATIONS", { membershipStatus: "INACTIVE" });
  users.suspendedBofOps = await member("suspended-bof-ops", fleetA, "BOF_OPERATIONS", { userStatus: "SUSPENDED" });
  users.dispatcherB = await member("dispatch-b", fleetB, "DISPATCH");
  users.complianceB = await member("compliance-b", fleetB, "BOF_COMPLIANCE_REVIEW");
  users.bofOpsB = await member("bof-ops-b", fleetB, "BOF_OPERATIONS");
  users.adminB = await member("admin-b", fleetB, "FLEET_ADMIN");
  const stranger = await m.prisma.user.create({ data: { email: `d2-stranger-${stamp}@dev.local`, name: "stranger" } });
  users.stranger = { id: stranger.id, email: stranger.email, memberships: [] };
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS d2_audit_failure ON "AuditEvent"`);
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS d2_audit_failure()`);
  const fleets = [fleetA, fleetB].filter(Boolean);
  await prisma.operationalChatNotification.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operationalChatThread.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operatingCorrectiveAction.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingException.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.stage0EnforcementModeChange.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.stage0EnforcementSetting.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupPhysicalReconciliation.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupAuthorization.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchRelease.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.conditionEvent.deleteMany({ where: { conditionThread: { fleetId: { in: fleets } } } });
  await prisma.conditionThread.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.preTripHeader.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: ids.drivers } } } });
  await m.fixture.cleanupQualifiedDriverEvidence(prisma, ids.drivers);
  await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
  await prisma.equipment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
  await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
  await prisma.carrierGroup.deleteMany({ where: { id: groupId } });
  await prisma.aggregator.deleteMany({ where: { id: aggregatorId } });
});

test("default: ENFORCE with no configuration; decisions are recorded and equal the authoritative result", async () => {
  await withEnv({ BOF_STAGE0_ENVIRONMENT_CLASS: undefined, BOF_STAGE0_MOVEMENT_ENFORCEMENT: undefined, VERCEL_ENV: undefined }, async () => {
    const c = await chain(fleetA, "PICKUP_ISSUED");
    for (const stage of ["RELEASE", "PICKUP_ISSUE", "PICKUP_VERIFY"] as const) {
      const result = await authorize(users.dispatcher, stage, c);
      assert.equal(result.enforcement?.mode, "ENFORCE", stage);
      assert.equal(result.enforcement?.modeSource, "PRODUCTION_LOCK", stage);
      assert.equal(result.enforcement?.shadowAllowed, result.allowed);
      assert.equal(result.enforcement?.effectiveAllowed, result.allowed);
      assert.equal(result.enforcement?.overridden, false);
    }
    const planning = await authorize(users.dispatcher, "PLANNING_RESERVE", await chain(fleetA, "NONE"), true);
    assert.equal(planning.enforcement?.mode, "ENFORCE");

    const assignment = await m.prisma.dispatchAssignment.findUniqueOrThrow({ where: { id: c.assignment!.id } });
    assert.deepEqual(
      [assignment.enforcementMode, assignment.shadowAllowed, assignment.effectiveAllowed, assignment.enforcementOverridden, assignment.enforcementPolicyVersion],
      ["ENFORCE", true, true, false, "bof-stage0-enforcement-v1"],
    );
    const releases = await m.prisma.dispatchRelease.findMany({ where: { assignmentId: c.assignment!.id }, orderBy: { createdAt: "asc" } });
    assert.equal(releases.length, 2);
    for (const release of releases) {
      assert.deepEqual([release.enforcementMode, release.shadowAllowed, release.effectiveAllowed, release.enforcementOverridden], ["ENFORCE", true, true, false]);
      assert.equal((release.enforcementMetadata as { modeSource?: string }).modeSource, "PRODUCTION_LOCK");
    }
    const created = await m.prisma.auditEvent.findFirstOrThrow({ where: { entityType: "DispatchAssignment", entityId: c.assignment!.id, action: "CREATED" } });
    assert.equal((created.details as { enforcement?: { mode?: string } }).enforcement?.mode, "ENFORCE");
  });
});

test("mode resolution: production lock, fail-safe defaults, precedence and fleet isolation", async () => {
  await inTest(async () => {
    await setMode(users.bofOps, fleetA, "OBSERVE");
    const resolveFor = (fleetId: string, env: Record<string, string | undefined>) =>
      withEnv(env, () => m.prisma.$transaction((tx) => m.policy.resolveStage0EnforcementMode(tx, fleetId)));

    // A fleet OBSERVE setting is honored only in a declared non-production class.
    assert.deepEqual((await resolveFor(fleetA, {})).mode, "OBSERVE");
    assert.equal((await resolveFor(fleetA, {})).source, "FLEET_SETTING");
    for (const env of [
      { BOF_STAGE0_ENVIRONMENT_CLASS: undefined },
      { BOF_STAGE0_ENVIRONMENT_CLASS: "PRODUCTION" },
      { BOF_STAGE0_ENVIRONMENT_CLASS: "PREVIEW" },
      { BOF_STAGE0_ENVIRONMENT_CLASS: "STAGING", VERCEL_ENV: "production" },
    ]) {
      const locked = await resolveFor(fleetA, env);
      assert.deepEqual([locked.mode, locked.source], ["ENFORCE", "PRODUCTION_LOCK"], JSON.stringify(env));
    }
    // The environment variable alone never enables OBSERVE in production.
    const productionEnv = await resolveFor(fleetB, { BOF_STAGE0_ENVIRONMENT_CLASS: undefined, BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" });
    assert.deepEqual([productionEnv.mode, productionEnv.source], ["ENFORCE", "PRODUCTION_LOCK"]);

    // Fleet isolation: fleet B has no setting.
    assert.deepEqual([(await resolveFor(fleetB, {})).mode, (await resolveFor(fleetB, {})).source], ["ENFORCE", "FAIL_SAFE_DEFAULT"]);
    // Platform default in a non-production environment; invalid values fail safe; fleet setting wins.
    assert.deepEqual([(await resolveFor(fleetB, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" })).mode, (await resolveFor(fleetB, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" })).source], ["OBSERVE", "PLATFORM_ENV"]);
    assert.deepEqual([(await resolveFor(fleetB, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "bogus" })).mode, (await resolveFor(fleetB, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "bogus" })).source], ["ENFORCE", "FAIL_SAFE_DEFAULT"]);
    await setMode(users.bofOps, fleetA, "ENFORCE", "return fleet to enforcement");
    assert.deepEqual([(await resolveFor(fleetA, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" })).mode, (await resolveFor(fleetA, { BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE" })).source], ["ENFORCE", "FLEET_SETTING"]);
  });
});

test("fail-safe: an unavailable configuration store resolves ENFORCE and does not abort the movement transaction", async () => {
  await inTest(async () => {
    const c = await chain(fleetA, "ASSIGNED");
    await m.prisma.$executeRawUnsafe(`ALTER TABLE "Stage0EnforcementSetting" RENAME TO "Stage0EnforcementSetting_unavailable"`);
    try {
      const outcome = await m.prisma.$transaction(async (tx) => {
        const result = await m.movement.authorizeMovement(tx, "RELEASE", { sessionUser: users.dispatcher, loadId: c.load.id });
        const stillUsable = await tx.load.count({ where: { id: c.load.id } });
        return { result, stillUsable };
      });
      assert.equal(outcome.stillUsable, 1, "the transaction survived the failed configuration read");
      assert.deepEqual([outcome.result.enforcement?.mode, outcome.result.enforcement?.modeSource], ["ENFORCE", "FAIL_SAFE_DEFAULT"]);
      assert.equal(outcome.result.allowed, true);
    } finally {
      await m.prisma.$executeRawUnsafe(`ALTER TABLE "Stage0EnforcementSetting_unavailable" RENAME TO "Stage0EnforcementSetting"`);
    }
  });
});

test("OBSERVE changes no outcome: soft-class classification is missing, so PENDING_COMPLIANCE and every hard denial stay denied", async () => {
  await inTest(async () => {
    await setMode(users.bofOps, fleetA, "OBSERVE");

    // PENDING_COMPLIANCE (no evidence): denied at planning, nothing written, shadow and effective both false.
    const pending = await chain(fleetA, "NONE", false);
    const planning = await authorize(users.dispatcher, "PLANNING_RESERVE", pending, true);
    assert.equal(planning.driverQualificationStatus, "PENDING_COMPLIANCE");
    assert.deepEqual([planning.enforcement?.mode, planning.enforcement?.shadowAllowed, planning.enforcement?.effectiveAllowed, planning.enforcement?.overridden], ["OBSERVE", false, false, false]);
    assert.match(planning.enforcement?.overrideRefusal ?? "", /hard or unclassified/);
    await assert.rejects(() => m.assignments.createAssignment(users.dispatcher, pending.load.id, pending.driver.id, pending.tractor.id, pending.trailer.id), (e: unknown) => statusOf(e) === 409);
    assert.equal(await m.prisma.dispatchAssignment.count({ where: { loadId: pending.load.id } }), 0);
    const refusal = await m.prisma.auditEvent.findFirst({ where: { tenantId: fleetA, action: "ACCESS_DENIED", entityType: "DispatchAssignment", details: { path: ["driverId"], equals: pending.driver.id } }, orderBy: { createdAt: "desc" } });
    const evidence = (refusal?.details as { enforcement?: { mode?: string; shadowAllowed?: boolean; effectiveAllowed?: boolean } }).enforcement;
    assert.deepEqual([evidence?.mode, evidence?.shadowAllowed, evidence?.effectiveAllowed], ["OBSERVE", false, false]);

    // Hard denials: expired credential, UNAVAILABLE equipment (7.3), open critical condition.
    const expired = await chain(fleetA, "ASSIGNED");
    await m.prisma.driverDocument.update({ where: { id: expired.evidence!.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() - 86_400_000) } });
    const expiredRelease = await m.releases.createDispatchReleaseWithMovementAuthorization(users.dispatcher, expired.load.id, "RELEASE");
    assert.equal(expiredRelease.movement.allowed, false);
    assert.equal(expiredRelease.movement.enforcement?.effectiveAllowed, false);
    const releaseRow = await m.prisma.dispatchRelease.findUniqueOrThrow({ where: { id: expiredRelease.release.id } });
    assert.notEqual(releaseRow.disposition, "RELEASED", "the persisted disposition is the authoritative shadow result");
    assert.deepEqual([releaseRow.enforcementMode, releaseRow.shadowAllowed, releaseRow.effectiveAllowed, releaseRow.enforcementOverridden], ["OBSERVE", false, false, false]);

    const unavailable = await chain(fleetA, "ASSIGNED");
    await m.prisma.equipment.update({ where: { id: unavailable.tractor.id }, data: { status: "UNAVAILABLE" } });
    const unavailableRelease = await m.releases.createDispatchReleaseWithMovementAuthorization(users.dispatcher, unavailable.load.id, "RELEASE");
    assert.equal(unavailableRelease.movement.allowed, false);
    assert.ok(unavailableRelease.movement.reasonCodes.includes("TRUCK_UNAVAILABLE"));
    assert.equal(unavailableRelease.movement.enforcement?.effectiveAllowed, false);

    // Another fleet is unaffected by this fleet's setting.
    const fleetBChain = await chain(fleetB, "ASSIGNED");
    assert.equal((await authorize(users.dispatcherB, "RELEASE", fleetBChain)).enforcement?.mode, "ENFORCE");
  });
});

test("OBSERVE cannot bypass physical pickup STOP, identity, equipment restoration or invalidation controls", async () => {
  await inTest(async () => {
    await setMode(users.bofOps, fleetA, "OBSERVE");

    // Expired credential: reconciliation STOPs durably, verify refuses, nothing is released.
    const expired = await chain(fleetA, "PICKUP_ISSUED");
    await m.prisma.driverDocument.update({ where: { id: expired.evidence!.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() - 86_400_000) } });
    await assert.rejects(() => reconcile(expired, users.dispatcher), (e: unknown) => statusOf(e) === 409);
    assert.deepEqual(await pickupEvidence(expired.pickup!.id), { status: "STOPPED", attempts: ["STOPPED"], physical: "STOP" });
    await assert.rejects(() => m.pickups.verifyPickupAuthorization(users.dispatcher, expired.pickup!.id, { token: expired.pickup!.token, presented: { authorizationId: expired.pickup!.id, loadId: expired.load.id, driverId: expired.driver.id, tractorEquipmentId: expired.tractor.id, trailerEquipmentId: expired.trailer.id } }), (e: unknown) => statusOf(e) === 409);

    // Open critical condition: verify refuses (PICKUP_VERIFY is never overridden).
    const unsafe = await chain(fleetA, "PICKUP_ISSUED");
    await m.prisma.conditionThread.create({ data: { fleetId: fleetA, equipmentId: unsafe.tractor.id, title: "Cracked frame", category: "SAFETY", severity: "CRITICAL", observationSource: "DRIVER", lifecycleState: "IDENTIFIED", createdByUserId: users.dispatcher.id } });
    await assert.rejects(() => reconcile(unsafe, users.dispatcher), (e: unknown) => statusOf(e) === 409);
    assert.notEqual((await pickupEvidence(unsafe.pickup!.id)).status, "RELEASED");

    // Identity mismatch: dock STOP regardless of mode.
    const mismatch = await chain(fleetA, "PICKUP_ISSUED");
    await assert.rejects(
      () => m.physical.reconcilePickupPhysicalArrival(users.dispatcher, mismatch.pickup!.id, { token: mismatch.pickup!.token, method: "SHIPPER_DOCK", arriving: { authorizationId: mismatch.pickup!.id, loadId: mismatch.load.id, driverId: "someone-else", tractorId: mismatch.tractor.id, trailerId: mismatch.trailer.id }, intendedDisposition: "RELEASE" }),
      (e: unknown) => statusOf(e) === 409,
    );
    assert.notEqual((await pickupEvidence(mismatch.pickup!.id)).status, "RELEASED");

    // Equipment restoration restrictions are unchanged.
    const oos = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `D2OOS-${stamp}`, status: "OUT_OF_SERVICE" } });
    await assert.rejects(() => m.equipment.setEquipmentStatus(users.dispatcher, oos.id, "AVAILABLE"), (e: unknown) => statusOf(e) === 403);
    await assert.rejects(() => m.equipment.setEquipmentStatus(claim(users.driverUser, fleetA, "FLEET_ADMIN"), oos.id, "AVAILABLE"), (e: unknown) => statusOf(e) === 403);
    assert.equal((await m.prisma.equipment.findUniqueOrThrow({ where: { id: oos.id } })).status, "OUT_OF_SERVICE");

    // I-7 / I-8 invalidation still runs: equipment downgrade cancels the live pickup; driver rejection escalates.
    const live = await chain(fleetA, "PICKUP_ISSUED");
    await m.equipment.setEquipmentStatus(users.dispatcher, live.trailer.id, "OUT_OF_SERVICE");
    assert.equal((await pickupEvidence(live.pickup!.id)).status, "CANCELLED");
    const rejected = await chain(fleetA, "PICKUP_ISSUED");
    await m.documents.updateDriverDocumentRecord({ sessionUser: users.complianceA, documentId: rejected.evidence!.licenseDocumentId, payload: { status: "REJECTED", rejectionReason: "suspended" } });
    assert.equal((await pickupEvidence(rejected.pickup!.id)).status, "CANCELLED");
    const appended = await m.prisma.dispatchRelease.findMany({ where: { assignmentId: rejected.assignment!.id }, orderBy: [{ evaluatedAt: "asc" }, { createdAt: "asc" }] });
    assert.deepEqual([appended.at(-1)!.enforcementMode, appended.at(-1)!.effectiveAllowed], [null, null], "invalidation releases are always enforced and carry no enforcement decision");
  });
});

test("authority: only database-verified BOF_OPERATIONS / BOF_COMPLIANCE_REVIEW members of the fleet can change the mode", async () => {
  await ensureFleetAMode("ENFORCE");
  await inTest(async () => {
    const before = await settingCount();
    const attempts: Array<[string, Session]> = [
      ["dispatcher", users.dispatcher],
      ["carrier fleet admin", users.fleetAdmin],
      ["fleet operations", users.fleetOps],
      ["fleet manager", users.fleetManager],
      ["driver", users.driverUser],
      ["driver claiming BOF_OPERATIONS", claim(users.driverUser, fleetA, "BOF_OPERATIONS")],
      ["dispatcher claiming BOF_OPERATIONS", claim(users.dispatcher, fleetA, "BOF_OPERATIONS")],
      ["BOF operations of another fleet", users.bofOpsB],
      ["BOF operations of another fleet claiming fleet A", claim(users.bofOpsB, fleetA, "BOF_OPERATIONS")],
      ["inactive BOF membership", claim(users.inactiveBofOps, fleetA, "BOF_OPERATIONS")],
      ["suspended BOF user", claim(users.suspendedBofOps, fleetA, "BOF_OPERATIONS")],
      ["no membership", claim(users.stranger, fleetA, "BOF_OPERATIONS")],
    ];
    for (const [label, session] of attempts) {
      await assert.rejects(() => setMode(session, fleetA, "OBSERVE"), (e: unknown) => statusOf(e) === 403, label);
    }
    assert.equal(await settingCount(), before, "no refused attempt changed anything");
    assert.ok((await m.prisma.auditEvent.count({ where: { tenantId: fleetA, action: "ACCESS_DENIED", entityType: "Stage0EnforcementSetting" } })) >= 8, "refusals are audited");
    await assert.rejects(() => setMode(undefined as unknown as Session, fleetA, "OBSERVE"), (e: unknown) => statusOf(e) === 401);
    await assert.rejects(() => setMode(users.bofOps, "no-such-fleet", "OBSERVE"), (e: unknown) => statusOf(e) === 404);

    // Both authorized roles succeed.
    assert.equal((await setMode(users.bofOps, fleetA, "OBSERVE")).changed, true);
    assert.equal((await setMode(users.complianceA, fleetA, "ENFORCE", "compliance returns the fleet to enforce")).changed, true);

    // Validation.
    await assert.rejects(() => setMode(users.bofOps, fleetA, "off"), (e: unknown) => statusOf(e) === 422);
    await assert.rejects(() => setMode(users.bofOps, fleetA, "OBSERVE", "short"), (e: unknown) => statusOf(e) === 422);
    await assert.rejects(() => m.config.setFleetEnforcementMode(users.bofOps, fleetA, "OBSERVE", undefined), (e: unknown) => statusOf(e) === 422);
  });
});

test("visibility: members see the effective mode and banner; only BOF roles and the fleet admin see configuration", async () => {
  await ensureFleetAMode("ENFORCE");
  await inTest(async () => {
    await setMode(users.bofOps, fleetA, "OBSERVE");
    const dispatcherView = await m.config.getFleetEnforcementStatus(users.dispatcher, fleetA);
    assert.equal(dispatcherView.effectiveMode, "OBSERVE");
    assert.equal(dispatcherView.observeBanner, true);
    assert.match(dispatcherView.bannerText ?? "", /NOT waived/);
    assert.equal(dispatcherView.canConfigure, false);
    assert.equal(dispatcherView.configuration, undefined);

    const adminView = await m.config.getFleetEnforcementStatus(users.fleetAdmin, fleetA);
    assert.equal(adminView.canConfigure, false, "carrier administrators are read-only");
    assert.equal(adminView.configuration?.setting?.mode, "OBSERVE");
    assert.ok((adminView.configuration?.history.length ?? 0) >= 1);
    const opsView = await m.config.getFleetEnforcementStatus(users.bofOps, fleetA);
    assert.equal(opsView.canConfigure, true);

    await assert.rejects(() => m.config.getFleetEnforcementStatus(users.adminB, fleetA), (e: unknown) => statusOf(e) === 403);
    await assert.rejects(() => m.config.getFleetEnforcementStatus(claim(users.stranger, fleetA, "FLEET_ADMIN"), fleetA), (e: unknown) => statusOf(e) === 403);

    await setMode(users.bofOps, fleetA, "ENFORCE", "end of visibility test");
    const enforceView = await m.config.getFleetEnforcementStatus(users.dispatcher, fleetA);
    assert.deepEqual([enforceView.observeBanner, enforceView.bannerText], [false, null]);
  });
});

test("history, audit and notification: every change is recorded in order, atomically, and no-ops are not", async () => {
  await inTest(async () => {
    const fleet = (await m.prisma.fleet.create({ data: { slug: `d2-h-${stamp}`, name: `D2 H ${stamp}`, carrierGroupId: groupId } })).id;
    const ops = await member("history-ops", fleet, "BOF_OPERATIONS");
    const compliance = await member("history-compliance", fleet, "BOF_COMPLIANCE_REVIEW");
    const admin = await member("history-admin", fleet, "FLEET_ADMIN");
    try {
      assert.equal((await setMode(ops, fleet, "OBSERVE", "begin D-1 backfill pilot")).changed, true);
      assert.equal((await setMode(ops, fleet, "OBSERVE", "begin D-1 backfill pilot")).changed, false, "same mode is a no-op");
      assert.equal((await setMode(compliance, fleet, "ENFORCE", "pilot paused by compliance")).changed, true);
      assert.equal((await setMode(ops, fleet, "OBSERVE", "resume the pilot after review")).changed, true);

      const history = await historyFor(fleet);
      assert.deepEqual(history.map((h) => `${h.previousMode}->${h.newMode}`), ["ENFORCE->OBSERVE", "OBSERVE->ENFORCE", "ENFORCE->OBSERVE"]);
      assert.deepEqual(history.map((h) => h.actorRoleCode), ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "BOF_OPERATIONS"]);
      assert.deepEqual(history.map((h) => h.actorUserId), [ops.id, compliance.id, ops.id]);
      assert.ok(history.every((h) => h.policyVersion === "bof-stage0-enforcement-v1" && h.reason.length >= 10));
      const audits = await m.prisma.auditEvent.findMany({ where: { tenantId: fleet, entityType: "Stage0EnforcementSetting", action: "UPDATED" }, orderBy: { createdAt: "asc" } });
      assert.equal(audits.length, 3);
      assert.ok(audits.every((a) => (a.details as { event?: string }).event === "stage0.enforcement_mode_changed"));
      const notifications = await m.prisma.operationalChatNotification.findMany({ where: { tenantId: fleet, kind: "STAGE0_ENFORCEMENT_MODE_CHANGED" } });
      assert.ok(notifications.some((n) => n.userId === admin.id), "the carrier fleet admin is told");
      assert.ok(notifications.some((n) => n.userId === compliance.id));

      // Atomic: a failing audit insert rolls the mode change back (no setting, history or notification change).
      await m.prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION d2_audit_failure() RETURNS trigger AS $$
        BEGIN
          IF NEW."tenantId" = '${fleet}' AND NEW."details"->>'event' = 'stage0.enforcement_mode_changed' THEN
            RAISE EXCEPTION 'd2 injected audit failure';
          END IF;
          RETURN NEW;
        END $$ LANGUAGE plpgsql`);
      await m.prisma.$executeRawUnsafe(`CREATE TRIGGER d2_audit_failure BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION d2_audit_failure()`);
      try {
        await assert.rejects(() => setMode(ops, fleet, "ENFORCE", "this change must roll back"), /d2 injected audit failure/);
      } finally {
        await m.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS d2_audit_failure ON "AuditEvent"`);
        await m.prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS d2_audit_failure()`);
      }
      assert.equal((await m.prisma.stage0EnforcementSetting.findUniqueOrThrow({ where: { fleetId: fleet } })).mode, "OBSERVE");
      assert.equal((await historyFor(fleet)).length, 3);
    } finally {
      await m.prisma.operationalChatNotification.deleteMany({ where: { tenantId: fleet } });
      await m.prisma.operationalChatThread.deleteMany({ where: { tenantId: fleet } });
      await m.prisma.auditEvent.deleteMany({ where: { tenantId: fleet } });
      await m.prisma.stage0EnforcementModeChange.deleteMany({ where: { fleetId: fleet } });
      await m.prisma.stage0EnforcementSetting.deleteMany({ where: { fleetId: fleet } });
      await m.prisma.fleetMembership.deleteMany({ where: { fleetId: fleet } });
      await m.prisma.fleet.delete({ where: { id: fleet } });
    }
  });
});

test("OBSERVE cannot be configured where it is unavailable, and ENFORCE always can", async () => {
  await withEnv({ BOF_STAGE0_ENVIRONMENT_CLASS: undefined, BOF_STAGE0_MOVEMENT_ENFORCEMENT: "OBSERVE", VERCEL_ENV: undefined }, async () => {
    const before = await settingCount();
    const error = await setMode(users.bofOps, fleetA, "OBSERVE").then(() => null, (e: unknown) => e as { statusCode?: number; code?: string });
    assert.equal(error?.statusCode, 409);
    assert.equal(error?.code, "STAGE0_OBSERVE_NOT_AVAILABLE");
    assert.equal(await settingCount(), before);
    const view = await m.config.getFleetEnforcementStatus(users.bofOps, fleetA);
    assert.equal(view.configuration?.observeAvailable, false);
    assert.equal(view.effectiveMode, "ENFORCE");
  });
  await inTest(async () => {
    await setMode(users.bofOps, fleetA, "OBSERVE", "temporarily observe for this test");
    await withEnv({ BOF_STAGE0_ENVIRONMENT_CLASS: undefined }, async () => {
      assert.equal((await setMode(users.bofOps, fleetA, "ENFORCE", "production-like returns to enforce")).changed, true);
    });
  });
});
