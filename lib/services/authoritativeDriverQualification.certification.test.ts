import assert from "node:assert/strict";
import test from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

const DAY = 86_400_000;

test("authoritative driver qualification fails closed without a usable transaction", async () => {
  const { getAuthoritativeDriverQualification, AuthoritativeQualificationError } = await import(
    "@/lib/services/authoritativeDriverQualificationService"
  );
  const failingTx = new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () => async () => {
              throw new Error("connection lost");
            },
          },
        ),
    },
  ) as never;

  await assert.rejects(() => getAuthoritativeDriverQualification(failingTx, "driver-1", "fleet-1"), AuthoritativeQualificationError);

  const missingContext = await getAuthoritativeDriverQualification(failingTx, "", "fleet-1");
  assert.equal(missingContext.status, "NOT_QUALIFIED");
  assert.equal(missingContext.conditionalMovementPermitted, false);
  assert.deepEqual(missingContext.reasonCodes, ["DRIVER_CONTEXT_REQUIRED"]);
});

test("shared qualification rules: default behavior unchanged; registry options skip owned types", async () => {
  const { evaluateQualification } = await import("@/lib/services/qualificationService");
  const { REGISTRY_OWNED_REQUIREMENT_TYPES } = await import("@/lib/services/authoritativeDriverQualificationService");
  const intake = { id: "i1", fleetId: "f1", driverId: "d1" };
  const base = {
    driver: { id: "d1", fleetId: "f1" },
    intake,
    documents: [],
    requirements: [],
    licenses: [],
    endorsements: [],
    medicalQualifications: [],
    drugTests: [],
    workHistory: [{ id: "w1", status: "REJECTED" }],
    accidentHistory: [],
    violationHistory: [],
    verificationSources: [],
  };
  // The defects I-1 replaces for movement: no evidence plus any employment row (even REJECTED) qualifies.
  assert.equal(evaluateQualification(base as never).status, "QUALIFIED");
  assert.equal(evaluateQualification({ ...base, workHistory: [] } as never).reasonCodes.includes("WORK_HISTORY_INCOMPLETE"), true);

  const waivedLicense = { ...base, requirements: [{ id: "r1", requirementType: "DRIVER_LICENSE", exceptionReason: "waived" }] };
  assert.equal(evaluateQualification(waivedLicense as never).status, "CONDITIONALLY_QUALIFIED");
  const registryOptions = { registryOwnedRequirementTypes: REGISTRY_OWNED_REQUIREMENT_TYPES, skipWorkHistoryCheck: true };
  assert.equal(evaluateQualification(waivedLicense as never, registryOptions).status, "QUALIFIED");
  assert.equal(evaluateQualification({ ...base, workHistory: [] } as never, registryOptions).reasonCodes.includes("WORK_HISTORY_INCOMPLETE"), false);
  const otherWaiver = { ...base, requirements: [{ id: "r2", requirementType: "OTHER", exceptionReason: "fleet policy" }] };
  assert.equal(evaluateQualification(otherWaiver as never, registryOptions).status, "CONDITIONALLY_QUALIFIED");
});

