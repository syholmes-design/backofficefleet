import type { Prisma } from "@prisma/client";

/**
 * Public careers postings derived from approved requisitions. Pure (type-only Prisma import), so the
 * careers page and tests can use it; the queries live in lib/services/requisitionRecruitingBridge.ts.
 */

/**
 * A public job posting. Blind by design: job facts only, never the carrier's name, DOT/MC numbers,
 * budget, managers or internal notes.
 */
export type PublicOpening = {
  openingId: string;
  title: string;
  location: string | null;
  employment: string | null;
  pay: string | null;
  signOnBonus: string | null;
  benefits: string | null;
  cdlClass: string | null;
  endorsements: string | null;
  experience: string | null;
  equipment: string | null;
  homeTime: string | null;
  route: string | null;
  schedule: string | null;
  summary: string | null;
  targetStartDate: string | null;
  openings: number;
  /** When the requisition was approved (or the position opened): JobPosting.datePosted. */
  postedAt: string | null;
  /** City and state parsed from the work location or terminal, for JobPosting.jobLocation. */
  locality: string | null;
  region: string | null;
};

export const publicOpeningInclude = {
  requisition: true,
  candidates: { select: { activationStatus: true } },
} satisfies Prisma.PositionInclude;

export type PublicOpeningRow = Prisma.PositionGetPayload<{ include: typeof publicOpeningInclude }>;

/** "Cleveland, OH" → { locality: "Cleveland", region: "OH" } from the first value that has that shape. */
function cityState(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const match = String(value ?? "").match(/([A-Za-z .'-]+),\s*([A-Z]{2})\b/);
    if (match) return { locality: match[1].trim(), region: match[2] };
  }
  return { locality: null, region: null };
}

export function toPublicOpening(row: PublicOpeningRow): PublicOpening | null {
  const r = row.requisition;
  if (!r) return null;
  const activated = row.candidates.filter((c) => c.activationStatus === "ACTIVE").length;
  const remaining = Math.max(0, r.numberOfPositions - activated);
  if (remaining === 0) return null;
  return {
    openingId: r.publicNumber,
    title: r.positionTitle || row.title,
    location: r.workLocation || r.terminalDomicile || null,
    employment: r.employmentClassification,
    pay: [r.payRange, r.compensationStructure].filter(Boolean).join(" · ") || null,
    signOnBonus: r.signOnBonus,
    benefits: r.benefits,
    cdlClass: r.cdlClass,
    endorsements: r.endorsements,
    experience: r.experienceRequirements,
    equipment: r.equipmentType,
    homeTime: r.homeTimePattern,
    route: r.routeLane,
    schedule: r.schedule,
    summary: r.positionSummary,
    targetStartDate: r.targetStartDate ? new Date(r.targetStartDate).toISOString() : null,
    openings: remaining,
    postedAt: r.approvedAt || row.createdAt ? new Date(r.approvedAt ?? row.createdAt).toISOString() : null,
    ...cityState(r.workLocation, r.terminalDomicile),
  };
}


const SITE_URL = "https://backofficefleet.com";

function employmentType(value: string | null) {
  const text = String(value ?? "").toLowerCase();
  if (/full[- ]?time/.test(text)) return "FULL_TIME";
  if (/part[- ]?time/.test(text)) return "PART_TIME";
  if (/contract|1099|owner[- ]operator/.test(text)) return "CONTRACTOR";
  if (/temp/.test(text)) return "TEMPORARY";
  return undefined;
}

/**
 * schema.org JobPosting for one open posting on /careers (what Google for Jobs reads). BOF recruits on
 * the carrier's behalf and the posting is blind, so BOF is the hiring organization of record here.
 * Returns null when a required field (date posted, city/state) is missing rather than emitting
 * markup Google would reject.
 */
export function jobPostingStructuredData(opening: PublicOpening) {
  if (!opening.postedAt || !opening.locality || !opening.region) return null;
  const requirements = [opening.cdlClass ? `CDL class ${opening.cdlClass}` : null, opening.experience, opening.endorsements].filter(Boolean).join(". ");
  const description = [opening.summary, opening.pay ? `Pay: ${opening.pay}.` : null, opening.homeTime ? `Home time: ${opening.homeTime}.` : null, opening.equipment ? `Equipment: ${opening.equipment}.` : null, requirements ? `Requirements: ${requirements}.` : null, opening.benefits ? `Benefits: ${opening.benefits}.` : null]
    .filter(Boolean)
    .join(" ");
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opening.title,
    description: description || opening.title,
    identifier: { "@type": "PropertyValue", name: "BackOfficeFleet", value: opening.openingId },
    datePosted: opening.postedAt.slice(0, 10),
    employmentType: employmentType(opening.employment),
    hiringOrganization: { "@type": "Organization", name: "BackOfficeFleet", sameAs: SITE_URL },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: opening.locality, addressRegion: opening.region, addressCountry: "US" } },
    directApply: true,
    url: `${SITE_URL}/careers#${encodeURIComponent(opening.openingId)}`,
  };
}

/** Serializes JSON-LD for a <script> tag without letting "</script>" or "<!--" in data break out. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
