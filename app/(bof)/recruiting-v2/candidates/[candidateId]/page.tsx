import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruitingV2App } from "@/components/recruiting-v2/RecruitingV2App";
import { getRecruitingV2Candidate, recruitingV2Candidates } from "@/lib/recruiting-v2/recruiting-v2-demo-data";

type Props = { params: Promise<{ candidateId: string }> };

export function generateStaticParams() {
  return recruitingV2Candidates.map((candidate) => ({ candidateId: candidate.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { candidateId } = await params;
  const candidate = getRecruitingV2Candidate(candidateId);
  return {
    title: candidate ? `${candidate.name} | Recruiting V2 | BOF` : "Candidate | Recruiting V2 | BOF",
  };
}

export default async function RecruitingV2CandidatePage({ params }: Props) {
  const { candidateId } = await params;
  if (!getRecruitingV2Candidate(candidateId)) notFound();
  return <RecruitingV2App candidateId={candidateId} />;
}