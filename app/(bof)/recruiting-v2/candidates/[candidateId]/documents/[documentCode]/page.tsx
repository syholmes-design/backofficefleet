import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruitingV2DocumentViewer } from "@/components/recruiting-v2/RecruitingV2DocumentViewer";
import { getRecruitingV2Candidate } from "@/lib/recruiting-v2/recruiting-v2-demo-data";

type Props = { params: Promise<{ candidateId: string; documentCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { candidateId, documentCode } = await params;
  const candidate = getRecruitingV2Candidate(candidateId);
  return {
    title: candidate ? `${candidate.name} ${documentCode} | Recruiting V2 | BOF` : `${documentCode} | Recruiting V2 | BOF`,
  };
}

export default async function RecruitingV2CandidateDocumentPage({ params }: Props) {
  const { candidateId, documentCode } = await params;
  if (!getRecruitingV2Candidate(candidateId) || !documentCode) notFound();
  return <RecruitingV2DocumentViewer candidateId={candidateId} documentCode={documentCode} />;
}
