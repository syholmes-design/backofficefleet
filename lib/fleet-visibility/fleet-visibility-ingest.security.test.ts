import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import test from "node:test";

import { FleetVisibilityError } from "@/lib/fleet-visibility/errors";
import { assertTestDatabaseTarget, REFUSING_UNSAFE_TEST_DATABASE } from "@/lib/test/assertTestDatabaseTarget";

function requireIsolatedTestDatabase(): string | null {
  const candidate = process.env.BOF_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  try {
    return assertTestDatabaseTarget(candidate);
  } catch (error) {
    if (error instanceof Error && error.message === REFUSING_UNSAFE_TEST_DATABASE) return null;
    throw error;
  }
}

const GPS_PIPELINE_EVENT_TYPES = [
  "VEHICLE_LOCATION_RECORDED",
  "DELIVERY_RISK_ASSESSED",
  "GEOFENCE_PICKUP_ARRIVED",
  "GEOFENCE_PICKUP_DEPARTED",
  "GEOFENCE_DELIVERY_ARRIVED",
  "GEOFENCE_DELIVERY_DEPARTED",
] as const;

async function countGpsPipelineArtifacts(
  prisma: Awaited<typeof import("@/lib/prisma")>["prisma"],
  fleetIds: string[],
) {
  return {
    observations: await prisma.vehicleLocationObservation.count({ where: { fleetId: { in: fleetIds } } }),
    operatingEvents: await prisma.operatingProcessEvent.count({
      where: { fleetId: { in: fleetIds }, eventType: { in: [...GPS_PIPELINE_EVENT_TYPES] } },
    }),
    movementAssessments: await prisma.loadMovementAssessment.count({ where: { fleetId: { in: fleetIds } } }),
  };
}

async function assertNoGpsPipelineDelta(
  before: Awaited<ReturnType<typeof countGpsPipelineArtifacts>>,
  after: Awaited<ReturnType<typeof countGpsPipelineArtifacts>>,
) {
  assert.equal(after.observations, before.observations);
  assert.equal(after.operatingEvents, before.operatingEvents);
  assert.equal(after.movementAssessments, before.movementAssessments);
}

