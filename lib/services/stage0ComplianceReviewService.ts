import type { Prisma, PrismaClient } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import {
  buildDriverQualificationEvidenceInventory,
  type DriverEvidenceRecord,
} from "@/lib/services/driverQualificationEvidenceInventoryService";
import { loadDriverQualificationProvenance } from "@/lib/services/driverQualificationProvenanceService";
import {
  PROVENANCE_CONTRACT_VERSION,
  type FindingProvenance,
  type ItemProvenance,
  type SourceRef,
} from "@/lib/services/qualificationFindingProvenance";
import {
  KNOWN_REGISTRY_GAPS,
  type QualificationEvidenceState,
} from "@/lib/services/qualificationEvidenceClassification";
import { prisma } from "@/lib/prisma";

/**
 * Stage 0 D-1 PR 3A: read-only compliance review and export for BOF compliance personnel.
 *
 * Composes the certified PR 1 inventory and PR 2 provenance modules; it adds no qualification logic. The unchanged
 * authoritative evaluator remains the only source of qualification status. The review never creates, changes or
 * feeds a movement decision, a D-2 override or an invalidation, and an authorized review performs no database write.
 * (A refused request writes the same ACCESS_DENIED audit record the other Stage 0 BOF services write.)
 *
 * Authorization: an ACTIVE BOF_COMPLIANCE_REVIEW membership in the requested fleet, read from the database for an
 * ACTIVE user (never from session-claimed roles) and re-read inside the review's read-only transaction. Carrier
 * users, dispatchers, drivers, BOF_OPERATIONS and members of other fleets are refused. No new role is introduced.
 */

export const COMPLIANCE_REVIEW_SCHEMA_VERSION = "bof-stage0-d1-compliance-review-v1" as const;
export const COMPLIANCE_REVIEW_ROLE_CODES: ReadonlySet<string> = new Set(["BOF_COMPLIANCE_REVIEW"]);
/** A fleet-wide review above this many drivers must be narrowed with driverId. */
export const COMPLIANCE_REVIEW_MAX_DRIVERS = 1000;

export type SessionUserLike = { id?: string | null; email?: string | null };

export type RequirementReviewStatus =
  | "VERIFIED"
  | "INCOMPLETE_VERIFICATION_PROVENANCE"
  | "MISSING_EVIDENCE"
  | "EXPIRED_EVIDENCE"
  | "REJECTED_EVIDENCE"
  | "PENDING_VERIFICATION"
  | "CONFLICTING_EVIDENCE"
  | "UNKNOWN_EVALUATION_INCOMPLETE";

export type EvidenceBasis = "AUTHORITATIVE_RULE" | "REPLAY_ATTRIBUTED_INFERENCE" | "UNATTRIBUTED";

export type ReviewSourceRef = Pick<SourceRef, "kind" | "id" | "status" | "timestamps" | "origin" | "fleetMatchesDriver"> & {
  /** A secure reference only: resolve it through the authenticated document service. No file name, key or URL is exported. */
  evidenceReference: { kind: SourceRef["kind"]; id: string };
  verificationStatus: string | null;
  verifiedByUserId: string | null;
  certifiedByUserId: string | null;
  verificationSources: Array<{ id: string; providerName: string; verificationMethod: string; verificationStatus: string; isCertifiedProvider: boolean; verifiedAt: string | null }>;
};

export type ReviewRequirement = {
  requirementId: string;
  modeled: true;
  reviewStatus: RequirementReviewStatus;
  evidenceState: QualificationEvidenceState;
  provenanceState: ItemProvenance["provenanceState"];
  provisionalCitation: string;
  sources: ReviewSourceRef[];
};

export type ReviewFinding = {
  code: string;
  category: FindingProvenance["category"];
  classificationReason: FindingProvenance["classificationReason"];
  classificationEstablished: boolean;
  evidenceState: QualificationEvidenceState;
  evidenceBasis: EvidenceBasis;
  requirementId: string | null;
  sourceEvidence: FindingProvenance["sourceEvidence"];
  relatedRegistryRequirementHint: string | null;
  sources: ReviewSourceRef[];
};

