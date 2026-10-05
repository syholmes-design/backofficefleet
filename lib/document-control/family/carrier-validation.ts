/**
 * Carrier profile fact validation for the BOF document family graph.
 *
 * Validates carrier identity (id format/uniqueness, fleet reference uniqueness)
 * and the status/value/candidate consistency of every CarrierFact field.
 *
 * Never resolves a conflict and never invents a value: CONFLICTING and
 * NOT_RECORDED facts are reported as warnings, and a fact that is not RECORDED
 * must never carry a resolved value (see resolveCarrierFactValue).
 *
 * Never throws on malformed input; malformed shapes become issues.
 */
import { familyIssue, FAMILY_ISSUE_CODES, isBlank, type FamilyIssue } from "./issues";
import { isCarrierId } from "./ids";
import { CARRIER_FACT_STATUSES, type CarrierProfile } from "./types";

export const CARRIER_FACT_FIELDS = [
  "legalName",
  "dba",
  "logoRef",
  "address",
  "usdot",
  "mc",
  "contacts",
  "approvalAuthority",
  "localCodePrefix",
] as const;

export type CarrierFactField = (typeof CARRIER_FACT_FIELDS)[number];

/**
 * Fields where an empty-string CONFLICTING candidate is a legitimate observed
 * value rather than a blank. For localCodePrefix, "" records an observed
 * UNPREFIXED carrier-local code (e.g. Delta's HR-PAY-001 alongside DAT-*
 * codes). It remains a candidate only and never becomes a resolved value.
 * Whitespace-only candidates are still invalid for these fields.
 */
export const EMPTY_STRING_CANDIDATE_FIELDS: readonly CarrierFactField[] = ["localCodePrefix"];

const C = FAMILY_ISSUE_CODES;

function normalizeRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.toLowerCase();
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return isBlank(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function describe(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json.length > 80 ? `${json.slice(0, 77)}...` : json;
  } catch {
    return String(value);
  }
}

function validateUniqueRef(
  carriers: readonly CarrierProfile[],
  pick: (carrier: CarrierProfile) => unknown,
  code: typeof C.carrierFleetSlugUnique | typeof C.carrierFleetIdUnique,
  label: string,
  issues: FamilyIssue[],
): void {
  const seen = new Map<string, string>();
  for (const carrier of carriers) {
    const carrierId = String(carrier?.carrierId ?? "");
    let raw: unknown;
    try {
      raw = pick(carrier);
    } catch {
      raw = null;
    }
    const key = normalizeRef(raw);
    if (key === null) continue;
    const first = seen.get(key);
    if (first !== undefined) {
      issues.push(
        familyIssue(
          code,
          "error",
          carrierId,
          `Carrier "${carrierId}" has ${label} "${String(raw).trim()}", already used by carrier "${first}".`,
        ),
      );
    } else {
      seen.set(key, carrierId);
    }
  }
}

