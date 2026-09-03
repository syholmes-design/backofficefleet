import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruitingV2App } from "@/components/recruiting-v2/RecruitingV2App";
import {
  RECRUITING_V2_WORKSPACES,
  getRecruitingV2Candidate,
  isRecruitingV2WorkspaceKey,
  recruitingV2Candidates,
} from "@/lib/recruiting-v2/recruiting-v2-demo-data";

type Props = { params: Promise<{ candidateId: string; workspace: string }> };

export function generateStaticParams() {
  return recruitingV2Candidates.flatMap((candidate) =>
    RECRUITING_V2_WORKSPACES.map((workspace) => ({ candidateId: candidate.id, workspace: workspace.key })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { candidateId, workspace } = await params;
  const candidate = getRecruitingV2Candidate(candidateId);
  const label = RECRUITING_V2_WORKSPACES.find((item) => item.key === workspace)?.label ?? "Workspace";
  return {
    title: candidate ? `${candidate.name} ${label} | Recruiting V2 | BOF` : `${label} | Recruiting V2 | BOF`,
  };
}

export default async function RecruitingV2CandidateWorkspacePage({ params }: Props) {
  const { candidateId, workspace } = await params;
  if (!getRecruitingV2Candidate(candidateId) || !isRecruitingV2WorkspaceKey(workspace)) notFound();
  return <RecruitingV2App candidateId={candidateId} workspace={workspace} />;
}