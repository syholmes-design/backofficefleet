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
  await prisma.telematicsIngestCredential.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.telematicsDeviceLink.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.equipment.deleteMany({ where: { id: { in: [tractorA.id, tractorB.id] } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [opsUser.id, dispatchUser.id] } } });
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
