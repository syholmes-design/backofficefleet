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
};

export const publicOpeningInclude = {
  requisition: true,
  candidates: { select: { activationStatus: true } },
} satisfies Prisma.PositionInclude;

export type PublicOpeningRow = Prisma.PositionGetPayload<{ include: typeof publicOpeningInclude }>;

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
  };
}