test("fleet GPS ingest enforces device link, fleet credential scope, and cross-fleet rejection", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { hashIngestSecret } = await import("@/lib/fleet-visibility/ingest-credentials");
  const { ingestLocationObservation } = await import("@/lib/fleet-visibility/fleet-visibility-service");
  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `GPS ${stamp}` } })).id, name: `GPS ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({ data: { slug: `gps-a-${stamp}`, name: `GPS A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `gps-b-${stamp}`, name: `GPS B ${stamp}`, carrierGroupId: group.id } });

  const tractorA = await prisma.equipment.create({
    data: { fleetId: fleetA.id, equipmentType: "TRACTOR", unitNumber: `TR-${stamp}-A`, status: "AVAILABLE" },
  });
  const tractorB = await prisma.equipment.create({
    data: { fleetId: fleetB.id, equipmentType: "TRACTOR", unitNumber: `TR-${stamp}-B`, status: "AVAILABLE" },
  });

  await prisma.telematicsDeviceLink.create({
    data: {
      fleetId: fleetA.id,
      equipmentId: tractorA.id,
      provider: "GENERIC_WEBHOOK",
      providerDeviceId: `dev-a-${stamp}`,
    },
  });

  const secret = randomBytes(24).toString("base64url");
  const credential = await prisma.telematicsIngestCredential.create({
    data: {
      fleetId: fleetA.id,
      provider: "GENERIC_WEBHOOK",
      label: "test",
      secretHash: await hashIngestSecret(secret),
    },
  });

  const payload = {
    fleetId: fleetA.id,
    provider: "GENERIC_WEBHOOK" as const,
    providerDeviceId: `dev-a-${stamp}`,
    latitude: 41.8781,
    longitude: -87.6298,
    observedAt: new Date(),
    idempotencyKey: `sec-test-${stamp}`,
  };

  const ok = await ingestLocationObservation(null, payload, {
    channel: "integration",
    integrationFleetId: fleetA.id,
  });
  assert.equal(ok.duplicate, false);
  assert.equal(ok.observation.equipmentId, tractorA.id);
  assert.equal(ok.observation.fleetId, fleetA.id);

  await assert.rejects(
    () =>
      ingestLocationObservation(null, { ...payload, idempotencyKey: `cross-${stamp}` }, {
        channel: "integration",
        integrationFleetId: fleetB.id,
      }),
    (error: FleetVisibilityError) => error.statusCode === 403,
  );

  await assert.rejects(
    () =>
      ingestLocationObservation(null, {
        ...payload,
        providerDeviceId: "unknown-device",
        idempotencyKey: `unknown-${stamp}`,
      }, {
        channel: "integration",
        integrationFleetId: fleetA.id,
      }),
    (error: FleetVisibilityError) => error.message === "DEVICE_NOT_REGISTERED",
  );

  const opsRole = await prisma.role.upsert({
    where: { code: "BOF_OPERATIONS" },
    update: {},
    create: { code: "BOF_OPERATIONS", name: "BOF Operations" },
  });
  const dispatcherRole = await prisma.role.upsert({
    where: { code: "DISPATCH" },
    update: {},
    create: { code: "DISPATCH", name: "Dispatch" },
  });
  const opsUser = await prisma.user.create({ data: { email: `gps-ops-${stamp}@dev.local`, name: "GPS Ops" } });
  const dispatchUser = await prisma.user.create({ data: { email: `gps-dispatch-${stamp}@dev.local`, name: "GPS Dispatch" } });
  await prisma.fleetMembership.createMany({
    data: [
      { userId: opsUser.id, fleetId: fleetA.id, roleId: opsRole.id, status: "ACTIVE" },
      { userId: dispatchUser.id, fleetId: fleetA.id, roleId: dispatcherRole.id, status: "ACTIVE" },
    ],
  });

  await assert.rejects(
    () =>
      ingestLocationObservation(
        { id: dispatchUser.id, memberships: [{ fleetId: fleetA.id, roleCode: "DISPATCH", status: "ACTIVE" }] },
        {
          ...payload,
          observationKind: "SYNTHETIC_TEST",
          equipmentId: tractorA.id,
          idempotencyKey: `synthetic-dispatch-${stamp}`,
        },
        { channel: "operator_session" },
      ),
    (error: FleetVisibilityError) => error.statusCode === 403,
  );

  const synthetic = await ingestLocationObservation(
    { id: opsUser.id, memberships: [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] },
    {
      ...payload,
      observationKind: "SYNTHETIC_TEST",
      equipmentId: tractorA.id,
      idempotencyKey: `synthetic-ops-${stamp}`,
    },
    { channel: "operator_session" },
  );
  assert.equal(synthetic.observation.observationKind, "SYNTHETIC_TEST");

  await assert.rejects(
    () =>
      ingestLocationObservation(
        { id: opsUser.id, memberships: [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS", status: "ACTIVE" }] },
        {
          ...payload,
          observationKind: "SYNTHETIC_TEST",
          equipmentId: tractorB.id,
          idempotencyKey: `cross-eq-${stamp}`,
        },
        { channel: "operator_session" },
      ),
    (error: FleetVisibilityError) => error.statusCode === 403,
  );

  void credential;
  void secret;
  void tractorB;

  await prisma.vehicleLocationObservation.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.telematicsIngestCredential.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.telematicsDeviceLink.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.equipment.deleteMany({ where: { id: { in: [tractorA.id, tractorB.id] } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [opsUser.id, dispatchUser.id] } } });
  await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});

