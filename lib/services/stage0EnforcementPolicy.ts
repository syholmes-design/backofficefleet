import type { Prisma, Stage0EnforcementMode } from "@prisma/client";

/**
 * Stage 0 D-2 — movement enforcement policy (docs/stage0/STAGE0-D2-ENFORCEMENT-POLICY.md, approved with
 * safeguards). This module decides two things and nothing else:
 *
 *  1. which enforcement mode applies to a fleet (ENFORCE is the fail-safe default), and
 *  2. whether a denied movement authorization could be permitted in OBSERVE mode.
 *
 * It never changes the authoritative (shadow) authorization result. Every caller keeps using `result.allowed`;
 * `enforcement.effectiveAllowed` is recorded next to it as evidence.
 *
 * SOFT OVERRIDES ARE NOT ACTIVE. The approved rule permits OBSERVE to pass only an administrative
 * PENDING_COMPLIANCE deficiency when every mandatory qualification is independently verified and current.
 * The authoritative evaluator's reason codes cannot establish that: the PENDING_COMPLIANCE codes mix mandatory
 * credential gaps (`*_MISSING`, `*_UNVERIFIED`, `*_NOT_COMPLIANCE_VERIFIED`, `*_NOT_RECORDED`, `WORK_HISTORY_*`)
 * with legacy codes (`MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `MANUAL_REVIEW_REQUIRED`,
 * `DRUG_TEST_PENDING`) that are raised for mandatory and non-mandatory evidence alike and carry no category.
 * The allowlist below is therefore empty, so effective === shadow in every mode until the evaluator reports an
 * explicit per-finding classification and that classification is separately certified.
 */

export const STAGE0_ENFORCEMENT_POLICY_VERSION = "bof-stage0-enforcement-v1" as const;

export type EnforcementStage = "PLANNING_RESERVE" | "RELEASE" | "PICKUP_ISSUE" | "PICKUP_VERIFY";

export type EnforcementModeSource =
  /** A fleet-scoped setting written by authorized BOF personnel. */
  | "FLEET_SETTING"
  /** BOF_STAGE0_MOVEMENT_ENFORCEMENT in a non-production environment. */
  | "PLATFORM_ENV"
  /** Configuration missing, invalid or unavailable. */
  | "FAIL_SAFE_DEFAULT"
  /** Production or an environment not explicitly declared non-production: ENFORCE regardless of configuration. */
  | "PRODUCTION_LOCK";

export type EnforcementResolution = {
  mode: Stage0EnforcementMode;
  source: EnforcementModeSource;
  settingId: string | null;
  configuredByUserId: string | null;
  /** Why the mode is what it is (never contains secrets). */
  detail: string;
};

export type EnforcementDecision = {
  mode: Stage0EnforcementMode;
  modeSource: EnforcementModeSource;
  policyVersion: typeof STAGE0_ENFORCEMENT_POLICY_VERSION;
  /** The authoritative result, unchanged. */
  shadowAllowed: boolean;
  /** What the mutating workflow may rely on. Equal to shadowAllowed unless an enumerated soft override applies. */
  effectiveAllowed: boolean;
  overridden: boolean;
  /** Reason codes that were overridden (empty unless overridden). */
  overriddenReasonCodes: string[];
  /** Why no override applied, for denials in OBSERVE mode. */
  overrideRefusal: string | null;
  settingId: string | null;
  configuredByUserId: string | null;
};

/** Environments in which OBSERVE may ever be honored. Anything else (including unset) is treated as production. */
const OBSERVE_CAPABLE_ENVIRONMENT_CLASSES = new Set(["LOCAL", "TEST", "STAGING"]);

/**
 * Production OBSERVE is not enabled by this implementation. Enabling it requires a separately certified change
 * (D-2 safeguard 10) after staging verification and operational approval; an environment variable cannot do it.
 */
const PRODUCTION_OBSERVE_PERMITTED = false as const;

type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

export type ObserveAvailability = { allowed: boolean; reason: string };

