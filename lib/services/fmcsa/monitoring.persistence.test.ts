import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getMonitoringOverview, getMonitoringRunReport, runFmcsaMonitoring, setFleetCarrierIdentity } from "@/lib/services/fmcsa/monitoringService";
import { FMCSA_DATASETS } from "@/lib/services/fmcsa/openData/datasets";
import { SodaClient } from "@/lib/services/fmcsa/openData/sodaClient";
import type { FmcsaProviderOutcome, FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

// Refuses anything but a local bof_dev database (same guard as other BOF persistence tests).
assertTestDatabaseTarget(process.env.DATABASE_URL);

const suffix = randomBytes(4).toString("hex");
const USDOT = String(1_000_000 + (parseInt(suffix, 16) % 8_000_000));

const LIVE_FIELDS: Record<string, string[]> = {
  [FMCSA_DATASETS.COMPANY_CENSUS.id]: ["dot_number", "legal_name", "status_code", "mcs150_date", "power_units", "total_drivers"],
  [FMCSA_DATASETS.MOTUS_CARRIER.id]: ["dot_number", "docket_number", "op_auth_type", "op_auth_status", "min_cov_amount", "bipd_file"],
  [FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS.id]: ["dot_number", "oos_date", "oos_reason", "status"],
};

type World = { lastModified: string | null; commonStat: string; oos: unknown[] };

function soda(world: World) {
  return new SodaClient(null, (async (input: string | URL | Request) => {
    // Official column metadata (no rowsUpdatedAt, so freshness tests rely on Last-Modified).
    const meta = /\/api\/views\/([a-z0-9-]+)\.json/.exec(String(input));
    if (meta) {
      const columns = (LIVE_FIELDS[meta[1]] ?? []).map((fieldName) => ({ fieldName, name: fieldName.toUpperCase() }));
      return new Response(JSON.stringify({ name: meta[1], columns }), { status: 200 });
    }
    const id = /resource\/([a-z0-9-]+)\.json/.exec(String(input))?.[1] ?? "";
    const headers = new Headers({ "X-SODA2-Fields": JSON.stringify(LIVE_FIELDS[id] ?? []) });
    if (world.lastModified) headers.set("Last-Modified", world.lastModified);
    const probe = new URL(String(input)).searchParams.get("$limit") === "1";
    let rows: unknown[] = [];
    if (!probe && id === FMCSA_DATASETS.COMPANY_CENSUS.id) {
      rows = [{ dot_number: USDOT, legal_name: "Preview Test Freight LLC", status_code: "A", mcs150_date: "20260301", power_units: "10" }];
    } else if (!probe && id === FMCSA_DATASETS.MOTUS_CARRIER.id) {
      rows = [{ dot_number: USDOT, docket_number: "MC135797", op_auth_type: "COMMON", op_auth_status: world.commonStat === "A" ? "ACTIVE" : "INACTIVE", min_cov_amount: "750", bipd_file: "1000" }];
    } else if (!probe && id === FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS.id) {
      rows = world.oos;
    }
    return new Response(JSON.stringify(rows), { status: 200, headers });
  }) as typeof fetch);
}

function qcmobile(allowed: "Y" | "N"): FmcsaRegulatoryProvider {
  return {
    id: "fixture",
    async lookup(): Promise<FmcsaProviderOutcome> {
      const raw = {
        dotNumber: Number(USDOT),
        legalName: "Preview Test Freight LLC",
        allowedToOperate: allowed,
        statusCode: "A",
        commonAuthorityStatus: "A",
        bipdInsuranceOnFile: "1000",
        bipdRequiredAmount: "750",
      };
      return { status: "FOUND", provenance: "LIVE", retrievedAt: new Date(), endpointUsed: `/carriers/${USDOT}`, carrier: null, rawCarrier: raw };
    },
  };
}

const FRESH = new Date(Date.now() - 6 * 3_600_000).toUTCString();
const STALE = new Date(Date.now() - 10 * 86_400_000).toUTCString();

test("FMCSA carrier monitoring on the BOF Prisma schema", async (t) => {
  const aggregator = await prisma.aggregator.create({ data: { name: `Monitoring Agg ${suffix}` } });
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `Monitoring Carriers ${suffix}` } });
  const fleetA = await prisma.fleet.create({ data: { slug: `mon-a-${suffix}`, name: `Monitor A ${suffix}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `mon-b-${suffix}`, name: `Monitor B ${suffix}`, carrierGroupId: group.id } });
  const adminUser = await prisma.user.create({ data: { email: `mon-admin-${suffix}@bof.test`, name: "Admin" } });
  const dispatchUser = await prisma.user.create({ data: { email: `mon-dispatch-${suffix}@bof.test`, name: "Dispatch" } });
  const admin: SessionUserLike = { id: adminUser.id, email: adminUser.email, memberships: [{ fleetId: fleetA.id, roleCode: "FLEET_ADMIN", status: "ACTIVE" }] };
  const dispatcher: SessionUserLike = { id: dispatchUser.id, email: dispatchUser.email, memberships: [{ fleetId: fleetA.id, roleCode: "DISPATCH", status: "ACTIVE" }] };
  const outsider: SessionUserLike = { id: dispatchUser.id, email: dispatchUser.email, memberships: [{ fleetId: fleetB.id, roleCode: "FLEET_ADMIN", status: "ACTIVE" }] };
  const healthy: World = { lastModified: FRESH, commonStat: "A", oos: [] };

  await t.test("carrier identity: role-gated, validated, constrained in the database, audited", async () => {
    await assert.rejects(setFleetCarrierIdentity(dispatcher, fleetA.id, { usdotNumber: USDOT }), /Forbidden/);
    await assert.rejects(setFleetCarrierIdentity(outsider, fleetA.id, { usdotNumber: USDOT }), /Forbidden/);
    await assert.rejects(setFleetCarrierIdentity(admin, fleetA.id, { usdotNumber: "12x" }), /USDOT/);
    const fleet = await setFleetCarrierIdentity(admin, fleetA.id, { usdotNumber: `USDOT ${USDOT}`, mcNumber: "mc 0123456" });
    assert.equal(fleet.usdotNumber, USDOT);
    assert.equal(fleet.mcNumber, "MC123456");
    await assert.rejects(prisma.$executeRawUnsafe(`update "Fleet" set "usdotNumber" = 'ABC' where id = $1`, fleetA.id));
    await assert.rejects(prisma.$executeRawUnsafe(`update "Fleet" set "mcNumber" = '123' where id = $1`, fleetA.id));
    const audit = await prisma.auditEvent.findFirst({ where: { entityType: "FleetCarrierIdentity", entityId: fleetA.id }, orderBy: { createdAt: "desc" } });
    assert.equal((audit?.details as { current?: { usdotNumber?: string } }).current?.usdotNumber, USDOT);
  });

  await t.test("manual run: complete, fresh, validated evidence is CLEAR; scope limited to the user's fleets", async () => {
    await assert.rejects(runFmcsaMonitoring({ trigger: "MANUAL", actor: dispatcher }, { soda: soda(healthy), qcmobile: null }), /Forbidden/);
    const run = await runFmcsaMonitoring({ trigger: "MANUAL", actor: admin, fleetIds: [fleetA.id, fleetB.id] }, { soda: soda(healthy), qcmobile: qcmobile("Y") });
    assert.equal(run.status, "COMPLETED");
    assert.equal(run.fleetsChecked, 1, "fleet B is outside the admin's memberships");
    assert.equal(run.clearCount, 1);
    const snapshots = await prisma.fmcsaCarrierSnapshot.findMany({ where: { runId: run.id }, orderBy: { source: "asc" } });
    assert.deepEqual(snapshots.map((s) => [s.source, s.complete, s.schemaValidated]), [["QCMOBILE", true, true], ["OPEN_DATA", true, true]]);
    const report = await getMonitoringRunReport(admin, run.id);
    assert.equal(report.results[0].status, "CLEAR");
    await assert.rejects(getMonitoringRunReport(outsider, run.id), /not found/);
    const audits = await prisma.auditEvent.count({ where: { entityId: run.id, entityType: "FmcsaMonitoringRun" } });
    assert.equal(audits, 2);
  });

  await t.test("stale or unvalidated open data without QCMobile is UNVERIFIED with a finding, never CLEAR", async () => {
    const run = await runFmcsaMonitoring({ trigger: "MANUAL", actor: admin }, { soda: soda({ ...healthy, lastModified: STALE }), qcmobile: null });
    assert.equal(run.status, "COMPLETED_WITH_EXCEPTIONS");
    assert.equal(run.unverifiedCount, 1);
    const result = await prisma.fmcsaMonitoringResult.findFirstOrThrow({ where: { runId: run.id } });
    assert.equal(result.status, "UNVERIFIED");
    assert.ok((result.reasons as string[]).some((r) => r.includes("hours old")));
    const finding = await prisma.sambaFinding.findFirst({ where: { fleetId: fleetA.id, findingType: "FMCSA_MONITOR_UNVERIFIED", status: "OPEN" } });
    assert.equal(finding?.provenance, "INSUFFICIENT_EVIDENCE");

    const noFreshness = await runFmcsaMonitoring({ trigger: "MANUAL", actor: admin }, { soda: soda({ ...healthy, lastModified: null }), qcmobile: null });
    assert.equal(noFreshness.unverifiedCount, 1);
    assert.equal(await prisma.sambaFinding.count({ where: { fleetId: fleetA.id, findingType: "FMCSA_MONITOR_UNVERIFIED", status: "OPEN" } }), 1, "deduplicated");
  });

  await t.test("an active OOS order is CRITICAL even when QCMobile says allowed; lost authority is flagged as a change", async () => {
    const oos = [{ dot_number: USDOT, oos_date: "2026-10-10T00:00:00.000", oos_reason: "New Entrant", status: "ACTIVE" }];
    const run = await runFmcsaMonitoring({ trigger: "MANUAL", actor: admin }, { soda: soda({ ...healthy, oos, commonStat: "I" }), qcmobile: qcmobile("Y") });
    const result = await prisma.fmcsaMonitoringResult.findFirstOrThrow({ where: { runId: run.id } });
    assert.equal(result.status, "CRITICAL");
    const codes = (result.alerts as Array<{ code: string }>).map((a) => a.code);
    assert.ok(codes.includes("OUT_OF_SERVICE_ORDER") && codes.includes("OPERATING_AUTHORITY_INACTIVE"));
    assert.ok((result.changeAlerts as Array<{ code: string }>).some((a) => a.code === "AUTHORITY_STATUS_CHANGED"));
    const findings = await prisma.sambaFinding.findMany({ where: { fleetId: fleetA.id, findingType: { startsWith: "FMCSA_MONITOR_" }, status: "OPEN" } });
    assert.ok(findings.some((f) => f.findingType === "FMCSA_MONITOR_OUT_OF_SERVICE_ORDER" && f.severity === "CRITICAL"));
  });

  await t.test("database refuses a CLEAR result that carries alerts", async () => {
    const run = await prisma.fmcsaMonitoringRun.create({ data: { trigger: "CLI" } });
    await assert.rejects(
      prisma.fmcsaMonitoringResult.create({
        data: { runId: run.id, fleetId: fleetA.id, usdotNumber: USDOT, status: "CLEAR", reasons: [], alerts: [{ code: "X" }], changeAlerts: [], openDataSnapshotId: "s" },
      }),
    );
    await assert.rejects(
      prisma.fmcsaMonitoringResult.create({ data: { runId: run.id, fleetId: fleetA.id, usdotNumber: USDOT, status: "CLEAR", reasons: [], alerts: [], changeAlerts: [] } }),
      /check constraint/,
      "CLEAR without any snapshot is refused",
    );
  });

  await t.test("scheduled run covers fleets without memberships; no USDOT is NOT_CONFIGURED", async () => {
    const run = await runFmcsaMonitoring({ trigger: "SCHEDULED", fleetIds: [fleetA.id, fleetB.id] }, { soda: soda(healthy), qcmobile: null });
    assert.equal(run.fleetsChecked, 2);
    assert.equal(run.notConfiguredCount, 1);
    const resultB = await prisma.fmcsaMonitoringResult.findFirstOrThrow({ where: { runId: run.id, fleetId: fleetB.id } });
    assert.equal(resultB.status, "NOT_CONFIGURED");
  });

  await t.test("overview: old CLEAR shown as UNVERIFIED; result for a previous USDOT is not reused", async () => {
    await runFmcsaMonitoring({ trigger: "MANUAL", actor: admin }, { soda: soda(healthy), qcmobile: qcmobile("Y") });
    const fresh = await getMonitoringOverview(admin);
    assert.equal(fresh.fleets.find((r) => r.fleet.id === fleetA.id)?.status, "CLEAR");
    const later = await getMonitoringOverview(admin, new Date(Date.now() + 3 * 86_400_000));
    assert.equal(later.fleets.find((r) => r.fleet.id === fleetA.id)?.status, "UNVERIFIED");

    await setFleetCarrierIdentity(admin, fleetA.id, { usdotNumber: "7654321", mcNumber: null });
    const changed = await getMonitoringOverview(admin);
    const row = changed.fleets.find((r) => r.fleet.id === fleetA.id)!;
    assert.equal(row.latest, null);
    assert.equal(row.status, "UNVERIFIED");
    assert.deepEqual((await getMonitoringOverview(outsider)).fleets.map((r) => r.fleet.id), [fleetB.id]);
  });

  await t.test("a failing source marks the run FAILED and is audited", async () => {
    const broken: FmcsaRegulatoryProvider = { id: "fixture", lookup: async () => { throw new Error("boom"); } };
    await assert.rejects(runFmcsaMonitoring({ trigger: "MANUAL", actor: admin }, { soda: soda(healthy), qcmobile: broken }), /boom/);
    const failed = await prisma.fmcsaMonitoringRun.findFirstOrThrow({ where: { initiatedByUserId: adminUser.id }, orderBy: { startedAt: "desc" } });
    assert.equal(failed.status, "FAILED");
    assert.equal(await prisma.auditEvent.count({ where: { entityId: failed.id, details: { path: ["event"], equals: "fmcsa.monitoring_run_failed" } } }), 1);
  });
});
