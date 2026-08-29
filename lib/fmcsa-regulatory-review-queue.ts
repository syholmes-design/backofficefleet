export type FmcsaWorkflow = "DRIVER_QUALIFICATION" | "CREDENTIALS" | "SAFETY" | "MAINTENANCE" | "TRAINING";

export type FmcsaReviewQueueItem = {
  priority: 1 | 2 | 3;
  citation: string;
  title: string;
  cfrPart: string;
  section: string;
  sourceUrl: string;
  workflows: readonly FmcsaWorkflow[];
  reviewStatus: "QUEUED";
  reviewChecklist: readonly ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"];
};

const ECFR_BASE = "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/section-";

/**
 * Prioritized official-source queue. This is a review manifest, not regulatory advice
 * and not a durable requirement import. A reviewer must approve each item before ingest.
 */
export const FMCSA_REGULATORY_REVIEW_QUEUE: readonly FmcsaReviewQueueItem[] = [
  { priority: 1, citation: "49 CFR 391.11", title: "General qualifications of drivers", cfrPart: "391", section: "391.11", sourceUrl: `${ECFR_BASE}391.11`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 391.23", title: "Investigation and inquiries", cfrPart: "391", section: "391.23", sourceUrl: `${ECFR_BASE}391.23`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 391.41", title: "Physical qualifications for drivers", cfrPart: "391", section: "391.41", sourceUrl: `${ECFR_BASE}391.41`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 391.51", title: "General requirements for driver qualification files", cfrPart: "391", section: "391.51", sourceUrl: `${ECFR_BASE}391.51`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 382.301", title: "Pre-employment testing", cfrPart: "382", section: "382.301", sourceUrl: `${ECFR_BASE}382.301`, workflows: ["DRIVER_QUALIFICATION", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 382.701", title: "Drug and Alcohol Clearinghouse", cfrPart: "382", section: "382.701", sourceUrl: `${ECFR_BASE}382.701`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 396.3", title: "Inspection, repair, and maintenance", cfrPart: "396", section: "396.3", sourceUrl: `${ECFR_BASE}396.3`, workflows: ["MAINTENANCE", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 396.11", title: "Driver vehicle inspection report(s)", cfrPart: "396", section: "396.11", sourceUrl: `${ECFR_BASE}396.11`, workflows: ["MAINTENANCE", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 396.17", title: "Periodic inspection", cfrPart: "396", section: "396.17", sourceUrl: `${ECFR_BASE}396.17`, workflows: ["MAINTENANCE", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 393.75", title: "Tires", cfrPart: "393", section: "393.75", sourceUrl: `${ECFR_BASE}393.75`, workflows: ["MAINTENANCE", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 393.100", title: "Applicability and general requirements of cargo securement standards", cfrPart: "393", section: "393.100", sourceUrl: `${ECFR_BASE}393.100`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 1, citation: "49 CFR 393.106", title: "General requirements for securing articles of cargo", cfrPart: "393", section: "393.106", sourceUrl: `${ECFR_BASE}393.106`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 391.21", title: "Application for employment", cfrPart: "391", section: "391.21", sourceUrl: `${ECFR_BASE}391.21`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 391.25", title: "Annual inquiry and review of driving record", cfrPart: "391", section: "391.25", sourceUrl: `${ECFR_BASE}391.25`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 391.31", title: "Road test", cfrPart: "391", section: "391.31", sourceUrl: `${ECFR_BASE}391.31`, workflows: ["DRIVER_QUALIFICATION", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 391.43", title: "Medical examination; certificate of physical examination", cfrPart: "391", section: "391.43", sourceUrl: `${ECFR_BASE}391.43`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 382.303", title: "Post-accident testing", cfrPart: "382", section: "382.303", sourceUrl: `${ECFR_BASE}382.303`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 382.601", title: "Employer obligation to promulgate a policy on the misuse of alcohol and use of controlled substances", cfrPart: "382", section: "382.601", sourceUrl: `${ECFR_BASE}382.601`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 382.603", title: "Training for supervisors", cfrPart: "382", section: "382.603", sourceUrl: `${ECFR_BASE}382.603`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 395.3", title: "Maximum driving time for property-carrying vehicles", cfrPart: "395", section: "395.3", sourceUrl: `${ECFR_BASE}395.3`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 395.8", title: "Driver's record of duty status", cfrPart: "395", section: "395.8", sourceUrl: `${ECFR_BASE}395.8`, workflows: ["SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 2, citation: "49 CFR 396.13", title: "Driver inspection", cfrPart: "396", section: "396.13", sourceUrl: `${ECFR_BASE}396.13`, workflows: ["MAINTENANCE", "SAFETY", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 3, citation: "49 CFR 391.23(m)", title: "Medical certification and CDLIS verification provisions", cfrPart: "391", section: "391.23", sourceUrl: `${ECFR_BASE}391.23`, workflows: ["DRIVER_QUALIFICATION", "CREDENTIALS"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 3, citation: "49 CFR 395.11", title: "Supporting documents", cfrPart: "395", section: "395.11", sourceUrl: `${ECFR_BASE}395.11`, workflows: ["CREDENTIALS", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 3, citation: "49 CFR 396.9", title: "Inspection of motor vehicles and intermodal equipment in operation", cfrPart: "396", section: "396.9", sourceUrl: `${ECFR_BASE}396.9`, workflows: ["MAINTENANCE", "SAFETY"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 3, citation: "49 CFR 393.95", title: "Emergency equipment on all power units", cfrPart: "393", section: "393.95", sourceUrl: `${ECFR_BASE}393.95`, workflows: ["SAFETY", "MAINTENANCE", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
  { priority: 3, citation: "49 CFR 393.104", title: "Standards for cargo securement devices and systems", cfrPart: "393", section: "393.104", sourceUrl: `${ECFR_BASE}393.104`, workflows: ["SAFETY", "MAINTENANCE", "TRAINING"], reviewStatus: "QUEUED", reviewChecklist: ["VERIFY_TITLE", "CAPTURE_CURRENT_TEXT", "CONFIRM_EFFECTIVE_DATE", "MAP_WORKFLOW_IMPACT"] },
];

export function getFmcsaReviewQueueSummary() {
  return FMCSA_REGULATORY_REVIEW_QUEUE.reduce<Record<string, number>>((summary, item) => {
    summary[`priority${item.priority}`] = (summary[`priority${item.priority}`] ?? 0) + 1;
    return summary;
  }, {});
}
