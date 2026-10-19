/**
 * Job-board distribution status for a recruiting position, derived from real state only.
 *
 * - BOF Careers (/careers) is the one connected channel: a position is published there exactly while
 *   its approved requisition is open for applications (lib/recruiting/public-openings.ts), and the
 *   page carries schema.org JobPosting data that Google for Jobs can index.
 * - Indeed, LinkedIn and ZipRecruiter are not connected. Each needs an employer account, API or feed
 *   credentials and a commercial agreement before BOF can post; nothing here claims otherwise.
 */
import type { RecruitingPipelineState } from "@/lib/recruiting/requisition-pipeline";

export type JobBoardProviderId = "bof_careers" | "google_for_jobs" | "indeed" | "linkedin" | "ziprecruiter";

export type JobBoardConnectionStatus = "PUBLISHED" | "NOT_PUBLISHED" | "NOT_CONNECTED";

export type JobBoardDestinationConfig = {
  providerId: JobBoardProviderId;
  providerName: string;
  isInternal: boolean;
  status: JobBoardConnectionStatus;
  statusLabel: string;
  statusDetail: string;
};

/** Requisition states in which the careers page lists the position (mirrors the public-openings query). */
const OPEN_STATES: RecruitingPipelineState[] = ["READY_FOR_RECRUITING", "RECRUITING", "PARTIALLY_FILLED"];

const EXTERNAL_BOARDS: Array<{ providerId: JobBoardProviderId; providerName: string; needs: string }> = [
  { providerId: "indeed", providerName: "Indeed", needs: "an Indeed employer account and job-sync/XML feed approval" },
  { providerId: "linkedin", providerName: "LinkedIn Jobs", needs: "a LinkedIn Talent Solutions partner agreement and job-posting API access" },
  { providerId: "ziprecruiter", providerName: "ZipRecruiter", needs: "a ZipRecruiter employer account and job-feed credentials" },
];

export function jobDistributionForPosition(
  position: { requisition?: { status: string; pipelineState: RecruitingPipelineState } | null } | null | undefined,
): JobBoardDestinationConfig[] {
  const requisition = position?.requisition;
  const open = Boolean(requisition && requisition.status === "APPROVED" && OPEN_STATES.includes(requisition.pipelineState));
  return [
    {
      providerId: "bof_careers",
      providerName: "BOF Careers Page",
      isInternal: true,
      status: open ? "PUBLISHED" : "NOT_PUBLISHED",
      statusLabel: open ? "Published" : "Not published",
      statusDetail: open
        ? "Listed on /careers as a blind posting while the requisition is open. Applications become candidates on this requisition."
        : "Listed only while the approved requisition is open for applications with seats remaining.",
    },
    {
      providerId: "google_for_jobs",
      providerName: "Google for Jobs",
      isInternal: true,
      status: open ? "PUBLISHED" : "NOT_PUBLISHED",
      statusLabel: open ? "Structured data live" : "Not published",
      statusDetail: "The careers page carries schema.org JobPosting markup for each open posting. Indexing is decided by Google; BOF does not submit or pay.",
    },
    ...EXTERNAL_BOARDS.map(({ providerId, providerName, needs }) => ({
      providerId,
      providerName,
      isInternal: false,
      status: "NOT_CONNECTED" as const,
      statusLabel: "Not connected",
      statusDetail: `No integration exists yet. Posting requires ${needs}. Nothing is sent to this board.`,
    })),
  ];
}
