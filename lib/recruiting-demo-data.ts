export type RecruitingPosition = {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  employmentType: string;
  homeTime: string;
  equipment: string;
  freightType: string;
  primaryLanes: string;
  schedule: string;
  compensation: string;
  benefits: string[];
  minimumQualifications: string[];
  cdlClass: string;
  experienceYears: number;
  endorsements: string[];
  safetyExpectations: string;
  physicalRequirements: string;
  applicationInstructions: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  createdAt: string;
};

export type RecruitingCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  homeLocation: string;
  positionId: string;
  positionTitle: string;
  appliedDate: string;
  experienceYears: number;
  cdlClass: string;
  cdlState: string;
  cdlNumberMasked: string;
  medCardStatus: "VALID" | "PENDING_VERIFICATION" | "EXPIRED";
  mvrStatus: "CLEAN" | "REVIEW_REQUIRED" | "PENDING_VERIFICATION";
  backgroundStatus: "CLEAN" | "PENDING_VERIFICATION";
  pipelineStage:
    | "APPLICATION_RECEIVED"
    | "SCREENING"
    | "QUALIFICATION_REVIEW"
    | "INTERVIEW"
    | "OFFER_PREPARED"
    | "OFFER_SENT"
    | "OFFER_ACCEPTED"
    | "ONBOARDING"
    | "ACTIVATED";
  interviewNotes?: string;
  offerDetails?: {
    salaryCPM: string;
    weeklyGuarantee: string;
    signOnBonus: string;
    startDate: string;
    homeTerminal: string;
  };
  onboardingChecklist: Array<{
    id: string;
    label: string;
    completed: boolean;
    requiredDocType?: string;
    verifiedAt?: string;
  }>;
  activatedDriverId?: string;
};

export const DEMO_POSITIONS: RecruitingPosition[] = [
  {
    id: "POS-001",
    title: "CDL-A OTR Regional Driver",
    department: "Fleet Operations",
    location: "Cleveland, OH",
    openings: 2,
    employmentType: "Full-Time W-2",
    homeTime: "Weekly / Bi-Weekly",
    equipment: "2024 Freightliner Cascadia / 53' Refrig Trailer",
    freightType: "Refrigerated & Dry Freight",
    primaryLanes: "Midwest (OH, IL, IN) → Southeast (GA, TX, NC)",
    schedule: "5-6 Days On, 34-Hour Restart at Home",
    compensation: "$0.62 - $0.68 CPM + $1,250 Weekly Guarantee + Safety Bonus",
    benefits: [
      "Health, Dental & Vision Insurance",
      "401(k) with 4% Company Match",
      "Paid Time Off & Holiday Bonus",
      "Late-Model Inverter & Fridge Equipped Trucks",
    ],
    minimumQualifications: [
      "Valid Class A CDL with clean driving record",
      "Minimum 2 years verifiable OTR tractor-trailer experience",
      "Current DOT Medical Examiner's Certificate",
      "Pass FMCSA Clearinghouse drug & alcohol screen",
    ],
    cdlClass: "Class A",
    experienceYears: 2,
    endorsements: ["Tanker (N)", "HazMat (H) Preferred"],
    safetyExpectations: "Zero recordable accidents in last 24 months; strict HOS & ELD compliance required.",
    physicalRequirements: "Ability to conduct pre-trip inspections, open trailer doors, and secure load seals.",
    applicationInstructions: "Submit application via BOF Recruiting Portal or upload CDL and Medical Card for instant qualification review.",
    status: "OPEN",
    createdAt: "2026-08-15",
  },
  {
    id: "POS-002",
    title: "CDL-A Local Shuttle Driver",
    department: "Dedicated Logistics",
    location: "Dallas, TX",
    openings: 1,
    employmentType: "Full-Time W-2",
    homeTime: "Daily Home Time",
    equipment: "Day Cab Tractor / 53' Dry Van",
    freightType: "Dedicated Consumer Goods",
    primaryLanes: "Dallas-Fort Worth Metro Hubs",
    schedule: "Monday – Friday, Day Shift",
    compensation: "$28.50 / Hour + Overtime after 40 Hours",
    benefits: ["Full Benefits Package", "Home Every Night", "Predictable Routes"],
    minimumQualifications: [
      "Valid Class A CDL",
      "1 year local shuttle experience",
      "Clean MVR",
    ],
    cdlClass: "Class A",
    experienceYears: 1,
    endorsements: [],
    safetyExpectations: "Safe yard maneuvering & dock backing experience.",
    physicalRequirements: "Frequent dock communication & seal verifications.",
    applicationInstructions: "Apply directly via BOF Recruiting Portal.",
    status: "OPEN",
    createdAt: "2026-08-20",
  },
];

