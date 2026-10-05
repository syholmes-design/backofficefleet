/**
 * Provenance validation for BOF masters and carrier instances.
 *
 * Pure functions returning structured FamilyIssue objects (empty = valid).
 * Every condition is reported independently under its own stable code; never
 * throws on malformed input.
 *
 * Graph-dependent checks (derived target / target version existence) live in
 * ./versioning.
 */
import { PROVENANCE_ORIGINS, SOURCE_REF_KINDS } from "./types";
import type { Provenance, ProvenanceOrigin } from "./types";
import { parseInstanceId } from "./ids";
import { FAMILY_ISSUE_CODES as C, familyIssue, isBlank } from "./issues";
import type { FamilyIssue, FamilyIssueCode } from "./issues";

export function isProvenanceOrigin(v: unknown): v is ProvenanceOrigin {
  return (
    typeof v === "string" &&
    (PROVENANCE_ORIGINS as readonly string[]).includes(v)
  );
}

function isSourceRefKind(v: unknown): boolean {
  return (
    typeof v === "string" && (SOURCE_REF_KINDS as readonly string[]).includes(v)
  );
}

export function validateProvenance(
  p: Provenance,
  subject: string,
): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const err = (code: FamilyIssueCode, message: string): void => {
    issues.push(familyIssue(code, "error", subject, message));
  };

  if (p === null || p === undefined || typeof p !== "object") {
    err(C.provenanceInvalid, "provenance is missing or not an object");
    return issues;
  }

  const raw = p as unknown as Record<string, unknown>;
  const origin = raw.origin;
  if (!isProvenanceOrigin(origin)) {
    err(C.provenanceOriginInvalid, `provenance origin "${String(origin)}" is not valid`);
  }

  const refs: readonly unknown[] | null = Array.isArray(raw.sourceRefs)
    ? (raw.sourceRefs as unknown[])
    : null;
  if (refs === null) {
    err(C.provenanceSourceRefInvalid, "provenance sourceRefs must be an array");
  } else {
    refs.forEach((r, i) => {
      if (r === null || typeof r !== "object") {
        err(C.provenanceSourceRefInvalid, `provenance sourceRefs[${i}] is not an object`);
        return;
      }
      const ref = r as { kind?: unknown; ref?: unknown };
      if (!isSourceRefKind(ref.kind)) {
        err(
          C.provenanceSourceRefInvalid,
          `provenance sourceRefs[${i}] kind "${String(ref.kind)}" is not valid`,
        );
      }
      if (typeof ref.ref !== "string" || isBlank(ref.ref)) {
        err(C.provenanceSourceRefInvalid, `provenance sourceRefs[${i}] ref is empty`);
      }
    });
  }

  if (origin === "CARRIER_ORIGINATED" && (refs === null || refs.length === 0)) {
    err(
      C.provenanceCarrierOriginatedNoSources,
      "CARRIER_ORIGINATED provenance requires at least one sourceRef",
    );
  }

  const target = raw.derivedFromInstanceId;
  const version = raw.derivedFromInstanceVersion;

  if (origin === "DERIVED_FROM_INSTANCE") {
    if (typeof target !== "string" || isBlank(target)) {
      err(
        C.provenanceDerivedMissingTarget,
        "DERIVED_FROM_INSTANCE provenance requires derivedFromInstanceId",
      );
    } else if (!parseInstanceId(target)) {
      err(
        C.provenanceDerivedMissingTarget,
        `derivedFromInstanceId "${target}" is not a valid instance id`,
      );
    }
    if (typeof version !== "string" || isBlank(version)) {
      err(
        C.provenanceDerivedMissingVersion,
        "DERIVED_FROM_INSTANCE provenance requires a non-blank derivedFromInstanceVersion",
      );
    }
  } else {
    if (target !== undefined && target !== null) {
      err(
        C.provenanceDerivedUnexpectedTarget,
        `derivedFromInstanceId must only be set when origin is DERIVED_FROM_INSTANCE (origin is ${String(origin)})`,
      );
    }
    if (version !== undefined && version !== null) {
      err(
        C.provenanceDerivedUnexpectedTarget,
        `derivedFromInstanceVersion must only be set when origin is DERIVED_FROM_INSTANCE (origin is ${String(origin)})`,
      );
    }
  }

  return issues;
}
