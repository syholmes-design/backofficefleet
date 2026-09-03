export type RecruitingV2WorkspaceKey =
  | "application"
  | "qualification"
  | "interview"
  | "documents"
  | "fmcsa"
  | "medical"
  | "mvr"
  | "i9"
  | "w9"
  | "offer"
  | "onboarding"
  | "activation";

export type RecruitingV2RequirementStatus = "READY" | "PENDING" | "BLOCKED" | "NOT_PROVIDED" | "NOT_APPLICABLE" | "UNDER_REVIEW" | "COMPLETE";

export type RecruitingV2Position = {
  id: string;
  positionCode: string;
  title: string;
  homeTerminal: string;
  freightType: string;
  primaryLanes: string;
  compensation: string;
  description: string;
};

export type RecruitingV2DocumentRequirement = {
  id: string;
  label: string;
  workspace: RecruitingV2WorkspaceKey;
  status: RecruitingV2RequirementStatus;
  templateLabel: string;
  templateHref?: string;
  candidateRecord: string;
  reviewState: string;
  decision: string;
  nextAction: string;
};

export type RecruitingV2Interview = {
  id: string;
  candidateId: string;
  positionCode: string;
  date: string | null;
  type: string;
  location: string;
  status: "NOT_SCHEDULED" | "SCHEDULED" | "COMPLETED" | "NEEDS_FOLLOW_UP";
  score: number | null;
  recommendation: "ADVANCE" | "HOLD_FOR_REVIEW" | "DO_NOT_ADVANCE" | "PENDING";
  interviewers: string[];
  notes: string;
  categoryScores: Array<{ label: string; score: number | null; notes: string }>;
  auditTrail: string[];
};

export type RecruitingV2Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  homeLocation: string;
  positionCode: string;
  cdlClass: string;
  cdlState: string;
  cdlNumberMasked: string;
  experienceYears: number;
  applicationStatus: RecruitingV2RequirementStatus;
  qualificationStatus: RecruitingV2RequirementStatus;
  documentReviewStatus: RecruitingV2RequirementStatus;
  complianceStatus: RecruitingV2RequirementStatus;
  offerStatus: RecruitingV2RequirementStatus;
  onboardingStatus: RecruitingV2RequirementStatus;
  activationStage: "APPLICANT" | "QUALIFICATION" | "INTERVIEW" | "DOCUMENT_REVIEW" | "COMPLIANCE" | "OFFER" | "ONBOARDING" | "DRIVER_ACTIVATION_READY";
  applicationSummary: {
    source: string;
    completeness: number;
    employmentHistory: string;
    nextAction: string;
  };
  requirements: RecruitingV2DocumentRequirement[];
  offer: {
    status: RecruitingV2RequirementStatus;
    terms?: string;
    startDate?: string;
    reason?: string;
  };
  onboarding: {
    completed: number;
    total: number;
    openIssues: string[];
  };
  auditTrail: string[];
};

export const RECRUITING_V2_WORKSPACES: Array<{ key: RecruitingV2WorkspaceKey; label: string }> = [
  { key: "application", label: "Application" },
  { key: "qualification", label: "Qualification" },
  { key: "interview", label: "Interview" },
  { key: "documents", label: "Documents" },
  { key: "fmcsa", label: "FMCSA" },
  { key: "medical", label: "Medical" },
  { key: "mvr", label: "MVR" },
  { key: "i9", label: "I-9" },
  { key: "w9", label: "W-9" },
  { key: "offer", label: "Offer" },
  { key: "onboarding", label: "Onboarding" },
  { key: "activation", label: "Activation" },
];

export const recruitingV2Positions: RecruitingV2Position[] = [
  {
    id: "POSV2-001",
    positionCode: "POSITION-CLASS-A-CLE",
    title: "CDL-A Regional Driver",
    homeTerminal: "Cleveland, OH",
    freightType: "Refrigerated and dry van freight",
    primaryLanes: "Midwest to Southeast regional lanes",
    compensation: "$0.65 CPM plus weekly guarantee and safety bonus",
    description: "Class A regional driving role with recurring DQF, safety, proof, and onboarding requirements before dispatch eligibility.",
  },
  {
    id: "POSV2-002",
    positionCode: "POSITION-CLASS-A-DAL",
    title: "CDL-A Local Shuttle Driver",
    homeTerminal: "Dallas, TX",
    freightType: "Dedicated dry van shuttle freight",
    primaryLanes: "Dallas-Fort Worth distribution shuttle lanes",
    compensation: "$28.50 hourly plus overtime eligibility",
    description: "Local Class A role requiring application review, CDL verification, medical card, MVR, compliance review, and onboarding before activation.",
  },
];