function validateFact(
  carrierId: string,
  field: CarrierFactField,
  fact: unknown,
  issues: FamilyIssue[],
): void {
  const subject = `${carrierId}.${field}`;

  if (fact === null || typeof fact !== "object" || Array.isArray(fact)) {
    issues.push(
      familyIssue(C.carrierFactCandidatesInvalid, "error", subject, `Fact "${field}" is missing or not an object.`),
    );
    return;
  }

  const { value, status, conflictingValues } = fact as {
    value?: unknown;
    status?: unknown;
    conflictingValues?: unknown;
  };

  if (typeof status !== "string" || !(CARRIER_FACT_STATUSES as readonly string[]).includes(status)) {
    issues.push(
      familyIssue(
        C.carrierFactCandidatesInvalid,
        "error",
        subject,
        `Fact "${field}" has invalid status ${describe(status)}; expected one of ${CARRIER_FACT_STATUSES.join(", ")}.`,
      ),
    );
    return;
  }

  // Value vs status.
  if (status === "RECORDED") {
    if (isEmptyValue(value)) {
      issues.push(
        familyIssue(
          C.carrierFactRecordedWithoutValue,
          "error",
          subject,
          `Fact "${field}" is RECORDED but its value is null, blank or empty.`,
        ),
      );
    }
  } else if (value !== null) {
    issues.push(
      familyIssue(
        C.carrierFactValueWithoutRecorded,
        "error",
        subject,
        `Fact "${field}" is ${status} but carries value ${describe(value)}; only RECORDED facts may have a value.`,
      ),
    );
  }

  // Candidates.
  if (conflictingValues !== undefined && !Array.isArray(conflictingValues)) {
    issues.push(
      familyIssue(C.carrierFactCandidatesInvalid, "error", subject, `Fact "${field}" conflictingValues is not an array.`),
    );
  } else {
    const candidates: unknown[] = Array.isArray(conflictingValues) ? conflictingValues : [];
    if (status !== "CONFLICTING") {
      if (candidates.length > 0) {
        issues.push(
          familyIssue(
            C.carrierFactCandidatesInvalid,
            "error",
            subject,
            `Fact "${field}" is ${status} but lists ${candidates.length} conflicting candidate(s); candidates are only allowed on CONFLICTING facts.`,
          ),
        );
      }
    } else {
      if (candidates.length < 2) {
        issues.push(
          familyIssue(
            C.carrierFactCandidatesInvalid,
            "error",
            subject,
            `Fact "${field}" is CONFLICTING but has ${candidates.length} candidate(s); at least 2 are required.`,
          ),
        );
      }
      const allowEmpty = EMPTY_STRING_CANDIDATE_FIELDS.includes(field);
      candidates.forEach((candidate, index) => {
        if (candidate === null || typeof candidate !== "object" || !("value" in candidate)) {
          issues.push(
            familyIssue(
              C.carrierFactCandidatesInvalid,
              "error",
              subject,
              `Fact "${field}" candidate #${index} is malformed (expected { value, source }).`,
            ),
          );
          return;
        }
        const candidateValue = (candidate as { value: unknown }).value;
        const invalid =
          candidateValue === null ||
          candidateValue === undefined ||
          (typeof candidateValue === "string" &&
            isBlank(candidateValue) &&
            !(allowEmpty && candidateValue === ""));
        if (invalid) {
          issues.push(
            familyIssue(
              C.carrierFactCandidatesInvalid,
              "error",
              subject,
              `Fact "${field}" candidate #${index} has a null or blank value ${describe(candidateValue)}.`,
            ),
          );
        }
      });
    }
  }

  // Informational.
  if (status === "CONFLICTING") {
    issues.push(
      familyIssue(C.carrierFactConflicting, "warning", subject, `Fact "${field}" is CONFLICTING across sources; unresolved.`),
    );
  } else if (status === "NOT_RECORDED") {
    issues.push(familyIssue(C.carrierFactNotRecorded, "warning", subject, `Fact "${field}" is NOT_RECORDED.`));
  }
}

export function validateCarrierProfiles(carriers: readonly CarrierProfile[]): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const list: readonly CarrierProfile[] = Array.isArray(carriers) ? carriers : [];

  const seenIds = new Set<string>();
  for (const carrier of list) {
    const rawId: unknown = (carrier as { carrierId?: unknown } | null)?.carrierId;
    const carrierId = typeof rawId === "string" ? rawId : String(rawId);
    if (typeof rawId !== "string" || !isCarrierId(rawId)) {
      issues.push(
        familyIssue(C.carrierIdFormat, "error", carrierId, `Carrier id ${describe(rawId)} is not a lowercase kebab-case slug.`),
      );
    }
    if (seenIds.has(carrierId)) {
      issues.push(familyIssue(C.carrierIdUnique, "error", carrierId, `Carrier id "${carrierId}" is declared more than once.`));
    }
    seenIds.add(carrierId);
  }

  validateUniqueRef(list, (c) => c.fleetRef?.fleetSlug, C.carrierFleetSlugUnique, "fleetRef.fleetSlug", issues);
  validateUniqueRef(list, (c) => c.fleetRef?.fleetId, C.carrierFleetIdUnique, "fleetRef.fleetId", issues);

  for (const carrier of list) {
    if (carrier === null || typeof carrier !== "object") continue;
    const carrierId = String(carrier.carrierId);
    for (const field of CARRIER_FACT_FIELDS) {
      validateFact(carrierId, field, (carrier as Record<string, unknown>)[field], issues);
    }
  }

  return issues;
}
