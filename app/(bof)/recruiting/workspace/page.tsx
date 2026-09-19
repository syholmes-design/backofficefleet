/**
 * BOF Route Owner:
 * URL: /recruiting/workspace
 * Type: LIVE
 * Primary component: RecruitingPageClient
 */
import type { Metadata } from "next";
import { RecruitingPageClient } from "@/components/recruiting/RecruitingPageClient";

export const metadata: Metadata = {
  title: "Recruiting Workspace | BOF",
  description: "BOF workforce recruitment, job builder, candidate qualification, onboarding, and driver activation.",
};

export default function RecruitingWorkspacePage() {
  return <RecruitingPageClient />;
}