export type ComplianceReviewDriver = {
  driverId: string;
  driverStatus: string;
  fleetId: string;
  /** From the unchanged authoritative evaluator. */
  authoritativeQualificationStatus: string;
  evaluationCompleted: boolean;
  /** True when the inventory and provenance passes disagreed (should never happen; reported, not hidden). */
  evaluationInconsistent: boolean;
  intakeCount: number;
  priorCertificationContradicted: boolean;
  crossFleetEvidenceRows: number;
  requirements: ReviewRequirement[];
  findings: ReviewFinding[];
  unclassifiedFindings: string[];
  conflicts: Array<{ evidenceKey: string; kind: string }>;
  employmentHistory: {
    evidenceState: QualificationEvidenceState;
    provenanceState: ItemProvenance["provenanceState"];
    activeRecordCount: number;
    limitations: string[];
  };
  /** Never a statement of full compliance. */
  complianceStatement: "NOT_A_FULL_COMPLIANCE_DETERMINATION";
};

export type ComplianceReview = {
  schemaVersion: typeof COMPLIANCE_REVIEW_SCHEMA_VERSION;
  provenanceContractVersion: typeof PROVENANCE_CONTRACT_VERSION;
  fleetId: string;
  scope: "FLEET" | "DRIVER";
  /** Evaluation timestamp: when the review was computed. */
  evaluatedAt: string;
  readOnly: true;
  regulatoryCompleteness: "NOT_ESTABLISHED";
  authorizesMovement: false;
  enablesSoftOverride: false;
  administrativeClassificationActive: false;
  legend: Record<string, string>;
  /** Regulatory requirements BOF's qualification model does not currently evaluate. */
  notModeledRequirements: Array<{ id: string; description: string; reference: string; status: "NOT_MODELED" }>;
  summary: {
    drivers: number;
    byAuthoritativeStatus: Record<string, number>;
    byRequirementReviewStatus: Record<string, Record<RequirementReviewStatus, number>>;
    driversWithUnclassifiedFindings: number;
    driversWithConflicts: number;
    driversWithPriorCertificationContradiction: number;
  };
  drivers: ComplianceReviewDriver[];
};

const REVIEW_STATUSES: readonly RequirementReviewStatus[] = [
  "VERIFIED", "INCOMPLETE_VERIFICATION_PROVENANCE", "MISSING_EVIDENCE", "EXPIRED_EVIDENCE", "REJECTED_EVIDENCE",
  "PENDING_VERIFICATION", "CONFLICTING_EVIDENCE", "UNKNOWN_EVALUATION_INCOMPLETE",
];

const LEGEND: Record<string, string> = {
  VERIFIED: "Evidence is current and verification provenance (verifier and time) is recorded. Not a statement of full compliance.",
  INCOMPLETE_VERIFICATION_PROVENANCE: "Evidence is accepted as current but the verifier or verification time is not recorded.",
  MISSING_EVIDENCE: "No record supports the requirement.",
  CONFLICTING_EVIDENCE: "Records contradict each other or belong to another fleet; never treated as verified.",
  AUTHORITATIVE_RULE: "The finding comes from the registry or an evaluator rule; the cited records are recorded facts.",
  REPLAY_ATTRIBUTED_INFERENCE: "A legacy finding attributed to a record by re-running the legacy rule on that record alone; an inference, not a classification.",
  UNATTRIBUTED: "The record behind the finding could not be established.",
  NOT_MODELED: "A regulatory requirement BOF does not currently evaluate.",
  classificationEstablished: "false for every UNCLASSIFIED finding; no administrative mapping is approved.",
};

const EMPLOYMENT_LIMITATIONS = [
  "Employment history is evaluated against a three-year lookback; the applicable period (the 10-year CMV employment record on the application and the three-year safety-performance-history investigation) is not established.",
  "Work-history rows carry no verifier or verification time, so this requirement cannot reach VERIFIED provenance with the current data model.",
  "The 30-day gap threshold is a BOF internal review flag, not a regulatory threshold.",
];

function reviewStatus(item: ItemProvenance): RequirementReviewStatus {
  if (item.evidenceState === "UNKNOWN") return "UNKNOWN_EVALUATION_INCOMPLETE";
  if (item.evidenceState === "CONFLICTING" || item.provenanceState === "CONFLICTING") return "CONFLICTING_EVIDENCE";
  // No record supports the item (for example the evaluator returned only a context code): absence of a finding is
  // not evidence, so this is missing evidence, never "verified" or "incomplete provenance".
  if (item.provenanceState === "MISSING" && item.evidenceState === "VERIFIED_CURRENT") return "MISSING_EVIDENCE";
  switch (item.evidenceState) {
    case "VERIFIED_CURRENT":
      return item.provenanceState === "VERIFIED" ? "VERIFIED" : "INCOMPLETE_VERIFICATION_PROVENANCE";
    case "MISSING":
      return "MISSING_EVIDENCE";
    case "EXPIRED":
      return "EXPIRED_EVIDENCE";
    case "REJECTED":
      return "REJECTED_EVIDENCE";
    default:
      return "PENDING_VERIFICATION";
  }
}

