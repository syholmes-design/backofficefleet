"use client";

import { demoRecruitingTransport, resetRecruitingDemo } from "@/lib/recruiting/demo-backend";
import { emptyInterviewResponses } from "@/lib/recruiting/structured-interview";
import type { RecruitingWorkspaceModel, WorkspaceCandidate } from "@/lib/recruiting/workspace-model";

/**
 * Start the public demonstration at a chosen stage. The earlier steps are not faked: they are
 * replayed through the same demonstration requests (and rules) a visitor's clicks would send, for
 * the fictional candidate Michael Anderson on the seeded requisition BOF-HR-DRV-001.
 */

export const DEMO_STAGES = ["screen", "interview", "offer", "onboarding", "activation"] as const;
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

const MICHAEL = {
  fullName: "Michael Anderson",
  email: "michael.anderson@demo-candidate.bof.example",
  phone: "(216) 555-0182",
  homeLocation: "Cleveland, OH",
  cdlClass: "A",
  cdlState: "OH",
  cdlNumber: "OH00008821",
  experienceYears: 4,
  endorsements: ["N"],
  equipmentExperience: "4 years 53' refrigerated and dry van, Freightliner Cascadia",
};

async function send(path: string, body: unknown, method = "POST") {
  const result = await demoRecruitingTransport(path, { method, body });
  if (!result.ok) throw new Error(result.data.error ?? `${method} ${path} failed (${result.status})`);
  return result;
}

async function michael(): Promise<WorkspaceCandidate> {
  const model = (await demoRecruitingTransport("/api/recruiting/workspace")).data as unknown as RecruitingWorkspaceModel;
  const candidate = model.candidates.find((c) => c.name === MICHAEL.fullName);
  if (!candidate) throw new Error("Michael Anderson is not attached");
  return candidate;
}

/** Resets the demonstration and advances Michael Anderson to the start of `stage`. Returns his workspace id. */
export async function stageRecruitingDemo(stage: DemoStage): Promise<string> {
  resetRecruitingDemo();
  const model = (await demoRecruitingTransport("/api/recruiting/workspace")).data as unknown as RecruitingWorkspaceModel;
  const position = model.positions.find((p) => p.requisition?.publicNumber === "BOF-HR-DRV-001") ?? model.positions[0];
  await send(`/api/recruiting/positions/${position.id}/candidates`, MICHAEL);
  let candidate = await michael();
  const code = encodeURIComponent(candidate.candidateCode);
  if (stage === "screen") return candidate.id;

  // Screening against the requisition, recruiter confirmations, and the qualification documents.
  await send(`/api/recruiting/candidates/${code}/screening`, { action: "screen" });
  candidate = await michael();
  for (const item of candidate.screening.results.filter((r) => r.status === "RECRUITER_CONFIRMATION")) {
    await send(`/api/recruiting/candidates/${code}/screening`, { action: "confirm", key: item.key });
  }
  for (const gate of candidate.documentGates.filter((g) => !g.latestDocument)) {
    await send(`/api/recruiting-v2/documents/${code}`, { documentType: gate.documentType, status: "RECEIVED", uploadedBy: "Recruiting & Onboarding workspace" });
  }
  candidate = await michael();
  for (const gate of candidate.documentGates.filter((g) => g.latestDocument && g.gateState !== "SATISFIED")) {
    await send(`/api/recruiting-v2/documents/${code}/${encodeURIComponent(gate.latestDocument!.documentCode)}`, { action: "VERIFY", verifiedBy: "BOF compliance review", verificationNotes: "Verified (demonstration)." }, "PATCH");
  }
  if (stage === "interview") return candidate.id;

  // Structured interview: proceed.
  const categories = emptyInterviewResponses().map((row) => ({ ...row, evaluation: "MEETS", responses: row.responses.map(() => "Fictional response recorded for the demonstration."), notes: "" }));
  await send(
    `/api/recruiting-v2/interviews/${code}`,
    { questionnaire: { categories, recommendation: "ADVANCE", conditions: "", decisionNotes: "Meets every requisition requirement; strong lane fit.", interviewer: "BOF recruiter (demo)" } },
    "PATCH",
  );
  if (stage === "offer") return candidate.id;

  // Offer prepared, sent and accepted.
  // Same defaults the offer panel fills in: the position's compensation from the requisition.
  const offer = { compensation: position.compensation, startDate: "2026-11-16", orientationDate: "2026-11-12" };
  await send(`/api/recruiting-v2/offer/${code}`, { offerStatus: "DRAFT", ...offer });
  await send(`/api/recruiting-v2/offer/${code}`, { offerStatus: "SENT", ...offer });
  await send(`/api/recruiting-v2/offer/${code}`, { offerStatus: "ACCEPTED" });
  if (stage === "onboarding") return candidate.id;

  // Onboarding: orientation, training, equipment, complete.
  await send(`/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "IN_PROGRESS", orientationDate: "2026-11-12", orientationLocation: "Cleveland terminal training room" });
  for (const key of ["training", "equipment-assignment"]) {
    candidate = await michael();
    const onboardingChecklist = candidate.onboardingItems.map((item) => ({ key: item.key, label: item.label, status: item.key === key ? "COMPLETE" : item.status, source: item.source, reason: item.reason }));
    await send(`/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "IN_PROGRESS", onboardingChecklist });
  }
  await send(`/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "COMPLETE" });
  return candidate.id;
}