test("authoritative driver qualification derives status from current evidence (V5, V6)", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const { prisma } = await import("@/lib/prisma");
  const {
    getAuthoritativeDriverQualification,
    AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION,
  } = await import("@/lib/services/authoritativeDriverQualificationService");
  const { lockDriverReadinessWrite } = await import("@/lib/services/readinessService");

  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");

  const stamp = `aq${Date.now().toString(36)}`;
  const role = (code: string) => prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
  const [complianceRole, fleetAdminRole, driverRole] = [await role("BOF_COMPLIANCE_REVIEW"), await role("FLEET_ADMIN"), await role("DRIVER")];
  const aggregator = await prisma.aggregator.create({ data: { name: `AQ ${stamp}` } });
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `AQ ${stamp}` } });
  const fleetA = await prisma.fleet.create({ data: { slug: `aq-a-${stamp}`, name: `AQ A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `aq-b-${stamp}`, name: `AQ B ${stamp}`, carrierGroupId: group.id } });
  const user = (name: string) => prisma.user.create({ data: { email: `aq-${name}-${stamp}@dev.local`, name } });
  const [compliance, fleetAdmin, complianceOtherFleet, driverUser] = [
    await user("compliance"),
    await user("fleet-admin"),
    await user("compliance-b"),
    await user("driver"),
  ];
  await prisma.fleetMembership.create({ data: { userId: compliance.id, fleetId: fleetA.id, roleId: complianceRole.id, status: "ACTIVE" } });
  await prisma.fleetMembership.create({ data: { userId: fleetAdmin.id, fleetId: fleetA.id, roleId: fleetAdminRole.id, status: "ACTIVE" } });
  await prisma.fleetMembership.create({ data: { userId: complianceOtherFleet.id, fleetId: fleetB.id, roleId: complianceRole.id, status: "ACTIVE" } });
  await prisma.fleetMembership.create({ data: { userId: driverUser.id, fleetId: fleetA.id, roleId: driverRole.id, status: "ACTIVE" } });

  const future = new Date(Date.now() + 365 * DAY);
  const past = new Date(Date.now() - 30 * DAY);
  let sequence = 0;

  type DocumentSpec = { status?: string; verifiedBy?: string | null; expiresAt?: Date };
  async function makeDriver(spec: {
    userId?: string | null;
    documents?: Partial<Record<"DRIVER_LICENSE" | "MEDICAL" | "DRUG_TEST" | "WORK_HISTORY", DocumentSpec | null>>;
    determinations?: Partial<Record<"CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY" | "ROAD_TEST_OR_EQUIVALENT", DocumentSpec | "ROW_ONLY" | null>>;
    workHistory?: Array<{ status: "ACTIVE" | "REJECTED" | "PENDING"; start: Date | null; end: Date | null }>;
    extraRequirements?: Array<{ requirementType: string; exceptionReason?: string | null }>;
    extraDocuments?: Array<{ type: "OTHER"; status: string }>;
    withIntake?: boolean;
  }) {
    sequence += 1;
    const driver = await prisma.driver.create({
      data: { fleetId: fleetA.id, firstName: "AQ", lastName: `${sequence}-${stamp}`, email: `aq-driver-${sequence}-${stamp}@dev.local`, status: "ACTIVE", userId: spec.userId ?? null },
    });
    if (spec.withIntake === false) return { driver, intake: null };
    const intake = await prisma.driverIntake.create({ data: { driverId: driver.id, fleetId: fleetA.id, createdByUserId: compliance.id } });
    const createDocument = (type: "DRIVER_LICENSE" | "MEDICAL" | "DRUG_TEST" | "WORK_HISTORY" | "OTHER", document: DocumentSpec) =>
      prisma.driverDocument.create({
        data: {
          driverId: driver.id,
          driverIntakeId: intake.id,
          fleetId: fleetA.id,
          type,
          status: (document.status ?? "VERIFIED") as never,
          storageKey: `aq/${stamp}/${sequence}/${type}`,
          originalFileName: `${type}.pdf`,
          uploadedByUserId: compliance.id,
          verifiedByUserId: document.verifiedBy === undefined ? compliance.id : document.verifiedBy,
          verifiedAt: new Date(),
          verificationExpiresAt: document.expiresAt ?? future,
        },
      });
    const documentDefaults = { DRIVER_LICENSE: {}, MEDICAL: {}, DRUG_TEST: {}, WORK_HISTORY: {} } as const;
    for (const [type, defaults] of Object.entries(documentDefaults) as Array<[keyof typeof documentDefaults, DocumentSpec]>) {
      const document = spec.documents && type in spec.documents ? spec.documents[type] : defaults;
      if (document) await createDocument(type, document);
    }
    for (const requirementType of ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY", "ROAD_TEST_OR_EQUIVALENT"] as const) {
      const determination = spec.determinations && requirementType in spec.determinations ? spec.determinations[requirementType] : {};
      if (determination === null || determination === undefined) continue;
      const evidence = determination === "ROW_ONLY" ? null : await createDocument("OTHER", determination);
      await prisma.driverIntakeRequirement.create({
        data: {
          driverIntakeId: intake.id,
          requirementType,
          label: requirementType,
          isRequired: true,
          status: evidence ? "SATISFIED" : "REQUIRED",
          satisfiedByDocumentId: evidence?.id ?? null,
        },
      });
    }
    for (const requirement of spec.extraRequirements ?? []) {
      await prisma.driverIntakeRequirement.create({
        data: {
          driverIntakeId: intake.id,
          requirementType: requirement.requirementType,
          label: requirement.requirementType,
          isRequired: true,
          status: "SATISFIED",
          exceptionReason: requirement.exceptionReason ?? null,
        },
      });
    }
    for (const document of spec.extraDocuments ?? []) await createDocument(document.type, { status: document.status });
    const history = spec.workHistory ?? [{ status: "ACTIVE" as const, start: new Date(Date.now() - 5 * 365 * DAY), end: null }];
    for (const row of history) {
      await prisma.workHistory.create({
        data: { driverId: driver.id, driverIntakeId: intake.id, employerName: `Carrier ${sequence}`, startDate: row.start, endDate: row.end, status: row.status },
      });
    }
    return { driver, intake };
  }

  const evaluate = (driverId: string, fleetId = fleetA.id) =>
    prisma.$transaction(async (tx) => {
      await lockDriverReadinessWrite(tx, driverId);
      return getAuthoritativeDriverQualification(tx, driverId, fleetId);
    });

  try {
    // Fully qualified driver.
    const qualified = await makeDriver({});
    const qualifiedResult = await evaluate(qualified.driver.id);
    assert.equal(qualifiedResult.status, "QUALIFIED", qualifiedResult.summary);
    assert.deepEqual(qualifiedResult.reasonCodes, []);
    assert.equal(qualifiedResult.conditionalMovementPermitted, true);
    assert.equal(qualifiedResult.policyVersion, AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION);
    assert.equal(qualifiedResult.policyVersion, "bof-stage0-driver-qualification-v1");
    assert.equal(qualifiedResult.qualificationSnapshotId, null);

    // Read-only: evaluation writes no score, snapshot or audit row, and ignores DriverReadinessScore.
    const counts = async () => [
      await prisma.driverReadinessScore.count({ where: { fleetId: fleetA.id } }),
      await prisma.driverQualificationSnapshot.count({ where: { fleetId: fleetA.id } }),
      await prisma.auditEvent.count({ where: { tenantId: fleetA.id } }),
    ];
    const before = await counts();
    await evaluate(qualified.driver.id);
    assert.deepEqual(await counts(), before);

    // V5: no requirement rows and no documents, one ACTIVE employment row, plus a stale READY score.
    const bare = await makeDriver({
      documents: { DRIVER_LICENSE: null, MEDICAL: null, DRUG_TEST: null, WORK_HISTORY: null },
      determinations: { CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY: null, ROAD_TEST_OR_EQUIVALENT: null },
    });
    await prisma.driverReadinessScore.create({
      data: { driverId: bare.driver.id, fleetId: fleetA.id, status: "READY", policyVersion: "test", summary: "stale manual override", reasonCodes: ["MANUAL_READINESS_REVIEW"] },
    });
    const bareResult = await evaluate(bare.driver.id);
    assert.equal(bareResult.status, "PENDING_COMPLIANCE");
    assert.equal(bareResult.conditionalMovementPermitted, false);
    for (const code of [
      "DRIVER_LICENSE_MISSING",
      "MEDICAL_CERTIFICATE_MISSING",
      "PRE_EMPLOYMENT_DRUG_TEST_MISSING",
      "EMPLOYMENT_APPLICATION_MISSING",
      "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_RECORDED",
      "ROAD_TEST_OR_EQUIVALENT_NOT_RECORDED",
    ]) {
      assert.ok(bareResult.reasonCodes.includes(code), `${code} in ${bareResult.reasonCodes.join(",")}`);
    }

    // Missing Clearinghouse or road-test evidence alone; a determination row without verified evidence.
    const noClearinghouse = await evaluate((await makeDriver({ determinations: { CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY: null } })).driver.id);
    assert.equal(noClearinghouse.status, "PENDING_COMPLIANCE");
    assert.deepEqual(noClearinghouse.reasonCodes, ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_RECORDED"]);
    const roadTestRowOnly = await evaluate((await makeDriver({ determinations: { ROAD_TEST_OR_EQUIVALENT: "ROW_ONLY" } })).driver.id);
    assert.deepEqual(roadTestRowOnly.reasonCodes, ["ROAD_TEST_OR_EQUIVALENT_NOT_RECORDED"]);

    // No intake at all.
    const noIntake = await evaluate((await makeDriver({ withIntake: false })).driver.id);
    assert.equal(noIntake.status, "PENDING_COMPLIANCE");
    assert.deepEqual(noIntake.reasonCodes, ["QUALIFICATION_RECORDS_MISSING"]);

    // V6: a REJECTED employment row does not qualify; a PENDING (driver-submitted) row does not count.
    const rejectedHistory = await evaluate(
      (await makeDriver({ workHistory: [{ status: "REJECTED", start: new Date(Date.now() - 5 * 365 * DAY), end: null }] })).driver.id,
    );
    assert.equal(rejectedHistory.status, "PENDING_COMPLIANCE");
    assert.deepEqual(rejectedHistory.reasonCodes, ["WORK_HISTORY_MISSING"]);
    const pendingHistory = await evaluate(
      (await makeDriver({ workHistory: [{ status: "PENDING", start: new Date(Date.now() - 5 * 365 * DAY), end: null }] })).driver.id,
    );
    assert.deepEqual(pendingHistory.reasonCodes, ["WORK_HISTORY_MISSING"]);

    // A single short ACTIVE row is incomplete; a row without a start date is incomplete.
    const shortHistory = await evaluate(
      (await makeDriver({ workHistory: [{ status: "ACTIVE", start: new Date(Date.now() - 200 * DAY), end: null }] })).driver.id,
    );
    assert.equal(shortHistory.status, "PENDING_COMPLIANCE");
    assert.deepEqual(shortHistory.reasonCodes, ["WORK_HISTORY_INCOMPLETE"]);
    const undatedHistory = await evaluate((await makeDriver({ workHistory: [{ status: "ACTIVE", start: null, end: null }] })).driver.id);
    assert.deepEqual(undatedHistory.reasonCodes, ["WORK_HISTORY_INCOMPLETE"]);

    // Expired and rejected credentials are disqualifying, not pending.
    const expiredLicense = await evaluate((await makeDriver({ documents: { DRIVER_LICENSE: { expiresAt: past } } })).driver.id);
    assert.equal(expiredLicense.status, "NOT_QUALIFIED");
    assert.deepEqual(expiredLicense.reasonCodes, ["DRIVER_LICENSE_EXPIRED"]);
    const expiredStatus = await evaluate((await makeDriver({ documents: { MEDICAL: { status: "EXPIRED" } } })).driver.id);
    assert.deepEqual(expiredStatus.reasonCodes, ["MEDICAL_CERTIFICATE_EXPIRED"]);
    const rejectedDrugTest = await evaluate((await makeDriver({ documents: { DRUG_TEST: { status: "REJECTED" } } })).driver.id);
    assert.equal(rejectedDrugTest.status, "NOT_QUALIFIED");
    assert.deepEqual(rejectedDrugTest.reasonCodes, ["PRE_EMPLOYMENT_DRUG_TEST_REJECTED"]);

    // Credentials not verified by BOF Compliance in this fleet stay pending.
    const unverified = await evaluate((await makeDriver({ documents: { DRIVER_LICENSE: { status: "PENDING_VERIFICATION", verifiedBy: null } } })).driver.id);
    assert.equal(unverified.status, "PENDING_COMPLIANCE");
    assert.ok(unverified.reasonCodes.includes("DRIVER_LICENSE_UNVERIFIED"), unverified.reasonCodes.join(","));
    const adminVerified = await evaluate((await makeDriver({ documents: { MEDICAL: { verifiedBy: fleetAdmin.id } } })).driver.id);
    assert.deepEqual(adminVerified.reasonCodes, ["MEDICAL_CERTIFICATE_NOT_COMPLIANCE_VERIFIED"]);
    const otherFleetVerified = await evaluate((await makeDriver({ documents: { DRIVER_LICENSE: { verifiedBy: complianceOtherFleet.id } } })).driver.id);
    assert.deepEqual(otherFleetVerified.reasonCodes, ["DRIVER_LICENSE_NOT_COMPLIANCE_VERIFIED"]);
    const selfVerified = await evaluate(
      (await makeDriver({ userId: driverUser.id, documents: { DRIVER_LICENSE: { verifiedBy: driverUser.id } } })).driver.id,
    );
    assert.deepEqual(selfVerified.reasonCodes, ["DRIVER_LICENSE_NOT_COMPLIANCE_VERIFIED"]);
    const clearinghouseByAdmin = await evaluate(
      (await makeDriver({ determinations: { CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY: { verifiedBy: fleetAdmin.id } } })).driver.id,
    );
    assert.deepEqual(clearinghouseByAdmin.reasonCodes, ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_NOT_COMPLIANCE_VERIFIED"]);

    // A waiver on a mandatory requirement is ignored: the expired license still disqualifies.
    const waivedLicense = await evaluate(
      (
        await makeDriver({
          documents: { DRIVER_LICENSE: { expiresAt: past } },
          extraRequirements: [{ requirementType: "DRIVER_LICENSE", exceptionReason: "waived" }],
        })
      ).driver.id,
    );
    assert.equal(waivedLicense.status, "NOT_QUALIFIED");
    assert.ok(!waivedLicense.reasonCodes.includes("REQUIREMENT_EXCEPTION"));

    // Disqualifying records on an older intake still disqualify when the latest intake is clean.
    const multiIntake = await makeDriver({});
    const olderIntake = await prisma.driverIntake.create({
      data: { driverId: multiIntake.driver.id, fleetId: fleetA.id, createdByUserId: compliance.id, createdAt: new Date(Date.now() - 400 * DAY) },
    });
    await prisma.violationHistory.create({
      data: { driverId: multiIntake.driver.id, driverIntakeId: olderIntake.id, status: "REJECTED", violationDate: new Date(Date.now() - 500 * DAY) },
    });
    const multiIntakeResult = await evaluate(multiIntake.driver.id);
    assert.equal(multiIntakeResult.status, "NOT_QUALIFIED");
    assert.deepEqual(multiIntakeResult.reasonCodes, ["DISQUALIFYING_VIOLATION"]);

    // CONDITIONAL only for internal policy items, and never masking mandatory gaps.
    const policyWaiver = await evaluate((await makeDriver({ extraRequirements: [{ requirementType: "OTHER", exceptionReason: "fleet policy waiver" }] })).driver.id);
    assert.equal(policyWaiver.status, "CONDITIONAL");
    assert.deepEqual(policyWaiver.reasonCodes, ["REQUIREMENT_EXCEPTION"]);
    assert.equal(policyWaiver.conditionalMovementPermitted, true);
    const gapDriver = await evaluate(
      (
        await makeDriver({
          workHistory: [
            { status: "ACTIVE", start: new Date(Date.now() - 5 * 365 * DAY), end: new Date(Date.now() - 200 * DAY) },
            { status: "ACTIVE", start: new Date(Date.now() - 150 * DAY), end: null },
          ],
        })
      ).driver.id,
    );
    assert.equal(gapDriver.status, "CONDITIONAL");
    assert.deepEqual(gapDriver.reasonCodes, ["WORK_HISTORY_GAP_REVIEW_REQUIRED"]);
    assert.equal(gapDriver.conditionalMovementPermitted, true);
    const waiverWithMissingEvidence = await evaluate(
      (
        await makeDriver({
          documents: { MEDICAL: null },
          extraRequirements: [{ requirementType: "OTHER", exceptionReason: "fleet policy waiver" }],
        })
      ).driver.id,
    );
    assert.equal(waiverWithMissingEvidence.status, "PENDING_COMPLIANCE");
    assert.equal(waiverWithMissingEvidence.conditionalMovementPermitted, false);
    const pendingPaperwork = await evaluate((await makeDriver({ extraDocuments: [{ type: "OTHER", status: "PENDING_VERIFICATION" }] })).driver.id);
    assert.equal(pendingPaperwork.status, "PENDING_COMPLIANCE");

    // Fleet boundary: a driver is never evaluated as qualified under another fleet.
    const crossFleet = await evaluate(qualified.driver.id, fleetB.id);
    assert.equal(crossFleet.status, "NOT_QUALIFIED");
    assert.deepEqual(crossFleet.reasonCodes, ["DRIVER_FLEET_MISMATCH"]);
    const unknownDriver = await evaluate(`missing-${stamp}`);
    assert.deepEqual(unknownDriver.reasonCodes, ["DRIVER_NOT_FOUND"]);
  } finally {
    const fleets = [fleetA.id, fleetB.id];
    const drivers = (await prisma.driver.findMany({ where: { fleetId: { in: fleets } }, select: { id: true } })).map((row) => row.id);
    await prisma.workHistory.deleteMany({ where: { driverId: { in: drivers } } });
    await prisma.violationHistory.deleteMany({ where: { driverId: { in: drivers } } });
    await prisma.driverIntakeRequirement.deleteMany({ where: { driverIntake: { fleetId: { in: fleets } } } });
    await prisma.driverDocument.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.driverReadinessScore.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.driverIntake.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.driver.deleteMany({ where: { id: { in: drivers } } });
    await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
    await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
    await prisma.carrierGroup.delete({ where: { id: group.id } });
    await prisma.aggregator.delete({ where: { id: aggregator.id } });
  }
});
