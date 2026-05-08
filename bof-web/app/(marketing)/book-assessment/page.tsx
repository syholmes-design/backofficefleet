/**
 * BOF Route Owner:
 * URL: /book-assessment
 * Type: MARKETING
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet Operations Assessment | BackOfficeFleet",
  description:
    "Multi-step fleet assessment for dispatch, compliance, proof, and settlement workflows — consultative intake aligned with BOF engagements.",
};

type BookAssessmentPageProps = {
  searchParams?: Promise<{
    sector?: string;
  }>;
};

export default async function BookAssessmentPage({ searchParams }: BookAssessmentPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const requestedSector = params?.sector;
  
  // Redirect to the new assessment selector with optional sector parameter
  const redirectUrl = requestedSector ? `/assessment?sector=${requestedSector}` : '/assessment';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Assessment</h1>
        <p className="text-gray-600 mb-6">Taking you to the new fleet assessment system...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.href = '${redirectUrl}';`
          }}
        />
        <noscript>
          <div className="mt-4">
            <a 
              href={redirectUrl} 
              className="text-teal-600 hover:text-teal-700 underline"
            >
              Click here to continue to Assessment
            </a>
          </div>
        </noscript>
      </div>
    </div>
  );
}
