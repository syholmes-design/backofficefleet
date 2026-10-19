import type { RecruitingV2DocumentGateEvaluation } from "@/lib/recruiting-v2/document-gate-engine";

/**
 * Candidate screening against the approved requisition's own requirements.
 *
 * The requisition (lib/recruiting/requisition-fields.ts) is the single definition of the job's
 * requirements; screening reads it directly instead of keeping a second copy on the position.
 * Document-backed requirements use the existing Recruiting V2 document gates, so a requirement is
 * met only when its document gate is SATISFIED. Pure: shared by the signed-in workspace and the
 * public demonstration.
 */

export type RequisitionScreeningSource = {
  cdlClass?: string | null;
  endorsements?: string | null;
  experienceRequirements?: string | null;
  mvrSafetyRequirements?: string | null;
  equipmentType?: string | null;
  pspRequired?: boolean | null;
  clearinghouseRequired?: boolean | null;
  medicalRequired?: boolean | null;
  drugTestingRequired?: boolean | null;
  backgroundCheckRequired?: boolean | null;
  tsaRequired?: boolean | null;
};

export type CandidateScreeningProfile = {
  cdlClass: string;
  experienceYears: number | null;
  endorsements: string[];
  equipmentExperience: string | null;
  /** Recruiter confirmations for requirements no BOF document type covers (PSP, drug test, TSA, equipment). */
  confirmations: Record<string, { confirmedBy: string; confirmedAt: string; notes?: string | null }>;
};

export type ScreeningStatus = "MET" | "NOT_MET" | "PENDING_DOCUMENT" | "RECRUITER_CONFIRMATION";

export type ScreeningResult = {
  key: string;
  label: string;
  requirement: string;
  candidateValue: string;
  status: ScreeningStatus;
  evidence: string;
  /** Hard requirements fail screening when NOT_MET; the others hold it pending. */
  hard: boolean;
};

export type ScreeningEvaluation = {
  status: "PASS" | "FAIL" | "PENDING";
  results: ScreeningResult[];
  blocking: string[];
  pending: string[];
};

/** Requirements recruiters confirm by hand because no candidate document type records them. */
export const CONFIRMATION_REQUIREMENTS = ["psp", "drug-testing", "tsa", "equipment-experience"] as const;

function normalizeCdlClass(value: string | null | undefined) {
  const match = String(value ?? "").toUpperCase().match(/\b(?:CLASS\s*)?([ABC])\b/);
  return match ? match[1] : "";
}

