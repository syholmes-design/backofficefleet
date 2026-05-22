import type { BofData } from "@/lib/load-bof-data";
import type { IntakeWizardState } from "@/lib/load-requirements-intake-types";
import type { LoadIntakeRecord, LoadIntakeSourceType } from "@/lib/load-requirements-intake-types";
import { normalizeLoadIntakeForm } from "@/lib/load-intake-normalize";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import type { Load } from "@/types/dispatch";

export type CommitIntakeToBofResult = {
  nextData: BofData;
  loadId: string;
  dispatchLoad: Load | undefined;
};

/**
 * Single canonical path: merge normalized intake into `data.loads`, attach proof bundle,
 * and return the dispatch projection row for `upsertLoad`.
 */
export function commitIntakeWizardToBof(
  data: BofData,
  state: IntakeWizardState,
  args: {
    normalizedRecord: LoadIntakeRecord;
    sourceType: LoadIntakeSourceType;
    uploadFileName?: string | null;
    extractionProvider?: string;
    extractionConfidence?: number;
    extractionWarnings?: string[];
    reviewedBy: string;
  }
): CommitIntakeToBofResult {
  const normalized = normalizeLoadIntakeForm(state, data, {
    ...args.normalizedRecord,
    sourceType: args.sourceType,
    sourceDocumentUrl: args.uploadFileName ?? undefined,
    extractionProvider: args.extractionProvider,
    extractionConfidence: args.extractionConfidence,
    extractionWarnings: args.extractionWarnings,
    reviewedAt: new Date().toISOString(),
    reviewedBy: args.reviewedBy,
  });
  const nextData = structuredClone(data);
  const existingIdx = nextData.loads.findIndex((l) => l.id === normalized.bofLoad.id);
  if (existingIdx >= 0) nextData.loads[existingIdx] = normalized.bofLoad;
  else nextData.loads.push(normalized.bofLoad);
  nextData.loadProofBundles = {
    ...(nextData.loadProofBundles || {}),
    [normalized.canonical.loadId]: normalized.loadProofBundle,
  };
  const dispatchLoad = buildDispatchLoadsFromBofData(nextData).find(
    (l) => l.load_id === normalized.canonical.loadId
  );
  return { nextData, loadId: normalized.canonical.loadId, dispatchLoad };
}