/** Whether this process may honor OBSERVE at all. Fail-safe: only an explicitly declared non-production class. */
export function observeAvailability(env: EnvironmentVariables = process.env): ObserveAvailability {
  if (PRODUCTION_OBSERVE_PERMITTED) {
    return { allowed: true, reason: "production observe permitted" };
  }
  const environmentClass = env.BOF_STAGE0_ENVIRONMENT_CLASS?.trim().toUpperCase();
  if (!environmentClass) {
    return { allowed: false, reason: "BOF_STAGE0_ENVIRONMENT_CLASS is not declared; treated as production" };
  }
  if (!OBSERVE_CAPABLE_ENVIRONMENT_CLASSES.has(environmentClass)) {
    return { allowed: false, reason: `environment class ${environmentClass} is not observe-capable` };
  }
  if (env.VERCEL_ENV === "production") {
    return { allowed: false, reason: "VERCEL_ENV=production overrides the declared environment class" };
  }
  return { allowed: true, reason: `environment class ${environmentClass}` };
}

export type PlatformModeRead = { mode: Stage0EnforcementMode; valid: boolean };

export function readPlatformMode(env: EnvironmentVariables = process.env): PlatformModeRead {
  const raw = env.BOF_STAGE0_MOVEMENT_ENFORCEMENT?.trim().toUpperCase();
  if (raw === "OBSERVE") return { mode: "OBSERVE", valid: true };
  if (raw === "ENFORCE") return { mode: "ENFORCE", valid: true };
  return { mode: "ENFORCE", valid: raw === undefined || raw === "" };
}

/**
 * Reads the fleet setting inside a savepoint so a failed read (for example a missing table) cannot abort the
 * caller's movement transaction; the caller treats a failure as ENFORCE.
 */