function firstNumber(value: string | null | undefined) {
  const match = String(value ?? "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

/** Endorsements the requisition requires (items marked "preferred" or "none" are not required). */
export function requiredEndorsements(value: string | null | undefined): string[] {
  const text = String(value ?? "").trim();
  if (!text || /^none\b/i.test(text)) return [];
  return text
    .split(/[,;/]|\band\b/i)
    .map((part) => part.trim())
    .filter((part) => part && !/preferred|optional|none/i.test(part));
}

function documentRequirement(
  key: string,
  label: string,
  requirement: string,
  documentType: string,
  gates: RecruitingV2DocumentGateEvaluation[],
): ScreeningResult {
  const gate = gates.find((item) => item.documentType === documentType);
  // The gate engine blocks a missing document too; only a document actually on file (rejected or
  // expired) fails the requirement. A missing one is still pending collection.
  const onFile = Boolean(gate?.latestDocument);
  const status: ScreeningStatus =
    gate?.gateState === "SATISFIED" ? "MET" : gate?.gateState === "BLOCKED" && onFile ? "NOT_MET" : "PENDING_DOCUMENT";
  return {
    key,
    label,
    requirement,
    candidateValue: gate ? `${gate.label} document: ${String(gate.documentStatus).replace(/_/g, " ").toLowerCase()}` : "No document on file",
    status,
    evidence: gate ? `${gate.label} document gate: ${gate.reason}` : `${label} document not collected`,
    hard: status === "NOT_MET",
  };
}

function confirmationRequirement(
  key: (typeof CONFIRMATION_REQUIREMENTS)[number],
  label: string,
  requirement: string,
  candidate: CandidateScreeningProfile,
): ScreeningResult {
  const confirmation = candidate.confirmations[key];
  return {
    key,
    label,
    requirement,
    candidateValue: confirmation ? `Confirmed by ${confirmation.confirmedBy}` : "Not yet confirmed",
    status: confirmation ? "MET" : "RECRUITER_CONFIRMATION",
    evidence: confirmation
      ? `Recruiter confirmation ${confirmation.confirmedAt.slice(0, 10)}${confirmation.notes ? `: ${confirmation.notes}` : ""}`
      : "No BOF document type records this requirement; the recruiter confirms it from the source report.",
    hard: false,
  };
}

export function evaluateRequisitionScreening(args: {
  requisition: RequisitionScreeningSource;
  candidate: CandidateScreeningProfile;
  documentGates: RecruitingV2DocumentGateEvaluation[];
}): ScreeningEvaluation {
  const { requisition: req, candidate, documentGates } = args;
  const results: ScreeningResult[] = [];

  const requiredClass = normalizeCdlClass(req.cdlClass);
  if (requiredClass) {
    const candidateClass = normalizeCdlClass(candidate.cdlClass);
    const rank = { A: 3, B: 2, C: 1 } as Record<string, number>;
    const met = Boolean(candidateClass) && (rank[candidateClass] ?? 0) >= (rank[requiredClass] ?? 0);
    results.push({
      key: "cdl-class",
      label: "CDL class",
      requirement: `Class ${requiredClass}`,
      candidateValue: candidateClass ? `Class ${candidateClass}` : "Not provided",
      status: met ? "MET" : "NOT_MET",
      evidence: "Candidate application CDL class compared with the requisition",
      hard: true,
    });
    results.push(documentRequirement("cdl-document", "CDL verification", "Verified CDL on file", "CDL", documentGates));
  }

  const endorsements = requiredEndorsements(req.endorsements);
  if (endorsements.length) {
    const held = candidate.endorsements.map((item) => item.toLowerCase());
    const missing = endorsements.filter((item) => !held.some((h) => h.includes(item.toLowerCase()) || item.toLowerCase().includes(h)));
    results.push({
      key: "endorsements",
      label: "Endorsements",
      requirement: endorsements.join(", "),
      candidateValue: candidate.endorsements.length ? candidate.endorsements.join(", ") : "None listed",
      status: missing.length ? "NOT_MET" : "MET",
      evidence: missing.length ? `Missing: ${missing.join(", ")}` : "All required endorsements listed on the application",
      hard: true,
    });
  }

  const minimumYears = firstNumber(req.experienceRequirements);
  if (minimumYears !== null) {
    const years = candidate.experienceYears;
    results.push({
      key: "experience",
      label: "Experience",
      requirement: String(req.experienceRequirements),
      candidateValue: years === null ? "Not provided" : `${years} years`,
      status: years === null ? "RECRUITER_CONFIRMATION" : years >= minimumYears ? "MET" : "NOT_MET",
      evidence: years === null ? "Experience not stated on the application" : `Candidate ${years} years vs required ${minimumYears}`,
      hard: years !== null && years < minimumYears,
    });
  }

  results.push(
    documentRequirement("mvr", "MVR / safety record", req.mvrSafetyRequirements?.trim() || "Motor vehicle record reviewed", "MVR", documentGates),
  );
  if (req.medicalRequired) results.push(documentRequirement("medical", "DOT medical certificate", "Current medical examiner's certificate", "MEDICAL", documentGates));
  if (req.clearinghouseRequired) results.push(documentRequirement("clearinghouse", "Clearinghouse", "FMCSA Drug & Alcohol Clearinghouse query", "CLEARINGHOUSE", documentGates));
  if (req.backgroundCheckRequired) {
    results.push(documentRequirement("employment-verification", "Employment / background verification", "Prior-employer verification", "EMPLOYMENT_VERIFICATION", documentGates));
  }
  if (req.drugTestingRequired) results.push(confirmationRequirement("drug-testing", "Pre-employment drug test", "Negative pre-employment drug test result", candidate));
  if (req.pspRequired) results.push(confirmationRequirement("psp", "PSP report", "Pre-Employment Screening Program report reviewed", candidate));
  if (req.tsaRequired) results.push(confirmationRequirement("tsa", "TSA / TWIC", "TSA credential confirmed", candidate));
  if (req.equipmentType?.trim()) {
    const item = confirmationRequirement("equipment-experience", "Equipment experience", req.equipmentType.trim(), candidate);
    if (!candidate.confirmations["equipment-experience"] && candidate.equipmentExperience) item.candidateValue = candidate.equipmentExperience;
    results.push(item);
  }

  const blocking = results.filter((item) => item.status === "NOT_MET").map((item) => `${item.label}: ${item.evidence}`);
  const pending = results
    .filter((item) => item.status === "PENDING_DOCUMENT" || item.status === "RECRUITER_CONFIRMATION")
    .map((item) => `${item.label}: ${item.status === "PENDING_DOCUMENT" ? "document pending" : "recruiter confirmation needed"}`);
  const hardFailure = results.some((item) => item.status === "NOT_MET" && item.hard);
  return { status: hardFailure ? "FAIL" : blocking.length || pending.length ? "PENDING" : "PASS", results, blocking, pending };
}

/** The application-stage screen (before documents): only the hard application facts must be met. */
export function applicationScreenPasses(evaluation: ScreeningEvaluation) {
  return !evaluation.results.some((item) => item.hard && item.status === "NOT_MET");
}