/** Keeps only what a reviewer needs: ids, statuses, verifier ids and timestamps. No file name, storage key, checksum or URL. */
function reviewSource(source: SourceRef): ReviewSourceRef {
  return {
    kind: source.kind,
    id: source.id,
    status: source.status,
    timestamps: source.timestamps,
    origin: source.origin,
    fleetMatchesDriver: source.fleetMatchesDriver,
    evidenceReference: { kind: source.kind, id: source.id },
    verificationStatus: source.verification?.verificationStatus ?? null,
    verifiedByUserId: source.verification?.verifiedByUserId ?? null,
    certifiedByUserId: source.verification?.certifiedByUserId ?? null,
    verificationSources: (source.verification?.verificationSources ?? []).map((v) => ({
      id: v.id, providerName: v.providerName, verificationMethod: v.verificationMethod,
      verificationStatus: v.verificationStatus, isCertifiedProvider: v.isCertifiedProvider, verifiedAt: v.verifiedAt,
    })),
  };
}

const basisOf = (finding: FindingProvenance): EvidenceBasis =>
  finding.attribution === "AUTHORITATIVE_MAPPING" ? "AUTHORITATIVE_RULE" : finding.attribution === "RULE_REPLAY" ? "REPLAY_ATTRIBUTED_INFERENCE" : "UNATTRIBUTED";

/** Pure: composes one driver's review from the PR 1 inventory record and the PR 2 provenance report. */
export function composeDriverReview(
  record: DriverEvidenceRecord,
  provenance: Awaited<ReturnType<typeof loadDriverQualificationProvenance>>,
): ComplianceReviewDriver {
  const items = provenance.provenance.items;
  const employment = items.find((item) => item.requirementId === "EMPLOYMENT_HISTORY");
  const findings = provenance.provenance.findings;
  const limitations = [...EMPLOYMENT_LIMITATIONS];
  if (findings.some((finding) => finding.code === "WORK_HISTORY_GAP_REVIEW_REQUIRED")) {
    limitations.push("A gap longer than the internal review threshold was found; it is a documented-review flag, not a determination.");
  }
  return {
    driverId: record.driverId,
    driverStatus: record.driverStatus,
    fleetId: record.affiliation.fleetId,
    authoritativeQualificationStatus: provenance.qualificationStatus,
    evaluationCompleted: provenance.evaluationCompleted,
    evaluationInconsistent: record.qualificationStatus !== provenance.qualificationStatus,
    intakeCount: record.intakeCount,
    priorCertificationContradicted: record.priorCertificationContradicted,
    crossFleetEvidenceRows: record.crossFleetEvidenceRows,
    requirements: items.map((item) => ({
      requirementId: item.requirementId,
      modeled: true as const,
      reviewStatus: reviewStatus(item),
      evidenceState: item.evidenceState,
      provenanceState: item.provenanceState,
      provisionalCitation: item.provisionalCitation,
      sources: item.sources.map(reviewSource),
    })),
    findings: findings.map((finding) => ({
      code: finding.code,
      category: finding.category,
      classificationReason: finding.classificationReason,
      classificationEstablished: finding.category !== "UNCLASSIFIED",
      evidenceState: finding.evidenceState,
      evidenceBasis: basisOf(finding),
      requirementId: finding.requirementId,
      sourceEvidence: finding.sourceEvidence,
      relatedRegistryRequirementHint: finding.relatedRegistryRequirementHint,
      sources: finding.sources.map(reviewSource),
    })),
    unclassifiedFindings: findings.filter((finding) => finding.category === "UNCLASSIFIED").map((finding) => finding.code),
    conflicts: provenance.provenance.conflicts.map((conflict) => ({ evidenceKey: conflict.evidenceKey, kind: conflict.kind })),
    employmentHistory: {
      evidenceState: employment?.evidenceState ?? "UNKNOWN",
      provenanceState: employment?.provenanceState ?? "MISSING",
      activeRecordCount: employment?.sources.length ?? 0,
      limitations,
    },
    complianceStatement: "NOT_A_FULL_COMPLIANCE_DETERMINATION",
  };
}

