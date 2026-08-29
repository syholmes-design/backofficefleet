export type JobBoardProviderId = "bof_careers" | "indeed" | "linkedin" | "ziprecruiter";

export type JobBoardConnectionStatus =
  | "PUBLISHED"
  | "READY_TO_POST"
  | "API_NOT_CONNECTED"
  | "QUEUED"
  | "PAUSED"
  | "EXPIRED"
  | "ERROR";

export type JobBoardDestinationConfig = {
  providerId: JobBoardProviderId;
  providerName: string;
  isInternal: boolean;
  status: JobBoardConnectionStatus;
  statusLabel: string;
  statusDetail: string;
  lastSyncAt?: string;
  externalJobId?: string;
  apiDocsUrl?: string;
};

export type CanonicalJobPosting = {
  jobId: string;
  positionId: string;
  title: string;
  department: string;
  location: string;
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
  postingStatus: "ACTIVE" | "PAUSED" | "EXPIRED" | "DRAFT";
  createdAt: string;
  updatedAt: string;
  destinations: Record<JobBoardProviderId, JobBoardDestinationConfig>;
};

export type ApplicationSource =
  | "BOF Careers Page"
  | "Indeed"
  | "LinkedIn"
  | "ZipRecruiter"
  | "Referral"
  | "Direct";

export interface JobBoardDistributionAdapter {
  providerId: JobBoardProviderId;
  providerName: string;
  isConfigured(): boolean;
  publish(posting: CanonicalJobPosting): Promise<{ success: boolean; externalJobId?: string; message: string }>;
  pause(posting: CanonicalJobPosting): Promise<{ success: boolean; message: string }>;
  getStatus(posting: CanonicalJobPosting): JobBoardConnectionStatus;
}

export const DEMO_JOB_POSTINGS: CanonicalJobPosting[] = [
  {
    jobId: "JOB-001",
    positionId: "POS-001",
    title: "CDL-A OTR Regional Driver",
    department: "Fleet Operations",
    location: "Cleveland, OH",
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
    applicationInstructions: "Submit application via BOF Careers Page or upload CDL and Medical Card for instant qualification review.",
    postingStatus: "ACTIVE",
    createdAt: "2026-08-16",
    updatedAt: "2026-08-28",
    destinations: {
      bof_careers: {
        providerId: "bof_careers",
        providerName: "BOF Careers Page",
        isInternal: true,
        status: "PUBLISHED",
        statusLabel: "PUBLISHED",
        statusDetail: "Live on internal BOF Careers portal (/careers). Applications enter BOF recruiting pipeline directly.",
        lastSyncAt: "2026-08-28T14:30:00Z",
        externalJobId: "BOF-CAR-POS-001",
      },
      indeed: {
        providerId: "indeed",
        providerName: "Indeed",
        isInternal: false,
        status: "READY_TO_POST",
        statusLabel: "READY TO POST",
        statusDetail: "Normalized posting package generated. External API credentials/integration not configured.",
        apiDocsUrl: "https://docs.indeed.com/employer-api",
      },
      linkedin: {
        providerId: "linkedin",
        providerName: "LinkedIn Jobs",
        isInternal: false,
        status: "API_NOT_CONNECTED",
        statusLabel: "API NOT CONNECTED",
        statusDetail: "External API integration required. Environment secret LINKEDIN_JOBS_API_KEY is not configured.",
        apiDocsUrl: "https://learn.microsoft.com/en-us/linkedin/talent/job-postings",
      },
      ziprecruiter: {
        providerId: "ziprecruiter",
        providerName: "ZipRecruiter",
        isInternal: false,
        status: "READY_TO_POST",
        statusLabel: "READY TO POST",
        statusDetail: "XML/JSON feed package ready. External ZipRecruiter Enterprise Partner API key not configured.",
        apiDocsUrl: "https://www.ziprecruiter.com/partners",
      },
    },
  },
];