const baseTemplates = {
  application: "/apply",
  cdl: "/generated/templates/driver-docs/cdl-template.html",
  medical: "/generated/templates/driver-docs/medical-card-template.html",
  mvr: "/generated/templates/driver-docs/mvr-template.html",
  fmcsa: "/generated/templates/driver-docs/fmcsa-compliance-template.html",
  i9: "/generated/templates/driver-docs/i9-template.html",
  w9: "/generated/templates/driver-docs/w9-template.html",
  roadTest: "/generated/templates/driver-docs/road-test-certificate-template.html",
  priorEmployer: "/generated/templates/driver-docs/employment-verification-template.html",
  onboarding: "/generated/company-operations-vault/hr-templates/new-driver-onboarding-checklist.html",
};

function requirement(input: RecruitingV2DocumentRequirement): RecruitingV2DocumentRequirement {
  return input;
}

export const recruitingV2Candidates: RecruitingV2Candidate[] = [
  {
    id: "CAND-001",
    name: "Michael Anderson",
    email: "michael.anderson@example.test",
    phone: "(216) 555-0182",
    homeLocation: "Cleveland, OH",
    positionCode: "POSITION-CLASS-A-CLE",
    cdlClass: "Class A",
    cdlState: "OH",
    cdlNumberMasked: "OH-****-8821",
    experienceYears: 4,
    applicationStatus: "COMPLETE",
    qualificationStatus: "READY",
    documentReviewStatus: "READY",
    complianceStatus: "READY",
    offerStatus: "COMPLETE",
    onboardingStatus: "COMPLETE",
    activationStage: "DRIVER_ACTIVATION_READY",
    applicationSummary: {
      source: "BOF synthetic applicant intake",
      completeness: 100,
      employmentHistory: "Four years of synthetic regional refrigerated experience; no real employer data.",
      nextAction: "Documents verified. Qualification READY. Offer accepted. Onboarding complete. Activation READY.",
    },
    requirements: [
      requirement({ id: "app", label: "Employment Application", workspace: "application", status: "COMPLETE", templateLabel: "BOF application intake workflow", templateHref: baseTemplates.application, candidateRecord: "Michael Anderson candidate application workspace", reviewState: "Reviewed", decision: "Application complete", nextAction: "Open the candidate application workspace." }),
      requirement({ id: "cdl", label: "CDL", workspace: "qualification", status: "READY", templateLabel: "CDL Verification Template", templateHref: baseTemplates.cdl, candidateRecord: "Michael Anderson CDL document record", reviewState: "Verified", decision: "CDL gate satisfied", nextAction: "Open the candidate CDL document record." }),
      requirement({ id: "medical", label: "Medical", workspace: "medical", status: "READY", templateLabel: "Medical Certificate Template", templateHref: baseTemplates.medical, candidateRecord: "Michael Anderson medical document record", reviewState: "Verified", decision: "Medical gate satisfied", nextAction: "Open the candidate medical document record." }),
      requirement({ id: "mvr", label: "MVR", workspace: "mvr", status: "READY", templateLabel: "MVR Template", templateHref: baseTemplates.mvr, candidateRecord: "Michael Anderson MVR document record", reviewState: "Verified", decision: "MVR gate satisfied", nextAction: "Open the candidate MVR document record." }),
      requirement({ id: "fmcsa", label: "FMCSA / Clearinghouse", workspace: "fmcsa", status: "READY", templateLabel: "FMCSA/Clearinghouse Template", templateHref: baseTemplates.fmcsa, candidateRecord: "Michael Anderson clearinghouse document record", reviewState: "Verified", decision: "Clearinghouse gate satisfied", nextAction: "Open the candidate clearinghouse document record." }),
      requirement({ id: "i9", label: "I-9", workspace: "i9", status: "COMPLETE", templateLabel: "I-9 Template", templateHref: baseTemplates.i9, candidateRecord: "Michael Anderson I-9 document record", reviewState: "Verified", decision: "I-9 gate satisfied", nextAction: "Open the candidate I-9 document record." }),
      requirement({ id: "w9", label: "W-9", workspace: "w9", status: "COMPLETE", templateLabel: "W-9 Template", templateHref: baseTemplates.w9, candidateRecord: "Michael Anderson W-9 document record", reviewState: "Verified", decision: "W-9 gate satisfied", nextAction: "Open the candidate W-9 document record." }),
      requirement({ id: "road-test", label: "Road Test", workspace: "onboarding", status: "COMPLETE", templateLabel: "Road Test Certificate Template", templateHref: baseTemplates.roadTest, candidateRecord: "Michael Anderson road test document record", reviewState: "Verified", decision: "Road test gate satisfied", nextAction: "Open the candidate road test document record." }),
      requirement({ id: "prior-employer", label: "Prior Employer", workspace: "documents", status: "COMPLETE", templateLabel: "Employment Verification Template", templateHref: baseTemplates.priorEmployer, candidateRecord: "Michael Anderson employment verification document record", reviewState: "Verified", decision: "Employment verification gate satisfied", nextAction: "Open the candidate employment verification document record." }),
    ],
    offer: { status: "COMPLETE", terms: "$0.65 CPM plus $1,250 weekly guarantee", startDate: "2026-09-01" },
    onboarding: { completed: 10, total: 10, openIssues: [] },
    auditTrail: ["Application received", "Interview completed with ADVANCE", "Eight document records verified", "Qualification READY", "Offer ACCEPTED", "Onboarding COMPLETE", "Activation READY"],
  },
  {
    id: "CAND-002",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@example.test",
    phone: "(214) 555-0194",
    homeLocation: "Dallas, TX",
    positionCode: "POSITION-CLASS-A-DAL",
    cdlClass: "Class A",
    cdlState: "TX",
    cdlNumberMasked: "TX-****-4491",
    experienceYears: 3,
    applicationStatus: "COMPLETE",
    qualificationStatus: "BLOCKED",
    documentReviewStatus: "BLOCKED",
    complianceStatus: "BLOCKED",
    offerStatus: "NOT_PROVIDED",
    onboardingStatus: "PENDING",
    activationStage: "QUALIFICATION",
    applicationSummary: {
      source: "BOF synthetic applicant intake",
      completeness: 76,
      employmentHistory: "Three years of synthetic local shuttle experience; no real employer data.",
      nextAction: "Collect required candidate documents before qualification can clear.",
    },
    requirements: [
      requirement({ id: "app", label: "Employment Application", workspace: "application", status: "COMPLETE", templateLabel: "BOF application intake workflow", templateHref: baseTemplates.application, candidateRecord: "Sarah Mitchell candidate application workspace", reviewState: "Received", decision: "Application can feed qualification review", nextAction: "Collect required credential documents." }),
      requirement({ id: "cdl", label: "CDL", workspace: "qualification", status: "NOT_PROVIDED", templateLabel: "CDL Verification Template", templateHref: baseTemplates.cdl, candidateRecord: "Sarah Mitchell CDL requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate CDL document." }),
      requirement({ id: "medical", label: "Medical", workspace: "medical", status: "NOT_PROVIDED", templateLabel: "Medical Certificate Template", templateHref: baseTemplates.medical, candidateRecord: "Sarah Mitchell medical requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate medical document." }),
      requirement({ id: "mvr", label: "MVR", workspace: "mvr", status: "NOT_PROVIDED", templateLabel: "MVR Template", templateHref: baseTemplates.mvr, candidateRecord: "Sarah Mitchell MVR requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate MVR document." }),
      requirement({ id: "fmcsa", label: "FMCSA / Clearinghouse", workspace: "fmcsa", status: "NOT_PROVIDED", templateLabel: "FMCSA/Clearinghouse Template", templateHref: baseTemplates.fmcsa, candidateRecord: "Sarah Mitchell clearinghouse requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate clearinghouse document." }),
      requirement({ id: "i9", label: "I-9", workspace: "i9", status: "NOT_PROVIDED", templateLabel: "I-9 Template", templateHref: baseTemplates.i9, candidateRecord: "Sarah Mitchell I-9 requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate I-9 document." }),
      requirement({ id: "w9", label: "W-9", workspace: "w9", status: "NOT_PROVIDED", templateLabel: "W-9 Template", templateHref: baseTemplates.w9, candidateRecord: "Sarah Mitchell W-9 requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate W-9 document." }),
      requirement({ id: "road-test", label: "Road Test", workspace: "onboarding", status: "NOT_PROVIDED", templateLabel: "Road Test Certificate Template", templateHref: baseTemplates.roadTest, candidateRecord: "Sarah Mitchell road test requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect the candidate road test document after qualification review." }),
      requirement({ id: "prior-employer", label: "Prior Employer", workspace: "documents", status: "NOT_PROVIDED", templateLabel: "Employment Verification Template", templateHref: baseTemplates.priorEmployer, candidateRecord: "Sarah Mitchell employment verification requirement", reviewState: "MISSING", decision: "DOCUMENT REQUIRED", nextAction: "Collect prior-employer verification." }),
    ],
    offer: { status: "NOT_PROVIDED", reason: "Qualification requirements are not complete; no candidate-specific offer record exists yet." },
    onboarding: { completed: 2, total: 10, openIssues: ["Medical certificate not provided", "MVR not provided", "FMCSA/Clearinghouse review pending", "W-9 not provided", "Safety acknowledgment pending"] },
    auditTrail: ["Application received", "Interview scheduled", "Required documents missing", "Qualification blocked"],
  },
];

