import type { Metadata } from "next";
import { CareersPageClient } from "@/components/marketing/CareersPageClient";
import { jobPostingStructuredData, serializeJsonLd, type PublicOpening } from "@/lib/recruiting/public-openings";
import { listPublicOpenings } from "@/lib/services/requisitionRecruitingBridge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | BackOfficeFleet",
  description: "Open CDL driver positions BOF is recruiting for on behalf of its carrier partners: pay, equipment, home time and requirements.",
};

export default async function CareersPage() {
  let openings: PublicOpening[] = [];
  let unavailable = false;
  try {
    openings = await listPublicOpenings();
  } catch {
    unavailable = true;
  }
  const structuredData = openings.map(jobPostingStructuredData).filter((item) => item !== null);
  return (
    <>
      {structuredData.map((item) => (
        // schema.org JobPosting for Google for Jobs; serialized so posting text cannot break out of the tag.
        <script key={item.identifier.value} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }} />
      ))}
      <CareersPageClient openings={openings} unavailable={unavailable} />
    </>
  );
}
