/**
 * Carrier override validation against master-declared override rules.
 *
 * Pure structural checks returning FamilyIssue objects (empty = valid). Every
 * condition is reported independently under its own stable code; never throws
 * on malformed input (including invalid rule regular expressions).
 */
import type {
  CarrierInstance,
  CarrierOverride,
  MasterDocument,
  OverrideRule,
} from "./types";
import { FAMILY_ISSUE_CODES as C, familyIssue, isBlank } from "./issues";
import type { FamilyIssue, FamilyIssueCode } from "./issues";

export function findOverrideRule(
  rules: readonly OverrideRule[],
  path: string,
): OverrideRule | undefined {
  if (!Array.isArray(rules)) return undefined;
  return rules.find((r) => r !== null && typeof r === "object" && r.path === path);
}

function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

export function validateOverride(
  rule: OverrideRule | undefined,
  override: CarrierOverride,
  subject: string,
): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const err = (code: FamilyIssueCode, message: string): void => {
    issues.push(familyIssue(code, "error", subject, message));
  };

  if (override === null || override === undefined || typeof override !== "object") {
    err(C.overrideInvalid, "override is missing or not an object");
    return issues;
  }

  const path = String((override as { path?: unknown }).path);
  const p = `override "${path}"`;

  if (!rule) {
    err(C.overrideUndeclared, `${p}: no override rule declared on the master`);
  } else {
    if (rule.allowed !== true) {
      err(C.overrideNotAllowed, `${p}: override is not allowed by master rule`);
    }
    if (rule.regulatory === true) {
      err(C.overrideRegulatory, `${p}: regulatory content cannot be overridden`);
    }
  }

  const rationale: unknown = (override as { rationale?: unknown }).rationale;
  if (typeof rationale !== "string" || isBlank(rationale)) {
    err(C.overrideInvalid, `${p}: rationale is required`);
  }

  const value: unknown = (override as { value?: unknown }).value;
  const vt = typeof value;
  if (vt !== "string" && vt !== "number" && vt !== "boolean") {
    err(C.overrideInvalid, `${p}: value must be a string, number or boolean (got ${value === null ? "null" : vt})`);
    return issues;
  }
  if (isNumber(value) && !Number.isFinite(value)) {
    err(C.overrideInvalid, `${p}: numeric value must be finite (got ${String(value)})`);
  }

  const c: unknown = rule?.constraint;
  if (c === undefined || c === null) return issues;
  if (typeof c !== "object") {
    err(C.overrideInvalid, `${p}: rule constraint is not an object`);
    return issues;
  }
  const { min, max, pattern } = c as { min?: unknown; max?: unknown; pattern?: unknown };
  const enumValues: unknown = (c as { enum?: unknown }).enum;

  const hasNumeric = min !== undefined || max !== undefined;
  const hasPattern = pattern !== undefined;

  if (hasNumeric && hasPattern) {
    err(C.overrideInvalid, `${p}: rule constraint mixes numeric bounds and a string pattern`);
  }

  if (hasNumeric) {
    if (min !== undefined && !(isNumber(min) && Number.isFinite(min))) {
      err(C.overrideInvalid, `${p}: rule minimum ${String(min)} is not a finite number`);
    }
    if (max !== undefined && !(isNumber(max) && Number.isFinite(max))) {
      err(C.overrideInvalid, `${p}: rule maximum ${String(max)} is not a finite number`);
    }
    if (!isNumber(value)) {
      err(C.overrideInvalid, `${p}: numeric constraint requires a number value (got ${vt})`);
    } else if (Number.isFinite(value)) {
      if (isNumber(min) && Number.isFinite(min) && value < min) {
        err(C.overrideInvalid, `${p}: value ${value} is below minimum ${min}`);
      }
      if (isNumber(max) && Number.isFinite(max) && value > max) {
        err(C.overrideInvalid, `${p}: value ${value} is above maximum ${max}`);
      }
    }
  }

  if (hasPattern) {
    let re: RegExp | null = null;
    if (typeof pattern !== "string") {
      err(C.overrideInvalid, `${p}: rule pattern is not a string`);
    } else {
      try {
        re = new RegExp(pattern);
      } catch {
        err(C.overrideInvalid, `${p}: rule pattern "${pattern}" is not a valid regular expression`);
      }
    }
    if (typeof value !== "string") {
      err(C.overrideInvalid, `${p}: pattern constraint requires a string value (got ${vt})`);
    } else if (re !== null && !re.test(value)) {
      err(C.overrideInvalid, `${p}: value "${value}" does not match pattern ${String(pattern)}`);
    }
  }

  if (enumValues !== undefined) {
    if (!Array.isArray(enumValues)) {
      err(C.overrideInvalid, `${p}: rule enum is not an array`);
    } else if (typeof value !== "string" && typeof value !== "number") {
      err(C.overrideInvalid, `${p}: enum constraint requires a string or number value (got ${vt})`);
    } else if (!enumValues.includes(value)) {
      err(
        C.overrideInvalid,
        `${p}: value ${JSON.stringify(value)} is not one of ${JSON.stringify(enumValues)}`,
      );
    }
  }

  return issues;
}

export function validateInstanceOverrides(
  master: MasterDocument | null,
  instance: CarrierInstance,
): FamilyIssue[] {
  const base = `${instance.instanceId}@${instance.instanceVersion}`;
  const issues: FamilyIssue[] = [];
  const err = (code: FamilyIssueCode, subject: string, message: string): void => {
    issues.push(familyIssue(code, "error", subject, message));
  };

  const raw: unknown = instance.overrides;
  if (raw === undefined || raw === null) return issues;
  if (!Array.isArray(raw)) {
    err(C.overrideInvalid, base, "instance overrides must be an array");
    return issues;
  }
  const overrides = raw as readonly CarrierOverride[];
  if (overrides.length === 0) return issues;

  const pathOf = (o: CarrierOverride): string =>
    o !== null && typeof o === "object" ? String(o.path) : String(o);

  if (master === null) {
    for (const o of overrides) {
      const path = pathOf(o);
      err(C.overrideNoMaster, `${base}#${path}`, `override "${path}" has no BOF master to override`);
    }
  } else if (instance.masterId !== master.masterId) {
    err(
      C.overrideMasterMismatch,
      base,
      `overrides validated against ${master.masterId} but instance is pinned to ${instance.masterId ?? "no master"}`,
    );
  }

  const seen = new Set<string>();
  for (const o of overrides) {
    const path = pathOf(o);
    const subject = `${base}#${path}`;
    if (seen.has(path)) {
      err(C.overrideDuplicatePath, subject, `duplicate override path "${path}"`);
    }
    seen.add(path);
    if (master === null) {
      // No rules to check against; still report malformed override content.
      for (const issue of validateOverride(undefined, o, subject)) {
        if (issue.code !== C.overrideUndeclared) issues.push(issue);
      }
      continue;
    }
    const rule = findOverrideRule(master.overrideRules, path);
    issues.push(...validateOverride(rule, o, subject));
  }
  return issues;
}

export function listComplianceReviewOverrides(
  master: MasterDocument,
  instance: CarrierInstance,
): CarrierOverride[] {
  const overrides = Array.isArray(instance.overrides) ? instance.overrides : [];
  return overrides.filter(
    (o) =>
      findOverrideRule(master.overrideRules, o.path)
        ?.requiresComplianceReview === true,
  );
}
