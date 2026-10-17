import { Prisma, type FmcsaComplianceStatus, type FmcsaMonitoringTrigger, type SambaFindingSeverity } from "@prisma/client";

import { getMemberships, requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { validateDocketInput, validateUsdotInput } from "@/lib/services/fmcsa/carrierIdentity";
import type { CarrierAlert } from "@/lib/services/fmcsa/carrierMonitoring";
import { missingQcMobileElements, qcMobileCarrierProfile, type FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { deriveComplianceStatus, effectiveStatus, type ComplianceDecision, type QcMobileEvidence } from "@/lib/services/fmcsa/complianceStatus";
import { fetchOpenDataCarrierProfiles, type OpenDataSyncResult } from "@/lib/services/fmcsa/openData/carrierSync";
import { validateOpenDataSchemas, type OpenDataSchemaValidation } from "@/lib/services/fmcsa/openData/schemaValidation";
import { createSodaClientFromEnv, type SodaClient } from "@/lib/services/fmcsa/openData/sodaClient";
import { QcMobileFmcsaProvider } from "@/lib/services/fmcsa/qcmobileProvider";
import type { FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";

/**
 * FMCSA carrier compliance monitoring over BOF fleets (the carriers BOF
 * serves). Carrier identity lives on Fleet; history in FmcsaCarrierSnapshot;
 * per-run outcomes in FmcsaMonitoringResult; exceptions become findings in
 * the existing findings engine (SambaFinding) and every step is audited.
 *
 * Monitoring is evidence for compliance review. It never changes dispatch,
 * pickup or carrier status on its own.
 */
export const MONITORING_RUN_ROLES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN"] as const;
export const CARRIER_IDENTITY_EDIT_ROLES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN"] as const;

const FINDING_PREFIX = "FMCSA_MONITOR_";

type Actor = SessionUserLike | null;

function httpError(statusCode: number, message: string, payload?: Record<string, unknown>) {
  return Object.assign(new Error(message), { statusCode, payload });
}

function requireSession(user: SessionUserLike | null | undefined): asserts user is SessionUserLike {
  if (!user?.id) throw httpError(401, "Unauthorized");
}

function requireRole(user: SessionUserLike, fleetId: string, roles: readonly string[]) {
  const access = requireFleetAccess(user, fleetId, [...roles]);
  if (!access.allowed) throw httpError(403, "Forbidden", { reason: access.reason });
}

/** Fleets on which the user holds an active membership with one of the roles (any role when empty). */
export function accessibleFleetIds(user: SessionUserLike, roles: readonly string[] = []): string[] {
  return [
    ...new Set(
      getMemberships(user)
        .filter((m) => m.status !== "INACTIVE" && m.status !== "INVITED" && (roles.length === 0 || roles.includes(String(m.roleCode))))
        .map((m) => m.fleetId),
    ),
  ];
}

// ── Carrier identity ──────────────────────────────────────────────────────

export { DOCKET_FORMAT_MESSAGE, USDOT_FORMAT_MESSAGE } from "@/lib/services/fmcsa/carrierIdentity";

export function normalizeUsdotInput(value: unknown): string | null {
  const result = validateUsdotInput(value);
  if (!result.ok) throw httpError(422, result.message, { field: "usdotNumber" });
  return result.value;
}

export function normalizeDocketInput(value: unknown): string | null {
  const result = validateDocketInput(value);
  if (!result.ok) throw httpError(422, result.message, { field: "mcNumber" });
  return result.value;
}

export async function setFleetCarrierIdentity(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  input: { usdotNumber?: unknown; mcNumber?: unknown },
) {
  requireSession(user);
  requireRole(user, fleetId, CARRIER_IDENTITY_EDIT_ROLES);
  const usdotNumber = normalizeUsdotInput(input.usdotNumber);
  const mcNumber = normalizeDocketInput(input.mcNumber);
  const before = await prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true, usdotNumber: true, mcNumber: true } });
  if (!before) throw httpError(404, "Fleet not found");
  const fleet = await prisma.fleet.update({
    where: { id: fleetId },
    data: { usdotNumber, mcNumber, carrierIdentityUpdatedAt: new Date() },
    select: { id: true, name: true, usdotNumber: true, mcNumber: true, carrierIdentityUpdatedAt: true },
  });
  await createAuditRecord({
    actorId: user.id ?? null,
    actorEmail: user.email ?? null,
    tenantId: fleetId,
    action: "UPDATED",
    entityType: "FleetCarrierIdentity",
    entityId: fleetId,
    details: {
      event: "fleet.carrier_identity_updated",
      previous: { usdotNumber: before.usdotNumber, mcNumber: before.mcNumber },
      current: { usdotNumber, mcNumber },
    },
    metadata: { source: "fmcsa-monitoring" },
  });
  return fleet;
}

