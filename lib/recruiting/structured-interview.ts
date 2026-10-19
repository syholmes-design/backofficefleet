/**
 * Structured driver interview (NEW, 2026-10-19).
 *
 * No historical interview questionnaire or scoring rubric exists anywhere in this repository's
 * history (docs/recovery/MICHAEL-ANDERSON-VERIFICATION-2026-10-19.md). This questionnaire is new
 * functionality added inside the approved Recruiting & Onboarding workspace. It records questions,
 * responses, recruiter notes and a category evaluation, and the recruiter's recommendation is stored
 * on the existing Interview record (RecruitingV2Recommendation), which the qualification engine
 * already uses to gate the offer. It deliberately produces no numeric score: the recruiter decides,
 * and the guidance below only flags evaluations that conflict with the chosen recommendation.
 */

export type InterviewEvaluation = "MEETS" | "MEETS_WITH_CONDITIONS" | "CONCERN" | "NOT_ASSESSED";

export type InterviewRecommendation = "ADVANCE" | "ADVANCE_WITH_CONDITIONS" | "HOLD_FOR_REVIEW" | "DO_NOT_ADVANCE";

export type InterviewCategoryDefinition = {
  key: string;
  label: string;
  questions: string[];
  /** Concerns in these categories should not lead to an unconditional proceed. */
  safetyCritical?: boolean;
  optional?: boolean;
};

export const STRUCTURED_INTERVIEW_CATEGORIES: InterviewCategoryDefinition[] = [
  {
    key: "driving-experience",
    label: "Driving experience",
    questions: ["How many years of verifiable tractor-trailer experience do you have, and in what operations?", "What does a typical week of driving look like for you now?"],
  },
  {
    key: "equipment-experience",
    label: "Equipment experience",
    questions: ["Which tractors and trailer types have you operated (dry van, reefer, flatbed, tanker)?", "Describe how you handle a pre-trip inspection on this equipment."],
  },
  {
    key: "lane-experience",
    label: "Lane / route experience",
    questions: ["Which lanes and regions have you run regularly?", "How do you plan fuel, parking and HOS on an unfamiliar lane?"],
  },
  {
    key: "safety-history",
    label: "Safety history",
    questions: ["Have you had any preventable accidents, violations or out-of-service events in the last three years?", "Tell me about a time you refused or delayed a load for safety reasons."],
    safetyCritical: true,
  },
  {
    key: "employment-history",
    label: "Employment history",
    questions: ["Walk me through your last three driving employers and why each position ended.", "Are there gaps in employment we should understand for verification?"],
    safetyCritical: true,
  },
  {
    key: "availability",
    label: "Availability",
    questions: ["When can you start, and do you have notice to give?", "Any planned time off in the first 90 days?"],
  },
  {
    key: "scheduling",
    label: "Scheduling requirements",
    questions: ["What home-time pattern do you need?", "Can you work the schedule and nights away this position requires?"],
  },
  {
    key: "compensation",
    label: "Compensation expectations",
    questions: ["What pay structure and rate are you expecting?", "How do you compare this offer with your current pay and benefits?"],
  },
  {
    key: "communication",
    label: "Communication",
    questions: ["How do you keep dispatch informed when a load is running late?", "How do you prefer to receive load and pay information?"],
  },
  {
    key: "reliability",
    label: "Reliability",
    questions: ["How do you make sure appointments and paperwork (BOL, POD, logs) are completed on time?", "Can references confirm attendance and on-time performance?"],
  },
  {
    key: "qualification-concerns",
    label: "Qualification concerns",
    questions: ["Is there anything in your MVR, medical card, Clearinghouse or PSP record we should know before verification?", "Any endorsements or restrictions that affect this position?"],
    safetyCritical: true,
  },
  {
    key: "recruiter-observations",
    label: "Recruiter observations",
    questions: ["Overall observations, strengths and follow-up items."],
    optional: true,
  },
];

export const INTERVIEW_RECOMMENDATIONS: Array<{ value: InterviewRecommendation; label: string; meaning: string }> = [
  { value: "ADVANCE", label: "Proceed", meaning: "Candidate advances to qualification completion and offer." },
  { value: "ADVANCE_WITH_CONDITIONS", label: "Proceed with conditions", meaning: "Candidate advances; the recorded conditions follow into the offer and onboarding." },
  { value: "HOLD_FOR_REVIEW", label: "Hold / review", meaning: "Offer is blocked until the hold is resolved." },
  { value: "DO_NOT_ADVANCE", label: "Do not proceed", meaning: "Offer is blocked; record a candidate disposition." },
];