export const DEMO_CANDIDATES: RecruitingCandidate[] = [
  {
    id: "CAND-001",
    name: "Michael Anderson",
    email: "michael.anderson@demo-candidate.bof.com",
    phone: "(216) 555-0182",
    homeLocation: "Cleveland, OH",
    positionId: "POS-001",
    positionTitle: "CDL-A OTR Regional Driver",
    appliedDate: "2026-08-22",
    experienceYears: 4,
    cdlClass: "Class A",
    cdlState: "OH",
    cdlNumberMasked: "OH••••8821",
    medCardStatus: "VALID",
    mvrStatus: "CLEAN",
    backgroundStatus: "CLEAN",
    pipelineStage: "ONBOARDING",
    interviewNotes: "Strong candidate with 4 years OTR refrigerated experience. Excellent safety record.",
    offerDetails: {
      salaryCPM: "$0.65 CPM",
      weeklyGuarantee: "$1,250.00",
      signOnBonus: "$1,500.00",
      startDate: "2026-09-01",
      homeTerminal: "Cleveland Terminal Hub",
    },
    onboardingChecklist: [
      { id: "ob-1", label: "Employment Application & I-9 Verification", completed: true, requiredDocType: "I-9", verifiedAt: "2026-08-23" },
      { id: "ob-2", label: "CDL License Verification", completed: true, requiredDocType: "CDL", verifiedAt: "2026-08-23" },
      { id: "ob-3", label: "Medical Examiner's Certificate (MCSA-5876)", completed: true, requiredDocType: "Medical Card", verifiedAt: "2026-08-24" },
      { id: "ob-4", label: "MVR Driving History Record", completed: true, requiredDocType: "MVR", verifiedAt: "2026-08-24" },
      { id: "ob-5", label: "FMCSA Drug & Alcohol Clearinghouse Consent", completed: true, requiredDocType: "FMCSA", verifiedAt: "2026-08-25" },
      { id: "ob-6", label: "W-9 Tax Form Submission", completed: true, requiredDocType: "W-9", verifiedAt: "2026-08-25" },
      { id: "ob-7", label: "Direct Deposit / Bank Account Setup", completed: true, requiredDocType: "Bank Info", verifiedAt: "2026-08-26" },
      { id: "ob-8", label: "BOF Fleet Safety Policy Acknowledgment", completed: true, verifiedAt: "2026-08-26" },
      { id: "ob-9", label: "Pre-Trip Inspection & ELD Training", completed: false },
      { id: "ob-10", label: "Power Unit Equipment Orientation", completed: false },
    ],
    activatedDriverId: "DRV-DEMO-001",
  },
  {
    id: "CAND-002",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@demo-candidate.bof.com",
    phone: "(214) 555-0194",
    homeLocation: "Dallas, TX",
    positionId: "POS-002",
    positionTitle: "CDL-A Local Shuttle Driver",
    appliedDate: "2026-08-25",
    experienceYears: 3,
    cdlClass: "Class A",
    cdlState: "TX",
    cdlNumberMasked: "TX••••4491",
    medCardStatus: "VALID",
    mvrStatus: "CLEAN",
    backgroundStatus: "PENDING_VERIFICATION",
    pipelineStage: "QUALIFICATION_REVIEW",
    onboardingChecklist: [
      { id: "ob-1", label: "Employment Application & I-9 Verification", completed: true },
      { id: "ob-2", label: "CDL License Verification", completed: true },
      { id: "ob-3", label: "Medical Examiner's Certificate", completed: false },
      { id: "ob-4", label: "MVR Driving History Record", completed: false },
      { id: "ob-5", label: "FMCSA Clearinghouse Consent", completed: false },
      { id: "ob-6", label: "W-9 Tax Form Submission", completed: false },
      { id: "ob-7", label: "Bank Account Setup", completed: false },
      { id: "ob-8", label: "Safety Policy Acknowledgment", completed: false },
      { id: "ob-9", label: "ELD Orientation", completed: false },
      { id: "ob-10", label: "Equipment Orientation", completed: false },
    ],
  },
];