async function reviewerRole(db: Prisma.TransactionClient | PrismaClient, userId: string, fleetId: string) {
  const membership = await db.fleetMembership.findFirst({
    where: { userId, fleetId, status: "ACTIVE", user: { status: "ACTIVE" } },
    select: { role: { select: { code: true } } },
  });
  return membership?.role.code ?? null;
}

async function refuse(user: SessionUserLike | null | undefined, fleetId: string, reason: string, client: PrismaClient): Promise<never> {
  try {
    // The audit tenant must be a real fleet; an unknown id is recorded in the details instead.
    const fleet = await client.fleet.findUnique({ where: { id: fleetId }, select: { id: true } });
    await createAuditRecord({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      tenantId: fleet?.id ?? null,
      action: "ACCESS_DENIED",
      entityType: "Stage0ComplianceReview",
      entityId: fleet?.id ?? null,
      details: { event: "stage0.compliance_review_access_denied", reason, ...(fleet ? {} : { requestedFleetId: fleetId.slice(0, 64) }) },
      metadata: { source: "stage0-compliance-review" },
    });
  } catch {
    // A failure to record the refusal never turns a refusal into access.
  }
  throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
}

export type ComplianceReviewOptions = { driverId?: string; asOf?: Date };

/**
 * Builds the review. Throws 401 without a session, 403 (audited) without ACTIVE BOF_COMPLIANCE_REVIEW membership in
 * the fleet, 404 for a driver outside the fleet, 422 when a fleet-wide review exceeds the driver cap.
 */
export async function buildComplianceReview(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  options: ComplianceReviewOptions = {},
  client: PrismaClient = prisma,
): Promise<ComplianceReview> {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const requestedFleet = fleetId?.trim() ?? "";
  if (!requestedFleet) throw Object.assign(new Error("fleetId is required"), { statusCode: 422 });
  const userId = sessionUser.id;

  const role = await reviewerRole(client, userId, requestedFleet);
  if (!role || !COMPLIANCE_REVIEW_ROLE_CODES.has(role)) {
    return refuse(sessionUser, requestedFleet, role ? "ROLE_NOT_PERMITTED" : "NO_ACTIVE_FLEET_MEMBERSHIP", client);
  }

  return client.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      // Re-read inside the snapshot so a membership revoked meanwhile cannot be used.
      const again = await reviewerRole(tx, userId, requestedFleet);
      if (!again || !COMPLIANCE_REVIEW_ROLE_CODES.has(again)) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

      const asOf = options.asOf ?? new Date();
      const fleet = await tx.fleet.findUnique({ where: { id: requestedFleet }, select: { id: true } });
      if (!fleet) throw Object.assign(new Error("Fleet not found"), { statusCode: 404 });

      let driverIds: string[];
      if (options.driverId) {
        const found = await tx.driver.findFirst({ where: { id: options.driverId, fleetId: requestedFleet }, select: { id: true } });
        if (!found) throw Object.assign(new Error("Driver not found in this fleet"), { statusCode: 404 });
        driverIds = [found.id];
      } else {
        const count = await tx.driver.count({ where: { fleetId: requestedFleet } });
        if (count > COMPLIANCE_REVIEW_MAX_DRIVERS) {
          throw Object.assign(new Error(`Fleet has ${count} drivers; narrow the review with driverId`), { statusCode: 422 });
        }
        driverIds = [];
      }

      const inventory = await buildDriverQualificationEvidenceInventory(tx, {
        fleetId: requestedFleet,
        includeDrivers: true,
        asOf,
        ...(options.driverId ? { driverIds } : {}),
      });
      const drivers: ComplianceReviewDriver[] = [];
      for (const record of inventory.drivers ?? []) {
        const provenance = await loadDriverQualificationProvenance(tx, record.driverId, requestedFleet, asOf);
        drivers.push(composeDriverReview(record, provenance));
      }
      drivers.sort((a, b) => a.driverId.localeCompare(b.driverId));

      const byAuthoritativeStatus: Record<string, number> = {};
      const byRequirement: Record<string, Record<RequirementReviewStatus, number>> = {};
      for (const driver of drivers) {
        byAuthoritativeStatus[driver.authoritativeQualificationStatus] = (byAuthoritativeStatus[driver.authoritativeQualificationStatus] ?? 0) + 1;
        for (const requirement of driver.requirements) {
          byRequirement[requirement.requirementId] ??= Object.fromEntries(REVIEW_STATUSES.map((status) => [status, 0])) as Record<RequirementReviewStatus, number>;
          byRequirement[requirement.requirementId][requirement.reviewStatus] += 1;
        }
      }
      const sorted = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

      return {
        schemaVersion: COMPLIANCE_REVIEW_SCHEMA_VERSION,
        provenanceContractVersion: PROVENANCE_CONTRACT_VERSION,
        fleetId: requestedFleet,
        scope: options.driverId ? "DRIVER" : "FLEET",
        evaluatedAt: asOf.toISOString(),
        readOnly: true,
        regulatoryCompleteness: "NOT_ESTABLISHED",
        authorizesMovement: false,
        enablesSoftOverride: false,
        administrativeClassificationActive: false,
        legend: LEGEND,
        notModeledRequirements: KNOWN_REGISTRY_GAPS.map((gap) => ({ id: gap.id, description: gap.description, reference: gap.reference, status: "NOT_MODELED" as const })),
        summary: {
          drivers: drivers.length,
          byAuthoritativeStatus: sorted(byAuthoritativeStatus),
          byRequirementReviewStatus: sorted(byRequirement),
          driversWithUnclassifiedFindings: drivers.filter((d) => d.unclassifiedFindings.length > 0).length,
          driversWithConflicts: drivers.filter((d) => d.conflicts.length > 0 || d.requirements.some((r) => r.reviewStatus === "CONFLICTING_EVIDENCE")).length,
          driversWithPriorCertificationContradiction: drivers.filter((d) => d.priorCertificationContradicted).length,
        },
        drivers,
      };
    },
    { isolationLevel: "RepeatableRead", maxWait: 10_000, timeout: 300_000 },
  );
}

