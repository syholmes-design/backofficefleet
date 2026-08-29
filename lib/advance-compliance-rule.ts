export type ComplianceTriggerKind = "EXPIRATION" | "DUE_DATE" | "EVENT" | "SCHEDULE" | "CONDITION";

export type ComplianceTriggerSource = {
  expirationDate?: Date | string | null;
  dueDate?: Date | string | null;
  occurredAt?: Date | string | null;
  scheduledAt?: Date | string | null;
  conditionMet?: boolean;
};

export type AdvanceCompliancePolicy = {
  requirementType: string;
  triggerKind: ComplianceTriggerKind;
  authoritativeDateSource: string;
  authoritativeCollection?: "medicalQualifications" | "licenses" | "drugTests";
  requirementLabel: string;
  defaultAdvanceWindowDays: number;
  requiredAction: string;
  windowSource: "current-repository-default" | "configurable-demo-default";
};

export const ADVANCE_COMPLIANCE_POLICIES: Record<string, AdvanceCompliancePolicy> = {
  MEDICAL: {
    requirementType: "MEDICAL",
    triggerKind: "EXPIRATION",
    authoritativeDateSource: "MedicalQualification.expirationDate",
    authoritativeCollection: "medicalQualifications",
    requirementLabel: "Medical Card renewal",
    defaultAdvanceWindowDays: 60,
    requiredAction: "Affirm the required medical examination has been scheduled.",
    windowSource: "configurable-demo-default",
  },
  DRIVER_LICENSE: {
    requirementType: "DRIVER_LICENSE",
    triggerKind: "EXPIRATION",
    authoritativeDateSource: "DriverLicense.expirationDate",
    authoritativeCollection: "licenses",
    requirementLabel: "CDL renewal",
    defaultAdvanceWindowDays: 60,
    requiredAction: "Confirm the renewal action is scheduled and evidence is ready.",
    windowSource: "configurable-demo-default",
  },
  DRUG_TEST: {
    requirementType: "DRUG_TEST",
    triggerKind: "DUE_DATE",
    authoritativeDateSource: "DriverIntakeRequirement.dueDate",
    requirementLabel: "Pre-employment Drug & Alcohol testing",
    defaultAdvanceWindowDays: 0,
    requiredAction: "Confirm required pre-employment Drug & Alcohol testing and provide verified evidence.",
    windowSource: "configurable-demo-default",
  },
};

export function getAdvanceCompliancePolicy(requirementType: string | null | undefined): AdvanceCompliancePolicy | null {
  return ADVANCE_COMPLIANCE_POLICIES[(requirementType ?? "").toUpperCase()] ?? null;
}

export function getConfiguredAdvanceWindowDays(
  requirementType: string | null | undefined,
  explicitAdvanceWindowDays?: number | null,
): number {
  if (typeof explicitAdvanceWindowDays === "number" && Number.isFinite(explicitAdvanceWindowDays) && explicitAdvanceWindowDays > 0) {
    return explicitAdvanceWindowDays;
  }

  const normalizedType = (requirementType ?? "MEDICAL").toUpperCase();
  const policy = getAdvanceCompliancePolicy(normalizedType);
  return policy?.defaultAdvanceWindowDays ?? 60;
}

export function buildTriggerDate(
  expirationDate?: Date | string | null,
  advanceWindowDays?: number | null,
  requirementType?: string | null,
): Date | null {
  if (!expirationDate) {
    return null;
  }

  const date = expirationDate instanceof Date ? expirationDate : new Date(expirationDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const windowDays = getConfiguredAdvanceWindowDays(requirementType ?? "MEDICAL", advanceWindowDays);
  const triggerDate = new Date(date);
  triggerDate.setDate(triggerDate.getDate() - windowDays);
  return triggerDate;
}

function parseTriggerDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function evaluateComplianceTrigger(
  policy: AdvanceCompliancePolicy,
  source: ComplianceTriggerSource,
  now = new Date(),
): { triggerAt: Date | null; isTriggered: boolean; requiredAction: string } {
  const sourceDate =
    policy.triggerKind === "EXPIRATION"
      ? parseTriggerDate(source.expirationDate)
      : policy.triggerKind === "DUE_DATE"
        ? parseTriggerDate(source.dueDate)
        : policy.triggerKind === "EVENT"
          ? parseTriggerDate(source.occurredAt)
          : policy.triggerKind === "SCHEDULE"
            ? parseTriggerDate(source.scheduledAt)
            : null;
  const triggerAt =
    policy.triggerKind === "EXPIRATION" || (policy.triggerKind === "DUE_DATE" && policy.defaultAdvanceWindowDays > 0)
      ? buildTriggerDate(sourceDate, policy.defaultAdvanceWindowDays, policy.requirementType)
      : sourceDate;

  return {
    triggerAt,
    isTriggered: policy.triggerKind === "CONDITION" ? source.conditionMet === true : Boolean(triggerAt && triggerAt <= now),
    requiredAction: policy.requiredAction,
  };
}

export function evaluateAdvanceComplianceTrigger(
  requirementType: string | null | undefined,
  expirationDate?: Date | string | null,
  advanceWindowDays?: number | null,
  now = new Date(),
): { triggerDate: Date | null; isTriggered: boolean; requiredAction: string } {
  const policy = getAdvanceCompliancePolicy(requirementType);
  if (!policy) {
    return { triggerDate: null, isTriggered: false, requiredAction: "Review the requirement-specific action." };
  }
  const trigger = evaluateComplianceTrigger(
    { ...policy, defaultAdvanceWindowDays: getConfiguredAdvanceWindowDays(requirementType, advanceWindowDays) },
    { expirationDate },
    now,
  );

  return {
    triggerDate: trigger.triggerAt,
    isTriggered: trigger.isTriggered,
    requiredAction: trigger.requiredAction,
  };
}