test("GPS tenant isolation rejects cross-fleet load and driver associations without side effects", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { ingestLocationObservation } = await import("@/lib/fleet-visibility/fleet-visibility-service");

  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `Iso ${stamp}` } })).id, name: `Iso ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({ data: { slug: `iso-a-${stamp}`, name: `Iso A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `iso-b-${stamp}`, name: `Iso B ${stamp}`, carrierGroupId: group.id } });

  const tractorA = await prisma.equipment.create({
    data: { fleetId: fleetA.id, equipmentType: "TRACTOR", unitNumber: `ISO-A-${stamp}`, status: "AVAILABLE" },
  });
  const loadA = await prisma.load.create({
    data: {
      fleetId: fleetA.id,
      customerName: "Customer A",
      origin: "Chicago, IL",
      destination: "Milwaukee, WI",
      status: "DISPATCHED",
    },
  });
  const loadB = await prisma.load.create({
    data: {
      fleetId: fleetB.id,
      customerName: "Customer B",
      origin: "Detroit, MI",
      destination: "Toledo, OH",
      status: "DISPATCHED",
    },
  });
  const driverA = await prisma.driver.create({
    data: { fleetId: fleetA.id, firstName: "Ada", lastName: "A", email: `ada-a-${stamp}@dev.local` },
  });
  const driverB = await prisma.driver.create({
    data: { fleetId: fleetB.id, firstName: "Bob", lastName: "B", email: `bob-b-${stamp}@dev.local` },
  });

  const opsRole = await prisma.role.upsert({
    where: { code: "BOF_OPERATIONS" },
    update: {},
    create: { code: "BOF_OPERATIONS", name: "BOF Operations" },
  });
  const opsUser = await prisma.user.create({ data: { email: `iso-ops-${stamp}@dev.local`, name: "Iso Ops" } });
  await prisma.fleetMembership.create({
    data: { userId: opsUser.id, fleetId: fleetA.id, roleId: opsRole.id, status: "ACTIVE" },
  });

  const sessionUser = {
    id: opsUser.id,
    memberships: [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS", status: "ACTIVE" as const }],
  };

  const basePayload = {
    fleetId: fleetA.id,
    provider: "GENERIC_WEBHOOK" as const,
    providerDeviceId: `iso-dev-${stamp}`,
    latitude: 41.88,
    longitude: -87.63,
    observedAt: new Date(),
  };

  const fleetIds = [fleetA.id, fleetB.id];
  const before = await countGpsPipelineArtifacts(prisma, fleetIds);

  await assert.rejects(
    () =>
      ingestLocationObservation(
        sessionUser,
        {
          ...basePayload,
          observationKind: "SYNTHETIC_TEST",
          equipmentId: tractorA.id,
          loadId: loadB.id,
          idempotencyKey: `iso-load-b-${stamp}`,
        },
        { channel: "operator_session" },
      ),
    (error: FleetVisibilityError) => error.message === "LOAD_TENANT_MISMATCH",
  );

  await assert.rejects(
    () =>
      ingestLocationObservation(
        sessionUser,
        {
          ...basePayload,
          observationKind: "SYNTHETIC_TEST",
          equipmentId: tractorA.id,
          loadId: loadA.id,
          driverId: driverB.id,
          idempotencyKey: `iso-driver-b-${stamp}`,
        },
        { channel: "operator_session" },
      ),
    (error: FleetVisibilityError) => error.message === "DRIVER_TENANT_MISMATCH",
  );

  const afterReject = await countGpsPipelineArtifacts(prisma, fleetIds);
  await assertNoGpsPipelineDelta(before, afterReject);

  assert.equal(await prisma.vehicleLocationObservation.count({ where: { loadId: loadB.id } }), 0);
  assert.equal(await prisma.vehicleLocationObservation.count({ where: { driverId: driverB.id } }), 0);

  void driverA;

  await prisma.fleetMembership.deleteMany({ where: { fleetId: fleetA.id, userId: opsUser.id } });
  await prisma.user.delete({ where: { id: opsUser.id } });
  await prisma.driver.deleteMany({ where: { id: { in: [driverA.id, driverB.id] } } });
  await prisma.load.deleteMany({ where: { id: { in: [loadA.id, loadB.id] } } });
  await prisma.equipment.deleteMany({ where: { id: tractorA.id } });
  await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});