// ── Monitoring run ────────────────────────────────────────────────────────

export type MonitoringDeps = {
  soda?: SodaClient;
  /** QCMobile provider; null disables QCMobile for the run. Defaults to env. */
  qcmobile?: FmcsaRegulatoryProvider | null;
  now?: () => Date;
};

function qcMobileFromEnv(): FmcsaRegulatoryProvider | null {
  const webKey = process.env.FMCSA_QCMOBILE_WEBKEY?.trim();
  if (!webKey || process.env.BOF_FMCSA_PROVIDER?.trim().toLowerCase() !== "qcmobile") return null;
  return new QcMobileFmcsaProvider(webKey);
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function findingSeverity(status: FmcsaComplianceStatus, alert?: CarrierAlert): SambaFindingSeverity {
  if (alert) return alert.severity;
  return status === "UNVERIFIED" ? "MEDIUM" : "LOW";
}

async function openFinding(
  fleetId: string,
  findingType: string,
  severity: SambaFindingSeverity,
  fact: string,
  decision: ComplianceDecision,
  resultId: string,
  actorId: string | null,
) {
  const existing = await prisma.sambaFinding.findFirst({
    where: { fleetId, findingType, entityType: "Fleet", entityId: fleetId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const unverified = findingType === `${FINDING_PREFIX}UNVERIFIED`;
  const row = await prisma.sambaFinding.create({
    data: {
      fleetId,
      domain: "CARRIER",
      entityType: "Fleet",
      entityId: fleetId,
      findingType,
      severity,
      status: "OPEN",
      provenance: unverified ? "INSUFFICIENT_EVIDENCE" : "VERIFIED_EXTERNAL",
      evidenceSource: "FmcsaMonitoringResult",
      evidenceId: resultId,
      evidenceTimestamp: new Date(),
      liveConnected: !unverified,
      fact,
      recommendation: unverified
        ? "Confirm the carrier's FMCSA status manually and resolve the data gap before relying on monitoring."
        : "Review the carrier's FMCSA record and decide whether loads may be tendered.",
      explanation: decision.reasons.join(" "),
      statements: json([{ class: unverified ? "INFERENCE" : "VERIFIED_EVIDENCE", text: fact, source: "FmcsaMonitoringResult", provenance: unverified ? "UNVERIFIED" : "LIVE", authority: "EXTERNAL" }]),
      evidenceRefs: json([{ source: "FmcsaMonitoringResult", entityType: "FmcsaMonitoringResult", entityId: resultId, provenance: unverified ? "UNVERIFIED" : "LIVE", timestamp: new Date().toISOString() }]),
      whatIsNotVerified: unverified ? decision.reasons.join(" ") : null,
      llmUsed: false,
      createdByUserId: actorId,
    },
    select: { id: true },
  });
  await createAuditRecord({
    actorId,
    tenantId: fleetId,
    action: "CREATED",
    entityType: "SambaFinding",
    entityId: row.id,
    details: { event: "fmcsa.monitoring_finding_opened", findingType, severity, resultId },
    metadata: { source: "fmcsa-monitoring" },
  });
  return { id: row.id, created: true };
}

export type MonitoringRunReport = Awaited<ReturnType<typeof getMonitoringRunReport>>;

export async function runFmcsaMonitoring(
  options: { trigger: FmcsaMonitoringTrigger; actor?: Actor; fleetIds?: string[] },
  deps: MonitoringDeps = {},
) {
  const actor = options.actor ?? null;
  const now = deps.now ?? (() => new Date());

  // Scope: system runs cover all active fleets; user runs only fleets where the user may run.
  let scope: string[] | null = null;
  if (options.trigger === "MANUAL") {
    requireSession(actor);
    const allowed = accessibleFleetIds(actor, MONITORING_RUN_ROLES);
    scope = options.fleetIds?.length ? options.fleetIds.filter((id) => allowed.includes(id)) : allowed;
    if (scope.length === 0) throw httpError(403, "Forbidden", { reason: "NO_MONITORING_ROLE" });
  } else if (options.fleetIds?.length) {
    scope = options.fleetIds;
  }

  const fleets = await prisma.fleet.findMany({
    where: { status: "ACTIVE", ...(scope ? { id: { in: scope } } : {}) },
    select: { id: true, name: true, usdotNumber: true, mcNumber: true },
    orderBy: { name: "asc" },
  });

  const soda = deps.soda ?? createSodaClientFromEnv();
  const qcmobile = deps.qcmobile === undefined ? qcMobileFromEnv() : deps.qcmobile;
  const run = await prisma.fmcsaMonitoringRun.create({
    data: {
      trigger: options.trigger,
      initiatedByUserId: actor?.id ?? null,
      sourcesUsed: json({ qcmobile: Boolean(qcmobile), openData: true }),
    },
  });
  await createAuditRecord({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action: "CREATED",
    entityType: "FmcsaMonitoringRun",
    entityId: run.id,
    details: { event: "fmcsa.monitoring_run_started", trigger: options.trigger, fleets: fleets.length, qcmobile: Boolean(qcmobile) },
    metadata: { source: "fmcsa-monitoring" },
  });

  try {
    const usdots = fleets.map((f) => f.usdotNumber).filter((v): v is string => Boolean(v));
    let schema: OpenDataSchemaValidation | null = null;
    let openData: OpenDataSyncResult | null = null;
    if (usdots.length) {
      schema = await validateOpenDataSchemas(soda, now());
      openData = await fetchOpenDataCarrierProfiles(soda, usdots, schema);
    }
    const schemaIssues = schema
      ? Object.values(schema.datasets).flatMap((d) => (d.trusted ? [] : d.issues.map((issue) => `${d.name}: ${issue}`)))
      : [];

    const counts = { CLEAR: 0, ATTENTION: 0, CRITICAL: 0, UNVERIFIED: 0, NOT_CONFIGURED: 0 } as Record<FmcsaComplianceStatus, number>;
    const exceptions: Array<{ fleetId: string; fleetName: string; status: FmcsaComplianceStatus; reasons: string[] }> = [];
    const qcErrors: Array<{ fleetId: string; errorCode: string | null }> = [];

    for (const fleet of fleets) {
      const usdot = fleet.usdotNumber;
      let qcEvidence: QcMobileEvidence | null = null;
      let qcSnapshotId: string | null = null;
      let odSnapshotId: string | null = null;

      if (usdot) {
        // QCMobile (live) when configured.
        if (qcmobile) {
          const outcome = await qcmobile.lookup({ kind: "USDOT", value: usdot });
          const retrievedAt = outcome.retrievedAt ?? now();
          const profile = outcome.rawCarrier ? qcMobileCarrierProfile(outcome.rawCarrier, retrievedAt) : null;
          const missing = outcome.status === "FOUND" ? missingQcMobileElements(outcome.rawCarrier) : [];
          qcEvidence = { configured: true, outcome: outcome.status, errorCode: outcome.errorCode ?? null, profile, missingElements: missing };
          if (outcome.status === "ERROR" || outcome.status === "UNAVAILABLE") qcErrors.push({ fleetId: fleet.id, errorCode: outcome.errorCode ?? null });
          const snap = await prisma.fmcsaCarrierSnapshot.create({
            data: {
              runId: run.id,
              fleetId: fleet.id,
              usdotNumber: usdot,
              source: "QCMOBILE",
              retrievedAt,
              dataAsOf: retrievedAt,
              schemaValidated: outcome.status === "FOUND" && missing.length === 0,
              complete: outcome.status === "FOUND" && missing.length === 0 && Boolean(profile),
              found: outcome.status === "FOUND",
              missingFields: json(missing),
              profile: profile ? json(profile) : Prisma.JsonNull,
              alerts: json([]),
              errorCode: outcome.errorCode ?? (outcome.status === "NOT_FOUND" ? "NOT_FOUND" : null),
            },
          });
          qcSnapshotId = snap.id;
        } else {
          qcEvidence = { configured: false, outcome: "SKIPPED", profile: null, missingElements: [] };
        }

        // Open data.
        const odProfile = openData?.profiles.find((p) => p.usdot === usdot) ?? null;
        const coverage = openData?.coverage[usdot] ?? null;
        const motusEvidence = openData?.motusEvidence[usdot] ?? null;
        const odEvidence = { schemaTrusted: Boolean(schema?.trusted), schemaIssues, coverage, profile: odProfile, evidenceIssues: motusEvidence?.issues ?? [] };
        const decisionPreview = deriveComplianceStatus({ usdotNumber: usdot, qcmobile: qcEvidence, openData: odEvidence, now: now() });
        const odSnap = await prisma.fmcsaCarrierSnapshot.create({
          data: {
            runId: run.id,
            fleetId: fleet.id,
            usdotNumber: usdot,
            source: "OPEN_DATA",
            retrievedAt: odProfile ? new Date(odProfile.retrievedAt) : now(),
            dataAsOf: oldestLastModified(schema),
            schemaValidated: Boolean(schema?.trusted),
            complete: decisionPreview.openDataComplete,
            found: Boolean(odProfile),
            missingFields: json({
              coverageGaps: coverage ? Object.entries(coverage).filter(([, v]) => v !== "FOUND" && v !== "QUERIED").map(([k, v]) => `${k}:${v}`) : ["no-coverage"],
              motus: motusEvidence,
            }),
            profile: odProfile ? json(odProfile) : Prisma.JsonNull,
            alerts: json([]),
            errorCode: coverage ? null : "NO_COVERAGE",
          },
        });
        odSnapshotId = odSnap.id;

        const decision = deriveComplianceStatus({
          usdotNumber: usdot,
          qcmobile: qcEvidence,
          openData: odEvidence,
          previous: {
            qcmobile: await previousProfileBefore(fleet.id, usdot, "QCMOBILE", run.id),
            openData: await previousProfileBefore(fleet.id, usdot, "OPEN_DATA", run.id),
          },
          now: now(),
        });
        await recordResult(run.id, fleet, decision, qcSnapshotId, odSnapshotId, actor, counts, exceptions);
      } else {
        const decision = deriveComplianceStatus({ usdotNumber: null, qcmobile: null, openData: null });
        await recordResult(run.id, fleet, decision, null, null, actor, counts, exceptions);
      }
    }

    const sourceErrors = [...(openData?.errors ?? []), ...qcErrors.map((e) => ({ dataset: "QCMobile", errorCode: e.errorCode ?? "ERROR", errorMessage: `Fleet ${e.fleetId}` }))];
    const hasExceptions = exceptions.length > 0 || sourceErrors.length > 0 || (schema !== null && !schema.trusted);
    const finished = await prisma.fmcsaMonitoringRun.update({
      where: { id: run.id },
      data: {
        status: hasExceptions ? "COMPLETED_WITH_EXCEPTIONS" : "COMPLETED",
        finishedAt: now(),
        fleetsChecked: fleets.length,
        clearCount: counts.CLEAR,
        attentionCount: counts.ATTENTION,
        criticalCount: counts.CRITICAL,
        unverifiedCount: counts.UNVERIFIED,
        notConfiguredCount: counts.NOT_CONFIGURED,
        schemaValidation: schema ? json(schema) : Prisma.JsonNull,
        sourceErrors: json(sourceErrors),
        exceptions: json(exceptions),
      },
    });
    await createAuditRecord({
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      action: "UPDATED",
      entityType: "FmcsaMonitoringRun",
      entityId: run.id,
      details: { event: "fmcsa.monitoring_run_completed", status: finished.status, counts, schemaTrusted: schema?.trusted ?? null, sourceErrors: sourceErrors.length },
      metadata: { source: "fmcsa-monitoring" },
    });
    return finished;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "unknown error";
    await prisma.fmcsaMonitoringRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: now(), errorMessage: message } });
    await createAuditRecord({
      actorId: actor?.id ?? null,
      action: "UPDATED",
      entityType: "FmcsaMonitoringRun",
      entityId: run.id,
      details: { event: "fmcsa.monitoring_run_failed", error: message },
      metadata: { source: "fmcsa-monitoring" },
    });
    throw error;
  }
}

function oldestLastModified(schema: OpenDataSchemaValidation | null): Date | null {
  if (!schema) return null;
  const dates = Object.values(schema.datasets).map((d) => d.lastModified);
  if (dates.some((d) => d === null)) return null;
  return new Date(Math.min(...dates.map((d) => new Date(d as string).getTime())));
}

async function previousProfileBefore(fleetId: string, usdotNumber: string, source: "QCMOBILE" | "OPEN_DATA", runId: string) {
  const row = await prisma.fmcsaCarrierSnapshot.findFirst({
    where: { fleetId, usdotNumber, source, complete: true, NOT: { runId } },
    orderBy: { retrievedAt: "desc" },
    select: { profile: true },
  });
  return (row?.profile as FmcsaCarrierProfile | null) ?? null;
}

async function recordResult(
  runId: string,
  fleet: { id: string; name: string; usdotNumber: string | null },
  decision: ComplianceDecision,
  qcSnapshotId: string | null,
  odSnapshotId: string | null,
  actor: Actor,
  counts: Record<FmcsaComplianceStatus, number>,
  exceptions: Array<{ fleetId: string; fleetName: string; status: FmcsaComplianceStatus; reasons: string[] }>,
) {
  const result = await prisma.fmcsaMonitoringResult.create({
    data: {
      runId,
      fleetId: fleet.id,
      usdotNumber: fleet.usdotNumber,
      status: decision.status,
      reasons: json(decision.reasons),
      alerts: json(decision.alerts),
      changeAlerts: json(decision.changeAlerts),
      qcmobileSnapshotId: qcSnapshotId,
      openDataSnapshotId: odSnapshotId,
    },
  });
  counts[decision.status] += 1;
  await createAuditRecord({
    actorId: actor?.id ?? null,
    tenantId: fleet.id,
    action: "CREATED",
    entityType: "FmcsaMonitoringResult",
    entityId: result.id,
    details: {
      event: "fmcsa.monitoring_result",
      runId,
      usdotNumber: fleet.usdotNumber,
      status: decision.status,
      alertCodes: decision.alerts.map((a) => a.code),
      changeAlertCodes: decision.changeAlerts.map((a) => a.code),
    },
    metadata: { source: "fmcsa-monitoring" },
  });

  if (decision.status === "CLEAR") return;
  exceptions.push({ fleetId: fleet.id, fleetName: fleet.name, status: decision.status, reasons: decision.reasons });
  if (decision.status === "NOT_CONFIGURED") return;
  const actorId = actor?.id ?? null;
  const significant = [...decision.alerts, ...decision.changeAlerts].filter((a) => a.severity !== "LOW");
  for (const alert of significant) {
    await openFinding(fleet.id, `${FINDING_PREFIX}${alert.code}`, findingSeverity(decision.status, alert), alert.message, decision, result.id, actorId);
  }
  if (decision.status === "UNVERIFIED") {
    await openFinding(
      fleet.id,
      `${FINDING_PREFIX}UNVERIFIED`,
      findingSeverity("UNVERIFIED"),
      `FMCSA compliance for USDOT ${fleet.usdotNumber} could not be verified.`,
      decision,
      result.id,
      actorId,
    );
  }
}

// ── Read models ───────────────────────────────────────────────────────────

export async function getMonitoringOverview(user: SessionUserLike | null | undefined, now: Date = new Date()) {
  requireSession(user);
  const fleetIds = accessibleFleetIds(user);
  const fleets = await prisma.fleet.findMany({
    where: { id: { in: fleetIds } },
    select: { id: true, name: true, status: true, usdotNumber: true, mcNumber: true, carrierIdentityUpdatedAt: true },
    orderBy: { name: "asc" },
  });
  const rows = await Promise.all(
    fleets.map(async (fleet) => {
      const latest = await prisma.fmcsaMonitoringResult.findFirst({
        where: { fleetId: fleet.id },
        orderBy: { evaluatedAt: "desc" },
        select: { id: true, runId: true, status: true, reasons: true, alerts: true, changeAlerts: true, evaluatedAt: true, usdotNumber: true },
      });
      // A result for a different USDOT than the current identity is not evidence for it.
      const applicable = latest && latest.usdotNumber === fleet.usdotNumber ? latest : null;
      const effective = applicable ? effectiveStatus(applicable.status, applicable.evaluatedAt, now) : null;
      const canRun = requireFleetAccess(user, fleet.id, [...MONITORING_RUN_ROLES]).allowed;
      const canEditIdentity = requireFleetAccess(user, fleet.id, [...CARRIER_IDENTITY_EDIT_ROLES]).allowed;
      return {
        fleet,
        canRun,
        canEditIdentity,
        latest: applicable
          ? {
              ...applicable,
              recordedStatus: applicable.status,
              status: effective!.status,
              stale: effective!.stale,
            }
          : null,
        status: !fleet.usdotNumber ? "NOT_CONFIGURED" : effective?.status ?? "UNVERIFIED",
      };
    }),
  );
  const lastRun = await prisma.fmcsaMonitoringRun.findFirst({
    where: { results: { some: { fleetId: { in: fleetIds } } } },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  return {
    fleets: rows,
    lastRun: lastRun ? await getMonitoringRunReport(user, lastRun.id) : null,
    qcmobileConfigured: Boolean(qcMobileFromEnv()),
    scheduling: schedulingState(),
  };
}

export async function getMonitoringRunReport(user: SessionUserLike | null | undefined, runId: string) {
  requireSession(user);
  const fleetIds = accessibleFleetIds(user);
  const run = await prisma.fmcsaMonitoringRun.findUnique({
    where: { id: runId },
    include: {
      results: {
        where: { fleetId: { in: fleetIds } },
        select: { fleetId: true, usdotNumber: true, status: true, reasons: true, alerts: true, changeAlerts: true, evaluatedAt: true, fleet: { select: { name: true } } },
      },
    },
  });
  if (!run || run.results.length === 0) throw httpError(404, "Run not found");
  type Exception = { fleetId: string };
  const exceptions = ((run.exceptions as Exception[] | null) ?? []).filter((e) => fleetIds.includes(e.fleetId));
  return {
    id: run.id,
    trigger: run.trigger,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    sourcesUsed: run.sourcesUsed,
    schemaValidation: run.schemaValidation,
    sourceErrors: run.sourceErrors,
    exceptions,
    results: run.results,
  };
}

/** Scheduled (token) runs are refused in production by code, not only by configuration. */
export function schedulingState(env: Record<string, string | undefined> = process.env) {
  const production = env.VERCEL_ENV === "production";
  const enabled = env.FMCSA_MONITORING_SCHEDULE_ENABLED === "true" && !production;
  return {
    enabled,
    reason: production
      ? "Scheduled monitoring is disabled in production until explicitly enabled in code."
      : enabled
        ? "Scheduled runs accepted with the monitoring token."
        : "Set FMCSA_MONITORING_SCHEDULE_ENABLED=true (non-production only) to accept scheduled runs.",
  };
}
