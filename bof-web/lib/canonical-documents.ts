/** Canonical Delta Advanced Trucking master services agreement (MSA). */
export const CANONICAL_DELTA_MSA_URL =
  "/generated/agreements/DAT-MSA-001/delta-advanced-trucking-master-services-agreement.pdf";

export const CANONICAL_DELTA_MSA_LABEL =
  "Delta Advanced Trucking, Inc. Master Services Agreement";

export const CANONICAL_DELTA_MSA_SHORT_LABEL = "Master Services Agreement";

const PER_LOAD_MASTER_AGREEMENT_HTML =
  /^\/generated\/loads\/L\d{3}\/master-agreement-reference\.html$/i;

/** Legacy per-load HTML reference pages — not used as the visible MSA link. */
export function isPerLoadMasterAgreementHtmlPath(url: string | undefined | null): boolean {
  const raw = String(url ?? "").trim();
  if (!raw.length) return false;
  return PER_LOAD_MASTER_AGREEMENT_HTML.test(raw);
}

/** Resolves any MSA / master-agreement candidate to the canonical PDF URL. */
export function resolveCanonicalMsaUrl(candidate?: string | null): string {
  const raw = String(candidate ?? "").trim();
  if (!raw.length || isPerLoadMasterAgreementHtmlPath(raw)) {
    return CANONICAL_DELTA_MSA_URL;
  }
  if (raw === CANONICAL_DELTA_MSA_URL || raw.endsWith("delta-advanced-trucking-master-services-agreement.pdf")) {
    return CANONICAL_DELTA_MSA_URL;
  }
  return CANONICAL_DELTA_MSA_URL;
}

/** Featured / legacy cabinet IDs that map to the canonical dispatch MSA registry entry. */
export const OPERATIONS_FILE_CABINET_MSA_ALIASES: Record<string, string> = {
  "contract-master-agreement": "dispatch-master-agreement-sample",
};

export function resolveOperationsFileCabinetId(id: string): string {
  return OPERATIONS_FILE_CABINET_MSA_ALIASES[id] ?? id;
}