export type InterviewCategoryResponse = {
  key: string;
  responses: string[];
  evaluation: InterviewEvaluation;
  notes: string;
};

export type StructuredInterviewRecord = {
  version: "bof-structured-interview-v1";
  categories: InterviewCategoryResponse[];
  recommendation: InterviewRecommendation;
  conditions: string;
  decisionNotes: string;
  interviewer: string;
  completedAt: string;
};

export function emptyInterviewResponses(): InterviewCategoryResponse[] {
  return STRUCTURED_INTERVIEW_CATEGORIES.map((category) => ({
    key: category.key,
    responses: category.questions.map(() => ""),
    evaluation: "NOT_ASSESSED",
    notes: "",
  }));
}

/** Decision-support notes: evaluations that conflict with the chosen recommendation. */
export function interviewGuidance(categories: InterviewCategoryResponse[], recommendation: InterviewRecommendation | null): string[] {
  const notes: string[] = [];
  const byKey = new Map(categories.map((item) => [item.key, item]));
  const concerns = STRUCTURED_INTERVIEW_CATEGORIES.filter((def) => byKey.get(def.key)?.evaluation === "CONCERN");
  const conditional = STRUCTURED_INTERVIEW_CATEGORIES.filter((def) => byKey.get(def.key)?.evaluation === "MEETS_WITH_CONDITIONS");
  const safetyConcerns = concerns.filter((def) => def.safetyCritical);
  if (safetyConcerns.length && (recommendation === "ADVANCE" || recommendation === "ADVANCE_WITH_CONDITIONS")) {
    notes.push(`Safety-critical concern in ${safetyConcerns.map((d) => d.label).join(", ")}: explain in the decision notes why the candidate should proceed, or hold for review.`);
  }
  if (recommendation === "ADVANCE" && (concerns.length || conditional.length)) {
    notes.push(`${[...concerns, ...conditional].map((d) => d.label).join(", ")} ${concerns.length + conditional.length === 1 ? "is" : "are"} not an unconditional "meets": consider "Proceed with conditions".`);
  }
  if ((recommendation === "HOLD_FOR_REVIEW" || recommendation === "DO_NOT_ADVANCE") && !concerns.length) {
    notes.push("No category is marked as a concern: record the reason for this recommendation in the decision notes.");
  }
  return notes;
}

/** Validation errors that prevent recording the interview. */
export function validateStructuredInterview(input: {
  categories: InterviewCategoryResponse[];
  recommendation: InterviewRecommendation | null;
  conditions: string;
  decisionNotes: string;
  interviewer: string;
}): string[] {
  const errors: string[] = [];
  const byKey = new Map(input.categories.map((item) => [item.key, item]));
  for (const def of STRUCTURED_INTERVIEW_CATEGORIES) {
    if (def.optional) continue;
    const item = byKey.get(def.key);
    if (!item || item.evaluation === "NOT_ASSESSED") errors.push(`Evaluate "${def.label}".`);
  }
  if (!input.recommendation) errors.push("Choose a recommendation.");
  if (input.recommendation === "ADVANCE_WITH_CONDITIONS" && !input.conditions.trim()) errors.push("Record the conditions for proceeding.");
  const needsReason = interviewGuidance(input.categories, input.recommendation).length > 0;
  if (needsReason && !input.decisionNotes.trim()) errors.push("Explain the recommendation in the decision notes.");
  if (!input.interviewer.trim()) errors.push("Record the interviewer.");
  return errors;
}

export function recommendationLabel(value: string | null | undefined) {
  return INTERVIEW_RECOMMENDATIONS.find((item) => item.value === value)?.label ?? (value ? value.replace(/_/g, " ").toLowerCase() : "Pending");
}

export function isStructuredInterviewRecord(value: unknown): value is StructuredInterviewRecord {
  return typeof value === "object" && value !== null && (value as { version?: unknown }).version === "bof-structured-interview-v1";
}
