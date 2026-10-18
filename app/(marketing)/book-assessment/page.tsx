/**
 * BOF Route Owner:
 * URL: /book-assessment
 * Type: MARKETING
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Fleet Operations Assessment | BackOfficeFleet",
  description:
    "Multi-step fleet assessment for dispatch, compliance, proof, and settlement workflows — consultative intake aligned with BOF engagements.",
};

/** Sector values the assessment selector understands (app/assessment/page.tsx). Anything else is dropped. */
const KNOWN_SECTORS = new Set(["for-hire", "for_hire", "private-fleet", "private_fleet", "government", "bof-vault", "vault", "aggregator"]);

type BookAssessmentPageProps = {
  searchParams?: Promise<{ sector?: string | string[] }>;
};

/**
 * Server-side redirect to the assessment selector. The previous implementation
 * interpolated the raw `sector` query value into an inline <script>, which allowed
 * reflected script injection; only allowlisted values are forwarded now.
 */
export default async function BookAssessmentPage({ searchParams }: BookAssessmentPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const raw = Array.isArray(params?.sector) ? params?.sector[0] : params?.sector;
  const sector = raw?.toLowerCase();
  redirect(sector && KNOWN_SECTORS.has(sector) ? `/assessment?sector=${encodeURIComponent(sector)}` : "/assessment");
}
