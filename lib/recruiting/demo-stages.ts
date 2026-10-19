"use client";

import { demoRecruitingTransport, resetRecruitingDemo, type DemoMichaelStage } from "@/lib/recruiting/demo-backend";
import type { RecruitingWorkspaceModel } from "@/lib/recruiting/workspace-model";

/**
 * Start the public demonstration with Michael Anderson (CAND-001) at a chosen stage. The demonstration
 * is reseeded (lib/recruiting/demo-backend.ts): his earlier steps are replayed through the same
 * demonstration requests and rules a recruiter's clicks send, and Sarah Mitchell (CAND-002) is seeded
 * in her original blocked state alongside him.
 */
export const DEMO_STAGES = ["screen", "interview", "offer", "onboarding", "activation"] as const satisfies readonly DemoMichaelStage[];
export type DemoStage = (typeof DEMO_STAGES)[number];

export function isDemoStage(value: string | null): value is DemoStage {
  return Boolean(value) && (DEMO_STAGES as readonly string[]).includes(value as string);
}

/** Where the workspace opens for each stage (its existing tab / workflow URL state). */
export const DEMO_STAGE_VIEW: Record<DemoStage, { tab: string; workflow: string; label: string }> = {
  screen: { tab: "candidate-detail", workflow: "qualification", label: "Screening" },
  interview: { tab: "candidate-detail", workflow: "interview", label: "Interview" },
  offer: { tab: "candidate-detail", workflow: "offer", label: "Offer" },
  onboarding: { tab: "onboarding", workflow: "onboarding", label: "Onboarding" },
  activation: { tab: "onboarding", workflow: "", label: "Driver activation" },
};

/** Reseeds the demonstration with Michael Anderson at the start of `stage`. Returns his workspace id. */
export async function stageRecruitingDemo(stage: DemoStage): Promise<string> {
  resetRecruitingDemo(stage);
  const model = (await demoRecruitingTransport("/api/recruiting/workspace")).data as unknown as RecruitingWorkspaceModel;
  const michael = model.candidates.find((c) => c.candidateCode === "CAND-001");
  if (!michael) throw new Error("Michael Anderson (CAND-001) is missing from the demonstration");
  return michael.id;
}