export function getRecruitingV2Position(positionCode: string) {
  return recruitingV2Positions.find((position) => position.positionCode === positionCode) ?? null;
}

export function getRecruitingV2Candidate(candidateId: string) {
  return recruitingV2Candidates.find((candidate) => candidate.id === candidateId) ?? null;
}

export function getRecruitingV2Interviews(candidateId: string): RecruitingV2Interview[] {
  return recruitingV2Interviews.filter((interview) => interview.candidateId === candidateId);
}

export const recruitingV2Interviews: RecruitingV2Interview[] = [
  {
    id: "INT-001",
    candidateId: "CAND-001",
    positionCode: "POSITION-CLASS-A-CLE",
    date: "2026-08-27T15:00:00.000Z",
    type: "Structured operations interview",
    location: "Video interview",
    status: "COMPLETED",
    score: 86,
    recommendation: "ADVANCE",
    interviewers: ["BOF Recruiting Coordinator", "Fleet Operations Reviewer"],
    notes: "Synthetic interview record: ADVANCE. Qualification is READY and onboarding is complete for the demo path.",
    categoryScores: [
      { label: "Safety judgment", score: 88, notes: "Acceptable synthetic response set." },
      { label: "Route discipline", score: 84, notes: "Regional experience aligns with position." },
      { label: "Documentation habits", score: 82, notes: "Needs onboarding closeout discipline." },
    ],
    auditTrail: ["Interview scheduled", "Interview completed", "Recommendation recorded"],
  },
  {
    id: "INT-002",
    candidateId: "CAND-002",
    positionCode: "POSITION-CLASS-A-DAL",
    date: null,
    type: "Structured local shuttle interview",
    location: "Not scheduled",
    status: "NOT_SCHEDULED",
    score: null,
    recommendation: "PENDING",
    interviewers: [],
    notes: "No completed interview record exists for this synthetic candidate yet.",
    categoryScores: [
      { label: "Safety judgment", score: null, notes: "Pending interview." },
      { label: "Local route discipline", score: null, notes: "Pending interview." },
      { label: "Documentation habits", score: null, notes: "Pending interview." },
    ],
    auditTrail: ["Candidate opened for qualification review"],
  },
];

export function isRecruitingV2WorkspaceKey(value: string): value is RecruitingV2WorkspaceKey {
  return RECRUITING_V2_WORKSPACES.some((workspace) => workspace.key === value);
}