test("integration and session ingest cannot bind GPS to another carrier equipment or spoofed tenant IDs", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { ingestLocationObservation } = await import("@/lib/fleet-visibility/fleet-visibility-service");

  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `Xeq ${stamp}` } })).id, name: `Xeq ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({ data: { slug: `xeq-a-${stamp}`, name: `Xeq A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `xeq-b-${stamp}`, name: `Xeq B ${stamp}`, carrierGroupId: group.id } });

  const tractorA = await prisma.equipment.create({
    data: { fleetId: fleetA.id, equipmentType: "TRACTOR", unitNumber: `XEQ-A-${stamp}`, status: "AVAILABLE" },
  });
  const tractorB = await prisma.equipment.create({
    data: { fleetId: fleetB.id, equipmentType: "TRACTOR", unitNumber: `XEQ-B-${stamp}`, status: "AVAILABLE" },
  });

  const loadA = await prisma.load.create({
    data: {
      fleetId: fleetA.id,
      customerName: "Customer A",
      origin: "Chicago, IL",
      destination: "Milwaukee, WI",
      status: "DISPATCHED",
    },
  });
  const loadB = await prisma.load.create({
    data: {
      fleetId: fleetB.id,
      customerName: "Customer B",
      origin: "Detroit, MI",
      destination: "Toledo, OH",
      status: "DISPATCHED",
    },
  });
  const driverA = await prisma.driver.create({
    data: { fleetId: fleetA.id, firstName: "Eve", lastName: "A", email: `eve-a-${stamp}@dev.local` },
  });
  const driverB = await prisma.driver.create({
    data: { fleetId: fleetB.id, firstName: "Dan", lastName: "B", email: `dan-b-${stamp}@dev.local` },
  });

  await prisma.dispatchAssignment.create({
    data: {
      fleetId: fleetA.id,
      loadId: loadA.id,
      driverId: driverA.id,
      tractorEquipmentId: tractorA.id,
      status: "ACTIVE",
    },
  });

  await prisma.telematicsDeviceLink.create({
    data: {
      fleetId: fleetA.id,
      equipmentId: tractorA.id,
      provider: "GENERIC_WEBHOOK",
      providerDeviceId: `xeq-dev-${stamp}`,
    },
  });

  const dispatcherRole = await prisma.role.upsert({
    where: { code: "DISPATCH" },
    update: {},
    create: { code: "DISPATCH", name: "Dispatch" },
  });
  const dispatchUser = await prisma.user.create({ data: { email: `xeq-dispatch-${stamp}@dev.local`, name: "Dispatch" } });
  await prisma.fleetMembership.create({
    data: { userId: dispatchUser.id, fleetId: fleetA.id, roleId: dispatcherRole.id, status: "ACTIVE" },
  });

  const integrationPayload = {
    fleetId: fleetA.id,
    provider: "GENERIC_WEBHOOK" as const,
    providerDeviceId: `xeq-dev-${stamp}`,
    latitude: 41.881,
    longitude: -87.623,
    observedAt: new Date(),
    idempotencyKey: `xeq-int-${stamp}`,
    equipmentId: tractorB.id,
    loadId: loadB.id,
    driverId: driverB.id,
  };

  const integrationResult = await ingestLocationObservation(null, integrationPayload, {
    channel: "integration",
    integrationFleetId: fleetA.id,
  });

  assert.equal(integrationResult.observation.equipmentId, tractorA.id);
  assert.equal(integrationResult.observation.loadId, loadA.id);
  assert.equal(integrationResult.observation.driverId, driverA.id);
  assert.notEqual(integrationResult.observation.loadId, loadB.id);
  assert.notEqual(integrationResult.observation.driverId, driverB.id);

  assert.equal(await prisma.vehicleLocationObservation.count({ where: { equipmentId: tractorB.id } }), 0);

  const liveSession = await ingestLocationObservation(
    { id: dispatchUser.id, memberships: [{ fleetId: fleetA.id, roleCode: "DISPATCH", status: "ACTIVE" }] },
    {
      fleetId: fleetA.id,
      provider: "GENERIC_WEBHOOK",
      providerDeviceId: `xeq-dev-${stamp}`,
      latitude: 41.882,
      longitude: -87.624,
      observedAt: new Date(),
      idempotencyKey: `xeq-live-ok-${stamp}`,
      equipmentId: tractorB.id,
    },
    { channel: "operator_session" },
  );

  assert.equal(liveSession.observation.equipmentId, tractorA.id);
  assert.equal(await prisma.vehicleLocationObservation.count({ where: { equipmentId: tractorB.id } }), 0);

  await prisma.vehicleLocationObservation.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.loadMovementAssessment.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: fleetA.id } });
  await prisma.telematicsDeviceLink.deleteMany({ where: { fleetId: fleetA.id } });
  await prisma.fleetMembership.deleteMany({ where: { userId: dispatchUser.id } });
  await prisma.user.delete({ where: { id: dispatchUser.id } });
  await prisma.driver.deleteMany({ where: { id: { in: [driverA.id, driverB.id] } } });
  await prisma.load.deleteMany({ where: { id: { in: [loadA.id, loadB.id] } } });
  await prisma.equipment.deleteMany({ where: { id: { in: [tractorA.id, tractorB.id] } } });
  await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});

