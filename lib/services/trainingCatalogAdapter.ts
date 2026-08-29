import { BOF_TRAINING_LIBRARY } from "@/lib/bof-training-library";

/**
 * Converts the existing static catalog into import payloads for TrainingModule.
 * This is an adapter, not a second training system; assignments and completion
 * state remain durable Prisma records after import.
 */
export function buildTrainingModuleImportPayloads() {
  return BOF_TRAINING_LIBRARY.map((module) => ({
    id: module.trainingId,
    ownership: module.ownership === "FMCSA" ? "FMCSA_OFFICIAL" as const : "BOF_INTERNAL" as const,
    title: module.title,
    category: module.category,
    description: module.description,
    audience: module.audience,
    keywords: [module.category, module.fmcsaTopic, module.bofPolicyTopic].filter((value): value is string => Boolean(value)),
    learningObjective: module.completionRequirements.join("; "),
    resourceUrl: module.resourceUrl,
    resourceLabel: module.resourceLabel,
    required: module.required,
    version: module.version,
    effectiveDate: new Date(module.effectiveDate),
  }));
}

export function buildTrainingSegmentImportPayloads() {
  return BOF_TRAINING_LIBRARY.flatMap((module) => (module.knowledgeCheck ?? []).map((check, index) => ({
    id: `${module.trainingId}:knowledge-check:${index + 1}`,
    trainingModuleId: module.trainingId,
    title: `Knowledge check ${index + 1}`,
    summary: check.question,
    chapter: "Knowledge check",
  })));
}