async function readFleetSetting(tx: Prisma.TransactionClient, fleetId: string) {
  await tx.$executeRaw`SAVEPOINT stage0_enforcement_read`;
  try {
    const setting = await tx.stage0EnforcementSetting.findUnique({
      where: { fleetId },
      select: { id: true, mode: true, configuredByUserId: true },
    });
    await tx.$executeRaw`RELEASE SAVEPOINT stage0_enforcement_read`;
    return setting;
  } catch (error) {
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT stage0_enforcement_read`;
    throw error;
  }
}

const enforce = (source: EnforcementModeSource, detail: string): EnforcementResolution => ({
  mode: "ENFORCE",
  source,
  settingId: null,
  configuredByUserId: null,
  detail,
});

/**
 * Precedence: production lock → fleet setting → platform default → fail-safe ENFORCE. Never throws: any failure
 * resolves to ENFORCE. In a locked environment no database read happens, so production behavior is unchanged.
 */
export async function resolveStage0EnforcementMode(
  tx: Prisma.TransactionClient,
  fleetId: string,
  env: EnvironmentVariables = process.env,
): Promise<EnforcementResolution> {
  try {
    const availability = observeAvailability(env);
    if (!availability.allowed) return enforce("PRODUCTION_LOCK", availability.reason);

    const platform = readPlatformMode(env);
    if (!platform.valid) return enforce("FAIL_SAFE_DEFAULT", "BOF_STAGE0_MOVEMENT_ENFORCEMENT is invalid");

    const setting = await readFleetSetting(tx, fleetId);
    if (setting) {
      return {
        mode: setting.mode,
        source: "FLEET_SETTING",
        settingId: setting.id,
        configuredByUserId: setting.configuredByUserId,
        detail: "fleet setting",
      };
    }
    return {
      mode: platform.mode,
      source: env.BOF_STAGE0_MOVEMENT_ENFORCEMENT?.trim() ? "PLATFORM_ENV" : "FAIL_SAFE_DEFAULT",
      settingId: null,
      configuredByUserId: null,
      detail: env.BOF_STAGE0_MOVEMENT_ENFORCEMENT?.trim() ? "platform default" : "no configuration",
    };
  } catch {
    return enforce("FAIL_SAFE_DEFAULT", "enforcement configuration unavailable");
  }
}

export type SoftOverridePolicy = {
  /** Stages at which an explicit soft denial may be permitted in OBSERVE. PICKUP_VERIFY is never overridable. */
  stages: ReadonlySet<EnforcementStage>;
  /** Explicitly enumerated soft-policy reason codes. A denial is soft only if EVERY reason code is listed. */
  softReasonCodes: ReadonlySet<string>;
};

/**
 * The approved soft class (administrative PENDING_COMPLIANCE with all mandatory qualifications verified and
 * current) cannot be identified from the evaluator's output, so nothing is enumerated. UNAVAILABLE equipment
 * (decision 7.3), incomplete pre-trip and every other reason code stay hard by omission.
 */
export const SOFT_OVERRIDE_POLICY: SoftOverridePolicy = {
  stages: new Set<EnforcementStage>(["PLANNING_RESERVE", "RELEASE"]),
  softReasonCodes: new Set<string>(),
};

export type ShadowResult = {
  allowed: boolean;
  reasonCodes: readonly string[];
  driverQualificationStatus: string | null;
};

/**
 * Pure. Decides whether the shadow result may be overridden. ENFORCE and PICKUP_VERIFY never override; an
 * allowed shadow result is passed through; empty, unknown, mixed or unclassified reason codes are hard.
 */
export function decideEffectiveAuthorization(input: {
  stage: EnforcementStage;
  shadow: ShadowResult;
  resolution: EnforcementResolution;
  policy?: SoftOverridePolicy;
}): EnforcementDecision {
  const { stage, shadow, resolution } = input;
  const policy = input.policy ?? SOFT_OVERRIDE_POLICY;
  const base = {
    mode: resolution.mode,
    modeSource: resolution.source,
    policyVersion: STAGE0_ENFORCEMENT_POLICY_VERSION,
    shadowAllowed: shadow.allowed,
    settingId: resolution.settingId,
    configuredByUserId: resolution.configuredByUserId,
  };
  const keep = (refusal: string | null): EnforcementDecision => ({
    ...base,
    effectiveAllowed: shadow.allowed,
    overridden: false,
    overriddenReasonCodes: [],
    overrideRefusal: shadow.allowed ? null : refusal,
  });

  if (shadow.allowed) return keep(null);
  if (resolution.mode !== "OBSERVE") return keep("mode is ENFORCE");
  if (stage === "PICKUP_VERIFY") return keep("pickup release is never overridden without an approved exception policy");
  if (!policy.stages.has(stage)) return keep(`stage ${stage} is not overridable`);
  const codes = [...new Set(shadow.reasonCodes)];
  if (codes.length === 0) return keep("denial has no reason codes");
  if (shadow.driverQualificationStatus !== "PENDING_COMPLIANCE") {
    return keep("only a PENDING_COMPLIANCE driver denial can be soft");
  }
  const hard = codes.filter((code) => !policy.softReasonCodes.has(code));
  if (hard.length > 0) return keep(`hard or unclassified reason codes: ${hard.join(", ")}`);
  return {
    ...base,
    effectiveAllowed: true,
    overridden: true,
    overriddenReasonCodes: codes,
    overrideRefusal: null,
  };
}

/** Fields persisted next to a decision (DispatchAssignment / DispatchRelease). */
export function enforcementColumns(decision: EnforcementDecision) {
  return {
    enforcementMode: decision.mode,
    shadowAllowed: decision.shadowAllowed,
    effectiveAllowed: decision.effectiveAllowed,
    enforcementOverridden: decision.overridden,
    enforcementPolicyVersion: decision.policyVersion,
    enforcementMetadata: {
      modeSource: decision.modeSource,
      settingId: decision.settingId,
      configuredByUserId: decision.configuredByUserId,
      overriddenReasonCodes: decision.overriddenReasonCodes,
      overrideRefusal: decision.overrideRefusal,
    } as Prisma.InputJsonValue,
  };
}

/** Compact, structured evidence for audit details. */
export function enforcementAuditSummary(decision: EnforcementDecision) {
  return {
    mode: decision.mode,
    modeSource: decision.modeSource,
    policyVersion: decision.policyVersion,
    shadowAllowed: decision.shadowAllowed,
    effectiveAllowed: decision.effectiveAllowed,
    overridden: decision.overridden,
    overriddenReasonCodes: decision.overriddenReasonCodes,
    overrideRefusal: decision.overrideRefusal,
    settingId: decision.settingId,
  };
}