test("verifyTelematicsIngestRequest rejects fleet mismatch on route", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { hashIngestSecret } = await import("@/lib/fleet-visibility/ingest-credentials");
  const { verifyTelematicsIngestRequest } = await import("@/lib/fleet-visibility/ingest-auth");

  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `Cred ${stamp}` } })).id, name: `Cred ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({ data: { slug: `cred-a-${stamp}`, name: `Cred A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `cred-b-${stamp}`, name: `Cred B ${stamp}`, carrierGroupId: group.id } });
  const secret = randomBytes(24).toString("base64url");
  const credential = await prisma.telematicsIngestCredential.create({
    data: {
      fleetId: fleetA.id,
      provider: "SAMSARA",
      secretHash: await hashIngestSecret(secret),
    },
  });

  const rawBody = JSON.stringify({ providerDeviceId: "x", latitude: 1, longitude: 2, observedAt: new Date().toISOString(), idempotencyKey: "k" });

  await assert.rejects(
    () =>
      verifyTelematicsIngestRequest({
        authorizationHeader: `Bearer ${credential.id}.${secret}`,
        routeFleetId: fleetB.id,
        declaredProvider: "SAMSARA",
        rawBody,
        signatureHeader: null,
      }),
    (error: Error & { statusCode?: number }) => error.statusCode === 403,
  );

  await prisma.telematicsIngestCredential.delete({ where: { id: credential.id } });
  await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});

test("revoked ingest credential is rejected", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { hashIngestSecret } = await import("@/lib/fleet-visibility/ingest-credentials");
  const { verifyTelematicsIngestRequest } = await import("@/lib/fleet-visibility/ingest-auth");

  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `Revoke ${stamp}` } })).id, name: `Revoke ${stamp}` },
  });
  const fleet = await prisma.fleet.create({ data: { slug: `revoke-${stamp}`, name: `Revoke ${stamp}`, carrierGroupId: group.id } });
  const secret = randomBytes(24).toString("base64url");
  const credential = await prisma.telematicsIngestCredential.create({
    data: {
      fleetId: fleet.id,
      provider: "GENERIC_WEBHOOK",
      secretHash: await hashIngestSecret(secret),
      revokedAt: new Date(),
    },
  });
  const rawBody = JSON.stringify({ providerDeviceId: "x", latitude: 1, longitude: 2, observedAt: new Date().toISOString(), idempotencyKey: "k-rev" });

  await assert.rejects(
    () =>
      verifyTelematicsIngestRequest({
        authorizationHeader: `Bearer ${credential.id}.${secret}`,
        routeFleetId: fleet.id,
        declaredProvider: "GENERIC_WEBHOOK",
        rawBody,
        signatureHeader: null,
      }),
    (error: Error & { statusCode?: number }) => error.statusCode === 401,
  );

  await prisma.telematicsIngestCredential.delete({ where: { id: credential.id } });
  await prisma.fleet.delete({ where: { id: fleet.id } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});

test("signed webhook requires valid HMAC when signing hash configured", async () => {
  const databaseUrl = requireIsolatedTestDatabase();
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  const { prisma } = await import("@/lib/prisma");
  const { hashIngestSecret, hashWebhookSigningSecret } = await import("@/lib/fleet-visibility/ingest-credentials");
  const { verifyTelematicsIngestRequest } = await import("@/lib/fleet-visibility/ingest-auth");

  const stamp = Date.now().toString(36);
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: (await prisma.aggregator.create({ data: { name: `Hmac ${stamp}` } })).id, name: `Hmac ${stamp}` },
  });
  const fleet = await prisma.fleet.create({ data: { slug: `hmac-${stamp}`, name: `Hmac ${stamp}`, carrierGroupId: group.id } });
  const secret = randomBytes(24).toString("base64url");
  const credential = await prisma.telematicsIngestCredential.create({
    data: {
      fleetId: fleet.id,
      provider: "MOTIVE",
      secretHash: await hashIngestSecret(secret),
      webhookSigningSecretHash: await hashWebhookSigningSecret(secret),
    },
  });
  const rawBody = JSON.stringify({ providerDeviceId: "d1", latitude: 1, longitude: 2, observedAt: new Date().toISOString(), idempotencyKey: "k2" });
  const signature = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const verified = await verifyTelematicsIngestRequest({
    authorizationHeader: `Bearer ${credential.id}.${secret}`,
    routeFleetId: fleet.id,
    declaredProvider: "MOTIVE",
    rawBody,
    signatureHeader: signature,
  });
  assert.equal(verified.fleetId, fleet.id);

  await prisma.telematicsIngestCredential.delete({ where: { id: credential.id } });
  await prisma.fleet.delete({ where: { id: fleet.id } });
  await prisma.carrierGroup.delete({ where: { id: group.id } });
});