// ---------------------------------------------------------------- CSV

/** Neutralizes spreadsheet formula injection and quotes every cell. */
function cell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** One row per (driver, requirement) and per (driver, finding), plus the not-modeled list. Same data as the JSON. */
export function complianceReviewToCsv(review: ComplianceReview): string {
  const header = ["fleetId", "driverId", "rowType", "id", "authoritativeStatus", "reviewStatus", "evidenceState", "provenanceState", "category", "evidenceBasis", "classificationReason", "sourceCount", "sourceReferences", "evaluatedAt"];
  const lines = [header.map(cell).join(",")];
  for (const driver of review.drivers) {
    for (const r of driver.requirements) {
      lines.push([review.fleetId, driver.driverId, "REQUIREMENT", r.requirementId, driver.authoritativeQualificationStatus, r.reviewStatus, r.evidenceState, r.provenanceState, "", "", "", r.sources.length, r.sources.map((s) => `${s.kind}:${s.id}`).join(" "), review.evaluatedAt].map(cell).join(","));
    }
    for (const f of driver.findings) {
      lines.push([review.fleetId, driver.driverId, "FINDING", f.code, driver.authoritativeQualificationStatus, "", f.evidenceState, "", f.category, f.evidenceBasis, f.classificationReason, f.sources.length, f.sources.map((s) => `${s.kind}:${s.id}`).join(" "), review.evaluatedAt].map(cell).join(","));
    }
  }
  for (const gap of review.notModeledRequirements) {
    lines.push([review.fleetId, "", "NOT_MODELED", gap.id, "", "NOT_MODELED", "", "", "", "", "", 0, "", review.evaluatedAt].map(cell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------- request handling (used by the route)

export type ComplianceReviewResponse = { status: number; contentType: string; body: string };

export async function handleComplianceReviewRequest(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  query: { driverId?: string | null; format?: string | null },
  client: PrismaClient = prisma,
): Promise<ComplianceReviewResponse> {
  const format = (query.format ?? "json").toLowerCase();
  if (format !== "json" && format !== "csv") {
    return { status: 422, contentType: "application/json", body: JSON.stringify({ error: "format must be json or csv" }) };
  }
  try {
    const review = await buildComplianceReview(sessionUser, fleetId, { driverId: query.driverId?.trim() || undefined }, client);
    return format === "csv"
      ? { status: 200, contentType: "text/csv; charset=utf-8", body: complianceReviewToCsv(review) }
      : { status: 200, contentType: "application/json", body: JSON.stringify(review) };
  } catch (error) {
    const status = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;
    const controlled = new Set([401, 403, 404, 422]);
    const message = controlled.has(status) && error instanceof Error ? error.message : "Internal server error";
    return { status: controlled.has(status) ? status : 500, contentType: "application/json", body: JSON.stringify({ error: message }) };
  }
}
